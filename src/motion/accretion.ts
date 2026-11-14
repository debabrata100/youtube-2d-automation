import {progress,smoothstep} from './easing';
import {seededRandom} from './particles';
import type {Point} from './paths';

export type ImpactEvent={
  id:number;
  contactFrame:number;
  angle:number;
  startDistance:number;
  bend:number;
  size:number;
  depth:number;
  color:string;
};

export type ImpactState={
  position:Point;
  previousPosition:Point;
  contactPoint:Point;
  progress:number;
  opacity:number;
  scale:number;
  postContactFrames:number;
};

const quadratic=(from:Point,control:Point,to:Point,t:number):Point=>{
  const u=1-t;
  return {
    x:u*u*from.x+2*u*t*control.x+t*t*to.x,
    y:u*u*from.y+2*u*t*control.y+t*t*to.y,
  };
};

export const makeImpactEvents=(seed:number,count:number,duration:number):ImpactEvent[]=>{
  const random=seededRandom(seed);
  const colors=['#dc8057','#bb654f','#efad6d','#9c5948'];
  const first=18;
  const last=Math.max(first,duration-17);
  return Array.from({length:count},(_,id)=>{
    const lane=count<=1?.5:id/(count-1);
    const jitter=(random()-.5)*5;
    return {
      id,
      contactFrame:Math.round(first+(last-first)*lane+jitter),
      angle:-2.78+random()*1.48,
      startDistance:360+random()*185,
      bend:(random()-.5)*210+(id%2===0?58:-58),
      size:18+random()*25,
      depth:.78+random()*.34,
      color:colors[Math.floor(random()*colors.length)],
    };
  }).sort((a,b)=>a.contactFrame-b.contactFrame||a.id-b.id);
};

const pointOnSurface=(center:Point,radius:number,angle:number):Point=>({
  x:center.x+Math.cos(angle)*radius,
  y:center.y+Math.sin(angle)*radius,
});

export const impactState=(event:ImpactEvent,frame:number,center:Point,bodyRadius:number):ImpactState=>{
  const approachFrames=27+event.id%4*2;
  const startFrame=event.contactFrame-approachFrames;
  const t=Math.pow(progress(frame,startFrame,event.contactFrame),1.65);
  const direction={x:Math.cos(event.angle),y:Math.sin(event.angle)};
  const tangent={x:-direction.y,y:direction.x};
  const contactPoint=pointOnSurface(center,bodyRadius*.96,event.angle);
  const from={
    x:center.x+direction.x*event.startDistance+tangent.x*event.bend*.22,
    y:center.y+direction.y*event.startDistance*.72+tangent.y*event.bend*.13,
  };
  const control={
    x:center.x+direction.x*(bodyRadius+event.startDistance*.44)+tangent.x*event.bend,
    y:center.y+direction.y*(bodyRadius+event.startDistance*.31)+tangent.y*event.bend*.5,
  };
  const position=quadratic(from,control,contactPoint,t);
  const previousT=Math.pow(progress(frame-2,startFrame,event.contactFrame),1.65);
  const previousPosition=quadratic(from,control,contactPoint,previousT);
  const entrance=smoothstep(progress(frame,startFrame-4,startFrame+5));
  const absorbed=smoothstep(progress(frame,event.contactFrame,event.contactFrame+3));
  return {
    position,
    previousPosition,
    contactPoint,
    progress:t,
    opacity:entrance*(1-absorbed),
    scale:1-t*.18,
    postContactFrames:frame-event.contactFrame,
  };
};

export const absorbedMass=(events:ImpactEvent[],frame:number)=>{
  if(events.length===0)return 0;
  return events.reduce((total,event)=>total+smoothstep(progress(frame,event.contactFrame-1,event.contactFrame+7)),0)/events.length;
};

export const accretionRadius=(events:ImpactEvent[],frame:number,duration:number,startRadius=45,endRadius=156)=>{
  const mass=absorbedMass(events,frame);
  const visualMass=Math.pow(mass,.72);
  return startRadius+(endRadius-startRadius)*visualMass;
};

export const impactPulse=(event:ImpactEvent,frame:number)=>{
  const age=frame-event.contactFrame;
  if(age<0||age>12)return 0;
  return age<=3?smoothstep(age/3):1-smoothstep((age-3)/9);
};

export const bodyGrowthAt=(events:ImpactEvent[],frame:number,duration:number)=>{
  const mass=absorbedMass(events,frame);
  const radius=accretionRadius(events,frame,duration);
  const formation=.12+.88*smoothstep((mass-.03)/.97);
  return {mass,radius,formation,contactRadius:radius*(.81+.21*smoothstep(formation))};
};

export const impactResponseAt=(event:ImpactEvent,frame:number)=>{
  const age=frame-event.contactFrame;
  return {age,pulse:impactPulse(event,frame),dust:age>=0&&age<=21?Math.sin(Math.PI*age/21)*Math.exp(-age/24):0,ejecta:age>=0&&age<=18?1-age/18:0,major:event.id%3===0};
};
