/** Offline continuous-narration integration. No env loader, provider or API client. */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,copyFile,rename} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia} from '@remotion/renderer';
import {storyScriptSchema} from '../src/storytelling/schema';
import {validateStory} from '../src/storytelling/validate';
import {storyboardDuration,storyboardTimeline} from '../src/engine/storyboard/timeline';
import {parseAnchoredStoryboard,resolveWordAnchors} from '../src/storytelling/timing/anchors';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {captionStyleSchema,narrationOverlaySchema} from '../src/captions/schema';
import {getTheme} from '../src/engine/style/theme';
import {measureAudio} from '../src/audio/metadata';
import {validateAssetFiles} from './storyboard-assets';
import {browserExecutable,run} from './media-tools';
import {muxAudio,prepareMix} from './lib/mix-audio';
import {holdShortNotes,readabilityIssues} from '../src/engine/storyboard/readability';
const main=async()=>{
 const {values:o}=parseArgs({options:{script:{type:'string'},storyboard:{type:'string'},'show-ai-disclosure-banner':{type:'boolean',default:false},audio:{type:'string'},metadata:{type:'string'},output:{type:'string'},'caption-style':{type:'string'},'prepare-only':{type:'boolean',default:false},'allow-readability-errors':{type:'boolean',default:false},music:{type:'string'}}});
 if(!o.script||!o.audio||!o.metadata)throw Error('Usage: render-cached-story --script <json> --audio <wav> --metadata <cached-metadata-json> [--output <new-job>] [--caption-style <json>]');
 const storyInput=storyScriptSchema.parse(JSON.parse(await readFile(o.script,'utf8'))),rawBoard=JSON.parse(await readFile(o.storyboard??storyInput.storyboard,'utf8')),timedBoard=parseAnchoredStoryboard(rawBoard),story=validateStory({...storyInput,storyboard:o.storyboard??storyInput.storyboard},timedBoard);
 const metadata=JSON.parse(await readFile(o.metadata,'utf8')),bytes=await readFile(o.audio),sha256=createHash('sha256').update(bytes).digest('hex');
 if(sha256!==metadata.sha256||metadata.text!==story.beats.map(b=>b.narration).join(' '))throw Error('Cached approved audio hash/text does not match script');
 const measured=await measureAudio(o.audio),frames=storyboardDuration(timedBoard),seconds=frames/timedBoard.format.fps;
 if(measured.codec!=='pcm_s16le'||measured.sampleRate!==24000||measured.channels!==1||measured.durationSeconds>seconds-.2)throw Error('Unsupported or overlong approved audio; never stretch or truncate');
 await validateAssetFiles(timedBoard.assets);
 const mapping=captionsFromProviderTiming(story,metadata.alignment,measured.durationSeconds,timedBoard.format.fps),anchors=resolveWordAnchors(rawBoard,mapping),sourceBoard=anchors.source,schedule=anchors.schedule,board=schedule.storyboard,style=captionStyleSchema.parse(o['caption-style']?JSON.parse(await readFile(o['caption-style'],'utf8')):sourceBoard.themeId?getTheme(sourceBoard.themeId).caption:{});
 // Readability (22 Nov 2026): late notes come in earlier so each is readable for 1.5 s; then contrast and time on screen are
 // checked, and errors block the render (override with --allow-readability-errors after looking at the frames).
 const held=holdShortNotes(board as never,board.format.fps),readability=readabilityIssues(board as never,board.format.fps),readErrors=readability.filter(i=>i.level==='error');
 if(readability.length||held.length)console.error(JSON.stringify({notesBroughtEarlier:held.length,readability:readability.map(i=>`${i.level} ${i.check} ${i.startSeconds}s ${i.scene} "${i.note}": ${i.detail}`)}));
 if(readErrors.length&&!o['allow-readability-errors'])throw Error(`Readability check failed (${readErrors.length} error(s) above): fix the storyboard, or pass --allow-readability-errors after checking those frames. Nothing was rendered.`);
 const narration=narrationOverlaySchema.parse({audioSrc:'narration/narration.wav',captionsEnabled:style.enabled!==false,syntheticTestAudio:false,showAiDisclosureBanner:o['show-ai-disclosure-banner'],cues:mapping.cues,style});
 const job=path.resolve(o.output??`jobs/${story.id}-cached-${new Date().toISOString().replace(/[:.]/g,'-')}`);await mkdir(path.dirname(job),{recursive:true});await mkdir(job);
 for(const dir of ['audio','story','captions','reports','output','previews','public'])await mkdir(path.join(job,dir));
 const json=(file:string,data:unknown)=>writeFile(path.join(job,file),JSON.stringify(data,null,2)+'\n');
 await json('source-storyboard.json',sourceBoard);await json('reports/anchor-report.json',{anchors:anchors.resolutions.length,warnings:anchors.warnings,resolutions:anchors.resolutions});if(anchors.warnings.length)console.error(JSON.stringify({anchorWarnings:anchors.warnings}));await json('reports/scene-timing-comparison.json',schedule);
 await json('storyboard.json',board);await json('story/selected-script.json',story);await json('captions/captions.json',narration);await json('narration-props.json',narration);
 await json('captions/provider-character-timing.json',metadata.alignment);await json('captions/word-timing.json',mapping.wordTimings);await json('captions/phrase-timing.json',mapping.phraseTimings);
 const timeline=storyboardTimeline(board),beats=story.beats.map((beat,i)=>{const cues=mapping.cues.filter(c=>c.beatId===beat.id);return{beatId:beat.id,sceneId:beat.sceneId,visualStartFrame:timeline[i].startFrame,visualEndFrame:timeline[i].endFrame,captionStartFrame:cues[0].startFrame,captionEndFrame:cues.at(-1)!.endFrame,narrationLeadFrames:timeline[i].startFrame-cues[0].startFrame};});
 await json('reports/timing-report.json',{...mapping.timingReport,beats,visualTimelinePreserved:!schedule.enabled,narrationDrivenScenes:schedule.enabled,captionBasis:'Provider character timestamps mapped to all spoken words; no forced alignment or estimated ASR timing used.',sceneAlignmentNote:schedule.enabled?'Scene crossfade midpoints follow exact provider phrase cues; illustration clocks normalized to preserve source keyframes. Audio unchanged.':'Original scene durations preserved; see narration lead frames.'});
 await copyFile(o.audio,path.join(job,'audio/narration.wav'));await json('audio/narration-metadata.json',{...metadata,audioPath:path.join(job,'audio/narration.wav'),sourceAudio:path.resolve(o.audio),approvedNarrationReused:true,paidRequestsThisRender:0});
 const publicDir=path.join(job,'public');for(const asset of board.assets){const dest=path.join(publicDir,asset.path);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.resolve('assets',asset.path),dest);}await mkdir(path.join(publicDir,'narration'));await copyFile(o.audio,path.join(publicDir,'narration/narration.wav'));
 // Sound design: scene sound cues resolve to absolute times on the scheduled timeline; music is generated or a supplied licensed file.
 const scheduled=storyboardTimeline(board),sfx=board.scenes.flatMap((scene,i)=>(scene.sounds??[]).map(s=>({sound:s.sound,startSeconds:(scheduled[i].startFrame+Math.min(s.frame,scene.durationFrames-1))/board.format.fps,gainDb:s.gainDb})));
 const sceneStart=(id:string)=>{const i=board.scenes.findIndex(s=>s.id===id);return scheduled[i].startFrame/board.format.fps;};
 const cueMusic=board.audio?.music==='cues'?{kind:'cues' as const,crossfadeSeconds:board.audio.crossfadeSeconds,dropoutFloorDb:board.audio.dropoutFloorDb??-24,
  cues:(board.audio.musicCues??[]).map((c,i,all)=>({source:path.resolve(c.source),startSeconds:sceneStart(c.scene),endSeconds:i<all.length-1?sceneStart(all[i+1].scene):seconds,offsetSeconds:c.offsetSeconds,loop:c.loop,gainDb:c.gainDb,levelDb:0})),
  dropouts:(board.audio.musicDropouts??[]).map(d=>{const i=board.scenes.findIndex(s=>s.id===d.scene),a=(scheduled[i].startFrame+Math.min(d.frame,board.scenes[i].durationFrames-1))/board.format.fps;return [a,a+d.seconds] as [number,number];})}:null;
 const music=o.music?{kind:'file' as const,source:path.resolve(o.music)}:cueMusic??(board.audio?.music==='generated-pad'?{kind:'generated' as const,seed:1}:{kind:'none' as const});
 if(sfx.length||music.kind!=='none')await prepareMix(job,{durationSeconds:seconds,narration:path.join(job,'audio/narration.wav'),music,musicGainDb:board.audio?.musicGainDb??-16,duckRatio:board.audio?.duckRatio??8,...(board.audio?.voice?{voice:board.audio.voice}:{}),sfx,speech:mapping.phraseTimings.map(p=>[p.startSeconds,p.endSeconds] as [number,number]),targetLufs:board.audio?.targetLufs??-14,truePeakDb:-1.5});
 if(o['prepare-only']){
  // Chunked/resumable path: bundle once into the job; render-job-frames.ts renders ranges; assemble-job.ts muxes and verifies.
  await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir,outDir:path.join(job,'bundle')});
  await json('reports/prepare-report.json',{prepared:true,frames,seconds,sourceAudio:path.resolve(o.audio),paidRequests:0});
  console.log(JSON.stringify({job,prepared:true,paidRequests:0}));return;
 }
 const serveUrl=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir}),inputProps={storyboard:board,narration};
 const composition=(await getCompositions(serveUrl,{inputProps,browserExecutable})).find(c=>c.id==='GenericStoryboard');if(!composition)throw Error('Composition missing');
 const start=performance.now(),output=path.join(job,'output/narrated-animation.mp4');
 await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:output,codec:'h264',audioCodec:'aac',audioBitrate:'128k',pixelFormat:'yuv420p',crf:18,concurrency:1,disallowParallelEncoding:true});
 // Copy H.264 video and mux the unchanged approved performance plus an intentional silent ending.
 const final=path.join(job,'output/final.mp4');await muxAudio(job,output,final,seconds,o.audio);await rename(final,output);
 await json('reports/render-report.json',{elapsedSeconds:Number(((performance.now()-start)/1000).toFixed(2)),scope:'450-frame render, H.264/AAC encoding and final mux; excludes bundling and verification',paidRequests:0,offline:true,sourceSha256:sha256});
 await run(process.execPath,['--import','tsx','scripts/verify-storyboard.ts',job,'narrated-animation.mp4']);
 await run(process.execPath,['--import','tsx','scripts/verify-cached-story.ts',job]);
 console.log(JSON.stringify({job,output,paidRequests:0}));
};
main().catch(error=>{console.error(error instanceof Error?error.message:'Cached render failed');process.exitCode=1;});
