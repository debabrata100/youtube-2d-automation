import {z} from 'zod';
import {cameraPoseAt} from '../../motion/camera';
import {smoothstep} from '../../motion/easing';

export const cameraSchema = z.object({
  preset: z.enum(['static', 'slow-push', 'pull-back', 'tracking']).default('slow-push'),
  amount: z.number().min(0).max(.3).default(.1),
  offsetX: z.number().min(-.2).max(.2).default(.07),
  offsetY: z.number().min(-.2).max(.2).default(0),
}).strict();
export type CameraConfig = z.infer<typeof cameraSchema>;

/** Same neutral pose and zero velocity at either edge, independent of scene duration. */
export const cameraPresetAt = (config: CameraConfig, frame: number, duration: number, width: number, height: number) => {
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
