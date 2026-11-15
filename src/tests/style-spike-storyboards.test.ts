import {describe, it, expect} from 'vitest';
import {existsSync, readFileSync} from 'node:fs';
import {parseStoryboard} from '../engine/storyboard/schema';
import {cameraPresetAt} from '../engine/camera/presets';
import {scheduleNarratedScenes} from '../storytelling/timing/scene-scheduler';
import {storyScriptSchema} from '../storytelling/schema';
import {compilePuffs, puffAt} from '../engine/motion/primitives/puffs';
import {compileEmitter, emittedParticleAt} from '../engine/motion/primitives/particles';
import prototype from '../../storyboards/volcano-motion-prototype.json';
import variantB from '../../storyboards/volcano-style-b.json';
import variantC from '../../storyboards/volcano-style-c.json';
import script from '../../stories/volcano-elevenlabs-a.json';

const base = parseStoryboard(prototype), b = parseStoryboard(variantB), c = parseStoryboard(variantC);
const story = storyScriptSchema.parse(script);
const phrases = story.beats.map((beat, i) => ({beatId: beat.id, phraseIndex: 0, text: beat.narration, startSeconds: [0, 2.322, 5.12, 8.208, 10.716][i], endSeconds: [1.7, 4.6, 7.7, 10.2, 12.86][i]}));
const durations = [66, 84, 93, 75, 132];

describe.each([['B', b], ['C', c]] as const)('variant %s contracts', (_, board) => {
  it('keeps scene ids, templates, narration cues and the narration-driven schedule', () => {
    expect(board.scenes.map(s => [s.id, s.template, s.narrationCue])).toEqual(base.scenes.map(s => [s.id, s.template, s.narrationCue]));
    expect(scheduleNarratedScenes(board, phrases).storyboard.scenes.map(s => s.durationFrames)).toEqual(durations);
  });
  it('matches camera poses at every scene handoff', () => {
    for (let i = 1; i < board.scenes.length; i++) {
      expect(cameraPresetAt(board.scenes[i - 1].camera, durations[i - 1] - 1, durations[i - 1], 1080, 1920)).toEqual(cameraPresetAt(board.scenes[i].camera, 0, durations[i], 1080, 1920));
    }
  });
  it('references only asset files that exist', () => {
    for (const asset of board.assets) expect(existsSync('assets/' + asset.path)).toBe(true);
  });
  it('emits a visible smoke column at the payoff and keeps it through the closing scene', () => {
    const group = board.groups!.find(g => g.layers.some(l => l.effects?.some(e => e.id === 'smoke-column')))!;
    const column = group.layers.flatMap(l => l.effects ?? []).find(e => e.id === 'smoke-column')!;
    if (column.type !== 'puffs') throw Error('smoke column must be a puffs effect');
    const visibleAt = (frame: number) => compilePuffs(column).filter(p => puffAt(p, column, frame).active).length;
    expect(visibleAt(30)).toBeGreaterThanOrEqual(5);
    expect(visibleAt(150)).toBeGreaterThanOrEqual(12);
  });
  it('terminates ejecta emission before the closing scene ends', () => {
    for (const effect of board.groups!.flatMap(g => g.layers.flatMap(l => l.effects ?? []))) {
      if (effect.type !== 'particles') continue;
      for (const p of compileEmitter(effect)) expect(emittedParticleAt(p, effect, 179).active).toBe(false);
    }
  });
});

describe('variant-specific constraints', () => {
  it('B leaves the approved painted asset registry untouched', () => {
    expect(b.assets).toEqual(base.assets);
    for (const group of base.groups!) {
      const next = b.groups!.find(g => g.id === group.id)!;
      expect(next.layers.filter(l => group.layers.some(o => o.id === l.id))).toEqual(group.layers);
    }
  });
  it('C uses only the hand-authored vector set over an opaque backdrop', () => {
    expect(c.assets.every(a => a.type === 'svg' && a.path.startsWith('illustrations/vector-volcano-v1/'))).toBe(true);
    expect(c.assets.find(a => a.id === c.backdrop!.asset)!.transparent).toBe(false);
    for (const asset of c.assets) expect(readFileSync('assets/' + asset.path, 'utf8')).not.toMatch(/<script|href="http|xlink:href="http/i);
  });
});
