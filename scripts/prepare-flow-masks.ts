/** Reuses existing nested path masks; never writes approved or fitted artwork. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const source='assets/illustrations/volcano/animation-masks-v1/',out='assets/illustrations/volcano/flow-masks-v1/';
mkdirSync(out,{recursive:true});const size=1254,n=size*size,arrival=new Uint8Array(n).fill(21);
const sources=[];
for(let step=1;step<=20;step++){const file=source+`lava-reveal-${String(step).padStart(2,'0')}.png`;sources.push({file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});const alpha=execFileSync('ffmpeg',['-v','error','-i',file,'-vf','alphaextract','-f','rawvideo','-pix_fmt','gray','pipe:1'],{maxBuffer:n+1024});for(let i=0;i<n;i++)if(alpha[i]&&arrival[i]===21)arrival[i]=step;}
const files=[];
for(let step=0;step<17;step++){const center=-4+step*2,data=new Uint8Array(n*4);for(let i=0;i<n;i++){const a=Math.exp(-(((arrival[i]-center)/2.8)**2));data.set([255,255,255,Math.round(255*a)],i*4);}const file=out+`path-band-${String(step).padStart(2,'0')}.png`;execFileSync('ffmpeg',['-v','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${size}x${size}`,'-i','pipe:0','-frames:v','1',file],{input:data});files.push({file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),center});}
writeFileSync(out+'report.json',JSON.stringify({algorithm:'Gaussian highlight bands over first-arrival rank of existing nested geodesic masks. Source alpha and existing reveal clip the highlight during rendering.',registration:[size,size],sources,files},null,2));console.log('Prepared 17 derived path highlight masks');
