/** Fast authoring preview: schedule a storyboard against cached narration timing and render selected PNG stills.
 * Offline only: no provider, no environment loading, no paid requests. Output directory must be new. */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {mkdir, readFile, copyFile, writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderStill} from '@remotion/renderer';
import {storyScriptSchema} from '../src/storytelling/schema';
import {validateStory} from '../src/storytelling/validate';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {scheduleNarratedScenes} from '../src/storytelling/timing/scene-scheduler';
import {captionsFromProviderTiming} from '../src/captions/provider-timing';
import {captionStyleSchema, narrationOverlaySchema} from '../src/captions/schema';
import {measureAudio} from '../src/audio/metadata';
import {browserExecutable} from './media-tools';

const {values: o} = parseArgs({options: {
  script: {type: 'string'}, storyboard: {type: 'string'}, metadata: {type: 'string'}, audio: {type: 'string'},
  'caption-style': {type: 'string'}, frames: {type: 'string'}, output: {type: 'string'}, scale: {type: 'string', default: '1'},
}});
if (!o.script || !o.storyboard || !o.metadata || !o.audio || !o.frames || !o.output) {
  throw Error('Usage: preview-stills --script <json> --storyboard <json> --metadata <json> --audio <wav> --frames 0,120,280 --output <new-dir> [--caption-style <json>] [--scale 0.5]');
}
const story = validateStory({...storyScriptSchema.parse(JSON.parse(await readFile(o.script, 'utf8'))), storyboard: o.storyboard}, parseStoryboard(JSON.parse(await readFile(o.storyboard, 'utf8'))));
const source = parseStoryboard(JSON.parse(await readFile(o.storyboard, 'utf8')));
const metadata = JSON.parse(await readFile(o.metadata, 'utf8'));
const mapping = captionsFromProviderTiming(story, metadata.alignment, (await measureAudio(o.audio)).durationSeconds, source.format.fps);
const storyboard = scheduleNarratedScenes(source, mapping.phraseTimings).storyboard;
const style = captionStyleSchema.parse(o['caption-style'] ? JSON.parse(await readFile(o['caption-style'], 'utf8')) : {});
const narration = narrationOverlaySchema.parse({audioSrc: 'narration/narration.wav', captionsEnabled: true, syntheticTestAudio: false, showAiDisclosureBanner: false, cues: mapping.cues, style});
const out = path.resolve(o.output);
await mkdir(out);
const publicDir = path.join(out, 'public');
for (const asset of storyboard.assets) {
  const dest = path.join(publicDir, asset.path);
  await mkdir(path.dirname(dest), {recursive: true});
  await copyFile(path.resolve('assets', asset.path), dest);
}
await mkdir(path.join(publicDir, 'narration'));
await copyFile(o.audio, path.join(publicDir, 'narration/narration.wav'));
const serveUrl = await bundle({entryPoint: path.resolve('src/storyboard-index.ts'), publicDir});
const inputProps = {storyboard, narration};
const browser = await openBrowser('chrome', {browserExecutable});
const composition = (await getCompositions(serveUrl, {inputProps, puppeteerInstance: browser})).find(c => c.id === 'GenericStoryboard')!;
const timings: Record<string, number> = {};
for (const frame of o.frames.split(',').map(Number)) {
  const start = performance.now();
  await renderStill({serveUrl, composition, inputProps, puppeteerInstance: browser, frame, scale: Number(o.scale), output: path.join(out, `frame-${String(frame).padStart(3, '0')}.png`)});
  timings[frame] = Number(((performance.now() - start) / 1000).toFixed(2));
}
await browser.close({silent: true});
await writeFile(path.join(out, 'stills.json'), JSON.stringify({storyboard: o.storyboard, frames: timings, paidRequests: 0}, null, 2) + '\n');
console.log(JSON.stringify(timings));
