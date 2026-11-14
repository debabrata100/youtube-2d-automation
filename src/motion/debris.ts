import {seededRandom} from './particles';

export const rockGeometry=(variant:number)=>{
  const random=seededRandom(701+Math.abs(variant)*977);
  const points=Array.from({length:22},(_,i)=>{
    const angle=i/22*Math.PI*2;
    const radius=34+random()*10;
    return {x:50+Math.cos(angle)*radius,y:50+Math.sin(angle)*radius*(.82+variant%3*.07)};
  });
  const path=points.map((p,i)=>{
    const next=points[(i+1)%points.length];
    return `${i?'Q':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)} ${i?((p.x+next.x)/2).toFixed(2)+' '+((p.y+next.y)/2).toFixed(2):''}`;
  }).join(' ')+' Z';
  const strata=Array.from({length:12},(_,i)=>({y:14+i*6+random()*4,bend:random()*14,width:1+random()*2,opacity:.08+random()*.16}));
  const grains=Array.from({length:44},()=>({x:random()*90+5,y:random()*90+5,size:.25+random()*.8,opacity:.12+random()*.3}));
  return {path,strata,grains};
};
