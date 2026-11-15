import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {puffsSchema, strokeRevealSchema, motionEffectSchema} from '../engine/motion/primitives/schema';
import {compilePuffs, puffAt} from '../engine/motion/primitives/puffs';
import {pathData, strokeStateAt} from '../engine/motion/primitives/stroke';
import {layerSchema, groupSchema, layerAssetIds} from '../engine/storyboard/layers';
import {captionStyleSchema} from '../captions/schema';

const puffs = puffsSchema.parse({
  id: 'column', type: 'puffs', count: 24, seed: 7, startFrame: 10, endFrame: 70,
  emitter: {x: .5, y: .3, width: .04}, direction: {angleDegrees: -90, spreadDegrees: 14},
  travel: [.4, .6], lifetimeFrames: [50, 70], radius: [.03, .05], growth: 3,
  wind: {x: .08, y: 0}, colors: {light: '#f2ece8', mid: '#9b8f94', shadow: '#4b4148'},
});
const stroke = strokeRevealSchema.parse({
  id: 'flow', type: 'stroke-reveal', width: .02, color: '#ff7a1a',
  path: {start: {x: .5, y: .2}, segments: [{type: 'cubic-bezier', control1: {x: .45, y: .4}, control2: {x: .6, y: .6}, to: {x: .4, y: .9}}]},
  progress: [{frame: 10, value: 0}, {frame: 40, value: 1}],
  flow: {color: '#ffe08a', periodFrames: 30},
});

describe('seeded puff cloud', () => {
  it('compiles identical records for a seed and different records for another seed', () => {
    expect(compilePuffs(puffs)).toEqual(compilePuffs(puffs));
    expect(compilePuffs({...puffs, seed: 8})).not.toEqual(compilePuffs(puffs));
    expect(compilePuffs(puffs)).toHaveLength(24);
  });
  it('keeps every birth inside the emission window and spreads births across it', () => {
    const births = compilePuffs(puffs).map(p => p.birth);
    for (const b of births) { expect(b).toBeGreaterThanOrEqual(10); expect(b).toBeLessThan(70); }
    expect(Math.min(...births)).toBeLessThan(15);
    expect(Math.max(...births)).toBeGreaterThan(60);
  });
  it('rises, grows and fades analytically, independent of sampling order', () => {
    const p = compilePuffs(puffs)[3];
    const early = puffAt(p, puffs, p.birth + 2, 1080, 1920);
    puffAt(p, puffs, 999, 1080, 1920);
    const late = puffAt(p, puffs, p.birth + p.life * .8, 1080, 1920);
    expect(puffAt(p, puffs, p.birth + 2, 1080, 1920)).toEqual(early);
    expect(late.y).toBeLessThan(early.y);
    expect(late.radius).toBeGreaterThan(early.radius);
    expect(late.x).toBeGreaterThan(early.x - .05);
    expect(puffAt(p, puffs, p.birth - .01).active).toBe(false);
    expect(puffAt(p, puffs, p.birth + p.life).active).toBe(false);
  });
  it('rejects unbounded counts, inverted windows and invalid colours', () => {
    expect(puffsSchema.safeParse({...puffs, count: 49}).success).toBe(false);
    expect(puffsSchema.safeParse({...puffs, endFrame: 5}).success).toBe(false);
    expect(puffsSchema.safeParse({...puffs, colors: {...puffs.colors, mid: 'grey'}}).success).toBe(false);
  });
});

describe('stroke reveal', () => {
  it('builds pixel path data from normalized geometry', () => {
    expect(pathData(stroke.path, 1000, 1000)).toBe('M 500.00 200.00 C 450.00 400.00 600.00 600.00 400.00 900.00');
  });
  it('reveals monotonically between keys and is invisible before the first key', () => {
    expect(strokeStateAt(stroke, 0).visible).toBe(false);
    const values = [12, 20, 30, 40, 80].map(f => strokeStateAt(stroke, f).progress);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    expect(values.at(-1)).toBe(1);
  });
  it('cycles flow dashes with the configured period', () => {
    expect(strokeStateAt(stroke, 15).flowOffset).toBeCloseTo(strokeStateAt(stroke, 45).flowOffset);
    expect(strokeStateAt(stroke, 15).flowOffset).not.toBeCloseTo(strokeStateAt(stroke, 30).flowOffset);
  });
  it('is accepted by the shared effect union', () => {
    expect(motionEffectSchema.parse(stroke).type).toBe('stroke-reveal');
    expect(motionEffectSchema.parse(puffs).type).toBe('puffs');
  });
});

describe('effects-only layers and budgets', () => {
  it('allows a layer without an image when it declares effects', () => {
    const layer = layerSchema.parse({id: 'smoke', effects: [puffs]});
    expect(layerAssetIds(layer)).toEqual([]);
  });
  it('rejects source-image features and empty effects-only layers', () => {
    expect(layerSchema.safeParse({id: 'empty'}).success).toBe(false);
    expect(layerSchema.safeParse({id: 'smoke', effects: [{...puffs, clipToSource: true}]}).success).toBe(false);
    expect(layerSchema.safeParse({id: 'smoke', effects: [puffs], textureDrift: {x: 1, y: 1, periodFrames: 60, opacity: .1}}).success).toBe(false);
  });
  it('caps puffs per group', () => {
    const layers = [0, 1, 2, 3, 4].map(i => ({id: `l${i}`, effects: [{...puffs, id: `p${i}`, count: 20}]}));
    expect(() => groupSchema.parse({id: 'g', width: 100, height: 100, layers})).toThrow('96');
  });
});

describe('caption style', () => {
  it('defaults to the legacy box and accepts the outline variant', () => {
    expect(captionStyleSchema.parse({}).variant).toBe('box');
    expect(captionStyleSchema.parse(JSON.parse(readFileSync('config/caption-styles/outline.json', 'utf8'))).variant).toBe('outline');
    expect(captionStyleSchema.safeParse({variant: 'neon'}).success).toBe(false);
  });
  it('keeps generic primitive sources free of topic names and unseeded randomness', () => {
    for (const file of ['puffs.ts', 'stroke.ts']) {
      const source = readFileSync('src/engine/motion/primitives/' + file, 'utf8');
      expect(source).not.toMatch(/Math\.random|Date\.now|volcano|magma|lava/i);
    }
  });
});
