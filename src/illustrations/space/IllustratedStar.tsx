import React from 'react';
import {Img,staticFile} from 'remotion';
import {IllustrationLayer} from '../core/IllustrationLayer';
import {LayeredIllustration} from '../core/LayeredIllustration';
import {starMotionAt} from '../../motion/star';

export const approvedSunAsset='illustrations/star/sun-approved.png';

/** The painted photosphere stays fixed: rotating it would rotate its light source. */
export const IllustratedStar:React.FC<{x:number;y:number;radius?:number;intensity?:number;frame?:number;scale?:number;opacity?:number}>=({x,y,radius=150,intensity=1,frame=0,scale=1,opacity=1})=>{
  const motion=starMotionAt(frame);
  // The disk occupies ~59% of the padded PNG: retain the previous disk radius.
  const size=radius*3.25;
  const source=staticFile(approvedSunAsset);
  return <LayeredIllustration label="Approved illustrated young star" x={x} y={y} width={size} height={size} scale={scale*motion.scale} opacity={opacity}>
    <IllustrationLayer id="atmosphere" role="atmosphere" opacity={motion.glowOpacity*Math.max(0,intensity)}>
      <circle cx="300" cy="300" r="180" fill="#ffad45" style={{filter:`blur(${motion.glowBlur}px)`}}/>
    </IllustrationLayer>
    <IllustrationLayer id="corona-drift" role="atmosphere" opacity={motion.coronaOpacity}>
      <foreignObject x="0" y="0" width="600" height="600" style={{overflow:'visible'}}>
        <div style={{width:600,height:600,maskImage:'radial-gradient(circle at 49% 48%, transparent 0 174px, #000 202px, transparent 267px)',WebkitMaskImage:'radial-gradient(circle at 49% 48%, transparent 0 174px, #000 202px, transparent 267px)'}}>
          <Img src={source} style={{width:600,height:600,objectFit:'contain',transform:`translate(${motion.coronaX}px,${motion.coronaY}px) scale(${motion.coronaScale})`}}/>
        </div>
      </foreignObject>
    </IllustrationLayer>
    <IllustrationLayer id="approved-artwork" role="material">
      <foreignObject x="0" y="0" width="600" height="600">
        <Img src={source} style={{display:'block',width:600,height:600,objectFit:'contain'}}/>
      </foreignObject>
    </IllustrationLayer>
  </LayeredIllustration>;
};
