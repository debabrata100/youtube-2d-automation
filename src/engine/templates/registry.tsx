import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import type {AssetRegistry} from '../assets/registry';
import type {GenericScene, Storyboard, SubjectConfig} from '../storyboard/schema';
import {motionPresetAt} from '../motion/presets';
import {makeParticles, particleOrbit} from '../../motion/particles';
import {convergenceState} from '../../motion/convergence';
import {smoothstep} from '../../motion/easing';

export type TemplateProps = {scene: GenericScene; frame: number; storyboard: Storyboard; assets: AssetRegistry};
type Context = Omit<TemplateProps, 'scene'>;
const Subject: React.FC<Context & {subject: SubjectConfig; scale?: number}> = ({subject, storyboard, assets, scale = 1}) => {
  const asset = assets.resolve(subject.asset);
  const width = storyboard.format.width * subject.size;
  const height = width * asset.height / asset.width;
  return <Img src={staticFile(asset.path)} alt={asset.id} style={{position: 'absolute', left: storyboard.format.width * subject.x - width / 2, top: storyboard.format.height * subject.y - height / 2, width, height, objectFit: 'contain', transform: `scale(${scale})`}}/>;
};

const HeroReveal: React.FC<TemplateProps> = props => {
  if (props.scene.template !== 'hero-reveal') throw new Error('hero-reveal configuration mismatch');
  return <Subject {...props} subject={props.scene.config.primary}/>;
};
const OrbitalEnvironment: React.FC<TemplateProps> = props => {
  const {scene, frame, storyboard} = props;
  if (scene.template !== 'orbital-environment') throw new Error('orbital-environment configuration mismatch');
  const {primary, secondary, count, radiusX, radiusY, cycles} = scene.config;
  const phase = frame / Math.max(1, scene.durationFrames - 1) * Math.PI * 2 * cycles;
  const cx = primary.x * storyboard.format.width, cy = primary.y * storyboard.format.height;
  const particles = makeParticles(count, scene.seed);
  const dots = particles.map(p => {
    const position = particleOrbit(p, phase, {x: 0, y: 0}, 1);
    return <circle key={p.id} cx={cx + position.x / 500 * radiusX * storyboard.format.width} cy={cy + position.y / 140 * radiusY * storyboard.format.height} r={p.size * storyboard.format.width / 1080 * .55} fill={storyboard.accent} opacity={p.opacity * .65}/>;
  });
  return <><svg width="100%" height="100%" style={{position: 'absolute'}}>{dots}</svg><Subject {...props} subject={primary}/>{secondary && <Subject {...props} subject={{...secondary, x: secondary.x + Math.cos(phase) * radiusX, y: secondary.y + Math.sin(phase) * radiusY}}/>}</>;
};
const Transformation: React.FC<TemplateProps> = props => {
  const {scene, frame, storyboard} = props;
  if (scene.template !== 'transformation') throw new Error('transformation configuration mismatch');
  const {primary, fromScale, toScale, count} = scene.config;
  const t = smoothstep(frame / Math.max(1, scene.durationFrames - 1));
  const particles = makeParticles(count, scene.seed);
  return <>{scene.motion.preset === 'particle-convergence' && <svg width="100%" height="100%" style={{position: 'absolute'}}>{particles.map(p => {
    const state = convergenceState(p, frame / Math.max(1, scene.durationFrames - 1) * 120, {x: 0, y: 0}, 0, 120);
    return <circle key={p.id} cx={primary.x * storyboard.format.width + state.position.x * storyboard.format.width / 1080} cy={primary.y * storyboard.format.height + state.position.y * storyboard.format.height / 1920} r={p.size * state.scale * storyboard.format.width / 1080} fill={storyboard.accent} opacity={state.opacity}/>;
  })}</svg>}<Subject {...props} subject={primary} scale={fromScale + (toScale - fromScale) * t}/></>;
};
const Comparison: React.FC<TemplateProps> = props => {
  const {scene, storyboard} = props;
  if (scene.template !== 'comparison') throw new Error('comparison configuration mismatch');
  return <><Subject {...props} subject={scene.config.left}/><Subject {...props} subject={scene.config.right}/>{[scene.config.left, scene.config.right].map((subject, i) => <div key={i} style={{position: 'absolute', left: (subject.x - .2) * storyboard.format.width, width: storyboard.format.width * .4, top: storyboard.format.height * (subject.y + .18), color: storyboard.accent, textAlign: 'center', fontSize: storyboard.format.width * .032, fontFamily: 'Arial, sans-serif', fontWeight: 700}}>{i ? scene.config.rightLabel : scene.config.leftLabel}</div>)}</>;
};
const Summary: React.FC<TemplateProps> = props => {
  if (props.scene.template !== 'summary') throw new Error('summary configuration mismatch');
  return <>{props.scene.config.subjects.map((subject, i) => <Subject key={i} {...props} subject={subject}/>)}</>;
};

export const templateRegistry = Object.freeze({
  'hero-reveal': HeroReveal,
  'orbital-environment': OrbitalEnvironment,
  transformation: Transformation,
  comparison: Comparison,
  summary: Summary,
} satisfies Record<GenericScene['template'], React.FC<TemplateProps>>);
export const resolveTemplate = (name: string): React.FC<TemplateProps> => {
  if (!Object.hasOwn(templateRegistry, name)) throw new Error(`Unknown scene template: ${name}`);
  return templateRegistry[name as keyof typeof templateRegistry];
};

export const TemplateContent: React.FC<TemplateProps> = props => {
  const Component = resolveTemplate(props.scene.template);
  const state = motionPresetAt(props.scene.motion, props.frame, props.scene.durationFrames);
  return <AbsoluteFill style={{transform: `translate(${state.x * props.storyboard.format.width}px, ${state.y * props.storyboard.format.height}px) scale(${state.scale})`}}><Component {...props}/></AbsoluteFill>;
};
