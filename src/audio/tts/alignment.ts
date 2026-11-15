import {z} from 'zod';
export const characterAlignmentSchema=z.object({characters:z.array(z.string()),character_start_times_seconds:z.array(z.number().finite().nonnegative()),character_end_times_seconds:z.array(z.number().finite().nonnegative())}).strict().superRefine((a,ctx)=>{
 if(!a.characters.length||a.characters.length!==a.character_start_times_seconds.length||a.characters.length!==a.character_end_times_seconds.length||a.characters.some((_,i)=>a.character_end_times_seconds[i]<a.character_start_times_seconds[i]||(i>0&&a.character_start_times_seconds[i]<a.character_end_times_seconds[i-1])))ctx.addIssue({code:'custom',message:'Invalid character timing order or length'});
});
