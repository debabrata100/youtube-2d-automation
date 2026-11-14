import path from 'node:path';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia,renderStill} from '@remotion/renderer';
import {browserExecutable,latestJob,makeJob,plan,run,probe} from './lib';

await run('npm',['run','typecheck']);
await run('npm',['test']);
const job=await makeJob('m1-2-3');
const baseline=await latestJob('planet-formation-m1-2-2-');
if(!baseline)throw new Error('M1.2.2 comparison baseline missing');
const serveUrl=await bundle({entryPoint:path.join(process.cwd(),'src/index.ts'),publicDir:path.join(process.cwd(),'assets')});
const composition=(await getCompositions(serveUrl,{inputProps:{plan},browserExecutable})).find(c=>c.id==='PlanetFormation');
if(!composition)throw new Error('Composition missing');
const common={composition,serveUrl,inputProps:{plan},browserExecutable};
for(const [name,frame] of [['opening',30],['disk',135],['finale',420]] as const){
  await renderStill({...common,frame,imageFormat:'png',output:path.join(job,'previews',name+'.png')});
}
await renderMedia({...common,codec:'h264',pixelFormat:'yuv420p',outputLocation:path.join(job,'previews','sun-motion.mp4'),frameRange:[390,449],scale:.5,concurrency:1,disallowParallelEncoding:true});
const output=path.join(job,'output','animation.mp4');
const started=performance.now();
await renderMedia({...common,codec:'h264',pixelFormat:'yuv420p',outputLocation:output,crf:18,concurrency:1,disallowParallelEncoding:true});
const elapsedSeconds=Number(((performance.now()-started)/1000).toFixed(2));
await writeFile(path.join(job,'render-report.json'),JSON.stringify({status:'rendered',elapsedSeconds,timingScope:'full MP4 rendering and encoding only; excludes bundle, previews and verification',output,baseline,humanVisualApproval:'pending'},null,2));
await run('npx',['tsx','scripts/contact-sheet.ts',job]);
await run('npx',['tsx','scripts/scene-order-sheet.ts',job]);
await run('npx',['tsx','scripts/verify.ts',job]);

const comparisons=[];
for(const [name,frame] of [['opening',30],['disk',135],['finale',420]] as const){
  for(const [label,source] of [['before',baseline],['after',job]]){
    const filename=name+'-'+label+'.png';
    await run('ffmpeg',['-loglevel','error','-y','-i',path.join(source,'output','animation.mp4'),'-vf',"select='eq(n,"+frame+")',scale=270:480",'-fps_mode','passthrough','-frames:v','1','-update','1',path.join(job,'previews',filename)]);
    comparisons.push({name,frame,label,filename});
  }
}
const html='<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#070a25;color:white;font:700 20px system-ui}h1{font-size:26px;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(6,270px);gap:12px}img{width:270px;height:480px}.label{font-size:16px;height:60px;line-height:24px}</style><h1>Approved Sun integration · M1.2.2 before / M1.2.3 after</h1><div class="grid">'+comparisons.map(item=>'<div><div class="label">'+item.name+' · frame '+item.frame+'<br>'+item.label+'</div><img src="previews/'+item.filename+'"></div>').join('')+'</div>';
const htmlPath=path.join(job,'sun-comparison.html');
await writeFile(htmlPath,html);
if(!browserExecutable)throw new Error('Browser required for comparison sheet');
await run(browserExecutable,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--allow-file-access-from-files','--run-all-compositor-stages-before-draw','--window-size=1740,670','--screenshot='+path.join(job,'before-after-sun-comparison.png'),pathToFileURL(htmlPath).href]);
await writeFile(path.join(job,'visual-review-report.md'),[
'# M1.2.3 approved Sun integration',
'',
'- Original approved PNG copied byte-for-byte into assets/illustrations/star/sun-approved.png; alpha preserved.',
'- Reusable IllustratedStar now renders the PNG through Remotion Img inside the semantic SVG system.',
'- Gentle breathing: 0.992–1.008 scale (1.6% peak-to-peak); no whole-image rotation or hue/saturation grading.',
'- Frame-based glow and faint masked corona echo use smooth sine functions. The photosphere image itself remains unfiltered.',
'- Finale resumes frame-driven Sun motion; old procedural SVG paint workaround is no longer needed.',
'- Planet, disk, accretion, cameras, scene plan and durations were preserved.',
'- Comparison source: '+baseline,
'- Actual full-render and encoding time: '+elapsedSeconds+' seconds. This excludes bundling, previews and verification.',
'',
'## Known limitations and future layered asset',
'The 1254 × 1254 PNG flattens photosphere, limb and corona. A faint independently translated/scaled outer-mask echo suggests motion without distorting the approved surface. It is not real surface advection or separately articulated prominences.',
'For richer future animation, commission aligned transparent layers: photosphere base, convection/highlight map, near/far corona and individual prominence elements, all sharing one pivot and light direction. No new rays or ribbons were drawn.',
'The Sun has substantially more texture than the unchanged vector planet. Review that style contrast, the small finale Sun, and disk occlusion on a phone.',
'',
'## Approval',
'Human visual approval pending. M1.2 remains open; no commit, push, tag or M2 work.',
].join('\n'));
await writeFile(path.join(job,'render-report.json'),JSON.stringify({status:'complete',elapsedSeconds,timingScope:'full MP4 rendering and encoding only; excludes bundle, previews and verification',output,baseline,inspection:await probe(output),humanVisualApproval:'pending'},null,2));
console.log('REVIEW_JOB='+job);
