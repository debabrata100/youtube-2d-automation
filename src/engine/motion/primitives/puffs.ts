import {seededRandom} from '../../../motion/particles';
import {lifeTrackAt} from './particles';
import {easeMotion, type PuffsConfig} from './schema';

export type PuffLobe = {angle: number; distance: number; size: number};
export type PuffRecord = {
  id: number;
  birth: number;
  life: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  travel: number;
  radius: number;
  spin: number;
  lobes: PuffLobe[];
};

/** All births, directions and lobe silhouettes are fixed before any frame is sampled. */
export const compilePuffs = (config: PuffsConfig): PuffRecord[] => {
  const random = seededRandom(config.seed);
  const between = (range: readonly [number, number]) => range[0] + random() * (range[1] - range[0]);
  return Array.from({length: config.count}, (_, id) => {
    const angle = (config.direction.angleDegrees + (random() - .5) * config.direction.spreadDegrees) * Math.PI / 180;
    // Evenly spaced births with seeded jitter keep the column continuous without visible gaps.
    const slot = (config.endFrame - config.startFrame) / config.count;
    const birth = config.startFrame + slot * (id + random() * .8);
    const lobes = Array.from({length: config.lobes}, (_, i) => ({
      angle: (i / config.lobes) * Math.PI * 2 + (random() - .5) * .9,
      distance: config.lobes === 1 ? 0 : .38 + random() * .26,
      size: config.lobes === 1 ? 1 : .55 + random() * .3,
    }));
    return {
      id,
      birth,
      life: between(config.lifetimeFrames),
      x: config.emitter.x + (random() - .5) * config.emitter.width,
      y: config.emitter.y,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      travel: between(config.travel),
      radius: between(config.radius),
      spin: (random() - .5) * 1.2,
      lobes,
    };
  });
};

/**
 * Normalized centre (host fractions), radius (fraction of the shorter side) and opacity at a frame.
 * Travel is measured in shorter-side units so the column keeps its shape in any aspect ratio.
 */
export const puffAt = (puff: PuffRecord, config: PuffsConfig, frame: number, width = 1, height = 1) => {
  const age = frame - puff.birth;
  const active = age >= 0 && age < puff.life;
  const t = Math.max(0, Math.min(1, age / puff.life));
  const eased = easeMotion(t, config.easing);
  const unit = Math.min(width, height);
  const distance = puff.travel * eased * unit;
  return {
    active,
    x: puff.x + (puff.dx * distance + config.wind.x * t * unit) / width,
    y: puff.y + (puff.dy * distance + config.wind.y * t * unit) / height,
    radius: puff.radius * (1 + (config.growth - 1) * easeMotion(t, 'ease-out-cubic')),
    rotation: puff.spin * t * 180 / Math.PI,
    opacity: active ? lifeTrackAt(config.opacity, t) : 0,
  };
};
