import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import raw from '../../storyboards/volcano-m2-2-1.json';
import original from '../../storyboards/volcano.json';
import {parseStoryboard} from '../engine/storyboard/schema';
import {flowSchema,layerSchema,layerAssetIds} from '../engine/storyboard/layers';
import {flowPositionAt,layerStateAt,trackAt,wipeRectAt,maskSequenceAt,crossfadeAt} from '../engine/motion/layers';
import {cameraPresetAt} from '../engine/camera/presets';
import {storyboardDuration,storyboardSceneAt} from '../engine/storyboard/timeline';
const board=parseStoryboard(raw),groups=board.groups!,internal=groups.find(g=>g.id==='internal')!,active=groups.find(g=>g.id==='active')!,final=groups.find(g=>g.id==='complete-process')!;
const parsedFlow=flowSchema.parse({type:'directional',direction:'up',periodFrames:100,phase:0,opacity:.15,bandWidth:80,bounds:{x:0,y:300,width:1254,height:650}});
const upward=parsedFlow.type==='directional'?parsedFlow:(()=>{throw Error('Expected directional flow');})();
describe('generic cinematic flow controls',()=>{
 it.each(['up','down','left','right'] as const)('moves %s between wraps without moving source geometry',direction=>{
  const a=flowPositionAt({...upward,direction},10),b=flowPositionAt({...upward,direction},40);
  expect(Math.sign(b-a)).toBe(direction==='up'||direction==='left'?-1:1);
 });
 it('is frame-deterministic including negative phase-time and periodic wrap',()=>{
  for(const f of [-201,-1,0,5,101]){const value=flowPositionAt(upward,f);flowPositionAt(upward,700);expect(flowPositionAt(upward,f)).toBe(value);expect(flowPositionAt(upward,f+100)).toBeCloseTo(value);}
 });
 it('rejects high-frequency flashes, excessive overlay opacity and unsorted path masks',()=>{
  expect(()=>flowSchema.parse({...upward,periodFrames:1})).toThrow();expect(()=>flowSchema.parse({...upward,opacity:.9})).toThrow();
  expect(()=>flowSchema.parse({...upward,maskKeys:[{frame:5,asset:'a'},{frame:4,asset:'b'}]})).toThrow();
 });
 it('supports inverse spatial wipes without adding opacity fades',()=>{
  const front=layerSchema.parse({id:'front',asset:'a',reveal:{type:'wipe',direction:'down',bounds:{x:0,y:0,width:1254,height:1254},progress:[{frame:0,value:0},{frame:50,value:1}],invert:true,feather:12}});
  const r=front.reveal!;if(r.type!=='wipe')throw Error('Expected wipe');
  expect(r.invert).toBe(true);expect(wipeRectAt(r,0).height).toBe(0);expect(wipeRectAt(r,50).height).toBe(1254);expect(layerStateAt(front,25).opacity).toBe(1);
 });
 it('retains generic opt-in defaults for the previous production storyboard',()=>{
  const old=parseStoryboard(original);expect(old.backdrop?.motion).toBeUndefined();for(const g of old.groups!)for(const l of g.layers){expect(l.flow).toBeUndefined();expect(l.maskPadding).toBeUndefined();}
 });
});
describe('M2.2.1 cinematic storyboard',()=>{
 it('keeps five existing templates, timing and chronological mapping',()=>{
  expect(board.scenes).toHaveLength(5);expect(new Set(board.scenes.map(s=>s.template)).size).toBe(5);expect(storyboardDuration(board)).toBe(450);
  for(let f=0;f<450;f++)expect(storyboardSceneAt(board,f).scene.id).toBe(board.scenes[Math.floor(f/90)].id);
 });
 it('preserves the exact previous asset registrations and resolves added masks',()=>{
  for(const asset of original.assets)expect(board.assets.find(a=>a.id===asset.id)).toEqual(asset);
  for(const asset of board.assets)expect(existsSync('assets/'+asset.path)).toBe(true);
  for(const g of groups)for(const l of g.layers)for(const id of layerAssetIds(l))expect(board.assets.some(a=>a.id===id)).toBe(true);
 });
 it('widens then meaningfully pushes the opening while keeping all camera handoffs matched',()=>{
  expect(board.scenes[0].camera.from!.zoom).toBe(.94);expect(board.scenes[0].camera.to!.zoom).toBe(1.09);
  for(let i=1;i<5;i++)expect(cameraPresetAt(board.scenes[i-1].camera,89,90,1080,1920)).toEqual(cameraPresetAt(board.scenes[i].camera,0,90,1080,1920));
 });
 it('keeps the parallax background covering the entire screen at all frames',()=>{
  const m=board.backdrop!.motion!;for(let f=0;f<450;f++){const scale=trackAt(f,m.scale,1);expect(Math.abs(trackAt(f,m.x,0))).toBeLessThanOrEqual(1080*(scale-1)/2);expect(Math.abs(trackAt(f,m.y,0))).toBeLessThanOrEqual(1920*(scale-1)/2);}
 });
 it('uses complementary registered cutaway fronts with an opaque cavity and no whole-layer fade',()=>{
  const surface=groups.find(g=>g.id==='surface-dissolve')!.layers.find(l=>l.id==='exterior')!;
  const rock=internal.layers.find(l=>l.id==='rock')!,cavity=internal.layers.find(l=>l.id==='cavity')!;
  expect(surface.reveal?.type).toBe('wipe');expect(rock.reveal?.type).toBe('wipe');
  if(surface.reveal?.type!=='wipe'||rock.reveal?.type!=='wipe')throw Error();
  expect(surface.reveal.invert).toBe(true);expect(surface.reveal.progress).toEqual(rock.reveal.progress);
  // Opaque interior underlaps the entire feather of the surface wipe.
  expect(rock.reveal.feather).toBe(0);expect(rock.reveal.bounds.height).toBe(surface.reveal.bounds.height+2*surface.reveal.feather!);
  expect(cavity.reveal).toEqual(rock.reveal);
  for(const l of [surface,rock,cavity]){expect(l.opacity).toBeUndefined();expect(l.x).toBeUndefined();expect(l.scale).toBeUndefined();}
 });
 it('moves a clipped highlight upward while keeping conduit registration fixed',()=>{
  const conduit=internal.layers.find(l=>l.id==='conduit')!;expect(conduit.flow?.type).toBe('directional');expect(conduit.flow?.type==='directional'&&conduit.flow.direction).toBe('up');
  for(let f=0;f<180;f++){expect(layerStateAt(conduit,f)).toMatchObject({x:0,y:0,scale:1});}
  const r=conduit.reveal!;if(r.type!=='wipe')throw Error();expect(wipeRectAt(r,169).height).toBeGreaterThan(wipeRectAt(r,110).height);
 });
 it('delays downhill lava until the eruption buildup and follows ordered path bands',()=>{
  const lava=active.layers.find(l=>l.id==='lava')!;expect(lava.flow?.type).toBe('path');if(lava.flow?.type!=='path')throw Error();
  if(lava.reveal?.type!=='mask-sequence')throw Error();expect(lava.reveal.keys[0].frame).toBe(23);expect(lava.flow.maskKeys).toHaveLength(34);
  for(const f of [30,45,60,75]){const next=maskSequenceAt(lava.flow.maskKeys!,f);expect(next.previous).toMatch(/^flow-band-/);}
  expect(lava.x).toBeUndefined();expect(lava.scale).toBeUndefined();
 });
 it('grows the plume uniformly around a fixed vent with enough mask headroom',()=>{
  const plume=active.layers.find(l=>l.id==='plume')!;expect(plume.anchor).toEqual({x:640,y:334});expect(plume.maskPadding).toBe(320);expect(plume.masks).toEqual([{asset:'rim',mode:'inverse-alpha'}]);
  for(let f=0;f<180;f++){const s=layerStateAt(plume,f);expect(s.x).toBe(0);expect(s.y).toBe(0);expect(334+(61-334)*s.scale).toBeGreaterThan(-plume.maskPadding!);}
  expect(layerStateAt(plume,35).scale).toBeGreaterThan(layerStateAt(plume,10).scale*2);
 });
 it('keeps visible plume and geological bounds inside the screen and below captions',()=>{
  for(let f=270;f<450;f++){const scene=board.scenes[Math.floor(f/90)],local=f%90,groupFrame=local+(f>=360?90:0),p=layerStateAt(active.layers.find(l=>l.id==='plume')!,groupFrame);const c=cameraPresetAt(scene.camera,local,90,1080,1920);const factor=972/1254;
   const screen=(y:number)=>(1920*.585-486+y*factor-c.focus.y)*c.zoom+960;
   expect(screen(334+(61-334)*p.scale)).toBeGreaterThan(340);expect(screen(1203)).toBeLessThan(1700);
  }
 });
 it('connects the final underground and surface layers with a persistent caption and continued drift',()=>{
  expect(final.layers.map(l=>l.asset)).toEqual(['cavity','chamber','conduit','rock','exterior','lava','plume','ash']);
  expect(board.scenes[4].caption.hold).toBe(true);expect(board.scenes[4].caption.text).toBe('Magma feeds\nthe eruption');expect(crossfadeAt(89,90,8,false,true)).toBe(1);
  const ash=final.layers.find(l=>l.id==='ash')!;expect(layerStateAt(ash,179).y).toBeLessThan(layerStateAt(ash,160).y);
 });
 it('preserves the preceding encoded M2.2 output when available',()=>{
  const file='jobs/volcano-m2-2-2026-11-14T13-56-49-609Z/output/animation.mp4';if(existsSync(file))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe('d28a1afa2e950a2c99aa0d219267b838267abbf21548070fb0461e4bf859fd6a');
 });
});
