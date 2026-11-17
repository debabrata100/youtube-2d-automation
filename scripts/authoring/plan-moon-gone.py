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
# Pass 0: a deliberately simple placeholder so the script validates for narration. The real shot design is done after
# narration, against the measured voice timing (as for the Voyager Short).
import recipes
LIGHT = '#eef1f8'
recipes.INK = LIGHT  # night page: small labels in light ink
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 600
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'paint-night'
ep.backdrop(stars=26)
for bid, intent, parts in SHOTS:
    speakers = {s for s, _ in parts}
    chars = [Char('arka', 'arka', slot='center')] if 'arka' in speakers else []
    earth = Prop(planet('earth', .72, .55, .16, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), shade=.2, seed=3), Box(.62 * W, .37 * H, .82 * W, .73 * H, 'earth'))
    ep.scene(bid, explain(chars, [earth], [Note(bid.upper(), 4, 'small')]))

if __name__ == '__main__':
    board = ep.build()
    path = ROOT / (sys.argv[2] if len(sys.argv) > 2 else 'storyboards/moon-gone.json')
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames')
