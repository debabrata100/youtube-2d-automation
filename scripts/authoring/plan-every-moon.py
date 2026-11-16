"""M3.7 anthology episode (16:9): "What Would Kill You First on Every Moon in the Solar System".

One shot per sentence (or Arka line), so a new picture lands about every 5 s, following stories/every-moon-visuals.md.
This file is the single source for both the story script (stories/every-moon.json, the approved Draft 4 text split
into shots) and the storyboard (storyboards/every-moon.json). Layout, idle motion, camera and sounds are derived.

Usage: python3 scripts/authoring/plan-every-moon.py [duration_seconds] [output_storyboard]
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403

ROOT = pathlib.Path(__file__).resolve().parents[2]
STORY = ROOT / 'stories/every-moon.json'
N, K = 'narrator', 'arka'
SHOTS = []  # (beat id, intent, [(speaker, text)])


def line(bid, *parts, intent='explanation'):
    SHOTS.append((bid, intent, list(parts)))


# ------------------------------------------------------------------ script (Draft 4, approved), one shot per entry
line('h1', (N, 'On one moon in our solar system, you could step off a cliff and fall for twelve whole minutes.'), intent='hook')
line('h2', (N, 'On another, walking too fast would launch you into space.'))
line('h3', (N, 'And on one of them, you could take off your spacesuit, strap on wings, and fly.'))
line('h4', (N, 'Now, without a suit, almost any moon kills you in about fifteen seconds.'), intent='setup')
line('h5', (N, 'So you get a suit. A really good one, with eight hours of air.'), intent='setup')
line('h6', (N, 'The question is, what kills you first anyway?'), intent='setup')
line('h7', (N, "We'll save the deadliest moon for last. And the one where you can fly comes after that."), intent='setup')
line('h8', (K, "Ooh. I'm picking one to live on."), (N, 'Of course you are.'), intent='setup')
line('m1', (N, 'We start at home. Our Moon is the only one people have walked on, so we know exactly what goes wrong.'))
line('m2', (N, 'The ground swings from over one hundred degrees in sunlight to below minus one hundred and seventy in shadow.'))
line('m3', (N, 'Your suit handles both.'))
line('m4', (N, "What it can't handle is the dust. Moon dust has never been smoothed by wind or water."))
line('m5', (N, "It's sharp like broken glass, and it clings to everything."))
line('m6', (N, 'Astronauts said it smelled like burnt gunpowder.'))
line('m7', (N, 'After just three moonwalks, the Apollo seventeen suits were already wearing out.'))
line('m8', (N, 'So on the Moon, the dust slowly chews through your suit. Stay long enough, and something gives.'))
line('c1', (N, 'Out at Jupiter, Callisto is the safest big moon in the outer solar system.'))
line('c2', (N, 'The radiation here is even lower than on the International Space Station.'))
line('c3', (K, 'Callisto! Safe! I pick Callisto!'))
line('c4', (N, "It's minus one hundred and forty degrees, dark, and covered in more craters than anywhere we know."))
line('c5', (N, 'Nothing happens here. Ever.'))
line('c6', (K, 'Not this one.'))
line('p1', (N, 'The two little moons of Mars.'))
line('p2', (N, 'From Phobos, Mars fills a huge part of the sky.'))
line('p3', (K, 'Ooh, a view! This one!'))
line('p4', (N, 'But these moons are so small, their gravity barely holds you.'))
line('p5', (N, 'On parts of Phobos, just walking faster than about five kilometers per hour could lift you off the ground for good.'))
line('p6', (N, "You'd push off for a step, and the ground would slowly fall away beneath your boots."))
line('p7', (N, 'On Deimos, one strong jump would do it.'))
line('p8', (N, "And then you'd drift, watching Mars turn, until your air ran out."))
line('p9', (K, 'Not this one either.'))
line('r1', (N, 'At Uranus, the moon Miranda has what may be the tallest cliff in the solar system, possibly twenty kilometers high.'))
line('r2', (N, "That's more than twice the height of Everest."))
line('r3', (N, "Step off the edge, and Miranda's gravity is so weak that you'd fall for about twelve minutes."))
line('r4', (N, 'Twelve silent minutes, watching the ground get closer.'))
line('r5', (N, "You'd hit the bottom at about two hundred kilometers per hour. Without protection, that's the end."))
line('r6', (N, 'But NASA scientists think you could survive it with the right airbags.'))
line('r7', (K, 'I brought one!'))
line('e1', (N, 'At Saturn, little Enceladus is the brightest object in the solar system, covered in fresh snow.'))
line('e2', (K, "It's snowing! This one, this one!"))
line('e3', (N, 'That snow comes from geysers.'))
line('e4', (N, 'Near the south pole, long cracks called tiger stripes blast water and ice into space at over a thousand kilometers per hour.'))
line('e5', (N, 'Stand over a vent, and the jet could throw you high into the sky.'))
line('e6', (N, "In gravity this weak, you'd be up there a long time."))
line('e7', (N, 'And if you miss your landing, the tiger stripes are cracks about half a kilometer deep.'))
line('e8', (K, 'Not this one either.'))
line('t1', (N, 'Now we go far from the Sun.'))
line('t2', (N, "Neptune's moon Triton is minus two hundred and thirty-five degrees, one of the coldest places ever measured."))
line('t3', (N, 'It orbits Neptune backwards, and it still has geysers, blasting dark nitrogen eight kilometers into the sky.'))
line('t4', (N, "Further out, Pluto's moon Charon is almost as cold."))
line('t5', (N, 'From Charon, Pluto hangs in the exact same spot in the sky, forever. It never rises, and never sets.'))
line('t6', (N, "Here, the cold doesn't kill you fast. Your suit is like a thermos."))
line('t7', (N, 'But every step on the frozen ground pulls heat from your boots, and your heaters drain the battery to fight it.'))
line('t8', (N, 'When the battery dies, the cold wins. Slowly. From your fingers and toes inward.'))
line('t9', (K, 'Hot chocolate. Lots of hot chocolate.'))
line('x1', (N, "Now the deadliest part of the solar system: Jupiter's radiation belt."))
line('x2', (N, "You can't see it. You can't feel it. But your suit's radiation alarm can."))
line('x3', (N, 'And the closer to Jupiter you go, the faster it ticks.'))
line('g1', (N, 'Ganymede is the biggest moon in the solar system, bigger than the planet Mercury.'))
line('g2', (N, "It's also the only moon with its own magnetic field, a weak shield against the radiation."))
line('g3', (N, "It's weak, but it helps. Here, a deadly dose would take about two months to build up."))
line('g4', (N, 'So Ganymede is fine for a visit. Not for a home.'))
line('u1', (N, "Closer in, Europa. Smooth white ice, hiding an ocean that may hold twice as much water as all of Earth's oceans."))
line('u2', (K, 'An ocean! Aliens, maybe! This one!'))
line('u3', (N, "Up on the surface, the alarm never stops. You'd take in a deadly dose in about a day."))
line('u4', (N, 'Your only chance is to dig. A few meters of ice would shield you completely.'))
line('u5', (K, "So I'd live… in an igloo."), (N, 'On an alien ocean. Yes.'))
line('u6', (K, '…Not this one either.'))
line('i1', (N, 'And the deadliest moon of all: Io, the most volcanic place in the solar system.'))
line('i2', (N, 'It has about four hundred active volcanoes, some blasting sulfur four hundred kilometers into space.'))
line('i3', (N, "But the volcanoes aren't what gets you. Io sits deep inside Jupiter's radiation belt."))
line('i4', (N, "On Io, your suit's alarm turns into one long scream."))
line('i5', (N, "You'd absorb a deadly dose in about three hours, long before your air runs out."))
line('i6', (N, "And the worst part? You wouldn't feel a thing until it was far too late."))
line('i7', (K, 'Get me out of here.'))
line('z1', (N, "And finally, the moon we promised. Saturn's moon Titan."), intent='payoff')
line('z2', (N, 'Titan has air. Thick air, about one and a half times the pressure on Earth.'), intent='payoff')
line('z3', (N, "So you don't need a pressure suit at all."), intent='payoff')
line('z4', (N, "You'd still need an oxygen mask, and the warmest coat ever made, because it's minus one hundred and seventy-nine degrees."), intent='payoff')
line('z5', (N, 'It even rains here. But the rain is liquid methane, filling lakes and seas bigger than some on Earth.'), intent='payoff')
line('z6', (N, 'And with gravity this low and air this thick, you could strap wings to your arms and actually fly.'), intent='payoff')
line('z7', (K, "This one. It's this one. We're going to this one. And if I crash, I brought an airbag."), intent='payoff')
line('k1', (N, 'So, almost every moon in our solar system would get you in the end.'), intent='closing')
line('k2', (N, "Some would launch you, some would freeze you slowly, and some would poison you with radiation you can't even feel."), intent='closing')
line('k3', (N, 'But one would let you fly.'), intent='closing')
line('k4', (N, 'Which moon would you pick? Tell us in the comments.'), (K, 'Titan. Obviously.'), intent='closing')


def phrases(text, limit=34):
    """Caption phrases: break at sentence ends, otherwise before a word that would pass `limit` characters."""
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…]$', cur): out.append(cur); cur = ''
    return out + ([cur] if cur else [])


def write_story(duration):
    beats = []
    for bid, intent, parts in SHOTS:
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
        assert len(ph) <= 12, bid
        beats.append({'id': bid, 'sceneId': f'em-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'every-moon', 'title': 'What Would Kill You First on Every Moon in the Solar System',
             'topic': 'Even in a good spacesuit: what kills you first on twelve moons (dust, drifting off, a 12-minute fall, geysers, cold, Jupiter radiation) and Titan, where you could fly',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/every-moon.json', 'candidatesReport': 'stories/every-moon-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')


DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 520
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.backdrop(stars=20)

ICE, MAG = '#2f7fd0', '#a24bd6'
helmet_on = [(0, True)]


def you(**k):
    k.setdefault('helmet', helmet_on); return Char('you', **k)


def arka(**k):
    return Char('arka', 'arka', **k)


def shot(bid, name, chars=(), props=(), notes=(), cam='settle', sky=True, ground=True, sounds=(), focus=None, stamps=()):
    world_props, header = world(F, name, sky=sky, ground=ground) if name else ([], None)
    ep.scene(bid, dict(chars=list(chars), props=world_props + list(props), notes=([header] if header else []) + list(notes), camera=cam,
                       focus=focus, sounds=list(sounds), stamps=list(stamps)))


def cross(at, x=.86, y=.5, size=.18):
    return kit(F, 'nope', 'cross', x, y, size, **pop_in(at, (x * W, y * H)))


def meter(x, y, size, levels, text=None, pid='meter'):
    extra = {'text': text} if text else {}
    return kit(F, pid, 'radiation-meter', x, y, size, w=1.0, h=.75, level=[{'frame': f, 'value': v} for f, v in levels], **extra)


def gauge(x, y, size, levels, text='AIR', pid='gauge'):
    return kit(F, pid, 'battery', x, y, size, w=1.1, h=.8, text=text, level=[{'frame': f, 'value': v} for f, v in levels])


def thermo(x, y, levels, color=None):
    extra = {'color': color} if color else {}
    return kit(F, 'thermo', 'thermometer', x, y, .3, w=.4, h=1.2, level=[{'frame': f, 'value': v} for f, v in levels], **extra)


def body(pid, kind, x, y, r, craters=0, glow=None):
    spec = dict(SKY_BODIES.get(kind, {'base': kind})); ring = spec.pop('ring', False)
    layer = planet(pid, x, y, r, spec['base'], spec.get('bands', ()), craters=craters, ring=ring, shade=.25, seed=len(pid))
    if glow: layer['kit']['glow'] = glow
    k = (1.9 if ring else 1.1)
    return Prop(layer, Box((x - r * k * H / W) * W, (y - r * 1.1) * H, (x + r * k * H / W) * W, (y + r * 1.1) * H, pid))


def fall(at, dy=.5, frames=70):
    return track((0, 0), (plus(at, -1), 0), (plus(at, frames), dy * H, 'smoothstep'))


def rise(at, dy=-.35, frames=80, ease='ease-out-cubic'):
    return track((0, 0), (plus(at, -1), 0), (plus(at, frames), dy * H, ease))


# ------------------------------------------------------------------ cold open
c = cliff(F, .34, .34, .56, text='20 km')
shot('h1', 'MIRANDA', [you(x=.31, fy=.34, h=.3, idle=None, poses=[(0, 'stand'), (A('step'), 'tumble')], faces=[(0, 'happy'), (A('step'), 'scream')],
                         layer={'y': fall(A('step', 4), .55, 110), 'x': track((0, 0), (A('step'), 0), (A('step', 20), 70, 'ease-out-cubic'))})],
     [c], [Note('12:00', A('twelve'), 'title', pos=(1450, 640))], ground=False, cam='push', sounds=[('whoosh', A('step', 4), -22)])
shot('h2', 'PHOBOS', [you(slot='center', poses=[(0, 'walk'), (A('launch'), 'float')], faces=[(0, 'happy'), (A('launch'), 'shocked')], idle=None,
                        layer={'y': rise(A('fast'), -.22, 70)})],
     [kit(F, 'ml', 'motion-lines', .42, .9, .14, rotation=90, opacity=show_from(A('fast')))], [Note('too fast!', A('fast'))])
shot('h3', 'TITAN', [you(slot='center', idle=None, helmet=[(0, True), (A('off'), False)], poses=[(0, 'stand'), (A('wings'), 'cheer'), (A('wings', 8), 'flap')],
                       faces=[(0, 'neutral'), (A('off'), 'grin')], accessories=[('mask', A('off')), ('wings', A('wings'))], layer={'y': rise(A('wings', 8), -.22, 50, 'smoothstep')})],
     [], [Note('no spacesuit?!', A('off', 4))], cam='push')
shot('h4', 'THE MOON', [Char('stick', 'stick', slot='center', idle=None, poses=[(0, 'stand'), (A('fifteen'), 'panic')], faces=[(0, 'puffed'), (A('fifteen'), 'scared')])],
     [], [Note('no suit', A('without'), 'small'), Note('~15 seconds', A('fifteen'), 'title')])
shot('h5', 'THE MOON', [you(slot='center', poses=[(0, 'stand'), (A('good'), 'hands-on-hips')], faces=[(0, 'neutral'), (A('good'), 'smug')], enter=('pop', A('suit')))],
     [gauge(.8, .55, .22, [(0, 1)])], [Note('8 hours of air', A('eight'), near='gauge')])
row = [('gm', '#8e8376'), ('io', '#e9c94b'), ('eu', '#f1e8d8'), ('ti', '#c9843b'), ('mi', '#cfcfca'), ('en', '#f4f8fb')]
shot('h6', None, [], [Prop(planet(f'moon-{p}', .14 + i * .144, .55, .06, col, (), craters=3, shade=.25, seed=i + 2, **pop_in(i * 5, ((.14 + i * .144) * W, .55 * H))),
                           Box((.14 + i * .144) * W - 70, .55 * H - 70, (.14 + i * .144) * W + 70, .55 * H + 70, f'moon-{p}')) for i, (p, col) in enumerate(row)]
     + [kit(F, f'q{i}', 'question', .14 + i * .144, .38, .1, **pop_in(A('first', i * 2), ((.14 + i * .144) * W, .38 * H))) for i in range(6)],
     [Note('what kills you first?', A('kills'), 'title')], cam='drift')
shot('h7', None, [], [body('deadly', '#e9c94b', .3, .55, .14, craters=4), body('flyer', '#c9843b', .7, .55, .14, craters=2)],
     [Note('deadliest: last', A('deadliest'), near='deadly'), Note('you can fly!', A('fly'), near='flyer')])
shot('h8', None, [arka(slot='center', poses=[(0, 'point-right'), (A('Of'), 'hands-on-hips')], faces=[(0, 'grin'), (A('Of'), 'smug')])],
     [kit(F, 'flag', 'flag', .62, .62, .3, w=.8, h=1.1, text='MY MOON', **pop_in(A('picking'), (.62 * W, .62 * H)))], [Note("Arka's moon hunt", A('picking'), 'title')])

# ------------------------------------------------------------------ the Moon
shot('m1', 'THE MOON', [], [photo(ep, F, 'photo-apollo17-schmitt', 'nasa/inserts/photo-apollo17-schmitt.png', A('walked'), x=.5, y=.47, scale=.72)],
     [Note('Apollo 17, 1972', A('walked', 6), 'small', pos=(W / 2, 960))], ground=False)
shot('m2', 'THE MOON', [you(slot='center-left', poses=[(0, 'stand'), (A('shadow'), 'cower')], faces=[(0, 'neutral'), (A('sunlight'), 'pain'), (A('shadow'), 'scared')])],
     [thermo(.78, .55, [(0, .5), (A('hundred'), .5), (A('sunlight'), .95), (A('below'), .95), (A('shadow'), .08)])],
     [Note('+120 °C', A('sunlight')), Note('-170 °C', A('shadow'), color=ICE)])
shot('m3', 'THE MOON', [you(slot='center', poses=[(0, 'hands-on-hips')], faces=[(0, 'smug')])], [kit(F, 'ok', 'check', .72, .45, .2, **pop_in(A('handles'), (.72 * W, .45 * H)))],
     [Note('suit: fine', A('both'), 'small')])
shot('m4', 'THE MOON', [you(slot='center-left', poses=[(0, 'walk'), (A('dust', 0, n=2), 'stand')], faces=[(0, 'happy'), (A('dust'), 'shocked')])],
     [Prop(prop('dust', 'frost', .33, .82, .16, count=40, color='#8c8c88', level=[{'frame': 0, 'value': 0}, {'frame': A('dust'), 'value': 1}]))],
     [Note('the DUST', A('dust'), 'title'), Note('no wind, no water', A('wind'), 'small')])
shot('m5', 'THE MOON', [], [kit(F, 'lens', 'magnifier', .45, .5, .45, w=1.2, h=1.2),
                           Prop(prop('grains', 'frost', .45, .5, .17, count=30, color='#6e6e6a', level=[{'frame': 0, 'value': 1}]))],
     [Note('sharp like glass', A('sharp')), Note('clings to everything', A('clings'), 'small')], ground=False)
shot('m6', 'THE MOON', [arka(slot='center-left', h=.5, poses=[(0, 'reach')], faces=[(0, 'neutral'), (A('smelled'), 'tongue')])],
     [kit(F, 'smell', 'smell-lines', .42, .4, .18, opacity=show_from(A('smelled')))], [Note('burnt gunpowder?', A('gunpowder'), near='arka')])
shot('m7', 'THE MOON', [], [photo(ep, F, 'photo-apollo17-cernan', 'nasa/inserts/photo-apollo17-cernan.png', A('Apollo'), x=.6, y=.47, scale=.66, box=(.3, .14, .7, .84))],
     [Note('3 moonwalks', A('three'), 'title', pos=(330, 420))], ground=False)
shot('m8', 'THE MOON', [you(slot='center-left', poses=[(0, 'stand'), (A('gives'), 'panic')], faces=[(0, 'neutral'), (A('chews'), 'scared'), (A('gives'), 'scream')], react=[A('gives')])],
     [gauge(.78, .45, .22, [(0, .9), (A('chews'), .9), (A('gives'), .1)], text='SUIT')], [Note('worn through', A('gives'))])

# ------------------------------------------------------------------ Callisto
shot('c1', 'CALLISTO', [you(slot='center-left', poses=[(0, 'wave')], faces=[(0, 'happy')])], [], [Note('safest big moon', A('safest'), 'title')])
shot('c2', 'CALLISTO', [], [meter(.3, .55, .3, [(0, .05)], 'CALLISTO', pid='m-cal'), meter(.7, .55, .3, [(0, .05), (A('lower', -6), .3)], 'SPACE STATION', pid='m-iss')],
     [Note('less radiation than the ISS', A('lower'))])
shot('c3', 'CALLISTO', [arka(slot='center-left', h=.5, poses=[(0, 'cheer')], faces=[(0, 'grin')])],
     [kit(F, 'flag', 'flag', .52, .66, .38, w=.8, h=1.1, text="ARKA'S", **pop_in(A('pick'), (.52 * W, .66 * H)))], [])
shot('c4', 'CALLISTO', [arka(slot='center-left', h=.5, poses=[(0, 'cower')], faces=[(0, 'scared')])],
     [thermo(.78, .55, [(0, .5), (A('minus'), .12)], color=ICE)], [Note('-140 °C', A('minus'), 'title', color=ICE), Note('craters everywhere', A('craters'), 'small')])
shot('c5', 'CALLISTO', [arka(slot='center-left', h=.5, idle='breathe', poses=[(0, 'stand')], faces=[(0, 'asleep')])],
     [kit(F, 'weed', 'tumbleweed', .8, .8, .16, x=track((0, 300), (110, -900)))], [Note('zzz...', A('Ever'), 'title')])
shot('c6', 'CALLISTO', [arka(slot='center-left', h=.5, poses=[(0, 'shrug')], faces=[(0, 'sad')])], [cross(A('one'), .72, .5)], [])

# ------------------------------------------------------------------ Phobos and Deimos
shot('p1', None, [], [body('mars', 'mars', .5, .55, .2), kit(F, 'phobos', 'small-moon', .78, .38, .1, rotation=-15), kit(F, 'deimos', 'small-moon', .2, .3, .07, rotation=20)],
     [Note('Phobos', 4, 'label', near='phobos'), Note('Deimos', 8, 'label', near='deimos')], cam='drift')
shot('p2', 'PHOBOS', [you(slot='left', poses=[(0, 'point-right')], faces=[(0, 'happy')])], [], [Note('Mars: huge!', A('fills'))])
shot('p3', 'PHOBOS', [arka(slot='center-left', h=.5, poses=[(0, 'reach')], faces=[(0, 'grin')])], [], [Note('a view!', A('view'), near='arka')])
shot('p4', 'PHOBOS', [you(slot='center', poses=[(0, 'stand')], faces=[(0, 'shocked')])],
     [kit(F, 'grav', 'pressure-arrows', .42, .7, .25, count=3, opacity=show_from(A('gravity')))], [Note('gravity: almost zero', A('gravity'))])
shot('p5', 'PHOBOS', [you(slot='center-left', idle=None, poses=[(0, 'walk'), (A('lift'), 'float')], faces=[(0, 'happy'), (A('lift'), 'scared')], layer={'y': rise(A('lift'), -.18, 60)})],
     [kit(F, 'speed', 'speedometer', .78, .45, .26, level=[{'frame': 0, 'value': .1}, {'frame': A('five'), 'value': .55}], text='5 km/h')], [])
shot('p6', 'PHOBOS', [you(slot='center', idle=None, poses=[(0, 'float')], faces=[(0, 'scared')], layer={'y': rise(0, -.16, 160, 'smoothstep')})],
     [kit(F, 'ml', 'motion-lines', .42, .88, .14, rotation=90)], [Note('...bye, ground', A('away'), 'small')], cam='push')
shot('p7', 'DEIMOS', [you(slot='center', idle=None, poses=[(0, 'run'), (A('strong'), 'cheer')], faces=[(0, 'happy'), (A('strong'), 'grin')], layer={'y': rise(A('strong'), -.25, 50)})],
     [], [Note('one jump', A('jump'))])
shot('p8', 'DEIMOS', [you(x=.4, fy=.55, h=.22, idle=None, poses=[(0, 'float')], faces=[(0, 'sad')], layer={'rotate': track((0, 0), (240, 40))})],
     [gauge(.78, .4, .2, [(0, .7), (A('ran'), .05)])], [Note('drifting...', A('drift'), 'small')], ground=False, cam='push')
shot('p9', 'PHOBOS', [arka(slot='center-left', h=.5, poses=[(0, 'shrug')], faces=[(0, 'sad')])], [cross(A('either'), .56, .55)], [])

# ------------------------------------------------------------------ Miranda
shot('r1', 'MIRANDA', [], [photo(ep, F, 'photo-miranda', 'nasa/inserts/photo-miranda.png', A('Miranda'), x=.42, y=.5, scale=.68, box=(.3, .14, .7, .86))],
     [Note('~20 km tall', A('twenty'), 'title', pos=(1530, 470))], ground=False)
shot('r2', 'MIRANDA', [], [cliff(F, .36, .2, .66, text='20 km'), Prop({'id': 'everest', 'kit': {'type': 'mountain', 'seed': 4}} if False else prop('ev', 'sign', .74, .82, .2, text='Everest x2'))],
     [Note('2x Everest', A('twice'), 'title')], ground=False)
c = cliff(F, .34, .3, .6)
shot('r3', 'MIRANDA', [you(x=.31, fy=.3, h=.3, idle=None, poses=[(0, 'stand'), (A('edge'), 'tumble')], faces=[(0, 'neutral'), (A('edge'), 'shocked'), (A('weak'), 'scared')],
                         layer={'y': fall(A('edge', 2), .25, 200), 'x': track((0, 0), (A('edge'), 0), (A('edge', 24), 90, 'ease-out-cubic'))})],
     [c], [Note('12:00', A('twelve'), 'title', pos=(1500, 600))], ground=False)
shot('r4', 'MIRANDA', [you(x=.5, fy=.55, h=.3, idle=None, poses=[(0, 'lie')], faces=[(0, 'asleep')], layer={'y': track((0, -30), (300, 30))})],
     [kit(F, 'ml', 'motion-lines', .5, .25, .18, rotation=-90)], [Note('...still falling', A('silent'), 'small'), Note('7:41', A('closer'), 'title', pos=(1500, 300))], ground=False)
shot('r5', 'MIRANDA', [you(slot='center-left', idle=None, poses=[(0, 'tumble')], faces=[(0, 'scream')], layer={'y': track((0, -260), (A('bottom'), 0))})],
     [kit(F, 'speed', 'speedometer', .78, .42, .26, level=[{'frame': 0, 'value': .2}, {'frame': A('hundred'), 'value': .95}], text='200 km/h'),
      kit(F, 'car', 'race-car', .78, .68, .2), vignette([(0, 0), (A('end', -6), 0), (A('end', 4), .8)])], [])
shot('r6', 'MIRANDA', [you(slot='center-left', fy=.78, idle=None, poses=[(0, 'lie')], faces=[(0, 'dizzy'), (A('survive'), 'grin')])],
     [kit(F, 'bag', 'airbag', .33, .74, .3, level=[{'frame': 0, 'value': 0}, {'frame': A('survive', -4), 'value': 0}, {'frame': A('survive', 6), 'value': 1}])],
     [Note('survivable!', A('airbags'))], sounds=[('pop', A('survive'), -18)])
shot('r7', 'MIRANDA', [arka(slot='center', h=.5, poses=[(0, 'cheer')], faces=[(0, 'grin')])],
     [kit(F, 'bag', 'airbag', .62, .6, .16, level=[{'frame': 0, 'value': 0}, {'frame': 8, 'value': 1}])], [])

# ------------------------------------------------------------------ Enceladus
shot('e1', 'ENCELADUS', [you(slot='center-left', poses=[(0, 'cower')], faces=[(0, 'pain'), (A('brightest', 6), 'smug')])],
     [kit(F, 'shades', 'sunglasses', .33, .43, .1, **pop_in(A('brightest', 4), (.33 * W, .43 * H)))], [Note('brightest thing in the solar system', A('brightest'), 'small')])
shot('e2', 'ENCELADUS', [arka(slot='center-left', h=.5, poses=[(0, 'cheer')], faces=[(0, 'grin')])],
     [Prop(prop('snow', 'frost', .5, .45, .45, count=40, color='#bcd3e3', level=[{'frame': 0, 'value': 1}]))], [])
shot('e3', 'ENCELADUS', [arka(x=.22, h=.42, poses=[(0, 'reach')], faces=[(0, 'shocked')])],
     [jet(F, 'geyser', .58, .86, .72, [(0, 0), (A('geysers', -2), 0), (A('geysers', 14), .95)])], [Note('geysers!', A('geysers'), near='geyser')])
shot('e4', 'ENCELADUS', [], [photo(ep, F, 'photo-enceladus', 'nasa/inserts/photo-enceladus.png', A('pole'), x=.4, y=.47, scale=.66, box=(.3, .16, .7, .82))],
     [Note('tiger stripes', A('stripes'), 'small', pos=(1500, 420)), Note('1,000+ km/h', A('thousand'), 'title', pos=(1500, 600))], ground=False)
shot('e5', 'ENCELADUS', [you(x=.5, h=.34, idle=None, poses=[(0, 'stand'), (A('throw'), 'tumble')], faces=[(0, 'happy'), (A('throw'), 'scream')], layer={'y': rise(A('throw'), -.32, 40)})],
     [jet(F, 'geyser', .5, .86, .75, [(0, 0), (A('throw', -3), 0), (A('throw', 6), 1)])], [], sounds=[('whoosh', A('throw'), -20)])
shot('e6', 'ENCELADUS', [you(x=.45, fy=.4, h=.24, idle=None, poses=[(0, 'float')], faces=[(0, 'asleep')], layer={'rotate': track((0, -10), (240, 30))})],
     [kit(F, 'cal', 'calendar', .8, .5, .2, values=[{'frame': 0, 'value': 1}, {'frame': A('long'), 'value': 5}])], [Note('still up here...', A('long'), 'small')], ground=False)
shot('e7', 'ENCELADUS', [you(x=.54, fy=.3, h=.24, idle=None, poses=[(0, 'tumble')], faces=[(0, 'scream')], layer={'y': fall(A('miss'), .3, 120)})],
     [cliff(F, .44, .62, .4), Prop(prop('cliff2', 'cliff', .62, .62, .4, rotation=0, opacity=track((0, 1))), None)],
     [Note('500 m deep', A('half'), 'title')], ground=False)
shot('e8', 'ENCELADUS', [arka(slot='center-left', h=.5, poses=[(0, 'shrug')], faces=[(0, 'sad')])], [cross(A('either'), .72, .5)], [])

# ------------------------------------------------------------------ Triton and Charon
shot('t1', None, [], [Prop({'id': 'sun', 'kit': {'type': 'sun', 'x': .5, 'y': .5, 'radius': .12}, 'anchor': {'x': W / 2, 'y': H / 2}, 'scale': track((0, 1.6), (150, .25, 'smoothstep'))},
                           Box(W * .35, H * .25, W * .65, H * .75, 'sun'))], [Note('far from the Sun', A('far'), 'title', pos=(W / 2, 900))], cam='push')
shot('t2', 'TRITON', [you(slot='center-left', poses=[(0, 'stand'), (A('minus'), 'cower')], faces=[(0, 'neutral'), (A('minus'), 'scared')])],
     [thermo(.78, .55, [(0, .4), (A('minus'), .04)], color=ICE)], [Note('-235 °C', A('minus'), 'title', color=ICE), Note('one of the coldest places', A('coldest'), 'small')])
shot('t3', 'TRITON', [], [jet(F, 'geyser', .36, .86, .6, [(0, 0), (A('geysers', -2), 0), (A('geysers', 14), .9)], color='#4a423c'),
                         jet(F, 'geyser', .62, .86, .5, [(0, 0), (A('dark'), 0), (A('dark', 14), .8)], pid='geyser2', color='#4a423c')],
     [Note('orbits backwards!', A('backwards'), 'small'), Note('8 km', A('eight'), 'title')])
shot('t4', 'CHARON', [you(slot='center-left', poses=[(0, 'cower')], faces=[(0, 'scared')])], [thermo(.78, .55, [(0, .06)], color=ICE)], [Note('-220 °C', A('cold'), 'title', color=ICE)])
shot('t5', 'CHARON', [arka(slot='center-left', h=.45, idle='breathe', poses=[(0, 'stand'), (A('never'), 'hands-on-hips')], faces=[(0, 'neutral'), (A('never'), 'asleep')])],
     [], [Note('same spot, forever', A('forever'), 'small'), Note('never rises, never sets', A('never'), 'small')], cam='drift')
shot('t6', 'CHARON', [you(slot='center-left', poses=[(0, 'stand')], faces=[(0, 'neutral')])], [kit(F, 'thermos', 'thermos', .66, .6, .3, **pop_in(A('thermos'), (.66 * W, .6 * H)))],
     [Note('not fast...', A('fast'), 'small'), Note('a thermos', A('thermos'))])
shot('t7', 'CHARON', [you(slot='center-left', poses=[(0, 'walk')], faces=[(0, 'scared')])],
     [kit(F, 'chill', 'pressure-arrows', .33, .86, .2, count=5, color=ICE, opacity=show_from(A('heat'))), gauge(.78, .45, .22, [(0, .8), (A('battery'), .8), (A('fight'), .35)], text='BATTERY')],
     [Note('heat leaks out', A('heat'), 'small')])
shot('t8', 'CHARON', [you(slot='center-left', poses=[(0, 'cower')], faces=[(0, 'scared'), (A('Slowly'), 'asleep')], idle=None)],
     [gauge(.78, .45, .22, [(0, .2), (A('dies'), 0)], text='BATTERY'), Prop(prop('frost', 'frost', .33, .62, .22, count=40, level=[{'frame': 0, 'value': 0}, {'frame': A('cold'), 'value': .2}, {'frame': A('inward'), 'value': 1}]))],
     [Note('the cold wins', A('wins'), color=ICE)])
shot('t9', 'TRITON', [arka(slot='center-left', h=.5, poses=[(0, 'stand')], faces=[(0, 'happy')])], [kit(F, 'mug', 'mug', .56, .6, .2, **pop_in(4, (.56 * W, .6 * H)))], [])

# ------------------------------------------------------------------ radiation countdown
belt = lambda x, y, s: kit(F, 'belt', 'radiation-belt', x, y, s, w=2.1, h=.8)
shot('x1', None, [], [body('jupiter', 'jupiter', .45, .5, .22), belt(.45, .5, .42)], [Note("Jupiter's radiation belt", A('belt'), 'title', pos=(W / 2, 930))], cam='push')
shot('x2', None, [you(slot='center-left', poses=[(0, 'shrug'), (A('alarm'), 'point-right')], faces=[(0, 'neutral'), (A('alarm'), 'shocked')])],
     [meter(.76, .5, .32, [(0, 0), (A('alarm'), 0), (A('alarm', 10), .4)], 'RADIATION')], [Note("can't see it", A('see'), 'small'), Note("can't feel it", A('feel'), 'small')])
shot('x3', None, [], [body('jupiter', 'jupiter', .2, .5, .22), belt(.2, .5, .42), meter(.8, .32, .26, [(0, .1), (A('closer'), .2), (A('ticks'), .8)])]
     + [body(f'mn{i}', col, x, .62, .035) for i, (col, x) in enumerate([('#e9c94b', .44), ('#f1e8d8', .54), ('#8e8376', .66)])],
     [Note('closer = faster', A('faster'))], sounds=[('tick', A('closer', 4 * k), -22) for k in range(4)])

# ------------------------------------------------------------------ Ganymede
shot('g1', None, [], [body('gan', '#8e8376', .32, .55, .2, craters=6), body('mercury', '#9c8f86', .7, .55, .18, craters=8)],
     [Note('Ganymede 5,268 km', A('biggest'), 'small', near='gan'), Note('Mercury 4,879 km', A('Mercury'), 'small', near='mercury')])
shot('g2', None, [], [body('gan', '#8e8376', .45, .52, .2, craters=6, glow='#7ec8f0'), belt(.45, .52, .5)], [Note('magnetic shield', A('field'), 'title', pos=(W / 2, 920))])
shot('g3', 'GANYMEDE', [you(slot='center-left', poses=[(0, 'shrug')], faces=[(0, 'neutral')])],
     [kit(F, 'cal', 'calendar', .8, .5, .22, text='60'), meter(.6, .32, .22, [(0, .15), (A('months'), .3)])], [Note('~2 months', A('months'), 'title')])
shot('g4', 'GANYMEDE', [you(slot='center-left', poses=[(0, 'wave')], faces=[(0, 'happy')])], [kit(F, 'sign', 'sign', .7, .7, .3, w=1.8, h=1.0, text='VISITORS ONLY')], [])

# ------------------------------------------------------------------ Europa
shot('u1', None, [], [kit(F, 'ice', 'ice-cutaway', .5, .62, .5, w=2.0, h=1.0, level=[{'frame': 0, 'value': 0}]), kit(F, 'drop1', 'drop', .8, .3, .12, opacity=show_from(A('twice'))),
                      kit(F, 'drop2', 'drop', .88, .3, .12, opacity=show_from(A('twice'))), kit(F, 'drop3', 'drop', .2, .3, .12, opacity=show_from(A('twice')))],
     [Note('EUROPA', 0, 'header', pos=(W / 2, 92)), Note('2x Earth\'s oceans', A('twice'))])
shot('u2', None, [arka(x=.4, fy=.37, h=.3, poses=[(0, 'reach')], faces=[(0, 'grin')])],
     [kit(F, 'ice', 'ice-cutaway', .5, .62, .5, w=2.0, h=1.0, level=[{'frame': 0, 'value': 0}]), kit(F, 'fish', 'fish', .62, .86, .16, x=track((0, 0), (200, -220)))], [Note('aliens?', A('Aliens'), near='arka')])
shot('u3', 'EUROPA', [you(slot='center-left', poses=[(0, 'cower')], faces=[(0, 'scared')])], [meter(.76, .5, .3, [(0, .6), (A('never'), .85)], 'RADIATION')],
     [Note('~1 day', A('day'), 'title')])
shot('u4', None, [you(x=.36, fy=.37, h=.28, poses=[(0, 'reach')], faces=[(0, 'neutral'), (A('shield'), 'happy')])],
     [kit(F, 'ice', 'ice-cutaway', .5, .62, .5, w=2.0, h=1.0, level=[{'frame': 0, 'value': 0}, {'frame': A('shield'), 'value': 1}]), kit(F, 'shovel', 'shovel', .44, .3, .12)],
     [Note('dig!', A('dig'), pos=(1560, 300)), Note('a few metres of ice', A('ice'), 'small', pos=(1560, 420))])
shot('u5', None, [arka(x=.3, fy=.37, h=.3, poses=[(0, 'shrug')], faces=[(0, 'sad')])],
     [kit(F, 'ice', 'ice-cutaway', .5, .62, .5, w=2.0, h=1.0, level=[{'frame': 0, 'value': 0}]), kit(F, 'igloo', 'igloo', .55, .37, .16, **pop_in(A('igloo'), (.55 * W, .37 * H)))], [])
shot('u6', 'EUROPA', [arka(slot='center-left', h=.5, poses=[(0, 'shrug')], faces=[(0, 'sad')])], [cross(A('either'), .72, .5)], [])

# ------------------------------------------------------------------ Io
shot('i1', 'IO', [], [photo(ep, F, 'photo-io', 'nasa/inserts/photo-io.png', A('Io'), x=.42, y=.47, scale=1.1, box=(.33, .2, .67, .8))],
     [Note('most volcanic place', A('volcanic'), 'small', pos=(1500, 600))], ground=False)
shot('i2', 'IO', [], [jet(F, 'plume', .3, .86, .6, [(0, .2), (A('four'), .6)], pid='p1'), jet(F, 'plume', .62, .86, .7, [(0, 0), (A('blasting'), 0), (A('blasting', 20), .95)], pid='p2')],
     [Note('~400 volcanoes', A('volcanoes'), 'small'), Note('400 km high', A('kilometers'), 'title')], sky=False)
shot('i3', None, [], [body('jupiter', 'jupiter', .45, .5, .22), belt(.45, .5, .42), body('io', '#e9c94b', .62, .55, .03)],
     [Note('Io: deep inside', A('inside'), 'small', near='io')], cam='punch' if False else 'push')
shot('i4', 'IO', [you(slot='center-left', poses=[(0, 'stand'), (A('scream'), 'panic')], faces=[(0, 'neutral'), (A('scream'), 'scream')], react=[A('scream')])],
     [meter(.6, .62, .3, [(0, .5), (A('alarm'), .98)], 'RADIATION')], [], sounds=[('tick', A('alarm', k * 3), -20) for k in range(6)])
shot('i5', 'IO', [you(slot='center-left', poses=[(0, 'stand')], faces=[(0, 'shocked')])],
     [gauge(.56, .4, .2, [(0, .95)], text='AIR: 8 h'), kit(F, 'cal', 'calendar', .56, .68, .2, text='3 h')], [Note('~3 hours', A('three'), 'title')])
shot('i6', 'IO', [you(slot='center-left', poses=[(0, 'wave')], faces=[(0, 'happy')])], [vignette([(0, 0), (A('feel'), .15), (A('late'), .85)])],
     [Note("you wouldn't feel a thing", A('feel'), 'small')], cam='push')
shot('i7', 'IO', [arka(slot='center-left', h=.45, idle=None, poses=[(0, 'run')], faces=[(0, 'scared')], layer={'x': track((0, 0), (60, 600, 'smoothstep'))})],
     [kit(F, 'rocket', 'rocket', .62, .66, .3)], [])

# ------------------------------------------------------------------ Titan
shot('z1', 'TITAN', [you(slot='center-left', poses=[(0, 'wave')], faces=[(0, 'happy')])], [], [Note('the twist', A('promised'), 'title')])
shot('z2', 'TITAN', [you(slot='center-left', poses=[(0, 'stand')], faces=[(0, 'happy')])], [chest_arrows(F, you(slot='center-left'), A('Thick'), direction='in', color=BLUE)],
     [Note('1.5x Earth pressure', A('half'))])
shot('z3', 'TITAN', [you(slot='center-left', idle=None, helmet=[(0, True), (A('need'), False)], poses=[(0, 'stand'), (A('need'), 'cheer')], faces=[(0, 'neutral'), (A('need'), 'grin')])],
     [], [Note('no pressure suit!', A('all'))])
shot('z4', 'TITAN', [you(slot='center-left', helmet=[(0, False)], poses=[(0, 'stand'), (A('minus'), 'cower')], faces=[(0, 'neutral'), (A('mask'), 'happy'), (A('minus'), 'scared')],
                       accessories=[('mask', A('mask')), ('coat', A('coat'))])], [thermo(.78, .55, [(0, .3), (A('minus'), .1)], color=ICE)],
     [Note('-179 °C', A('minus'), 'title', color=ICE)])
shot('z5', 'TITAN', [], [effect('rain', rain('methane', .4, .7, .0028, 0, 400, '#c9843b', count=60, seed=9)),
                         photo(ep, F, 'photo-titan', 'nasa/inserts/photo-titan.png', A('lakes'), x=.6, y=.47, scale=.62, box=(.3, .16, .7, .82))],
     [Note('methane rain', A('rain'), pos=(380, 420)), Note('lakes and seas', A('lakes'), 'small', pos=(380, 560))])
shot('z6', 'TITAN', [you(slot='center-left', idle=None, helmet=[(0, False)], poses=[(0, 'stand'), (A('wings'), 'cheer'), (A('arms'), 'flap')], faces=[(0, 'happy'), (A('arms'), 'grin')],
                       accessories=[('mask', 0), ('coat', 0), ('wings', A('wings'))], layer={'y': rise(A('arms'), -.25, 50, 'smoothstep')})], [], [Note('FLY!', A('fly'), 'title')], cam='push')
shot('z7', 'TITAN', [you(x=.3, fy=.55, h=.4, idle='float', helmet=[(0, False)], poses=[(0, 'flap')], faces=[(0, 'grin')], accessories=[('mask', 0), ('coat', 0), ('wings', 0)]),
                     arka(x=.62, fy=.5, h=.34, poses=[(0, 'flap'), (A('crash'), 'cheer')], faces=[(0, 'grin')], accessories=[('wings', 0)])],
     [kit(F, 'bag', 'airbag', .62, .45, .18, level=[{'frame': 0, 'value': 0}, {'frame': A('airbag', -2), 'value': 0}, {'frame': A('airbag', 8), 'value': 1}])],
     [Note('this one!', A('going'), near='arka')])

# ------------------------------------------------------------------ closing
ends = [('#c4c4c0', 'dust'), ('#857a6f', 'drift'), ('#cfcfca', 'fall'), ('#f4f8fb', 'geyser'), ('#ecdcd8', 'cold'), ('#e9c94b', 'radiation')]
shot('k1', None, [], [body(f'end{i}', col, .13 + i * .148, .5, .055, craters=2) for i, (col, _) in enumerate(ends)]
     + [kit(F, f'x{i}', 'cross', .13 + i * .148, .5, .12, **pop_in(A('every', i * 3), ((.13 + i * .148) * W, .5 * H))) for i in range(6)], [Note('almost every moon...', A('end'), 'title', pos=(W / 2, 830))])
shot('k2', None, [], [jet(F, 'geyser', .2, .7, .36, .8), Prop(prop('frost', 'frost', .5, .55, .14, count=30, level=[{'frame': 0, 'value': 0}, {'frame': A('freeze'), 'value': 1}])),
                      meter(.8, .55, .26, [(0, .1), (A('poison'), .95)])],
     [Note('launch', A('launch'), 'small', pos=(384, 860)), Note('freeze', A('freeze'), 'small', pos=(960, 860)), Note('radiation', A('poison'), 'small', pos=(1536, 860))])
shot('k3', None, [you(x=.42, fy=.6, h=.4, helmet=[(0, False)], poses=[(0, 'flap')], faces=[(0, 'grin')], accessories=[('mask', 0), ('coat', 0), ('wings', 0)])],
     [body('titan', '#c9843b', .76, .45, .14, craters=1)], [Note('Titan', A('fly'), 'title', near='titan')])
shot('k4', 'TITAN', [arka(slot='center-left', h=.5, poses=[(0, 'point-right'), (A('Titan'), 'wave'), (A('Obviously', 40), 'flap')], faces=[(0, 'happy'), (A('Titan'), 'grin')], accessories=[('wings', 0)],
                         layer={'y': rise(A('Obviously', 40), -.6, 120, 'smoothstep')})],
     [kit(F, 'bye', 'sign', .72, .7, .26, w=1.8, h=1.0, text='SEE YOU ON TITAN', **pop_in(A('Obviously', 20), (.72 * W, .7 * H)))], [Note('which moon would you pick?', A('pick'), 'small'), Note('tell us in the comments', A('comments'), 'small')])

# ------------------------------------------------------------------ music: one licensed track per section, drop-outs before punchlines
M = 'assets/music/'
ep.music([('h1', M + '1-curious-a-science-montage.mp3', 0), ('p1', M + '2-playful-b-sweet-math.mp3', 0), ('t1', M + '3-eerie-b-surface-of-the-moon.mp3', 0),
          ('x1', M + '4-tense-b-standoff.mp3', 0), ('z1', M + '5-uplifting-a-taking-flight.mp3', 0)],
         dropouts=[('r7', 0, 1.0), ('c6', 0, .8), ('p9', 0, .8), ('e8', 0, .8), ('u6', 0, .8), ('i6', 30, 2.5), ('z3', 0, 1.0)])

if __name__ == '__main__':
    path, board = ep.write(sys.argv[2] if len(sys.argv) > 2 else None)
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
