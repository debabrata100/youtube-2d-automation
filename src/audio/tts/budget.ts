import {createHash,randomUUID} from 'node:crypto';
import {mkdir,open,readFile,rename,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {SynthesisRequest,TTSProvider} from './provider';
export type SpeechBudget={maxRequests:number;maxEstimatedUSD:number;model:string;voice:string};
/** Deliberately large output-token allowance for each short, seven-word beat.
 * This is an estimate, not a provider-enforced token or billing limit. */
export const reserveEstimate=(request:SynthesisRequest)=>{
 const assumedInputTokens=Buffer.byteLength(request.text+request.config.instructions,'utf8');
 const assumedOutputAudioTokens=750;
 return{assumedInputTokens,assumedOutputAudioTokens,estimatedUSD:assumedInputTokens*.60/1e6+assumedOutputAudioTokens*12/1e6};
};
export class BudgetedTTSProvider implements TTSProvider{
 readonly id='openai' as const;
 constructor(private delegate:TTSProvider,private file:string,private policy:SpeechBudget){}
 async synthesize(request:SynthesisRequest){
  if(this.delegate.id!=='openai'||request.config.provider!=='openai')throw Error('Paid ledger only supports OpenAI requests');
  if(request.config.model!==this.policy.model||request.config.voice!==this.policy.voice)throw Error('Synthesis configuration differs from authorized model/voice');
  await mkdir(path.dirname(this.file),{recursive:true});const lock=this.file+'.lock';let handle;
  try{handle=await open(lock,'wx');}catch{throw Error('Paid request ledger is locked; inspect any unfinished request before resuming. No automatic retry.');}
  try{
   let ledger:any;
   try{ledger=JSON.parse(await readFile(this.file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;ledger={version:1,policy:this.policy,pricing:{textInputPerMillionUSD:.60,audioOutputPerMillionUSD:12,verifiedOn:'2026-11-14'},estimateNote:'UTF-8 byte count as conservative input-token allowance plus 750 assumed output audio tokens per short beat. Not actual usage or a billing guarantee.',attempts:[],actualCostUSD:null};}
   if(JSON.stringify(ledger.policy)!==JSON.stringify(this.policy))throw Error('Persistent authorization limits differ; refusing to reset or raise this job budget');
   const estimate=reserveEstimate(request),reserved=ledger.attempts.reduce((sum:number,a:any)=>sum+a.estimate.estimatedUSD,0);
   if(ledger.attempts.length>=this.policy.maxRequests)throw Error('Authorized TTS request limit reached; cached audio may still be reused');
   if(reserved+estimate.estimatedUSD>this.policy.maxEstimatedUSD+1e-10)throw Error('Conservative estimated TTS budget would be exceeded; request was not sent');
   const save=async()=>{ledger.requestCount=ledger.attempts.length;ledger.estimatedReservedUSD=ledger.attempts.reduce((sum:number,a:any)=>sum+a.estimate.estimatedUSD,0);const tmp=this.file+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(ledger,null,2));await rename(tmp,this.file);};
   const attempt={number:ledger.attempts.length+1,textHash:createHash('sha256').update(request.text).digest('hex'),estimate,status:'reserved-before-request',startedAt:new Date().toISOString(),requestId:null as string|null};ledger.attempts.push(attempt);await save();
   try{const result=await this.delegate.synthesize(request);attempt.status='succeeded';attempt.requestId=result.requestId??null;await save();return result;}catch(error){attempt.status='failed-or-uncertain';await save();throw error;}
  }finally{await handle.close();await rm(lock);}
 }
}
