import {z} from 'zod';
export const captionStyleSchema=z.object({fontSize:z.number().min(36).max(72).default(60),top:z.number().min(.08).max(.2).default(.105),left:z.number().min(.06).max(.12).default(.08),right:z.number().min(.14).max(.2).default(.16),maxCharactersPerLine:z.number().int().min(16).max(28).default(26)}).strict();
export const captionCueSchema=z.object({id:z.string().min(1),beatId:z.string().min(1),startFrame:z.number().int().nonnegative(),endFrame:z.number().int().positive(),lines:z.array(z.string().min(1)).min(1).max(2),timingBasis:z.enum(['estimated phrase allocation inside measured beat audio','local ASR phrase estimates; not word-perfect','provider character timestamps; rounded to video frames'])}).strict().refine(c=>c.endFrame>c.startFrame,'Caption interval must be positive');
export type CaptionCue=z.infer<typeof captionCueSchema>;
export const narrationOverlaySchema=z.object({audioSrc:z.string().regex(/^narration\/[a-zA-Z0-9._-]+\.wav$/),captionsEnabled:z.boolean(),syntheticTestAudio:z.boolean(),cues:z.array(captionCueSchema),style:captionStyleSchema}).strict().superRefine((v,ctx)=>{
 if(v.cues.some((c,i)=>i>0&&c.startFrame<v.cues[i-1].endFrame))ctx.addIssue({code:'custom',path:['cues'],message:'Caption cues must be ordered and non-overlapping'});
 for(const c of v.cues)if(c.lines.some(line=>line.length>v.style.maxCharactersPerLine))ctx.addIssue({code:'custom',path:['cues',c.id],message:'Caption line exceeds configured safe layout'});
});
export type NarrationOverlayConfig=z.infer<typeof narrationOverlaySchema>;
