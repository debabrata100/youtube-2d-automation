import path from 'node:path';
import {writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia} from '@remotion/renderer';
import {browserExecutable,makeJob,plan,run,probe} from './lib';

// Current-baseline review works on a fresh checkout without historical job outputs.
await run('npm',['run','typecheck']);
await run('npm',['test']);
const job=await makeJob();
const output=path.join(job,'output','animation.mp4');
const serveUrl=await bundle({entryPoint:path.join(process.cwd(),'src/index.ts'),publicDir:path.join(process.cwd(),'assets')});
const composition=(await getCompositions(serveUrl,{inputProps:{plan},browserExecutable})).find(c=>c.id==='PlanetFormation');
if(!composition)throw new Error('Composition missing');
const started=performance.now();
await renderMedia({composition,serveUrl,codec:'h264',pixelFormat:'yuv420p',outputLocation:output,inputProps:{plan},crf:18,browserExecutable,concurrency:1,disallowParallelEncoding:true});
const elapsedSeconds=Number(((performance.now()-started)/1000).toFixed(2));
await run('npx',['tsx','scripts/contact-sheet.ts',job]);
await run('npx',['tsx','scripts/scene-order-sheet.ts',job]);
await run('npx',['tsx','scripts/verify.ts',job]);
await writeFile(path.join(job,'render-report.json'),JSON.stringify({status:'complete',elapsedSeconds,timingScope:'full MP4 rendering and encoding only',output,inspection:await probe(output),humanVisualApproval:'pending'},null,2));
await writeFile(path.join(job,'visual-review-report.md'),[
 '# M1.2 illustrated animation baseline — new render',
 '',
 'The source baseline received human visual approval at M1.2 closeout. This newly rendered artifact still needs its own visual review; technical checks do not grant visual approval.',
 'Review approved Sun/planet identity, debris/disk depth, accretion contacts, the four boundaries, phone-size captions and final hold.',
 'See docs/M1_2_CLOSEOUT.md for the approved reference job, source-asset hashes, workflow and limitations.',
 'No historical outputs are required by this command. Use review:polish for staged comparisons when the M1.2.4 baseline is available locally.',
].join('\n'));
console.log('REVIEW_JOB='+job);
