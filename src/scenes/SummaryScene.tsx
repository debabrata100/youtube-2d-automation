import React from 'react';
import {AnimatedText} from '../components/AnimatedText';
import {Camera2D} from '../components/Camera2D';
import {ParticleField} from '../components/ParticleField';
import {Planet} from '../components/Planet';
import {SpaceBackground} from '../components/SpaceBackground';
import {Star} from '../components/Star';
import {Asteroid} from '../components/Asteroid';
import {closingShotAt} from '../composition/closing-shot';
import {easeOutCubic,progress} from '../motion/easing';
import type {SceneProps} from './types';

export const SummaryScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const {star,planet,planetRadius,focus,zoom}=closingShotAt(frame);
  const globalFrame=config.startFrame+frame;
  return <SpaceBackground seed={config.visual.seed} accent="#244b73">
    <Camera2D focus={focus} zoom={zoom} rotation={0}>
      <svg width="1080" height="1920" style={{position:'absolute'}}>
        <path d="M-40 1130 Q120 738 559 812 Q912 865 1110 1220" fill="none" stroke="#d3ab7f" strokeWidth="2" opacity=".12" strokeDasharray="80 170 130 90" strokeDashoffset={-frame*.45}/>
        <path d={`M-90 ${1330+Math.sin(frame/16)*8} Q430 ${1240-frame*.2} 1180 ${1395-frame*.15}`} fill="none" stroke="#e4a373" strokeWidth="68" opacity=".07" filter="blur(13px)"/>
      </svg>
      <ParticleField frame={globalFrame} count={config.visual.density} seed={config.visual.seed} center={star} speed={config.animation.orbitSpeed}/>
      <Star x={star.x} y={star.y} radius={165} intensity={.9} rotation={globalFrame} opacity={easeOutCubic(progress(frame,0,12))}/>
      <Planet x={planet.x} y={planet.y} radius={planetRadius} rotation={globalFrame*.42} formation={1} detail={1}/>
      <Asteroid x={85+frame*.14} y={1470+Math.sin(frame/24)*5} size={78} rotation={frame*.14} opacity={.32*easeOutCubic(progress(frame,0,16))} variant={17} depth={1.35}/>
      <Asteroid x={1040-frame*.1} y={1325+Math.sin(frame/31)*4} size={26} rotation={frame*.23} opacity={.22*easeOutCubic(progress(frame,0,16))} variant={11} depth={1.1}/>
    </Camera2D>
    <AnimatedText text={config.title} emphasis="Millions of years" frame={frame} duration={duration} kicker="FROM DUST TO PLANET" placement="top-left" variant="hero" accent="#ffd27a" hold/>
  </SpaceBackground>;
};
