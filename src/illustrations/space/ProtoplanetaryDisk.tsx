import React,{useMemo,useId} from 'react';
import {seededRandom} from '../../motion/particles';
import {IllustrationLayer} from '../core/IllustrationLayer';
import {LayeredIllustration} from '../core/LayeredIllustration';

export type ProtoplanetaryDiskLayer='back'|'front';
export type ProtoplanetaryDiskProps={center:{x:number;y:number};frame:number;seed:number;layer:ProtoplanetaryDiskLayer;speed?:number;radiusX?:number;radiusY?:number;intensity?:number;rotation?:number;particleCount?:number;scale?:number;opacity?:number};
export type DiskParticle={id:number;phase:number;orbit:number;thickness:number;size:number;opacity:number;depth:number;color:string;fragment:boolean};
export const makeDiskParticles=(count:number,seed:number):DiskParticle[]=>{
  const random=seededRandom(seed);
  const colors=['#ffe4ab','#dfa06b','#bf7852','#8c5141','#c5b4a1'];
  return Array.from({length:count},(_,id)=>({id,phase:random()*Math.PI*2,orbit:[.35,.53,.75,.93][id%4]+(random()-.5)*.12,thickness:(random()-.5)*29,size:1.2+Math.pow(random(),2)*9,opacity:.25+random()*.6,depth:.85+random()*.3,color:colors[Math.floor(random()*colors.length)],fragment:random()>.94}));
};
export const diskParticleState=(p:DiskParticle,frame:number,speed=.009)=>{
  const angularSpeed=speed*.65/Math.pow(p.orbit,1.2)/p.depth;
  const angle=p.phase+frame*angularSpeed;
  const near=Math.sin(angle);
  const density=.68+.32*Math.sin(angle*3-p.orbit*8+frame*.001);
  return {angle,angularSpeed,front:near>=0,x:500+Math.cos(angle)*445*p.orbit,y:300+near*121*p.orbit+p.thickness,
    size:p.size*(.88+near*.24),opacity:p.opacity*density*(.76+near*.18)};
};

export const ProtoplanetaryDisk:React.FC<ProtoplanetaryDiskProps>=({center,frame,seed,layer,speed=.009,radiusX=500,radiusY=118,intensity=1,rotation=-7,particleCount=208,scale=1,opacity=1})=>{
  const id=useId().replace(/[^a-zA-Z0-9-]/g,'');
  const particles=useMemo(()=>makeDiskParticles(particleCount,seed),[particleCount,seed]);
  const front=layer==='front';
  const arc=(radius:number)=>front?`M${500+radius} 300 A${radius} ${radius*.29} 0 0 1 ${500-radius} 300`:`M${500-radius} 300 A${radius} ${radius*.29} 0 0 1 ${500+radius} 300`;
  return <LayeredIllustration label={`${layer} protoplanetary disk`} x={center.x} y={center.y} width={radiusX*2} height={radiusY*6} viewBox="0 0 1000 600" rotation={rotation} scale={scale} opacity={opacity*Math.min(1.2,intensity)}>
    <defs>
      <linearGradient id={`${id}-dust`}><stop stopColor="#6b3e38" stopOpacity=".05"/><stop offset=".22" stopColor="#b46a4b" stopOpacity=".55"/><stop offset=".5" stopColor="#ffd18a" stopOpacity=".7"/><stop offset=".78" stopColor="#9e6148" stopOpacity=".46"/><stop offset="1" stopColor="#543540" stopOpacity=".03"/></linearGradient>
      <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="7 3"/></filter>
    </defs>
    <g transform={`translate(0 300) scale(1 ${radiusY/100}) translate(0 -300)`}>
    <IllustrationLayer id={front?'near-dust-haze':'far-dust-haze'} role={front?'foreground':'atmosphere'} opacity={front?.6:.38}>
      {[185,270,365,435].map((r,i)=><path key={r} d={arc(r)} fill="none" stroke={`url(#${id}-dust)`} strokeWidth={28+i*8} filter={`url(#${id}-soft)`}/>) }
    </IllustrationLayer>
    <IllustrationLayer id={front?'near-orbital-bands':'far-orbital-bands'} role={front?'foreground':'material'}>
      {Array.from({length:14},(_,i)=>{
        const r=145+i*23;
        const gap=i%4===2;
        return <path key={i} d={arc(r)} fill="none" stroke={gap?'#30232c':`url(#${id}-dust)`} strokeWidth={gap?9:6+i%3*4} strokeDasharray={`${24+i*3} ${11+i%4*8} ${42-i} ${18+i*2}`} strokeDashoffset={frame*speed*(360-r)*.3*(front?1:-1)+i*31} strokeLinecap="round" opacity={gap?.22:(front?.35:.19)}/>;
      })}
    </IllustrationLayer>
    <IllustrationLayer id={front?'near-grains':'far-grains'} role={front?'foreground':'texture'}>
      {particles.map(p=>{
        const s=diskParticleState(p,frame,speed);
        if(s.front!==front)return null;
        return <g key={p.id} opacity={s.opacity}>
          {p.id%7===0&&<ellipse cx={s.x} cy={s.y} rx={s.size*4.2} ry={s.size*.75} fill={p.color} opacity=".12"/>}
          <ellipse cx={s.x} cy={s.y} rx={s.size} ry={s.size*.52} fill={p.color}/>
          {p.fragment&&<path d={`M${s.x-s.size} ${s.y} l${s.size*.8} ${-s.size*.6} l${s.size} ${s.size*.45} l${-s.size*.5} ${s.size*.55}Z`} fill="#714637"/>}
        </g>;
      })}
    </IllustrationLayer>
    {front&&<IllustrationLayer id="stellar-pickup" role="highlight" opacity={.18}><path d="M376 367 Q500 416 624 367" fill="none" stroke="#ffe5b0" strokeWidth="9" strokeDasharray="12 17 24 9" strokeDashoffset={frame*.25}/></IllustrationLayer>}
    </g>
  </LayeredIllustration>;
};
