/** Visual density: every moment of a video should get a new picture within a few seconds (the Paint Explainer rhythm,
 * about one new visual every 5 s). Collects visual events from a resolved storyboard and reports long gaps. */
import type {Storyboard} from './schema';
import {storyboardTimeline} from './timeline';

type Keyed = {frame: number; value?: number};
export type DensityGap = {fromSeconds: number; toSeconds: number; seconds: number; scene: string};

/** Frames (absolute) where something new appears: a cut, a note or prop showing up, a pose or face change, a camera move. */
export const visualEvents = (board: Storyboard): number[] => {
  const groups = new Map((board.groups ?? []).map(g => [g.id, g]));
  const events = new Set<number>();
  for (const {scene, startFrame, endFrame} of storyboardTimeline(board)) {
    const add = (f: number) => { if (f > 0 && startFrame + f < endFrame) events.add(startFrame + f); };
    events.add(startFrame);
    const appears = (track?: Keyed[]) => track?.forEach((k, i) => { if (i && (k.value ?? 0) > (track[i - 1].value ?? 0) + .2) add(k.frame); });
    for (const k of scene.camera.keyframes ?? []) add(k.frame);
    const primary = (scene.config as {primary?: {asset?: string}}).primary?.asset, group = primary ? groups.get(primary) : undefined;
    for (const a of group?.annotations ?? []) appears(a.opacity as Keyed[] | undefined);
    for (const layer of group?.layers ?? []) {
      appears(layer.opacity as Keyed[] | undefined); appears(layer.scale as Keyed[] | undefined);
      const kit = layer.kit as {poses?: Keyed[]; faces?: Keyed[]; level?: Keyed[]; values?: Keyed[]} | undefined;
      for (const keys of [kit?.poses, kit?.faces, kit?.values]) keys?.forEach(k => add(k.frame));
      kit?.level?.forEach((k, i) => { if (i) add(k.frame); });
    }
  }
  return [...events].sort((a, b) => a - b);
};

/** Gaps longer than maxSeconds without a new visual event. */
export const densityGaps = (board: Storyboard, maxSeconds = 6): DensityGap[] => {
  const fps = board.format.fps, events = visualEvents(board), end = storyboardTimeline(board).at(-1)!.endFrame, timeline = storyboardTimeline(board);
  const points = [...events, end], gaps: DensityGap[] = [];
  for (let i = 1; i < points.length; i++) {
    const seconds = (points[i] - points[i - 1]) / fps;
    if (seconds > maxSeconds) gaps.push({fromSeconds: +(points[i - 1] / fps).toFixed(2), toSeconds: +(points[i] / fps).toFixed(2), seconds: +seconds.toFixed(2),
      scene: timeline.find(t => t.startFrame <= points[i - 1] && points[i - 1] < t.endFrame)!.scene.id});
  }
  return gaps;
};

/** Kit items that carry information on their own (a reading, a label, a diagram); characters and scenery do not. */
export const INFO_ITEMS = new Set(['thermometer', 'counter', 'radiation-meter', 'battery', 'speedometer', 'calendar', 'sign', 'flag', 'bar', 'moon-map',
  'ice-cutaway', 'pressure-arrows', 'cliff', 'ruler', 'system-map', 'solar-strip', 'check', 'cross', 'question', 'exclaim', 'radiation-belt', 'magnifier', 'stamp', 'probe', 'signal', 'bulb']);

const valueAt = (track: Keyed[] | undefined, frame: number, fallback = 1) => {
  if (!track?.length) return fallback;
  if (frame <= track[0].frame) return track[0].value ?? fallback;
  for (let i = 1; i < track.length; i++) if (frame <= track[i].frame) {
    const a = track[i - 1], b = track[i], t = (frame - a.frame) / Math.max(1, b.frame - a.frame);
    return (a.value ?? fallback) + ((b.value ?? fallback) - (a.value ?? fallback)) * t;
  }
  return track.at(-1)!.value ?? fallback;
};

export type InfoCoverage = {overall: number; scenes: {scene: string; coverage: number; seconds: number}[]};

/** Share of time (sampled every `step` frames) with something readable on screen: a visible note (not the place-name
 * header), an information prop (dial, gauge, thermometer, sign, diagram...) or a photo. */
export const infoCoverage = (board: Storyboard, step = 3): InfoCoverage => {
  const groups = new Map((board.groups ?? []).map(g => [g.id, g]));
  const scenes: InfoCoverage['scenes'] = []; let hit = 0, total = 0;
  for (const {scene} of storyboardTimeline(board)) {
    const primary = (scene.config as {primary?: {asset?: string}}).primary?.asset, group = primary ? groups.get(primary) : undefined;
    let h = 0, n = 0;
    for (let f = 0; f < scene.durationFrames; f += step) {
      const note = (group?.annotations ?? []).some(a => a.pop !== false && valueAt(a.opacity as Keyed[] | undefined, f) >= .5);
      const prop = (group?.layers ?? []).some(l => {
        const item = (l.kit as {item?: string} | undefined)?.item, info = l.asset !== undefined || (item !== undefined && INFO_ITEMS.has(item));
        return info && valueAt(l.opacity as Keyed[] | undefined, f) >= .5;
      });
      n++; if (note || prop) h++;
    }
    scenes.push({scene: scene.id, coverage: +(h / Math.max(1, n)).toFixed(2), seconds: +(scene.durationFrames / board.format.fps).toFixed(1)});
    hit += h; total += n;
  }
  return {overall: +(hit / Math.max(1, total)).toFixed(3), scenes};
};
