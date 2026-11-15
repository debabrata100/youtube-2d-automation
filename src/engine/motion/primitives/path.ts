import {easeMotion,type PathConfig,type PathMotionConfig} from './schema';
type Point={x:number;y:number};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const cubicPoint=(a:Point,b:Point,c:Point,d:Point,t:number):Point=>{const u=1-t;return{x:u**3*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t**3*d.x,y:u**3*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t**3*d.y};};
export type PathTable={nodes:Array<{point:Point;distance:number}>;length:number;width:number;height:number};
/** Fixed 256 subdivisions per segment, precomputed once per mounted configuration. */
export const compileMotionPath=(path:PathConfig,width=1,height=1):PathTable=>{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Path dimensions must be positive');
 const nodes=[{point:path.start,distance:0}];let start=path.start,distance=0;
 for(const segment of path.segments){for(let i=1;i<=256;i++){const t=i/256,p=i===256?segment.to:segment.type==='line'?{x:lerp(start.x,segment.to.x,t),y:lerp(start.y,segment.to.y,t)}:cubicPoint(start,segment.control1,segment.control2,segment.to,t),previous=nodes.at(-1)!.point;const step=Math.hypot((p.x-previous.x)*width,(p.y-previous.y)*height);distance+=step;if(step>1e-12)nodes.push({point:p,distance});}start=segment.to;}
 if(distance<=1e-9)throw Error('Path must have nonzero length');return{nodes,length:distance,width,height};
};
export const sampleMotionPath=(table:PathTable,progress:number)=>{
 const target=Math.max(0,Math.min(1,progress))*table.length;let low=1,high=table.nodes.length-1;
 while(low<high){const mid=Math.floor((low+high)/2);if(table.nodes[mid].distance<target)low=mid+1;else high=mid;}
 const a=table.nodes[low-1],b=table.nodes[low],t=(target-a.distance)/(b.distance-a.distance),dx=(b.point.x-a.point.x)*table.width,dy=(b.point.y-a.point.y)*table.height,length=Math.hypot(dx,dy);
 return{position:target<=0?table.nodes[0].point:target>=table.length?table.nodes.at(-1)!.point:{x:lerp(a.point.x,b.point.x,t),y:lerp(a.point.y,b.point.y,t)},tangent:{x:dx/length,y:dy/length},angleDegrees:Math.atan2(dy,dx)*180/Math.PI};
};
export const pathObjectAt=(config:PathMotionConfig,table:PathTable,frame:number,copy=0)=>{
 const elapsed=frame-config.startFrame-copy*config.durationFrames/config.copies;
 const active=elapsed>=0&&(config.endFrame===undefined||frame<config.endFrame)&&(config.repeat||elapsed<=config.durationFrames);
 const phase=config.repeat?((elapsed%config.durationFrames)+config.durationFrames)%config.durationFrames/config.durationFrames:Math.max(0,Math.min(1,elapsed/config.durationFrames));
 const sample=sampleMotionPath(table,easeMotion(phase,config.easing)),fade=Math.min(1,phase/.12,(1-phase)/.12);
 return{...sample,active,opacity:active?Math.max(0,fade)*config.opacity:0,scale:config.scale,rotation:config.orientAlongPath?sample.angleDegrees:0};
};
