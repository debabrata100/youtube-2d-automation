"""Voyager Shorts V2 (69 KB memory), V3 (the 48-hour silence) and V7 (still calling: the November data outage), 9:16. Script and facts: stories/voyager-shorts-script.md.

One source for each Short's story script (stories/voyager-<name>.json) and storyboard (storyboards/voyager-<name>.json).
Brand in Shorts (no end sting, Shorts loop): a small GAHANARKA corner tag throughout, Arka, and a soft chime under the last line.

Usage: python3 scripts/authoring/plan-voyager-shorts.py memory|silent|calling [duration_seconds] [output_storyboard]
       python3 scripts/authoring/plan-voyager-shorts.py memory|silent|calling --script-only
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes
LIGHT = '#eef1f8'  # night page: small labels and line-art props are drawn in light ink
recipes.INK = LIGHT

ROOT = pathlib.Path(__file__).resolve().parents[2]
NAME = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('memory', 'silent', 'calling') else sys.exit(__doc__)
STORY = ROOT / f'stories/voyager-{NAME}.json'
N, K = 'narrator', 'arka'
SHOTS = []  # (beat id, intent, [(speaker, text)])


def line(bid, *parts, intent='explanation'):
    SHOTS.append((bid, intent, list(parts)))


# ------------------------------------------------------------------ scripts (draft 1, approved 20 Nov 2026)
if NAME == 'memory':
    TITLE = 'Voyager Has Less Memory Than One Photo on Your Phone'
    TOPIC = ("Voyager 1's computers: 69.63 KB of memory across three computers, an 8-track digital tape recorder, 160 bit/s downlink, "
             'the 2023 memory-chip failure fixed from 24 billion km away in five months')
    line('m1', (N, "The last photo you took is bigger than Voyager 1's entire memory."), intent='hook')
    line('m2', (N, 'The farthest machine humans ever built runs on three computers with sixty-nine kilobytes of memory. Combined.'), intent='hook')
    line('m3', (K, 'Kilobytes? My selfies are bigger than that!'))
    line('m4', (N, "It can't even keep its own data. It records onto tape, on an eight-track tape recorder, and sends it home at a hundred and sixty bits per second."))
    line('m5', (N, 'An old dial-up modem was more than a hundred times faster.'))
    line('m6', (N, 'In 2023, one memory chip failed. With almost no room to spare, engineers squeezed a fix into the gaps, from twenty-four billion kilometers away.'), intent='payoff')
    line('m7', (N, 'It took five months. And it worked. Nearly fifty years later, Voyager is still talking to us.'), intent='closing')
elif NAME == 'calling':
    # Draft 1, 22 Nov 2026. Sequel to V3 (S7). Facts: stories/voyager-shorts-script.md, section V7.
    TITLE = 'Voyager 1 Still Has a Pulse. It Just Stopped Talking.'
    TOPIC = ('Voyager 1 has sent a carrier signal but no science or engineering data since 14 Nov 2026 (NASA, 18 Nov 2026), '
             'the same week it reached one light-day from Earth; in October it went silent for about 48 hours and recovered on its own')
    line('c1', (N, "Voyager 1 still has a pulse. NASA can hear it. But since November fourteenth, it hasn't said a single word."), intent='hook')
    line('c2', (N, 'It went quiet the same week it became the first object ever to reach one light-day from Earth.'), intent='hook')
    line('c3', (N, 'So every message takes a day to get there, and a day to come back.'))
    line('c4', (N, "Last month, it went silent for two days and fixed itself. This time, it hasn't."), intent='payoff')
    line('c5', (K, 'Come on, Voyager. Say something.'))
    line('c6', (N, "There's no copy on Earth to practise on. Every fix goes straight to the real thing."))
    line('c7', (N, 'So NASA sends a message, and waits two days. Because Voyager 1 is still calling us.'), intent='closing')
else:
    TITLE = 'NASA Lost Voyager 1 for 48 Hours'
    TOPIC = ('Voyager 1 went silent on 18-19 Oct 2026 and came back on 20 Oct before any command was sent, having switched to backup thrusters on its own '
             '(NASA JPL, 29 Oct 2026); four weeks later it reached one light-day from Earth')
    line('l1', (N, 'On October eighteenth, NASA called Voyager 1. Nothing answered.'), intent='hook')
    line('l2', (N, 'The next day, they tried again. Still nothing.'), intent='hook')
    line('l3', (K, 'Wait... is this the end?'))
    line('l4', (N, 'Voyager is so far away that a message takes almost a full day to arrive. So the team could only plan a rescue, and wait.'))
    line('l5', (N, 'Then, on October twentieth, before they had sent a single command, the signal came back.'), intent='payoff')
    line('l6', (N, 'A group of its thrusters had gone offline, and Voyager had switched to its backups on its own. Exactly why it went quiet is still a mystery.'), intent='payoff')
    line('l7', (K, 'Almost fifty years old, and still rescuing itself. Respect.'))
    line('l8', (N, 'Four weeks later, it became the first object ever to reach one light-day from Earth.'), intent='closing')


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
        beats.append({'id': bid, 'sceneId': f'vy{NAME[0]}-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': f'voyager-{NAME}', 'title': TITLE, 'topic': TOPIC,
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': f'storyboards/voyager-{NAME}.json', 'candidatesReport': 'stories/voyager-shorts-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    s = write_story(45)
    words = sum(len(b['narration'].split()) for b in s['beats'])
    print('wrote', STORY.name, len(s['beats']), 'beats,', words, 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ storyboard (9:16)
DURATION = int(sys.argv[2]) if len(sys.argv) > 2 else 48
write_story(DURATION)
ep = Episode(str(STORY), 'tall'); F = ep.F; W, H = F['W'], F['H']
ep.pop_db, ep.deviation_tolerance = -24, .3
ep.theme = 'paint-night'
BLUE, GOLD, GREEN, AMBER = '#2f7fd0', '#ffd25e', '#2e9e4f', '#f2a33a'
LAST = SHOTS[-1][0]


def probe(px, py, size, pid='probe', **extra):
    return kit(F, pid, 'probe', px, py, size, w=1.2, h=1.0, **extra)


def signal(x, y, size, rotation, pid='signal', color=None, **layer):
    extra = {'rotation': rotation, **layer}
    if color: extra['color'] = color
    return Prop(prop(pid, 'signal', x, y, size, **extra), None)


def rider(at_x, at_y, poses, faces, h=.11):
    """Arka sitting on the probe's dish (small, so the probe stays the subject)."""
    return Char('arka', 'arka', x=at_x, fy=at_y, h=h, idle=None, poses=poses, faces=faces)


def bars(pid, x, y, text, rise_from, rise_to, level, color):
    lv = [{'frame': 0, 'value': 0}, {'frame': rise_from, 'value': 0}, {'frame': rise_to, 'value': level}]  # bar levels take scene frames
    return kit(F, pid, 'bar', x, y, .62, w=1.0, h=.4, text=text, level=lv, color=color)


def icon(pid, item, x, y, size, at, **extra):
    """A small kit prop that pops in at `at` (no layout box: notes may sit near it)."""
    return Prop(prop(pid, item, x, y, size, **extra, **pop_in(at, (x * W, y * H))), None)


def boxed(pid, item, x, y, size, at, **extra):
    """As icon(), but the layout solver keeps notes off it."""
    return Prop(prop(pid, item, x, y, size, **extra, **pop_in(at, (x * W, y * H))),
                Box((x - size / 2) * W, y * H - size / 2 * W, (x + size / 2) * W, y * H + size / 2 * W, pid))


# Corner tag for the whole Short (backdrop annotation: same place in every shot, no pop, no sound).
tag = note('brand-tag', 'GAHANARKA', 200, 250, 0, size=44, color=GOLD)  # top-left: the Shorts player keeps its icons top-right
tag.pop('opacity', None); tag['pop'] = False; tag['opacity'] = track((0, .85))

if NAME == 'memory':
    ep.backdrop(stars=30)
    ep.music([('m1', 'assets/music/6-space-event-horizon.mp3', 0)], target_lufs=-16)
    # m1 hook: your last photo vs Voyager's whole memory
    ep.scene('m1', explain([], [bars('photo', .44, .34, 'your last photo', 8, 30, 1, AMBER), bars('voy', .44, .6, "Voyager's memory", 40, 52, .023, BLUE)],
                           [Note('~3,000 KB', A('photo'), 'title', pos=(540, 850)), Note('69 KB', A('entire'), 'title', pos=(540, 1350))], sounds=[('tick', A('memory'), -22)]))
    # m2 three computers, 69 KB combined
    ep.scene('m2', explain([], [probe(.5, .42, .42), icon('c1', 'battery', .3, .66, .1, A('three')), icon('c2', 'battery', .5, .66, .1, plus(A('three'), 4)),
                                icon('c3', 'battery', .7, .66, .1, plus(A('three'), 8))],
                           [Note('farthest machine ever', A('farthest'), 'note'), Note('3 computers', A('computers'), 'small', pos=(540, 1400)),
                            Note('69 KB', A('sixty-nine'), 'title', pos=(540, 1520)), Note('combined!', A('Combined.'), 'note', pos=(540, 1640))]))
    # m3 Arka can't believe it
    arka = rider(.5, .338, [(0, 'float'), (A('Kilobytes?', -2), 'shrug')], [(0, 'shocked'), (A('selfies'), 'grin')])
    ep.scene('m3', explain([arka], [probe(.5, .44, .42)], [Note('1 selfie ≈ 3 MB', A('selfies'), 'title', pos=(540, 1300))]))
    # m4 tape recorder and a 160 bit/s trickle home
    ep.scene('m4', explain([], [probe(.68, .36, .3), signal(.42, .56, .3, -130, color='#7fc0ff'), boxed('tape', 'sign', .5, .8, .28, A('tape,'), text='8-track tape')],
                           [Note("can't keep its data", A("can't"), 'note', pos=(540, 330)), Note('160 bits/s', A('hundred'), 'title', pos=(400, 1250))],
                           sounds=[('tick', A('tape,'), -22)]))
    # m5 dial-up was 125x faster
    ep.scene('m5', explain([], [bars('dial', .44, .34, 'old dial-up', 10, 40, 1, AMBER), bars('voy2', .44, .6, 'Voyager 1', 10, 14, .02, BLUE)],
                           [Note('20,000 bits/s', A('dial-up'), 'small', pos=(540, 840)), Note('160 bits/s', A('modem'), 'small', pos=(540, 1340)),
                            Note('×125 faster', A('hundred'), 'title', pos=(540, 1560))]))
    # m6 the 2023 chip failure and the long-distance fix
    ep.scene('m6', explain([], [probe(.5, .4, .36), Prop(prop('fail', 'cross', .5, .62, .14, opacity=track((0, 0), (plus(A('failed.'), -1), 0), (A('failed.'), 1), (plus(A('squeezed'), -1), 1), (A('squeezed'), 0)))),
                                icon('fix', 'check', .5, .62, .16, A('squeezed')), signal(.24, .6, .22, -60, pid='uplink', color='#7fc0ff', opacity=show_from(A('squeezed')))],
                           [Note('2023', A('2023,'), 'title', pos=(540, 300)), Note('1 chip failed', A('failed.'), 'note', pos=(540, 1420), until=A('squeezed')),
                            Note('fix squeezed in', A('squeezed'), 'note', pos=(540, 1420)), Note('24 billion km away', A('twenty-four'), 'small', pos=(540, 1560))]))
    # m7 five months, it worked, still talking (soft brand chime under the last line)
    arka = rider(.5, .338, [(0, 'float'), (A('worked.', -2), 'wave')], [(0, 'happy'), (A('worked.'), 'grin')])
    ep.scene('m7', explain([arka], [probe(.5, .44, .42), boxed('cal', 'calendar', .8, .72, .16, A('five'), text='5 mo'), signal(.3, .5, .2, 120, color='#7fc0ff', opacity=show_from(A('talking')))],
                           [Note('it worked!', A('worked.'), 'title', pos=(540, 1250)), Note('still talking to us', A('still'), 'note', pos=(540, 1580))],
                           sounds=[('chime', A('talking'), -26)]))
elif NAME == 'calling':
    ep.backdrop(stars=30, earth={'r': .5, 'hidden': [(A('So', beat='c3'), A('Last', beat='c4')), (A("There's", beat='c6'), A('So', beat='c7'))]})
    ep.music([('c1', 'assets/music/6-space-event-horizon.mp3', 0)], target_lufs=-16)
    # Own mood inside the series look: a quieter, lonelier page. Dim grey carrier arcs (a pulse, no words) and a muted, faded Earth.
    QUIET = '#93a0bc'
    for layer in ep._backdrop['layers']:
        if layer['id'] == 'earth':
            layer['kit'].update(base='#41709a', bands=['#5a8a5c', '#41709a', '#5a8a5c'])
            for key in layer.get('opacity', []): key['value'] *= .6
    # c1 the pulse is there, the words are not
    ep.scene('c1', explain([], [probe(.66, .26, .26), signal(.45, .5, .32, 120, color=QUIET), boxed('day14', 'calendar', .24, .4, .16, A('November'), text='14'),
                                Prop(prop('hear', 'check', 0.76, 0.44, 0.12, opacity=track((0, 0), (plus(A('hear'), -1), 0), (A('hear'), 1), (plus(A('word.'), -1), 1), (A('word.'), 0)))), icon('mute', 'cross', .76, .44, .12, A('word.'))],
                           [Note('STILL ALIVE.', 0, 'title', pos=(540, 1250)), Note('NOT TALKING.', A('But'), 'title', pos=(540, 1390)),
                            Note('since 14 Nov', A('November'), 'small', pos=(260, 900))], sounds=[('tick', A('word.'), -22)]))
    # c2 the same week as one light-day
    ep.scene('c2', explain([], [probe(.5, .4, .42), signal(.38, .53, .26, 120, color=QUIET)],
                           [Note('18 Nov 2026', A('same'), 'small', pos=(540, 260)), Note('1 light-day', A('light-day'), 'title', pos=(540, 1300)),
                            Note('first ever', A('first'), 'note', pos=(540, 1440))]))
    # c3 a day there, a day back
    ep.scene('c3', explain([], [probe(.72, .3, .26), boxed('clock', 'clock', .3, .56, .3, A('message'), level=[{'frame': 0, 'value': .6}], text='24 h each way')],
                           [Note('a day there', A('there,'), 'note', pos=(540, 1420)), Note('a day back', A('and'), 'title', pos=(540, 1560))]))
    # c4 October fixed itself; this time it hasn't (the stakes)
    ep.scene('c4', explain([], [probe(.66, .26, .26), boxed('oct', 'calendar', .24, .4, .16, A('month,'), text='Oct'),
                                Prop(prop('fixed', 'check', 0.76, 0.44, 0.14, opacity=track((0, 0), (plus(A('itself.'), -1), 0), (A('itself.'), 1), (plus(A('This'), -1), 1), (A('This'), 0)))), icon('notyet', 'cross', .76, .44, .16, A('This'))],
                           [Note('Oct: 2 days, fixed itself', A('fixed'), 'small', pos=(540, 1300)), Note('this time: no', A('This'), 'title', pos=(540, 1480))],
                           sounds=[('tick', A('This'), -20)]))
    # c5 Arka, on Earth, pleading
    arka = Char('arka', 'arka', x=.5, fy=.74, h=.24, idle=None, poses=[(0, 'shrug')], faces=[(0, 'shocked')])
    ep.scene('c5', explain([arka], [probe(.7, .2, .2)], [Note('say something!', A('something.'), 'title', pos=(540, 560))]))
    # c6 no copy to practise on: every fix goes to the real probe
    ep.scene('c6', explain([], [probe(.5, .36, .36), icon('nocopy', 'cross', .5, .62, .12, A('copy')),
                                signal(.24, .6, .22, -60, pid='uplink', color=QUIET, opacity=show_from(A('straight')))],
                           [Note('no copy to practise on', A('copy'), 'note', pos=(540, 1320)), Note('real thing only', A('Every'), 'title', pos=(540, 1500))]))
    # c7 send, wait two days; still calling (soft brand chime under the last line; loops into c1)
    ep.scene('c7', explain([], [probe(.5, .4, .42), signal(.38, .53, .26, 120, color=QUIET)],
                           [Note('wait 2 days', A('waits'), 'title', pos=(540, 1300)), Note('still calling', A('calling'), 'note', pos=(540, 1440))],
                           sounds=[('chime', A('calling'), -26)]))
else:
    ep.backdrop(stars=30, earth={'r': .5, 'hidden': [(A('Voyager', beat='l4'), A('Then', beat='l5')), (A('group', beat='l6'), A('Almost', beat='l7'))]})
    ep.music([('l1', 'assets/music/6-space-event-horizon.mp3', 0)], target_lufs=-16)
    QUIET = '#7fc0ff'
    # l1 NASA calls, nothing answers
    ep.scene('l1', explain([], [probe(.66, .26, .26), signal(.45, .5, .32, -60, color=QUIET), boxed('day18', 'calendar', .24, .4, .16, A('October'), text='18'),
                                icon('q1', 'question', .72, .44, .14, A('Nothing'))],
                           [Note('18 Oct 2026', A('October'), 'small', near='day18'), Note('no answer', A('Nothing'), 'title', pos=(540, 1100))], sounds=[('tick', A('Nothing'), -22)]))
    # l2 the next day: still nothing
    ep.scene('l2', explain([], [probe(.66, .26, .26), signal(.45, .5, .32, -60, color=QUIET), boxed('day19', 'calendar', .24, .4, .16, A('next'), text='19'),
                                icon('q2', 'question', .72, .44, .18, A('nothing.'))],
                           [Note('still nothing', A('nothing.'), 'title', pos=(540, 1100))]))
    # l3 Arka, on Earth, worried
    arka = Char('arka', 'arka', x=.5, fy=.74, h=.24, idle=None, poses=[(0, 'shrug')], faces=[(0, 'shocked')])
    ep.scene('l3', explain([arka], [probe(.7, .2, .2)], [Note('the end?', A('end?'), 'title', pos=(540, 560))]))
    # l4 a day each way: plan, and wait
    ep.scene('l4', explain([], [probe(.72, .3, .26), boxed('clock', 'clock', .3, .56, .3, A('message'), level=[{'frame': 0, 'value': .6}], text='~1 day each way')],
                           [Note('plan a rescue', A('plan'), 'note', pos=(540, 1420)), Note('...and wait', A('wait.'), 'title', pos=(540, 1560))]))
    # l5 20 Oct: the signal comes back before any command
    ep.scene('l5', explain([], [probe(.66, .26, .3), boxed('day20', 'calendar', .24, .4, .16, A('twentieth,'), text='20'),
                                signal(.45, .5, .32, 120, pid='back', color='#7fc0ff', opacity=show_from(A('came'))), icon('ok', 'check', .76, .46, .14, A('back.'))],
                           [Note('0 commands sent', A('single'), 'small', pos=(540, 1400)), Note('signal back!', A('came'), 'title', pos=(540, 1540))],
                           sounds=[('tick', A('came'), -20)]))
    # l6 backups switched on by itself; why it went quiet is a mystery
    ep.scene('l6', explain([], [probe(.5, .4, .42), icon('off', 'cross', .3, .6, .12, A('offline,')), icon('on', 'check', .7, .6, .14, A('backups'))],
                           [Note('thrusters: offline', A('thrusters'), 'small', pos=(330, 1290)), Note('backups: ON', A('backups'), 'small', pos=(750, 1290)),
                            Note('by itself', A('own.'), 'note', pos=(540, 1450)), Note('why? still a mystery', A('mystery.'), 'title', pos=(540, 1600))]))
    # l7 Arka salutes the old probe
    arka = Char('arka', 'arka', x=.5, fy=.74, h=.24, idle=None, poses=[(0, 'float'), (A('Respect.', -4), 'wave')], faces=[(0, 'happy'), (A('Respect.', -4), 'grin')])
    ep.scene('l7', explain([arka], [probe(.7, .22, .22)], [Note('49 years old', A('fifty'), 'note', pos=(360, 700))]))
    # l8 four weeks later: one light-day (soft brand chime under the last line)
    ep.scene('l8', explain([], [probe(.5, .4, .42), signal(.38, .53, .26, 120, color='#7fc0ff')],
                           [Note('18 Nov 2026', A('Four'), 'small', pos=(540, 260)), Note('1 light-day', A('light-day'), 'title', pos=(540, 1300)),
                            Note('first ever', A('first'), 'note', pos=(540, 1440))], sounds=[('chime', A('first'), -26)]))

ep._backdrop.setdefault('annotations', []).append(tag)

# Text colour on the night page: no red text (low contrast, reads as an error). Big numbers and titles in warm gold,
# handwritten notes in pale sky blue; small labels stay in light ink. Red stays only for meaning (the failure cross).
NOTE_BLUE = '#a9d8ff'
for pl in ep.plans.values():
    for n in pl['notes']:
        if n.color == RED: n.color = GOLD if n.kind == 'title' else NOTE_BLUE

LIGHT_INK = {'doodle-stars', 'counter', 'bar', 'clock'}
PROBE_INK = '#8d97b0'  # mid grey: outlines the white dish and still shows the booms against the navy page
for layer in [l for pl in ep.plans.values() for pr in pl['props'] for l in [pr.layer]] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k['ink'] = LIGHT
    if k.get('type') == 'prop' and k.get('item') == 'probe': k['ink'] = PROBE_INK

if __name__ == '__main__':
    path, board = ep.write(sys.argv[3] if len(sys.argv) > 3 else None)
    for pl in ep.placements: print(' ', pl['beat'], [n[0] for n in pl['notes']])
    print('wrote', path.name, sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(pl['notes']) for pl in ep.placements), 'notes placed')
