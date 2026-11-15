import {commandOutput} from './metadata';
import type {TimingPlan} from '../storytelling/timing/align';
/** Fixed scene slots: delay without time stretching; only declared silence fills the video. */
export const assembleNarration=async(files:string[],plan:TimingPlan,output:string)=>{
 if(files.length!==plan.beats.length)throw Error('Missing audio files for assembly');
 const rate=24000,duration=plan.totalFrames/plan.fps;
 if(plan.beats.some(b=>b.audioEndSeconds>duration+1e-7||b.audioFrames>b.endFrame-b.startFrame))throw Error('Refusing to truncate or overlap narration');
 const filters=files.map((_,i)=>`[${i+1}:a]aresample=${rate},aformat=sample_fmts=s16:channel_layouts=mono,adelay=${Math.round(plan.beats[i].audioStartSeconds*rate)}S:all=1[a${i}]`);
 filters.push(`[0:a]${files.map((_,i)=>`[a${i}]`).join('')}amix=inputs=${files.length+1}:duration=first:dropout_transition=0:normalize=0[out]`);
 await commandOutput('ffmpeg',['-v','error','-y','-f','lavfi','-i',`anullsrc=r=${rate}:cl=mono:d=${duration}`,...files.flatMap(file=>['-i',file]),'-filter_complex',filters.join(';'),'-map','[out]','-c:a','pcm_s16le',output]);
};
