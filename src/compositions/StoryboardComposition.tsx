import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {createAssetRegistry} from '../engine/assets/registry';
import {cameraPresetAt} from '../engine/camera/presets';
import {subjectEnvelope} from '../engine/motion/presets';
import {parseStoryboard, type GenericScene, type Storyboard} from '../engine/storyboard/schema';
import {storyboardTimeline} from '../engine/storyboard/timeline';
import {TemplateContent} from '../engine/templates/registry';
import {Camera2D} from '../components/Camera2D';
import {makeParticles} from '../motion/particles';

const StoryboardScene: React.FC<{storyboard: Storyboard; scene: GenericScene}> = ({storyboard, scene}) => {
  const frame = useCurrentFrame();
  const {width, height} = storyboard.format;
  const assets = React.useMemo(() => createAssetRegistry(storyboard.assets), [storyboard.assets]);
  const camera = cameraPresetAt(scene.camera, frame, scene.durationFrames, width, height);
  const opacity = subjectEnvelope(frame, scene.durationFrames, scene.transitionFrames);
  const fontSize = width * (scene.caption.preset === 'headline' ? .068 : scene.caption.preset === 'closing' ? .06 : .05);
  return <AbsoluteFill style={{opacity}}>
    <Camera2D focus={camera.focus} zoom={camera.zoom} rotation={camera.rotation} viewport={{x: width / 2, y: height / 2}}><TemplateContent storyboard={storyboard} scene={scene} frame={frame} assets={assets}/></Camera2D>
    <div style={{position: 'absolute', left: width * .08, right: width * .08, top: height * .075, textAlign: 'center', fontFamily: 'Arial, sans-serif', color: scene.caption.color, fontWeight: 700, textShadow: '0 3px 16px #0008'}}>
      {scene.caption.kicker && <div style={{fontSize: width * .022, color: storyboard.accent, letterSpacing: width * .003, marginBottom: height * .012}}>{scene.caption.kicker}</div>}
      <div style={{fontSize, lineHeight: 1.12, whiteSpace: 'pre-line', overflowWrap: 'break-word'}}>{scene.caption.text}</div>
    </div>
  </AbsoluteFill>;
};

export const StoryboardComposition: React.FC<{storyboard: Storyboard}> = ({storyboard: input}) => {
  const storyboard = React.useMemo(() => parseStoryboard(input), [input]);
  const {width, height} = storyboard.format;
  const particles = React.useMemo(() => makeParticles(36, 2021), []);
  return <AbsoluteFill style={{background: storyboard.background, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 35% 45%, ${storyboard.accent}13, transparent 70%)`}}/>
    <svg width={width} height={height} style={{position: 'absolute'}}>{particles.map(p => <circle key={p.id} cx={p.phase / (Math.PI * 2) * width} cy={p.radiusX / 500 * height} r={width / 1080 * (p.size * .14)} fill="#ffffff" opacity={p.opacity * .3}/>)}</svg>
    {storyboardTimeline(storyboard).map(({scene, startFrame}) => <Sequence key={scene.id} from={startFrame} durationInFrames={scene.durationFrames}><StoryboardScene storyboard={storyboard} scene={scene}/></Sequence>)}
  </AbsoluteFill>;
};
