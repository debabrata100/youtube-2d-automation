import React from 'react';
import {seededRandom} from '../../motion/particles';
import {trackAt} from '../motion/layers';
import type {Theme} from '../style/theme';
import type {KitConfig} from './schema';

/**
 * Vertical journeys (M3.8, 26 Nov 2026): a car that climbs (or sinks) through a world column on a log altitude scale,
 * and a live readout panel whose rows are all derived from one value track. JSON-driven and story-neutral: the
 * elevator-to-space Short uses them, and so can a dive to the sea floor or a fall from the edge of space.
 */
type AscentConfig = Extract<KitConfig, {type: 'ascent'}>;
type ReadoutConfig = Extract<KitConfig, {type: 'readout'}>;
type Marker = AscentConfig['markers'][number];

const DEFAULT_SKY: Array<{altitude: number; color: string}> = [
  {altitude: 0, color: '#8fd0f4'}, {altitude: 2000, color: '#6dbbec'}, {altitude: 9000, color: '#3f8ad8'}, {altitude: 15000, color: '#2a5fb4'},
  {altitude: 22000, color: '#1a3a82'}, {altitude: 40000, color: '#0d1c48'}, {altitude: 80000, color: '#050a1c'}, {altitude: 150000, color: '#02040b'},
];
const hexRgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const x = hexRgb(a), y = hexRgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Colour at an altitude: stops interpolate on a log scale, so the blue-to-black change spreads over the stratosphere. */
export const skyColorAt = (stops: Array<{altitude: number; color: string}>, altitude: number) => {
  const l = (a: number) => Math.log10(Math.max(0, a) + 100);
  if (altitude <= stops[0].altitude) return stops[0].color;
  for (let i = 1; i < stops.length; i++) if (altitude < stops[i].altitude) {
    const a = stops[i - 1], b = stops[i];
    return mix(a.color, b.color, (l(altitude) - l(a.altitude)) / (l(b.altitude) - l(a.altitude)));
  }
  return stops.at(-1)!.color;
};

/** Screen mapping of the world column: altitude `a` is drawn `decade` screen heights higher for every factor of ten. */
export const ascentMapping = (c: Pick<AscentConfig, 'carY' | 'decade' | 'offset'>, altitude: number, height: number) => {
  const u = (a: number) => Math.log10(Math.max(0, a) + c.offset), base = u(altitude), px = c.decade * height, floor = c.carY * height;
  return {u, y: (a: number) => floor - (u(a) - base) * px, altitudeAt: (y: number) => Math.max(0, 10 ** (base + (floor - y) / px) - c.offset), px};
};

const Building: React.FC<{x: number; w: number; top: number; bottom: number; fill: string; ink: string; lit: number; seed: number}> = ({x, w, top, bottom, fill, ink, lit, seed}) => {
  const random = seededRandom(seed), rows = Math.max(1, Math.floor((bottom - top) / 34)), cols = Math.max(1, Math.floor(w / 26));
  return <g>
    <rect x={x} y={top} width={w} height={bottom - top + 40} fill={fill} stroke={ink} strokeWidth={3}/>
    {Array.from({length: rows * cols}, (_, i) => random() < lit ? <rect key={i} x={x + 8 + (i % cols) * 26} y={top + 12 + Math.floor(i / cols) * 34} width={12} height={16} fill="#ffe8a3" opacity=".85"/> : null)}
  </g>;
};

const MarkerArt: React.FC<{m: Marker; map: ReturnType<typeof ascentMapping>; width: number; height: number; frame: number; theme: Theme; id: string; clearTop: number}> = ({m, map, width, height, frame, theme, clearTop}) => {
  const ink = theme.line.color, lw = theme.line.width, font = theme.label.fontFamily;
  const y = map.y(m.altitude), x = (m.x + m.drift * frame) * width, s = m.size * width;
  if (m.kind !== 'city' && m.kind !== 'tower' && m.kind !== 'mountain' && (y < -s * 1.5 || y > height + s * 1.5)) return null;
  switch (m.kind) {
    case 'city': {
      const ground = map.y(0); if (ground > height + 50) return null;
      const random = seededRandom(m.seed), out: React.ReactNode[] = [];
      for (let bx = -20, i = 0; bx < width + 20; i++) {
        const w = 70 + random() * 90, top = map.y(25 + random() ** 2 * Math.max(30, m.altitude)), far = random() < .5;
        out.push(<Building key={i} x={bx} w={w} top={top} bottom={ground} fill={far ? '#5d6f8f' : '#7486a8'} ink={ink} lit={.35} seed={m.seed + i}/>);
        bx += w + 6 + random() * 18;
      }
      return <g>{out}<rect x={-20} y={ground} width={width + 40} height={height} fill="#3b4559" stroke={ink} strokeWidth={lw}/>
        <rect x={-20} y={ground + 26} width={width + 40} height={8} fill="#ffd25e" opacity=".55"/></g>;
    }
    case 'tower': {
      // A stepped supertall (setbacks, then a spire): base on the ground, needle tip at the marker's altitude.
      const ground = map.y(0), tip = y, total = ground - tip; if (tip > height + 40 || ground < -40) return null;
      const stages = [[1, 0], [.78, .2], [.6, .38], [.44, .55], [.3, .7], [.18, .82], [.07, .9]];
      const d = stages.map(([w, t], i) => {
        const yy = ground - total * t, y2 = ground - total * (stages[i + 1]?.[1] ?? .9);
        return `M ${x - s * w / 2} ${yy} L ${x - s * w / 2} ${y2} L ${x + s * w / 2} ${y2} L ${x + s * w / 2} ${yy} Z`;
      }).join(' ');
      return <g>
        <path d={d} fill="#c9d4e4" stroke={ink} strokeWidth={lw}/>
        <path d={`M ${x} ${ground - total * .9} L ${x} ${tip}`} stroke={ink} strokeWidth={lw * 1.6} strokeLinecap="round"/>
        <path d={`M ${x + s * .08} ${ground} L ${x + s * .08} ${ground - total * .86}`} stroke="#ffffff" strokeOpacity=".55" strokeWidth={5}/>
        {m.label && <text x={x} y={tip - 18} textAnchor="middle" fontFamily={font} fontSize={s * .32} fill="#ffffff" stroke={ink} strokeWidth={6} paintOrder="stroke">{m.label}</text>}
      </g>;
    }
    case 'mountain': {
      const random = seededRandom(m.seed), half = s * 1.4, base = Math.min(map.y(m.altitude * .25), height + s * 4);
      if (y > height + s || base < -s) return null;
      const ridge = Array.from({length: 7}, (_, i) => { const t = i / 6; return [x - half + t * half * 2, y + Math.abs(t - .5) * 2 * (base - y) * (.55 + random() * .25)]; });
      ridge[3] = [x, y];
      const d = `M ${x - half * 2.4} ${base} ` + ridge.map(([a, b]) => `L ${a} ${b}`).join(' ') + ` L ${x + half * 2.4} ${base} Z`;
      const snow = `M ${x - s * .32} ${y + s * .42} L ${x} ${y} L ${x + s * .34} ${y + s * .44} L ${x + s * .12} ${y + s * .34} L ${x - s * .06} ${y + s * .48} Z`;
      return <g><path d={d} fill="#6f7d99" stroke={ink} strokeWidth={lw} strokeLinejoin="round"/><path d={snow} fill="#ffffff" stroke={ink} strokeWidth={lw * .7} strokeLinejoin="round"/>
        {m.label && <text x={x} y={y - 22} textAnchor="middle" fontFamily={font} fontSize={s * .3} fill="#ffffff" stroke={ink} strokeWidth={6} paintOrder="stroke">{m.label}</text>}</g>;
    }
    case 'cloud': {
      const random = seededRandom(m.seed), lobes = Array.from({length: 5}, (_, i) => ({cx: x + (i - 2) * s * .22, cy: y - random() * s * .16, r: s * (.16 + random() * .1)}));
      return <g opacity=".95">
        <ellipse cx={x} cy={y + s * .06} rx={s * .62} ry={s * .14} fill="#ffffff"/>
        {lobes.map((l, i) => <circle key={i} cx={l.cx} cy={l.cy} r={l.r} fill="#ffffff"/>)}
        <ellipse cx={x} cy={y + s * .12} rx={s * .58} ry={s * .07} fill="#dfe7f2"/>
      </g>;
    }
    case 'jet': {
      const k = s / 300, dir = m.drift < 0 ? -1 : 1;
      return <g transform={`translate(${x} ${y}) scale(${dir * k} ${k})`}>
        <path d="M -700 6 L -150 6" stroke="#ffffff" strokeOpacity=".7" strokeWidth={14} strokeLinecap="round"/>
        <path d="M -140 -18 L 120 -18 Q 160 -18 170 0 Q 160 18 120 18 L -140 18 Z" fill="#f4f6fa" stroke={ink} strokeWidth={lw / k}/>
        <path d="M -20 8 L -80 70 L -40 70 L 30 10 Z" fill="#d8dee8" stroke={ink} strokeWidth={lw / k} strokeLinejoin="round"/>
        <path d="M -120 -16 L -160 -70 L -128 -70 L -90 -16 Z" fill="#d8dee8" stroke={ink} strokeWidth={lw / k} strokeLinejoin="round"/>
        {[0, 1, 2, 3, 4, 5, 6].map(i => <circle key={i} cx={-90 + i * 26} cy={-4} r={5} fill="#3f5f8f"/>)}
      </g>;
    }
    case 'balloon': return <g>
      <path d={`M ${x} ${y + s * .55} L ${x} ${y + s * 1.1}`} stroke={ink} strokeWidth={lw * .6}/>
      <ellipse cx={x} cy={y} rx={s * .3} ry={s * .38} fill="#f2f4f8" stroke={ink} strokeWidth={lw}/>
      <rect x={x - s * .06} y={y + s * 1.1} width={s * .12} height={s * .1} fill="#ff8a1f" stroke={ink} strokeWidth={lw * .6}/>
    </g>;
    case 'line': {
      const tone = m.color ?? '#ffd25e';
      return <g>
        <path d={`M 0 ${y} L ${width} ${y}`} stroke={tone} strokeWidth={5} strokeDasharray="28 18" opacity=".9"/>
        {m.label && <text opacity={clamp((y - clearTop * height) / 80)} x={m.x * width} y={y - 16} textAnchor={m.x > .5 ? 'end' : 'start'} fontFamily={font} fontSize={m.size * width * .5} fill={tone} stroke="#0b1020" strokeWidth={7} paintOrder="stroke">{m.label}</text>}
      </g>;
    }
    case 'station': {
      const k = s / 400;
      const wing = (cx: number, cy: number) => <g>{[0, 1].map(j => <rect key={j} x={cx - 34} y={cy + (j ? 14 : -134)} width={68} height={120} fill="#b07a2a" stroke={ink} strokeWidth={lw / k}/>)}
        {[0, 1].map(j => [1, 2, 3].map(r => <path key={`${j}${r}`} d={`M ${cx - 34} ${cy + (j ? 14 : -134) + r * 30} l 68 0`} stroke="#5a3d12" strokeWidth={3 / k}/>))}</g>;
      return <g transform={`translate(${x} ${y}) scale(${k})`}>
        <rect x={-200} y={-8} width={400} height={16} fill="#d4d9e2" stroke={ink} strokeWidth={lw / k}/>
        {[-170, -110, 110, 170].map(cx => <React.Fragment key={cx}>{wing(cx, 0)}</React.Fragment>)}
        <rect x={-60} y={8} width={120} height={34} rx={14} fill="#eef1f6" stroke={ink} strokeWidth={lw / k}/>
        <rect x={-16} y={42} width={32} height={60} rx={12} fill="#eef1f6" stroke={ink} strokeWidth={lw / k}/>
        <circle cx={0} cy={25} r={8} fill="#7fb6ff"/>
        {m.label && <text x={0} y={-170} textAnchor="middle" fontFamily={font} fontSize={46} fill="#ffffff" stroke="#0b1020" strokeWidth={8} paintOrder="stroke">{m.label}</text>}
      </g>;
    }
  }
};

export const Ascent: React.FC<{config: AscentConfig; theme: Theme; width: number; height: number; frame: number; id: string}> = ({config: c, theme, width, height, frame, id}) => {
  const h = trackAt(frame, c.altitude as never, 0), next = trackAt(frame + 1, c.altitude as never, 0);
  const map = ascentMapping(c, h, height), speed = Math.abs(map.u(next) - map.u(h)) * map.px;      // screen px per frame
  const shake = Math.min(1, speed / 25), jx = Math.sin(frame * 2.3) * 2.6 * shake, jy = Math.cos(frame * 3.1) * 1.4 * shake;
  const cx = c.carX * width + jx, floor = c.carY * height + jy, cw = c.carWidth * width, ch = c.carHeight * height, ink = theme.line.color, lw = theme.line.width;
  const doors = c.doors ? trackAt(frame, c.doors as never, 0) : 0;
  if (c.part === 'car-front') {
    const open = clamp(doors) * cw / 2 * .92;
    return <g>
      <defs><clipPath id={`${id}-door`}><rect x={cx - cw / 2} y={floor - ch} width={cw} height={ch}/></clipPath></defs>
      <g clipPath={`url(#${id}-door)`}>{[-1, 1].map(side => {
        const x0 = side < 0 ? cx - cw / 2 - open : cx + open;
        return <g key={side}><rect x={x0} y={floor - ch} width={cw / 2} height={ch} fill="#cfe8ff" opacity=".12" stroke="#e7f2ff" strokeOpacity=".8" strokeWidth={4}/>
          <path d={`M ${x0 + cw * .08} ${floor - ch * .86} l ${cw * .1} ${-ch * .08} M ${x0 + cw * .08} ${floor - ch * .7} l ${cw * .2} ${-ch * .17}`} stroke="#ffffff" strokeOpacity=".55" strokeWidth={6} strokeLinecap="round"/></g>;
      })}</g>
      <rect x={cx - cw / 2} y={floor - ch} width={cw} height={ch} fill="none" stroke={ink} strokeWidth={lw * 2.2} rx={10}/>
      <rect x={cx - cw / 2 - 12} y={floor} width={cw + 24} height={26} rx={6} fill="#8592aa" stroke={ink} strokeWidth={lw}/>
    </g>;
  }
  const sky = c.sky ?? DEFAULT_SKY, bands = 10;
  const random = seededRandom(c.seed), stars = Array.from({length: c.stars}, () => ({x: random() * width, y: random() * height, r: 1 + random() * 2.2, tw: random() * 6.28}));
  const starAt = (y: number) => clamp((Math.log10(map.altitudeAt(y) + 1) - 4.4) / (4.85 - 4.4));
  // Earth's curved edge rises into the bottom of the frame once the ground has scrolled away (above about 15 km).
  const lift = c.earth ? clamp((Math.log10(h + 1) - 4.15) / (Math.log10(450000) - 4.15)) : 0;
  const R = width * (6 - 4.4 * lift), topY = height + 30 - lift * height * .2, ex = width / 2;
  const railX = [cx - cw / 2 - 26, cx + cw / 2 + 26], step = .02, uh = map.u(h);
  const ticks = Array.from({length: Math.ceil(height / (step * map.px)) + 2}, (_, i) => {
    const k = Math.floor(uh / step) - Math.ceil((height - c.carY * height) / (step * map.px)) - 1 + i;
    return c.carY * height - (k * step - uh) * map.px;
  }).filter(y => y > -20 && y < height + 20);
  const streaks = speed > 6 ? Array.from({length: 14}, (_, i) => ({x: (i * 0.137 + .03) % 1 * width, y: ((i * 0.381 + frame * Math.min(speed, 60) / height) % 1) * height})) : [];
  return <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">{Array.from({length: bands + 1}, (_, i) => <stop key={i} offset={i / bands} stopColor={skyColorAt(sky, map.altitudeAt(i / bands * height))}/>)}</linearGradient>
      <radialGradient id={`${id}-air`} cx={ex} cy={topY + R} r={R + 70} gradientUnits="userSpaceOnUse"><stop offset={(R - 10) / (R + 70)} stopColor="#9fd8ff" stopOpacity=".95"/><stop offset={(R + 18) / (R + 70)} stopColor="#4aa3f0" stopOpacity=".55"/><stop offset="1" stopColor="#1d4d9a" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-sea`} cx={ex - R * .1} cy={topY + R * .2} r={R} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#3f8fe0"/><stop offset=".06" stopColor="#2a6fc4"/><stop offset=".2" stopColor="#123a7a"/></radialGradient>
    </defs>
    <rect x={-40} y={-40} width={width + 80} height={height + 80} fill={`url(#${id}-sky)`}/>
    {stars.map((s, i) => { const o = starAt(s.y); return o > .01 ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={o * (.55 + .35 * Math.sin(frame * .08 + s.tw))}/> : null; })}
    {lift > 0 && <g opacity={clamp(lift * 6)}>
      <circle cx={ex} cy={topY + R} r={R + 70} fill={`url(#${id}-air)`}/>
      <circle cx={ex} cy={topY + R} r={R} fill={`url(#${id}-sea)`}/>
      <g clipPath={`url(#${id}-ball)`}>{[[-.28, .02, .22], [.12, .05, .3], [.4, .01, .14]].map(([dx, dy, w], i) => <ellipse key={i} cx={ex + dx * width} cy={topY + dy * height + 40} rx={w * width} ry={w * width * .18} fill="#5e9b55" opacity=".85"/>)}
        {[[-.1, .015, .26], [.3, .03, .2]].map(([dx, dy, w], i) => <ellipse key={i} cx={ex + dx * width} cy={topY + dy * height + 20} rx={w * width} ry={14} fill="#ffffff" opacity=".7"/>)}</g>
      <defs><clipPath id={`${id}-ball`}><circle cx={ex} cy={topY + R} r={R}/></clipPath></defs>
    </g>}
    {c.markers.map((m, i) => <MarkerArt key={i} m={m} map={map} width={width} height={height} frame={frame} theme={theme} id={`${id}-m${i}`} clearTop={c.clearTop}/>)}
    {streaks.map((s, i) => <path key={i} d={`M ${s.x} ${s.y} l 0 ${Math.min(220, speed * 5)}`} stroke="#ffffff" strokeOpacity={clamp((speed - 6) / 30) * .35} strokeWidth={3} strokeLinecap="round"/>)}
    {/* The shaft: two rails with ticks that stream past, so even empty sky reads as speed; the cable runs up out of frame. */}
    {railX.map(rx => <g key={rx}><path d={`M ${rx} -20 L ${rx} ${height + 20}`} stroke="#c6cfdd" strokeWidth={8}/><path d={`M ${rx} -20 L ${rx} ${height + 20}`} stroke={ink} strokeWidth={2}/>
      {ticks.map((ty, i) => <path key={i} d={`M ${rx - 12} ${ty} L ${rx + 12} ${ty}`} stroke={ink} strokeWidth={4}/>)}</g>)}
    <path d={`M ${cx} -20 L ${cx} ${floor - ch}`} stroke={ink} strokeWidth={6}/>
    <rect x={cx - cw / 2} y={floor - ch} width={cw} height={ch} rx={10} fill="#2b3550" stroke={ink} strokeWidth={lw}/>
    <rect x={cx - cw / 2 + 14} y={floor - ch + 14} width={cw - 28} height={ch - 28} rx={8} fill="#3c4a6e"/>
    <rect x={cx - cw * .18} y={floor - ch + 10} width={cw * .36} height={12} rx={6} fill="#fff4c2"/>
    <rect x={cx - cw / 2 + 14} y={floor - ch * .32} width={cw - 28} height={8} fill="#8592aa"/>
  </g>;
};

const thousands = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** Readout formats: whole numbers, metres-then-kilometres, elapsed time, air left, temperature. */
export const formatReadout = (v: number, format: ReadoutConfig['rows'][number]['format']) => {
  switch (format) {
    case 'int': return thousands(v);
    case 'distance': return v < 10000 ? `${thousands(v)} m` : v < 100000 ? `${(v / 1000).toFixed(1)} km` : `${thousands(v / 1000)} km`;
    case 'duration': {
      const s = Math.floor(v), hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
      return hh ? `${hh} h ${String(mm).padStart(2, '0')} min` : mm ? `${mm} min ${String(ss).padStart(2, '0')} s` : `${ss} s`;
    }
    case 'percent': return v >= 10 ? `${Math.round(v)}%` : v >= 1 ? `${v.toFixed(1)}%` : v >= .01 ? `${v.toFixed(2)}%` : v > 0 ? '<0.01%' : '0%';
    case 'celsius': return `${Math.round(v) < 0 ? '−' : ''}${Math.abs(Math.round(v))} °C`;
  }
};
/** A row's value: the shared track times `scale`, or looked up in `curve` (piecewise linear on the shared value). */
export const readoutRowValue = (row: Pick<ReadoutConfig['rows'][number], 'scale' | 'curve'>, v: number) => {
  const k = row.curve;
  if (!k) return v * row.scale;
  if (v <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (v < k[i][0]) { const t = (v - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * t; }
  return k.at(-1)![1];
};

export const Readout: React.FC<{config: ReadoutConfig; theme: Theme; width: number; height: number; frame: number}> = ({config: c, theme, width, height, frame}) => {
  const v = trackAt(frame, c.value as never, 0), font = theme.label.fontFamily, accent = c.accent ?? '#ffd25e';
  const w = c.width * width, x0 = c.x * width - w / 2, y0 = c.y * height, pad = w * .06, big = w * .2, row = w * .095;
  const bigRows = c.rows.filter(r => r.big), small = c.rows.filter(r => !r.big);
  const hgt = pad * 2 + (c.title ? row * .9 : 0) + bigRows.length * big * 1.25 + small.length * row * 1.15;
  let y = y0 + pad;
  const value = (r: ReadoutConfig['rows'][number]) => r.max !== undefined && v > r.max ? '—' : formatReadout(readoutRowValue(r, v), r.format);
  return <g>
    <rect x={x0} y={y0} width={w} height={hgt} rx={w * .05} fill="#0b1020" opacity=".86" stroke={accent} strokeWidth={4}/>
    {c.title && (() => { y += row * .7; return <text x={x0 + w / 2} y={y} textAnchor="middle" fontFamily={font} fontSize={row * .62} fill={accent} letterSpacing={4}>{c.title}</text>; })()}
    {bigRows.map((r, i) => { const yy = y + big * 1.02; y += big * 1.25; return <g key={`b${i}`}>
      <text x={x0 + pad} y={yy - big * .62} fontFamily={font} fontSize={row * .55} fill="#9fb3d6">{r.label}</text>
      <text x={x0 + w - pad} y={yy} textAnchor="end" fontFamily={font} fontSize={big} fill={accent}>{value(r)}</text></g>; })}
    {small.map((r, i) => { const yy = y + row * .92; y += row * 1.15; return <g key={`s${i}`}>
      <text x={x0 + pad} y={yy} fontFamily={font} fontSize={row * .7} fill="#9fb3d6">{r.label}</text>
      <text x={x0 + w - pad} y={yy} textAnchor="end" fontFamily={font} fontSize={row * .9} fill="#ffffff">{value(r)}</text></g>; })}
  </g>;
};
