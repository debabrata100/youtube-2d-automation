import {smoothstep} from '../../motion/easing';
import {easeMotion} from './primitives/schema';
import type {IllustrationLayerConfig, Track} from '../storyboard/layers';
export const flowPositionAt = (flow: NonNullable<IllustrationLayerConfig['flow']>, frame: number) => {
  if(flow.type!=='directional')throw new Error('Directional flow configuration required');
  const t = ((frame / flow.periodFrames + flow.phase) % 1 + 1) % 1;
  const vertical = flow.direction === 'up' || flow.direction === 'down';
  const reverse = flow.direction === 'up' || flow.direction === 'left';
  const origin = vertical ? flow.bounds.y : flow.bounds.x;
  const extent = vertical ? flow.bounds.height : flow.bounds.width;
  return origin - flow.bandWidth + (reverse ? 1-t : t)*(extent+2*flow.bandWidth);
};

export const trackAt = (frame: number, keys: Track | undefined, fallback: number) => {
  if (!keys?.length) return fallback;
  if (frame <= keys[0].frame) return keys[0].value;
  if (frame >= keys.at(-1)!.frame) return keys.at(-1)!.value;
  const i = keys.findIndex(key => key.frame >= frame), a = keys[i - 1], b = keys[i];
  const t = (frame - a.frame) / (b.frame - a.frame);
  // Per-key easing applies to the segment arriving at that key; the default stays smoothstep.
  return a.value + (b.value - a.value) * (b.ease ? easeMotion(t, b.ease) : smoothstep(t));
};
export const layerStateAt = (layer: IllustrationLayerConfig, frame: number) => {
  const phase = layer.pulse ? Math.sin(frame * 2 * Math.PI / layer.pulse.periodFrames + layer.pulse.phase) : 0;
  return {x: trackAt(frame, layer.x, 0), y: trackAt(frame, layer.y, 0), scale: trackAt(frame, layer.scale, 1), rotate: trackAt(frame, layer.rotate, 0), opacity: trackAt(frame, layer.opacity, 1) * (1 - (layer.pulse?.opacity ?? 0) * (.5 + .5 * phase)), brightness: trackAt(frame, layer.brightness, 1) * (1 + (layer.pulse?.brightness ?? 0) * phase)};
};
export const wipeRectAt = (reveal: Extract<NonNullable<IllustrationLayerConfig['reveal']>, {type: 'wipe'}>, frame: number) => {
  const p = trackAt(frame, reveal.progress, 0), b = reveal.bounds;
  if (reveal.direction === 'up') return {x: b.x, y: b.y + b.height * (1 - p), width: b.width, height: b.height * p};
  if (reveal.direction === 'down') return {x: b.x, y: b.y, width: b.width, height: b.height * p};
  if (reveal.direction === 'left') return {x: b.x + b.width * (1 - p), y: b.y, width: b.width * p, height: b.height};
  return {x: b.x, y: b.y, width: b.width * p, height: b.height};
};
export const maskSequenceAt = (keys: Array<{frame: number; asset: string}>, frame: number) => {
  if (frame <= keys[0].frame) return {previous: keys[0].asset, next: keys[0].asset, mix: 0};
  if (frame >= keys.at(-1)!.frame) return {previous: keys.at(-1)!.asset, next: keys.at(-1)!.asset, mix: 0};
  const i = keys.findIndex(key => key.frame >= frame), a = keys[i - 1], b = keys[i];
  return {previous: a.asset, next: b.asset, mix: (frame - a.frame) / (b.frame - a.frame)};
};
export const crossfadeAt = (frame: number, duration: number, overlap: number, first: boolean, last: boolean) => {
  const incoming = first ? 1 : smoothstep(frame / Math.max(1, overlap - 1));
  const outgoing = last || frame < duration ? 1 : 1 - smoothstep((frame - duration) / Math.max(1, overlap - 1));
  return incoming * outgoing;
};
