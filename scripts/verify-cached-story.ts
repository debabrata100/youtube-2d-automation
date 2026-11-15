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
import {capture,run} from './media-tools';
const job=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: verify-cached-story <job>');
const read=async(file:string)=>JSON.parse(await readFile(path.join(job,file),'utf8'));
const video=path.join(job,'output/narrated-animation.mp4'),source=path.join(job,'audio/narration.wav'),metadata=await read('audio/narration-metadata.json'),story=storyScriptSchema.parse(await read('story/selected-script.json')),captions=narrationOverlaySchema.parse(await read('captions/captions.json'));
const info=JSON.parse(await capture('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video])),v=info.streams.find((s:any)=>s.codec_type==='video'),a=info.streams.find((s:any)=>s.codec_type==='audio'),measured=await measureAudio(source),expected=captionsFromProviderTiming(story,metadata.alignment,measured.durationSeconds,30);
const decode=(file:string)=>execFileSync('ffmpeg',['-v','error','-i',file,'-vn','-ac','1','-ar','24000','-f','s16le','pipe:1'],{maxBuffer:4*1024*1024});
const original=decode(source),encoded=decode(video);let cross=0,sourcePower=0,encodedPower=0,errorPower=0;
for(let i=0;i<original.length;i+=2){const x=original.readInt16LE(i),y=encoded.readInt16LE(i);cross+=x*y;sourcePower+=x*x;encodedPower+=y*y;errorPower+=(x-y)**2;}
const correlation=cross/Math.sqrt(sourcePower*encodedPower),snr=10*Math.log10(sourcePower/errorPower);
let tailPower=0,tailCount=0;for(let i=original.length+2400;i+1<Math.min(encoded.length,15*24000*2);i+=2){tailPower+=encoded.readInt16LE(i)**2;tailCount++;}
const tailRMS=tailCount?Math.sqrt(tailPower/tailCount):Infinity;
const timingMatches=JSON.stringify(expected.cues)===JSON.stringify(captions.cues),wordBounds=expected.wordTimings.every(w=>w.startSeconds>=0&&w.endSeconds<=measured.durationSeconds&&w.endSeconds>=w.startSeconds);
const wordCoverage=expected.wordTimings.every(w=>Boolean(captionAt(captions.cues,Math.ceil(w.startSeconds*30))));
const generic=await read('verification-report.json');
const checks={...generic.checks,exactContainerDuration:Math.abs(Number(info.format.duration)-15)<.001,exactVideoFrames:Number(v.nb_frames)===450,embeddedAAC:a?.codec_name==='aac',audioDuration:Math.abs(Number(a.duration)-15)<.001,approvedSourceHash:createHash('sha256').update(await readFile(source)).digest('hex')===metadata.sha256,approvedOriginalStillUnchanged:createHash('sha256').update(await readFile(metadata.sourceAudio)).digest('hex')===metadata.sha256,encodedNarrationMatchesApprovedPerformance:correlation>.97&&snr>15,quietIntentionalEnding:tailRMS<104,providerCaptionMapping:timingMatches,allWordsCovered:wordCoverage,providerWordBounds:wordBounds,captionBounds:captions.cues.every(c=>c.startFrame>=0&&c.endFrame<=450),mobileSafeLayout:captions.style.top>=.08&&captions.style.right>=.14&&captions.cues.every(c=>c.lines.length<=2&&c.lines.every(l=>l.length<=captions.style.maxCharactersPerLine))};
const report={video,checks,allChecksPassed:Object.values(checks).every(Boolean),audio:{sourceDurationSeconds:measured.durationSeconds,encodedDurationSeconds:Number(a.duration),sourceCodec:measured.codec,encodedCodec:a.codec_name,sampleRate:a.sample_rate,channels:a.channels,pcmCorrelation:correlation,signalToDifferenceDB:snr,tailRMSDBFS:20*Math.log10(Math.max(tailRMS,1e-9)/32768),speedAdjustment:1,intentionalEndingSeconds:15-measured.durationSeconds},captionTiming:{method:'Provider character timings → 28 words → authored phrases; start/end rounded upward to 30 FPS',words:expected.wordTimings.length,cues:captions.cues.length,maximumRoundingSeconds:1/30,humanSynchronizationReview:'pending'},paidRequests:0,paidAlignmentRequests:0,soundEffectsRequests:0,artworkRegenerated:false,humanVisualReview:'pending',note:'AAC is lossy; numerical PCM similarity tests preservation of the approved performance, not byte identity. Scene labels on contact sheets are expected metadata, not image recognition.'};
await writeFile(path.join(job,'reports/verification-report.json'),JSON.stringify(report,null,2)+'\n');
const board=await read('storyboard.json');let cursor=0;const slots=board.scenes.map((s:any)=>{const slot={id:s.id,start:cursor/30,end:(cursor+s.durationFrames)/30};cursor+=s.durationFrames;return slot;});
for(const preview of story.previews??[]){const first=story.beats.find(b=>b.id===preview.fromBeat)!,last=story.beats.find(b=>b.id===preview.toBeat)!,start=slots.find((s:any)=>s.id===first.sceneId).start,end=slots.find((s:any)=>s.id===last.sceneId).end;await run('ffmpeg',['-v','error','-y','-ss',String(start),'-i',video,'-t',String(end-start),'-vf','scale=540:-2','-c:v','libx264','-crf','20','-c:a','aac',path.join(job,`previews/${preview.id}.mp4`)]);}
console.log(JSON.stringify({job,...report},null,2));if(!report.allChecksPassed)process.exitCode=1;
