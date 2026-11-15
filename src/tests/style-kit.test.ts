import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {contrastRatio, getTheme, resolveThemeRefs, themeColor, themeIds, themeSchema} from '../engine/style/theme';
import {kitSchema} from '../engine/kit/schema';
import {blobPath, cloudLobes, mountainPoints, mountainSilhouette, ridgeLayer, smoothPath} from '../engine/kit/geometry';
import {layerSchema} from '../engine/storyboard/layers';
import {parseStoryboard, type Storyboard} from '../engine/storyboard/schema';
import {cameraPresetAt} from '../engine/camera/presets';
import {scheduleNarratedScenes} from '../storytelling/timing/scene-scheduler';
import {storyScriptSchema} from '../storytelling/schema';
import script from '../../stories/volcano-elevenlabs-a.json';
import prototype from '../../storyboards/volcano-motion-prototype.json';

const raw = (name: string) => readFileSync(`storyboards/${name}.json`, 'utf8');
const volcanoRaw = raw('volcano-kit'), waterRaw = raw('water-cycle-demo');
const volcano = parseStoryboard(JSON.parse(volcanoRaw)), water = parseStoryboard(JSON.parse(waterRaw)), base = parseStoryboard(prototype);

describe('theme tokens', () => {
  it('registers valid themes with unique ids', () => {
    expect(themeIds()).toEqual(expect.arrayContaining(['explainer-dusk', 'explainer-day']));
    for (const id of themeIds()) expect(themeSchema.safeParse(getTheme(id)).success).toBe(true);
  });
  it.each(['explainer-dusk', 'explainer-day'])('%s meets WCAG AA contrast for labels and captions', id => {
    const t = getTheme(id);
    expect(contrastRatio(t.palette.label.fg, t.palette.label.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t.caption.textColor, t.caption.outlineColor)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t.palette.text.fill, t.palette.text.outline)).toBeGreaterThanOrEqual(4.5);
  });
  it('computes known contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('resolves nested @role references and rejects unknown roles', () => {
    const t = getTheme('explainer-dusk');
    expect(resolveThemeRefs({a: ['@hot.core', {b: '@ridges.1'}], c: 'plain', d: 3}, t)).toEqual({a: [t.palette.hot.core, {b: t.palette.ridges[1]}], c: 'plain', d: 3});
    expect(() => themeColor(t, '@hot.lukewarm')).toThrow('Unknown theme colour');
    const bad = JSON.parse(volcanoRaw);
    bad.groups[1].layers[1].effects[0].colors.mid = '@smoke.purple';
    expect(() => parseStoryboard(bad)).toThrow('Unknown theme colour');
  });
});

describe('kit geometry is deterministic and well formed', () => {
  const cone = {cx: .5, baseY: .6, baseWidth: .8, height: .4, crater: .15, concavity: .5};
  it('places crater corners and base corners exactly', () => {
    const p = mountainPoints(cone, 1000, 1000);
    expect(p.TL.x).toBeCloseTo(440);
    expect(p.TR.x).toBeCloseTo(560);
    expect(p.topY).toBeCloseTo(200);
    expect(p.L).toEqual({x: 100, y: 600});
    expect(mountainSilhouette(cone, 1000, 1000).d).toMatch(/^M 100\.0 600\.0 C .* Z$/);
  });
  it('produces identical seeded shapes and different shapes for other seeds', () => {
    const r = (seed: number) => ridgeLayer({top: .5, bottom: .6, index: 1, layers: 3, peaks: 6, roughness: .5, seed}, 1080, 1920);
    expect(r(4)).toBe(r(4));
    expect(r(4)).not.toBe(r(5));
    expect(blobPath(0, 0, 10, 5, .2, 3)).toBe(blobPath(0, 0, 10, 5, .2, 3));
    expect(blobPath(0, 0, 10, 5, .2, 3).endsWith('Z')).toBe(true);
    expect(cloudLobes(300, 6, 2)).toEqual(cloudLobes(300, 6, 2));
  });
  it('smooths through every input point', () => {
    const d = smoothPath([{x: 0, y: 0}, {x: 10, y: 5}, {x: 20, y: 0}]);
    expect(d.startsWith('M 0.0 0.0')).toBe(true);
    expect(d.endsWith('20.0 0.0')).toBe(true);
  });
  it('validates kit configuration and layer combinations', () => {
    expect(kitSchema.safeParse({type: 'mountain', ...cone, part: 'middle'}).success).toBe(false);
    expect(kitSchema.safeParse({type: 'hologram'}).success).toBe(false);
    expect(layerSchema.safeParse({id: 'x', asset: 'a', kit: {type: 'sun', x: .5, y: .5, radius: .05}}).success).toBe(false);
    expect(layerSchema.safeParse({id: 'x', kit: {type: 'sun', x: .5, y: .5, radius: .05}}).success).toBe(true);
    const noTheme = JSON.parse(waterRaw);
    delete noTheme.themeId;
    expect(() => parseStoryboard(noTheme)).toThrow();
  });
  it('requires exactly one backdrop source', () => {
    const both = JSON.parse(waterRaw);
    both.backdrop = {group: 'backdrop', asset: 'missing'};
    expect(() => parseStoryboard(both)).toThrow('exactly one');
  });
});

describe('style lint for kit storyboards', () => {
  it.each([['volcano-kit', volcanoRaw], ['water-cycle-demo', waterRaw]])('%s uses only theme colours and no raster or file assets', (_, text) => {
    expect(text).not.toMatch(/"#[0-9a-fA-F]{6}"/);
    expect(JSON.parse(text).assets).toEqual([]);
  });
  const phonePx = (board: Storyboard) => board.scenes.flatMap(scene => {
    const subjects = scene.template === 'summary' ? scene.config.subjects : scene.template === 'comparison' ? [scene.config.left, scene.config.right] : [scene.config.primary];
    return subjects.flatMap(subject => {
      const group = board.groups!.find(g => g.id === subject.asset);
      return (group?.annotations ?? []).map(a => ({id: a.id, px: a.size * (subject.size * board.format.width / group!.width) * (360 / board.format.width)}));
    });
  });
  it.each([['volcano-kit', volcano], ['water-cycle-demo', water]] as const)('%s labels stay at least 12 px tall on a 360 px wide phone', (_, board) => {
    const sizes = phonePx(board);
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) expect(s.px).toBeGreaterThanOrEqual(12);
  });
  it('keeps generic kit source free of topic names and unseeded randomness', () => {
    for (const file of ['engine/kit/geometry.ts', 'engine/kit/KitElement.tsx', 'engine/kit/schema.ts', 'engine/style/theme.ts']) {
      expect(readFileSync('src/' + file, 'utf8')).not.toMatch(/Math\.random|Date\.now|volcano|magma|lava/i);
    }
  });
});

describe('kit volcano contracts', () => {
  const story = storyScriptSchema.parse(script);
  const phrases = story.beats.map((beat, i) => ({beatId: beat.id, phraseIndex: 0, text: beat.narration, startSeconds: [0, 2.322, 5.12, 8.208, 10.716][i], endSeconds: [1.7, 4.6, 7.7, 10.2, 12.86][i]}));
  const durations = [66, 84, 93, 75, 132];
  it('preserves scene ids, templates, narration cues and the narration-driven schedule', () => {
    expect(volcano.scenes.map(s => [s.id, s.template, s.narrationCue])).toEqual(base.scenes.map(s => [s.id, s.template, s.narrationCue]));
    expect(scheduleNarratedScenes(volcano, phrases).storyboard.scenes.map(s => s.durationFrames)).toEqual(durations);
  });
  it('matches camera poses at every scene handoff', () => {
    for (let i = 1; i < volcano.scenes.length; i++) {
      expect(cameraPresetAt(volcano.scenes[i - 1].camera, durations[i - 1] - 1, durations[i - 1], 1080, 1920)).toEqual(cameraPresetAt(volcano.scenes[i].camera, 0, durations[i], 1080, 1920));
    }
  });
  it('uses different themes for the two topics with the same kit', () => {
    expect(volcano.themeId).toBe('explainer-dusk');
    expect(water.themeId).toBe('explainer-day');
    const kinds = (b: Storyboard) => new Set(b.groups!.flatMap(g => g.layers.map(l => l.kit?.type).filter(Boolean)));
    expect([...kinds(water)].filter(k => kinds(volcano).has(k!)).length).toBeGreaterThanOrEqual(4);
  });
});
