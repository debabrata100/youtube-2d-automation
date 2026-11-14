import type {CameraKeyframe} from '../motion/camera';
import type {Point} from '../motion/paths';

export type ShotPresetName='establishing-wide'|'medium-explanatory'|'close-up-detail'|'tracking'|'hero-reveal';
export type TextPlacement='top-center'|'top-left'|'lower-third';
export type ShotComposition={name:ShotPresetName;subjectScale:number;depth:{background:number;middle:number;foreground:number};textPlacement:TextPlacement;safeArea:{left:number;right:number;top:number;bottom:number};keyframes:CameraKeyframe[]};

const safeArea={left:84,right:996,top:150,bottom:1680};

export const createShotComposition=(name:ShotPresetName,subject:Point,duration:number,secondary?:Point):ShotComposition=>{
  const end=Math.max(1,duration);const target=secondary??subject;
  const definitions:Record<ShotPresetName,Omit<ShotComposition,'name'|'safeArea'>>={
    'establishing-wide':{subjectScale:.86,depth:{background:.35,middle:.72,foreground:1.15},textPlacement:'top-center',keyframes:[{frame:0,focus:{x:subject.x+74,y:subject.y-24},zoom:.8,rotation:-.05},{frame:end*.48,focus:subject,zoom:.88,rotation:0},{frame:end,focus:{x:(subject.x+target.x)/2,y:(subject.y+target.y)/2},zoom:.91,rotation:.03}]},
    'medium-explanatory':{subjectScale:1,depth:{background:.42,middle:.8,foreground:1.18},textPlacement:'top-center',keyframes:[{frame:0,focus:{x:subject.x-86,y:subject.y-18},zoom:.98,rotation:-.04},{frame:end*.55,focus:subject,zoom:1.07,rotation:.02},{frame:end,focus:{x:target.x+20,y:target.y-16},zoom:1.1,rotation:0}]},
    'close-up-detail':{subjectScale:1.16,depth:{background:.48,middle:.9,foreground:1.24},textPlacement:'top-left',keyframes:[{frame:0,focus:{x:subject.x-132,y:subject.y+24},zoom:1.14,rotation:-.06},{frame:end*.62,focus:subject,zoom:1.31,rotation:.02},{frame:end,focus:{x:target.x+12,y:target.y},zoom:1.28,rotation:0}]},
    tracking:{subjectScale:1,depth:{background:.32,middle:.76,foreground:1.22},textPlacement:'top-center',keyframes:[{frame:0,focus:{x:subject.x-125,y:subject.y-24},zoom:1.01,rotation:-.05},{frame:end*.44,focus:subject,zoom:1.08,rotation:0},{frame:end,focus:{x:target.x+75,y:target.y-5},zoom:1.1,rotation:.04}]},
    'hero-reveal':{subjectScale:1.2,depth:{background:.38,middle:.84,foreground:1.2},textPlacement:'top-center',keyframes:[{frame:0,focus:{x:subject.x-29,y:subject.y-26},zoom:1.24,rotation:.02},{frame:end*.42,focus:subject,zoom:1.12,rotation:0},{frame:end,focus:{x:target.x-18,y:target.y-20},zoom:1.02,rotation:-.02}]},
  };
  return {name,safeArea,...definitions[name]};
};
