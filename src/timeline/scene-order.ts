import type {SceneConfig,ScenePlan} from '../schemas/scene-plan';

export const chronologicalScenes=(plan:ScenePlan):SceneConfig[]=>{
  for(let index=1;index<plan.scenes.length;index++)if(plan.scenes[index].startFrame<=plan.scenes[index-1].startFrame)throw new Error(`Scene order is not strictly chronological at ${plan.scenes[index].id}`);
  return [...plan.scenes];
};

export const sceneAtFrame=(plan:ScenePlan,frame:number):SceneConfig=>{
  if(!Number.isInteger(frame)||frame<0||frame>=plan.video.durationFrames)throw new Error(`Frame ${frame} is outside 0-${plan.video.durationFrames-1}`);
  const scene=chronologicalScenes(plan).find(item=>frame>=item.startFrame&&frame<item.startFrame+item.durationFrames);
  if(!scene)throw new Error(`No scene covers frame ${frame}`);
  return scene;
};

export const activeScenesAtFrame=(plan:ScenePlan,frame:number,overlapFrames:number):SceneConfig[]=>chronologicalScenes(plan).filter((scene,index)=>{
  const tail=index===plan.scenes.length-1?0:overlapFrames;
  return frame>=scene.startFrame&&frame<scene.startFrame+scene.durationFrames+tail;
});
