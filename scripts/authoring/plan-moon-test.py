"""Moon demand-test Shorts, 9:16 (26 Nov 2026). A: the Moon used to fill your sky. B: the last total solar eclipse.
Script and facts: stories/moon-shorts-script.md. Picture-first: one continuous shot per Short (the same layers in every
scene, values handed over at each cut), a banner that states the premise all the way through, live counters, a loop.

Usage: python3 scripts/authoring/plan-moon-test.py sky|eclipse [duration_seconds] [output_storyboard]
       python3 scripts/authoring/plan-moon-test.py sky|eclipse --script-only
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes
LIGHT = '#eef1f8'
recipes.INK = LIGHT

ROOT = pathlib.Path(__file__).resolve().parents[2]
NAME = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('sky', 'eclipse') else sys.exit(__doc__)
SID = {'sky': 'moon-filled-sky', 'eclipse': 'last-total-eclipse'}[NAME]
STORY = ROOT / f'stories/{SID}.json'
N, K = 'narrator', 'arka'
SHOTS = []


def line(bid, *parts, intent='explanation'):
    SHOTS.append((bid, intent, list(parts)))


# ------------------------------------------------------------------ scripts (wording approved by Debabrata 26 Nov 2026)
if NAME == 'sky':
    TITLE = 'The Moon Used to Fill Your Sky'
    TOPIC = ('The young Moon was about 20,000 km away and looked about 20 times wider; days were about 5 hours. It has receded ever since '
             '(321,800 km and 16.9 h days 2.46 billion years ago; 3.8 cm a year today); in about 600 million years it will be too small for total solar eclipses')
    line('a1', (N, 'Stand here four and a half billion years ago, and the Moon fills your sky. About twenty times wider than tonight.'), intent='hook')
    line('a2', (N, 'A whole day lasts about five hours.'), intent='hook')
    line('a3', (N, 'Then it starts to leave. A little farther every year. A little smaller. And the days stretch.'))
    line('a4', (N, "Tonight, a pea at arm's length covers it. And it's still going."), intent='payoff')
    line('a5', (N, 'In about six hundred million years, it will be too small to cover the Sun.'), intent='payoff')
    line('a6', (K, 'Go back. I liked it bigger.'), intent='closing')
else:
    TITLE = 'The Last Total Solar Eclipse'
    TOPIC = ('Total solar eclipses exist because the Sun is about 400 times wider than the Moon and about 400 times farther away; the Moon recedes '
             '3.8 cm a year, so in about 600 million years (if that rate holds) it will be too small to cover the Sun')
    line('b1', (N, 'One day, this will happen for the last time.'), intent='hook')
    line('b2', (N, 'It only works by luck. The Sun is about four hundred times wider than the Moon, and about four hundred times farther away. A perfect fit.'))
    line('b3', (N, 'But the Moon is leaving, almost four centimeters a year. Every year, the fit gets worse.'))
    line('b4', (N, "In about six hundred million years, if it keeps that pace, the Moon will be too small. A ring of fire is all that's left."), intent='payoff')
    line('b5', (K, 'So we got the good seats. By accident.'), intent='closing')


def phrases(text, limit=26):
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…:]$', cur): out.append(cur); cur = ''
    return out + ([cur] if cur else [])


def write_story(duration):
    beats = []
    for bid, intent, parts in SHOTS:
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
        assert len(ph) <= 12, bid
        beats.append({'id': bid, 'sceneId': f'{NAME[0]}m-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': SID, 'title': TITLE, 'topic': TOPIC,
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious adults, mostly 25-44', 'durationSeconds': duration,
             'storyboard': f'storyboards/{SID}.json', 'candidatesReport': 'stories/moon-shorts-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    s = write_story(32)
    print('wrote', STORY.name, len(s['beats']), 'beats,', sum(len(b['narration'].split()) for b in s['beats']), 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)

# ------------------------------------------------------------------ storyboard (9:16)
DURATION = int(sys.argv[2]) if len(sys.argv) > 2 else (34 if NAME == 'sky' else 30)
write_story(DURATION)
ep = Episode(str(STORY), 'tall'); F = ep.F; W, H = F['W'], F['H']; MS = min(W, H)
ep.pop_db, ep.deviation_tolerance = -24, .3
ep.theme = 'paint-night'
GOLD, SKY = '#ffd25e', '#a9d8ff'
ep.backdrop(stars=34)
# Music (26 Nov): a different track per Short, started past its fade-in so the first frame already has a mood, a little louder
# than our usual -22 dB, and a half-second of silence before the payoff beat.
if NAME == 'sky': ep.music([('a1', 'assets/music/6-space-singularity.mp3', 10)], dropouts=[('a4', 0, .5)], gain_db=-19, target_lufs=-14)
else: ep.music([('b1', 'assets/music/4-tense-a-false-vacuum-decay.mp3', 14)], dropouts=[('b4', 0, .5)], gain_db=-19, target_lufs=-14)


def P(layer): return Prop(layer, None)
def lv(*keys): return [{'frame': f, 'value': v} for f, v in keys]
def count(pid, x, y, text, keys, size=.15, **layer):
    """A live counter: keys [(frame, value)]; it counts in whole steps between keys."""
    vals = [{'frame': f, 'value': v, 'ramp': True} for f, v in keys]
    return P(prop(pid, 'counter', x, y, size, text=text, values=vals, ink=LIGHT, color=GOLD, **layer))
def banner(text): return P(prop('banner', 'bigword', .5, .085, .062, text=text, color=GOLD))
def big(pid, text, at, y, size=.09, color=GOLD, until=None):
    op = track((0, 0), (plus(at, -1), 0), (at, 1)) if until is None else track((0, 0), (plus(at, -1), 0), (at, 1), (plus(until, -1), 1), (until, 0))
    return P(prop(pid, 'bigword', .5, y, size, text=text, color=color, opacity=op,
                  scale=track((0, .5), (plus(at, -1), .5), (plus(at, 8), 1, 'ease-out-back')), anchor={'x': W / 2, 'y': y * H}))
def end(word, **k): return A(word, edge='end', **k)
def on(a): return track((0, 0), (plus(a, -1), 0), (a, 1))
def off(a): return track((0, 1), (plus(a, -1), 1), (a, 0))
SHORE = .74                                   # everything stays above the Shorts interface (about y 1500)
def shore(): return Prop({'id': 'shore', 'kit': {'type': 'terrain', 'top': SHORE, 'curve': .03, 'fill': '#2b3350', 'detail': '#3a456b', 'rocks': 3, 'bumps': 6, 'seed': 5}}, Box(0, SHORE * H, W, H, 'ground'))
def arka(pose, face): return Char('arka', 'arka', x=.87, fy=SHORE + .03, h=.125, idle=None, poses=[(0, pose)], faces=[(0, face)])

if NAME == 'sky':
    # The Moon's width against today's: 384,400 km / distance. Drawn so that "about 20 times" (20,000 km) is 85% of the frame width.
    BIG = .85; K0 = 384.4 / 20
    def rel(km): return round(384.4 / km / K0, 4)          # level for a distance in thousand km
    NOW, OLD, FUT = rel(384.4), rel(321.8), rel(384.4 + 22.8)   # +22,800 km in 600 million years at 3.8 cm a year (calculated)
    MY, CY = .405, .69
    def stage(level, heat, yrs, km, day, ghost=None, ahead=None):
        """ghost: opacity track of the dashed outline of the young Moon's size. ahead: frame at which "years ago" flips back from "years ahead" (the loop)."""
        out = []
        if ghost: out.append(P(prop('ghost', 'orbit-ring', .5, MY, BIG, ink=LIGHT, opacity=ghost)))
        out += [P({'id': 'hglow', 'kit': {'type': 'glow', 'x': .5, 'y': .6, 'rx': .9, 'ry': .16, 'tone': 'hot'}, 'opacity': [dict(k, value=round(k['value'] * .8, 3)) for k in heat]}),
                P(prop('moon', 'sky-moon', .5, MY, BIG, level=level, level2=heat)),
                P({'id': 'sea', 'kit': {'type': 'water', 'x': -.1, 'y': .6, 'width': 1.3, 'height': .15, 'waves': 5, 'periodFrames': 150, 'seed': 3}}),
                P(prop('glitter', 'moon-glitter', .5, .6, BIG, level=level, level2=heat, count=10)),
                shore(), banner('THE MOON IS SHRINKING')]
        if ahead == 'all': out.append(count('yrs', .15, CY, 'million years ahead', yrs))
        elif ahead: out += [count('yrs-ahead', .15, CY, 'million years ahead', [(0, 600)], opacity=off(ahead)), count('yrs', .15, CY, 'million years ago', yrs, opacity=on(ahead))]
        else: out.append(count('yrs', .15, CY, 'million years ago', yrs))
        out.append(count('km', .405, CY, 'thousand km away', km))
        if day: out.append(count('day', .655, CY, 'hours in a day', day))
        return out
    HOT = lv((0, .7))
    ep.scene('a1', explain([arka('stand', 'shocked')], stage(lv((0, 1)), HOT, [(0, 4500)], [(0, 20)], [(0, 5)]), [], camera_preset=None))
    ep.scene('a2', explain([arka('stand', 'shocked')], stage(lv((0, 1)), HOT, [(0, 4500)], [(0, 20)], [(0, 5)]) + [big('five', '5-HOUR DAYS', A('five'), MY)],
                           [], camera_preset=None, sounds=[('ding', A('five'), -22)]))
    e3 = end('stretch.')
    ep.scene('a3', explain([arka('think', 'sad')],
                           stage(lv((0, 1), (A('leave.'), 1), (end('smaller.'), .09), (e3, OLD)), lv((0, .7), (A('leave.'), .7), (A('farther'), 0)),
                                 [(0, 4500), (A('leave.'), 4500), (e3, 2460)], [(0, 20), (A('leave.'), 20), (e3, 322)], [(0, 5), (A('leave.'), 5), (e3, 17)],
                                 ghost=track((0, 0), (A('leave.'), 0), (A('farther'), .55))),
                           [Note('it used to be THIS big', A('smaller.'), 'note', pos=(540, 1010), color=SKY)], camera_preset=None, sounds=[('whoosh', A('leave.'), -22)]))
    e4 = end('it.')
    ep.scene('a4', explain([arka('point-left', 'neutral')],
                           stage(lv((0, OLD), (e4, NOW)), lv((0, 0)), [(0, 2460), (e4, 0)], [(0, 322), (e4, 384)], [(0, 17), (e4, 24)], ghost=track((0, .55))),
                           [Note('tonight', A('pea'), 'title', pos=(540, 640)), Note('+3.8 cm a year', A('still'), 'note', pos=(540, 1010), color=SKY)], camera_preset=None))
    e5 = end('Sun.')
    ep.scene('a5', explain([arka('think', 'sad')],
                           stage(lv((0, NOW), (e5, FUT)), lv((0, 0)), [(0, 0), (e5, 600)], [(0, 384), (e5, 407)], None, ghost=track((0, .55)), ahead='all')
                           + [big('small', 'TOO SMALL', A('small'), .32, size=.085)],
                           [Note('no more total eclipses', A('cover'), 'note', pos=(540, 1010), color=SKY)], camera_preset=None))
    snap, e6 = A('bigger.'), end('bigger.')
    ep.scene('a6', explain([arka('point-left', 'grin')],
                           stage(lv((0, FUT), (snap, FUT), (e6, 1)), lv((0, 0), (snap, 0), (e6, .7)),
                                 [(0, 4500)], [(0, 407), (snap, 407), (e6, 20)], None, ghost=track((0, .55), (snap, .55), (e6, 0)), ahead=snap),
                           [], camera_preset=None, sounds=[('whoosh', snap, -20)]))
else:
    EY, ES = .43, .6
    def stage(level, yrs, show=0):
        return [P({'id': 'hglow', 'kit': {'type': 'glow', 'x': .5, 'y': SHORE, 'rx': 1.0, 'ry': .1, 'tone': 'hot'}, 'opacity': [dict(k, value=round(.7 * (1 - k['value']), 3)) for k in level]}),
                P(prop('ecl', 'eclipse', .5, EY, ES, text='annular', level=level)), shore(), banner('TOTAL ECLIPSES ARE RUNNING OUT'),
                count('yrs', .5, .675, 'million years ahead', yrs, size=.17, **({'opacity': on(show)} if show else {}))]
    HID = track((0, 0))
    def stage0(): return [P({'id': 'hglow', 'kit': {'type': 'glow', 'x': .5, 'y': SHORE, 'rx': 1.0, 'ry': .1, 'tone': 'hot'}, 'opacity': track((0, .7))}), P(prop('ecl', 'eclipse', .5, EY, ES, text='annular', level=lv((0, 0)))), shore(), banner('TOTAL ECLIPSES ARE RUNNING OUT')]
    ep.scene('b1', explain([arka('stand', 'shocked')], stage0() + [big('last', 'THE LAST ONE', A('last'), EY, size=.075)], [], camera_preset=None,
                           sounds=[('ding', A('last'), -22)]))
    ep.scene('b2', explain([arka('think', 'neutral')], stage0(),
                           [Note('Sun: 400× wider', A('wider'), 'note', pos=(290, 1290), color=GOLD), Note('and 400× farther', A('farther'), 'note', pos=(770, 1290), color=SKY),
                            Note('a perfect fit', A('perfect'), 'title', pos=(540, 826))], camera_preset=None))
    e3 = end('worse.')
    ep.scene('b3', explain([arka('think', 'sad')], stage(lv((0, 0), (A('leaving,'), 0), (e3, .3)), [(0, 0), (A('leaving,'), 0), (e3, 200)], show=A('leaving,')),
                           [Note('3.8 cm a year', A('four'), 'note', pos=(540, 826), color=SKY)], camera_preset=None))
    e4 = end('small.')
    ep.scene('b4', explain([arka('stand', 'shocked')], stage(lv((0, .3), (e4, 1)), [(0, 200), (e4, 600)]) + [big('ring', 'RING OF FIRE', A('ring'), EY, size=.07)],
                           [Note('ring drawn thicker than real', A('ring'), 'label', pos=(540, 1225), size=54)], camera_preset=None, sounds=[('ding', A('ring'), -22)]))
    snap, e5 = A('accident.'), end('accident.')
    ep.scene('b5', explain([arka('point-left', 'grin')], stage(lv((0, 1), (snap, 1), (e5, 0)), [(0, 600), (snap, 600), (e5, 0)]), [], camera_preset=None,
                           sounds=[('whoosh', snap, -20)]))

tag = note('brand-tag', 'GAHANARKA', 200, 1475, 0, size=40, color=GOLD)
tag.pop('opacity', None); tag['pop'] = False; tag['opacity'] = track((0, .85))
ep.backdrop_tag = tag
ep._backdrop.setdefault('annotations', []).append(tag)
for pl in ep.plans.values():
    for n in pl['notes']:
        if n.color == RED: n.color = GOLD if n.kind == 'title' else SKY
for layer in [l for pl in ep.plans.values() for pr in pl['props'] for l in [pr.layer]] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in {'doodle-stars', 'orbit-ring'} and 'ink' not in k: k['ink'] = LIGHT

if __name__ == '__main__':
    path, board = ep.write(sys.argv[3] if len(sys.argv) > 3 else None)
    print('wrote', path.name, sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(pl['notes']) for pl in ep.placements), 'notes placed')
