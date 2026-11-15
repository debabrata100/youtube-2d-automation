import {z} from 'zod';
export const easingSchema=z.enum(['linear','smoothstep','ease-out-cubic']).default('smoothstep');
export const normalizedPoint=z.object({x:z.number().finite().min(0).max(1),y:z.number().finite().min(0).max(1)}).strict();
const vector=z.object({x:z.number().finite().min(-.002).max(.002),y:z.number().finite().min(-.002).max(.002)}).strict();
export const pathSchema=z.object({start:normalizedPoint,segments:z.array(z.discriminatedUnion('type',[
 z.object({type:z.literal('line'),to:normalizedPoint}).strict(),
 z.object({type:z.literal('cubic-bezier'),control1:normalizedPoint,control2:normalizedPoint,to:normalizedPoint}).strict(),
])).min(1).max(12)}).strict().refine(path=>path.segments.some(s=>[s.to,...(s.type==='cubic-bezier'?[s.control1,s.control2]:[])].some(p=>p.x!==path.start.x||p.y!==path.start.y)),'Path must have nonzero length');
const lifeTrack=(max:number)=>z.array(z.object({at:z.number().min(0).max(1),value:z.number().min(0).max(max)}).strict()).min(2).max(8).refine(keys=>keys[0].at===0&&keys.at(-1)!.at===1&&keys.every((k,i)=>!i||k.at>keys[i-1].at),'Lifetime keys must increase from 0 to 1');
const range=(min:number,max:number)=>z.tuple([z.number().min(min).max(max),z.number().min(min).max(max)]).refine(([a,b])=>a<=b,'Range minimum must not exceed maximum');
const base={id:z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]*$/),clipToSource:z.boolean().default(false)};
export const pathMotionSchema=z.object({...base,type:z.literal('path-motion'),path:pathSchema,startFrame:z.number().int().min(0).max(18000),durationFrames:z.number().int().min(2).max(18000),endFrame:z.number().int().min(1).max(18000).optional(),repeat:z.boolean().default(false),copies:z.number().int().min(1).max(8).default(1),easing:easingSchema,radius:z.number().min(.001).max(.06).default(.008),aspect:z.number().min(.2).max(8).default(1),scale:z.number().min(.1).max(4).default(1),opacity:z.number().min(0).max(1).default(.8),color:z.string().regex(/^#[a-fA-F0-9]{6}$/),orientAlongPath:z.boolean().default(false)}).strict().refine(e=>e.endFrame===undefined||e.endFrame>e.startFrame,'Path end must follow its start');
export const emitterSchema=z.object({...base,type:z.literal('particles'),count:z.number().int().min(1).max(96),seed:z.number().int().min(0).max(4294967295),startFrame:z.number().int().min(0).max(18000),endFrame:z.number().int().min(1).max(18000),emitter:normalizedPoint.extend({width:z.number().min(0).max(1).default(0),height:z.number().min(0).max(1).default(0)}),lifetimeFrames:range(2,600),velocity:z.object({angleDegrees:z.number().min(-360).max(360),spreadDegrees:z.number().min(0).max(180).default(0),speed:range(0,.03)}).strict(),acceleration:vector.default({x:0,y:0}),radius:range(.0005,.03),opacity:lifeTrack(1).default([{at:0,value:0},{at:.1,value:.85},{at:.75,value:.6},{at:1,value:0}]),scale:lifeTrack(4).default([{at:0,value:.4},{at:.2,value:1},{at:1,value:0}]),colors:z.array(z.string().regex(/^#[a-fA-F0-9]{6}$/)).min(1).max(8),shape:z.enum(['circle','streak','diamond']).default('circle')}).strict().refine(e=>e.endFrame>e.startFrame,'Emission end must follow start');
const hex = z.string().regex(/^#[a-fA-F0-9]{6}$/);
const frameTrack = (min: number, max: number) => z
  .array(z.object({frame: z.number().int().min(0).max(18000), value: z.number().min(min).max(max)}).strict())
  .min(1)
  .max(24)
  .refine(keys => keys.every((key, i) => !i || key.frame > keys[i - 1].frame), 'Track frames must strictly increase');

/**
 * Seeded billowing cloud: each puff travels from the emitter, decelerates, grows and fades.
 * Lumpy silhouettes come from a fixed set of seeded lobes. State is an analytic function of age.
 * Distances and radii are normalized to the host's shorter side.
 */
export const puffsSchema = z.object({
  ...base,
  type: z.literal('puffs'),
  count: z.number().int().min(1).max(48),
  seed: z.number().int().min(0).max(4294967295),
  startFrame: z.number().int().min(0).max(18000),
  endFrame: z.number().int().min(1).max(18000),
  emitter: normalizedPoint.extend({width: z.number().min(0).max(1).default(0)}),
  direction: z.object({angleDegrees: z.number().min(-360).max(360), spreadDegrees: z.number().min(0).max(90).default(10)}).strict(),
  travel: range(0, 1.5),
  lifetimeFrames: range(4, 600),
  radius: range(.005, .2),
  growth: z.number().min(1).max(8).default(2.5),
  wind: z.object({x: z.number().min(-.6).max(.6), y: z.number().min(-.6).max(.6)}).strict().default({x: 0, y: 0}),
  lobes: z.number().int().min(1).max(7).default(4),
  colors: z.object({light: hex, mid: hex, shadow: hex}).strict(),
  softness: z.number().min(0).max(1).default(.35),
  opacity: lifeTrack(1).default([{at: 0, value: 0}, {at: .08, value: .95}, {at: .7, value: .8}, {at: 1, value: 0}]),
  easing: easingSchema,
}).strict().refine(e => e.endFrame > e.startFrame, 'Emission end must follow start');

/**
 * Progressive stroke along a normalized path (lava, rivers, arrows, wiring, routes).
 * Optional travelling highlight dashes stay inside the revealed portion.
 */
export const strokeRevealSchema = z.object({
  ...base,
  type: z.literal('stroke-reveal'),
  path: pathSchema,
  progress: frameTrack(0, 1),
  width: z.number().min(.001).max(.08),
  color: hex,
  glow: z.object({color: hex, widthScale: z.number().min(1).max(6).default(2.6), opacity: z.number().min(0).max(1).default(.35)}).strict().optional(),
  flow: z.object({color: hex, periodFrames: z.number().min(8).max(600), dash: z.number().min(.01).max(.5).default(.08), gap: z.number().min(.01).max(1).default(.22), opacity: z.number().min(0).max(1).default(.7), widthScale: z.number().min(.1).max(1).default(.45)}).strict().optional(),
  headGlow: z.boolean().default(true),
  /** Filled arrowhead at the reveal front, sized as a multiple of the stroke width. */
  arrowHead: z.number().min(1).max(6).optional(),
});

export const motionEffectSchema=z.discriminatedUnion('type',[pathMotionSchema,emitterSchema,puffsSchema,strokeRevealSchema]);
export type PathConfig=z.infer<typeof pathSchema>;
export type PathMotionConfig=z.infer<typeof pathMotionSchema>;
export type EmitterConfig=z.infer<typeof emitterSchema>;
export type MotionEffectConfig=z.infer<typeof motionEffectSchema>;
export type PuffsConfig = z.infer<typeof puffsSchema>;
export type StrokeRevealConfig = z.infer<typeof strokeRevealSchema>;
export const cameraKeyframeSchema=z.object({frame:z.number().int().min(0).max(18000),focus:normalizedPoint.default({x:.5,y:.5}),x:z.number().min(-.2).max(.2).default(0),y:z.number().min(-.2).max(.2).default(0),zoom:z.number().min(.9).max(1.4).default(1),rotation:z.number().min(-3).max(3).default(0),easing:easingSchema}).strict();
export const cameraKeyframesSchema=z.array(cameraKeyframeSchema).min(1).max(12).refine(keys=>keys.every((k,i)=>!i||k.frame>keys[i-1].frame),'Camera keyframes must strictly increase');
export type PrimitiveCameraKeyframe=z.infer<typeof cameraKeyframeSchema>;
export const easeMotion=(t:number,easing:z.infer<typeof easingSchema>)=>{const v=Math.max(0,Math.min(1,t));return easing==='linear'?v:easing==='ease-out-cubic'?1-(1-v)**3:v*v*(3-2*v);};
