/** Compose a YouTube thumbnail (1280x720 PNG): crop the generated art to 16:9 and letter the title on top.
 * Offline and free. Image models still misspell text, so all lettering is added here.
 *   node --import tsx scripts/compose-thumbnail.ts --spec thumbnails/<id>.json --art jobs/thumbs-<id>/a.png --output jobs/thumbs-<id>/thumb-a.png */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {z} from 'zod';
import {run} from './media-tools';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const overlaySchema = z.object({
  /** Where to keep the image when cropping 3:2 art to 16:9: 0 = top, 1 = bottom. */
  focusY: z.number().min(0).max(1).default(.5),
  lines: z.array(z.object({text: z.string().min(1).max(24), x: z.number().min(0).max(1280), y: z.number().min(0).max(720), size: z.number().min(24).max(260),
    color: hex.default('#ffffff'), border: z.number().min(0).max(30).default(12), borderColor: hex.default('#111111')}).strict()).max(4).default([]),
}).strict();

/** ffmpeg filter graph: crop to 16:9 at focusY, scale to 1280x720, then one drawtext per line (text read from files, so no escaping issues). */
export const filterGraph = (srcW: number, srcH: number, overlay: z.infer<typeof overlaySchema>, font: string, textFiles: string[]) => {
  const cropH = Math.min(srcH, Math.round(srcW * 9 / 16)), cropW = Math.min(srcW, Math.round(cropH * 16 / 9)), y = Math.round((srcH - cropH) * overlay.focusY), x = Math.round((srcW - cropW) / 2);
  const draw = overlay.lines.map((l, i) => `drawtext=fontfile='${font}':textfile='${textFiles[i]}':x=${l.x}:y=${l.y}:fontsize=${l.size}:fontcolor=${l.color}:borderw=${l.border}:bordercolor=${l.borderColor}:shadowx=0:shadowy=${Math.round(l.border / 2)}:shadowcolor=0x000000@0.45`);
  return [`crop=${cropW}:${cropH}:${x}:${y}`, 'scale=1280:720:flags=lanczos', ...draw].join(',');
};

const main = async () => {
  const {values: o} = parseArgs({options: {spec: {type: 'string'}, art: {type: 'string'}, output: {type: 'string'}, font: {type: 'string', default: 'src/engine/style/fonts/PatrickHand-Regular.ttf'}}});
  if (!o.spec || !o.art || !o.output) throw Error('Usage: thumbnails:compose -- --spec thumbnails/<id>.json --art <generated.png> --output <thumb.png>');
  const spec = JSON.parse(await readFile(o.spec, 'utf8')), overlay = overlaySchema.parse(spec.overlay ?? {});
  const png = await readFile(o.art);
  if (png.subarray(1, 4).toString('ascii') !== 'PNG') throw Error('Art must be a PNG');
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20), dir = await mkdtemp(path.join(tmpdir(), 'thumb-'));
  const files = await Promise.all(overlay.lines.map(async (l, i) => { const f = path.join(dir, `line-${i}.txt`); await writeFile(f, l.text); return f; }));
  await run('ffmpeg', ['-v', 'error', '-y', '-i', o.art, '-vf', filterGraph(w, h, overlay, path.resolve(o.font!), files), '-frames:v', '1', o.output]);
  console.log(JSON.stringify({output: path.resolve(o.output), size: '1280x720', source: `${w}x${h}`, lines: overlay.lines.length, paidRequests: 0}));
};
if (process.argv[1]?.endsWith('compose-thumbnail.ts')) await main();
