import React,{useMemo} from 'react';
import type {MotionEffectConfig,PathMotionConfig,EmitterConfig} from './schema';
import {compileMotionPath,pathObjectAt} from './path';
import {compileEmitter,emittedParticleAt} from './particles';
const PathEffect:React.FC<{config:PathMotionConfig;frame:number;width:number;height:number;id:string}>=({config,frame,width,height,id})=>{
 const table=useMemo(()=>compileMotionPath(config.path,width,height),[config.path,width,height]),r=config.radius*Math.min(width,height);
 return <><defs><radialGradient id={id}><stop offset="0" stopColor="#fff9d9"/><stop offset=".3" stopColor={config.color}/><stop offset="1" stopColor={config.color} stopOpacity="0"/></radialGradient></defs>{Array.from({length:config.copies},(_,copy)=>{
  const state=pathObjectAt(config,table,frame,copy);if(!state.active||state.opacity===0)return null;
  return <g key={copy} opacity={state.opacity} transform={`translate(${state.position.x*width} ${state.position.y*height}) rotate(${state.rotation}) scale(${state.scale})`}><ellipse rx={r*config.aspect} ry={r} fill={`url(#${id})`}/><ellipse rx={r*config.aspect*.5} ry={r*.28} fill="#fff4b0"/></g>;
 })}</>;
};
const ParticleEffect:React.FC<{config:EmitterConfig;frame:number;width:number;height:number}>=({config,frame,width,height})=>{
 const records=useMemo(()=>compileEmitter(config),[config]);
 return <>{records.map(p=>{const state=emittedParticleAt(p,config,frame);if(!state.active||state.opacity<=0||state.scale<=0)return null;const r=p.radius*Math.min(width,height)*state.scale;
  return <g key={p.id} opacity={state.opacity} transform={`translate(${state.x*width} ${state.y*height}) rotate(${state.angleDegrees})`}>{config.shape==='diamond'?<polygon points={`${-r},0 0,${-r*.7} ${r},0 0,${r*.7}`} fill={p.color}/>:config.shape==='streak'?<><ellipse rx={r*2.5} ry={r*.8} fill={p.color} opacity=".28"/><ellipse rx={r*1.4} ry={r*.4} fill={p.color}/></>:<circle r={r} fill={p.color}/>}</g>;
 })}</>;
};
export const MotionEffect:React.FC<{config:MotionEffectConfig;frame:number;width:number;height:number;prefix:string}>=({config,frame,width,height,prefix})=><g data-motion-effect-id={config.id} mask={config.clipToSource?`url(#${prefix}-self)`:undefined}>{config.type==='path-motion'?<PathEffect config={config} frame={frame} width={width} height={height} id={`${prefix}-${config.id}-glow`}/>:<ParticleEffect config={config} frame={frame} width={width} height={height}/>}</g>;
