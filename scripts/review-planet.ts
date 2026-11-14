import path from 'node:path';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia,renderStill} from '@remotion/renderer';
import {browserExecutable,latestJob,makeJob,plan,run,probe,readJson} from './lib';
import {auditPlanetAsset} from './planet-asset-audit';

const phase=process.argv[2]??'preview';
if(!['preview','final'].includes(phase))throw new Error('Use preview or final <job>');
await run('npm',['run','typecheck']);
await run('npm',['test']);
const job=phase==='preview'?await makeJob('m1-2-4'):path.resolve(process.argv[3]??'missing-job');
if(phase==='final'&&!process.argv[3])throw new Error('Final requires the reviewed preview job');
const baseline=await latestJob('planet-formation-m1-2-3-');
if(!baseline||!browserExecutable)throw new Error('Baseline and local Chrome required');
const asset=auditPlanetAsset();
const sunSha256=createHash('sha256').update(await readFile('assets/illustrations/star/sun-approved.png')).digest('hex');
const serveUrl=await bundle({entryPoint:path.join(process.cwd(),'src/index.ts'),publicDir:path.join(process.cwd(),'assets')});
const composition=(await getCompositions(serveUrl,{inputProps:{plan},browserExecutable})).find(c=>c.id==='PlanetFormation');
if(!composition)throw new Error('Composition missing');
const common={composition,serveUrl,inputProps:{plan},browserExecutable};
const sheet=async(title:string,items:Array<{label:string;src:string}>,columns:number,name:string)=>{
  const html='<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#070a25;color:white;font:700 20px system-ui}h1{font-size:25px;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat('+columns+',270px);gap:12px}img{width:270px;height:480px;display:block}.label{font-size:16px;height:48px;line-height:24px}</style><h1>'+title+'</h1><div class="grid">'+items.map(item=>'<div><div class="label">'+item.label+'</div><img src="'+item.src+'"></div>').join('')+'</div>';
  const htmlPath=path.join(job,name+'.html');
  await writeFile(htmlPath,html);
  await run(browserExecutable!,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--allow-file-access-from-files','--run-all-compositor-stages-before-draw','--window-size='+(48+columns*282)+','+(110+Math.ceil(items.length/columns)*540),'--screenshot='+path.join(job,name+'.png'),pathToFileURL(htmlPath).href]);
};
if(phase==='preview'){
  const frames=[210,240,270,300,330,360,420];
  for(const frame of frames){
    await renderStill({...common,frame,imageFormat:'png',output:path.join(job,'previews','second-'+frame/30+'.png')});
  }
  await sheet('M1.2.4 representative stills · seconds 7, 8, 9, 10, 11, 12, 14',frames.map(frame=>({label:frame/30+'s · frame '+frame,src:'previews/second-'+frame/30+'.png'})),7,'representative-contact-sheet');
  const preview=path.join(job,'previews','accretion-to-reveal.mp4');
  await renderMedia({...common,codec:'h264',pixelFormat:'yuv420p',outputLocation:preview,frameRange:[180,389],scale:.5,concurrency:1,disallowParallelEncoding:true});
  const framesAround=Array.from({length:9},(_,i)=>296+i);
  for(const frame of framesAround){
    await run('ffmpeg',['-loglevel','error','-y','-i',preview,'-vf',"select='eq(n,"+(frame-180)+")',scale=270:480",'-fps_mode','passthrough','-frames:v','1','-update','1',path.join(job,'previews','handoff-'+frame+'.png')]);
  }
  await sheet('M1.2.4 encoded consecutive frames · 296–304',framesAround.map(frame=>({label:'frame '+frame+' · '+(frame/30).toFixed(3)+'s',src:'previews/handoff-'+frame+'.png'})),5,'hero-handoff-contact-sheet');
  await writeFile(path.join(job,'preview-report.json'),JSON.stringify({phase,job,baseline,asset,sunSha256,preview,framesAround,humanVisualApproval:'pending'},null,2));
  console.log('PREVIEW_JOB='+job);
}else{
  await readFile(path.join(job,'preview-report.json')); // Require the preview first.
  const output=path.join(job,'output','animation.mp4');
  const started=performance.now();
  await renderMedia({...common,codec:'h264',pixelFormat:'yuv420p',outputLocation:output,crf:18,concurrency:1,disallowParallelEncoding:true});
  const elapsedSeconds=Number(((performance.now()-started)/1000).toFixed(2));
  await writeFile(path.join(job,'render-report.json'),JSON.stringify({status:'rendered',elapsedSeconds,timingScope:'full rendering and encoding only',output,baseline,humanVisualApproval:'pending'},null,2));
  await run('npx',['tsx','scripts/contact-sheet.ts',job]);
  await run('npx',['tsx','scripts/scene-order-sheet.ts',job]);
  await run('npx',['tsx','scripts/verify.ts',job]);
  const comparisons=[];
  for(const [name,frame] of [['growing body',240],['hero reveal',330],['final composition',420]] as const){
    for(const [label,source] of [['before',baseline],['after',job]]){
      const filename='comparison-'+frame+'-'+label+'.png';
      await run('ffmpeg',['-loglevel','error','-y','-i',path.join(source,'output','animation.mp4'),'-vf',"select='eq(n,"+frame+")',scale=270:480",'-fps_mode','passthrough','-frames:v','1','-update','1',path.join(job,'previews',filename)]);
      comparisons.push({label:name+' · '+frame/30+'s<br>'+label,src:'previews/'+filename});
    }
  }
  await sheet('M1.2.3 before / M1.2.4 approved planet after',comparisons,6,'before-after-planet-comparison');
  const verification=await readJson(path.join(job,'verification-report.json'));
  verification.approvedPlanetAsset=asset;
  verification.approvedSunSha256=sunSha256;
  verification.sourcePlanetUnmodified=asset.sha256==='9ca412dbfbf32c8dfbdd83552e9d64e7983fa47fece5ba899bd670890efa11b6';
  verification.approvedSunUnmodified=sunSha256==='d7fbf21f09cf0e55283ffc25b9e2c737f6b7a05c406746da0b8bcd8f617c7511';
  await writeFile(path.join(job,'verification-report.json'),JSON.stringify(verification,null,2));
  const previous=await readJson(path.join(baseline,'render-report.json'));
  await writeFile(path.join(job,'render-report.json'),JSON.stringify({status:'complete',elapsedSeconds,timingScope:'full rendering and encoding only; excludes bundling, previews, extraction and verification',baselineRenderSeconds:previous.elapsedSeconds,changePercent:Number(((elapsedSeconds/previous.elapsedSeconds-1)*100).toFixed(1)),output,baseline,inspection:await probe(output),humanVisualApproval:'pending'},null,2));
  await writeFile(path.join(job,'visual-review-report.md'),[
    '# M1.2.4 approved rocky planet integration','',
    '- Approved 1254 × 1254 RGBA artwork is unchanged. Alpha>8 visual bounds: x140–1110, y129–1124; faint near-transparent source pixels also exist outside these bounds and are retained.',
    '- Existing component API, semantic layers, frame-based determinism, camera choreography, scene plan and durations remain compatible.',
    '- An irregular procedural substrate is retained at early accretion. A soft radial mask gradually exposes the same stationary approved texture under that silhouette. The substrate fades away within the same body; there are never two separately positioned or scaled planetary objects.',
    '- The mask grows beyond the visible source edges before it is removed at complete formation. Impact contacts follow the growing silhouette envelope.',
    '- No rotation of the PNG; upper-left lighting and geological landmarks stay fixed. Subtle 0.3% peak-to-peak breathing, warm rim and glow modulation supplement existing camera/particle motion.',
    '- Incoming hero scale now matches the outgoing body screen radius at frame 300, then eases to full size over 34 frames. No scene durations were changed.',
    '- Approved Sun source and component remain unchanged.',
    '- Representative stills: 7, 8, 9, 10, 11, 12, 14 seconds. Short encoded preview: 6–13 seconds. Consecutive handoff frames: 296–304.',
    '- Baseline: '+baseline,
    '- Full MP4 rendering and encoding: '+elapsedSeconds+' seconds; baseline '+previous.elapsedSeconds+' seconds ('+((elapsedSeconds/previous.elapsedSeconds-1)*100).toFixed(1)+'%).','',
    '## Limitations',
    'The flattened PNG cannot rotate its surface independently of baked shading. The controlled hybrid reveal is illustrative accretion, not geological simulation. The early warm substrate cannot show the final terrain until the mask reaches it. There is no expensive distortion or new physical simulation.',
    'Native artwork is 1254 × 1254; the opaque disk is roughly 970 × 996 pixels. The source is slightly elliptical, which is preserved without stretching. Tiny semi-transparent source edge flecks remain; they are not edited away.',
    'Future assets should separate albedo/geology, silhouette, directional shading, rim and molten features with aligned pivots. Human review should check early-body material continuity, hero pacing, and small final-composition legibility.','',
    '## Approval',
    'Automated checks do not certify visual taste. Human visual approval pending. M1.2 remains open; no commit, push, tag or M2 work.',
  ].join('\n'));
  console.log('REVIEW_JOB='+job);
}
