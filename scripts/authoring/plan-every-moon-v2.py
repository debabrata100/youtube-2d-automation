"""Every Moon rework (16:9): "How You'd Die on Every Moon in the Solar System", script draft 5.

Single source for the story script (stories/every-moon-v2.json), generated from stories/every-moon-v2-script.md
(one shot per line; the markdown tables are parsed, so edit the script there). The storyboard is designed after
narration, on real timing (as for Eps 4 and 5).

Usage: python3 scripts/authoring/plan-every-moon-v2.py --script-only [seconds]
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT_MD = ROOT / 'stories/every-moon-v2-script.md'
STORY = ROOT / 'stories/every-moon-v2.json'
SPEAKERS = {'Narrator': 'narrator', 'Arka': 'arka'}


def read_shots():
    text = SCRIPT_MD.read_text().split('## Script', 1)[1].split('## Fact check', 1)[0]
    shots, chapter = [], ''
    for row in text.splitlines():
        h = re.match(r'^### (.*)', row)
        if h:
            chapter = h.group(1).lower(); continue
        m = re.match(r'^\| (e\d+) \| (\w+) \| (.*) \|$', row)
        if not m: continue
        bid, who, line = m.groups()
        intent = 'hook' if chapter.startswith('cold open') else ('closing' if chapter.startswith('ending') else 'explanation')
        shots.append((bid, intent, [(SPEAKERS[who], line)]))
    ids = [int(b[1:]) for b, _, _ in shots]
    assert ids == list(range(1, len(ids) + 1)), 'script line ids must run e1..eN'
    return shots


def phrases(text, limit=34):
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…]$', cur): out.append(cur); cur = ''
    return out + ([cur] if cur else [])


def write_story(duration):
    beats = []
    for bid, intent, parts in read_shots():
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
        assert len(ph) <= 12, f'{bid}: {len(ph)} phrases (max 12); split the line'
        beats.append({'id': bid, 'sceneId': f'em2-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'every-moon-v2', 'title': "How You'd Die on Every Moon in the Solar System",
             'topic': 'Anthology: what kills a suited visitor first on twelve moons (our Moon, Callisto, Phobos, Deimos, Miranda, Enceladus, Triton, Charon, Ganymede, Europa, Io, Titan), with two locked cards (deadliest, you can fly), survival times and a radiation countdown',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/every-moon-v2.json', 'candidatesReport': 'stories/every-moon-v2-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    args = [a for a in sys.argv[1:] if a != '--script-only']
    s = write_story(int(args[0]) if args else 680)
    print('wrote', STORY.name, len(s['beats']), 'beats,', sum(len(b['narration'].split()) for b in s['beats']), 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ storyboard (16:9), on the measured R1 + Arka D2 narration (jobs/em2-v2)
# Devices: two locked cards (DEADLIEST, YOU CAN FLY) shown at every chapter turn; Arka's apartment hunt (a cross per moon);
# a survival tag on every moon (green -> amber -> orange, never red text); a page colour per moon; the radiation alarm.
# No moon name or planet on screen before the narration names it (hook = silhouettes). docs/VISUAL_CHECKLIST.md applies.
from recipes import *  # noqa: E402,F401,F403
import recipes  # noqa: E402
recipes.INK = '#eef1f8'
GOLD_T, ICE, CREAM, SOFT = '#ffd25e', '#a9d8ff', '#f4efe2', '#cfd8ea'
SAFE, WARN, DANGER = '#9be07a', '#f2b134', '#ff9a3d'
recipes.RED = GOLD_T
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 658   # narration 642.9 s (incl. the 2.6 s sting gap after e8) + 3 s tail + 12 s end card
END_CARD = 12
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.story['durationSeconds'] = DURATION - END_CARD
ep.theme = 'paint-night-gold'
ep.pop_db, ep.deviation_tolerance = -25, .3
ep.backdrop(stars=22)

PAGE = {'THE MOON': '#121a2c', 'CALLISTO': '#2a2219', 'PHOBOS': '#2b1612', 'DEIMOS': '#2b1612', 'MIRANDA': '#3a4a5c', 'ENCELADUS': '#0f2a44',
        'TRITON': '#3a2436', 'CHARON': '#2e1d1a', 'GANYMEDE': '#24221f', 'EUROPA': '#0e1d36', 'IO': '#120c06', 'TITAN': '#a85a1c'}
helmet_on = [(0, True)]


def page(color, op=.72):
    return Prop({'id': 'page', 'kit': {'type': 'terrain', 'top': 0, 'curve': 0, 'fill': color, 'detail': color, 'rocks': 0, 'bumps': 1, 'seed': 1}, 'opacity': track((0, op))})


def you(**k):
    k.setdefault('helmet', helmet_on); return Char('you', **k)


def arka(**k):
    return Char('arka', 'arka', **k)


def bigphoto(name, at, x=.5, y=.54, s=1.2, until=None):
    hw = .155 * s; hh = hw * W / H * .95
    y = max(y, .5)
    return photo(ep, F, name, f'nasa/inserts/{name}.png', at, until=until, x=x, y=y, scale=s, box=(.5 - hw, .5 - hh, .5 + hw, .5 + hh))


NAMED = {}


def shot(bid, name, chars=(), props=(), notes=(), cam='settle', sky=True, ground=True, sounds=(), color=None, extra=()):
    NAMED[bid] = bool(name and sky)
    world_props, header = world(F, name, sky=sky, ground=ground) if name else ([], None)
    bg = [page(color or PAGE.get(name, '#0b0d16'), .72 if name else .5)] if (name or color) else []
    ep.scene(bid, dict(chars=list(chars), props=bg + world_props + list(props) + list(extra), notes=([header] if header else []) + list(notes), camera=cam,
                       focus=None, sounds=list(sounds), stamps=[]))


def body(pid, kind, x, y, r, craters=0, glow=None, **layer):
    spec = dict(SKY_BODIES.get(kind, {'base': kind})); ring = spec.pop('ring', False)
    lay = planet(pid, x, y, r, spec['base'], spec.get('bands', ()), craters=craters, ring=ring, shade=.25, seed=len(pid), **layer)
    if glow: lay['kit']['glow'] = glow
    k = (1.9 if ring else 1.1)
    return Prop(lay, Box((x - r * k * H / W) * W, (y - r * 1.1) * H, (x + r * k * H / W) * W, (y + r * 1.1) * H, pid))


def locked(at=0, x1=.32, x2=.68, y=.5, r=.17, open1=None, open2=None):
    """The two locked cards: dark silhouettes with a gold question mark; label notes returned separately."""
    op = {} if not at else pop_in(at, (x1 * W, y * H))
    out = [body('lock1', '#2b2f3d', x1, y, r, **op), kit(F, 'q1', 'question', x1, y, r * .8, color=GOLD_T, **({'opacity': show_until(open1)} if open1 else {})),
           body('lock2', '#2b2f3d', x2, y, r, **({} if not at else pop_in(plus(at, 6), (x2 * W, y * H)))), kit(F, 'q2', 'question', x2, y, r * .8, color=GOLD_T, **({'opacity': show_until(open2)} if open2 else {}))]
    return out


def lock_notes(at1=0, at2=0, y=.82, x1=.32, x2=.68):
    return [Note('DEADLIEST', at1, 'label', color=GOLD_T, pos=(x1 * W, y * H)), Note('YOU CAN FLY', at2, 'label', color=GOLD_T, pos=(x2 * W, y * H))]


def survival(text, at, color, pos=(900, 235)):
    return [Note('SURVIVAL TIME', at, 'small', color=SOFT, pos=(pos[0], pos[1] - 70)), Note(text, at, 'title', color=color, pos=pos)]


def cross(at, x=.74, y=.5, size=.18):
    return kit(F, 'nope', 'cross', x, y, size, **pop_in(at, (x * W, y * H)))


def meter(x, y, size, levels, text=None, pid='meter'):
    return kit(F, pid, 'radiation-meter', x, y, size, w=1.0, h=.75, level=[{'frame': f, 'value': v} for f, v in levels], **({'text': text} if text else {}))


def gauge(x, y, size, levels, text='AIR', pid='gauge'):
    return kit(F, pid, 'battery', x, y, size, w=1.1, h=.8, text=text, level=[{'frame': f, 'value': v} for f, v in levels])


def thermo(x, y, levels, color=None):
    return kit(F, 'thermo', 'thermometer', x, y, .3, w=.4, h=1.2, level=[{'frame': f, 'value': v} for f, v in levels], **({'color': color} if color else {}))


def fall(at, dy=.5, frames=70):
    return track((0, 0), (plus(at, -1), 0), (plus(at, frames), dy * H, 'smoothstep'))


def rise(at, dy=-.35, frames=80, ease='ease-out-cubic'):
    return track((0, 0), (plus(at, -1), 0), (plus(at, frames), dy * H, ease))


belt = lambda x, y, s: kit(F, 'belt', 'radiation-belt', x, y, s, w=2.1, h=.8)
ticks = lambda word, n, gap: [('tick', A(word, k * gap), -22) for k in range(n)]

# ------------------------------------------------------------------ cold open: silhouettes only, no names, no planets
c = cliff(F, .46, .34, 1.0)
shot('e1', None, [you(x=.43, fy=.34, h=.3, idle=None, poses=[(0, 'stand'), (A('step'), 'tumble')], faces=[(0, 'happy'), (A('step'), 'scream')],
                    layer={'y': fall(A('fall', 2), .5, 80), 'x': track((0, 0), (A('step'), 0), (A('step', 20), 60, 'ease-out-cubic'))})],
     [c], [Note('MOON ?', 0, 'header', pos=(W / 2, 92)), Note('12 minutes', A('twelve'), 'title', color=GOLD_T, pos=(1500, 640))], color='#3a4a5c', cam='push',
     sounds=[('whoosh', A('fall'), -22)])
shot('e2', None, [you(slot='center', idle=None, poses=[(0, 'walk'), (A('launch'), 'float')], faces=[(0, 'happy'), (A('launch'), 'shocked')], layer={'y': rise(A('launch'), -.3, 90, 'smoothstep')})],
     [Prop({'id': 'g2', 'kit': {'type': 'terrain', 'top': .86, 'curve': .1, 'fill': '#857a6f', 'detail': '#5a5048', 'rocks': 3, 'bumps': 6, 'seed': 4}}, Box(0, .86 * H, W, H, 'g2')),
      kit(F, 'speed', 'speedometer', .16, .45, .24, level=[{'frame': 0, 'value': .2}, {'frame': A('fast'), 'value': .85}]),
      kit(F, 'ml', 'motion-lines', .42, .9, .14, rotation=90, opacity=show_from(A('launch')))],
     [Note('MOON ?', 0, 'header', pos=(W / 2, 92)), Note('permanently.', A('Permanently'), 'title', color=GOLD_T, pos=(1500, 560))], color='#2b1612')
shot('e3', None, [you(slot='center', idle=None, helmet=[(0, True), (A('off'), False)], poses=[(0, 'stand'), (A('wings'), 'cheer'), (A('fly'), 'flap')],
                    faces=[(0, 'neutral'), (A('off'), 'grin')], accessories=[('mask', A('off')), ('wings', A('wings'))], layer={'y': rise(A('fly'), -.25, 50, 'smoothstep')})],
     [Prop({'id': 'haze', 'kit': {'type': 'glow', 'x': .5, 'y': .5, 'rx': .9, 'ry': .75, 'tone': 'sun'}, 'opacity': track((0, .6))}),
      Prop({'id': 'g3', 'kit': {'type': 'terrain', 'top': .86, 'curve': .04, 'fill': '#c9843b', 'detail': '#8a5422', 'rocks': 2, 'bumps': 6, 'seed': 5}}, Box(0, .86 * H, W, H, 'g3'))],
     [Note('MOON ?', 0, 'header', pos=(W / 2, 92)), Note('no spacesuit?!', A('off', 4), pos=(1480, 420))], color='#a85a1c', cam='push')
shot('e4', 'THE MOON', [you(slot='center-left', poses=[(0, 'stand'), (A('suit', n=2), 'hands-on-hips')], faces=[(0, 'puffed'), (A('suit', n=2), 'smug')],
                          helmet=[(0, False), (A('suit', n=2), True)])],
     [gauge(.78, .55, .28, [(0, .15), (A('eight', -1), .15), (A('eight', 8), 1)], text='AIR')],
     [Note('no suit: ~15 seconds', A('fifteen'), 'note'), Note('8 hours of air', A('eight'), 'title', pos=(1500, 760))])
row = [('#8e8376'), ('#e9c94b'), ('#f1e8d8'), ('#c9843b'), ('#cfcfca'), ('#f4f8fb'), ('#6e5d4c'), ('#ecdcd8')]
shot('e5', None, [], [Prop(planet(f'moon{i}', .1 + i * .114, .5, .05, '#2b2f3d', (), craters=0, shade=.35, seed=i + 2, **pop_in(i * 3, ((.1 + i * .114) * W, .5 * H))),
                           Box((.1 + i * .114) * W - 60, .5 * H - 60, (.1 + i * .114) * W + 60, .5 * H + 60, f'moon{i}')) for i in range(8)]
     + [kit(F, f'q{i}', 'question', .1 + i * .114, .5, .07, color=GOLD_T, **pop_in(plus(A('question'), i * 2), ((.1 + i * .114) * W, .5 * H))) for i in range(8)],
     [Note('a dozen moons', A('dozen'), 'note', pos=(W / 2, 260)), Note('what kills you first?', A('first'), 'title', pos=(W / 2, 780))], cam='drift')
shot('e6', None, [], locked(A('locked')), lock_notes(A('deadliest'), A('fly')), cam='push')
shot('e7', None, [arka(slot='center-left', poses=[(0, 'point-right'), (A('decided'), 'think')], faces=[(0, 'grin'), (A('decided'), 'neutral')])],
     [kit(F, 'map', 'moon-map', .7, .52, .42, w=1.3, h=.8, text='WHERE TO LIVE?', level=[{'frame': 0, 'value': 0}, {'frame': 40, 'value': .5}, {'frame': 80, 'value': 1}])],
     [Note("Arka's apartment hunt", 4, 'title', pos=(1340, 230))])
STING = plus(A('hunting', edge='end'), 8)
sting_chars, sting_props, sting_notes, sting_sounds = brand_sting(STING, W, H)
shot('e8', None, [arka(slot='center-left', poses=[(0, 'hands-on-hips')], faces=[(0, 'smug')], layer={'opacity': show_until(STING)})] + sting_chars,
     [kit(F, 'map', 'moon-map', .7, .52, .42, w=1.3, h=.8, text='WHERE TO LIVE?', level=[{'frame': 0, 'value': 1}], opacity=show_until(STING))] + sting_props,
     [Note('apartment hunting', A('apartment'), 'note', pos=(1340, 230), until=STING)] + sting_notes, sounds=sting_sounds)

# ------------------------------------------------------------------ chapter 1: close to home
shot('e9', None, [], locked(0, .7, .86, .55, .1), [Note('12 moons', A('Twelve'), 'note', pos=(420, 330)), Note('1 suit', A('suit'), 'note', pos=(420, 460)),
                                               Note('2 locked cards', A('locked'), 'note', pos=(420, 590))] + lock_notes(A('locked'), A('locked'), .72, .7, .86))
shot('e10', 'THE MOON', [], where(F, 'earth', 'The Moon', until=60) + [bigphoto('photo-apollo17-cernan', 54, x=.4)],
     [Note('Apollo 17, 1972', 60, 'title', color=GOLD_T, pos=(1450, 560)), Note('the last time anyone walked there', A('Ours', 10), 'small', pos=(1450, 700))], ground=False)
shot('e11', 'THE MOON', [you(slot='center-left', poses=[(0, 'stand'), (A('shadow'), 'cower'), (A('dust'), 'stand')], faces=[(0, 'neutral'), (A('sunlight'), 'pain'), (A('shadow'), 'scared'), (A('handles'), 'smug'), (A('dust'), 'shocked')])],
     [thermo(.78, .55, [(0, .5), (A('hundred'), .5), (A('sunlight'), .95), (A('below'), .95), (A('shadow'), .08), (A('handles'), .5)]),
      Prop(prop('dust', 'frost', .33, .84, .16, count=40, color='#8c8c88', level=[{'frame': 0, 'value': 0}, {'frame': A('dust'), 'value': 1}]))],
     [Note('+120 °C', A('sunlight')), Note('-170 °C', A('shadow'), color=ICE), Note('the DUST', A('dust'), 'title')])
shot('e12', 'THE MOON', [], [kit(F, 'lens', 'magnifier', .4, .5, .45, w=1.2, h=1.2),
                            Prop(prop('grains', 'frost', .4, .5, .17, count=30, color='#6e6e6a', level=[{'frame': 0, 'value': 1}]))],
     [Note('no wind, no water', A('wind'), 'small'), Note('sharp, like crushed glass', A('sharp')), Note('ate through boots', A('boots'), 'small')], ground=False)
L13 = A('lander')
dust13 = Prop(prop('dust13', 'frost', .36, .5, .2, count=26, color='#9c9c96', level=[{'frame': 0, 'value': 0}, {'frame': plus(L13, 4), 'value': 0}, {'frame': A('sneezing'), 'value': .5}, {'frame': A('sneezing', 6), 'value': 1}]))
tears = [kit(F, f'tear{i}', 'drop', .325 + i * .03, .37, .022, color='#7cc4f2', opacity=show_from(A('watered')),
             y=track((0, 0), (A('watered', -1), 0), (A('watered', 40), 70, 'smoothstep'), (A('watered', 41), 0), (A('watered', 80), 70, 'smoothstep'))) for i in range(2)]
shot('e13', 'THE MOON', [you(slot='center-left', h=.52, helmet=[(0, False)], idle=None, poses=[(0, 'stand'), (A('sneezing'), 'cower'), (A('itched'), 'reach'), (A('lunar'), 'shrug')],
                           faces=[(0, 'neutral'), (A('started'), 'puffed'), (A('sneezing'), 'scream'), (A('watered'), 'sad'), (A('itched'), 'pain'), (A('lunar'), 'smug')],
                           layer={'opacity': show_from(L13)})],
     [bigphoto('photo-apollo17-schmitt', 4, x=.36, until=L13),
      Prop({'id': 'floor13', 'kit': {'type': 'terrain', 'top': .88, 'curve': 0, 'fill': '#4a5566', 'detail': '#3a4352', 'rocks': 0, 'bumps': 1, 'seed': 3}, 'opacity': show_from(L13)}, Box(0, .88 * H, W, H, 'floor13')), kit(F, 'helm13', 'helmet', .5, .83, .12, opacity=show_from(L13)), dust13, kit(F, 'achoo', 'impact', .3, .34, .14, color=GOLD_T, opacity=track((0, 0), (A('sneezing', -1), 0), (A('sneezing', 2), 1), (A('sneezing', 26), 1), (A('sneezing', 30), 0)))] + tears,
     [Note('Harrison Schmitt, Apollo 17', 8, 'note', pos=(1450, 560), until=L13), Note('inside the lander, helmet off', L13, 'small', pos=(1560, 420)),
      Note('ACHOO!', A('sneezing'), 'title', color=GOLD_T, pos=(1560, 530)), Note('watery eyes', A('watered'), 'note', pos=(1560, 640)), Note('itchy throat', A('itched'), 'note', pos=(1560, 740), arrow='you'),
      Note('"lunar hay fever"', A('lunar'), 'title', color=GOLD_T, pos=(1560, 870))], ground=False, sky=False, color='#2a3340')
shot('e14', 'THE MOON', [arka(slot='center-left', h=.5, poses=[(0, 'shrug')], faces=[(0, 'smug')])], [kit(F, 'smell', 'smell-lines', .3, .36, .16), cross(A('holiday'))], [])
shot('e15', 'THE MOON', [you(slot='center-left', poses=[(0, 'stand'), (A('down'), 'panic')], faces=[(0, 'neutral'), (A('wears'), 'scared')])],
     [gauge(.78, .45, .22, [(0, .9), (A('wears'), .9), (A('down'), .2)], text='SUIT')],
     survival('a few moonwalks', A('Survival'), SAFE) + [Note('still a top worry', A('worries'), 'small', pos=(1500, 760))])

# ------------------------------------------------------------------ Callisto
shot('e16', None, [], where(F, 'jupiter', 'Callisto', until=60) + [body('cal-big', '#6e5d4c', .4, .55, .22, craters=9, **pop_in(60, (.4 * W, .55 * H))), kit(F, 'cal', 'calendar', .86, .62, .18, text='1610', **pop_in(A('1610'), (.86 * W, .62 * H)))],
     [Note('Galileo, 1610', A('Galileo'), 'small', pos=(1640, 420))])
shot('e17', 'CALLISTO', [], [meter(.3, .55, .3, [(0, .05)], 'CALLISTO', pid='m-cal'), meter(.7, .55, .3, [(0, .05), (A('lower', -6), .3)], 'SPACE STATION', pid='m-iss')],
     [Note('safest big moon out here', A('safest'), 'small'), Note('less radiation than the ISS', A('lower'))])
shot('e18', 'CALLISTO', [arka(slot='center-left', h=.5, poses=[(0, 'hands-on-hips'), (A('catch'), 'think')], faces=[(0, 'happy'), (A('catch'), 'neutral')])],
     [kit(F, 'flag', 'flag', .6, .66, .34, w=.8, h=1.1, text='QUIET', **pop_in(A('Quiet'), (.6 * W, .66 * H)))], [Note("what's the catch?", A('catch'), 'note', pos=(1450, 300))])
shot('e19', 'CALLISTO', [you(slot='center-left', idle='breathe', poses=[(0, 'cower'), (A('Nothing'), 'stand')], faces=[(0, 'scared'), (A('Nothing'), 'asleep')])],
     [thermo(.62, .55, [(0, .5), (A('Minus'), .12)], color=ICE), kit(F, 'weed', 'tumbleweed', .8, .82, .14, x=track((0, 300), (A('billions'), 300), (plus(A('billions'), 110), -900))),
      gauge(.86, .62, .22, [(0, 1), (A('runs'), .05)])],
     [Note('-140 °C', A('Minus'), 'title', color=ICE)] + survival('8 hours', A('Survival'), SAFE, pos=(330, 300)))
shot('e20', 'CALLISTO', [arka(slot='center-left', h=.5, poses=[(0, 'shrug')], faces=[(0, 'smug')])], [cross(A('Next'))], [])
shot('e21', None, [], locked(0, .72, .88, .5, .09) + [body('d1', '#c4c4c0', .14, .5, .05), body('d2', '#6e5d4c', .26, .5, .05), kit(F, 'x1', 'cross', .14, .5, .08), kit(F, 'x2', 'cross', .26, .5, .08)],
     [Note('slow: dust, boredom', A('slow'), 'note', pos=(W * .2, 300)), Note('next: much faster', A('faster'), 'title', pos=(W / 2, 820))] + lock_notes(0, 0, .66, .72, .88), cam='push')

# ------------------------------------------------------------------ Phobos and Deimos
shot('e22', None, [], where(F, 'mars', 'Phobos', until=60) + [body('mars-big', 'mars', .4, .55, .22, **pop_in(60, (.4 * W, .55 * H))), body('pho-s', '#857a6f', .62, .42, .03, **pop_in(A('two'), (.62 * W, .42 * H))), body('dei-s', '#9a8d80', .2, .7, .022, **pop_in(A('two'), (.2 * W, .7 * H)))], [Note('Asaph Hall, 1877', A('1877'), 'small', pos=(1640, 420)), Note('2 tiny moons', A('two'), 'small', pos=(1640, 560))])
shot('e23', 'PHOBOS', [you(slot='left', poses=[(0, 'point-right'), (A('small'), 'stand')], faces=[(0, 'happy'), (A('small'), 'shocked')])],
     [kit(F, 'grav', 'pressure-arrows', .2, .72, .2, count=3, opacity=show_from(A('gravity')))],
     [Note('Mars fills the sky', A('huge'), 'note', pos=(1250, 640)), Note('gravity: almost zero', A('gravity'), 'small', pos=(1250, 780))])
shot('e24', 'PHOBOS', [you(slot='center-left', idle=None, poses=[(0, 'walk'), (A('lift'), 'float')], faces=[(0, 'happy'), (A('lift'), 'scared')], layer={'y': rise(A('lift'), -.22, 90)})],
     [kit(F, 'speed', 'speedometer', .78, .45, .24, level=[{'frame': 0, 'value': .1}, {'frame': A('five'), 'value': .55}], text='5 km/h'),
      kit(F, 'ml', 'motion-lines', .33, .9, .12, rotation=90, opacity=show_from(A('away')))],
     [Note('...bye, ground', A('away'), 'small', pos=(1450, 760))])
shot('e25', 'DEIMOS', [you(x=.4, fy=.62, h=.24, idle=None, poses=[(0, 'run'), (A('jump'), 'cheer'), (A('drift'), 'float')], faces=[(0, 'happy'), (A('jump'), 'grin'), (A('drift'), 'sad')],
                         layer={'y': rise(A('jump'), -.3, 140, 'smoothstep'), 'rotate': track((0, 0), (A('drift'), 0), (plus(A('drift'), 200), 40))})],
     [gauge(.82, .62, .18, [(0, .8), (A('drift'), .8), (A('runs'), .05)])], survival('one step too many', A('Survival'), WARN), ground=False, cam='push')
shot('e26', 'PHOBOS', [arka(slot='center-left', h=.5, poses=[(0, 'reach'), (A('Terrible'), 'shrug')], faces=[(0, 'grin'), (A('Terrible'), 'smug')])], [cross(A('Crossed'))], [])

# ------------------------------------------------------------------ Miranda
shot('e27', 'MIRANDA', [], where(F, 'uranus', 'Miranda', until=60) + [bigphoto('photo-miranda', 54, x=.38)],
     [Note('Voyager 2, 1986', A('1986'), 'small', pos=(1560, 420)), Note('no one since', A('since'), 'note', pos=(1560, 560))], ground=False)
shot('e28', 'MIRANDA', [], [cliff(F, .4, .22, .76, text='20 km'), kit(F, 'ev', 'sign', .76, .82, .2, text='Everest x2')], [Note('tallest cliff?', A('tallest'), 'title', pos=(1480, 560))], ground=False)
c = cliff(F, .38, .26, .72, text='20 km')
shot('e29', 'MIRANDA', [you(x=.35, fy=.26, h=.28, idle=None, poses=[(0, 'stand'), (A('edge'), 'tumble'), (A('silent'), 'lie')], faces=[(0, 'neutral'), (A('edge'), 'shocked'), (A('silent'), 'asleep')],
                          layer={'y': fall(A('edge', 2), .55, 140), 'x': track((0, 0), (A('edge'), 0), (A('edge', 24), 90, 'ease-out-cubic'))})],
     [c, kit(F, 'ml', 'motion-lines', .44, .2, .14, rotation=-90, opacity=show_from(A('silent')))], [Note('12 minutes', A('twelve'), 'title', pos=(1500, 600)), Note('...still falling', A('silent'), 'small', pos=(1500, 760))], ground=False)
shot('e30', 'MIRANDA', [you(slot='center-left', fy=.78, idle=None, poses=[(0, 'tumble'), (A('airbags'), 'lie')], faces=[(0, 'scream'), (A('save'), 'grin')], layer={'y': track((0, -260), (A('bottom'), 0))})],
     [kit(F, 'speed', 'speedometer', .82, .3, .2, level=[{'frame': 0, 'value': .2}, {'frame': A('hundred'), 'value': .95}], text='200 km/h'),
      kit(F, 'bag', 'airbag', .33, .74, .3, level=[{'frame': 0, 'value': 0}, {'frame': A('airbags', -4), 'value': 0}, {'frame': A('airbags', 6), 'value': 1}])],
     survival('12 minutes', A('Survival'), WARN) + [Note('...or airbags', A('airbags'), 'note', pos=(1450, 640))], sounds=[('pop', A('airbags'), -18)])
shot('e31', 'MIRANDA', [arka(slot='center-left', h=.5, poses=[(0, 'hands-on-hips')], faces=[(0, 'smug')])], [kit(F, 'bus', 'race-car', .66, .72, .18), cross(A('commute'), .78, .42)], [])

# ------------------------------------------------------------------ Enceladus
shot('e32', 'ENCELADUS', [], where(F, 'saturn', 'Enceladus', until=60) + [jet(F, 'plume', .62, .86, .5, [(0, 0), (60, 0), (80, .3), (A('breathing', -2), .3), (A('breathing', 20), .8)], color='#cfe6f7')],
     [Note('Cassini, 2005', A('2005'), 'small', pos=(1640, 420)), Note('breathing out?!', A('breathing'), 'title', pos=(1450, 330))])
shot('e33', 'ENCELADUS', [], [bigphoto('photo-enceladus', 4, x=.36),
                             kit(F, 'probe', 'probe', .8, .78, .14, x=track((0, 0), (A('straight'), 0), (plus(A('straight'), 80), -500, 'smoothstep')))],
     [Note('tiger stripes', A('stripes'), 'small', pos=(1500, 450)), Note('1,000+ km/h', A('thousand'), 'title', pos=(1500, 570)),
      Note('faster than a jet airliner', A('airliner'), 'small', pos=(1500, 690)), Note('flew through: 7 times', A('seven'), 'note', pos=(1500, 800))], ground=False)
shot('e34', 'ENCELADUS', [you(x=.5, h=.34, idle=None, poses=[(0, 'stand'), (A('throw'), 'tumble'), (A('miss'), 'panic')], faces=[(0, 'happy'), (A('throw'), 'scream')],
                            layer={'y': track((0, 0), (A('throw', -1), 0), (plus(A('throw'), 40), -.35 * H, 'ease-out-cubic'), (A('miss'), -.35 * H), (plus(A('miss'), 60), .1 * H, 'smoothstep'))})],
     [jet(F, 'geyser', .5, .86, .62, [(0, 0), (A('throw', -3), 0), (A('throw', 6), 1), (A('long'), 1), (plus(A('long'), 20), 0)])],
     [Note('vent', 4, 'small', pos=(780, 1000)), Note('up there a long time', A('long'), 'small', pos=(1450, 520)), Note('cracks: hundreds of meters deep', A('deep'), 'note', pos=(1450, 660))],
     sounds=[('whoosh', A('throw'), -20)])
shot('e35', 'ENCELADUS', [you(slot='center-left', poses=[(0, 'stand')], faces=[(0, 'scared')])], [jet(F, 'geyser', .72, .86, .5, [(0, 0), (12, .9)])],
     survival('one wrong step', A('Survival'), WARN))
shot('e36', 'ENCELADUS', [arka(slot='center-left', h=.5, poses=[(0, 'cheer'), (A('floor'), 'shrug')], faces=[(0, 'grin'), (A('floor'), 'smug')])],
     [Prop(prop('snow', 'frost', .5, .45, .45, count=40, color='#bcd3e3', level=[{'frame': 0, 'value': 1}])), cross(A('Crossed'))], [])
shot('e37', None, [arka(slot='left', h=.42, poses=[(0, 'point-right')], faces=[(0, 'neutral')])],
     [body(f'x{i}', col, .3 + i * .07, .32, .035) for i, col in enumerate(['#c4c4c0', '#6e5d4c', '#857a6f', '#9a8d80', '#cfcfca', '#f4f8fb'])]
     + [kit(F, f'xx{i}', 'cross', .3 + i * .07, .32, .06, **pop_in(plus(A('crossed'), i * 3), ((.3 + i * .07) * W, .32 * H))) for i in range(6)] + locked(A('locked'), .62, .82, .62, .1),
     [Note('six crossed off', A('six'), 'small', pos=(1100, 160)), Note('much colder...', A('colder'), 'note', pos=(1450, 900))] + lock_notes(A('locked'), A('locked'), .8, .62, .82), cam='push')

# ------------------------------------------------------------------ the cold ones
shot('e38', 'TRITON', [you(slot='center-left', poses=[(0, 'stand'), (A('Minus'), 'cower')], faces=[(0, 'neutral'), (A('Minus'), 'scared')])],
     where(F, 'neptune', 'Triton', until=60) + [thermo(.78, .55, [(0, .4), (A('Minus'), .04)], color=ICE)],
     [Note('Voyager 2, 1989', A('1989'), 'small', pos=(1640, 420)), Note('-235 °C', A('Minus'), 'title', color=ICE)])
shot('e39', 'TRITON', [], [jet(F, 'geyser', .36, .86, .6, [(0, 0), (A('geysers', -2), 0), (A('geysers', 14), .9)], color='#4a423c'),
                          jet(F, 'geyser', .62, .86, .5, [(0, 0), (A('dark'), 0), (A('dark', 14), .8)], pid='geyser2', color='#4a423c'),
                          kit(F, 'arr', 'arrow', .82, .5, .18, rotation=180, level=[{'frame': 0, 'value': 0}, {'frame': A('backwards'), 'value': 1}])],
     [Note('orbits backwards!', A('backwards'), 'small', pos=(1500, 300)), Note('8 km plumes', A('eight'), 'title', pos=(1500, 440))])
shot('e40', 'CHARON', [arka(slot='center-left', h=.45, idle='breathe', poses=[(0, 'stand'), (A('never'), 'hands-on-hips')], faces=[(0, 'neutral'), (A('never'), 'asleep')])],
     where(F, 'pluto', 'Charon', until=60), [Note('New Horizons, 2015', A('2015'), 'small', pos=(1640, 420)), Note('same spot, forever', A('forever'), 'note', pos=(1300, 640)),
                                                        Note('never rises, never sets', A('never'), 'small', pos=(1300, 780))], cam='drift')
shot('e41', 'CHARON', [you(slot='center-left', poses=[(0, 'stand'), (A('step'), 'walk')], faces=[(0, 'neutral'), (A('heat'), 'scared')])],
     [kit(F, 'thermos', 'thermos', .66, .5, .26, **pop_in(A('thermos'), (.66 * W, .5 * H))), kit(F, 'chill', 'pressure-arrows', .33, .86, .2, count=5, color=ICE, opacity=show_from(A('heat'))),
      gauge(.84, .62, .26, [(0, .8), (A('battery'), .8), (A('fight'), .35)], text='BATTERY')],
     [Note('cold kills slowly', A('fast'), 'small', pos=(1450, 760)), Note('heat leaks out', A('heat'), 'small', pos=(500, 1000))])
shot('e42', 'CHARON', [you(slot='center-left', idle=None, poses=[(0, 'cower')], faces=[(0, 'scared'), (A('Slowly'), 'asleep')])],
     [gauge(.78, .6, .26, [(0, .2), (A('wins'), 0)], text='BATTERY'), Prop(prop('frost', 'frost', .33, .62, .22, count=40, level=[{'frame': 0, 'value': 0}, {'frame': A('cold'), 'value': .2}, {'frame': A('inward'), 'value': 1}]))],
     survival('until the battery dies', A('Survival'), WARN) + [Note('the cold wins', A('wins'), 'note', color=ICE, pos=(1300, 760))])
shot('e43', 'CHARON', [arka(slot='center-left', h=.5, poses=[(0, 'stand')], faces=[(0, 'happy')])],
     [kit(F, 'bat2', 'battery', .52, .62, .24, w=1.1, h=.8, level=[{'frame': 0, 'value': 1}], **pop_in(A('battery'), (.52 * W, .62 * H))),
      kit(F, 'mug', 'mug', .7, .64, .2, **pop_in(A('coffee'), (.7 * W, .64 * H)))], [])
shot('e44', None, [], [kit(F, 'cl', 'cliff', .2, .4, .2), jet(F, 'geyser', .44, .6, .26, .8), kit(F, 'fr', 'thermometer', .66, .45, .2, w=.4, h=1.2, level=[{'frame': 0, 'value': .05}], color=ICE),
                       kit(F, 'eye', 'question', .86, .45, .14, color=GOLD_T, **pop_in(A('invisible'), (.86 * W, .45 * H)))],
     [Note('you could see these coming', A('coming'), 'small', pos=(W * .4, 860)), Note('this one is invisible', A('invisible'), 'title', color=GOLD_T, pos=(W / 2, 240))], cam='push')

# ------------------------------------------------------------------ the radiation countdown (climax)
shot('e45', None, [you(x=.16, fy=.86, h=.3, poses=[(0, 'shrug'), (A('alarm'), 'point-right')], faces=[(0, 'neutral'), (A('alarm'), 'shocked')])],
     [body('jupiter', 'jupiter', .5, .45, .2), belt(.5, .45, .4), meter(.84, .7, .22, [(0, 0), (A('alarm'), 0), (A('alarm', 10), .2), (A('closer'), .3), (A('clicks'), .6)], 'RADIATION')],
     [Note("Jupiter's radiation belts", A('belts'), 'title', pos=(W / 2, 900)), Note("can't see it, can't feel it", A('feel'), 'small', pos=(W / 2, 1000))],
     color='#07080f', cam='push', sounds=ticks('closer', 6, 8))
shot('e46', None, [], where(F, 'jupiter', 'Ganymede', until=60) + [body('gan', '#8e8376', .32, .55, .2, craters=6, glow='#7ec8f0'), body('mercury', '#9c8f86', .7, .55, .18, craters=8, opacity=show_from(A('Mercury')))],
     [Note('Ganymede 5,268 km', A('biggest'), 'small', near='gan'), Note('Mercury 4,879 km', A('Mercury'), 'small', near='mercury'), Note('magnetic shield', A('field'), 'title', pos=(W / 2, 920))], sounds=ticks('field', 3, 12))
shot('e47', 'GANYMEDE', [you(slot='center-left', poses=[(0, 'think')], faces=[(0, 'neutral')])],
     [meter(.62, .62, .2, [(0, .3), (A('deadly'), .45)]), kit(F, 'probe', 'probe', .82, .62, .14, **pop_in(A('JUICE'), (.82 * W, .62 * H)))],
     survival('about 2 months', A('Survival'), SAFE) + [Note('JUICE, 2034', A('JUICE'), 'note', pos=(1450, 760)), Note('first to orbit another moon', A('first'), 'small', pos=(1450, 880))],
     sounds=ticks('Survival', 4, 10))
shot('e48', None, [], where(F, 'jupiter', 'Europa', until=60) + [kit(F, 'ice', 'ice-cutaway', .5, .62, .5, w=2.0, h=1.0, level=[{'frame': 0, 'value': 0}]),
                     kit(F, 'drop1', 'drop', .8, .3, .1, opacity=show_from(A('twice'))), kit(F, 'drop2', 'drop', .87, .3, .1, opacity=show_from(A('twice')))],
     [Note('EUROPA', 0, 'header', pos=(W / 2, 92)), Note("2x Earth's oceans?", A('twice'), pos=(1450, 260)), Note('life?', A('life'), 'note', pos=(500, 260))], color='#0e1d36', sounds=ticks('Smooth', 5, 8))
shot('e49', 'EUROPA', [you(slot='center-left', poses=[(0, 'cower')], faces=[(0, 'scared')])],
     [meter(.6, .6, .2, [(0, .6), (A('never'), .82)], 'RADIATION'), kit(F, 'probe', 'probe', .84, .64, .14, x=track((0, 200), (A('swoops'), 200), (plus(A('swoops'), 60), -300, 'smoothstep')))],
     survival('about 1 day', A('Survival'), WARN) + [Note('Europa Clipper keeps its distance', A('Clipper'), 'small', pos=(1350, 820))], sounds=ticks('alarm', 7, 6))
shot('e50', None, [you(x=.36, fy=.37, h=.28, poses=[(0, 'reach')], faces=[(0, 'neutral'), (A('shield'), 'happy')])],
     [kit(F, 'ice', 'ice-cutaway', .5, .62, .5, w=2.0, h=1.0, level=[{'frame': 0, 'value': 0}, {'frame': A('shield'), 'value': 1}]), kit(F, 'shovel', 'shovel', .44, .3, .12)],
     [Note('dig!', A('dig'), pos=(1560, 300)), Note('a few meters of ice', A('ice'), 'small', pos=(1560, 420))], color='#0e1d36')
shot('e51', None, [arka(x=.3, fy=.37, h=.3, poses=[(0, 'shrug'), (A('think'), 'think')], faces=[(0, 'smug')])],
     [kit(F, 'ice', 'ice-cutaway', .5, .62, .5, w=2.0, h=1.0, level=[{'frame': 0, 'value': 0}]), kit(F, 'igloo', 'igloo', .55, .37, .16, **pop_in(A('igloo'), (.55 * W, .37 * H))),
      cross(A('think'), .8, .3, .14)], [], color='#0e1d36')
shot('e52', None, [], locked(0, .5, .86, .5, .2, open1=A('Io')) + [body('io-rev', '#e9c94b', .5, .5, .2, craters=4, **pop_in(A('Io'), (.5 * W, .5 * H))), meter(.14, .78, .18, [(0, .9), (A('Io'), 1)])],
     [Note('THE DEADLIEST', A('deadliest'), 'title', color=GOLD_T, pos=(W / 2, 200)), Note('IO', A('Io'), 'title', pos=(W / 2, 860))], color='#120c06', cam='push',
     sounds=ticks('first', 7, 4) + [('pop', A('Io'), -16)])
shot('e53', 'IO', [], where(F, 'jupiter', 'Io', until=60) + [bigphoto('photo-io', 54, x=.36, s=1.3),
                   kit(F, 'probe', 'probe', .86, .3, .12, **pop_in(A('Juno'), (.86 * W, .3 * H)))],
     [Note('~400 volcanoes', A('volcanoes'), 'small', pos=(1500, 600)), Note('Juno, 2023: 1,500 km above', A('Juno'), 'small', pos=(1500, 760)), Note('(London to Rome)', A('Rome'), 'small', pos=(1500, 860))], ground=False)
shot('e54', 'IO', [], [jet(F, 'plume', .3, .86, .55, [(0, .3), (A('volcanoes'), .7)], pid='p1'), body('jupiter', 'jupiter', .74, .34, .18), belt(.74, .34, .34),
                       meter(.18, .3, .22, [(0, .9), (A('tone'), 1)])],
     [Note("not the volcanoes", A('volcanoes'), 'note', pos=(1300, 760)), Note('one long tone', A('tone'), 'title', pos=(1300, 900))], sky=False,
     sounds=ticks('belt', 8, 5))
shot('e55', 'IO', [you(slot='center-left', poses=[(0, 'stand'), (A('late'), 'cower')], faces=[(0, 'neutral'), (A('feel'), 'shocked')])],
     [gauge(.56, .58, .26, [(0, .95)], text='AIR: 8 h'), vignette([(0, 0), (A('feel'), .15), (A('late'), .6)])],
     survival('about 3 hours', A('Survival'), DANGER) + [Note("you wouldn't feel a thing", A('feel'), 'small', pos=(1350, 760))], cam='push')
shot('e56', 'IO', [arka(slot='center-left', h=.45, idle=None, poses=[(0, 'run')], faces=[(0, 'scared')], layer={'x': track((0, 0), (A('please'), 0), (plus(A('please'), 40), 700, 'smoothstep'))})],
     [kit(F, 'rocket', 'rocket', .66, .64, .3), kit(F, 'go', 'sign', .84, .78, .16, w=1.6, h=1.0, text='EXIT')], [])

# ------------------------------------------------------------------ the one where you can fly
shot('e57', None, [], locked(0, .5, .86, .5, .2) , [Note('YOU CAN FLY', 4, 'label', color=GOLD_T, pos=(W / 2, 860)), Note('one card left', A('card'), 'note', pos=(W / 2, 200))], color='#0b0d16', cam='push')
shot('e58', None, [], [Prop({'id': 'haze', 'kit': {'type': 'glow', 'x': .5, 'y': .5, 'rx': .9, 'ry': .75, 'tone': 'sun'}, 'opacity': track((0, .55))}),
                       kit(F, 'probe', 'probe', .5, .2, .16, y=track((0, 0), (A('parachuted'), 0), (plus(A('landed'), 10), .5 * H, 'smoothstep')))],
     [Note('Huygens, 2005', A('Huygens'), 'note', pos=(1450, 300)), Note('the farthest landing ever', A('farthest'), 'title', pos=(W / 2, 900))], color='#a85a1c')
shot('e59', None, [], [bigphoto('photo-titan', 4, x=.5)],
     [Note('pebbles, river channels', A('pebbles'), 'small', pos=(W / 2, 960))], color='#a85a1c')
shot('e60', None, [], locked(0, .5, .86, .5, .2, open1=A('Titan')) + [body('ti-rev', '#c9843b', .5, .5, .2, craters=1, glow='#f2a54a', **pop_in(A('Titan'), (.5 * W, .5 * H)))],
     [Note('TITAN', A('Titan'), 'title', pos=(W / 2, 860))], color='#a85a1c', cam='push', sounds=[('pop', A('Titan'), -16)])
shot('e61', 'TITAN', [you(slot='center-left', idle=None, helmet=[(0, True), (A('need'), False)], poses=[(0, 'stand'), (A('need'), 'cheer')], faces=[(0, 'neutral'), (A('need'), 'grin')])],
     [kit(F, 'pr-ea', 'bar', .72, .46, .44, w=1.0, h=.3, level=[{'frame': 0, 'value': .66}], color='#2f7fd0', text='Earth: 1x'),
      kit(F, 'pr-ti', 'bar', .72, .64, .44, w=1.0, h=.3, level=[{'frame': 0, 'value': 1}], color='#c9843b', text='Titan: 1.5x')],
     [Note('no pressure suit!', A('all'), pos=(W * .72, 250))])
shot('e62', 'TITAN', [you(slot='center-left', helmet=[(0, False)], poses=[(0, 'stand'), (A('minus'), 'cower')], faces=[(0, 'neutral'), (A('mask'), 'happy'), (A('minus'), 'scared')],
                         accessories=[('mask', A('mask')), ('coat', A('coat'))])],
     [thermo(.62, .55, [(0, .3), (A('minus'), .1)], color=ICE), effect('rain', rain('methane', .78, .4, .0028, 0, 600, '#e8a24a', count=40, seed=9))],
     [Note('-179 °C', A('minus'), 'title', color=ICE, pos=(1500, 300)), Note('methane rain', A('rain'), 'note', pos=(1500, 760))])
shot('e63', 'TITAN', [you(slot='center-left', idle=None, helmet=[(0, False)], poses=[(0, 'stand'), (A('wings'), 'cheer'), (A('fly'), 'flap')], faces=[(0, 'happy'), (A('fly'), 'grin')],
                         accessories=[('mask', 0), ('coat', 0), ('wings', A('wings'))], layer={'y': rise(A('fly'), -.28, 60, 'smoothstep')})],
     [kit(F, 'lift-g', 'bar', .74, .7, .4, w=1.0, h=.3, level=[{'frame': 0, 'value': .14}], color='#2f7fd0', text='gravity: 1/7'),
      kit(F, 'lift-a', 'bar', .74, .84, .4, w=1.0, h=.3, level=[{'frame': 0, 'value': 1}], color='#c9843b', text='air: 4x denser')],
     [Note('FLY!', A('fly'), 'title', pos=(1250, 330))] + survival('as long as coat + oxygen', A('Survival'), SAFE, pos=(1250, 520)), cam='push')
shot('e64', 'TITAN', [arka(slot='center-left', h=.5, idle=None, poses=[(0, 'flap'), (A('sign'), 'cheer')], faces=[(0, 'grin')], accessories=[('wings', 0)], layer={'y': track((0, -20), (60, 20), (120, -20))})],
     [kit(F, 'pen', 'sign', .7, .7, .24, w=1.6, h=1.0, text='SIGN HERE', **pop_in(A('sign'), (.7 * W, .7 * H)))], [Note('this one.', A('This'), 'title', pos=(1450, 260))])
shot('e65', 'TITAN', [], [kit(F, 'drone', 'probe', .5, .5, .18, y=track((0, 20), (60, -20), (120, 20), (180, -20)), x=track((0, -300), (240, 300)))],
     [Note('Dragonfly', A('Dragonfly'), 'title', pos=(W / 2, 240)), Note('launch 2028 · flying 2034', A('2034'), 'note', pos=(W / 2, 360))])

# ------------------------------------------------------------------ ending
ends = ['#c4c4c0', '#857a6f', '#cfcfca', '#f4f8fb', '#ecdcd8', '#e9c94b']
shot('e66', None, [], [body(f'end{i}', col, .13 + i * .148, .5, .055, craters=2) for i, col in enumerate(ends)]
     + [kit(F, f'x{i}', 'cross', .13 + i * .148, .5, .12, **pop_in(plus(A('end'), i * 3), ((.13 + i * .148) * W, .5 * H))) for i in range(6)],
     [Note('launch', A('launch'), 'small', pos=(330, 760)), Note('drop', A('drop'), 'small', pos=(700, 760)), Note('freeze', A('freeze'), 'small', pos=(1140, 760)), Note('radiation', A('poison'), 'small', pos=(1560, 760))])
shot('e67', 'TITAN', [you(x=.42, fy=.6, h=.4, helmet=[(0, False)], poses=[(0, 'flap')], faces=[(0, 'grin')], accessories=[('mask', 0), ('coat', 0), ('wings', 0)], layer={'y': track((0, 0), (90, -60, 'smoothstep'))})],
     [], [Note('...and one lets you fly', A('fly'), 'title', pos=(1450, 300))])
shot('e68', None, [you(slot='center-left', helmet=[(0, False)], poses=[(0, 'stand'), (A('Sun'), 'cheer')], faces=[(0, 'happy'), (A('Sun'), 'grin')])],
     [body('home', 'earth', .74, .45, .16), kit(F, 'sun', 'sparkle', .86, .2, .2, count=8, color='#ffd25e')],
     [Note('only one world like this', A('only'), 'note', pos=(1450, 760)), Note("you're sitting on it", A('sitting'), 'title', pos=(1450, 880))], color='#1b3a5c')
shot('e69', None, [arka(slot='center-left', h=.5, poses=[(0, 'point-right')], faces=[(0, 'happy')])],
     [kit(F, 'map', 'moon-map', .72, .5, .34, w=1.3, h=.8, text='your pick?', level=[{'frame': 0, 'value': 1}])], [Note('tell us in the comments', A('comments'), 'note', pos=(1400, 860))])
shot('e70', None, [arka(slot='center-left', h=.5, poses=[(0, 'hands-on-hips'), (A('Wait'), 'think')], faces=[(0, 'smug'), (A('Wait'), 'shocked')])],
     [kit(F, 'town', 'town', .72, .88, .5, w=1.1, h=.5, level=[{'frame': 0, 'value': 1}]), kit(F, 'moon', 'crescent', .74, .3, .2, level=[{'frame': 0, 'value': 1}, {'frame': A('disappeared', -1), 'value': 1}, {'frame': A('disappeared', 4), 'value': 0}]),
      kit(F, 'q', 'question', .74, .3, .12, color=GOLD_T, **pop_in(A('disappeared', 6), (.74 * W, .3 * H)))], [], color='#0b1020')
shot('e71', None, [arka(slot='center-left', h=.5, poses=[(0, 'cheer')], faces=[(0, 'grin')])], [kit(F, 'q', 'question', .74, .3, .12, color=GOLD_T)], [Note('next episode', A('next'), 'title', pos=(1400, 760))], color='#0b1020')
shot('e72', None, [arka(slot='center-left', h=.5, poses=[(0, 'wave')], faces=[(0, 'happy')])], [], [Note('subscribe', A('Subscribe'), 'title', color=GOLD_T, pos=(1400, 560))], color='#0b1020')

# ------------------------------------------------------------------ keep explicit notes clear of the parent body (top right)
for bid, pl in ep.plans.items():
    if not NAMED.get(bid): continue
    for n in pl['notes']:
        pos = getattr(n, 'pos', None)
        if pos and pos[0] > 1250 and 120 < pos[1] < 400 and n.kind not in ('header', 'skylabel'):
            n.pos = (pos[0], pos[1] + 300)

# ------------------------------------------------------------------ style passes (no red text; light ink on dark pages)
for pl in ep.plans.values():
    for n in pl['notes']:
        if n.color in ('#ff5a4a', '#e0473a'): n.color = GOLD_T
LIGHT_INK = {'doodle-stars', 'counter', 'bar', 'bulb', 'question', 'thermometer', 'fish', 'crescent', 'orbit-ring', 'town', 'clock', 'pressure-arrows', 'cross', 'ruler',
             'check', 'small-moon', 'probe', 'signal', 'calendar', 'motion-lines', 'magnifier', 'mushroom', 'ice-cutaway', 'impact', 'geyser', 'arrow', 'smell-lines', 'tumbleweed', 'shovel', 'thermos', 'battery', 'radiation-meter', 'speedometer'}
for layer in [pr.layer for pl in ep.plans.values() for pr in pl['props']] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k.setdefault('ink', '#c9d3ea')

M = 'assets/music/'
ep.music([('e1', M + '6-space-singularity.mp3', 0), ('e9', M + '1-curious-a-science-montage.mp3', 0), ('e22', M + '2-playful-b-sweet-math.mp3', 0),
          ('e38', M + '3-eerie-b-surface-of-the-moon.mp3', 0), ('e44', M + '4-tense-a-false-vacuum-decay.mp3', 0, -2), ('e57', M + '5-uplifting-a-taking-flight.mp3', 0),
          ('e70', M + '8-space-spaghettification.mp3', 0)],
         dropouts=[('e14', 0, .8), ('e20', 0, .8), ('e26', 0, .8), ('e31', 0, .8), ('e36', 0, .8), ('e52', 0, 1.2), ('e60', 0, 1.0)], target_lufs=-16)

if __name__ == '__main__':
    board = ep.build()
    board['scenes'][-1]['durationFrames'] += END_CARD * FPS
    path = ROOT / 'storyboards/every-moon-v2.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
