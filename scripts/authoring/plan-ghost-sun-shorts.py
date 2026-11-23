"""Ghost Sun Shorts (9:16), cut from Ep 5's approved narration (jobs/gs-narration-sting): no paid audio.

  gone     "What If the Sun Disappeared for 8 Minutes?"   the opening paradox (s1-s6)        -> Related video: Ep 5
  air      "Without the Sun, the Air Would Snow Down"      minus 70, minus 240, air snow (s44-s56) -> Ep 5
  voyager  "If the Sun Disappeared, Who'd Notice Last?"  the shell of darkness (s15-s27)    -> Ep 5 (also in the Voyager playlist)

Every line is copied exactly from stories/ghost-sun-script.md (the approved Ep 5 script); cut-narration.py checks each one
against the cached narration's text. Each Short shows its hook as text from frame 0 (pocket hook), ends on a line that
runs back into its first line (loop), and carries the small GAHANARKA corner tag and a soft chime under the last line
(no brand sting in Shorts).

Usage: python3 scripts/authoring/plan-ghost-sun-shorts.py <short> --script-only      (story + cut spec)
       python3 scripts/cut-narration.py stories/ghost-sun-<short>-cut.json jobs/gss-<short>-narration
       python3 scripts/authoring/plan-ghost-sun-shorts.py <short> <duration_seconds>  (storyboard, after the cut)
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes

ROOT = pathlib.Path(__file__).resolve().parents[2]
N, K = 'narrator', 'arka'
EP5 = 'jobs/gs-narration-sting'

SHORTS = {
    'gone': dict(id='ghost-sun-gone', title='What If the Sun Disappeared for 8 Minutes?', prefix='gg',
                 topic=("Sunlight takes 8 min 20 s to reach Earth; if the Sun vanished for exactly 8 min 20 s, Earth would go dark at the "
                        "moment the Sun was already back. Cut from Ep 5 (If the Sun Disappeared, Even the Air Would Fall)."),
                 beats=[('g1', 'hook', [(N, "It's twelve o'clock, noon. The Sun is shining. And it's already gone.")]),
                        ('g2', 'setup', [(K, "it's right there. I can see it. I'm literally getting a tan.")]),
                        ('g3', 'explanation', [(N, "What you're seeing is a ghost. The light hitting your face left the Sun eight minutes and twenty seconds ago.")]),
                        ('g4', 'explanation', [(N, "So let's try an experiment. The Sun disappears for exactly eight minutes and twenty seconds. Then it comes back.")]),
                        ('g5', 'payoff', [(N, "And here's the twist. At the very moment the lights go out on Earth, the Sun is already back. We just can't see it yet.")]),
                        ('g6', 'explanation', [(K, "So by the time we notice it's gone... it's not gone anymore?")]),
                        ('g7', 'closing', [(N, 'Exactly.')])]),
    'air': dict(id='ghost-sun-air', title='Without the Sun, the Air Would Snow Down', prefix='ga',
                topic=("If the Sun vanished for good, Earth would cool to about -70 C within a year and settle near -240 C over millions of years; "
                       "nitrogen and oxygen would freeze and fall as snow and frost. Cut from Ep 5."),
                beats=[('a1', 'hook', [(N, 'The air itself freezes, and falls.')]),
                       ('a2', 'setup', [(N, "Twelve o'clock, noon: the Sun vanishes.")]),
                       ('a3', 'explanation', [(N, "A year later, the average temperature on Earth's surface would be around minus seventy degrees Celsius.")]),
                       ('a4', 'explanation', [(N, "It settles at around minus two hundred and forty degrees. That's colder than Pluto is today.")]),
                       ('a5', 'payoff', [(N, 'Nitrogen and oxygen drift down as snow and frost, and lie on the ground in a thin, frozen layer.')]),
                       ('a6', 'explanation', [(K, "The air... falls down? So there's no sky anymore?")]),
                       ('a7', 'closing', [(N, 'No sky. No wind. Just stars, all the way down to the ground.')])]),
    'voyager': dict(id='ghost-sun-voyager', title='If the Sun Disappeared, Who'd Notice Last?', prefix='gv',
                    topic=("The missing light of a vanished Sun travels outward as a shell of darkness: Mars after ~13 min, Jupiter ~43 min, "
                           "Neptune ~4 h, Voyager 1 (one light-day away) a day later. Cut from Ep 5."),
                    beats=[('v1', 'hook', [(N, "Twelve o'clock, noon: the Sun vanishes.")]),
                           ('v2', 'setup', [(N, 'Then the whole daytime side of Earth goes dark at once.')]),
                           ('v3', 'explanation', [(N, "But the darkness doesn't stop at Earth.")]),
                           ('v4', 'explanation', [(N, 'About thirteen minutes after the Sun vanishes, the darkness reaches Mars. After forty-three minutes, Jupiter. After four hours, Neptune.')]),
                           ('v5', 'payoff', [(N, 'And a full day later, it reaches the farthest thing humans have ever built. Voyager 1 is now one light-day from Earth.')]),
                           ('v6', 'explanation', [(N, 'Out there, the Sun is just a bright star, and for eight minutes, it would go missing.')]),
                           ('v7', 'closing', [(K, 'So Voyager would be the last one to find out. Classic.')])]),
}


def phrases(text, limit=26):
    """Caption phrases for the tall frame: break at sentence ends, otherwise before a word that would pass `limit`."""
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…:]$', cur): out.append(cur); cur = ''
    return out + ([cur] if cur else [])


def write_story(key, duration):
    s = SHORTS[key]; beats, segments = [], []
    for bid, intent, parts in s['beats']:
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
            segments.append({'source': EP5, 'text': text})
        assert len(ph) <= 12, bid
        beats.append({'id': bid, 'sceneId': f"{s['prefix']}-{bid}", 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': s['id'], 'title': s['title'], 'topic': s['topic'], 'language': 'en-US',
             'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': f"storyboards/{s['id']}.json", 'candidatesReport': 'stories/ghost-sun-script.md', 'beats': beats}
    (ROOT / f"stories/{s['id']}.json").write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    (ROOT / f"stories/{s['id']}-cut.json").write_text(json.dumps({'id': s['id'], 'segments': segments}, indent=1, ensure_ascii=False) + '\n')
    return story


if len(sys.argv) < 3 or sys.argv[1] not in SHORTS: sys.exit(__doc__)
KEY = sys.argv[1]
if sys.argv[2] == '--script-only':
    st = write_story(KEY, 40)
    print('wrote', st['id'], len(st['beats']), 'beats,', sum(len(b['narration'].split()) for b in st['beats']), 'words')
    sys.exit(0)

# ------------------------------------------------------------------ storyboard (9:16)
DURATION = int(sys.argv[2])
S = SHORTS[KEY]
write_story(KEY, DURATION)
STORY = ROOT / f"stories/{S['id']}.json"
LIGHT = '#eef1f8'
recipes.INK = LIGHT
ep = Episode(str(STORY), 'tall'); F = ep.F; W, H = F['W'], F['H']
ep.pop_db, ep.deviation_tolerance = -24, .3
ep.theme = 'paint-night-gold'   # Ep 5's look: gold accents, outlined notes
SUN, GOLD, DAYTXT, NOTE_BLUE, ICE = '#ffcf4a', '#ffd25e', '#14213d', '#a9d8ff', '#bfe6ff'
LAST = S['beats'][-1][0]


def lv(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def disc(pid, px, py, r, base, bands, shade=.2, seed=3, **layer):
    return Prop(planet(pid, px, py, r, base, bands, shade=shade, seed=seed, **layer), Box((px - r * H / W) * W, (py - r) * H, (px + r * H / W) * W, (py + r) * H, pid))


def earth(pid, px, py, r, **layer):
    return disc(pid, px, py, r, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), **layer)


def sun(pid, px, py, r, **layer):
    return disc(pid, px, py, r, SUN, ('#ffe27a', SUN), shade=.05, seed=2, **layer)


def shadow(pid, px, py, r, level, side='left'):
    return Prop(prop(pid, 'night-half', px, py, 2 * r, rotation=180 if side == 'left' else 0, level=level))


def earth_lit(pid, px, py, r, dark=None):
    """Earth with its night half (city lights) on the left; the day half (right) goes dark at `dark`."""
    out = [earth(pid, px, py, r), shadow(pid + '-night', px, py, r, lv((0, 1)), side='left'),
           Prop(prop(pid + '-city', 'city-lights', px, py, 2 * r, count=16, rotation=0, level=lv((0, .9))))]
    if dark is not None:
        out.append(shadow(pid + '-day', px, py, r, lv((0, 0), (plus(dark, -1), 0), (plus(dark, 8), 1)), side='right'))
    return out


def sky(pid, level):
    return Prop(prop(pid, 'sky', .5, .5, 1.0, level=level))


def clock_t(pid, px, py, size, keys, **layer):
    """A clock set to real time: keys = (frame, seconds after 12:00:00, ramp to the next key?)."""
    vals = [{'frame': f, 'value': v, **({'ramp': True} if r else {})} for f, v, r in keys]
    return kit(F, pid, 'clock-time', px, py, size, w=.9, h=1.5, values=vals, **layer)


def thermo(pid, px, py, size, level):
    return kit(F, pid, 'thermometer', px, py, size, w=.4, h=1.2, level=level, color=ICE)


def pulse(pid, px, py, size, a, b, color='#fff6c8', **layer):
    return Prop(prop(pid, 'pulse', px, py, size, color=color, level=lv((0, 0), (a, 0), (b, 1)), **layer))


def arka(x=.5, fy=.74, h=.24, poses=((0, 'float'),), faces=((0, 'happy'),)):
    return Char('arka', 'arka', x=x, fy=fy, h=h, idle=None, poses=list(poses), faces=list(faces))


def shot(bid, chars=(), props=(), notes=(), cam='settle', sounds=()):
    if bid == LAST: sounds = list(sounds) + [('chime', A(S['chime']) if S['chime'] else 4, -26)]   # soft brand chime under the last line (no sting in Shorts)
    ep.scene(bid, explain(list(chars), list(props), list(notes), camera_preset=cam, sounds=list(sounds)))


def window(a, b):
    return track((0, 0), (plus(a, -1), 0), (a, 1), (plus(b, -1), 1), (b, 0))


# Corner tag for the whole Short (same place in every shot, no pop, no sound); top-left, the Shorts player keeps its icons top-right.
tag = note('brand-tag', 'GAHANARKA', 200, 250, 0, size=44, color=GOLD)
tag.pop('opacity', None); tag['pop'] = False; tag['opacity'] = track((0, .85))

if KEY == 'gone':
    S['chime'] = None
    ep.backdrop(stars=26)
    ep.music([('g1', 'assets/music/8-space-spaghettification.mp3', 0)], gain_db=-17, duck_ratio=2, target_lufs=-16,
             voice={'highpassHz': 95, 'lowMidDb': -4, 'presenceDb': 2, 'room': .08})
    # g1 noon, bright page; the hook as text from frame 0; the Sun turns into a ghost ring on "gone"
    shot('g1', [], [sky('sky', lv((0, 1))),
                    sun('sun', .5, .36, .1, opacity=track((0, 1), (A('gone', -1), 1), (plus(A('gone'), 8), .55))),
                    kit(F, 'ghost', 'orbit-ring', .5, .36, .3, color=DAYTXT, opacity=show_from(A('gone'))),
                    clock_t('clock', .2, .4, .16, [(0, 0, False)])],
         [Note('THE SUN IS', 0, 'title', pos=(540, 1250), color=DAYTXT), Note('ALREADY GONE.', 0, 'title', pos=(540, 1370), color=DAYTXT)], cam='push')
    # g2 Arka points at the Sun: it's right there
    shot('g2', [arka(x=.4, poses=[(0, 'point-right')], faces=[(0, 'grin')])], [sky('sky', lv((0, 1))), sun('sun', .74, .32, .09)],
         [Note('getting a tan!', A('tan'), 'title', pos=(540, 560), color=DAYTXT)])
    # g3 what you see is a ghost: light left 8 min 20 s ago (Sun top, Earth bottom, light pulse down)
    shot('g3', [], [sun('sun', .5, .24, .08), earth('earth', .5, .5, .05), pulse('light', .5, .37, .3, A('left'), A('ago'), rotation=90)],
         [Note('a ghost', A('ghost'), 'title', pos=(540, 1250)), Note('light left 8 min 20 s ago', A('eight'), 'note', pos=(540, 1390))])
    # g4 the experiment: gone for exactly 8 min 20 s, then back (clock runs 12:00 -> 12:08:20)
    shot('g4', [], [sun('sun', .36, .32, .11, opacity=track((0, 1), (A('disappears', -1), 1), (A('disappears'), 0), (A('back', -1), 0), (A('back'), 1))),
                    kit(F, 'ghost', 'orbit-ring', .36, .32, .26, opacity=track((0, 0), (A('disappears', -1), 0), (A('disappears'), 1), (A('back', -1), 1), (A('back'), 0))),
                    clock_t('clock', .74, .44, .18, [(0, 0, False), (A('disappears'), 0, True), (A('back', -2), 500, False)])],
         [Note('the experiment', A('experiment'), 'note', pos=(540, 1250)), Note('gone 8 min 20 s', A('exactly'), 'title', pos=(540, 1380)),
          Note('then back', A('back'), 'note', pos=(540, 1500))])
    # g5 the twist: Earth's day side goes dark at 12:08:20, while the Sun is already back
    shot('g5', [], earth_lit('earth', .5, .4, .12, dark=A('out')) + [sun('sun', .8, .2, .06, opacity=show_from(A('back'))),
                    clock_t('clock', .2, .2, .14, [(0, 500, False)], opacity=show_from(A('out')))],
         [Note('the twist', A('twist'), 'note', pos=(540, 1250)), Note('the Sun is already back', A('back'), 'title', pos=(540, 1380)),
          Note("we just can't see it yet", A('see'), 'small', pos=(540, 1500))], cam='push')
    # g6 Arka works it out
    shot('g6', [arka(poses=[(0, 'think')], faces=[(0, 'shocked')])], [kit(F, 'q', 'question', .72, .4, .14)],
         [Note('not gone anymore?', A('anymore'), 'title', pos=(540, 560))])
    # g7 "Exactly." Back to the noon sky, so the loop into g1 is seamless
    shot('g7', [], [sky('sky', lv((0, 1))), sun('sun', .5, .36, .1), clock_t('clock', .2, .4, .16, [(0, 1000, False)])],
         [Note('exactly.', 0, 'title', pos=(540, 1250), color=DAYTXT)])

elif KEY == 'air':
    S['chime'] = 'ground.'
    ep.backdrop(stars=30)
    ep.music([('a1', 'assets/music/8-space-laniakea.mp3', 0)], gain_db=-17, duck_ratio=2, target_lufs=-16,
             voice={'highpassHz': 95, 'lowMidDb': -4, 'presenceDb': 2, 'room': .08})
    # a1 the hook as text from frame 0; air snow over a frozen ground
    shot('a1', [], [Prop(prop('snow', 'snowfall', .5, .42, .9, count=34, level=lv((0, 1)))), Prop(prop('ice', 'ice-layer', .5, .82, .95, level=lv((0, .6))))],
         [Note('THE AIR FALLS.', 0, 'title', pos=(540, 1250)), Note('(as snow)', A('falls.'), 'note', pos=(540, 1380))], cam='push')
    # a2 noon: the Sun vanishes
    shot('a2', [], [sun('sun', .5, .38, .12, opacity=track((0, 1), (A('vanishes', -1), 1), (A('vanishes'), 0))),
                    kit(F, 'ghost', 'orbit-ring', .5, .38, .28, opacity=show_from(A('vanishes'))), clock_t('clock', .22, .6, .16, [(0, 0, False)])],
         [Note('12:00', A('noon'), 'title', pos=(540, 1250)), Note('the Sun vanishes', A('vanishes'), 'note', pos=(540, 1380))], sounds=[('whoosh', A('vanishes'), -22)])
    # a3 a year later: -70 C
    shot('a3', [], [thermo('th', .3, .44, .42, lv((0, .5), (A('seventy'), .2))), kit(F, 'cal', 'calendar', .66, .4, .2, text='1 yr')],
         [Note('-70°C', A('seventy'), 'title', pos=(540, 1250)), Note('a year later', A('year'), 'note', pos=(540, 1380))])
    # a4 millions of years: -240 C, colder than Pluto
    shot('a4', [], [thermo('th', .3, .44, .42, lv((0, .2), (A('forty'), .03))), disc('pluto', .68, .36, .045, '#d8c3a5', ('#c9ad8a', '#e6d6bd'), shade=.3, opacity=show_from(A('Pluto')))],
         [Note('-240°C', A('forty'), 'title', pos=(540, 1250)), Note('colder than Pluto', A('Pluto'), 'note', pos=(540, 1380))])
    # a5 nitrogen and oxygen snow down and lie as frost
    shot('a5', [], [Prop(prop('snow', 'snowfall', .5, .4, .9, count=40, level=lv((0, 1)))),
                    Prop(prop('ice', 'ice-layer', .5, .82, .95, level=lv((0, .2), (A('layer.'), .8))))],
         [Note('nitrogen + oxygen', A('Nitrogen'), 'note', pos=(540, 1250)), Note('snow and frost', A('snow'), 'title', pos=(540, 1380))])
    # a6 Arka: no sky?
    shot('a6', [arka(poses=[(0, 'cower')], faces=[(0, 'shocked')])], [Prop(prop('snow', 'snowfall', .5, .3, .8, count=20, level=lv((0, 1))))],
         [Note('no sky?', A('sky'), 'title', pos=(540, 560))])
    # a7 stars all the way down (loops into "The air itself freezes, and falls.")
    shot('a7', [], [Prop(prop('stars2', 'doodle-stars', .5, .45, .9, count=40)), Prop(prop('ice', 'ice-layer', .5, .82, .95, level=lv((0, .45))))],
         [Note('no sky. no wind.', A('No'), 'note', pos=(540, 1250)), Note('just stars', A('stars,'), 'title', pos=(540, 1380))])

else:
    S['chime'] = 'Classic.'
    ep.backdrop(stars=30)
    ep.music([('v1', 'assets/music/6-space-event-horizon.mp3', 0)], gain_db=-17, duck_ratio=2, target_lufs=-16,
             voice={'highpassHz': 95, 'lowMidDb': -4, 'presenceDb': 2, 'room': .08})
    PROBE_INK = '#8d97b0'
    SHELL = lv((0, .1), (60, .9), (120, 1))

    def probe(px, py, size, pid='probe', **extra):
        return kit(F, pid, 'probe', px, py, size, w=1.2, h=1.0, **extra)

    # v1 the hook as text from frame 0; noon, the Sun vanishes
    shot('v1', [], [sun('sun', .5, .36, .11, opacity=track((0, 1), (A('vanishes', -1), 1), (A('vanishes'), 0))),
                    kit(F, 'ghost', 'orbit-ring', .5, .36, .26, opacity=show_from(A('vanishes'))), probe(.78, .16, .16, opacity=lv((0, .7)))],
         [Note('WHO FINDS OUT', 0, 'title', pos=(540, 1250)), Note('LAST?', 0, 'title', pos=(540, 1370))], cam='push')
    # v2 Earth's day side goes dark at once
    shot('v2', [], earth_lit('earth', .5, .44, .15, dark=A('dark')), [Note('12:08:20', A('whole'), 'title', pos=(540, 1250)), Note('half of Earth goes dark', A('dark'), 'note', pos=(540, 1380))])
    # v3 the darkness doesn't stop at Earth: a shell racing outward
    shot('v3', [], [sun('ghost', .5, .4, .05, opacity=lv((0, .25))), Prop(prop('shell', 'shell', .5, .4, .95, count=7, level=SHELL)), earth('earth', .72, .4, .03)],
         [Note('a shell of darkness', A('darkness'), 'title', pos=(540, 1250))])
    # v4 Mars 13 min, Jupiter 43 min, Neptune 4 h
    marks = [('Mars', 'mars', .3, 'thirteen', '#d9643a'), ('Jupiter', 'jupiter', .42, 'forty-three', '#d9b38c'), ('Neptune', 'neptune', .54, 'four', '#4f7fd9')]
    props = [sun('ghost', .3, .2, .035, opacity=lv((0, .25)))]
    notes = []
    for name, pid, y, word, col in marks:
        props.append(disc(pid, .3, y, .035 if pid != 'jupiter' else .05, col, (col,), shade=.25, opacity=track((0, 1), (plus(A(word), -1), 1), (plus(A(word), 4), .3), (plus(A(word), 30), .3), (plus(A(word), 40), 1))))
        notes.append(Note({'Mars': '13 min: Mars', 'Jupiter': '43 min: Jupiter', 'Neptune': '4 h: Neptune'}[name], A(word), 'note', pos=(640, round(y * H))))
    shot('v4', [], props, notes)
    # v5 a full day later: Voyager 1, one light-day away
    shot('v5', [], [probe(.5, .4, .4)], [Note('1 day later', A('full'), 'note', pos=(540, 1250)), Note('Voyager 1', A('Voyager'), 'title', pos=(540, 1380))])
    # v6 out there the Sun is just a bright star, and it goes missing for 8 minutes
    shot('v6', [], [probe(.36, .5, .3), sun('star', .74, .3, .02, opacity=track((0, 1), (A('missing', -1), 1), (A('missing'), 0)))],
         [Note('the Sun = a bright star', A('star,'), 'note', pos=(540, 1250)), Note('gone for 8 min', A('missing.'), 'title', pos=(540, 1380))])
    # v7 Arka: last to find out (loops into the noon hook)
    shot('v7', [arka(poses=[(0, 'shrug')], faces=[(0, 'smug')])], [probe(.8, .62, .16)], [Note('last to know', A('last'), 'title', pos=(540, 560))])
    for layer in [l for pl in ep.plans.values() for pr in pl['props'] for l in [pr.layer]]:
        k = layer.get('kit', {})
        if k.get('type') == 'prop' and k.get('item') == 'probe': k['ink'] = PROBE_INK

ep._backdrop.setdefault('annotations', []).append(tag)

# Night page: no red text; titles gold, handwritten notes pale blue (day-page notes keep their dark ink).
for pl in ep.plans.values():
    for n in pl['notes']:
        if n.color == RED: n.color = GOLD if n.kind == 'title' else NOTE_BLUE
LIGHT_INK = {'doodle-stars', 'counter', 'bar', 'clock'}
for layer in [l for pl in ep.plans.values() for pr in pl['props'] for l in [pr.layer]] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k['ink'] = LIGHT

path, board = ep.write(sys.argv[3] if len(sys.argv) > 3 else None)
for pl in ep.placements: print(' ', pl['beat'], [n[0] for n in pl['notes']])
print('wrote', path.name, sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(pl['notes']) for pl in ep.placements), 'notes placed')
