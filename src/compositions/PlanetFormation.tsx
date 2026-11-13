import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame} from 'remotion';
import {transitionState} from '../motion/transitions';
import type {SceneConfig,ScenePlan} from '../schemas/scene-plan';
import {AccretionScene} from '../scenes/AccretionScene';
import {DustOrbitScene} from '../scenes/DustOrbitScene';
import {PlanetRevealScene} from '../scenes/PlanetRevealScene';
import {StarBirthScene} from '../scenes/StarBirthScene';
import {SummaryScene} from '../scenes/SummaryScene';

const overlapFrames=14;

const Scene:React.FC<{config:SceneConfig;renderDuration:number;isLast:boolean}> = ({config,renderDuration,isLast})=>{
  const frame=useCurrentFrame();
  const props={frame,duration:config.durationFrames,config};
  const templates={
    'space-reveal':<StarBirthScene {...props}/>,
    'particle-orbit':<DustOrbitScene {...props}/>,
    accretion:<AccretionScene {...props}/>,
    'planet-reveal':<PlanetRevealScene {...props}/>,
    summary:<SummaryScene {...props}/>,
  };
  const style=transitionState(frame,renderDuration,config.transition,!isLast);
  return <AbsoluteFill style={{...style,background:'#070a25',overflow:'hidden'}}>{templates[config.template]}</AbsoluteFill>;
};

export const PlanetFormation:React.FC<{plan:ScenePlan}>=({plan})=><AbsoluteFill style={{background:'#070a25'}}>{plan.scenes.map((scene,index)=>{
  const isLast=index===plan.scenes.length-1;
  const renderDuration=scene.durationFrames+(isLast?0:overlapFrames);
  return <Sequence key={scene.id} from={scene.startFrame} durationInFrames={renderDuration} premountFor={18}><Scene config={scene} renderDuration={renderDuration} isLast={isLast}/></Sequence>;
})}</AbsoluteFill>;
