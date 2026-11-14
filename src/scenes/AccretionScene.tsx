import React,{useMemo} from 'react';
import {AccretionImpacts} from '../components/AccretionImpacts';
import {AnimatedText} from '../components/AnimatedText';
import {Asteroid} from '../components/Asteroid';
import {Camera2D} from '../components/Camera2D';
import {ConvergenceField} from '../components/ConvergenceField';
import {Planet} from '../components/Planet';
import {SpaceBackground} from '../components/SpaceBackground';
import {AccretionEnvironment} from '../illustrations/space/AccretionEnvironment';
import {createShotComposition} from '../composition/shot-presets';
import {bodyGrowthAt,impactPulse,makeImpactEvents} from '../motion/accretion';
import {cameraPoseAt} from '../motion/camera';
import {smoothstep} from '../motion/easing';
import {accretionHaloOpacity} from '../motion/planet';
import type {SceneProps} from './types';

export const AccretionScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const center={x:665,y:1085};
  const events=useMemo(()=>makeImpactEvents(config.visual.seed+91,8,duration),[config.visual.seed,duration]);
  const {mass,radius:bodyRadius,formation:planetEmergence,contactRadius}=bodyGrowthAt(events,frame,duration);
  const contactRadiusAt=(at:number)=>bodyGrowthAt(events,at,duration).contactRadius;
  const impactCompression=Math.max(0,...events.map(event=>impactPulse(event,frame)))*.012;
  const globalFrame=config.startFrame+frame;
  const shot=createShotComposition(config.animation.shotPreset??'close-up-detail',center,duration,{x:625,y:1060});
  const pose=cameraPoseAt(frame,shot.keyframes);
  return <SpaceBackground seed={config.visual.seed} accent="#65334d">
    <Camera2D focus={pose.focus} zoom={pose.zoom*(1+.005*Math.max(0,...events.filter(e=>e.id%3===0).map(e=>impactPulse(e,frame))))} rotation={pose.rotation}>
      <AccretionEnvironment center={center} frame={frame} intensity={1.2}/>
      <ConvergenceField frame={frame} count={Math.round(config.visual.density*.72)} seed={config.visual.seed} center={center} startFrame={2} endFrame={duration-7}/>
      <Asteroid x={84-frame*.36} y={1250+Math.sin(frame/13)*18} size={88} rotation={-18+frame*.18} opacity={.34} color="#784b49" variant={2} depth={1.22}/>
      <AccretionImpacts events={events} frame={frame} center={center} bodyRadius={contactRadius} contactRadiusAt={contactRadiusAt} layer="fragments"/>
      <Planet x={center.x} y={center.y} radius={bodyRadius} rotation={globalFrame*.42} formation={planetEmergence} detail={Math.max(.12,planetEmergence)} scale={1-impactCompression} opacity={1}/>
      <AccretionImpacts events={events} frame={frame} center={center} bodyRadius={contactRadius} contactRadiusAt={contactRadiusAt} layer="effects"/>
      <div style={{position:'absolute',left:center.x-bodyRadius-48,top:center.y-bodyRadius-48,width:(bodyRadius+48)*2,height:(bodyRadius+48)*2,borderRadius:'50%',boxShadow:`0 0 ${58+mass*84}px rgba(255,133,75,${.14+mass*.18})`,opacity:accretionHaloOpacity(frame,duration)}}/>
    </Camera2D>
    <div style={{position:'absolute',inset:-80,background:'linear-gradient(112deg,rgba(63,37,55,.55),rgba(188,101,74,.92) 43%,rgba(246,177,99,.78) 58%,rgba(18,18,43,.52))',filter:'blur(22px)',opacity:.76*(1-smoothstep(frame/12)),transform:`translateX(${-70+frame*15}px)`,pointerEvents:'none'}}/>
    <AnimatedText text={config.title} emphasis="gradually combine" frame={frame} duration={duration} placement={shot.textPlacement} accent="#ffb06f"/>
  </SpaceBackground>;
};
