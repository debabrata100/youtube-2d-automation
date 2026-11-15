/** Concatenate rendered segments of a prepared job, mux the unchanged approved narration, then run the standard verifiers. */
import path from 'node:path';
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {run} from './media-tools';

const job = process.argv[2];
if (!job) throw Error('Usage: assemble-job <prepared-job>');
const prep = JSON.parse(await readFile(path.join(job, 'reports/prepare-report.json'), 'utf8'));
const dir = path.join(job, 'segments');
const segments = (await readdir(dir)).filter(f => /^seg-\d+-\d+\.mp4$/.test(f)).sort();
const ranges = segments.map(f => f.match(/seg-(\d+)-(\d+)/)!.slice(1).map(Number));
ranges.forEach(([s], i) => { if (s !== (i ? ranges[i - 1][1] + 1 : 0)) throw Error(`Segment gap before frame ${s}`); });
if (ranges.at(-1)![1] !== prep.frames - 1) throw Error('Segments do not cover the full timeline');
const list = path.join(dir, 'list.txt');
await writeFile(list, segments.map(f => `file '${path.resolve(dir, f)}'`).join('\n') + '\n');
const video = path.join(dir, 'video.mp4'), output = path.join(job, 'output/narrated-animation.mp4');
await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
await run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', path.join(job, 'audio/narration.wav'), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-af', 'apad', '-t', String(prep.seconds), '-movflags', '+faststart', output]);
const timings = await Promise.all(segments.map(async f => JSON.parse(await readFile(path.join(dir, f.replace(/\.mp4$/, '.json')), 'utf8'))));
const elapsed = Number(timings.reduce((sum, t) => sum + t.elapsedSeconds, 0).toFixed(2));
await writeFile(path.join(job, 'reports/render-report.json'), JSON.stringify({elapsedSeconds: elapsed, segments: timings, scope: 'Sum of segment render+encode times (each includes composition lookup); excludes bundling, concat, mux and verification', paidRequests: 0, offline: true}, null, 2) + '\n');
await run(process.execPath, ['--import', 'tsx', 'scripts/verify-storyboard.ts', job, 'narrated-animation.mp4']);
await run(process.execPath, ['--import', 'tsx', 'scripts/verify-cached-story.ts', job]);
console.log(JSON.stringify({output, elapsedSeconds: elapsed, paidRequests: 0}));
