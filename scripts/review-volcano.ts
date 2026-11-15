/** Uses the generic storyboard composition; no topic-specific React renderer. */
import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia,renderStill} from '@remotion/renderer';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {browserExecutable,run} from './media-tools';
import {validateAssetFiles} from './storyboard-assets';
const phase=process.argv[2]??'composition';
if(!['composition','motion','final'].includes(phase))throw new Error('phase: composition | motion | final');
const job=path.resolve(process.argv[3]??`jobs/volcano-m2-2-${new Date().toISOString().replace(/[:.]/g,'-')}`);
const storyboard=parseStoryboard(JSON.parse(await readFile('storyboards/volcano.json','utf8')));
await validateAssetFiles(storyboard.assets);
await mkdir(path.join(job,'previews/composition'),{recursive:true});await mkdir(path.join(job,'output'),{recursive:true});
console.log(JSON.stringify({phase,job}));
await writeFile(path.join(job,'storyboard.json'),JSON.stringify(storyboard,null,2));
const serveUrl=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir:path.resolve('assets')});
const inputProps={storyboard};
const composition=(await getCompositions(serveUrl,{inputProps,browserExecutable})).find(c=>c.id==='GenericStoryboard');if(!composition)throw new Error('Missing composition');
if(phase==='composition'){
 const proof=structuredClone(storyboard);proof.crossfadeFrames=undefined;
 for(const scene of proof.scenes){scene.transitionFrames=0;scene.caption.hold=true;}
 // Full material poses prove geometry before motion; the production JSON is unchanged.
 for(const group of proof.groups??[])for(const layer of group.layers){
  if(layer.opacity)layer.opacity=[{frame:0,value:group.id==='surface-dissolve'?0:1}];
  if(layer.scale)layer.scale=[{frame:0,value:1}];
  if(layer.reveal?.type==='wipe')layer.reveal.progress=[{frame:0,value:1}];
  if(layer.reveal?.type==='mask-sequence')layer.reveal=undefined;
 }
 await writeFile(path.join(job,'previews/composition/static-storyboard.json'),JSON.stringify(proof,null,2));
 for(const [i,frame] of [45,135,225,315,435].entries())await renderStill({serveUrl,composition:{...composition,props:{storyboard:proof}},inputProps:{storyboard:proof},browserExecutable,frame,output:path.join(job,`previews/composition/scene-${i+1}.png`)});
 const dir=path.join(job,'previews/composition');
 for(const [name,scene,crop] of [['crater',4,'250:280:460:700'],['chamber',2,'660:360:230:1250'],['conduit',3,'400:550:380:820'],['chamber-conduit-junction',3,'360:320:360:1020'],['lava-ground',4,'1000:360:40:1080']] as const)await run('ffmpeg',['-v','error','-y','-i',path.join(dir,`scene-${scene}.png`),'-vf',`crop=${crop},scale=iw*2:ih*2`,'-frames:v','1',path.join(dir,`${name}-detail.png`)]);
 console.log('Static proofs complete. Inspect before motion/final.');
}else{
 const receipt=JSON.parse(await readFile(path.join(job,'composition-review.json'),'utf8'));
 if(receipt.status!=='passed')throw new Error('Static composition review required');
 if(phase==='motion')for(const [name,range] of [['magma',[180,269]],['eruption',[270,359]]] as const){await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:path.join(job,`previews/${name}-motion.mp4`),codec:'h264',frameRange:[...range],scale:.5,concurrency:1,disallowParallelEncoding:true});}
 else{
  const started=performance.now();
  await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:path.join(job,'output/animation.mp4'),codec:'h264',pixelFormat:'yuv420p',crf:18,concurrency:1,disallowParallelEncoding:true,onProgress:({progress})=>{if(progress===1)console.log('Rendered 450 frames');}});
  const elapsedSeconds=Number(((performance.now()-started)/1000).toFixed(2));
  await writeFile(path.join(job,'render-report.json'),JSON.stringify({elapsedSeconds,timingScope:'450-frame render and H.264 encoding, excluding bundle/verification',frames:450,concurrency:1,humanVisualApproval:'pending'},null,2));
  await run(process.execPath,['--import','tsx','scripts/verify-storyboard.ts',job]);console.log(JSON.stringify({job,elapsedSeconds}));
 }
}
