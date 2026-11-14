import {z} from 'zod';
import {smoothstep} from '../../motion/easing';
import {orbitPosition} from '../../motion/paths';

export const motionSchema = z.object({
  preset: z.enum(['still', 'gentle-drift', 'hero-reveal', 'orbit', 'particle-convergence']).default('gentle-drift'),
  amplitude: z.number().min(0).max(.15).default(.025),
  cycles: z.number().int().min(1).max(4).default(1),
}).strict();
export type MotionConfig = z.infer<typeof motionSchema>;
export const motionPresetAt = (config: MotionConfig, frame: number, duration: number) => {
  const t = Math.max(0, Math.min(1, frame / Math.max(1, duration - 1)));
  const envelope = Math.sin(Math.PI * t) ** 2;
  const state = {x: 0, y: 0, scale: 1};
  if (config.preset === 'gentle-drift') {
    state.x = Math.sin(t * Math.PI * 2 * config.cycles) * config.amplitude * envelope;
    state.y = -Math.sin(t * Math.PI) * config.amplitude * envelope;
  }
  if (config.preset === 'orbit') {
    const p = orbitPosition(t, {center: {x: 0, y: 0}, radiusX: config.amplitude, radiusY: config.amplitude * .5, speed: Math.PI * 2 * config.cycles});
    state.x = p.x * envelope; state.y = p.y * envelope;
  }
  if (config.preset === 'hero-reveal') state.scale = .92 + .08 * smoothstep(t / .35);
  // Convergence is applied to particles by the template using convergenceState.
  return state;
};

export const subjectEnvelope = (frame: number, duration: number, transitionFrames: number) => {
  if (!transitionFrames) return 1;
  return smoothstep(frame / transitionFrames) * smoothstep((duration - 1 - frame) / transitionFrames);
};
