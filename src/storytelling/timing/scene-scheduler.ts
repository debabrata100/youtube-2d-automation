import type {Storyboard} from '../../engine/storyboard/schema';
import {parseStoryboard} from '../../engine/storyboard/schema';
import {storyboardDuration,storyboardTimeline} from '../../engine/storyboard/timeline';
export type PhraseTiming={beatId:string;phraseIndex:number;text:string;startSeconds:number;endSeconds:number};
/** Resolve opt-in semantic cues once, before rendering. React only sees frame durations.
 * Crossfade midpoint is aligned to speech; every frame has exactly one nominal owner.
 * Animation clocks are normalized separately so fixed illustration keys stay continuous. */
export const scheduleNarratedScenes=(input:Storyboard,phrases:PhraseTiming[])=>{
 const board=parseStoryboard(input),old=storyboardTimeline(board),total=storyboardDuration(board),fps=board.format.fps;
 if(!board.narrationTiming)return{storyboard:board,enabled:false,comparisons:[],maximumDeviationSeconds:0,averageDeviationSeconds:0,exceptions:[] as string[]};
 const min=board.narrationTiming.minimumSceneFrames,midpoint=((board.crossfadeFrames??1)-1)/2;
 if(min*board.scenes.length>total)throw Error('Minimum scene durations cannot fit the fixed timeline');
 const starts:number[]=[],references:number[]=[],exceptions:string[]=[];
 board.scenes.forEach((scene,i)=>{
  const cue=scene.narrationCue;if(!cue)throw Error(`Missing narration cue for scene ${scene.id}`);
  const matches=phrases.filter(p=>p.beatId===cue.beatId&&p.phraseIndex===cue.phraseIndex);
  if(matches.length!==1)throw Error(`Narration cue must resolve exactly once: ${scene.id}`);
  const phrase=matches[0],seconds=cue.edge==='start'?phrase.startSeconds:phrase.endSeconds;
  if(!Number.isFinite(seconds)||seconds<0||seconds>=total/fps||phrase.endSeconds<phrase.startSeconds)throw Error(`Invalid phrase timing for ${scene.id}`);
  if(i&&seconds<=references[i-1])throw Error('Narration cues must preserve chronological scene order');references.push(seconds);
  const target=Math.round(seconds*fps-(i?midpoint:0));
  starts.push(i?Math.max(starts[i-1]+min,Math.min(total-(board.scenes.length-i)*min,target)):0);
 });
 const scenes=board.scenes.map((scene,i)=>({...scene,durationFrames:(starts[i+1]??total)-starts[i],animationDurationFrames:scene.animationDurationFrames??scene.durationFrames}));
 const scheduled=parseStoryboard({...board,scenes});
 const comparisons=scenes.map((scene,i)=>{
  const center=(starts[i]+(i?midpoint:0))/fps,deviation=Math.abs(center-references[i]);
  // The first scene always starts at frame 0; when speech starts later (a no-narration Short's closing line) that is not a missed cut.
  if(i>0&&deviation>board.narrationTiming!.maximumDeviationSeconds+1e-9)exceptions.push(`${scene.id}: ${deviation.toFixed(3)}s transition-midpoint deviation; minimum ${min}-frame scenes and fixed ${total}-frame ending constrain the boundary.`);
  return{sceneId:scene.id,beatId:scene.narrationCue!.beatId,phraseIndex:scene.narrationCue!.phraseIndex,edge:scene.narrationCue!.edge,phraseSeconds:references[i],oldStartFrame:old[i].startFrame,oldEndFrame:old[i].endFrame,startFrame:starts[i],endFrame:starts[i]+scene.durationFrames,durationFrames:scene.durationFrames,transitionCenterFrame:starts[i]+(i?midpoint:0),oldDeviationSeconds:Math.abs((old[i].startFrame+(i?midpoint:0))/fps-references[i]),deviationSeconds:deviation,startDeviationSeconds:Math.abs(starts[i]/fps-references[i])};
 });
 const transitions=comparisons.slice(1),deviations=transitions.map(c=>c.deviationSeconds);
 return{storyboard:scheduled,enabled:true,comparisons,maximumDeviationSeconds:Math.max(0,...deviations),averageDeviationSeconds:deviations.reduce((s,d)=>s+d,0)/Math.max(1,deviations.length),exceptions};
};
