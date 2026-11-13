import React from 'react';
export const Planet:React.FC<{x:number;y:number;radius?:number;rotation?:number;scale?:number;opacity?:number}> = ({x,y,radius=170,rotation=0,scale=1,opacity=1}) => <svg width={radius*3} height={radius*3} viewBox="0 0 600 600" style={{position:'absolute',left:x-radius*1.5,top:y-radius*1.5,overflow:'visible',opacity,transform:`scale(${scale}) rotate(${rotation*.12}deg)`,filter:'drop-shadow(0 28px 38px rgba(0,0,0,.45)) drop-shadow(0 0 26px rgba(69,218,229,.35))'}}>
  <defs><radialGradient id="planet" cx="32%" cy="25%"><stop offset="0" stopColor="#9ff4ed"/><stop offset=".35" stopColor="#3fb9c7"/><stop offset=".72" stopColor="#26759c"/><stop offset="1" stopColor="#142b5e"/></radialGradient><clipPath id="disk"><circle cx="300" cy="300" r="200"/></clipPath></defs>
  <circle cx="300" cy="300" r="216" fill="#4be2e5" opacity=".12"/>
  <circle cx="300" cy="300" r="200" fill="url(#planet)"/>
  <g clipPath="url(#disk)" transform={`translate(${(rotation%360)-180} 0)`} opacity=".9">
    <path d="M30 240 C95 180 130 225 188 205 C245 185 267 219 254 264 C235 320 170 302 128 333 C75 373 28 330 30 240Z" fill="#e48b62"/>
    <path d="M328 112 C390 92 451 128 470 177 C488 222 438 244 401 222 C372 205 350 180 328 112Z" fill="#f2b36f"/>
    <path d="M402 360 C465 322 548 360 560 425 C570 482 501 505 443 468 C408 446 383 414 402 360Z" fill="#d86c58"/>
    <path d="M180 404 C230 377 291 410 302 459 C312 505 262 529 212 505 C170 485 146 443 180 404Z" fill="#f1a36a"/>
    <path d="M47 280 C180 244 292 274 410 252 C489 238 560 210 620 230" fill="none" stroke="#a5f2ed" strokeWidth="10" opacity=".22"/>
  </g>
  <ellipse cx="245" cy="210" rx="96" ry="61" fill="#fff" opacity=".12" transform="rotate(-28 245 210)"/>
</svg>;
