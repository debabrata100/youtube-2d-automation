export const secondsToFrames=(seconds:number,fps:number,rounding:'ceil'|'round'='ceil')=>{
 if(!Number.isFinite(seconds)||seconds<0||!Number.isInteger(fps)||fps<=0)throw Error('Invalid duration or frame rate');
 return Math.max(0,Math[rounding](seconds*fps-1e-8));
};
