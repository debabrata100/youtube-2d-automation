import {z} from 'zod';
export const openAIVoices=['alloy','ash','ballad','coral','echo','fable','onyx','nova','sage','shimmer','verse','marin','cedar'] as const;
export const ttsConfigSchema=z.discriminatedUnion('provider',[
 z.object({provider:z.literal('mock'),model:z.literal('pcm-test-v1'),voice:z.enum(['test-pulse','test-low']),language:z.literal('en-US'),speakingRate:z.number().min(.9).max(1.1),wordsPerMinute:z.number().min(120).max(180),format:z.literal('wav'),instructions:z.string().max(1000)}).strict(),
 z.object({provider:z.literal('elevenlabs'),model:z.literal('eleven_multilingual_v2'),voice:z.string().regex(/^[a-zA-Z0-9]{20}$/),language:z.literal('en-US'),speakingRate:z.literal(1),format:z.literal('wav'),instructions:z.literal(''),outputFormat:z.literal('pcm_24000'),voiceSettings:z.object({stability:z.number().min(0).max(1),similarity_boost:z.number().min(0).max(1),style:z.number().min(0).max(1),use_speaker_boost:z.boolean(),speed:z.literal(1)}).strict(),seed:z.number().int().min(0).max(4294967295),applyTextNormalization:z.literal('auto')}).strict(),
 z.object({provider:z.literal('openai'),model:z.enum(['gpt-4o-mini-tts','gpt-4o-mini-tts-2025-12-15']),voice:z.enum(openAIVoices),language:z.literal('en-US'),speakingRate:z.number().min(.9).max(1.1),format:z.literal('wav'),instructions:z.string().max(1000)}).strict(),
]);
export type TTSConfig=z.infer<typeof ttsConfigSchema>;
export type SynthesisRequest={text:string;config:TTSConfig};
export type CharacterAlignment={characters:string[];character_start_times_seconds:number[];character_end_times_seconds:number[]};
export type SynthesisResult={audio:Uint8Array;provider:string;model:string;requestId?:string;usage:null;syntheticTestAudio:boolean;alignment?:CharacterAlignment};
export interface TTSProvider{readonly id:'mock'|'openai'|'elevenlabs';synthesize(request:SynthesisRequest):Promise<SynthesisResult>}
