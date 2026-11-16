import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseStoryboard} from '../engine/storyboard/schema';
import {cueGraph, dropoutExpression, mixPlanSchema} from '../../scripts/lib/mix-audio';

const board = () => JSON.parse(readFileSync('storyboards/volcano-kit.json', 'utf8'));

describe('per-section music cues', () => {
  it('validates cue scenes, order and requires cues for music "cues"', () => {
    const b = board(), ids = b.scenes.map((s: {id: string}) => s.id);
    b.audio = {...b.audio, music: 'cues', musicCues: [{source: 'assets/music/a.mp3', scene: ids[0]}, {source: 'assets/music/b.mp3', scene: ids[2], offsetSeconds: 4}],
      musicDropouts: [{scene: ids[1], frame: 12, seconds: 1}]};
    const parsed = parseStoryboard(b);
    expect(parsed.audio?.musicCues?.[1]).toMatchObject({offsetSeconds: 4, gainDb: 0, loop: true});
    expect(() => parseStoryboard({...b, audio: {...b.audio, musicCues: []}})).toThrow(/at least one/);
    expect(() => parseStoryboard({...b, audio: {...b.audio, musicCues: [b.audio.musicCues[1], b.audio.musicCues[0]]}})).toThrow(/scene order/);
    expect(() => parseStoryboard({...b, audio: {...b.audio, musicDropouts: [{scene: 'nope', frame: 0, seconds: 1}]}})).toThrow(/Unknown scene/);
  });

  it('old boards keep working unchanged', () => {
    expect(parseStoryboard(board()).audio?.music).toBe('generated-pad');
  });

  it('dropout gain is 1 outside, floor inside, with ramps', () => {
    const expr = dropoutExpression([[10, 11]], -24);
    const f = (t: number) => Function('t', 'clip', 'min', `return ${expr}`)(t, (x: number, a: number, b: number) => Math.min(b, Math.max(a, x)), Math.min);
    expect(f(5)).toBeCloseTo(1); expect(f(10.5)).toBeCloseTo(10 ** (-24 / 20)); expect(f(9.9)).toBeGreaterThan(f(10.5)); expect(f(11.3)).toBeCloseTo(1);
    expect(dropoutExpression([], -24)).toBe('1');
  });

  it('cue graph cross-fades each cue into the next and offsets into the track', () => {
    const music = mixPlanSchema.shape.music.parse({kind: 'cues', cues: [
      {source: 'a.mp3', startSeconds: 0, endSeconds: 20, levelDb: -3},
      {source: 'b.mp3', startSeconds: 20, endSeconds: 60, offsetSeconds: 7, loop: false}]});
    const g = cueGraph(music as Extract<typeof music, {kind: 'cues'}>, 'job/audio', 60, 1);
    expect(g.count).toBe(2);
    expect(g.inputs).toEqual(['-stream_loop', '-1', '-ss', '0', '-i', 'job/audio/music-cue-0.mp3', '-ss', '7', '-i', 'job/audio/music-cue-1.mp3']);
    expect(g.graph[0]).toContain('atrim=0:21.500'); // runs 1.5 s past the next cue for the cross-fade
    expect(g.graph[0]).toContain('afade=t=out:st=20.000:d=1.500');
    expect(g.graph[1]).toContain('adelay=20000');
    expect(g.graph[1]).not.toContain('afade=t=out'); // the last cue ends with the shared final fade
    expect(g.graph.at(-1)).toMatch(/amix=inputs=2.*\[cues\]$/);
  });
});
