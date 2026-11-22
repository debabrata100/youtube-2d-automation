/** Verifies actual encoded media against unchanged approved PCM and provider timing. */
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {narrationOverlaySchema} from '../src/captions/schema';
import {captionAt} from '../src/captions/timing';
import {storyScriptSchema} from '../src/storytelling/schema';
import {measureAudio} from '../src/audio/metadata';
import {scheduleNarratedScenes} from '../src/storytelling/timing/scene-scheduler';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {holdShortNotes} from '../src/engine/storyboard/readability';
import {capture,run} from './media-tools';
import {existsSync} from 'node:fs';
import {measureLoudness, voiceFilter} from './lib/mix-audio';
const job=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: verify-cached-story <job>');
const read=async(file:string)=>JSON.parse(await readFile(path.join(job,file),'utf8'));
const video=path.join(job,'output/narrated-animation.mp4'),source=path.join(job,'audio/narration.wav'),metadata=await read('audio/narration-metadata.json'),story=storyScriptSchema.parse(await read('story/selected-script.json')),captions=narrationOverlaySchema.parse(await read('captions/captions.json'));
// Timeline length and frame rate come from the rendered storyboard (no episode-specific constants).
const renderedBoard=parseStoryboard(await read('storyboard.json')),FPS=renderedBoard.format.fps,FRAMES=renderedBoard.scenes.reduce((n,sc)=>n+sc.durationFrames,0),SECONDS=FRAMES/FPS;
const info=JSON.parse(await capture('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video])),v=info.streams.find((s:any)=>s.codec_type==='video'),a=info.streams.find((s:any)=>s.codec_type==='audio'),measured=await measureAudio(source),expected=captionsFromProviderTiming(story,metadata.alignment,measured.durationSeconds,FPS);
const mixPlanned=existsSync(path.join(job,'audio/mix-report.json'))?(await read('audio/mix-report.json')).planned:null,voiceAf=mixPlanned?.voice?voiceFilter(mixPlanned.voice):'';
const decode=(file:string,af='')=>execFileSync('ffmpeg',['-v','error','-i',file,'-vn',...(af?['-af',af]:[]),'-ac','1','-ar','24000','-f','s16le','pipe:1'],{maxBuffer:256*1024*1024}); // about 90 min of 24 kHz mono; long episodes overflowed the old 4 MB buffer
const original=decode(source,voiceAf),encoded=decode(video);let cross=0,sourcePower=0,encodedPower=0,errorPower=0;
for(let i=0;i<original.length;i+=2){const x=original.readInt16LE(i),y=encoded.readInt16LE(i);cross+=x*y;sourcePower+=x*x;encodedPower+=y*y;errorPower+=(x-y)**2;}
const correlation=cross/Math.sqrt(sourcePower*encodedPower),snr=10*Math.log10(sourcePower/errorPower);
let tailPower=0,tailCount=0;for(let i=original.length+2400;i+1<Math.min(encoded.length,SECONDS*24000*2);i+=2){tailPower+=encoded.readInt16LE(i)**2;tailCount++;}
const tailRMS=tailCount?Math.sqrt(tailPower/tailCount):Infinity;
// Mixed mode: narration shares the track with ducked music and effects, so correlation is lower and the ending carries the music fade.
const mix=existsSync(path.join(job,'audio/mix-report.json'))?await read('audio/mix-report.json'):null,loudness=mix?await measureLoudness(video):null;
let endPower=0,endCount=0;for(let i=Math.max(0,encoded.length-Math.round(.15*24000)*2);i+1<encoded.length;i+=2){endPower+=encoded.readInt16LE(i)**2;endCount++;}
const endRMS=endCount?Math.sqrt(endPower/endCount):Infinity;
// Narration clarity in the mix: per-phrase correlation in the speech band (200 Hz-4 kHz), where masking matters for intelligibility.
const band=(file:string)=>execFileSync('ffmpeg',['-v','error','-i',file,'-vn','-af',(file===source&&voiceAf?voiceAf+',':'')+'highpass=f=200,lowpass=f=4000','-ac','1','-ar','24000','-f','s16le','pipe:1'],{maxBuffer:256*1024*1024}); // about 90 min of 24 kHz mono; long episodes overflowed the old 4 MB buffer
// Full-band narration correlation restricted to speech: effects and music between or after phrases are intentional.
const speechCorrelation=mix?(()=>{let c=0,px=0,py=0;for(const p of expected.phraseTimings)for(let i=Math.floor(p.startSeconds*24000)*2;i+1<Math.min(original.length,encoded.length,Math.ceil(p.endSeconds*24000)*2);i+=2){const u=original.readInt16LE(i),w=encoded.readInt16LE(i);c+=u*w;px+=u*u;py+=w*w;}return c/Math.sqrt(px*py);})():null;
const phraseClarity=mix?(()=>{const x=band(source),y=band(video);return expected.phraseTimings.map(p=>{let c=0,px=0,py=0;for(let i=Math.floor(p.startSeconds*24000)*2;i+1<Math.min(x.length,Math.ceil(p.endSeconds*24000)*2);i+=2){const u=x.readInt16LE(i),w=y.readInt16LE(i);c+=u*w;px+=u*u;py+=w*w;}return {beatId:p.beatId,correlation:+(c/Math.sqrt(px*py)).toFixed(4)};});})():null;
// Jobs rendered before per-word timings (M2.7) store cues without `words`; compare like with like.
const storedHasWords=captions.cues.some(c=>c.words),timingMatches=JSON.stringify(storedHasWords?expected.cues:expected.cues.map(({words:_w,...cue})=>cue))===JSON.stringify(captions.cues),wordBounds=expected.wordTimings.every(w=>w.startSeconds>=0&&w.endSeconds<=measured.durationSeconds&&w.endSeconds>=w.startSeconds);
const wordCoverage=expected.wordTimings.every(w=>Boolean(captionAt(captions.cues,Math.ceil(w.startSeconds*FPS))));
const generic=await read('verification-report.json');
const frameInfo=JSON.parse(await capture('ffprobe',['-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',video]));
let sceneSchedule:ReturnType<typeof scheduleNarratedScenes>|undefined;try{sceneSchedule=scheduleNarratedScenes(parseStoryboard(await read('source-storyboard.json')),expected.phraseTimings);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
// Prepare brings late notes in earlier after scheduling (readability pass), so apply the same step before comparing.
if(sceneSchedule?.enabled)holdShortNotes(sceneSchedule.storyboard as never,sceneSchedule.storyboard.format.fps);
const planned=sceneSchedule?.enabled?JSON.stringify(sceneSchedule.storyboard)===JSON.stringify(parseStoryboard(await read('storyboard.json'))):true;
const checks={...generic.checks,decodedPresentationTimeline:frameInfo.frames.length===FRAMES&&frameInfo.frames.every((f:any,i:number)=>Math.abs(Number(f.best_effort_timestamp_time)-i/FPS)<.00001),productionBannerDisabled:!captions.showAiDisclosureBanner,sceneScheduleMatchesProvider:planned,sceneTransitionsWithinTarget:!sceneSchedule?.enabled||sceneSchedule.exceptions.length===0,exactContainerDuration:Math.abs(Number(info.format.duration)-SECONDS)<.001,exactVideoFrames:Number(v.nb_frames)===FRAMES,embeddedAAC:a?.codec_name==='aac',audioDuration:Math.abs(Number(a.duration)-SECONDS)<.001,approvedSourceHash:createHash('sha256').update(await readFile(source)).digest('hex')===metadata.sha256,approvedOriginalStillUnchanged:createHash('sha256').update(await readFile(metadata.sourceAudio)).digest('hex')===metadata.sha256,encodedNarrationMatchesApprovedPerformance:mix?speechCorrelation!>.9:correlation>.97&&snr>15,quietIntentionalEnding:mix?endRMS<330:tailRMS<104,...(mix?{loudnessOnTarget:Math.abs(loudness!.integratedLufs-mix.planned.targetLufs)<=1,truePeakSafe:loudness!.truePeakDb<=-1,musicDuckedUnderSpeech:!mix.ducking||mix.ducking.reductionDb>=6,narrationClearInMix:phraseClarity!.every(p=>p.correlation>=.95),soundCuesInsideTimeline:mix.planned.sfx.every((s:any)=>s.startSeconds>=0&&s.startSeconds<SECONDS)}:{}),providerCaptionMapping:timingMatches,allWordsCovered:wordCoverage,providerWordBounds:wordBounds,captionBounds:captions.cues.every(c=>c.startFrame>=0&&c.endFrame<=FRAMES),mobileSafeLayout:captions.style.top>=.08&&captions.style.right>=.14&&captions.cues.every(c=>c.lines.length<=2&&c.lines.every(l=>l.length<=captions.style.maxCharactersPerLine))};
const report={video,checks,sceneScheduling:sceneSchedule?{enabled:sceneSchedule.enabled,maximumDeviationSeconds:sceneSchedule.maximumDeviationSeconds,averageDeviationSeconds:sceneSchedule.averageDeviationSeconds,exceptions:sceneSchedule.exceptions}:null,allChecksPassed:Object.values(checks).every(Boolean),mix:mix?{speechCorrelation,phraseClarity,loudness,ducking:mix.ducking,soundCues:mix.planned.sfx.length,music:mix.planned.music.kind,endingRMSDBFS:20*Math.log10(Math.max(endRMS,1e-9)/32768)}:null,audio:{sourceDurationSeconds:measured.durationSeconds,encodedDurationSeconds:Number(a.duration),sourceCodec:measured.codec,encodedCodec:a.codec_name,sampleRate:a.sample_rate,channels:a.channels,pcmCorrelation:correlation,signalToDifferenceDB:snr,tailRMSDBFS:20*Math.log10(Math.max(tailRMS,1e-9)/32768),speedAdjustment:1,intentionalEndingSeconds:SECONDS-measured.durationSeconds},captionTiming:{method:'Provider character timings → 28 words → authored phrases; start/end rounded upward to the video frame rate',words:expected.wordTimings.length,cues:captions.cues.length,maximumRoundingSeconds:1/FPS,humanSynchronizationReview:'pending'},paidRequests:0,paidAlignmentRequests:0,soundEffectsRequests:0,artworkRegenerated:false,humanVisualReview:'pending',note:'AAC is lossy; numerical PCM similarity tests preservation of the approved performance, not byte identity. Scene labels on contact sheets are expected metadata, not image recognition.'};
await writeFile(path.join(job,'reports/verification-report.json'),JSON.stringify(report,null,2)+'\n');
const board=await read('storyboard.json');let cursor=0;const slots=board.scenes.map((s:any)=>{const slot={id:s.id,start:cursor/FPS,end:(cursor+s.durationFrames)/FPS};cursor+=s.durationFrames;return slot;});
for(const preview of story.previews??[]){const first=story.beats.find(b=>b.id===preview.fromBeat)!,last=story.beats.find(b=>b.id===preview.toBeat)!,start=slots.find((s:any)=>s.id===first.sceneId).start,end=slots.find((s:any)=>s.id===last.sceneId).end;await run('ffmpeg',['-v','error','-y','-ss',String(start),'-i',video,'-t',String(end-start),'-vf','scale=540:-2','-c:v','libx264','-crf','20','-c:a','aac',path.join(job,`previews/${preview.id}.mp4`)]);}
console.log(JSON.stringify({job,...report},null,2));if(!report.allChecksPassed)process.exitCode=1;
