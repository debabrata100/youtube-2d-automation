import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises'; import path from 'node:path'; import rawPlan from '../src/plans/planet-formation.json' with {type:'json'}; import {parseScenePlan} from '../src/schemas/scene-plan';
export {browserExecutable,run,capture,probe} from './media-tools';
export const root=process.cwd(); export const plan=parseScenePlan(rawPlan);
export const makeJob=async(milestone='m1-2-5')=>{const stamp=new Date().toISOString().replace(/[:.]/g,'-'); const dir=path.join(root,'jobs',`planet-formation-${milestone}-${stamp}`); await mkdir(path.join(dir,'output'),{recursive:true}); await mkdir(path.join(dir,'previews'),{recursive:true}); await writeFile(path.join(dir,'scene-plan.json'),JSON.stringify(plan,null,2)); return dir;};
export const latestJob=async(prefix:string)=>{const entries=await readdir(path.join(root,'jobs'),{withFileTypes:true});const matches=entries.filter(entry=>entry.isDirectory()&&entry.name.startsWith(prefix)).map(entry=>entry.name).sort();return matches.length?path.join(root,'jobs',matches.at(-1)!):null;};
export const readJson=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
