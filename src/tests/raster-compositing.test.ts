import {describe, expect, it} from 'vitest';
import {alphaAt, type Raster} from '../../scripts/lib/image-fitting';
import {foregroundRim, multiplyMask, placeRaster, profileValue, remapRaster, sampleRGBA, terrainSupport} from '../../scripts/lib/raster-compositing';
import recipe from '../../assets/illustrations/volcano/batch-c/fitted-v1/fitting-config.json';

const image = (width: number, height: number, color = [210, 110, 40, 255]): Raster => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set(color, i * 4);
  return {width, height, data};
};

describe('production raster compositing contracts', () => {
  it('preserves painted RGB and alpha fringes without sampling transparent black', () => {
    const source = image(2, 2, [0, 0, 0, 0]); source.data.set([230, 110, 30, 255], 0);
    expect(sampleRGBA(source, .5, 0)).toEqual([230, 110, 30, 128]);
    expect(sampleRGBA(source, -1, 0)).toEqual([0, 0, 0, 0]);
  });
  it('uniformly places a layer without altering its original buffer or anchor geometry', () => {
    const source = image(6, 8, [0, 0, 0, 0]); source.data.set([250, 160, 70, 255], (3 * 6 + 2) * 4);
    const before = source.data.slice(), result = placeRaster(source, 24, 24, {scale: 2, x: 3, y: 4});
    expect([...result.data.slice((10 * 24 + 7) * 4, (10 * 24 + 7) * 4 + 4)]).toEqual([250, 160, 70, 255]);
    expect(alphaAt(result, 0)).toBe(0); expect(source.data).toEqual(before);
    expect(() => placeRaster(source, 24, 24, {scale: 0, x: 0, y: 0})).toThrow('positive');
  });
  it('keeps a cover-resized opaque landscape opaque to the final frame edges', () => {
    const source = image(3, 4), result = placeRaster(source, 6, 8, {scale: 2, x: 0, y: 0});
    for (let i = 0; i < 48; i++) expect(alphaAt(result, i)).toBe(1);
  });
  it('uses a soft interior terrain margin while eliminating all unsupported alpha', () => {
    const rock = image(15, 15, [0, 0, 0, 0]);
    for (let y = 2; y <= 12; y++) for (let x = 2; x <= 12; x++) rock.data[(y * 15 + x) * 4 + 3] = 255;
    const support = terrainSupport(rock, 3), fitted = multiplyMask(image(15, 15), support.alpha);
    expect(alphaAt(fitted, 7 * 15 + 7)).toBe(1);
    expect(alphaAt(fitted, 2 * 15 + 7)).toBeGreaterThan(0);
    expect(alphaAt(fitted, 2 * 15 + 7)).toBeLessThan(1);
    for (let i = 0; i < 225; i++) if (!support.solid[i]) expect(alphaAt(fitted, i)).toBe(0);
    expect(() => terrainSupport(rock, 0)).toThrow('positive');
  });
  it('occludes the foreground rim without erasing the cloud above or outside the crater', () => {
    const rock = image(60, 60), cloud = image(60, 60, [120, 110, 130, 255]);
    const rim = foregroundRim(rock, [[5, 20], [55, 20]], 4), fitted = multiplyMask(cloud, Float32Array.from(rim, value => 1 - value));
    expect(alphaAt(fitted, 30 * 60 + 30)).toBe(0);
    expect(alphaAt(fitted, 10 * 60 + 30)).toBe(1);
    expect(alphaAt(fitted, 20 * 60 + 30)).toBeCloseTo(.5, 2);
    expect(alphaAt(fitted, 30 * 60)).toBe(1);
  });
  it('keeps optional ash opacity independent and repeatable without mutating its source', () => {
    const ash = image(8, 8), original = ash.data.slice(), mask = new Float32Array(64).fill(1);
    const first = multiplyMask(ash, mask, .55), second = multiplyMask(ash, mask, .55);
    expect(first.data).toEqual(second.data); expect(ash.data).toEqual(original);
    expect(first.data[3]).toBe(140);
    expect(() => multiplyMask(ash, mask, 2)).toThrow('Opacity');
  });
  it('remaps local material deterministically and keeps explicitly excluded regions transparent', () => {
    const source = image(12, 12), inverse = (x: number, y: number): readonly [number, number] | null => y < 3 ? null : [x + Math.sin(y / 4), y - 1];
    const a = remapRaster(source, 12, 12, inverse), b = remapRaster(source, 12, 12, inverse);
    expect(a.data).toEqual(b.data);
    for (let i = 0; i < 36; i++) expect(alphaAt(a, i)).toBe(0);
  });
  it('retains the reviewed crater anchor, headroom and monotonic terrain recipe', () => {
    expect(recipe.scene).toMatchObject({width: 1080, height: 1920});
    expect(recipe.plume.scale).toBe(.3);
    expect(recipe.plume.vent).toEqual([640, 334]);
    const profile = recipe.rim.profile as [number, number][];
    expect(profileValue(recipe.plume.vent[0], profile)).toBeLessThan(recipe.plume.vent[1]);
    for (let i = 1; i < recipe.lava.inverseYKnots.length; i++) {
      expect(recipe.lava.inverseYKnots[i][0]).toBeGreaterThan(recipe.lava.inverseYKnots[i - 1][0]);
      expect(recipe.lava.inverseYKnots[i][1]).toBeGreaterThan(recipe.lava.inverseYKnots[i - 1][1]);
    }
    expect(recipe.lava.inverseYKnots.at(-1)![0]).toBeLessThan(792);
  });
});
