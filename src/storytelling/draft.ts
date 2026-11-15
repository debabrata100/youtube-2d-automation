/**
 * Script -> storyboard drafter. Produces a valid, word-anchored skeleton storyboard from a story script and
 * a theme: themed backdrop, one hero-reveal scene per beat with a placeholder visual, matched camera
 * handoffs, pill labels and sounds anchored to emphasis words, a generated music bed and narration cues.
 * Pure and deterministic: the same script, theme and nominal frames always give the same board.
 * The author then replaces each group's placeholder layers with the real visual.
 */
import type {StoryScript} from './schema';

export type DraftOptions = {
  themeId: string;
  fps?: number;
  /** Nominal (animation) frames per beat; defaults to a word-count split of the script duration. */
  nominalFrames?: number[];
  /** Emphasis words per beat when the script has none: pick the longest content word. Default true. */
  autoEmphasis?: boolean;
};
export type DraftNote = {beat: string; emphasis: string[]; autoPicked: boolean};

const GROUP_W = 1000, GROUP_H = 1300;
const STOP = new Set(['about', 'above', 'after', 'below', 'inside', 'outside', 'toward', 'within', 'again', 'because', 'before', 'being', 'between', 'could', 'every', 'their', 'there', 'these', 'thing', 'things',
  'those', 'through', 'under', 'until', 'where', 'which', 'while', 'would', 'begins', 'makes', 'really', 'something']);
export const anchorKey = (s: string) => s.toLowerCase().replace(/[’]/g, "'").replace(/[^\p{L}\p{N}'-]+/gu, ' ').trim();
const words = (text: string) => anchorKey(text).split(' ').filter(Boolean);
const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (_, sp, c) => sp + c.toUpperCase());
const track = (...pairs: Array<[unknown, number]>) => pairs.map(([frame, value]) => ({frame, value}));
const at = (word: string, offset = 0, extra: Record<string, unknown> = {}) => ({at: word, ...(offset ? {offset} : {}), ...extra});

/** Split total frames across beats by word count (largest remainder), at least `min` frames each. */
export const splitFrames = (counts: number[], total: number, min = 45): number[] => {
  const fixed = new Set<number>();
  let shares: number[] = [];
  for (;;) {
    const free = counts.map((c, i) => (fixed.has(i) ? 0 : c)), freeSum = free.reduce((a, b) => a + b, 0) || 1;
    const budget = total - fixed.size * min;
    shares = counts.map((_, i) => (fixed.has(i) ? min : budget * free[i] / freeSum));
    const low = shares.findIndex((v, i) => !fixed.has(i) && v < min);
    if (low < 0) break;
    fixed.add(low);
  }
  const floors = shares.map(Math.floor);
  let left = total - floors.reduce((a, b) => a + b, 0);
  const order = shares.map((r, i) => [r - floors[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) { if (left <= 0) break; floors[i]++; left--; }
  return floors;
};

/** Longest content word of a beat (ties: the later word, where English puts its focus), used as the label word when the script gives none. */
export const pickEmphasis = (narration: string): string | null => {
  const candidates = words(narration).filter(w => w.length >= 5 && !STOP.has(w));
  return candidates.reduce<string | null>((best, w) => (!best || w.length >= best.length ? w : best), null);
};

type Cam = {y: number; zoom: number};
const camEnd = (intent: string, i: number): Cam =>
  intent === 'hook' ? {y: .48, zoom: 1} : intent === 'setup' ? {y: .44, zoom: 1.08} : intent === 'payoff' ? {y: .5, zoom: 1.12}
    : intent === 'closing' ? {y: .5, zoom: 1} : i % 2 ? {y: .52, zoom: 1.04} : {y: .4, zoom: 1.16};
const kf = (frame: unknown, c: Cam, easing = 'smoothstep') => ({frame, focus: {x: .5, y: c.y}, zoom: c.zoom, easing});

export const draftStoryboard = (story: StoryScript, options: DraftOptions) => {
  const fps = options.fps ?? 30, total = Math.round(story.durationSeconds * fps);
  const nominal = options.nominalFrames ?? splitFrames(story.beats.map(b => words(b.narration).length), total);
  if (nominal.length !== story.beats.length || nominal.reduce((a, b) => a + b, 0) !== total) throw Error(`nominalFrames must give one entry per beat summing to ${total}`);
  const notes: DraftNote[] = [];
  let camera: Cam = {y: .5, zoom: 1.12};
  const groups: unknown[] = [{id: 'backdrop', width: 1080, height: 1920, layers: [
    {id: 'sky', kit: {type: 'sky', horizon: .7, stars: 0, seed: 5}},
    {id: 'ridges', kit: {type: 'ridges', top: .66, bottom: .76, layers: 3, peaks: 6, roughness: .5, drift: .00006, seed: 22}},
    {id: 'ground', kit: {type: 'ground', top: .753, rocks: 6, seed: 10}},
  ]}];
  const scenes = story.beats.map((beat, i) => {
    const given = beat.emphasis.slice(0, 3), auto = !given.length && options.autoEmphasis !== false ? pickEmphasis(beat.narration) : null;
    const emphasis = given.length ? given : auto ? [auto] : [];
    notes.push({beat: beat.id, emphasis, autoPicked: !!auto});
    const gid = `g-${beat.id}`, payoff = beat.intent === 'payoff' || beat.intent === 'hook';
    const labels = emphasis.map((phrase, k) => ({
      id: `label-${k + 1}`, text: titleCase(phrase).slice(0, 60), x: GROUP_W / 2, y: [200, 1040, 620][k], size: 46, anchor: 'middle', variant: 'pill', pop: true,
      opacity: track([0, 0], [at(phrase, -2), 0], [at(phrase, 10), 1]),
    }));
    groups.push({id: gid, width: GROUP_W, height: GROUP_H, layers: [
      {id: 'placeholder-cloud', kit: {type: 'cloud', x: .5, y: .3, width: 1.1, seed: 40 + i, lobes: 6, drift: .0001}},
      {id: 'placeholder-subject', kit: {type: 'glow', x: .5, y: .58, rx: .3, ry: .18, tone: payoff ? 'hot' : 'sky'}, opacity: track([0, 0], [18, .85])},
    ], annotations: [...labels, {id: 'placeholder-note', text: `[placeholder visual: ${beat.id}]`, x: GROUP_W / 2, y: 1240, size: 26, anchor: 'middle', variant: 'plain'}]});

    // Matched handoff: each scene starts on the previous scene's final framing.
    const tokens = words(beat.narration), last = tokens.at(-1)!, lastN = tokens.filter(w => w === last).length;
    const end = camEnd(beat.intent, i);
    const keys = beat.intent === 'hook'
      ? [kf(0, camera), kf(44, end, 'ease-out-back')]
      : [kf(0, camera), kf(at(last, 0, {edge: 'end', ...(lastN > 1 ? {n: lastN} : {})}), end)];
    camera = end;
    const sounds = [
      ...(i ? [{sound: 'whoosh', frame: 0, gainDb: -16}] : []),
      ...emphasis.map((phrase, k) => payoff && !k ? {sound: 'boom', frame: at(phrase), gainDb: -9} : {sound: 'pop', frame: at(phrase, 2), gainDb: -17}),
    ];
    return {
      id: beat.sceneId, template: 'hero-reveal', durationFrames: nominal[i], animationDurationFrames: nominal[i],
      caption: {text: (emphasis[0] ? titleCase(emphasis[0]) : beat.phrases[0]).slice(0, 60), preset: 'body'},
      camera: {preset: 'static', boundaryMode: 'backdrop', keyframes: keys}, motion: {preset: 'still'}, seed: 5000 + i,
      transitionFrames: 0, environmentDim: 0, config: {primary: {asset: gid, x: .5, y: .5, size: .9}},
      narrationCue: {beatId: beat.id, phraseIndex: 0, edge: 'start'}, sounds,
    };
  });
  const board = {
    schemaVersion: '2.1', projectId: story.id, title: story.title, themeId: options.themeId,
    format: {width: 1080, height: 1920, fps}, styleId: 'cinematic-illustrated', background: '@sky.top', accent: '@text.accent',
    assets: [], backdrop: {group: 'backdrop'}, crossfadeFrames: 8,
    narrationTiming: {minimumSceneFrames: 45, maximumDeviationSeconds: .2},
    audio: {music: 'generated-pad', musicGainDb: -22, duckRatio: 8, targetLufs: -14},
    groups, scenes,
  };
  return {board, notes};
};
