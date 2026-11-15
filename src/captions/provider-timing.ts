import type {CharacterAlignment} from '../audio/tts/provider';
import {characterAlignmentSchema} from '../audio/tts/alignment';
import type {StoryScript} from '../storytelling/schema';
import {words} from '../storytelling/schema';
import {captionCueSchema} from './schema';
import {wrapPhrase} from './timing';
/** Continuous speech retains pauses and natural speed; never trims or stretches.
 * Ceiling starts prevents a caption appearing before its provider timestamp.
 * Character timestamps remain provider estimates requiring listening review. */
export const captionsFromProviderTiming=(story:StoryScript,input:CharacterAlignment,durationSeconds:number,fps=30)=>{
 if(!Number.isFinite(durationSeconds)||durationSeconds<=0||durationSeconds>story.durationSeconds-.2)throw Error('Natural narration must fit with at least 0.2 seconds of ending room; shorten the script, never accelerate');
 const a=characterAlignmentSchema.parse(input),text=a.characters.join('');
 const matches=[...text.matchAll(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)];
 const expected=story.beats.flatMap(b=>words(b.narration));
 if(matches.map(m=>m[0].toLowerCase()).join(' ')!==expected.map(w=>w.toLowerCase()).join(' '))throw Error('Provider alignment text differs from script; explicit forced/local alignment review required');
 if(a.character_end_times_seconds.at(-1)!>durationSeconds+.001)throw Error('Alignment exceeds audio duration');
 let cursor=0;const codeUnits:number[]=[];let offset=0;for(let i=0;i<a.characters.length;i++){for(let j=0;j<a.characters[i].length;j++)codeUnits[offset++]=i;}
 const wordTimings=matches.map(m=>({text:m[0],startSeconds:a.character_start_times_seconds[codeUnits[m.index!]],endSeconds:a.character_end_times_seconds[codeUnits[m.index!+m[0].length-1]]}));
 const cues=story.beats.flatMap(beat=>beat.phrases.map((phrase,j)=>{
  const first=matches[cursor];cursor+=words(phrase).length;const last=matches[cursor-1];
  const start=a.character_start_times_seconds[codeUnits[first.index!]],end=a.character_end_times_seconds[codeUnits[last.index!+last[0].length-1]];
  return captionCueSchema.parse({id:`${beat.id}-${j+1}`,beatId:beat.id,startFrame:Math.ceil(start*fps),endFrame:Math.ceil(end*fps),lines:wrapPhrase(phrase),timingBasis:'provider character timestamps; rounded to video frames'});
 }));
 if(cues.some((c,i)=>c.endFrame>story.durationSeconds*fps||(i>0&&c.startFrame<cues[i-1].endFrame)))throw Error('Provider caption intervals overlap or exceed timeline');
 return{cues,wordTimings,timingReport:{method:'provider character timestamps',audioDurationSeconds:durationSeconds,speechSpeedAdjustment:1,endRoomSeconds:story.durationSeconds-durationSeconds,maximumFrameRoundingSeconds:1/fps,humanSynchronizationReview:'pending'}};
};
