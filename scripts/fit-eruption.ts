import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {alphaAt, composite, mapCoordinate, smooth, type Raster} from './lib/image-fitting';
import {foregroundRim, maskRaster, multiplyMask, placeRaster, profileValue, rasterStats, remapRaster, terrainSupport} from './lib/raster-compositing';

const output = 'assets/illustrations/volcano/batch-c/fitted-v1';
type Config = {version: number; plume: {scale: number; sourceAnchor: [number, number]; vent: [number, number]}; rim: {profile: [number, number][]; softness: number}; lava: {inverseYKnots: [number, number][]; rootShiftX: number; leftBranchShiftX: number; terrainFeatherPixels: number}; ash: {scale: number; sourceAnchor: [number, number]; targetAnchor: [number, number]; opacity: number}; scene: {width: number; height: number; groupScale: number; groundY: number}; craterCrop: Crop; endpointsCrop: Crop};
type Crop = {x: number; y: number; width: number; height: number; scale: number};
const config: Config = JSON.parse(readFileSync(path.join(output, 'fitting-config.json'), 'utf8'));
if (config.version !== 1) throw new Error('Unsupported eruption fitting configuration');
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const walk = (directory: string): string[] => readdirSync(directory, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const protectedFiles = walk('assets/illustrations').filter(file => file.endsWith('.png') && !file.startsWith(output + path.sep));
const baselineReceipt = JSON.parse(readFileSync('docs/M1_2_FINAL_VERIFICATION.json', 'utf8'));
const videoExpectations: Record<string, string> = {[baselineReceipt.video.path]: baselineReceipt.video.sha256, 'jobs/generic-template-demo-m2-1-2026-11-14T08-03-11-052Z/output/animation.mp4': 'aceb0eb779e74114273a4815904386ec933fa0518f1da8b3930cf6d30544e7a7'};
const videoChecks = Object.entries(videoExpectations).map(([file, expected]) => {
  if (!existsSync(file)) return {file, available: false, matchesApprovedHash: null};
  const sha256 = hash(file);
  if (sha256 !== expected) throw new Error(`Existing approved video differs from receipt: ${file}`);
  protectedFiles.push(file);
  return {file, available: true, sha256, matchesApprovedHash: true};
});
const protectedHashes = Object.fromEntries(protectedFiles.sort().map(file => [file, hash(file)]));
const paths = {rock: 'assets/illustrations/volcano/batch-a/exterior-v1.png', landscape: 'assets/illustrations/volcano/batch-a/landscape-v1.png', plume: 'assets/illustrations/volcano/batch-c/eruption-plume-v1.png', lava: 'assets/illustrations/volcano/batch-c/lava-flows-v1.png', ash: 'assets/illustrations/volcano/batch-c/ash-wisp-v1.png'};
const approval = JSON.parse(readFileSync('assets/illustrations/volcano/batch-c/asset-report.json', 'utf8'));
for (const asset of approval.assets) if (hash(asset.file) !== asset.sha256) throw new Error(`Approved artwork changed: ${asset.file}`);
if (hash(paths.rock) !== approval.references.exterior.sha256 || hash(paths.landscape) !== approval.references.landscape.sha256) throw new Error('Approved exterior or landscape changed');
const read = (file: string): Raster => {
  const png = readFileSync(file);
  if (png.subarray(1, 4).toString() !== 'PNG') throw new Error(`Expected PNG: ${file}`);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  return {width, height, data: execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], {maxBuffer: width * height * 4 + 1024})};
};
const rock = read(paths.rock), landscape = read(paths.landscape), plume = read(paths.plume), lava = read(paths.lava), ash = read(paths.ash);
const width = rock.width, height = rock.height;
if ([rock, plume, lava, ash].some(image => image.width !== 1254 || image.height !== 1254)) throw new Error('Expected approved 1254×1254 source registration');
const anchor = (source: readonly number[], target: readonly number[], scale: number) => ({scale, x: target[0] - source[0] * scale, y: target[1] - source[1] * scale});
const plumeTransform = anchor(config.plume.sourceAnchor, config.plume.vent, config.plume.scale);
const plumePlaced = placeRaster(plume, width, height, plumeTransform);
const rim = foregroundRim(rock, config.rim.profile, config.rim.softness);
const plumeFitted = multiplyMask(plumePlaced, Float32Array.from(rim, value => 1 - value));
const terrain = terrainSupport(rock, config.lava.terrainFeatherPixels);
const lavaWarped = remapRaster(lava, width, height, (x, y) => {
  const knots = config.lava.inverseYKnots;
  if (y < knots[0][0] || y > knots.at(-1)![0]) return null;
  const sy = mapCoordinate(y, knots);
  const root = config.lava.rootShiftX * (1 - smooth((y - 330) / 150));
  const lowerLeft = config.lava.leftBranchShiftX * Math.exp(-(((x - 100) / 150) ** 2)) * smooth((y - 570) / 120);
  return [x - root - lowerLeft, sy];
});
const lavaFitted = multiplyMask(lavaWarped, terrain.alpha);
const ashTransform = anchor(config.ash.sourceAnchor, config.ash.targetAnchor, config.ash.scale);
const ashPlaced = placeRaster(ash, width, height, ashTransform);
const ashFitted = multiplyMask(ashPlaced, new Float32Array(width * height).fill(1), config.ash.opacity);

const lavaOnly = composite(rock, lavaFitted), plumeOnly = composite(rock, plumeFitted);
const combined = composite(composite(lavaOnly, plumeFitted), ashFitted);
const original = composite(composite(composite(rock, lava), plume), ash);
const back = (w: number, h: number): Raster => {const data = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) data.set([20, 25, 39, 255], i * 4); return {width: w, height: h, data};};
const compare = (before: Raster, after: Raster): Raster => {
  const result = back(width * 2, height);
  for (const [side, image] of [before, after].entries()) {
    const flat = composite(back(width, height), image);
    for (let y = 0; y < height; y++) result.data.set(flat.data.subarray(y * width * 4, (y + 1) * width * 4), (y * result.width + side * width) * 4);
  }
  return result;
};
const crop = (source: Raster, box: Crop): Raster => {
  const result = back(box.width * box.scale, box.height * box.scale), flat = composite(back(source.width, source.height), source);
  for (let y = 0; y < result.height; y++) for (let x = 0; x < result.width; x++) {
    const sx = box.x + Math.floor(x / box.scale), sy = box.y + Math.floor(y / box.scale);
    result.data.set(flat.data.subarray((sy * flat.width + sx) * 4, (sy * flat.width + sx) * 4 + 4), (y * result.width + x) * 4);
  }
  return result;
};
// Separate contact shadow belongs to compositing, not to the approved source art.
const shadow: Raster = {width, height, data: new Uint8Array(width * height * 4)};
for (let y = 730; y < 850; y++) for (let x = 0; x < width; x++) {
  const opacity = .24 * Math.exp(-2 * (((x - 630) / 560) ** 2 + ((y - 790) / 19) ** 2));
  shadow.data.set([30, 20, 28, Math.round(opacity * 255)], (y * width + x) * 4);
}
const scene = config.scene, landscapeScale = Math.max(scene.width / landscape.width, scene.height / landscape.height);
const sceneBase = placeRaster(landscape, scene.width, scene.height, {scale: landscapeScale, x: (scene.width - landscape.width * landscapeScale) / 2, y: (scene.height - landscape.height * landscapeScale) / 2});
const groupTransform = {scale: scene.groupScale, x: (scene.width - width * scene.groupScale) / 2, y: scene.groundY - 792 * scene.groupScale};
const scenePreview = composite(composite(sceneBase, placeRaster(shadow, scene.width, scene.height, groupTransform)), placeRaster(combined, scene.width, scene.height, groupTransform));
const outputs: Record<string, Raster> = {
  'eruption-plume-fitted.png': plumeFitted,
  'eruption-plume-placed-unoccluded.png': plumePlaced,
  'lava-flows-fitted.png': lavaFitted,
  'ash-wisp-fitted.png': ashFitted,
  'crater-rim-mask.png': maskRaster(rim, width, height),
  'lava-terrain-mask.png': maskRaster(terrain.alpha, width, height),
  'ground-contact-shadow.png': shadow,
  'plume-over-volcano.png': plumeOnly,
  'lava-over-volcano.png': lavaOnly,
  'combined-eruption.png': combined,
  'original-vs-fitted.png': compare(original, combined),
  'crater-junction-3x.png': crop(combined, config.craterCrop),
  'lava-endpoints-2x.png': crop(lavaOnly, config.endpointsCrop),
  'scene-9x16.png': scenePreview,
};
mkdirSync(output, {recursive: true});
for (const [name, image] of Object.entries(outputs)) execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${image.width}x${image.height}`, '-i', 'pipe:0', '-frames:v', '1', '-update', '1', path.join(output, name)], {input: image.data, maxBuffer: 1024 * 1024});

const supportStats = (image: Raster) => {
  let visible = 0, unsupported = 0, unsupportedAnyAlpha = 0, opacity = 0, unsupportedOpacity = 0;
  for (let i = 0; i < width * height; i++) {
    const a = alphaAt(image, i); opacity += a;
    if (a > 128 / 255) {visible++; if (!terrain.solid[i]) unsupported++;}
    if (!terrain.solid[i]) {unsupportedOpacity += a; if (a > 0) unsupportedAnyAlpha++;}
  }
  return {visiblePixels: visible, unsupportedVisiblePixels: unsupported, unsupportedPixelsWithAnyAlpha: unsupportedAnyAlpha, silhouetteSupportPercent: visible ? Number((100 * (1 - unsupported / visible)).toFixed(6)) : 0, alphaEquivalentPixels: Number(opacity.toFixed(4)), unsupportedAlphaEquivalentPixels: Number(unsupportedOpacity.toFixed(4))};
};
const beforeSupport = supportStats(lava), warpedSupport = supportStats(lavaWarped), afterSupport = supportStats(lavaFitted);
let plumeOccluded = 0, plumeForegroundLeak = 0, visibleVentConnection = 0, lowerMountainSmoke = 0, ashPixels = 0, duplicatedAsh = 0;
for (let i = 0; i < width * height; i++) {
  const x = i % width, y = Math.floor(i / width), a = alphaAt(plumeFitted, i), originalAlpha = alphaAt(plumePlaced, i);
  if (originalAlpha > .05 && rim[i] > .5) plumeOccluded++;
  if (a > .05 && y >= 365) lowerMountainSmoke++;
  if (a > .05 && rim[i] >= .999) plumeForegroundLeak++;
  if (a > .05 && x >= 620 && x <= 665 && Math.abs(y - profileValue(x, config.rim.profile)) <= 4) visibleVentConnection++;
  if (alphaAt(ashFitted, i) > .1) {ashPixels++; if (a > .1) duplicatedAsh++;}
}
const sourcesUnchanged = Object.entries(protectedHashes).every(([file, sha]) => hash(file) === sha);
const plumeStats = rasterStats(plumeFitted), lavaStats = rasterStats(lavaFitted), ashStats = rasterStats(ashFitted);
const retainedByMask = 100 * afterSupport.alphaEquivalentPixels / warpedSupport.alphaEquivalentPixels;
const portraitOpaque = scenePreview.data.every((value, i) => i % 4 !== 3 || value === 255);
const passed = sourcesUnchanged && afterSupport.unsupportedPixelsWithAnyAlpha === 0 && warpedSupport.silhouetteSupportPercent >= 98 && retainedByMask >= 97 && plumeOccluded > 0 && visibleVentConnection > 0 && plumeForegroundLeak === 0 && lowerMountainSmoke === 0 && (plumeStats.visibleBounds?.top ?? 0) >= 20 && duplicatedAsh / Math.max(1, ashPixels) < .05 && portraitOpaque;
const report = {
  status: passed ? 'technical checks passed; human visual approval pending' : 'checks failed; inspect previews',
  configuration: path.join(output, 'fitting-config.json'),
  dimensions: Object.fromEntries(Object.entries(outputs).map(([name, image]) => [name, rasterStats(image)])),
  sourcesUnchanged, protectedHashes, protectedVideos: videoChecks,
  plume: {method: 'Uniform scale and translation only; no shape deformation. Front-rim alpha occlusion is applied in a separate deterministic mask.', transform: plumeTransform, ventAnchor: config.plume.vent, foregroundOccludedPixels: plumeOccluded, visiblePixelsAtRimConnection: visibleVentConnection, visiblePixelsLeakingThroughFullRimMask: plumeForegroundLeak, smokePixelsBelowY365: lowerMountainSmoke, nativeTopHeadroomPixels: plumeStats.visibleBounds?.top, unoccludedSourceForLaterDrift: 'eruption-plume-placed-unoccluded.png'},
  lava: {method: 'Smooth monotonic local vertical remap, tapered root correction, localized lower-left branch displacement, then soft interior terrain mask. No outside pools are retained because no registered supporting foreground is provided.', before: beforeSupport, afterGeometricWarpBeforeMask: warpedSupport, afterMask: afterSupport, warpedMaterialOpacityRetainedByMaskPercent: Number(retainedByMask.toFixed(6)), geometricWarpEndBounds: rasterStats(lavaWarped).visibleBounds, finalVisibleBounds: lavaStats.visibleBounds, finalEndpointClearanceAboveMaxBasePixels: 792 - (lavaStats.visibleBounds?.bottom ?? 792), maskFeatherPixels: config.lava.terrainFeatherPixels},
  ash: {transform: ashTransform, opacity: config.ash.opacity, visiblePixels: ashPixels, overlappingMainPlumePixels: duplicatedAsh, overlapPercent: Number((100 * duplicatedAsh / Math.max(1, ashPixels)).toFixed(6)), optional: true, anchorInstructions: 'Keep canvas registration, animate modest drift/opacity/scale independently; recheck overlap and crater mask after later animation.'},
  scene: {width: scene.width, height: scene.height, landscapeScale, groupTransform, baseGroundY: scene.groundY, opaqueBackgroundToAllFrameEdges: portraitOpaque, volcanoFrame: 'Shared 1254-unit local coordinates. Entire group placed on the approved terrain; preview only, no animation integrated.'},
  outputHashes: Object.fromEntries(Object.keys(outputs).map(name => [name, hash(path.join(output, name))])),
  layering: ['Approved landscape', 'Optional derived contact shadow', 'Approved volcano exterior', 'Terrain-fitted lava', 'Plume with crater-rim alpha occlusion', 'Optional independently drifting ash/particles'],
  limits: ['Terrain is a hand-reviewed 2D painting, not a height field; slope/gully accuracy requires visual approval.', 'Lava texture is locally resampled/compressed and small edge remnants are feathered; source paintings are unchanged.', 'The plume is uniformly reduced to fit registered headroom; a larger eruption requires a new framing decision.', 'The supplied still previews do not validate future animated reveals or drift.', 'No physical rock relighting or eruption simulation was added.'],
  humanVisualApproval: 'pending', automatedChecksPassed: passed,
};
writeFileSync(path.join(output, 'alignment-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({output, automatedChecksPassed: passed, sourcesUnchanged, plume: report.plume, lava: report.lava, ash: report.ash}, null, 2));
if (!passed) process.exitCode = 1;
