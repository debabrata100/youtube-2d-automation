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

export type PropConfig = {item: 'thermometer' | 'pressure-arrows' | 'motion-lines' | 'exclaim' | 'question' | 'check' | 'cross'; x: number; y: number; size: number; rotation: number; color?: string; count: number; level: Array<{frame: number; value: number}>};

const levelAt = (keys: PropConfig['level'], frame: number) => {
  if (frame <= keys[0].frame) return keys[0].value;
  for (let i = 1; i < keys.length; i++) if (frame < keys[i].frame) {
    const a = keys[i - 1], b = keys[i], t = (frame - a.frame) / Math.max(1, b.frame - a.frame);
    return a.value + (b.value - a.value) * t * t * (3 - 2 * t);
  }
  return keys[keys.length - 1].value;
};

/** Hand-drawn props: thermometer (animated level), pressure arrows, motion lines, ! ? and tick/cross marks. */
export const Prop: React.FC<{config: PropConfig; theme: Theme; width: number; height: number; frame: number}> = ({config: c, theme, width, height, frame}) => {
  const s = c.size * Math.min(width, height), ink = theme.line.color, red = c.color ?? theme.palette.text.accent, w = Math.max(3, s * .045);
  const at = `translate(${c.x * width} ${c.y * height}) rotate(${c.rotation})`;
  const stroke = (color: string, sw = w) => ({fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const});
  switch (c.item) {
    case 'thermometer': {
      const tw = s * .16, th = s * .78, bulb = s * .14, lv = levelAt(c.level, frame), top = -s / 2, bottom = top + th;
      return <g transform={at}>
        <rect x={-tw / 2} y={top} width={tw} height={th + bulb} rx={tw / 2} fill="#ffffff" stroke={ink} strokeWidth={w}/>
        <rect x={-tw * .22} y={bottom - th * .92 * lv} width={tw * .44} height={th * .92 * lv + bulb * .6} rx={tw * .22} fill={red}/>
        <circle cx={0} cy={bottom + bulb * .55} r={bulb} fill={red} stroke={ink} strokeWidth={w}/>
        {Array.from({length: 7}, (_, i) => <path key={i} d={`M ${tw / 2} ${top + th * (.1 + i * .12)} l ${tw * (i % 2 ? .35 : .6)} 0`} {...stroke(ink, w * .7)}/>)}
      </g>;
    }
    case 'pressure-arrows': return <g transform={at}>{Array.from({length: c.count}, (_, i) => {
      const a = (i / c.count) * Math.PI * 2 - Math.PI / 2, r0 = s * .5, r1 = s * .26, k = s * .07;
      const x0 = Math.cos(a) * r0, y0 = Math.sin(a) * r0, x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
      return <g key={i}><path d={`M ${x0} ${y0} L ${x1} ${y1}`} {...stroke(red)}/>
        <path d={`M ${x1 + k * Math.cos(a + 2.6)} ${y1 + k * Math.sin(a + 2.6)} L ${x1} ${y1} L ${x1 + k * Math.cos(a - 2.6)} ${y1 + k * Math.sin(a - 2.6)}`} {...stroke(red)}/></g>;
    })}</g>;
    case 'motion-lines': return <g transform={at}>{Array.from({length: Math.min(c.count, 5)}, (_, i) => {
      const y = (i - (Math.min(c.count, 5) - 1) / 2) * s * .22, len = s * (.6 - Math.abs(i - 1) * .08);
      return <path key={i} d={`M 0 ${y} q ${-len * .5} ${-s * .05} ${-len} 0`} {...stroke(ink, w * .8)}/>;
    })}</g>;
    case 'exclaim': return <g transform={at}><path d={`M 0 ${-s * .45} L 0 ${s * .18}`} {...stroke(red, w * 2.2)}/><circle cx={0} cy={s * .4} r={w * 1.3} fill={red}/></g>;
    case 'question': return <g transform={at}><path d={`M ${-s * .2} ${-s * .25} Q ${-s * .2} ${-s * .5} 0 ${-s * .5} Q ${s * .22} ${-s * .5} ${s * .22} ${-s * .26} Q ${s * .22} ${-s * .08} 0 0 L 0 ${s * .16}`} {...stroke(red, w * 2)}/><circle cx={0} cy={s * .4} r={w * 1.2} fill={red}/></g>;
    case 'check': return <g transform={at}><path d={`M ${-s * .4} 0 L ${-s * .1} ${s * .3} L ${s * .45} ${-s * .35}`} {...stroke(c.color ?? '#2e9e4f', w * 1.8)}/></g>;
    case 'cross': return <g transform={at}><path d={`M ${-s * .35} ${-s * .35} L ${s * .35} ${s * .35} M ${s * .35} ${-s * .35} L ${-s * .35} ${s * .35}`} {...stroke(red, w * 1.8)}/></g>;
  }
};
