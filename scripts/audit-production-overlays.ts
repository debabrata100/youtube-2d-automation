/** Encoded-frame proof that production omits the debug strip, plus ending motion. */
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderStill} from '@remotion/renderer';
import {narrationOverlaySchema} from '../src/captions/schema';
import {parseStoryboard} from '../src/engine/storyboard/schema';
import {browserExecutable} from './media-tools';
const job=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: audit-production-overlays <job>');
const storyboard=parseStoryboard(JSON.parse(await readFile(path.join(job,'storyboard.json'),'utf8'))),narration=narrationOverlaySchema.parse(JSON.parse(await readFile(path.join(job,'narration-props.json'),'utf8')));
if(narration.showAiDisclosureBanner)throw Error('Expected production banner disabled');
const dir=path.join(job,'production-overlay-audit');await mkdir(dir,{recursive:true});const serveUrl=await bundle({entryPoint:path.resolve('src/storyboard-index.ts'),publicDir:path.join(job,'public')});
for(const show of [false,true]){const inputProps={storyboard,narration:{...narration,showAiDisclosureBanner:show}},composition=(await getCompositions(serveUrl,{inputProps,browserExecutable})).find(c=>c.id==='GenericStoryboard')!;await renderStill({serveUrl,composition,inputProps,browserExecutable,frame:30,output:path.join(dir,show?'debug-banner.png':'production.png')});}
const crop=(file:string,filter:string,frame?:number)=>execFileSync('ffmpeg',['-v','error','-i',file,'-vf',(frame!==undefined?`select=eq(n\\,${frame}),`:'')+filter,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:8*1024*1024});
const video=path.join(job,'output/narrated-animation.mp4'),band='crop=840:60:80:15',off=crop(path.join(dir,'production.png'),band),on=crop(path.join(dir,'debug-banner.png'),band),encoded=crop(video,band,30);
const mse=(a:Buffer,b:Buffer)=>{if(a.length!==b.length)throw Error('Crop dimension mismatch');let sum=0;for(let i=0;i<a.length;i++)sum+=(a[i]-b[i])**2;return sum/a.length;};
const offError=mse(encoded,off),onError=mse(encoded,on),outsideOff=crop(path.join(dir,'production.png'),'crop=1080:1800:0:120'),outsideOn=crop(path.join(dir,'debug-banner.png'),'crop=1080:1800:0:120');
const endingA=crop(video,'scale=270:480',420),endingB=crop(video,'scale=270:480',449);
const report={checks:{productionFlagDisabled:!narration.showAiDisclosureBanner,encodedBannerBandMatchesOff:offError<onError*.1,debugToggleChangesOnlyBannerRegion:outsideOff.equals(outsideOn),endingRemainsVisuallyActive:!endingA.equals(endingB)},encodedBandMSEtoProduction:offError,encodedBandMSEtoDebug:onError,endingFrameDifferenceMSE:mse(endingA,endingB),note:'Production/debug reference stills differ only in the banner flag. Encoded frame 30 is compared against both; source gating applies to all frames. Final samples 420/449 verify the ending is not frozen. Visual readability/label spacing also needs contact-sheet review.'};
await writeFile(path.join(job,'reports/production-overlay-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!Object.values(report.checks).every(Boolean))process.exitCode=1;
