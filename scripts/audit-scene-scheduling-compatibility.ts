/** Lossless regression against the preceding source snapshot, with narration absent. */
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderStill} from '@remotion/renderer';
import {browserExecutable} from './media-tools';
const job=path.resolve(process.argv[2]??''),baseline=process.argv[3]??'1936889dfb60df8adfde5b9bc040f771b57875f1';if(!process.argv[2]||!/^[a-f0-9]{7,40}$/.test(baseline))throw Error('Usage: audit-scene-scheduling-compatibility <job> [baseline-sha]');
const dir=path.join(job,'compatibility'),source=path.join(dir,'baseline-source');await mkdir(source,{recursive:true});execFileSync('tar',['-x','-C',source],{input:execFileSync('git',['archive',baseline,'src','storyboards'])});
const browser=await openBrowser('chrome',{browserExecutable}),samples=[];
try{
 for(const [entry,id,boardFile,frames] of [
  ['src/storyboard-index.ts','GenericStoryboard','storyboards/generic-demo.json',[29,89,149,209,239,240,269]],
  ['src/index.ts','PlanetFormation','',[0,225,420]],
  ['src/storyboard-index.ts','GenericStoryboard','storyboards/volcano.json',[0,125,220,315,449]],
  ['src/storyboard-index.ts','GenericStoryboard','storyboards/volcano-m2-2-1.json',[0,125,220,315,449]],
 ] as const){
  const label=boardFile?path.basename(boardFile,'.json'):'planet',versions:string[][]=[];
  for(const [name,root] of [['before',source],['after',process.cwd()]] as const){
   const inputProps=boardFile?{storyboard:JSON.parse(await readFile(path.join(root,boardFile),'utf8'))}:{};
   const serveUrl=await bundle({entryPoint:path.join(root,entry),publicDir:path.resolve('assets')}),composition=(await getCompositions(serveUrl,{inputProps,puppeteerInstance:browser})).find(c=>c.id===id)!;
   const files=[];for(const frame of frames){const file=path.join(dir,`${label}-${name}-${frame}.png`);await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame,output:file});files.push(file);}versions.push(files);
  }
  for(const [i,frame] of frames.entries())samples.push({label,frame,identical:(await readFile(versions[0][i])).equals(await readFile(versions[1][i]))});
 }
}finally{await browser.close({silent:true});}
const report={baseline,samples,allLosslessSamplesIdentical:samples.every(s=>s.identical),note:'Opt-in timing plans and banner change do not alter existing narration-free compositions. No encoded MP4 byte-identity guarantee.'};await writeFile(path.join(job,'reports/compatibility-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.allLosslessSamplesIdentical)process.exitCode=1;
