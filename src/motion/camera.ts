import type {Point} from './paths';

export type CameraPose = {focus: Point; zoom: number; rotation?: number};
export type CameraKeyframe = CameraPose & {frame: number};

export const cameraTransform = (focus: Point, zoom: number, viewport={x:540,y:960}, rotation=0) =>
  `translate(${viewport.x}px, ${viewport.y}px) rotate(${rotation}deg) scale(${zoom}) translate(${-focus.x}px, ${-focus.y}px)`;

const catmull=(before:number,from:number,to:number,after:number,t:number)=>.5*(
  2*from+(-before+to)*t+(2*before-5*from+4*to-after)*t*t+(-before+3*from-3*to+after)*t*t*t
);

export const cameraPoseAt = (frame: number, keyframes: CameraKeyframe[]): CameraPose => {
  if (keyframes.length === 0) throw new Error('Camera choreography needs at least one keyframe');
  if (frame <= keyframes[0].frame) return keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (frame >= last.frame) return last;
  const nextIndex = keyframes.findIndex(keyframe => keyframe.frame >= frame);
  const from = keyframes[nextIndex - 1];
  const to = keyframes[nextIndex];
  const before=keyframes[Math.max(0,nextIndex-2)];
  const after=keyframes[Math.min(keyframes.length-1,nextIndex+1)];
  const t = (frame - from.frame) / Math.max(1, to.frame - from.frame);
  return {
    focus:{x:catmull(before.focus.x,from.focus.x,to.focus.x,after.focus.x,t),y:catmull(before.focus.y,from.focus.y,to.focus.y,after.focus.y,t)},
    zoom:catmull(before.zoom,from.zoom,to.zoom,after.zoom,t),
    rotation:catmull(before.rotation??0,from.rotation??0,to.rotation??0,after.rotation??0,t),
  };
};
