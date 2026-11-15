import {describe, it, expect} from 'vitest';
import {hasAnchors, isAnchor, parseAnchoredStoryboard, resolveWordAnchors} from '../storytelling/timing/anchors';
import {parseStoryboard} from '../engine/storyboard/schema';

const glow = (id: string, extra: object = {}) => ({id, kit: {type: 'glow', x: .5, y: .5, rx: .1, ry: .1}, ...extra});
const particle = (id: string, start: unknown, end: unknown) => ({id, type: 'particles', count: 4, seed: 1, startFrame: start, endFrame: end, emitter: {x: .5, y: .5},
  lifetimeFrames: [10, 20], velocity: {angleDegrees: -90, speed: [.001, .002]}, radius: [.003, .004], colors: ['#ffffff']});
const scene = (id: string, beat: string, group: string, extra: object = {}) => ({id, template: 'hero-reveal', durationFrames: 60, caption: {text: id},
  camera: {preset: 'static'}, motion: {preset: 'still'}, transitionFrames: 0, narrationCue: {beatId: beat, phraseIndex: 0, edge: 'start'},
  config: {primary: {asset: group, x: .5, y: .5, size: .9}}, ...extra});
const board = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: '2.1', projectId: 'anchor-test', title: 'Anchors', themeId: 'explainer-dusk', format: {width: 1080, height: 1920, fps: 30},
  styleId: 'cinematic-illustrated', assets: [], crossfadeFrames: 8, narrationTiming: {minimumSceneFrames: 45, maximumDeviationSeconds: .2},
  backdrop: {group: 'bg'},
  groups: [
    {id: 'bg', width: 1080, height: 1920, layers: [glow('sky', {opacity: [{frame: {at: 'world'}, value: 0}, {frame: {at: 'world', offset: 10}, value: 1}]})]},
    {id: 'g1', width: 100, height: 100, layers: [glow('a')]},
    {id: 'g2', width: 100, height: 100, layers: [{id: 'fx', effects: [particle('burst', {at: 'flash', n: 2}, {at: 'flash', n: 2, offset: 12})]}],
     annotations: [{id: 'l', text: 'Label', x: 50, y: 50, opacity: [{frame: 0, value: 0}, {frame: {at: 'goes'}, value: 1}]}]},
  ],
  scenes: [
    scene('one', 'b1', 'g1', {sounds: [{sound: 'pop', frame: {at: 'bright', edge: 'end'}}]}),
    scene('two', 'b2', 'g2', {camera: {preset: 'static', keyframes: [{frame: 0}, {frame: {at: 'goes'}, zoom: 1.2}]}}),
  ],
  ...overrides,
});
// "hello bright world" (b1) then "flash goes flash" (b2)
const wordTimings = [['hello', 0, .4], ['bright', .5, 1], ['world', 1.2, 1.5], ['flash', 2, 2.4], ['goes', 2.5, 2.8], ['flash', 3, 3.5]]
  .map(([text, startSeconds, endSeconds]) => ({text: text as string, startSeconds: startSeconds as number, endSeconds: endSeconds as number}));
const phraseTimings = [
  {beatId: 'b1', phraseIndex: 0, text: 'hello bright world', startSeconds: 0, endSeconds: 1.5, firstWordIndex: 0, endWordIndex: 3},
  {beatId: 'b2', phraseIndex: 0, text: 'flash goes flash', startSeconds: 2, endSeconds: 3.5, firstWordIndex: 3, endWordIndex: 6},
];

describe('word anchors', () => {
  it('recognises anchors without confusing lifetime keys', () => {
    expect(isAnchor({at: 'flash', n: 2})).toBe(true);
    expect(isAnchor({at: .5, value: 1})).toBe(false);
    expect(isAnchor({at: 'x', value: 1})).toBe(false);
    expect(hasAnchors(board())).toBe(true);
    expect(hasAnchors(parseStoryboard(board({groups: [{id: 'bg', width: 1080, height: 1920, layers: [glow('s')]}, {id: 'g1', width: 100, height: 100, layers: [glow('a')]}, {id: 'g2', width: 100, height: 100, layers: [glow('b')]}],
      scenes: [scene('one', 'b1', 'g1'), scene('two', 'b2', 'g2')]})))).toBe(false);
  });
  it('parses an anchored board for validation and timing', () => {
    const timed = parseAnchoredStoryboard(board());
    expect(timed.scenes.map(s => s.durationFrames)).toEqual([60, 60]);
  });
  it('resolves into each field clock: scene output, scene animation and global', () => {
    const r = resolveWordAnchors(board(), {phraseTimings, wordTimings});
    // Scheduling: scene two starts at round(2.0 s * 30 - 3.5) = 57 -> durations 57 / 63.
    expect(r.schedule.storyboard.scenes.map(s => s.durationFrames)).toEqual([57, 63]);
    const byPath = Object.fromEntries(r.resolutions.map(x => [x.path, x]));
    expect(byPath['scenes[0].sounds[0].frame'].value).toBe(30);                          // "bright" end 1.0 s -> output frame 30
    expect(byPath['scenes[1].camera.keyframes[1].frame'].value).toBe(18);                 // "goes" 2.5 s -> 75 - 57
    expect(byPath['groups[2].layers[0].effects[0].startFrame'].value).toBe(Math.round(33 * 59 / 62)); // 2nd "flash" 3.0 s, animation clock
    expect(byPath['groups[2].layers[0].effects[0].endFrame'].value).toBe(Math.round(45 * 59 / 62));
    expect(byPath['groups[0].layers[0].opacity[0].frame']).toMatchObject({clock: 'global', value: 36}); // "world" 1.2 s, backdrop
    expect(byPath['groups[0].layers[0].opacity[1].frame'].value).toBe(46);
    expect(r.source.scenes[1].camera.keyframes![1].frame).toBe(18);
    expect(r.warnings).toEqual([]);
  });
  it('follows new word timings without editing the storyboard', () => {
    const later = wordTimings.map(w => (w.text === 'goes' ? {...w, startSeconds: 3.1, endSeconds: 3.3} : w.startSeconds === 3 ? {...w, startSeconds: 3.4, endSeconds: 3.6} : w));
    const a = resolveWordAnchors(board(), {phraseTimings, wordTimings}), b = resolveWordAnchors(board(), {phraseTimings, wordTimings: later});
    const cam = (r: typeof a) => r.source.scenes[1].camera.keyframes![1].frame;
    expect(cam(b) - cam(a)).toBe(18);
  });
  it('matches multi-word phrases and end edges', () => {
    const b = board();
    (b.scenes[1] as {sounds?: unknown}).sounds = [{sound: 'boom', frame: {at: 'goes flash', edge: 'end'}}];
    const r = resolveWordAnchors(b, {phraseTimings, wordTimings});
    expect(r.resolutions.find(x => x.path === 'scenes[1].sounds[0].frame')!.value).toBe(Math.round(3.5 * 30) - 57);
  });
  it('fails clearly for missing words and ambiguous shared groups', () => {
    const missing = board();
    (missing.scenes[0] as {sounds?: unknown}).sounds = [{sound: 'pop', frame: {at: 'thunder'}}];
    expect(() => resolveWordAnchors(missing, {phraseTimings, wordTimings})).toThrow('"thunder"');
    const shared = board({scenes: [scene('one', 'b1', 'g2'), scene('two', 'b2', 'g2')]});
    expect(() => resolveWordAnchors(shared, {phraseTimings, wordTimings})).toThrow('add "beat"');
  });
  it('leaves boards without anchors exactly as before', () => {
    const plain = board({groups: [{id: 'bg', width: 1080, height: 1920, layers: [glow('s')]}, {id: 'g1', width: 100, height: 100, layers: [glow('a')]}, {id: 'g2', width: 100, height: 100, layers: [glow('b')]}],
      scenes: [scene('one', 'b1', 'g1'), scene('two', 'b2', 'g2')]});
    const r = resolveWordAnchors(plain, {phraseTimings, wordTimings});
    expect(r.source).toEqual(parseStoryboard(plain));
    expect(r.resolutions).toEqual([]);
  });
  it('nudges adjacent anchors that collapse on a compressed animation clock', () => {
    const b = board();
    (b.groups[2] as {annotations: Array<{opacity: unknown}>}).annotations[0].opacity = [{frame: {at: 'goes'}, value: 0}, {frame: {at: 'goes', offset: 1}, value: 1}];
    Object.assign(b.scenes[0], {durationFrames: 75}); Object.assign(b.scenes[1], {durationFrames: 45}); // two: nominal 45 -> scheduled 63, clock scale 44/62
    const r = resolveWordAnchors(b, {phraseTimings, wordTimings});
    const keys = r.source.groups![2].annotations![0].opacity!.map(k => k.frame);
    expect(keys).toEqual([13, 14]);
    expect(r.warnings.some(w => w.includes('nudged frame 13 to 14'))).toBe(true);
  });
});
