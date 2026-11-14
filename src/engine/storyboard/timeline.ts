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
