import {z} from 'zod';
import {easingNameSchema, pathSchema} from '../motion/primitives/schema';
import {ACCESSORY_IDS, FACE_IDS, POSE_IDS} from './figure';

/** Kit coordinates are fractions of the host group: x of width, y of height. Small overshoot is allowed for bleed. */
const n = z.number().min(-.5).max(1.5);
const seed = z.number().int().min(0).max(4294967295).default(1);
const size = (min: number, max: number) => z.number().min(min).max(max);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit hex colour (or a theme @ref)');
const keyFrame = z.number().int().min(0).max(18000);
const increasing = (keys: Array<{frame: number}>) => keys.every((k, i) => !i || k.frame > keys[i - 1].frame);

export const mountainShapeSchema = z.object({
  cx: n, baseY: n,
  baseWidth: size(.05, 1.4),
  height: size(.03, 1),
  /** Crater opening as a fraction of base width; 0 gives a peak. */
  crater: size(0, .4).default(0),
  /** 0 = straight flanks, 1 = strongly concave (steep summit, wide base). */
  concavity: size(0, 1).default(.5),
}).strict();

const ellipse = z.object({cx: n, cy: n, rx: size(.005, 1), ry: size(.005, 1)}).strict();

export const kitSchema = z.discriminatedUnion('type', [
  z.object({type: z.literal('sky'), horizon: n.default(.62), stars: z.number().int().min(0).max(160).default(0), seed}).strict(),
  z.object({type: z.literal('sun'), x: n, y: n, radius: size(.005, .3), glow: size(1, 6).default(2.6)}).strict(),
  z.object({
    type: z.literal('ridges'), seed, layers: z.number().int().min(1).max(4).default(3), top: n, bottom: n,
    peaks: z.number().int().min(3).max(16).default(7), roughness: size(0, 1).default(.5),
    /** Horizontal drift (fraction of width per frame) of the nearest layer; farther layers move proportionally less. */
    drift: z.number().min(-.004).max(.004).default(0),
  }).strict(),
  z.object({type: z.literal('ground'), top: n, seed, rocks: z.number().int().min(0).max(40).default(12)}).strict(),
  mountainShapeSchema.extend({
    type: z.literal('mountain'),
    part: z.enum(['full', 'left', 'right', 'rim-front']).default('full'),
    gullies: z.number().int().min(0).max(12).default(5),
    snow: size(0, .6).default(0),
    shadow: z.boolean().default(true),
    seed,
  }).strict(),
  z.object({
    type: z.literal('strata'),
    mountain: mountainShapeSchema.optional(),
    groundY: n, left: n, right: n, bottom: n,
    bowl: size(0, .3).default(.12),
    layers: z.number().int().min(2).max(10).default(6),
    wave: size(0, .04).default(.012),
    cavities: z.array(ellipse).max(4).default([]),
    channels: z.array(z.object({path: pathSchema, width: size(.002, .08)}).strict()).max(4).default([]),
    seed,
  }).strict(),
  z.object({type: z.literal('blob'), cx: n, cy: n, rx: size(.005, 1), ry: size(.005, 1), seed, irregularity: size(0, .4).default(.15), fill: z.enum(['hot', 'water', 'rock', 'cloud']).default('hot'), bubbles: z.number().int().min(0).max(20).default(4)}).strict(),
  z.object({type: z.literal('cloud'), x: n, y: n, width: size(.02, 1.6), seed, lobes: z.number().int().min(3).max(9).default(6), drift: z.number().min(-.004).max(.004).default(0)}).strict(),
  z.object({type: z.literal('water'), x: n, y: n, width: size(.01, 2), height: size(.01, 1.5), waves: z.number().int().min(0).max(8).default(3), periodFrames: z.number().min(30).max(600).default(120), seed}).strict(),
  z.object({type: z.literal('glow'), x: n, y: n, rx: size(.005, 2), ry: size(.005, 2), tone: z.enum(['hot', 'sun', 'sky']).default('hot')}).strict(),
  /** Stick figure / astronaut. x, y = feet position; poses blend over `blend` frames from each key (frames may be word anchors). */
  z.object({
    type: z.literal('figure'), x: n, y: n, height: size(.05, 1.2), facing: z.enum(['left', 'right']).default('right'),
    outfit: z.enum(['stick', 'astronaut']).default('stick'),
    poses: z.array(z.object({frame: keyFrame, pose: z.enum(POSE_IDS), blend: z.number().int().min(1).max(60).default(8), ease: easingNameSchema.default('smoothstep')}).strict())
      .min(1).max(24).refine(increasing, 'Pose frames must strictly increase'),
    faces: z.array(z.object({frame: keyFrame, face: z.enum(FACE_IDS)}).strict()).max(24).default([]).refine(increasing, 'Face frames must strictly increase'),
    blink: z.boolean().default(true), shiver: z.number().min(0).max(12).default(0), seed, suit: hex.optional(), visor: hex.optional(),
    /** Worn items (mask, coat, wings); each appears at `from` and optionally disappears at `until` (frames may be word anchors). */
    accessories: z.array(z.object({item: z.enum(ACCESSORY_IDS), from: keyFrame.default(0), until: keyFrame.optional()}).strict()).max(6).default([]),
    coat: hex.optional(),
    /** Astronaut helmet on/off keys (default: on). */
    helmet: z.array(z.object({frame: keyFrame, on: z.boolean()}).strict()).max(12).default([]).refine(increasing, 'Helmet frames must strictly increase'),
    /** Skin flush 0-1 (sunburn, embarrassment), interpolated between keys. */
    flush: z.array(z.object({frame: keyFrame, value: z.number().min(0).max(1)}).strict()).max(12).default([]).refine(increasing, 'Flush frames must strictly increase'),
  }).strict(),
  /** Cartoon planet: base colour, wavy bands (gas giants), craters, optional ring and glow. radius is a fraction of the group's shorter side. */
  z.object({
    type: z.literal('planet'), x: n, y: n, radius: size(.02, .6), base: hex, bands: z.array(hex).max(8).default([]),
    craters: z.number().int().min(0).max(30).default(0), ring: z.boolean().default(false), shade: size(0, .5).default(.18),
    spin: z.number().min(-4).max(4).default(0), seed, glow: hex.optional(),
  }).strict(),
  /** Hand-drawn props. size is a fraction of the group's shorter side; thermometer level keys (0-1) interpolate linearly. */
  z.object({
    type: z.literal('prop'), item: z.enum(['thermometer', 'pressure-arrows', 'motion-lines', 'exclaim', 'question', 'check', 'cross', 'counter', 'stamp', 'vignette', 'station', 'helmet', 'doodle-stars', 'chamber',
      'cliff', 'geyser', 'plume', 'radiation-meter', 'radiation-belt', 'battery', 'airbag', 'small-moon', 'ice-cutaway', 'frost',
      'flag', 'speedometer', 'race-car', 'sunglasses', 'mug', 'calendar', 'sign', 'igloo', 'rocket', 'fish', 'drop', 'tumbleweed', 'thermos', 'shovel', 'magnifier', 'smell-lines', 'bar', 'ruler', 'moon-map', 'system-map', 'solar-strip', 'probe', 'signal', 'bulb', 'crescent', 'orbit-ring', 'town', 'lion', 'zebra', 'coral', 'plankton', 'tide-gauge', 'tilt-dial', 'earth-axis', 'impact', 'dino', 'reflector', 'bed', 'stir', 'clock', 'eclipse', 'moonbeam', 'young-earth', 'bee', 'flower', 'tree', 'tardigrade', 'vent', 'shell', 'snowfall', 'night-half', 'mushroom', 'sparkle', 'clock-time', 'rope', 'pulse', 'span', 'sky', 'streetlight', 'arrow', 'ice-layer', 'city-lights', 'tide-bulge', 'caption']),
    x: n, y: n, size: size(.01, 1), rotation: z.number().min(-360).max(360).default(0), color: hex.optional(), ink: hex.optional(), count: z.number().int().min(1).max(40).default(6),
    level: z.array(z.object({frame: keyFrame, value: z.number().min(0).max(1)}).strict()).min(1).max(12).refine(increasing, 'Level frames must strictly increase').default([{frame: 0, value: .6}]),
    /** Counter numbers: each key holds until the next, or counts down/up to it in whole steps when ramp is set. */
    values: z.array(z.object({frame: keyFrame, value: z.number().int().min(-9999).max(9999), ramp: z.boolean().default(false)}).strict()).max(40).default([]).refine(increasing, 'Value frames must strictly increase'),
    /** Counter caption or stamp text. */
    text: z.string().min(1).max(24).optional(),
    /** Pressure arrows: squeeze in, or burst out. */
    direction: z.enum(['in', 'out']).default('in'),
    /** System map: moon names and colours (inner to outer), the highlighted index, Saturn-style ring, radiation belt. */
    labels: z.array(z.string().min(1).max(14)).max(8).optional(), colors: z.array(hex).max(8).optional(),
    highlight: z.number().int().min(0).max(9).optional(), ring: z.boolean().default(false), belt: z.boolean().default(false),
    /** Tilt dial: shaded band [lo, hi] in degrees. */
    range: z.tuple([z.number().min(0).max(90), z.number().min(0).max(90)]).optional(),
  }).strict(),
  /** Hand-drawn ground: outlined horizon with bumps, optional planet curvature, speckles and horizon rocks. */
  z.object({
    type: z.literal('terrain'), top: n, curve: size(0, .5).default(0), fill: hex, detail: hex,
    rocks: z.number().int().min(0).max(12).default(3), bumps: z.number().int().min(1).max(16).default(5), seed,
  }).strict(),
]);
export type KitConfig = z.infer<typeof kitSchema>;
export type MountainShape = z.infer<typeof mountainShapeSchema>;
