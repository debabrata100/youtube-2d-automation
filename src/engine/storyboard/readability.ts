/** Readability audit for hand-written notes, run before every render (added 22 Nov 2026 after two avoidable re-renders):
 *  1. Contrast: each note against the outline the renderer draws behind it, and against the page it sits on
 *     (night page, or a daytime sky layer at its level when the note appears).
 *  2. Time on screen: each note must stay readable long enough (it pops in, then the shot ends or the note is dropped).
 * Works on a resolved storyboard (prepared job): anchor frames are numbers there. Header notes (no opacity track) are
 * on screen for the whole shot and only get the contrast check. */
import {contrastRatio, getTheme, haloFor} from '../style/theme';

type Key = {frame: number; value: number};
type Note = {id: string; text: string; color?: string; variant?: string; size?: number; opacity?: Key[]};
type Layer = {id?: string; kit?: {type?: string; item?: string; level?: Key[]; color?: string}};
type Group = {id: string; annotations?: Note[]; layers?: Layer[]};
type Scene = {id: string; durationFrames: number; config?: {primary?: {asset?: string}}};
type Board = {themeId?: string; scenes: Scene[]; groups?: Group[]};

export type ReadabilityIssue = {level: 'error' | 'warning'; check: 'contrast' | 'time'; scene: string; startSeconds: number; note: string; detail: string};

const valueAt = (keys: Key[] | undefined, frame: number, fallback: number) => {
  if (!keys?.length) return fallback;
  if (frame <= keys[0].frame) return keys[0].value;
  for (let i = 1; i < keys.length; i++) if (frame <= keys[i].frame) {
    const a = keys[i - 1], b = keys[i], t = (frame - a.frame) / Math.max(1, b.frame - a.frame);
    return a.value + (b.value - a.value) * t;
  }
  return keys[keys.length - 1].value;
};
const hex = (c: string) => /^#[0-9a-f]{6}$/i.test(c.trim());
const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');

/** Frames during which the note is at least half visible, from its opacity track, within [0, duration). */
export const visibleFrames = (keys: Key[] | undefined, duration: number) => {
  if (!keys?.length) return {from: 0, to: duration};
  let from = -1;
  for (let f = 0; f < duration; f++) {
    const v = valueAt(keys, f, 1);
    if (from < 0 && v >= .5) from = f;
    else if (from >= 0 && v < .5) return {from, to: f};
  }
  return from < 0 ? {from: duration, to: duration} : {from, to: duration};
};

export const readabilityIssues = (board: Board, fps = 30, minSeconds = 1.5, errorSeconds = 1, minHaloContrast = 3, minPageContrast = 2.5): ReadabilityIssue[] => {
  const theme = board.themeId ? getTheme(board.themeId) : undefined;
  const page = theme?.palette.sky.top ?? '#0b1530', themeHalo = theme?.label.halo;
  const groups = new Map((board.groups ?? []).map(g => [g.id, g]));
  const issues: ReadabilityIssue[] = [];
  let start = 0;
  for (const scene of board.scenes) {
    const group = groups.get(scene.config?.primary?.asset ?? '');
    const sky = group?.layers?.find(l => l.kit?.type === 'prop' && l.kit.item === 'sky');
    for (const note of group?.annotations ?? []) {
      if (note.variant !== 'ink' || !note.text?.trim()) continue;
      const {from, to} = visibleFrames(note.opacity, scene.durationFrames);
      const at = (start + Math.min(from, scene.durationFrames)) / fps;
      const base = {scene: scene.id, startSeconds: +at.toFixed(1), note: note.text};
      // Time on screen (header notes without an opacity track are up for the whole shot).
      if (note.opacity?.length) {
        const seconds = (to - from) / fps;
        if (seconds < minSeconds) issues.push({...base, level: seconds < errorSeconds ? 'error' : 'warning', check: 'time', detail: seconds <= 0 ? 'never shown: it is timed after the shot ends' : `readable for ${seconds.toFixed(1)} s (aim for ${minSeconds} s): bring it in earlier or hold the shot`});
      }
      // Contrast against the outline and the page under the note.
      const color = note.color ?? theme?.palette.text?.accent;
      if (!color || !hex(color)) continue;
      const skyLevel = sky ? valueAt(sky.kit?.level, Math.min(from, scene.durationFrames - 1), 1) : 0;
      const bg = sky ? mix(page, sky.kit?.color && hex(sky.kit.color) ? sky.kit.color : '#9fd0ff', skyLevel) : page;
      const halo = haloFor(color, themeHalo);
      if (halo && contrastRatio(color, halo) < minHaloContrast)
        issues.push({...base, level: 'error', check: 'contrast', detail: `text ${color} on its outline ${halo}: contrast ${contrastRatio(color, halo).toFixed(1)} (minimum ${minHaloContrast})`});
      const onPage = contrastRatio(color, bg);
      if (onPage < minPageContrast)
        issues.push({...base, level: halo ? 'warning' : 'error', check: 'contrast', detail: `text ${color} on the page ${bg}: contrast ${onPage.toFixed(1)} (minimum ${minPageContrast})${halo ? '; the outline helps, check the frame' : ''}`});
    }
    start += scene.durationFrames;
  }
  return issues;
};

type Placed = {x?: number; y?: number; size?: number};
/** Automatic fix for the time check, applied when anchors are resolved (prepare and preview use the same board): a note that
 * would be readable for less than `minSeconds` before its shot ends comes in earlier, so it gets `minSeconds` (or as much of
 * the shot as there is). It never comes in before a nearby note it replaces has gone. Notes that are dropped on purpose
 * before the shot ends ('until') are left alone. Returns what moved, for the prepare report. */
export const holdShortNotes = (board: Board, fps = 30, minSeconds = 1.5) => {
  const groups = new Map((board.groups ?? []).map(g => [g.id, g]));
  const moved: {scene: string; note: string; earlierSeconds: number}[] = [];
  const minFrames = Math.round(minSeconds * fps);
  for (const scene of board.scenes) {
    const group = groups.get(scene.config?.primary?.asset ?? ''), d = scene.durationFrames;
    const notes = (group?.annotations ?? []) as (Note & Placed)[];
    for (const note of notes) {
      if (note.variant !== 'ink' || !note.opacity?.length) continue;
      const {from, to} = visibleFrames(note.opacity, d);
      if (to < d || to - from >= minFrames) continue;
      let target = Math.max(0, d - minFrames);
      for (const other of notes) {
        if (other === note || !other.opacity?.length) continue;
        const w = visibleFrames(other.opacity, d);
        const near = Math.abs((other.y ?? 0) - (note.y ?? 0)) < ((other.size ?? 60) + (note.size ?? 60)) * .6 && Math.abs((other.x ?? 0) - (note.x ?? 0)) < 500;
        if (near && w.to < d && w.to > target) target = Math.min(from, w.to);
      }
      // A note timed after the shot ends never shows (from = d); measure from where its track actually rises.
      let rise = from;
      if (from >= d) { const end = note.opacity[note.opacity.length - 1].frame; rise = d; while (rise <= end && valueAt(note.opacity, rise, 1) < .5) rise++; }
      const shift = rise - target;
      if (shift <= 0) continue;
      let last = 0;
      note.opacity = note.opacity.map((k, i) => {
        if (i === 0 && k.frame === 0) return k;
        const frame = Math.max(last + 1, k.frame - shift); last = frame;
        return {...k, frame};
      });
      moved.push({scene: scene.id, note: note.text, earlierSeconds: +(shift / fps).toFixed(1)});
    }
  }
  return moved;
};
