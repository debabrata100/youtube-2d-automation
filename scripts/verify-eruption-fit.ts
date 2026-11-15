import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {foregroundRim, rasterStats} from './lib/raster-compositing';
import type {Raster} from './lib/image-fitting';

const directory = 'assets/illustrations/volcano/batch-c/fitted-v1/';
const run = () => {
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/fit-eruption.ts'], {stdio: 'pipe'});
  return JSON.parse(readFileSync(directory + 'alignment-report.json', 'utf8'));
};
const first = run(), second = run();
const identical = Object.entries(first.outputHashes).every(([name, sha]) => second.outputHashes[name] === sha);
const sourceHashesStable = JSON.stringify(first.protectedHashes) === JSON.stringify(second.protectedHashes) && second.sourcesUnchanged;
const read = (file: string): Raster => {
  const png = readFileSync(file), width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  return {width, height, data: execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], {maxBuffer: width * height * 4 + 1024})};
};
const rock = read('assets/illustrations/volcano/batch-a/exterior-v1.png');
const lava = read(directory + 'lava-flows-fitted.png'), plume = read(directory + 'eruption-plume-fitted.png'), ash = read(directory + 'ash-wisp-fitted.png'), scene = read(directory + 'scene-9x16.png');
const config = JSON.parse(readFileSync(directory + 'fitting-config.json', 'utf8'));
const rim = foregroundRim(rock, config.rim.profile, config.rim.softness);
let unsupported = 0, foregroundLeak = 0, lowerSmoke = 0, duplicateAsh = 0, nonOpaqueScene = 0;
for (let i = 0; i < rock.width * rock.height; i++) {
  if (lava.data[i * 4 + 3] > 0 && rock.data[i * 4 + 3] < 128) unsupported++;
  if (plume.data[i * 4 + 3] > 12 && rim[i] >= .999) foregroundLeak++;
  if (plume.data[i * 4 + 3] > 12 && Math.floor(i / rock.width) >= 365) lowerSmoke++;
  if (plume.data[i * 4 + 3] > 25 && ash.data[i * 4 + 3] > 25) duplicateAsh++;
}
for (let i = 3; i < scene.data.length; i += 4) if (scene.data[i] !== 255) nonOpaqueScene++;
const decodedAssetDimensions = [plume, lava, ash].every(image => image.width === 1254 && image.height === 1254 && rasterStats(image).transparentPixels > 0) && scene.width === 1080 && scene.height === 1920;
const passed = identical && sourceHashesStable && decodedAssetDimensions && !unsupported && !foregroundLeak && !lowerSmoke && !duplicateAsh && !nonOpaqueScene && second.automatedChecksPassed;
const report = {
  identicalOutputPNGsOnRepeat: identical, comparedPNGs: Object.keys(second.outputHashes).length,
  decodedOutputs: {unsupportedLavaPixelsWithAnyAlpha: unsupported, plumePixelsLeakingThroughForegroundRim: foregroundLeak, smokePixelsBelowY365: lowerSmoke, ashPixelsDuplicatingMainPlume: duplicateAsh, portraitPixelsNotFullyOpaque: nonOpaqueScene},
  dimensions: {plume: [plume.width, plume.height], lava: [lava.width, lava.height], ash: [ash.width, ash.height], portrait: [scene.width, scene.height]},
  sourceHashesPreserved: sourceHashesStable, protectedFiles: Object.keys(second.protectedHashes).length, protectedVideos: second.protectedVideos,
  outputHashes: second.outputHashes, automatedChecksPassed: passed,
  note: 'Two actual fitting runs followed by independent PNG decoding. Raster/PNG repeatability in this environment does not guarantee byte-identical future MP4 output.',
};
writeFileSync(directory + 'repeatability-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
