import {smoothstep} from './easing';
export type TransitionStyle = 'crossfade'|'wipe-left'|'zoom';
export const transitionState = (frame: number, duration: number, style: TransitionStyle, fadeOut=true, fadeIn=true) => {
  const edge = Math.min(14, Math.floor(duration/4));
  const span=Math.max(1,edge-1);
  const enter = smoothstep(frame/span); const exit = smoothstep((duration-1-frame)/span);
  const entrance=fadeIn?enter:1;
  const opacity = fadeOut ? Math.min(entrance, exit) : entrance;
  if (style === 'wipe-left') return {opacity, transform:`translateX(${(1-entrance)*26}px)`};
  if (style === 'zoom') return {opacity, transform:`scale(${.985 + entrance*.015})`};
  return {opacity, transform:'none'};
};
