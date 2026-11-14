import React from 'react';

export const LayeredIllustration:React.FC<React.PropsWithChildren<{x:number;y:number;width:number;height:number;viewBox?:string;scale?:number;opacity?:number;rotation?:number;filter?:string;label:string}>>=({x,y,width,height,viewBox='0 0 600 600',scale=1,opacity=1,rotation=0,filter,label,children})=><svg aria-label={label} width={width} height={height} viewBox={viewBox} style={{position:'absolute',left:x-width/2,top:y-height/2,overflow:'visible',opacity,transform:`scale(${scale}) rotate(${rotation}deg)`,filter,willChange:'transform'}}>{children}</svg>;
