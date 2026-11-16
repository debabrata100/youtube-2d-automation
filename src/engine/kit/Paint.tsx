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

export type PropConfig = {item: 'thermometer' | 'pressure-arrows' | 'motion-lines' | 'exclaim' | 'question' | 'check' | 'cross' | 'counter' | 'stamp' | 'vignette' | 'station' | 'helmet' | 'doodle-stars' | 'chamber'
  | 'cliff' | 'geyser' | 'plume' | 'radiation-meter' | 'radiation-belt' | 'battery' | 'airbag' | 'small-moon' | 'ice-cutaway' | 'frost'
  | 'flag' | 'speedometer' | 'race-car' | 'sunglasses' | 'mug' | 'calendar' | 'sign' | 'igloo' | 'rocket' | 'fish' | 'drop' | 'tumbleweed' | 'thermos' | 'shovel' | 'magnifier' | 'smell-lines'; x: number; y: number; size: number; rotation: number; color?: string; count: number; level: Array<{frame: number; value: number}>;
  values?: Array<{frame: number; value: number; ramp?: boolean}>; text?: string; direction?: 'in' | 'out'};

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
  const s = c.size * Math.min(width, height), ink = theme.line.color, red = c.color ?? theme.palette.text.accent, w = Math.max(3, s * .045), font = theme.label.fontFamily;
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
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={s * .12} fill="#ffffff" stroke={ink} strokeWidth={w * 1.2}/>
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
