import {z} from 'zod';
import {easingNameSchema, motionEffectSchema, type EasingName} from '../motion/primitives/schema';
import {kitSchema} from '../kit/schema';

export const trackSchema = (min: number, max: number) => z.array(z.object({frame: z.number().int().min(0).max(18000), value: z.number().min(min).max(max), ease: easingNameSchema.optional()}).strict()).min(1).max(40).refine(keys => keys.every((key, i) => !i || key.frame > keys[i - 1].frame), 'Track frames must strictly increase');
const point = z.object({x: z.number().finite(), y: z.number().finite()}).strict();
const mask = z.object({asset: z.string().min(1), mode: z.enum(['alpha', 'inverse-alpha']).default('alpha')}).strict();
const maskKeys = z.array(z.object({frame: z.number().int().nonnegative(), asset: z.string().min(1)}).strict()).min(2).max(40).refine(keys => keys.every((key, i) => !i || key.frame > keys[i - 1].frame), 'Mask frames must strictly increase');
export const flowSchema = z.discriminatedUnion('type', [z.object({type:z.literal('directional'),direction: z.enum(['up', 'down', 'left', 'right']), periodFrames: z.number().min(45).max(900), phase: z.number().min(0).max(1).default(0), opacity: z.number().min(0).max(.22), bandWidth: z.number().min(20).max(400), bounds: z.object({x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive()}).strict(), }).strict(),z.object({type:z.literal('path'),opacity:z.number().min(0).max(.22),maskKeys}).strict()]);
export const layerSchema = z.object({
  id: z.string().min(1),
  /** Omit for an effects-only layer (procedural smoke, strokes, particles) with no source image. */
  asset: z.string().min(1).optional(),
  /** Procedural themed vector element drawn in place of (or above) a source image. */
  kit: kitSchema.optional(),
  effects:z.array(motionEffectSchema).max(6).optional(),
  anchor: point.optional(),
  opacity: trackSchema(0, 1).optional(), x: trackSchema(-4000, 4000).optional(), y: trackSchema(-4000, 4000).optional(), scale: trackSchema(.1, 3).optional(), brightness: trackSchema(.5, 1.5).optional(),
  masks: z.array(mask).max(4).optional(),
  maskPadding: z.number().min(0).max(800).optional(),
  flow: flowSchema.optional(),
  pulse: z.object({periodFrames: z.number().min(30).max(900), brightness: z.number().min(0).max(.15).default(0), opacity: z.number().min(0).max(.15).default(0), phase: z.number().default(0)}).strict().optional(),
  textureDrift: z.object({x: z.number().min(-4).max(4), y: z.number().min(-4).max(4), periodFrames: z.number().min(30).max(900), opacity: z.number().min(0).max(.3)}).strict().optional(),
  reveal: z.discriminatedUnion('type', [
    z.object({type: z.literal('wipe'), direction: z.enum(['up', 'down', 'left', 'right']), bounds: z.object({x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive()}).strict(), progress: trackSchema(0, 1), feather: z.number().min(0).max(60).optional(), invert: z.boolean().optional()}).strict(),
    z.object({type: z.literal('mask-sequence'), keys: z.array(z.object({frame: z.number().int().nonnegative(), asset: z.string().min(1)}).strict()).min(2).max(40).refine(keys => keys.every((key, i) => !i || key.frame > keys[i - 1].frame), 'Mask frames must strictly increase')}).strict(),
  ]).optional(),
}).strict().superRefine((layer, ctx) => {
  if (layer.asset && layer.kit) ctx.addIssue({code: 'custom', message: 'A layer uses either an asset or a kit element, not both'});
  if (layer.asset) return;
  const needsSource = [layer.textureDrift && 'textureDrift', layer.flow && 'flow', layer.effects?.some(e => e.clipToSource) && 'clipToSource'].filter(Boolean);
  if (needsSource.length) ctx.addIssue({code: 'custom', message: `Effects-only layer cannot use source-image features: ${needsSource.join(', ')}`});
  if (!layer.effects?.length && !layer.kit) ctx.addIssue({code: 'custom', message: 'A layer without an asset must declare a kit element or at least one effect'});
});
export const groupSchema = z.object({
  id: z.string().min(1), width: z.number().positive(), height: z.number().positive(), layers: z.array(layerSchema).min(1).max(40),
  annotations: z.array(z.object({id: z.string().min(1), text: z.string().min(1).max(60), x: z.number(), y: z.number(), size: z.number().min(12).max(100).default(40), anchor: z.enum(['start', 'middle', 'end']).default('middle'), variant: z.enum(['plain', 'pill']).default('plain'), pop: z.boolean().default(false), opacity: trackSchema(0, 1).optional(), connector: z.object({from: point, to: point}).strict().optional()}).strict()).max(8).optional(),
}).strict().refine(group => new Set(group.layers.map(layer => layer.id)).size === group.layers.length, 'Duplicate illustration layer ID').superRefine((group,ctx)=>{
 const effects=group.layers.flatMap(l=>l.effects??[]);
 if(new Set(effects.map(e=>e.id)).size!==effects.length)ctx.addIssue({code:'custom',message:'Motion effect IDs must be unique within a group'});
 if(effects.reduce((sum,e)=>sum+(e.type==='particles'?e.count:0),0)>240)ctx.addIssue({code:'custom',message:'Group particle budget exceeds 240 records'});
 if(effects.reduce((sum,e)=>sum+(e.type==='puffs'?e.count:0),0)>96)ctx.addIssue({code:'custom',message:'Group puff budget exceeds 96 records'});
});
export type IllustrationGroup = z.infer<typeof groupSchema>;
export type IllustrationLayerConfig = z.infer<typeof layerSchema>;
export type Track = Array<{frame: number; value: number; ease?: EasingName}>;
export const layerAssetIds = (layer: IllustrationLayerConfig): string[] => [...(layer.asset ? [layer.asset] : []), ...(layer.masks?.map(item => item.asset) ?? []), ...(layer.reveal?.type === 'mask-sequence' ? layer.reveal.keys.map(key => key.asset) : []), ...(layer.flow?.type==='path'?layer.flow.maskKeys.map(key=>key.asset):[])];
