import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame} from 'remotion';
import type {SceneConfig,ScenePlan} from '../schemas/scene-plan';
import {AccretionScene} from '../scenes/AccretionScene';
import {DustOrbitScene} from '../scenes/DustOrbitScene';
import {PlanetRevealScene} from '../scenes/PlanetRevealScene';
import {StarBirthScene} from '../scenes/StarBirthScene';
import {SummaryScene} from '../scenes/SummaryScene';
import {chronologicalScenes} from '../timeline/scene-order';

export const sceneOverlapFrames=0;

const Scene:React.FC<{config:SceneConfig}> = ({config})=>{
  const frame=useCurrentFrame();
  const props={frame,duration:config.durationFrames,config};
  const templates={
    'space-reveal':<StarBirthScene {...props}/>,
    'particle-orbit':<DustOrbitScene {...props}/>,
    accretion:<AccretionScene {...props}/>,
    'planet-reveal':<PlanetRevealScene {...props}/>,
    summary:<SummaryScene {...props}/>,
  };
  return <AbsoluteFill style={{background:'#070a25',overflow:'hidden'}}>{templates[config.template]}</AbsoluteFill>;
};

export const PlanetFormation:React.FC<{plan:ScenePlan}>=({plan})=>{const scenes=chronologicalScenes(plan);return <AbsoluteFill style={{background:'#070a25'}}>{scenes.map(scene=>{
  return <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames} premountFor={18}><Scene config={scene}/></Sequence>;
})}</AbsoluteFill>};
