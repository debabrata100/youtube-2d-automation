import {describe,it,expect} from 'vitest';
import raw from '../../stories/volcano-elevenlabs-a.json';
import {storyScriptSchema,words} from '../storytelling/schema';
import {captionsFromProviderTiming} from '../captions/provider-timing';
import {captionAt} from '../captions/timing';
const story=storyScriptSchema.parse(raw),text=story.beats.map(b=>b.narration).join(' ');
const alignment=()=>({characters:Array.from(text),character_start_times_seconds:Array.from(text,(_,i)=>.06+i*.06),character_end_times_seconds:Array.from(text,(_,i)=>.06+(i+1)*.06)});
describe('continuous cached narration captions',()=>{
 it('maps every spoken word in order to provider character intervals and an active caption',()=>{
  const a=alignment(),mapped=captionsFromProviderTiming(story,a,13.1425);
  expect(mapped.wordTimings.map(w=>w.text)).toEqual(words(text));expect(mapped.wordTimings).toHaveLength(28);
  for(const w of mapped.wordTimings){const cue=captionAt(mapped.cues,Math.ceil(w.startSeconds*30));expect(cue).toBeDefined();expect(cue!.lines.join(' ')).toContain(w.text);expect(w.endSeconds).toBeLessThanOrEqual(13.1425);}
 });
 it('never leads provider starts and limits frame rounding to one frame',()=>{
  const mapped=captionsFromProviderTiming(story,alignment(),13.1425);let index=0;
  for(const [i,beat] of story.beats.entries()){const word=mapped.wordTimings[index];expect(mapped.cues[i].startFrame/30).toBeGreaterThanOrEqual(word.startSeconds);expect(mapped.cues[i].startFrame/30-word.startSeconds).toBeLessThan(1/30);index+=words(beat.narration).length;}
 });
 it('leaves the intentional ending without captions and preserves the natural duration',()=>{
  const result=captionsFromProviderTiming(story,alignment(),13.1425);expect(result.timingReport.speechSpeedAdjustment).toBe(1);expect(result.timingReport.endRoomSeconds).toBeCloseTo(1.8575);for(let f=395;f<450;f++)expect(captionAt(result.cues,f)).toBeUndefined();
 });
 it('fails on mismatched speech rather than fabricating a word mapping',()=>{const a=alignment();a.characters[0]='Z';expect(()=>captionsFromProviderTiming(story,a,13.1425)).toThrow('differs from script');});
});
