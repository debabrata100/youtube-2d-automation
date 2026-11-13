import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {seededRandom} from '../motion/particles';

export const SpaceBackground: React.FC<React.PropsWithChildren<{seed:number; accent?:string}>> = ({seed, accent='#513a91', children}) => {
  const frame=useCurrentFrame();
  const stars=useMemo(()=>{const r=seededRandom(seed); return Array.from({length:90},(_,i)=>({i,x:r()*1080,y:r()*1920,s:.8+r()*3.2,o:.2+r()*.7,p:r()*6.28}));},[seed]);
  return <AbsoluteFill style={{overflow:'hidden',background:'radial-gradient(circle at 72% 20%, #281b62 0%, #10103c 36%, #070a25 72%, #030519 100%)'}}>
    <div style={{position:'absolute',inset:-300,opacity:.4,filter:'blur(80px)',background:`radial-gradient(ellipse at 25% 45%, ${accent}88 0%, transparent 48%), radial-gradient(ellipse at 78% 72%, #176a8980 0%, transparent 42%)`,transform:`rotate(${frame*.012}deg) scale(${1+Math.sin(frame/80)*.025})`}}/>
    <svg width="1080" height="1920" style={{position:'absolute'}}>{stars.map(s=><circle key={s.i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o*(.68+.32*Math.sin(frame*.055+s.p))}/>)}</svg>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(5,7,30,.08),rgba(2,4,18,.5))'}}/>
    {children}
  </AbsoluteFill>;
};
