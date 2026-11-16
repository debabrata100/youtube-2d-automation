import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {storyScriptSchema} from '../storytelling/schema';
import {validateStory} from '../storytelling/validate';
import {parseAnchoredStoryboard, resolveWordAnchors} from '../storytelling/timing/anchors';
import {estimateAlignment} from '../storytelling/timing/estimate';
import {captionsFromProviderTiming} from '../captions/provider-timing';
import {captionStyleSchema} from '../captions/schema';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const short = read('storyboards/titan-short.json'), pilot = read('storyboards/titan-pilot.json');
type Group = {id: string; layers: Array<{kit?: {type: string; x?: number; y?: number}}>; annotations?: Array<{id: string; text: string; x: number; y: number; size: number}>};
const storyGroups = (short.groups as Group[]).filter(g => g.id !== 'backdrop');

describe('Titan Short (9:16) storyboard', () => {
  it('is the pilot story re-laid out: same scenes, cues and sounds at 1080x1920', () => {
    expect(short.format).toEqual({width: 1080, height: 1920, fps: 30});
    const strip = (s: {id: string; narrationCue: unknown; sounds: unknown; durationFrames: number}) => [s.id, s.narrationCue, s.sounds, s.durationFrames];
    expect(short.scenes.map(strip)).toEqual(pilot.scenes.map(strip));
  });
  it('validates and resolves every anchor against estimated timing', () => {
    const story = validateStory(storyScriptSchema.parse(read('stories/titan-pilot.json')), parseAnchoredStoryboard(short));
    const est = estimateAlignment(story.beats.map(b => b.narration).join(' '), 210);
    const r = resolveWordAnchors(short, captionsFromProviderTiming(story, est, est.character_end_times_seconds.at(-1)! + .05, 30));
    expect(r.resolutions.length).toBeGreaterThan(200);
    expect(r.warnings.filter(w => !w.includes('outside scene') && !w.includes('nudged'))).toEqual([]);
  });
  it('keeps notes and characters out of the Shorts UI zones (top bar, bottom title area, right button column)', () => {
    for (const g of storyGroups) {
      for (const a of g.annotations ?? []) {
        const half = a.text.length * a.size * .25;
        expect(a.x - half, `${g.id}/${a.id} left`).toBeGreaterThan(40);
        expect(a.x + half, `${g.id}/${a.id} right`).toBeLessThan(a.y > 960 ? 905 : 1040);
        expect(a.y, `${g.id}/${a.id} y`).toBeGreaterThan(470);
        expect(a.y, `${g.id}/${a.id} y`).toBeLessThan(1400);
      }
      for (const l of g.layers) if (l.kit?.type === 'figure') expect(l.kit.x!).toBeLessThan(.8);
    }
  });
  it('ships a Shorts caption style: burned in, word highlight, clear of the right button column', () => {
    const style = captionStyleSchema.parse(read('config/caption-styles/shorts-paint.json'));
    expect(style.enabled).toBe(true);
    expect(style.highlight).toBe('word');
    expect(style.right).toBeGreaterThanOrEqual(.14);
    expect(style.top).toBeLessThan(.2);
  });
});
