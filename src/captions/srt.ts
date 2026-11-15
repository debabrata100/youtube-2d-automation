/** Caption files for platform upload (YouTube accepts SRT and WebVTT). Pure: cues in frames -> text. */
import type {CaptionCue} from './schema';

const stamp = (seconds: number, sep: ',' | '.') => {
  const ms = Math.max(0, Math.round(seconds * 1000)), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  const pad = (v: number, n = 2) => String(v).padStart(n, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms % 1000, 3)}`;
};

export const cuesToSrt = (cues: CaptionCue[], fps: number) =>
  cues.map((c, i) => `${i + 1}\n${stamp(c.startFrame / fps, ',')} --> ${stamp(c.endFrame / fps, ',')}\n${c.lines.join('\n')}\n`).join('\n');

export const cuesToVtt = (cues: CaptionCue[], fps: number) =>
  'WEBVTT\n\n' + cues.map(c => `${stamp(c.startFrame / fps, '.')} --> ${stamp(c.endFrame / fps, '.')}\n${c.lines.join('\n')}\n`).join('\n');
