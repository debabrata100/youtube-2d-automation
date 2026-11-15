import React from 'react';
import {Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {activeWordIndex,captionAt} from './timing';
import type {CaptionCue,NarrationOverlayConfig} from './schema';
import {fitCaptionFontSize} from './layout';
import {ensureFont} from '../engine/style/fonts';
/** Eight-direction hard outline plus a soft drop shadow; legible over bright or busy imagery without a box. */
const outlineShadow=(color:string,fontSize:number)=>{const w=Math.max(2,fontSize*.07);const ring=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return`${(Math.cos(a)*w).toFixed(1)}px ${(Math.sin(a)*w).toFixed(1)}px 0 ${color}`;});return[...ring,`0 ${w*1.5}px ${w*3}px ${color}cc`].join(',');};
/** Word highlight: the most recently started word takes the accent colour and a slight pop; falls back to plain lines. */
const renderWords=(cue:CaptionCue,style:NarrationOverlayConfig['style'],frame:number,lineIndex:number,line:string)=>{
 const tokens=cue.lines.map(l=>l.split(' ')),total=tokens.flat().length;
 if(style.highlight!=='word'||!cue.words||cue.words.length!==total)return line;
 const active=activeWordIndex(cue.words,frame);
 const offset=tokens.slice(0,lineIndex).flat().length;
 return tokens[lineIndex].map((t,j)=><React.Fragment key={j}>{j>0&&' '}<span style={offset+j===active?{color:style.highlightColor,display:'inline-block',transform:'scale(1.1)'}:undefined}>{t}</span></React.Fragment>);
};
/** Optional generic overlay. No topic, artwork or template logic. */
export const NarrationOverlay:React.FC<{config:NarrationOverlayConfig}>=({config})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig(),cue=config.captionsEnabled?captionAt(config.cues,frame):undefined,style=config.style;
 /** Sizes follow the shorter side, so 9:16 and 16:9 frames get the same physical caption size. */
 const unit=Math.min(width,height)/1080,family=style.fontFamily??'Arial, sans-serif';
 ensureFont(style.fontFamily);
 const fontSize=React.useMemo(()=>{
  const preferred=style.fontSize*unit;
  if(!cue)return preferred;
  const context=typeof document==='undefined'?null:document.createElement('canvas').getContext('2d');
  if(context)context.font=`700 ${preferred}px ${family}`;
  return fitCaptionFontSize(cue.lines,preferred,width*(1-style.left-style.right)-28,line=>context?.measureText(line).width??line.length*preferred*.65,36*unit);
 },[cue,style,width,unit,family]);
 const opacity=cue?Math.min(1,(frame-cue.startFrame+1)/3,(cue.endFrame-frame)/3):0;
 return <><Audio src={staticFile(config.audioSrc)}/>
  {config.showAiDisclosureBanner&&<div data-ai-disclosure-banner style={{position:'absolute',top:30*width/1080,left:'8%',right:'16%',textAlign:'center',fontFamily:'Arial, sans-serif',fontSize:20*width/1080,color:'#fff4df',background:'#10152ecc',padding:6}}>{config.syntheticTestAudio?'MOCK TEST AUDIO · NOT SPOKEN NARRATION':'AI-GENERATED NARRATION'}</div>}
  {config.captionsEnabled&&cue&&<div data-caption-id={cue.id} style={{position:'absolute',top:`${style.top*100}%`,left:`${style.left*100}%`,right:`${style.right*100}%`,fontFamily:family,fontWeight:style.fontFamily?400:700,fontSize,lineHeight:1.18,textAlign:'center',color:style.textColor,textShadow:style.variant==='outline'?outlineShadow(style.outlineColor,fontSize):'0 2px 6px #000',opacity,transform:`translateY(${(1-opacity)*4}px)`}}>{cue.lines.map((line,i)=><div key={i}><span style={style.variant==='outline'?{whiteSpace:'nowrap'}:{background:'#10152ee8',padding:'8px 14px',borderRadius:10,whiteSpace:'nowrap'}}>{renderWords(cue,style,frame,i,line)}</span></div>)}</div>}
 </>;
};
