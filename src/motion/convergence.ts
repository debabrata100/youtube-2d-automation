import {smoothstep} from './easing';
import type {Particle} from './particles';
import type {Point} from './paths';

export type ConvergenceState={position:Point;scale:number;opacity:number;progress:number};

export const convergenceState=(particle:Particle,frame:number,center:Point,startFrame:number,endFrame:number):ConvergenceState=>{
  const stagger=(particle.id%11)*1.7+particle.depth*4;
  const raw=(frame-startFrame-stagger)/Math.max(1,endFrame-startFrame-stagger);
  const t=smoothstep(raw);
  const angle=particle.phase+frame*(.012+.008/particle.depth);
  const spiral=1-t;
  const radiusX=particle.radiusX*spiral;
  const radiusY=particle.radiusY*spiral*.52;
  const curl=Math.sin(t*Math.PI)*42*(particle.id%2===0?1:-1);
  return {
    position:{x:center.x+Math.cos(angle)*radiusX+Math.cos(angle+Math.PI/2)*curl,y:center.y+Math.sin(angle)*radiusY+Math.sin(angle+Math.PI/2)*curl*.4},
    scale:Math.max(.12,1-t*.86),
    opacity:Math.max(0,1-smoothstep((t-.74)/.26)),
    progress:t,
  };
};
