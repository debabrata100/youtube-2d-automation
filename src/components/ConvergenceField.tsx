import React,{useMemo} from 'react';
import {convergenceState} from '../motion/convergence';
import {makeParticles} from '../motion/particles';

export const ConvergenceField:React.FC<{frame:number;count:number;seed:number;center:{x:number;y:number};startFrame:number;endFrame:number}> = ({frame,count,seed,center,startFrame,endFrame})=>{
  const particles=useMemo(()=>makeParticles(count,seed,['#ffd184','#ef8d68','#8bdce3','#c89978']),[count,seed]);
  return <>{particles.map(p=>{const state=convergenceState(p,frame,center,startFrame,endFrame);const size=p.size*state.scale;return <span key={p.id} style={{position:'absolute',left:state.position.x-size/2,top:state.position.y-size/2,width:size,height:size,borderRadius:p.id%4===0?'38% 62% 55% 45%':'50%',transform:`rotate(${frame*(p.id%2?1.8:-1.2)+p.phase*57}deg)`,background:`radial-gradient(circle at 32% 28%,#fff4c5 0%,${p.color} 38%,#5a3451 100%)`,opacity:p.opacity*state.opacity,boxShadow:`0 0 ${Math.max(2,size*1.4)}px ${p.color}`}}/>})}</>;
};
