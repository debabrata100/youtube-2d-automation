import type {Storyboard} from './schema';

export const storyboardTimeline = (storyboard: Storyboard) => {
  let cursor = 0;
  return storyboard.scenes.map(scene => {
    const startFrame = cursor;
    cursor += scene.durationFrames;
    return {scene, startFrame, endFrame: cursor};
  });
};
export const storyboardDuration = (storyboard: Storyboard) => storyboard.scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);
export const storyboardSceneAt = (storyboard: Storyboard, frame: number) => {
  if (!Number.isInteger(frame) || frame < 0) throw new Error(`Invalid frame: ${frame}`);
  const entry = storyboardTimeline(storyboard).find(item => frame >= item.startFrame && frame < item.endFrame);
  if (!entry) throw new Error(`Frame outside storyboard: ${frame}`);
  return {...entry, localFrame: frame - entry.startFrame};
};

/** Normalize local illustration keys while real scene envelopes/cameras use output frames. */
export const sceneAnimationFrame=(scene:{durationFrames:number;animationDurationFrames?:number},frame:number)=>{
 const local=Math.min(Math.max(0,frame),scene.durationFrames-1);
 return scene.animationDurationFrames?local*(scene.animationDurationFrames-1)/(scene.durationFrames-1):local;
};
