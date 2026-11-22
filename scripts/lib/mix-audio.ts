/** Mix stage: approved narration + ducked music bed + timed sound effects, loudness-normalised for YouTube.
 * Without a mix plan the legacy narration-only mux runs unchanged. */
import path from 'node:path';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {z} from 'zod';
import {capture, run} from '../media-tools';
import {SFX_IDS, encodeWav, synthMusicBed, synthSfx} from '../../src/audio/synth';

export const mixPlanSchema = z.object({
  durationSeconds: z.number().positive(),
  narration: z.string().min(1),
  music: z.discriminatedUnion('kind', [
    z.object({kind: z.literal('none')}).strict(),
    z.object({kind: z.literal('generated'), seed: z.number().int().default(1)}).strict(),
    z.object({kind: z.literal('file'), source: z.string().min(1)}).strict(),
    // Licensed tracks per section: each cue plays from startSeconds until endSeconds (cross-fading into the next),
    // levelled to a common loudness (levelDb, measured at prepare time) before the shared ducking stage.
    z.object({kind: z.literal('cues'), crossfadeSeconds: z.number().min(0).max(6).default(1.5),
      cues: z.array(z.object({source: z.string().min(1), startSeconds: z.number().min(0), endSeconds: z.number().positive(), offsetSeconds: z.number().min(0).default(0),
        loop: z.boolean().default(true), gainDb: z.number().min(-12).max(12).default(0), levelDb: z.number().min(-30).max(30).default(0)}).strict()).min(1).max(20),
      dropouts: z.array(z.tuple([z.number().min(0), z.number().min(0)])).max(100).default([]), dropoutFloorDb: z.number().min(-60).max(-3).default(-24)}).strict(),
  ]),
  musicGainDb: z.number().min(-40).max(0),
  duckRatio: z.number().min(1).max(20),
  voice: z.object({highpassHz: z.number(), lowMidDb: z.number(), presenceDb: z.number(), room: z.number()}).strict().optional(),
  sfx: z.array(z.object({sound: z.enum(SFX_IDS), startSeconds: z.number().min(0), gainDb: z.number().min(-30).max(6)}).strict()).max(400), // long anthology episodes carry hundreds of cues
  speech: z.array(z.tuple([z.number(), z.number()])),
  targetLufs: z.number().min(-24).max(-9),
  truePeakDb: z.number().min(-3).max(0),
}).strict();
export type MixPlan = z.infer<typeof mixPlanSchema>;

/** Generate procedural stems into <job>/audio and write the plan. */
export const prepareMix = async (job: string, plan: MixPlan) => {
  const dir = path.join(job, 'audio');
  await mkdir(path.join(dir, 'sfx'), {recursive: true});
  for (const id of new Set(plan.sfx.map(s => s.sound))) await writeFile(path.join(dir, 'sfx', `${id}.wav`), encodeWav(synthSfx(id)));
  if (plan.music.kind === 'generated') await writeFile(path.join(dir, 'music.wav'), encodeWav(synthMusicBed(plan.durationSeconds, plan.music.seed)));
  if (plan.music.kind === 'file') await copyFile(plan.music.source, path.join(dir, 'music-source' + path.extname(plan.music.source)));
  if (plan.music.kind === 'cues') {
    // Copy each licensed track into the job and level it: integrated loudness → MUSIC_REFERENCE_LUFS.
    for (const [i, cue] of plan.music.cues.entries()) {
      const local = path.join(dir, `music-cue-${i}${path.extname(cue.source)}`);
      await copyFile(cue.source, local);
      cue.levelDb = +(MUSIC_REFERENCE_LUFS - (await measureLoudness(local)).integratedLufs).toFixed(2);
    }
  }
  await writeFile(path.join(dir, 'mix-plan.json'), JSON.stringify(mixPlanSchema.parse(plan), null, 2) + '\n');
};

/** Every cue track is levelled to this integrated loudness before musicGainDb and ducking apply. */
export const MUSIC_REFERENCE_LUFS = -18;

/** Time-varying gain (ffmpeg expression) that dips the music to floorDb over each dropout, with short ramps. */
export const dropoutExpression = (dropouts: [number, number][], floorDb: number, rampSeconds = .15) => {
  if (!dropouts.length) return '1';
  const floor = 10 ** (floorDb / 20), r = rampSeconds;
  return dropouts.map(([a, b]) => `(1-${(1 - floor).toFixed(4)}*clip(min((t-${(a - r).toFixed(3)})/${r},(${(b + r).toFixed(3)}-t)/${r}),0,1))`).join('*');
};

/** ffmpeg inputs and filter chains that lay the cue tracks on one timeline (label [cues]). */
export const cueGraph = (music: Extract<MixPlan['music'], {kind: 'cues'}>, dir: string, seconds: number, firstIndex: number) => {
  const inputs: string[] = [], graph: string[] = [], labels: string[] = [], xf = music.crossfadeSeconds;
  music.cues.forEach((cue, i) => {
    const start = cue.startSeconds, end = Math.min(seconds, i < music.cues.length - 1 ? Math.max(cue.endSeconds, music.cues[i + 1].startSeconds + xf) : seconds);
    const length = Math.max(.1, end - start), fadeIn = i === 0 ? Math.min(.5, length / 4) : Math.min(xf, length / 2), fadeOut = i === music.cues.length - 1 ? 0 : Math.min(xf, length / 2);
    inputs.push(...(cue.loop ? ['-stream_loop', '-1'] : []), '-ss', String(cue.offsetSeconds), '-i', path.join(dir, `music-cue-${i}${path.extname(cue.source)}`));
    graph.push(`[${firstIndex + i}:a]aresample=48000,aformat=channel_layouts=mono,atrim=0:${length.toFixed(3)},asetpts=N/SR/TB,afade=t=in:d=${fadeIn.toFixed(3)}` +
      (fadeOut ? `,afade=t=out:st=${(length - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}` : '') + `,volume=${(cue.levelDb + cue.gainDb).toFixed(2)}dB,adelay=${Math.round(start * 1000)}:all=1,apad[cue${i}]`);
    labels.push(`[cue${i}]`);
  });
  graph.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=0:${seconds},asetnsamples=n=480,volume='${dropoutExpression(music.dropouts, music.dropoutFloorDb)}':eval=frame[cues]`);
  return {inputs, graph, count: music.cues.length};
};

const rmsDb = (pcm: Buffer, from: number, to: number, rate: number) => {
  let sum = 0, count = 0;
  for (let i = Math.max(0, Math.floor(from * rate)); i < Math.min(pcm.length / 2, Math.floor(to * rate)); i++) { const v = pcm.readInt16LE(i * 2) / 32768; sum += v * v; count++; }
  return count ? 10 * Math.log10(sum / count + 1e-12) : -120;
};

/** ffmpeg filter for the optional narrator treatment (also applied to the reference in verification). */
export const voiceFilter = (v: {highpassHz: number; lowMidDb: number; presenceDb: number; room: number}) =>
  `highpass=f=${v.highpassHz},equalizer=f=240:t=q:w=1:g=${v.lowMidDb},equalizer=f=3200:t=q:w=1.2:g=${v.presenceDb}` +
  (v.room > 0 ? `,aecho=1:1:23|41|67:${v.room.toFixed(3)}|${(v.room * .7).toFixed(3)}|${(v.room * .45).toFixed(3)}` : '');

export const muxAudio = async (job: string, video: string, output: string, seconds: number, narration: string) => {
  const planFile = path.join(job, 'audio/mix-plan.json');
  if (!existsSync(planFile)) {
    // Legacy path: copy video, mux the approved narration with an intentional silent ending.
    await run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', narration, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-af', 'apad', '-t', String(seconds), '-movflags', '+faststart', output]);
    return null;
  }
  const plan = mixPlanSchema.parse(JSON.parse(await readFile(planFile, 'utf8')));
  const dir = path.join(job, 'audio'), stems = path.join(dir, 'stems');
  await mkdir(stems, {recursive: true});
  const voiceChain = plan.voice ? voiceFilter(plan.voice) + ',' : '';
  const inputs = ['-i', narration], graph: string[] = [`[0:a]aresample=48000,aformat=channel_layouts=mono,${voiceChain}apad,asplit=2[nar][sc]`];
  const mixLabels = ['[nar]'];
  let index = 1;
  if (plan.music.kind === 'cues') {
    const cues = cueGraph(plan.music, dir, seconds, index);
    inputs.push(...cues.inputs); graph.push(...cues.graph);
    graph.push(`[cues]afade=t=out:st=${Math.max(0, seconds - 1.6)}:d=1.6,volume=${plan.musicGainDb}dB,asplit=2[mus][musref]`,
      `[mus][sc]sidechaincompress=threshold=0.012:ratio=${plan.duckRatio}:attack=25:release=450:knee=4[duck]`, '[duck]asplit=2[duckmix][duckstem]');
    mixLabels.push('[duckmix]');
    index += cues.count;
  } else if (plan.music.kind !== 'none') {
    const file = plan.music.kind === 'generated' ? path.join(dir, 'music.wav') : path.join(dir, 'music-source' + path.extname(plan.music.source));
    inputs.push(...(plan.music.kind === 'file' ? ['-stream_loop', '-1'] : []), '-i', file);
    graph.push(`[${index}:a]aresample=48000,aformat=channel_layouts=mono,atrim=0:${seconds},afade=t=out:st=${Math.max(0, seconds - 1.6)}:d=1.6,volume=${plan.musicGainDb}dB,asplit=2[mus][musref]`,
      `[mus][sc]sidechaincompress=threshold=0.012:ratio=${plan.duckRatio}:attack=25:release=450:knee=4[duck]`, '[duck]asplit=2[duckmix][duckstem]');
    mixLabels.push('[duckmix]');
    index++;
  } else graph.push('[sc]anullsink');
  plan.sfx.forEach((s, i) => {
    inputs.push('-i', path.join(dir, 'sfx', `${s.sound}.wav`));
    graph.push(`[${index}:a]aresample=48000,adelay=${Math.round(s.startSeconds * 1000)}:all=1,volume=${s.gainDb}dB[s${i}]`);
    mixLabels.push(`[s${i}]`);
    index++;
  });
  graph.push(`${mixLabels.join('')}amix=inputs=${mixLabels.length}:normalize=0:duration=first,atrim=0:${seconds}[mix]`);
  const pre = path.join(stems, 'mix-pre-loudness.wav'), duckStem = path.join(stems, 'music-ducked.wav'), refStem = path.join(stems, 'music-reference.wav');
  await run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', graph.join(';'), '-map', '[mix]', '-ar', '48000', pre,
    ...(plan.music.kind !== 'none' ? ['-map', '[duckstem]', '-ar', '48000', duckStem, '-map', '[musref]', '-ar', '48000', refStem] : [])]);
  // Loudness: measure (EBU R128), apply one linear gain to the target, then a transparent peak limiter so transients
  // cannot force loudnorm's dynamic mode (which would change the voice/effects balance).
  const target = `I=${plan.targetLufs}:TP=${plan.truePeakDb}:LRA=11`;
  const pass1 = await capture('ffmpeg', ['-hide_banner', '-i', pre, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-']);
  const m = JSON.parse(pass1.slice(pass1.lastIndexOf('{'), pass1.lastIndexOf('}') + 1));
  const mixed = path.join(stems, 'mix.wav');
  const gainDb = plan.targetLufs - Number(m.input_i), limit = 10 ** ((plan.truePeakDb - 1) / 20);
  await run('ffmpeg', ['-v', 'error', '-y', '-i', pre, '-af', `volume=${gainDb.toFixed(2)}dB,alimiter=limit=${limit.toFixed(4)}:attack=4:release=60:level=0:asc=1:latency=1`, '-ar', '48000', mixed]);
  await run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mixed, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', String(seconds), '-movflags', '+faststart', output]);
  // Ducking evidence: during speech, the ducked music stem versus the same music without ducking.
  let ducking: {referenceDb: number; duckedDb: number; reductionDb: number} | null = null;
  if (plan.music.kind !== 'none') {
    const decode = (file: string) => execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 's16le', 'pipe:1'], {maxBuffer: 64 * 1024 * 1024});
    const ducked = decode(duckStem), reference = decode(refStem), mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
    const duckedDb = mean(plan.speech.map(([a, b]) => rmsDb(ducked, a + .2, b, 8000))), referenceDb = mean(plan.speech.map(([a, b]) => rmsDb(reference, a + .2, b, 8000)));
    ducking = {referenceDb: +referenceDb.toFixed(2), duckedDb: +duckedDb.toFixed(2), reductionDb: +(referenceDb - duckedDb).toFixed(2)};
  }
  const report = {planned: plan, loudnessPass1: m, linearGainDb: +gainDb.toFixed(2), limiterCeilingDb: plan.truePeakDb - 1, ducking, output, generatedAudio: plan.music.kind === 'generated' ? 'procedural music bed (code-synthesised, no licence required)' : plan.music.kind === 'cues' ? `${plan.music.cues.length} licensed cue tracks (YouTube Audio Library, no attribution required), levelled to ${MUSIC_REFERENCE_LUFS} LUFS` : plan.music.kind, paidRequests: 0};
  await writeFile(path.join(dir, 'mix-report.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
};

/** Integrated loudness and true peak of an encoded file (EBU R128 via ffmpeg ebur128). */
export const measureLoudness = async (file: string) => {
  const out = await capture('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-']);
  const summary = out.slice(out.lastIndexOf('Summary:'));
  const num = (re: RegExp) => Number(summary.match(re)?.[1]);
  return {integratedLufs: num(/I:\s+(-?[\d.]+) LUFS/), truePeakDb: num(/Peak:\s+(-?[\d.]+) dBFS/), loudnessRange: num(/LRA:\s+(-?[\d.]+) LU/)};
};
