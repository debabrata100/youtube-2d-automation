import {z} from 'zod';
import {cameraPoseAt} from '../../motion/camera';
import {smoothstep} from '../../motion/easing';
import {cameraKeyframesSchema} from '../motion/primitives/schema';
import {keyframeCameraAt} from '../motion/primitives/camera';
const endpoint = z.object({x: z.number().min(.1).max(.9), y: z.number().min(.1).max(.9), zoom: z.number().min(.75).max(1.5)}).strict();

export const cameraSchema = z.object({
  preset: z.enum(['static', 'slow-push', 'pull-back', 'tracking']).default('slow-push'),
  amount: z.number().min(0).max(.3).default(.1),
  offsetX: z.number().min(-.2).max(.2).default(.07),
  offsetY: z.number().min(-.2).max(.2).default(0),
  keyframes:cameraKeyframesSchema.optional(),boundaryMode:z.enum(['cover','backdrop']).optional(),
  from: endpoint.optional(), to: endpoint.optional(), holdFrames: z.number().int().min(0).max(900).optional(),
}).strict().refine(config => Boolean(config.from) === Boolean(config.to), 'Provide both camera endpoints').refine(config=>!config.keyframes||!config.from,'Choose keyframes or legacy endpoints, not both');
export type CameraConfig = z.infer<typeof cameraSchema>;

/** Same neutral pose and zero velocity at either edge, independent of scene duration. */
export const cameraPresetAt = (config: CameraConfig, frame: number, duration: number, width: number, height: number) => {
  if(config.keyframes)return keyframeCameraAt(config.keyframes,frame,width,height,config.boundaryMode??'cover');
  if (config.from && config.to) {
    const end = Math.max(1, duration - 1 - (config.holdFrames ?? 0)), t = smoothstep(frame / end);
    const keys = [config.from, config.to].map((pose, i) => ({frame: i, focus: {x: pose.x * width, y: pose.y * height}, zoom: pose.zoom, rotation: 0}));
    const pose = cameraPoseAt(t, keys);
    return {focus: pose.focus, zoom: pose.zoom, rotation: pose.rotation ?? 0};
  }
  const t = Math.max(0, Math.min(1, frame / Math.max(1, duration - 1)));
  const phase = t <= .5 ? smoothstep(t * 2) * .5 : .5 + smoothstep((t - .5) * 2) * .5;
  const neutral = {focus: {x: width / 2, y: height / 2}, zoom: 1, rotation: 0};
  const middle = {...neutral, focus: {...neutral.focus}};
  if (config.preset === 'slow-push') middle.zoom += config.amount;
  if (config.preset === 'pull-back') middle.zoom -= config.amount;
  if (config.preset === 'tracking') middle.focus = {x: width * (.5 + config.offsetX), y: height * (.5 + config.offsetY)};
  const pose = cameraPoseAt(phase * 2, [{...neutral, frame: 0}, {...middle, frame: 1}, {...neutral, frame: 2}]);
  return {focus: pose.focus, zoom: pose.zoom, rotation: pose.rotation ?? 0};
};
