/** Procedural sound-effect ids (synthesised in src/audio/synth.ts). Kept separate so schemas stay browser-safe. */
export const SFX_IDS = ['rumble', 'whoosh', 'boom', 'pop', 'bubble', 'sizzle', 'riser', 'tick', 'heartbeat', 'chime', 'crack', 'splash', 'tear', 'wind', 'ding', 'rewind', 'slam', 'boing', 'slide-up', 'slide-down', 'scratch', 'bonk', 'zip'] as const;
export type SfxId = typeof SFX_IDS[number];
