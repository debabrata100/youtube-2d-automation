import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {createAssetRegistry} from '../engine/assets/registry';
import {cameraPresetAt} from '../engine/camera/presets';
import {subjectEnvelope} from '../engine/motion/presets';
import {parseStoryboard, type GenericScene, type Storyboard} from '../engine/storyboard/schema';
import {storyboardTimeline,sceneAnimationFrame} from '../engine/storyboard/timeline';
import {TemplateContent} from '../engine/templates/registry';
import {Camera2D} from '../components/Camera2D';
import {makeParticles} from '../motion/particles';
import {crossfadeAt, trackAt} from '../engine/motion/layers';
import {NarrationOverlay} from '../captions/renderer';
import type {NarrationOverlayConfig} from '../captions/schema';

const StoryboardScene: React.FC<{storyboard: Storyboard; scene: GenericScene; first?: boolean; last?: boolean; hideCaptions?:boolean}> = ({storyboard, scene, first = true, last = true,hideCaptions=false}) => {
  const timelineFrame = useCurrentFrame();
  const sceneFrame = Math.min(timelineFrame, scene.durationFrames - 1);
  const frame = sceneAnimationFrame(scene,sceneFrame);
  const contentScene = scene.animationDurationFrames ? {...scene,durationFrames:scene.animationDurationFrames} : scene;
  const {width, height} = storyboard.format;
  const assets = React.useMemo(() => createAssetRegistry(storyboard.assets), [storyboard.assets]);
  const camera = cameraPresetAt(scene.camera, sceneFrame, scene.durationFrames, width, height);
  const opacity = storyboard.crossfadeFrames ? crossfadeAt(timelineFrame, scene.durationFrames, storyboard.crossfadeFrames, first, last) : scene.caption.hold ? 1 : subjectEnvelope(sceneFrame, scene.durationFrames, scene.transitionFrames);
  const fontSize = width * (scene.caption.preset === 'headline' ? .068 : scene.caption.preset === 'closing' ? .06 : .05);
  return <AbsoluteFill style={{opacity}}>
    {scene.environmentDim !== undefined && <AbsoluteFill style={{background: '#10101f', opacity: scene.environmentDim}}/>}
    <Camera2D focus={camera.focus} zoom={camera.zoom} rotation={camera.rotation} viewport={{x: width / 2, y: height / 2}}><TemplateContent storyboard={storyboard} scene={contentScene} frame={frame} assets={assets}/></Camera2D>
    {!hideCaptions&&<div style={{position: 'absolute', left: width * .08, right: width * .08, top: height * .075, textAlign: 'center', fontFamily: 'Arial, sans-serif', color: scene.caption.color, fontWeight: 700, textShadow: '0 3px 16px #0008'}}>
      {scene.caption.kicker && <div style={{fontSize: width * .022, color: storyboard.accent, letterSpacing: width * .003, marginBottom: height * .012}}>{scene.caption.kicker}</div>}
      <div style={{fontSize, lineHeight: 1.12, whiteSpace: 'pre-line', overflowWrap: 'break-word'}}>{scene.caption.text}</div>
    </div>}
  </AbsoluteFill>;
};

export const StoryboardComposition: React.FC<{storyboard: Storyboard;narration?:NarrationOverlayConfig}> = ({storyboard: input,narration}) => {
  const storyboard = React.useMemo(() => parseStoryboard(input), [input]);
  const globalFrame=useCurrentFrame();
  const backdropMotion=storyboard.backdrop?.motion;
  const {width, height} = storyboard.format;
  const particles = React.useMemo(() => makeParticles(36, 2021), []);
  return <AbsoluteFill style={{background: storyboard.background, overflow: 'hidden'}}>
    {storyboard.backdrop && <><Img src={staticFile(storyboard.assets.find(asset => asset.id === storyboard.backdrop!.asset)!.path)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',transform:backdropMotion?`translate(${trackAt(globalFrame,backdropMotion.x,0)}px,${trackAt(globalFrame,backdropMotion.y,0)}px) scale(${trackAt(globalFrame,backdropMotion.scale,1)})`:undefined}}/><AbsoluteFill style={{background: '#10101f', opacity: storyboard.backdrop.dim}}/></>}
    {(!storyboard.backdrop || storyboard.backdrop.decoration) && <>
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 35% 45%, ${storyboard.accent}13, transparent 70%)`}}/>
    <svg width={width} height={height} style={{position: 'absolute'}}>{particles.map(p => <circle key={p.id} cx={p.phase / (Math.PI * 2) * width} cy={p.radiusX / 500 * height} r={width / 1080 * (p.size * .14)} fill="#ffffff" opacity={p.opacity * .3}/>)}</svg>
    </>}
    {storyboardTimeline(storyboard).map(({scene, startFrame}, i) => <Sequence key={scene.id} from={startFrame} durationInFrames={scene.durationFrames + (i < storyboard.scenes.length - 1 ? storyboard.crossfadeFrames ?? 0 : 0)}><StoryboardScene storyboard={storyboard} scene={scene} first={i === 0} last={i === storyboard.scenes.length - 1} hideCaptions={Boolean(narration)}/></Sequence>)}
    {narration&&<NarrationOverlay config={narration}/>}
  </AbsoluteFill>;
};
