/** One continuous ElevenLabs narration take for a story script, with provider character timing.
 *
 *   --planning                   silent placeholder track + estimated timing for an animatic (no network, no cost)
 *   --dry-run                    plan only: characters, words, estimated duration, request hash (no network, no cost)
 *   --authorize-paid-tts         required for the single paid request
 *   --max-characters <n>         explicit character ceiling; the request is refused if the text is longer
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

const {values: o} = parseArgs({options: {
  script: {type: 'string'}, output: {type: 'string'}, config: {type: 'string', default: 'config/narration.json'},
  'dry-run': {type: 'boolean', default: false}, planning: {type: 'boolean', default: false}, 'authorize-paid-tts': {type: 'boolean', default: false}, 'max-characters': {type: 'string'},
}});
if (!o.script) throw Error('Usage: narration:synthesize -- --script stories/<id>.json (--dry-run | --authorize-paid-tts --max-characters <n>) [--output jobs/<new-dir>]');
const input = storyScriptSchema.parse(JSON.parse(await readFile(o.script, 'utf8')));
const story = validateStory(input, parseAnchoredStoryboard(JSON.parse(await readFile(input.storyboard, 'utf8'))));
const configs = JSON.parse(await readFile(o.config!, 'utf8'));
const config = ttsConfigSchema.parse({...configs.elevenlabs, voice: process.env.ELEVENLABS_VOICE_ID?.trim() || configs.elevenlabs.voice, model: process.env.ELEVENLABS_MODEL_ID?.trim() || configs.elevenlabs.model});
const text = story.beats.map(b => b.narration).join(' '), request = {text, config};
const characters = Array.from(text).length, estimate = estimateAlignment(text).character_end_times_seconds.at(-1)!;
const plan = {
  script: story.id, characters, words: words(text).length, estimatedSeconds: +estimate.toFixed(1), timelineSeconds: story.durationSeconds,
  voice: config.voice, model: config.model, requestHash: elevenRequestHash(request), requests: 1, automaticRetries: 0, text,
};
if (o['dry-run']) { console.log(JSON.stringify({...plan, paidRequestsMade: 0, note: 'Dry run: no network request was made.'}, null, 2)); process.exit(0); }
if (o.planning) {
  // Animatic support: silent 24 kHz track as long as the estimate, plus estimated alignment. Clearly marked; never a final narration.
  const job = path.resolve(o.output ?? `jobs/${story.id}-planning-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  await mkdir(job); await mkdir(path.join(job, 'audio'));
  const alignment = estimateAlignment(text), seconds = alignment.character_end_times_seconds.at(-1)! + .05;
  const audio = encodeWav(new Float32Array(Math.round(seconds * 24000)), 24000), audioPath = path.join(job, 'audio/narration.wav');
  await writeFile(audioPath, audio);
  await writeFile(path.join(job, 'audio/narration-metadata.json'), JSON.stringify({key: plan.requestHash, sha256: createHash('sha256').update(audio).digest('hex'), provider: 'planning-estimate', model: 'none', voice: 'none', syntheticTestAudio: true, planningEstimate: true, measured: await measureAudio(audioPath), audioPath, sourceAudio: audioPath, text, characters, paidRequestsThisExecution: 0, alignment}, null, 2) + '\n');
  console.log(JSON.stringify({job, estimatedSeconds: +seconds.toFixed(2), paidRequestsMade: 0, note: 'Planning placeholder only: silent audio and estimated timing.'}, null, 2));
  process.exit(0);
}
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
