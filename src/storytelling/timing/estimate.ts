/**
 * Planning-only character timings, shaped like provider alignment, so storyboards, captions and scene cuts can be
 * previewed before paying for narration. Never used for a final render: real provider timing replaces it.
 */
export type EstimatedAlignment = {characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[]};

const PAUSE: Record<string, number> = {',': .22, '.': .42, '?': .45, '!': .42, ';': .3, ':': .3};

/** Words take time proportional to their length at an articulation rate (before pauses); punctuation adds pauses.
 * Default 155 reproduces the approved Bill L. Oxley volcano take (13.14 s measured vs 13.1 s estimated). */
export const estimateAlignment = (text: string, wordsPerMinute = 155, leadIn = .05): EstimatedAlignment => {
  const characters = [...text], starts: number[] = [], ends: number[] = [];
  const wordCount = (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
  const letters = characters.filter(c => /[\p{L}\p{N}]/u.test(c)).length;
  const perLetter = (wordCount * 60 / wordsPerMinute) / Math.max(1, letters) * .86;
  let t = leadIn;
  for (const c of characters) {
    const d = /[\p{L}\p{N}'’-]/u.test(c) ? perLetter : c === ' ' ? perLetter * .9 : PAUSE[c] ?? .05;
    starts.push(+t.toFixed(4));
    t += d;
    ends.push(+t.toFixed(4));
  }
  return {characters, character_start_times_seconds: starts, character_end_times_seconds: ends};
};
