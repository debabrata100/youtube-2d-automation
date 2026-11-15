import {spawn} from 'node:child_process';
export const commandOutput=(command:string,args:string[]):Promise<string>=>new Promise((resolve,reject)=>{const child=spawn(command,args);let out='',error='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>error+=d);child.on('error',reject);child.on('close',code=>code===0?resolve(out):reject(Error(`${command} failed (${code}): ${error.slice(-1200)}`)));});
export const measureAudio=async(file:string)=>{
 const data=JSON.parse(await commandOutput('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels,duration:format=duration','-of','json',file]));
 const stream=data.streams?.[0];const durationSeconds=Number(stream?.duration??data.format?.duration);
 if(!stream||!Number.isFinite(durationSeconds)||durationSeconds<=0)throw Error(`Missing or invalid measured audio duration: ${file}`);
 return{durationSeconds,sampleRate:Number(stream.sample_rate),channels:Number(stream.channels),codec:stream.codec_name as string};
};
