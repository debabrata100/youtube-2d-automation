import {orbitPosition, type Point} from './paths';

export const seededRandom = (seed: number) => {let s = seed >>> 0; return () => {s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296;};};
export type Particle = {id: number; phase: number; radiusX: number; radiusY: number; size: number; opacity: number; depth: number; color: string};
export const makeParticles = (count: number, seed: number, colors = ['#fff4cc','#f6ae63','#9be7ef']): Particle[] => {
  const random = seededRandom(seed);
  return Array.from({length: count}, (_, id) => ({id, phase: random()*Math.PI*2, radiusX: 120+random()*380, radiusY: 30+random()*110, size: 2+random()*10, opacity: .28+random()*.72, depth: .55+random()*.9, color: colors[Math.floor(random()*colors.length)]}));
};
export const particleOrbit = (p: Particle, frame: number, center: Point, speed: number, direction: 1|-1 = 1) => orbitPosition(frame, {center, radiusX:p.radiusX, radiusY:p.radiusY, speed:speed/p.depth, phase:p.phase, direction});
