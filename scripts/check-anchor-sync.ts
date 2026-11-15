/**
 * Free QA check: resolves a word-anchored storyboard against a narration timing (cached take or a
 * planning estimate) and reports how far each anchored scene sound/camera key lands from its word.
 * With --compare <hand-timed storyboard> the same scene sounds of a frame-numbered board are scheduled
 * under the same timing, showing the drift a re-narration would cause without anchors.
 *
 *   node --import tsx scripts/check-anchor-sync.ts --storyboard storyboards/lightning.json --script stories/lightning-a.json \
 *     (--metadata <narration-metadata.json> --audio <narration.wav> | --estimate-timing [--wpm 135]) [--compare <board.json>] [--output report.json]
 */
import {readFile, writeFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {measureAudio} from '../src/audio/metadata';
import {storyScriptSchema} from '../src/storytelling/schema';
import {estimateAlignment} from '../src/storytelling/timing/estimate';
import {resolveWordAnchors} from '../src/storytelling/timing/anchors';
import {storyboardTimeline} from '../src/engine/storyboard/timeline';

const {values: o} = parseArgs({options: {storyboard: {type: 'string'}, script: {type: 'string'}, metadata: {type: 'string'}, audio: {type: 'string'},
  'estimate-timing': {type: 'boolean'}, wpm: {type: 'string'}, compare: {type: 'string'}, output: {type: 'string'}}});
if (!o.storyboard || !o.script || (!o['estimate-timing'] && (!o.metadata || !o.audio))) {
  throw Error('Usage: check-anchor-sync --storyboard <json> --script <json> (--metadata <json> --audio <wav> | --estimate-timing [--wpm N]) [--compare <json>] [--output <json>]');
}
const raw = JSON.parse(await readFile(o.storyboard, 'utf8'));
const story = storyScriptSchema.parse(JSON.parse(await readFile(o.script, 'utf8')));
const text = story.beats.map(b => b.narration).join(' ');
const estimated = o['estimate-timing'] ? estimateAlignment(text, o.wpm ? Number(o.wpm) : undefined) : null;
const alignment = estimated ?? JSON.parse(await readFile(o.metadata!, 'utf8')).alignment;
const spoken = estimated ? estimated.character_end_times_seconds.at(-1)! + .05 : (await measureAudio(o.audio!)).durationSeconds;
const fps = raw.format.fps as number;
const mapping = captionsFromProviderTiming(story, alignment, spoken, fps);
const anchored = resolveWordAnchors(raw, mapping);
const starts = storyboardTimeline(anchored.schedule.storyboard).map(t => t.startFrame);

let hand: {starts: number[]; scenes: Array<{sounds?: Array<{frame: number}>; camera?: {keyframes?: Array<{frame: number}>}}>} | null = null;
if (o.compare) {
  const handTimed = resolveWordAnchors(JSON.parse(await readFile(o.compare, 'utf8')), mapping).schedule.storyboard;
  hand = {starts: storyboardTimeline(handTimed).map(t => t.startFrame), scenes: handTimed.scenes as never};
}

const rows = anchored.resolutions.filter(r => r.clock === 'scene-output').map(r => {
  const m = r.path.match(/^scenes\[(\d+)\]\.(sounds\[(\d+)\]|camera\.keyframes\[(\d+)\])/)!;
  const scene = Number(m[1]), offset = Math.round((r.value + starts[scene]) - r.seconds * fps);
  const anchoredSeconds = (starts[scene] + r.value) / fps;
  const row: Record<string, unknown> = {path: r.path, word: r.at, wordSeconds: +r.seconds.toFixed(3), anchoredSeconds: +anchoredSeconds.toFixed(3), offsetFrames: offset};
  if (hand) {
    const s = hand.scenes[scene], frame = m[3] !== undefined ? s.sounds?.[Number(m[3])]?.frame : s.camera?.keyframes?.[Number(m[4])]?.frame;
    if (frame !== undefined) {
      const handSeconds = (hand.starts[scene] + frame) / fps;
      Object.assign(row, {handTimedSeconds: +handSeconds.toFixed(3), handDriftFrames: Math.round((handSeconds - anchoredSeconds) * fps)});
    }
  }
  return row;
});
const abs = (k: string) => Math.max(0, ...rows.map(r => Math.abs(Number(r[k] ?? 0))));
const report = {timing: estimated ? `estimate ${o.wpm ?? 155} wpm` : 'cached narration', narrationSeconds: +spoken.toFixed(2),
  anchors: anchored.resolutions.length, warnings: anchored.warnings, sceneCues: rows.length,
  maxHandDriftFrames: hand ? abs('handDriftFrames') : null, rows};
if (o.output) await writeFile(o.output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({...report, rows: undefined}));
