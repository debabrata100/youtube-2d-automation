import type {SynthesisRequest,SynthesisResult,TTSProvider} from './provider';
export const paidSpeechEstimate={currency:'USD',illustrativeCost:.0039,planningBudget:.02,assumptions:'500 total text-input tokens and 300 audio-output tokens across five requests; $0.60/M input and $12/M audio output. Illustrative only, not measured usage or a billing cap.',verifiedOn:'2026-11-14',endpoint:'https://api.openai.com/v1/audio/speech',shutdown:'2027-01-06'};
/** Direct documented HTTP contract; no OpenAI SDK is installed in this repo. */
export class OpenAITTSProvider implements TTSProvider{
 readonly id='openai' as const;
 constructor(private readonly options:{apiKey?:string;authorized?:boolean;fetchImpl?:typeof fetch;now?:()=>Date}={}){}
 async synthesize({text,config}:SynthesisRequest):Promise<SynthesisResult>{
  if(config.provider!=='openai')throw Error('OpenAI provider configuration mismatch');
  const apiKey=this.options.apiKey??process.env.OPENAI_API_KEY;
  if(!apiKey?.trim())throw Error('OPENAI_API_KEY is required for OpenAI TTS. Use --tts mock for no-cost development.');
  if(!this.options.authorized)throw Error('Paid TTS authorization required. Review model, voice and estimated cost before explicitly authorizing the first request.');
  if((this.options.now?.()??new Date()).toISOString().slice(0,10)>=paidSpeechEstimate.shutdown)throw Error('Configured Speech API models have reached their documented shutdown date. Recheck official support and migrate the provider before spending credits.');
  const result=await(this.options.fetchImpl??fetch)(paidSpeechEstimate.endpoint,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:config.model,voice:config.voice,input:text,instructions:config.instructions,speed:config.speakingRate,response_format:config.format}),signal:AbortSignal.timeout(60000)});
  // Never include request headers, credentials or arbitrary server bodies in errors.
  if(!result.ok)throw Error(`OpenAI speech request failed (HTTP ${result.status}); no automatic retry was made.`);
  const audio=new Uint8Array(await result.arrayBuffer());if(audio.length<44)throw Error('OpenAI returned an empty/invalid audio response');
  return{audio,provider:this.id,model:config.model,requestId:result.headers.get('x-request-id')??undefined,usage:null,syntheticTestAudio:false};
 }
}
