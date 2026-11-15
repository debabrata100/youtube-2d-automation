import {describe, it, expect} from 'vitest';
import React from 'react';
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {FACE_IDS, POSE_IDS, POSES, faceAt, isBlinking, mixPose, poseAt, poseOf, skeleton, PROPORTIONS} from '../engine/kit/figure';
import {kitSchema} from '../engine/kit/schema';
import {KitElement} from '../engine/kit/KitElement';
import {getTheme, themeIds, contrastRatio} from '../engine/style/theme';
import {storyScriptSchema} from '../storytelling/schema';
import {validateStory} from '../storytelling/validate';
import {parseAnchoredStoryboard, resolveWordAnchors} from '../storytelling/timing/anchors';
import {estimateAlignment} from '../storytelling/timing/estimate';
import {captionsFromProviderTiming} from '../captions/provider-timing';

const theme = getTheme('paint-notebook');
const figure = (extra: object = {}) => kitSchema.parse({type: 'figure', x: .5, y: .9, height: .5, poses: [{frame: 0, pose: 'stand'}], ...extra});

describe('stick-figure rig', () => {
  it('defines every pose and face, with standing height equal to the requested height', () => {
    for (const id of POSE_IDS) expect(poseOf(id, 7)).toBeTruthy();
    expect(FACE_IDS).toContain('shocked');
    const s = skeleton(POSES.stand, 600);
    expect(Math.abs((s.head.y - s.headR) + 600)).toBeLessThan(600 * .04);   // head top near -h
    expect(Math.abs(Math.max(s.footL.y, s.footR.y))).toBeLessThan(600 * .01); // feet on the baseline
    expect(PROPORTIONS.head).toBeGreaterThan(.1);
  });
  it('blends poses along the shorter way round and settles after the blend window', () => {
    const a = {...POSES.stand, armR: [170, 170] as [number, number]}, b = {...POSES.stand, armR: [-170, -170] as [number, number]};
    expect(mixPose(a, b, .5).armR[0]).toBeCloseTo(180, 5);
    const keys = [{frame: 0, pose: 'stand' as const, blend: 8, ease: 'linear' as const}, {frame: 20, pose: 'cheer' as const, blend: 10, ease: 'linear' as const}];
    expect(poseAt(keys, 19)).toEqual(POSES.stand);
    expect(poseAt(keys, 25).armR[0]).toBeCloseTo((POSES.stand.armR[0] + POSES.cheer.armR[0]) / 2, 5);
    expect(poseAt(keys, 40)).toEqual(POSES.cheer);
  });
  it('switches faces on their frames and blinks deterministically', () => {
    expect(faceAt([{frame: 0, face: 'happy'}, {frame: 10, face: 'shocked'}], 9)).toBe('happy');
    expect(faceAt([{frame: 0, face: 'happy'}, {frame: 10, face: 'shocked'}], 10)).toBe('shocked');
    const blinks = Array.from({length: 600}, (_, f) => isBlinking(f, 3));
    expect(blinks).toEqual(Array.from({length: 600}, (_, f) => isBlinking(f, 3)));
    const count = blinks.filter((b, i) => b && !blinks[i - 1]).length;
    expect(count).toBeGreaterThanOrEqual(4);
    expect(count).toBeLessThanOrEqual(9);
  });
  it('validates figure, planet and terrain kit elements', () => {
    expect(figure().type).toBe('figure');
    expect(() => figure({poses: [{frame: 5, pose: 'stand'}, {frame: 5, pose: 'wave'}]})).toThrow();
    expect(() => figure({poses: [{frame: 0, pose: 'moonwalk'}]})).toThrow();
    expect(kitSchema.parse({type: 'planet', x: .5, y: .5, radius: .2, base: '#d9614a', ring: true, bands: ['#ffffff']}).type).toBe('planet');
    expect(() => kitSchema.parse({type: 'terrain', top: .8, fill: 'red', detail: '#ffffff'})).toThrow();
  });
  it('renders stick figures, astronauts, planets and terrain to SVG deterministically', () => {
    const render = (config: object, frame = 12) => renderToStaticMarkup(<svg><KitElement config={kitSchema.parse(config)} theme={theme} width={1000} height={600} frame={frame} id="k"/></svg>);
    const stick = {type: 'figure', x: .5, y: .9, height: .5, poses: [{frame: 0, pose: 'stand'}, {frame: 10, pose: 'panic'}], faces: [{frame: 0, face: 'shocked'}]};
    expect(render(stick)).toBe(render(stick));
    expect(render(stick)).not.toBe(render(stick, 0));
    expect(render({...stick, outfit: 'astronaut'})).toContain('fill-opacity');
    expect(render({type: 'planet', x: .5, y: .5, radius: .3, base: '#d9614a', craters: 6, ring: true})).toContain('clipPath');
    expect(render({type: 'terrain', top: .8, fill: '#d9614a', detail: '#ef9a7f', rocks: 3})).toContain('path');
  });
});

describe('paint-notebook theme and the Mars test clip', () => {
  it('registers a readable hand-drawn theme with line boil and no burned-in captions', () => {
    expect(themeIds()).toContain('paint-notebook');
    expect(theme.ink?.amplitude).toBeGreaterThan(0);
    expect(theme.caption.enabled).toBe(false);
    expect(contrastRatio(theme.palette.text.accent, '#ffffff')).toBeGreaterThan(4.5);
    expect(contrastRatio(theme.palette.text.fill, '#ffffff')).toBeGreaterThan(12);
  });
  it('is a 16:9 word-anchored storyboard that validates and resolves against estimated timing', () => {
    const raw = JSON.parse(readFileSync('storyboards/mars-paint-test.json', 'utf8'));
    const story = validateStory(storyScriptSchema.parse(JSON.parse(readFileSync('stories/mars-paint-test.json', 'utf8'))), parseAnchoredStoryboard(raw));
    expect(raw.format).toEqual({width: 1920, height: 1080, fps: 30});
    const est = estimateAlignment(story.beats.map(b => b.narration).join(' '));
    const r = resolveWordAnchors(raw, captionsFromProviderTiming(story, est, est.character_end_times_seconds.at(-1)! + .05, 30));
    expect(r.resolutions.length).toBeGreaterThan(80);
    expect(r.source.assets).toEqual([]);
    expect(r.warnings.filter(w => !w.includes('outside scene'))).toEqual([]);
  });
});
