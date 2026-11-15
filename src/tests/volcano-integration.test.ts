import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import boardInput from '../../storyboards/volcano.json';
import demo from '../../storyboards/generic-demo.json';
import {parseStoryboard} from '../engine/storyboard/schema';
import {layerAssetIds} from '../engine/storyboard/layers';
import {storyboardDuration,storyboardSceneAt,storyboardTimeline} from '../engine/storyboard/timeline';
import {layerStateAt,trackAt,wipeRectAt,maskSequenceAt,crossfadeAt} from '../engine/motion/layers';
import {cameraPresetAt} from '../engine/camera/presets';
import {subjectEnvelope} from '../engine/motion/presets';
const board=parseStoryboard(boardInput), groups=board.groups!;
const internal=groups.find(g=>g.id==='internal')!,active=groups.find(g=>g.id==='active')!;
describe('registered volcano production integration',()=>{
 it('uses every existing template once and validates real registered files',()=>{
  expect(new Set(board.scenes.map(s=>s.template)).size).toBe(5);
  for(const asset of board.assets){const file='assets/'+asset.path;expect(existsSync(file)).toBe(true);const png=readFileSync(file);expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([asset.width,asset.height]);}
  for(const g of groups)for(const l of g.layers)for(const id of layerAssetIds(l))expect(board.assets.some(a=>a.id===id)).toBe(true);
 });
 it('maps all 450 frames in chronological order without gaps',()=>{
  expect(storyboardDuration(board)).toBe(450);expect(storyboardTimeline(board).map(s=>s.startFrame)).toEqual([0,90,180,270,360]);
  for(let f=0;f<450;f++)expect(storyboardSceneAt(board,f).scene.id).toBe(board.scenes[Math.floor(f/90)].id);
  expect(()=>storyboardSceneAt(board,450)).toThrow();
 });
 it('keeps foreground rock after registered molten layers and fixed crater masks after plume motion',()=>{
  expect(internal.layers.map(l=>l.id)).toEqual(['cavity','chamber','conduit','rock']);
  expect(active.layers.map(l=>l.id)).toEqual(['shadow','exterior','lava','plume','ash']);
  expect(active.layers.find(l=>l.id==='plume')!.masks).toEqual([{asset:'rim',mode:'inverse-alpha'}]);
  for(const id of ['chamber','conduit','rock'])expect(board.assets.find(a=>a.id===id)).toMatchObject({width:1254,height:1254});
 });
 it('preserves chamber geometry and continuous conduit registration',()=>{
  const chamber=internal.layers.find(l=>l.id==='chamber')!,conduit=internal.layers.find(l=>l.id==='conduit')!;
  for(let f=0;f<180;f++){expect(layerStateAt(chamber,f).scale).toBe(1);expect(layerStateAt(conduit,f).x).toBe(0);expect(layerStateAt(conduit,f).y).toBe(0);expect(layerStateAt(chamber,f).brightness).toBe(layerStateAt(conduit,f).brightness);}
  const receipt=JSON.parse(readFileSync('assets/illustrations/volcano/batch-b/fitted-v1/alpha-coverage-report.json','utf8'));
  expect(receipt.after.chamber.coveragePercent).toBe(100);
  expect(receipt.after.conduit.coveragePercent).toBe(100);
  expect(receipt.continuity.junctionMissingPixels).toBe(0);
  expect(receipt.continuity.maxColorDifferenceAtOverlap).toBe(0);
 });
 it('reveals magma progressively upward rather than fading the full conduit',()=>{
  const reveal=internal.layers.find(l=>l.id==='conduit')!.reveal!;if(reveal.type!=='wipe')throw new Error('Directional mask missing');
  expect(reveal.direction).toBe('up');let previous=Infinity;
  for(let f=90;f<=179;f++){const rect=wipeRectAt(reveal,f);expect(rect.y).toBeLessThanOrEqual(previous);previous=rect.y;}
  expect(trackAt(90,reveal.progress,0)).toBe(0);expect(trackAt(179,reveal.progress,0)).toBe(1);
 });
 it('reveals lava along connected terrain paths with nested masks',()=>{
  const reveal=active.layers.find(l=>l.id==='lava')!.reveal!;if(reveal.type!=='mask-sequence')throw new Error('Path masks missing');
  const receipt=JSON.parse(readFileSync('assets/illustrations/volcano/animation-masks-v1/report.json','utf8'));
  expect(receipt.coverage).toBe(1);expect(reveal.keys).toHaveLength(21);
  expect(maskSequenceAt(reveal.keys,0).previous).toBe('lava-mask-0');expect(maskSequenceAt(reveal.keys,89).previous).toBe('lava-mask-20');
  const mid=maskSequenceAt(reveal.keys,9);expect(mid.previous).toBe('lava-mask-0');expect(mid.mix).toBeCloseTo(1/3);
 });
 it('uses actually nested PNG alpha masks, with empty start and complete finish',()=>{
  let previous:Buffer|undefined;
  for(let step=0;step<=20;step++){
   const alpha=execFileSync('ffmpeg',['-v','error','-i',`assets/illustrations/volcano/animation-masks-v1/lava-reveal-${String(step).padStart(2,'0')}.png`,'-vf','alphaextract','-f','rawvideo','-pix_fmt','gray','pipe:1'],{maxBuffer:1254*1254+1024});
   let decreases=0;for(let i=0;i<alpha.length;i++)if(previous&&alpha[i]<previous[i])decreases++;
   expect(decreases).toBe(0);if(step===0)expect(alpha.every(v=>v===0)).toBe(true);if(step===20)expect(alpha.every(v=>v===255)).toBe(true);previous=alpha;
  }
 });
 it('preserves approved source and fitted material hashes',()=>{
  const c=JSON.parse(readFileSync('assets/illustrations/volcano/batch-c/fitted-v1/alignment-report.json','utf8'));
  const b=JSON.parse(readFileSync('assets/illustrations/volcano/batch-b/fitted-v1/alpha-coverage-report.json','utf8'));
  const expected:Record<string,string>={...c.protectedHashes};
  for(const [name,hash] of Object.entries(c.outputHashes))if(name.endsWith('.png'))expected['assets/illustrations/volcano/batch-c/fitted-v1/'+name]=hash as string;
  for(const [name,hash] of Object.entries(b.outputHashes))if(name.endsWith('.png'))expected['assets/illustrations/volcano/batch-b/fitted-v1/'+name]=hash as string;
  for(const [file,hash] of Object.entries(expected))if(file.endsWith('.png')&&!file.endsWith('/young-star-painted-v1.png'))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
 });
 it('keeps the plume vent fixed under uniform growth and does not rotate it',()=>{
  const plume=active.layers.find(l=>l.id==='plume')!;expect(plume.anchor).toEqual({x:640,y:334});
  for(let f=0;f<180;f++){const state=layerStateAt(plume,f);expect(640+(640-640)*state.scale+state.x).toBe(640);expect(334+(334-334)*state.scale+state.y).toBe(334);}
 });
 it('matches camera endpoints and preserves final caption through frame 449',()=>{
  for(let i=1;i<5;i++)expect(cameraPresetAt(board.scenes[i-1].camera,89,90,1080,1920)).toEqual(cameraPresetAt(board.scenes[i].camera,0,90,1080,1920));
  expect(board.scenes[4].caption.hold).toBe(true);expect(crossfadeAt(89,90,8,false,true)).toBe(1);
  for(let f=0;f<8;f++)expect(crossfadeAt(90+f,90,8,true,false)+crossfadeAt(f,90,8,false,false)).toBeCloseTo(1);
 });
 it('has deterministic frame calculations independent of evaluation order',()=>{
  for(const layer of [...internal.layers,...active.layers])for(const f of [0,29,60,89,120,179]){const a=layerStateAt(layer,f);layerStateAt(layer,179-f);expect(layerStateAt(layer,f)).toEqual(a);}
 });
 it('rejects missing references, unordered keys, camera half-endpoints and unknown controls',()=>{
  const missing=structuredClone(boardInput);missing.groups[0].layers[0].asset='missing';expect(()=>parseStoryboard(missing)).toThrow();
  const unordered=structuredClone(boardInput);unordered.groups[2].layers[1].opacity=[{frame:9,value:0},{frame:0,value:1}];expect(()=>parseStoryboard(unordered)).toThrow();
  const bad=structuredClone(boardInput) as any;delete bad.scenes[0].camera.to;expect(()=>parseStoryboard(bad)).toThrow();
  bad.scenes[0].config.volcanoSpecial=true;expect(()=>parseStoryboard(bad)).toThrow();
 });
 it('retains opt-in compatibility with the M2.1 storyboard and envelope',()=>{
  const old=parseStoryboard(demo);expect(old.groups).toBeUndefined();expect(old.backdrop).toBeUndefined();expect(old.crossfadeFrames).toBeUndefined();
  expect(subjectEnvelope(0,60,6)).toBe(0);expect(subjectEnvelope(59,60,6)).toBe(0);
  expect(storyboardDuration(old)).toBe(300);
 });
});
