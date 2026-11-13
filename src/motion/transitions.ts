import {smoothstep} from './easing';
export type TransitionStyle = 'crossfade'|'wipe-left'|'zoom';
export const transitionState = (frame: number, duration: number, style: TransitionStyle, fadeOut=true) => {
  const edge = Math.min(14, Math.floor(duration/4));
  const enter = smoothstep(frame/edge); const exit = smoothstep((duration-1-frame)/edge);
  const opacity = fadeOut ? Math.min(enter, exit) : enter;
  if (style === 'wipe-left') return {opacity, transform:`translateX(${(1-enter)*90}px)`};
  if (style === 'zoom') return {opacity, transform:`scale(${.94 + enter*.06})`};
  return {opacity, transform:'none'};
};
