import {alphaAt, smooth, type Raster} from './image-fitting';

/** Straight-alpha result from bilinear premultiplied sampling. Outside is transparent. */
export const sampleRGBA = (source: Raster, x: number, y: number): readonly number[] => {
  if (x < -.5 || y < -.5 || x > source.width - .5 || y > source.height - .5) return [0, 0, 0, 0];
  // The outer half-pixel belongs to the edge texel. This keeps an opaque
  // cover-resize opaque without extrapolating beyond the image footprint.
  x = Math.max(0, Math.min(source.width - 1, x)); y = Math.max(0, Math.min(source.height - 1, y));
  const left = Math.floor(x), top = Math.floor(y), fx = x - left, fy = y - top;
  const color = [0, 0, 0]; let alpha = 0;
  for (const [sx, sy, weight] of [[left, top, (1 - fx) * (1 - fy)], [Math.min(left + 1, source.width - 1), top, fx * (1 - fy)], [left, Math.min(top + 1, source.height - 1), (1 - fx) * fy], [Math.min(left + 1, source.width - 1), Math.min(top + 1, source.height - 1), fx * fy]]) {
    const index = (sy * source.width + sx) * 4, a = source.data[index + 3] / 255 * weight;
    alpha += a;
    for (let c = 0; c < 3; c++) color[c] += source.data[index + c] * a;
  }
  return alpha ? [...color.map(value => Math.round(value / alpha)), Math.round(alpha * 255)] : [0, 0, 0, 0];
};
export const remapRaster = (source: Raster, width: number, height: number, inverse: (x: number, y: number) => readonly [number, number] | null): Raster => {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = inverse(x, y);
    if (at) data.set(sampleRGBA(source, at[0], at[1]), (y * width + x) * 4);
  }
  return {width, height, data};
};
export const placeRaster = (source: Raster, width: number, height: number, transform: {scale: number; x: number; y: number}) => {
  if (!Number.isFinite(transform.scale) || transform.scale <= 0) throw new Error('Uniform placement needs a positive finite scale');
  return remapRaster(source, width, height, (x, y) => [(x - transform.x) / transform.scale, (y - transform.y) / transform.scale]);
};
export const multiplyMask = (source: Raster, mask: Float32Array, opacity = 1): Raster => {
  if (mask.length !== source.width * source.height) throw new Error('Mask registration mismatch');
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new Error('Opacity must be between zero and one');
  const data = source.data.slice();
  for (let i = 0; i < mask.length; i++) data[i * 4 + 3] = Math.round(data[i * 4 + 3] * Math.max(0, Math.min(1, mask[i])) * opacity);
  return {...source, data};
};

/** Two-pass eight-neighbor distance inside a support mask. No opaque pixels outside. */
export const interiorDistance = (mask: Uint8Array, width: number, height: number) => {
  if (mask.length !== width * height) throw new Error('Distance mask registration mismatch');
  const distance = new Float32Array(mask.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) distance[y * width + x] = mask[y * width + x] ? Math.min(x + 1, y + 1, width - x, height - y, 1e6) : 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (x) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
    if (y) distance[i] = Math.min(distance[i], distance[i - width] + 1);
    if (x && y) distance[i] = Math.min(distance[i], distance[i - width - 1] + Math.SQRT2);
    if (x < width - 1 && y) distance[i] = Math.min(distance[i], distance[i - width + 1] + Math.SQRT2);
  }
  for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
    const i = y * width + x;
    if (x < width - 1) distance[i] = Math.min(distance[i], distance[i + 1] + 1);
    if (y < height - 1) distance[i] = Math.min(distance[i], distance[i + width] + 1);
    if (x < width - 1 && y < height - 1) distance[i] = Math.min(distance[i], distance[i + width + 1] + Math.SQRT2);
    if (x && y < height - 1) distance[i] = Math.min(distance[i], distance[i + width - 1] + Math.SQRT2);
  }
  return distance;
};
export const terrainSupport = (reference: Raster, feather: number) => {
  if (!Number.isFinite(feather) || feather <= 0) throw new Error('Terrain feather must be positive');
  const solid = new Uint8Array(reference.width * reference.height);
  for (let i = 0; i < solid.length; i++) solid[i] = reference.data[i * 4 + 3] >= 128 ? 1 : 0;
  const distance = interiorDistance(solid, reference.width, reference.height);
  return {solid, distance, alpha: Float32Array.from(distance, value => smooth(value / feather))};
};
export const profileValue = (x: number, points: ReadonlyArray<readonly [number, number]>) => {
  if (points.length < 2 || points.some((point, i) => i > 0 && point[0] <= points[i - 1][0])) throw new Error('Profile x coordinates must increase');
  if (x <= points[0][0]) return points[0][1];
  if (x >= points.at(-1)![0]) return points.at(-1)![1];
  const index = points.findIndex(point => point[0] >= x), a = points[index - 1], b = points[index];
  return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
};
/** Occludes only the foreground side of a hand-reviewed rim profile. */
export const foregroundRim = (reference: Raster, points: ReadonlyArray<readonly [number, number]>, softness: number) => {
  const mask = new Float32Array(reference.width * reference.height);
  for (let y = 0; y < reference.height; y++) for (let x = Math.ceil(points[0][0]); x <= Math.floor(points.at(-1)![0]); x++) {
    const index = y * reference.width + x;
    const along = smooth((x - points[0][0]) / 8) * smooth((points.at(-1)![0] - x) / 8);
    mask[index] = smooth((y - profileValue(x, points) + softness / 2) / softness) * along * smooth((alphaAt(reference, index) - .2) / .75);
  }
  return mask;
};
export const maskRaster = (mask: Float32Array, width: number, height: number): Raster => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < mask.length; i++) data.set([255, 255, 255, Math.round(mask[i] * 255)], i * 4);
  return {width, height, data};
};
export const rasterStats = (image: Raster) => {
  let left = image.width, right = -1, top = image.height, bottom = -1, transparent = 0, partial = 0, opaqueLooking = 0, alphaSum = 0;
  for (let i = 0; i < image.width * image.height; i++) {
    const a = image.data[i * 4 + 3], x = i % image.width, y = Math.floor(i / image.width);
    alphaSum += a / 255;
    if (!a) transparent++; else if (a < 255) partial++;
    if (a > 128) {opaqueLooking++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);}
  }
  return {width: image.width, height: image.height, transparentPixels: transparent, partialAlphaPixels: partial, alphaAbove128Pixels: opaqueLooking, alphaEquivalentPixels: Number(alphaSum.toFixed(4)), visibleBounds: right < 0 ? null : {left, top, right, bottom}};
};
