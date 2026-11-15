import {describe, expect, it} from 'vitest';
import draft from '../../storyboards/volcano.draft.json';
import {createAssetRegistry} from '../engine/assets/registry';
import {parseStoryboard, sceneAssetIds} from '../engine/storyboard/schema';
import {storyboardDuration, storyboardSceneAt, storyboardTimeline} from '../engine/storyboard/timeline';
import {resolveTemplate} from '../engine/templates/registry';

// These contracts validate a preproduction draft, not file existence or art approval.
describe('volcano preproduction storyboard', () => {
  const board = parseStoryboard(draft);
  it('uses the existing schema, template registry and local asset-reference system', () => {
    expect(board.format).toEqual({width: 1080, height: 1920, fps: 30});
    const registry = createAssetRegistry(board.assets);
    expect(registry.list()).toHaveLength(8);
    for (const scene of board.scenes) {
      expect(typeof resolveTemplate(scene.template)).toBe('function');
      for (const id of sceneAssetIds(scene)) expect(registry.resolve(id).path).toMatch(/^illustrations\/volcano\/.+\.png$/);
    }
  });
  it('covers exactly 450 frames in the five educational stages without scheduling gaps', () => {
    expect(storyboardDuration(board)).toBe(450);
    const stages = ['volcano-exterior', 'magma-accumulation', 'magma-rise-and-gas', 'eruption', 'final-summary'];
    const ends = [75, 165, 270, 375, 450];
    expect(storyboardTimeline(board).map(entry => entry.startFrame)).toEqual([0, 75, 165, 270, 375]);
    for (let frame = 0; frame < 450; frame++) {
      const expected = ends.findIndex(end => frame < end);
      expect(storyboardSceneAt(board, frame).scene.id).toBe(stages[expected]);
    }
    expect(() => storyboardSceneAt(board, 450)).toThrow();
  });
  it('keeps registered layers aligned and within existing template capacity', () => {
    for (const scene of board.scenes) {
      const subjects = scene.template === 'summary' ? scene.config.subjects : scene.template === 'hero-reveal' ? [scene.config.primary] : [];
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects.length).toBeLessThanOrEqual(5);
      for (const subject of subjects) expect(subject).toMatchObject({x: .5, y: .59, size: .9});
    }
  });
});
