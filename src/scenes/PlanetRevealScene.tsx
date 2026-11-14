import React from 'react';
import {Asteroid} from '../components/Asteroid';
import {AnimatedText} from '../components/AnimatedText';
import {Camera2D} from '../components/Camera2D';
import {ParticleField} from '../components/ParticleField';
import {Planet} from '../components/Planet';
import {SpaceBackground} from '../components/SpaceBackground';
import {createShotComposition} from '../composition/shot-presets';
import {cameraPoseAt} from '../motion/camera';
import {heroPlanetScale} from '../motion/planet';
import {easeOutCubic,progress} from '../motion/easing';
import type {SceneProps} from './types';

export const PlanetRevealScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const center={x:665,y:1085};
  const shot=createShotComposition(config.animation.shotPreset??'hero-reveal',center,duration,{x:650,y:1065});
  const pose=cameraPoseAt(frame,shot.keyframes);
  const globalFrame=config.startFrame+frame;
  const environment=easeOutCubic(progress(frame,0,16));
  return <SpaceBackground seed={config.visual.seed} accent="#165b79">
    <Camera2D focus={pose.focus} zoom={pose.zoom} rotation={pose.rotation}>
      <div style={{position:'absolute',inset:0,opacity:environment}}><ParticleField frame={globalFrame} count={config.visual.density} seed={config.visual.seed} center={center} speed={config.animation.orbitSpeed}/></div>
      <div style={{position:'absolute',left:115,top:925,width:940,height:410,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(244,157,91,.13),rgba(87,235,231,.07) 42%,transparent 70%)',filter:'blur(22px)'}}/>
      <Planet x={center.x} y={center.y} radius={240} rotation={globalFrame*.42} scale={heroPlanetScale(frame)} opacity={1} detail={1} formation={1}/>
      <svg width="1080" height="1920" style={{position:'absolute'}}>
        <path d="M95 1390 Q555 1505 1010 1328" fill="none" stroke="#73edf0" strokeWidth="3" opacity=".18" strokeDasharray="16 24" strokeDashoffset={-frame*.8}/>
        <path d={`M160 ${1225-frame*.28} Q560 ${1160-frame*.12} 1040 ${1240-frame*.2}`} fill="none" stroke="#ffd19a" strokeWidth="44" opacity=".045" filter="blur(12px)"/>
      </svg>
      <Asteroid x={1010-frame*.18} y={1395+Math.sin(frame/16)*8} size={82} rotation={24+frame*.15} color="#6d4a4c" opacity={.4*environment} variant={1} depth={1.2}/>
    </Camera2D>
    <AnimatedText text={config.title} emphasis="takes shape" frame={frame} duration={duration} placement="top-left" variant="hero" accent="#8ce7e8"/>
  </SpaceBackground>;
};
