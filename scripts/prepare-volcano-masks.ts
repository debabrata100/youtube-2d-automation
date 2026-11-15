import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {extractOpening, type Raster} from './lib/image-fitting';
const root = 'assets/illustrations/volcano/';
const out = root + 'animation-masks-v1/'; mkdirSync(out, {recursive: true});
const read = (file: string): Raster => {const png = readFileSync(file), width = png.readUInt32BE(16), height = png.readUInt32BE(20); return {width, height, data: execFileSync('ffmpeg', ['-v','error','-i',file,'-f','rawvideo','-pix_fmt','rgba','pipe:1'], {maxBuffer: width*height*4+1024})};};
const write = (name: string, data: Uint8Array, width: number, height: number) => execFileSync('ffmpeg', ['-v','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${height}`,'-i','pipe:0','-frames:v','1',out+name], {input:data});
const rock = read(root+'batch-a/cutaway-rock-v1.png'), lava = read(root+'batch-c/fitted-v1/lava-flows-fitted.png');
const {width:w,height:h} = rock, n=w*h;
const opening = extractOpening(rock, {x:630,y:1000}).mask;
const cavity = new Uint8Array(n*4);
// Small opaque underlap is hidden by foreground rock, avoiding halo gaps.
for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){const i=y*w+x;let covered=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)covered ||= !!opening[i+dy*w+dx];if(covered)cavity.set([42,15,17,255],i*4);}
write('cavity-shadow.png',cavity,w,h);
const support = new Uint8Array(n);
for(let y=4;y<h-4;y++)for(let x=4;x<w-4;x++)if(lava.data[(y*w+x)*4+3]>16)for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)support[(y+dy)*w+x+dx]=1;
let start=-1,nearest=Infinity;
for(let i=0;i<n;i++)if(support[i]){const d=(i%w-648)**2+(Math.floor(i/w)-333)**2;if(d<nearest){nearest=d;start=i;}}
const distance=new Int32Array(n).fill(-1), queue=new Int32Array(n);let tail=1;queue[0]=start;distance[start]=0;
for(let head=0;head<tail;head++){const i=queue[head];for(const j of [i-1,i+1,i-w,i+w])if(j>=0&&j<n&&Math.abs(j%w-i%w)<=1&&support[j]&&distance[j]<0){distance[j]=distance[i]+1;queue[tail++]=j;}}
let painted=0,reached=0,maxDistance=0;
for(let i=0;i<n;i++)if(lava.data[i*4+3]>16){painted++;if(distance[i]>=0){reached++;maxDistance=Math.max(maxDistance,distance[i]);}}
if(reached/painted<.99)throw new Error(`Lava path disconnected: ${reached}/${painted}`);
const files=[];
for(let step=0;step<=20;step++){const data=new Uint8Array(n*4);for(let i=0;i<n;i++)if(step===20||(step>0&&distance[i]>=0&&distance[i]<=maxDistance*step/20))data.set([255,255,255,255],i*4);const name=`lava-reveal-${String(step).padStart(2,'0')}.png`;write(name,data,w,h);files.push({file:out+name,sha256:createHash('sha256').update(readFileSync(out+name)).digest('hex')});}
writeFileSync(out+'report.json',JSON.stringify({algorithm:'4-neighbor geodesic flood along fitted lava alpha>16, dilated 4 source pixels; nested 20-step reveal; final mask includes all original alpha',registration:[w,h],paintedPixels:painted,reachedPixels:reached,coverage:reached/painted,maxDistance,openingPixels:opening.reduce((a,b)=>a+b,0),files},null,2));
console.log(JSON.stringify({painted,reached,coverage:reached/painted,maxDistance}));
