import React from 'react';
import {Composition} from 'remotion';
import demo from '../storyboards/generic-demo.json';
import rawPlan from './plans/planet-formation.json';
import {StoryboardComposition} from './compositions/StoryboardComposition';
import {parseStoryboard} from './engine/storyboard/schema';
import {storyboardDuration} from './engine/storyboard/timeline';
import {adaptPlanetFormation, LegacyStoryboard} from './engine/storyboard/legacy';
import {narrationOverlaySchema,type NarrationOverlayConfig} from './captions/schema';

const storyboard = parseStoryboard(demo);
const {plan} = adaptPlanetFormation(rawPlan);
export const StoryboardRoot: React.FC = () => <>
  <Composition id="LegacyStoryboard" component={LegacyStoryboard} durationInFrames={plan.video.durationFrames} fps={plan.video.fps} width={plan.video.width} height={plan.video.height} defaultProps={{plan}}/>
  <Composition id="GenericStoryboard" component={StoryboardComposition} durationInFrames={storyboardDuration(storyboard)} fps={storyboard.format.fps} width={storyboard.format.width} height={storyboard.format.height} defaultProps={{storyboard,narration:undefined as NarrationOverlayConfig|undefined}} calculateMetadata={({props}) => {
    const data = parseStoryboard(props.storyboard);
    const narration=props.narration?narrationOverlaySchema.parse(props.narration):undefined;
    if(narration?.cues.some(cue=>cue.endFrame>storyboardDuration(data)))throw Error('Caption extends beyond video timeline');
    return {width: data.format.width, height: data.format.height, fps: data.format.fps, durationInFrames: storyboardDuration(data), props: {storyboard: data,...(narration?{narration}:{})}};
  }}/>
</>;
