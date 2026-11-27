import React from 'react';
import {seededRandom} from '../../motion/particles';
import type {Theme} from '../style/theme';
import type {KitConfig} from './schema';

/**
 * Cinematic toolkit (M4.1, 27 Nov 2026): light and colour grade layers, and reusable sets. Story-neutral and
 * JSON-driven; frames depend only on the config and the frame number.
 */
type LightConfig = Extract<KitConfig, {type: 'light'}>;
type SetConfig = Extract<KitConfig, {type: 'set'}>;

const DEFAULT_BLEND: Record<LightConfig['kind'], React.CSSProperties['mixBlendMode']> = {pool: 'screen', beam: 'screen', vignette: 'normal', grade: 'soft-light', rim: 'screen'};

/** Light pools, beams, rim light, vignettes and colour grades, blended over what is beneath them. */
export const Light: React.FC<{config: LightConfig; width: number; height: number; frame: number; id: string}> = ({config: c, width, height, frame, id}) => {
  const blend = c.blend ?? DEFAULT_BLEND[c.kind], x = c.x * width, y = c.y * height, r = c.radius * width;
  const flicker = c.flicker ? 1 - c.flicker * (.5 + .5 * Math.sin(frame * .9 + Math.sin(frame * .37) * 2)) : 1;
  const k = c.intensity * flicker;
  const style = {mixBlendMode: blend} as React.CSSProperties;
  switch (c.kind) {
    case 'pool': return <g style={style}>
      <defs><radialGradient id={`${id}-p`} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={c.color} stopOpacity={k}/><stop offset=".55" stopColor={c.color} stopOpacity={k * .35}/><stop offset="1" stopColor={c.color} stopOpacity="0"/></radialGradient></defs>
      <rect x={-width} y={-height} width={width * 3} height={height * 3} fill={`url(#${id}-p)`}/>
    </g>;
    case 'rim': return <g style={style}>
      <defs><radialGradient id={`${id}-r`} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse"><stop offset=".72" stopColor={c.color} stopOpacity="0"/><stop offset=".9" stopColor={c.color} stopOpacity={k}/><stop offset="1" stopColor={c.color} stopOpacity="0"/></radialGradient></defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-r)`}/>
    </g>;
    case 'beam': {
      // A soft shaft of light from (x, y) along `angle`, widening by `spread`, fading over `radius`.
      const a = c.angle * Math.PI / 180, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r, nx = -Math.sin(a), ny = Math.cos(a), w0 = c.spread * .15 * r, w1 = c.spread * r;
      const pts = [[x + nx * w0, y + ny * w0], [ex + nx * w1, ey + ny * w1], [ex - nx * w1, ey - ny * w1], [x - nx * w0, y - ny * w0]];
      return <g style={style}>
        <defs>
          <linearGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={ex} y2={ey}><stop offset="0" stopColor={c.color} stopOpacity={k}/><stop offset="1" stopColor={c.color} stopOpacity="0"/></linearGradient>
          <filter id={`${id}-bs`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={w1 * .12}/></filter>
        </defs>
        <path d={'M ' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L ') + ' Z'} fill={`url(#${id}-b)`} filter={`url(#${id}-bs)`}/>
      </g>;
    }
    case 'vignette': return <g style={style}>
      <defs><radialGradient id={`${id}-v`} cx={x} cy={y} r={Math.hypot(width, height) * .6} gradientUnits="userSpaceOnUse"><stop offset={1 - c.radius} stopColor={c.color} stopOpacity="0"/><stop offset="1" stopColor={c.color} stopOpacity={1}/></radialGradient></defs>
      <rect x={-width} y={-height} width={width * 3} height={height * 3} fill={`url(#${id}-v)`} opacity={k}/>
    </g>;
    case 'grade': return <rect x={-width} y={-height} width={width * 3} height={height * 3} fill={c.color} opacity={k} style={style}/>;
  }
};

const rivets = (x0: number, y0: number, x1: number, y1: number, step: number, color: string) =>
  Array.from({length: Math.max(0, Math.floor((x1 - x0) / step) + 1)}, (_, i) => <circle key={i} cx={x0 + i * step} cy={y0 + (y1 - y0) * 0} r={3} fill={color}/>);

/** Reusable sets. `cabin`: a small spacecraft interior. Part `room` is the back wall (porthole, pipes, hatch, seat);
 * part `console` is the foreground desk with a readout screen and blinking buttons, so it can sit in front of a rider. */
export const SetPiece: React.FC<{config: SetConfig; theme: Theme; width: number; height: number; frame: number; id: string}> = ({config: c, theme, width: W, height: H, frame, id}) => {
  const ink = theme.line.color, lw = theme.line.width, font = theme.label.fontFamily, random = seededRandom(c.seed);
  if (c.kind === 'iss') return <IssModule W={W} H={H} frame={frame} id={id} ink={ink} seed={c.seed}/>;
  if (c.kind === 'moon' || c.kind === 'mars') return <Surface kind={c.kind} W={W} H={H} frame={frame} id={id} ink={ink} seed={c.seed}/>;
  if (c.part === 'room') {
    const px = c.porthole.x * W, py = c.porthole.y * H, pr = c.porthole.r * W;
    const stars = Array.from({length: 70}, () => ({a: random() * Math.PI * 2, d: Math.sqrt(random()) * pr * .95, s: .8 + random() * 2}));
    const drift = frame * .0006;
    return <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a4868"/><stop offset=".6" stopColor="#2c3852"/><stop offset="1" stopColor="#1f2840"/></linearGradient>
        <radialGradient id={`${id}-earth`} cx={px - pr * .2} cy={py + pr * 1.05} r={pr * 1.3} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#4aa0f0"/><stop offset=".5" stopColor="#2a6fc4"/><stop offset="1" stopColor="#123a7a"/></radialGradient>
        <clipPath id={`${id}-glass`}><circle cx={px} cy={py} r={pr}/></clipPath>
      </defs>
      <rect x={-W * .1} y={-H * .1} width={W * 1.2} height={H * 1.2} fill={`url(#${id}-wall)`}/>
      {/* curved hull ribs and panels */}
      {[.12, .3, .7, .88].map(f => <path key={f} d={`M ${f * W} ${-H * .1} Q ${f * W + (f < .5 ? -40 : 40)} ${H * .45} ${f * W} ${H * 1.1}`} stroke="#1b2235" strokeWidth={14} fill="none"/>)}
      {[.12, .3, .7, .88].map(f => <path key={`h${f}`} d={`M ${f * W + 5} ${-H * .1} Q ${f * W + (f < .5 ? -35 : 45)} ${H * .45} ${f * W + 5} ${H * 1.1}`} stroke="#56668a" strokeWidth={3} fill="none"/>)}
      <rect x={-W * .1} y={H * .08} width={W * 1.2} height={10} fill="#1b2235"/>
      {rivets(W * .02, H * .1, W * .98, 0, 48, '#5c6b8e')}
      {/* pipes along the ceiling */}
      <path d={`M ${-W * .1} ${H * .03} L ${W * 1.1} ${H * .03}`} stroke="#8a6a4a" strokeWidth={22}/>
      <path d={`M ${-W * .1} ${H * .03 - 6} L ${W * 1.1} ${H * .03 - 6}`} stroke="#c09a70" strokeWidth={4}/>
      {[.22, .58, .81].map(f => <rect key={f} x={f * W - 14} y={H * .03 - 18} width={28} height={36} rx={6} fill="#6d5236" stroke={ink} strokeWidth={2}/>)}
      {/* hatch on the right */}
      <rect x={W * .76} y={H * .2} width={W * .16} height={H * .62} rx={W * .03} fill="#26304a" stroke="#56668a" strokeWidth={6}/>
      <circle cx={W * .84} cy={H * .5} r={W * .028} fill="none" stroke="#8592aa" strokeWidth={8}/>
      <rect x={W * .775} y={H * .22} width={W * .02} height={H * .58} fill="#ffcc4d" opacity=".5"/>
      {/* porthole with Earth turning below and stars */}
      <circle cx={px} cy={py} r={pr + 26} fill="#1b2235" stroke="#6d7c9f" strokeWidth={10}/>
      {Array.from({length: 12}, (_, i) => { const a = i / 12 * Math.PI * 2; return <circle key={i} cx={px + Math.cos(a) * (pr + 14)} cy={py + Math.sin(a) * (pr + 14)} r={4} fill="#8592aa"/>; })}
      <g clipPath={`url(#${id}-glass)`}>
        <rect x={px - pr} y={py - pr} width={pr * 2} height={pr * 2} fill="#03050d"/>
        {stars.map((s, i) => <circle key={i} cx={px + Math.cos(s.a + drift) * s.d} cy={py + Math.sin(s.a + drift) * s.d} r={s.s} fill="#fff" opacity={.4 + .5 * Math.sin(frame * .07 + i)}/>)}
        {c.porthole.view === 'earth' && <>
          <circle cx={px - pr * .2} cy={py + pr * 1.25} r={pr * 1.05} fill="#9fd8ff" opacity=".35"/>
          <circle cx={px - pr * .2} cy={py + pr * 1.3} r={pr} fill={`url(#${id}-earth)`}/>
          {[0, 1, 2].map(i => { const ox = ((i * .45 + frame * .0012) % 1.4 - .7) * pr * 2; return <ellipse key={i} cx={px + ox} cy={py + pr * .55 + i * 14} rx={pr * .3} ry={pr * .07} fill="#5e9b55" opacity=".9"/>; })}
          {[0, 1].map(i => { const ox = ((i * .6 + frame * .0018) % 1.4 - .7) * pr * 2; return <ellipse key={`c${i}`} cx={px + ox} cy={py + pr * .45 + i * 20} rx={pr * .35} ry={pr * .05} fill="#fff" opacity=".7"/>; })}
        </>}
        <path d={`M ${px - pr * .7} ${py - pr * .3} Q ${px - pr * .4} ${py - pr * .8} ${px + pr * .1} ${py - pr * .85}`} stroke="#ffffff" strokeOpacity=".25" strokeWidth={pr * .08} fill="none" strokeLinecap="round"/>
      </g>
      {/* pilot seat on the left */}
      <path d={`M ${W * .2} ${H * .9} L ${W * .2} ${H * .45} Q ${W * .2} ${H * .38} ${W * .27} ${H * .38} L ${W * .31} ${H * .38} Q ${W * .34} ${H * .38} ${W * .34} ${H * .45} L ${W * .34} ${H * .9} Z`} fill="#7a4434" stroke={ink} strokeWidth={lw}/>
      <path d={`M ${W * .225} ${H * .46} L ${W * .315} ${H * .46}`} stroke="#9c5a46" strokeWidth={10} strokeLinecap="round"/>
      <rect x={-W * .1} y={H * .9} width={W * 1.2} height={H * .3} fill="#161c2e"/>
      {Array.from({length: 14}, (_, i) => <path key={i} d={`M ${i * W / 12 - W * .05} ${H * .9} L ${i * W / 12 - W * .12} ${H * 1.1}`} stroke="#2b3450" strokeWidth={4}/>)}
    </g>;
  }
  // part === 'console': foreground desk
  const top = c.console.y * H, x0 = c.console.x0 * W, x1 = c.console.x1 * W, sx = c.console.screenX * W, sw = W * .16, sh = H * .17, sy = top - sh * .8;
  const blink = c.console.blink ? Math.floor(frame / 8) % 4 !== 3 : true;   // on three beats, off one
  const lights = Array.from({length: 14}, (_, i) => ({x: x0 + 60 + i * (x1 - x0 - 120) / 13, c: ['#ff5a4f', '#ffd25e', '#5ee08a', '#5ec8ff'][Math.floor(random() * 4)], ph: random() * 6}));
  return <g>
    <path d={`M ${x0} ${H * 1.2} L ${x0 + 30} ${top} L ${x1 - 30} ${top} L ${x1} ${H * 1.2} Z`} fill="#3d4a66" stroke={ink} strokeWidth={lw}/>
    <path d={`M ${x0 + 30} ${top} L ${x1 - 30} ${top}`} stroke="#8592aa" strokeWidth={6}/>
    <rect x={x0 + 40} y={top + 18} width={x1 - x0 - 80} height={H * .06} rx={10} fill="#2a3450"/>
    {lights.map((l, i) => <circle key={i} cx={l.x} cy={top + 18 + H * .03} r={9} fill={l.c} opacity={.35 + .65 * (Math.sin(frame * .25 + l.ph) > -.2 ? 1 : 0)}/>)}
    {[.2, .32, .7, .82].map(f => <g key={f}><rect x={x0 + (x1 - x0) * f - 8} y={top + H * .1} width={16} height={60} rx={8} fill="#1f2840"/><circle cx={x0 + (x1 - x0) * f} cy={top + H * .1 + 16 + 20 * Math.sin(f * 9)} r={16} fill="#c9d2e2" stroke={ink} strokeWidth={3}/></g>)}
    {/* readout screen on a short stand */}
    <rect x={sx - 10} y={sy + sh} width={20} height={top - sy - sh + 4} fill="#2a3450"/>
    <rect x={sx - sw / 2} y={sy} width={sw} height={sh} rx={14} fill="#0b1020" stroke="#8592aa" strokeWidth={6}/>
    <rect x={sx - sw / 2 + 10} y={sy + 10} width={sw - 20} height={sh - 20} rx={8} fill={c.console.screenColor} opacity=".12"/>
    {blink && c.console.text.split('\n').map((line, i, all) => <text key={i} x={sx} y={sy + sh / 2 + (i - (all.length - 1) / 2) * sh * .34 + sh * .1} textAnchor="middle" fontFamily={font} fontSize={sh * .3} fill={c.console.screenColor}>{line}</text>)}
  </g>;
};

/** ISS module interior in one-point perspective: the tunnel narrows to a far hatch, which gives depth for free. */
const IssModule: React.FC<{W: number; H: number; frame: number; id: string; ink: string; seed: number}> = ({W, H, frame, id, ink, seed}) => {
  const random = seededRandom(seed), cx = W * .5, cy = H * .46, fw = W * .16, fh = H * .2;   // far hatch frame
  const near = {x0: -W * .05, y0: -H * .05, x1: W * 1.05, y1: H * 1.05};
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const ring = (t: number) => ({x0: lerp(near.x0, cx - fw, t), y0: lerp(near.y0, cy - fh, t), x1: lerp(near.x1, cx + fw, t), y1: lerp(near.y1, cy + fh, t)});
  const rings = [.18, .36, .52, .66, .78, .88];
  const quad = (a: ReturnType<typeof ring>, b: ReturnType<typeof ring>, side: 'top' | 'bottom' | 'left' | 'right') => side === 'top' ? `M ${a.x0} ${a.y0} L ${a.x1} ${a.y0} L ${b.x1} ${b.y0} L ${b.x0} ${b.y0} Z`
    : side === 'bottom' ? `M ${a.x0} ${a.y1} L ${a.x1} ${a.y1} L ${b.x1} ${b.y1} L ${b.x0} ${b.y1} Z` : side === 'left' ? `M ${a.x0} ${a.y0} L ${b.x0} ${b.y0} L ${b.x0} ${b.y1} L ${a.x0} ${a.y1} Z` : `M ${a.x1} ${a.y0} L ${b.x1} ${b.y0} L ${b.x1} ${b.y1} L ${a.x1} ${a.y1} Z`;
  const shade = {top: '#e9edf3', bottom: '#bfc7d4', left: '#d6dce6', right: '#cbd2de'} as const;
  const all = [0, ...rings, 1];
  return <g>
    {all.slice(0, -1).map((t, i) => { const a = ring(t), b = ring(all[i + 1]); return (['top', 'bottom', 'left', 'right'] as const).map(sd => <path key={`${i}${sd}`} d={quad(a, b, sd)} fill={shade[sd]} stroke="#9aa5b8" strokeWidth={2}/>); })}
    {/* equipment racks: small panels, laptops, cable bundles */}
    {rings.slice(0, 4).map((t, i) => { const a = ring(t), b = ring(all[all.indexOf(t) + 1]); const lx = lerp(a.x0, b.x0, .5), rx = lerp(a.x1, b.x1, .5), ty = lerp(a.y0, b.y0, .5) + (b.y1 - b.y0) * .2, sc = (1 - t) * 2.4;
      return <g key={i}>
        <rect x={lx + 6} y={ty} width={60 * sc + 10} height={42 * sc + 8} fill="#2a3450" stroke={ink} strokeWidth={2}/>
        <rect x={lx + 10} y={ty + 4} width={52 * sc + 2} height={30 * sc + 4} fill={['#5ec8ff', '#9fe7b5', '#ffd25e', '#c6a0ff'][i % 4]} opacity={.5 + .3 * Math.sin(frame * .05 + i)}/>
        <rect x={rx - 70 * sc - 16} y={ty + 30 * sc} width={70 * sc + 10} height={26 * sc + 6} fill="#8592aa" stroke={ink} strokeWidth={2}/>
        <path d={`M ${lx} ${ty + 120 * sc} q ${40 * sc} ${30 * sc + Math.sin(frame * .03 + i) * 6} ${80 * sc} 0`} stroke={['#ff5a4f', '#2a3450', '#ffd25e'][i % 3]} strokeWidth={6 * sc + 2} fill="none"/>
      </g>; })}
    {/* yellow handrails along the walls */}
    {[.12, .45, .7].map(t => { const a = ring(t), b = ring(t + .1); return <g key={t}>
      <path d={`M ${a.x0 + 10} ${lerp(a.y0, a.y1, .7)} L ${b.x0 + 10} ${lerp(b.y0, b.y1, .7)}`} stroke="#f0c24a" strokeWidth={10 * (1 - t) + 3} strokeLinecap="round"/>
      <path d={`M ${a.x1 - 10} ${lerp(a.y0, a.y1, .3)} L ${b.x1 - 10} ${lerp(b.y0, b.y1, .3)}`} stroke="#f0c24a" strokeWidth={10 * (1 - t) + 3} strokeLinecap="round"/></g>; })}
    {/* light strips on the ceiling */}
    {rings.slice(0, 5).map((t, i) => { const a = ring(t), b = ring(all[all.indexOf(t) + 1]); return <path key={`l${i}`} d={`M ${lerp(a.x0, a.x1, .4)} ${lerp(a.y0, b.y0, .5)} L ${lerp(a.x0, a.x1, .6)} ${lerp(a.y0, b.y0, .5)}`} stroke="#fffbe6" strokeWidth={10 * (1 - t) + 3} strokeLinecap="round"/>; })}
    {/* far hatch: a round opening into the next module */}
    <rect x={cx - fw} y={cy - fh} width={fw * 2} height={fh * 2} fill="#d6dce6" stroke="#9aa5b8" strokeWidth={3}/>
    <circle cx={cx} cy={cy} r={fh * .8} fill="#aeb8c8" stroke={ink} strokeWidth={3}/>
    <circle cx={cx} cy={cy} r={fh * .62} fill="#eef3fa"/>
    {Array.from({length: 10}, (_, i) => <circle key={i} cx={cx + Math.cos(i / 10 * 6.283) * fh * .71} cy={cy + Math.sin(i / 10 * 6.283) * fh * .71} r={3} fill={ink}/>)}
  </g>;
};

/** Moon or Mars surface: sky, a distant horizon, near ground with craters or rocks; Earth hangs in the lunar sky. */
const Surface: React.FC<{kind: 'moon' | 'mars'; W: number; H: number; frame: number; id: string; ink: string; seed: number}> = ({kind, W, H, frame, id, ink, seed}) => {
  const random = seededRandom(seed), moon = kind === 'moon', hz = H * .6;
  const sky = moon ? ['#02040b', '#060a18'] : ['#d9a57c', '#e8c39b'];
  const ground = moon ? ['#9a9ea8', '#6d717c'] : ['#c06a3e', '#8e4226'];
  const stars = moon ? Array.from({length: 120}, () => ({x: random() * W, y: random() * hz * .95, r: .6 + random() * 1.8})) : [];
  const ridge = (y0: number, amp: number, seed2: number) => { const r = seededRandom(seed2); let d = `M -20 ${H}`; for (let x = -20; x <= W + 40; x += 60) d += ` L ${x} ${y0 - r() * amp}`; return d + ` L ${W + 40} ${H} Z`; };
  const craters = Array.from({length: moon ? 9 : 0}, () => ({x: random() * W, y: hz + 40 + random() * (H - hz - 60), r: 30 + random() * 90}));
  const rocks = Array.from({length: 14}, () => ({x: random() * W, y: hz + 30 + random() * (H - hz - 40), s: 10 + random() * 36}));
  return <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]}/><stop offset="1" stopColor={sky[1]}/></linearGradient>
      <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ground[0]}/><stop offset="1" stopColor={ground[1]}/></linearGradient>
    </defs>
    <rect x={-W * .1} y={-H * .1} width={W * 1.2} height={H * 1.2} fill={`url(#${id}-sky)`}/>
    {stars.map((st, i) => <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#fff" opacity={.5 + .4 * Math.sin(frame * .06 + i)}/>)}
    {moon && <g><circle cx={W * .78} cy={H * .2} r={H * .09} fill="#2a6fc4"/><ellipse cx={W * .77} cy={H * .19} rx={H * .05} ry={H * .025} fill="#5e9b55"/><ellipse cx={W * .8} cy={H * .23} rx={H * .06} ry={H * .012} fill="#fff" opacity=".8"/>
      <path d={`M ${W * .78 + H * .09} ${H * .2} A ${H * .09} ${H * .09} 0 0 1 ${W * .78} ${H * .29} A ${H * .06} ${H * .09} 0 0 0 ${W * .78 + H * .09} ${H * .2}`} fill="#000" opacity=".55"/></g>}
    {!moon && <circle cx={W * .25} cy={H * .18} r={H * .03} fill="#f6efe0" opacity=".85"/>}
    <path d={ridge(hz - 30, 60, seed + 1)} fill={moon ? '#5b5f6a' : '#a5583a'} opacity=".8"/>
    <path d={ridge(hz, 26, seed + 2)} fill={`url(#${id}-gr)`} stroke={ink} strokeWidth={2}/>
    {craters.map((c, i) => <g key={i}><ellipse cx={c.x} cy={c.y} rx={c.r} ry={c.r * .28} fill="#5e626c"/><ellipse cx={c.x + c.r * .06} cy={c.y + c.r * .03} rx={c.r * .86} ry={c.r * .22} fill="#878b95"/></g>)}
    {rocks.map((r, i) => <path key={i} d={`M ${r.x - r.s} ${r.y} Q ${r.x - r.s * .6} ${r.y - r.s} ${r.x} ${r.y - r.s * .9} Q ${r.x + r.s * .8} ${r.y - r.s * .7} ${r.x + r.s} ${r.y} Z`} fill={moon ? '#7b7f8a' : '#7a3a22'} stroke={ink} strokeWidth={2}/>)}
    {!moon && <rect x={-W * .1} y={hz - 80} width={W * 1.2} height={140} fill="#e3b28a" opacity=".25"/>}
  </g>;
};
