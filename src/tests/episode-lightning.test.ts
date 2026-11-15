import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {estimateAlignment} from '../storytelling/timing/estimate';
import {storyScriptSchema, words} from '../storytelling/schema';
import {validateStory} from '../storytelling/validate';
import {captionsFromProviderTiming} from '../captions/provider-timing';
import {scheduleNarratedScenes} from '../storytelling/timing/scene-scheduler';
import {parseStoryboard} from '../engine/storyboard/schema';
import {cameraPresetAt} from '../engine/camera/presets';
import {contrastRatio, getTheme} from '../engine/style/theme';
import {wrapPhrase} from '../captions/timing';
import volcanoScript from '../../stories/volcano-elevenlabs-a.json';

const raw = readFileSync('storyboards/lightning.json', 'utf8');
const board = parseStoryboard(JSON.parse(raw));
const story = validateStory(storyScriptSchema.parse(JSON.parse(readFileSync('stories/lightning-a.json', 'utf8'))), board);
const text = story.beats.map(b => b.narration).join(' ');

describe('planning timing estimate', () => {
  it('reproduces the approved volcano take within 0.3 s', () => {
    const v = storyScriptSchema.parse(volcanoScript);
    expect(Math.abs(estimateAlignment(v.beats.map(b => b.narration).join(' ')).character_end_times_seconds.at(-1)! - 13.142)).toBeLessThan(.3);
  });
  it('is monotonic, covers every character and maps onto the script words', () => {
    const a = estimateAlignment(text);
    expect(a.characters.join('')).toBe(text);
    for (let i = 1; i < a.characters.length; i++) expect(a.character_start_times_seconds[i]).toBeGreaterThanOrEqual(a.character_end_times_seconds[i - 1] - 1e-9);
    const mapping = captionsFromProviderTiming(story, a, a.character_end_times_seconds.at(-1)! + .05, 30);
    expect(mapping.wordTimings).toHaveLength(words(text).length);
  });
});

describe('lightning episode contracts', () => {
  it('is a 38 s, 7-scene storyboard with one beat per scene', () => {
    expect(board.scenes).toHaveLength(7);
    expect(board.scenes.reduce((n, s) => n + s.durationFrames, 0)).toBe(38 * 30);
    expect(story.durationSeconds).toBe(38);
  });
  it('fits the estimated narration with ending room and schedules without exceptions', () => {
    const a = estimateAlignment(text), spoken = a.character_end_times_seconds.at(-1)! + .05;
    expect(spoken).toBeLessThan(38 - .2);
    const schedule = scheduleNarratedScenes(board, captionsFromProviderTiming(story, a, spoken, 30).phraseTimings);
    expect(schedule.exceptions).toEqual([]);
    const d = schedule.storyboard.scenes.map(s => s.durationFrames);
    for (let i = 1; i < d.length; i++) {
      expect(cameraPresetAt(board.scenes[i - 1].camera, d[i - 1] - 1, d[i - 1], 1080, 1920)).toEqual(cameraPresetAt(board.scenes[i].camera, 0, d[i], 1080, 1920));
    }
  });
  it('keeps every caption phrase within two safe lines', () => {
    for (const beat of story.beats) for (const phrase of beat.phrases) expect(wrapPhrase(phrase).length).toBeLessThanOrEqual(2);
  });
  it('uses only the kit and theme colours, with sound in every scene and a generated music bed', () => {
    expect(raw).not.toMatch(/"#[0-9a-fA-F]{6}"/);
    expect(board.assets).toEqual([]);
    expect(board.scenes.every(s => (s.sounds?.length ?? 0) > 0)).toBe(true);
    expect(board.audio?.music).toBe('generated-pad');
    expect(board.scenes.every(s => s.template === 'hero-reveal')).toBe(true);
  });
  it('labels stay readable on a phone', () => {
    for (const scene of board.scenes) {
      if (scene.template !== 'hero-reveal') continue;
      const g = board.groups!.find(x => x.id === scene.config.primary.asset)!;
      for (const a of g.annotations ?? []) expect(a.size * (scene.config.primary.size * 1080 / g.width) * (360 / 1080)).toBeGreaterThanOrEqual(12);
    }
  });
  it('storm theme meets WCAG AA for labels, captions and the word highlight', () => {
    const t = getTheme('explainer-storm');
    expect(contrastRatio(t.palette.label.fg, t.palette.label.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t.caption.textColor, t.caption.outlineColor)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t.caption.highlightColor!, t.caption.outlineColor)).toBeGreaterThanOrEqual(4.5);
  });
});
