/**
 * Word anchors: anywhere a storyboard expects a frame number, write {"at": "flashes"} instead.
 *
 *   at      word or phrase to find (case-insensitive, punctuation ignored), e.g. "flashes", "spark rising"
 *   n       1-based occurrence within the search scope (default 1)
 *   edge    "start" (default) or "end" of the matched word(s)
 *   offset  output frames added after resolving (may be negative)
 *   beat    search scope; defaults to the beat of the scene that owns the value (whole narration for backdrops)
 *
 * Anchors are resolved after narration scheduling into the clock of the field that holds them:
 *   - scene camera keyframes and sound cues -> scene-local output frames
 *   - layers, effects and labels in a scene's group -> that scene's illustration clock (+ subject timeOffset)
 *   - the backdrop group -> global frames
 * Re-narrating therefore needs no manual retiming: anchors follow the new word timings.
 */
import {parseStoryboard, sceneAssetIds, type Storyboard} from '../../engine/storyboard/schema';
import {storyboardTimeline} from '../../engine/storyboard/timeline';
import {scheduleNarratedScenes, type PhraseTiming} from './scene-scheduler';

export type WordAnchor = {at: string; n?: number; offset?: number; edge?: 'start' | 'end'; beat?: string};
export type AnchorWord = {text: string; startSeconds: number; endSeconds: number};
export type AnchorPhrase = PhraseTiming & {firstWordIndex: number; endWordIndex: number};
export type AnchorResolution = {path: string; at: string; n: number; edge: 'start' | 'end'; beat: string | null; seconds: number; clock: 'scene-output' | 'scene-animation' | 'global'; scene: string | null; value: number; outsideScene: boolean};

const ANCHOR_KEYS = new Set(['at', 'n', 'offset', 'edge', 'beat']);
export const isAnchor = (v: unknown): v is WordAnchor =>
  !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as {at?: unknown}).at === 'string' && Object.keys(v).every(k => ANCHOR_KEYS.has(k));
export const hasAnchors = (v: unknown): boolean =>
  isAnchor(v) || (Array.isArray(v) ? v.some(hasAnchors) : !!v && typeof v === 'object' && Object.values(v).some(hasAnchors));

const replaceAnchors = (v: unknown, fn: (a: WordAnchor, path: string) => number, path = ''): unknown => {
  if (isAnchor(v)) return fn(v, path);
  if (Array.isArray(v)) return v.map((x, i) => replaceAnchors(x, fn, `${path}[${i}]`));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, replaceAnchors(x, fn, path ? `${path}.${k}` : k)]));
  return v;
};

/** Timing-only stand-in: same scenes, cues and durations, with group content and anchored scene fields neutralised. */
const skeleton = (raw: Record<string, unknown>) => {
  const placeholder = {id: 'anchor-skeleton', effects: [{id: 'p', type: 'particles', count: 1, seed: 0, startFrame: 0, endFrame: 1, emitter: {x: .5, y: .5},
    lifetimeFrames: [2, 2], velocity: {angleDegrees: 0, speed: [0, 0]}, radius: [.001, .001], colors: ['#ffffff']}]};
  const groups = (raw.groups as Array<Record<string, unknown>> | undefined)?.map(g => ({id: g.id, width: g.width, height: g.height, layers: [placeholder]}));
  const scenes = (raw.scenes as Array<Record<string, unknown>>).map(({sounds: _s, camera: _c, ...scene}) => ({...scene, camera: {preset: 'static'}}));
  return {...raw, groups, scenes};
};

/** Parse for validation and timing. Boards without anchors parse exactly as before. */
export const parseAnchoredStoryboard = (raw: unknown): Storyboard =>
  hasAnchors(raw) ? parseStoryboard(skeleton(raw as Record<string, unknown>)) : parseStoryboard(raw);

const norm = (s: string) => s.toLowerCase().replace(/[’]/g, "'").replace(/[^\p{L}\p{N}'-]+/gu, ' ').trim();

/**
 * Anchors a few frames apart can round onto the same frame when a scene's animation clock is compressed
 * (a slower take). Keyframe lists must strictly increase, so nudge later keys forward by one frame and
 * keep effect windows non-empty. Deterministic; every nudge is reported as a warning.
 */
const keepOrder = (node: unknown, path: string, warnings: string[]): void => {
  if (Array.isArray(node)) {
    const keyed = !path.endsWith('.sounds') && !path.endsWith('.musicDropouts') && node.length > 1 && node.every(k => k && typeof k === 'object' && typeof (k as {frame?: unknown}).frame === 'number');
    if (keyed) {
      for (let i = 1; i < node.length; i++) {
        const prev = (node[i - 1] as {frame: number}).frame, key = node[i] as {frame: number};
        if (key.frame <= prev) { warnings.push(`${path}[${i}]: nudged frame ${key.frame} to ${prev + 1} to keep keys increasing`); key.frame = prev + 1; }
      }
    }
    node.forEach((v, i) => keepOrder(v, `${path}[${i}]`, warnings));
    return;
  }
  if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.startFrame === 'number' && typeof o.endFrame === 'number' && o.endFrame <= o.startFrame) {
      warnings.push(`${path}: nudged endFrame ${o.endFrame} to ${o.startFrame + 1}`);
      o.endFrame = o.startFrame + 1;
    }
    for (const [k, v] of Object.entries(o)) keepOrder(v, path ? `${path}.${k}` : k, warnings);
  }
};

export const resolveWordAnchors = (raw: unknown, timing: {phraseTimings: AnchorPhrase[]; wordTimings: AnchorWord[]}) => {
  if (!hasAnchors(raw)) {
    const source = parseStoryboard(raw);
    return {source, schedule: scheduleNarratedScenes(source, timing.phraseTimings), resolutions: [] as AnchorResolution[], warnings: [] as string[]};
  }
  const board = raw as Record<string, unknown>;
  const timed = parseStoryboard(skeleton(board)), fps = timed.format.fps;
  const scheduled = scheduleNarratedScenes(timed, timing.phraseTimings).storyboard, timeline = storyboardTimeline(scheduled);
  const words = timing.wordTimings.map(w => ({...w, key: norm(w.text)}));
  const resolutions: AnchorResolution[] = [], warnings: string[] = [];

  const findSeconds = (a: WordAnchor, scopeBeat: string | null, path: string) => {
    const range = scopeBeat ? timing.phraseTimings.filter(p => p.beatId === scopeBeat) : null;
    if (range && !range.length) throw Error(`${path}: anchor beat "${scopeBeat}" has no narration`);
    const from = range ? Math.min(...range.map(p => p.firstWordIndex)) : 0, to = range ? Math.max(...range.map(p => p.endWordIndex)) : words.length;
    const target = norm(a.at).split(' '), n = a.n ?? 1;
    let seen = 0;
    for (let i = from; i + target.length <= to; i++) {
      if (target.every((t, j) => words[i + j].key === t) && ++seen === n) return a.edge === 'end' ? words[i + target.length - 1].endSeconds : words[i].startSeconds;
    }
    throw Error(`${path}: word "${a.at}" (occurrence ${n}) not found in ${scopeBeat ? `beat "${scopeBeat}"` : 'the narration'}`);
  };

  // Which scene clock owns each group (and with what subject time offset).
  const owners = new Map<string, Array<{scene: number; timeOffset: number}>>();
  scheduled.scenes.forEach((scene, i) => {
    const subjects = scene.template === 'summary' ? scene.config.subjects : scene.template === 'comparison' ? [scene.config.left, scene.config.right] : [scene.config.primary];
    for (const id of sceneAssetIds(scene)) {
      const subject = subjects.find(s => s?.asset === id);
      owners.set(id, [...(owners.get(id) ?? []), {scene: i, timeOffset: subject?.timeOffset ?? 0}]);
    }
  });
  const backdropGroup = (board.backdrop as {group?: string} | undefined)?.group;

  const resolve = (a: WordAnchor, path: string, clock: AnchorResolution['clock'], sceneIndex: number | null, timeOffset = 0) => {
    const scene = sceneIndex === null ? null : scheduled.scenes[sceneIndex];
    const scopeBeat = a.beat ?? scene?.narrationCue?.beatId ?? null;
    const seconds = findSeconds(a, scopeBeat, path), absolute = Math.round(seconds * fps) + (a.offset ?? 0);
    let value = absolute, outside = false;
    if (scene && sceneIndex !== null) {
      const local = absolute - timeline[sceneIndex].startFrame;
      outside = local < 0 || local >= scene.durationFrames;
      const animation = scene.animationDurationFrames ?? scene.durationFrames;
      value = clock === 'scene-output' ? local : Math.round(local * (animation - 1) / Math.max(1, scene.durationFrames - 1)) + timeOffset;
      if (outside) warnings.push(`${path}: "${a.at}" resolves outside scene ${scene.id} (local frame ${local})`);
    }
    if (value < 0) { warnings.push(`${path}: clamped ${value} to 0`); value = 0; }
    resolutions.push({path, at: a.at, n: a.n ?? 1, edge: a.edge ?? 'start', beat: scopeBeat, seconds, clock, scene: scene?.id ?? null, value, outsideScene: outside});
    return value;
  };

  const resolved = replaceAnchors(board, (a, path) => {
    const scene = path.match(/^scenes\[(\d+)\]\.(camera|sounds)/);
    if (scene) return resolve(a, path, 'scene-output', Number(scene[1]));
    const group = path.match(/^groups\[(\d+)\]/);
    if (group) {
      const id = (board.groups as Array<{id: string}>)[Number(group[1])].id;
      if (id === backdropGroup) return resolve(a, path, 'global', null);
      const users = owners.get(id) ?? [];
      const owner = users.length === 1 ? users[0] : users.find(u => scheduled.scenes[u.scene].narrationCue?.beatId === a.beat);
      if (!owner) throw Error(`${path}: group "${id}" is used by ${users.length} scenes; add "beat" to choose which scene's clock the anchor uses`);
      return resolve(a, path, 'scene-animation', owner.scene, owner.timeOffset);
    }
    throw Error(`${path}: word anchors are only supported in scene cameras, scene sounds and groups`);
  }) as Record<string, unknown>;
  keepOrder(resolved, '', warnings);
  const source = parseStoryboard(resolved);
  return {source, schedule: scheduleNarratedScenes(source, timing.phraseTimings), resolutions, warnings};
};
