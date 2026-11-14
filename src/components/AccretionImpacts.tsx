import React from 'react';
import {Asteroid} from './Asteroid';
import {impactResponseAt,impactState,type ImpactEvent} from '../motion/accretion';

type Props={
  events:ImpactEvent[];
  frame:number;
  center:{x:number;y:number};
  bodyRadius:number;
  contactRadiusAt?:(frame:number)=>number;
  layer:'fragments'|'effects';
};

export const AccretionImpacts:React.FC<Props>=({events,frame,center,bodyRadius,contactRadiusAt,layer})=>{
  if(layer==='fragments')return <>{events.map(event=>{
    const state=impactState(event,frame,center,contactRadiusAt?.(event.contactFrame)??bodyRadius);
    if(state.opacity<=0)return null;
    const trailOpacity=state.opacity*(.15+.35*state.progress);
    return <React.Fragment key={event.id}>
      <svg width="1080" height="1920" style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none'}}>
        <path d={`M${state.previousPosition.x} ${state.previousPosition.y} L${state.position.x} ${state.position.y}`} stroke={event.color} strokeWidth={Math.max(2,event.size*.18)} strokeLinecap="round" opacity={trailOpacity} filter="blur(1px)"/>
      </svg>
      <Asteroid x={state.position.x} y={state.position.y} size={event.size*state.scale} rotation={frame*(event.id%2?1.18:-.9)+event.id*47} opacity={state.opacity} color={event.color} variant={event.id} depth={event.depth}/>
    </React.Fragment>;
  })}</>;

  return <svg width="1080" height="1920" style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none'}}>
    {events.map(event=>{
      const state=impactState(event,frame,center,contactRadiusAt?.(event.contactFrame)??bodyRadius);
      const {pulse,age,dust,ejecta:debrisOpacity}=impactResponseAt(event,frame);
      const scarAge=Math.max(0,age);
      const scarOpacity=age>=0&&age<32?.24*(1-scarAge/32):0;
      const scar={x:center.x+Math.cos(event.angle)*bodyRadius*.84,y:center.y+Math.sin(event.angle)*bodyRadius*.84};
      return <g key={event.id}>
        {scarOpacity>0&&<g opacity={scarOpacity}>
          <ellipse cx={scar.x} cy={scar.y} rx={7+event.size*.12} ry={3+event.size*.06} fill="#ff7d47" transform={`rotate(${event.angle*180/Math.PI+90} ${scar.x} ${scar.y})`}/>
          <ellipse cx={scar.x} cy={scar.y} rx={3+event.size*.06} ry={1.5+event.size*.03} fill="#ffd787"/>
        </g>}
        {dust>0&&<g opacity={dust*.48} transform={`translate(${state.contactPoint.x} ${state.contactPoint.y}) rotate(${event.angle*180/Math.PI})`}>
          {[0,1,2,3,4].map(i=><ellipse key={i} cx={age*(1.1+i*.2)} cy={(i-2)*age*.42} rx={5+age*.4+i} ry={3+age*.25} fill={i%2?'#bb885f':'#835941'}/>)}
        </g>}
        {pulse>0&&<g opacity={pulse} style={{mixBlendMode:'screen'}}>
          <ellipse cx={state.contactPoint.x} cy={state.contactPoint.y} rx={8+event.size*.10+pulse*4} ry={4+pulse*3} fill="#ffe7a8" opacity={.78} transform={`rotate(${event.angle*180/Math.PI+90} ${state.contactPoint.x} ${state.contactPoint.y})`}/>
          {[-.24,0,.22].map((spread,index)=>{
            const rayAngle=event.angle+spread;
            const length=10+pulse*(9+index*4);
            return <path key={spread} d={`M${state.contactPoint.x} ${state.contactPoint.y} l${Math.cos(rayAngle)*length} ${Math.sin(rayAngle)*length}`} stroke={index===1?'#fff2b8':'#ff9b5f'} strokeWidth={index===1?4:2.4} strokeLinecap="round" opacity={.64-index*.09}/>;
          })}
        </g>}
        {debrisOpacity>0&&Array.from({length:6},(_,index)=>{
          const spread=(index-2.5)*.16+(event.id%3-.5)*.05;
          const angle=event.angle+spread;
          const speed=3.4+(index%3)*1.15+event.id%2*.45;
          const distance=age*speed;
          const x=state.contactPoint.x+Math.cos(angle)*distance;
          const y=state.contactPoint.y+Math.sin(angle)*distance+age*age*.055;
          const size=Math.max(1.2,4.8-index*.42)*(1-age/25);
          return <circle key={index} cx={x} cy={y} r={size} fill={index%2?'#ffbd77':'#f17a58'} opacity={debrisOpacity*(.78-index*.06)}/>;
        })}
      </g>;
    })}
  </svg>;
};
