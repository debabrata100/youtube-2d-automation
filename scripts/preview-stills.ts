/** Fast authoring preview: render selected PNG stills of a storyboard.
 * With --script/--metadata/--audio the storyboard is scheduled against cached narration timing and captions are drawn.
 * Without them, the storyboard renders as authored (no narration). Offline only; output directory must be new. */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {mkdir, readFile, copyFile, writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderStill} from '@remotion/renderer';
import {storyScriptSchema} from '../src/storytelling/schema';
import {validateStory} from '../src/storytelling/validate';
import {hasAnchors, parseAnchoredStoryboard, resolveWordAnchors} from '../src/storytelling/timing/anchors';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {captionStyleSchema, narrationOverlaySchema} from '../src/captions/schema';
import {measureAudio} from '../src/audio/metadata';
import {getTheme} from '../src/engine/style/theme';
import {browserExecutable} from './media-tools';
import {estimateAlignment} from '../src/storytelling/timing/estimate';
import {encodeWav} from '../src/audio/synth';
import {densityGaps} from '../src/engine/storyboard/density';

const {values: o} = parseArgs({options: {
  script: {type: 'string'}, storyboard: {type: 'string'}, metadata: {type: 'string'}, audio: {type: 'string'},
  'caption-style': {type: 'string'}, 'estimate-timing': {type: 'boolean', default: false}, frames: {type: 'string'}, output: {type: 'string'}, scale: {type: 'string', default: '1'},
}});
if (!o.storyboard || !o.frames || !o.output) {
  throw Error('Usage: preview-stills --storyboard <json> --frames 0,120,280 --output <new-dir> [--script <json> --metadata <json> --audio <wav>] [--caption-style <json>] [--scale 0.5]');
}
const raw = JSON.parse(await readFile(o.storyboard, 'utf8'));
const source = parseAnchoredStoryboard(raw);
if (!o.script && hasAnchors(raw)) throw Error('Storyboard has word anchors: pass --script with --estimate-timing or narration so they can be resolved');
let storyboard = source, narration: unknown;
if (o.script) {
  if (!o['estimate-timing'] && (!o.metadata || !o.audio)) throw Error('--script requires --metadata and --audio, or --estimate-timing');
  const story = validateStory({...storyScriptSchema.parse(JSON.parse(await readFile(o.script, 'utf8'))), storyboard: o.storyboard}, source);
  // Estimated timing: planning-only alignment at the narrator's measured pace, with a silent placeholder track.
  const estimated = o['estimate-timing'] ? estimateAlignment(story.beats.map(b => b.narration).join(' ')) : null;
  const alignment = estimated ?? JSON.parse(await readFile(o.metadata!, 'utf8')).alignment;
  const spoken = estimated ? estimated.character_end_times_seconds.at(-1)! + .05 : (await measureAudio(o.audio!)).durationSeconds;
  if (estimated) console.error(JSON.stringify({estimatedNarrationSeconds: +spoken.toFixed(2), note: 'planning estimate only'}));
  const mapping = captionsFromProviderTiming(story, alignment, spoken, source.format.fps);
  const anchors = resolveWordAnchors(raw, mapping), schedule = anchors.schedule;
  storyboard = schedule.storyboard;
  if (anchors.resolutions.length) console.error(JSON.stringify({anchors: anchors.resolutions.length, warnings: anchors.warnings}));
  const gaps = densityGaps(storyboard);
  console.error(JSON.stringify({visualDensity: gaps.length ? {gapsOver6s: gaps} : 'ok: a new visual at least every 6 s'}));
  console.error(JSON.stringify({scheduledFrames: storyboard.scenes.map(s => s.durationFrames), exceptions: schedule.exceptions}));
  const style = captionStyleSchema.parse(o['caption-style'] ? JSON.parse(await readFile(o['caption-style'], 'utf8')) : source.themeId ? getTheme(source.themeId).caption : {});
  narration = narrationOverlaySchema.parse({audioSrc: 'narration/narration.wav', captionsEnabled: style.enabled !== false, syntheticTestAudio: false, showAiDisclosureBanner: false, cues: mapping.cues, style});
}
const out = path.resolve(o.output);
await mkdir(out);
const publicDir = path.join(out, 'public');
await mkdir(publicDir);
for (const asset of storyboard.assets) {
  const dest = path.join(publicDir, asset.path);
  await mkdir(path.dirname(dest), {recursive: true});
  await copyFile(path.resolve('assets', asset.path), dest);
}
if (narration) {
  await mkdir(path.join(publicDir, 'narration'));
  if (o.audio && !o['estimate-timing']) await copyFile(o.audio, path.join(publicDir, 'narration/narration.wav'));
  else await writeFile(path.join(publicDir, 'narration/narration.wav'), encodeWav(new Float32Array(24000), 24000));
}
const serveUrl = await bundle({entryPoint: path.resolve('src/storyboard-index.ts'), publicDir});
const inputProps = {storyboard, ...(narration ? {narration} : {})};
const browser = await openBrowser('chrome', {browserExecutable});
const composition = (await getCompositions(serveUrl, {inputProps, puppeteerInstance: browser})).find(c => c.id === 'GenericStoryboard')!;
const timings: Record<string, number> = {};
for (const frame of o.frames.split(',').map(Number)) {
  const start = performance.now();
  await renderStill({serveUrl, composition, inputProps, puppeteerInstance: browser, frame, scale: Number(o.scale), output: path.join(out, `frame-${String(frame).padStart(3, '0')}.png`)});
  timings[frame] = Number(((performance.now() - start) / 1000).toFixed(2));
}
await browser.close({silent: true});
await writeFile(path.join(out, 'stills.json'), JSON.stringify({storyboard: o.storyboard, narrated: Boolean(narration), frames: timings, paidRequests: 0}, null, 2) + '\n');
console.log(JSON.stringify(timings));
