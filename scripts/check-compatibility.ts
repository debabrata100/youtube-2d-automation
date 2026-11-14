import path from 'node:path';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderMedia, renderStill} from '@remotion/renderer';
import rawPlan from '../src/plans/planet-formation.json' with {type: 'json'};
import {adaptPlanetFormation} from '../src/engine/storyboard/legacy';
import {browserExecutable, capture, run} from './media-tools';

if (!process.argv[2]) throw new Error('Usage: npm run check:compatibility -- <pre-change-job>');
const before = path.resolve(process.argv[2], 'output/animation.mp4');
const baseline = JSON.parse(await readFile('docs/M1_2_FINAL_VERIFICATION.json', 'utf8'));
const approved = path.resolve(baseline.video.path);
for (const asset of baseline.approvedAssets) {
  const hash = createHash('sha256').update(await readFile(asset.path)).digest('hex');
  if (hash !== asset.sha256) throw new Error(`Approved asset changed: ${asset.path}`);
}
const {plan} = adaptPlanetFormation(rawPlan);
const job = path.resolve('jobs', `m2-1-compatibility-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await mkdir(path.join(job, 'output'), {recursive: true});
await writeFile(path.join(job, 'scene-plan.json'), JSON.stringify(plan, null, 2));
const serveUrl = await bundle({entryPoint: path.resolve('src/storyboard-index.ts'), publicDir: path.resolve('assets')});
const composition = (await getCompositions(serveUrl, {inputProps: {plan}, browserExecutable})).find(c => c.id === 'LegacyStoryboard');
if (!composition) throw new Error('LegacyStoryboard composition missing');
const after = path.join(job, 'output/animation.mp4');
const started = performance.now();
await renderMedia({composition, serveUrl, inputProps: {plan}, browserExecutable, outputLocation: after, codec: 'h264', pixelFormat: 'yuv420p', crf: 18, concurrency: 1, disallowParallelEncoding: true});
const elapsedSeconds = Number(((performance.now() - started) / 1000).toFixed(2));
const decoded = async (file: string) => (await capture('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-f', 'framemd5', '-'])).split('\n').filter(line => line && !line.startsWith('#'));
const [beforeFrames, afterFrames, approvedFrames] = await Promise.all([decoded(before), decoded(after), decoded(approved)]);
const compare = (reference: string[]) => reference.length === 450 && afterFrames.length === 450 && reference.every((line, i) => line === afterFrames[i]);
const frames = [0, 120, 240, 330, 420];
const select = frames.map(frame => `eq(n\\,${frame})`).join('+');
await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', before, '-i', after, '-filter_complex', `[0:v]select='${select}',scale=216:384,tile=5x1[a];[1:v]select='${select}',scale=216:384,tile=5x1[b];[a][b]vstack[out]`, '-map', '[out]', '-frames:v', '1', path.join(job, 'before-after.png')]);
await run(process.execPath, ['--import', 'tsx', 'scripts/scene-order-sheet.ts', job]);
await run(process.execPath, ['--import', 'tsx', 'scripts/verify.ts', job]);
// Lossless same-frame comparisons isolate adapter behavior from pre-existing
// run-to-run raster/encoding differences in the approved legacy video path.
const originalUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('assets')});
const original = (await getCompositions(originalUrl, {inputProps: {plan}, browserExecutable})).find(c => c.id === 'PlanetFormation')!;
const sampleFrames = [...new Set([...Array.from({length: 15}, (_, i) => i * 30), ...[90, 180, 300, 390].flatMap(frame => [frame - 1, frame, frame + 1]), 449])].sort((a, b) => a - b);
const losslessSamples = [];
const browser = await openBrowser('chrome', {browserExecutable});
try {
  for (const frame of sampleFrames) {
    const paths = [];
    for (const [label, config, url] of [['original', original, originalUrl], ['adapter', composition, serveUrl]] as const) {
      const output = path.join(job, `${label}-${frame}.png`);
      await renderStill({composition: config, serveUrl: url, inputProps: {plan}, puppeteerInstance: browser, frame, imageFormat: 'png', output});
      paths.push(output);
    }
    losslessSamples.push({frame, identical: (await readFile(paths[0])).equals(await readFile(paths[1]))});
  }
} finally { await browser.close({silent: true}); }
const psnr = async (reference: string) => {
  const text = await capture('ffmpeg', ['-hide_banner', '-i', reference, '-i', after, '-lavfi', 'psnr', '-f', 'null', '-']);
  return text.match(/PSNR[^\n]+/)?.[0] ?? 'unavailable';
};
const report = {before, after, approved, elapsedSeconds, timingScope: 'post-change adapter rendering and encoding only', framesCompared: afterFrames.length, allDecodedFramesIdenticalToBefore: compare(beforeFrames), allDecodedFramesIdenticalToApproved: compare(approvedFrames), psnrVsBefore: await psnr(before), psnrVsApproved: await psnr(approved), losslessSamples, allLosslessSamplesIdentical: losslessSamples.every(sample => sample.identical), approvedAssetsUnchanged: true, comparisonImage: path.join(job, 'before-after.png'), comparisonLayout: 'top: before, bottom: after; columns: frames 0,120,240,330,420', humanVisualApproval: 'pending', note: 'Encoded pixel identity is reported separately from lossless adapter identity. Review any run-to-run legacy raster differences; no tolerance automatically grants visual approval.'};
await writeFile(path.join(job, 'compatibility-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
// This is a one-shot CLI. All media, reports and browser closure are awaited;
// do not keep it alive for renderer-internal background cleanup handles.
process.exit(report.allLosslessSamplesIdentical ? 0 : 1);
