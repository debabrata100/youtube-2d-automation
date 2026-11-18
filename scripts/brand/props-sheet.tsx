/** Contact sheet of kit props on a theme (visual check). Usage: npx tsx scripts/brand/props-sheet.tsx <out.svg> <theme> <item,item,...> */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync} from 'node:fs';
import {Prop, type PropConfig} from '../../src/engine/kit/Paint';
import {getTheme} from '../../src/engine/style/theme';

const [out = 'props.svg', themeId = 'paint-night', list = ''] = process.argv.slice(2);
const theme = getTheme(themeId), items = list.split(',').filter(Boolean) as PropConfig['item'][];
const CW = 380, CH = 330, cols = 4, rows = Math.ceil(items.length / cols), W = CW * cols, H = CH * rows;
const extra: Partial<Record<string, Partial<PropConfig>>> = {
  'tilt-dial': {range: [12, 38], text: 'tilt', level: [{frame: 0, value: .26}]}, 'tide-gauge': {text: 'TIDE', level: [{frame: 0, value: 1}]},
  'coral': {count: 12, level: [{frame: 0, value: 1}]}, 'plankton': {count: 30, level: [{frame: 0, value: .3}]}, 'impact': {count: 10, level: [{frame: 0, value: .7}]},
  'reflector': {level: [{frame: 0, value: .75}]}, 'clock': {text: '24 h', level: [{frame: 0, value: 1}]}, 'crescent': {level: [{frame: 0, value: .6}]},
  'earth-axis': {rotation: 23.5, level: [{frame: 0, value: 1}]}, 'lion': {level: [{frame: 0, value: 1}]}, 'stir': {level: [{frame: 0, value: 1}]}, 'town': {level: [{frame: 0, value: 1}]},
  'bed': {level: [{frame: 0, value: 0}]},
};
const svg = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
  <rect width={W} height={H} fill={(theme as any).sky?.top ?? '#0b1530'}/>
  {items.map((it, i) => { const x = (i % cols) * CW, y = Math.floor(i / cols) * CH;
    const cfg = {ink: process.env.INK || undefined, item: it, x: .5, y: .52, size: .62, rotation: 0, count: 6, level: [{frame: 0, value: .6}], direction: 'in', ring: false, belt: false, ...(extra[it] ?? {})} as PropConfig;
    return <g key={it} transform={`translate(${x} ${y})`}><svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`} overflow="visible"><Prop config={cfg} theme={theme} width={CW} height={CH} frame={30}/></svg>
      <text x={CW / 2} y={CH - 10} textAnchor="middle" fontFamily="Patrick Hand" fontSize={22} fill="#9fb0d6">{it}</text></g>; })}
</svg>);
writeFileSync(out, svg); console.log('wrote', out);
