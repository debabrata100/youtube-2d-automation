import React,{useId,useMemo} from 'react';
import {IllustrationLayer} from '../illustrations/core/IllustrationLayer';
import {LayeredIllustration} from '../illustrations/core/LayeredIllustration';
import {rockGeometry} from '../motion/debris';

export const Asteroid:React.FC<{x:number;y:number;size:number;rotation:number;color?:string;opacity?:number;variant?:number;depth?:number}>=({x,y,size,rotation,color='#ae7050',opacity=1,variant=0,depth=1})=>{
  const geometry=useMemo(()=>rockGeometry(variant),[variant]);
  const id=useId().replace(/[^a-zA-Z0-9-]/g,'');
  const detailed=size*depth>20;
  return <LayeredIllustration label="Illustrated asteroid" x={x} y={y} width={size*2.3} height={size*2.3} viewBox="0 0 100 100" scale={depth} opacity={opacity*(.55+.45*depth)}>
    <defs>
      <clipPath id={`${id}-clip`}><path d={geometry.path}/></clipPath>
      <radialGradient id={`${id}-body`} cx="25%" cy="18%"><stop stopColor="#e4ae77"/><stop offset=".4" stopColor={color}/><stop offset="1" stopColor="#32272c"/></radialGradient>
      <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2=".8"><stop stopColor="#110f19" stopOpacity="0"/><stop offset=".5" stopColor="#1a1520" stopOpacity=".06"/><stop offset="1" stopColor="#100f19" stopOpacity=".74"/></linearGradient>
    </defs>
    <IllustrationLayer id="body" role="silhouette"><path d={geometry.path} fill={`url(#${id}-body)`}/></IllustrationLayer>
    <g clipPath={`url(#${id}-clip)`}>
      <IllustrationLayer id="facets" role="material" transform={`rotate(${rotation*.22} 50 50)`}>
        {geometry.strata.slice(0,detailed?12:6).map((s,i)=><React.Fragment key={i}>
          <path d={`M-5 ${s.y+15} Q23 ${s.y-s.bend} 49 ${s.y+3} T105 ${s.y-12}`} fill="none" stroke={i%3===0?'#3c2928':'#f1c38c'} strokeWidth={s.width} opacity={s.opacity}/>
          {detailed&&<path d={`M-5 ${s.y+17} Q23 ${s.y-s.bend+2} 49 ${s.y+5} T105 ${s.y-10}`} fill="none" stroke="#362627" strokeWidth="1.1" opacity=".22"/>}
        </React.Fragment>)}
      </IllustrationLayer>
      <IllustrationLayer id="craters" role="texture">
        {[{x:34,y:38,r:9},{x:65,y:61,r:6},{x:43,y:70,r:4}].slice(0,detailed?3:1).map((c,i)=><g key={i}>
          <ellipse cx={c.x} cy={c.y} rx={c.r} ry={c.r*.69} fill="#4c302a" opacity=".57"/>
          <path d={`M${c.x-c.r} ${c.y} Q${c.x-2} ${c.y-c.r} ${c.x+c.r} ${c.y-1}`} fill="none" stroke="#edba80" strokeWidth="1.3" opacity=".64"/>
          <path d={`M${c.x-c.r*.8} ${c.y+1} Q${c.x} ${c.y+c.r*.75} ${c.x+c.r*.7} ${c.y+1}`} fill="none" stroke="#2d2225" strokeWidth="1.8" opacity=".6"/>
        </g>)}
        {detailed&&geometry.grains.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.size} fill={i%3?'#e0b27c':'#201d23'} opacity={p.opacity}/>)}
        <path d="M56 17 L51 32 L57 40 L49 48 M51 32 L40 29 M72 66 L64 74 L68 86" fill="none" stroke="#352527" strokeWidth="1.3" strokeLinejoin="round" opacity=".65"/>
      </IllustrationLayer>
      <IllustrationLayer id="occlusion" role="shadow"><rect width="100" height="100" fill={`url(#${id}-shade)`}/></IllustrationLayer>
      <IllustrationLayer id="edge-light" role="highlight"><path d="M14 43 Q20 19 45 14" fill="none" stroke="#ffe0a8" strokeWidth="1.3" opacity=".34" strokeLinecap="round"/></IllustrationLayer>
    </g>
  </LayeredIllustration>;
};
