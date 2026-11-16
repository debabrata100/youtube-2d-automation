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
