/** Concatenate a prepared job's segments from frame 0 to <endFrame> and mux the full sound mix, cut to the same length.
 * Used by scripts/render-sample.sh for review samples; the full render still goes through scripts/render-job.sh. */
import path from 'node:path';
import {readdir, readFile, rm, writeFile} from 'node:fs/promises';
import {run} from './media-tools';
import {muxAudio} from './lib/mix-audio';

const [job, endArg] = process.argv.slice(2);
if (!job || !endArg) throw Error('Usage: render-sample-mux <prepared-job> <endFrameInclusive>');
const end = Number(endArg);
const prep = JSON.parse(await readFile(path.join(job, 'reports/prepare-report.json'), 'utf8'));
const dir = path.join(job, 'segments');
const segments = (await readdir(dir)).filter(f => /^seg-\d+-\d+\.mp4$/.test(f)).sort()
  .filter(f => Number(f.match(/seg-\d+-(\d+)/)![1]) <= end);
const ranges = segments.map(f => f.match(/seg-(\d+)-(\d+)/)!.slice(1).map(Number));
ranges.forEach(([s], i) => { if (s !== (i ? ranges[i - 1][1] + 1 : 0)) throw Error(`Segment gap before frame ${s}`); });
if (ranges.at(-1)![1] !== end) throw Error(`Segments stop at frame ${ranges.at(-1)![1]}, expected ${end}`);
const seconds = (end + 1) / 30, list = path.join(dir, 'sample-list.txt'), video = path.join(dir, 'sample-video.mp4');
await writeFile(list, segments.map(f => `file '${path.resolve(dir, f)}'`).join('\n') + '\n');
await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
const full = path.join(job, 'output/sample-full-audio.mp4'), output = path.join(job, `output/sample-${Math.round(seconds)}s.mp4`);
await muxAudio(job, video, full, prep.seconds, path.join(job, 'audio/narration.wav'));
await run('ffmpeg', ['-v', 'error', '-y', '-i', full, '-t', String(seconds), '-c', 'copy', '-movflags', '+faststart', output]);
await rm(full, {force: true});
console.log(JSON.stringify({output, seconds, paidRequests: 0}));
