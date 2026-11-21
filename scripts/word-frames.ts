/** Authoring helper (free, offline): print each shot's start frame and the frame of every spoken word, on the real narration timing.
 * Use it to pick preview-still frames at key words (docs/VISUAL_CHECKLIST.md, section 8).
 * Usage: npx tsx scripts/word-frames.ts --storyboard <json> --script <json> --metadata <json> --audio <wav> [--find beat:word,beat:word]
 * Without --find it prints JSON {scenes:[{id,start,frames}], words:{beat:[[word,frame],...]}}; with --find it prints one frame per query. */
import {parseArgs} from 'node:util';
import {readFile} from 'node:fs/promises';
import {storyScriptSchema} from '../src/storytelling/schema';
import {validateStory} from '../src/storytelling/validate';
import {parseAnchoredStoryboard, resolveWordAnchors} from '../src/storytelling/timing/anchors';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {measureAudio} from '../src/audio/metadata';

const {values: o} = parseArgs({options: {storyboard: {type: 'string'}, script: {type: 'string'}, metadata: {type: 'string'}, audio: {type: 'string'}, find: {type: 'string'}}});
if (!o.storyboard || !o.script || !o.metadata || !o.audio) throw Error('Usage: word-frames --storyboard <json> --script <json> --metadata <json> --audio <wav> [--find beat:word,...]');
const raw = JSON.parse(await readFile(o.storyboard, 'utf8')), source = parseAnchoredStoryboard(raw);
const story = validateStory({...storyScriptSchema.parse(JSON.parse(await readFile(o.script, 'utf8'))), storyboard: o.storyboard}, source);
const alignment = JSON.parse(await readFile(o.metadata, 'utf8')).alignment, spoken = (await measureAudio(o.audio)).durationSeconds;
const mapping = captionsFromProviderTiming(story, alignment, spoken, source.format.fps);
const scheduled = resolveWordAnchors(raw, mapping).schedule.storyboard;
let t = 0;
const scenes = scheduled.scenes.map(s => { const start = t; t += s.durationFrames - (s.transitionFrames ?? 0); return {id: s.id, start, frames: s.durationFrames}; });
const words: Record<string, [string, number][]> = {};
for (const cue of mapping.cues) for (const w of cue.words ?? []) (words[cue.beatId] ??= []).push([w.text, w.startFrame]);
if (o.find) {
  const clean = (x: string) => x.toLowerCase().replace(/[^a-z0-9'-]/g, '');
  const out = o.find.split(',').map(q => { const [beat, word, nth] = q.split(':'); const hits = (words[beat] ?? []).filter(([w]) => clean(w) === clean(word));
    const hit = hits[Math.max(0, Number(nth ?? 1) - 1)]; return {q, frame: hit ? hit[1] : null}; });
  console.log(JSON.stringify(out));
} else console.log(JSON.stringify({scenes, words}));
