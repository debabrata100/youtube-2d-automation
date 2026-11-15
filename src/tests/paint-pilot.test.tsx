import {describe, it, expect} from 'vitest';
import React from 'react';
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {accessoryOn, flapPose, poseOf, FACE_IDS} from '../engine/kit/figure';
import {kitSchema} from '../engine/kit/schema';
import {KitElement} from '../engine/kit/KitElement';
import {getTheme} from '../engine/style/theme';
import {boilTile, NOISE_TILES} from '../engine/style/ink';
import {motionEffectSchema} from '../engine/motion/primitives/schema';
import {cuesToSrt, cuesToVtt} from '../captions/srt';
import {storyScriptSchema} from '../storytelling/schema';
import {validateStory} from '../storytelling/validate';
import {parseAnchoredStoryboard, resolveWordAnchors} from '../storytelling/timing/anchors';
import {estimateAlignment} from '../storytelling/timing/estimate';
import {captionsFromProviderTiming} from '../captions/provider-timing';

const theme = getTheme('paint-notebook');
const render = (config: object, frame = 12) => renderToStaticMarkup(<svg><KitElement config={kitSchema.parse(config)} theme={theme} width={1000} height={600} frame={frame} id="k"/></svg>);
const stick = (extra: object = {}) => ({type: 'figure', x: .5, y: .9, height: .5, poses: [{frame: 0, pose: 'stand'}], ...extra});

describe('figure accessories, faces and flapping', () => {
  it('wears accessories only inside their window and draws them', () => {
    const list = [{item: 'mask' as const, from: 10}, {item: 'wings' as const, from: 0, until: 20}];
    expect(accessoryOn(list, 'mask', 9)).toBe(false);
    expect(accessoryOn(list, 'mask', 10)).toBe(true);
    expect(accessoryOn(list, 'wings', 20)).toBe(false);
    expect(accessoryOn(list, 'coat', 50)).toBe(false);
    const plain = render(stick()), dressed = render(stick({accessories: [{item: 'mask'}, {item: 'coat'}, {item: 'wings'}]}));
    expect(dressed.length).toBeGreaterThan(plain.length + 500);
    expect(() => kitSchema.parse(stick({accessories: [{item: 'jetpack'}]}))).toThrow();
  });
  it('flaps as a cycle with arms sweeping and the body bobbing', () => {
    const a = flapPose(0), b = flapPose(4), c = flapPose(16);
    expect(a).toEqual(c);
    expect(a.armR[0]).not.toBeCloseTo(b.armR[0], 1);
    expect(poseOf('flap', 4)).toEqual(b);
    expect(b.lift).toBeGreaterThan(0);
  });
  it('adds comic scream and grin faces', () => {
    expect(FACE_IDS).toEqual(expect.arrayContaining(['scream', 'grin']));
    const scream = render(stick({faces: [{frame: 0, face: 'scream'}]})), neutral = render(stick());
    expect(scream).not.toBe(neutral);
    expect(scream).toContain('#e8707a');
  });
});

describe('props, drops and line boil', () => {
  it('animates the thermometer level and validates prop items', () => {
    const t = (frame: number) => render({type: 'prop', item: 'thermometer', x: .5, y: .5, size: .5, level: [{frame: 0, value: .8}, {frame: 20, value: .1}]}, frame);
    expect(t(0)).not.toBe(t(20));
    expect(t(30)).toBe(t(20));
    for (const item of ['pressure-arrows', 'motion-lines', 'exclaim', 'question', 'check', 'cross']) expect(render({type: 'prop', item, x: .5, y: .5, size: .2})).toContain('<path');
    expect(() => kitSchema.parse({type: 'prop', item: 'anvil', x: .5, y: .5, size: .2})).toThrow();
  });
  it('accepts drop-shaped particles with an outline', () => {
    const e = motionEffectSchema.parse({id: 'r', type: 'particles', count: 4, seed: 1, startFrame: 0, endFrame: 10, emitter: {x: .5, y: 0}, lifetimeFrames: [5, 8],
      velocity: {angleDegrees: 90, speed: [.01, .02]}, radius: [.005, .01], colors: ['#e8a54b'], shape: 'drop', outline: '#1d1d1f'});
    expect(e).toMatchObject({shape: 'drop', outline: '#1d1d1f'});
  });
  it('cycles four bundled noise tiles deterministically for the boil', () => {
    expect(NOISE_TILES).toHaveLength(4);
    expect(boilTile(5)).toEqual(boilTile(5));
    expect(new Set([0, 1, 2, 3].map(t => boilTile(t).index)).size).toBe(4);
    expect(boilTile(1).dx).toBeGreaterThanOrEqual(0);
    expect(boilTile(1).dx).toBeLessThan(1);
  });
});

describe('caption export', () => {
  const cues = [{id: 'a-1', beatId: 'a', startFrame: 3, endFrame: 75, lines: ['Hello there,', 'friend.'], timingBasis: 'test'},
    {id: 'a-2', beatId: 'a', startFrame: 75, endFrame: 3720, lines: ['Bye.'], timingBasis: 'test'}];
  it('writes SRT and WebVTT with correct timestamps', () => {
    expect(cuesToSrt(cues as never, 30)).toBe('1\n00:00:00,100 --> 00:00:02,500\nHello there,\nfriend.\n\n2\n00:00:02,500 --> 00:02:04,000\nBye.\n');
    expect(cuesToVtt(cues as never, 30).startsWith('WEBVTT\n\n00:00:00.100 --> 00:00:02.500\n')).toBe(true);
  });
});

describe('Titan pilot storyboard', () => {
  it('validates and resolves every anchor against estimated timing', () => {
    const raw = JSON.parse(readFileSync('storyboards/titan-pilot.json', 'utf8'));
    const story = validateStory(storyScriptSchema.parse(JSON.parse(readFileSync('stories/titan-pilot.json', 'utf8'))), parseAnchoredStoryboard(raw));
    expect(story.beats).toHaveLength(8);
    const est = estimateAlignment(story.beats.map(b => b.narration).join(' '));
    const r = resolveWordAnchors(raw, captionsFromProviderTiming(story, est, est.character_end_times_seconds.at(-1)! + .05, 30));
    expect(r.resolutions.length).toBeGreaterThan(200);
    expect(r.source.format).toEqual({width: 1920, height: 1080, fps: 30});
    expect(r.warnings.filter(w => !w.includes('outside scene') && !w.includes('nudged'))).toEqual([]);
  });
});
