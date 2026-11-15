import path from 'node:path';
import {prepareElevenLabs} from './lib/prepare-elevenlabs';
import {checkElevenLabsVoiceAccess} from '../src/audio/tts/elevenlabs';
import {parseArgs} from 'node:util';
import {copyFile,mkdir,readFile,readdir,rename,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia} from '@remotion/renderer';
import {storyScriptSchema,words} from '../src/storytelling/schema';
import {validateStory} from '../src/storytelling/validate';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {ttsConfigSchema} from '../src/audio/tts/provider';
import {MockTTSProvider} from '../src/audio/tts/mock';
import {OpenAITTSProvider,paidSpeechEstimate} from '../src/audio/tts/openai';
import {BudgetedTTSProvider,reserveEstimate} from '../src/audio/tts/budget';
import {cachedSpeech} from '../src/audio/cache';
import {measureAudio} from '../src/audio/metadata';
import {assembleNarration} from '../src/audio/assemble';
import {alignBeats} from '../src/storytelling/timing/align';
import {buildCaptions} from '../src/captions/timing';
import {captionStyleSchema,narrationOverlaySchema} from '../src/captions/schema';
import {browserExecutable,run} from './media-tools';
import {validateAssetFiles} from './storyboard-assets';
const main=async()=>{
 const action=process.argv[2];if(!['validate','preview','prepare','auth','render'].includes(action))throw Error('Usage: story.ts validate|preview|prepare|auth|render --script stories/<script>.json');
 const {values:o}=parseArgs({args:process.argv.slice(3),options:{'validate-remote':{type:'boolean',default:false},'dry-run':{type:'boolean',default:false},script:{type:'string',default:'stories/volcano.json'},tts:{type:'string',default:'mock'},voice:{type:'string'},model:{type:'string'},config:{type:'string',default:'config/narration.json'},'speaking-rate':{type:'string'},'force-tts':{type:'boolean',default:false},strict:{type:'boolean',default:true},'no-strict':{type:'boolean',default:false},'max-pause':{type:'string',default:'.35'},'timing-tolerance':{type:'string',default:'.02'},output:{type:'string'},'no-captions':{type:'boolean',default:false},'authorize-paid-tts':{type:'boolean',default:false},resume:{type:'boolean',default:false},'synthesize-only':{type:'boolean',default:false},'job-version':{type:'string',default:'m2-3'},'max-tts-requests':{type:'string',default:'5'},'max-estimated-usd':{type:'string',default:'.05'}}});
 if(!/^[a-z0-9-]+$/.test(o['job-version']!))throw Error('Invalid job version label');
 if(!['mock','openai','elevenlabs'].includes(o.tts!))throw Error('TTS provider must be mock, openai or elevenlabs');
 const storyInput=storyScriptSchema.parse(JSON.parse(await readFile(path.resolve(o.script!),'utf8')));
 const storyboard=parseStoryboard(JSON.parse(await readFile(path.resolve(storyInput.storyboard),'utf8'))),story=validateStory(storyInput,storyboard);
 const configs=JSON.parse(await readFile(o.config!,'utf8')),config=ttsConfigSchema.parse({...configs[o.tts!],...(o.tts==='elevenlabs'?{voice:process.env.ELEVENLABS_VOICE_ID?.trim()||configs.elevenlabs.voice,model:process.env.ELEVENLABS_MODEL_ID?.trim()||configs.elevenlabs.model}:{}),...(o.voice?{voice:o.voice}:{}),...(o.model?{model:o.model}:{}),...(o['speaking-rate']?{speakingRate:Number(o['speaking-rate'])}:{})});
 if(config.provider!==o.tts||config.language!==story.language)throw Error('Selected provider/language does not match configuration');
 if(action==='auth'){if(config.provider!=='elevenlabs')throw Error('Auth check requires --tts elevenlabs');const result=await checkElevenLabsVoiceAccess(config.voice);console.log(JSON.stringify(result,null,2));if(!result.verified)process.exitCode=2;return;}
 const maxPause=Number(o['max-pause']),tolerance=Number(o['timing-tolerance']);if(!Number.isFinite(maxPause)||maxPause<0||maxPause>2||!Number.isFinite(tolerance)||tolerance<0||tolerance>.1)throw Error('Invalid timing tolerance or intentional pause limit');
 await validateAssetFiles(storyboard.assets);
 const estimate={script:story.id,wordCount:story.beats.reduce((a,b)=>a+words(b.narration).length,0),estimatedSecondsAt145WPM:story.beats.reduce((a,b)=>a+words(b.narration).length,0)*60/145,timingBasis:'planning estimate only; actual speech ungenerated',beats:story.beats.map(b=>({id:b.id,narration:b.narration,estimatedSeconds:words(b.narration).length*60/145})),provider:config.provider,model:config.model,voice:config.voice};
 if(config.provider==='elevenlabs'&&(action==='prepare'||o['dry-run'])){await prepareElevenLabs(story,config,o.output,o['validate-remote']);return;}
 if(action==='prepare')throw Error('Preparation currently supports --tts elevenlabs; no request was made');
 if(config.provider==='elevenlabs'&&action==='render')throw Error('Stage A authorization checkpoint: paid ElevenLabs rendering is disabled in this milestone until separate bounded human approval. Use story:prepare -- --tts elevenlabs --script stories/volcano-elevenlabs-a.json --validate-remote');
 if(config.provider==='elevenlabs'){console.log(JSON.stringify({valid:true,...estimate,note:'Local validation only; remote voice validation requires story:prepare --validate-remote'}));return;}
 if(action!=='render'){console.log(JSON.stringify({valid:true,...estimate},null,2));return;}
 if(config.provider==='openai'){
  console.log(JSON.stringify({intendedModel:config.model,voice:config.voice,requestsAtMost:story.beats.length,estimate:paidSpeechEstimate,configuration:'OPENAI_API_KEY; explicit --authorize-paid-tts only after human authorization'},null,2));
  if(!process.env.OPENAI_API_KEY?.trim())throw Error('OPENAI_API_KEY is not configured; no API request was made. Mock mode remains available.');
  if(!o['authorize-paid-tts'])throw Error('Authorization checkpoint: the brief requires explicit approval before the first paid TTS request. No API request was made.');
 }
 const job=path.resolve(o.output??`jobs/${story.id}-${o['job-version']}-${new Date().toISOString().replace(/[:.]/g,'-')}`);
 try{if((await readdir(job)).length&&!o.resume)throw Error(`Output directory is not empty: ${job}`);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 for(const dir of ['output','audio','story','captions','reports','previews','public'])await mkdir(path.join(job,dir),{recursive:true});
 const json=async(file:string,data:unknown)=>writeFile(path.join(job,file),JSON.stringify(data,null,2)+'\n');
 await json('story/selected-script.json',story);await json('storyboard.json',storyboard);if(story.candidatesReport)await copyFile(path.resolve(story.candidatesReport),path.join(job,'story/script-candidates.md'));else await writeFile(path.join(job,'story/script-candidates.md'),'No candidate-comparison report was supplied for this story.');
 const maxRequests=Number(o['max-tts-requests']),maxEstimatedUSD=Number(o['max-estimated-usd']);if(!Number.isInteger(maxRequests)||maxRequests<1||maxRequests>5||!Number.isFinite(maxEstimatedUSD)||maxEstimatedUSD<=0||maxEstimatedUSD>.05)throw Error('This authorization permits at most 5 requests and USD 0.05 estimated spend');
 if(config.provider==='openai')console.log(JSON.stringify({maximumRequests:maxRequests,maximumEstimatedUSD:maxEstimatedUSD,conservativeAllMissesEstimateUSD:story.beats.reduce((sum,b)=>sum+reserveEstimate({text:b.narration,config}).estimatedUSD,0),note:'Conservative reservation, not actual billing or a provider-enforced cap'}));
 const provider=config.provider==='mock'?new MockTTSProvider():new BudgetedTTSProvider(new OpenAITTSProvider({authorized:true}),path.join(job,'reports/tts-usage-report.json'),{maxRequests,maxEstimatedUSD,model:config.model,voice:config.voice});
 const clips=[];
 for(const beat of story.beats){const clip=await cachedSpeech(provider,{text:beat.narration,config},path.resolve('.cache/tts'),o['force-tts']);const file=path.join(job,'audio',beat.id+'.wav');await copyFile(clip.audioPath,file);clips.push({...clip,beatId:beat.id,file});}
 await json('audio/narration-metadata.json',{provider:config.provider,model:config.model,voice:config.voice,clips,cacheHits:clips.filter(c=>c.cacheHit).length,cacheMisses:clips.filter(c=>!c.cacheHit).length});
 if(o['synthesize-only']){console.log(JSON.stringify({job,audioPrepared:true,clips:clips.map(c=>({beatId:c.beatId,durationSeconds:c.measured.durationSeconds,cacheHit:c.cacheHit}))},null,2));return;}
 let plan;
 try{plan=alignBeats(story,storyboard,clips.map(c=>c.measured.durationSeconds),{strict:o.strict&&!o['no-strict'],maxIntentionalPauseSeconds:maxPause,toleranceSeconds:tolerance});}catch(error){await json('reports/timing-report.json',{status:'failed',error:(error as Error).message,clips});throw error;}
 await json('story/timing-plan.json',plan);await json('reports/timing-report.json',{status:'passed',...plan,phraseTiming:'estimated by authored phrase word counts inside measured beat files; no word timestamps'});
 const audio=path.join(job,'audio/narration.wav');await assembleNarration(clips.map(c=>c.file),plan,audio);const assembled=await measureAudio(audio);
 const style=captionStyleSchema.parse({}),cues=o['no-captions']?[]:buildCaptions(story,plan,style.maxCharactersPerLine);
 const narration=narrationOverlaySchema.parse({audioSrc:'narration/narration.wav',captionsEnabled:!o['no-captions'],syntheticTestAudio:config.provider==='mock',showAiDisclosureBanner:config.provider==='mock',cues,style});
 await json('captions/captions.json',narration);await json('narration-props.json',narration);
 const report={provider:config.provider,model:config.model,voice:config.voice,synthesisStrategy:'per-beat',speakingRate:config.speakingRate,syntheticTestAudio:config.provider==='mock',mockDisclosure:config.provider==='mock'?'Deterministic test tones, not spoken words or production-quality voice.':null,sourceAudioDurationSeconds:clips.reduce((a,c)=>a+c.measured.durationSeconds,0),assembledDurationSeconds:assembled.durationSeconds,plannedHoldSeconds:plan.beats.reduce((a,b)=>a+b.intentionalHoldSeconds,0),clips,cacheHits:clips.filter(c=>c.cacheHit).length,synthesisCalls:clips.filter(c=>!c.cacheHit).length,externalAPIRequests:config.provider==='mock'?0:clips.filter(c=>!c.cacheHit).length,actualAPIUsage:null,actualCostUSD:config.provider==='mock'?0:null,costNote:config.provider==='mock'?'No external API called.':'Binary speech responses supply no token usage here; actual bill not measured.',realProviderEndToEndTested:config.provider==='openai',humanApproval:'pending'};
 await json('reports/narration-report.json',report);
 if(config.provider==='openai')await run('ffmpeg',['-v','error','-y','-i',audio,'-c:a','libmp3lame','-b:a','128k',path.join(job,'audio/narration.mp3')]);
 const publicDir=path.join(job,'public');for(const a of storyboard.assets){const dest=path.join(publicDir,a.path);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.resolve('assets',a.path),dest);}await mkdir(path.join(publicDir,'narration'),{recursive:true});await copyFile(audio,path.join(publicDir,narration.audioSrc));
 const serveUrl=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir});const inputProps={storyboard,narration};const composition=(await getCompositions(serveUrl,{inputProps,browserExecutable})).find(c=>c.id==='GenericStoryboard')!;
 const start=performance.now();await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:path.join(job,'output/narrated-animation.mp4'),codec:'h264',audioCodec:'aac',audioBitrate:'128k',pixelFormat:'yuv420p',crf:18,concurrency:1,disallowParallelEncoding:true});
 // Re-encode only audio from the exact-duration PCM master. Remotion's cached
 // AAC merge can otherwise report an extra partial AAC packet in the MP4.
 const finalMux=path.join(job,'output/narrated-final.mp4');
 await run('ffmpeg',['-v','error','-y','-i',path.join(job,'output/narrated-animation.mp4'),'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-ar','48000','-t',String(story.durationSeconds),'-movflags','+faststart',finalMux]);
 await rename(finalMux,path.join(job,'output/narrated-animation.mp4'));
 await json('reports/render-report.json',{elapsedSeconds:Number(((performance.now()-start)/1000).toFixed(2)),timingScope:'450-frame render plus H.264/AAC encoding; excludes synthesis, bundle and verification',humanApproval:'pending'});
 await run(process.execPath,['--import','tsx','scripts/verify-storyboard.ts',job,'narrated-animation.mp4']);
 await run(process.execPath,['--import','tsx','scripts/verify-story.ts',job]);
 console.log(JSON.stringify({job,video:path.join(job,'output/narrated-animation.mp4'),mock:config.provider==='mock',...estimate},null,2));
};
main().catch(error=>{console.error(error instanceof Error?error.message:'Story pipeline failed');process.exitCode=1;});
