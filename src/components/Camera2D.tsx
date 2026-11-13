import React from 'react';
import {cameraTransform} from '../motion/camera';
export const Camera2D:React.FC<React.PropsWithChildren<{focus:{x:number;y:number};zoom:number;parallax?:number;rotation?:number;viewport?:{x:number;y:number}}>>=({focus,zoom,parallax=1,rotation=0,viewport,children})=><div style={{position:'absolute',inset:0,transformOrigin:'0 0',transform:cameraTransform({x:focus.x*parallax,y:focus.y*parallax},zoom,viewport,rotation),willChange:'transform'}}>{children}</div>;
