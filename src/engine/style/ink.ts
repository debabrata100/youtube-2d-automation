/**
 * Pre-baked, seamless displacement-noise tiles for the hand-drawn "line boil". Using tiled images instead of
 * feTurbulence keeps the look but avoids computing procedural noise over the whole frame on every frame.
 * Tiles are 128 px value noise (R = x shift, G = y shift, 4 + 8 cells), generated once with a fixed seed.
 */
import n0 from './ink/noise-0.png';
import n1 from './ink/noise-1.png';
import n2 from './ink/noise-2.png';
import n3 from './ink/noise-3.png';

export const NOISE_TILES = [n0, n1, n2, n3];
/** Tile index and offset (fractions of a tile) for a boil tick: deterministic, cycles tiles and shifts them. */
export const boilTile = (tick: number) => {
  const h = (Math.imul(tick + 1, 2654435761) >>> 0) / 4294967296, g = (Math.imul(tick + 7, 40503) >>> 0) % 1000 / 1000;
  return {index: ((tick % 4) + 4) % 4, dx: h, dy: g};
};
