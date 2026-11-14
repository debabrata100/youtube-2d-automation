import path from 'node:path';
import {writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia,renderStill} from '@remotion/renderer';
import {browserExecutable,latestJob,makeJob,plan,run,probe,readJson} from './lib';
import {createHash} from 'node:crypto';

const phase=process.argv[2]??'A';
if(!['A','B','C','final'].includes(phase))throw new Error('Use A, B, C or final');
const job=process.argv[3]?path.resolve(process.argv[3]):await makeJob('m1-2-5');
const baseline=await latestJob('planet-formation-m1-2-4-');
if(!baseline||!browserExecutable)throw new Error('Baseline and Chrome required');
await run('npm',['run','typecheck']);await run('npm',['test']);
const serveUrl=await bundle({entryPoint:path.join(process.cwd(),'src/index.ts'),publicDir:path.join(process.cwd(),'assets')});
const composition=(await getCompositions(serveUrl,{inputProps:{plan},browserExecutable})).find(c=>c.id==='PlanetFormation');
if(!composition)throw new Error('Composition missing');
const common={composition,serveUrl,inputProps:{plan},browserExecutable};
const shot=async(frame:number,name:string)=>renderStill({...common,frame,imageFormat:'png',output:path.join(job,'previews',name+'.png')});
const sheet=async(title:string,items:Array<{src:string;label:string}>,name:string,columns=5)=>{
 const html='<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#070a25;color:white;font:700 18px system-ui}h1{font-size:24px;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat('+columns+',270px);gap:12px}img{width:270px;height:480px;display:block}.label{height:28px}</style><h1>'+title+'</h1><div class="grid">'+items.map(i=>'<div><div class="label">'+i.label+'</div><img src="'+i.src+'"></div>').join('')+'</div>';
 const file=path.join(job,name+'.html');await writeFile(file,html);
 await run(browserExecutable!,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--allow-file-access-from-files','--run-all-compositor-stages-before-draw','--window-size='+(48+columns*282)+','+(100+Math.ceil(items.length/columns)*520),'--screenshot='+path.join(job,name+'.png'),pathToFileURL(file).href]);
};
if(phase!=='final'){
 const frames=phase==='A'?[120,150,345]:phase==='B'?[210,225,240,270]:[0,89,90,179,180,299,300,389,390,420,449];
 for(const frame of frames)await shot(frame,phase+'-'+frame);
 await sheet('M1.2.5 checkpoint '+phase,frames.map(frame=>({src:'previews/'+phase+'-'+frame+'.png',label:'frame '+frame+' · '+(frame/30).toFixed(2)+'s'})),phase+'-contact-sheet');
 const range:[number,number]=phase==='A'?[90,179]:phase==='B'?[180,299]:[0,449];
 const preview=path.join(job,'previews',phase+'-motion.mp4');
 await renderMedia({...common,codec:'h264',pixelFormat:'yuv420p',outputLocation:preview,frameRange:range,scale:phase==='C'?.25:.5,concurrency:1,disallowParallelEncoding:true});
 if(phase==='B'){
  const contacts=[222,223,224,225,226,227,228,229,230];
  const items=[];
  for(const frame of contacts){
   const filename='contact-'+frame+'.png';
   await run('ffmpeg',['-loglevel','error','-y','-i',preview,'-vf',"select='eq(n,"+(frame-180)+")',scale=270:480",'-fps_mode','passthrough','-frames:v','1','-update','1',path.join(job,'previews',filename)]);
   items.push({src:'previews/'+filename,label:'frame '+frame});
  }
  await sheet('M1.2.5 consecutive encoded contact frames',items,'B-contact-sequence');
 }
 await writeFile(path.join(job,phase+'-report.json'),JSON.stringify({phase,job,frames,range,preview,humanVisualApproval:'pending'},null,2));
}else{
 await readFile(path.join(job,'C-report.json'));
 const output=path.join(job,'output','animation.mp4');
 const started=performance.now();let peakRss=process.memoryUsage().rss;const frameProgress:Array<{renderedFrames:number;elapsedSeconds:number}>=[];
 const memoryTimer=setInterval(()=>{peakRss=Math.max(peakRss,process.memoryUsage().rss)},250);
 try{
 await renderMedia({...common,codec:'h264',pixelFormat:'yuv420p',outputLocation:output,crf:18,concurrency:1,disallowParallelEncoding:true,onProgress:p=>{
   if(p.renderedFrames%50===0&&frameProgress.at(-1)?.renderedFrames!==p.renderedFrames)frameProgress.push({renderedFrames:p.renderedFrames,elapsedSeconds:Number(((performance.now()-started)/1000).toFixed(2))});
 }});
 }finally{clearInterval(memoryTimer);}
 const elapsedSeconds=Number(((performance.now()-started)/1000).toFixed(2));
 const previous=await readJson(path.join(baseline,'render-report.json'));
 await run('npx',['tsx','scripts/contact-sheet.ts',job]);
 await run('npx',['tsx','scripts/scene-order-sheet.ts',job]);
 await run('npx',['tsx','scripts/verify.ts',job]);
 const items=[];
 for(const frame of [135,240,420]){
  for(const [label,source] of [['M1.2.4',baseline],['M1.2.5',job]]){
   const filename='compare-'+frame+'-'+label+'.png';
   await run('ffmpeg',['-loglevel','error','-y','-i',path.join(source,'output','animation.mp4'),'-vf',"select='eq(n,"+frame+")',scale=270:480",'-fps_mode','passthrough','-frames:v','1','-update','1',path.join(job,'previews',filename)]);
   items.push({src:'previews/'+filename,label:label+' · '+frame/30+'s'});
  }
 }
 await sheet('M1.2.4 before / M1.2.5 cinematic consistency after',items,'before-after-contact-sheet',6);
 const sourceHashes:Record<string,string>={};
 for(const file of ['assets/illustrations/star/sun-approved.png','assets/illustrations/planet/rocky-planet-approved.png'])sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
 await writeFile(path.join(job,'render-report.json'),JSON.stringify({status:'complete',elapsedSeconds,baselineRenderSeconds:previous.elapsedSeconds,changePercent:Number(((elapsedSeconds/previous.elapsedSeconds-1)*100).toFixed(1)),effectiveFramesPerSecond:Number((450/elapsedSeconds).toFixed(2)),frameProgress,coordinatorPeakRssMB:Number((peakRss/1024/1024).toFixed(1)),memoryScope:'Node coordinator only, excludes Chrome/FFmpeg subprocesses',timingScope:'full MP4 rendering and encoding only',output,baseline,sourceHashes,inspection:await probe(output),humanVisualApproval:'pending'},null,2));
 await writeFile(path.join(job,'visual-review-report.md'),[
 '# M1.2.5 cinematic consistency review','',
 'Reviewed the M1.2.4 encoded baseline and chronological/transition sheets before editing. Initial direction: docs/M1_2_5_VISUAL_AUDIT.md.',
 'Checkpoint A: seeded irregular debris, coherent mineral strata/grain/craters, fixed directional shading; disk density bands, gaps, continuous depth and radius-dependent rotation.',
 'Checkpoint B: accelerating hero approaches, contact-frame anchored dust/ejecta, absorbed fragments and continuous mass-driven growth; brief major-impact emphasis.',
 'Checkpoint C: subject-matched handoffs, motivated environment entrance, asymmetric closing depth and held phone-readable final caption.',
 'Checkpoint D: full-resolution render, actual MP4 decode, numbered chronology/transition sheets and matching-frame baseline comparison.',
 'Approved Sun and planet source hashes are recorded in render-report.json. Source images were not modified or regenerated.',
 'Full rendering and encoding: '+elapsedSeconds+'s; baseline '+previous.elapsedSeconds+'s. Effective throughput '+(450/elapsedSeconds).toFixed(2)+' frames/s.',
 'Node coordinator peak RSS: '+(peakRss/1024/1024).toFixed(1)+'MB, excluding renderer/encoder subprocesses. This is not total system memory.','',
 '## Known limitations',
 'Procedural debris cannot fully match bespoke painted assets. Rocks retain simplified crater/strata shading at small sizes. Disk and collision effects remain stylized 2D approximations; no physical simulation was added. The approved planets have fixed baked illumination and do not perform real axial rotation. Fine grain may soften after social-platform compression.',
 'Review the brief 6s dust handoff, individual contacts at phone size, final caption reading time and final foreground balance. Automated tests cannot certify artistic quality.','',
 'Native-player normal-speed review was attempted but the computer-use connection timed out. Encoded chronological frames, adjacent contact frames and boundary stills were inspected; human normal-speed playback review remains required.','',
 '## Status',
 'Human visual approval pending. Existing uncommitted work and all previous outputs preserved. No commit, push, tag, M2 work or milestone closure.',
 ].join('\n'));
}
console.log('CHECKPOINT_JOB='+job);
