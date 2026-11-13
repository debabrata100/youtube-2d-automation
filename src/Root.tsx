import React from 'react'; import {Composition} from 'remotion'; import {PlanetFormation} from './compositions/PlanetFormation'; import rawPlan from './plans/planet-formation.json'; import {parseScenePlan} from './schemas/scene-plan';
const plan=parseScenePlan(rawPlan);
export const RemotionRoot:React.FC=()=> <Composition id="PlanetFormation" component={PlanetFormation} durationInFrames={plan.video.durationFrames} fps={plan.video.fps} width={plan.video.width} height={plan.video.height} defaultProps={{plan}}/>;
