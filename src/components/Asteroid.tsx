import React from 'react';

const shapes=[
  'M11 38 L23 16 L49 8 L76 17 L92 38 L87 68 L66 89 L35 92 L12 72 L6 52Z',
  'M8 44 L20 18 L43 10 L65 14 L91 34 L94 61 L74 86 L48 94 L22 80 L7 60Z',
  'M13 30 L37 8 L68 12 L89 31 L94 57 L79 79 L56 92 L26 83 L7 60Z',
];
export const Asteroid:React.FC<{x:number;y:number;size:number;rotation:number;color?:string;opacity?:number;variant?:number;depth?:number}> = ({x,y,size,rotation,color='#c57a5c',opacity=1,variant=0,depth=1}) => {
  const shape=shapes[Math.abs(variant)%shapes.length];
  return <svg width={size*2.3} height={size*2.3} viewBox="0 0 100 100" style={{position:'absolute',left:x-size*1.15,top:y-size*1.15,transform:`rotate(${rotation}deg) scale(${depth})`,opacity:opacity*(.55+.45*depth),filter:`drop-shadow(${4*depth}px ${7*depth}px ${7*depth}px rgba(0,0,0,.5))`}}>
    <defs><linearGradient id={`rock-${variant}`} x1="15%" y1="8%" x2="86%" y2="90%"><stop offset="0" stopColor="#f4aa79"/><stop offset=".42" stopColor={color}/><stop offset="1" stopColor="#613b4c"/></linearGradient><clipPath id={`rock-clip-${variant}`}><path d={shape}/></clipPath></defs>
    <path d={shape} fill={`url(#rock-${variant})`}/>
    <g clipPath={`url(#rock-clip-${variant})`}>
      <path d="M2 55 L37 23 L58 42 L42 72 L13 78Z" fill="#fff0c4" opacity=".16"/>
      <path d="M56 42 L97 27 L101 83 L70 96 L42 72Z" fill="#3a2740" opacity=".28"/>
      <path d="M19 34 Q34 19 49 30 Q45 47 27 50Z" fill="#713f4c" opacity=".5"/>
      <ellipse cx="70" cy="63" rx="13" ry="10" fill="#321f37" opacity=".35"/><ellipse cx="67" cy="59" rx="7" ry="5" fill="#ffd2a0" opacity=".16"/>
      <circle cx="45" cy="76" r="6" fill="#46283c" opacity=".32"/>
    </g>
  </svg>;
};
