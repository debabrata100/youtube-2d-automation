import path from 'node:path';
import {mkdir, readFile, readdir, unlink, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {storyboardDuration, storyboardSceneAt, storyboardTimeline} from '../src/engine/storyboard/timeline';
import {browserExecutable, capture, probe, run} from './media-tools';
import {validateAssetFiles} from './storyboard-assets';

const job = path.resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Usage: npm run verify:storyboard -- <job-directory>');
const storyboard = parseStoryboard(JSON.parse(await readFile(path.join(job, 'storyboard.json'), 'utf8')));
const assets = await validateAssetFiles(storyboard.assets);
const video = path.join(job, 'output/animation.mp4');
const data = await probe(video), stream = data.streams[0];
const duration = storyboardDuration(storyboard);
const [numerator, denominator] = stream.r_frame_rate.split('/').map(Number);
const scan = await capture('ffmpeg', ['-hide_banner', '-i', video, '-vf', 'blackdetect=d=0.05:pic_th=0.995:pix_th=0.02', '-an', '-f', 'null', '-']);
const frames = [...new Set(storyboardTimeline(storyboard).flatMap(({startFrame, endFrame}) => [startFrame - 1, startFrame, startFrame + 1, Math.floor((startFrame + endFrame - 1) / 2), endFrame - 1]).filter(frame => frame >= 0))].sort((a, b) => a - b);
const preview = path.join(job, 'timeline-audit');
await mkdir(preview, {recursive: true});
// Never let samples from an earlier verification satisfy a failed extraction.
for (const name of await readdir(preview)) if (/^frame-\d+\.png$/.test(name)) await unlink(path.join(preview, name));
const selection = frames.map(frame => `eq(n\\,${frame})`).join('+');
await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', video, '-vf', `select='${selection}',scale=270:-1`, '-fps_mode', 'passthrough', path.join(preview, 'frame-%03d.png')]);
if ((await readdir(preview)).filter(name => /^frame-\d+\.png$/.test(name)).length !== frames.length) throw new Error('Decoded sample count does not match requested timeline frames');
const samples = frames.map((frame, i) => ({frame, second: frame / storyboard.format.fps, sceneId: storyboardSceneAt(storyboard, frame).scene.id, image: `frame-${String(i + 1).padStart(3, '0')}.png`}));
// Each requested decoded file must exist and have a real PNG signature.
for (const sample of samples) {
  const png = await readFile(path.join(preview, sample.image));
  if (png.subarray(1, 4).toString() !== 'PNG') throw new Error(`Decoded frame missing or corrupt: ${sample.frame}`);
}
const escape = (value: string) => value.replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]!));
const thumbHeight = Math.round(270 * storyboard.format.height / storyboard.format.width);
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#10152e;color:white;font:16px Arial}.grid{display:grid;grid-template-columns:repeat(5,270px);gap:12px}.item img{display:block;width:270px;height:${thumbHeight}px}.label{padding:8px;background:#20283e}</style><h2>M2.1 encoded storyboard chronology / boundaries</h2><div class="grid">${samples.map((sample, i) => `<div class="item"><img src="${sample.image}"><div class="label">${i + 1}. frame ${sample.frame} · ${sample.second.toFixed(2)}s<br>${escape(sample.sceneId)}</div></div>`).join('')}</div>`;
const htmlFile = path.join(preview, 'contact-sheet.html');
await writeFile(htmlFile, html);
if (!browserExecutable) throw new Error('Configure browserExecutable for contact-sheet generation on this platform');
await run(browserExecutable, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files', `--window-size=1440,${Math.ceil(samples.length / 5) * (thumbHeight + 65) + 120}`, `--screenshot=${path.join(job, 'chronological-contact-sheet.png')}`, pathToFileURL(htmlFile).href]);
const checks = {schema: true, assetsPresent: assets.length === storyboard.assets.length, dimensions: stream.width === storyboard.format.width && stream.height === storyboard.format.height, fps: Math.abs(numerator / denominator - storyboard.format.fps) < .001, frames: Number(stream.nb_frames) === duration, duration: Math.abs(Number(data.format.duration) - duration / storyboard.format.fps) < 1 / storyboard.format.fps, codec: stream.codec_name === 'h264', noUnintendedBlackFrames: !scan.includes('black_start:'), chronologicalTimeline: storyboardTimeline(storyboard).every((entry, i, all) => entry.startFrame === (i ? all[i - 1].endFrame : 0)), encodedSamplesExtracted: true};
const report = {generatedAt: new Date().toISOString(), video, checks, assets, samples, automatedChecksPassed: Object.values(checks).every(Boolean), humanVisualApproval: 'pending', note: 'Scene IDs describe expected frame mapping. Encoded samples must be reviewed by a human; automated checks do not recognize scene content.'};
await writeFile(path.join(job, 'verification-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({job, checks, automatedChecksPassed: report.automatedChecksPassed}, null, 2));
if (!report.automatedChecksPassed) process.exitCode = 1;
