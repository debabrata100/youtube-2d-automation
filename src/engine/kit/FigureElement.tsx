import React from 'react';
import type {Theme} from '../style/theme';
import {accessoryOn, faceAt, isBlinking, poseAt, skeleton, type Accessory, type FaceId, type PoseKey, type Skeleton} from './figure';

export type FigureConfig = {
  x: number; y: number; height: number; facing: 'left' | 'right'; outfit: 'stick' | 'astronaut';
  poses: PoseKey[]; faces: Array<{frame: number; face: FaceId}>; blink: boolean; shiver: number; seed: number; suit?: string; visor?: string;
  accessories: Accessory[]; coat?: string;
  helmet?: Array<{frame: number; on: boolean}>; flush?: Array<{frame: number; value: number}>;
  talk?: Array<{from: number; to: number; text: string}>;
  build?: {head: number; torso: number; arms: number; legs: number}; suitStyle?: 'round' | 'boxy'; helmetStyle?: 'bubble' | 'visor'; skin?: string;
  features?: Array<'mustache' | 'brows' | 'glasses'>; stripe?: string; nod?: number;
};
/** Helmet keys hold until the next key; with none the astronaut keeps the helmet on. */
export const helmetOn = (keys: FigureConfig['helmet'], frame: number) => { let on = true; for (const k of keys ?? []) if (frame >= k.frame) on = k.on; return on; };
export const flushAt = (keys: FigureConfig['flush'], frame: number) => {
  if (!keys?.length) return 0;
  if (frame <= keys[0].frame) return keys[0].value;
  for (let i = 1; i < keys.length; i++) if (frame < keys[i].frame) { const a = keys[i - 1], b = keys[i], t = (frame - a.frame) / (b.frame - a.frame); return a.value + (b.value - a.value) * t; }
  return keys.at(-1)!.value;
};
const mix = (a: string, b: string, t: number) => { const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16); return '#' + [0, 1, 2].map(i => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0')).join(''); };
type Pt = {x: number; y: number};
export type Viseme = 'open' | 'round' | 'closed' | 'teeth' | 'small';
const VISEME: Record<string, Viseme> = {a: 'open', e: 'open', i: 'open', y: 'open', o: 'round', u: 'round', w: 'round', q: 'round', m: 'closed', b: 'closed', p: 'closed', f: 'teeth', v: 'teeth'};
/** Mouth while talking: the letters of the current word spread evenly over its window, with a closed beat at each end. */
export const visemeAt = (talk: FigureConfig['talk'], frame: number): Viseme | null => {
  const w = talk?.find(k => frame >= k.from && frame <= k.to);
  if (!w) return null;
  const letters = w.text.toLowerCase().replace(/[^a-z]/g, '');
  if (!letters || w.to - w.from < 2 || frame === w.to) return 'closed';
  const i = Math.min(letters.length - 1, Math.floor((frame - w.from) / (w.to - w.from) * letters.length));
  return VISEME[letters[i]] ?? 'small';
};
const line = (a: Pt, b: Pt, c: Pt) => `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`;

const Face: React.FC<{s: Skeleton; face: FaceId; ink: string; accent: string; blink: boolean; look: number; viseme?: Viseme | null}> = ({s, face, ink, accent, blink, look, viseme}) => {
  const r = s.headR, cx = s.head.x + look * r * .12, cy = s.head.y, ex = r * .36, ey = cy - r * .12, w = Math.max(2, r * .09);
  const stroke = {stroke: ink, strokeWidth: w, strokeLinecap: 'round' as const, fill: 'none'};
  const dot = (x: number) => (blink ? <path d={`M ${x - r * .1} ${ey} L ${x + r * .1} ${ey}`} {...stroke}/> : <circle cx={x} cy={ey} r={r * .085} fill={ink}/>);
  const ring = (x: number, pupil: number) => <><circle cx={x} cy={ey} r={r * .2} fill="#ffffff" stroke={ink} strokeWidth={w * .8}/><circle cx={x} cy={ey} r={r * pupil} fill={ink}/></>;
  const eyes = (() => {
    switch (face) {
      case 'shocked': case 'scream': return <>{ring(cx - ex, face === 'scream' ? .06 : .09)}{ring(cx + ex, face === 'scream' ? .06 : .09)}</>;
      case 'grin': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .12} ${ey + r * .03} Q ${cx + k * ex} ${ey - r * .12} ${cx + k * ex + r * .12} ${ey + r * .03}`} {...stroke}/>)}</>;
      case 'scared': return <>{ring(cx - ex, .05)}{ring(cx + ex, .05)}</>;
      case 'dizzy': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .11} ${ey - r * .11} l ${r * .22} ${r * .22} m 0 ${-r * .22} l ${-r * .22} ${r * .22}`} {...stroke}/>)}</>;
      case 'pain': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - k * r * .12} ${ey - r * .1} l ${k * r * .2} ${r * .1} l ${-k * r * .2} ${r * .1}`} {...stroke}/>)}</>;
      case 'smug': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .12} ${ey} l ${r * .24} 0`} {...stroke}/>)}</>;
      case 'tongue': return <>{ring(cx - ex, .09)}{ring(cx + ex, .09)}</>;
      case 'asleep': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .13} ${ey} Q ${cx + k * ex} ${ey + r * .12} ${cx + k * ex + r * .13} ${ey}`} {...stroke}/>)}</>;
      case 'puffed': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .12} ${ey + r * .02} L ${cx + k * ex} ${ey - r * .06} L ${cx + k * ex + r * .12} ${ey + r * .02}`} {...stroke}/>)}</>;
      default: return <>{dot(cx - ex)}{dot(cx + ex)}</>;
    }
  })();
  const my = cy + r * .42;
  const mouth = viseme ? (() => {
    switch (viseme) {
      case 'open': return <><ellipse cx={cx} cy={my + r * .06} rx={r * .27} ry={r * .2} fill={ink}/><ellipse cx={cx} cy={my + r * .17} rx={r * .14} ry={r * .07} fill="#e8707a"/></>;
      case 'round': return <ellipse cx={cx} cy={my + r * .04} rx={r * .12} ry={r * .16} fill={ink}/>;
      case 'teeth': return <><rect x={cx - r * .22} y={my - r * .06} width={r * .44} height={r * .16} rx={r * .05} fill="#ffffff" stroke={ink} strokeWidth={w * .8}/><path d={`M ${cx - r * .2} ${my + r * .02} L ${cx + r * .2} ${my + r * .02}`} stroke={ink} strokeWidth={w * .5}/></>;
      case 'small': return <ellipse cx={cx} cy={my + r * .02} rx={r * .17} ry={r * .08} fill={ink}/>;
      default: return <path d={`M ${cx - r * .2} ${my} L ${cx + r * .2} ${my}`} {...stroke}/>;
    }
  })() : (() => {
    switch (face) {
      case 'happy': return <path d={`M ${cx - r * .32} ${my - r * .08} Q ${cx} ${my + r * .26} ${cx + r * .32} ${my - r * .08}`} {...stroke}/>;
      case 'grin': return <><path d={`M ${cx - r * .42} ${my - r * .14} Q ${cx} ${my + r * .5} ${cx + r * .42} ${my - r * .14} Z`} fill="#ffffff" stroke={ink} strokeWidth={w} strokeLinejoin="round"/><path d={`M ${cx - r * .38} ${my - r * .04} L ${cx + r * .38} ${my - r * .04}`} stroke={ink} strokeWidth={w * .6}/></>;
      case 'scream': return <><ellipse cx={cx} cy={my + r * .1} rx={r * .36} ry={r * .42} fill={ink}/><ellipse cx={cx} cy={my + r * .32} rx={r * .2} ry={r * .12} fill="#e8707a"/><path d={`M ${cx - r * .22} ${my - r * .12} L ${cx + r * .22} ${my - r * .12}`} stroke="#ffffff" strokeWidth={w * .9} strokeLinecap="round"/></>;
      case 'shocked': return <ellipse cx={cx} cy={my + r * .02} rx={r * .14} ry={r * .2} fill={ink}/>;
      case 'scared': case 'dizzy': return <path d={`M ${cx - r * .3} ${my} q ${r * .075} ${-r * .1} ${r * .15} 0 t ${r * .15} 0 t ${r * .15} 0 t ${r * .15} 0`} {...stroke}/>;
      case 'sad': return <path d={`M ${cx - r * .28} ${my + r * .1} Q ${cx} ${my - r * .14} ${cx + r * .28} ${my + r * .1}`} {...stroke}/>;
      case 'angry': return <path d={`M ${cx - r * .26} ${my + r * .04} L ${cx + r * .26} ${my + r * .04}`} {...stroke}/>;
      case 'smug': return <path d={`M ${cx - r * .2} ${my + r * .02} Q ${cx + r * .1} ${my + r * .12} ${cx + r * .3} ${my - r * .1}`} {...stroke}/>;
      case 'pain': return <><rect x={cx - r * .28} y={my - r * .1} width={r * .56} height={r * .24} rx={r * .06} fill="#ffffff" stroke={ink} strokeWidth={w * .8}/><path d={`M ${cx - r * .28} ${my + r * .02} L ${cx + r * .28} ${my + r * .02}`} stroke={ink} strokeWidth={w * .6}/></>;
      case 'puffed': return <><circle cx={cx - r * .5} cy={my - r * .04} r={r * .22} fill="#f6b9a8" stroke={ink} strokeWidth={w * .6}/><circle cx={cx + r * .5} cy={my - r * .04} r={r * .22} fill="#f6b9a8" stroke={ink} strokeWidth={w * .6}/><circle cx={cx} cy={my} r={r * .07} fill={ink}/></>;
      case 'tongue': return <><ellipse cx={cx} cy={my} rx={r * .26} ry={r * .2} fill={ink}/><path d={`M ${cx - r * .17} ${my + r * .05} Q ${cx - r * .19} ${my + r * .42} ${cx} ${my + r * .42} Q ${cx + r * .19} ${my + r * .42} ${cx + r * .17} ${my + r * .05} Z`} fill="#e8707a" stroke={ink} strokeWidth={w * .7}/></>;
      case 'asleep': return <ellipse cx={cx} cy={my + r * .04} rx={r * .1} ry={r * .07} fill={ink}/>;
      default: return <path d={`M ${cx - r * .18} ${my} L ${cx + r * .18} ${my}`} {...stroke}/>;
    }
  })();
  const brows = face === 'angry' ? <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex * 1.5} ${ey - r * .3} L ${cx + k * ex * .4} ${ey - r * .18}`} {...stroke}/>)}</>
    : face === 'sad' || face === 'scared' ? <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex * 1.45} ${ey - r * .22} L ${cx + k * ex * .45} ${ey - r * .36}`} {...stroke}/>)}</> : null;
  const sweat = face === 'scared' || face === 'pain' ? <path d={`M ${cx + r * .78} ${cy - r * .35} q ${r * .14} ${r * .26} 0 ${r * .3} q ${-r * .14} ${-r * .04} 0 ${-r * .3}`} fill={accent} stroke={ink} strokeWidth={w * .6}/> : null;
  return <g>{brows}{eyes}{mouth}{sweat}</g>;
};

/** Head nod while talking: a quick dip at each word start that settles over 6 frames. */
export const nodAt = (talk: FigureConfig['talk'], frame: number, deg: number) => {
  if (!deg || !talk?.length) return 0;
  const w = talk.find(k => frame >= k.from && frame <= k.to);
  if (!w) return 0;
  const t = frame - w.from, k = (w.text.length % 3) - 1;   // vary direction by word, deterministically
  return t > 8 ? 0 : deg * Math.sin(t / 8 * Math.PI) * (k === 0 ? 1 : k);
};
/** Face features drawn over the face: thick brows, a mustache, round glasses. */
const Features: React.FC<{s: Skeleton; features: Array<'mustache' | 'brows' | 'glasses'>; ink: string; look: number}> = ({s, features, ink, look}) => {
  const r = s.headR, cx = s.head.x + look * r * .12, cy = s.head.y, ex = r * .36, ey = cy - r * .12;
  return <g>
    {features.includes('brows') && [-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .2} ${ey - r * .24} Q ${cx + k * ex} ${ey - r * .34} ${cx + k * ex + r * .2} ${ey - r * .26}`} stroke={ink} strokeWidth={r * .12} strokeLinecap="round" fill="none"/>)}
    {features.includes('glasses') && <g fill="none" stroke={ink} strokeWidth={r * .06}>{[-1, 1].map(k => <circle key={k} cx={cx + k * ex} cy={ey} r={r * .24}/>)}<path d={`M ${cx - ex + r * .24} ${ey} L ${cx + ex - r * .24} ${ey}`}/></g>}
    {features.includes('mustache') && <path d={`M ${cx} ${cy + r * .3} q ${-r * .2} ${-r * .1} ${-r * .42} ${r * .06} q ${r * .2} ${r * .02} ${r * .42} ${-r * .02} q ${r * .22} ${r * .04} ${r * .42} ${r * .02} q ${-r * .22} ${-r * .16} ${-r * .42} ${-r * .06} Z`} fill={ink}/>}
  </g>;
};

/** A hand-drawn style stick figure (or astronaut) posed from keyframed presets. */
export const Figure: React.FC<{config: FigureConfig; theme: Theme; width: number; height: number; frame: number}> = ({config: c, theme, width, height, frame}) => {
  const h = c.height * height, nod = nodAt(c.talk, frame, c.nod ?? 4), base = poseAt(c.poses, frame), pose = nod ? {...base, head: base.head + nod} : base;
  const s = skeleton(pose, h, c.build), ink = theme.line.color, boxy = c.suitStyle === 'boxy', feats = c.features ?? [];
  const w = Math.max(3, h * .024), face = faceAt(c.faces, frame), blink = c.blink && isBlinking(frame, c.seed);
  const jitter = c.shiver ? Math.sin(frame * 2.7 + c.seed) * c.shiver : 0;
  const astro = c.outfit === 'astronaut', helmet = astro && helmetOn(c.helmet, frame), skin = mix(c.skin ?? '#ffffff', '#f2876b', flushAt(c.flush, frame)), suit = c.suit ?? theme.palette.cloud.light, visor = c.visor ?? theme.palette.water.light;
  const flip = c.facing === 'left' ? -1 : 1, centre = {x: s.hip.x, y: (s.hip.y + s.neck.y) / 2};
  const transform = `translate(${c.x * width + jitter} ${c.y * height}) scale(${flip} 1) rotate(${pose.rotate} ${centre.x} ${centre.y})`;
  // Limbs: plain stick strokes, or a thick suit tube (ink outline under a lighter fill) for the astronaut.
  const limb = (d: string, k: string) => astro
    ? <g key={k}><path d={d} fill="none" stroke={ink} strokeWidth={h * .075} strokeLinecap="round" strokeLinejoin="round"/><path d={d} fill="none" stroke={suit} strokeWidth={h * .075 - w * 1.6} strokeLinecap="round" strokeLinejoin="round"/></g>
    : <path key={k} d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>;
  const has = (item: Accessory['item']) => accessoryOn(c.accessories, item, frame);
  const coat = c.coat ?? theme.palette.text.accent, coatDark = theme.palette.rock.dark;
  // Wings: a feathered panel hanging off the outer edge of each arm, so it reads in any pose (flapping included).
  const wing = (elbow: Pt, hand: Pt, side: -1 | 1, k: string) => {
    const tip = {x: hand.x + (hand.x - elbow.x) * .3, y: hand.y + (hand.y - elbow.y) * .3};
    const vx = tip.x - s.shoulder.x, vy = tip.y - s.shoulder.y, len = Math.hypot(vx, vy) || 1;
    // Feathers hang on the side away from the body; for a level arm, below it.
    let nx = vy / len, ny = -vx / len;
    if (nx * side < -.2 || (Math.abs(nx) <= .2 && ny < 0)) { nx = -nx; ny = -ny; }
    const depth = h * .24;
    const off = (p: Pt, f: number) => ({x: p.x + nx * depth * f, y: p.y + ny * depth * f});
    const a = off(s.shoulder, .7), b = off(elbow, 1), c2 = off(tip, .45);
    const scallop = [0, 1, 2, 3].map(i => { const t = i / 3, q = {x: c2.x + (a.x - c2.x) * t, y: c2.y + (a.y - c2.y) * t}; return q; });
    const d = `M ${s.shoulder.x} ${s.shoulder.y} L ${elbow.x} ${elbow.y} L ${tip.x} ${tip.y} L ${c2.x} ${c2.y} ` +
      scallop.slice(1).map((q, i) => { const p0 = scallop[i], mx = (p0.x + q.x) / 2 + nx * depth * .18, my = (p0.y + q.y) / 2 + ny * depth * .18; return `Q ${mx} ${my} ${q.x} ${q.y}`; }).join(' ') + ' Z';
    return <g key={k}><path d={d} fill={theme.palette.cloud.light} stroke={ink} strokeWidth={w} strokeLinejoin="round"/>
      {[.3, .55, .8].map(t => { const p = {x: s.shoulder.x + vx * t, y: s.shoulder.y + vy * t}; return <path key={t} d={`M ${p.x} ${p.y} l ${nx * depth * .75} ${ny * depth * .75}`} stroke={ink} strokeWidth={w * .55} opacity=".55"/>; })}</g>;
  };
  const torsoW = h * (boxy ? .21 : .17), torsoAngle = Math.atan2(s.neck.x - s.hip.x, s.hip.y - s.neck.y) * 180 / Math.PI, torsoLen = Math.hypot(s.neck.x - s.hip.x, s.neck.y - s.hip.y);
  return <g transform={transform}>
    {has('wings') && <>{wing(s.elbowL, s.handL, -1, 'wl')}{wing(s.elbowR, s.handR, 1, 'wr')}</>}
    {astro && <rect x={-torsoW * .62} y={-torsoLen * .95} width={torsoW * 1.24} height={torsoLen * .8} rx={torsoW * .2} fill={suit} stroke={ink} strokeWidth={w} transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}/>}
    {limb(line(s.hip, s.kneeL, s.footL), 'legL')}
    {limb(line(s.hip, s.kneeR, s.footR), 'legR')}
    {astro && [s.footL, s.footR].map((f, i) => <rect key={i} x={f.x - h * .05} y={f.y - h * .035} width={h * .1} height={h * .05} rx={h * .015} fill={suit} stroke={ink} strokeWidth={w}/>)}
    {astro
      ? <g transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}>
          <rect x={-torsoW / 2} y={-torsoLen * 1.02} width={torsoW} height={torsoLen * 1.08} rx={torsoW * (boxy ? .1 : .28)} fill={suit} stroke={ink} strokeWidth={w}/>
          {boxy && [-1, 1].map(k => <rect key={k} x={k < 0 ? -torsoW * .62 : torsoW * .32} y={-torsoLen * 1.06} width={torsoW * .3} height={torsoLen * .2} rx={torsoW * .06} fill={suit} stroke={ink} strokeWidth={w}/>)}
          {c.stripe && <rect x={-torsoW / 2 + w} y={-torsoLen * .5} width={torsoW - w * 2} height={torsoLen * .1} fill={c.stripe}/>}
        </g>
      : <path d={`M ${s.hip.x} ${s.hip.y} L ${s.neck.x} ${s.neck.y}`} stroke={ink} strokeWidth={w} strokeLinecap="round"/>}
    {astro && <g transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}>
      <rect x={-torsoW * .26} y={-torsoLen * .72} width={torsoW * .52} height={torsoLen * .28} rx={torsoW * .06} fill={theme.palette.cloud.shadow} stroke={ink} strokeWidth={w * .7}/>
      <circle cx={-torsoW * .1} cy={-torsoLen * .58} r={torsoW * .05} fill={theme.palette.text.accent}/>
      <circle cx={torsoW * .1} cy={-torsoLen * .58} r={torsoW * .05} fill={visor}/>
    </g>}
    {has('coat') && !astro && <g>
      <rect x={-torsoW * .62} y={-torsoLen * 1.06} width={torsoW * 1.24} height={torsoLen * 1.18} rx={torsoW * .4} fill={coat} stroke={ink} strokeWidth={w} transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}/>
      <g transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}>{[.3, .55, .8].map(t => <path key={t} d={`M ${-torsoW * .55} ${-torsoLen * t} Q 0 ${-torsoLen * t + h * .015} ${torsoW * .55} ${-torsoLen * t}`} fill="none" stroke={coatDark} strokeWidth={w * .6} opacity=".55"/>)}<path d={`M 0 ${-torsoLen * 1.02} L 0 ${torsoLen * .08}`} stroke={ink} strokeWidth={w * .6}/></g>
      {[[s.elbowL, s.handL], [s.elbowR, s.handR]].map(([e], i) => <g key={i}><path d={`M ${s.shoulder.x} ${s.shoulder.y} L ${e.x} ${e.y}`} stroke={ink} strokeWidth={h * .07} strokeLinecap="round"/><path d={`M ${s.shoulder.x} ${s.shoulder.y} L ${e.x} ${e.y}`} stroke={coat} strokeWidth={h * .07 - w * 1.6} strokeLinecap="round"/></g>)}
    </g>}
    {limb(line(s.shoulder, s.elbowL, s.handL), 'armL')}
    {limb(line(s.shoulder, s.elbowR, s.handR), 'armR')}
    {astro && [s.handL, s.handR].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={h * .036} fill={suit} stroke={ink} strokeWidth={w}/>)}
    {has('coat') && !astro && <circle cx={s.head.x} cy={s.head.y + s.headR * .08} r={s.headR * 1.28} fill={coat} stroke={ink} strokeWidth={w}/>}
    <circle cx={s.head.x} cy={s.head.y} r={s.headR} fill={skin} stroke={ink} strokeWidth={w}/>
    <g transform={flip < 0 ? `translate(${2 * s.head.x} 0) scale(-1 1)` : undefined}>
      <Face s={s} face={face} ink={ink} accent={visor} blink={blink} look={flip > 0 ? 1 : -1} viseme={visemeAt(c.talk, frame)}/>
      {feats.length > 0 && <Features s={s} features={feats} ink={ink} look={flip > 0 ? 1 : -1}/>}
    </g>
    {has('mask') && <g>
      <path d={`M ${s.head.x + s.headR * .45} ${s.head.y + s.headR * .6} Q ${s.head.x + s.headR * 1.3} ${s.head.y + s.headR * 1.3} ${s.neck.x + torsoW * .7} ${s.neck.y + torsoLen * .35}`} fill="none" stroke={ink} strokeWidth={w * 1.6} strokeLinecap="round"/>
      <ellipse cx={s.head.x} cy={s.head.y + s.headR * .45} rx={s.headR * .55} ry={s.headR * .38} fill={theme.palette.smoke.mid} stroke={ink} strokeWidth={w}/>
      <circle cx={s.head.x} cy={s.head.y + s.headR * .47} r={s.headR * .12} fill={ink}/>
      <rect x={s.neck.x + torsoW * .45} y={s.neck.y + torsoLen * .1} width={torsoW * .5} height={torsoLen * .55} rx={torsoW * .2} fill={theme.palette.water.mid} stroke={ink} strokeWidth={w}/>
    </g>}
    {helmet && (c.helmetStyle === 'visor'
      ? <>
          <rect x={s.head.x - s.headR * 1.38} y={s.head.y - s.headR * 1.4} width={s.headR * 2.76} height={s.headR * 2.7} rx={s.headR * .62} fill={visor} fillOpacity=".12" stroke={ink} strokeWidth={w}/>
          {/* sun visor pushed up onto the brow, so the eyes stay readable */}
          <path d={`M ${s.head.x - s.headR * 1.3} ${s.head.y - s.headR * .78} Q ${s.head.x} ${s.head.y - s.headR * 1.02} ${s.head.x + s.headR * 1.3} ${s.head.y - s.headR * .78} L ${s.head.x + s.headR * 1.32} ${s.head.y - s.headR * 1.2} Q ${s.head.x} ${s.head.y - s.headR * 1.46} ${s.head.x - s.headR * 1.32} ${s.head.y - s.headR * 1.2} Z`} fill={visor} fillOpacity=".85" stroke={ink} strokeWidth={w * .7}/>
          <path d={`M ${s.head.x + s.headR * .55} ${s.head.y + s.headR * .2} L ${s.head.x + s.headR * 1.05} ${s.head.y - s.headR * .35}`} stroke="#ffffff" strokeWidth={w * 1.3} strokeLinecap="round" opacity=".8"/>
          <path d={`M ${s.head.x - s.headR * .3} ${s.head.y - s.headR * 1.45} L ${s.head.x - s.headR * .3} ${s.head.y - s.headR * 1.85} M ${s.head.x - s.headR * .3} ${s.head.y - s.headR * 1.85} l ${s.headR * .1} 0`} stroke={ink} strokeWidth={w} strokeLinecap="round"/>
          <circle cx={s.head.x - s.headR * .3} cy={s.head.y - s.headR * 1.9} r={s.headR * .1} fill={c.stripe ?? theme.palette.text.accent}/>
        </>
      : <>
      <circle cx={s.head.x} cy={s.head.y} r={s.headR * 1.42} fill={visor} fillOpacity=".18" stroke={ink} strokeWidth={w}/>
      <path d={`M ${s.head.x - s.headR * 1.05} ${s.head.y - s.headR * .55} A ${s.headR * 1.2} ${s.headR * 1.2} 0 0 1 ${s.head.x - s.headR * .2} ${s.head.y - s.headR * 1.18}`} fill="none" stroke="#ffffff" strokeWidth={w * 1.4} strokeLinecap="round" opacity=".9"/>
    </>)}
  </g>;
};
