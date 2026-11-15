import type {StoryScript} from '../storytelling/schema';
import {words} from '../storytelling/schema';
import type {TimingPlan} from '../storytelling/timing/align';
import {captionCueSchema,type CaptionCue} from './schema';
export const wrapPhrase=(text:string,max=26)=>{
 const lines:string[]=[];for(const word of text.trim().split(/\s+/)){if(word.length>max)throw Error(`Caption word exceeds line limit: ${word}`);const last=lines.at(-1);if(last&&last.length+1+word.length<=max)lines[lines.length-1]=last+' '+word;else lines.push(word);}
 if(lines.length>2)throw Error(`Caption requires more than two lines; split the authored phrase: ${text}`);return lines;
};
export const buildCaptions=(story:StoryScript,plan:TimingPlan,max=26):CaptionCue[]=>story.beats.flatMap((beat,i)=>{
 const slot=plan.beats[i],total=beat.phrases.reduce((a,p)=>a+words(p).length,0);let prior=slot.startFrame,cumulative=0;
 return beat.phrases.map((phrase,j)=>{cumulative+=words(phrase).length;const endFrame=slot.startFrame+Math.round(slot.audioFrames*cumulative/total);const cue=captionCueSchema.parse({id:`${beat.id}-${j+1}`,beatId:beat.id,startFrame:prior,endFrame,lines:wrapPhrase(phrase,max),timingBasis:'estimated phrase allocation inside measured beat audio'});prior=endFrame;return cue;});
});
export const captionAt=(cues:CaptionCue[],frame:number)=>cues.find(c=>frame>=c.startFrame&&frame<c.endFrame);

/** Local recognition supplies estimates, not provider word-level ground truth. */
export const applyLocalPhraseEstimates=(story:StoryScript,plan:TimingPlan,cues:CaptionCue[],recognition:{beats:Array<{beatId:string;segments:Array<{startSeconds:number;endSeconds:number;text:string}>}>}):CaptionCue[]=>{
 return story.beats.flatMap((beat,i)=>{
  const segments=recognition.beats.find(b=>b.beatId===beat.id)?.segments.filter(s=>words(s.text).length>0);
  if(!segments||segments.length!==words(beat.narration).length)throw Error(`Local recognition word-count mismatch for ${beat.id}; manual review required`);
  const slot=plan.beats[i];let count=0;
  return beat.phrases.map((phrase,j)=>{const original=cues.find(c=>c.id===`${beat.id}-${j+1}`)!;const startFrame=slot.startFrame+Math.max(0,Math.round(segments[count].startSeconds*plan.fps));count+=words(phrase).length;const endFrame=count<segments.length?slot.startFrame+Math.round(segments[count].startSeconds*plan.fps):slot.startFrame+slot.audioFrames;return captionCueSchema.parse({...original,startFrame,endFrame:Math.min(slot.startFrame+slot.audioFrames,endFrame),timingBasis:'local ASR phrase estimates; not word-perfect'});});
 });
};
