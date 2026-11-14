import React from 'react';
import {AnimatedText} from '../components/AnimatedText';
import {Asteroid} from '../components/Asteroid';
import {Camera2D} from '../components/Camera2D';
import {ParticleField} from '../components/ParticleField';
import {SpaceBackground} from '../components/SpaceBackground';
import {Star} from '../components/Star';
import {createShotComposition} from '../composition/shot-presets';
import {ProtoplanetaryDisk} from '../illustrations/space/ProtoplanetaryDisk';
import {cameraPoseAt} from '../motion/camera';
import {easeOutCubic,progress,smoothstep} from '../motion/easing';
import {orbitPosition} from '../motion/paths';
import type {SceneProps} from './types';

export const DustOrbitScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const center={x:620,y:1080};
  const globalFrame=config.startFrame+frame;
  const diskSettle=easeOutCubic(progress(frame,0,26));
  const diskReveal=.14+.86*easeOutCubic(progress(frame,0,14));
  const shot=createShotComposition(config.animation.shotPreset??'establishing-wide',center,duration,{x:650,y:1060});
  const pose=cameraPoseAt(frame,shot.keyframes);
  const rocks=Array.from({length:13},(_,i)=>{const depth=.68+(i%5)*.1;const p=orbitPosition(globalFrame,{center,radiusX:210+i*26,radiusY:54+i*9,speed:config.animation.orbitSpeed*(.6+i*.028),phase:i*.69,direction:1});return <Asteroid key={i} x={p.x} y={p.y} size={11+(i%4)*6} rotation={globalFrame*(.55+i*.07)+i*31} opacity={.5+i*.024} variant={i} depth={depth}/>});
  return <SpaceBackground seed={config.visual.seed} accent="#71442c">
    <Camera2D focus={pose.focus} zoom={pose.zoom} rotation={pose.rotation}>
      <ProtoplanetaryDisk center={center} frame={globalFrame} seed={config.visual.seed} layer="back" speed={.012} radiusX={505} radiusY={126} intensity={1.08} rotation={-9} opacity={diskReveal}/>
      <ParticleField frame={globalFrame} count={Math.round(config.visual.density*.42)} seed={config.visual.seed+41} center={center} speed={config.animation.orbitSpeed}/>
      {rocks.slice(0,8)}
      <Star x={center.x} y={center.y} radius={225-75*diskSettle} intensity={1.05} rotation={globalFrame}/>
      <ProtoplanetaryDisk center={center} frame={globalFrame} seed={config.visual.seed} layer="front" speed={.012} radiusX={505} radiusY={126} intensity={1.12} rotation={-9} opacity={diskReveal}/>
      {rocks.slice(8)}
      <Asteroid x={-18+frame*.25} y={1325+Math.sin(frame/15)*9} size={90} rotation={-26+frame*.17} color="#694348" opacity={.38} variant={1} depth={1.2}/>
    </Camera2D>
    <div style={{position:'absolute',inset:-80,background:'linear-gradient(112deg,rgba(63,37,55,.55),rgba(188,101,74,.92) 43%,rgba(246,177,99,.78) 58%,rgba(18,18,43,.52))',filter:'blur(22px)',opacity:.76*smoothstep(progress(frame,duration-16,duration)),transform:`translateX(${-280+(frame-duration+16)*17}px)`,pointerEvents:'none'}}/>
    <AnimatedText text={config.title} emphasis="Gas and dust" frame={frame} duration={duration} placement={shot.textPlacement} accent="#ffc878"/>
  </SpaceBackground>;
};
