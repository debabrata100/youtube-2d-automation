import {describe, it, expect} from 'vitest';
import {existsSync, readFileSync} from 'node:fs';
import {easeMotion} from '../engine/motion/primitives/schema';
import {trackAt} from '../engine/motion/layers';
import {SAMPLE_RATE, SFX_IDS, encodeWav, synthMusicBed, synthSfx} from '../audio/synth';
import {captionsFromProviderTiming} from '../captions/provider-timing';
import {activeWordIndex} from '../captions/timing';
import {captionStyleSchema} from '../captions/schema';
import {storyScriptSchema} from '../storytelling/schema';
import {parseStoryboard} from '../engine/storyboard/schema';
import {contrastRatio, getTheme, themeIds} from '../engine/style/theme';
import {mixPlanSchema} from '../../scripts/lib/mix-audio';
import script from '../../stories/volcano-elevenlabs-a.json';

describe('anticipation and overshoot easing', () => {
  it('back easings start at 0, end at 1 and leave the unit range in between', () => {
    for (const e of ['ease-out-back', 'ease-in-back', 'ease-in-out-back'] as const) {
      expect(easeMotion(0, e)).toBeCloseTo(0, 10);
      expect(easeMotion(1, e)).toBeCloseTo(1, 10);
    }
    expect(Math.max(...Array.from({length: 101}, (_, i) => easeMotion(i / 100, 'ease-out-back')))).toBeGreaterThan(1.05);
    expect(Math.min(...Array.from({length: 101}, (_, i) => easeMotion(i / 100, 'ease-in-back')))).toBeLessThan(-.05);
  });
  it('keeps the legacy easings bit-identical', () => {
    expect(easeMotion(.3, 'smoothstep')).toBe(.3 * .3 * (3 - 2 * .3));
    expect(easeMotion(.3, 'ease-out-cubic')).toBe(1 - .7 ** 3);
  });
  it('applies per-key easing only to the segment arriving at that key', () => {
    const plain = [{frame: 0, value: 0}, {frame: 10, value: 1}];
    const back = [{frame: 0, value: 0}, {frame: 10, value: 1, ease: 'ease-out-back' as const}];
    expect(trackAt(5, plain, 0)).toBe(.5);
    expect(trackAt(8, back, 0)).toBeGreaterThan(1);
    expect(trackAt(12, back, 0)).toBe(1);
  });
});

describe('procedural audio', () => {
  it.each(SFX_IDS)('%s is deterministic, bounded and audible', id => {
    const a = synthSfx(id), b = synthSfx(id);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(SAMPLE_RATE * .05);
    let peak = 0, energy = 0;
    for (const v of a) { peak = Math.max(peak, Math.abs(v)); energy += v * v; }
    expect(peak).toBeLessThanOrEqual(1);
    expect(energy / a.length).toBeGreaterThan(1e-5);
  });
  it('music bed has the requested length and fades in and out', () => {
    const bed = synthMusicBed(3, 1);
    expect(bed.length).toBe(3 * SAMPLE_RATE);
    expect(Math.abs(bed[0])).toBeLessThan(.01);
    expect(Math.abs(bed.at(-1)!)).toBeLessThan(.01);
    expect(synthMusicBed(3, 1)).toEqual(bed);
  });
  it('encodes a valid 16-bit mono PCM WAV', () => {
    const wav = encodeWav(Float32Array.from([0, .5, -.5, 1]));
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(SAMPLE_RATE);
    expect(wav.readUInt32LE(40)).toBe(8);
    expect(wav.readInt16LE(46)).toBe(16384);
  });
  it('validates mix plans', () => {
    const plan = {durationSeconds: 15, narration: 'n.wav', music: {kind: 'generated', seed: 1}, musicGainDb: -20, duckRatio: 8, sfx: [{sound: 'boom', startSeconds: 8, gainDb: -12}], speech: [[0, 1]], targetLufs: -14, truePeakDb: -1.5};
    expect(mixPlanSchema.parse(plan).sfx).toHaveLength(1);
    expect(mixPlanSchema.safeParse({...plan, sfx: [{sound: 'laser', startSeconds: 1, gainDb: 0}]}).success).toBe(false);
    expect(mixPlanSchema.safeParse({...plan, targetLufs: -5}).success).toBe(false);
  });
  it('keeps synthesis free of unseeded randomness', () => {
    expect(readFileSync('src/audio/synth.ts', 'utf8')).not.toMatch(/Math\.random|Date\.now/);
  });
});

// Uses the approved provider alignment, which is a local git-ignored file; skipped where it is absent.
const ALIGNMENT = 'jobs/volcano-m2-3-4-final/audio/narration-metadata.json';
describe.skipIf(!existsSync(ALIGNMENT))('word-level captions', () => {
  const story = storyScriptSchema.parse(script);
  const metadata = JSON.parse(readFileSync(ALIGNMENT, 'utf8'));
  const mapping = captionsFromProviderTiming(story, metadata.alignment, 13.1425, 30);
  it('attaches provider word timings to every cue, matching the displayed tokens', () => {
    expect(mapping.cues.flatMap(c => c.words ?? [])).toHaveLength(28);
    for (const cue of mapping.cues) {
      expect(cue.words!.length).toBe(cue.lines.join(' ').split(' ').length);
      for (const w of cue.words!) { expect(w.startFrame).toBeGreaterThanOrEqual(cue.startFrame); expect(w.endFrame).toBeGreaterThan(w.startFrame); }
    }
  });
  it('highlights the most recently started word and nothing before the first', () => {
    const words = mapping.cues[0].words!;
    expect(activeWordIndex(words, words[0].startFrame - 1)).toBe(-1);
    expect(activeWordIndex(words, words[1].startFrame)).toBe(1);
    expect(activeWordIndex(words, 10_000)).toBe(words.length - 1);
  });
  it('defaults to phrase captions and themes opt into a legible word highlight', () => {
    expect(captionStyleSchema.parse({}).highlight).toBe('none');
    for (const id of themeIds()) {
      const c = getTheme(id).caption;
      expect(captionStyleSchema.parse(c).highlight).toBe('word');
      expect(contrastRatio(c.highlightColor!, c.outlineColor)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('volcano sound design contract', () => {
  const board = parseStoryboard(JSON.parse(readFileSync('storyboards/volcano-kit.json', 'utf8')));
  it('cues sound in every scene and requests a generated music bed at the YouTube loudness target', () => {
    expect(board.scenes.every(s => (s.sounds?.length ?? 0) > 0)).toBe(true);
    expect(board.audio).toMatchObject({music: 'generated-pad', targetLufs: -14});
  });
  it('rejects unknown sounds and out-of-range gains', () => {
    const bad = JSON.parse(readFileSync('storyboards/volcano-kit.json', 'utf8'));
    bad.scenes[0].sounds = [{sound: 'laser', frame: 0}];
    expect(() => parseStoryboard(bad)).toThrow();
    bad.scenes[0].sounds = [{sound: 'boom', frame: 0, gainDb: 20}];
    expect(() => parseStoryboard(bad)).toThrow();
  });
  it('has no sound or music configuration in older storyboards (legacy mux path)', () => {
    const old = parseStoryboard(JSON.parse(readFileSync('storyboards/volcano-motion-prototype.json', 'utf8')));
    expect(old.audio).toBeUndefined();
    expect(old.scenes.every(s => !s.sounds)).toBe(true);
  });
});
