import {words} from '../../storytelling/schema';
import type {SynthesisRequest,TTSProvider,SynthesisResult} from './provider';
/** Portable deterministic PCM fixture, deliberately NOT speech or a production voice. */
export class MockTTSProvider implements TTSProvider{
 readonly id='mock' as const;
 async synthesize({text,config}:SynthesisRequest):Promise<SynthesisResult>{
  if(config.provider!=='mock')throw Error('Mock provider configuration mismatch');
  const tokens=words(text);if(!tokens.length)throw Error('Cannot synthesize empty text');
  const sampleRate=24000,wordSeconds=60/config.wordsPerMinute/config.speakingRate;
  const count=Math.round(tokens.length*wordSeconds*sampleRate),wav=Buffer.alloc(44+count*2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40);
  for(let i=0;i<count;i++){const t=i/sampleRate,index=Math.min(tokens.length-1,Math.floor(t/wordSeconds)),local=t-index*wordSeconds;const code=[...tokens[index]].reduce((a,c)=>a+c.charCodeAt(0),0),frequency=(config.voice==='test-low'?160:230)+code%120;
   const envelope=Math.min(1,local/.008,(wordSeconds-local)/.008)*(.7+.3*Math.sin(Math.PI*local/wordSeconds)**2);
   wav.writeInt16LE(Math.round(3600*envelope*Math.sin(2*Math.PI*frequency*t)),44+i*2);
  }
  return{audio:wav,provider:this.id,model:config.model,usage:null,syntheticTestAudio:true};
 }
}
