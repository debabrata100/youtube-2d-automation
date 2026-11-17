/** Arka character reference sheet, drawn by the same Figure component the videos use (no AI imagery).
 * Usage: npx tsx scripts/brand/arka-sheet.tsx <out.svg> */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync} from 'node:fs';
import {Figure, type FigureConfig} from '../../src/engine/kit/FigureElement';
import {getTheme} from '../../src/engine/style/theme';
import type {FaceId, PoseId} from '../../src/engine/kit/figure';

const GOLD = '#e8b84a', VISOR = '#ffe6a3', W = 2400, H = 1500;
const theme = getTheme('paint-notebook');
const ink = theme.line.color;
const cell = (pose: PoseId, face: FaceId, helmet: boolean, facing: 'left' | 'right' = 'right', h = .78): FigureConfig => ({
  x: .5, y: .93, height: h, facing, outfit: 'astronaut', poses: [{frame: 0, pose, blend: 1, ease: 'linear'}], faces: [{frame: 0, face}],
  blink: false, shiver: 0, seed: 11, suit: GOLD, visor: VISOR, accessories: [], helmet: [{frame: 0, on: helmet}],
});
const fig = (c: FigureConfig, x: number, y: number, w: number, h: number, key: string) =>
  <svg key={key} x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible"><Figure config={c} theme={theme} width={w} height={h} frame={0}/></svg>;
const label = (t: string, x: number, y: number, size = 34, fill = ink, anchor: 'middle' | 'start' | 'end' = 'middle') =>
  <text key={t + x + y} x={x} y={y} fontFamily="Patrick Hand" fontSize={size} fill={fill} textAnchor={anchor}>{t}</text>;

const poses: Array<[PoseId, FaceId, string]> = [['stand', 'neutral', 'stand'], ['wave', 'happy', 'wave (hello)'], ['point-right', 'smug', 'point (explaining)'],
  ['think', 'neutral', 'think'], ['shrug', 'grin', 'shrug'], ['cheer', 'grin', 'cheer'], ['float', 'happy', 'float (idle in space)'], ['panic', 'shocked', 'panic']];
const faces: Array<[FaceId, string]> = [['happy', 'happy'], ['grin', 'grin'], ['shocked', 'shocked'], ['smug', 'smug'], ['sad', 'sad'], ['dizzy', 'dizzy']];

const els: React.ReactNode[] = [];
els.push(<rect key="bg" width={W} height={H} fill="#fbfaf6"/>);
els.push(label('ARKA', 80, 120, 110, GOLD, 'start'));
els.push(label('character reference · Gahanarka · v1 (Nov 2026)', 360, 112, 40, ink, 'start'));
els.push(label('Drawn by Gahanarka’s own animation code (src/engine/kit/FigureElement.tsx). Use this sheet as the canonical design.', 80, 175, 30, '#6b6b6b', 'start'));
// hero pair: helmet on / off
els.push(fig(cell('wave', 'happy', true), 60, 210, 420, 640, 'hero-on'));
els.push(fig(cell('stand', 'happy', false), 470, 210, 420, 640, 'hero-off'));
els.push(label('helmet on (default)', 270, 900)); els.push(label('helmet off', 680, 900));
// pose row
const pw = 185, px0 = 930;
poses.forEach(([p, f, t], i) => { const x = px0 + i * pw; els.push(fig(cell(p, f, true, 'right', .7), x, 250, pw, 560, 'p' + i)); els.push(label(t, x + pw / 2, 860, 24)); });
els.push(label('POSES', px0, 240, 40, '#d9342b', 'start'));
// faces row (helmet off, close)
els.push(label('EXPRESSIONS', 80, 990, 40, '#d9342b', 'start'));
const head = (f: FaceId, x: number, y: number, size: number, key: string) => {
  // Render a normal-size figure in a 400x600 space and zoom the viewBox onto its head.
  const hy = .93 * 600 - .78 * 600 * .82, r = 120;
  return <svg key={key} x={x} y={y} width={size} height={size} viewBox={`${200 - r} ${hy - r} ${2 * r} ${2 * r}`}><Figure config={cell('stand', f, false)} theme={theme} width={400} height={600} frame={0}/></svg>;
};
faces.forEach(([f, t], i) => { const x = 70 + i * 205; els.push(head(f, x, 1020, 190, 'f' + i)); els.push(label(t, x + 95, 1250, 30)); });
// palette + rules
const sw: Array<[string, string]> = [[GOLD, 'suit gold #e8b84a'], [VISOR, 'visor #ffe6a3'], [ink, 'ink (outline)'], ['#ffffff', 'face white']];
els.push(label('PALETTE', 1330, 990, 40, '#d9342b', 'start'));
sw.forEach(([c, t], i) => { els.push(<rect key={'s' + i} x={1330} y={1020 + i * 80} width={110} height={60} rx={10} fill={c} stroke={ink} strokeWidth={3}/>); els.push(label(t, 1465, 1062 + i * 80, 32, ink, 'start')); });
const rules = ['Gold suit, gold visor, round white face, dot eyes.', 'Stick proportions: tube limbs, big round helmet.', 'Ink outline only: no gradients or real shading.',
  'Name: Arka (Sanskrit "sun"); bright, curious, kind.', 'Use only the faces on this sheet.'];
els.push(label('RULES', 1760, 990, 40, '#d9342b', 'start'));
rules.forEach((r, i) => els.push(<text key={'r' + i} x={1760} y={1050 + i * 48} fontFamily="Patrick Hand" fontSize={25} fill={ink}>{'• ' + r}</text>));
els.push(label('© 2026 Gahanarka (Debabrata). All rights reserved.', W - 60, H - 40, 28, '#6b6b6b', 'end'));

const svg = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{els}</svg>);
writeFileSync(process.argv[2] ?? 'arka-sheet.svg', svg);
console.log('wrote', process.argv[2], svg.length, 'bytes');
