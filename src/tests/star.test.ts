import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {starMotionAt} from '../motion/star';
import {starDefinition} from '../illustrations/core/IllustrationRegistry';

describe('approved Sun integration',()=>{
  it('preserves the approved PNG bytes and alpha format',()=>{
    const original=readFileSync('assets/illustrations/sun-approved.png');
    const canonical=readFileSync('assets/illustrations/star/sun-approved.png');
    expect(canonical.equals(original)).toBe(true);
    expect(canonical.subarray(1,4).toString()).toBe('PNG');
    expect(canonical[25]).toBe(6); // RGBA PNG
  });
  it('is deterministic regardless of frame evaluation order',()=>{
    const frames=[449,0,120,391,30];
    const first=frames.map(starMotionAt);
    expect([...frames].reverse().map(starMotionAt).reverse()).toEqual(first);
  });
  it('keeps breathing and exposure changes subtle and smooth',()=>{
    let previous=starMotionAt(0);
    for(let frame=0;frame<450;frame++){
      const state=starMotionAt(frame);
      expect(state.scale).toBeGreaterThanOrEqual(.992);
      expect(state.scale).toBeLessThanOrEqual(1.008);
      expect(Math.abs(state.scale-previous.scale)).toBeLessThan(.0003);
      expect(Math.abs(state.glowOpacity-previous.glowOpacity)).toBeLessThan(.001);
      expect(state.coronaOpacity).toBeLessThan(.07);
      previous=state;
    }
  });
  it('registers real flattened-artwork layers instead of fictional editable surface layers',()=>{
    expect(starDefinition.layers.map(layer=>layer.id)).toEqual(['atmosphere','corona-drift','approved-artwork']);
  });
});
