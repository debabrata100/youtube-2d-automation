/** Hand-drawn explainer elements: cartoon planets and outlined terrain. Ink colour and width come from the theme. */
import React from 'react';
import {seededRandom} from '../../motion/particles';
import type {Theme} from '../style/theme';

export type PlanetConfig = {x: number; y: number; radius: number; base: string; bands: string[]; craters: number; ring: boolean; shade: number; spin: number; seed: number; glow?: string};
export type TerrainConfig = {top: number; curve: number; fill: string; detail: string; rocks: number; bumps: number; seed: number};

export const Planet: React.FC<{config: PlanetConfig; theme: Theme; width: number; height: number; frame: number; id: string}> = ({config: c, theme, width, height, frame, id}) => {
  const random = seededRandom(c.seed), r = c.radius * Math.min(width, height), cx = c.x * width, cy = c.y * height, ink = theme.line.color, w = Math.max(3, r * .035);
  const drift = (c.spin * frame) % (r * 2);
  const craters = Array.from({length: c.craters}, () => ({x: (random() * 2 - 1) * r * .75, y: (random() * 2 - 1) * r * .7, s: r * (.06 + random() * .1)}))
    .filter(k => Math.hypot(k.x, k.y) + k.s < r * .95);
  const bands = c.bands.map((color, i) => ({color, y: -r + (2 * r) * (i + .5) / c.bands.length + (random() - .5) * r * .08, h: r * (.12 + random() * .12)}));
  return <>
    <defs>
      <clipPath id={`${id}-disc`}><circle cx={cx} cy={cy} r={r}/></clipPath>
      {c.shade > 0 && <radialGradient id={`${id}-shade`} cx=".36" cy=".34" r=".8"><stop offset=".45" stopColor="#000000" stopOpacity="0"/><stop offset="1" stopColor="#000000" stopOpacity={Math.min(.85, c.shade * 2.4)}/></radialGradient>}
      {c.glow && <radialGradient id={`${id}-glow`}><stop offset=".6" stopColor={c.glow} stopOpacity=".9"/><stop offset="1" stopColor={c.glow} stopOpacity="0"/></radialGradient>}
    </defs>
    {c.glow && <circle cx={cx} cy={cy} r={r * 1.35} fill={`url(#${id}-glow)`}/>}
    {c.ring && <ellipse cx={cx} cy={cy} rx={r * 1.75} ry={r * .38} fill="none" stroke={ink} strokeWidth={r * .16} transform={`rotate(-14 ${cx} ${cy})`}/>}
    {c.ring && <ellipse cx={cx} cy={cy} rx={r * 1.75} ry={r * .38} fill="none" stroke={c.bands[0] ?? c.base} strokeWidth={r * .16 - w * 1.6} transform={`rotate(-14 ${cx} ${cy})`}/>}
    <g clipPath={`url(#${id}-disc)`}>
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={c.base}/>
      {bands.map((b, i) => <g key={i} transform={`translate(${-drift} 0)`}>
        {[0, 2 * r].map(o => <path key={o} d={`M ${cx - r + o - r} ${cy + b.y} q ${r * .5} ${-b.h * .4} ${r} 0 t ${r} 0 t ${r} 0 t ${r} 0 v ${b.h} q ${-r * .5} ${b.h * .3} ${-r} 0 t ${-r} 0 t ${-r} 0 t ${-r} 0 Z`} fill={b.color}/>)}
      </g>)}
      {craters.map((k, i) => <g key={i}>
        <circle cx={cx + k.x} cy={cy + k.y} r={k.s} fill="#000000" opacity=".14"/>
        <path d={`M ${cx + k.x - k.s * .8} ${cy + k.y - k.s * .3} A ${k.s} ${k.s} 0 0 1 ${cx + k.x + k.s * .5} ${cy + k.y - k.s * .85}`} fill="none" stroke="#ffffff" strokeWidth={w * .6} opacity=".45" strokeLinecap="round"/>
      </g>)}
      {c.shade > 0 && <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-shade)`}/>}
      <path d={`M ${cx - r * .62} ${cy - r * .35} A ${r * .72} ${r * .72} 0 0 1 ${cx - r * .1} ${cy - r * .72}`} fill="none" stroke="#ffffff" strokeWidth={w * 1.3} strokeLinecap="round" opacity=".55"/>
    </g>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={ink} strokeWidth={w}/>
    {c.ring && [[r * .16, ink], [r * .16 - w * 1.6, c.bands[0] ?? c.base]].map(([sw, col], i) =>
      <path key={i} d={`M ${cx - r * 1.75} ${cy} A ${r * 1.75} ${r * .38} 0 0 0 ${cx + r * 1.75} ${cy}`} fill="none" stroke={col as string} strokeWidth={sw as number} transform={`rotate(-14 ${cx} ${cy})`}/>)}
  </>;
};

/** Ground with a hand-drawn horizon: optional planet curvature, bumps, speckle texture and outlined horizon rocks. */
export const Terrain: React.FC<{config: TerrainConfig; theme: Theme; width: number; height: number; id: string}> = ({config: c, theme, width, height, id}) => {
  const random = seededRandom(c.seed), ink = theme.line.color, w = Math.max(3, height * .005), top = c.top * height, bulge = c.curve * height;
  const n = 48, pts = Array.from({length: n + 1}, (_, i) => {
    const t = i / n, x = -width * .05 + t * width * 1.1, arc = -bulge * (1 - (2 * t - 1) ** 2);
    return {x, y: top + arc + Math.sin(t * Math.PI * c.bumps + c.seed) * height * .006 + Math.sin(t * Math.PI * c.bumps * 2.3) * height * .003};
  });
  const edge = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const yAt = (x: number) => { const t = Math.max(0, Math.min(1, (x + width * .05) / (width * 1.1))); return pts[Math.round(t * n)].y; };
  const specks = Array.from({length: 60}, () => ({x: random() * width, y: top + random() * (height - top), r: height * (.004 + random() * .01)}));
  const rocks = Array.from({length: c.rocks}, () => {
    const x = width * (.05 + random() * .9), s = height * (.02 + random() * .035), sw = s * (1.4 + random() * 1.6), y = yAt(x);
    return {d: `M ${x - sw} ${y + 2} L ${x - sw * .8} ${y - s * .7} Q ${x - sw * .3} ${y - s * 1.05} ${x + sw * .2} ${y - s * .9} L ${x + sw * .7} ${y - s * .6} L ${x + sw} ${y + 2} Z`};
  });
  return <>
    <defs><clipPath id={`${id}-ground`}><path d={`${edge} L ${width * 1.05} ${height * 1.5} L ${-width * .05} ${height * 1.5} Z`}/></clipPath></defs>
    {rocks.map((k, i) => <path key={i} d={k.d} fill={c.detail} stroke={ink} strokeWidth={w} strokeLinejoin="round"/>)}
    <g clipPath={`url(#${id}-ground)`}>
      <rect x={-width * .05} y={top - bulge - height * .05} width={width * 1.1} height={height * 1.6} fill={c.fill}/>
      {specks.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={c.detail} opacity=".55"/>)}
    </g>
    <path d={edge} fill="none" stroke={ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>
  </>;
};
