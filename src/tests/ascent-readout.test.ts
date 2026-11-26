import {describe, expect, it} from 'vitest';
import {ascentMapping, formatReadout, readoutRowValue, skyColorAt} from '../engine/kit/Ascent';
import {kitSchema} from '../engine/kit/schema';
import {storyScriptSchema} from '../storytelling/schema';

describe('readout (M3.8)', () => {
  it('formats the elevator milestones from the fact sheet', () => {
    expect(formatReadout(828 / 3.5, 'int')).toBe('237');
    expect(formatReadout(419000 / 3.5, 'int')).toBe('119,714');
    expect(formatReadout(8849, 'distance')).toBe('8,849 m');
    expect(formatReadout(10700, 'distance')).toBe('10.7 km');
    expect(formatReadout(419000, 'distance')).toBe('419 km');
    expect(formatReadout(828 / 21, 'duration')).toBe('39 s');
    expect(formatReadout(8849 / 21, 'duration')).toBe('7 min 01 s');
    expect(formatReadout(100000 / 21, 'duration')).toBe('1 h 19 min');
    expect(formatReadout(419000 / 21, 'duration')).toBe('5 h 32 min');   // 5 h 32.5 min: the fact sheet rounds to 5 h 33 min
    expect(formatReadout(419000 / 10, 'duration')).toBe('11 h 38 min');
    expect(formatReadout(6.2, 'percent')).toBe('6.2%');
    expect(formatReadout(.00003, 'percent')).toBe('<0.01%');
    expect(formatReadout(-42, 'celsius')).toBe('−42 °C');
  });
  it('derives rows from one track by scale or curve', () => {
    expect(readoutRowValue({scale: 1 / 21}, 210)).toBeCloseTo(10);
    const curve: Array<[number, number]> = [[0, 100], [828, 91], [8849, 31]];
    expect(readoutRowValue({scale: 1, curve}, 828)).toBe(91);
    expect(readoutRowValue({scale: 1, curve}, 9000)).toBe(31);
    expect(readoutRowValue({scale: 1, curve}, 414)).toBeCloseTo(95.5);
  });
  it('validates readout and ascent kit configs', () => {
    expect(kitSchema.safeParse({type: 'readout', x: .5, y: .05, width: .6, value: [{frame: 0, value: 0}], rows: [{label: 'FLOOR', format: 'int', big: true}]}).success).toBe(true);
    expect(kitSchema.safeParse({type: 'ascent', altitude: [{frame: 0, value: 0}, {frame: 30, value: 828}], markers: [{kind: 'tower', altitude: 828}]}).success).toBe(true);
    expect(kitSchema.safeParse({type: 'ascent', altitude: [{frame: 30, value: 0}, {frame: 10, value: 1}]}).success).toBe(false);
  });
});

describe('ascent mapping', () => {
  it('puts the car altitude on the car floor and higher altitudes above it, one decade per `decade` heights', () => {
    const m = ascentMapping({carY: .6, decade: .5, offset: 50}, 950, 1000);
    expect(m.y(950)).toBeCloseTo(600);
    expect(m.y(9950)).toBeCloseTo(100);
    expect(m.altitudeAt(100)).toBeCloseTo(9950);
  });
  it('darkens the sky with altitude', () => {
    const stops = [{altitude: 0, color: '#8fd0f4'}, {altitude: 100000, color: '#000000'}];
    expect(skyColorAt(stops, 0)).toBe('#8fd0f4');
    expect(skyColorAt(stops, 200000)).toBe('#000000');
    expect(parseInt(skyColorAt(stops, 20000).slice(5), 16)).toBeLessThan(0xf4);
  });
});

describe('one-beat stories', () => {
  it('allow a no-narration Short whose single line closes it', () => {
    const beat = {id: 'e1', sceneId: 's', intent: 'closing', narration: "I'll take the stairs.", phrases: ["I'll take the stairs."], phraseSpeakers: ['arka']};
    const base = {schemaVersion: '1.0', id: 'x', title: 'X', topic: 'x', language: 'en-US', targetAudience: 'x', durationSeconds: 10, storyboard: 'storyboards/x.json', beats: [beat]};
    expect(storyScriptSchema.safeParse(base).success).toBe(true);
  });
});
