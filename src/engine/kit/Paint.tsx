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

export type PropConfig = {ink?: string; item: 'thermometer' | 'pressure-arrows' | 'motion-lines' | 'exclaim' | 'question' | 'check' | 'cross' | 'counter' | 'stamp' | 'vignette' | 'station' | 'helmet' | 'doodle-stars' | 'chamber'
  | 'cliff' | 'geyser' | 'plume' | 'radiation-meter' | 'radiation-belt' | 'battery' | 'airbag' | 'small-moon' | 'asteroid' | 'ice-cutaway' | 'frost'
  | 'flag' | 'speedometer' | 'race-car' | 'sunglasses' | 'mug' | 'calendar' | 'sign' | 'igloo' | 'rocket' | 'fish' | 'drop' | 'tumbleweed' | 'thermos' | 'shovel' | 'magnifier' | 'smell-lines' | 'bar' | 'ruler' | 'moon-map' | 'system-map' | 'solar-strip' | 'probe' | 'signal' | 'bulb' | 'crescent' | 'orbit-ring' | 'town' | 'lion' | 'zebra' | 'coral' | 'plankton' | 'tide-gauge' | 'tilt-dial' | 'earth-axis' | 'impact' | 'dino' | 'reflector' | 'bed' | 'stir' | 'clock' | 'eclipse' | 'moonbeam' | 'young-earth' | 'bee' | 'flower' | 'tree' | 'tardigrade' | 'vent' | 'shell' | 'snowfall' | 'night-half' | 'mushroom' | 'sparkle' | 'clock-time' | 'rope' | 'pulse' | 'span' | 'sky' | 'streetlight' | 'arrow' | 'ice-layer' | 'city-lights' | 'tide-bulge' | 'caption'; x: number; y: number; size: number; rotation: number; color?: string; count: number; level: Array<{frame: number; value: number}>;
  values?: Array<{frame: number; value: number; ramp?: boolean}>; text?: string; direction?: 'in' | 'out';
  labels?: string[]; colors?: string[]; highlight?: number; ring?: boolean; belt?: boolean; range?: [number, number]};

/** Counter value: keys hold, or step in whole numbers towards the next key when `ramp` is set (a real-time countdown). */
export const counterAt = (keys: NonNullable<PropConfig['values']>, frame: number) => {
  if (!keys.length) return 0;
  if (frame < keys[0].frame) return keys[0].value;
  for (let i = 1; i < keys.length; i++) if (frame < keys[i].frame) {
    const a = keys[i - 1], b = keys[i];
    if (!a.ramp) return a.value;
    const t = (frame - a.frame) / (b.frame - a.frame), v = a.value + (b.value - a.value) * t;
    return b.value < a.value ? Math.ceil(v) : Math.floor(v);
  }
  return keys.at(-1)!.value;
};

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
  const s = c.size * Math.min(width, height), ink = c.ink ?? theme.line.color, red = c.color ?? theme.palette.text.accent, w = Math.max(3, s * .045), font = theme.label.fontFamily;
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
      const a = (i / c.count) * Math.PI * 2 - Math.PI / 2, out = c.direction === 'out', r0 = out ? s * .26 : s * .5, r1 = out ? s * .5 : s * .26, k = s * .07;
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
    case 'counter': {
      // Big hand-lettered number in a box; it pops each time the value changes and turns red in the last five.
      const keys = c.values ?? [], v = counterAt(keys, frame);
      let since = 99; for (let k = 1; k <= 8; k++) if (counterAt(keys, frame - k) !== v) { since = k; break; }
      const pop = since <= 8 ? 1 + .18 * (1 - since / 8) : 1, bw = s * 1.15, bh = s * .82, col = v <= 5 ? red : ink;
      return <g transform={`${at} scale(${pop})`}>
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={s * .12} fill={c.ink ? 'none' : '#ffffff'} stroke={ink} strokeWidth={w * 1.2}/>
        <text x={0} y={bh * .26} textAnchor="middle" fontFamily={font} fontSize={s * .66} fill={col} stroke={col} strokeWidth={s * .012}>{String(v)}</text>
        {c.text && <text x={0} y={bh / 2 + s * .22} textAnchor="middle" fontFamily={font} fontSize={s * .17} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'stamp': {
      const label = (c.text ?? 'MYTH').toUpperCase(), fs = s * .3, bw = label.length * fs * .62 + s * .3, bh = fs * 1.5;
      return <g transform={`${at} rotate(-12)`} opacity=".92">
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={s * .05} fill="none" stroke={red} strokeWidth={w * 1.4}/>
        <rect x={-bw / 2 + w * 2.2} y={-bh / 2 + w * 2.2} width={bw - w * 4.4} height={bh - w * 4.4} rx={s * .03} fill="none" stroke={red} strokeWidth={w * .6}/>
        <text x={0} y={fs * .36} textAnchor="middle" fontFamily={font} fontSize={fs} fill={red} stroke={red} strokeWidth={fs * .03} letterSpacing={fs * .06}>{label}</text>
      </g>;
    }
    case 'vignette': {
      // Blackout: edges darken first, then the whole frame (level 0 = clear, 1 = black).
      const lv = levelAt(c.level, frame), gid = `vig-${Math.round(c.x * 1000)}-${Math.round(c.y * 1000)}`;
      return <><defs><radialGradient id={gid} cx=".5" cy=".5" r=".75"><stop offset="0" stopColor="#0d0b12" stopOpacity={Math.max(0, lv * 1.6 - .6)}/><stop offset=".55" stopColor="#0d0b12" stopOpacity={Math.min(1, lv * 1.3)}/><stop offset="1" stopColor="#0d0b12" stopOpacity={Math.min(1, lv * 1.8)}/></radialGradient></defs>
        <rect x={-width * .1} y={-height * .1} width={width * 1.2} height={height * 1.2} fill={`url(#${gid})`}/></>;
    }
    case 'station': {
      // Space station module: hull with windows, a truss with solar panels, and an airlock hatch that swings open (level).
      const bw = s, bh = s * .42, open = levelAt(c.level, frame), p = theme.palette;
      const panel = (x0: number, k: string) => <g key={k}><rect x={x0} y={-s * .3} width={s * .34} height={s * .6} fill={p.water.mid} stroke={ink} strokeWidth={w}/>{[1, 2, 3].map(i => <path key={i} d={`M ${x0} ${-s * .3 + s * .15 * i} l ${s * .34} 0`} {...stroke(ink, w * .5)}/>)}<path d={`M ${x0 + s * .17} ${-s * .3} l 0 ${s * .6}`} {...stroke(ink, w * .5)}/></g>;
      return <g transform={at}>
        <path d={`M ${-bw * .5} 0 L ${-bw * .78} 0`} {...stroke(ink, w * 1.6)}/>
        {panel(-bw * 1.12, 'pl')}
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={bh * .3} fill={p.cloud.light} stroke={ink} strokeWidth={w}/>
        {[-.3, -.08, .14].map(t => <circle key={t} cx={bw * t} cy={-bh * .05} r={bh * .14} fill={p.water.light} stroke={ink} strokeWidth={w * .8}/>)}
        {[-.42, .3].map(t => <path key={t} d={`M ${bw * t} ${-bh / 2} l 0 ${bh}`} {...stroke(ink, w * .5)}/>)}
        <circle cx={bw * .5} cy={0} r={bh * .36} fill="#2a2433" stroke={ink} strokeWidth={w}/>
        <ellipse cx={bw * .5 + bh * .36 * open * .9} cy={0} rx={Math.max(1, bh * .36 * (1 - open * .82))} ry={bh * .36} fill={p.cloud.shadow} stroke={ink} strokeWidth={w}/>
      </g>;
    }
    case 'doodle-stars': {
      // Ink sparkles and dots scattered over the whole group (paper-page "space"); positions are seeded by x/y.
      let seed = Math.round(c.x * 7919 + c.y * 104729) || 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      return <g>{Array.from({length: c.count}, (_, i) => {
        const x = rnd() * width, y = rnd() * height, k = s * (.025 + rnd() * .03), twinkle = .55 + .45 * Math.sin(frame / 18 + i * 1.7);
        return i % 3 === 2 ? <circle key={i} cx={x} cy={y} r={k * .22} fill={ink} opacity={.5 * twinkle}/>
          : <path key={i} d={`M ${x} ${y - k} Q ${x} ${y} ${x + k} ${y} Q ${x} ${y} ${x} ${y + k} Q ${x} ${y} ${x - k} ${y} Q ${x} ${y} ${x} ${y - k} Z`} fill={i % 4 ? '#ffffff' : (c.color ?? theme.palette.sun.glow)} stroke={ink} strokeWidth={Math.max(1.5, k * .14)} opacity={twinkle}/>;
      })}</g>;
    }
    case 'chamber': {
      // Test vacuum chamber: thick-walled rounded box, porthole and a pump pipe (the figure is drawn separately).
      const bw = s * 1.1, bh = s, p = theme.palette;
      return <g transform={at}>
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={s * .14} fill={p.cloud.shadow} fillOpacity=".35" stroke={ink} strokeWidth={w * 1.6}/>
        <rect x={-bw / 2 + w * 3} y={-bh / 2 + w * 3} width={bw - w * 6} height={bh - w * 6} rx={s * .11} fill="none" stroke={ink} strokeWidth={w * .6} opacity=".6"/>
        <circle cx={-bw * .3} cy={-bh * .3} r={s * .08} fill={p.water.light} stroke={ink} strokeWidth={w}/>
        <path d={`M ${bw / 2} ${bh * .2} l ${s * .22} 0 l 0 ${bh * .3}`} {...stroke(ink, w * 2.2)}/>
        <circle cx={bw / 2 + s * .11} cy={bh * .2} r={s * .04} fill={red} stroke={ink} strokeWidth={w * .7}/>
      </g>;
    }
    case 'cliff': {
      // Cliff edge at (x, y): flat top to the left, a jagged face dropping s, strata, and an optional height bar with text.
      const fill = c.color ?? '#b8afa3', h = s, random = seededRandom(Math.round(c.x * 997 + c.y * 991) || 7);
      const face = Array.from({length: 9}, (_, i) => `L ${s * (.02 + (random() - .5) * .1 + i * .015)} ${h * (i + 1) / 9}`).join(' ');
      return <g transform={at}>
        <path d={`M ${-s * 1.6} 0 L 0 0 ${face} L ${-s * 1.6} ${h} Z`} fill={fill} stroke={ink} strokeWidth={w}/>
        {[.22, .45, .7].map(t => <path key={t} d={`M ${-s * 1.55} ${h * t} q ${s * .4} ${-s * .03} ${s * .8} 0 t ${s * .7} ${s * .01}`} {...stroke(ink, w * .45)} opacity=".45"/>)}
        {c.text && <g transform={`translate(${s * .32} 0)`}>
          <path d={`M 0 ${w} L 0 ${h - w} M ${-s * .05} ${s * .07} L 0 ${w} L ${s * .05} ${s * .07} M ${-s * .05} ${h - s * .07} L 0 ${h - w} L ${s * .05} ${h - s * .07}`} {...stroke(red, w * .9)}/>
          <text x={s * .06} y={h / 2} fontFamily={font} fontSize={s * .14} fill={red}>{c.text}</text>
        </g>}
      </g>;
    }
    case 'geyser': {
      // Jet from a vent at (x, y) straight up; level (0-1) is its height as a fraction of size. Soft outline, a billowing
      // top and spray specks, so it reads as water/gas rather than a solid pole; edges ripple with time.
      const lv = levelAt(c.level, frame), hgt = s * Math.max(.02, lv), col = c.color ?? '#ffffff', edge = c.color ? ink : '#9fb7c9';
      const wob = (k: number) => Math.sin(frame / 3 + k) * s * .012, random = seededRandom(Math.round(c.x * 331 + c.y * 557) || 9);
      if (lv <= .01) return <g transform={at}><ellipse cx={0} cy={0} rx={s * .08} ry={s * .025} fill={ink} opacity=".6"/></g>;
      const side = (sign: number) => Array.from({length: 8}, (_, i) => `${sign * (s * .04 + s * .13 * (i / 7) ** 1.4) + wob(i * sign)} ${-hgt * i / 7}`);
      const left = side(-1), right = side(1).reverse();
      const puffs = Array.from({length: 7}, (_, i) => ({x: (i - 3) * s * .06 + wob(i), y: -hgt - Math.abs(i - 3) * -s * .03 - s * .02, r: s * (.08 + .03 * ((i + 1) % 3))}));
      return <g transform={at}>
        {Array.from({length: 16}, (_, i) => { const t = random(), y = -hgt * (.4 + .65 * t), x = (random() - .5) * s * (.25 + .35 * t) * 1.6 + wob(i);
          return <circle key={`d${i}`} cx={x} cy={y + ((frame * 2 + i * 11) % 30) * s * .002} r={s * (.008 + random() * .012)} fill={col} stroke={edge} strokeWidth={w * .3} opacity=".85"/>; })}
        <path d={`M ${left.join(' L ')} L ${right.join(' L ')} Z`} fill={col} fillOpacity=".9" stroke={edge} strokeWidth={w * .7} strokeLinejoin="round"/>
        {[.25, .55].map(t => <path key={t} d={`M ${-s * .03} ${-hgt * t} q ${s * .03} ${-s * .06} 0 ${-s * .12}`} {...stroke(edge, w * .5)} opacity=".6"/>)}
        {puffs.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={col} stroke={edge} strokeWidth={w * .6}/>)}
        <ellipse cx={0} cy={s * .01} rx={s * .1} ry={s * .03} fill={ink} opacity=".45"/>
      </g>;
    }
    case 'plume': {
      // Volcanic umbrella plume (Io): vent cone, a translucent rising column and a dome-shaped canopy whose material
      // rains back down in dotted arcs; level is the plume height as a fraction of size.
      const lv = levelAt(c.level, frame), hgt = s * lv, col = c.color ?? '#efd36a', spread = s * .55 * lv;
      return <g transform={at}>
        {lv > .02 && <>
          <path d={`M ${-spread} ${-hgt * .32} Q 0 ${-hgt * 1.32} ${spread} ${-hgt * .32} Q 0 ${-hgt * .92} ${-spread} ${-hgt * .32} Z`}
            fill={col} fillOpacity=".6" stroke={ink} strokeWidth={w * .6} strokeOpacity=".7"/>
          <path d={`M ${-s * .04} ${-s * .05} Q ${-s * .015} ${-hgt * .5} ${-s * .05} ${-hgt * .78} L ${s * .05} ${-hgt * .78} Q ${s * .015} ${-hgt * .5} ${s * .04} ${-s * .05} Z`} fill={col} fillOpacity=".75" stroke={ink} strokeWidth={w * .5} strokeOpacity=".6"/>
          {[-1, 1].map(k => [.55, .85].map(t => <path key={`${k}${t}`} d={`M ${k * spread * t} ${-hgt * (.62 - t * .25)} q ${k * s * .03} ${hgt * .15} ${k * s * .02} ${hgt * (.5 - t * .25)}`}
            {...stroke(col, w * .9)} strokeDasharray={`${w * .8} ${w * 2.2}`} strokeDashoffset={-frame * 1.5}/>))}
        </>}
        <path d={`M ${-s * .12} 0 L ${-s * .04} ${-s * .06} L ${s * .04} ${-s * .06} L ${s * .12} 0 Z`} fill="#6d5a3a" stroke={ink} strokeWidth={w * .8}/>
      </g>;
    }
    case 'radiation-meter': {
      // Dial with green/amber/red bands; the needle follows level and shakes when high; trefoil symbol and optional caption.
      const lv = levelAt(c.level, frame), r = s * .5, shake = lv > .7 ? Math.sin(frame * 2.3) * 4 * (lv - .7) / .3 : 0, ang = -180 + 180 * lv + shake;
      const arc = (a0: number, a1: number) => { const p = (a: number) => `${Math.cos(a * Math.PI / 180) * r * .8} ${Math.sin(a * Math.PI / 180) * r * .8}`; return `M ${p(a0)} A ${r * .8} ${r * .8} 0 0 1 ${p(a1)}`; };
      return <g transform={at}>
        <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`} fill="#ffffff" stroke={ink} strokeWidth={w}/>
        <path d={arc(-180, -110)} {...stroke('#4caf50', r * .14)} strokeLinecap="butt"/><path d={arc(-110, -55)} {...stroke('#f2b134', r * .14)} strokeLinecap="butt"/><path d={arc(-55, 0)} {...stroke(red, r * .14)} strokeLinecap="butt"/>
        {[0, 120, 240].map(a => <path key={a} d={`M 0 ${-r * .3} L ${Math.cos((a - 120) * Math.PI / 180) * r * .2} ${-r * .3 + Math.sin((a - 120) * Math.PI / 180) * r * .2} A ${r * .2} ${r * .2} 0 0 1 ${Math.cos((a - 60) * Math.PI / 180) * r * .2} ${-r * .3 + Math.sin((a - 60) * Math.PI / 180) * r * .2} Z`} fill="#f2b134" stroke={ink} strokeWidth={w * .4}/>)}
        <path d={`M 0 0 L ${Math.cos(ang * Math.PI / 180) * r * .78} ${Math.sin(ang * Math.PI / 180) * r * .78}`} {...stroke(ink, w * 1.3)}/>
        <circle cx={0} cy={0} r={w * 1.4} fill={ink}/>
        {c.text && <text x={0} y={r * .32} textAnchor="middle" fontFamily={font} fontSize={s * .14} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'radiation-belt': {
      // Glowing doughnut around a planet centred at (x, y): back and front arcs with a slow pulse (draw the planet between).
      const rx = s, ry = s * .3, col = c.color ?? '#a24bd6', pulse = .75 + .25 * Math.sin(frame / 12);
      return <g transform={at} opacity={pulse}>
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={col} strokeWidth={s * .16} opacity=".35" transform="rotate(-10)"/>
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={col} strokeWidth={s * .06} opacity=".75" transform="rotate(-10)"/>
      </g>;
    }
    case 'battery': {
      // Battery / air gauge: the fill follows level and turns amber then red; caption above (e.g. AIR, BATTERY).
      const lv = levelAt(c.level, frame), bw = s, bh = s * .42, col = lv > .5 ? '#4caf50' : lv > .2 ? '#f2b134' : red;
      return <g transform={at}>
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={bh * .18} fill="#ffffff" stroke={ink} strokeWidth={w}/>
        <rect x={bw / 2} y={-bh * .2} width={bw * .07} height={bh * .4} rx={w * .5} fill={ink}/>
        {lv > .005 && <rect x={-bw / 2 + w * 1.5} y={-bh / 2 + w * 1.5} width={Math.max(0, (bw - w * 3) * lv)} height={bh - w * 3} rx={bh * .1} fill={col}/>}
        {c.text && <text x={0} y={-bh / 2 - s * .08} textAnchor="middle" fontFamily={font} fontSize={s * .2} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'airbag': {
      // Cluster of balloons that inflates with level (0 = packed) and wobbles as it settles.
      const lv = levelAt(c.level, frame), col = c.color ?? '#f4d35e', wob = 1 + Math.sin(frame / 2.5) * .04 * lv;
      const parts: [number, number, number][] = [[0, 0, .42], [-.33, .12, .3], [.33, .12, .3], [-.2, -.28, .26], [.22, -.27, .27]];
      return <g transform={`${at} scale(${Math.max(.05, lv) * wob})`}>{parts.map(([dx, dy, r], i) =>
        <circle key={i} cx={s * dx} cy={s * dy} r={s * r} fill={col} stroke={ink} strokeWidth={w / Math.max(.3, lv)}/>)}
        <path d={`M ${-s * .2} ${-s * .1} A ${s * .3} ${s * .3} 0 0 1 ${s * .05} ${-s * .3}`} {...stroke('#ffffff', w * 1.2 / Math.max(.3, lv))} opacity=".7"/>
      </g>;
    }
    case 'small-moon': {
      // Lumpy potato moon (Phobos, Deimos, Hyperion): seeded wobbly outline, a few craters, slow spin by rotation.
      const random = seededRandom(Math.round(c.x * 613 + c.y * 977 + s) || 3), n = 14, col = c.color ?? '#8f8478';
      const pts = Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2, rr = s * .5 * (.82 + random() * .22) * (Math.abs(Math.cos(a)) * .2 + .85); return [Math.cos(a) * rr * 1.25, Math.sin(a) * rr * .9]; });
      const d = pts.map(([x, y], i) => { const [nx, ny] = pts[(i + 1) % n]; return `${i ? '' : `M ${(x + pts[n - 1][0]) / 2} ${(y + pts[n - 1][1]) / 2} `}Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`; }).join(' ');
      return <g transform={at}>
        <path d={d + ' Z'} fill={col} stroke={ink} strokeWidth={w}/>
        {Array.from({length: 4}, (_, i) => <ellipse key={i} cx={(random() - .5) * s * .7} cy={(random() - .5) * s * .4} rx={s * (.05 + random() * .05)} ry={s * .035} fill="#000000" opacity=".16"/>)}
      </g>;
    }
    case 'asteroid': {
      // A rubble-pile asteroid (Apophis, Bennu...): elongated two-lobed "peanut" outline with seeded lumps and boulders,
      // shaded on one side, craters with lit rims. Width ~1.7x height at size s. Tumble it with the layer's rotate track.
      const random = seededRandom(Math.round(c.x * 431 + c.y * 719 + s) || 7), n = 28, col = c.color ?? '#9a948a', id = `ast-${Math.round(c.x * 1e4)}-${Math.round(c.y * 1e4)}-${Math.round(s)}`;
      const pts = Array.from({length: n}, (_, i) => {
        const a = i / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const waist = 1 - .2 * Math.pow(Math.abs(sa), 1.5) * Math.pow(Math.max(0, 1 - Math.abs(ca) * 1.6), 2);  // pinched middle (two lobes)
        const lump = .9 + random() * .16 + (random() < .2 ? .07 : 0);                                              // rough edge + a few boulders
        const rr = s * .5 * lump * waist;
        return [ca * rr * 1.7, sa * rr];
      });
      const d = pts.map(([x, y], i) => { const [nx, ny] = pts[(i + 1) % n]; return `${i ? '' : `M ${(x + pts[n - 1][0]) / 2} ${(y + pts[n - 1][1]) / 2} `}Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`; }).join(' ') + ' Z';
      const craters = Array.from({length: 7}, () => ({cx: (random() - .5) * s * 1.2, cy: (random() - .5) * s * .55, r: s * (.035 + random() * .06)}));
      return <g transform={at}>
        <defs><clipPath id={id}><path d={d}/></clipPath></defs>
        <path d={d} fill={col}/>
        <g clipPath={`url(#${id})`}>
          <ellipse cx={s * .35} cy={s * .3} rx={s * 1.05} ry={s * .55} fill="#000000" opacity=".22"/>
          {craters.map((k, i) => <g key={i}><ellipse cx={k.cx} cy={k.cy} rx={k.r} ry={k.r * .7} fill="#000000" opacity=".2"/>
            <path d={`M ${k.cx - k.r} ${k.cy} A ${k.r} ${k.r * .7} 0 0 0 ${k.cx + k.r} ${k.cy}`} fill="none" stroke="#ffffff" strokeWidth={w * .45} opacity=".35"/></g>)}
          {Array.from({length: 9}, (_, i) => <circle key={`b${i}`} cx={(random() - .5) * s * 1.5} cy={(random() - .5) * s * .7} r={s * (.012 + random() * .018)} fill="#5f5a52" opacity=".55"/>)}
        </g>
        <path d={d} fill="none" stroke={ink} strokeWidth={w}/>
      </g>;
    }
    case 'ice-cutaway': {
      // Cross-section: ice shell over a dark ocean with waves; level 0-1 shows radiation stopping in the ice (red ticks).
      const bw = s * 2, bh = s, ice = bh * .38, lv = levelAt(c.level, frame), p = theme.palette;
      return <g transform={`${at} translate(0 ${-bh / 2})`}>
        <rect x={-bw / 2} y={0} width={bw} height={bh} fill="#1f4f86" stroke={ink} strokeWidth={w}/>
        <rect x={-bw / 2} y={0} width={bw} height={ice} fill="#eef6fb" stroke={ink} strokeWidth={w}/>
        {[-.6, -.15, .35, .7].map(t => <path key={t} d={`M ${bw * t / 2} 0 l ${s * .04} ${ice * .35} l ${-s * .03} ${ice * .3}`} {...stroke('#8a6a4a', w * .6)}/>)}
        {[.55, .75].map(t => <path key={t} d={`M ${-bw / 2} ${bh * t} q ${bw * .125} ${-s * .05} ${bw * .25} 0 t ${bw * .25} 0 t ${bw * .25} 0 t ${bw * .25} 0`} {...stroke(p.water.light, w * .7)} opacity=".6"/>)}
        {lv > 0 && [-.6, -.2, .2, .6].map(t => <path key={t} d={`M ${bw * t / 2} ${-s * .35} L ${bw * t / 2} ${-s * .35 + (s * .35 + ice * .4) * Math.min(1, lv)}`} {...stroke(red, w)} strokeDasharray={`${w * 2} ${w * 1.5}`}/>)}
      </g>;
    }
    case 'frost': {
      // Ice crystals spreading around (x, y) as level rises (0 = none, 1 = covering a circle of radius size).
      const lv = levelAt(c.level, frame), random = seededRandom(Math.round(c.x * 401 + c.y * 811) || 5), col = c.color ?? '#9fd3f0';
      return <g>{Array.from({length: c.count}, (_, i) => {
        const a = random() * Math.PI * 2, d = Math.sqrt(random()) * s, k = s * (.04 + random() * .05), show = d / s < lv;
        if (!show) return null;
        const x = c.x * width + Math.cos(a) * d, y = c.y * height + Math.sin(a) * d;
        return <g key={i} transform={`translate(${x} ${y}) rotate(${a * 57})`}>{[0, 60, 120].map(r => <path key={r} d={`M ${-k} 0 L ${k} 0 M ${-k * .5} ${-k * .25} L ${-k * .3} 0 L ${-k * .5} ${k * .25}`} transform={`rotate(${r})`} {...stroke(col, Math.max(2, k * .16))}/>)}</g>;
      })}</g>;
    }
    case 'flag': {
      const fw = s * .6, fh = s * .38, wave = Math.sin(frame / 6) * s * .03, col = c.color ?? red;
      return <g transform={at}>
        <path d={`M 0 ${s * .5} L 0 ${-s * .5}`} {...stroke(ink, w * 1.2)}/>
        <path d={`M 0 ${-s * .5} q ${fw / 2} ${wave} ${fw} 0 l 0 ${fh} q ${-fw / 2} ${wave} ${-fw} 0 Z`} fill={col} stroke={ink} strokeWidth={w}/>
        {c.text && <text x={fw / 2} y={-s * .5 + fh * .62} textAnchor="middle" fontFamily={font} fontSize={fh * .32} fill="#ffffff">{c.text}</text>}
      </g>;
    }
    case 'speedometer': {
      const lv = levelAt(c.level, frame), r = s * .5, ang = -200 + 220 * lv;
      return <g transform={at}>
        <circle cx={0} cy={0} r={r} fill="#ffffff" stroke={ink} strokeWidth={w}/>
        {Array.from({length: 9}, (_, i) => { const a = (-200 + i * 27.5) * Math.PI / 180; return <path key={i} d={`M ${Math.cos(a) * r * .72} ${Math.sin(a) * r * .72} L ${Math.cos(a) * r * .86} ${Math.sin(a) * r * .86}`} {...stroke(i > 6 ? red : ink, w * .8)}/>; })}
        <path d={`M 0 0 L ${Math.cos(ang * Math.PI / 180) * r * .7} ${Math.sin(ang * Math.PI / 180) * r * .7}`} {...stroke(red, w * 1.3)}/>
        <circle cx={0} cy={0} r={w * 1.3} fill={ink}/>
        {c.text && <text x={0} y={r * .5} textAnchor="middle" fontFamily={font} fontSize={s * .16} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'race-car': {
      const col = c.color ?? red;
      return <g transform={at}>
        <path d={`M ${-s * .5} ${s * .05} L ${-s * .45} ${-s * .08} L ${-s * .15} ${-s * .1} L ${-s * .05} ${-s * .2} L ${s * .15} ${-s * .2} L ${s * .22} ${-s * .08} L ${s * .5} ${-s * .04} L ${s * .5} ${s * .07} Z`} fill={col} stroke={ink} strokeWidth={w} strokeLinejoin="round"/>
        {[-.3, .3].map(t => <circle key={t} cx={s * t} cy={s * .08} r={s * .1} fill="#2a2433" stroke={ink} strokeWidth={w}/>)}
      </g>;
    }
    case 'sunglasses': return <g transform={at}>
      {[-1, 1].map(k => <path key={k} d={`M ${k * s * .06} ${-s * .12} L ${k * s * .46} ${-s * .12} Q ${k * s * .44} ${s * .14} ${k * s * .26} ${s * .14} Q ${k * s * .08} ${s * .14} ${k * s * .06} ${-s * .12} Z`} fill="#1b1b24" stroke={ink} strokeWidth={w}/>)}
      <path d={`M ${-s * .06} ${-s * .08} q ${s * .06} ${-s * .05} ${s * .12} 0`} {...stroke(ink, w)}/>
      <path d={`M ${-s * .38} ${-s * .06} l ${s * .08} ${s * .08}`} {...stroke('#ffffff', w * .8)} opacity=".7"/>
    </g>;
    case 'crescent': {
      // The Moon: lit disc with craters and a soft glow while level is 1; as level falls it fades to a dashed ghost outline.
      const lv = levelAt(c.level, frame), r = s * .5;
      return <g transform={at}>
        <circle r={r * 1.25} fill="#fff6c8" opacity={lv * .1}/>
        <circle r={r} fill="#ece8d6" stroke={ink} strokeWidth={w} opacity={lv}/>
        {[[-.3, -.25, .14], [.2, -.1, .1], [-.05, .3, .17], [.32, .28, .08], [-.38, .12, .07]].map(([cx, cy, cr], i) =>
          <circle key={i} cx={cx * r} cy={cy * r} r={cr * r} fill="#cfc9b2" stroke={ink} strokeWidth={w * .4} opacity={lv * .9}/>)}
        <circle r={r} fill="none" stroke={ink} strokeWidth={w * .8} strokeDasharray={`${w * 2.5} ${w * 2.5}`} opacity={(1 - lv) * .75}/>
      </g>;
    }
    case 'orbit-ring': {
      // Dashed empty orbit (the Moon's missing path). size is the diameter.
      return <g transform={at}><circle r={s * .5} fill="none" stroke={c.color ?? ink} strokeWidth={w * .6} strokeDasharray={`${w * 3} ${w * 3}`} opacity=".65"
        strokeDashoffset={-frame * .6}/></g>;
    }
    case 'town': {
      // A row of houses at night; windows glow while level > .5.
      const lit = levelAt(c.level, frame) > .5, hs = [[-.5, .22, .3], [-.3, .3, .22], [-.1, .2, .28], [.1, .34, .24], [.3, .24, .26]];
      return <g transform={at}>{hs.map(([x0, h, bw], i) => {
        const x = x0 * s, wdt = bw * s * .9, hh = h * s;
        return <g key={i}>
          <rect x={x} y={-hh} width={wdt} height={hh} fill="#1b2747" stroke={ink} strokeWidth={w * .6}/>
          <path d={`M ${x - wdt * .08} ${-hh} L ${x + wdt / 2} ${-hh - wdt * .45} L ${x + wdt * 1.08} ${-hh}`} fill="#24335c" stroke={ink} strokeWidth={w * .6} strokeLinejoin="round"/>
          {[.2, .6].map(fx => [.3, .65].map(fy => <rect key={`${fx}${fy}`} x={x + wdt * fx} y={-hh + hh * fy} width={wdt * .2} height={hh * .14} fill={lit && (i + fx * 10 + fy * 10) % 3 > .5 ? '#ffd86b' : '#0f1830'} stroke={ink} strokeWidth={w * .3}/>))}
        </g>;
      })}</g>;
    }
    case 'lion': {
      // Side-on lion; level is belly fullness (0 thin, 1 round).
      const lv = levelAt(c.level, frame), body = '#d9a441', mane = '#a8641f', by = s * .16 * (1 + lv * .35), tail = Math.sin(frame / 10) * s * .03;
      return <g transform={at}>
        {[-.22, -.1, .12, .24].map(t => <path key={t} d={`M ${t * s} ${s * .05} L ${t * s} ${s * .3}`} {...stroke(ink, w * 1.6)}/>)}
        <path d={`M ${-s * .32} ${-s * .02} q ${-s * .14} ${s * .02} ${-s * .2} ${-s * .14 + tail}`} {...stroke(ink, w)}/>
        <circle cx={-s * .53} cy={-s * .17 + tail} r={s * .035} fill={mane} stroke={ink} strokeWidth={w * .6}/>
        <ellipse cx={0} cy={s * .02} rx={s * .34} ry={by} fill={body} stroke={ink} strokeWidth={w}/>
        <circle cx={s * .36} cy={-s * .14} r={s * .17} fill={mane} stroke={ink} strokeWidth={w}/>
        <circle cx={s * .38} cy={-s * .13} r={s * .11} fill={body} stroke={ink} strokeWidth={w}/>
        <circle cx={s * .42} cy={-s * .16} r={s * .014} fill="#1b1b1b"/>
        <path d={`M ${s * .47} ${-s * .1} l ${s * .02} ${s * .02} l ${-s * .03} ${s * .01}`} {...stroke('#1b1b1b', w * .6)}/>
      </g>;
    }
    case 'zebra': {
      const id = `zebra-${Math.round(c.x * 1000)}-${Math.round(c.y * 1000)}`;
      return <g transform={at}>
        {[-.2, -.08, .12, .22].map(t => <path key={t} d={`M ${t * s} ${s * .05} L ${t * s} ${s * .3}`} {...stroke(ink, w * 1.4)}/>)}
        <defs><clipPath id={id}><ellipse cx={0} cy={0} rx={s * .3} ry={s * .14}/></clipPath></defs>
        <ellipse cx={0} cy={0} rx={s * .3} ry={s * .14} fill="#f7f7f2"/>
        <g clipPath={`url(#${id})`}>{Array.from({length: 7}, (_, i) => <path key={i} d={`M ${(-.27 + i * .085) * s} ${-s * .16} l ${s * .03} ${s * .32}`} {...stroke('#1b1b1b', w * 1.5)}/>)}</g>
        <ellipse cx={0} cy={0} rx={s * .3} ry={s * .14} fill="none" stroke={ink} strokeWidth={w}/>
        <path d={`M ${s * .24} ${-s * .06} L ${s * .36} ${-s * .28}`} {...stroke(ink, w * 2.6)}/><path d={`M ${s * .24} ${-s * .06} L ${s * .36} ${-s * .28}`} {...stroke('#f7f7f2', w * 1.4)}/>
        <ellipse cx={s * .42} cy={-s * .3} rx={s * .09} ry={s * .045} transform={`rotate(25 ${s * .42} ${-s * .3})`} fill="#f7f7f2" stroke={ink} strokeWidth={w}/>
        <circle cx={s * .41} cy={-s * .33} r={s * .012} fill="#1b1b1b"/>
        <path d={`M ${-s * .3} 0 q ${-s * .08} ${s * .04} ${-s * .1} ${s * .14}`} {...stroke(ink, w)}/>
      </g>;
    }
    case 'coral': {
      // Branching coral; level > 0 releases rising pink eggs (count of them).
      const lv = levelAt(c.level, frame), col = c.color ?? '#f07c7c';
      const br = ['M 0 0 L 0 -0.35 L -0.12 -0.5', 'M 0 -0.2 L 0.14 -0.38 L 0.16 -0.52', 'M 0 -0.35 L 0.06 -0.58', 'M -0.2 0 L -0.22 -0.25 L -0.32 -0.38', 'M 0.22 0 L 0.26 -0.2 L 0.36 -0.3'];
      return <g transform={at}>
        {br.map((d, i) => <path key={i} d={d.replace(/-?\d*\.?\d+/g, v => String(+v * s))} {...stroke(ink, w * 3.2)}/>)}
        {br.map((d, i) => <path key={`f${i}`} d={d.replace(/-?\d*\.?\d+/g, v => String(+v * s))} {...stroke(col, w * 2)}/>)}
        <ellipse cx={0} cy={s * .02} rx={s * .42} ry={s * .06} fill="#8a7a66" stroke={ink} strokeWidth={w}/>
        {lv > .01 && Array.from({length: c.count}, (_, i) => {
          const t = ((frame * 1.1 + i * 41) % 120) / 120, x = (((i * 37) % 70) / 70 - .5) * s * .7 + Math.sin(frame / 15 + i) * s * .03;
          return <circle key={`e${i}`} cx={x} cy={-s * .45 - t * s * .7} r={s * .022} fill="#ffc2d6" stroke={ink} strokeWidth={w * .3} opacity={lv * (1 - t)}/>;
        })}
      </g>;
    }
    case 'plankton': {
      // A swarm of tiny animals; level is depth (0 near the surface line, 1 deep).
      const lv = levelAt(c.level, frame);
      return <g transform={at}>
        <path d={`M ${-s * .55} ${-s * .5} q ${s * .1} ${-s * .03} ${s * .2} 0 t ${s * .2} 0 t ${s * .2} 0 t ${s * .2} 0 t ${s * .2} 0 t ${s * .1} 0`} {...stroke(c.color ?? '#7fc0ff', w * .8)}/>
        {Array.from({length: c.count}, (_, i) => {
          const x = ((i * 53) % 100 / 100 - .5) * s, y = (-.4 + lv * .8) * s + ((i * 29) % 30 / 100 - .15) * s + Math.sin(frame / 12 + i) * s * .015;
          return <g key={i}><circle cx={x} cy={y} r={s * .024} fill="#bfe6ff" stroke={ink} strokeWidth={w * .3}/><path d={`M ${x} ${y + s * .024} l ${s * .012} ${s * .035}`} {...stroke(ink, w * .4)}/></g>;
        })}
      </g>;
    }
    case 'tide-gauge': {
      // Tide post: the water swings around mid-height with amplitude = level (1 = today's tide).
      const amp = levelAt(c.level, frame) * .38, lvl = .5 + amp * Math.sin(frame * 2 * Math.PI / 80), h = s, bw = s * .26, top = -h / 2, y = h / 2 - h * lvl;
      return <g transform={at}>
        <rect x={-bw / 2} y={y} width={bw} height={h / 2 - y} fill="#3d7fd0" opacity=".85"/>
        <path d={`M ${-bw / 2} ${y} q ${bw / 4} ${-s * .03} ${bw / 2} 0 t ${bw / 2} 0`} {...stroke('#bfe6ff', w * .7)}/>
        <rect x={-bw / 2} y={top} width={bw} height={h} fill="none" stroke={ink} strokeWidth={w}/>
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${-bw / 2} ${top + h * i / 8} l ${i % 2 ? s * .05 : s * .09} 0`} {...stroke(ink, w * .6)}/>)}
        {c.text && <text x={0} y={top - s * .05} textAnchor="middle" fontFamily={font} fontSize={s * .11} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'tilt-dial': {
      // Quarter dial: 0 deg (upright) to 90 deg (on its side). level 0-1 maps to the needle angle; range [lo, hi] shades a band.
      const R = s * .5, cx = -s * .3, cy = s * .3, pt = (a: number, r = R) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
      const arc = (a0: number, a1: number, r = R) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`; };
      const needle = levelAt(c.level, frame) * 90, [nx, ny] = pt(needle, R * .92);
      return <g transform={at}>
        {c.range && <path d={arc(c.range[0], c.range[1], R * .82)} {...stroke(c.color ?? red, s * .1)} opacity=".55" strokeLinecap="butt"/>}
        <path d={`${arc(0, 90)} L ${cx} ${cy} Z`} fill="none" stroke={ink} strokeWidth={w}/>
        {[0, 15, 30, 45, 60, 75, 90].map(a => { const [x0, y0] = pt(a, R), [x1, y1] = pt(a, R * (a % 45 ? .93 : .88)); return <path key={a} d={`M ${x0} ${y0} L ${x1} ${y1}`} {...stroke(ink, w * .7)}/>; })}
        {[0, 45, 90].map(a => { const [x, y] = pt(a, R * 1.13); return <text key={`t${a}`} x={x} y={y + s * .03} textAnchor="middle" fontFamily={font} fontSize={s * .11} fill={ink}>{a}°</text>; })}
        <path d={`M ${cx} ${cy} L ${nx} ${ny}`} {...stroke(red, w * 1.6)}/><circle cx={cx} cy={cy} r={w * 1.6} fill={red}/>
        {c.text && <text x={cx + R * .5} y={cy + s * .14} textAnchor="middle" fontFamily={font} fontSize={s * .09} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'earth-axis': {
      // Earth with its spin axis; rotate the prop to tilt it. level is spin speed (rotating land bands).
      const r = s * .35, sp = levelAt(c.level, frame), off = ((frame * sp * 3) % 100) / 100;
      return <g transform={at}>
        <defs><clipPath id={`ea-${Math.round(c.x * 1000)}`}><circle r={r}/></clipPath></defs>
        <circle r={r} fill="#3f7fd6" stroke={ink} strokeWidth={w}/>
        <g clipPath={`url(#ea-${Math.round(c.x * 1000)})`}>{[0, 1, 2].map(i => { const x = (((off + i / 3) % 1) * 2 - 1) * r * 1.4;
          return <ellipse key={i} cx={x} cy={(i - 1) * r * .45} rx={r * .28} ry={r * .18} fill="#5bb36a" stroke={ink} strokeWidth={w * .4}/>; })}</g>
        <ellipse rx={r} ry={r * .2} fill="none" stroke={ink} strokeWidth={w * .4} opacity=".5"/>
        <path d={`M 0 ${-r * 1.45} L 0 ${r * 1.45}`} {...stroke(red, w * 1.1)} strokeDasharray={`${w * 2} ${w * 1.5}`}/>
        <path d={`M ${-r * .35} ${-r * 1.25} A ${r * .35} ${r * .1} 0 1 0 ${r * .35} ${-r * 1.25}`} {...stroke(ink, w * .8)}/>
        <path d={`M ${r * .35} ${-r * 1.25} l ${-r * .1} ${-r * .06} m ${r * .1} ${r * .06} l ${-r * .02} ${r * .1}`} {...stroke(ink, w * .8)}/>
      </g>;
    }
    case 'impact': {
      // A giant impact: a starburst grows with level, debris flies outward and fades.
      const p = levelAt(c.level, frame), R = s * .5 * p;
      const star = Array.from({length: 16}, (_, i) => { const a = i * Math.PI / 8, rr = i % 2 ? R * .5 : R; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(' ');
      return <g transform={at} opacity={p > 0 ? Math.min(1, 1.6 - p) : 0}>
        <circle r={R * 1.2} fill="#ffcf4a" opacity=".25"/>
        <polygon points={star} fill="#ffe27a" stroke={red} strokeWidth={w}/>
        {Array.from({length: c.count}, (_, i) => { const a = i * 2.39, d = R * (1.1 + (i % 3) * .3); return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={s * .02 * (1 + i % 2)} fill="#9a8d80" stroke={ink} strokeWidth={w * .4}/>; })}
      </g>;
    }
    case 'dino': {
      // Cartoon T. rex, side-on, facing right.
      const g = '#6fa86a', bob = Math.sin(frame / 9) * s * .01;
      return <g transform={`${at} translate(0 ${bob})`}>
        <path d={`M ${-s * .05} ${s * .1} L ${-s * .1} ${s * .38} M ${s * .08} ${s * .1} L ${s * .1} ${s * .38}`} {...stroke(ink, w * 2.2)}/>
        <path d={`M ${-s * .14} ${s * .38} l ${-s * .06} 0 M ${s * .1} ${s * .38} l ${s * .07} 0`} {...stroke(ink, w * 1.6)}/>
        <path d={`M ${-s * .12} ${s * .02} Q ${-s * .4} ${s * .05} ${-s * .55} ${s * .2} Q ${-s * .38} ${s * .14} ${-s * .1} ${s * .16} Z`} fill={g} stroke={ink} strokeWidth={w}/>
        <ellipse cx={0} cy={s * .04} rx={s * .2} ry={s * .14} transform={`rotate(-25)`} fill={g} stroke={ink} strokeWidth={w}/>
        <path d={`M ${s * .12} ${s * .02} l ${s * .07} ${s * .05} M ${s * .1} ${s * .06} l ${s * .06} ${s * .05}`} {...stroke(ink, w)}/>
        <path d={`M ${s * .08} ${-s * .14} L ${s * .38} ${-s * .16} Q ${s * .44} ${-s * .1} ${s * .38} ${-s * .04} L ${s * .2} ${-s * .04} Q ${s * .08} ${-s * .02} ${s * .06} ${-s * .08} Z`} fill={g} stroke={ink} strokeWidth={w}/>
        <path d={`M ${s * .24} ${-s * .06} l ${s * .02} ${s * .02} l ${s * .02} ${-s * .02} l ${s * .02} ${s * .02} l ${s * .02} ${-s * .02}`} {...stroke('#ffffff', w * .6)}/>
        <circle cx={s * .2} cy={-s * .12} r={s * .018} fill="#1b1b1b"/>
      </g>;
    }
    case 'reflector': {
      // Apollo-style laser reflector panel on legs; a red beam arrives from upper-left (level 0-.5) and returns (.5-1).
      const p = levelAt(c.level, frame), sx = -s * 1.4, sy = -s * .9, ex = 0, ey = -s * .12;
      const go = Math.min(1, p * 2), back = Math.max(0, p * 2 - 1);
      return <g transform={at}>
        {go > 0 && <path d={`M ${sx} ${sy} L ${sx + (ex - sx) * go} ${sy + (ey - sy) * go}`} {...stroke('#ff4d4d', w * 1.2)}/>}
        {back > 0 && <path d={`M ${ex} ${ey} L ${ex + (sx - ex) * back} ${ey + (sy - ey) * back}`} {...stroke('#ff9a9a', w * .8)} strokeDasharray={`${w * 2} ${w}`}/>}
        <path d={`M ${-s * .14} ${s * .05} L ${-s * .2} ${s * .22} M ${s * .14} ${s * .05} L ${s * .2} ${s * .22}`} {...stroke(ink, w)}/>
        <rect x={-s * .22} y={-s * .2} width={s * .44} height={s * .26} rx={s * .02} fill="#b9b9b2" stroke={ink} strokeWidth={w} transform={`rotate(-12)`}/>
        <g transform="rotate(-12)">{Array.from({length: 12}, (_, i) => <circle key={i} cx={-s * .16 + (i % 4) * s * .107} cy={-s * .14 + Math.floor(i / 4) * s * .075} r={s * .028} fill="#e8e8e2" stroke={ink} strokeWidth={w * .4}/>)}</g>
      </g>;
    }
    case 'bed': {
      // Someone in bed; level 0 asleep (Zzz), 1 wide awake (open eyes, no Zzz).
      const awake = levelAt(c.level, frame) > .5;
      return <g transform={at}>
        <rect x={-s * .45} y={-s * .02} width={s * .9} height={s * .16} rx={s * .03} fill="#8a6a4a" stroke={ink} strokeWidth={w}/>
        <path d={`M ${-s * .45} ${-s * .02} L ${-s * .45} ${-s * .2} M ${s * .45} ${-s * .02} L ${s * .45} ${-s * .12}`} {...stroke(ink, w * 1.4)}/>
        <ellipse cx={-s * .3} cy={-s * .07} rx={s * .1} ry={s * .05} fill="#ffffff" stroke={ink} strokeWidth={w * .7}/>
        <circle cx={-s * .27} cy={-s * .13} r={s * .07} fill="#ffffff" stroke={ink} strokeWidth={w}/>
        {awake ? <>{[-.3, -.24].map(t => <circle key={t} cx={t * s} cy={-s * .14} r={s * .012} fill={ink}/>)}</>
          : <path d={`M ${-s * .31} ${-s * .13} l ${s * .03} 0 M ${-s * .25} ${-s * .13} l ${s * .03} 0`} {...stroke(ink, w * .6)}/>}
        <path d={`M ${-s * .2} ${-s * .06} Q 0 ${-s * .14} ${s * .42} ${-s * .06} L ${s * .42} ${s * .02} L ${-s * .2} ${s * .02} Z`} fill={c.color ?? '#5b7fc7'} stroke={ink} strokeWidth={w}/>
        {!awake && ['z', 'z', 'Z'].map((z, i) => <text key={i} x={-s * .2 + i * s * .07} y={-s * .25 - i * s * .07 - (frame % 40) * s * .001} fontFamily={font} fontSize={s * (.06 + i * .02)} fill={ink} opacity={.5 + .5 * Math.sin(frame / 10 + i)}>{z}</text>)}
      </g>;
    }
    case 'stir': {
      // A block of ocean with swirling arrows; level is how strongly it's stirred.
      const lv = levelAt(c.level, frame), rot = frame * lv * 4;
      return <g transform={at}>
        <rect x={-s * .5} y={-s * .3} width={s} height={s * .6} rx={s * .04} fill="#1f4f8f" stroke={ink} strokeWidth={w}/>
        <path d={`M ${-s * .5} ${-s * .3} q ${s * .125} ${-s * .04} ${s * .25} 0 t ${s * .25} 0 t ${s * .25} 0 t ${s * .25} 0`} {...stroke('#7fc0ff', w * .8)}/>
        <g transform={`rotate(${rot})`} opacity={.25 + lv * .75}>{[0, 120, 240].map(a => <g key={a} transform={`rotate(${a})`}>
          <path d={`M ${s * .18} 0 A ${s * .18} ${s * .18} 0 0 1 ${-s * .09} ${s * .156}`} {...stroke('#bfe6ff', w * 1.1)}/>
          <path d={`M ${-s * .09} ${s * .156} l ${s * .06} ${s * .01} m ${-s * .06} ${-s * .01} l ${s * .01} ${-s * .06}`} {...stroke('#bfe6ff', w * 1.1)}/></g>)}</g>
      </g>;
    }
    case 'clock-time': {
      // Clock set to a real time: values = seconds after 12:00:00 (ramp to run it). Analog face plus a digital readout; text: caption.
      const v = counterAt(c.values ?? [], frame), r = s * .4, mn = (v / 60) * 6, hr = (v / 3600) * 30;
      const hh = 12 + Math.floor(v / 3600), mm = Math.floor((v % 3600) / 60), ss = v % 60, pad = (n: number) => String(n).padStart(2, '0');
      const label = `${hh > 12 ? hh - 12 : hh}:${pad(mm)}:${pad(ss)}`, bw = s * .78, bh = s * .2, by = r + s * .06;
      return <g transform={at}>
        <circle r={r} fill="#ffffff" stroke={ink} strokeWidth={w}/>
        {Array.from({length: 12}, (_, i) => { const a = i * Math.PI / 6; return <path key={i} d={`M ${Math.sin(a) * r * .85} ${-Math.cos(a) * r * .85} L ${Math.sin(a) * r * .95} ${-Math.cos(a) * r * .95}`} {...stroke('#1b1b1b', w * .6)}/>; })}
        {mn > 0 && <path d={`M 0 0 L 0 ${-r * .7} A ${r * .7} ${r * .7} 0 ${mn > 180 ? 1 : 0} 1 ${Math.sin(mn * Math.PI / 180) * r * .7} ${-Math.cos(mn * Math.PI / 180) * r * .7} Z`} fill="#ffd25e" opacity=".45"/>}
        <path d={`M 0 0 L 0 ${-r * .5}`} {...stroke('#1b1b1b', w * 1.4)} transform={`rotate(${hr})`}/>
        <path d={`M 0 0 L 0 ${-r * .78}`} {...stroke('#c0392b', w)} transform={`rotate(${mn})`}/>
        <circle r={w} fill="#1b1b1b"/>
        <rect x={-bw / 2} y={by} width={bw} height={bh} rx={s * .04} fill="#0f1830" stroke={ink} strokeWidth={w * .6}/>
        <text x={0} y={by + bh * .76} textAnchor="middle" fontFamily="'Courier New', monospace" fontWeight="bold" fontSize={bh * .78} fill="#ffd25e">{label}</text>
        {c.text && <text x={0} y={by + bh + s * .17} textAnchor="middle" fontFamily={font} fontSize={s * .15} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'rope': {
      // A rope along x (size = length, centred). level: a kink travelling from the left end (0) to the right end (1).
      // direction 'out': snapped at the middle; level = how far the two halves have recoiled (0..1).
      const lv = levelAt(c.level, frame), L = s, col = c.color ?? '#e8d9b0';
      if (c.direction === 'out') {
        const k = Math.min(1, lv), half = L / 2 * (1 - .55 * k), wob = s * .04 * k;
        const left = `M ${-L / 2} 0 Q ${-L / 2 + half * .5} ${-wob} ${-L / 2 + half} ${wob}`, right = `M ${L / 2} 0 Q ${L / 2 - half * .5} ${wob} ${L / 2 - half} ${-wob}`;
        return <g transform={at} opacity={1 - .6 * k}><path d={left} {...stroke(col, w * .9)}/><path d={right} {...stroke(col, w * .9)}/></g>;
      }
      const kx = -L / 2 + L * lv, show = lv > 0 && lv < 1, kw = s * .06, kh = s * .08;
      const d = show ? `M ${-L / 2} 0 L ${kx - kw} 0 Q ${kx - kw / 2} ${-kh} ${kx} 0 Q ${kx + kw / 2} ${kh} ${kx + kw} 0 L ${L / 2} 0` : `M ${-L / 2} 0 L ${L / 2} 0`;
      return <g transform={at}><path d={d} {...stroke(col, w * .9)}/>{show && <circle cx={kx} cy={0} r={w * 1.6} fill="#ffd25e" opacity=".55"/>}</g>;
    }
    case 'pulse': {
      // A faint track along x (size = length, centred) with a glowing dot at level (0 = left end, 1 = right end).
      const lv = levelAt(c.level, frame), L = s, col = c.color ?? '#fff6c8', x = -L / 2 + L * lv;
      return <g transform={at}>
        <path d={`M ${-L / 2} 0 L ${L / 2} 0`} {...stroke(col, w * .35)} opacity=".35" strokeDasharray={`${w * 2} ${w * 2}`}/>
        {lv > 0 && <path d={`M ${Math.max(-L / 2, x - L * .12)} 0 L ${x} 0`} {...stroke(col, w * .9)} opacity=".7"/>}
        {lv > 0 && lv <= 1 && <><circle cx={x} cy={0} r={w * 2.6} fill={col} opacity=".3"/><circle cx={x} cy={0} r={w * 1.2} fill={col}/></>}
      </g>;
    }
    case 'span': {
      // A measured distance: a double-headed line along x (size = length, centred) with end ticks; text above it. level = drawn fraction.
      const lv = levelAt(c.level, frame), L = s * lv, col = c.color ?? ink, k = s * .025;
      return <g transform={at}>
        <path d={`M ${-L / 2} 0 L ${L / 2} 0`} {...stroke(col, w * .5)}/>
        <path d={`M ${-L / 2} ${-k * 1.6} L ${-L / 2} ${k * 1.6} M ${L / 2} ${-k * 1.6} L ${L / 2} ${k * 1.6}`} {...stroke(col, w * .5)}/>
        <path d={`M ${-L / 2 + k * 1.8} ${-k} L ${-L / 2} 0 L ${-L / 2 + k * 1.8} ${k} M ${L / 2 - k * 1.8} ${-k} L ${L / 2} 0 L ${L / 2 - k * 1.8} ${k}`} {...stroke(col, w * .5)}/>
        {c.text && lv > .6 && <text x={0} y={-s * .035} textAnchor="middle" fontFamily={font} fontSize={s * .06} fill={col}>{c.text}</text>}
      </g>;
    }
    case 'sky': {
      // A daytime sky over the whole frame (centre it; covers 2.6 x size wide, 1.3 x size tall, so camera moves never show an edge). level 1 = bright day, 0 = gone (night shows through).
      const lv = levelAt(c.level, frame), id = `sky-${Math.round(c.x * 1000)}-${Math.round(c.y * 1000)}`;
      return <g transform={at} opacity={lv}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.color ?? '#6fb6ff'}/><stop offset="1" stopColor="#cfe8ff"/></linearGradient></defs>
        <rect x={-s * 1.3} y={-s * .65} width={s * 2.6} height={s * 1.3} fill={`url(#${id})`}/>
      </g>;
    }
    case 'streetlight': {
      // A street lamp (size = height, base at y + size/2). Glows when level > .5.
      const on = levelAt(c.level, frame) > .5, top = -s / 2;
      return <g transform={at}>
        <path d={`M 0 ${s / 2} L 0 ${top + s * .05} Q 0 ${top} ${s * .08} ${top}`} {...stroke(ink, w * .7)}/>
        <path d={`M ${s * .04} ${top + s * .01} L ${s * .14} ${top + s * .01} L ${s * .12} ${top + s * .05} L ${s * .06} ${top + s * .05} Z`} fill={on ? '#ffd86b' : '#3a4566'} stroke={ink} strokeWidth={w * .4}/>
        {on && <path d={`M ${s * .06} ${top + s * .05} L ${-s * .12} ${s / 2} L ${s * .32} ${s / 2} L ${s * .12} ${top + s * .05} Z`} fill="#ffd86b" opacity=".18"/>}
      </g>;
    }
    case 'arrow': {
      // A hand-drawn arrow along x (size = length, centred); level = drawn fraction (0..1).
      const lv = levelAt(c.level, frame), L = s * lv, col = c.color ?? ink, k = s * .14, x1 = -s / 2 + L;
      if (lv <= 0) return null;
      return <g transform={at}><path d={`M ${-s / 2} 0 Q ${-s / 2 + L / 2} ${-s * .04} ${x1} 0`} {...stroke(col, w * 1.1)}/>
        {lv > .3 && <path d={`M ${x1 - k} ${-k * .6} L ${x1} 0 L ${x1 - k} ${k * .6}`} {...stroke(col, w * 1.1)}/>}</g>;
    }
    case 'ice-layer': {
      // A frozen layer on the ground (centred; 2 x size wide). level = thickness (0..1, up to 0.1 x size), with frost crystals on top.
      const lv = levelAt(c.level, frame), t = s * .1 * lv, random = seededRandom(17);
      if (lv <= 0) return null;
      return <g transform={at}>
        <rect x={-s} y={-t} width={s * 2} height={t + s * .02} fill="#e8f4ff" stroke="#9fd3f0" strokeWidth={w * .4}/>
        {Array.from({length: 26}, (_, i) => { const x = (random() - .5) * s * 1.9, k = s * (.008 + random() * .01); return <path key={i} d={`M ${x - k} ${-t} L ${x + k} ${-t} M ${x} ${-t - k} L ${x} ${-t + k}`} {...stroke('#ffffff', w * .3)}/>; })}
      </g>;
    }
    case 'city-lights': {
      // Tiny city lights scattered over the left half of a planet disc (size = diameter; rotate to choose the side). level = brightness.
      const lv = levelAt(c.level, frame), r = s * .5, random = seededRandom(Math.round(c.x * 97 + c.y * 89) || 3);
      return <g transform={at} opacity={lv}>{Array.from({length: c.count * 2}, (_, i) => { const a = Math.PI / 2 + random() * Math.PI, d = Math.sqrt(random()) * r * .88;
        return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={s * (.006 + random() * .006)} fill="#ffd86b"/>; })}</g>;
    }
    case 'caption': {
      // A plain hand-lettered caption (size = letter height x 4); for small honest labels like "not to scale".
      return c.text ? <text transform={at} x={0} y={0} textAnchor="middle" fontFamily={font} fontSize={s * .25} fill={c.color ?? ink}>{c.text}</text> : null;
    }
    case 'tide-bulge': {
      // Ocean bulges around a planet (size = planet diameter), stretched along x. level = bulge size (0 none, 1 big).
      const lv = levelAt(c.level, frame), r = s * .5;
      return <g transform={at}><ellipse rx={r * (1 + .45 * lv)} ry={r * (1 + .04 * lv)} fill={c.color ?? '#4f9de8'} fillOpacity=".45" stroke={c.color ?? '#7fc0ff'} strokeWidth={w * .4}/></g>;
    }
    case 'clock': {
      // Clock face; level sets how fast the hands spin (0 stopped, 1 fast). text: caption below.
      const lv = levelAt(c.level, frame), r = s * .4, hr = frame * lv * 2, mn = frame * lv * 24;
      return <g transform={at}>
        <circle r={r} fill="#ffffff" stroke={ink} strokeWidth={w}/>
        {Array.from({length: 12}, (_, i) => { const a = i * Math.PI / 6; return <path key={i} d={`M ${Math.sin(a) * r * .85} ${-Math.cos(a) * r * .85} L ${Math.sin(a) * r * .95} ${-Math.cos(a) * r * .95}`} {...stroke('#1b1b1b', w * .6)}/>; })}
        <path d={`M 0 0 L 0 ${-r * .5}`} {...stroke('#1b1b1b', w * 1.4)} transform={`rotate(${hr})`}/>
        <path d={`M 0 0 L 0 ${-r * .78}`} {...stroke(red, w)} transform={`rotate(${mn})`}/>
        <circle r={w} fill="#1b1b1b"/>
        {c.text && <text x={0} y={r + s * .17} textAnchor="middle" fontFamily={font} fontSize={s * .17} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'eclipse': {
      // text 'solar' (default): the Moon slides across the Sun; at level 1 it covers it and the corona shows.
      // text 'lunar': Earth's shadow slides over the Moon, which turns copper-red when fully inside. level = progress 0..1.
      const p = levelAt(c.level, frame), r = s * .5, id = `ecl-${Math.round(c.x * 1000)}-${Math.round(c.y * 1000)}`;
      if (c.text === 'lunar') {
        const sx = (1 - p) * r * 2.6;
        return <g transform={at}>
          <defs><clipPath id={id}><circle r={r}/></clipPath></defs>
          <circle r={r * 1.3} fill="#ff7a4a" opacity={p * p * .12}/>
          <circle r={r} fill="#ece8d6" stroke={ink} strokeWidth={w}/>
          <circle r={r} fill="#b4442a" opacity={p * p * .85}/>
          <g clipPath={`url(#${id})`}><circle cx={sx} r={r * 1.35} fill="#2a1410" opacity={.55 * (1 - p * .6)}/></g>
          {[[-.3, -.25, .14], [.2, -.1, .1], [-.05, .3, .17], [.32, .28, .08]].map(([cx, cy, cr], i) =>
            <circle key={i} cx={cx * r} cy={cy * r} r={cr * r} fill="none" stroke={ink} strokeWidth={w * .4} opacity=".5"/>)}
          <circle r={r} fill="none" stroke={ink} strokeWidth={w}/>
        </g>;
      }
      const mx = (1 - p) * -r * 2.2, cor = Math.max(0, (p - .85) / .15);
      return <g transform={at}>
        {Array.from({length: 16}, (_, i) => { const a = i / 16 * Math.PI * 2, l = r * (1.45 + (i % 3) * .22);
          return <path key={i} d={`M ${Math.cos(a) * r * 1.02} ${Math.sin(a) * r * 1.02} L ${Math.cos(a) * l} ${Math.sin(a) * l}`} {...stroke('#fff4c2', w * .9)} opacity={cor * .85}/>; })}
        <circle r={r * 1.12} fill="#fff6d8" opacity={cor * .55}/>
        <circle r={r} fill="#ffd34d" stroke={ink} strokeWidth={w} opacity={1 - cor * .2}/>
        <circle cx={mx} r={r * 1.02} fill="#141a33" stroke={ink} strokeWidth={w * .8}/>
      </g>;
    }
    case 'moonbeam': {
      // A soft cone of moonlight shining down from (x, y); size is its length, w its spread. level = brightness.
      const lv = levelAt(c.level, frame), L = s, top = s * .06, bot = s * .42, id = `mb-${Math.round(c.x * 1000)}`;
      return <g transform={at} opacity={lv}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff6c8" stopOpacity=".55"/><stop offset="1" stopColor="#fff6c8" stopOpacity="0"/></linearGradient></defs>
        <path d={`M ${-top} 0 L ${top} 0 L ${bot} ${L} L ${-bot} ${L} Z`} fill={`url(#${id})`}/>
        {[.35, .6, .85].map((f, i) => <path key={i} d={`M ${-bot * f * .9} ${L * f} q ${bot * .2} ${-s * .015} ${bot * .4} 0 t ${bot * .4} 0`} {...stroke('#fff6c8', w * .35)}
          opacity={.35 + .25 * Math.sin(frame / 12 + i)}/>)}
      </g>;
    }
    case 'bee': {
      // A honeybee. level 1 = flying (wings flutter, gentle bob); 0 = resting, wings still.
      const lv = levelAt(c.level, frame), bob = lv * Math.sin(frame / 5) * s * .04, flap = lv > .5 ? Math.sin(frame * 1.6) * 22 : 0;
      return <g transform={`${at} translate(0 ${bob})`}>
        <ellipse cx={-s * .06} cy={-s * .2} rx={s * .16} ry={s * .09} fill="#ffffff" fillOpacity=".7" stroke={ink} strokeWidth={w * .6} transform={`rotate(${-30 + flap} ${-s * .02} ${-s * .1})`}/>
        <ellipse cx={s * .08} cy={-s * .2} rx={s * .15} ry={s * .08} fill="#ffffff" fillOpacity=".6" stroke={ink} strokeWidth={w * .6} transform={`rotate(${20 - flap} ${s * .04} ${-s * .1})`}/>
        <ellipse rx={s * .3} ry={s * .19} fill="#f6c431" stroke={ink} strokeWidth={w}/>
        {[-.08, .06, .18].map((x, i) => <path key={i} d={`M ${x * s} ${-s * .18} Q ${(x + .04) * s} 0 ${x * s} ${s * .18}`} {...stroke('#2a2018', w * 1.3)}/>)}
        <circle cx={-s * .3} cy={-s * .02} r={s * .12} fill="#2a2018" stroke={ink} strokeWidth={w * .6}/>
        <circle cx={-s * .34} cy={-s * .05} r={s * .025} fill="#ffffff"/>
        <path d={`M ${s * .3} 0 l ${s * .08} ${s * .02}`} {...stroke('#2a2018', w)}/>
      </g>;
    }
    case 'flower': return <g transform={at}>
      <path d={`M 0 0 Q ${-s * .05} ${s * .3} 0 ${s * .6}`} {...stroke('#3f8a3a', w * 1.2)}/>
      <path d={`M 0 ${s * .35} q ${s * .15} ${-s * .08} ${s * .2} ${-s * .2} q ${-s * .14} ${s * .02} ${-s * .2} ${s * .2} Z`} fill="#5aa84e" stroke={ink} strokeWidth={w * .5}/>
      {Array.from({length: 6}, (_, i) => { const a = i * 60 + Math.sin(frame / 25) * 3; return <ellipse key={i} cx={0} cy={-s * .14} rx={s * .08} ry={s * .14} fill={c.color ?? '#ff8fb1'} stroke={ink} strokeWidth={w * .5} transform={`rotate(${a})`}/>; })}
      <circle r={s * .08} fill="#ffcf4a" stroke={ink} strokeWidth={w * .6}/>
    </g>;
    case 'tree': {
      // A broad tree. level 1 = full green canopy; 0 = bare, grey branches (dormant / dying).
      const lv = levelAt(c.level, frame), leaf = `rgb(${Math.round(70 + (1 - lv) * 80)},${Math.round(150 - (1 - lv) * 50)},${Math.round(70 + (1 - lv) * 40)})`;
      return <g transform={at}>
        <path d={`M ${-s * .07} ${s * .5} L ${-s * .05} 0 L ${-s * .2} ${-s * .2} M ${-s * .05} 0 L ${s * .05} ${-s * .3} M ${s * .05} ${s * .5} L ${s * .05} ${-s * .02} L ${s * .22} ${-s * .18}`} {...stroke('#6b4a2e', w * 1.6)}/>
        <path d={`M ${-s * .07} ${s * .5} L ${s * .05} ${s * .5}`} {...stroke(ink, w)}/>
        {[[-.18, -.22, .18], [.02, -.34, .22], [.2, -.2, .17], [0, -.12, .2]].map(([x, y, r], i) =>
          <circle key={i} cx={x * s} cy={y * s} r={r * s * (.4 + .6 * lv)} fill={leaf} stroke={ink} strokeWidth={w * .7} opacity={.25 + .75 * lv}/>)}
      </g>;
    }
    case 'tardigrade': {
      // A cartoon water bear: chubby segmented body, eight stubby clawed legs, small face; it wiggles and waves one leg.
      const wig = Math.sin(frame / 8) * s * .01, wave = Math.sin(frame / 6) * 18;
      return <g transform={`${at} translate(0 ${wig})`}>
        {[-.3, -.1, .1, .3].map((x, i) => <g key={i}><path d={`M ${x * s} ${s * .12} l ${-s * .02} ${s * .14}`} {...stroke(ink, w * 1.6)} transform={i === 0 ? `rotate(${wave} ${x * s} ${s * .12})` : undefined}/>
          <path d={`M ${(x - .04) * s} ${s * .27} l ${s * .02} ${-s * .02} l ${s * .02} ${s * .02} l ${s * .02} ${-s * .02}`} {...stroke(ink, w * .5)}/></g>)}
        <path d={`M ${-s * .45} 0 Q ${-s * .45} ${-s * .22} ${-s * .2} ${-s * .22} Q 0 ${-s * .3} ${s * .2} ${-s * .22} Q ${s * .45} ${-s * .2} ${s * .45} 0 Q ${s * .45} ${s * .16} ${s * .2} ${s * .16} L ${-s * .2} ${s * .16} Q ${-s * .45} ${s * .16} ${-s * .45} 0 Z`}
          fill={c.color ?? '#d9c8a8'} stroke={ink} strokeWidth={w}/>
        {[-.2, 0, .2].map((x, i) => <path key={i} d={`M ${x * s} ${-s * .2} q ${s * .03} ${s * .17} 0 ${s * .34}`} {...stroke(ink, w * .45)} opacity=".6"/>)}
        <circle cx={-s * .36} cy={-s * .06} r={s * .025} fill={ink}/>
        <path d={`M ${-s * .44} ${s * .03} q ${s * .03} ${s * .03} ${s * .06} 0`} {...stroke(ink, w * .5)}/>
      </g>;
    }
    case 'vent': {
      // A deep-sea hydrothermal vent ("black smoker") with a billowing dark plume and tube worms at its base. level = plume strength.
      const lv = levelAt(c.level, frame), random = seededRandom(17);
      return <g transform={at}>
        {Array.from({length: 7}, (_, i) => { const t = ((frame * .6 + i * 14) % 100) / 100; return <circle key={`p${i}`} cx={Math.sin(t * 6 + i) * s * .08 * (1 + t)} cy={-s * .32 - t * s * .55} r={s * (.07 + t * .12)} fill="#1c1a22" opacity={lv * (.75 - t * .6)}/>; })}
        <path d={`M ${-s * .14} ${s * .45} L ${-s * .08} ${-s * .3} L ${s * .08} ${-s * .32} L ${s * .16} ${s * .45} Z`} fill="#4a3a33" stroke={ink} strokeWidth={w}/>
        <path d={`M ${-s * .08} ${-s * .3} Q 0 ${-s * .36} ${s * .08} ${-s * .32}`} {...stroke('#ff8a3a', w * .8)} opacity={.6 + .3 * Math.sin(frame / 7)}/>
        {Array.from({length: c.count}, (_, i) => { const x = (i % 2 ? 1 : -1) * s * (.2 + random() * .2), h = s * (.15 + random() * .15), sway = Math.sin(frame / 14 + i) * s * .02;
          return <g key={i}><path d={`M ${x} ${s * .45} Q ${x + sway} ${s * .45 - h * .5} ${x + sway * 2} ${s * .45 - h}`} {...stroke('#f2efe6', w * 1.1)}/>
            <circle cx={x + sway * 2} cy={s * .45 - h} r={s * .028} fill="#e0413a"/></g>; })}
        <path d={`M ${-s * .5} ${s * .45} L ${s * .5} ${s * .45}`} {...stroke(ink, w)}/>
      </g>;
    }
    case 'shell': {
      // An expanding shell of darkness (a missing pulse of sunlight) seen as a dark band around the Sun. level = how far it has travelled
      // (0 = at the Sun, 1 = at size/2, or one frame width with direction 'out'); count = band thickness in 40ths of size/2.
      const lv = levelAt(c.level, frame), R = (c.direction === 'out' ? width : s * .5) * lv, band = s * .5 * c.count / 40, r0 = Math.max(0, R - band), mid = (R + r0) / 2;
      return <g transform={at}>
        <circle r={mid} fill="none" stroke="#02040c" strokeWidth={Math.max(.5, R - r0)} opacity=".88"/>
        <circle r={R} fill="none" stroke="#7fa3ff" strokeWidth={w * .35} opacity=".5"/>
        {r0 > 1 && <circle r={r0} fill="none" stroke="#ffe27a" strokeWidth={w * .35} opacity=".5"/>}
      </g>;
    }
    case 'snowfall': {
      // Flakes of frozen air drifting down over a wide area (size = width; height = 0.7 x size). level = density.
      const lv = levelAt(c.level, frame), random = seededRandom(23), n = Math.round(c.count * 3 * lv), Wd = s, Ht = s * .7;
      return <g transform={at}>{Array.from({length: c.count * 3}, (_, i) => { const x0 = (random() - .5) * Wd, sp = .4 + random() * .6, ph = random(), r = s * (.006 + random() * .008);
        if (i >= n) return null; const y = (((frame * sp * .004 + ph) % 1) - .5) * Ht, x = x0 + Math.sin(frame / 20 + i) * s * .01;
        return <g key={i} transform={`translate(${x} ${y})`}><path d={`M ${-r} 0 L ${r} 0 M 0 ${-r} L 0 ${r} M ${-r * .7} ${-r * .7} L ${r * .7} ${r * .7} M ${-r * .7} ${r * .7} L ${r * .7} ${-r * .7}`} {...stroke('#f4f8ff', Math.max(1.5, r * .5))}/></g>; })}</g>;
    }
    case 'night-half': {
      // Shadow over half of a planet disc (size = diameter): level 0 = no shadow, 1 = the day side fully dark. Rotate to choose the side.
      const lv = levelAt(c.level, frame), r = s * .5, id = `nh-${Math.round(c.x * 1000)}-${Math.round(c.y * 1000)}`;
      return <g transform={at} opacity={lv}>
        <defs><clipPath id={id}><circle r={r}/></clipPath></defs>
        <rect x={0} y={-r} width={r} height={r * 2} fill="#03050d" opacity=".9" clipPath={`url(#${id})`}/>
        <rect x={-r * .12} y={-r} width={r * .12} height={r * 2} fill="#03050d" opacity=".45" clipPath={`url(#${id})`}/>
      </g>;
    }
    case 'mushroom': {
      const random = seededRandom(5);
      return <g transform={at}>{Array.from({length: c.count}, (_, i) => { const x = (i - (c.count - 1) / 2) * s * .22 + (random() - .5) * s * .05, h = s * (.2 + random() * .2), cw = s * (.12 + random() * .08);
        return <g key={i}><path d={`M ${x - cw * .2} ${s * .3} L ${x - cw * .15} ${s * .3 - h} L ${x + cw * .15} ${s * .3 - h} L ${x + cw * .2} ${s * .3} Z`} fill="#efe4cf" stroke={ink} strokeWidth={w * .6}/>
          <path d={`M ${x - cw} ${s * .3 - h} Q ${x} ${s * .3 - h - cw * 1.2} ${x + cw} ${s * .3 - h} Z`} fill={c.color ?? '#c9733f'} stroke={ink} strokeWidth={w * .7}/>
          <circle cx={x - cw * .3} cy={s * .3 - h - cw * .35} r={cw * .12} fill="#fff4e0"/></g>; })}
        <path d={`M ${-s * .5} ${s * .3} L ${s * .5} ${s * .3}`} {...stroke(ink, w)}/>
      </g>;
    }
    case 'sparkle': {
      // A soft glow (radius size/2) with twinkling four-point stars around it; level = intensity (0 = none, 1 = full).
      const lv = levelAt(c.level, frame), random = seededRandom(31), id = `sp-${Math.round(c.x * 1000)}-${Math.round(c.y * 1000)}`, col = c.color ?? '#ffe27a';
      return <g transform={at} opacity={lv}>
        <defs><radialGradient id={id}><stop offset="0" stopColor={col} stopOpacity=".55"/><stop offset=".55" stopColor={col} stopOpacity=".18"/><stop offset="1" stopColor={col} stopOpacity="0"/></radialGradient></defs>
        <circle r={s * .5} fill={`url(#${id})`}/>
        {Array.from({length: c.count}, (_, i) => { const a = random() * Math.PI * 2, d = s * (.28 + random() * .3), r = s * (.02 + random() * .03),
          tw = .35 + .65 * Math.max(0, Math.sin(frame / 4 + i * 1.7)), x = Math.cos(a) * d, y = Math.sin(a) * d;
          return <path key={i} d={`M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z`} fill="#fff7d6" opacity={tw}/>; })}
      </g>;
    }
    case 'young-earth': {
      // The molten young Earth: glowing lava ocean with dark crust plates that drift as it spins. level = spin speed (1 = one turn in about half a second).
      const r = s * .5, sp = levelAt(c.level, frame), off = ((frame * sp * 7) % 100) / 100, id = `ye-${Math.round(c.x * 1000)}`;
      return <g transform={at}>
        <defs><clipPath id={id}><circle r={r}/></clipPath><radialGradient id={`${id}-g`}><stop offset="0" stopColor="#ffb347"/><stop offset="1" stopColor="#d9431f"/></radialGradient></defs>
        <circle r={r * 1.18} fill="#ff6a2a" opacity={.18 + .06 * Math.sin(frame / 9)}/>
        <circle r={r} fill={`url(#${id}-g)`} stroke={ink} strokeWidth={w}/>
        <g clipPath={`url(#${id})`}>{[0, 1, 2, 3].map(i => { const x = (((off + i / 4) % 1) * 2 - 1) * r * 1.4, y = (i % 2 ? .3 : -.28) * r;
          return <g key={i}><path d={`M ${x - r * .3} ${y} q ${r * .1} ${-r * .2} ${r * .3} ${-r * .12} q ${r * .25} ${r * .05} ${r * .28} ${r * .2} q ${-r * .1} ${r * .2} ${-r * .3} ${r * .14} q ${-r * .2} ${-r * .02} ${-r * .28} ${-r * .22} Z`}
            fill="#4a2414" stroke="#2a120a" strokeWidth={w * .4}/>
            <path d={`M ${x - r * .12} ${y - r * .04} l ${r * .1} ${r * .06} l ${r * .08} ${-r * .05}`} {...stroke('#ffcf6a', w * .45)}/></g>; })}</g>
        <circle r={r} fill="none" stroke={ink} strokeWidth={w}/>
      </g>;
    }
    case 'probe': {
      // Voyager-style probe: big high-gain dish, a ten-sided bus with the gold record, magnetometer boom, RTG boom.
      const gold = '#d9a628', sway = Math.sin(frame / 30) * 2;
      return <g transform={`${at} rotate(${sway})`}>
        <path d={`M ${s * .05} ${-s * .02} L ${s * .95} ${-s * .55}`} {...stroke(ink, w * .9)}/>
        <path d={`M ${s * .62} ${-s * .35} l ${s * .05} ${s * .06} M ${s * .8} ${-s * .46} l ${s * .05} ${s * .06}`} {...stroke(ink, w * .7)}/>
        <path d={`M ${-s * .05} ${s * .12} L ${-s * .62} ${s * .52}`} {...stroke(ink, w * 1.1)}/>
        {[.3, .43, .56].map(t => <rect key={t} x={-s * t * 1.1 - s * .05} y={s * (.1 + t * .72) - s * .045} width={s * .1} height={s * .09} rx={s * .015} fill="#8c8c8c" stroke={ink} strokeWidth={w * .7}/>)}
        <path d={`M 0 ${s * .02} L ${-s * .1} ${s * .3} M 0 ${s * .02} L ${s * .12} ${s * .32}`} {...stroke(ink, w * .7)}/>
        <polygon points={Array.from({length: 10}, (_, i) => { const a = i * Math.PI / 5; return `${Math.cos(a) * s * .17},${s * .12 + Math.sin(a) * s * .1}`; }).join(' ')} fill="#e8e1d2" stroke={ink} strokeWidth={w}/>
        <circle cx={s * .07} cy={s * .13} r={s * .045} fill={gold} stroke={ink} strokeWidth={w * .6}/>
        <path d={`M 0 ${s * .02} L 0 ${-s * .12}`} {...stroke(ink, w)}/>
        <ellipse cx={0} cy={-s * .22} rx={s * .42} ry={s * .14} fill="#f6f6f2" stroke={ink} strokeWidth={w * 1.1}/>
        <ellipse cx={0} cy={-s * .24} rx={s * .3} ry={s * .08} fill="none" stroke={ink} strokeWidth={w * .5} opacity=".5"/>
        <path d={`M 0 ${-s * .22} L 0 ${-s * .4}`} {...stroke(ink, w * .8)}/>
        <circle cx={0} cy={-s * .42} r={s * .025} fill={ink}/>
      </g>;
    }
    case 'signal': {
      // Radio waves leaving the origin towards +x (rotate the prop to aim). Arcs travel outwards and fade.
      const col = c.color ?? red, n = 4, period = 36;
      return <g transform={at}>{Array.from({length: n}, (_, i) => {
        const t = ((frame + i * period / n) % period) / period, r = s * (.12 + .88 * t), a = .55;
        return <path key={i} d={`M ${Math.cos(-a) * r} ${Math.sin(-a) * r} A ${r} ${r} 0 0 1 ${Math.cos(a) * r} ${Math.sin(a) * r}`} {...stroke(col, w * 1.2)} opacity={(1 - t) * .9}/>;
      })}</g>;
    }
    case 'bulb': {
      // Small glowing light bulb (fridge-bulb scale gag).
      const glow = .35 + .15 * Math.sin(frame / 6);
      return <g transform={at}>
        <circle cx={0} cy={-s * .12} r={s * .5} fill="#ffe27a" opacity={glow * .5}/>
        <path d={`M ${-s * .14} ${s * .16} Q ${-s * .3} ${-s * .02} ${-s * .26} ${-s * .2} A ${s * .27} ${s * .27} 0 1 1 ${s * .26} ${-s * .2} Q ${s * .3} ${-s * .02} ${s * .14} ${s * .16} Z`} fill="#fff4b8" stroke={ink} strokeWidth={w}/>
        <path d={`M ${-s * .07} ${s * .1} L ${-s * .05} ${-s * .14} q ${s * .05} ${-s * .06} ${s * .1} 0 L ${s * .07} ${s * .1}`} {...stroke('#c98a1a', w * .7)}/>
        <rect x={-s * .14} y={s * .16} width={s * .28} height={s * .2} rx={s * .03} fill="#b8b8b8" stroke={ink} strokeWidth={w}/>
        <path d={`M ${-s * .14} ${s * .23} L ${s * .14} ${s * .23} M ${-s * .14} ${s * .3} L ${s * .14} ${s * .3}`} {...stroke(ink, w * .6)}/>
      </g>;
    }
    case 'mug': {
      const col = c.color ?? '#c0504d';
      return <g transform={at}>
        {[-.12, .02, .16].map((t, i) => <path key={t} d={`M ${s * t} ${-s * .32} q ${s * .06} ${-s * .1} 0 ${-s * .2} t 0 ${-s * .2}`} {...stroke(ink, w * .7)} opacity={.4 + .3 * Math.sin(frame / 8 + i * 2) ** 2}/>)}
        <path d={`M ${s * .3} ${-s * .15} q ${s * .22} 0 ${s * .2} ${s * .16} q 0 ${s * .14} ${-s * .2} ${s * .14}`} {...stroke(ink, w * 1.2)}/>
        <path d={`M ${-s * .32} ${-s * .28} L ${s * .32} ${-s * .28} L ${s * .28} ${s * .3} Q 0 ${s * .38} ${-s * .28} ${s * .3} Z`} fill={col} stroke={ink} strokeWidth={w}/>
        <ellipse cx={0} cy={-s * .28} rx={s * .32} ry={s * .06} fill="#6b3b1f" stroke={ink} strokeWidth={w * .8}/>
      </g>;
    }
    case 'calendar': return <g transform={at}>
      <rect x={-s * .4} y={-s * .4} width={s * .8} height={s * .8} rx={s * .06} fill="#ffffff" stroke={ink} strokeWidth={w}/>
      <rect x={-s * .4} y={-s * .4} width={s * .8} height={s * .2} rx={s * .06} fill={red} stroke={ink} strokeWidth={w}/>
      {[-.2, .2].map(t => <path key={t} d={`M ${s * t} ${-s * .48} l 0 ${s * .14}`} {...stroke(ink, w * 1.2)}/>)}
      <text x={0} y={s * .22} textAnchor="middle" fontFamily={font} fontSize={s * .32} fill={ink}>{c.text ?? String(counterAt(c.values ?? [], frame))}</text>
    </g>;
    case 'sign': {
      const label = c.text ?? '', fs = s * .2, bw = Math.max(s * .7, label.length * fs * .55 + s * .2);
      return <g transform={at}>
        <path d={`M 0 0 L 0 ${s * .6}`} {...stroke('#7a5a3a', w * 2)}/>
        <rect x={-bw / 2} y={-s * .3} width={bw} height={s * .34} rx={s * .03} fill="#f6e7c1" stroke={ink} strokeWidth={w}/>
        <text x={0} y={-s * .06} textAnchor="middle" fontFamily={font} fontSize={fs} fill={c.color ?? ink}>{label}</text>
      </g>;
    }
    case 'igloo': return <g transform={at}>
      <path d={`M ${-s * .5} 0 A ${s * .5} ${s * .45} 0 0 1 ${s * .5} 0 Z`} fill="#f4fbff" stroke={ink} strokeWidth={w}/>
      {[.15, .3].map(t => <path key={t} d={`M ${-s * .5 * Math.sqrt(1 - (t / .45) ** 2)} ${-s * t} L ${s * .5 * Math.sqrt(1 - (t / .45) ** 2)} ${-s * t}`} {...stroke(ink, w * .5)} opacity=".6"/>)}
      <path d={`M ${-s * .14} 0 L ${-s * .14} ${-s * .14} A ${s * .14} ${s * .12} 0 0 1 ${s * .14} ${-s * .14} L ${s * .14} 0 Z`} fill="#2a2433" stroke={ink} strokeWidth={w}/>
    </g>;
    case 'rocket': {
      const flame = .7 + .3 * Math.abs(Math.sin(frame / 2));
      return <g transform={at}>
        <path d={`M ${-s * .08} ${s * .32} Q 0 ${s * (.32 + .28 * flame)} ${s * .08} ${s * .32} Z`} fill="#f2b134" stroke={red} strokeWidth={w * .6}/>
        <path d={`M ${-s * .16} ${s * .1} L ${-s * .3} ${s * .34} L ${-s * .12} ${s * .3} Z M ${s * .16} ${s * .1} L ${s * .3} ${s * .34} L ${s * .12} ${s * .3} Z`} fill={red} stroke={ink} strokeWidth={w}/>
        <path d={`M 0 ${-s * .5} Q ${s * .2} ${-s * .25} ${s * .14} ${s * .32} L ${-s * .14} ${s * .32} Q ${-s * .2} ${-s * .25} 0 ${-s * .5} Z`} fill="#f2f2f2" stroke={ink} strokeWidth={w}/>
        <circle cx={0} cy={-s * .08} r={s * .07} fill={theme.palette.water.light} stroke={ink} strokeWidth={w * .8}/>
      </g>;
    }
    case 'fish': return <g transform={at}>
      <path d={`M ${-s * .45} 0 Q ${-s * .1} ${-s * .3} ${s * .25} 0 Q ${-s * .1} ${s * .3} ${-s * .45} 0 Z M ${s * .2} 0 L ${s * .45} ${-s * .18} L ${s * .45} ${s * .18} Z`} fill={c.color ?? '#0d2a4a'} opacity=".8"/>
      <circle cx={-s * .28} cy={-s * .04} r={s * .03} fill="#ffffff" opacity=".8"/>
    </g>;
    case 'drop': return <g transform={at}>
      <path d={`M 0 ${-s * .5} Q ${s * .36} ${-s * .02} ${s * .3} ${s * .18} A ${s * .31} ${s * .31} 0 0 1 ${-s * .3} ${s * .18} Q ${-s * .36} ${-s * .02} 0 ${-s * .5} Z`} fill={c.color ?? '#4aa3df'} stroke={ink} strokeWidth={w}/>
      <path d={`M ${-s * .14} ${s * .02} q ${-s * .02} ${s * .14} ${s * .1} ${s * .2}`} {...stroke('#ffffff', w)} opacity=".7"/>
    </g>;
    case 'tumbleweed': {
      const random = seededRandom(11);
      return <g transform={`${at} rotate(${frame * 6})`}>{Array.from({length: 9}, (_, i) => { const a = random() * 6.3, b = a + 2 + random() * 2, r = s * (.3 + random() * .18);
        return <path key={i} d={`M ${Math.cos(a) * r} ${Math.sin(a) * r} Q ${(random() - .5) * s * .4} ${(random() - .5) * s * .4} ${Math.cos(b) * r} ${Math.sin(b) * r}`} {...stroke('#a3824f', w * .8)}/>; })}</g>;
    }
    case 'thermos': return <g transform={at}>
      <rect x={-s * .18} y={-s * .36} width={s * .36} height={s * .78} rx={s * .08} fill={c.color ?? '#5a7fa8'} stroke={ink} strokeWidth={w}/>
      <rect x={-s * .14} y={-s * .5} width={s * .28} height={s * .14} rx={s * .03} fill="#c9ced6" stroke={ink} strokeWidth={w}/>
      <path d={`M ${-s * .18} ${-s * .1} L ${s * .18} ${-s * .1} M ${-s * .18} ${s * .2} L ${s * .18} ${s * .2}`} {...stroke(ink, w * .6)}/>
    </g>;
    case 'shovel': return <g transform={at}>
      <path d={`M 0 ${-s * .5} L 0 ${s * .12}`} {...stroke('#7a5a3a', w * 1.8)}/>
      <path d={`M ${-s * .1} ${-s * .5} L ${s * .1} ${-s * .5}`} {...stroke(ink, w * 1.6)}/>
      <path d={`M ${-s * .14} ${s * .1} L ${s * .14} ${s * .1} L ${s * .12} ${s * .36} Q 0 ${s * .5} ${-s * .12} ${s * .36} Z`} fill="#b8c0c8" stroke={ink} strokeWidth={w}/>
    </g>;
    case 'magnifier': return <g transform={at}>
      <path d={`M ${s * .3} ${s * .3} L ${s * .55} ${s * .55}`} {...stroke('#7a5a3a', w * 2.6)}/>
      <circle cx={0} cy={0} r={s * .42} fill="#ffffff" fillOpacity=".25" stroke={ink} strokeWidth={w * 1.4}/>
    </g>;
    case 'smell-lines': return <g transform={at}>{[-1, 0, 1].map(k =>
      <path key={k} d={`M ${k * s * .2} 0 q ${s * .08} ${-s * .12} 0 ${-s * .24} t 0 ${-s * .24}`} {...stroke(c.color ?? '#7b9a3c', w)} opacity={.5 + .4 * Math.sin(frame / 7 + k * 2) ** 2} transform={`translate(0 ${-((frame / 2 + k * 7) % 14)})`}/>)}</g>;
    case 'bar': {
      // Labelled horizontal bar (comparisons, doses, pressure): fill follows level; without a colour it goes
      // green -> amber -> red as it fills. count > 1 draws that many tick marks.
      const lv = levelAt(c.level, frame), bw = s, bh = s * .15, col = c.color ?? (lv < .5 ? '#4caf50' : lv < .8 ? '#f2b134' : red);
      return <g transform={at}>
        {c.text && <text x={-bw / 2} y={-bh / 2 - s * .04} fontFamily={font} fontSize={s * .15} fill={ink}>{c.text}</text>}
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={bh * .3} fill="#ffffff" stroke={ink} strokeWidth={w * .8}/>
        {lv > .005 && <rect x={-bw / 2 + w} y={-bh / 2 + w} width={Math.max(0, (bw - w * 2) * Math.min(1, lv))} height={bh - w * 2} rx={bh * .2} fill={col}/>}
        {c.count > 1 && c.count <= 12 && Array.from({length: c.count - 1}, (_, i) => <path key={i} d={`M ${-bw / 2 + bw * (i + 1) / c.count} ${bh / 2} l 0 ${s * .04}`} {...stroke(ink, w * .5)}/>)}
      </g>;
    }
    case 'ruler': {
      // Vertical height scale with a marker at level (0 bottom, 1 top); caption on top.
      const lv = levelAt(c.level, frame), h = s, x = 0, y0 = h / 2, y = y0 - h * Math.min(1, lv);
      return <g transform={at}>
        <path d={`M ${x} ${-h / 2} L ${x} ${h / 2}`} {...stroke(ink, w)}/>
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${x} ${-h / 2 + h * i / 8} l ${i % 2 ? s * .04 : s * .08} 0`} {...stroke(ink, w * .6)}/>)}
        <path d={`M ${x - s * .03} ${y} l ${-s * .07} ${-s * .04} l 0 ${s * .08} Z`} fill={red} stroke={ink} strokeWidth={w * .5}/>
        {c.text && <text x={0} y={-h / 2 - s * .05} textAnchor="middle" fontFamily={font} fontSize={s * .1} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'moon-map': {
      // Paper map of moons (coloured dots on an arc) with a red pin that hops to the dot chosen by level (0..1).
      const bw = s * 1.3, bh = s * .8, cols = ['#c4c4c0', '#6e5d4c', '#857a6f', '#cfcfca', '#f4f8fb', '#ecdcd8', '#f1e8d8', '#e9c94b', '#c9843b'];
      const lv = levelAt(c.level, frame), idx = Math.round(lv * (cols.length - 1)), px = (i: number) => -bw * .4 + bw * .8 * i / (cols.length - 1), py = (i: number) => bh * .12 - Math.sin(Math.PI * i / (cols.length - 1)) * bh * .3;
      const hop = Math.abs(Math.sin(frame / 6)) * s * .03;
      return <g transform={at}>
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={s * .04} fill="#fbf3dc" stroke={ink} strokeWidth={w}/>
        <path d={`M ${px(0)} ${py(0)} ${cols.map((_, i) => `L ${px(i)} ${py(i)}`).join(' ')}`} {...stroke(ink, w * .4)} strokeDasharray={`${w} ${w * 2}`}/>
        {cols.map((col, i) => <circle key={i} cx={px(i)} cy={py(i)} r={s * .045} fill={col} stroke={ink} strokeWidth={w * .6}/>)}
        <g transform={`translate(${px(idx)} ${py(idx) - s * .06 - hop})`}><path d={`M 0 ${s * .05} L ${-s * .035} ${-s * .01} A ${s * .045} ${s * .045} 0 1 1 ${s * .035} ${-s * .01} Z`} fill={red} stroke={ink} strokeWidth={w * .6}/></g>
        {c.text && <text x={0} y={bh / 2 - s * .07} textAnchor="middle" fontFamily={font} fontSize={s * .1} fill={ink}>{c.text}</text>}
      </g>;
    }
    case 'system-map': {
      // "Where are we?" card: an opaque paper page with the parent planet (colour = color), its moons on orbits
      // (labels/colors, inner to outer) and the moon we visit (highlight) bigger, ringed in red with its name;
      // optional Saturn ring and Jupiter radiation belt. Not to scale, and says so.
      const n = c.labels?.length ?? 0, cx = c.x * width, cy = c.y * height, pr = s * .11, hl = c.highlight ?? -1, hot = theme.palette.text.accent, lw = Math.max(2, s * .007);
      const rx = (i: number) => pr * 2.7 + (s * 1.05 - pr * 2.7) * (n > 1 ? i / (n - 1) : 0), ry = (i: number) => rx(i) * .34;
      const ang = (i: number) => (-.25 + i * .73) % (Math.PI * 2);
      return <g>
        <rect x={-width * .1} y={-height * .1} width={width * 1.2} height={height * 1.2} fill={theme.palette.sky.top}/>
        {c.belt && <ellipse cx={cx} cy={cy} rx={rx(Math.min(1, n - 1)) * 1.08} ry={ry(Math.min(1, n - 1)) * 1.6} fill="none" stroke="#a24bd6" strokeWidth={s * .09} opacity={.25 + .1 * Math.sin(frame / 12)}/>}
        {Array.from({length: n}, (_, i) => <ellipse key={`o${i}`} cx={cx} cy={cy} rx={rx(i)} ry={ry(i)} fill="none" stroke={i === hl ? hot : ink} strokeWidth={i === hl ? lw * 2.2 : lw} strokeDasharray={i === hl ? undefined : `${lw * 4} ${lw * 5}`} opacity={i === hl ? 1 : .55}/>)}
        {c.ring && <ellipse cx={cx} cy={cy} rx={pr * 1.7} ry={pr * .38} fill="none" stroke={ink} strokeWidth={lw * 2} transform={`rotate(-12 ${cx} ${cy})`}/>}
        <circle cx={cx} cy={cy} r={pr} fill={c.color ?? '#d9b38c'} stroke={ink} strokeWidth={lw * 1.6}/>
        <path d={`M ${cx - pr * .55} ${cy - pr * .35} A ${pr * .65} ${pr * .65} 0 0 1 ${cx - pr * .1} ${cy - pr * .66}`} fill="none" stroke="#ffffff" strokeWidth={lw * 2} strokeLinecap="round" opacity=".6"/>
        {Array.from({length: n}, (_, i) => {
          const mx = cx + Math.cos(ang(i)) * rx(i), my = cy + Math.sin(ang(i)) * ry(i), big = i === hl, mr = big ? s * .05 : s * .028;
          return <g key={`m${i}`}>
            <circle cx={mx} cy={my} r={mr} fill={c.colors?.[i] ?? '#bbbbbb'} stroke={ink} strokeWidth={lw * (big ? 1.5 : 1)}/>
            {big && <circle cx={mx} cy={my} r={mr * 1.8} fill="none" stroke={hot} strokeWidth={lw * 2.2}/>}
            <text x={mx} y={my + mr + s * (big ? .085 : .06)} textAnchor="middle" fontFamily={font} fontSize={s * (big ? .1 : .066)} fill={big ? hot : ink}>{c.labels![i]}</text>
          </g>;
        })}
        <text x={cx} y={cy + pr + s * .07} textAnchor="middle" fontFamily={font} fontSize={s * .075} fill={ink}>{c.text ?? ''}</text>
        <text x={width * .97} y={height * .95} textAnchor="end" fontFamily={font} fontSize={height * .026} fill={ink} opacity=".6">not to scale</text>
      </g>;
    }
    case 'solar-strip': {
      // The Sun and the planets in order (plus Pluto) on one line; highlight = the planet whose moons we visit.
      const names = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
      const cols = ['#9c8f86', '#e3b86b', '#5aa9e6', '#c4501f', '#d9b38c', '#e3c98f', '#9fe0e6', '#3d63d6', '#d8b48a'];
      const rad = [.012, .02, .021, .015, .05, .043, .031, .03, .009], bw = s * 1.9, x0 = c.x * width - bw / 2, y = c.y * height, hl = c.highlight ?? -1, hot = theme.palette.text.accent, lw = Math.max(2, s * .008);
      return <g>
        <path d={`M ${x0} ${y} L ${x0 + bw} ${y}`} {...stroke(ink, lw)} opacity=".4"/>
        <circle cx={x0 - s * .06} cy={y} r={s * .09} fill={theme.palette.sun.core ?? '#ffd34d'} stroke={ink} strokeWidth={lw}/>
        {names.map((nm, i) => { const x = x0 + s * .12 + (bw - s * .12) * i / (names.length - 1), r = s * rad[i] * 1.6;
          return <g key={nm}>
            <circle cx={x} cy={y} r={r} fill={cols[i]} stroke={ink} strokeWidth={lw}/>
            {i === 5 && <ellipse cx={x} cy={y} rx={r * 1.8} ry={r * .45} fill="none" stroke={ink} strokeWidth={lw}/>}
            {i === hl && <circle cx={x} cy={y} r={r + s * .03} fill="none" stroke={hot} strokeWidth={lw * 2}/>}
            <text x={x} y={y + r + s * .07} textAnchor="middle" fontFamily={font} fontSize={s * (i === hl ? .075 : .055)} fill={i === hl ? hot : ink} opacity={i === hl ? 1 : .75}>{nm}</text>
          </g>; })}
      </g>;
    }
    case 'helmet': {
      const r = s * .5, visor = c.color ?? theme.palette.water.light;
      return <g transform={at}>
        <rect x={-r * .62} y={r * .72} width={r * 1.24} height={r * .3} rx={r * .1} fill={theme.palette.cloud.shadow} stroke={ink} strokeWidth={w}/>
        <circle cx={0} cy={0} r={r} fill={visor} fillOpacity=".25" stroke={ink} strokeWidth={w}/>
        <path d={`M ${-r * .72} ${-r * .38} A ${r * .85} ${r * .85} 0 0 1 ${-r * .12} ${-r * .82}`} {...stroke('#ffffff', w * 1.4)}/>
      </g>;
    }
  }
};
