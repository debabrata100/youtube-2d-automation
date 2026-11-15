/**
 * Write upload-ready caption files for a rendered job (free, local):
 *   node --import tsx scripts/export-captions.ts <job-dir>   ->  <job>/output/captions.srt and captions.vtt
 * Uses the job's provider-timed caption cues, so they match the narration exactly (even when burned-in captions are off).
 */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {narrationOverlaySchema} from '../src/captions/schema';
import {cuesToSrt, cuesToVtt} from '../src/captions/srt';

const job = process.argv[2];
if (!job) throw Error('Usage: export-captions <job-dir>');
const captions = narrationOverlaySchema.parse(JSON.parse(await readFile(path.join(job, 'captions/captions.json'), 'utf8')));
const fps = (JSON.parse(await readFile(path.join(job, 'storyboard.json'), 'utf8')) as {format: {fps: number}}).format.fps;
await mkdir(path.join(job, 'output'), {recursive: true});
await writeFile(path.join(job, 'output/captions.srt'), cuesToSrt(captions.cues, fps));
await writeFile(path.join(job, 'output/captions.vtt'), cuesToVtt(captions.cues, fps));
console.log(JSON.stringify({job, cues: captions.cues.length, fps, files: ['output/captions.srt', 'output/captions.vtt']}));
