import {easeMotion,type PrimitiveCameraKeyframe} from './schema';
export type CameraBoundaryMode='cover'|'backdrop';
/** Frame clock is output scene-local frames; x/y are normalized screen translations.
 * cover: constrain inverse viewport corners to the world rectangle.
 * backdrop: move foreground only; caller must provide the fixed opaque backdrop. */
export const keyframeCameraAt=(keys:readonly PrimitiveCameraKeyframe[],frame:number,width:number,height:number,boundaryMode:CameraBoundaryMode='cover')=>{
 if(!keys.length)return{focus:{x:width/2,y:height/2},zoom:1,rotation:0};
 const end=keys.findIndex(k=>k.frame>=frame),b=keys[end<0?keys.length-1:end],a=keys[Math.max(0,end<0?keys.length-1:end-1)],t=b.frame===a.frame?0:easeMotion((frame-a.frame)/(b.frame-a.frame),b.easing),mix=(x:number,y:number)=>x+(y-x)*t;
 const rotation=mix(a.rotation,b.rotation),angle=rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);let zoom=mix(a.zoom,b.zoom);
 if(boundaryMode==='cover')zoom=Math.max(zoom,Math.abs(c)+Math.abs(s)*height/width,Math.abs(c)+Math.abs(s)*width/height);
 const dx=mix(a.x,b.x)*width,dy=mix(a.y,b.y)*height;
 let x=mix(a.focus.x,b.focus.x)*width-(c*dx+s*dy)/zoom,y=mix(a.focus.y,b.focus.y)*height-(-s*dx+c*dy)/zoom;
 if(boundaryMode==='cover'){const halfX=(Math.abs(c)*width+Math.abs(s)*height)/(2*zoom),halfY=(Math.abs(s)*width+Math.abs(c)*height)/(2*zoom);x=Math.max(halfX,Math.min(width-halfX,x));y=Math.max(halfY,Math.min(height-halfY,y));}
 return{focus:{x,y},zoom,rotation};
};
