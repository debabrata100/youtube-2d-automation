import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderMedia,renderStill} from '@remotion/renderer';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {browserExecutable,run} from './media-tools';
import {validateAssetFiles} from './storyboard-assets';
const phase=process.argv[2]??'proof';if(!['proof','previews','final'].includes(phase))throw Error('proof | previews | final');
const job=path.resolve(process.argv[3]??`jobs/volcano-m2-2-1-${new Date().toISOString().replace(/[:.]/g,'-')}`);
const storyboard=parseStoryboard(JSON.parse(await readFile('storyboards/volcano-m2-2-1.json','utf8')));
await validateAssetFiles(storyboard.assets);await mkdir(path.join(job,'previews/composition'),{recursive:true});await mkdir(path.join(job,'output'),{recursive:true});
await writeFile(path.join(job,'storyboard.json'),JSON.stringify(storyboard,null,2));console.log(JSON.stringify({phase,job}));
const serveUrl=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir:path.resolve('assets')});
const inputProps={storyboard};const composition=(await getCompositions(serveUrl,{inputProps,browserExecutable})).find(c=>c.id==='GenericStoryboard')!;
if(phase==='proof'){
 const browser=await openBrowser('chrome',{browserExecutable});try{for(const frame of [0,89,108,125,155,220,275,290,315,355,390,449])await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame,output:path.join(job,`previews/composition/frame-${frame}.png`)});}finally{await browser.close({silent:true});}
}else if(phase==='previews'){
 for(const [name,range] of [['cutaway',[80,160]],['magma',[180,269]],['eruption',[263,359]],['lava',[293,389]]] as const)await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:path.join(job,`previews/${name}-motion.mp4`),codec:'h264',frameRange:[...range],scale:.5,concurrency:1,disallowParallelEncoding:true});
}else{
 let peak=process.memoryUsage().rss;const timer=setInterval(()=>{peak=Math.max(peak,process.memoryUsage().rss);},250);const started=performance.now();
 try{await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:path.join(job,'output/animation.mp4'),codec:'h264',pixelFormat:'yuv420p',crf:18,concurrency:1,disallowParallelEncoding:true});}finally{clearInterval(timer);}
 const elapsedSeconds=Number(((performance.now()-started)/1000).toFixed(2));await writeFile(path.join(job,'render-report.json'),JSON.stringify({elapsedSeconds,timingScope:'450-frame render plus H.264 encoding; excludes bundle, previews, verification',previousSeconds:40.86,ratioToPrevious:elapsedSeconds/40.86,nodeCoordinatorPeakRssMB:Number((peak/1024/1024).toFixed(1)),memoryScope:'Node coordinator only; excludes Chrome and FFmpeg',frames:450,humanVisualApproval:'pending'},null,2));
 await run(process.execPath,['--import','tsx','scripts/verify-storyboard.ts',job]);console.log(JSON.stringify({job,elapsedSeconds}));
}
