import React from 'react';

export type IllustrationLayerRole='silhouette'|'material'|'shadow'|'highlight'|'texture'|'rim'|'atmosphere'|'foreground';
export type IllustrationLayerProps=React.PropsWithChildren<{id:string;role:IllustrationLayerRole;opacity?:number;transform?:string;filter?:string;blendMode?:React.CSSProperties['mixBlendMode']}>;

export const IllustrationLayer:React.FC<IllustrationLayerProps>=({id,role,opacity=1,transform,filter,blendMode,children})=><g data-layer-id={id} data-layer-role={role} opacity={opacity} transform={transform} filter={filter} style={{mixBlendMode:blendMode}}>{children}</g>;
