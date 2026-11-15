/** Deterministic raster fitting primitives. No topic-specific rendering logic. */
export type Raster = {width: number; height: number; data: Uint8Array};
export type Span = {left: number; right: number};
export const smooth = (value: number) => {const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t);};
export const alphaAt = (image: Raster, index: number) => image.data[index * 4 + 3] / 255;

export const rowSpans = (mask: Uint8Array, width: number, height: number): Array<Span | null> => Array.from({length: height}, (_, y) => {
  let left = width, right = -1;
  for (let x = 0; x < width; x++) if (mask[y * width + x]) {left = Math.min(left, x); right = x;}
  return right < 0 ? null : {left, right};
});

/** Scanline rock enclosure excludes exterior sky/background; seed selects one cavity. */
export const extractOpening = (rock: Raster, seed: {x: number; y: number}, threshold = 128) => {
  const {width, height} = rock, solid = new Uint8Array(width * height);
  for (let i = 0; i < solid.length; i++) solid[i] = rock.data[i * 4 + 3] >= threshold ? 1 : 0;
  const enclosure = rowSpans(solid, width, height), mask = new Uint8Array(solid.length);
  const start = seed.y * width + seed.x;
  const seedSpan = enclosure[seed.y];
  if (!Number.isInteger(seed.x) || !Number.isInteger(seed.y) || seed.x < 0 || seed.x >= width || seed.y < 0 || seed.y >= height || solid[start] || !seedSpan || seed.x <= seedSpan.left || seed.x >= seedSpan.right) throw new Error('Opening seed must be a transparent interior point');
  const queue = [start]; mask[start] = 1;
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head], x = index % width, y = Math.floor(index / width);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const next = ny * width + nx, span = enclosure[ny];
      if (span && nx >= span.left && nx <= span.right && !solid[next] && !mask[next]) {mask[next] = 1; queue.push(next);}
    }
  }
  return {mask, enclosure, spans: rowSpans(mask, width, height), area: queue.length};
};

/** Gaussian smoothing of sampled contours, not of the painted texture itself. */
export const profileAt = (spans: Array<Span | null>, y: number, radius = 4): Span => {
  let left = 0, right = 0, weight = 0;
  for (let row = Math.max(0, Math.floor(y) - radius); row <= Math.min(spans.length - 1, Math.ceil(y) + radius); row++) {
    const span = spans[row]; if (!span) continue;
    const w = Math.exp(-((row - y) ** 2) / 12);
    left += span.left * w; right += span.right * w; weight += w;
  }
  if (!weight) {
    for (let distance = 0; distance < spans.length; distance++) {
      const span = spans[Math.max(0, Math.min(spans.length - 1, Math.round(y) + distance))] ?? spans[Math.max(0, Math.min(spans.length - 1, Math.round(y) - distance))];
      if (span) return span;
    }
    throw new Error('No painted material in source');
  }
  return {left: left / weight, right: right / weight};
};

export const mapCoordinate = (value: number, knots: ReadonlyArray<readonly [number, number]>) => {
  if (knots.length < 2 || knots.some((point, i) => i > 0 && (point[0] <= knots[i - 1][0] || point[1] <= knots[i - 1][1]))) throw new Error('Coordinate knots must increase in both axes');
  if (value <= knots[0][0]) return knots[0][1];
  if (value >= knots.at(-1)![0]) return knots.at(-1)![1];
  const next = knots.findIndex(point => point[0] >= value), a = knots[next - 1], b = knots[next];
  const slope = (i: number) => (knots[i + 1][1] - knots[i][1]) / (knots[i + 1][0] - knots[i][0]);
  const tangent = (i: number) => {
    if (i === 0) return slope(0);
    if (i === knots.length - 1) return slope(i - 1);
    const before = knots[i][0] - knots[i - 1][0], after = knots[i + 1][0] - knots[i][0];
    const w1 = 2 * after + before, w2 = after + 2 * before;
    return (w1 + w2) / (w1 / slope(i - 1) + w2 / slope(i));
  };
  // Monotone cubic Hermite: continuous derivatives without folded coordinates
  // or a repeated zero-velocity texture band at each control point.
  const span = b[0] - a[0], t = (value - a[0]) / span;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * a[1] + (t ** 3 - 2 * t ** 2 + t) * span * tangent(next - 1) + (-2 * t ** 3 + 3 * t ** 2) * b[1] + (t ** 3 - t ** 2) * span * tangent(next);
};

/** Bilinear premultiplied sampling prevents transparent RGB from making dark seams. */
export const sampleColor = (source: Raster, x: number, y: number): [number, number, number] | null => {
  x = Math.max(0, Math.min(source.width - 1, x)); y = Math.max(0, Math.min(source.height - 1, y));
  const x0 = Math.floor(x), y0 = Math.floor(y), rgb = [0, 0, 0]; let total = 0;
  for (const [sx, sy, weight] of [[x0, y0, (1 - x + x0) * (1 - y + y0)], [Math.min(x0 + 1, source.width - 1), y0, (x - x0) * (1 - y + y0)], [x0, Math.min(y0 + 1, source.height - 1), (1 - x + x0) * (y - y0)], [Math.min(x0 + 1, source.width - 1), Math.min(y0 + 1, source.height - 1), (x - x0) * (y - y0)]]) {
    const index = (sy * source.width + sx) * 4, a = source.data[index + 3] / 255 * weight;
    total += a;
    for (let channel = 0; channel < 3; channel++) rgb[channel] += source.data[index + channel] * a;
  }
  return total < .05 ? null : rgb.map(channel => channel / total) as [number, number, number];
};

export const warpMaterial = (source: Raster, target: Array<Span | null>, knots: ReadonlyArray<readonly [number, number]>) => {
  const mask = new Uint8Array(source.width * source.height);
  for (let i = 0; i < mask.length; i++) mask[i] = source.data[i * 4 + 3] > 200 ? 1 : 0;
  const spans = rowSpans(mask, source.width, source.height);
  const first = spans.findIndex(Boolean); let last = spans.length - 1;
  while (last >= 0 && !spans[last]) last--;
  if (first < 0) throw new Error('Source has no sufficiently opaque material');
  // Cache smooth profiles/row mappings. Only color sampling runs per pixel.
  const profiles = target.map((_, y) => {
    const sy = Math.max(first + 1, Math.min(last - 1, mapCoordinate(y, knots)));
    return {sy, from: profileAt(spans, sy), to: profileAt(target, y)};
  });
  return (x: number, y: number): [number, number, number] => {
    const {sy, from, to} = profiles[y];
    const u = Math.max(.005, Math.min(.995, (x - to.left) / Math.max(1, to.right - to.left)));
    const sx = from.left + (from.right - from.left) * u;
    const color = sampleColor(source, sx, sy);
    if (color) return color;
    // Extend original material from the nearest actual painted sample, never
    // silently replace an unpainted area by black/flat generated color.
    const row = Math.max(first, Math.min(last, Math.round(sy))), span = spans[row];
    if (span) for (let distance = 0; distance <= source.width; distance++) {
      for (const px of [Math.round(sx) - distance, Math.round(sx) + distance]) if (px >= span.left && px <= span.right && source.data[(row * source.width + px) * 4 + 3] > 128) return sampleColor(source, px, row)!;
    }
    throw new Error(`No source texture sample near ${sx},${sy}`);
  };
};

/** One-pixel soft under-rock bleed. No arbitrary exterior background fill. */
export const featherSupport = (mask: Uint8Array, width: number, height: number, enclosure: Array<Span | null>) => {
  const alpha = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) if (mask[i]) alpha[i] = 255;
  for (let i = 0; i < mask.length; i++) if (mask[i]) {
    const x = i % width, y = Math.floor(i / width);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const span = enclosure[ny], next = ny * width + nx;
      if (span && nx > span.left && nx < span.right && !mask[next]) alpha[next] = 128;
    }
  }
  return alpha;
};

export const fitLayers = (rock: Raster, chamber: Raster, conduit: Raster, options: {seed: {x: number; y: number}; chamberKnots: ReadonlyArray<readonly [number, number]>; conduitKnots: ReadonlyArray<readonly [number, number]>; chamberFade: readonly [number, number]; conduitFade: readonly [number, number]; blend: readonly [number, number]}) => {
  if ([chamber, conduit].some(image => image.width !== rock.width || image.height !== rock.height)) throw new Error('Canvas registration mismatch');
  const opening = extractOpening(rock, options.seed), support = featherSupport(opening.mask, rock.width, rock.height, opening.enclosure);
  const chamberTexture = warpMaterial(chamber, opening.spans, options.chamberKnots), conduitTexture = warpMaterial(conduit, opening.spans, options.conduitKnots);
  const make = (): Raster => ({width: rock.width, height: rock.height, data: new Uint8Array(rock.width * rock.height * 4)});
  const chamberFit = make(), conduitFit = make();
  for (let i = 0; i < support.length; i++) if (support[i]) {
    const x = i % rock.width, y = Math.floor(i / rock.width);
    const blend = smooth((y - options.blend[0]) / (options.blend[1] - options.blend[0]));
    const chamberColor = chamberTexture(x, y), conduitColor = conduitTexture(x, y);
    const chamberOpacity = smooth((y - options.chamberFade[0]) / (options.chamberFade[1] - options.chamberFade[0]));
    const conduitOpacity = 1 - smooth((y - options.conduitFade[0]) / (options.conduitFade[1] - options.conduitFade[0]));
    for (const image of [chamberFit, conduitFit]) for (let c = 0; c < 3; c++) image.data[i * 4 + c] = Math.round(conduitColor[c] * (1 - blend) + chamberColor[c] * blend);
    chamberFit.data[i * 4 + 3] = Math.round(support[i] * chamberOpacity);
    conduitFit.data[i * 4 + 3] = Math.round(support[i] * conduitOpacity);
  }
  return {chamber: chamberFit, conduit: conduitFit, opening, support};
};

export const composite = (back: Raster, front: Raster): Raster => {
  if (back.width !== front.width || back.height !== front.height) throw new Error('Composite canvas mismatch');
  const result: Raster = {width: back.width, height: back.height, data: new Uint8Array(back.data.length)};
  for (let i = 0; i < back.width * back.height; i++) {
    const a = alphaAt(front, i), b = alphaAt(back, i), total = a + b * (1 - a);
    for (let c = 0; c < 3; c++) result.data[i * 4 + c] = total ? Math.round((front.data[i * 4 + c] * a + back.data[i * 4 + c] * b * (1 - a)) / total) : 0;
    result.data[i * 4 + 3] = Math.round(total * 255);
  }
  return result;
};

export const coverageReport = (rock: Raster, opening: Uint8Array, magma: Raster, splitY: number) => {
  const region = () => ({pixels: 0, missingPixels: 0, missingAlphaEquivalentPixels: 0, largestMissingRegion: 0});
  const chamber = region(), conduit = region(), missing = new Uint8Array(opening.length);
  let spillPixels = 0, spillAlpha = 0, visibleSpillPixels = 0, visibleSpillAlpha = 0, exteriorSpillPixels = 0;
  const solid = new Uint8Array(opening.length);
  for (let i = 0; i < solid.length; i++) solid[i] = rock.data[i * 4 + 3] >= 128 ? 1 : 0;
  const spans = rowSpans(solid, rock.width, rock.height);
  for (let i = 0; i < opening.length; i++) {
    const y = Math.floor(i / rock.width), x = i % rock.width, alpha = alphaAt(magma, i);
    if (opening[i]) {
      const target = y >= splitY ? chamber : conduit;
      target.pixels++; target.missingAlphaEquivalentPixels += 1 - alpha;
      if (alpha < 250 / 255) {target.missingPixels++; missing[i] = 1;}
    } else if (alpha > 0) {
      spillPixels++; spillAlpha += alpha;
      const visible = alpha * (1 - alphaAt(rock, i));
      visibleSpillAlpha += visible;
      if (visible > .05) visibleSpillPixels++;
      const span = spans[y];
      if (!span || x <= span.left || x >= span.right) exteriorSpillPixels++;
    }
  }
  for (let i = 0; i < missing.length; i++) if (missing[i]) {
    const chamberRegion = Math.floor(i / rock.width) >= splitY;
    const queue = [i]; missing[i] = 0;
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head], x = index % rock.width;
      for (const next of [index - 1, index + 1, index - rock.width, index + rock.width]) if (next >= 0 && next < missing.length && Math.abs(next % rock.width - x) <= 1 && (Math.floor(next / rock.width) >= splitY) === chamberRegion && missing[next]) {missing[next] = 0; queue.push(next);}
    }
    const target = Math.floor(i / rock.width) >= splitY ? chamber : conduit;
    target.largestMissingRegion = Math.max(target.largestMissingRegion, queue.length);
  }
  const finish = (value: ReturnType<typeof region>) => ({...value, missingAlphaEquivalentPixels: Number(value.missingAlphaEquivalentPixels.toFixed(4)), coveragePercent: Number((100 * (1 - value.missingPixels / value.pixels)).toFixed(6))});
  return {chamber: finish(chamber), conduit: finish(conduit), spill: {pixelsWithAnyAlphaOutsideOpening: spillPixels, alphaEquivalentPixelsOutsideOpening: Number(spillAlpha.toFixed(4)), visiblePixelsOutsideOpeningAboveFivePercent: visibleSpillPixels, visibleAlphaEquivalentPixelsOutsideOpeningAfterRock: Number(visibleSpillAlpha.toFixed(4)), exteriorBackgroundPixelsWithSpill: exteriorSpillPixels}};
};
