/** ElevenLabs narration for a story script, with provider character timing: one continuous take, or for a
 * multi-voice story (phraseSpeakers) one take per speaker, cut at speaker turns and joined (src/audio/multivoice.ts).
 *
 *   --planning                   silent placeholder track + estimated timing for an animatic (no network, no cost)
 *   --wpm <n>                    planning only: speaking-rate calibration for the estimate
 *   --dry-run                    plan only: characters, words, estimated duration, request hash (no network, no cost)
 *   --authorize-paid-tts         required for the single paid request
 *   --max-characters <n>         explicit character ceiling; the request is refused if the text is longer
 *   --resume                     multi-voice only: reuse takes already in --output and request only the missing ones
 *
 * Exactly one request is authorised and recorded in a ledger before sending; there are no automatic retries.
 * Output (new directory): audio/narration.wav + audio/narration-metadata.json, ready for story:render-cached.
 * The API key is read from the environment (.env via --env-file-if-exists) and never written or printed. */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {storyScriptSchema, words} from '../src/storytelling/schema';
import {validateStory} from '../src/storytelling/validate';
import {parseAnchoredStoryboard} from '../src/storytelling/timing/anchors';
import {ttsConfigSchema} from '../src/audio/tts/provider';
import {ElevenLabsTTSProvider, elevenRequestHash} from '../src/audio/tts/elevenlabs';
import {measureAudio} from '../src/audio/metadata';
import {estimateAlignment} from '../src/storytelling/timing/estimate';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {encodeWav} from '../src/audio/synth';
import {NARRATOR, assembleTakes, decodeWav16, speakerRuns, speakerScripts, storySpeakers} from '../src/audio/multivoice';
import {existsSync} from 'node:fs';

const {values: o} = parseArgs({options: {
  script: {type: 'string'}, output: {type: 'string'}, config: {type: 'string', default: 'config/narration.json'},
  'dry-run': {type: 'boolean', default: false}, planning: {type: 'boolean', default: false}, 'authorize-paid-tts': {type: 'boolean', default: false}, 'max-characters': {type: 'string'}, resume: {type: 'boolean', default: false}, wpm: {type: 'string'},
}});
if (!o.script) throw Error('Usage: narration:synthesize -- --script stories/<id>.json (--dry-run | --authorize-paid-tts --max-characters <n>) [--output jobs/<new-dir>]');
const input = storyScriptSchema.parse(JSON.parse(await readFile(o.script, 'utf8')));
const story = validateStory(input, parseAnchoredStoryboard(JSON.parse(await readFile(input.storyboard, 'utf8'))));
const configs = JSON.parse(await readFile(o.config!, 'utf8'));
const elevenBase = configs.elevenlabs as Record<string, unknown>, speakerConfigs = (configs.speakers ?? {}) as Record<string, Record<string, unknown>>;
const config = ttsConfigSchema.parse({...elevenBase, voice: process.env.ELEVENLABS_VOICE_ID?.trim() || elevenBase.voice, model: process.env.ELEVENLABS_MODEL_ID?.trim() || elevenBase.model});
const speakers = storySpeakers(story.beats), multi = speakers.length > 1 || speakers[0] !== NARRATOR;
const scripts = speakerScripts(speakerRuns(story.beats));
const speakerConfig = (name: string) => name === NARRATOR ? config : ttsConfigSchema.parse({...elevenBase, ...(speakerConfigs[name] ?? {})});
// A speaker without a valid voice ID yet is still planned (dry-run, animatic); paid synthesis refuses it.
const voicePlan = multi ? [...scripts].map(([speaker, sc]) => { const raw = String((speaker === NARRATOR ? config.voice : speakerConfigs[speaker]?.voice) ?? 'unset'); let cfg: ReturnType<typeof speakerConfig> | null = null; try { cfg = speakerConfig(speaker); } catch { cfg = null; } return {speaker, voice: raw, voiceReady: !!cfg, characters: Array.from(sc.text).length, requestHash: cfg ? elevenRequestHash({text: sc.text, config: cfg}) : 'voice-not-set', text: sc.text}; }) : null;
const text = story.beats.map(b => b.narration).join(' '), request = {text, config};
const characters = Array.from(text).length, estimate = estimateAlignment(text).character_end_times_seconds.at(-1)!;
const plan = {
  script: story.id, characters, words: words(text).length, estimatedSeconds: +estimate.toFixed(1), timelineSeconds: story.durationSeconds,
  voice: config.voice, model: config.model, requestHash: elevenRequestHash(request), requests: voicePlan?.length ?? 1, automaticRetries: 0, text,
  ...(voicePlan ? {speakers: voicePlan} : {}),
};
if (o['dry-run']) { console.log(JSON.stringify({...plan, paidRequestsMade: 0, note: 'Dry run: no network request was made.'}, null, 2)); process.exit(0); }
if (o.planning) {
  // Animatic support: silent 24 kHz track as long as the estimate, plus estimated alignment. Clearly marked; never a final narration.
  const job = path.resolve(o.output ?? `jobs/${story.id}-planning-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  await mkdir(job); await mkdir(path.join(job, 'audio'));
  // --wpm calibrates the estimate to the chosen voice (the approved narrator spoke at about 210 wpm-equivalent in M3.3).
  const alignment = o.wpm ? estimateAlignment(text, Number(o.wpm)) : estimateAlignment(text), seconds = alignment.character_end_times_seconds.at(-1)! + .05;
  const audio = encodeWav(new Float32Array(Math.round(seconds * 24000)), 24000), audioPath = path.join(job, 'audio/narration.wav');
  await writeFile(audioPath, audio);
  await writeFile(path.join(job, 'audio/narration-metadata.json'), JSON.stringify({key: plan.requestHash, sha256: createHash('sha256').update(audio).digest('hex'), provider: 'planning-estimate', model: 'none', voice: 'none', syntheticTestAudio: true, planningEstimate: true, measured: await measureAudio(audioPath), audioPath, sourceAudio: audioPath, text, characters, paidRequestsThisExecution: 0, alignment}, null, 2) + '\n');
  console.log(JSON.stringify({job, estimatedSeconds: +seconds.toFixed(2), paidRequestsMade: 0, note: 'Planning placeholder only: silent audio and estimated timing.'}, null, 2));
  process.exit(0);
}
if (multi) { await multiVoice(); process.exit(0); }
if (!o['authorize-paid-tts']) throw Error('Authorization required: pass --authorize-paid-tts and --max-characters after approving the dry-run plan. No request was made.');
const maxCharacters = Number(o['max-characters']);
if (!Number.isInteger(maxCharacters) || maxCharacters < characters) throw Error(`--max-characters must be an integer >= ${characters}. No request was made.`);
if (!process.env.ELEVENLABS_API_KEY?.trim()) throw Error('ELEVENLABS_API_KEY is not set (use .env). No request was made.');

const job = path.resolve(o.output ?? `jobs/${story.id}-narration-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await mkdir(job); // refuses to reuse an existing directory
await mkdir(path.join(job, 'audio'));
await writeFile(path.join(job, 'synthesis-plan.json'), JSON.stringify({...plan, maxCharacters}, null, 2) + '\n');
const provider = new ElevenLabsTTSProvider({apiKey: process.env.ELEVENLABS_API_KEY, authorization: {maxRequests: 1, maxCharacters, requestHash: plan.requestHash}, ledgerPath: path.join(job, 'paid-request-ledger.json')});
const started = performance.now();
const result = await provider.synthesize(request);
const audioPath = path.join(job, 'audio/narration.wav');
await writeFile(audioPath, result.audio);
const measured = await measureAudio(audioPath);
const metadata = {
  key: plan.requestHash, sha256: createHash('sha256').update(result.audio).digest('hex'), provider: result.provider, model: result.model, voice: config.voice,
  syntheticTestAudio: false, requestId: result.requestId, usage: result.usage, measured, audioPath, sourceAudio: audioPath, cacheHit: false,
  configuration: config, text, characters, elapsedSeconds: +((performance.now() - started) / 1000).toFixed(3), paidRequestsThisExecution: 1, speedAdjustment: 1,
  alignment: result.alignment,
};
await writeFile(path.join(job, 'audio/narration-metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
// Post-checks only report; they never trigger another request.
const fits = measured.durationSeconds <= story.durationSeconds - .2;
let captions: string;
try { captions = `${captionsFromProviderTiming(story, result.alignment!, measured.durationSeconds, 30).cues.length} caption cues mapped`; } catch (e) { captions = `caption mapping failed: ${(e as Error).message}`; }
console.log(JSON.stringify({job, durationSeconds: measured.durationSeconds, fitsTimeline: fits, captions, paidRequestsMade: 1, requestId: result.requestId,
  next: fits ? 'Listen to audio/narration.wav before approving the render.' : 'Too long for the timeline: shorten the script; do not speed up or retry automatically.'}, null, 2));

/** Multi-voice: one request per speaker (missing takes only with --resume), then cut, join and time-shift. */
async function multiVoice() {
  const job = path.resolve(o.output ?? `jobs/${story.id}-narration-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  const takesDir = path.join(job, 'audio/takes');
  // Only recorded takes make an output directory "in use"; an empty one (e.g. from a refused run) is fine to reuse.
  const hasTakes = voicePlan!.some(v => existsSync(path.join(takesDir, `${v.speaker}.json`)));
  if (hasTakes && !o.resume) throw Error('Output already has recorded takes; pass --resume to reuse them. No request was made.');
  const pending = voicePlan!.filter(v => !existsSync(path.join(takesDir, `${v.speaker}.json`)));
  for (const v of pending) if (!v.voiceReady) throw Error(`Speaker "${v.speaker}" has no ElevenLabs voice ID in config (found "${v.voice}"). No request was made.`);
  const needed = pending.reduce((n, v) => n + v.characters, 0);
  if (pending.length) {
    if (!o['authorize-paid-tts']) throw Error(`Authorization required for ${pending.length} request(s), ${needed} characters: pass --authorize-paid-tts --max-characters ${needed}. No request was made.`);
    const max = Number(o['max-characters']);
    if (!Number.isInteger(max) || max < needed) throw Error(`--max-characters must be an integer >= ${needed}. No request was made.`);
    if (!process.env.ELEVENLABS_API_KEY?.trim()) throw Error('ELEVENLABS_API_KEY is not set (use .env). No request was made.');
  }
  await mkdir(takesDir, {recursive: true}); // only after every check passed
  await writeFile(path.join(job, 'synthesis-plan.json'), JSON.stringify({...plan, pendingSpeakers: pending.map(v => v.speaker)}, null, 2) + '\n');
  let made = 0;
  for (const v of pending) {
    const cfg = speakerConfig(v.speaker);
    const provider = new ElevenLabsTTSProvider({apiKey: process.env.ELEVENLABS_API_KEY, authorization: {maxRequests: 1, maxCharacters: v.characters, requestHash: v.requestHash}, ledgerPath: path.join(job, `paid-request-ledger-${v.speaker}.json`)});
    let result;
    try { result = await provider.synthesize({text: v.text, config: cfg}); made++; }
    catch (e) { console.error(JSON.stringify({speaker: v.speaker, failed: (e as Error).message, paidRequestsMade: made, note: 'Stopped; no automatic retry. Completed takes are kept; rerun with --resume after review.'})); process.exit(1); }
    await writeFile(path.join(takesDir, `${v.speaker}.wav`), result.audio);
    await writeFile(path.join(takesDir, `${v.speaker}.json`), JSON.stringify({speaker: v.speaker, voice: cfg.voice, model: cfg.model, requestId: result.requestId, requestHash: v.requestHash, characters: v.characters, text: v.text, sha256: createHash('sha256').update(result.audio).digest('hex'), alignment: result.alignment}, null, 2) + '\n');
  }
  const takes: Record<string, {samples: Float32Array; sampleRate: number; alignment: never}> = {}, takeInfo: unknown[] = [];
  for (const v of voicePlan!) {
    const info = JSON.parse(await readFile(path.join(takesDir, `${v.speaker}.json`), 'utf8'));
    if (info.text !== v.text) throw Error(`Take for ${v.speaker} was recorded from different text; make a new output directory`);
    takes[v.speaker] = {...decodeWav16(await readFile(path.join(takesDir, `${v.speaker}.wav`))), alignment: info.alignment as never};
    takeInfo.push({speaker: v.speaker, voice: info.voice, requestId: info.requestId, characters: info.characters, sha256: info.sha256});
  }
  const joined = assembleTakes(story.beats, takes);
  const audio = encodeWav(joined.samples, joined.sampleRate), audioPath = path.join(job, 'audio/narration.wav');
  await writeFile(audioPath, audio);
  const measured = await measureAudio(audioPath);
  await writeFile(path.join(job, 'audio/narration-metadata.json'), JSON.stringify({
    key: plan.requestHash, sha256: createHash('sha256').update(audio).digest('hex'), provider: 'elevenlabs', model: config.model, voice: voicePlan!.map(v => `${v.speaker}:${v.voice}`).join(','),
    syntheticTestAudio: false, multiVoice: true, takes: takeInfo, runs: joined.runs.map(r => ({speaker: r.speaker, start: r.start, end: r.end})), measured, audioPath, sourceAudio: audioPath,
    text, characters, paidRequestsThisExecution: made, speedAdjustment: 1, alignment: joined.alignment,
  }, null, 2) + '\n');
  const fits = measured.durationSeconds <= story.durationSeconds - .2;
  let captions: string;
  try { captions = `${captionsFromProviderTiming(story, joined.alignment, measured.durationSeconds, 30).cues.length} caption cues mapped`; } catch (e) { captions = `caption mapping failed: ${(e as Error).message}`; }
  console.log(JSON.stringify({job, durationSeconds: measured.durationSeconds, fitsTimeline: fits, captions, paidRequestsMade: made, takes: takeInfo,
    next: fits ? 'Listen to audio/narration.wav (and each take in audio/takes) before approving the render.' : 'Too long for the timeline: refit the storyboard duration; do not speed up or retry automatically.'}, null, 2));
}
