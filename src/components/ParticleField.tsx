import React, {useMemo} from 'react';
import {makeParticles, particleOrbit} from '../motion/particles';
export const ParticleField:React.FC<{frame:number;count:number;seed:number;center:{x:number;y:number};speed:number;direction?:1|-1;converge?:number}> = ({frame,count,seed,center,speed,direction=1,converge=0}) => {
 const particles=useMemo(()=>makeParticles(count,seed),[count,seed]);
 return <>{particles.map(p=>{const pos=particleOrbit(p,frame,center,speed,direction); const x=pos.x+(center.x-pos.x)*converge; const y=pos.y+(center.y-pos.y)*converge; return <span key={p.id} style={{position:'absolute',left:x,top:y,width:p.size*(1-converge*.55),height:p.size*(1-converge*.55),borderRadius:'50%',background:p.color,opacity:p.opacity,boxShadow:`0 0 ${p.size*1.8}px ${p.color}`}}/>})}</>;
};
