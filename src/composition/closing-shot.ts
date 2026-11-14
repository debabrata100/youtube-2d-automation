import {easeOutCubic,progress} from '../motion/easing';

/** Preserve the frame-390 handoff, then settle into a foreground planet / distant Sun. */
export const closingShotAt=(frame:number)=>{
 const settle=easeOutCubic(progress(frame,0,26));
 const drift=Math.max(0,frame-26);
 return {
  star:{x:250+10*settle,y:905-42*settle},
  planet:{x:736+44*settle+Math.sin(drift*.025)*2,y:1107+83*settle+Math.sin(drift*.03)*1.2},
  planetRadius:306-20*settle,
  focus:{x:694-44*settle,y:1056+12*settle},
  zoom:.8+.1*settle,
 };
};
