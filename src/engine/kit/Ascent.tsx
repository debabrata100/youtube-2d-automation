import React from 'react';
import {seededRandom} from '../../motion/particles';
import {blobPath} from './geometry';
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

const MarkerArt: React.FC<{m: Marker; map: ReturnType<typeof ascentMapping>; width: number; height: number; frame: number; theme: Theme; id: string; clearTop: number}> = ({m, map, width, height, frame, theme, id, clearTop}) => {
  const ink = theme.line.color, lw = theme.line.width, font = theme.label.fontFamily;
  const y = map.y(m.altitude) + m.dy * height, x = (m.x + m.drift * frame) * width, s = m.size * width;
  if (m.kind !== 'city' && m.kind !== 'tower' && m.kind !== 'mountain' && m.kind !== 'aurora' && (y < -s * 1.5 || y > height + s * 1.5)) return null;
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
      // A Burj-Khalifa-like supertall: three glass wings stepping back in a spiral (left and right setbacks alternate),
      // a lighter central core, floor bands, sun on one side and shade on the other, then a long tapering spire.
      const ground = map.y(0), tip = y, total = ground - tip; if (tip > height + 40 || ground < -40) return null;
      const body = .78, at = (t: number) => ground - total * t;
      // Half-widths per side (fraction of s) after each setback: [height fraction, left, right].
      const steps: Array<[number, number, number]> = [[0, .5, .5], [.1, .44, .5], [.17, .44, .43], [.24, .37, .43], [.31, .37, .35], [.38, .3, .35], [.45, .3, .27],
        [.52, .23, .27], [.58, .23, .2], [.64, .16, .2], [.69, .16, .13], [.73, .1, .13], [.76, .1, .07], [body, .06, .07]];
      const edge = (side: 0 | 1) => steps.flatMap(([t, l, r], i) => { const w = side ? r : l, nt = steps[i + 1]?.[0] ?? body, xx = x + (side ? 1 : -1) * w * s; return [[xx, at(t)], [xx, at(nt)]]; });
      const left = edge(0), right = edge(1).reverse();
      const outline = 'M ' + [...left, ...right].map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L ') + ' Z';
      const spireBase = at(body), sw = s * .06;
      const bands = Array.from({length: 26}, (_, i) => at(.03 + i * .029)).filter(by => by > spireBase + 4);
      return <g>
        <defs>
          <linearGradient id={`${id}-glass`} x1={x - s * .5} y1="0" x2={x + s * .5} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#eef4fb"/><stop offset=".42" stopColor="#c9d7e8"/><stop offset=".5" stopColor="#dbe6f2"/><stop offset=".58" stopColor="#9fb2cb"/><stop offset="1" stopColor="#6f84a3"/></linearGradient>
          <clipPath id={`${id}-clip`}><path d={outline}/></clipPath>
        </defs>
        <path d={outline} fill={`url(#${id}-glass)`}/>
        <g clipPath={`url(#${id}-clip)`}>
          {bands.map((by, i) => <path key={i} d={`M ${x - s * .5} ${by} L ${x + s * .5} ${by}`} stroke="#6f84a3" strokeOpacity=".35" strokeWidth={2}/>)}
          {[-.3, -.15, .15, .3].map(f => <path key={f} d={`M ${x + f * s} ${ground} L ${x + f * s} ${spireBase}`} stroke="#ffffff" strokeOpacity=".28" strokeWidth={2}/>)}
          <rect x={x - s * .035} y={spireBase} width={s * .07} height={total} fill="#f4f8fc" opacity=".6"/>
          <rect x={x - s * .42} y={spireBase} width={s * .05} height={total} fill="#ffffff" opacity=".35"/>
        </g>
        <path d={outline} fill="none" stroke={ink} strokeWidth={lw * .7} strokeLinejoin="round"/>
        <path d={`M ${x - sw} ${spireBase} L ${x - sw * .25} ${at(.93)} L ${x + sw * .25} ${at(.93)} L ${x + sw} ${spireBase} Z`} fill="#c9d7e8" stroke={ink} strokeWidth={lw * .6} strokeLinejoin="round"/>
        <path d={`M ${x} ${at(.93)} L ${x} ${tip}`} stroke={ink} strokeWidth={lw * .8} strokeLinecap="round"/>
        <circle cx={x} cy={tip} r={4} fill="#ff5a4f"/>
        {m.label && <text x={x} y={tip - 18} textAnchor="middle" fontFamily={font} fontSize={s * .32} fill="#ffffff" stroke={ink} strokeWidth={6} paintOrder="stroke">{m.label}</text>}
      </g>;
    }
    case 'mountain': {
      // A Himalayan pyramid: jagged ridgelines, a sunlit face and a shaded face split by the summit ridge, snowfields
      // with ragged edges and couloir streaks, hazy neighbouring peaks behind, and a wind plume off the summit.
      const random = seededRandom(m.seed), half = s * 1.5, base = Math.min(map.y(m.altitude * .25), height + s * 4);
      if (y > height + s || base < -s) return null;
      const H0 = base - y, jag = (n: number, x0: number, y0: number, x1: number, y1: number, amp: number) =>
        Array.from({length: n + 1}, (_, i) => { const t = i / n, w = i && i < n ? (random() - .5) * amp : 0; return [x0 + (x1 - x0) * t + w * .4, y0 + (y1 - y0) * t + w]; });
      const lRidge = jag(9, x, y, x - half * 1.7, base, H0 * .06), rRidge = jag(9, x, y, x + half * 1.5, base, H0 * .06);
      const spine = jag(7, x, y, x + half * .25, base, H0 * .04);
      const pts = (a: number[][]) => a.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L ');
      const lit = `M ${pts(lRidge)} L ${pts([...spine].reverse())} Z`, shade = `M ${pts(spine)} L ${pts([...rRidge].reverse())} Z`;
      const snowLine = (ridge: number[][], frac: number) => ridge.filter(([, py]) => py < y + H0 * frac);
      const snowEdge = (from: number[][], to: number[][], frac: number) => {
        const a = snowLine(from, frac), b = snowLine(to, frac).reverse(), n = 6;
        const ax = a.at(-1)!, bx = b[0];
        const rag = Array.from({length: n + 1}, (_, i) => { const t = i / n; return [ax[0] + (bx[0] - ax[0]) * t, ax[1] + (bx[1] - ax[1]) * t + (i % 2 ? H0 * .05 : -H0 * .015) * (.6 + random())]; });
        return `M ${pts(a)} L ${pts(rag)} L ${pts(b)} Z`;
      };
      const peak = (px: number, py: number, w: number, tone: string) => `M ${px - w} ${base} L ${px - w * .35} ${py + (base - py) * .3} L ${px} ${py} L ${px + w * .4} ${py + (base - py) * .25} L ${px + w} ${base} Z`;
      return <g>
        <defs><filter id={`${id}-plume`} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={s * .025}/></filter></defs>
        <path d={peak(x - half * 1.25, y + H0 * .28, half * 1.1, '')} fill="#a9b6cc" opacity=".9"/>
        <path d={peak(x + half * 1.35, y + H0 * .18, half * 1.2, '')} fill="#9aa8c0" opacity=".9"/>
        <path d={`M ${x - half * 1.25} ${y + H0 * .28} l ${-half * .2} ${H0 * .1} l ${half * .32} 0 Z`} fill="#eef3fa" opacity=".8"/>
        <path d={`M ${x + half * 1.35} ${y + H0 * .18} l ${-half * .22} ${H0 * .1} l ${half * .36} ${H0 * .02} Z`} fill="#eef3fa" opacity=".8"/>
        <path d={lit} fill="#857f80"/>
        <path d={shade} fill="#4e5466"/>
        <path d={snowEdge(lRidge, spine, .42)} fill="#ffffff"/>
        <path d={snowEdge(spine, rRidge, .36)} fill="#c3cfe2"/>
        {[.3, .55, .75].map((f, i) => { const sx = x - half * f * .9, sy = y + H0 * (.2 + f * .25); return <path key={i} d={`M ${sx} ${sy} l ${-half * .05} ${H0 * .14}`} stroke="#ffffff" strokeOpacity=".8" strokeWidth={s * .018} strokeLinecap="round"/>; })}
        {[.35, .6].map((f, i) => { const sx = x + half * f * .8, sy = y + H0 * (.18 + f * .22); return <path key={`r${i}`} d={`M ${sx} ${sy} l ${half * .04} ${H0 * .12}`} stroke="#c3cfe2" strokeOpacity=".8" strokeWidth={s * .016} strokeLinecap="round"/>; })}
        <path d={`M ${pts(lRidge)}`} fill="none" stroke={ink} strokeWidth={lw * .6} strokeLinejoin="round"/>
        <path d={`M ${pts(rRidge)}`} fill="none" stroke={ink} strokeWidth={lw * .6} strokeLinejoin="round"/>
        <path d={`M ${pts(spine)}`} fill="none" stroke={ink} strokeOpacity=".5" strokeWidth={lw * .4} strokeLinejoin="round"/>
        <path d={`M ${x + s * .02} ${y + s * .02} q ${s * .5} ${-s * .06} ${s * 1.1} ${s * .04}`} stroke="#ffffff" strokeOpacity=".75" strokeWidth={s * .07} fill="none" strokeLinecap="round" filter={`url(#${id}-plume)`}/>
        {m.label && <text x={x} y={y - 22} textAnchor="middle" fontFamily={font} fontSize={s * .3} fill="#ffffff" stroke={ink} strokeWidth={6} paintOrder="stroke">{m.label}</text>}
      </g>;
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
    case 'meteor': {
      // A shooting star that flashes across every 50 frames (phase from the seed), burning out as it goes.
      const t = ((frame + m.seed * 17) % 50) / 50, hx = x + (t - .5) * s * 1.6, hy = y + (t - .5) * s * .7, len = s * .7 * Math.sin(Math.PI * t);
      return <g opacity={Math.sin(Math.PI * t)}>
        <path d={`M ${hx} ${hy} L ${hx - len * .9} ${hy - len * .4}`} stroke="#ffe9b0" strokeWidth={6} strokeLinecap="round" opacity=".55"/>
        <path d={`M ${hx} ${hy} L ${hx - len * .5} ${hy - len * .22}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round"/>
        <circle cx={hx} cy={hy} r={7} fill="#fff6d8"/>
      </g>;
    }
    case 'aurora': {
      // Curtains: green from `altitude` up to `top`, a faint red fringe above (NASA: green 100-200 km, red above 200 km).
      const yb = y, yt = map.y(m.top ?? m.altitude * 2) + m.dy * height, yr = yt - (yb - yt) * .45;
      if (yb < -20 || yr > height + 20) return null;
      const n = 72;
      return <g filter={`url(#${id}-soft)`}>
        <defs><filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter><linearGradient id={`${id}-au`} gradientUnits="userSpaceOnUse" x1="0" y1={yb} x2="0" y2={yr}>
          <stop offset="0" stopColor="#7dffb0" stopOpacity=".85"/><stop offset=".55" stopColor="#3ee08a" stopOpacity=".45"/>
          <stop offset=".7" stopColor="#ff5a7a" stopOpacity=".28"/><stop offset="1" stopColor="#ff5a7a" stopOpacity="0"/></linearGradient></defs>
        {Array.from({length: n}, (_, i) => {
          const px = (i + .5) / n * width, wave = Math.sin(i * .55 + frame * .06) * .5 + .5, sway = Math.sin(i * .3 + frame * .04) * 18;
          const bottom = yb + Math.sin(i * .9 + frame * .05) * 30;
          return <rect key={i} x={px - width / n * .6 + sway} y={yr} width={width / n * 2.4} height={Math.max(0, bottom - yr)} fill={`url(#${id}-au)`} opacity={.2 + .35 * wave}/>;
        })}
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
      const wing = (cx: number, cy: number) => <g>{[0, 1].map(j => <g key={j}>
          <rect x={cx - 30} y={cy + (j ? 16 : -146)} width={60} height={130} fill={`url(#${id}-cell)`} stroke={ink} strokeWidth={lw / k}/>
          {[1, 2, 3, 4, 5].map(r => <path key={r} d={`M ${cx - 30} ${cy + (j ? 16 : -146) + r * 21.7} l 60 0`} stroke="#3a2a10" strokeWidth={1.6 / k}/>)}
          <path d={`M ${cx} ${cy + (j ? 16 : -146)} l 0 130`} stroke="#3a2a10" strokeWidth={1.6 / k}/></g>)}
        <rect x={cx - 4} y={cy - 16} width={8} height={32} fill="#9aa3b2"/></g>;
      const radiator = (cx: number, dir: number) => <g>{[0, 1, 2].map(i => <rect key={i} x={cx - 14} y={dir > 0 ? 22 + i * 26 : -46 - i * 26} width={28} height={22} fill="#f4f6fa" stroke={ink} strokeWidth={1.5 / k}/>)}</g>;
      // Fades in below the overlays at the top, so a big station does not hover behind the readout on the way up.
      return <g transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp((y - clearTop * height) / 220)}>
        <defs><linearGradient id={`${id}-cell`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9a043"/><stop offset=".5" stopColor="#a8701f"/><stop offset="1" stopColor="#6e4a14"/></linearGradient></defs>
        {radiator(-70, 1)}{radiator(70, -1)}
        <rect x={-205} y={-7} width={410} height={14} fill="#d4d9e2" stroke={ink} strokeWidth={lw / k}/>
        {Array.from({length: 20}, (_, i) => <path key={i} d={`M ${-200 + i * 20} -7 l 10 14 l 10 -14`} fill="none" stroke="#8d96a6" strokeWidth={1.4 / k}/>)}
        {[-172, -112, 112, 172].map(cx => <React.Fragment key={cx}>{wing(cx, 0)}</React.Fragment>)}
        <rect x={-74} y={6} width={148} height={30} rx={13} fill="#eef1f6" stroke={ink} strokeWidth={lw / k}/>
        <rect x={-30} y={-40} width={60} height={34} rx={13} fill="#e3e7ee" stroke={ink} strokeWidth={lw / k}/>
        <rect x={-16} y={36} width={32} height={66} rx={12} fill="#eef1f6" stroke={ink} strokeWidth={lw / k}/>
        {[-50, -20, 10, 40].map(px => <path key={px} d={`M ${px} 8 l 0 26`} stroke="#c4cad6" strokeWidth={1.4 / k}/>)}
        <circle cx={0} cy={21} r={7} fill="#7fb6ff"/><circle cx={-48} cy={21} r={4} fill="#ffe8a3"/><circle cx={48} cy={21} r={4} fill="#ffe8a3"/>
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
  const rl = seededRandom(c.seed + 7), land = Array.from({length: 9}, (_, i) => ({x: i / 9 + rl() * .05, y: rl(), w: .12 + rl() * .16, seed: c.seed + i}));
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
      <linearGradient id={`${id}-dawn`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={width} y2={0}><stop offset="0" stopColor="#ffb347" stopOpacity=".95"/><stop offset=".35" stopColor="#ff7a3d" stopOpacity=".5"/><stop offset=".6" stopColor="#ff7a3d" stopOpacity="0"/></linearGradient>
      <linearGradient id={`${id}-shade`} gradientUnits="userSpaceOnUse" x1={0} y1={topY} x2={0} y2={topY + 260}><stop offset="0" stopColor="#ffffff" stopOpacity=".12"/><stop offset="1" stopColor="#000814" stopOpacity=".45"/></linearGradient>
      <radialGradient id={`${id}-sea`} cx={ex - R * .1} cy={topY + R * .2} r={R} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#3f8fe0"/><stop offset=".06" stopColor="#2a6fc4"/><stop offset=".2" stopColor="#123a7a"/></radialGradient>
    </defs>
    <rect x={-40} y={-40} width={width + 80} height={height + 80} fill={`url(#${id}-sky)`}/>
    {stars.map((s, i) => { const o = starAt(s.y); return o > .01 ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={o * (.55 + .35 * Math.sin(frame * .08 + s.tw))}/> : null; })}
    {lift > 0 && <g opacity={clamp(lift * 6)}>
      <circle cx={ex} cy={topY + R} r={R + 70} fill={`url(#${id}-air)`}/>
      <circle cx={ex} cy={topY + R} r={R + 46} fill={`url(#${id}-dawn)`}/>
      <circle cx={ex} cy={topY + R} r={R} fill={`url(#${id}-sea)`}/>
      <g clipPath={`url(#${id}-ball)`}>
        {land.map((l, i) => { const lx = ((l.x * width * 2 + frame * .6) % (width * 2)) - width * .5; return <path key={i} d={blobPath(lx, topY + l.y * height * .3 + 30, l.w * width, l.w * width * .3, .45, l.seed)} fill={i % 3 ? '#5e9b55' : '#b49a5c'} opacity=".9"/>; })}
        {land.slice(0, 5).map((l, i) => { const lx = ((l.x * width * 2 + 300 + frame * .9) % (width * 2)) - width * .5; return <path key={`c${i}`} d={`M ${lx - 140} ${topY + 34 + l.y * 60} q 90 -26 180 0 q 60 18 110 -4`} fill="none" stroke="#ffffff" strokeOpacity=".75" strokeWidth={12} strokeLinecap="round"/>; })}
      </g>
      <circle cx={ex} cy={topY + R} r={R} fill={`url(#${id}-shade)`}/>
      <defs><clipPath id={`${id}-ball`}><circle cx={ex} cy={topY + R} r={R}/></clipPath></defs>
    </g>}
    {c.markers.map((m, i) => <MarkerArt key={i} m={m} map={map} width={width} height={height} frame={frame} theme={theme} id={`${id}-m${i}`} clearTop={c.clearTop}/>)}
    {streaks.map((s, i) => <path key={i} d={`M ${s.x} ${s.y} l 0 ${Math.min(220, speed * 5)}`} stroke="#ffffff" strokeOpacity={clamp((speed - 6) / 30) * .35} strokeWidth={3} strokeLinecap="round"/>)}
    {/* The shaft: two rails with ticks that stream past, so even empty sky reads as speed; the cable runs up out of frame. */}
    {railX.map(rx => <g key={rx}><path d={`M ${rx} -20 L ${rx} ${height + 20}`} stroke="#c6cfdd" strokeWidth={8}/><path d={`M ${rx} -20 L ${rx} ${height + 20}`} stroke={ink} strokeWidth={2}/>
      {ticks.map((ty, i) => <path key={i} d={`M ${rx - 12} ${ty} L ${rx + 12} ${ty}`} stroke={ink} strokeWidth={4}/>)}</g>)}
    <path d={`M ${cx} -20 L ${cx} ${floor - ch}`} stroke={ink} strokeWidth={6}/>
    <rect x={cx - cw / 2} y={floor - ch} width={cw} height={ch} rx={10} fill="#4a5f8c" stroke={ink} strokeWidth={lw}/>
    <rect x={cx - cw / 2 + 14} y={floor - ch + 14} width={cw - 28} height={ch - 28} rx={8} fill="#6b84b8"/>
    <ellipse cx={cx} cy={floor - ch + ch * .34} rx={cw * .4} ry={ch * .3} fill="#fff4c2" opacity=".18"/>
    <rect x={cx - cw * .18} y={floor - ch + 10} width={cw * .36} height={12} rx={6} fill="#fff4c2"/>
    <rect x={cx - cw / 2 + 14} y={floor - ch * .32} width={cw - 28} height={8} fill="#8592aa"/>
    {c.buttons && (() => {
      const n = c.buttons.length, bx = cx + cw * .4, r = cw * .045, top = floor - ch * .62, lit = c.press ? trackAt(frame, c.press as never, 0) : 0;
      return <g>
        <rect x={bx - r * 1.7} y={top - r * 1.6} width={r * 3.4} height={n * r * 2.7 + r * .8} rx={r * .8} fill="#c9d2e2" stroke={ink} strokeWidth={3}/>
        {c.buttons.map((label, i) => { const by = top + i * r * 2.7, on = i === n - 1 && lit > .5; return <g key={i}>
          {on && <circle cx={bx} cy={by} r={r * 2} fill="#ffd25e" opacity={.45 * lit}/>}
          <circle cx={bx} cy={by} r={r} fill={on ? '#ffd25e' : '#eef1f6'} stroke={ink} strokeWidth={3}/>
          <text x={bx} y={by + r * .38} textAnchor="middle" fontFamily={theme.label.fontFamily} fontSize={r * (label.length > 2 ? .8 : 1.15)} fill={ink}>{label}</text></g>; })}
      </g>;
    })()}
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
