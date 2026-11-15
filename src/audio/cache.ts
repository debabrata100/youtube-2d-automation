import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {normalizeText} from '../storytelling/schema';
import type {SynthesisRequest,TTSProvider} from './tts/provider';
import {ttsConfigSchema} from './tts/provider';
import {measureAudio} from './metadata';
import {characterAlignmentSchema} from './tts/elevenlabs';
const stable=(value:unknown):unknown=>Array.isArray(value)?value.map(stable):value!==null&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):value;
export const cacheKey=(request:SynthesisRequest)=>createHash('sha256').update(JSON.stringify(stable({version:1,text:request.config.provider==='elevenlabs'?request.text:normalizeText(request.text),config:ttsConfigSchema.parse(request.config)}))).digest('hex');
const hash=(data:Uint8Array)=>createHash('sha256').update(data).digest('hex');
export const cachedSpeech=async(provider:TTSProvider,request:SynthesisRequest,directory:string,force=false)=>{
 if(provider.id!==request.config.provider)throw Error('Provider/cache configuration mismatch');
 const key=cacheKey(request),audioPath=path.join(directory,key+'.wav'),metadataPath=path.join(directory,key+'.json');
 try{const saved=JSON.parse(await readFile(metadataPath,'utf8'));const bytes=await readFile(audioPath);if(!force&&saved.key===key&&saved.sha256===hash(bytes)){const measured=await measureAudio(audioPath);return{...saved,audioPath,measured,cacheHit:true};}}catch(error){if(!(error instanceof Error))throw error;}
 const result=await provider.synthesize({...request,text:request.config.provider==='elevenlabs'?request.text:normalizeText(request.text)});await mkdir(directory,{recursive:true});
 const temporary=path.join(directory,`${key}.${randomUUID()}.wav`);await writeFile(temporary,result.audio);
 const measured=await measureAudio(temporary);await rename(temporary,audioPath);
 const metadata={key,sha256:hash(result.audio),provider:result.provider,model:result.model,voice:request.config.voice,syntheticTestAudio:result.syntheticTestAudio,requestId:result.requestId??null,usage:result.usage,...(result.alignment?{alignment:result.alignment}:{}),measured};
 const metadataTemporary=metadataPath+'.'+randomUUID()+'.tmp';await writeFile(metadataTemporary,JSON.stringify(metadata,null,2));await rename(metadataTemporary,metadataPath);
 return{...metadata,audioPath,cacheHit:false};
};
/** No provider argument and no fallback: safe for Stage A even on misses. */
export const inspectSpeechCache=async(request:SynthesisRequest,directory:string)=>{
 const key=cacheKey(request),audioPath=path.join(directory,key+'.wav');
 try{
  const saved=JSON.parse(await readFile(path.join(directory,key+'.json'),'utf8')),bytes=await readFile(audioPath);
  if(saved.key!==key||saved.sha256!==hash(bytes))return{key,status:'invalid' as const};
  const measured=await measureAudio(audioPath);
  const timing=characterAlignmentSchema.safeParse(saved.alignment),timingValid=timing.success&&timing.data.character_end_times_seconds.at(-1)!<=measured.durationSeconds+.05;
  return{key,status:'hit' as const,measured,alignment:timingValid?timing.data:null,timingValid};
 }catch(e){return{key,status:(e as NodeJS.ErrnoException).code==='ENOENT'?'miss' as const:'invalid' as const};}
};
