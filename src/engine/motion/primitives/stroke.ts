import {trackAt} from '../layers';
import type {PathConfig, StrokeRevealConfig} from './schema';

/** SVG path data for a normalized path in host pixel units. */
export const pathData = (path: PathConfig, width: number, height: number) => {
  const p = (point: {x: number; y: number}) => `${(point.x * width).toFixed(2)} ${(point.y * height).toFixed(2)}`;
  return [
    `M ${p(path.start)}`,
    ...path.segments.map(s => (s.type === 'line' ? `L ${p(s.to)}` : `C ${p(s.control1)} ${p(s.control2)} ${p(s.to)}`)),
  ].join(' ');
};

/** Revealed fraction and travelling-dash offset; both are pure functions of the frame. */
export const strokeStateAt = (config: StrokeRevealConfig, frame: number) => {
  const progress = Math.max(0, Math.min(1, trackAt(frame, config.progress, 0)));
  const flowOffset = config.flow ? -((frame / config.flow.periodFrames) % 1) * (config.flow.dash + config.flow.gap) : 0;
  return {progress, flowOffset, visible: progress > 0};
};
