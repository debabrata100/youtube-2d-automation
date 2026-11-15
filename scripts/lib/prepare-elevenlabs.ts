import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {storyScriptSchema,words,type StoryScript} from '../../src/storytelling/schema';
import {validateStory} from '../../src/storytelling/validate';
import {parseStoryboard} from '../../src/engine/storyboard/schema';
import {wrapPhrase} from '../../src/captions/timing';
import {inspectSpeechCache} from '../../src/audio/cache';
import {measureAudio} from '../../src/audio/metadata';
import {validateElevenLabs,elevenRequestHash,type ElevenConfig} from '../../src/audio/tts/elevenlabs';
export const continuousNarrationText=(story:StoryScript)=>story.beats.map(b=>b.narration).join(' ');
export const estimateNaturalDuration=(text:string)=>({words:words(text).length,characters:Array.from(text).length,secondsAt145WPM:words(text).length*60/145,secondsAt130WPMWithPauses:words(text).length*60/130+.9,basis:'Planning estimates only. Punctuation guides natural pauses; no SSML, guaranteed pause duration, or speed processing.'});
export const prepareElevenLabs=async(story:StoryScript,config:ElevenConfig,output?:string,validateRemote=false)=>{
 const job=path.resolve(output??`jobs/volcano-m2-3-2-${new Date().toISOString().replace(/[:.]/g,'-')}`);
 await mkdir(path.dirname(job),{recursive:true});await mkdir(job); // refuses reuse / overwrite
 const json=async(file:string,data:unknown)=>writeFile(path.join(job,file),JSON.stringify(data,null,2)+'\n');
 const storyboard=parseStoryboard(JSON.parse(await readFile(story.storyboard,'utf8')));
 const candidates=await Promise.all(['a','b','c'].map(async label=>{const s=validateStory(storyScriptSchema.parse(JSON.parse(await readFile(`stories/volcano-elevenlabs-${label}.json`,'utf8'))),storyboard);for(const b of s.beats)for(const phrase of b.phrases)wrapPhrase(phrase);return{label,script:s,estimate:estimateNaturalDuration(continuousNarrationText(s))};}));
 const text=continuousNarrationText(story),estimate=estimateNaturalDuration(text),request={text,config};
 await json('script-candidates.json',candidates);await json('selected-script.json',story);
 await json('voice-configuration.json',{...config,apiKeyConfigured:Boolean(process.env.ELEVENLABS_API_KEY?.trim()),soundEffectsEnabled:false});
 // Optional network boundary contains only GET metadata operations.
 let validation:Awaited<ReturnType<typeof validateElevenLabs>>|{valid:false;reason:string};
 try{validation=validateRemote?await validateElevenLabs(config):{valid:false,reason:'Remote validation not requested; use --validate-remote for metadata GETs only'};}catch{validation={valid:false,reason:'Metadata response/configuration validation failed; no synthesis attempted'};}
 await json('voice-validation.json',validation);
 const cache=await inspectSpeechCache(request,path.resolve('.cache/tts'));
 const audit=[];for(const file of await readdir('.cache/tts').catch(()=>[])){
  if(!/^[a-f0-9]{64}\.json$/.test(file))continue;
  try{const meta=JSON.parse(await readFile(path.join('.cache/tts',file),'utf8')),audio=path.join('.cache/tts',file.replace('.json','.wav')),bytes=await readFile(audio),measured=await measureAudio(audio);audit.push({key:meta.key,provider:meta.provider,valid:meta.key===file.slice(0,-5)&&meta.sha256===createHash('sha256').update(bytes).digest('hex'),measured});}catch{audit.push({key:file.slice(0,-5),valid:false});}
 }
 await json('cache-validation.json',{selectedRequest:cache,existingEntries:audit,paidRequests:0,regenerationOnMiss:false});
 const estimatedCredits=validation.valid&&'model' in validation&&validation.model?.token_cost_factor!==undefined?estimate.characters*validation.model.token_cost_factor:null;
 const plan={stage:'A',status:validation.valid?'awaiting-bounded-human-approval':'blocked-pending-voice-access-validation',selectedScript:story.id,text,...estimate,voiceId:config.voice,modelId:config.model,voiceSettings:config.voiceSettings,requestHash:elevenRequestHash(request),strategy:'one continuous take with provider character timestamps',plannedRequests:cache.status==='hit'?0:1,maximumProposedRequests:1,maximumProposedInputCharacters:estimate.characters,automaticPaidRetries:0,paidRequestsMade:0,estimatedCredits,actualUsage:null,actualCostUSD:null,billingNote:'Character/credit estimates are not exact billing or a dollar cap; voice-specific charges and account terms must be reviewed before approval.',soundEffectsEnabled:false,speechSpeed:1,postProcessingSpeed:1,endingRoomMinimumSeconds:.2,captionPolicy:'Provider timing first; validate exact word order and duration before caption generation. Explicit forced/local alignment review if unavailable. No fabricated timings.',sceneAlignmentPolicy:'Preserve 90-frame scene boundaries. Compare measured sentence starts with scenes before rendering; duration fit alone is insufficient. Retain natural pauses; no silent retiming or acceleration.',renderPolicy:'No rendering or synthesis in Stage A. Actual narration duration and voice quality remain unverified.',approvalRequired:true};
 await json('synthesis-plan.json',plan);
 console.log(JSON.stringify({job,status:plan.status,voiceId:config.voice,modelId:config.model,characters:estimate.characters,words:estimate.words,plannedRequests:plan.plannedRequests,paidRequestsMade:0,remoteMetadataValidation:validation.valid},null,2));
 return{job,plan,validation};
};
