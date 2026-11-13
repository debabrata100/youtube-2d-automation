import {interpolate} from 'remotion';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {const t = clamp01(v); return t * t * (3 - 2 * t);};
export const easeOutCubic = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
export const progress = (frame: number, start: number, end: number) => clamp01((frame - start) / Math.max(1, end - start));
export const animate = (frame: number, input: [number, number], output: [number, number]) => interpolate(frame, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
