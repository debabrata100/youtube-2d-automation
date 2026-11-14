import React from 'react';
import {IllustratedRockyPlanet} from '../illustrations/space/IllustratedRockyPlanet';

export const Planet:React.FC<{x:number;y:number;radius?:number;rotation?:number;scale?:number;opacity?:number;detail?:number;formation?:number;glow?:number}> = ({rotation=0,...props})=><IllustratedRockyPlanet {...props} frame={rotation}/>;
