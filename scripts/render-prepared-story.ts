/** Offline renderer: imports no TTS provider, reads no API key, makes no speech requests. */
import path from 'node:path';
import {createHash} from 'node:crypto';
import {copyFile,mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia} from '@remotion/renderer';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {validateStory} from '../src/storytelling/validate';
import {alignContinuousBeats} from '../src/storytelling/timing/align';
import {measureAudio} from '../src/audio/metadata';
import {assembleNarration} from '../src/audio/assemble';
import {buildCaptions,applyLocalPhraseEstimates} from '../src/captions/timing';
import {captionStyleSchema,narrationOverlaySchema} from '../src/captions/schema';
import {browserExecutable,run} from './media-tools';
const job=path.resolve(process.argv[2]);
if(!process.argv[2])throw Error('Usage: render-prepared-story <existing-job>');
const read=async(file:string)=>JSON.parse(await readFile(path.join(job,file),'utf8'));
const json=async(file:string,data:unknown)=>writeFile(path.join(job,file),JSON.stringify(data,null,2)+'\n');
const board=parseStoryboard(await read('storyboard.json')),story=validateStory(await read('story/selected-script.json'),board),editorial=await read('reports/audio-edit-plan.json'),recognition=await read('reports/local-asr-edited.json'),ledger=await read('reports/tts-usage-report.json');
if(!editorial.originalScriptUnchanged||editorial.tempo<1||editorial.tempo>1.1)throw Error('Prepared editorial plan exceeds the documented rate limits');
if(ledger.requestCount>5||ledger.estimatedReservedUSD>.05)throw Error('Existing paid usage exceeds authorization; offline render stopped');
let generation;try{generation=await read('audio/generation-metadata.json');}catch{generation=await read('audio/narration-metadata.json');await json('audio/generation-metadata.json',generation);}
const clips=[];
for(const beat of story.beats){const edit=editorial.edits.find((e:any)=>e.beatId===beat.id),source=generation.clips.find((c:any)=>c.beatId===beat.id);if(!edit||!source)throw Error('Missing prepared beat');const bytes=await readFile(path.join(job,`audio/${beat.id}.wav`));if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)throw Error('Raw paid response changed');const measured=await measureAudio(edit.outputPath);clips.push({...source,beatId:beat.id,file:edit.outputPath,cachedSourceMeasurement:source.measured,measured,cacheHit:true,playbackSha256:createHash('sha256').update(await readFile(edit.outputPath)).digest('hex')});}
const plan=alignContinuousBeats(story,board,clips.map(c=>c.measured.durationSeconds),8);await json('story/timing-plan.json',plan);await json('reports/timing-report.json',{status:'passed',...plan,editorialTempo:editorial.tempo,captionTiming:'offline ASR phrase estimates, not exact word timestamps'});
const audio=path.join(job,'audio/narration.wav');await assembleNarration(clips.map(c=>c.file),plan,audio);await run('ffmpeg',['-v','error','-y','-i',audio,'-c:a','libmp3lame','-b:a','128k',path.join(job,'audio/narration.mp3')]);
const concat=path.join(job,'audio/unsped-concat.txt');await writeFile(concat,editorial.edits.map((e:any)=>`file '${e.cleanPath}'`).join('\n'));await run('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',concat,'-c:a','pcm_s16le',path.join(job,'audio/narration-unsped.wav')]);
const style=captionStyleSchema.parse({}),cues=applyLocalPhraseEstimates(story,plan,buildCaptions(story,plan,style.maxCharactersPerLine),recognition);
const narration=narrationOverlaySchema.parse({audioSrc:'narration/narration.wav',captionsEnabled:true,syntheticTestAudio:false,cues,style});await mkdir(path.join(job,'captions'),{recursive:true});await json('captions/captions.json',narration);await json('narration-props.json',narration);
const measured=await measureAudio(audio),report={provider:'openai',model:ledger.policy.model,voice:ledger.policy.voice,synthesisStrategy:'per-beat; offline editorial assembly',syntheticTestAudio:false,mockDisclosure:null,sourceAudioDurationSeconds:clips.reduce((s,c)=>s+c.measured.durationSeconds,0),rawGeneratedDurationSeconds:editorial.edits.reduce((s:number,e:any)=>s+e.rawDurationSeconds,0),assembledDurationSeconds:measured.durationSeconds,plannedHoldSeconds:plan.beats.reduce((s,b)=>s+b.intentionalHoldSeconds,0),clips,cacheHits:5,cacheNote:'Five previously cached paid responses reused as local derivatives; zero synthesis in this offline pass.',cacheMissesDuringGeneration:5,synthesisCalls:0,externalAPIRequests:0,totalJobPaidRequests:ledger.requestCount,estimatedReservedUSD:ledger.estimatedReservedUSD,actualAPIUsage:null,actualCostUSD:null,costNote:'Conservative reservation only; binary speech responses supplied no token usage. Actual billing is unavailable.',realProviderEndToEndTested:true,localEditorialProcessing:{tempo:editorial.tempo,cleanDurationSeconds:editorial.cleanTotalSeconds},humanApproval:'pending'};await json('reports/narration-report.json',report);await json('audio/narration-metadata.json',report);
const publicDir=path.join(job,'public');for(const a of board.assets){const dest=path.join(publicDir,a.path);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.resolve('assets',a.path),dest);}await mkdir(path.join(publicDir,'narration'),{recursive:true});await copyFile(audio,path.join(publicDir,narration.audioSrc));await mkdir(path.join(job,'output'),{recursive:true});
console.log('Offline prepared-media render: zero TTS calls.');
const serveUrl=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir}),inputProps={storyboard:board,narration};const composition=(await getCompositions(serveUrl,{inputProps,browserExecutable})).find(c=>c.id==='GenericStoryboard')!;
const output=path.join(job,'output/narrated-animation.mp4'),start=performance.now();await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',crf:18,concurrency:1,disallowParallelEncoding:true});
const mux=path.join(job,'output/narrated-final.mp4');await run('ffmpeg',['-v','error','-y','-i',output,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-ar','48000','-t','15','-movflags','+faststart',mux]);await rename(mux,output);
await json('reports/render-report.json',{elapsedSeconds:Number(((performance.now()-start)/1000).toFixed(2)),timingScope:'render plus H.264/AAC encoding and mux; excludes paid synthesis and local ASR',offline:true,paidRequestsThisRender:0,humanApproval:'pending'});
await run(process.execPath,['--import','tsx','scripts/verify-storyboard.ts',job,'narrated-animation.mp4']);await run(process.execPath,['--import','tsx','scripts/verify-story.ts',job]);console.log(JSON.stringify({job,output,paidRequestsThisRender:0}));
