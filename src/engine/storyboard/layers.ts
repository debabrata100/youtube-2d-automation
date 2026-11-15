import {z} from 'zod';

export const trackSchema = (min: number, max: number) => z.array(z.object({frame: z.number().int().min(0).max(18000), value: z.number().min(min).max(max)}).strict()).min(1).max(40).refine(keys => keys.every((key, i) => !i || key.frame > keys[i - 1].frame), 'Track frames must strictly increase');
const point = z.object({x: z.number().finite(), y: z.number().finite()}).strict();
const mask = z.object({asset: z.string().min(1), mode: z.enum(['alpha', 'inverse-alpha']).default('alpha')}).strict();
const maskKeys = z.array(z.object({frame: z.number().int().nonnegative(), asset: z.string().min(1)}).strict()).min(2).max(40).refine(keys => keys.every((key, i) => !i || key.frame > keys[i - 1].frame), 'Mask frames must strictly increase');
export const flowSchema = z.discriminatedUnion('type', [z.object({type:z.literal('directional'),direction: z.enum(['up', 'down', 'left', 'right']), periodFrames: z.number().min(45).max(900), phase: z.number().min(0).max(1).default(0), opacity: z.number().min(0).max(.22), bandWidth: z.number().min(20).max(400), bounds: z.object({x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive()}).strict(), }).strict(),z.object({type:z.literal('path'),opacity:z.number().min(0).max(.22),maskKeys}).strict()]);
export const layerSchema = z.object({
  id: z.string().min(1), asset: z.string().min(1),
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
}).strict();
export const groupSchema = z.object({
  id: z.string().min(1), width: z.number().positive(), height: z.number().positive(), layers: z.array(layerSchema).min(1).max(40),
  annotations: z.array(z.object({id: z.string().min(1), text: z.string().min(1).max(60), x: z.number(), y: z.number(), size: z.number().min(12).max(100).default(40), anchor: z.enum(['start', 'middle', 'end']).default('middle'), opacity: trackSchema(0, 1).optional(), connector: z.object({from: point, to: point}).strict().optional()}).strict()).max(8).optional(),
}).strict().refine(group => new Set(group.layers.map(layer => layer.id)).size === group.layers.length, 'Duplicate illustration layer ID');
export type IllustrationGroup = z.infer<typeof groupSchema>;
export type IllustrationLayerConfig = z.infer<typeof layerSchema>;
export type Track = Array<{frame: number; value: number}>;
export const layerAssetIds = (layer: IllustrationLayerConfig) => [layer.asset, ...(layer.masks?.map(item => item.asset) ?? []), ...(layer.reveal?.type === 'mask-sequence' ? layer.reveal.keys.map(key => key.asset) : []), ...(layer.flow?.type==='path'?layer.flow.maskKeys.map(key=>key.asset):[])];
