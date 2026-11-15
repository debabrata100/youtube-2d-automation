import React from 'react';
import type {Theme} from '../style/theme';
import {faceAt, isBlinking, poseAt, skeleton, type FaceId, type PoseKey, type Skeleton} from './figure';

export type FigureConfig = {
  x: number; y: number; height: number; facing: 'left' | 'right'; outfit: 'stick' | 'astronaut';
  poses: PoseKey[]; faces: Array<{frame: number; face: FaceId}>; blink: boolean; shiver: number; seed: number; suit?: string; visor?: string;
};
type Pt = {x: number; y: number};
const line = (a: Pt, b: Pt, c: Pt) => `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`;

const Face: React.FC<{s: Skeleton; face: FaceId; ink: string; accent: string; blink: boolean; look: number}> = ({s, face, ink, accent, blink, look}) => {
  const r = s.headR, cx = s.head.x + look * r * .12, cy = s.head.y, ex = r * .36, ey = cy - r * .12, w = Math.max(2, r * .09);
  const stroke = {stroke: ink, strokeWidth: w, strokeLinecap: 'round' as const, fill: 'none'};
  const dot = (x: number) => (blink ? <path d={`M ${x - r * .1} ${ey} L ${x + r * .1} ${ey}`} {...stroke}/> : <circle cx={x} cy={ey} r={r * .085} fill={ink}/>);
  const ring = (x: number, pupil: number) => <><circle cx={x} cy={ey} r={r * .2} fill="#ffffff" stroke={ink} strokeWidth={w * .8}/><circle cx={x} cy={ey} r={r * pupil} fill={ink}/></>;
  const eyes = (() => {
    switch (face) {
      case 'shocked': return <>{ring(cx - ex, .09)}{ring(cx + ex, .09)}</>;
      case 'scared': return <>{ring(cx - ex, .05)}{ring(cx + ex, .05)}</>;
      case 'dizzy': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .11} ${ey - r * .11} l ${r * .22} ${r * .22} m 0 ${-r * .22} l ${-r * .22} ${r * .22}`} {...stroke}/>)}</>;
      case 'pain': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - k * r * .12} ${ey - r * .1} l ${k * r * .2} ${r * .1} l ${-k * r * .2} ${r * .1}`} {...stroke}/>)}</>;
      case 'smug': return <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex - r * .12} ${ey} l ${r * .24} 0`} {...stroke}/>)}</>;
      default: return <>{dot(cx - ex)}{dot(cx + ex)}</>;
    }
  })();
  const my = cy + r * .42;
  const mouth = (() => {
    switch (face) {
      case 'happy': return <path d={`M ${cx - r * .32} ${my - r * .08} Q ${cx} ${my + r * .26} ${cx + r * .32} ${my - r * .08}`} {...stroke}/>;
      case 'shocked': return <ellipse cx={cx} cy={my + r * .02} rx={r * .14} ry={r * .2} fill={ink}/>;
      case 'scared': case 'dizzy': return <path d={`M ${cx - r * .3} ${my} q ${r * .075} ${-r * .1} ${r * .15} 0 t ${r * .15} 0 t ${r * .15} 0 t ${r * .15} 0`} {...stroke}/>;
      case 'sad': return <path d={`M ${cx - r * .28} ${my + r * .1} Q ${cx} ${my - r * .14} ${cx + r * .28} ${my + r * .1}`} {...stroke}/>;
      case 'angry': return <path d={`M ${cx - r * .26} ${my + r * .04} L ${cx + r * .26} ${my + r * .04}`} {...stroke}/>;
      case 'smug': return <path d={`M ${cx - r * .2} ${my + r * .02} Q ${cx + r * .1} ${my + r * .12} ${cx + r * .3} ${my - r * .1}`} {...stroke}/>;
      case 'pain': return <><rect x={cx - r * .28} y={my - r * .1} width={r * .56} height={r * .24} rx={r * .06} fill="#ffffff" stroke={ink} strokeWidth={w * .8}/><path d={`M ${cx - r * .28} ${my + r * .02} L ${cx + r * .28} ${my + r * .02}`} stroke={ink} strokeWidth={w * .6}/></>;
      default: return <path d={`M ${cx - r * .18} ${my} L ${cx + r * .18} ${my}`} {...stroke}/>;
    }
  })();
  const brows = face === 'angry' ? <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex * 1.5} ${ey - r * .3} L ${cx + k * ex * .4} ${ey - r * .18}`} {...stroke}/>)}</>
    : face === 'sad' || face === 'scared' ? <>{[-1, 1].map(k => <path key={k} d={`M ${cx + k * ex * 1.45} ${ey - r * .22} L ${cx + k * ex * .45} ${ey - r * .36}`} {...stroke}/>)}</> : null;
  const sweat = face === 'scared' || face === 'pain' ? <path d={`M ${cx + r * .78} ${cy - r * .35} q ${r * .14} ${r * .26} 0 ${r * .3} q ${-r * .14} ${-r * .04} 0 ${-r * .3}`} fill={accent} stroke={ink} strokeWidth={w * .6}/> : null;
  return <g>{brows}{eyes}{mouth}{sweat}</g>;
};

/** A hand-drawn style stick figure (or astronaut) posed from keyframed presets. */
export const Figure: React.FC<{config: FigureConfig; theme: Theme; width: number; height: number; frame: number}> = ({config: c, theme, width, height, frame}) => {
  const h = c.height * height, pose = poseAt(c.poses, frame), s = skeleton(pose, h), ink = theme.line.color;
  const w = Math.max(3, h * .024), face = faceAt(c.faces, frame), blink = c.blink && isBlinking(frame, c.seed);
  const jitter = c.shiver ? Math.sin(frame * 2.7 + c.seed) * c.shiver : 0;
  const astro = c.outfit === 'astronaut', suit = c.suit ?? theme.palette.cloud.light, visor = c.visor ?? theme.palette.water.light;
  const flip = c.facing === 'left' ? -1 : 1, centre = {x: s.hip.x, y: (s.hip.y + s.neck.y) / 2};
  const transform = `translate(${c.x * width + jitter} ${c.y * height}) scale(${flip} 1) rotate(${pose.rotate} ${centre.x} ${centre.y})`;
  // Limbs: plain stick strokes, or a thick suit tube (ink outline under a lighter fill) for the astronaut.
  const limb = (d: string, k: string) => astro
    ? <g key={k}><path d={d} fill="none" stroke={ink} strokeWidth={h * .075} strokeLinecap="round" strokeLinejoin="round"/><path d={d} fill="none" stroke={suit} strokeWidth={h * .075 - w * 1.6} strokeLinecap="round" strokeLinejoin="round"/></g>
    : <path key={k} d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>;
  const torsoW = h * .17, torsoAngle = Math.atan2(s.neck.x - s.hip.x, s.hip.y - s.neck.y) * 180 / Math.PI, torsoLen = Math.hypot(s.neck.x - s.hip.x, s.neck.y - s.hip.y);
  return <g transform={transform}>
    {astro && <rect x={-torsoW * .62} y={-torsoLen * .95} width={torsoW * 1.24} height={torsoLen * .8} rx={torsoW * .2} fill={suit} stroke={ink} strokeWidth={w} transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}/>}
    {limb(line(s.hip, s.kneeL, s.footL), 'legL')}
    {limb(line(s.hip, s.kneeR, s.footR), 'legR')}
    {astro && [s.footL, s.footR].map((f, i) => <rect key={i} x={f.x - h * .05} y={f.y - h * .035} width={h * .1} height={h * .05} rx={h * .015} fill={suit} stroke={ink} strokeWidth={w}/>)}
    {astro
      ? <rect x={-torsoW / 2} y={-torsoLen * 1.02} width={torsoW} height={torsoLen * 1.08} rx={torsoW * .28} fill={suit} stroke={ink} strokeWidth={w} transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}/>
      : <path d={`M ${s.hip.x} ${s.hip.y} L ${s.neck.x} ${s.neck.y}`} stroke={ink} strokeWidth={w} strokeLinecap="round"/>}
    {astro && <g transform={`translate(${s.hip.x} ${s.hip.y}) rotate(${torsoAngle})`}>
      <rect x={-torsoW * .26} y={-torsoLen * .72} width={torsoW * .52} height={torsoLen * .28} rx={torsoW * .06} fill={theme.palette.cloud.shadow} stroke={ink} strokeWidth={w * .7}/>
      <circle cx={-torsoW * .1} cy={-torsoLen * .58} r={torsoW * .05} fill={theme.palette.text.accent}/>
      <circle cx={torsoW * .1} cy={-torsoLen * .58} r={torsoW * .05} fill={visor}/>
    </g>}
    {limb(line(s.shoulder, s.elbowL, s.handL), 'armL')}
    {limb(line(s.shoulder, s.elbowR, s.handR), 'armR')}
    {astro && [s.handL, s.handR].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={h * .036} fill={suit} stroke={ink} strokeWidth={w}/>)}
    <circle cx={s.head.x} cy={s.head.y} r={s.headR} fill="#ffffff" stroke={ink} strokeWidth={w}/>
    <g transform={flip < 0 ? `translate(${2 * s.head.x} 0) scale(-1 1)` : undefined}>
      <Face s={s} face={face} ink={ink} accent={visor} blink={blink} look={flip > 0 ? 1 : -1}/>
    </g>
    {astro && <>
      <circle cx={s.head.x} cy={s.head.y} r={s.headR * 1.42} fill={visor} fillOpacity=".18" stroke={ink} strokeWidth={w}/>
      <path d={`M ${s.head.x - s.headR * 1.05} ${s.head.y - s.headR * .55} A ${s.headR * 1.2} ${s.headR * 1.2} 0 0 1 ${s.head.x - s.headR * .2} ${s.head.y - s.headR * 1.18}`} fill="none" stroke="#ffffff" strokeWidth={w * 1.4} strokeLinecap="round" opacity=".9"/>
    </>}
  </g>;
};
