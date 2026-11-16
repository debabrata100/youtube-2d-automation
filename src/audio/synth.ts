/**
 * Deterministic procedural audio: sound effects and a placeholder music bed, synthesised in code.
 * No samples, no network, no licences required; identical bytes on every machine for the same inputs.
 */
import {seededRandom} from '../motion/particles';

export const SAMPLE_RATE = 48000;
import {SFX_IDS, type SfxId} from './sfx-ids';
export {SFX_IDS, type SfxId};

const buffer = (seconds: number) => new Float32Array(Math.round(seconds * SAMPLE_RATE));
const white = (n: number, seed: number) => { const r = seededRandom(seed); return Float32Array.from({length: n}, () => r() * 2 - 1); };
const brown = (n: number, seed: number) => { const w = white(n, seed), out = new Float32Array(n); let last = 0; for (let i = 0; i < n; i++) { last = (last + .02 * w[i]) / 1.02; out[i] = last * 3.5; } return out; };
const pink = (n: number, seed: number) => {
  const w = white(n, seed), out = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) { b0 = .99765 * b0 + w[i] * .099046; b1 = .963 * b1 + w[i] * .2965164; b2 = .57 * b2 + w[i] * 1.0526913; out[i] = (b0 + b1 + b2 + w[i] * .1848) * .25; }
  return out;
};
/** One-pole low-pass (cutoff may vary per sample). */
const lowpass = (x: Float32Array, cutoff: number | ((t: number) => number)) => {
  const out = new Float32Array(x.length); let y = 0;
  for (let i = 0; i < x.length; i++) { const fc = typeof cutoff === 'number' ? cutoff : cutoff(i / SAMPLE_RATE); const a = 1 - Math.exp(-2 * Math.PI * fc / SAMPLE_RATE); y += a * (x[i] - y); out[i] = y; }
  return out;
};
const highpass = (x: Float32Array, cutoff: number) => { const lp = lowpass(x, cutoff); return x.map((v, i) => v - lp[i]); };
const envelope = (x: Float32Array, fn: (t: number, d: number) => number) => { const d = x.length / SAMPLE_RATE; return x.map((v, i) => v * fn(i / SAMPLE_RATE, d)); };
const fade = (attack: number, release: number) => (t: number, d: number) => Math.min(1, t / Math.max(attack, 1e-4)) * Math.min(1, (d - t) / Math.max(release, 1e-4));
const normalize = (x: Float32Array, peak = .89) => { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); return m ? x.map(v => v * peak / m) : x; };

/** Short, readable recipes. Every sound is a pure function of its id. */
export const synthSfx = (id: SfxId): Float32Array => {
  switch (id) {
    case 'rumble': { // low tremor building and fading: tension
      const n = buffer(2.4).length, x = lowpass(lowpass(brown(n, 11), 160), 120);
      return normalize(envelope(x, (t, d) => fade(.6, 1)(t, d) * (.6 + .4 * Math.sin(2 * Math.PI * 8 * t))), .8);
    }
    case 'whoosh': { // band-limited noise with a rising then falling filter sweep
      const n = buffer(.85).length, x = lowpass(highpass(pink(n, 12), 250), t => 400 + 3200 * Math.sin(Math.PI * Math.min(1, t / .85)));
      return normalize(envelope(x, (t, d) => Math.sin(Math.PI * Math.min(1, t / d)) ** 1.5), .7);
    }
    case 'boom': { // sub thump + noise burst with exponential decay
      const b = buffer(2.2), noise = lowpass(lowpass(lowpass(brown(b.length, 13), 180), 180), 180);
      for (let i = 0; i < b.length; i++) { const t = i / SAMPLE_RATE, f = 38 + 50 * Math.exp(-t * 9); b[i] = (Math.sin(2 * Math.PI * f * t) * .9 + noise[i] * 1.4) * Math.exp(-t * 2.2) * Math.min(1, t / .006); }
      return normalize(b, .95);
    }
    case 'pop': { // bright chirp for labels appearing
      const b = buffer(.12); for (let i = 0; i < b.length; i++) { const t = i / SAMPLE_RATE; b[i] = Math.sin(2 * Math.PI * (650 * t + 3600 * t * t)) * Math.exp(-t * 32) * Math.min(1, t / .002); }
      return normalize(b, .6);
    }
    case 'bubble': { // rising blip for gas bubbles
      const b = buffer(.16); for (let i = 0; i < b.length; i++) { const t = i / SAMPLE_RATE; b[i] = Math.sin(2 * Math.PI * (380 * t + 4200 * t * t)) * Math.exp(-t * 20) * Math.min(1, t / .004); }
      return normalize(b, .5);
    }
    case 'sizzle': { // crackling hiss for flowing lava
      const n = buffer(3).length, crackle = seededRandom(14), x = highpass(white(n, 15), 2400);
      return normalize(envelope(x, (t, d) => fade(.3, 1)(t, d) * (.35 + .65 * (crackle() > .997 ? 1 : .35))), .35);
    }
    case 'tick': { // dry clock tick for countdowns
      const b = buffer(.06), x = highpass(white(b.length, 21), 1800); for (let i = 0; i < b.length; i++) { const t = i / SAMPLE_RATE; b[i] = (x[i] * .7 + Math.sin(2 * Math.PI * 2100 * t) * .5) * Math.exp(-t * 90); }
      return normalize(b, .55);
    }
    case 'heartbeat': { // lub-dub: two soft low thumps
      const b = buffer(.75); for (let i = 0; i < b.length; i++) { const t = i / SAMPLE_RATE, beat = (t0: number, a: number) => t < t0 ? 0 : a * Math.sin(2 * Math.PI * (52 + 30 * Math.exp(-(t - t0) * 30)) * (t - t0)) * Math.exp(-(t - t0) * 16); b[i] = beat(0, 1) + beat(.26, .75); }
      return normalize(lowpass(b, 400), .8);
    }
    case 'riser': { // pitch rise into the payoff
      const b = buffer(1.4); for (let i = 0; i < b.length; i++) { const t = i / SAMPLE_RATE, ph = 2 * Math.PI * (110 * t + 160 * t * t); b[i] = (Math.sin(ph) + .35 * Math.sin(2 * ph) + .15 * Math.sin(3 * ph)) * Math.min(1, t / 1.1) * Math.min(1, (1.4 - t) / .08); }
      return normalize(lowpass(b, 2400), .5);
    }
  }
};

const NOTE = (semitones: number) => 220 * 2 ** (semitones / 12); // relative to A3
/** A minor - F - C - G, a neutral explainer progression. Root, third, fifth, octave + sub bass. */
const PROGRESSION = [[0, 3, 7, 12], [-4, 0, 3, 8], [3, 7, 10, 15], [-2, 2, 5, 10]];

/** Gentle pad with slow chord crossfades, soft eighth-note pulse, low-pass and a short feedback-delay space. */
export const synthMusicBed = (seconds: number, seed = 1): Float32Array => {
  const out = buffer(seconds), chord = seconds / PROGRESSION.length, xf = Math.min(.6, chord / 4), jitter = seededRandom(seed);
  const detune = PROGRESSION.map(c => c.map(() => 1 + (jitter() - .5) * .004));
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE; let v = 0;
    PROGRESSION.forEach((notes, k) => {
      const start = k * chord, end = start + chord, w = Math.min(1, Math.max(0, (t - start + xf) / (2 * xf))) * Math.min(1, Math.max(0, (end + xf - t) / (2 * xf)));
      if (w <= 0) return;
      notes.forEach((s, j) => { const f = NOTE(s) * detune[k][j], ph = 2 * Math.PI * f * t; v += w * (Math.sin(ph) + .25 * Math.sin(2 * ph)) * (j === 0 ? .22 : .14); });
      v += w * Math.sin(2 * Math.PI * NOTE(notes[0] - 12) * t) * .2;
    });
    out[i] = v * (.82 + .18 * Math.cos(2 * Math.PI * 4 * t));
  }
  const filtered = lowpass(out, 1800), delay = Math.round(.19 * SAMPLE_RATE), wet = new Float32Array(filtered.length);
  for (let i = 0; i < wet.length; i++) wet[i] = filtered[i] + (i >= delay ? wet[i - delay] * .38 : 0);
  return normalize(envelope(wet, fade(.8, 1.6)), .7);
};

/** 16-bit PCM mono WAV. */
export const encodeWav = (samples: Float32Array, sampleRate = SAMPLE_RATE) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8); header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
};
