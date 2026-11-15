import React, {useId} from 'react';
import {Img, staticFile} from 'remotion';
import {MotionEffect} from '../motion/primitives/renderer';
import type {AssetRegistry} from '../assets/registry';
import type {IllustrationGroup, IllustrationLayerConfig} from '../storyboard/layers';
import {layerAssetIds} from '../storyboard/layers';
import {flowPositionAt, layerStateAt, maskSequenceAt, trackAt, wipeRectAt} from '../motion/layers';
import type {Storyboard, SubjectConfig} from '../storyboard/schema';
import {KitElement} from '../kit/KitElement';
import {getTheme, type Theme} from '../style/theme';
import {easeMotion} from '../motion/primitives/schema';
import {ensureFont} from '../style/fonts';
import {NOISE_TILES, boilTile} from '../style/ink';

const Layer: React.FC<{layer: IllustrationLayerConfig; frame: number; group: IllustrationGroup; assets: AssetRegistry; prefix: string; theme?: Theme}> = ({layer, frame, group, assets, prefix, theme}) => {
  const id = `${prefix}-${layer.id}`, state = layerStateAt(layer, frame), source = layer.asset ? staticFile(assets.resolve(layer.asset).path) : null;
  const anchor = layer.anchor ?? {x: group.width / 2, y: group.height / 2};
  const image = source ? <image href={source} width={group.width} height={group.height} preserveAspectRatio="xMidYMid meet"/> : null;
  const texture = layer.textureDrift;
  const phase = texture ? frame * 2 * Math.PI / texture.periodFrames : 0;
  const flow=layer.flow, pad=layer.maskPadding??0;
  const maskBounds={x:-pad,y:-pad,width:group.width+2*pad,height:group.height+2*pad};
  const flowPosition=flow?.type==='directional'?flowPositionAt(flow,frame):0;
  const flowSequence=flow?.type==='path'?maskSequenceAt(flow.maskKeys,frame):null;
  const art = <g transform={`translate(${state.x} ${state.y}) translate(${anchor.x} ${anchor.y}) scale(${state.scale}) translate(${-anchor.x} ${-anchor.y})`} style={{filter: `brightness(${state.brightness})`}}>
    {image}
    {layer.kit && theme && <KitElement config={layer.kit} theme={theme} width={group.width} height={group.height} frame={frame} id={`${id}-kit`}/>}
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

type Label = NonNullable<IllustrationGroup['annotations']>[number];
/** Plain: outlined text (legacy look). Pill: themed rounded label with a dot-anchored leader line. Ink: hand-written note with an arrow. */
const InkNote: React.FC<{label: Label; opacity: number; theme?: Theme}> = ({label, opacity, theme}) => {
  const color = label.color ?? theme?.palette.text.accent ?? '#e0262b', font = theme?.label.fontFamily ?? 'Arial, sans-serif', weight = theme?.label.fontWeight ?? 400;
  const s = label.pop ? .55 + .45 * easeMotion(opacity, 'ease-out-back') : 1, cy = label.y - label.size * .33;
  const c = label.connector, w = Math.max(2.5, label.size * .07);
  const head = c ? (() => {
    const a = Math.atan2(c.to.y - c.from.y, c.to.x - c.from.x), k = label.size * .45;
    return `M ${c.to.x - k * Math.cos(a - .45)} ${c.to.y - k * Math.sin(a - .45)} L ${c.to.x} ${c.to.y} L ${c.to.x - k * Math.cos(a + .45)} ${c.to.y - k * Math.sin(a + .45)}`;
  })() : null;
  const mid = c ? {x: (c.from.x + c.to.x) / 2 + (c.to.y - c.from.y) * .12, y: (c.from.y + c.to.y) / 2 - (c.to.x - c.from.x) * .12} : null;
  return <g opacity={Math.min(1, opacity * 1.5)}>
    {c && mid && <g opacity={Math.max(0, Math.min(1, opacity * 2 - .6))}>
      <path d={`M ${c.from.x} ${c.from.y} Q ${mid.x} ${mid.y} ${c.to.x} ${c.to.y}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round"/>
      <path d={head!} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>
    </g>}
    <text x={label.x} y={label.y} textAnchor={label.anchor} fill={color} fontFamily={font} fontWeight={weight} fontSize={label.size}
      stroke={color} strokeWidth={label.size * .035} strokeLinejoin="round"
      transform={s !== 1 ? `translate(${label.x} ${cy}) scale(${s}) translate(${-label.x} ${-cy})` : undefined}>{label.text}</text>
  </g>;
};
const Annotation: React.FC<{label: Label; opacity: number; theme?: Theme}> = ({label, opacity, theme}) => {
  if (label.variant === 'ink') return <InkNote label={label} opacity={opacity} theme={theme}/>;
  const pill = label.variant === 'pill';
  const fg = pill ? theme?.palette.label.fg ?? '#fff6e8' : '#fff1dc', bg = theme?.palette.label.bg ?? '#1a1226', line = pill ? theme?.palette.label.line ?? '#ffd6a0' : '#ffd6a0';
  const font = theme?.label.fontFamily ?? 'Arial, sans-serif', weight = pill ? theme?.label.fontWeight ?? 800 : 700;
  const w = label.text.length * label.size * .58 + label.size * 1.1, h = label.size * 1.5;
  const x0 = label.anchor === 'start' ? label.x - label.size * .55 : label.anchor === 'end' ? label.x - w + label.size * .55 : label.x - w / 2;
  // Pop: scale in with overshoot as the label fades in (label anchored at its pill centre).
  const s = label.pop ? .55 + .45 * easeMotion(opacity, 'ease-out-back') : 1, cx = x0 + w / 2, cy = label.y - label.size * .33;
  return <g opacity={opacity} transform={s !== 1 ? `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})` : undefined}>
    {label.connector && <>
      <line x1={label.connector.from.x} y1={label.connector.from.y} x2={label.connector.to.x} y2={label.connector.to.y} stroke={line} strokeWidth={pill ? 4 : 2} opacity={pill ? 1 : .75} strokeLinecap={pill ? 'round' : undefined}/>
      {pill && <circle cx={label.connector.to.x} cy={label.connector.to.y} r={7} fill={line} stroke={bg} strokeWidth={3}/>}
    </>}
    {pill && <rect x={x0} y={label.y - label.size * 1.08} width={w} height={h} rx={theme?.label.radius ?? 18} fill={bg} opacity=".92"/>}
    <text x={label.x} y={label.y} textAnchor={label.anchor} fill={fg} fontFamily={font} fontWeight={weight} fontSize={label.size} {...(pill ? {} : {stroke: '#241721', strokeWidth: 5, paintOrder: 'stroke'})}>{label.text}</text>
  </g>;
};

export const LayeredSubject: React.FC<{group: IllustrationGroup; subject: SubjectConfig; frame: number; storyboard: Storyboard; assets: AssetRegistry; scale?: number}> = ({group, subject, frame, storyboard, assets, scale = 1}) => {
  const prefix = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const width = storyboard.format.width * subject.size, height = width * group.height / group.width;
  const local = frame + (subject.timeOffset ?? 0);
  const references = [...new Set(group.layers.flatMap(layerAssetIds))];
  const theme = storyboard.themeId ? getTheme(storyboard.themeId) : undefined;
  ensureFont(theme?.label.fontFamily);
  const ink = theme?.ink, boil = ink ? boilTile(ink.seed + Math.floor(Math.max(0, local) * ink.fps / storyboard.format.fps)) : null, tile = ink ? 4 / ink.frequency : 0;
  return <div style={{position: 'absolute', left: storyboard.format.width * subject.x - width / 2, top: storyboard.format.height * subject.y - height / 2, width, height, transform: `scale(${scale})`}}>
    <svg width={width} height={height} viewBox={`0 0 ${group.width} ${group.height}`} style={{overflow: 'visible'}}>
      <defs><filter id={`${prefix}-black`}><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter></defs>
      {ink && boil && <defs><filter id={`${prefix}-ink`} filterUnits="userSpaceOnUse" x={-group.width * .05} y={-group.height * .05} width={group.width * 1.1} height={group.height * 1.1}>
        <feImage href={NOISE_TILES[boil.index]} x={-boil.dx * tile} y={-boil.dy * tile} width={tile} height={tile} preserveAspectRatio="none" result="tile"/>
        <feTile in="tile" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={ink.amplitude * 2} xChannelSelector="R" yChannelSelector="G"/>
      </filter></defs>}
      <g filter={ink ? `url(#${prefix}-ink)` : undefined}>
        {group.layers.map(layer => <Layer key={layer.id} layer={layer} frame={local} group={group} assets={assets} prefix={prefix} theme={theme}/>)}
        {group.annotations?.map(label => <Annotation key={label.id} label={label} opacity={trackAt(local, label.opacity, 1)} theme={theme}/>)}
      </g>
    </svg>
    {/* Remotion loading gates also cover native SVG image/mask references. */}
    <div style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none'}}>{references.map(id => <Img key={id} src={staticFile(assets.resolve(id).path)} style={{width: 1, height: 1}}/>)}{ink && NOISE_TILES.map(src => <Img key={src} src={src} style={{width: 1, height: 1}}/>)}</div>
  </div>;
};
