import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseStoryboard} from '../engine/storyboard/schema';
import {densityGaps, visualEvents} from '../engine/storyboard/density';

const board = () => parseStoryboard(JSON.parse(readFileSync('storyboards/volcano-kit.json', 'utf8')));

describe('visual density', () => {
  it('counts every cut as a visual event', () => {
    const b = board(); let start = 0; const starts = b.scenes.map(s => { const f = start; start += s.durationFrames; return f; });
    const events = visualEvents(b);
    for (const f of starts) expect(events).toContain(f);
    expect(events).toEqual([...events].sort((x, y) => x - y));
  });
  it('flags a long static stretch and passes once something new appears in it', () => {
    const b = board(); const s = b.scenes[0];
    s.durationFrames = 900; s.camera.keyframes = undefined;
    const gaps = densityGaps(b, 6);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps[0]).toMatchObject({scene: s.id});
    expect(gaps[0].seconds).toBeGreaterThan(6);
    const loose = densityGaps(b, 60);
    expect(loose).toEqual([]);
  });
});
