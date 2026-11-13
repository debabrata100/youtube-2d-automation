import {smoothstep} from './easing';
import {lerpPoint, type Point} from './paths';

export type CameraPose = {focus: Point; zoom: number; rotation?: number};
export type CameraKeyframe = CameraPose & {frame: number};

export const cameraTransform = (focus: Point, zoom: number, viewport={x:540,y:960}, rotation=0) =>
  `translate(${viewport.x}px, ${viewport.y}px) rotate(${rotation}deg) scale(${zoom}) translate(${-focus.x}px, ${-focus.y}px)`;

export const cameraPoseAt = (frame: number, keyframes: CameraKeyframe[]): CameraPose => {
  if (keyframes.length === 0) throw new Error('Camera choreography needs at least one keyframe');
  if (frame <= keyframes[0].frame) return keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (frame >= last.frame) return last;
  const nextIndex = keyframes.findIndex(keyframe => keyframe.frame >= frame);
  const from = keyframes[nextIndex - 1];
  const to = keyframes[nextIndex];
  const t = smoothstep((frame - from.frame) / Math.max(1, to.frame - from.frame));
  return {
    focus: lerpPoint(from.focus, to.focus, t),
    zoom: from.zoom + (to.zoom - from.zoom) * t,
    rotation: (from.rotation ?? 0) + ((to.rotation ?? 0) - (from.rotation ?? 0)) * t,
  };
};
