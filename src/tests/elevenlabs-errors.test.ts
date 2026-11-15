import {describe,it,expect,vi} from 'vitest';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import configs from '../../config/narration.json';
import pkg from '../../package.json';
import {ttsConfigSchema} from '../audio/tts/provider';
import {ElevenLabsTTSProvider,ElevenLabsHTTPError,checkElevenLabsVoiceAccess,checkElevenLabsModelAccess,validateElevenLabs,elevenRequestHash,sanitizeElevenLabsDiagnostic} from '../audio/tts/elevenlabs';
const parsed=ttsConfigSchema.parse(configs.elevenlabs);if(parsed.provider!=='elevenlabs')throw Error('Invalid test fixture');const config=parsed,request={text:'Approved fixture text.',config};
const cases=[
 [401,'invalid_api_key','authentication','The API key is invalid.'],
 [402,'payment_required','billing','Free users cannot use library voices via the API. Please upgrade your subscription to use this voice.'],
 [403,'forbidden','permission','Access is blocked by the configured IP policy.'],
 [429,'rate_limit_exceeded','rate-limit','Too many requests. Try again later.'],
 [500,'internal_server_error','provider','An internal error occurred.'],
 [502,'upstream_error','provider','The upstream service failed.'],
 [503,'service_unavailable','provider','The service is temporarily unavailable.'],
] as const;
describe('sanitized ElevenLabs failures and zero automatic retries',()=>{
 it.each(cases)('retains HTTP %s, provider code %s and message in errors and the persistent ledger',async(status,code,category,message)=>{
  const dir=await mkdtemp(path.join(tmpdir(),'eleven-errors-'));try{
   const file=path.join(dir,'ledger.json'),fetchImpl=vi.fn(async()=>Response.json({detail:{status:code,message}},{status,headers:{'retry-after':'0','xi-api-key':'ignored-header-secret'}}));
   const options={apiKey:'fixture-api-credential',fetchImpl,ledgerPath:file,authorization:{maxRequests:1,maxCharacters:request.text.length,requestHash:elevenRequestHash(request)}};
   let error:unknown;try{await new ElevenLabsTTSProvider(options).synthesize(request);}catch(e){error=e;}
   expect(error).toBeInstanceOf(ElevenLabsHTTPError);expect(error).toMatchObject({httpStatus:status,providerCode:code,providerStatus:code,category,providerMessage:message});
   expect((error as Error).message).toContain(message);expect(fetchImpl).toHaveBeenCalledTimes(1);
   const ledger=JSON.parse(await readFile(file,'utf8'));expect(ledger.attempts).toHaveLength(1);expect(ledger.attempts[0]).toMatchObject({status:'failed-or-uncertain',error:{httpStatus:status,providerCode:code,providerMessage:message}});
   expect(JSON.stringify(ledger)).not.toMatch(/fixture-api-credential|ignored-header-secret|retry-after/);
   await expect(new ElevenLabsTTSProvider(options).synthesize(request)).rejects.toThrow('budget exhausted');expect(fetchImpl).toHaveBeenCalledTimes(1);
  }finally{await rm(dir,{recursive:true,force:true});}
 });
 it('preserves modern billing code, type and message instead of falling back to an unknown error',async()=>{
  const result=await checkElevenLabsVoiceAccess(config.voice,{apiKey:'fixture-api-credential',fetchImpl:vi.fn(async()=>Response.json({detail:{type:'payment_required',code:'paid_plan_required',message:'Free users cannot use library voices via the API.'}},{status:402}))});
  expect(result).toMatchObject({httpStatus:402,category:'billing',providerCode:'paid_plan_required',providerType:'payment_required',providerMessage:'Free users cannot use library voices via the API.'});
 });
 it('retains future safe error codes and top-level error envelopes',async()=>{
  const result=await checkElevenLabsVoiceAccess(config.voice,{apiKey:'fixture-api-credential',fetchImpl:vi.fn(async()=>Response.json({error:{code:'billing_account_review_required',message:'Account billing review is required.'}},{status:402}))});
  expect(result).toMatchObject({httpStatus:402,providerCode:'billing_account_review_required',providerMessage:'Account billing review is required.'});
 });
 it('redacts known credentials, encoded credentials, authorization data, URLs and key-like values before truncation',()=>{
  const secret='fixture/API+credential=12345',input=`Cannot use voice. ${secret} ${encodeURIComponent(secret)} Authorization: Bearer unknown-secret; xi-api-key=unknown-key; password=unknown-password; https://user:pass@example.test/?token=unknown-token sk_unlisted_secret123 ${'a'.repeat(60)}`;
  const safe=sanitizeElevenLabsDiagnostic(input,[secret]);expect(safe).toContain('Cannot use voice.');for(const value of [secret,encodeURIComponent(secret),'unknown-secret','unknown-key','unknown-password','unknown-token','sk_unlisted_secret123','a'.repeat(60)])expect(safe).not.toContain(value);
  const long=sanitizeElevenLabsDiagnostic('x '.repeat(395)+secret+' remains',[secret]);expect(long).not.toContain(secret);expect(long).toContain('[truncated]');
 });
 it('does not expose credential fields, nested debug bodies or control characters through returned JSON',async()=>{
  const key='fixture-api-credential',result=await checkElevenLabsVoiceAccess(config.voice,{apiKey:key,fetchImpl:vi.fn(async()=>Response.json({detail:{status:'payment_required',message:`Need a paid plan. Key was ${key}.\u001b[31m`,debug:{headers:{'xi-api-key':key},password:'unlisted-password'}},authorization:'unlisted-authorization'},{status:402}))});
  const serialized=JSON.stringify(result);expect(serialized).not.toMatch(/fixture-api-credential|unlisted-password|unlisted-authorization|debug|\\u001b/);expect(serialized).toContain('Need a paid plan.');
 });
 it.each(['not JSON','<html>secret upstream body</html>'])('uses a bounded safe fallback for non-JSON response bodies',async(body)=>{
  const result=await checkElevenLabsVoiceAccess(config.voice,{apiKey:'fixture-api-credential',fetchImpl:vi.fn(async()=>new Response(body,{status:502}))});
  expect(result).toMatchObject({httpStatus:502,providerCode:'unrecognized_provider_error',providerMessage:'No usable provider message returned.'});expect(JSON.stringify(result)).not.toContain(body);
 });
 it('retains string detail messages without dumping validation arrays or whole bodies',async()=>{
  const result=await checkElevenLabsVoiceAccess(config.voice,{apiKey:'fixture-api-credential',fetchImpl:vi.fn(async()=>Response.json({detail:'Billing review is needed.'},{status:402}))});expect(result).toMatchObject({httpStatus:402,providerMessage:'Billing review is needed.'});
 });
 it('uses native transport with no ElevenLabs SDK retry layer installed',()=>{
  expect(Object.keys({...pkg.dependencies,...pkg.devDependencies}).some(name=>/elevenlabs/i.test(name))).toBe(false);
 });
 it('does not retry transport failures or expose their request details',async()=>{
  const fetchImpl=vi.fn(async()=>{throw Error('request headers contain a secret');});const result=await checkElevenLabsVoiceAccess(config.voice,{apiKey:'fixture-api-credential',fetchImpl});expect(fetchImpl).toHaveBeenCalledTimes(1);expect(JSON.stringify(result)).not.toContain('request headers');
 });
 it('redacts quoted credential fields while retaining the billing explanation',()=>{
  const result=sanitizeElevenLabsDiagnostic('Paid plan required. {"xi-api-key":"unknown-key","token":"unknown-token"}');expect(result).toContain('Paid plan required.');expect(result).not.toMatch(/unknown-key|unknown-token/);
 });
 it('preserves long descriptive provider codes with underscores',async()=>{
  const providerCode='account_billing_eligibility_review_required_for_voice';const result=await checkElevenLabsVoiceAccess(config.voice,{apiKey:'fixture-api-credential',fetchImpl:vi.fn(async()=>Response.json({detail:{code:providerCode,message:'Eligibility review required.'}},{status:402}))});expect(result).toHaveProperty('providerCode',providerCode);
 });
 it('validates model capabilities using one GET and no synthesis',async()=>{
  const fetchImpl=vi.fn(async(url:unknown,init?:RequestInit)=>{expect(String(url)).toBe('https://api.elevenlabs.io/v1/models');expect(init?.method).toBe('GET');return Response.json([{model_id:config.model,can_do_text_to_speech:true,can_use_speaker_boost:true,can_use_style:true,languages:[{language_id:'en'}]}]);});const result=await checkElevenLabsModelAccess(config,{apiKey:'fixture-api-credential',fetchImpl});expect(result).toMatchObject({verified:true,httpStatus:200,paidRequests:0});expect(fetchImpl).toHaveBeenCalledTimes(1);
 });
 it('preserves sanitized model lookup failures without retrying',async()=>{
  const fetchImpl=vi.fn(async()=>Response.json({detail:{status:'missing_permissions',message:'Models permission is required; key fixture-api-credential'}},{status:401}));const result=await checkElevenLabsModelAccess(config,{apiKey:'fixture-api-credential',fetchImpl});expect(result).toMatchObject({httpStatus:401,providerCode:'missing_permissions',providerMessage:'Models permission is required; key [REDACTED]'});expect(fetchImpl).toHaveBeenCalledTimes(1);
 });

 it.each(['fine_tuned','not_fine_tuned'])('uses exact voice/model registration with state %s when the broad professional-voice flag conflicts',async(state)=>{
  const fetchImpl=vi.fn(async(url:unknown)=>{if(String(url).endsWith('/models'))return Response.json([{model_id:config.model,can_do_text_to_speech:true,can_use_speaker_boost:true,serves_pro_voices:false,languages:[{language_id:'en'}]}]);if(String(url).endsWith('/user/subscription'))return Response.json({tier:'starter',status:'active',character_count:0,character_limit:30000});return Response.json({voice_id:config.voice,name:'Bill L. Oxley',category:'professional',high_quality_base_model_ids:[config.model],fine_tuning:{state:{[config.model]:state}}});});const result=await validateElevenLabs(config,{apiKey:'fixture-api-credential',fetchImpl});expect(result.valid).toBe(state==='fine_tuned');expect(fetchImpl).toHaveBeenCalledTimes(3);expect(result.paidRequests).toBe(0);
 });

});
