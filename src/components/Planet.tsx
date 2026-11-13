import React from 'react';

export const Planet:React.FC<{x:number;y:number;radius?:number;rotation?:number;scale?:number;opacity?:number;detail?:number}> = ({x,y,radius=170,rotation=0,scale=1,opacity=1,detail=1}) => {
  const id=`planet-${Math.round(radius)}`; const offset=((rotation%420)+420)%420;
  return <svg width={radius*3} height={radius*3} viewBox="0 0 600 600" style={{position:'absolute',left:x-radius*1.5,top:y-radius*1.5,overflow:'visible',opacity,transform:`scale(${scale})`,filter:'drop-shadow(0 34px 44px rgba(0,0,0,.5)) drop-shadow(0 0 32px rgba(77,224,230,.3))'}}>
    <defs>
      <radialGradient id={`${id}-base`} cx="31%" cy="25%"><stop offset="0" stopColor="#b9fff2"/><stop offset=".25" stopColor="#53cfcd"/><stop offset=".58" stopColor="#258aa8"/><stop offset=".83" stopColor="#1a4c7d"/><stop offset="1" stopColor="#0a183b"/></radialGradient>
      <linearGradient id={`${id}-rim`} x1="0" x2="1"><stop stopColor="#9efff3" stopOpacity=".8"/><stop offset=".4" stopColor="#66e4e3" stopOpacity=".16"/><stop offset="1" stopColor="#06102c" stopOpacity=".85"/></linearGradient>
      <radialGradient id={`${id}-crater`} cx="35%" cy="30%"><stop stopColor="#f4bc83"/><stop offset=".35" stopColor="#c46f63"/><stop offset="1" stopColor="#6b3e5c"/></radialGradient>
      <clipPath id={`${id}-disk`}><circle cx="300" cy="300" r="200"/></clipPath>
      <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <circle cx="300" cy="300" r="224" fill="#4be2e5" opacity={.1*detail} filter={`url(#${id}-soft)`}/>
    <circle cx="300" cy="300" r="204" fill="#79f4ed" opacity={.26*detail}/>
    <circle cx="300" cy="300" r="200" fill={`url(#${id}-base)`}/>
    <g clipPath={`url(#${id}-disk)`} opacity={detail}>
      <g transform={`translate(${-offset} 0)`}>
        {[0,420].map(dx=><g key={dx} transform={`translate(${dx} 0)`}>
          <path d="M38 232 C86 177 139 193 181 174 C226 154 272 194 258 244 C243 299 186 302 139 333 C87 366 38 325 38 232Z" fill="#e68a69"/>
          <path d="M286 105 C350 79 412 118 444 162 C474 204 435 240 390 220 C348 201 323 165 286 105Z" fill="#efb26f"/>
          <path d="M342 348 C401 313 486 337 516 397 C544 453 485 502 422 476 C367 454 326 409 342 348Z" fill="#ce665d"/>
          <path d="M153 398 C204 365 271 394 289 446 C306 496 253 532 198 507 C149 485 123 438 153 398Z" fill="#f0a26d"/>
          <path d="M75 278 C183 247 294 274 397 249" fill="none" stroke="#ffe3a8" strokeWidth="10" opacity=".16"/>
        </g>)}
      </g>
      <g opacity={.82*detail}>
        <ellipse cx="218" cy="342" rx="29" ry="22" fill={`url(#${id}-crater)`}/><ellipse cx="210" cy="335" rx="13" ry="8" fill="#ffcf91" opacity=".28"/>
        <ellipse cx="352" cy="210" rx="19" ry="14" fill="#173c67" opacity=".62"/><ellipse cx="347" cy="205" rx="8" ry="5" fill="#a8eee6" opacity=".24"/>
        <ellipse cx="406" cy="329" rx="34" ry="20" fill="#6b3d60" opacity=".42" transform="rotate(-22 406 329)"/>
        <circle cx="275" cy="180" r="9" fill="#ffe2a7" opacity=".36"/>
      </g>
      <ellipse cx="410" cy="300" rx="126" ry="205" fill="#050d2b" opacity=".46"/>
      <ellipse cx="437" cy="300" rx="82" ry="200" fill="#03091e" opacity=".42"/>
      <path d="M102 245 C147 181 207 135 281 113" fill="none" stroke="#d9fff8" strokeWidth="13" opacity=".16" strokeLinecap="round"/>
    </g>
    <circle cx="300" cy="300" r="200" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="10" opacity={.8*detail}/>
    <ellipse cx="236" cy="205" rx="86" ry="48" fill="#fff" opacity={.11*detail} transform="rotate(-28 236 205)"/>
  </svg>;
};
