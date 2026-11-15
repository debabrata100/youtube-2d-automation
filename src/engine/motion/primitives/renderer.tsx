import React,{useMemo} from 'react';
import type {MotionEffectConfig,PathMotionConfig,EmitterConfig,PuffsConfig,StrokeRevealConfig} from './schema';
import {compilePuffs,puffAt} from './puffs';
import {pathData,strokeStateAt} from './stroke';
import {compileMotionPath,pathObjectAt,sampleMotionPath} from './path';
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
/** Cel-style cloud: per lobe a shadow disc (offset down-right), body disc and highlight disc (offset up-left).
 * Softness feathers disc edges: 0 gives hard flat cartoon edges, higher values a painterly blend. */
const PuffEffect: React.FC<{config: PuffsConfig; frame: number; width: number; height: number; id: string}> = ({config, frame, width, height, id}) => {
  const records = useMemo(() => compilePuffs(config), [config]);
  const unit = Math.min(width, height);
  const edge = 1 - config.softness * .7;
  const tone = (key: 'light' | 'mid' | 'shadow') => <radialGradient key={key} id={`${id}-${key}`}>
    <stop offset="0" stopColor={config.colors[key]}/>
    <stop offset={edge} stopColor={config.colors[key]}/>
    <stop offset="1" stopColor={config.colors[key]} stopOpacity={config.softness > 0 ? 0 : 1}/>
  </radialGradient>;
  const passes = [
    {key: 'shadow', dx: .14, dy: .16, size: 1, opacity: 1},
    {key: 'mid', dx: 0, dy: 0, size: .9, opacity: 1},
    {key: 'light', dx: -.15, dy: -.17, size: .62, opacity: .85},
  ] as const;
  return <>
    <defs>{tone('light')}{tone('mid')}{tone('shadow')}</defs>
    {records.map(puff => {
      const state = puffAt(puff, config, frame, width, height);
      if (!state.active || state.opacity <= 0) return null;
      const r = state.radius * unit;
      return <g key={puff.id} opacity={state.opacity} transform={`translate(${state.x * width} ${state.y * height})`}>
        {passes.map(pass => <g key={pass.key} opacity={pass.opacity}>{puff.lobes.map((lobe, i) => {
          const angle = lobe.angle + puff.spin * (frame - puff.birth) / puff.life;
          return <circle key={i} cx={(Math.cos(angle) * lobe.distance + pass.dx) * r} cy={(Math.sin(angle) * lobe.distance + pass.dy) * r} r={lobe.size * r * pass.size} fill={`url(#${id}-${pass.key})`}/>;
        })}</g>)}
      </g>;
    })}
  </>;
};
const StrokeEffect: React.FC<{config: StrokeRevealConfig; frame: number; width: number; height: number; id: string}> = ({config, frame, width, height, id}) => {
  const d = useMemo(() => pathData(config.path, width, height), [config.path, width, height]);
  const table = useMemo(() => compileMotionPath(config.path, width, height), [config.path, width, height]);
  const state = strokeStateAt(config, frame);
  if (!state.visible) return null;
  const w = config.width * Math.min(width, height);
  const reveal = {strokeDasharray: `${state.progress} 2`, strokeDashoffset: 0};
  const head = sampleMotionPath(table, state.progress).position;
  return <>
    {config.flow && <defs><mask id={`${id}-revealed`} maskUnits="userSpaceOnUse" x={-width} y={-height} width={width * 3} height={height * 3}><path d={d} pathLength={1} fill="none" stroke="white" strokeWidth={w * 1.2} strokeLinecap="round" strokeLinejoin="round" style={reveal}/></mask></defs>}
    {config.glow && <path d={d} pathLength={1} fill="none" stroke={config.glow.color} strokeOpacity={config.glow.opacity} strokeWidth={w * config.glow.widthScale} strokeLinecap="round" strokeLinejoin="round" style={reveal}/>}
    <path d={d} pathLength={1} fill="none" stroke={config.color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={reveal}/>
    {config.flow && <g mask={`url(#${id}-revealed)`}><path d={d} pathLength={1} fill="none" stroke={config.flow.color} strokeOpacity={config.flow.opacity} strokeWidth={w * config.flow.widthScale} strokeLinecap="round" style={{strokeDasharray: `${config.flow.dash} ${config.flow.gap}`, strokeDashoffset: state.flowOffset}}/></g>}
    {config.headGlow && state.progress < 1 && <circle cx={head.x * width} cy={head.y * height} r={w * 1.1} fill={config.flow?.color ?? config.color} opacity=".85"/>}
  </>;
};
const effectBody = (config: MotionEffectConfig, frame: number, width: number, height: number, id: string) => {
  switch (config.type) {
    case 'path-motion': return <PathEffect config={config} frame={frame} width={width} height={height} id={`${id}-glow`}/>;
    case 'particles': return <ParticleEffect config={config} frame={frame} width={width} height={height}/>;
    case 'puffs': return <PuffEffect config={config} frame={frame} width={width} height={height} id={id}/>;
    case 'stroke-reveal': return <StrokeEffect config={config} frame={frame} width={width} height={height} id={id}/>;
  }
};
export const MotionEffect: React.FC<{config: MotionEffectConfig; frame: number; width: number; height: number; prefix: string}> = ({config, frame, width, height, prefix}) =>
  <g data-motion-effect-id={config.id} mask={config.clipToSource ? `url(#${prefix}-self)` : undefined}>{effectBody(config, frame, width, height, `${prefix}-${config.id}`)}</g>;
