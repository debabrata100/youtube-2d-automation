import React from 'react';
import {describe, expect, it} from 'vitest';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import demo from '../../storyboards/generic-demo.json';
import legacy from '../plans/planet-formation.json';
import {parseStoryboard, storyboardSchema} from '../engine/storyboard/schema';
import {storyboardDuration, storyboardSceneAt, storyboardTimeline} from '../engine/storyboard/timeline';
import {createAssetRegistry, assetSchema} from '../engine/assets/registry';
import {resolveTemplate, templateRegistry} from '../engine/templates/registry';
import {cameraPresetAt, cameraSchema} from '../engine/camera/presets';
import {motionPresetAt, motionSchema, subjectEnvelope} from '../engine/motion/presets';
import {adaptPlanetFormation, LegacyStoryboard} from '../engine/storyboard/legacy';
import {PlanetFormation} from '../compositions/PlanetFormation';
import {parseScenePlan} from '../schemas/scene-plan';
import {validateAssetFiles} from '../../scripts/storyboard-assets';

describe('generic storyboard validation', () => {
  it('validates all five templates and fills deterministic defaults', () => {
    const board = parseStoryboard(demo);
    expect(board.scenes.map(scene => scene.template)).toEqual(Object.keys(templateRegistry));
    expect(board.scenes[0].camera.amount).toBe(.12);
    expect(board.scenes[1].motion.amplitude).toBe(.025);
    expect(parseStoryboard(demo)).toEqual(board);
  });
  it.each(['invalid', '__proto__', 'accretion'])('rejects unknown template %s', template => {
    const raw = structuredClone(demo); raw.scenes[0].template = template;
    expect(storyboardSchema.safeParse(raw).success).toBe(false);
    expect(() => resolveTemplate(template)).toThrow('Unknown scene template');
  });
  it.each([0, -1, 1.5, 11])('rejects invalid duration %s', durationFrames => {
    const raw = structuredClone(demo); raw.scenes[0].durationFrames = durationFrames;
    expect(() => parseStoryboard(raw)).toThrow();
  });
  it('reports missing references and duplicate IDs with paths', () => {
    const raw = structuredClone(demo); raw.assets.pop(); raw.scenes[1].id = raw.scenes[0].id;
    const result = storyboardSchema.safeParse(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.message.includes('Missing asset: rocky-subject'))).toBe(true);
      expect(result.error.issues.some(issue => issue.path.join('.') === 'scenes.1.id')).toBe(true);
    }
  });
  it('rejects mismatched template payloads, unknown fields and executable values', () => {
    expect(storyboardSchema.safeParse({...demo, run: 'eval()'}).success).toBe(false);
    const raw = structuredClone(demo); raw.scenes[0].template = 'comparison';
    expect(storyboardSchema.safeParse(raw).success).toBe(false);
    expect(storyboardSchema.safeParse({...demo, scenes: [{...demo.scenes[0], camera: {preset: 'eval()'}}]}).success).toBe(false);
  });
  it('rejects unusable envelopes and incompatible motion', () => {
    expect(storyboardSchema.safeParse({...demo, scenes: [{...demo.scenes[0], durationFrames: 12}]}).success).toBe(false);
    expect(storyboardSchema.safeParse({...demo, scenes: [{...demo.scenes[0], motion: {preset: 'particle-convergence'}}]}).success).toBe(false);
  });
  it('rejects duplicate assets and odd H.264 dimensions', () => {
    expect(storyboardSchema.safeParse({...demo, assets: [...demo.assets, demo.assets[0]]}).success).toBe(false);
    expect(storyboardSchema.safeParse({...demo, format: {...demo.format, width: 1081}}).success).toBe(false);
  });
});

describe('registries and actual asset files', () => {
  it('resolves every template and shared asset without global mutation', () => {
    const board = parseStoryboard(demo), registry = createAssetRegistry(board.assets);
    for (const scene of board.scenes) expect(typeof resolveTemplate(scene.template)).toBe('function');
    expect(registry.resolve('luminous-subject')).toEqual(board.assets[0]);
    expect(() => registry.resolve('missing')).toThrow('Missing asset');
    expect(() => createAssetRegistry([board.assets[0], board.assets[0]])).toThrow('Duplicate asset');
    expect(createAssetRegistry([board.assets[1]]).list()).toHaveLength(1);
  });
  it.each(['../secret.png', '/tmp/a.png', 'https://example.com/a.png', 'folder/../a.png', 'a.gif'])('rejects unsupported path %s', source => {
    expect(assetSchema.safeParse({...demo.assets[0], path: source}).success).toBe(false);
  });
  it('validates the approved PNG files and catches missing/mismatched files', async () => {
    const board = parseStoryboard(demo);
    expect(await validateAssetFiles(board.assets)).toHaveLength(2);
    await expect(validateAssetFiles([{...board.assets[0], path: 'missing.png'}])).rejects.toThrow('Missing asset file');
    await expect(validateAssetFiles([{...board.assets[0], width: 10}])).rejects.toThrow('dimensions mismatch');
  });
  it('supports local SVG and actual WebP files', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'storyboard-assets-'));
    try {
      await writeFile(path.join(dir, 'shape.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect width="80" height="40" fill="orange"/></svg>');
      expect(await validateAssetFiles([{id: 'shape', path: 'shape.svg', type: 'svg', width: 80, height: 40}], dir)).toHaveLength(1);
      expect(assetSchema.safeParse({id: 'web', path: 'shape.webp', type: 'webp', width: 80, height: 40, transparent: true}).success).toBe(true);
      // A tiny opaque WebP fixture avoids requiring an optional WebP encoder.
      await writeFile(path.join(dir, 'shape.webp'), Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64'));
      expect(await validateAssetFiles([{id: 'web', path: 'shape.webp', type: 'webp', width: 1, height: 1, transparent: false}], dir)).toHaveLength(1);
    } finally { await rm(dir, {recursive: true, force: true}); }
  });
});

describe('timeline and compatibility', () => {
  const board = parseStoryboard(demo);
  it('covers every frame exactly once and respects half-open boundaries', () => {
    expect(storyboardDuration(board)).toBe(300);
    for (let frame = 0; frame < 300; frame++) expect(storyboardSceneAt(board, frame).scene.id).toBe(board.scenes[Math.floor(frame / 60)].id);
    expect(storyboardSceneAt(board, 60).localFrame).toBe(0);
    expect(() => storyboardSceneAt(board, 300)).toThrow('outside storyboard');
    expect(() => storyboardSceneAt(board, -.5)).toThrow('Invalid frame');
  });
  it('uses declared order and recomputes timing for different arrangements/durations', () => {
    const reordered = {...board, scenes: [...board.scenes].reverse().map((scene, i) => ({...scene, durationFrames: 30 + i * 15}))};
    expect(storyboardTimeline(reordered).map(item => item.startFrame)).toEqual([0, 30, 75, 135, 210]);
    expect(storyboardSceneAt(reordered, 30).scene.id).toBe('compare');
  });
  it('keeps the intentional 8-second fade brief and schedules the summary without a gap', () => {
    const at = (frame: number) => {
      const {scene, localFrame} = storyboardSceneAt(board, frame);
      return {id: scene.id, opacity: subjectEnvelope(localFrame, scene.durationFrames, scene.transitionFrames)};
    };
    expect(at(239)).toEqual({id: 'compare', opacity: 0});
    expect(at(240)).toEqual({id: 'closing', opacity: 0});
    expect(at(238).opacity).toBeCloseTo(2 / 27);
    expect(at(241).opacity).toBeCloseTo(2 / 27);
    expect(at(233).opacity).toBe(1);
    expect(at(246)).toEqual({id: 'closing', opacity: 1});
    const backgroundOnly = Array.from({length: 14}, (_, i) => i + 233).filter(frame => at(frame).opacity === 0);
    expect(backgroundOnly).toEqual([239, 240]);
  });
  it('bounds every demo transition and allows an explicit cut without a backdrop-only frame', () => {
    for (const {startFrame} of storyboardTimeline(board).slice(1)) {
      const nearby = Array.from({length: 15}, (_, i) => startFrame - 7 + i);
      const backgroundOnly = nearby.filter(frame => {
        const {scene, localFrame} = storyboardSceneAt(board, frame);
        return subjectEnvelope(localFrame, scene.durationFrames, scene.transitionFrames) === 0;
      });
      expect(backgroundOnly).toEqual([startFrame - 1, startFrame]);
      for (const frame of nearby) {
        const {scene, localFrame} = storyboardSceneAt(board, frame);
        expect(subjectEnvelope(localFrame, scene.durationFrames, 0)).toBe(1);
      }
    }
  });
  it('keeps the exact approved legacy plan and composition through the adapter', () => {
    const adapted = adaptPlanetFormation(legacy);
    expect(adapted.plan).toEqual(parseScenePlan(legacy));
    expect(adapted.kind).toBe('planet-formation-v1');
    const element = LegacyStoryboard({plan: adapted.plan}) as React.ReactElement<{plan: unknown}>;
    expect(element.type).toBe(PlanetFormation);
    expect(element.props.plan).toBe(adapted.plan);
  });
});

describe('frame-based camera and motion contracts', () => {
  it('scales tracking with the viewport and normalizes different durations', () => {
    const config = cameraSchema.parse({preset: 'tracking', offsetX: .1, offsetY: -.1});
    expect(cameraPresetAt(config, 15, 31, 800, 600).focus).toEqual({x: 480, y: 240});
    expect(cameraPresetAt(config, 15, 31, 800, 600)).toEqual(cameraPresetAt(config, 30, 61, 800, 600));
  });
  it.each(['static', 'slow-push', 'pull-back', 'tracking'])('camera %s is repeatable, changes appropriately and returns smoothly to neutral', preset => {
    const config = cameraSchema.parse({preset});
    const at = (frame: number) => cameraPresetAt(config, frame, 61, 1080, 1920);
    expect(at(0).focus).toEqual({x: 540, y: 960});
    expect(at(60)).toEqual(at(0));
    expect([60, 9, 30, 0].map(at).reverse()).toEqual([0, 30, 9, 60].map(at));
    if (preset !== 'static') expect(at(30)).not.toMatchObject({focus: {x: 540, y: 960}, zoom: 1});
    expect(Math.abs(at(.001).zoom - at(0).zoom)).toBeLessThan(1e-6);
  });
  it.each(['still', 'gentle-drift', 'hero-reveal', 'orbit', 'particle-convergence'])('motion %s supports out-of-order frames and smooth boundaries', preset => {
    const config = motionSchema.parse({preset});
    const at = (frame: number) => motionPresetAt(config, frame, 61);
    expect([60, 20, 0].map(at).reverse()).toEqual([0, 20, 60].map(at));
    expect(at(0).x).toBe(0); expect(at(60).y).toBeCloseTo(0);
    expect(at(60).scale).toBe(1);
    expect(subjectEnvelope(0, 61, 6)).toBe(0);
    expect(subjectEnvelope(60, 61, 6)).toBe(0);
    expect(subjectEnvelope(30, 61, 6)).toBe(1);
  });
});
