/** Local controlled-prototype proof renders; never modifies source artwork. */
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderStill} from '@remotion/renderer';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {browserExecutable,run} from './media-tools';
const job=path.resolve(process.argv[2]??''),baseline=path.resolve(process.argv[3]??'jobs/volcano-m2-3-4-final');if(!process.argv[2])throw Error('Usage: review-motion-prototype <job> [baseline-job]');
const read=async(root:string,file:string)=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const board=parseStoryboard(await read(job,'storyboard.json')),narration=await read(job,'narration-props.json'),old=await read(baseline,'storyboard.json'),oldCaptions=await read(baseline,'narration-props.json');
if(JSON.stringify(narration)!==JSON.stringify(oldCaptions)||JSON.stringify(board.scenes.map(s=>s.durationFrames))!==JSON.stringify(old.scenes.map((s:any)=>s.durationFrames)))throw Error('Narration/captions/scene timing changed');
const dir=path.join(job,'motion-review');await mkdir(dir,{recursive:true});const frames=[30,180,210,270,285,350];
for(const [label,root] of [['before',baseline],['after',job]])for(const frame of frames)await run('ffmpeg',['-v','error','-y','-i',path.join(root,'output/narrated-animation.mp4'),'-vf',`select=eq(n\\,${frame}),scale=360:640`,'-frames:v','1',path.join(dir,`${label}-${frame}.png`)]);
const html=`<!doctype html><style>body{margin:0;padding:16px;background:#10152e;color:white;font:18px Arial}.grid{display:grid;grid-template-columns:360px 360px;gap:12px}.label{padding:8px}img{display:block;width:360px;height:640px}</style><h2>M2.3.4 baseline / M2.4.1 prototype — encoded frames</h2><div class="grid">${frames.flatMap(frame=>['before','after'].map(label=>`<div><div class="label">${label==='before'?'A · baseline':'B · motion prototype'} · ${Number((frame/30).toFixed(2))}s</div><img src="${label}-${frame}.png"></div>`)).join('')}</div>`;
await writeFile(path.join(dir,'comparison.html'),html);
await run(browserExecutable!,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--allow-file-access-from-files','--window-size=780,4240',`--screenshot=${path.join(job,'before-after-comparison.png')}`,pathToFileURL(path.join(dir,'comparison.html')).href]);
const conduit=board.assets.find(a=>a.id==='conduit')!;await mkdir(path.join(job,'public/validation'),{recursive:true});
 await run('ffmpeg',['-v','error','-y','-i',path.join(job,'public',conduit.path),'-vf',"format=rgba,geq=r=255:g=255:b=255:a='alpha(X,Y)'",path.join(job,'public/validation/conduit-alpha.png')]);
 await writeFile(path.join(job,'public/validation/black.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="black"/></svg>');

const serveUrl=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir:path.join(job,'public')}),browser=await openBrowser('chrome',{browserExecutable});
const still=async(inputProps:any,frame:number,file:string)=>{const composition=(await getCompositions(serveUrl,{inputProps,puppeteerInstance:browser})).find(c=>c.id==='GenericStoryboard')!;await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame,output:path.join(dir,file)});};
const determinism=[];let spill=0,changed=0;
try{
 for(const frame of [210,280]){await still({storyboard:board,narration},frame,`repeat-a-${frame}.png`);await still({storyboard:board,narration},frame,`repeat-b-${frame}.png`);determinism.push({frame,identical:(await readFile(path.join(dir,`repeat-a-${frame}.png`))).equals(await readFile(path.join(dir,`repeat-b-${frame}.png`)))});}
 // Isolate flow while holding camera, illustration state and every other input constant.
 const off=structuredClone(board);for(const group of off.groups??[])for(const layer of group.layers)delete layer.effects;
 await still({storyboard:off,narration},210,'flow-off.png');await still({storyboard:board,narration},210,'flow-on.png');
 const mask=structuredClone(off);mask.background='#000000';mask.assets.find(a=>a.id==='conduit')!.path='validation/conduit-alpha.png';mask.assets.push({id:'audit-black',path:'validation/black.svg',type:'svg',width:1080,height:1920,transparent:false});mask.backdrop={asset:'audit-black',decoration:false,dim:0};
 for(const group of mask.groups??[]){for(const layer of group.layers)if(!(group.id==='internal'&&layer.id==='conduit'))layer.opacity=[{frame:0,value:0}];for(const annotation of group.annotations??[])annotation.opacity=[{frame:0,value:0}];}
 await still({storyboard:mask,narration:{...narration,captionsEnabled:false}},210,'flow-allowed-mask.png');
 const raw=(file:string)=>execFileSync('ffmpeg',['-v','error','-i',path.join(dir,file),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:8*1024*1024});const before=raw('flow-off.png'),after=raw('flow-on.png'),allowed=raw('flow-allowed-mask.png'),w=1080,h=1920;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3;if(Math.max(...[0,1,2].map(c=>Math.abs(before[i+c]-after[i+c])))<=8)continue;changed++;let inside=false;for(let dy=-2;dy<=2&&!inside;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&allowed[(yy*w+xx)*3]>1){inside=true;break;}}if(!inside)spill++;}
 for(const [file,output,filter] of [['flow-on.png','flow-detail.png','crop=420:850:330:650,scale=420:850'],['repeat-a-280.png','eruption-detail.png','crop=650:650:215:450,scale=650:650']] as const)await run('ffmpeg',['-v','error','-y','-i',path.join(dir,file),'-vf',filter,path.join(job,output)]);
}finally{await browser.close({silent:true});}
const render=await read(job,'reports/render-report.json'),previous=await read(baseline,'reports/render-report.json');
const report={baselineJob:baseline,prototypeJob:job,checks:{captionsIdentical:true,sceneDurationsIdentical:true,flowVisiblyChangesPixels:changed>100,flowConfinedToConduit:spill===0,sameFrameRendersIdentical:determinism.every(d=>d.identical)},determinism,flowMask:{changedPixels:changed,significantPixelsOutsideSourceAlpha:spill,differenceThreshold:8,antialiasTolerancePixels:2},performance:{baselineSeconds:previous.elapsedSeconds,prototypeSeconds:render.elapsedSeconds,increaseSeconds:render.elapsedSeconds-previous.elapsedSeconds,increasePercent:(render.elapsedSeconds/previous.elapsedSeconds-1)*100,note:'One retained baseline and one prototype render; some free regression/build checks ran concurrently. Additional SVG masks, highlights and particle nodes are the added rendering work. No quality reduction or particle-count reduction was used.'},clocks:'Effects use the existing normalized illustration clock plus subject timeOffset. Camera keys use output scene-local frames. Existing group offsets explicitly continue emitters across handoffs.'};
await writeFile(path.join(job,'reports/motion-prototype-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!Object.values(report.checks).every(Boolean))process.exitCode=1;
