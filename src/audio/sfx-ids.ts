/** Procedural sound-effect ids (synthesised in src/audio/synth.ts). Kept separate so schemas stay browser-safe. */
export const SFX_IDS = ['rumble', 'whoosh', 'boom', 'pop', 'bubble', 'sizzle', 'riser', 'tick', 'heartbeat'] as const;
export type SfxId = typeof SFX_IDS[number];
