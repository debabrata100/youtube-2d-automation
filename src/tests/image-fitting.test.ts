import {describe, expect, it} from 'vitest';
import {alphaAt, composite, coverageReport, extractOpening, fitLayers, mapCoordinate, sampleColor, type Raster} from '../../scripts/lib/image-fitting';

const solid = (width: number, height: number, color = [80, 90, 100, 255]): Raster => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set(color, i * 4);
  return {width, height, data};
};
const rockFixture = () => {
  const rock = solid(20, 20, [0, 0, 0, 0]);
  for (let y = 1; y < 19; y++) for (let x = 1; x < 19; x++) rock.data.set([80, 70, 60, 255], (y * 20 + x) * 4);
  for (let y = 3; y <= 16; y++) for (let x = y < 10 ? 9 : 5; x <= (y < 10 ? 10 : 14); x++) rock.data[(y * 20 + x) * 4 + 3] = 0;
  rock.data[(2 * 20 + 3) * 4 + 3] = 0; // Separate pore, not part of the intended system.
  return rock;
};
const options = {seed: {x: 10, y: 14}, chamberKnots: [[0, 0], [19, 19]] as const, conduitKnots: [[0, 0], [19, 19]] as const, chamberFade: [8, 10] as const, conduitFade: [12, 14] as const, blend: [9, 13] as const};

describe('deterministic local image fitting', () => {
  it('segments only the seeded interior opening, excluding outside transparency and unrelated holes', () => {
    const opening = extractOpening(rockFixture(), options.seed);
    expect(opening.area).toBe(84);
    expect(opening.mask[0]).toBe(0);
    expect(opening.mask[2 * 20 + 3]).toBe(0);
    expect(opening.mask[14 * 20 + 10]).toBe(1);
    expect(() => extractOpening(rockFixture(), {x: 2, y: 2})).toThrow('transparent interior');
    expect(() => extractOpening(rockFixture(), {x: 0, y: 0})).toThrow('transparent interior');
  });
  it('uses a smooth monotone local coordinate deformation without texture folding', () => {
    const knots = [[0, 0], [5, 8], [10, 11], [20, 25]] as const;
    let previous = -1;
    for (let x = 0; x <= 20; x += .01) {const next = mapCoordinate(x, knots); expect(next).toBeGreaterThanOrEqual(previous); previous = next;}
    const epsilon = .0001, center = mapCoordinate(5, knots);
    expect((center - mapCoordinate(5 - epsilon, knots)) / epsilon).toBeCloseTo((mapCoordinate(5 + epsilon, knots) - center) / epsilon, 3);
    expect(mapCoordinate(7, [[0, 0], [19, 19]])).toBeCloseTo(7);
    expect(() => mapCoordinate(1, [[0, 2], [1, 1]])).toThrow('increase');
  });
  it('interpolates premultiplied source colors without transparent black creating a seam', () => {
    const image = solid(2, 2, [0, 0, 0, 0]);
    image.data.set([240, 120, 30, 255], 0);
    expect(sampleColor(image, .5, 0)).toEqual([240, 120, 30]);
  });
  it('keeps independent layers opaque and color-continuous across the junction', () => {
    const rock = rockFixture(), fit = fitLayers(rock, solid(20, 20, [240, 80, 20, 255]), solid(20, 20, [255, 180, 50, 255]), options);
    const merged = composite(fit.conduit, fit.chamber), report = coverageReport(rock, fit.opening.mask, merged, 10);
    expect(report.chamber.coveragePercent).toBe(100);
    expect(report.conduit.coveragePercent).toBe(100);
    expect(report.spill.exteriorBackgroundPixelsWithSpill).toBe(0);
    for (let i = 0; i < fit.opening.mask.length; i++) {
      if (fit.opening.mask[i]) expect(alphaAt(merged, i)).toBe(1);
      if (alphaAt(fit.chamber, i) > 0 && alphaAt(fit.conduit, i) > 0) expect([...fit.chamber.data.slice(i * 4, i * 4 + 3)]).toEqual([...fit.conduit.data.slice(i * 4, i * 4 + 3)]);
    }
  });
  it('counts missing coverage and exterior spill honestly rather than rewarding background fill', () => {
    const rock = rockFixture(), opening = extractOpening(rock, options.seed), magma = solid(20, 20, [255, 150, 30, 255]);
    const missingIndex = 14 * 20 + 10; magma.data[missingIndex * 4 + 3] = 100;
    const report = coverageReport(rock, opening.mask, magma, 10);
    expect(report.chamber.missingPixels).toBe(1);
    expect(report.chamber.coveragePercent).toBeLessThan(100);
    expect(report.spill.exteriorBackgroundPixelsWithSpill).toBeGreaterThan(0);
    expect(report.chamber.pixels + report.conduit.pixels).toBe(opening.area);
  });
  it('bounds missing-region counts independently at the chamber/conduit split', () => {
    const rock = solid(5, 5), mask = new Uint8Array(25), magma = solid(5, 5, [0, 0, 0, 0]);
    mask[2 * 5 + 2] = 1; mask[3 * 5 + 2] = 1;
    const report = coverageReport(rock, mask, magma, 3);
    expect(report.chamber.largestMissingRegion).toBe(1);
    expect(report.conduit.largestMissingRegion).toBe(1);
  });
  it('produces identical pixels on repeat evaluations and preserves all input buffers', () => {
    const rock = rockFixture(), chamber = solid(20, 20), conduit = solid(20, 20);
    const original = [rock, chamber, conduit].map(image => image.data.slice());
    const a = fitLayers(rock, chamber, conduit, options), b = fitLayers(rock, chamber, conduit, options);
    expect(a.chamber.data).toEqual(b.chamber.data); expect(a.conduit.data).toEqual(b.conduit.data);
    [rock, chamber, conduit].forEach((image, i) => expect(image.data).toEqual(original[i]));
  });
});
