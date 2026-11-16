import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {storyScriptSchema} from '../storytelling/schema';
import {validateStory} from '../storytelling/validate';
import {parseAnchoredStoryboard, resolveWordAnchors} from '../storytelling/timing/anchors';
import {estimateAlignment} from '../storytelling/timing/estimate';
import {captionsFromProviderTiming} from '../captions/provider-timing';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const adv: Record<string, number> = read('scripts/authoring/patrick-hand-widths.json').advance;
type Ann = {id: string; text: string; x: number; y: number; size: number};
/** Exact rendered box of a centred note (font advances), without the solver's safety padding. */
const box = (a: Ann) => { const w = [...a.text].reduce((n, c) => n + (adv[c] ?? .5), 0) * a.size; return {x0: a.x - w / 2, x1: a.x + w / 2, y0: a.y - a.size * .8, y1: a.y + a.size * .25}; };
const overlap = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe.each([['helmet-off-v2', 'helmet-off', 9], ['helmet-off-short-v2', 'helmet-off-short', 6]])('recipe-built %s', (board, story, beats) => {
  const raw = read(`storyboards/${board}.json`);
  it('validates and resolves every anchor', () => {
    const s = validateStory(storyScriptSchema.parse(read(`stories/${story}.json`)), parseAnchoredStoryboard(raw));
    expect(s.beats).toHaveLength(beats);
    const est = estimateAlignment(s.beats.map(b => b.narration).join(' '), 210);
    const r = resolveWordAnchors(raw, captionsFromProviderTiming(s, est, est.character_end_times_seconds.at(-1)! + .05, 30));
    expect(r.warnings.filter(w => !w.includes('outside scene') && !w.includes('nudged') && !w.includes('clamped'))).toEqual([]);
  });
  it('never overlaps two notes in the same scene', () => {
    for (const g of raw.groups) {
      const anns: Ann[] = g.annotations ?? [];
      for (let i = 0; i < anns.length; i++) for (let j = i + 1; j < anns.length; j++)
        expect(overlap(box(anns[i]), box(anns[j])), `${g.id}: "${anns[i].text}" vs "${anns[j].text}"`).toBe(false);
    }
  });
  it('derives camera keys, idle motion and sound cues for every scene', () => {
    expect(raw.scenes.filter((s: {camera: {keyframes?: unknown[]}}) => s.camera.keyframes?.length).length).toBeGreaterThanOrEqual(beats - 2);
    expect(raw.scenes.every((s: {sounds: unknown[]}) => s.sounds.length > 0)).toBe(true);
  });
});

describe('recipe-built Short respects the Shorts UI', () => {
  it('keeps notes out of the top bar, bottom title area and the right button column', () => {
    for (const g of read('storyboards/helmet-off-short-v2.json').groups.filter((x: {id: string}) => x.id !== 'backdrop'))
      for (const a of (g.annotations ?? []) as Ann[]) {
        const b = box(a);
        expect(b.y0, `${g.id}/${a.text}`).toBeGreaterThan(440);
        expect(b.y1, `${g.id}/${a.text}`).toBeLessThan(1460);
        if (b.y1 > 960) expect(b.x1, `${g.id}/${a.text}`).toBeLessThan(900);
      }
  });
});
