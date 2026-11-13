import React from 'react';
import {theme} from '../themes/space-theme';
import {easeOutCubic, progress, smoothstep} from '../motion/easing';
export const AnimatedText:React.FC<{text:string;frame:number;duration:number;kicker?:string}> = ({text,frame,duration,kicker='HOW PLANETS FORM'}) => {
 const enter=easeOutCubic(progress(frame,8,25)); const exit=smoothstep(progress(frame,duration-15,duration-2));
 return <div style={{position:'absolute',left:84,right:84,top:132,opacity:enter*(1-exit),transform:`translateY(${(1-enter)*36}px)`,fontFamily:theme.font,color:theme.colors.white,textAlign:'center',zIndex:50,textShadow:'0 4px 24px rgba(0,0,0,.5)'}}>
   <div style={{fontSize:26,fontWeight:800,letterSpacing:7,color:'#7de2e8',marginBottom:18}}>{kicker}</div>
   <div style={{fontSize:66,lineHeight:1.1,fontWeight:850,letterSpacing:-2}}>{text}</div>
   <div style={{width:90,height:6,borderRadius:8,background:'linear-gradient(90deg,#ffd166,#ef7b63)',margin:'28px auto 0',transform:`scaleX(${enter})`}}/>
 </div>;
};
