import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {storyScriptSchema} from '../storytelling/schema';
import {validateStory} from '../storytelling/validate';
import {parseAnchoredStoryboard, resolveWordAnchors} from '../storytelling/timing/anchors';
import {estimateAlignment} from '../storytelling/timing/estimate';
import {captionsFromProviderTiming} from '../captions/provider-timing';
import {speakerRuns, storySpeakers} from '../audio/multivoice';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe.each([['helmet-off', 1920, 1080, 9], ['helmet-off-short', 1080, 1920, 6]])('Episode 2 %s storyboard', (id, w, h, beats) => {
  const raw = read(`storyboards/${id}.json`), input = read(`stories/${id}.json`);
  it('validates and resolves every anchor against estimated timing', () => {
    const story = validateStory(storyScriptSchema.parse(input), parseAnchoredStoryboard(raw));
    expect(story.beats).toHaveLength(beats);
    expect(raw.format).toEqual({width: w, height: h, fps: 30});
    const est = estimateAlignment(story.beats.map(b => b.narration).join(' '), 210);
    const r = resolveWordAnchors(raw, captionsFromProviderTiming(story, est, est.character_end_times_seconds.at(-1)! + .05, 30));
    expect(r.resolutions.length).toBeGreaterThan(80);
    expect(r.warnings.filter(x => !x.includes('outside scene') && !x.includes('nudged') && !x.includes('clamped'))).toEqual([]);
  });
  it('is a narrator + Arka story with Arka in short turns', () => {
    const story = storyScriptSchema.parse(input);
    expect(storySpeakers(story.beats).sort()).toEqual(['arka', 'narrator']);
    const arka = speakerRuns(story.beats).filter(r => r.speaker === 'arka');
    expect(arka.length).toBeGreaterThan(0);
    for (const run of arka) expect(run.text.split(' ').length).toBeLessThanOrEqual(6);
  });
});

describe('Episode 2 Short layout', () => {
  it('keeps notes out of the Shorts UI zones', () => {
    const raw = read('storyboards/helmet-off-short.json');
    for (const g of raw.groups.filter((x: {id: string}) => x.id !== 'backdrop')) for (const a of g.annotations ?? []) {
      const half = a.text.length * a.size * .25;
      expect(a.x - half, `${g.id}/${a.id}`).toBeGreaterThan(40);
      expect(a.x + half, `${g.id}/${a.id}`).toBeLessThan(a.y > 960 ? 905 : 1040);
      expect(a.y, `${g.id}/${a.id}`).toBeGreaterThan(470);
      expect(a.y, `${g.id}/${a.id}`).toBeLessThan(1400);
    }
  });
});
