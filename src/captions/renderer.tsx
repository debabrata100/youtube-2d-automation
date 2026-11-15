import React from 'react';
import {Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {captionAt} from './timing';
import type {NarrationOverlayConfig} from './schema';
import {fitCaptionFontSize} from './layout';
/** Optional generic overlay. No topic, artwork or template logic. */
export const NarrationOverlay:React.FC<{config:NarrationOverlayConfig}>=({config})=>{
 const frame=useCurrentFrame(),{width}=useVideoConfig(),cue=config.captionsEnabled?captionAt(config.cues,frame):undefined,style=config.style;
 const fontSize=React.useMemo(()=>{
  const preferred=style.fontSize*width/1080;
  if(!cue)return preferred;
  const context=typeof document==='undefined'?null:document.createElement('canvas').getContext('2d');
  if(context)context.font=`700 ${preferred}px Arial`;
  return fitCaptionFontSize(cue.lines,preferred,width*(1-style.left-style.right)-28,line=>context?.measureText(line).width??line.length*preferred*.65,36*width/1080);
 },[cue,style,width]);
 const opacity=cue?Math.min(1,(frame-cue.startFrame+1)/3,(cue.endFrame-frame)/3):0;
 return <><Audio src={staticFile(config.audioSrc)}/>
  {config.showAiDisclosureBanner&&<div data-ai-disclosure-banner style={{position:'absolute',top:30*width/1080,left:'8%',right:'16%',textAlign:'center',fontFamily:'Arial, sans-serif',fontSize:20*width/1080,color:'#fff4df',background:'#10152ecc',padding:6}}>{config.syntheticTestAudio?'MOCK TEST AUDIO · NOT SPOKEN NARRATION':'AI-GENERATED NARRATION'}</div>}
  {config.captionsEnabled&&cue&&<div data-caption-id={cue.id} style={{position:'absolute',top:`${style.top*100}%`,left:`${style.left*100}%`,right:`${style.right*100}%`,fontFamily:'Arial, sans-serif',fontWeight:700,fontSize,lineHeight:1.18,textAlign:'center',color:'#fff9e8',textShadow:'0 2px 6px #000',opacity,transform:`translateY(${(1-opacity)*4}px)`}}>{cue.lines.map((line,i)=><div key={i}><span style={{background:'#10152ee8',padding:'8px 14px',borderRadius:10,whiteSpace:'nowrap'}}>{line}</span></div>)}</div>}
 </>;
};
