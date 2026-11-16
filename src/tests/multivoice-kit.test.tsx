import {describe, it, expect} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {assembleTakes, decodeWav16, fullNarration, speakerRuns, speakerScripts, storySpeakers} from '../audio/multivoice';
import {encodeWav} from '../audio/synth';
import {storyBeatSchema} from '../storytelling/schema';
import {kitSchema} from '../engine/kit/schema';
import {KitElement} from '../engine/kit/KitElement';
import {counterAt} from '../engine/kit/Paint';
import {flushAt, helmetOn} from '../engine/kit/FigureElement';
import {getTheme} from '../engine/style/theme';
import {layerStateAt} from '../engine/motion/layers';
import {layerSchema} from '../engine/storyboard/layers';

const beats = [
  {narration: 'Take it off. You have fifteen seconds. Wait, what?', phrases: ['Take it off.', 'You have fifteen seconds.', 'Wait, what?'], phraseSpeakers: ['narrator', 'narrator', 'arka']},
  {narration: 'Fifteen. Breathe out.', phrases: ['Fifteen.', 'Breathe out.']},
  {narration: 'Helmet on? Helmet on.', phrases: ['Helmet on?', 'Helmet on.'], phraseSpeakers: ['arka', 'narrator']},
];
/** A fake provider take: each character lasts 50 ms after a 200 ms lead-in, with a 400 ms pause after sentence ends. */
const fakeTake = (text: string, rate = 24000) => {
  const characters = Array.from(text), starts: number[] = [], ends: number[] = [];
  let t = .2;
  characters.forEach((ch, i) => { starts.push(t); t += .05; ends.push(t); if (/[.?!]/.test(ch) && characters[i + 1] === ' ') t += .4; });
  const samples = new Float32Array(Math.round((t + .3) * rate)).map((_, i) => Math.sin(i / 7) * .3);
  return {samples, sampleRate: rate, alignment: {characters, character_start_times_seconds: starts, character_end_times_seconds: ends}};
};

describe('multi-voice narration', () => {
  it('splits a story into speaker runs and per-speaker scripts', () => {
    expect(storySpeakers(beats)).toEqual(['narrator', 'arka']);
    const runs = speakerRuns(beats), full = fullNarration(beats);
    expect(runs.map(r => r.speaker)).toEqual(['narrator', 'arka', 'narrator', 'arka', 'narrator']);
    for (const r of runs) expect(full.slice(r.start, r.end)).toBe(r.text);
    // Narrator continues across the beat boundary: one run, one natural stretch of speech.
    expect(runs[2].text).toBe('Fifteen. Breathe out.');
    const scripts = speakerScripts(runs);
    expect(scripts.get('arka')!.text).toBe('Wait, what? Helmet on?');
    expect(scripts.get('narrator')!.text).toBe('Take it off. You have fifteen seconds. Fifteen. Breathe out. Helmet on.');
  });
  it('joins takes in story order with monotonic timings for every character of the full text', () => {
    const scripts = speakerScripts(speakerRuns(beats));
    const takes = Object.fromEntries([...scripts].map(([k, s]) => [k, fakeTake(s.text)]));
    const out = assembleTakes(beats, takes);
    const a = out.alignment, full = fullNarration(beats);
    expect(a.characters.join('')).toBe(full);
    for (let i = 1; i < full.length; i++) { expect(a.character_start_times_seconds[i]).toBeGreaterThanOrEqual(a.character_end_times_seconds[i - 1] - 1e-9); expect(a.character_end_times_seconds[i]).toBeGreaterThanOrEqual(a.character_start_times_seconds[i]); }
    // Arka's "Wait" comes after the narrator's "seconds." and before "Fifteen."
    const at = (word: string) => a.character_start_times_seconds[full.indexOf(word)];
    expect(at('Wait')).toBeGreaterThan(at('seconds'));
    expect(at('Fifteen')).toBeGreaterThan(at('Wait'));
    expect(out.samples.length / out.sampleRate).toBeGreaterThan(a.character_end_times_seconds.at(-1)!);
  });
  it('refuses a take recorded from different text', () => {
    const scripts = speakerScripts(speakerRuns(beats));
    const takes = Object.fromEntries([...scripts].map(([k, s]) => [k, fakeTake(k === 'arka' ? 'Something else.' : s.text)]));
    expect(() => assembleTakes(beats, takes)).toThrow(/does not match/);
  });
  it('round-trips 16-bit WAV', () => {
    const samples = new Float32Array([0, .5, -.5, .25]);
    const back = decodeWav16(encodeWav(samples, 24000));
    expect(back.sampleRate).toBe(24000);
    expect(Array.from(back.samples).map(v => +v.toFixed(3))).toEqual([0, .5, -.5, .25]);
  });
  it('validates speaker tags in story beats', () => {
    expect(() => storyBeatSchema.parse({id: 'a', sceneId: 's', intent: 'hook', ...beats[0]})).not.toThrow();
    expect(() => storyBeatSchema.parse({id: 'a', sceneId: 's', intent: 'hook', ...beats[0], phraseSpeakers: ['narrator']})).toThrow();
    expect(() => storyBeatSchema.parse({id: 'a', sceneId: 's', intent: 'hook', narration: 'Take it off.  Wait, what?', phrases: ['Take it off.', 'Wait, what?'], phraseSpeakers: ['narrator', 'arka']})).toThrow();
  });
});

const theme = getTheme('paint-notebook');
const render = (config: object, frame = 12) => renderToStaticMarkup(<svg><KitElement config={kitSchema.parse(config)} theme={theme} width={1000} height={600} frame={frame} id="k"/></svg>);

describe('space-episode kit additions', () => {
  it('counts down in held steps or in real time with ramp', () => {
    const held = [{frame: 0, value: 15}, {frame: 30, value: 12}, {frame: 60, value: 0}];
    expect([0, 29, 30, 59, 60, 90].map(f => counterAt(held, f))).toEqual([15, 15, 12, 12, 0, 0]);
    const ramp = [{frame: 0, value: 15, ramp: true}, {frame: 150, value: 0}];
    expect([0, 1, 10, 11, 75, 149, 150].map(f => counterAt(ramp, f))).toEqual([15, 15, 14, 14, 8, 1, 0]);
    const svg = render({type: 'prop', item: 'counter', x: .5, y: .3, size: .2, values: held, text: 'seconds'}, 31);
    expect(svg).toContain('>12<');
    expect(svg).toContain('seconds');
  });
  it('draws stamp, vignette, station, helmet and outward arrows', () => {
    expect(render({type: 'prop', item: 'stamp', x: .5, y: .5, size: .2, text: 'myth'})).toContain('MYTH');
    expect(render({type: 'prop', item: 'vignette', x: .5, y: .5, size: .2, level: [{frame: 0, value: 1}]})).toContain('radialGradient');
    expect(render({type: 'prop', item: 'station', x: .5, y: .5, size: .3, level: [{frame: 0, value: 0}, {frame: 10, value: 1}]}).length).toBeGreaterThan(800);
    expect(render({type: 'prop', item: 'helmet', x: .5, y: .5, size: .1})).toContain('<circle');
    const inward = render({type: 'prop', item: 'pressure-arrows', x: .5, y: .5, size: .3}), outward = render({type: 'prop', item: 'pressure-arrows', x: .5, y: .5, size: .3, direction: 'out'});
    expect(outward).not.toBe(inward);
  });
  it('takes the helmet off, flushes the skin and adds puffed, tongue and asleep faces', () => {
    const keys = [{frame: 10, on: false}, {frame: 50, on: true}];
    expect([0, 10, 49, 50].map(f => helmetOn(keys, f))).toEqual([true, false, false, true]);
    expect(flushAt([{frame: 0, value: 0}, {frame: 10, value: 1}], 5)).toBeCloseTo(.5);
    const astro = (frame: number) => render({type: 'figure', x: .5, y: .9, height: .5, outfit: 'astronaut', poses: [{frame: 0, pose: 'stand'}], helmet: keys}, frame);
    expect(astro(20).length).toBeLessThan(astro(0).length);
    for (const face of ['puffed', 'tongue', 'asleep']) expect(() => render({type: 'figure', x: .5, y: .9, height: .5, poses: [{frame: 0, pose: 'stand'}], faces: [{frame: 0, face}]})).not.toThrow();
  });
  it('rotates layers around their anchor', () => {
    const layer = layerSchema.parse({id: 'h', kit: {type: 'prop', item: 'helmet', x: .5, y: .5, size: .1}, rotate: [{frame: 0, value: 0}, {frame: 20, value: 180}]});
    expect(layerStateAt(layer, 0).rotate).toBe(0);
    expect(layerStateAt(layer, 20).rotate).toBe(180);
  });
});

describe('multi-voice level matching', () => {
  it('scales a louder second voice down to the narrator level', () => {
    const scripts = speakerScripts(speakerRuns(beats));
    const takes = Object.fromEntries([...scripts].map(([k, s]) => { const t = fakeTake(s.text); if (k === 'arka') t.samples = t.samples.map(v => v * 1.4); return [k, t]; }));
    const out = assembleTakes(beats, takes);
    expect(out.gains.narrator).toBe(1);
    expect(out.gains.arka).toBeCloseTo(1 / 1.4, 2);
    expect(assembleTakes(beats, takes, {matchLevels: false}).gains.arka).toBe(1);
  });
});
