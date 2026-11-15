import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderStill} from '@remotion/renderer';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {browserExecutable} from './media-tools';
const [jobArg,boardArg,referenceArg]=process.argv.slice(2);if(!referenceArg)throw Error('Usage: check-story-visual-compatibility <job> <board.json> <lossless-reference-directory>');
const job=path.resolve(jobArg),reference=path.resolve(referenceArg),storyboard=parseStoryboard(JSON.parse(await readFile(boardArg,'utf8')));
const dir=path.join(job,'visual-only-compatibility');await mkdir(dir,{recursive:true});const url=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir:path.resolve('assets')});const browser=await openBrowser('chrome',{browserExecutable});const samples=[];
try{const composition=(await getCompositions(url,{inputProps:{storyboard},puppeteerInstance:browser})).find(c=>c.id==='GenericStoryboard')!;
 for(const frame of [0,125,220,315,449]){const output=path.join(dir,`frame-${frame}.png`);await renderStill({serveUrl:url,composition,inputProps:{storyboard},puppeteerInstance:browser,frame,output});samples.push({frame,identical:(await readFile(output)).equals(await readFile(path.join(reference,`frame-${frame}.png`)))});}
}finally{await browser.close({silent:true});}
const report={board:boardArg,reference,samples,allIdentical:samples.every(s=>s.identical),note:'Narration disabled; caption-enabled/narrated output intentionally differs.'};await writeFile(path.join(job,'reports/visual-only-compatibility-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.allIdentical)process.exitCode=1;
