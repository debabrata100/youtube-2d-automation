import {describe,it,expect} from 'vitest';
import {rockGeometry} from '../motion/debris';
import {makeDiskParticles,diskParticleState} from '../illustrations/space/ProtoplanetaryDisk';
import {bodyGrowthAt,impactState,impactResponseAt,makeImpactEvents} from '../motion/accretion';
import {closingShotAt} from '../composition/closing-shot';
import {createShotComposition} from '../composition/shot-presets';
import {cameraPoseAt} from '../motion/camera';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {AnimatedText} from '../components/AnimatedText';

describe('cinematic debris and disk',()=>{
 it('creates repeatable varied rock materials and closed silhouettes',()=>{
  expect(rockGeometry(4)).toEqual(rockGeometry(4));
  expect(rockGeometry(4).path).not.toBe(rockGeometry(5).path);
  expect(rockGeometry(4).path.endsWith(' Z')).toBe(true);
  expect(rockGeometry(4).strata).toHaveLength(12);
 });
 it('keeps orbital trajectories independent of evaluation order',()=>{
  const p=makeDiskParticles(10,91)[3];
  const frames=[90,179,120,0];
  expect(frames.map(f=>diskParticleState(p,f))).toEqual([...frames].reverse().map(f=>diskParticleState(p,f)).reverse());
 });
 it('rotates inner material faster and preserves depth through the horizon',()=>{
  const p=makeDiskParticles(1,91)[0];
  expect(diskParticleState({...p,orbit:.3},100).angularSpeed).toBeGreaterThan(diskParticleState({...p,orbit:.9},100).angularSpeed);
  const crossing={...p,phase:0};
  const before=diskParticleState(crossing,-.001),after=diskParticleState(crossing,.001);
  expect(before.front).toBe(false);expect(after.front).toBe(true);
  expect(Math.abs(before.size-after.size)).toBeLessThan(.001);
  expect(Math.abs(before.opacity-after.opacity)).toBeLessThan(.001);
  expect(Math.abs(before.y-after.y)).toBeLessThan(.01);
 });
});

describe('closing continuity and mobile hold',()=>{
 it('matches the outgoing hero planet without a size or position jump',()=>{
  const camera=cameraPoseAt(90,createShotComposition('hero-reveal',{x:665,y:1085},90,{x:650,y:1065}).keyframes);
  const closing=closingShotAt(0);
  expect(240*camera.zoom).toBeCloseTo(closing.planetRadius*closing.zoom,6);
  expect(Math.abs((665-camera.focus.x)*camera.zoom-(closing.planet.x-closing.focus.x)*closing.zoom)).toBeLessThan(1);
  expect(Math.abs((1085-camera.focus.y)*camera.zoom-(closing.planet.y-closing.focus.y)*closing.zoom)).toBeLessThan(1);
 });
 it('settles the camera but keeps subtle subject motion during the last second',()=>{
  expect(closingShotAt(59).focus).toEqual(closingShotAt(30).focus);
  expect(closingShotAt(59).zoom).toBe(closingShotAt(30).zoom);
  expect(closingShotAt(59).planet).not.toEqual(closingShotAt(30).planet);
  for(let f=27;f<60;f++)expect(Math.hypot(closingShotAt(f).planet.x-closingShotAt(f-1).planet.x,closingShotAt(f).planet.y-closingShotAt(f-1).planet.y)).toBeLessThan(.1);
 });
 it('holds the concise final caption at full opacity through frame 449',()=>{
  const markup=renderToStaticMarkup(React.createElement(AnimatedText,{text:'A new world.\nMillions of years.',frame:59,duration:60,hold:true,placement:'top-left'}));
  expect(markup).toContain('opacity:1');
  expect(markup).toContain('white-space:pre-line');
 });
});

describe('contact-driven polish',()=>{
 const events=makeImpactEvents(3404,8,120);
 it('anchors each response to its contact-time surface and absorbs the fragment',()=>{
  for(const event of events){
   const radius=bodyGrowthAt(events,event.contactFrame,120).contactRadius;
   const at=impactState(event,event.contactFrame,{x:665,y:1085},radius);
   expect(Math.hypot(at.position.x-665,at.position.y-1085)).toBeCloseTo(radius*.96,6);
   expect(impactState(event,event.contactFrame+8,{x:665,y:1085},radius).opacity).toBe(0);
   expect(impactState(event,event.contactFrame+8,{x:665,y:1085},radius).contactPoint).toEqual(at.contactPoint);
   expect(impactResponseAt(event,event.contactFrame-1).dust).toBe(0);
   expect(impactResponseAt(event,event.contactFrame+23).ejecta).toBe(0);
  }
 });
 it('keeps growth continuous and increases mass after contact',()=>{
  for(let f=1;f<120;f++){
   const before=bodyGrowthAt(events,f-1,120),after=bodyGrowthAt(events,f,120);
   expect(after.mass).toBeGreaterThanOrEqual(before.mass);
   expect(after.radius).toBeGreaterThanOrEqual(before.radius);
   expect(after.radius-before.radius).toBeLessThan(6);
   expect(after.contactRadius-before.contactRadius).toBeLessThan(6);
  }
  for(const event of events)expect(bodyGrowthAt(events,event.contactFrame+7,120).mass).toBeGreaterThan(bodyGrowthAt(events,event.contactFrame-1,120).mass);
 });
});
