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
    TITLE = 'The Moon Is Leaving Us'
    TOPIC = ('The Moon recedes about 3.8 cm a year; about 4.5 billion years ago it was about 20,000 km away and filled the sky; in about '
             '600 million years (if today\'s rate holds) it will be too small to cover the Sun, ending total solar eclipses')
    line('a1', (N, 'The Moon is leaving us. And nothing can stop it.'), intent='hook')
    line('a2', (N, 'Every year, it slips four centimeters farther away.'), intent='hook')
    line('a3', (N, 'Sounds like nothing. Now rewind.'))
    line('a4', (N, 'Four billion years ago, it filled your sky.'), intent='payoff')
    line('a5', (N, "It's been running ever since. And it's taking something with it."))
    line('a6', (N, "One day, it'll be too small to hide the Sun. Forever."), intent='payoff')
    line('a7', (K, 'Wait. The last eclipse?'), intent='closing')
else:
    TITLE = 'The Last Eclipse'
    TOPIC = ('Total solar eclipses happen because the Moon just covers the Sun; the Moon recedes about 3.8 cm a year, so in about 600 million years '
             '(if that rate holds) it will be too small to cover the Sun')
    line('b1', (N, 'One day, the Sun will go dark for the very last time.'), intent='hook')
    line('b2', (N, "If anyone is still here to watch, they won't know it's the last."), intent='hook')
    line('b3', (N, 'It only works because the Moon fits over the Sun perfectly. By pure luck.'))
    line('b4', (N, 'But the Moon is drifting away. And the shadow is shrinking.'))
    line('b5', (N, "Until the day it can't cover the Sun at all."), intent='payoff')
    line('b6', (K, 'And it used to fill the whole sky?'), intent='closing')


def phrases(text, limit=17):
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
if NAME == 'sky': ep.music([('a1', 'assets/music/6-space-singularity.mp3', 10)], dropouts=[('a4', 0, .5), ('a7', 0, .6)], gain_db=-18, target_lufs=-14)
else: ep.music([('b1', 'assets/music/4-tense-a-false-vacuum-decay.mp3', 14)], dropouts=[('b1', 0, 1.0), ('b6', 0, .6)], gain_db=-18, target_lufs=-14)


def P(layer): return Prop(layer, None)
def lv(*keys): return [{'frame': k[0], 'value': k[1]} for k in keys]
def end(word, **k): return A(word, edge='end', **k)
def on(a): return track((0, 0), (plus(a, -1), 0), (a, 1))
SHORE = .74                                    # everything stays above the Shorts interface (about y 1500)
def shore(): return Prop({'id': 'shore', 'kit': {'type': 'terrain', 'top': SHORE, 'curve': .03, 'fill': '#2b3350', 'detail': '#3a456b', 'rocks': 3, 'bumps': 6, 'seed': 5}}, Box(0, SHORE * H, W, H, 'ground'))
def arka(poses, faces, x=.86): return Char('arka', 'arka', x=x, fy=SHORE + .03, h=.125, idle=None, poses=poses, faces=faces)
# No on-screen text except the captions: the pictures carry the story (Debabrata, 26 Nov).

if NAME == 'sky':
    # The Moon's drawn width = BIG x level. level 1 = the young Moon (about 20,000 km, about 20x tonight's width).
    BIG = .85; K0 = 384.4 / 20
    NOW = round(1 / K0, 4)                     # tonight's Moon at the same scale (a small disc)
    TELE = .5                                  # the hook's "telephoto" Moon: tonight's Moon seen close up
    MY = .405
    def sky(level, heat, sun=None, ecl=None):
        out = [P({'id': 'hglow', 'kit': {'type': 'glow', 'x': .5, 'y': .6, 'rx': .9, 'ry': .16, 'tone': 'hot'}, 'opacity': [dict(k, value=round(k['value'] * .8, 3)) for k in heat]})]
        if sun: out.append(P({'id': 'sunglow', 'kit': {'type': 'glow', 'x': .5, 'y': .62, 'rx': .7, 'ry': .1, 'tone': 'sun'}, 'opacity': sun}))
        out += [P(prop('moon', 'sky-moon', .5, MY, BIG, level=level, level2=heat)),
                P({'id': 'sea', 'kit': {'type': 'water', 'x': -.1, 'y': .6, 'width': 1.3, 'height': .15, 'waves': 5, 'periodFrames': 150, 'seed': 3}}),
                P(prop('glitter', 'moon-glitter', .5, .6, BIG, level=level, level2=heat, count=10)), shore()]
        if ecl: out.append(ecl)
        return out
    COOL = lv((0, 0))
    e1 = end('it.')
    ep.scene('a1', explain([arka([(0, 'stand')], [(0, 'neutral'), (A('leaving'), 'sad')])], sky(lv((0, TELE), (e1, TELE * .93, 'smoothstep')), COOL), [], camera_preset=None,
                           sounds=[('rumble', A('leaving'), -24)]))
    steps = ['Every', 'year,', 'slips', 'four', 'farther']
    keys = [(0, TELE * .93)]
    for k, wd in enumerate(steps): keys += [(plus(A(wd), -1), round(TELE * (.93 - .015 * k), 4)), (A(wd), round(TELE * (.93 - .015 * (k + 1)), 4))]
    ep.scene('a2', explain([arka([(0, 'think')], [(0, 'sad')])], sky(lv(*keys), COOL), [], camera_preset=None, sounds=[('tick', A(wd), -16) for wd in steps]))
    ep.scene('a3', explain([arka([(0, 'shrug')], [(0, 'neutral')])], sky(lv((0, TELE * .855), (A('Sounds'), TELE * .855), (end('nothing.'), NOW, 'smoothstep')), COOL), [], camera_preset=None,
                           sounds=[('rewind', A('rewind.'), -12)]))
    ep.scene('a4', explain([arka([(0, 'panic')], [(0, 'shocked')])], sky(lv((0, NOW), (plus(A('Four'), -1), NOW), (plus(A('Four'), 14), 1, 'ease-out-back')), lv((0, 0), (A('Four'), .8))), [],
                           camera_preset=None, sounds=[('boom', A('Four'), -10)], shake=[(A('Four'), 14, .035)]))
    e5 = end('since.')
    ep.scene('a5', explain([arka([(0, 'stand')], [(0, 'sad')])],
                           sky(lv((0, 1), (A('running'), 1), (e5, NOW, 'smoothstep')), lv((0, .8), (A('running'), .8), (e5, 0)), sun=track((0, 0), (A('taking'), 0), (end('with'), .9))), [],
                           camera_preset=None, sounds=[('riser', A('running'), -16)]))
    ecl = P(prop('ecl', 'eclipse', .5, MY, .5, text='annular', level=lv((0, 0), (A('too'), 0), (end('Sun.'), 1)), opacity=track((0, 0), (8, 1))))
    ep.scene('a6', explain([arka([(0, 'stand')], [(0, 'shocked')])], sky(lv((0, NOW)), COOL, sun=track((0, .9)), ecl=ecl), [], camera_preset=None,
                           sounds=[('slam', A('Forever.'), -10)]))
    ep.scene('a7', explain([arka([(0, 'point-left')], [(0, 'shocked')])],
                           sky(lv((0, NOW), (end('eclipse?'), NOW), (plus(end('eclipse?'), 12), TELE, 'smoothstep')), COOL), [], camera_preset=None,
                           sounds=[('whoosh', end('eclipse?'), -18)]))
else:
    EY = .44
    def ecl_layer(level, zoom):
        return P(prop('ecl', 'eclipse', .5, EY, .6, text='annular', level=level, scale=zoom, anchor={'x': W / 2, 'y': EY * H}))
    def glow(level): return P({'id': 'hglow', 'kit': {'type': 'glow', 'x': .5, 'y': SHORE, 'rx': 1.0, 'ry': .1, 'tone': 'hot'}, 'opacity': [dict(k, value=round(.7 * (1 - k['value']), 3)) for k in level]})
    def stage(level, zoom, extra=()): return [glow(level), ecl_layer(level, zoom), shore(), *extra]
    T0 = lv((0, 0))
    ep.scene('b1', explain([arka([(0, 'stand')], [(0, 'shocked')])], stage(T0, track((0, 1.45), (end('time.'), 1.35, 'smoothstep'))), [], camera_preset=None,
                           sounds=[('heartbeat', A('dark'), -14)]))
    ep.scene('b2', explain([arka([(0, 'stand')], [(0, 'neutral'), (A('last.'), 'sad')], x=.5)], stage(T0, track((0, 1.35), (end('watch,'), 1.0, 'smoothstep'))), [], camera_preset=None,
                           sounds=[('heartbeat', A('know'), -14)]))
    ep.scene('b3', explain([arka([(0, 'think')], [(0, 'neutral')])], stage(T0, track((0, 1.0), (end('luck.'), 1.2, 'smoothstep'))), [], camera_preset=None, sounds=[('chime', A('perfectly.'), -20)]))
    e4 = end('shrinking.')
    ep.scene('b4', explain([arka([(0, 'stand')], [(0, 'sad')])], stage(lv((0, 0), (A('drifting'), 0), (e4, .45)), track((0, 1.2), (e4, 1.05, 'smoothstep'))), [], camera_preset=None,
                           sounds=[('riser', A('drifting'), -16), ('heartbeat', A('shadow'), -12)]))
    e5 = end('all.')
    ep.scene('b5', explain([arka([(0, 'panic')], [(0, 'shocked')])], stage(lv((0, .45), (e5, 1)), track((0, 1.05), (e5, 1.15, 'smoothstep'))), [], camera_preset=None,
                           sounds=[('slam', A('all.'), -10)], shake=[(A('all.'), 12, .025)]))
    ep.scene('b6', explain([arka([(0, 'point-left')], [(0, 'shocked')])], stage(lv((0, 1), (end('sky?'), 1), (plus(end('sky?'), 12), 0)), track((0, 1.15), (end('sky?'), 1.15), (plus(end('sky?'), 12), 1.45, 'smoothstep'))), [],
                           camera_preset=None, sounds=[('whoosh', end('sky?'), -18)]))

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
