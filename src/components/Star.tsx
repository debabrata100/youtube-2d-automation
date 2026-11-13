import React from 'react';

export const Star:React.FC<{x:number;y:number;radius?:number;intensity?:number;rotation?:number}> = ({x,y,radius=130,intensity=1,rotation=0}) => {
  const pulse=1+Math.sin(rotation*.11)*.025;
  const id=`star-${Math.round(x)}-${Math.round(y)}`;
  return <svg width={radius*5} height={radius*5} viewBox="0 0 500 500" style={{position:'absolute',left:x-radius*2.5,top:y-radius*2.5,overflow:'visible',filter:`drop-shadow(0 0 ${34*intensity}px #ff9d28) drop-shadow(0 0 ${70*intensity}px rgba(255,177,54,.35))`,transform:`scale(${pulse})`}}>
    <defs>
      <radialGradient id={`${id}-core`} cx="36%" cy="32%"><stop offset="0" stopColor="#fffef0"/><stop offset=".16" stopColor="#fff4ad"/><stop offset=".48" stopColor="#ffd252"/><stop offset=".78" stopColor="#ff972d"/><stop offset="1" stopColor="#ec5727"/></radialGradient>
      <radialGradient id={`${id}-bloom`}><stop offset="0" stopColor="#ffd45d" stopOpacity=".52"/><stop offset=".5" stopColor="#ff9c2f" stopOpacity=".17"/><stop offset="1" stopColor="#ff7b2e" stopOpacity="0"/></radialGradient>
      <clipPath id={`${id}-clip`}><circle cx="250" cy="250" r="112"/></clipPath>
      <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="11"/></filter>
    </defs>
    <circle cx="250" cy="250" r="192" fill={`url(#${id}-bloom)`} filter={`url(#${id}-blur)`}/>
    <g transform={`rotate(${rotation*.42} 250 250)`} opacity=".76">{Array.from({length:20},(_,i)=>{const long=i%3===0;return <path key={i} d={long?'M250 32 C267 88 264 117 250 137 C236 116 234 87 250 32':'M250 61 C261 100 260 122 250 142 C240 122 239 100 250 61'} fill={i%2?'#ffb53d':'#ffe17a'} opacity={.28+(i%4)*.08} transform={`rotate(${i*18} 250 250)`}/>})}</g>
    <g transform={`rotate(${-rotation*.72} 250 250)`} fill="none" strokeLinecap="round">
      <path d="M99 207 C127 184 142 157 151 128" stroke="#ffd25b" strokeWidth="9" opacity=".45"/>
      <path d="M367 145 C391 174 405 198 410 225" stroke="#ffb73d" strokeWidth="7" opacity=".38"/>
      <path d="M129 338 C159 361 182 375 211 381" stroke="#ffcf57" strokeWidth="8" opacity=".33"/>
    </g>
    <circle cx="250" cy="250" r="112" fill={`url(#${id}-core)`}/>
    <g clipPath={`url(#${id}-clip)`} opacity=".45" transform={`rotate(${rotation*.18} 250 250)`}>
      <path d="M112 205 C159 168 191 200 231 172 C276 141 307 192 354 170 C395 151 415 196 404 220 C345 207 319 244 270 224 C219 203 184 244 127 230Z" fill="#fff2a3"/>
      <path d="M126 297 C171 267 205 287 245 271 C291 253 331 285 383 263 L391 306 C335 331 291 298 244 324 C199 349 156 325 126 297Z" fill="#f6842e" opacity=".38"/>
      <circle cx="205" cy="215" r="17" fill="#fffbd4" opacity=".48"/><circle cx="305" cy="291" r="24" fill="#d95526" opacity=".18"/>
    </g>
    <ellipse cx="218" cy="203" rx="46" ry="26" fill="#fff" opacity=".18" transform="rotate(-24 218 203)"/>
  </svg>;
};
