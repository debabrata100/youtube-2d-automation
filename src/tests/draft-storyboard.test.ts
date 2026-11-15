import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {draftStoryboard, pickEmphasis, splitFrames} from '../storytelling/draft';
import {storyScriptSchema} from '../storytelling/schema';
import {validateStory} from '../storytelling/validate';
import {parseAnchoredStoryboard, resolveWordAnchors, hasAnchors} from '../storytelling/timing/anchors';
import {estimateAlignment} from '../storytelling/timing/estimate';
import {captionsFromProviderTiming} from '../captions/provider-timing';

const story = storyScriptSchema.parse(JSON.parse(readFileSync('stories/lightning-a.json', 'utf8')));
const mapping = () => {
  const est = estimateAlignment(story.beats.map(b => b.narration).join(' '));
  return captionsFromProviderTiming(story, est, est.character_end_times_seconds.at(-1)! + .05, 30);
};

describe('storyboard drafter', () => {
  it('splits frames by word count, exactly and with a floor', () => {
    expect(splitFrames([10, 10, 20], 400)).toEqual([100, 100, 200]);
    const f = splitFrames([1, 30, 30], 300);
    expect(f.reduce((a, b) => a + b, 0)).toBe(300);
    expect(Math.min(...f)).toBeGreaterThanOrEqual(45);
  });
  it('picks the longest content word when a beat has no emphasis', () => {
    expect(pickEmphasis('It begins inside a storm cloud, where strong winds toss ice upward.')).toBe('upward');
    expect(pickEmphasis('Go up.')).toBeNull();
  });
  it('drafts a valid, deterministic, word-anchored board for every theme', () => {
    for (const themeId of ['explainer-dusk', 'explainer-day', 'explainer-storm']) {
      const a = draftStoryboard(story, {themeId}), b = draftStoryboard(story, {themeId});
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(hasAnchors(a.board)).toBe(true);
      const timed = parseAnchoredStoryboard(a.board);
      expect(() => validateStory({...story, storyboard: 'storyboards/draft.json'}, timed)).not.toThrow();
      const r = resolveWordAnchors(a.board, mapping());
      expect(r.schedule.storyboard.scenes).toHaveLength(story.beats.length);
      expect(r.warnings.filter(w => w.includes('outside'))).toEqual([]);
    }
  });
  it('anchors labels and sounds to emphasis words and hands the camera off between scenes', () => {
    const {board, notes} = draftStoryboard(story, {themeId: 'explainer-storm'});
    expect(notes[0]).toEqual({beat: 'hook', emphasis: ['five times hotter'], autoPicked: false});
    expect(notes[1].autoPicked).toBe(true);
    const r = resolveWordAnchors(board, mapping());
    const hookLabel = r.resolutions.find(x => x.path === 'groups[1].annotations[0].opacity[1].frame')!;
    expect(hookLabel.at).toBe('five times hotter');
    const strike = r.resolutions.find(x => x.path.startsWith('scenes[5].sounds') && x.at === 'white-hot')!;
    expect(strike).toBeTruthy();
    const scenes = r.source.scenes;
    for (let i = 1; i < scenes.length; i++) {
      const prev = scenes[i - 1].camera.keyframes!.at(-1)!, next = scenes[i].camera.keyframes![0];
      expect([next.focus, next.zoom]).toEqual([prev.focus, prev.zoom]);
    }
  });
});
