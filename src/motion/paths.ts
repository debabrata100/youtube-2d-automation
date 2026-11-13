export type Point = {x: number; y: number};
export type Orbit = {center: Point; radiusX: number; radiusY: number; speed: number; phase?: number; direction?: 1 | -1};
export const orbitPosition = (frame: number, orbit: Orbit): Point => {
  const a = (orbit.phase ?? 0) + frame * orbit.speed * (orbit.direction ?? 1);
  return {x: orbit.center.x + Math.cos(a) * orbit.radiusX, y: orbit.center.y + Math.sin(a) * orbit.radiusY};
};
export const lerpPoint = (a: Point, b: Point, t: number): Point => ({x: a.x + (b.x-a.x)*t, y: a.y+(b.y-a.y)*t});
