import {seededRandom} from '../../../motion/particles';
import type {EmitterConfig} from './schema';
export type EmittedParticle={id:number;birth:number;life:number;x:number;y:number;vx:number;vy:number;radius:number;color:string};
/** All births and random attributes are fixed before sampling any frame. */
export const compileEmitter=(config:EmitterConfig):EmittedParticle[]=>{
 const random=seededRandom(config.seed),between=(range:readonly[number,number])=>range[0]+random()*(range[1]-range[0]);
 return Array.from({length:config.count},(_,id)=>{const angle=(config.velocity.angleDegrees+(random()-.5)*config.velocity.spreadDegrees)*Math.PI/180,speed=between(config.velocity.speed);return{id,birth:config.startFrame+random()*(config.endFrame-config.startFrame),life:between(config.lifetimeFrames),x:config.emitter.x+(random()-.5)*config.emitter.width,y:config.emitter.y+(random()-.5)*config.emitter.height,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:between(config.radius),color:config.colors[Math.floor(random()*config.colors.length)]};});
};
export const lifeTrackAt=(keys:readonly{at:number;value:number}[],progress:number)=>{
 const t=Math.max(0,Math.min(1,progress));if(t<=keys[0].at)return keys[0].value;const i=keys.findIndex(k=>k.at>=t);if(i<0)return keys.at(-1)!.value;const a=keys[i-1],b=keys[i];return a.value+(b.value-a.value)*(t-a.at)/(b.at-a.at);
};
export const emittedParticleAt=(particle:EmittedParticle,config:EmitterConfig,frame:number)=>{
 const age=frame-particle.birth,t=age/particle.life,active=age>=0&&age<particle.life;
 return{active,x:particle.x+particle.vx*age+.5*config.acceleration.x*age*age,y:particle.y+particle.vy*age+.5*config.acceleration.y*age*age,opacity:active?lifeTrackAt(config.opacity,t):0,scale:active?lifeTrackAt(config.scale,t):0,angleDegrees:Math.atan2(particle.vy+config.acceleration.y*age,particle.vx+config.acceleration.x*age)*180/Math.PI};
};
