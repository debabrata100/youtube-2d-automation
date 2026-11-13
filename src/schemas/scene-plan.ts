import {z} from 'zod';

export const templateSchema = z.enum(['space-reveal', 'particle-orbit', 'accretion', 'planet-reveal', 'summary']);
export const transitionSchema = z.enum(['crossfade', 'wipe-left', 'zoom']);

const visualSchema = z.object({
  accent: z.string(),
  density: z.number().int().min(8).max(180),
  seed: z.number().int(),
  glow: z.number().min(0).max(2).default(1),
});

const animationSchema = z.object({
  cameraZoom: z.number().min(0.5).max(2),
  orbitSpeed: z.number().min(0).max(0.2),
  direction: z.enum(['clockwise', 'counterclockwise']).default('clockwise'),
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  template: templateSchema,
  startFrame: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive(),
  title: z.string().min(1),
  transition: transitionSchema,
  visual: visualSchema,
  animation: animationSchema,
});

export const scenePlanSchema = z.object({
  schemaVersion: z.literal('1.0'),
  video: z.object({
    title: z.string(), width: z.number().int().positive(), height: z.number().int().positive(),
    fps: z.number().int().positive(), durationFrames: z.number().int().positive(),
  }),
  scenes: z.array(sceneSchema).min(1),
}).superRefine((plan, ctx) => {
  const ids = new Set<string>();
  let cursor = 0;
  for (const [index, scene] of plan.scenes.entries()) {
    if (ids.has(scene.id)) ctx.addIssue({code: 'custom', path: ['scenes', index, 'id'], message: `Duplicate scene id: ${scene.id}`});
    ids.add(scene.id);
    if (scene.startFrame !== cursor) ctx.addIssue({code: 'custom', path: ['scenes', index, 'startFrame'], message: `Timeline gap or overlap: expected frame ${cursor}`});
    if (scene.startFrame + scene.durationFrames > plan.video.durationFrames) ctx.addIssue({code: 'custom', path: ['scenes', index], message: 'Scene exceeds video duration'});
    cursor = scene.startFrame + scene.durationFrames;
  }
  if (cursor !== plan.video.durationFrames) ctx.addIssue({code: 'custom', path: ['scenes'], message: `Timeline ends at ${cursor}, expected ${plan.video.durationFrames}`});
});

export type ScenePlan = z.infer<typeof scenePlanSchema>;
export type SceneConfig = z.infer<typeof sceneSchema>;

export const parseScenePlan = (value: unknown): ScenePlan => scenePlanSchema.parse(value);
