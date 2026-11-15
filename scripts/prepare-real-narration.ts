/** Local editorial cleanup only. No provider/network access. Original WAVs remain unchanged. */
import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {commandOutput,measureAudio} from '../src/audio/metadata';
const job=path.resolve(process.argv[2]),dir=path.join(job,'audio/edited');await mkdir(dir,{recursive:true});
const selection=JSON.parse(await readFile(path.join(job,'reports/source-take-selection.json'),'utf8'));
if(!selection.scriptUnchanged||selection.maxTempo>1.1)throw Error('Invalid editorial authorization limits');
const ids=selection.takes.map((t:any)=>t.beatId) as string[],takeEnds=selection.takes.map((t:any)=>t.endSeconds) as number[];
const edits=[];
for(const [i,id] of ids.entries()){
 const file=path.join(job,`audio/${id}.wav`),raw=await measureAudio(file);
 const {spawnSync}=await import('node:child_process');const scan=spawnSync('ffmpeg',['-hide_banner','-i',file,'-af','silencedetect=noise=-45dB:d=0.08','-f','null','-'],{encoding:'utf8'}).stderr;
 const ranges=[...scan.matchAll(/silence_start:\s*([\d.]+)[\s\S]*?silence_end:\s*([\d.]+)/g)].map(m=>({start:Number(m[1]),end:Number(m[2])})).filter(r=>r.end<takeEnds[i]-.04);
 const merged:Array<{start:number;end:number}>=[];for(const r of ranges){const prior=merged.at(-1);if(prior&&r.start-prior.end<.01)prior.end=r.end;else merged.push({...r});}
 const halfGap=selection.retainedSilenceSeconds/2;if(halfGap<.03||halfGap>.075)throw Error('Unsafe silence-retention setting');
 const cuts=merged.filter(r=>r.end-r.start>Math.max(.15,2*halfGap)).map(r=>({start:r.start+halfGap,end:r.end-halfGap}));
 const keep:Array<{start:number;end:number}>=[];let cursor=0;for(const cut of cuts){keep.push({start:cursor,end:cut.start});cursor=cut.end;}keep.push({start:cursor,end:takeEnds[i]});
 const filter=keep.map((r,k)=>`[0:a]atrim=start=${r.start}:end=${r.end},asetpts=PTS-STARTPTS[a${k}]`).join(';')+';'+keep.map((_,k)=>`[a${k}]`).join('')+`concat=n=${keep.length}:v=0:a=1[out]`;
 const clean=path.join(dir,id+'-clean.wav');await commandOutput('ffmpeg',['-v','error','-y','-i',file,'-filter_complex',filter,'-map','[out]','-c:a','pcm_s16le',clean]);const measured=await measureAudio(clean);
 edits.push({beatId:id,rawPath:file,rawDurationSeconds:raw.durationSeconds,takeEndSeconds:takeEnds[i],removedSilence:cuts,keptRanges:keep,cleanPath:clean,cleanDurationSeconds:measured.durationSeconds});
}
const total=edits.reduce((s,e)=>s+e.cleanDurationSeconds,0),tempo=Math.ceil(Math.max(1,total/selection.targetSpeechSeconds)*1000)/1000;
if(tempo>selection.maxTempo)throw Error(`Complete cleaned speech needs ${tempo}x tempo; exceeds the 1.10 safety range. No further paid requests are authorized.`);
for(const edit of edits){const output=path.join(dir,edit.beatId+'.wav');await commandOutput('ffmpeg',['-v','error','-y','-i',edit.cleanPath,'-af',`atempo=${tempo}`,'-c:a','pcm_s16le',output]);Object.assign(edit,{outputPath:output,outputDurationSeconds:(await measureAudio(output)).durationSeconds});}
await writeFile(path.join(job,'reports/audio-edit-plan.json'),JSON.stringify({originalScriptUnchanged:true,edits,tempo,tempoMethod:'pitch-preserving uniform FFmpeg atempo after selecting complete takes and reducing only detected silence',cleanTotalSeconds:total,limit:1.1,reason:'Generated delivery plus duplicate/padding exceeded the fixed 15-second target; no additional synthesis calls allowed.',listeningApproval:'pending; local ASR/signal review is not human listening'},null,2));console.log(JSON.stringify({cleanTotalSeconds:total,tempo,beats:edits.map(e=>({id:e.beatId,...(e as any)}))},null,2));
