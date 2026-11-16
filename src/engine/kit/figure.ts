/**
 * Stick-figure rig: pose presets, pose blending over time and skeleton geometry. Pure and deterministic.
 * Angles are absolute screen angles in degrees: 0 = straight down, 90 = screen right, -90 = screen left, 180 = up.
 * The figure faces the camera; `facing` only mirrors it and nudges the eyes.
 */
import {easeMotion} from '../motion/primitives/schema';

export const POSE_IDS = ['stand', 'wave', 'point-right', 'point-left', 'shrug', 'cheer', 'panic', 'scared', 'hands-on-hips', 'think',
  'float', 'tumble', 'reach', 'cower', 'lie', 'walk', 'run', 'flap'] as const;
export type PoseId = typeof POSE_IDS[number];
export const FACE_IDS = ['neutral', 'happy', 'shocked', 'scared', 'sad', 'dizzy', 'angry', 'smug', 'pain', 'scream', 'grin', 'puffed', 'tongue', 'asleep'] as const;
export const ACCESSORY_IDS = ['mask', 'coat', 'wings'] as const;
export type Accessory = {item: typeof ACCESSORY_IDS[number]; from: number; until?: number};
/** Accessory worn at a frame: from `from` (inclusive) until `until` (exclusive, optional). */
export const accessoryOn = (list: Accessory[] | undefined, item: Accessory['item'], frame: number) =>
  (list ?? []).some(a => a.item === item && frame >= a.from && (a.until === undefined || frame < a.until));
export type FaceId = typeof FACE_IDS[number];

/** [upper, lower] absolute limb angles. */
type Limb = [number, number];
export type Pose = {lean: number; head: number; armL: Limb; armR: Limb; legL: Limb; legR: Limb; rotate: number; lift: number; squash: number};

const P = (armL: Limb, armR: Limb, legL: Limb = [-10, -6], legR: Limb = [10, 6], extra: Partial<Pose> = {}): Pose =>
  ({lean: 0, head: 0, armL, armR, legL, legR, rotate: 0, lift: 0, squash: 0, ...extra});

export const POSES: Record<Exclude<PoseId, 'walk' | 'run' | 'flap'>, Pose> = {
  stand: P([-28, -16], [28, 16]),
  wave: P([-28, -16], [112, 148], undefined, undefined, {head: 6}),
  'point-right': P([-28, -16], [95, 92], undefined, undefined, {head: 8}),
  'point-left': P([-95, -92], [28, 16], undefined, undefined, {head: -8}),
  shrug: P([-62, -150], [62, 150], undefined, undefined, {head: 10}),
  cheer: P([-118, -146], [118, 146], [-14, -8], [14, 8], {lift: .04}),
  panic: P([-132, -100], [140, 172], [-26, -14], [24, 12], {head: -6}),
  scared: P([-28, 48], [28, -48], [-22, 6], [22, -6], {lift: -.04, squash: .06}),
  'hands-on-hips': P([-48, 42], [48, -42], [-14, -8], [14, 8]),
  think: P([-30, 40], [28, -150], undefined, undefined, {head: -8}),
  float: P([-108, -122], [108, 122], [-32, -48], [32, 48], {rotate: -8, lift: .06}),
  tumble: P([-130, -96], [138, 170], [-40, -70], [36, 60], {rotate: 80, lift: .06}),
  reach: P([-28, -16], [150, 165], [-8, -4], [8, 4], {lift: .02, lean: 4}),
  cower: P([-40, 60], [40, -60], [-30, 20], [30, -20], {lift: -.1, squash: .12, head: 4}),
  /** Lying flat on the ground, head to screen right; pair with a layer y drop of about 0.45 x height. */
  lie: P([-24, -10], [20, 6], [-4, -2], [4, 2], {rotate: 90, head: 6}),
};

/** Walk and run are procedural cycles: limbs swing with the frame, plus a small vertical bob. */
export const cyclePose = (id: 'walk' | 'run', frame: number): Pose => {
  const period = id === 'walk' ? 24 : 14, swing = id === 'walk' ? 24 : 40, t = (frame / period) * Math.PI * 2, s = Math.sin(t);
  const knee = (v: number) => (id === 'run' ? Math.max(0, v) * 30 : Math.max(0, v) * 14);
  return P([-12 - swing * .6 * s, -6 - swing * .5 * s + (id === 'run' ? 40 : 0)], [12 + swing * .6 * s, 6 + swing * .5 * s - (id === 'run' ? 40 : 0)],
    [-6 + swing * s, -6 + swing * s - knee(s)], [6 - swing * s, 6 - swing * s - knee(-s)],
    {lift: Math.abs(Math.cos(t)) * (id === 'run' ? .03 : .015), lean: id === 'run' ? 6 : 0});
};

/** Flapping flight: arms sweep between raised and level, legs trail, the body bobs with each beat. */
export const flapPose = (frame: number): Pose => {
  const t = (frame / 16) * Math.PI * 2, s = Math.sin(t), up = (s + 1) / 2;
  return P([-150 + up * 75, -165 + up * 85], [150 - up * 75, 165 - up * 85], [-12, -18], [12, 18], {lift: .05 + up * .03, lean: 4});
};

export const poseOf = (id: PoseId, frame: number): Pose => (id === 'walk' || id === 'run' ? cyclePose(id, frame) : id === 'flap' ? flapPose(frame) : POSES[id]);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Angle blend along the shorter way round, so +170 to -170 turns 20 degrees, not 340. */
const lerpAngle = (a: number, b: number, t: number) => { const d = ((b - a + 540) % 360) - 180; return a + d * t; };
const mixLimb = (a: Limb, b: Limb, t: number): Limb => [lerpAngle(a[0], b[0], t), lerpAngle(a[1], b[1], t)];
export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  lean: lerp(a.lean, b.lean, t), head: lerp(a.head, b.head, t), armL: mixLimb(a.armL, b.armL, t), armR: mixLimb(a.armR, b.armR, t),
  legL: mixLimb(a.legL, b.legL, t), legR: mixLimb(a.legR, b.legR, t), rotate: lerp(a.rotate, b.rotate, t), lift: lerp(a.lift, b.lift, t), squash: lerp(a.squash, b.squash, t),
});

export type PoseKey = {frame: number; pose: PoseId; blend: number; ease: Parameters<typeof easeMotion>[1]};
/** Pose at a frame: each key starts blending from the previous pose at its frame and settles `blend` frames later. */
export const poseAt = (keys: PoseKey[], frame: number): Pose => {
  if (!keys.length) return POSES.stand;
  let current = poseOf(keys[0].pose, frame);
  for (let i = 1; i < keys.length && frame >= keys[i].frame; i++) {
    const k = keys[i], t = easeMotion((frame - k.frame) / Math.max(1, k.blend), k.ease);
    current = mixPose(current, poseOf(k.pose, frame), Math.min(1, t));
  }
  return current;
};

export const faceAt = (keys: Array<{frame: number; face: FaceId}>, frame: number): FaceId => {
  let face: FaceId = keys[0]?.face ?? 'neutral';
  for (const k of keys) if (frame >= k.frame) face = k.face;
  return face;
};

/** Seeded blink: closed for 3 frames roughly every 2.5-4.5 s. */
export const isBlinking = (frame: number, seed: number) => {
  let t = 40 + (seed % 37);
  for (let i = 0; t <= frame + 3 && i < 2000; i++) {
    if (frame >= t && frame < t + 3) return true;
    t += 75 + ((seed * 7919 + i * 104729) % 61);
  }
  return false;
};

export type Skeleton = {hip: Pt; neck: Pt; head: Pt; headR: number; shoulder: Pt; elbowL: Pt; handL: Pt; elbowR: Pt; handR: Pt; kneeL: Pt; footL: Pt; kneeR: Pt; footR: Pt};
type Pt = {x: number; y: number};
/** Proportions as fractions of total height: big head, short body, like a hand-drawn explainer figure. */
export const PROPORTIONS = {head: .13, torso: .3, upperArm: .15, forearm: .14, thigh: .22, shin: .21};
const dir = (deg: number, len: number) => ({x: Math.sin(deg * Math.PI / 180) * len, y: Math.cos(deg * Math.PI / 180) * len});
const add = (a: Pt, b: Pt) => ({x: a.x + b.x, y: a.y + b.y});

/** Skeleton in local coordinates: feet baseline at y = 0, centred on x = 0, total standing height h. */
export const skeleton = (pose: Pose, h: number): Skeleton => {
  const p = PROPORTIONS, sq = 1 - pose.squash, legs = (p.thigh + p.shin) * h;
  const hip = {x: 0, y: -legs * sq - pose.lift * h};
  const neck = add(hip, {x: Math.sin(pose.lean * Math.PI / 180) * p.torso * h, y: -Math.cos(pose.lean * Math.PI / 180) * p.torso * h * sq});
  const headR = p.head * h, head = add(neck, {x: Math.sin(pose.head * Math.PI / 180) * headR, y: -headR * .95});
  const shoulder = {x: lerp(hip.x, neck.x, .84), y: lerp(hip.y, neck.y, .84)};
  const elbowL = add(shoulder, dir(pose.armL[0], p.upperArm * h)), handL = add(elbowL, dir(pose.armL[1], p.forearm * h));
  const elbowR = add(shoulder, dir(pose.armR[0], p.upperArm * h)), handR = add(elbowR, dir(pose.armR[1], p.forearm * h));
  const kneeL = add(hip, dir(pose.legL[0], p.thigh * h * sq)), footL = add(kneeL, dir(pose.legL[1], p.shin * h * sq));
  const kneeR = add(hip, dir(pose.legR[0], p.thigh * h * sq)), footR = add(kneeR, dir(pose.legR[1], p.shin * h * sq));
  return {hip, neck, head, headR, shoulder, elbowL, handL, elbowR, handR, kneeL, footL, kneeR, footR};
};
