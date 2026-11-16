/** Render one frame range of a prepared job (render-cached-story --prepare-only) to a video-only H.264 segment.
 * Resumable: an existing segment is skipped. Elapsed time per segment is recorded for performance reporting.
 * Use whole-second chunk lengths (e.g. 120 frames at 30 fps) so concatenated timestamps stay exact. */
import path from 'node:path';
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {getCompositions, renderMedia} from '@remotion/renderer';
import {browserExecutable} from './media-tools';

const [job, startArg, endArg] = process.argv.slice(2);
if (!job || startArg === undefined || endArg === undefined) throw Error('Usage: render-job-frames <prepared-job> <startFrame> <endFrameInclusive>');
const start = Number(startArg), end = Number(endArg);
const dir = path.join(job, 'segments'), file = path.join(dir, `seg-${String(start).padStart(5, '0')}-${String(end).padStart(5, '0')}.mp4`);
if (existsSync(file)) { console.log(JSON.stringify({skipped: file})); process.exit(0); }
await mkdir(dir, {recursive: true});
const storyboard = JSON.parse(await readFile(path.join(job, 'storyboard.json'), 'utf8'));
const narration = JSON.parse(await readFile(path.join(job, 'narration-props.json'), 'utf8'));
const serveUrl = path.resolve(job, 'bundle'), inputProps = {storyboard, narration};
const composition = (await getCompositions(serveUrl, {inputProps, browserExecutable})).find(c => c.id === 'GenericStoryboard');
if (!composition) throw Error('Composition missing');
const t = performance.now(), partial = file + '.partial.mp4';
await renderMedia({serveUrl, composition, inputProps, browserExecutable, outputLocation: partial, codec: 'h264', muted: true, pixelFormat: 'yuv420p', crf: 18, frameRange: [start, end], concurrency: 1, disallowParallelEncoding: true});
await rename(partial, file);
const elapsed = Number(((performance.now() - t) / 1000).toFixed(2));
await writeFile(file.replace(/\.mp4$/, '.json'), JSON.stringify({start, end, frames: end - start + 1, elapsedSeconds: elapsed}) + '\n');
console.log(JSON.stringify({file, elapsedSeconds: elapsed}));
