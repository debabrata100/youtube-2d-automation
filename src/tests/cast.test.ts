import {describe, expect, it} from 'vitest';
import {kitSchema} from '../engine/kit/schema';
import {skeleton} from '../engine/kit/figure';
import {synthSfx} from '../audio/synth';

describe('cast and sets (M4.3)', () => {
  it('parses the rival figure options', () => {
    const k = kitSchema.parse({type: 'figure', x: .5, y: .9, height: .4, poses: [{frame: 0, pose: 'stand'}], outfit: 'astronaut', build: {legs: 1.18}, suitStyle: 'boxy', helmetStyle: 'visor', features: ['brows', 'mustache'], stripe: '#d6453b', skin: '#f1d3b8'});
    expect(k).toMatchObject({suitStyle: 'boxy', helmetStyle: 'visor', build: {head: 1, legs: 1.18}});
    expect(kitSchema.safeParse({type: 'figure', x: .5, y: .9, height: .4, poses: [{frame: 0, pose: 'stand'}], build: {legs: 3}}).success).toBe(false);
  });
  it('makes a longer-legged build taller', () => {
    const pose = {lean: 0, head: 0, armL: [0, 0], armR: [0, 0], legL: [0, 0], legR: [0, 0], rotate: 0, lift: 0, squash: 0} as never;
    const base = skeleton(pose, 300), tall = skeleton(pose, 300, {head: 1, torso: 1, arms: 1, legs: 1.2});
    expect(tall.head.y).toBeLessThan(base.head.y);
  });
  it('parses the new sets with room as the default part', () => {
    for (const kind of ['iss', 'moon', 'mars']) expect(kitSchema.parse({type: 'set', kind})).toMatchObject({kind, part: 'room'});
  });
  it('synthesises the comedy sounds deterministically', () => {
    for (const id of ['boing', 'slide-up', 'slide-down', 'scratch', 'bonk', 'zip'] as const) {
      const a = synthSfx(id); expect(a.length).toBeGreaterThan(1000);
      expect(Math.max(...Array.from(a, Math.abs))).toBeGreaterThan(.3);
      expect(synthSfx(id)).toEqual(a);
    }
  });
});
