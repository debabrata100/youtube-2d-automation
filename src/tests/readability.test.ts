import {describe, expect, it} from 'vitest';
import {haloFor, LIGHT_HALO} from '../engine/style/theme';
import {holdShortNotes, readabilityIssues, visibleFrames} from '../engine/storyboard/readability';

const rise = (at: number) => [{frame: 0, value: 0}, {frame: at, value: 0}, {frame: at + 8, value: 1}];
const board = (notes: object[], layers: object[] = [], durationFrames = 300) => ({
  themeId: 'paint-night-gold',
  scenes: [{id: 's1', durationFrames, config: {primary: {asset: 'g1'}}}],
  groups: [{id: 'g1', layers, annotations: notes}],
});

describe('note halo', () => {
  it('uses the dark theme halo behind light text and a light halo behind dark text', () => {
    expect(haloFor('#ffd25e', '#0d1220')).toBe('#0d1220');
    expect(haloFor('#14213d', '#0d1220')).toBe(LIGHT_HALO);
    expect(haloFor('#14213d', undefined)).toBeUndefined();
  });
});

describe('readability audit', () => {
  it('flags a note that is never shown or only flashes before the cut', () => {
    const issues = readabilityIssues(board([
      {id: 'a', text: 'late', variant: 'ink', color: '#ffd25e', x: 900, y: 300, size: 72, opacity: rise(320)},
      {id: 'b', text: 'flash', variant: 'ink', color: '#ffd25e', x: 900, y: 500, size: 72, opacity: rise(280)},
      {id: 'c', text: 'fine', variant: 'ink', color: '#ffd25e', x: 900, y: 700, size: 72, opacity: rise(40)},
    ]));
    expect(issues.filter(i => i.check === 'time').map(i => [i.note, i.level])).toEqual([['late', 'error'], ['flash', 'error']]);
  });
  it('flags dark text on the night page when there is no outline to save it', () => {
    const b = {...board([{id: 'a', text: 'dark', variant: 'ink', color: '#14213d', x: 900, y: 300, size: 72}]), themeId: 'paint-night'};
    expect(readabilityIssues(b).some(i => i.check === 'contrast' && i.level === 'error')).toBe(true);
  });
  it('accepts navy text on a daytime sky', () => {
    const b = board([{id: 'a', text: 'NOON', variant: 'ink', color: '#14213d', x: 900, y: 90, size: 64}], [{id: 'sky', kit: {type: 'prop', item: 'sky', level: [{frame: 0, value: 1}]}}]);
    expect(readabilityIssues(b)).toEqual([]);
  });
});

describe('holdShortNotes', () => {
  it('brings a late note in so it is readable for 1.5 s before the cut, including one timed after the shot ends', () => {
    const b = board([
      {id: 'a', text: 'flash', variant: 'ink', color: '#ffd25e', x: 900, y: 300, size: 72, opacity: rise(285)},
      {id: 'b', text: 'never', variant: 'ink', color: '#ffd25e', x: 900, y: 700, size: 72, opacity: rise(330)},
    ]);
    expect(holdShortNotes(b).map(m => m.note)).toEqual(['flash', 'never']);
    for (const n of b.groups[0].annotations as {opacity: {frame: number; value: number}[]}[]) {
      const w = visibleFrames(n.opacity, 300);
      expect(w.to - w.from).toBeGreaterThanOrEqual(45);
    }
    expect(readabilityIssues(b).filter(i => i.check === 'time')).toEqual([]);
  });
  it('never brings a note in before a nearby note it replaces has gone', () => {
    const b = board([
      {id: 'a', text: 'old', variant: 'ink', color: '#ffd25e', x: 900, y: 300, size: 72, opacity: [...rise(20), {frame: 270, value: 1}, {frame: 278, value: 0}]},
      {id: 'b', text: 'new', variant: 'ink', color: '#ffd25e', x: 900, y: 300, size: 72, opacity: rise(285)},
    ]);
    holdShortNotes(b);
    const nb = (b.groups[0].annotations as {opacity: {frame: number; value: number}[]}[])[1];
    expect(visibleFrames(nb.opacity, 300).from).toBeGreaterThanOrEqual(274);
  });
});
