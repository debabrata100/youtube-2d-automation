import React from 'react';
import {Composition} from 'remotion';
import demo from '../storyboards/generic-demo.json';
import rawPlan from './plans/planet-formation.json';
import {StoryboardComposition} from './compositions/StoryboardComposition';
import {parseStoryboard} from './engine/storyboard/schema';
import {storyboardDuration} from './engine/storyboard/timeline';
import {adaptPlanetFormation, LegacyStoryboard} from './engine/storyboard/legacy';

const storyboard = parseStoryboard(demo);
const {plan} = adaptPlanetFormation(rawPlan);
export const StoryboardRoot: React.FC = () => <>
  <Composition id="LegacyStoryboard" component={LegacyStoryboard} durationInFrames={plan.video.durationFrames} fps={plan.video.fps} width={plan.video.width} height={plan.video.height} defaultProps={{plan}}/>
  <Composition id="GenericStoryboard" component={StoryboardComposition} durationInFrames={storyboardDuration(storyboard)} fps={storyboard.format.fps} width={storyboard.format.width} height={storyboard.format.height} defaultProps={{storyboard}} calculateMetadata={({props}) => {
    const data = parseStoryboard(props.storyboard);
    return {width: data.format.width, height: data.format.height, fps: data.format.fps, durationInFrames: storyboardDuration(data), props: {storyboard: data}};
  }}/>
</>;
