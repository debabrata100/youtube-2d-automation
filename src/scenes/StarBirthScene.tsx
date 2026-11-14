import React from 'react';
import {AnimatedText} from '../components/AnimatedText';
import {Camera2D} from '../components/Camera2D';
import {ParticleField} from '../components/ParticleField';
import {SpaceBackground} from '../components/SpaceBackground';
import {Star} from '../components/Star';
import {createShotComposition} from '../composition/shot-presets';
import {cameraPoseAt} from '../motion/camera';
import {easeOutCubic,progress} from '../motion/easing';
import type {SceneProps} from './types';

export const StarBirthScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const center={x:620,y:1080};
  const born=easeOutCubic(progress(frame,0,18));
  const handoff=1-.22*easeOutCubic(progress(frame,duration-20,duration));
  const shot=createShotComposition(config.animation.shotPreset??'medium-explanatory',center,duration,{x:665,y:1065});
  const pose=cameraPoseAt(frame,shot.keyframes);
  const globalFrame=config.startFrame+frame;
  return <SpaceBackground seed={config.visual.seed} accent="#633da4">
    <Camera2D focus={pose.focus} zoom={pose.zoom} rotation={pose.rotation}>
      <ParticleField frame={globalFrame} count={config.visual.density} seed={config.visual.seed} center={center} speed={config.animation.orbitSpeed}/>
      <div style={{opacity:.9+.1*born,transform:`scale(${(.86+.14*born)*handoff})`,transformOrigin:`${center.x}px ${center.y}px`}}><Star x={center.x} y={center.y} radius={210} intensity={config.visual.glow} rotation={globalFrame}/></div>
      <svg width="1080" height="1920" style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none'}}>
        <defs><linearGradient id="opening-dust" x1="0" x2="1"><stop stopColor="#b46066" stopOpacity="0"/><stop offset=".43" stopColor="#f0a86b" stopOpacity=".2"/><stop offset=".68" stopColor="#9b6d8e" stopOpacity=".13"/><stop offset="1" stopColor="#493968" stopOpacity="0"/></linearGradient></defs>
        <path d={`M-130 ${1305+Math.sin(frame/14)*7} Q330 ${1190-frame*.18} 1160 ${1328-frame*.1}`} fill="none" stroke="url(#opening-dust)" strokeWidth="118" strokeLinecap="round" opacity=".7" filter="blur(16px)"/>
        <path d={`M-80 ${1290+Math.sin(frame/14)*7} Q340 ${1190-frame*.18} 1130 ${1310-frame*.1}`} fill="none" stroke="#f4c187" strokeWidth="3" strokeDasharray="10 28" strokeDashoffset={-globalFrame*1.1} opacity=".2"/>
      </svg>
      <div style={{position:'absolute',left:-116+frame*.32,top:1215+Math.sin(frame/18)*7,width:290,height:215,borderRadius:'48% 52% 43% 57%',background:'radial-gradient(circle at 65% 28%,#a17676,#3b2946 54%,#111329 82%)',opacity:.62,transform:'rotate(-24deg)',filter:'blur(.5px)',boxShadow:'30px 35px 60px rgba(0,0,0,.42)'}}/>
    </Camera2D>
    <AnimatedText text={config.title} emphasis="young stars" frame={frame} duration={duration} placement="top-left" variant="hero" accent="#ffd27a"/>
  </SpaceBackground>;
};
