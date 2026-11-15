import React, {useId} from 'react';
import {Img, staticFile} from 'remotion';
import {MotionEffect} from '../motion/primitives/renderer';
import type {AssetRegistry} from '../assets/registry';
import type {IllustrationGroup, IllustrationLayerConfig} from '../storyboard/layers';
import {layerAssetIds} from '../storyboard/layers';
import {flowPositionAt, layerStateAt, maskSequenceAt, trackAt, wipeRectAt} from '../motion/layers';
import type {Storyboard, SubjectConfig} from '../storyboard/schema';

const Layer: React.FC<{layer: IllustrationLayerConfig; frame: number; group: IllustrationGroup; assets: AssetRegistry; prefix: string}> = ({layer, frame, group, assets, prefix}) => {
  const id = `${prefix}-${layer.id}`, state = layerStateAt(layer, frame), source = staticFile(assets.resolve(layer.asset).path);
  const anchor = layer.anchor ?? {x: group.width / 2, y: group.height / 2};
  const image = <image href={source} width={group.width} height={group.height} preserveAspectRatio="xMidYMid meet"/>;
  const texture = layer.textureDrift;
  const phase = texture ? frame * 2 * Math.PI / texture.periodFrames : 0;
  const flow=layer.flow, pad=layer.maskPadding??0;
  const maskBounds={x:-pad,y:-pad,width:group.width+2*pad,height:group.height+2*pad};
  const flowPosition=flow?.type==='directional'?flowPositionAt(flow,frame):0;
  const flowSequence=flow?.type==='path'?maskSequenceAt(flow.maskKeys,frame):null;
  const art = <g transform={`translate(${state.x} ${state.y}) translate(${anchor.x} ${anchor.y}) scale(${state.scale}) translate(${-anchor.x} ${-anchor.y})`} style={{filter: `brightness(${state.brightness})`}}>
    {image}
    {texture && <g mask={`url(#${id}-self)`} opacity={texture.opacity}><g transform={`translate(${Math.sin(phase) * texture.x} ${Math.cos(phase) * texture.y})`}>{image}</g></g>}
    {flow && <g mask={`url(#${id}-self)`} opacity={flow.opacity}>{flowSequence?<rect width={group.width} height={group.height} fill="#fff0b4" mask={`url(#${id}-flow-path)`}/>:<rect {...(flow.type==='directional'?flow.bounds:{})} fill={`url(#${id}-flow-gradient)`}/>}</g>}
    {layer.effects?.map(effect=><MotionEffect key={effect.id} config={effect} frame={frame} width={group.width} height={group.height} prefix={id}/>)}
  </g>;
  let content = art;
  if (layer.reveal) content = <g mask={`url(#${id}-reveal)`}>{content}</g>;
  for (let i = (layer.masks?.length ?? 0) - 1; i >= 0; i--) content = <g mask={`url(#${id}-mask-${i})`}>{content}</g>;
  const reveal = layer.reveal;
  const wipe = reveal?.type === 'wipe' ? wipeRectAt(reveal, frame) : null;
  const sequence = reveal?.type === 'mask-sequence' ? maskSequenceAt(reveal.keys, frame) : null;
  let gradient: React.ReactNode = null;
  if (reveal?.type === 'wipe' && reveal.feather) {
    const b = reveal.bounds, p = trackAt(frame, reveal.progress, 0), f = reveal.feather;
    const vertical = reveal.direction === 'up' || reveal.direction === 'down', reverse = reveal.direction === 'up' || reveal.direction === 'left';
    const origin = vertical ? b.y : b.x, extent = vertical ? b.height : b.width;
    const front = reverse ? origin + extent + f - p * (extent + 2 * f) : origin - f + p * (extent + 2 * f);
    const whiteFirst=reverse===Boolean(reveal.invert);
    gradient = <linearGradient id={`${id}-gradient`} gradientUnits="userSpaceOnUse" x1={vertical ? 0 : front - f} x2={vertical ? 0 : front + f} y1={vertical ? front - f : 0} y2={vertical ? front + f : 0}><stop offset="0" stopColor={whiteFirst?'white':'black'}/><stop offset="1" stopColor={whiteFirst?'black':'white'}/></linearGradient>;
  }
  return <g data-illustration-layer={layer.id} opacity={state.opacity}>
    <defs>
      {(texture||flow||layer.effects?.some(e=>e.clipToSource)) && <mask id={`${id}-self`} maskUnits="userSpaceOnUse" x="0" y="0" width={group.width} height={group.height} style={{maskType: 'alpha'}}>{image}</mask>}
      {flow?.type==='directional'&&<linearGradient id={`${id}-flow-gradient`} gradientUnits="userSpaceOnUse" x1={flow.direction==='up'||flow.direction==='down'?0:flowPosition-flow.bandWidth} x2={flow.direction==='up'||flow.direction==='down'?0:flowPosition+flow.bandWidth} y1={flow.direction==='up'||flow.direction==='down'?flowPosition-flow.bandWidth:0} y2={flow.direction==='up'||flow.direction==='down'?flowPosition+flow.bandWidth:0}><stop offset="0" stopColor="#fff0b4" stopOpacity="0"/><stop offset=".5" stopColor="#fff0b4" stopOpacity="1"/><stop offset="1" stopColor="#fff0b4" stopOpacity="0"/></linearGradient>}
      {flowSequence&&<mask id={`${id}-flow-path`} maskUnits="userSpaceOnUse" x="0" y="0" width={group.width} height={group.height} style={{maskType:'alpha'}}><image href={staticFile(assets.resolve(flowSequence.previous).path)} width={group.width} height={group.height} opacity={1-flowSequence.mix}/>{flowSequence.next!==flowSequence.previous&&<image href={staticFile(assets.resolve(flowSequence.next).path)} width={group.width} height={group.height} opacity={flowSequence.mix}/>}</mask>}
      {layer.masks?.map((mask, i) => <mask key={i} id={`${id}-mask-${i}`} maskUnits="userSpaceOnUse" {...maskBounds} style={{maskType: mask.mode === 'inverse-alpha' ? 'luminance' : 'alpha'}}>
        {mask.mode === 'inverse-alpha' && <rect {...maskBounds} fill="white"/>}
        <image href={staticFile(assets.resolve(mask.asset).path)} width={group.width} height={group.height} filter={mask.mode === 'inverse-alpha' ? `url(#${prefix}-black)` : undefined}/>
      </mask>)}
      {gradient}
      {reveal && <mask id={`${id}-reveal`} maskUnits="userSpaceOnUse" {...maskBounds} style={{maskType: reveal.type === 'wipe' ? 'luminance' : 'alpha'}}>
        {reveal.type==='wipe'&&reveal.invert&&!gradient&&<rect {...maskBounds} fill="white"/>}
        {wipe && (gradient ? <rect {...(reveal.type === 'wipe' ? reveal.bounds : {})} fill={`url(#${id}-gradient)`}/> : <rect {...wipe} fill={reveal.type==='wipe'&&reveal.invert?'black':'white'}/>)}
        {sequence && <><image href={staticFile(assets.resolve(sequence.previous).path)} width={group.width} height={group.height}/>{sequence.next !== sequence.previous && <image href={staticFile(assets.resolve(sequence.next).path)} width={group.width} height={group.height} opacity={sequence.mix}/>}</>}
      </mask>}
    </defs>
    {content}
  </g>;
};

export const LayeredSubject: React.FC<{group: IllustrationGroup; subject: SubjectConfig; frame: number; storyboard: Storyboard; assets: AssetRegistry; scale?: number}> = ({group, subject, frame, storyboard, assets, scale = 1}) => {
  const prefix = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const width = storyboard.format.width * subject.size, height = width * group.height / group.width;
  const local = frame + (subject.timeOffset ?? 0);
  const references = [...new Set(group.layers.flatMap(layerAssetIds))];
  return <div style={{position: 'absolute', left: storyboard.format.width * subject.x - width / 2, top: storyboard.format.height * subject.y - height / 2, width, height, transform: `scale(${scale})`}}>
    <svg width={width} height={height} viewBox={`0 0 ${group.width} ${group.height}`} style={{overflow: 'visible'}}>
      <defs><filter id={`${prefix}-black`}><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter></defs>
      {group.layers.map(layer => <Layer key={layer.id} layer={layer} frame={local} group={group} assets={assets} prefix={prefix}/>)}
      {group.annotations?.map(label => <g key={label.id} opacity={trackAt(local, label.opacity, 1)}>
        {label.connector && <line x1={label.connector.from.x} y1={label.connector.from.y} x2={label.connector.to.x} y2={label.connector.to.y} stroke="#ffd6a0" strokeWidth="2" opacity=".75"/>}
        <text x={label.x} y={label.y} textAnchor={label.anchor} fill="#fff1dc" fontFamily="Arial, sans-serif" fontWeight="700" fontSize={label.size} stroke="#241721" strokeWidth="5" paintOrder="stroke">{label.text}</text>
      </g>)}
    </svg>
    {/* Remotion loading gates also cover native SVG image/mask references. */}
    <div style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none'}}>{references.map(id => <Img key={id} src={staticFile(assets.resolve(id).path)} style={{width: 1, height: 1}}/>)}</div>
  </div>;
};
