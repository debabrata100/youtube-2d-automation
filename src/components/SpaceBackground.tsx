import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {seededRandom} from '../motion/particles';

type StarPoint={id:number;x:number;y:number;size:number;opacity:number;phase:number;color:string;cross:boolean};

const makeStarLayer=(seed:number,count:number,minSize:number,maxSize:number):StarPoint[]=>{
  const random=seededRandom(seed);
  const colors=['#ffffff','#c9eaff','#eee1ff','#ffe9ba'];
  return Array.from({length:count},(_,id)=>({id,x:random()*1160-40,y:random()*2040-60,size:minSize+random()*(maxSize-minSize),opacity:.2+random()*.75,phase:random()*Math.PI*2,color:colors[Math.floor(random()*colors.length)],cross:random()>.92}));
};

const StarLayer:React.FC<{stars:StarPoint[];frame:number;drift:number;twinkle:number}> = ({stars,frame,drift,twinkle}) => <svg width="1160" height="2040" viewBox="0 0 1160 2040" style={{position:'absolute',left:-40,top:-60,transform:`translate(${Math.sin(frame/95)*drift}px,${Math.cos(frame/120)*drift*.65}px)`}}>
  {stars.map(star=>{
    const opacity=star.opacity*(.72+.28*Math.sin(frame*twinkle+star.phase));
    return <g key={star.id} transform={`translate(${star.x} ${star.y})`} opacity={opacity}>
      <circle r={star.size} fill={star.color}/>
      {star.cross&&<><path d={`M${-star.size*4} 0H${star.size*4}`} stroke={star.color} strokeWidth={Math.max(.6,star.size*.35)}/><path d={`M0 ${-star.size*4}V${star.size*4}`} stroke={star.color} strokeWidth={Math.max(.6,star.size*.35)}/></>}
    </g>;
  })}
</svg>;

export const SpaceBackground: React.FC<React.PropsWithChildren<{seed:number;accent?:string}>> = ({seed,accent='#513a91',children}) => {
  const frame=useCurrentFrame();
  const far=useMemo(()=>makeStarLayer(seed,120,.45,1.5),[seed]);
  const middle=useMemo(()=>makeStarLayer(seed+101,54,.9,2.7),[seed]);
  const near=useMemo(()=>makeStarLayer(seed+307,20,1.6,4.2),[seed]);
  const textureId=`space-grain-${seed}`;
  return <AbsoluteFill style={{overflow:'hidden',background:'radial-gradient(circle at 76% 14%,#2c1c66 0%,#11113e 34%,#070a27 70%,#020416 100%)'}}>
    <div style={{position:'absolute',inset:-220,opacity:.62,background:`radial-gradient(ellipse 58% 32% at 18% 42%,${accent}55 0%,transparent 64%),radial-gradient(ellipse 46% 28% at 88% 69%,#177b9560 0%,transparent 67%),radial-gradient(ellipse 40% 22% at 53% 89%,#43256a55 0%,transparent 70%)`,filter:'blur(54px)',transform:`translate(${Math.sin(frame/110)*18}px,${Math.cos(frame/140)*12}px) rotate(${frame*.004}deg)`}}/>
    <StarLayer stars={far} frame={frame} drift={3} twinkle={.025}/>
    <div style={{position:'absolute',inset:-100,opacity:.17,background:`conic-gradient(from ${frame*.025}deg at 48% 56%,transparent 0 18%,${accent}66 26%,transparent 34% 68%,#2f9dbb55 77%,transparent 85%)`,filter:'blur(72px)',transform:'scale(1.22,.9)'}}/>
    <StarLayer stars={middle} frame={frame} drift={8} twinkle={.042}/>
    <StarLayer stars={near} frame={frame} drift={16} twinkle={.06}/>
    <svg width="1080" height="1920" style={{position:'absolute',inset:0,opacity:.12,mixBlendMode:'soft-light'}}>
      <filter id={textureId}><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed={seed}/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="1080" height="1920" filter={`url(#${textureId})`} opacity=".38"/>
    </svg>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 48%,transparent 42%,rgba(1,3,16,.18) 72%,rgba(1,2,12,.68) 100%),linear-gradient(180deg,rgba(3,5,25,.04),rgba(2,4,18,.34))'}}/>
    {children}
  </AbsoluteFill>;
};
