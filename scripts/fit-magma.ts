import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {alphaAt, composite, coverageReport, fitLayers, type Raster} from './lib/image-fitting';

const configPath = process.argv[2] ?? 'assets/illustrations/volcano/batch-b/fitted-v1/fitting-config.json';
type Config = {version: number; rock: string; chamber: string; conduit: string; outputDirectory: string; width: number; height: number; options: Parameters<typeof fitLayers>[3]; splitY: number; junction: {x: number; y: number; width: number; height: number; scale: number}};
const config: Config = JSON.parse(readFileSync(configPath, 'utf8'));
if (config.version !== 1) throw new Error('Unsupported fitting configuration');
for (const name of ['chamberFade', 'conduitFade', 'blend'] as const) if (config.options[name].length !== 2 || !config.options[name].every(Number.isFinite) || config.options[name][1] <= config.options[name][0]) throw new Error(`Invalid transition interval: ${name}`);
if (config.options.chamberFade[1] > config.options.conduitFade[0]) throw new Error('Opacity intervals must include a fully opaque junction overlap');
const sourcePaths = [config.rock, config.chamber, config.conduit];
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sourceHashes = Object.fromEntries(sourcePaths.map(file => [file, hash(file)]));
const read = (file: string): Raster => {
  const png = readFileSync(file), width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  if (png.subarray(1, 4).toString() !== 'PNG' || width !== config.width || height !== config.height) throw new Error(`Expected registered PNG canvas: ${file}`);
  return {width, height, data: execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], {maxBuffer: width * height * 4 + 1024})};
};
const [rock, chamber, conduit] = sourcePaths.map(read);
const fitted = fitLayers(rock, chamber, conduit, config.options);
if (fitted.opening.area < 10000 || fitted.opening.area > config.width * config.height * .2) throw new Error('Unexpected opening component; review seed and enclosure before fitting');
const output = config.outputDirectory;
mkdirSync(output, {recursive: true});
const write = (name: string, image: Raster) => {
  const filename = path.join(output, name);
  if (sourcePaths.some(source => path.resolve(source) === path.resolve(filename))) throw new Error('Refusing to overwrite source image');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${image.width}x${image.height}`, '-i', 'pipe:0', '-frames:v', '1', '-update', '1', filename], {input: image.data, maxBuffer: 1024 * 1024});
};
const background = (width: number, height: number): Raster => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([20, 25, 39, 255], i * 4);
  return {width, height, data};
};
const sideBySide = (before: Raster, after: Raster): Raster => {
  const result = background(before.width * 2, before.height);
  const images = [composite(background(before.width, before.height), before), composite(background(after.width, after.height), after)];
  for (const [side, image] of images.entries()) for (let y = 0; y < image.height; y++) result.data.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), (y * result.width + side * image.width) * 4);
  return result;
};
const magnify = (source: Raster): Raster => {
  const crop = config.junction, width = crop.width * crop.scale, height = crop.height * crop.scale;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = crop.x + Math.floor(x / crop.scale), sy = crop.y + Math.floor(y / crop.scale);
    data.set(source.data.subarray((sy * source.width + sx) * 4, (sy * source.width + sx) * 4 + 4), (y * width + x) * 4);
  }
  return {width, height, data};
};
const beforeMagma = composite(conduit, chamber), magma = composite(fitted.conduit, fitted.chamber);
const beforeRock = composite(beforeMagma, rock), afterRock = composite(magma, rock);
write('magma-chamber-fitted.png', fitted.chamber);
write('conduit-magma-fitted.png', fitted.conduit);
write('magma-only-composite.png', magma);
write('magma-behind-cutaway.png', afterRock);
write('before-after-alignment.png', sideBySide(beforeRock, afterRock));
write('before-after-magma-only.png', sideBySide(beforeMagma, magma));
write('junction-before-after-3x.png', sideBySide(magnify(beforeRock), magnify(afterRock)));
const opening: Raster = {width: rock.width, height: rock.height, data: new Uint8Array(rock.data.length)};
const diagnostic = background(rock.width, rock.height);
let maxColorDifferenceAtOverlap = 0, fittedOverlapPixels = 0, junctionMissing = 0;
for (let i = 0; i < fitted.opening.mask.length; i++) {
  if (fitted.opening.mask[i]) {
    const chamberRegion = Math.floor(i / rock.width) >= config.splitY;
    const color = chamberRegion ? [255, 163, 68] : [91, 216, 228];
    opening.data.set([...color, 255], i * 4); diagnostic.data.set([...color, 255], i * 4);
    if (Math.floor(i / rock.width) >= 850 && Math.floor(i / rock.width) <= 950 && alphaAt(magma, i) < 250 / 255) junctionMissing++;
  }
  if (alphaAt(fitted.chamber, i) > .1 && alphaAt(fitted.conduit, i) > .1) {
    fittedOverlapPixels++;
    for (let c = 0; c < 3; c++) maxColorDifferenceAtOverlap = Math.max(maxColorDifferenceAtOverlap, Math.abs(fitted.chamber.data[i * 4 + c] - fitted.conduit.data[i * 4 + c]));
  }
}
write('opening-mask.png', opening);
write('opening-regions.png', diagnostic);
const before = coverageReport(rock, fitted.opening.mask, beforeMagma, config.splitY);
const after = coverageReport(rock, fitted.opening.mask, magma, config.splitY);
const sourceImagesUnchanged = sourcePaths.every(file => sourceHashes[file] === hash(file));
const passed = after.chamber.coveragePercent >= 99 && after.conduit.coveragePercent >= 99 && after.spill.exteriorBackgroundPixelsWithSpill === 0 && junctionMissing === 0 && maxColorDifferenceAtOverlap === 0 && sourceImagesUnchanged;
const report = {
  status: passed ? 'technical fitting checks passed; human visual approval pending' : 'fitting checks failed',
  configuration: configPath, sourceHashes, sourceImagesUnchanged,
  canvas: {width: rock.width, height: rock.height},
  segmentation: {method: 'Four-connected interior aperture, seeded inside the reservoir and restricted to the scanline rock enclosure. Unrelated sky, outside transparency and other disconnected holes are excluded.', seed: config.options.seed, openingAlphaLessThan: 128, connectedPixels: fitted.opening.area, chamberStartsAtY: config.splitY, mask: 'opening-mask.png', regions: 'opening-regions.png'},
  metricDefinitions: {coverage: 'Fraction of intended-opening pixels with composite magma alpha >=250/255. Missing alpha equivalents also count partial transparency.', spill: 'All magma alpha outside the same intended opening is counted, including deliberate one-pixel feather underneath rock. Visible spill is magmaAlpha*(1-rockAlpha), not hidden source spill.', visibleSpillThreshold: .05, missingRegions: 'Largest four-connected uncovered component. No unrelated background contributes to coverage.'},
  before, after,
  continuity: {fittedOverlapPixels, maxColorDifferenceAtOverlap, junctionMissingPixels: junctionMissing, junctionYRange: [850, 950], method: 'Identical smoothly blended RGB in both derived layers across their overlap; at least one layer remains fully opaque through every intended junction pixel.'},
  outputHashes: Object.fromEntries(['magma-chamber-fitted.png', 'conduit-magma-fitted.png', 'magma-only-composite.png', 'magma-behind-cutaway.png', 'before-after-alignment.png', 'before-after-magma-only.png', 'junction-before-after-3x.png', 'opening-mask.png', 'opening-regions.png'].map(file => [file, hash(path.join(output, file))])),
  deterministic: 'Fixed inputs and JSON options; deterministic raster math and local FFmpeg PNG encoding. Re-run and compare output hashes; this is not a guarantee about future encoded MP4s.',
  previews: {comparison: 'Left: original unfitted artwork; right: fitted. Both have the unchanged rock in foreground.', junction: 'Left before / right after, nearest-neighbor 3x enlargement to expose source pixels without smoothing away defects.'},
  humanVisualApproval: 'pending', automatedChecksPassed: passed,
};
writeFileSync(path.join(output, 'alpha-coverage-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({outputDirectory: output, before, after, continuity: report.continuity, sourceImagesUnchanged, automatedChecksPassed: passed}, null, 2));
if (!passed) process.exitCode = 1;
