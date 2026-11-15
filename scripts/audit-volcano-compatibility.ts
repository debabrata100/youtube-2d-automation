import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderStill} from '@remotion/renderer';
import {browserExecutable} from './media-tools';
const job=path.resolve(process.argv[2]);const dir=path.join(job,'compatibility');await mkdir(dir,{recursive:true});
const sha=async(file:string)=>createHash('sha256').update(await readFile(file)).digest('hex');
const fitted=JSON.parse(await readFile('assets/illustrations/volcano/batch-c/fitted-v1/alignment-report.json','utf8'));
const baseline=JSON.parse(await readFile('docs/M1_2_FINAL_VERIFICATION.json','utf8'));
const preserved=[];
for(const [file,expected] of Object.entries(fitted.protectedHashes) as [string,string][]){const actual=await sha(file);if(actual!==expected)throw new Error(`Changed protected source: ${file}`);preserved.push({file,sha256:actual});}
for(const a of baseline.approvedAssets){if(await sha(a.path)!==a.sha256)throw new Error(`Changed approved M1.2 asset ${a.path}`);}
const baselineSource=path.join(dir,'baseline-source');await mkdir(baselineSource,{recursive:true});
const archive=execFileSync('git',['archive','a1e84941967e5bd7ef875d91e2cb68fa540afe6c','src','storyboards']);execFileSync('tar',['-x','-C',baselineSource],{input:archive});
const browser=await openBrowser('chrome',{browserExecutable});const results=[];
try{
 for(const [entry,id,frames] of [['src/storyboard-index.ts','GenericStoryboard',[29,89,149,209,239,240,269]],['src/index.ts','PlanetFormation',[0,225,420]]] as const){
  const versions=[];
  for(const [name,root] of [['before',baselineSource],['after',process.cwd()]] as const){const url=await bundle({entryPoint:path.join(root,entry),publicDir:path.resolve('assets')});const c=(await getCompositions(url,{puppeteerInstance:browser})).find(c=>c.id===id)!;
   const images=[];for(const frame of frames){const file=path.join(dir,`${id}-${name}-${frame}.png`);await renderStill({serveUrl:url,composition:c,puppeteerInstance:browser,frame,output:file});images.push(file);}versions.push(images);
  }
  for(const [i,frame] of frames.entries())results.push({composition:id,frame,identical:(await readFile(versions[0][i])).equals(await readFile(versions[1][i]))});
 }
}finally{await browser.close({silent:true});}
const report={baselineCommit:'a1e84941967e5bd7ef875d91e2cb68fa540afe6c',preserved,samples:results,allLosslessSamplesIdentical:results.every(r=>r.identical),note:'Lossless same-frame comparison isolates engine compatibility. This does not assert byte-identical encoded MP4 reproducibility.'};
await writeFile(path.join(job,'compatibility-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({samples:results,allLosslessSamplesIdentical:report.allLosslessSamplesIdentical}));if(!report.allLosslessSamplesIdentical)process.exitCode=1;
