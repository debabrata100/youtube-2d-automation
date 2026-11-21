import path from 'node:path';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia} from '@remotion/renderer';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {storyboardDuration} from '../src/engine/storyboard/timeline';
import {browserExecutable, run} from './media-tools';
import {validateAssetFiles} from './storyboard-assets';

const source = path.resolve(process.argv[2] ?? 'storyboards/generic-demo.json');
const storyboard = parseStoryboard(JSON.parse(await readFile(source, 'utf8')));
await validateAssetFiles(storyboard.assets);
const job = path.resolve('jobs', `${storyboard.projectId}-m2-1-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await mkdir(path.join(job, 'output'), {recursive: true});
await writeFile(path.join(job, 'storyboard.json'), JSON.stringify(storyboard, null, 2));
const serveUrl = await bundle({entryPoint: path.resolve('src/storyboard-index.ts'), publicDir: path.resolve('assets')});
const composition = (await getCompositions(serveUrl, {inputProps: {storyboard}, browserExecutable})).find(c => c.id === 'GenericStoryboard');
if (!composition) throw new Error('GenericStoryboard composition missing');
const output = path.join(job, 'output/animation.mp4');
const started = performance.now();
await renderMedia({composition, serveUrl, inputProps: {storyboard}, browserExecutable, outputLocation: output, codec: 'h264', pixelFormat: 'yuv420p', crf: 20, scale: Number(process.env.RENDER_SCALE ?? 1), concurrency: Number(process.env.RENDER_CONCURRENCY ?? 1)});
const elapsedSeconds = Number(((performance.now() - started) / 1000).toFixed(2));
await writeFile(path.join(job, 'render-report.json'), JSON.stringify({status: 'complete', source, output, elapsedSeconds, timingScope: 'rendering and encoding only', frames: storyboardDuration(storyboard), humanVisualApproval: 'pending'}, null, 2));

console.log(JSON.stringify({job, output, elapsedSeconds}, null, 2));
