import React from 'react';
export const Star:React.FC<{x:number;y:number;radius?:number;intensity?:number;rotation?:number}> = ({x,y,radius=130,intensity=1,rotation=0}) => <svg width={radius*5} height={radius*5} viewBox="0 0 500 500" style={{position:'absolute',left:x-radius*2.5,top:y-radius*2.5,overflow:'visible',filter:`drop-shadow(0 0 ${35*intensity}px #ffb52e)`}}>
  <defs><radialGradient id="sun-core"><stop offset="0" stopColor="#fffbe7"/><stop offset=".28" stopColor="#ffe98e"/><stop offset=".72" stopColor="#ffb52e"/><stop offset="1" stopColor="#ef5b28"/></radialGradient><filter id="soft"><feGaussianBlur stdDeviation="12"/></filter></defs>
  <circle cx="250" cy="250" r="150" fill="#ff9f2f" opacity=".18" filter="url(#soft)"/>
  <g transform={`rotate(${rotation} 250 250)`}>{Array.from({length:16},(_,i)=><path key={i} d="M250 46 Q263 106 250 126 Q237 106 250 46" fill="#ffd166" opacity={.28+(i%3)*.12} transform={`rotate(${i*22.5} 250 250)`}/>)}</g>
  <circle cx="250" cy="250" r="112" fill="url(#sun-core)"/>
  <path d="M174 226 C205 189 226 212 255 190 C282 170 313 195 331 225 C294 212 274 238 243 226 C215 215 199 244 174 226Z" fill="#fff4bd" opacity=".45"/>
</svg>;
