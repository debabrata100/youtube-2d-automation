import {describe, expect, it} from 'vitest';
import {visemeAt} from '../engine/kit/FigureElement';
import {poseAt} from '../engine/kit/figure';
import {kitSchema} from '../engine/kit/schema';

describe('lip sync (M4.2)', () => {
  const talk = [{from: 10, to: 20, text: 'moon'}, {from: 24, to: 30, text: 'f'}];
  it('closes the mouth outside words and at word ends', () => {
    expect(visemeAt(talk, 5)).toBeNull();
    expect(visemeAt(talk, 22)).toBeNull();
    expect(visemeAt(talk, 20)).toBe('closed');
  });
  it('follows the letters across the window', () => {
    expect(visemeAt(talk, 10)).toBe('closed');   // m
    expect(visemeAt(talk, 13)).toBe('round');    // o
    expect(visemeAt(talk, 25)).toBe('teeth');    // f
  });
  it('validates talk windows on a figure', () => {
    expect(kitSchema.safeParse({type: 'figure', x: .5, y: .9, height: .5, poses: [{frame: 0, pose: 'stand'}], talk}).success).toBe(true);
  });
});
describe('overshoot', () => {
  it('lets back eases pass the target pose, and keeps others at it', () => {
    const keys = (ease: 'ease-out-back' | 'smoothstep') => [{frame: 0, pose: 'stand' as const, blend: 8, ease}, {frame: 10, pose: 'cheer' as const, blend: 10, ease}];
    const end = poseAt(keys('smoothstep'), 30).armL[0];
    const mid = poseAt(keys('ease-out-back'), 16).armL[0], start = poseAt(keys('smoothstep'), 0).armL[0];
    expect(Math.abs(mid - start)).toBeGreaterThan(Math.abs(end - start));
  });
});
