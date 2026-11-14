import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditPlanetAsset} from '../../scripts/planet-asset-audit';
import {IllustratedRockyPlanet} from '../illustrations/space/IllustratedRockyPlanet';
import {accretionHaloOpacity,heroPlanetScale,planetAssetGeometry,planetFormationAt,planetMotionAt,rockyBodyPath} from '../motion/planet';
import {absorbedMass,accretionRadius,makeImpactEvents} from '../motion/accretion';
import {cameraPoseAt} from '../motion/camera';
import {createShotComposition} from '../composition/shot-presets';
import {smoothstep} from '../motion/easing';
import {parseScenePlan} from '../schemas/scene-plan';
import rawPlan from '../plans/planet-formation.json';
import {SummaryScene} from '../scenes/SummaryScene';

// Img's loading/video hooks require Chromium; unit markup checks use a plain img.
// Actual Remotion loading, masks and alpha are exercised by the encoded previews.
vi.mock('remotion',async(importOriginal)=>{
  const actual=await importOriginal<typeof import('remotion')>();
  return {...actual,useCurrentFrame:()=>420,Img:(props:React.ImgHTMLAttributes<HTMLImageElement>)=>React.createElement('img',props)};
});

describe('approved rocky planet integration',()=>{
  it('preserves approved source bytes, dimensions, alpha and measured visual bounds',()=>{
    const asset=auditPlanetAsset();
    expect(asset.sha256).toBe('9ca412dbfbf32c8dfbdd83552e9d64e7983fa47fece5ba899bd670890efa11b6');
    expect([asset.width,asset.height,asset.colorType]).toEqual([1254,1254,6]);
    expect(asset.bounds).toEqual(planetAssetGeometry.bounds);
    expect(asset.corners).toEqual([0,0,0,0]);
    expect(asset.transparentPixels).toBeGreaterThan(700000);
  });
  it('does not alter the approved Sun',()=>{
    expect(createHash('sha256').update(readFileSync('assets/illustrations/star/sun-approved.png')).digest('hex')).toBe('d7fbf21f09cf0e55283ffc25b9e2c737f6b7a05c406746da0b8bcd8f617c7511');
  });
  it('evaluates animation in any frame order without rotating baked lighting',()=>{
    const frames=[449,210,300,270,420];
    expect([...frames].reverse().map(planetMotionAt).reverse()).toEqual(frames.map(planetMotionAt));
    for(let f=1;f<450;f++){
      expect(Math.abs(planetMotionAt(f).scale-planetMotionAt(f-1).scale)).toBeLessThan(.00004);
      expect(planetMotionAt(f).scale).toBeGreaterThanOrEqual(.9985);
      expect(planetMotionAt(f).scale).toBeLessThanOrEqual(1.0015);
    }
    const markup=renderToStaticMarkup(React.createElement(IllustratedRockyPlanet,{x:665,y:1085,frame:130}));
    expect(markup).toContain('rocky-planet-approved.png');
    expect(markup).toContain('rotate(0deg)');
    expect(markup).toContain('object-fit:contain');
  });
  it('introduces approved terrain monotonically on one continuously evolving silhouette',()=>{
    const events=makeImpactEvents(3404,8,120);
    let previous=planetFormationAt(.12,.12);
    for(let frame=0;frame<120;frame++){
      const mass=absorbedMass(events,frame);
      const formation=.12+.88*smoothstep((mass-.03)/.97);
      const state=planetFormationAt(formation,formation);
      expect(state.revealInner).toBeGreaterThanOrEqual(previous.revealInner);
      expect(state.substrateOpacity).toBeLessThanOrEqual(previous.substrateOpacity);
      expect(rockyBodyPath(formation)).toBe(rockyBodyPath(formation));
      previous=state;
    }
    expect(previous.complete).toBe(true);
    expect(previous.substrateOpacity).toBe(0);
    const near=rockyBodyPath(.9999).match(/-?\d+\.\d+/g)!.map(Number);
    const end=rockyBodyPath(1).match(/-?\d+\.\d+/g)!.map(Number);
    expect(Math.max(...near.map((value,i)=>Math.abs(value-end[i])))).toBeLessThan(.02);
  });
  it('matches outgoing screen radius at the frame-300 hero handoff',()=>{
    const plan=parseScenePlan(rawPlan),accretion=plan.scenes[2],hero=plan.scenes[3];
    expect(hero.startFrame).toBe(300);
    expect(accretion.startFrame+accretion.durationFrames).toBe(hero.startFrame);
    const center={x:665,y:1085};
    const outgoing=cameraPoseAt(119,createShotComposition(accretion.animation.shotPreset!,center,120,{x:625,y:1060}).keyframes);
    const incoming=cameraPoseAt(0,createShotComposition(hero.animation.shotPreset!,center,90,{x:650,y:1065}).keyframes);
    const before=accretionRadius(makeImpactEvents(3404,8,120),119,120)*outgoing.zoom;
    const after=240*heroPlanetScale(0)*incoming.zoom;
    expect(Math.abs(after/before-1)).toBeLessThan(.005);
    expect(Math.abs((center.x-outgoing.focus.x)*outgoing.zoom-(center.x-incoming.focus.x)*incoming.zoom)).toBeLessThan(2);
    expect(Math.abs((center.y-outgoing.focus.y)*outgoing.zoom-(center.y-incoming.focus.y)*incoming.zoom)).toBeLessThan(2);
    expect(heroPlanetScale(34)).toBe(1);
    expect(accretionHaloOpacity(119,120)).toBe(0);
    expect(accretionHaloOpacity(100,120)).toBe(.92);
  });
  it('retains the five-scene plan and matching final artwork without an early-body substrate',()=>{
    const plan=parseScenePlan(rawPlan);
    expect(plan.scenes.map(s=>[s.startFrame,s.durationFrames])).toEqual([[0,90],[90,90],[180,120],[300,90],[390,60]]);
    const final=planetFormationAt(1,1);
    expect(final).toMatchObject({complete:true,substrateOpacity:0,heatOpacity:0});
    const markup=renderToStaticMarkup(React.createElement(SummaryScene,{frame:30,duration:60,config:plan.scenes[4]}));
    expect(markup).toContain('illustrations/star/sun-approved.png');
    expect(markup).toContain('illustrations/planet/rocky-planet-approved.png');
    expect(markup).toContain('data-layer-id="growing-body" data-layer-role="silhouette" opacity="0"');
  });
});
