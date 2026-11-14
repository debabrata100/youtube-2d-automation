import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {browserExecutable,run} from './lib';

const job=process.argv[2];
const milestone=path.basename(job??'').includes('m1-2-5-')?'M1.2.5':path.basename(job??'').includes('m1-2-4-')?'M1.2.4':'M1.2.3';
if(!job)throw new Error('Usage: tsx scripts/scene-order-sheet.ts <job-directory>');
if(!browserExecutable)throw new Error('A browser executable is required for numbered audit sheets');
const video=path.join(job,'output','animation.mp4');
const audit=path.join(job,'timeline-audit');
const seconds=path.join(audit,'seconds');
const transitions=path.join(audit,'transitions');
await mkdir(seconds,{recursive:true});await mkdir(transitions,{recursive:true});
await run('ffmpeg',['-loglevel','error','-y','-i',video,'-vf',"select='not(mod(n,30))',scale=270:480",'-fps_mode','passthrough',path.join(seconds,'sec-%02d.png')]);
const boundaryFrames=[89,90,91,179,180,181,299,300,301,389,390,391];
const select=boundaryFrames.map(frame=>`eq(n\\,${frame})`).join('+');
await run('ffmpeg',['-loglevel','error','-y','-i',video,'-vf',`select='${select}',scale=270:480`,'-fps_mode','passthrough',path.join(transitions,'transition-%02d.png')]);

const page=(title:string,items:Array<{src:string;label:string}>,columns:number)=>`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#070a25;color:#fff;font:700 20px system-ui;padding:24px}.title{height:44px;font-size:26px;letter-spacing:.04em}.grid{display:grid;grid-template-columns:repeat(${columns},270px);gap:12px}.item{position:relative;width:270px;height:480px;overflow:hidden;border:1px solid #33406e}.item img{width:270px;height:480px;display:block}.label{position:absolute;left:10px;top:10px;background:rgba(2,4,20,.82);border:1px solid #7de2e8;border-radius:7px;padding:5px 9px;color:#fff;text-shadow:0 2px 6px #000}</style></head><body><div class="title">${title}</div><div class="grid">${items.map(item=>`<div class="item"><img src="${item.src}"><div class="label">${item.label}</div></div>`).join('')}</div></body></html>`;
const secondItems=Array.from({length:15},(_,index)=>({src:`seconds/sec-${String(index+1).padStart(2,'0')}.png`,label:`${index}s · frame ${index*30}`}));
const transitionItems=boundaryFrames.map((frame,index)=>({src:`transitions/transition-${String(index+1).padStart(2,'0')}.png`,label:`frame ${frame} · ${(frame/30).toFixed(2)}s`}));
const secondsHtml=path.join(audit,'chronological.html');const transitionsHtml=path.join(audit,'transitions.html');
await writeFile(secondsHtml,page(`${milestone} chronological decode · 0–14 seconds`,secondItems,5));
await writeFile(transitionsHtml,page(`${milestone} transition decode · before / at / after`,transitionItems,4));
await run(browserExecutable,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--allow-file-access-from-files','--run-all-compositor-stages-before-draw',`--window-size=1446,1580`,`--screenshot=${path.join(job,'chronological-contact-sheet.png')}`,pathToFileURL(secondsHtml).href]);
await run(browserExecutable,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--allow-file-access-from-files','--run-all-compositor-stages-before-draw',`--window-size=1140,1580`,`--screenshot=${path.join(job,'transition-contact-sheet.png')}`,pathToFileURL(transitionsHtml).href]);
