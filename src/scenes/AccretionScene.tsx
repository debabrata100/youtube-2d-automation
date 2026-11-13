import React from 'react';
import {AnimatedText} from '../components/AnimatedText';
import {Asteroid} from '../components/Asteroid';
import {Camera2D} from '../components/Camera2D';
import {ConvergenceField} from '../components/ConvergenceField';
import {Planet} from '../components/Planet';
import {SpaceBackground} from '../components/SpaceBackground';
import {cameraPoseAt} from '../motion/camera';
import {easeOutCubic,progress,smoothstep} from '../motion/easing';
import type {SceneProps} from './types';

export const AccretionScene:React.FC<SceneProps>=({frame,duration,config})=>{
  const center={x:570,y:1060};
  const growth=easeOutCubic(progress(frame,12,duration-12));
  const planetEmergence=smoothstep(progress(frame,58,duration-8));
  const pose=cameraPoseAt(frame,[{frame:0,focus:{x:455,y:1040},zoom:.9,rotation:-.35},{frame:42,focus:{x:545,y:1055},zoom:1.08,rotation:0},{frame:88,focus:center,zoom:1.23,rotation:.15},{frame:duration,focus:center,zoom:1.12,rotation:0}]);
  return <SpaceBackground seed={config.visual.seed} accent="#65334d">
    <Camera2D focus={pose.focus} zoom={pose.zoom} rotation={pose.rotation}>
      <ConvergenceField frame={frame} count={config.visual.density} seed={config.visual.seed} center={center} startFrame={2} endFrame={duration-7}/>
      {Array.from({length:9},(_,i)=>{const local=smoothstep(progress(frame,8+i*3,80+i*2));const a=i/9*Math.PI*2+frame*(.018+i*.0007);const radius=(1-local)*(350+i*10)+42;return <Asteroid key={i} x={center.x+Math.cos(a)*radius} y={center.y+Math.sin(a)*radius*.43} size={(18+i*2)*(1-local*.65)} rotation={frame*(i%2?.8:-.65)+i*39} opacity={1-local*.8} color={i%2?'#d36d5c':'#c98765'} variant={i} depth={.72+(i%4)*.09}/>})}
      <Asteroid x={center.x} y={center.y} size={42+105*growth} rotation={frame*.24} color="#d87961" variant={2}/>
      <Planet x={center.x} y={center.y} radius={148} rotation={frame*.75} scale={.72+.28*planetEmergence} opacity={planetEmergence} detail={planetEmergence}/>
      <div style={{position:'absolute',left:center.x-190,top:center.y-190,width:380,height:380,borderRadius:'50%',boxShadow:`0 0 ${50+growth*95}px rgba(255,145,87,${.12+growth*.27})`,opacity:.9}}/>
    </Camera2D>
    <AnimatedText text={config.title} frame={frame} duration={duration}/>
  </SpaceBackground>;
};
