import React from 'react';
import {AnimatedText} from '../components/AnimatedText';
import {Camera2D} from '../components/Camera2D';
import {ParticleField} from '../components/ParticleField';
import {Planet} from '../components/Planet';
import {SpaceBackground} from '../components/SpaceBackground';
import {Star} from '../components/Star';
import {cameraPoseAt} from '../motion/camera';
import {orbitPosition} from '../motion/paths';
import type {SceneProps} from './types';

export const SummaryScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const star={x:340,y:1080}; const orbit=orbitPosition(frame,{center:star,radiusX:355,radiusY:138,speed:config.animation.orbitSpeed,phase:.32});
  const pose=cameraPoseAt(frame,[{frame:0,focus:{x:510,y:1070},zoom:1.08,rotation:-.12},{frame:24,focus:{x:500,y:1060},zoom:.96,rotation:0},{frame:duration,focus:{x:480,y:1045},zoom:.9,rotation:.08}]);
  return <SpaceBackground seed={config.visual.seed} accent="#244b73">
    <Camera2D focus={pose.focus} zoom={pose.zoom} rotation={pose.rotation}>
      <svg width="1080" height="1920" style={{position:'absolute'}}><ellipse cx={star.x} cy={star.y} rx="360" ry="140" fill="none" stroke="#8ce7e8" strokeWidth="3" opacity=".22" strokeDasharray="14 18"/></svg>
      <ParticleField frame={frame} count={config.visual.density} seed={config.visual.seed} center={star} speed={config.animation.orbitSpeed}/>
      <Star x={star.x} y={star.y} radius={158} rotation={frame*.25}/>
      <Planet x={orbit.x} y={orbit.y} radius={112} rotation={frame*1.05+170}/>
    </Camera2D>
    <div style={{position:'absolute',left:84,right:84,bottom:146,textAlign:'center',color:'#b4c3df',fontFamily:'Inter, sans-serif',fontSize:25,letterSpacing:1.2,textShadow:'0 3px 16px #02051a'}}>A simplified view — the real process unfolds across cosmic time.</div>
    <AnimatedText text={config.title} frame={frame} duration={duration} kicker="THE BIG PICTURE"/>
  </SpaceBackground>;
};
