/** Place an approved narration take later in the timeline by putting silence before it (no network, no cost).
 * For no-narration Shorts whose only line comes at the end: the take's samples are copied byte for byte after the
 * silence, the provider character timings shift by the same amount, and the hash is recomputed so the padded file is
 * the one story:render-cached checks.
 *
 *   node --import tsx scripts/pad-narration.ts --input jobs/<take> --output jobs/<new> --start <seconds>
 */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';

export const padWav16 = (bytes: Buffer, seconds: number) => {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw Error('Not a WAV file');
  let p = 12, rate = 0, channels = 0, bits = 0;
  while (p + 8 <= bytes.length) {
    const id = bytes.toString('ascii', p, p + 4), size = bytes.readUInt32LE(p + 4);
    if (id === 'fmt ') { channels = bytes.readUInt16LE(p + 10); rate = bytes.readUInt32LE(p + 12); bits = bytes.readUInt16LE(p + 22); }
    if (id === 'data') {
      if (channels !== 1 || bits !== 16) throw Error('Expected 16-bit mono PCM');
      const silence = Buffer.alloc(Math.round(seconds * rate) * 2), data = Buffer.concat([silence, bytes.subarray(p + 8, p + 8 + size)]);
      const h = Buffer.alloc(44);
      h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
      h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
      h.write('data', 36); h.writeUInt32LE(data.length, 40);
      return {wav: Buffer.concat([h, data]), shift: silence.length / 2 / rate};
    }
    p += 8 + size + (size & 1);
  }
  throw Error('WAV has no data chunk');
};

const main = async () => {
  const {values: o} = parseArgs({options: {input: {type: 'string'}, output: {type: 'string'}, start: {type: 'string'}}});
  if (!o.input || !o.output || !o.start) throw Error('Usage: pad-narration --input jobs/<take> --output jobs/<new> --start <seconds>');
  const meta = JSON.parse(await readFile(path.join(o.input, 'audio/narration-metadata.json'), 'utf8'));
  const {wav, shift} = padWav16(await readFile(path.join(o.input, 'audio/narration.wav')), Number(o.start));
  const move = (t: number[]) => t.map(v => +(v + shift).toFixed(4));
  const alignment = {...meta.alignment, character_start_times_seconds: move(meta.alignment.character_start_times_seconds), character_end_times_seconds: move(meta.alignment.character_end_times_seconds)};
  await mkdir(path.join(o.output, 'audio'), {recursive: true});
  const out = path.join(o.output, 'audio/narration.wav');
  await writeFile(out, wav);
  await writeFile(path.join(o.output, 'audio/narration-metadata.json'), JSON.stringify({...meta, alignment, sha256: createHash('sha256').update(wav).digest('hex'), audioPath: path.resolve(out),
    paddedFrom: path.resolve(o.input), leadingSilenceSeconds: shift, paidRequestsThisExecution: 0}, null, 2) + '\n');
  console.log(JSON.stringify({output: o.output, leadingSilenceSeconds: shift, paidRequests: 0}));
};
if (process.argv[1]?.endsWith('pad-narration.ts')) main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
