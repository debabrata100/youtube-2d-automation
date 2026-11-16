/** Multi-voice narration: one continuous take per speaker, cut at speaker turns and joined into one track.
 *
 * A story's full narration text is its beats joined by single spaces. Phrases may be tagged with a speaker
 * (`phraseSpeakers`); untagged beats belong to the narrator. Consecutive phrases (also across beats) by the same
 * speaker form a run. Each speaker gets ONE request containing all of their runs, so delivery stays natural and
 * the number of paid requests equals the number of speakers. The takes are cut at the silences between runs and
 * concatenated in story order; character timings are shifted onto the joined track, so captions and word anchors
 * work exactly as for a single take. Pure functions: no I/O, no network. */
import type {CharacterAlignment} from './tts/provider';

export const NARRATOR = 'narrator';
type Beat = {narration: string; phrases: string[]; phraseSpeakers?: string[]};
export type SpeakerRun = {speaker: string; text: string; start: number; end: number};
export type Take = {samples: Float32Array; sampleRate: number; alignment: CharacterAlignment};

export const fullNarration = (beats: Beat[]) => beats.map(b => b.narration).join(' ');
export const storySpeakers = (beats: Beat[]) => [...new Set(beats.flatMap(b => b.phraseSpeakers ?? [NARRATOR]))];

/** Speaker runs with character ranges [start, end) in the full narration text. */
export const speakerRuns = (beats: Beat[]): SpeakerRun[] => {
  const runs: SpeakerRun[] = [];
  let offset = 0;
  const push = (speaker: string, text: string, start: number) => {
    const last = runs.at(-1);
    // Same speaker continuing after a single separating space: extend the run (one natural stretch of speech).
    if (last && last.speaker === speaker && last.end + 1 === start) { last.text += ' ' + text; last.end = start + text.length; }
    else runs.push({speaker, text, start, end: start + text.length});
  };
  for (const beat of beats) {
    if (!beat.phraseSpeakers) push(NARRATOR, beat.narration, offset);
    else {
      if (beat.narration !== beat.phrases.join(' ')) throw Error('A multi-voice beat must have narration equal to its phrases joined by single spaces');
      let local = 0;
      beat.phrases.forEach((phrase, i) => { push(beat.phraseSpeakers![i], phrase, offset + local); local += phrase.length + 1; });
    }
    offset += beat.narration.length + 1;
  }
  return runs;
};

/** The text each speaker records (their runs in story order, space-joined) and where each run sits in it. */
export const speakerScripts = (runs: SpeakerRun[]) => {
  const scripts = new Map<string, {text: string; parts: Array<{run: number; start: number; end: number}>}>();
  runs.forEach((run, i) => {
    const s = scripts.get(run.speaker) ?? {text: '', parts: []};
    const start = s.text ? s.text.length + 1 : 0;
    s.text = s.text ? `${s.text} ${run.text}` : run.text;
    s.parts.push({run: i, start, end: start + run.text.length});
    scripts.set(run.speaker, s);
  });
  return scripts;
};

const firstSpoken = (text: string[], from: number, to: number) => { for (let i = from; i < to; i++) if (text[i].trim()) return i; return from; };
const lastSpoken = (text: string[], from: number, to: number) => { for (let i = to - 1; i >= from; i--) if (text[i].trim()) return i; return to - 1; };

/** Speech-level RMS: mean power of 20 ms frames within 30 dB of the loudest frame (pauses ignored). */
export const speechRms = (samples: Float32Array, rate: number) => {
  const n = Math.max(1, Math.round(rate * .02)), powers: number[] = [];
  for (let i = 0; i + n <= samples.length; i += n) { let p = 0; for (let j = i; j < i + n; j++) p += samples[j] * samples[j]; powers.push(p / n); }
  const max = Math.max(...powers, 1e-12), gate = max / 1000, voiced = powers.filter(p => p >= gate);
  return Math.sqrt(voiced.reduce((a, b) => a + b, 0) / Math.max(1, voiced.length));
};

/** Join speaker takes into one track with timings for the full narration text. Other voices are level-matched to the narrator. */
export const assembleTakes = (beats: Beat[], takes: Record<string, Take>, options: {gapSeconds?: number; padSeconds?: number; matchLevels?: boolean} = {}) => {
  const gap = options.gapSeconds ?? .18, pad = options.padSeconds ?? .3;
  const full = Array.from(fullNarration(beats)), runs = speakerRuns(beats), scripts = speakerScripts(runs);
  const rates = new Set(Object.values(takes).map(t => t.sampleRate));
  if (rates.size !== 1) throw Error('All takes must share one sample rate');
  const rate = [...rates][0];
  for (const [speaker, script] of scripts) {
    const take = takes[speaker];
    if (!take) throw Error(`Missing take for speaker ${speaker}`);
    if (take.alignment.characters.join('') !== script.text) throw Error(`Take for ${speaker} does not match its script text`);
  }
  // Different voices come back at different loudness; scale each to the narrator's speech level (bounded to +/-6 dB).
  const reference = takes[NARRATOR] ?? Object.values(takes)[0], refRms = speechRms(reference.samples, rate);
  const gains: Record<string, number> = Object.fromEntries(Object.entries(takes).map(([k, t]) => [k, options.matchLevels === false ? 1 : Math.min(2, Math.max(.5, refRms / Math.max(1e-9, speechRms(t.samples, rate))))]));
  const starts = new Array<number>(full.length).fill(NaN), ends = new Array<number>(full.length).fill(NaN);
  const pieces: Float32Array[] = [];
  let cursor = 0; // seconds written so far
  runs.forEach((run, ri) => {
    const script = scripts.get(run.speaker)!, take = takes[run.speaker], a = take.alignment, chars = a.characters;
    const k = script.parts.findIndex(p => p.run === ri), part = script.parts[k], prev = script.parts[k - 1], next = script.parts[k + 1];
    const i0 = firstSpoken(chars, part.start, part.end), i1 = lastSpoken(chars, part.start, part.end);
    const t0 = a.character_start_times_seconds[i0], t1 = a.character_end_times_seconds[i1], length = take.samples.length / rate;
    // Cut in the silence between this run and its neighbours in the same take, at most `pad` seconds from the speech.
    const prevEnd = prev ? a.character_end_times_seconds[lastSpoken(chars, prev.start, prev.end)] : -Infinity;
    const nextStart = next ? a.character_start_times_seconds[firstSpoken(chars, next.start, next.end)] : Infinity;
    const cutStart = Math.max(0, t0 - pad, prev ? (prevEnd + t0) / 2 : -Infinity), cutEnd = Math.min(length, t1 + pad, next ? (t1 + nextStart) / 2 : Infinity);
    if (ri > 0) { const silence = new Float32Array(Math.round(gap * rate)); pieces.push(silence); cursor += silence.length / rate; }
    const slice = take.samples.slice(Math.round(cutStart * rate), Math.round(cutEnd * rate));
    if (gains[run.speaker] !== 1) for (let i = 0; i < slice.length; i++) slice[i] = Math.max(-1, Math.min(1, slice[i] * gains[run.speaker]));
    const fade = Math.min(Math.round(.006 * rate), slice.length >> 1);
    for (let i = 0; i < fade; i++) { const g = i / fade; slice[i] *= g; slice[slice.length - 1 - i] *= g; }
    const shift = cursor - Math.round(cutStart * rate) / rate;
    for (let i = part.start; i < part.end; i++) {
      starts[run.start + i - part.start] = Math.max(0, a.character_start_times_seconds[i] + shift);
      ends[run.start + i - part.start] = Math.max(0, a.character_end_times_seconds[i] + shift);
    }
    pieces.push(slice); cursor += slice.length / rate;
  });
  // Separator spaces between runs span the silence from one run's last character to the next run's first.
  for (let i = 0; i < full.length; i++) if (Number.isNaN(starts[i])) {
    let p = i - 1; while (p >= 0 && Number.isNaN(ends[p])) p--;
    let q = i + 1; while (q < full.length && Number.isNaN(starts[q])) q++;
    starts[i] = p >= 0 ? ends[p] : 0; ends[i] = q < full.length ? starts[q] : starts[i];
  }
  for (let i = 1; i < full.length; i++) { if (starts[i] < ends[i - 1]) starts[i] = ends[i - 1]; if (ends[i] < starts[i]) ends[i] = starts[i]; }
  const samples = new Float32Array(pieces.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of pieces) { samples.set(p, o); o += p.length; }
  return {samples, sampleRate: rate, alignment: {characters: full, character_start_times_seconds: starts, character_end_times_seconds: ends} as CharacterAlignment, runs, gains};
};

/** 16-bit PCM mono WAV decoder (the format ElevenLabs pcm_24000 takes are stored in). */
export const decodeWav16 = (bytes: Uint8Array) => {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw Error('Not a WAV file');
  let p = 12, rate = 0, channels = 0, bits = 0;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === 'fmt ') { channels = b.readUInt16LE(p + 10); rate = b.readUInt32LE(p + 12); bits = b.readUInt16LE(p + 22); }
    if (id === 'data') {
      if (channels !== 1 || bits !== 16) throw Error('Expected 16-bit mono PCM');
      const n = size / 2, samples = new Float32Array(n);
      for (let i = 0; i < n; i++) samples[i] = b.readInt16LE(p + 8 + i * 2) / 32768;
      return {samples, sampleRate: rate};
    }
    p += 8 + size + (size & 1);
  }
  throw Error('WAV has no data chunk');
};
