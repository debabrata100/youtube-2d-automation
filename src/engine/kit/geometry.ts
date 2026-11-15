import {seededRandom} from '../../motion/particles';
import type {MountainShape} from './schema';

export type Pt = {x: number; y: number};
const f = (v: number) => v.toFixed(1);

/** Smooth open (or closed) curve through points using Catmull-Rom converted to cubic Béziers. */
export const smoothPath = (points: Pt[], closed = false) => {
  if (points.length < 2) return '';
  const p = closed ? [points.at(-1)!, ...points, points[0], points[1]] : [points[0], ...points, points.at(-1)!];
  let d = `M ${f(p[1].x)} ${f(p[1].y)}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [a, b, c, e] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    d += ` C ${f(b.x + (c.x - a.x) / 6)} ${f(b.y + (c.y - a.y) / 6)} ${f(c.x - (e.x - b.x) / 6)} ${f(c.y - (e.y - b.y) / 6)} ${f(c.x)} ${f(c.y)}`;
  }
  return closed ? d + ' Z' : d;
};

/** Key points of a mountain silhouette in pixels. */
export const mountainPoints = (m: MountainShape, width: number, height: number) => {
  const cx = m.cx * width, baseY = m.baseY * height, bw = m.baseWidth * width, h = m.height * height;
  const cw = Math.max(m.crater * bw, bw * .012), topY = baseY - h;
  return {cx, baseY, bw, h, cw, topY, L: {x: cx - bw / 2, y: baseY}, R: {x: cx + bw / 2, y: baseY}, TL: {x: cx - cw / 2, y: topY}, TR: {x: cx + cw / 2, y: topY}};
};

/** Concave flank from a base corner up to a crater corner. */
const flank = (from: Pt, to: Pt, k: number) => {
  const dx = to.x - from.x, dy = to.y - from.y;
  const c1 = {x: from.x + dx * (.3 + .3 * k), y: from.y + dy * (.3 - .22 * k)};
  const c2 = {x: from.x + dx * (.72 + .14 * k), y: from.y + dy * (.7 - .12 * k)};
  return `C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(to.x)} ${f(to.y)}`;
};

export const mountainSilhouette = (m: MountainShape, width: number, height: number) => {
  const p = mountainPoints(m, width, height);
  const rightFlank = flank(p.R, p.TR, m.concavity).replace(/^C (\S+) (\S+) (\S+) (\S+) .*/, (_, a, b, c, d) => `C ${c} ${d} ${a} ${b} ${f(p.R.x)} ${f(p.R.y)}`);
  return {
    ...p,
    d: `M ${f(p.L.x)} ${f(p.L.y)} ${flank(p.L, p.TL, m.concavity)} L ${f(p.TR.x)} ${f(p.TR.y)} ${rightFlank} Q ${f(p.cx)} ${f(p.baseY + p.bw * .025)} ${f(p.L.x)} ${f(p.L.y)} Z`,
    leftEdge: `M ${f(p.L.x)} ${f(p.L.y)} ${flank(p.L, p.TL, m.concavity)}`,
    /** Mountain outline from left base to right base without closing, for use inside larger silhouettes. */
    topEdge: `L ${f(p.L.x)} ${f(p.L.y)} ${flank(p.L, p.TL, m.concavity)} L ${f(p.TR.x)} ${f(p.TR.y)} ${rightFlank}`,
  };
};

/** Seeded gully strokes running from near the summit down the flanks. */
export const gullyPaths = (m: MountainShape, width: number, height: number, count: number, seed: number) => {
  const p = mountainPoints(m, width, height), random = seededRandom(seed);
  return Array.from({length: count}, (_, i) => {
    const side = i % 2 ? 1 : -1, t = (i + 1) / (count + 1);
    const sx = p.cx + side * p.cw * (.25 + random() * .25), sy = p.topY + p.h * (.06 + random() * .06);
    const ex = p.cx + side * p.bw * (.08 + t * .34), ey = p.baseY - p.h * (.05 + random() * .2);
    return {side, d: `M ${f(sx)} ${f(sy)} C ${f(sx + side * p.bw * .03)} ${f(sy + p.h * .3)} ${f(ex - side * p.bw * .05)} ${f(ey - p.h * .3)} ${f(ex)} ${f(ey)}`};
  });
};

export const ridgeLayer = (opts: {top: number; bottom: number; index: number; layers: number; peaks: number; roughness: number; seed: number}, width: number, height: number) => {
  const random = seededRandom(opts.seed + opts.index * 7919);
  const t = opts.layers === 1 ? 1 : opts.index / (opts.layers - 1);
  const base = (opts.top + (opts.bottom - opts.top) * t) * height, amp = (opts.bottom - opts.top) * height * (.35 + .5 * opts.roughness);
  const count = opts.peaks * 2 + 2, pts: Pt[] = [];
  for (let i = 0; i <= count; i++) pts.push({x: (-.3 + 1.6 * i / count) * width, y: base - (i % 2 ? amp * (.45 + random() * .55) : amp * random() * .25)});
  return `${smoothPath(pts)} L ${f(1.3 * width)} ${f(height * 1.05)} L ${f(-.3 * width)} ${f(height * 1.05)} Z`;
};

export const blobPath = (cx: number, cy: number, rx: number, ry: number, irregularity: number, seed: number) => {
  const random = seededRandom(seed), count = 11;
  const pts = Array.from({length: count}, (_, i) => {
    const a = i / count * Math.PI * 2, k = 1 + irregularity * (random() - .5) * 2;
    return {x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k};
  });
  return smoothPath(pts, true);
};

export const cloudLobes = (width: number, lobes: number, seed: number) => {
  const random = seededRandom(seed);
  return Array.from({length: lobes}, (_, i) => {
    const t = (i + .5) / lobes, edge = Math.sin(Math.PI * t);
    return {x: (t - .5) * width, r: width * (.1 + .12 * edge + random() * .05), lift: width * (.04 + .12 * edge * random())};
  });
};

export const wavePath = (x: number, y: number, width: number, amplitude: number, wavelength: number, phase: number) => {
  const pts: Pt[] = [];
  for (let px = 0; px <= width; px += wavelength / 4) pts.push({x: x + px, y: y + Math.sin(px / wavelength * Math.PI * 2 + phase) * amplitude});
  return smoothPath(pts);
};
