"""Voyager 1 one-light-day Short (9:16), timely: Voyager 1 crosses 1 light-day from Earth on 18 Nov 2026, 10:16 UTC.

Single source for the story script (stories/voyager-short.json) and, once narration exists, the storyboard
(storyboards/voyager-short.json). Facts and sources: stories/voyager-short-script.md.

Usage: python3 scripts/authoring/plan-voyager-short.py [duration_seconds] [output_storyboard]
       python3 scripts/authoring/plan-voyager-short.py --script-only
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes
LIGHT = '#eef1f8'  # night page: small labels and line-art props are drawn in light ink
recipes.INK = LIGHT

ROOT = pathlib.Path(__file__).resolve().parents[2]
STORY = ROOT / 'stories/voyager-short.json'
N, K = 'narrator', 'arka'
SHOTS = []  # (beat id, intent, [(speaker, text)])


def line(bid, *parts, intent='explanation'):
    SHOTS.append((bid, intent, list(parts)))


# ------------------------------------------------------------------ script (draft 1), one shot per entry
line('v1', (N, 'Right now, a message from Earth needs a full day to reach Voyager 1.'), intent='hook')
line('v2', (N, "It's the first thing we've ever built that's one light-day away. Twenty-six billion kilometers."), intent='hook')
line('v3', (K, 'Hi, Earth!'), (N, 'Say hi back, and Arka hears it tomorrow.'))
line('v4', (N, 'It left in 1977, flew past Jupiter and Saturn, and never stopped.'))
line('v5', (N, "It's now more than five times farther away than Neptune."))
line('v6', (N, 'Its computers: sixty-nine kilobytes. Less than one photo on your phone.'))
line('v7', (N, 'Its radio: about as strong as a fridge light bulb.'), (K, 'And we still hear it?'), (N, 'Barely. But yes.'))
line('v8', (N, 'It carries a golden record: sounds and pictures of Earth, for anyone who finds it.'))
line('v9', (N, 'In 1990, it looked back and took this. That tiny dot is every person who ever lived.'), intent='payoff')
line('v10', (N, 'Then its cameras went dark, and it kept going.'), intent='payoff')
line('v11', (N, 'A tiny light in the deep dark, still talking to us.'), (K, 'Call you tomorrow!'), intent='closing')


def phrases(text, limit=26):
    """Caption phrases (tall frame: shorter lines): break at sentence ends, otherwise before a word that would pass `limit`."""
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
        beats.append({'id': bid, 'sceneId': f'vy-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'voyager-short', 'title': 'Voyager 1 Is Now One Light-Day Away',
             'topic': 'Voyager 1 reaches 1 light-day from Earth (18 Nov 2026): a day-long message delay, launched 1977, ~17 km/s, ~69 KB of computer memory, a ~22 W radio, the 1990 Pale Blue Dot photo, cameras off since',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/voyager-short.json', 'candidatesReport': 'stories/voyager-short-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    s = write_story(45)
    words = sum(len(b['narration'].split()) for b in s['beats'])
    print('wrote', STORY.name, len(s['beats']), 'beats,', words, 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ storyboard (9:16)
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 48
write_story(DURATION)
ep = Episode(str(STORY), 'tall'); F = ep.F; W, H = F['W'], F['H']
ep.pop_db, ep.deviation_tolerance = -24, .3
ep.theme = 'paint-night'
ep.backdrop(stars=30, earth={'r': .5, 'hidden': [(A('left', -6, beat='v4'), A('talking', -6, beat='v11'))]})
ep.music([('v1', 'assets/music/6-space-event-horizon.mp3', 0)], target_lufs=-16)
BLUE = '#2f7fd0'


def probe(px, py, size, pid='probe', **extra):
    return kit(F, pid, 'probe', px, py, size, w=1.2, h=1.0, **extra)


def signal(x, y, size, rotation, pid='signal', color=None):
    extra = {'rotation': rotation}
    if color: extra['color'] = color
    return Prop(prop(pid, 'signal', x, y, size, **extra), None)


def rider(at_x, at_y, poses, faces, h=.11):
    """Arka sitting on the probe's dish (small, so the probe stays the subject)."""
    return Char('arka', 'arka', x=at_x, fy=at_y, h=h, idle=None, poses=poses, faces=faces)


GOLD = '#d9a628'


def disc(pid, x, y, r, color, at):
    """A round body (planet dict like JUPITER, or a plain colour) fading in at `at`."""
    body = dict(color) if isinstance(color, dict) else {'base': color, 'bands': [color]}
    return Prop({'id': pid, 'kit': {'type': 'planet', 'x': x, 'y': y, 'radius': r, 'shade': .15, 'seed': 5, **body},
                 'opacity': track((0, 0), (plus(at, -1), 0), (plus(at, 6), 1))}, Box((x - r) * W, y * H - r * W, (x + r) * W, y * H + r * W, pid))


def bars(pid, x, y, text, rise_from, rise_to, level, color):
    lv = [{'frame': 0, 'value': 0}, {'frame': rise_from, 'value': 0}, {'frame': rise_to, 'value': level}]  # bar levels take scene frames
    return kit(F, pid, 'bar', x, y, .62, w=1.0, h=.4, text=text, level=lv, color=color)


# v1 hook: a message leaves Earth and needs a whole day to arrive
ep.scene('v1', explain([], [probe(.72, .5, .3), signal(.42, .7, .34, -50), scene_counter(F, [{'frame': 0, 'value': 0}, {'frame': A('needs'), 'value': 0, 'ramp': True}, {'frame': A('day'), 'value': 24}], 'hours of light-time')],
                       [Note('24 hours', A('day'), 'title', pos=(300, 1080)), Note('Voyager 1', A('Voyager'), 'label', near='probe')], sounds=[('tick', A('full'), -22)]))
# v2 the record
ep.scene('v2', explain([], [probe(.5, .44, .44)],
                       [Note('1 light-day', A('one'), 'title'), Note('first ever', A('first'), 'note'), Note('26 billion km', A('Twenty-six'), 'small')]))
# v3 Arka waves from the dish; the reply needs a day
arka = rider(.5, .338, [(0, 'float'), (A('Hi', -2), 'wave')], [(0, 'happy'), (A('Hi'), 'grin')])
ep.scene('v3', explain([arka], [probe(.5, .44, .42), signal(.38, .56, .26, 120, color='#7fc0ff')], [Note('+1 day', A('tomorrow'), 'title')]))
# v4 the journey: 1977, Jupiter, Saturn
ep.scene('v4', explain([], [probe(.64, .5, .3), disc('jupiter', .22, .36, .09, JUPITER, A('Jupiter')), disc('saturn', .3, .6, .07, SATURN, A('Saturn'))],
                       [Note('1977', A('1977'), 'title'), Note('Jupiter 1979', A('Jupiter'), 'small', near='jupiter'), Note('Saturn 1980', A('Saturn'), 'small', near='saturn'),
                        Note('never stopped', A('stopped'), 'note')]))
# v5 how far: Neptune vs Voyager
ep.scene('v5', explain([], [bars('nep', .44, .42, 'Neptune', 20, 40, .18, BLUE), bars('voy', .44, .58, 'Voyager 1', 40, 80, 1, RED)],
                       [Note('x5.6', A('five'), 'title', near='voy'), Note('~4.5 billion km', A('Neptune'), 'small', near='nep')]))
# v6 memory: Voyager vs one phone photo
ep.scene('v6', explain([], [bars('bar1', .44, .42, 'Voyager', 25, 37, .025, BLUE), bars('bar2', .44, .58, '1 phone photo', 90, 110, 1, RED)],
                       [Note('69 KB', A('kilobytes'), 'title', near='bar1'), Note('~3,000 KB', A('phone'), 'title', near='bar2')]))
# v7 a fridge-bulb radio, and we still hear it
arka = rider(.62, .348, [(0, 'float'), (A('hear', -4), 'shrug')], [(0, 'neutral'), (A('hear', -4), 'shocked'), (A('Barely'), 'grin')])
ep.scene('v7', explain([arka], [kit(F, 'bulb', 'bulb', .28, .5, .2), probe(.62, .44, .32), signal(.48, .54, .22, 150)],
                       [Note('~22 watts', A('strong'), 'title'), Note('barely!', A('Barely'), 'note')]))
# v8 the golden record: the 1977 installation photo, then NASA's record + spacecraft picture
TALL = dict(size=(1080, 1920))
ep.scene('v8', explain([], [photo(ep, F, 'vy-record-1977', 'nasa/inserts/vy-record-1977.png', A('carries'), until=A('sounds', -2), y=.5, scale=.92, box=(.08, .3, .92, .7), **TALL),
                            photo(ep, F, 'vy-golden-record', 'nasa/inserts/vy-golden-record.png', A('sounds'), y=.5, scale=.92, box=(.06, .34, .94, .66), **TALL)],
                       [Note('Golden Record', A('golden'), 'title', pos=(540, 560)), Note('for anyone who finds it', A('finds'), 'small', pos=(540, 1370))]))
# v9 the real Pale Blue Dot, Earth circled
pbd = photo(ep, F, 'vy-pale-blue-dot', 'nasa/inserts/vy-pale-blue-dot.png', A('1990', -6), y=.47, scale=.8, box=(.1, .22, .9, .78), **TALL)
pbd.layer['anchor'] = {'x': 540, 'y': 942}
pbd.layer['scale'] = track((0, .72), (plus(A('1990', -6), -1), .72), (plus(A('1990', -6), 6), .8, 'ease-out-back'), (A('tiny', -4), .8), (A('lived'), 1.45, 'smoothstep'))
ep.scene('v9', explain([], [pbd],
                       [Note('that dot is us', A('dot'), 'title', pos=(540, 520)), Note('6 billion km away', A('1990'), 'small', pos=(540, 1428), until=A('tiny', -4))]))
# v10 cameras off; it keeps going
away = dict(x=track((0, 0), (A('going', -10), 0), (A('going', 30), 160, 'smoothstep')), y=track((0, 0), (A('going', -10), 0), (A('going', 30), -190, 'smoothstep')))
ep.scene('v10', explain([], [probe(.45, .48, .38, **away)], [Note('cameras: OFF', A('cameras'), 'title'), Note('still going', A('going'), 'note')]))
# v11 the channel's signature: a light in the deep dark
arka = rider(.5, .338, [(0, 'float'), (A('Call', -2), 'wave')], [(0, 'happy'), (A('Call'), 'grin')])
ep.scene('v11', explain([arka], [probe(.5, .44, .42), signal(.38, .56, .26, 120, color='#7fc0ff')],
                        [Note('GAHANARKA', A('light'), 'title', size=117, pos=(540, 1190), color=GOLD), Note('light in the unfathomable', A('dark'), 'note', pos=(540, 1300))]))

LIGHT_INK = {'doodle-stars', 'counter', 'bar', 'bulb'}
PROBE_INK = '#8d97b0'  # mid grey: outlines the white dish and still shows the booms against the navy page
for layer in [l for pl in ep.plans.values() for pr in pl['props'] for l in [pr.layer]] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k['ink'] = LIGHT
    if k.get('type') == 'prop' and k.get('item') == 'probe': k['ink'] = PROBE_INK

if __name__ == '__main__':
    path, board = ep.write(sys.argv[2] if len(sys.argv) > 2 else None)
    for pl in ep.placements: print(' ', pl['beat'], [n[0] for n in pl['notes']])
    print('wrote', path.name, sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(pl['notes']) for pl in ep.placements), 'notes placed')
