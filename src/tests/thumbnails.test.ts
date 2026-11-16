import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {PRICE, fullPrompt} from '../../scripts/generate-thumbnail-art';
import {filterGraph, overlaySchema} from '../../scripts/compose-thumbnail';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('thumbnail pipeline', () => {
  it('prices every model/quality/size combination used by the specs', () => {
    for (const id of ['helmet-off', 'titan']) {
      const s = read(`thumbnails/${id}.json`);
      expect(PRICE[s.model][s.quality][s.size]).toBeGreaterThan(0);
      expect(s.variants.length * PRICE[s.model][s.quality][s.size]).toBeLessThan(1);
    }
  });
  it('builds prompts from the shared style, adding character sheets only when mentioned (any case)', () => {
    const style = read('config/thumbnail-style.json');
    const p = fullPrompt(style, 'On Titan.', 'The astronaut waves.');
    expect(p).toContain('no text');
    expect(p).toContain('the astronaut:');
    expect(p).not.toContain('Arka:');
    expect(fullPrompt(style, 'In space.', 'Arka reaches out.')).toContain('Arka:');
  });
  it('crops 3:2 art to 16:9 at the focus and letters each line from a text file', () => {
    const overlay = overlaySchema.parse(read('thumbnails/helmet-off.json').overlay);
    const g = filterGraph(1536, 1024, overlay, '/f.ttf', ['/t0', '/t1']);
    expect(g.startsWith('crop=1536:864:0:72,scale=1280:720')).toBe(true);
    expect(g.match(/drawtext=/g)!.length).toBe(2);
    expect(g).toContain("textfile='/t1'");
    expect(() => overlaySchema.parse({lines: [{text: 'x'.repeat(30), x: 0, y: 0, size: 50}]})).toThrow();
  });
});
