import type {StoryScript} from '../schema';
import type {Storyboard} from '../../engine/storyboard/schema';
import {storyboardTimeline} from '../../engine/storyboard/timeline';
import {secondsToFrames} from './frames';
import {validateStory} from '../validate';
export const alignBeats=(story:StoryScript,board:Storyboard,durations:number[],options={strict:true,maxIntentionalPauseSeconds:.35,toleranceSeconds:.02})=>{
 validateStory(story,board);
 if(durations.length!==story.beats.length)throw Error('Missing measured beat audio');
 const timeline=storyboardTimeline(board),fps=board.format.fps,issues:string[]=[];
 const beats=story.beats.map((beat,i)=>{
  const {startFrame,endFrame}=timeline[i],durationSeconds=durations[i];if(!Number.isFinite(durationSeconds)||durationSeconds<=0)throw Error(`Invalid audio duration for ${beat.id}`);
  const audioFrames=secondsToFrames(durationSeconds,fps),available=(endFrame-startFrame)/fps,hold=available-durationSeconds;
  if(audioFrames>endFrame-startFrame)issues.push(`Narration overflow in ${beat.id}: ${durationSeconds.toFixed(3)}s needs ${audioFrames} frames, scene provides ${endFrame-startFrame}. Shorten the script or explicitly revise timing; audio/video will not be sped up or truncated.`);
  if(hold>options.maxIntentionalPauseSeconds+options.toleranceSeconds)issues.push(`Long silence hold in ${beat.id}: ${hold.toFixed(3)}s. Revise script/delivery or explicitly allow a longer intentional pause.`);
  return{beatId:beat.id,sceneId:beat.sceneId,startFrame,endFrame,audioFrames,audioStartSeconds:startFrame/fps,audioEndSeconds:startFrame/fps+durationSeconds,measuredDurationSeconds:durationSeconds,intentionalHoldSeconds:Math.max(0,hold)};
 });
 // Overflow is fatal even in diagnostic mode: producing clipped or overlapping speech is never allowed.
 const overflow=beats.some(b=>b.audioFrames>b.endFrame-b.startFrame);
 if(overflow||(options.strict&&issues.length))throw Error(issues.join('\n'));
 return{fps,totalFrames:timeline.at(-1)!.endFrame,alignment:'measured per-beat file boundaries; fixed visual scene slots',beats,issues,strict:options.strict,toleranceSeconds:options.toleranceSeconds,maxIntentionalPauseSeconds:options.maxIntentionalPauseSeconds};
};
export type TimingPlan=ReturnType<typeof alignBeats>;

/** Explicit, bounded speech-led slot allocation. Visual frames are not retimed. */
export const alignContinuousBeats=(story:StoryScript,board:Storyboard,durations:number[],maxBoundaryOffsetFrames=8)=>{
 validateStory(story,board);if(durations.length!==story.beats.length||durations.some(d=>!Number.isFinite(d)||d<=0))throw Error('Invalid measured audio durations');
 const visual=storyboardTimeline(board),fps=board.format.fps,totalFrames=visual.at(-1)!.endFrame,frames=durations.map(d=>secondsToFrames(d,fps));
 if(frames.reduce((a,b)=>a+b,0)>totalFrames)throw Error('Complete narration does not fit; no automatic clipping or rate adjustment allowed');
 let cursor=0;const beats=story.beats.map((b,i)=>{const startFrame=cursor,endFrame=i===story.beats.length-1?totalFrames:startFrame+frames[i];cursor=endFrame;const offset=startFrame-visual[i].startFrame;if(Math.abs(offset)>maxBoundaryOffsetFrames)throw Error(`Narration boundary for ${b.id} drifts ${offset} frames beyond the explicit tolerance`);return{beatId:b.id,sceneId:b.sceneId,startFrame,endFrame,audioFrames:frames[i],audioStartSeconds:startFrame/fps,audioEndSeconds:startFrame/fps+durations[i],measuredDurationSeconds:durations[i],intentionalHoldSeconds:(endFrame-startFrame)/fps-durations[i],visualStartFrame:visual[i].startFrame,boundaryOffsetFrames:offset};});
 return{fps,totalFrames,alignment:'explicit continuous measured audio slots; visuals unchanged',beats,issues:[] as string[],strict:true,toleranceSeconds:.02,maxIntentionalPauseSeconds:.35,maxBoundaryOffsetFrames};
};
