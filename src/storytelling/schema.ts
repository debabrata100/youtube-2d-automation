import {z} from 'zod';
export const normalizeText=(text:string)=>text.normalize('NFC').trim().replace(/\s+/g,' ');
export const words=(text:string)=>normalizeText(text).match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)??[];
const text=z.string().trim().min(1);
export const storyBeatSchema=z.object({id:text,sceneId:text,narration:text.max(1000),intent:z.enum(['hook','setup','explanation','payoff','closing']),emphasis:z.array(text).max(8).default([]),phrases:z.array(text.max(100)).min(1).max(12),
 /** Optional speaker per phrase (multi-voice); untagged beats are spoken by the narrator. */
 phraseSpeakers:z.array(z.string().regex(/^[a-z][a-z0-9-]{0,23}$/)).optional()}).strict().superRefine((b,ctx)=>{
 if(b.phraseSpeakers&&b.phraseSpeakers.length!==b.phrases.length)ctx.addIssue({code:'custom',path:['phraseSpeakers'],message:'One speaker per phrase'});
 if(b.phraseSpeakers&&b.narration!==b.phrases.join(' '))ctx.addIssue({code:'custom',path:['narration'],message:'Multi-voice beats need narration equal to their phrases joined by single spaces'});
 if(words(b.phrases.join(' ')).join(' ').toLowerCase()!==words(b.narration).join(' ').toLowerCase())ctx.addIssue({code:'custom',path:['phrases'],message:'Caption phrases must cover narration in the same word order'});
 for(const word of b.emphasis)if(!normalizeText(b.narration).toLowerCase().includes(word.toLowerCase()))ctx.addIssue({code:'custom',path:['emphasis'],message:'Emphasis must occur in narration'});
});
export const storyScriptSchema=z.object({schemaVersion:z.literal('1.0'),id:text.regex(/^[a-z0-9-]+$/),title:text,topic:text,language:z.literal('en-US'),targetAudience:text,durationSeconds:z.number().positive().max(900),storyboard:z.string().regex(/^storyboards\/[a-zA-Z0-9/_-]+\.json$/),candidatesReport:z.string().regex(/^stories\/[a-zA-Z0-9/_-]+\.md$/).optional(),previews:z.array(z.object({id:text.regex(/^[a-z0-9-]+$/),fromBeat:text,toBeat:text}).strict()).max(6).optional(),beats:z.array(storyBeatSchema).min(1).max(100)}).strict().superRefine((s,ctx)=>{
 if(new Set(s.beats.map(b=>b.id)).size!==s.beats.length)ctx.addIssue({code:'custom',path:['beats'],message:'Duplicate beat identifiers'});
 for(const preview of s.previews??[]){const start=s.beats.findIndex(b=>b.id===preview.fromBeat),end=s.beats.findIndex(b=>b.id===preview.toBeat);if(start<0||end<start)ctx.addIssue({code:'custom',path:['previews'],message:'Preview beat references must exist and be ordered'});}
 if(new Set(s.previews?.map(p=>p.id)).size!==(s.previews?.length??0))ctx.addIssue({code:'custom',path:['previews'],message:'Duplicate preview IDs'});
 // A one-beat story is a no-narration Short (the picture is the hook; the one spoken line closes it).
 if(s.beats.length>1&&(s.beats[0].intent!=='hook'||s.beats.at(-1)!.intent!=='closing'))ctx.addIssue({code:'custom',path:['beats'],message:'Story must begin with a hook and end with a closing beat'});
});
export type StoryScript=z.infer<typeof storyScriptSchema>;
