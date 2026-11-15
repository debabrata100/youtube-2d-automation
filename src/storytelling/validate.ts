import {storyScriptSchema,type StoryScript} from './schema';
import type {Storyboard} from '../engine/storyboard/schema';
import {storyboardDuration} from '../engine/storyboard/timeline';
export const validateStory=(input:unknown,board:Storyboard):StoryScript=>{
 const story=storyScriptSchema.parse(input);
 if(Math.abs(story.durationSeconds-boardDuration(board))>1e-6)throw Error('Story duration must match the configured visual timeline; no automatic retiming');
 if(story.beats.length!==board.scenes.length)throw Error('Missing story beats: exactly one ordered beat per scene is required');
 story.beats.forEach((b,i)=>{if(b.sceneId!==board.scenes[i].id)throw Error(`Invalid or out-of-order scene reference at beat ${b.id}; expected ${board.scenes[i].id}`);});
 return story;
};
const boardDuration=(board:Storyboard)=>storyboardDuration(board)/board.format.fps;
