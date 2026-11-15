import path from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {capture,run} from './media-tools';
import {narrationOverlaySchema} from '../src/captions/schema';
import {measureAudio} from '../src/audio/metadata';
const job=path.resolve(process.argv[2]);const video=path.join(job,'output/narrated-animation.mp4');
const info=JSON.parse(await capture('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video]));const stream=info.streams.find((s:any)=>s.codec_type==='video'),audio=info.streams.find((s:any)=>s.codec_type==='audio');
const story=JSON.parse(await readFile(path.join(job,'story/selected-script.json'),'utf8'));
const source=JSON.parse(await readFile(path.join(job,'reports/narration-report.json'),'utf8')),plan=JSON.parse(await readFile(path.join(job,'story/timing-plan.json'),'utf8')),captions=narrationOverlaySchema.parse(JSON.parse(await readFile(path.join(job,'captions/captions.json'),'utf8')));
const scan=await capture('ffmpeg',['-hide_banner','-i',video,'-vn','-af','silencedetect=noise=-45dB:d=0.03','-f','null','-']);
const silentIntervals=[...scan.matchAll(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/g)].map(m=>({end:Number(m[1]),duration:Number(m[2]),start:Number(m[1])-Number(m[2])}));
const planned=plan.beats.map((b:any)=>({start:b.audioEndSeconds,end:b.endFrame/plan.fps}));
const unexpectedGaps=silentIntervals.filter(g=>g.duration>(plan.maxIntentionalPauseSeconds??.35)+.02&&!planned.some((p:any)=>Math.abs(g.start-p.start)<.04&&Math.abs(g.end-p.end)<.04));
const duration=plan.totalFrames/plan.fps;
const measured=await measureAudio(video),last=plan.beats.at(-1),tail=silentIntervals.find(g=>g.end>=duration-.02),leading=silentIntervals.find(g=>g.start<.005);
const generic=JSON.parse(await readFile(path.join(job,'verification-report.json'),'utf8'));
const checks={...generic.checks,configuredFrameCount:Number(stream.nb_frames)===plan.totalFrames,configuredVideoTimeline:Math.abs(Number(stream.duration)-duration)<1/30,embeddedAAC:audio?.codec_name==='aac',configuredContainerTimeline:Math.abs(Number(info.format.duration)-duration)<.001,audioTimelineFits:Math.abs(measured.durationSeconds-duration)<.001,sourceAudioUntruncated:plan.beats.every((b:any)=>b.audioEndSeconds<=b.endFrame/plan.fps+1e-7)&&Math.abs(source.assembledDurationSeconds-duration)<.001,noSpeechOverlap:plan.beats.every((b:any,i:number)=>!i||b.audioStartSeconds>=plan.beats[i-1].audioEndSeconds),captionsInBounds:captions.cues.every(c=>c.startFrame>=0&&c.endFrame<=plan.totalFrames&&c.lines.length<=2),safeCaptionLayout:captions.style.top>=.08&&captions.style.top<=.2&&captions.style.left>=.06&&captions.style.right>=.14,audioStartsAtIntendedPoint:!leading||leading.duration<.04,noUnexpectedSilence:unexpectedGaps.length===0,tailMatchesDeclaredHold:tail?tail.start>=last.audioEndSeconds-.15&&tail.start<=last.audioEndSeconds+.04:duration-last.audioEndSeconds<.04};
const report={...generic,video,expected:{frames:plan.totalFrames,fps:plan.fps,durationSeconds:duration},checks,allChecksPassed:Object.values(checks).every(Boolean),audio:{codec:audio?.codec_name,sampleRate:audio?.sample_rate,channels:audio?.channels,sourceDurationSeconds:source.sourceAudioDurationSeconds,assembledDurationSeconds:source.assembledDurationSeconds,encodedDurationSeconds:measured.durationSeconds,detectedSilences:silentIntervals,unexpectedGaps},captionTiming:captions.cues.some(c=>c.timingBasis.startsWith('local ASR'))?'Local ASR phrase estimates; not word-perfect':'Estimated phrase boundaries inside measured beat files; not word-perfect',mockDisclosure:source.mockDisclosure,realProviderIntegration:source.realProviderEndToEndTested?'Live provider exercised; human listening approval pending':'not exercised in mock mode; HTTP request contract covered with injected fetch tests',humanVisualAndVoiceApproval:'pending',note:'Decoded narration/caption frames intentionally differ from visual-only baseline. No pixel-identity claim for narrated renders.'};
await writeFile(path.join(job,'reports/verification-report.json'),JSON.stringify(report,null,2));
const previews=story.previews??[{id:'story-preview',fromBeat:story.beats[0].id,toBeat:story.beats.at(-1).id}];
for(const preview of previews){const first=plan.beats.find((b:any)=>b.beatId===preview.fromBeat),last=plan.beats.find((b:any)=>b.beatId===preview.toBeat);if(!first||!last||last.endFrame<=first.startFrame||!/^[-a-z0-9]+$/.test(preview.id))throw Error('Invalid authored preview range');const start=first.startFrame/plan.fps,end=last.endFrame/plan.fps;await run('ffmpeg',['-v','error','-y','-ss',String(start),'-i',video,'-t',String(end-start),'-vf','scale=540:-2','-c:v','libx264','-crf','20','-c:a','aac',path.join(job,`previews/${preview.id}.mp4`)]);}
const render=JSON.parse(await readFile(path.join(job,'reports/render-report.json'),'utf8'));
await writeFile(path.join(job,'reports/implementation-report.md'),`# Story pipeline implementation report

Story: ${story.title} (${story.id}). Audience: ${story.targetAudience}. Visual storyboard: ${story.storyboard}.

Status: ${report.allChecksPassed?'mock/technical checks passed; human review pending':'technical verification failed'}. Provider: ${source.provider}; model: ${source.model}; voice: ${source.voice}. ${source.mockDisclosure??'AI-generated narration; human voice-quality approval pending.'}

The authored story is validated separately from the visual storyboard. Per-beat audio uses stable synthesis hashes, content-verified cache files and FFprobe measurements. Existing scene slots are preserved; there is no automatic audio acceleration or visual retiming. Caption boundaries are explicitly estimated inside measured beat files, not word-perfect alignment. Candidate comparison: story/script-candidates.md.

Measured source clip duration: ${source.sourceAudioDurationSeconds.toFixed(6)} seconds. Assembled PCM: ${source.assembledDurationSeconds.toFixed(3)} seconds. Declared scene/end holds: ${source.plannedHoldSeconds.toFixed(6)} seconds. Target: ${plan.totalFrames} frames at ${plan.fps} FPS. Render/encode/mux: ${render.elapsedSeconds.toFixed(2)} seconds.

Cache hits: ${source.cacheHits}; synthesis calls: ${source.synthesisCalls}; external TTS requests this render: ${source.externalAPIRequests}; total paid job requests: ${source.totalJobPaidRequests??source.externalAPIRequests}. Actual API usage: ${source.actualAPIUsage===null?'unavailable / not supplied':JSON.stringify(source.actualAPIUsage)}. Actual cost: ${source.actualCostUSD===null?'not measured':`USD ${source.actualCostUSD}`}. Real provider end-to-end tested: ${source.realProviderEndToEndTested}.

Authored narration:
${story.beats.map((b:any,i:number)=>`${i+1}. ${b.narration}`).join('\n')}

Verification checks:
${Object.entries(checks).map(([k,v])=>`- ${k}: ${v?'passed':'FAILED'}`).join('\n')}

The complete reports include timing, caption JSON, ordered decoded samples and three authored preview clips. Visual-only compatibility is verified separately; narrated/captioned pixels are intentionally different. Mock tones do not establish natural speech quality, pronunciation or timing. Per-beat prosody and estimated phrase synchronization need human listening review after authorized real synthesis. No human approval is granted by technical checks.
`);
console.log(JSON.stringify({job,checks,allChecksPassed:report.allChecksPassed},null,2));if(!report.allChecksPassed)process.exitCode=1;
