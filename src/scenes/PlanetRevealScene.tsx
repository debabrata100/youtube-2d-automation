import React from 'react';
import {AnimatedText} from '../components/AnimatedText';
import {Camera2D} from '../components/Camera2D';
import {ParticleField} from '../components/ParticleField';
import {Planet} from '../components/Planet';
import {SpaceBackground} from '../components/SpaceBackground';
import {cameraPoseAt} from '../motion/camera';
import {easeOutCubic,progress} from '../motion/easing';
import type {SceneProps} from './types';

export const PlanetRevealScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const reveal=easeOutCubic(progress(frame,0,34));
  const center={x:560,y:1080};
  const pose=cameraPoseAt(frame,[{frame:0,focus:center,zoom:1.38,rotation:.25},{frame:34,focus:{x:555,y:1065},zoom:1.12,rotation:0},{frame:duration,focus:{x:535,y:1045},zoom:.9,rotation:-.18}]);
  return <SpaceBackground seed={config.visual.seed} accent="#165b79">
    <Camera2D focus={pose.focus} zoom={pose.zoom} rotation={pose.rotation}>
      <ParticleField frame={frame} count={config.visual.density} seed={config.visual.seed} center={center} speed={config.animation.orbitSpeed}/>
      <div style={{position:'absolute',left:120,top:950,width:880,height:360,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(87,235,231,.12),transparent 67%)',filter:'blur(20px)'}}/>
      <Planet x={center.x} y={center.y} radius={255} rotation={frame*1.05+80} scale={.83+.17*reveal} opacity={reveal} detail={reveal}/>
      <svg width="1080" height="1920" style={{position:'absolute'}}><path d="M145 1350 Q555 1480 945 1312" fill="none" stroke="#73edf0" strokeWidth="3" opacity=".2" strokeDasharray="16 24"/></svg>
    </Camera2D>
    <AnimatedText text={config.title} frame={frame} duration={duration}/>
  </SpaceBackground>;
};
