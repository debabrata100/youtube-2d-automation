/** Subscribe watermark: Arka (helmet on, waving) in a gold-ringed circle, drawn by our own Figure component.
 * Usage: npx tsx scripts/brand/arka-watermark.tsx <out.svg> */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync} from 'node:fs';
import {Figure, type FigureConfig} from '../../src/engine/kit/FigureElement';
import {getTheme} from '../../src/engine/style/theme';

const theme = getTheme('paint-notebook');
const c: FigureConfig = {x: .5, y: .93, height: .78, facing: 'right', outfit: 'astronaut', poses: [{frame: 0, pose: 'wave', blend: 1, ease: 'linear'}],
  faces: [{frame: 0, face: 'happy'}], blink: false, shiver: 0, seed: 11, suit: '#e8b84a', visor: '#ffe6a3', accessories: [], helmet: [{frame: 0, on: true}]};
// The figure lives in a 400x600 space; frame the head and waving arm (upper body).
const S = 600;
const svg = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
  <defs><clipPath id="c"><circle cx={S / 2} cy={S / 2} r={S / 2 - 18}/></clipPath></defs>
  <circle cx={S / 2} cy={S / 2} r={S / 2 - 6} fill="#0b1530" stroke="#e8b84a" strokeWidth={22}/>
  <g clipPath="url(#c)">
    <svg x={0} y={0} width={S} height={S} viewBox="70 60 260 260"><Figure config={c} theme={theme} width={400} height={600} frame={0}/></svg>
  </g>
</svg>);
writeFileSync(process.argv[2] ?? 'arka-watermark.svg', svg);
console.log('wrote', process.argv[2]);
