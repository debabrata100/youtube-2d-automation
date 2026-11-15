import {z} from 'zod';
import {assetSchema} from '../assets/registry';
import {cameraSchema} from '../camera/presets';
import {motionSchema} from '../motion/presets';
import {groupSchema, layerAssetIds, trackSchema} from './layers';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit hex color');
const subject = z.object({asset: z.string().min(1), x: z.number().min(.1).max(.9).default(.5), y: z.number().min(.25).max(.85).default(.56), size: z.number().min(.08).max(.9).default(.65), timeOffset: z.number().int().nonnegative().optional()}).strict();
const base = {
  narrationCue: z.object({beatId:z.string().min(1),phraseIndex:z.number().int().nonnegative().default(0),edge:z.enum(['start','end']).default('start')}).strict().optional(),
  animationDurationFrames:z.number().int().min(12).max(18000).optional(),
  id: z.string().min(1), durationFrames: z.number().int().min(12).max(18000),
  caption: z.object({text: z.string().min(1).max(180), preset: z.enum(['headline', 'body', 'closing']).default('headline'), kicker: z.string().max(60).default(''), color: color.default('#fff4df'), hold: z.boolean().optional()}).strict(),
  camera: cameraSchema.default({preset: 'slow-push', amount: .1, offsetX: .07, offsetY: 0}),
  motion: motionSchema.default({preset: 'gentle-drift', amplitude: .025, cycles: 1}),
  seed: z.number().int().min(0).max(4294967295).default(1),
  transitionFrames: z.number().int().min(0).max(30).default(6),
  environmentDim: z.number().min(0).max(.65).optional(),
};
const orbitalConfig = z.object({primary: subject, secondary: subject.optional(), count: z.number().int().min(0).max(100).default(24), radiusX: z.number().min(.05).max(.4).default(.3), radiusY: z.number().min(.02).max(.2).default(.08), cycles: z.number().int().min(1).max(4).default(1), particleMotion: z.enum(['orbit', 'rise']).optional(), particleColor: color.optional(), particleOrigin: z.object({x: z.number().min(0).max(1), y: z.number().min(0).max(1)}).strict().optional(), particleStartFrame: z.number().int().nonnegative().optional()}).strict();
export const genericSceneSchema = z.discriminatedUnion('template', [
  z.object({...base, template: z.literal('hero-reveal'), config: z.object({primary: subject}).strict()}).strict(),
  z.object({...base, template: z.literal('orbital-environment'), config: orbitalConfig}).strict(),
  z.object({...base, template: z.literal('transformation'), config: z.object({primary: subject, fromScale: z.number().min(.1).max(1).default(.35), toScale: z.number().min(.1).max(1).default(1), count: z.number().int().min(1).max(100).default(24)}).strict()}).strict(),
  z.object({...base, template: z.literal('comparison'), config: z.object({left: subject, right: subject, leftLabel: z.string().max(50).default(''), rightLabel: z.string().max(50).default('')}).strict()}).strict(),
  z.object({...base, template: z.literal('summary'), config: z.object({subjects: z.array(subject).min(1).max(5)}).strict()}).strict(),
]);
export type GenericScene = z.infer<typeof genericSceneSchema>;
export type SubjectConfig = z.infer<typeof subject>;
export const sceneAssetIds = (scene: GenericScene): string[] => {
  switch (scene.template) {
    case 'comparison': return [scene.config.left.asset, scene.config.right.asset];
    case 'summary': return scene.config.subjects.map(item => item.asset);
    case 'orbital-environment': return [scene.config.primary.asset, ...(scene.config.secondary ? [scene.config.secondary.asset] : [])];
    default: return [scene.config.primary.asset];
  }
};
export const storyboardSchema = z.object({
  schemaVersion: z.literal('2.1'), projectId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/), title: z.string().min(1),
  format: z.object({width: z.number().int().min(320).max(3840), height: z.number().int().min(320).max(3840), fps: z.number().int().min(1).max(60)}).strict().refine(f => f.width % 2 === 0 && f.height % 2 === 0, 'H.264 dimensions must be even'),
  styleId: z.literal('cinematic-illustrated'),
  background: color.default('#10152e'), accent: color.default('#ffd166'),
  assets: z.array(assetSchema).min(1).max(100), scenes: z.array(genericSceneSchema).min(1).max(100),
  groups: z.array(groupSchema).max(30).optional(),
  backdrop: z.object({asset: z.string().min(1), decoration: z.boolean().default(false), dim: z.number().min(0).max(.8).default(0), motion:z.object({scale:trackSchema(1,1.2),x:trackSchema(-100,100),y:trackSchema(-100,100)}).strict().optional()}).strict().optional(),
  narrationTiming:z.object({minimumSceneFrames:z.number().int().min(12).max(900).default(45),maximumDeviationSeconds:z.number().min(0).max(2).default(.2)}).strict().optional(),
  crossfadeFrames: z.number().int().min(2).max(20).optional(),
}).strict().superRefine((storyboard, ctx) => {
  const assets = new Set<string>(); const scenes = new Set<string>();
  storyboard.assets.forEach((asset, i) => {
    if (assets.has(asset.id)) ctx.addIssue({code: 'custom', path: ['assets', i, 'id'], message: `Duplicate asset ID: ${asset.id}`});
    assets.add(asset.id);
  });
  const references = new Set(assets);
  storyboard.groups?.forEach((group, i) => {
    if (references.has(group.id)) ctx.addIssue({code: 'custom', path: ['groups', i, 'id'], message: `Duplicate group/asset ID: ${group.id}`});
    references.add(group.id);
    for (const layer of group.layers) for (const id of layerAssetIds(layer)) if (!assets.has(id)) ctx.addIssue({code: 'custom', path: ['groups', i, 'layers', layer.id], message: `Missing layer asset: ${id}`});
  });
  if (storyboard.backdrop && !assets.has(storyboard.backdrop.asset)) ctx.addIssue({code: 'custom', path: ['backdrop', 'asset'], message: 'Missing backdrop asset'});
  storyboard.scenes.forEach((scene, i) => {
    if (scenes.has(scene.id)) ctx.addIssue({code: 'custom', path: ['scenes', i, 'id'], message: `Duplicate scene ID: ${scene.id}`});
    scenes.add(scene.id);
    for (const id of sceneAssetIds(scene)) if (!references.has(id)) ctx.addIssue({code: 'custom', path: ['scenes', i, 'config'], message: `Missing asset: ${id}`});
    if (storyboard.crossfadeFrames && scene.durationFrames <= storyboard.crossfadeFrames) ctx.addIssue({code: 'custom', path: ['scenes', i], message: 'Scene must exceed crossfade duration'});
    if (scene.transitionFrames * 2 >= scene.durationFrames) ctx.addIssue({code: 'custom', path: ['scenes', i, 'transitionFrames'], message: 'Transition envelopes must leave a visible scene hold'});
    if (scene.motion.preset === 'particle-convergence' && scene.template !== 'transformation') ctx.addIssue({code: 'custom', path: ['scenes', i, 'motion'], message: 'particle-convergence requires the transformation template'});
  });
});
export type Storyboard = z.infer<typeof storyboardSchema>;
export const parseStoryboard = (value: unknown): Storyboard => storyboardSchema.parse(value);
