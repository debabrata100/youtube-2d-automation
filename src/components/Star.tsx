import React from 'react';
import {IllustratedStar} from '../illustrations/space/IllustratedStar';

export const Star:React.FC<{x:number;y:number;radius?:number;intensity?:number;rotation?:number;scale?:number;opacity?:number}> = ({rotation=0,...props})=><IllustratedStar {...props} frame={rotation}/>;
