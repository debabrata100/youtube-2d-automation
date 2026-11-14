import React,{useId} from 'react';
import {Img,staticFile} from 'remotion';
import {IllustrationLayer} from '../core/IllustrationLayer';
import {LayeredIllustration} from '../core/LayeredIllustration';
import {planetFormationAt,planetMotionAt,rockyBodyPath,planetAssetGeometry} from '../../motion/planet';

export {rockyBodyPath} from '../../motion/planet';
export const approvedPlanetAsset='illustrations/planet/rocky-planet-approved.png';

export const IllustratedRockyPlanet:React.FC<{x:number;y:number;radius?:number;frame?:number;scale?:number;opacity?:number;detail?:number;formation?:number;glow?:number}>=({x,y,radius=180,frame=0,scale=1,opacity=1,detail=1,formation=1,glow=1})=>{
  const id=useId().replace(/[^a-zA-Z0-9-]/g,'');
  const motion=planetMotionAt(frame);
  const state=planetFormationAt(formation,detail);
  const silhouette=rockyBodyPath(formation);
  const size=radius*600/planetAssetGeometry.radiusX;
  return <LayeredIllustration label="Approved illustrated rocky planet" x={x} y={y} width={size} height={size} scale={scale*motion.scale} opacity={opacity}>
    <defs>
      <clipPath id={`${id}-body`}><path d={silhouette}/></clipPath>
      <radialGradient id={`${id}-substrate`} cx="28%" cy="23%"><stop stopColor="#d58b54"/><stop offset=".5" stopColor="#86442d"/><stop offset="1" stopColor="#21191c"/></radialGradient>
      <radialGradient id={`${id}-reveal`}><stop offset={state.revealInner} stopColor="white"/><stop offset={state.revealOuter} stopColor="black"/></radialGradient>
      <mask id={`${id}-surface`} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600"><rect width="600" height="600" fill={`url(#${id}-reveal)`}/></mask>
    </defs>
    <IllustrationLayer id="atmosphere" role="atmosphere" opacity={Math.max(0,glow)*motion.glowOpacity}>
      <ellipse cx="300" cy="300" rx="229" ry="235" fill="#f39b58" style={{filter:'blur(13px)'}}/>
    </IllustrationLayer>
    <IllustrationLayer id="growing-body" role="silhouette" opacity={state.substrateOpacity}>
      <path d={silhouette} fill={`url(#${id}-substrate)`}/>
    </IllustrationLayer>
    <IllustrationLayer id="approved-surface" role="material">
      <g clipPath={state.complete?undefined:`url(#${id}-body)`} mask={state.complete?undefined:`url(#${id}-surface)`}>
        <foreignObject x="0" y="0" width="600" height="600">
          <Img src={staticFile(approvedPlanetAsset)} style={{display:'block',width:600,height:600,objectFit:'contain'}}/>
        </foreignObject>
      </g>
    </IllustrationLayer>
    <IllustrationLayer id="formation-fractures" role="highlight" opacity={state.heatOpacity}>
      <g clipPath={`url(#${id}-body)`}>
        <path d="M226 148 L240 197 L226 220 L248 252 M359 351 L341 376 L350 402" fill="none" stroke="#ed9551" strokeWidth="2" strokeLinecap="round" opacity=".4"/>
      </g>
    </IllustrationLayer>
    <IllustrationLayer id="rim-light" role="rim" opacity={Math.max(0,glow)*motion.rimOpacity}>
      <path d="M152 139 A232 238 0 0 0 85 359" fill="none" stroke="#ffbe7c" strokeWidth="1.5" strokeLinecap="round"/>
    </IllustrationLayer>
  </LayeredIllustration>;
};
