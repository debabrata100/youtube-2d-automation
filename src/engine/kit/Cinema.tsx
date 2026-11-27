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
