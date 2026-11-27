import {describe, expect, it} from 'vitest';
import {shotAt, shotTransform} from '../engine/templates/LayeredSubject';
import {kitSchema} from '../engine/kit/schema';
import {groupSchema} from '../engine/storyboard/layers';

const shots = [{frame: 0, zoom: 1, x: 960, y: 540}, {frame: 30, zoom: 2, x: 500, y: 300, cut: true}, {frame: 60, zoom: 1, x: 960, y: 540, ease: 'linear' as const}];
describe('shots (M4.1)', () => {
  it('holds the previous shot until a cut, then jumps', () => {
    expect(shotAt(shots, 29).zoom).toBe(1);
    expect(shotAt(shots, 30).zoom).toBe(2);
  });
  it('moves to a non-cut key with its easing', () => {
    expect(shotAt(shots, 45).zoom).toBeCloseTo(1.5);
    expect(shotAt(shots, 90).zoom).toBe(1);
  });
  it('centres the focus point for depth 1 and moves background layers less', () => {
    expect(shotTransform(shots, 30, 1920, 1080, 1)).toBe('translate(960 540) scale(2.0000) translate(-500.00 -300.00)');
    expect(shotTransform(shots, 30, 1920, 1080, .5)).toBe('translate(960 540) scale(1.5000) translate(-730.00 -420.00)');
  });
  it('validates shots, blur, depth and screen layers', () => {
    const layer = {id: 'a', kit: {type: 'light', kind: 'grade'}, blur: [{frame: 0, value: 4}], depth: .8, screen: true};
    expect(groupSchema.safeParse({id: 'g', width: 10, height: 10, layers: [layer], shots}).success).toBe(true);
    expect(groupSchema.safeParse({id: 'g', width: 10, height: 10, layers: [layer], shots: [{frame: 5, zoom: 1, x: 0, y: 0}, {frame: 5, zoom: 1, x: 0, y: 0}]}).success).toBe(false);
  });
});
describe('light and set kits', () => {
  it('parses with defaults', () => {
    expect(kitSchema.parse({type: 'light', kind: 'pool'})).toMatchObject({x: .5, intensity: .6});
    expect(kitSchema.parse({type: 'set', kind: 'cabin', part: 'console'})).toMatchObject({console: {text: 'ALL OK'}});
  });
});
