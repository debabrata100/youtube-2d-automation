import React from 'react';

export const AccretionEnvironment:React.FC<{center:{x:number;y:number};frame:number;intensity?:number}>=({center,frame,intensity=1})=><svg width="1080" height="1920" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
  <defs><radialGradient id="accretion-haze"><stop stopColor="#ffbf72" stopOpacity={.18*intensity}/><stop offset=".48" stopColor="#b65a61" stopOpacity={.08*intensity}/><stop offset="1" stopColor="#3b255d" stopOpacity="0"/></radialGradient></defs>
  <ellipse cx={center.x} cy={center.y} rx="430" ry="230" fill="url(#accretion-haze)" transform={`rotate(${Math.sin(frame/70)*4} ${center.x} ${center.y})`}/>
  <path d={`M${center.x-410} ${center.y+70} Q${center.x} ${center.y-165} ${center.x+420} ${center.y+55}`} fill="none" stroke="#ffcf82" strokeWidth="3" opacity=".09" strokeDasharray="12 25" strokeDashoffset={-frame*1.7}/>
  <path d={`M${center.x-360} ${center.y+120} Q${center.x} ${center.y-105} ${center.x+370} ${center.y+100}`} fill="none" stroke="#6de4e7" strokeWidth="2" opacity=".11" strokeDasharray="8 22" strokeDashoffset={frame*1.2}/>
</svg>;
