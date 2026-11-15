/**
 * Draft a word-anchored skeleton storyboard from a story script (free, no API calls).
 *
 *   node --import tsx scripts/draft-storyboard.ts --script stories/x.json --theme explainer-day --output storyboards/x-draft.json [--force] [--wpm 155]
 *
 * Scene lengths come from the planning timing estimate, so once real narration exists the scheduler barely
 * rescales anything; every label, sound and camera handoff is a word anchor, so a new take needs no retiming.
 */
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {themeIds} from '../src/engine/style/theme';
import {draftStoryboard} from '../src/storytelling/draft';
import {storyScriptSchema} from '../src/storytelling/schema';
import {estimateAlignment} from '../src/storytelling/timing/estimate';
import {parseAnchoredStoryboard, resolveWordAnchors} from '../src/storytelling/timing/anchors';
import {validateStory} from '../src/storytelling/validate';

const {values: o} = parseArgs({options: {script: {type: 'string'}, theme: {type: 'string'}, output: {type: 'string'}, force: {type: 'boolean'}, wpm: {type: 'string'}}});
if (!o.script || !o.theme || !o.output) throw Error('Usage: draft-storyboard --script <json> --theme <id> --output storyboards/<name>.json [--force] [--wpm 155]');
if (!themeIds().includes(o.theme)) throw Error(`Unknown theme "${o.theme}" (have: ${themeIds().join(', ')})`);
if (!/^storyboards\/[a-zA-Z0-9/_-]+\.json$/.test(o.output)) throw Error('--output must be storyboards/<name>.json');
if (existsSync(o.output) && !o.force) throw Error(`${o.output} exists; pass --force to replace it`);

const story = storyScriptSchema.parse(JSON.parse(await readFile(o.script, 'utf8')));
const fps = 30, estimate = estimateAlignment(story.beats.map(b => b.narration).join(' '), o.wpm ? Number(o.wpm) : undefined);
const spoken = estimate.character_end_times_seconds.at(-1)! + .05;
if (spoken > story.durationSeconds - .2) throw Error(`Estimated narration is ${spoken.toFixed(1)} s at this pace; set the script's durationSeconds to at least ${Math.ceil(spoken + 1)} (room for a quiet ending) or shorten the narration`);
const mapping = captionsFromProviderTiming(story, estimate, spoken, fps);

// Pass 1: word-count split; pass 2: adopt the estimated schedule as nominal lengths (scale factor ~1).
const first = draftStoryboard(story, {themeId: o.theme, fps});
const scheduled = resolveWordAnchors(first.board, mapping).schedule.storyboard.scenes.map(s => s.durationFrames);
const {board, notes} = draftStoryboard(story, {themeId: o.theme, fps, nominalFrames: scheduled});

validateStory({...story, storyboard: o.output}, parseAnchoredStoryboard(board));
const check = resolveWordAnchors(board, mapping);
await writeFile(o.output, JSON.stringify(board, null, 2) + '\n');
console.log(JSON.stringify({output: o.output, theme: o.theme, scenes: board.scenes.length, frames: scheduled.reduce((a, b) => a + b, 0),
  estimatedNarrationSeconds: +spoken.toFixed(2), nominalFrames: scheduled, anchors: check.resolutions.length, warnings: check.warnings,
  emphasis: notes, next: 'Replace each g-<beat> placeholder layer with the real visual; keep story-critical timings as word anchors.'}, null, 2));
