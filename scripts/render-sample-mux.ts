/** Concatenate a prepared job's segments from <startFrame> (default 0) to <endFrame> and mux the full sound mix, cut to the same
 * range. Used by scripts/render-sample.sh for review samples (and for a mid-video excerpt, e.g. one sequence); the full render
 * still goes through scripts/render-job.sh. */
import path from 'node:path';
import {readdir, readFile, rm, writeFile} from 'node:fs/promises';
import {run} from './media-tools';
import {muxAudio} from './lib/mix-audio';

const [job, endArg, startArg] = process.argv.slice(2);
if (!job || !endArg) throw Error('Usage: render-sample-mux <prepared-job> <endFrameInclusive> [startFrame=0]');
const end = Number(endArg), start = Number(startArg ?? 0);
const prep = JSON.parse(await readFile(path.join(job, 'reports/prepare-report.json'), 'utf8'));
const dir = path.join(job, 'segments');
const segments = (await readdir(dir)).filter(f => /^seg-\d+-\d+\.mp4$/.test(f)).sort()
  .filter(f => Number(f.match(/seg-(\d+)-/)![1]) >= start && Number(f.match(/seg-\d+-(\d+)/)![1]) <= end);
const ranges = segments.map(f => f.match(/seg-(\d+)-(\d+)/)!.slice(1).map(Number));
ranges.forEach(([s], i) => { if (s !== (i ? ranges[i - 1][1] + 1 : start)) throw Error(`Segment gap before frame ${s}`); });
if (ranges.at(-1)![1] !== end) throw Error(`Segments stop at frame ${ranges.at(-1)![1]}, expected ${end}`);
const seconds = (end + 1 - start) / 30, list = path.join(dir, 'sample-list.txt'), video = path.join(dir, 'sample-video.mp4');
await writeFile(list, segments.map(f => `file '${path.resolve(dir, f)}'`).join('\n') + '\n');
await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
const full = path.join(job, 'output/sample-full-audio.mp4'), output = path.join(job, `output/sample-${start ? `${Math.round(start / 30)}s-` : ''}${Math.round(seconds)}s.mp4`);
await muxAudio(job, video, full, prep.seconds, path.join(job, 'audio/narration.wav'));
if (start) // an excerpt: the full mix (audio/stems/mix.wav) from the excerpt's start, under the excerpt's frames
  await run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-ss', String(start / 30), '-i', path.join(job, 'audio/stems/mix.wav'), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', String(seconds), '-movflags', '+faststart', output]);
else await run('ffmpeg', ['-v', 'error', '-y', '-i', full, '-t', String(seconds), '-c', 'copy', '-movflags', '+faststart', output]);
await rm(full, {force: true});
console.log(JSON.stringify({output, seconds, paidRequests: 0}));
