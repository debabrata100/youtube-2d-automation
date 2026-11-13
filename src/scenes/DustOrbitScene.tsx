import React from 'react';
import {AnimatedText} from '../components/AnimatedText';
import {Asteroid} from '../components/Asteroid';
import {Camera2D} from '../components/Camera2D';
import {ParticleField} from '../components/ParticleField';
import {SpaceBackground} from '../components/SpaceBackground';
import {Star} from '../components/Star';
import {cameraPoseAt} from '../motion/camera';
import {orbitPosition} from '../motion/paths';
import type {SceneProps} from './types';

export const DustOrbitScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const center={x:515,y:1050};
  const pose=cameraPoseAt(frame,[{frame:0,focus:{x:550,y:1040},zoom:1.12,rotation:.25},{frame:38,focus:{x:500,y:1060},zoom:.98,rotation:-.15},{frame:duration,focus:{x:575,y:1035},zoom:1.08,rotation:.25}]);
  const rocks=Array.from({length:13},(_,i)=>{const depth=.68+(i%5)*.1;const p=orbitPosition(frame,{center,radiusX:210+i*26,radiusY:54+i*9,speed:config.animation.orbitSpeed*(.6+i*.028),phase:i*.69,direction:1});return <Asteroid key={i} x={p.x} y={p.y} size={11+(i%4)*6} rotation={frame*(.55+i*.07)+i*31} opacity={.62+i*.025} variant={i} depth={depth}/>});
  return <SpaceBackground seed={config.visual.seed} accent="#71442c">
    <Camera2D focus={pose.focus} zoom={pose.zoom} rotation={pose.rotation}>
      <svg width="1080" height="1920" style={{position:'absolute'}}>
        <defs><radialGradient id="disk-light"><stop offset="0" stopColor="#ffd782" stopOpacity=".22"/><stop offset=".58" stopColor="#e58a50" stopOpacity=".08"/><stop offset="1" stopColor="#6ddfe7" stopOpacity="0"/></radialGradient></defs>
        <ellipse cx={center.x} cy={center.y} rx="486" ry="168" fill="url(#disk-light)"/>
        {[0,1,2,3].map(i=><ellipse key={i} cx={center.x} cy={center.y} rx={230+i*72} ry={63+i*24} fill="none" stroke={i%2?'#72d9e5':'#ffd07a'} strokeWidth={i===0?5:2.5} opacity={.09+i*.025} strokeDasharray={i>1?'18 22':undefined}/>) }
      </svg>
      <ParticleField frame={frame} count={config.visual.density} seed={config.visual.seed} center={center} speed={config.animation.orbitSpeed}/>
      {rocks}
      <Star x={center.x} y={center.y} radius={136} rotation={frame*.3}/>
      <div style={{position:'absolute',left:40,top:930,width:1000,height:240,transform:'rotate(-8deg)',background:'linear-gradient(90deg,transparent,rgba(255,207,117,.13),transparent)',filter:'blur(18px)',opacity:.7}}/>
    </Camera2D>
    <AnimatedText text={config.title} frame={frame} duration={duration}/>
  </SpaceBackground>;
};
