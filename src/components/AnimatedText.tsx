import React from 'react';
import {theme} from '../themes/space-theme';
import {easeOutCubic, progress, smoothstep} from '../motion/easing';
import type {TextPlacement} from '../composition/shot-presets';

type TextVariant='standard'|'hero'|'compact';
type Props={text:string;frame:number;duration:number;kicker?:string;placement?:TextPlacement;emphasis?:string;variant?:TextVariant;accent?:string;hold?:boolean};

const EmphasizedText:React.FC<{text:string;emphasis?:string;accent:string}>=({text,emphasis,accent})=>{
  if(!emphasis)return <>{text}</>;
  const index=text.toLocaleLowerCase().indexOf(emphasis.toLocaleLowerCase());
  if(index<0)return <>{text}</>;
  return <>{text.slice(0,index)}<span style={{color:accent,textShadow:`0 0 30px ${accent}42,0 4px 24px rgba(0,0,0,.55)`}}>{text.slice(index,index+emphasis.length)}</span>{text.slice(index+emphasis.length)}</>;
};

export const AnimatedText:React.FC<Props> = ({text,frame,duration,kicker='HOW PLANETS FORM',placement='top-center',emphasis,variant='standard',accent='#7de2e8',hold=false}) => {
 const enter=hold?1:easeOutCubic(progress(frame,4,20)); const exit=hold?0:smoothstep(progress(frame,duration-13,duration-2));
 const placementStyle:React.CSSProperties=placement==='top-left'?{left:84,right:260,top:150,textAlign:'left'}:placement==='lower-third'?{left:84,right:84,top:1375,textAlign:'center'}:{left:84,right:84,top:128,textAlign:'center'};
 const fontSize=variant==='hero'?82:variant==='compact'?62:72;
 const centered=placement!=='top-left';
 return <div style={{position:'absolute',...placementStyle,opacity:enter*(1-exit),transform:`translate3d(${(1-enter)*(centered?0:-22)}px,${(1-enter)*28}px,0)`,fontFamily:theme.font,color:theme.colors.white,zIndex:50,textShadow:'0 4px 24px rgba(0,0,0,.58)'}}>
   <div style={{display:'flex',alignItems:'center',justifyContent:centered?'center':'flex-start',gap:14,marginBottom:18}}>
    <span style={{display:'block',width:36,height:4,borderRadius:6,background:'linear-gradient(90deg,#ffd166,#ef7b63)',transform:`scaleX(${enter})`,transformOrigin:centered?'right':'left'}}/>
    <span style={{fontSize:24,fontWeight:800,letterSpacing:6,color:accent}}>{kicker}</span>
   </div>
   <div style={{fontSize,lineHeight:1.06,fontWeight:850,letterSpacing:-2.3,maxWidth:variant==='hero'?900:820,margin:centered?'0 auto':'0',whiteSpace:'pre-line'}}><EmphasizedText text={text} emphasis={emphasis} accent={accent}/></div>
 </div>;
};
