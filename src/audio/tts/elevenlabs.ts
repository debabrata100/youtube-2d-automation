import {createHash} from 'node:crypto';
import {mkdir,open,readFile,rename,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {characterAlignmentSchema} from './alignment';
export {characterAlignmentSchema} from './alignment';
import {ttsConfigSchema,type CharacterAlignment,type SynthesisRequest,type SynthesisResult,type TTSProvider} from './provider';
const base='https://api.elevenlabs.io/v1';
class SafeProviderError extends Error {}
const looseAlignment=z.object({characters:z.array(z.string()),character_start_times_seconds:z.array(z.number().finite()),character_end_times_seconds:z.array(z.number().finite())}).passthrough();
/** Provider timings can overlap by a few milliseconds (number/abbreviation normalisation); clamp them monotonic instead of discarding a paid take. */
export const repairAlignment=(a:z.infer<typeof looseAlignment>):CharacterAlignment=>{
 if(!a.characters.length||a.characters.length!==a.character_start_times_seconds.length||a.characters.length!==a.character_end_times_seconds.length)throw Error('Provider alignment arrays are empty or of different lengths');
 const starts:number[]=[],ends:number[]=[];let prev=0;
 a.characters.forEach((_,i)=>{const st=Math.max(prev,a.character_start_times_seconds[i],0),en=Math.max(st,a.character_end_times_seconds[i]);starts.push(st);ends.push(en);prev=en;});
 return characterAlignmentSchema.parse({characters:a.characters,character_start_times_seconds:starts,character_end_times_seconds:ends}) as CharacterAlignment;
};
/** Linear base64 check. (A single regex with a repeated group overflowed V8's stack on takes over ~4 MB of base64, i.e. ~80 s of audio.) */
export const isBase64=(v:string)=>{if(!v.length||v.length%4)return false;const body=v.replace(/=+$/,'');if(v.length-body.length>2)return false;return !/[^A-Za-z0-9+/]/.test(body);};
/** Decode a saved with-timestamps response body into WAV + alignment (used live and to recover a paid take offline). */
export const decodeTimestampedResponse=(body:string)=>{
 const data=z.object({audio_base64:z.string().min(1),alignment:looseAlignment.nullable().optional(),normalized_alignment:looseAlignment.nullable().optional()}).passthrough().parse(JSON.parse(body));
 if(!isBase64(data.audio_base64))throw Error('Invalid audio encoding');
 const raw=data.alignment??data.normalized_alignment,alignment=raw?repairAlignment(raw):undefined;
 const pcm=Buffer.from(data.audio_base64,'base64'),audio=pcm24kToWav(pcm);
 if(alignment&&alignment.character_end_times_seconds.at(-1)!>pcm.length/48000+.25)throw Error('Provider timing exceeds measured PCM duration');
 return{audio,alignment};
};
/** Read only provider diagnostic fields; never serialize bodies, headers or request options. */
const credentialValues=(explicit:readonly string[])=>[...explicit,...Object.entries(process.env).filter(([name])=>/(?:key|token|secret|password|credential)/i.test(name)).map(([,value])=>value??'')].filter(value=>value.length>=4);
export const sanitizeElevenLabsDiagnostic=(value:string,secrets:readonly string[]=[])=>{
 let text=value;
 const redactKnown=(input:string)=>{for(const secret of credentialValues(secrets)){for(const variant of new Set([secret,encodeURIComponent(secret),JSON.stringify(secret).slice(1,-1)]))input=input.split(variant).join('[REDACTED]');}return input;};
 text=redactKnown(text).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'').replace(/[\p{Cc}\p{Cf}]/gu,'');
 text=redactKnown(text)
  .replace(/https?:\/\/[^\s<>"']+/gi,'[URL REDACTED]')
  .replace(/\b(?:authorization|proxy-authorization|xi-api-key|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|token|secret|credential|cookie|set-cookie|session)\b["']?\s*[:=]\s*["']?[^;\r\n]+/gi,'[CREDENTIAL REDACTED]')
  .replace(/\bBearer\s+[A-Za-z0-9._~+\/=-]+/gi,'Bearer [REDACTED]')
  .replace(/\b(?:sk[_-]|pk_live_|sk_live_)[A-Za-z0-9_-]+/g,'[REDACTED]')
  .replace(/\b[A-Za-z0-9+\/=]{40,}\b/g,'[TOKEN REDACTED]')
  .replace(/\s+/g,' ').trim();
 return text.length>800?text.slice(0,800)+' [truncated]':text;
};
export class ElevenLabsHTTPError extends SafeProviderError {
 constructor(readonly httpStatus:number,readonly category:'authentication'|'permission'|'voice-access'|'rate-limit'|'billing'|'provider',readonly providerCode:string,operation:string,readonly providerMessage:string,readonly providerStatus?:string,readonly providerType?:string){
  const explanations={authentication:'Authentication rejected; verify the locally configured key is active and belongs to the intended ElevenLabs account.',permission:'Access denied; check endpoint scopes, account restrictions and IP allowlisting.', 'voice-access':'Selected voice is unavailable or inaccessible to this account; no voice substitution.', 'rate-limit':'Rate limited; retry only after separate authorization.',billing:'Payment or billing eligibility rejected; review account and selected-voice requirements.',provider:'Provider rejected the request.'};
  super(`ElevenLabs ${operation} failed (HTTP ${httpStatus}; ${providerCode}). ${providerMessage} ${explanations[category]} No fallback or automatic retry.`);
 }
 toJSON(){return{httpStatus:this.httpStatus,category:this.category,providerCode:this.providerCode,providerMessage:this.providerMessage,...(this.providerStatus?{providerStatus:this.providerStatus}:{}),...(this.providerType?{providerType:this.providerType}:{}),message:this.message};}
}
export type ElevenConfig=Extract<ReturnType<typeof ttsConfigSchema.parse>,{provider:'elevenlabs'}>;
const keyOrThrow=(value?:string)=>{const key=value??process.env.ELEVENLABS_API_KEY;if(!key?.trim())throw Error('ELEVENLABS_API_KEY is required; no request was made');return key;};
// Synthesis of a long take (and downloading its base64 audio) can exceed a minute; the timeout covers the body read too.
const safeFetch=async(transport:typeof fetch,url:string,init:RequestInit,timeoutMs=60000)=>{try{return await transport(url,{...init,redirect:'error',signal:AbortSignal.timeout(timeoutMs)});}catch{throw new SafeProviderError('ElevenLabs transport failed or timed out; no automatic retry. Any paid attempt remains counted.');}};
/** Preserve legacy detail.status and current detail.code/type/message error shapes.
 * Unknown safe codes are retained, preventing future billing errors being discarded. */
const checkResponse=async(r:Response,operation:string,secrets:readonly string[])=>{
 if(r.ok)return;
 let providerCode='unrecognized_provider_error',providerMessage='No usable provider message returned.',providerStatus:string|undefined,providerType:string|undefined;
 try{
  const body=await r.json();const detail=body?.detail??body?.error??body;
  const code=(value:unknown)=>{if(typeof value!=='string')return undefined;const safe=sanitizeElevenLabsDiagnostic(value,secrets);return /^[A-Za-z][A-Za-z0-9_.-]{0,95}$/.test(safe)?safe:undefined;};
  providerStatus=code(detail?.status);providerType=code(detail?.type);
  providerCode=code(detail?.code)??providerStatus??providerType??providerCode;
  const message=typeof detail==='string'?detail:detail?.message;
  if(typeof message==='string')providerMessage=sanitizeElevenLabsDiagnostic(message,secrets)||providerMessage;
 }catch{}
 const codes=[providerCode,providerStatus,providerType].map(value=>value?.toLowerCase());
 const category=codes.some(code=>['missing_permissions','insufficient_permissions'].includes(code??''))?'permission':codes.some(code=>['voice_not_found','voice_access_denied','voice_not_available','voice_not_allowed'].includes(code??''))?'voice-access':r.status===402?'billing':r.status===403?'permission':r.status===401?'authentication':r.status===404?'voice-access':r.status===429?'rate-limit':'provider';
 throw new ElevenLabsHTTPError(r.status,category,providerCode,operation,providerMessage,providerStatus,providerType);
};
/** One supported, read-only voice GET. No subscription lookup, import or synthesis. */
export const checkElevenLabsVoiceAccess=async(voiceId:string,options:{apiKey?:string;fetchImpl?:typeof fetch}={})=>{
 if(!/^[a-zA-Z0-9]{20}$/.test(voiceId))throw Error('Invalid ElevenLabs voice ID; no request made');
 const key=keyOrThrow(options.apiKey);
 try{
  const response=await safeFetch(options.fetchImpl??fetch,base+'/voices/'+voiceId,{method:'GET',headers:{'xi-api-key':key}});
  await checkResponse(response,'voice access',[key]);
  let matches=false;try{const voice=z.object({voice_id:z.string()}).parse(await response.json());matches=voice.voice_id===voiceId;}catch{}
  return{verified:matches,httpStatus:response.status,category:matches?'verified':'invalid-response',message:matches?'Selected voice metadata is accessible. Synthesis entitlement and billable usage have not been tested.':'Voice metadata did not match the requested ID.',voiceId,metadataRequests:1,paidRequests:0};
 }catch(error){
  if(error instanceof ElevenLabsHTTPError)return{verified:false,...error.toJSON(),voiceId,metadataRequests:1,paidRequests:0};
  return{verified:false,httpStatus:null,category:'transport',message:'Read-only voice check failed before receiving a usable HTTP response; no retry or synthesis.',voiceId,metadataRequests:1,paidRequests:0};
 }
};
/** Read-only model validation; shares the same sanitized error boundary as synthesis. */
export const checkElevenLabsModelAccess=async(config:ElevenConfig,options:{apiKey?:string;fetchImpl?:typeof fetch}={})=>{
 ttsConfigSchema.parse(config);const key=keyOrThrow(options.apiKey);
 try{
  const response=await safeFetch(options.fetchImpl??fetch,base+'/models',{method:'GET',headers:{'xi-api-key':key}});
  await checkResponse(response,'model access',[key]);
  const models=z.array(z.object({model_id:z.string(),can_do_text_to_speech:z.boolean(),can_use_style:z.boolean().optional(),can_use_speaker_boost:z.boolean().optional(),requires_alpha_access:z.boolean().optional(),languages:z.array(z.object({language_id:z.string()})).optional()})).parse(await response.json());
  const model=models.find(m=>m.model_id===config.model);
  const verified=Boolean(model?.can_do_text_to_speech&&!model.requires_alpha_access&&(!config.voiceSettings.use_speaker_boost||model.can_use_speaker_boost)&&(config.voiceSettings.style===0||model.can_use_style)&&model.languages?.some(l=>l.language_id==='en'));
  return{verified,httpStatus:response.status,modelId:config.model,canDoTextToSpeech:model?.can_do_text_to_speech===true,requestedSettingsSupported:verified,metadataRequests:1,paidRequests:0,message:verified?'Selected model and requested settings are available. Synthesis entitlement has not been tested.':'Selected model or requested capabilities could not be verified.'};
 }catch(error){
  if(error instanceof ElevenLabsHTTPError)return{verified:false,...error.toJSON(),modelId:config.model,metadataRequests:1,paidRequests:0};
  return{verified:false,httpStatus:null,category:'transport-or-invalid-response',message:'Read-only model check failed without usable metadata; no retry or synthesis.',modelId:config.model,metadataRequests:1,paidRequests:0};
 }
};
/** Read-only metadata operations only. No synthesis, voice import, or effects. */
export const validateElevenLabs=async(config:ElevenConfig,options:{apiKey?:string;fetchImpl?:typeof fetch}={})=>{
 ttsConfigSchema.parse(config);const key=keyOrThrow(options.apiKey),transport=options.fetchImpl??fetch;
 const get=async(route:string)=>{const r=await safeFetch(transport,base+route,{method:'GET',headers:{'xi-api-key':key}});await checkResponse(r,'metadata lookup',[key]);return r.json();};
 const results=await Promise.allSettled([get('/voices/'+config.voice),get('/models'),get('/user/subscription')]);
 const failures=results.flatMap((r,i)=>r.status==='rejected'?[{operation:['voice','models','subscription'][i],error:r.reason instanceof Error?r.reason.message:'Metadata validation failed',...(r.reason instanceof ElevenLabsHTTPError?r.reason.toJSON():{})}]:[]);
 if(failures.length)return{valid:false,metadataRequests:3,paidRequests:0,failures};
 const voice=z.object({voice_id:z.string(),name:z.string(),category:z.string().optional(),fine_tuning:z.object({state:z.record(z.string(),z.string())}).optional(),labels:z.record(z.string(),z.string()).optional(),available_for_tiers:z.array(z.string()).optional(),high_quality_base_model_ids:z.array(z.string()).optional(),sharing:z.object({free_users_allowed:z.boolean().optional(),disable_at_unix:z.number().nullable().optional()}).optional()}).parse((results[0] as PromiseFulfilledResult<unknown>).value);
 const models=z.array(z.object({model_id:z.string(),can_do_text_to_speech:z.boolean(),can_use_style:z.boolean().optional(),can_use_speaker_boost:z.boolean().optional(),serves_pro_voices:z.boolean().optional(),requires_alpha_access:z.boolean().optional(),maximum_text_length_per_request:z.number().optional(),token_cost_factor:z.number().optional(),languages:z.array(z.object({language_id:z.string()})).optional()})).parse((results[1] as PromiseFulfilledResult<unknown>).value);
 const subscription=z.object({tier:z.string(),status:z.string().optional(),character_count:z.number(),character_limit:z.number()}).parse((results[2] as PromiseFulfilledResult<unknown>).value);
 const model=models.find(m=>m.model_id===config.model),restrictions:string[]=[];
 if(voice.voice_id!==config.voice)restrictions.push('Returned voice ID does not match selected voice');
 if(!model?.can_do_text_to_speech)restrictions.push('Selected model is unavailable for TTS');
 if(model?.requires_alpha_access)restrictions.push('Model requires alpha access; confirm entitlement');
 if(config.voiceSettings.style>0&&!model?.can_use_style)restrictions.push('Model does not support style');
 if(config.voiceSettings.use_speaker_boost&&!model?.can_use_speaker_boost)restrictions.push('Model does not support speaker boost');
 if(model?.languages&&!model.languages.some(l=>l.language_id==='en'))restrictions.push('Model does not list English support');
 // Exact completed voice/model registration is stronger evidence than the broad model flag.
 const voiceModelRegistered=voice.high_quality_base_model_ids?.includes(config.model)===true&&voice.fine_tuning?.state[config.model]==='fine_tuned';
 if(voice.category==='professional'&&!model?.serves_pro_voices&&!voiceModelRegistered)restrictions.push('Model does not serve professional voices and selected voice/model registration is not confirmed');
 if(voice.high_quality_base_model_ids?.length&&!voice.high_quality_base_model_ids.includes(config.model))restrictions.push('Voice does not list selected high-quality base model');
 if(voice.available_for_tiers?.length&&!voice.available_for_tiers.includes(subscription.tier))restrictions.push('Subscription tier not listed for selected voice');
 if(subscription.tier==='free'&&voice.sharing?.free_users_allowed===false)restrictions.push('Selected voice disallows free accounts');
 if(voice.sharing?.disable_at_unix&&voice.sharing.disable_at_unix<=Date.now()/1000)restrictions.push('Shared voice availability has expired');
 if(subscription.status&&subscription.status!=='active')restrictions.push('Subscription is not active; confirm entitlement before synthesis');
 if(subscription.character_count>=subscription.character_limit)restrictions.push('Included credit allowance exhausted; no overage authorized');
 return{valid:restrictions.length===0,metadataRequests:3,paidRequests:0,voice:{id:voice.voice_id,name:voice.name,category:voice.category,gender:voice.labels?.gender},model,subscription:{tier:subscription.tier,status:subscription.status,remainingIncludedCredits:Math.max(0,subscription.character_limit-subscription.character_count)},restrictions,voiceModelRegistered,compatibilityWarning:voice.category==='professional'&&!model?.serves_pro_voices&&voiceModelRegistered?'Broad serves_pro_voices flag is false, but the selected voice explicitly lists the model with completed fine-tuning. Exact voice/model registration used; synthesis entitlement remains untested.':null,accessCaveat:'GET access is metadata validation, not a guarantee that a later synthesis request will be entitled or successful.'};
};
export const pcm24kToWav=(pcm:Uint8Array)=>{if(!pcm.length||pcm.length%2)throw Error('Invalid PCM audio');const b=Buffer.alloc(44+pcm.length);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(pcm.length,40);b.set(pcm,44);return b;};
export type ElevenAuthorization={maxRequests:number;maxCharacters:number;requestHash:string};
export const elevenRequestHash=(r:SynthesisRequest)=>createHash('sha256').update(JSON.stringify({text:r.text,config:ttsConfigSchema.parse(r.config)})).digest('hex');
/** Paid capability requires exact-request authorization plus persistent reservation.
 * No retry policy is exposed: maximum automatic retries is zero, including 429. */
export class ElevenLabsTTSProvider implements TTSProvider{
 readonly id='elevenlabs' as const;
 constructor(private options:{apiKey?:string;fetchImpl?:typeof fetch;authorization?:ElevenAuthorization;ledgerPath?:string}={}){}
 async synthesize(request:SynthesisRequest):Promise<SynthesisResult>{
  const config=ttsConfigSchema.parse(request.config);if(config.provider!=='elevenlabs')throw Error('ElevenLabs provider configuration mismatch');
  const key=keyOrThrow(this.options.apiKey),policy=this.options.authorization,file=this.options.ledgerPath;
  if(!policy||!file)throw Error('Paid ElevenLabs synthesis blocked: separate bounded human approval is required');
  const count=Array.from(request.text).length;
  if(!request.text.trim()||!Number.isInteger(policy.maxRequests)||policy.maxRequests<1||!Number.isInteger(policy.maxCharacters)||policy.maxCharacters<1||elevenRequestHash(request)!==policy.requestHash||count>policy.maxCharacters)throw Error('Request differs from authorized synthesis plan');
  await mkdir(path.dirname(file),{recursive:true});let lock;try{lock=await open(file+'.lock','wx');}catch{throw Error('Paid request ledger locked; inspect unfinished attempt; no retry');}
  try{
   let ledger:{policy:ElevenAuthorization;attempts:Array<{status:string;characters:number;requestId?:string;error?:ReturnType<ElevenLabsHTTPError['toJSON']>}>};
   try{ledger=JSON.parse(await readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;ledger={policy,attempts:[]};}
   if(JSON.stringify(ledger.policy)!==JSON.stringify(policy))throw Error('Persistent authorization policy differs');
   if(ledger.attempts.length>=policy.maxRequests||ledger.attempts.reduce((n,a)=>n+a.characters,0)+count>policy.maxCharacters)throw Error('Authorized paid request/character budget exhausted');
   const save=async()=>{await writeFile(file+'.tmp',JSON.stringify(ledger,null,2));await rename(file+'.tmp',file);};
   const attempt:{status:string;characters:number;requestId?:string;error?:ReturnType<ElevenLabsHTTPError['toJSON']>}={status:'reserved-before-request',characters:count};ledger.attempts.push(attempt);await save();
   try{
    const response=await safeFetch(this.options.fetchImpl??fetch,`${base}/text-to-speech/${config.voice}/with-timestamps?output_format=${config.outputFormat}`,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({text:request.text,model_id:config.model,voice_settings:config.voiceSettings,seed:config.seed,apply_text_normalization:config.applyTextNormalization})},300000);
    await checkResponse(response,'synthesis',[key]);
    attempt.status='response-received';await save();
    // Save the paid response before any validation, so a parsing problem can be recovered offline without paying again.
    const body=await response.text(),responseFile=file.replace(/\.json$/,'')+'.response.json';
    await writeFile(responseFile,body);
    const {audio,alignment}=decodeTimestampedResponse(body);
    attempt.status='succeeded';attempt.requestId=response.headers.get('request-id')??undefined;await save();
    return{audio,...(alignment?{alignment}:{}),provider:this.id,model:config.model,requestId:attempt.requestId,usage:null,syntheticTestAudio:false};
   }catch(error){attempt.status=attempt.status==='response-received'?'response-received-but-invalid':'failed-or-uncertain';if(error instanceof ElevenLabsHTTPError)attempt.error=error.toJSON();else (attempt as {detail?:string}).detail=sanitizeElevenLabsDiagnostic(String((error as Error)?.message??error),[key]).slice(0,300);await save();if(error instanceof SafeProviderError)throw error;throw Error('ElevenLabs synthesis failed or returned invalid data; attempt remains counted; no automatic retry. Inspect account status before separately authorizing another request.');}
  }finally{await lock.close();await rm(file+'.lock');}
 }
}
