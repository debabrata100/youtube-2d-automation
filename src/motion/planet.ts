import {clamp01,easeOutCubic,progress,smoothstep} from './easing';

/** Measured alpha>8 bounds; keep the source square and its small natural ellipticity. */
export const planetAssetGeometry={width:1254,height:1254,bounds:{left:140,top:129,right:1110,bottom:1124},radiusX:232.3,radiusY:238.3} as const;

export const planetMotionAt=(frame:number)=>({
  scale:1+.0015*Math.sin(frame*Math.PI*2/310),
  glowOpacity:.035+.005*Math.sin(frame*Math.PI*2/233),
  rimOpacity:.07+.012*Math.sin(frame*Math.PI*2/271),
});

export const planetFormationAt=(formation:number,detail=1)=>{
  const p=clamp01(formation);
  const reveal=smoothstep((p-.08)/.80)*clamp01(detail/.82);
  return {
    // A soft interior reveal exposes one stationary texture under the same silhouette.
    revealInner:Math.max(0,reveal*1.5-.32),
    revealOuter:Math.max(.025,reveal*1.5+.04),
    substrateOpacity:1-smoothstep((p-.62)/.30),
    heatOpacity:(1-smoothstep((p-.48)/.40))*.3,
    complete:p>=.999&&detail>=.999,
  };
};

export const rockyBodyPath=(formation:number)=>{
  const p=clamp01(formation);
  const envelope=.81+.21*smoothstep(p);
  return Array.from({length:56},(_,i)=>{
    const angle=i/56*Math.PI*2;
    const irregular=(Math.sin(i*2.31+1.2)*12+Math.sin(i*4.73)*5+Math.cos(i*1.17)*4)*(1-p);
    return `${i?'L':'M'}${(299+Math.cos(angle)*(planetAssetGeometry.radiusX*envelope+irregular)).toFixed(2)} ${(300+Math.sin(angle)*(planetAssetGeometry.radiusY*envelope+irregular)).toFixed(2)}`;
  }).join(' ')+' Z';
};

/** Match the outgoing 156px body at 1.28 camera zoom to the incoming 1.24 zoom. */
export const heroPlanetScale=(frame:number)=>{
  const startScale=156*1.28/(240*1.24);
  return startScale+(1-startScale)*easeOutCubic(progress(frame,0,34));
};

export const accretionHaloOpacity=(frame:number,duration:number)=>.92*(1-smoothstep(progress(frame,duration-20,duration-1)));
