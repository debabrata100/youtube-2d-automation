"""M3.8 long episode (16:9): "What If the Moon Disappeared Tonight?".

Single source for the story script (stories/moon-gone.json), generated from the approved script draft 1 in
stories/moon-gone-script.md (one shot per line). The storyboard section is added after narration, once real timing exists.

Usage: python3 scripts/authoring/plan-moon-gone.py --script-only
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403

ROOT = pathlib.Path(__file__).resolve().parents[2]
STORY = ROOT / 'stories/moon-gone.json'
N, K = 'narrator', 'arka'
SHOTS = []  # (beat id, intent, [(speaker, text)])


def line(bid, *parts, intent='explanation'):
    SHOTS.append((bid, intent, list(parts)))


# ------------------------------------------------------------------ script (draft 1, approved 18 Nov 2026), one shot per line

# Cold open: 9:00 PM
line('m1', (N, "Tonight, at exactly nine o'clock, the Moon disappears. No explosion. No warning. It's simply gone."), intent='hook')
line('m2', (K, 'Uh... where did it go? I was standing right here!'), intent='hook')
line('m3', (N, 'For a moment, nothing changes. The Moon is so far away that its last light is still on the way. It takes about one and a third seconds to reach us.'), intent='hook')
line('m4', (N, 'Then the sky goes out.'), intent='hook')
line('m5', (N, "You've probably heard what happens next. Earth tips over. The seasons go crazy. We all freeze. Everyone dies."), intent='setup')
line('m6', (N, "That's what most videos say. It's not what the newest science says. So let's find out what would really happen: the first night, the first week, and the next million years."), intent='setup')
line('m7', (K, 'And whether I need a new job.'), intent='setup')

# Chapter 1: The first night
line('m8', (N, 'On a clear night, a full Moon lights the ground about a hundred times more than the stars alone. Without it, every night becomes the darkest kind of night. Forever.'), intent='explanation')
line('m9', (N, "For us, that mostly means more streetlights. For a lot of animals, it's a much bigger deal."), intent='explanation')
line('m10', (N, 'Even we might notice. In 2021, scientists tracked the sleep of Indigenous communities in Argentina and of college students in Seattle. In the few days before a full moon, people went to bed later and slept less, even in a city full of electric light.'), intent='explanation')
line('m11', (N, 'Without the Moon, that monthly rhythm in our sleep would have nothing left to follow.'), intent='explanation')
line('m12', (K, 'So the Moon was keeping you up all along? Rude.'), intent='explanation')
line('m13', (N, "Take lions. In the Serengeti, lions eat best on dark nights, when there's no moonlight to give them away. Around the full Moon, their bellies are emptier, and they have to hunt more by day."), intent='explanation')
line('m14', (N, "So without the Moon, every single night is a hunter's night. Great news for lions. Not such great news for everything they eat."), intent='explanation')
line('m15', (K, 'Note to self: never be a zebra.'), intent='explanation')
line('m16', (N, "Now go north, to the Arctic winter, where the Sun doesn't rise for weeks. Tiny sea animals called zooplankton follow the Moon instead. Across the whole Arctic Ocean, they rise and sink with it, and at every full moon, they dive deep to hide from hunters."), intent='explanation')
line('m17', (N, 'Take the Moon away, and their clock simply stops.'), intent='explanation')
line('m18', (K, 'So who tells them when to go to bed?'), intent='explanation')
line('m19', (N, "Nobody. That's the problem."), intent='explanation')

# Chapter 2: The first week
line('m20', (N, "The next morning, someone at the beach notices something odd. The tide isn't coming in the way it should."), intent='explanation')
line('m21', (N, "Tides happen because the Moon's gravity pulls on our oceans. The Sun pulls too, but it's so far away that its effect is much weaker."), intent='explanation')
line('m22', (N, 'Without the Moon, the Sun is left on its own, and the tides shrink to about a third of their size.'), intent='explanation')
line('m23', (N, 'Beaches that flood and drain twice a day would barely move. Mudflats, tide pools and mangrove forests, whole worlds that live between high and low tide, would slowly start to change.'), intent='explanation')
line('m24', (N, "Tides also do something you'd never notice from a beach. As they sweep over underwater mountains, they stir the deep ocean. Scientists estimate that tides could supply about half of the energy that keeps the deep sea mixed."), intent='explanation')
line('m25', (N, "The Sun's tides would still stir a little. But the deep ocean would grow calmer, and over thousands of years, that could change how heat and nutrients travel around the planet."), intent='explanation')
line('m26', (K, 'So the Moon was secretly stirring the soup?'), intent='explanation')
line('m27', (N, 'Pretty much. And under the sea, something else goes wrong.'), intent='explanation')
line('m28', (N, "Every year, a few nights after a full moon, the corals of the Great Barrier Reef release their eggs together. It's the biggest mass spawning on Earth, and moonlight is one of the signals that tells them when."), intent='explanation')
line('m29', (K, 'So no Moon... no party?'), intent='explanation')
line('m30', (N, 'Corals also listen to the water temperature, the tides and the sunset, so some would still spawn. But maybe not all on the same night. And for corals, timing is everything.'), intent='explanation')

# Chapter 3: The first year
line('m31', (N, "A year later, some things haven't changed at all. Earth stays in its orbit. A year is still a year. The Moon has only about one percent of Earth's mass, so at first, Earth hardly notices it's gone."), intent='explanation')
line('m32', (N, 'But a few things are gone forever. Total solar eclipses were always a lucky accident. The Sun is about four hundred times wider than the Moon, and also about four hundred times farther away, so from Earth they look almost exactly the same size.'), intent='explanation')
line('m33', (N, 'Without the Moon, no more solar eclipses. No more lunar eclipses. Not ever again.'), intent='explanation')
line('m34', (K, 'I never even got to see one!'), intent='explanation')
line('m35', (N, "And here's a strange one: our days stop getting longer."), intent='explanation')
line('m36', (N, 'To see why, go back about four and a half billion years. A young planet about the size of Mars smashed into the early Earth. The debris became our Moon, and it left Earth spinning once every four or five hours.'), intent='explanation')
line('m37', (K, 'Wait. The Moon was born in a crash?'), intent='explanation')
line('m38', (N, 'A very big one. And ever since, the Moon has been slowing us down.'), intent='explanation')
line('m39', (N, 'Day by day, the days got longer. Even a Tyrannosaurus rex had days about twenty minutes shorter than yours.'), intent='explanation')
line('m40', (N, 'It works like a brake. The Moon pulls on the oceans, and the oceans drag on the spinning Earth. Every century, our day gets about one and three-quarter milliseconds longer. Without the Moon, most of that brake is gone.'), intent='explanation')
line('m41', (K, 'So I never get that extra hour of sleep?'), intent='explanation')
line('m42', (N, "You weren't going to get it anyway. At that speed, it takes millions of years just to add one minute."), intent='explanation')

# Chapter 4: The big myth
line('m43', (N, 'Now for the part everyone talks about: the tilt.'), intent='explanation')
line('m44', (N, "Earth is tilted by about twenty-three and a half degrees. That tilt is what gives us seasons. Over the last million years, it has only rocked between about twenty-two and twenty-four and a half degrees, and even that small rocking helps pace Earth's ice ages."), intent='explanation')
line('m45', (N, 'The Moon helps keep that tilt steady. So what happens without it?'), intent='explanation')
line('m46', (N, "In 1993, a famous study found that without the Moon, Earth's tilt could swing anywhere from zero all the way to eighty-five degrees. At eighty-five degrees, Earth would be lying on its side, with months of endless day and months of endless night."), intent='explanation')
line('m47', (K, 'That sounds... bad.'), intent='explanation')
line('m48', (N, "That idea spread everywhere. It's in books, in articles, and in most videos about this question."), intent='explanation')
line('m49', (N, 'But in 2012, NASA scientist Jack Lissauer and his team ran much more detailed simulations. Their answer was far calmer. Earth would wobble more than it does today, but in their simulations it stayed roughly between twelve and thirty-eight degrees, even over a hundred million years.'), intent='explanation')
line('m50', (N, "That's still a big change. A bigger tilt means hotter summers and colder winters, and the climate would swing more over long stretches of time. But no sudden flip. And no instant freeze."), intent='explanation')
line('m51', (N, "And we have a real example to look at. Mars has two tiny moons, far too small to steady it. Its tilt wanders a lot over millions of years, and there's evidence of swings of at least forty-five degrees."), intent='explanation')
line('m52', (K, 'So Mars is what happens when nobody holds your hand.'), intent='explanation')
line('m53', (N, 'Exactly. Earth without the Moon would be a bit more like Mars. Wobblier. But not tumbling.'), intent='explanation')
line('m54', (K, "So we're not all doomed?"), intent='explanation')
line('m55', (N, 'Not tonight. And not because of the tilt.'), intent='explanation')

# Chapter 5: A million years later
line('m56', (N, 'Now jump ahead a million years.'), intent='explanation')
line('m57', (N, 'Life would adapt. It always does. Animals that once followed the Moon would find other clocks: the Sun, the seasons, the temperature of the water. Some would struggle. Some would disappear. New ones would take their place.'), intent='explanation')
line('m58', (N, 'And the night sky would be the darkest and starriest any human has ever seen.'), intent='explanation')
line('m59', (N, 'We would lose something too. For thousands of years, people counted time by the Moon. The word "month" comes from "moon". Even Monday is the Moon\'s day.'), intent='explanation')
line('m60', (K, 'So without the Moon... no Mondays?'), intent='explanation')
line('m61', (N, "You'd still have Mondays, Arka. Sorry."), intent='explanation')

# Chapter 6: The twist
line('m62', (N, "Here's the twist. The Moon is already leaving."), intent='payoff')
line('m63', (N, 'Every year, it drifts about three point eight centimeters farther away, about as fast as your fingernails grow. We know because Apollo astronauts left mirrors on the Moon, and scientists still bounce lasers off them today.'), intent='payoff')
line('m64', (K, 'Wait... is it leaving because of me?'), intent='payoff')
line('m65', (N, "No, Arka. It's the tides. The same tides that slow Earth's spin push the Moon a little farther out."), intent='payoff')
line('m66', (N, "If it keeps drifting at today's pace, then in roughly six hundred million years, the Moon will look too small to cover the Sun, and the last total solar eclipse will happen."), intent='payoff')
line('m67', (N, "But it won't get away. Long before it could, our Sun will grow old and change everything. So the Moon isn't going anywhere for billions of years."), intent='payoff')

# Ending
line('m68', (N, "So if the Moon vanished tonight, we wouldn't all die. But we'd lose our light at night, two-thirds of our tides, every eclipse, and a clock that life has followed since long before us."), intent='closing')
line('m69', (N, "Look up tonight. It's still there."), intent='closing')
line('m70', (K, "And so am I! Subscribe, and I'll call you from the next world we visit!"), intent='closing')
line('m71', (N, 'Next time on Gahanarka: we take away something even bigger.'), intent='closing')


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
        beats.append({'id': bid, 'sceneId': f'mg-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'moon-gone', 'title': 'What If the Moon Disappeared Tonight?',
             'topic': 'Thought experiment: the Moon vanishes tonight. Darker nights (lions, Arctic plankton, human sleep), tides at about a third, less deep-ocean mixing, coral spawning cue, no eclipses, days stop lengthening, the 0-85 degree tilt myth vs 12-38 degrees (Lissauer 2012), Mars as the example, the Moon receding 3.8 cm a year',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/moon-gone.json', 'candidatesReport': 'stories/moon-gone-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    s = write_story(int(sys.argv[2]) if len(sys.argv) > 2 else 600)
    words = sum(len(b['narration'].split()) for b in s['beats'])
    print('wrote', STORY.name, len(s['beats']), 'beats,', words, 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ storyboard (16:9, night sky)
import recipes
LIGHT = '#eef1f8'
recipes.INK = LIGHT  # night page: small labels in light ink
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 600
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'paint-night'
ep.backdrop(stars=26)
SUN = '#ffcf4a'


def head(text):
    """Chapter header, fixed at the top centre: viewers always know where they are on the timeline."""
    return Note(text, 0, 'header', pos=(W / 2, round(.085 * H)))


def arka(x=.3, fy=.8, h=.5, poses=((0, 'float'),), faces=((0, 'happy'),), **k):
    return Char('arka', 'arka', x=x, fy=fy, h=h, poses=list(poses), faces=list(faces), **k)


def moon(pid, x, y, size, lit=1, **extra):
    return kit(F, pid, 'crescent', x, y, size, level=[{'frame': 0, 'value': lit}], **extra)


def earth(pid, x, y, r, **layer):
    return Prop(planet(pid, x, y, r, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), shade=.2, seed=3, **layer), Box((x - r * H / W) * W, (y - r) * H, (x + r * H / W) * W, (y + r) * H, pid))


def sun(pid, x, y, r, **layer):
    return Prop(planet(pid, x, y, r, SUN, ('#ffe27a', SUN), shade=.05, seed=2, **layer), Box((x - r * H / W) * W, (y - r) * H, (x + r * H / W) * W, (y + r) * H, pid))


def lv(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def shot(bid, chapter, chars=(), props=(), notes=(), cam='settle', sounds=(), stamps=()):
    ep.scene(bid, explain(list(chars), list(props), ([head(chapter)] if chapter else []) + list(notes), camera_preset=cam, sounds=list(sounds),
                          stamps=[(i + (1 if chapter else 0), a) for i, a in stamps]))


T0, T1, T2, T3 = 'TONIGHT, 9:00 PM', 'THE FIRST NIGHT', 'THE FIRST WEEK', 'THE FIRST YEAR'

# ------------------------------------------------------------------ cold open
shot('m1', T0, [], [kit(F, 'town', 'town', .42, .88, 0.81, w=1.1, h=.5, level=lv((0, 1))),
                    moon('moon', .66, .34, 0.33, opacity=show_until(plus(A('disappears'), 2))),
                    moon('ghost', .66, .34, 0.33, lit=0, opacity=show_from(plus(A('disappears'), 2)))],
     [Note('gone.', A('gone'), 'title', pos=(1250, 640))], cam='push', sounds=[('whoosh', A('disappears'), -20)])
shot('m2', None, [arka(x=.55, fy=.62, h=.44, poses=[(0, 'float'), (A('where'), 'shrug')], faces=[(0, 'shocked')])],
     [kit(F, 'orbit', 'orbit-ring', .55, .5, .75, w=1.0, h=1.0)], [Note('?', A('where'), 'title', pos=(1360, 300))])
shot('m3', T0, [], [earth('earth', .2, .55, .2), moon('ghost', .8, .45, 0.25, lit=0),
                    kit(F, 'beam', 'signal', .7, .48, .5, rotation=180, color='#fff6c8', opacity=show_until(A('us', edge='end')))],
     [Note('last moonlight', A('light'), 'small'), Note('1.3 seconds', A('third'), 'title')])
shot('m4', T0, [], [kit(F, 'town', 'town', .42, .86, 0.9, w=1.1, h=.5, level=lv((0, 1)), opacity=show_until(A('out'))),
                    kit(F, 'town2', 'town', .42, .86, 0.9, w=1.1, h=.5, level=lv((0, 0)), opacity=show_from(A('out'))),
                    moon('ghost', .7, .3, 0.25, lit=0)],
     [Note('the sky goes out', A('out'), 'title', pos=(1180, 560))], cam='push')
shot('m5', T0, [], [kit(F, 'tilt', 'earth-axis', .25, .55, .6, rotation=23, level=lv((0, 1)), rotate=track((0, 0), (A('tips'), 0), (plus(A('tips'), 40), 60, 'smoothstep')), anchor={'x': .25 * W, 'y': .55 * H})],
     [Note('Earth tips over', A('tips'), 'note'), Note('seasons go crazy', A('crazy'), 'note'), Note('we all freeze', A('freeze'), 'note'), Note('everyone dies', A('dies'), 'title')])
shot('m6', T0, [], [kit(F, 'q', 'question', .25, .5, 0.39)],
     [Note('"we all die"', 4, 'title'), Note('what science says', A('science'), 'note'),
      Note('night · week · million years', A('million'), 'small')], stamps=[(0, A('newest'))])
shot('m7', None, [arka(x=.32, poses=[(0, 'shrug')], faces=[(0, 'sad')])],
     [kit(F, 'job', 'sign', .62, .55, 0.42, w=1.8, h=1.0, text='MOON JOB: GONE?', **pop_in(A('job'), (.62 * W, .55 * H)))], [])

# ------------------------------------------------------------------ chapter 1: the first night
shot('m8', T1, [], [kit(F, 'b1', 'bar', .3, .45, 0.65, w=1.0, h=.4, text='full Moon', level=lv((0, 0), (20, .95)), color='#ffe27a'),
                    kit(F, 'b2', 'bar', .3, .72, 0.65, w=1.0, h=.4, text='stars only', level=lv((0, 0), (40, .012)), color='#7fc0ff')],
     [Note('~100x darker', A('hundred'), 'title'), Note('forever', A('Forever'), 'note')])
shot('m9', T1, [], [kit(F, 'town', 'town', .3, .8, 0.65, w=1.1, h=.5, level=lv((0, 1))),
                    kit(F, 'lion', 'lion', .72, .62, 0.39, w=1.2, h=.8, level=lv((0, .5)), **pop_in(A('animals'), (.72 * W, .62 * H)))],
     [Note('more streetlights', A('streetlights'), 'small'), Note('animals: big deal', A('animals'), 'note')])
shot('m10', T1, [], [kit(F, 'bed', 'bed', .3, .62, 0.59, w=1.0, h=.6, level=lv((0, 1))),
                     kit(F, 'cal', 'calendar', .3, .3, 0.21, text='FULL', **pop_in(A('full'), (.3 * W, .3 * H)))],
     [Note('2021 study', A('2021'), 'small'), Note('Argentina + Seattle', A('Seattle'), 'small'),
      Note('later to bed, less sleep', A('later'), 'note'), Note('even in a city', A('city'), 'note')])
shot('m11', T1, [], [kit(F, 'bed', 'bed', .3, .62, 0.59, w=1.0, h=.6, level=lv((0, 0))), moon('ghost', .3, .3, 0.18, lit=0)],
     [Note('rhythm: nothing to follow', A('nothing'), 'note')])
shot('m12', None, [arka(x=.32, poses=[(0, 'hands-on-hips')], faces=[(0, 'smug')])], [moon('m', .7, .35, 0.2)],
     [Note('rude.', A('Rude'), 'title', pos=(1330, 640))])
shot('m13', T1, [], [kit(F, 'lion1', 'lion', .28, .62, 0.44, w=1.2, h=.8, level=lv((0, 1))),
                     kit(F, 'lion2', 'lion', .68, .62, 0.44, w=1.2, h=.8, level=lv((0, 0)), **pop_in(A('emptier'), (.68 * W, .62 * H))),
                     moon('m', .68, .3, 0.15, opacity=show_from(A('full')))],
     [Note('Serengeti', A('Serengeti'), 'small'), Note('dark night: full belly', A('dark'), 'note', near='lion1'), Note('full Moon: hungry', A('emptier'), 'note', near='lion2')])
shot('m14', T1, [], [kit(F, 'lion', 'lion', .3, .64, 0.44, w=1.2, h=.8, level=lv((0, 1))),
                     kit(F, 'zebra', 'zebra', .66, .64, 0.42, w=1.2, h=.9, x=track((0, 0), (A('eat'), 0), (plus(A('eat'), 25), 320, 'ease-out-cubic')))],
     [Note("every night: a hunter's night", A("hunter's"), 'note'), Note('great for lions', A('lions'), 'small')])
shot('m15', None, [arka(x=.3, poses=[(0, 'cower')], faces=[(0, 'scared')])], [kit(F, 'zebra', 'zebra', .66, .62, 0.42, w=1.2, h=.9)],
     [Note('never be a zebra', A('zebra'), 'title', pos=(1250, 330))])
shot('m16', T1, [], [kit(F, 'plank', 'plankton', .32, .55, 0.65, w=1.1, h=1.0, count=34, level=lv((0, .2), (80, .25), (140, .85), (220, .85))),
                     moon('m', .32, .2, 0.12)],
     [Note('Arctic winter', A('Arctic'), 'small'), Note('no Sun for weeks', A('weeks'), 'small'), Note('zooplankton', A('zooplankton'), 'note'),
      Note('full Moon: dive deep', A('dive'), 'note')])
shot('m17', T1, [], [kit(F, 'plank', 'plankton', .3, .55, 0.65, w=1.1, h=1.0, count=34, level=lv((0, .5))), kit(F, 'clock', 'clock', .7, .5, 0.39, level=lv((0, 0)), text='stopped')],
     [Note('their clock stops', A('stops'), 'title')])
shot('m18', None, [arka(x=.32, poses=[(0, 'think')], faces=[(0, 'neutral')])], [kit(F, 'plank', 'plankton', .68, .55, 0.52, w=1.1, h=1.0, count=20, level=lv((0, .5)))],
     [Note('bedtime?', A('bed'), 'note', pos=(1300, 300))])
shot('m19', T1, [], [kit(F, 'plank', 'plankton', .4, .55, 0.65, w=1.1, h=1.0, count=30, level=lv((0, .3), (60, .6), (120, .4))),
                     kit(F, 'q1', 'question', .25, .35, 0.18), kit(F, 'q2', 'question', .55, .3, 0.16)],
     [Note('nobody.', A('Nobody'), 'title')])

# ------------------------------------------------------------------ chapter 2: the first week
shot('m20', T2, [], [kit(F, 'tide', 'tide-gauge', .3, .55, 0.65, w=.4, h=1.0, level=lv((0, 1), (60, .35)), text='TIDE')],
     [Note('next morning', A('morning'), 'small'), Note('something odd...', A('odd'), 'note')])
shot('m21', T2, [], [earth('earth', .3, .55, .17), moon('m', .7, .5, 0.18), kit(F, 'pull', 'pressure-arrows', .45, .55, 0.33, rotation=0, direction='out', count=3),
                     sun('sun', .1, .3, .07, opacity=show_from(A('Sun')))],
     [Note('the Moon pulls the oceans', A('gravity'), 'note'), Note('Sun: much weaker', A('weaker'), 'small', near='sun')])
shot('m22', T2, [], [kit(F, 't1', 'tide-gauge', .25, .55, 0.59, w=.4, h=1.0, level=lv((0, 1)), text='with Moon'),
                     kit(F, 't2', 'tide-gauge', .45, .55, 0.59, w=.4, h=1.0, level=lv((0, .33)), text='without', **pop_in(A('shrink'), (.45 * W, .55 * H)))],
     [Note('about 1/3', A('third'), 'title')])
shot('m23', T2, [], [kit(F, 'tide', 'tide-gauge', .25, .55, 0.59, w=.4, h=1.0, level=lv((0, .33)), text='TIDE'), kit(F, 'fish', 'fish', .45, .72, 0.21)],
     [Note('mudflats', A('Mudflats'), 'note'), Note('tide pools', A('pools'), 'note'), Note('mangroves', A('mangrove'), 'note'), Note('slowly change', A('change'), 'small')])
shot('m24', T2, [], [kit(F, 'stir', 'stir', .32, .58, 0.65, w=1.0, h=.6, level=lv((0, 1)))],
     [Note('tides stir the deep sea', A('stir'), 'note'), Note('~half the mixing', A('half'), 'title')])
shot('m25', T2, [], [kit(F, 'stir', 'stir', .32, .58, 0.65, w=1.0, h=.6, level=lv((0, 1), (60, .25)))],
     [Note('calmer deep ocean', A('calmer'), 'note'), Note('heat + nutrients', A('heat'), 'note'), Note('over 1000s of years', A('thousands'), 'small')])
shot('m26', None, [arka(x=.3, poses=[(0, 'point-right')], faces=[(0, 'grin')])], [kit(F, 'stir', 'stir', .66, .58, 0.55, w=1.0, h=.6, level=lv((0, 1)))],
     [Note('cosmic soup!', A('soup'), 'title', pos=(1270, 300))])
shot('m27', T2, [], [kit(F, 'coral', 'coral', .32, .7, 0.59, w=1.0, h=1.0, level=lv((0, 0))), kit(F, 'fish', 'fish', .6, .45, 0.18)],
     [Note('pretty much.', A('Pretty'), 'note'), Note('under the sea...', A('sea'), 'note')])
shot('m28', T2, [], [kit(F, 'coral', 'coral', .3, .72, 0.65, w=1.0, h=1.0, count=16, level=lv((0, 0), (30, 1))), moon('m', .3, .2, 0.12)],
     [Note('Great Barrier Reef', A('Great'), 'small'), Note('biggest mass spawning', A('biggest'), 'note'), Note('cue: moonlight', A('moonlight'), 'title')])
shot('m29', None, [arka(x=.3, poses=[(0, 'shrug')], faces=[(0, 'sad')])], [kit(F, 'coral', 'coral', .66, .72, 0.55, w=1.0, h=1.0, level=lv((0, 0)))],
     [Note('no party?', A('party'), 'title', pos=(1270, 300))])
shot('m30', T2, [], [kit(F, 'coral', 'coral', .25, .74, 0.52, w=1.0, h=1.0, count=8, level=lv((0, .5))), kit(F, 'thermo', 'thermometer', .48, .55, 0.36, w=.4, h=1.2, level=lv((0, .55)))],
     [Note('water temperature', A('temperature'), 'small'), Note('tides + sunset', A('sunset'), 'small'), Note('not all on one night', A('same'), 'note'),
      Note('timing is everything', A('timing'), 'title')])

# ------------------------------------------------------------------ chapter 3: the first year
shot('m31', T3, [], [earth('earth', .28, .52, .18), kit(F, 'orbit', 'orbit-ring', .28, .52, .6, w=1.0, h=1.0),
                     kit(F, 'b1', 'bar', .6, .62, 0.59, w=1.0, h=.4, text='Earth', level=lv((0, 1)), color='#3f7fd6', opacity=show_from(A('mass'))),
                     kit(F, 'b2', 'bar', .6, .84, 0.59, w=1.0, h=.4, text='Moon', level=lv((0, .012)), color='#ece8d6', opacity=show_from(A('mass')))],
     [Note('orbit: unchanged', A('orbit'), 'note'), Note('Moon = ~1% of the mass', A('percent'), 'note')])
shot('m32', T3, [], [sun('sun', .22, .5, .26), moon('m', .7, .5, 0.12)],
     [Note('lucky accident', A('accident'), 'note'), Note('400x wider', A('wider'), 'title', near='sun'), Note('400x farther', A('farther'), 'title', near='m'),
      Note('same size in our sky', A('same'), 'small')])
shot('m33', T3, [], [sun('sun', .3, .5, .18), moon('ghost', .3, .5, 0.18, lit=0), kit(F, 'x', 'cross', .3, .5, 0.39, **pop_in(A('solar'), (.3 * W, .5 * H)))],
     [Note('no more eclipses', A('solar'), 'title'), Note('not ever again', A('ever'), 'note')])
shot('m34', None, [arka(x=.32, poses=[(0, 'shrug')], faces=[(0, 'sad')])], [sun('sun', .7, .45, .12)],
     [Note('never saw one!', A('never'), 'title', pos=(1290, 760))])
shot('m35', T3, [], [kit(F, 'clock', 'clock', .3, .52, 0.47, level=lv((0, .6)), text='day length')],
     [Note('days stop getting longer', A('longer'), 'title')])
shot('m36', T3, [], [earth('earth', .28, .55, .17),
                     Prop(planet('theia', .78, .3, .09, '#c4501f', ('#d9703f', '#b2441a'), shade=.25, seed=7,
                                 x=track((0, 0), (A('smashed', -20), 0), (A('smashed'), -760, 'ease-in-back')), y=track((0, 0), (A('smashed', -20), 0), (A('smashed'), 230, 'ease-in-back')),
                                 opacity=show_until(plus(A('smashed'), 2))), Box(.7 * W, .2 * H, .86 * W, .4 * H, 'theia')),
                     kit(F, 'boom', 'impact', .36, .52, .5, count=12, level=lv((0, .9)), **pop_in(A('smashed'), (.38 * W, .5 * H))),
                     moon('m', .62, .5, 0.12, opacity=show_from(A('Moon'))),
                     kit(F, 'clock', 'clock', .6, .78, .2, level=lv((0, 1)), opacity=show_from(A('hours')))],
     [Note('4.5 billion years ago', A('billion'), 'small'), Note('Theia', A('Mars'), 'note', near='theia'), Note('a day: 4-5 hours', A('hours'), 'title')],
     sounds=[('whoosh', A('smashed', -10), -18)])
shot('m37', None, [arka(x=.32, poses=[(0, 'panic')], faces=[(0, 'shocked')])], [kit(F, 'boom', 'impact', .7, .45, 0.39, count=8, level=lv((0, .7)))],
     [Note('born in a crash?!', A('crash'), 'title', pos=(1290, 800))])
shot('m38', T3, [], [earth('earth', .3, .52, .17), moon('m', .62, .4, 0.12), kit(F, 'clock', 'clock', .78, .62, 0.34, level=lv((0, 1), (120, .3)), text='slowing')],
     [Note('a very big one', A('big'), 'note'), Note('slowing us down', A('slowing'), 'note')])
shot('m39', T3, [], [kit(F, 'rex', 'dino', .3, .6, 0.59, w=1.2, h=1.0), kit(F, 'clock', 'clock', .7, .5, 0.34, level=lv((0, .6)), text='T. rex day')],
     [Note('days got longer', A('longer'), 'small'), Note('-20 minutes', A('twenty'), 'title')])
shot('m40', T3, [], [kit(F, 'spin', 'earth-axis', .28, .52, 0.59, rotation=23, level=lv((0, 1), (150, .7))), moon('m', .62, .35, 0.12),
                     kit(F, 'arr', 'pressure-arrows', .45, .45, 0.26, direction='in', count=3)],
     [Note('a brake', A('brake'), 'note'), Note('+1.7 ms per century', A('milliseconds'), 'title'), Note('without the Moon: mostly gone', A('gone'), 'small')])
shot('m41', None, [arka(x=.32, poses=[(0, 'stand')], faces=[(0, 'puffed')])], [kit(F, 'bed', 'bed', .68, .62, 0.52, w=1.0, h=.6, level=lv((0, 0)))],
     [Note('+1 hour sleep?', A('hour'), 'title', pos=(1290, 300))])
shot('m42', T3, [], [kit(F, 'clock', 'clock', .3, .52, 0.47, level=lv((0, .1)), text='+1 minute')],
     [Note('millions of years', A('millions'), 'title'), Note('per extra minute', A('minute'), 'note')])

# ------------------------------------------------------------------ chapters 4-6 + ending: placeholders until pass 2
for bid, intent, parts in SHOTS:
    if bid in ep.plans: continue
    speakers = {sp for sp, _ in parts}
    chars = [Char('arka', 'arka', slot='center')] if 'arka' in speakers else []
    ep.scene(bid, explain(chars, [earth('earth', .72, .55, .16)], [Note(bid.upper(), 4, 'small')]))

# Night page: line-art and new props get light ink so they read on navy.
LIGHT_INK = {'doodle-stars', 'counter', 'bar', 'bulb', 'question', 'thermometer', 'fish', 'crescent', 'orbit-ring', 'town', 'lion', 'zebra',
             'coral', 'plankton', 'tide-gauge', 'tilt-dial', 'earth-axis', 'impact', 'dino', 'reflector', 'bed', 'stir', 'clock', 'pressure-arrows', 'cross'}
for layer in [pr.layer for pl in ep.plans.values() for pr in pl['props']] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k.setdefault('ink', '#c9d3ea')

ep.music([('m1', 'assets/music/6-space-event-horizon.mp3', 0), ('m8', 'assets/music/1-curious-b-frame-dragging.mp3', 0),
          ('m20', 'assets/music/2-playful-a-quirk-n-twerk.mp3', 0), ('m31', 'assets/music/3-eerie-a-lake-jupiter.mp3', 0)],
         dropouts=[('m4', 0, 1.2)], target_lufs=-16)

if __name__ == '__main__':
    board = ep.build()
    path = ROOT / (sys.argv[2] if len(sys.argv) > 2 else 'storyboards/moon-gone.json')
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
