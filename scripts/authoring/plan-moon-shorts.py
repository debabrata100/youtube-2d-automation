"""Shorts (9:16) cut from approved episode narration, plus a tiny paid request for the two new Moon hooks.

  miranda  "12-minute fall": Ep 3 narration only (free)                     -> links to Ep 3
  tilt     "Earth won't tip over": new hook + Ep 4 narration                -> links to Ep 4
  lions    "The lions' favourite night": new hook + Ep 4 narration          -> links to Ep 4
  hooks    the two new hook lines, as one small narration request (paid, Debabrata runs it)

Each Short's story script (stories/<id>.json) and cut spec (stories/<id>-cut.json, for scripts/cut-narration.py)
are generated here, so the script text and the cut audio can't drift apart.

Usage: python3 scripts/authoring/plan-moon-shorts.py <short> --script-only
       python3 scripts/authoring/plan-moon-shorts.py <short> <duration_seconds>     (storyboard, after the cut)
"""
import json, math, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes

ROOT = pathlib.Path(__file__).resolve().parents[2]
N, K = 'narrator', 'arka'
EP3, EP4, HOOKS = 'jobs/m3-7-narration', 'jobs/mg-narration-b', 'jobs/msh-hooks-narration'
TAIL = 1.5  # seconds after the last word: Shorts loop, so the ending stays short

HOOK_TILT = "Every video says Earth tips over without the Moon. It doesn't."
HOOK_LIONS = 'If the Moon vanished tonight, lions would be the happiest animals on Earth.'

# Each beat: (beat id, intent, [(speaker, text, source job)]). Text is copied exactly from the approved episode scripts.
SHORTS = {
    'miranda': dict(id='miranda-short', title="You'd Fall for 12 Minutes on This Moon", prefix='mr', night=False,
                    topic="Miranda (Uranus): Verona Rupes, possibly ~20 km tall; Miranda's weak gravity means a ~12-minute fall ending at ~200 km/h; NASA scientists think airbags could make it survivable",
                    beats=[('h1', 'hook', [(N, 'On one moon in our solar system, you could step off a cliff and fall for twelve whole minutes.', EP3)]),
                           ('r1', 'setup', [(N, 'At Uranus, the moon Miranda has what may be the tallest cliff in the solar system, possibly twenty kilometers high.', EP3)]),
                           ('r2', 'explanation', [(N, "That's more than twice the height of Everest.", EP3)]),
                           ('r3', 'explanation', [(N, "Step off the edge, and Miranda's gravity is so weak that you'd fall for about twelve minutes.", EP3)]),
                           ('r4', 'explanation', [(N, 'Twelve silent minutes, watching the ground get closer.', EP3)]),
                           ('r5', 'explanation', [(N, "You'd hit the bottom at about two hundred kilometers per hour. Without protection, that's the end.", EP3)]),
                           ('r6', 'explanation', [(N, 'But NASA scientists think you could survive it with the right airbags.', EP3)]),
                           ('r7', 'closing', [(K, 'I brought one!', EP3)])]),
    'tilt': dict(id='moon-tilt-short', title="Earth Wouldn't Tip Over Without the Moon", prefix='mt', night=True,
                 topic='Myth-bust: the 1993 study (Laskar et al.) found 0-85 degrees of tilt without the Moon; 2012 simulations (Lissauer et al.) found roughly 12-38 degrees over 100 million years; no sudden flip',
                 beats=[('t1', 'hook', [(N, HOOK_TILT, HOOKS)]),
                        ('t2', 'setup', [(N, "In 1993, a famous study found that without the Moon, Earth's tilt could swing anywhere from zero all the way to eighty-five degrees. At eighty-five degrees, Earth would be lying on its side, with months of endless day and months of endless night.", EP4)]),
                        ('t3', 'setup', [(K, 'That sounds... bad.', EP4)]),
                        ('t4', 'explanation', [(N, 'But in 2012, NASA scientist Jack Lissauer and his team ran much more detailed simulations. Their answer was far calmer.', EP4, .1)]),
                        ('t4b', 'explanation', [(N, 'Earth would wobble more than it does today, but in their simulations it stayed roughly between twelve and thirty-eight degrees, even over a hundred million years.', EP4)]),
                        ('t5', 'explanation', [(N, 'But no sudden flip. And no instant freeze.', EP4)]),
                        ('t6', 'explanation', [(K, "So we're not all doomed?", EP4)]),
                        ('t7', 'closing', [(N, 'Not tonight. And not because of the tilt.', EP4)])]),
    'lions': dict(id='moon-lions-short', title="Without the Moon, Lions Win", prefix='ml', night=True,
                  topic='Without the Moon every night is moonless: about 100x darker than under a full Moon; Serengeti lions eat best on dark nights (Packer et al. 2011), so every night would be a hunting night',
                  beats=[('l1', 'hook', [(N, HOOK_LIONS, HOOKS)]),
                         ('l2', 'setup', [(N, 'On a clear night, a full Moon lights the ground about a hundred times more than the stars alone. Without it, every night becomes the darkest kind of night. Forever.', EP4)]),
                         ('l3', 'explanation', [(N, "Take lions. In the Serengeti, lions eat best on dark nights, when there's no moonlight to give them away. Around the full Moon, their bellies are emptier, and they have to hunt more by day.", EP4)]),
                         ('l4', 'explanation', [(N, "So without the Moon, every single night is a hunter's night. Great news for lions. Not such great news for everything they eat.", EP4)]),
                         ('l5', 'closing', [(K, 'Note to self: never be a zebra.', EP4)])]),
    'hooks': dict(id='moon-shorts-hooks', title='Moon Shorts: new hook lines', prefix='hk', night=True,
                  topic='Recording only: the two new hook lines for the Moon Shorts (cut into each Short)',
                  beats=[('k1', 'hook', [(N, HOOK_TILT, None)]), ('k2', 'closing', [(N, HOOK_LIONS, None)])]),
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
        for speaker, text, src, *gap in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
            if src: segments.append({'source': src, 'text': text, **({'gapAfter': gap[0]} if gap else {})})
        beats.append({'id': bid, 'sceneId': f"{s['prefix']}-{bid}", 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': s['id'], 'title': s['title'], 'topic': s['topic'], 'language': 'en-US',
             'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': f"storyboards/{s['id']}.json", 'candidatesReport': 'stories/moon-shorts-script.md', 'beats': beats}
    (ROOT / f"stories/{s['id']}.json").write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    if key != 'hooks':
        (ROOT / f"stories/{s['id']}-cut.json").write_text(json.dumps({'id': s['id'], 'segments': segments}, indent=1, ensure_ascii=False) + '\n')
    return story


if len(sys.argv) < 3 or sys.argv[1] not in SHORTS: sys.exit(__doc__)
KEY = sys.argv[1]
if sys.argv[2] == '--script-only':
    st = write_story(KEY, 40 if KEY != 'hooks' else 16)
    print('wrote', st['id'], len(st['beats']), 'beats,', sum(len(b['narration']) for b in st['beats']), 'characters')
    if KEY != 'hooks': sys.exit(0)
    DURATION = 16  # the recording also needs a storyboard (one scene per beat); it is never rendered
else:
    DURATION = int(sys.argv[2])

S = SHORTS[KEY]
write_story(KEY, DURATION)
STORY = ROOT / f"stories/{S['id']}.json"
LIGHT, YELLOW, WARN, GREEN_OK, GOLD_T = '#eef1f8', '#ffd25e', '#ff5a4a', '#5fd38a', '#d9a628'
if S['night']:
    recipes.INK = LIGHT; recipes.RED = YELLOW  # night page: notes in warm yellow, red only for myths (as in Ep 4)
ep = Episode(str(STORY), 'tall'); F = ep.F; W, H = F['W'], F['H']
ep.pop_db, ep.deviation_tolerance = -24, .3
if S['night']: ep.theme = 'paint-night'


def lv(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def shot(bid, chars=(), props=(), notes=(), cam='settle', sounds=(), stamps=()):
    ep.scene(bid, explain(list(chars), list(props), list(notes), camera_preset=cam, sounds=list(sounds), stamps=list(stamps)))


def arka(x=.5, fy=.72, h=.26, poses=((0, 'float'),), faces=((0, 'happy'),), **k):
    return Char('arka', 'arka', x=x, fy=fy, h=h, poses=list(poses), faces=list(faces), **k)


def moon(pid, px, py, size, lit=1, **extra):
    return kit(F, pid, 'crescent', px, py, size, level=[{'frame': 0, 'value': lit}], **extra)


def earth(pid, x, y, r, **layer):
    return Prop(planet(pid, x, y, r, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), shade=.2, seed=3, **layer), Box((x - r * H / W) * W, (y - r) * H, (x + r * H / W) * W, (y + r) * H, pid))


def end_note(at):
    """Last line: points viewers at the Related video link shown under the Short."""
    return Note('full story below', at, 'note', pos=(W / 2, 600))


def tall_photo(aid, at, until=None, y=.47, scale=.95):
    """A framed 1920x1080 photo insert centred in the tall frame (the card is ~1036x712 px before scaling)."""
    p = photo(ep, F, aid, f'nasa/inserts/{aid}.png', at, until=until, x=.5, y=y, scale=scale, size=(1920, 1080))
    hw, hh = 518 * scale, 356 * scale
    p._box = Box(W / 2 - hw, y * H - hh, W / 2 + hw, y * H + hh, aid)
    return p


if KEY == 'hooks':
    ep.backdrop(stars=20)
    for bid, _, _ in S['beats']:
        shot(bid, [], [earth('earth', .5, .5, .12)], [])

elif KEY == 'miranda':
    # Ep 3's daytime notebook look: Miranda's grey ground, Uranus in the sky (top right, below the captions).
    ep.backdrop(stars=0)
    ground = world(F, 'MIRANDA', sky=False)[0]
    sky = Prop(planet('uranus', .8, .3, .05, '#9fe0e6', ('#b7ebef',), ring=True, shade=.25, seed=5), Box(.66 * W, .26 * H, .94 * W, .34 * H, 'uranus'))

    def you(**k):
        k.setdefault('helmet', [(0, True)]); return Char('you', **k)

    def fall(at, dy, frames):
        return track((0, 0), (plus(at, -1), 0), (plus(at, frames), dy * H, 'smoothstep'))

    TOP = .36  # cliff top; the face drops to the ground at the feet line
    tall_cliff = lambda x, text='20 km': cliff(F, x, TOP, (F['feet'] - TOP) * H / W, text=text)
    shot('h1', [you(x=.5, fy=TOP, h=.12, idle=None, poses=[(0, 'stand'), (A('step'), 'tumble')], faces=[(0, 'happy'), (A('step'), 'scream')],
                    layer={'y': fall(A('step', 4), .22, 76), 'x': track((0, 0), (A('step'), 0), (A('step', 20), 110, 'ease-out-cubic'))})],
         ground + [sky, tall_cliff(.53)], [Note('12 minutes', A('twelve'), 'title', pos=(290, 820))], cam='push', sounds=[('whoosh', A('step', 4), -22)])
    shot('r1', [], [tall_photo('photo-miranda', 6, y=.52, scale=1.75)],
         [Note('Miranda, a moon of Uranus', A('Miranda'), 'small', pos=(W / 2, 560)), Note('~20 km tall?', A('twenty'), 'title', pos=(W / 2, 1400))])
    shot('r2', [], ground + [sky, tall_cliff(.62), Prop(prop('ev', 'sign', .3, .66, .18, text='Everest'))],
         [Note('2x Everest', A('twice'), 'title', pos=(300, 620))])
    shot('r3', [you(x=.5, fy=TOP, h=.12, idle=None, poses=[(0, 'stand'), (A('edge'), 'tumble')], faces=[(0, 'neutral'), (A('edge'), 'shocked'), (A('weak'), 'scared')],
                    layer={'y': fall(A('edge', 2), .14, 140), 'x': track((0, 0), (A('edge'), 0), (A('edge', 24), 120, 'ease-out-cubic'))})],
         ground + [sky, tall_cliff(.53)], [Note('weak gravity', A('weak'), 'note', pos=(290, 800)), Note('12:00', A('twelve'), 'title', pos=(290, 960))])
    shot('r4', [you(x=.5, fy=.58, h=.16, idle=None, poses=[(0, 'lie')], faces=[(0, 'asleep')], layer={'y': track((0, -40), (300, 40))})],
         [kit(F, 'ml', 'motion-lines', .5, .4, .16, rotation=-90), kit(F, 'ml2', 'motion-lines', .22, .62, .12, rotation=-90), kit(F, 'ml3', 'motion-lines', .76, .5, .12, rotation=-90)], [Note('...still falling', A('silent'), 'small', pos=(W / 2, 560)), Note('7:41', A('closer'), 'title', pos=(W / 2, 1300))])
    shot('r5', [you(x=.36, fy=.7, h=.18, idle=None, poses=[(0, 'tumble')], faces=[(0, 'scream')], layer={'y': track((0, -300), (A('bottom'), 0))})],
         ground + [kit(F, 'speed', 'speedometer', .66, .44, .3, level=[{'frame': 0, 'value': .2}, {'frame': A('hundred'), 'value': .95}], text='200 km/h'),
          vignette([(0, 0), (A('end', -6), 0), (A('end', 4), .8)])], [Note('~200 km/h', A('hundred'), 'title', pos=(700, 1150))])
    shot('r6', [you(x=.42, fy=.74, h=.16, idle=None, poses=[(0, 'lie')], faces=[(0, 'dizzy'), (A('survive'), 'grin')])],
         ground + [kit(F, 'bag', 'airbag', .44, .7, .32, level=[{'frame': 0, 'value': 0}, {'frame': A('survive', -4), 'value': 0}, {'frame': A('survive', 6), 'value': 1}])],
         [Note('NASA scientists:', 4, 'small', pos=(W / 2, 580)), Note('survivable!', A('airbags'), 'title', pos=(W / 2, 690))], sounds=[('pop', A('survive'), -18)])
    shot('r7', [arka(x=.38, fy=.76, h=.26, poses=[(0, 'cheer')], faces=[(0, 'grin')])],
         ground + [kit(F, 'bag', 'airbag', .66, .66, .2, level=[{'frame': 0, 'value': 0}, {'frame': 8, 'value': 1}]), kit(F, 'tag', 'sign', .66, .78, .14, w=1.4, h=1.0, text='AIRBAG')],
         [end_note(A('brought'))])
    M = 'assets/music/'
    ep.music([('h1', M + '6-space-singularity.mp3', 0), ('r1', M + '2-playful-b-sweet-math.mp3', 0)], dropouts=[('r7', 0, 1.0)], target_lufs=-16)

elif KEY == 'tilt':
    ep.backdrop(stars=26)
    # t1 hook: Earth rolls onto its side ("tips over"), then a MYTH stamp lands on "doesn't".
    roll = track((0, 0), (A('tips'), 0), (A('tips', 24), 62, 'smoothstep'), (A("doesn't", -2), 62), (A("doesn't", 10), 0, 'ease-out-back'))
    shot('t1', [], [kit(F, 'tilt', 'earth-axis', .5, .52, .5, rotation=23, level=lv((0, 1)), rotate=roll, anchor={'x': .5 * W, 'y': .52 * H})],
         [Note('tips over?', A('tips'), 'title', color=WARN, pos=(W / 2, 1310))], cam='push', stamps=[(0, A("doesn't", 2))], sounds=[('whoosh', A('tips'), -22)])
    shot('t2', [], [kit(F, 'dial', 'tilt-dial', .5, .42, .5, w=1.0, h=1.0, range=[0, 85], level=lv((0, .26), (40, .05), (80, .94), (120, .1), (160, .9), (200, .2), (240, .94)), text='1993 study'),
                    kit(F, 'side', 'earth-axis', .5, .64, .22, rotation=85, level=lv((0, 1)), opacity=show_from(A('side')))],
         [Note('0° to 85°', A('eighty-five'), 'title', color=WARN, pos=(W / 2, 580)), Note('lying on its side', A('side'), 'note', pos=(W / 2, 1410))])
    shot('t3', [arka(x=.36, fy=.74, poses=[(0, 'panic')], faces=[(0, 'scared')])],
         [kit(F, 'dial', 'tilt-dial', .66, .44, .34, w=1.0, h=1.0, range=[0, 85], level=lv((0, .9), (20, .1), (40, .9)))], [])
    shot('t4', [], [kit(F, 'paper', 'sign', .5, .5, .34, w=1.8, h=1.0, text='2012 SIMULATIONS', **pop_in(A('2012'), (.5 * W, .5 * H)))],
         [Note('NASA: Lissauer et al.', A('NASA'), 'small', pos=(W / 2, 620)), Note('far calmer', A('calmer'), 'title', pos=(W / 2, 1300))])
    shot('t4b', [], [kit(F, 'dial', 'tilt-dial', .5, .48, .56, w=1.0, h=1.0, range=[12, 38], color=GREEN_OK, level=lv((0, .26), (50, .14), (100, .42), (150, .2), (200, .4)), text='2012 simulations')],
         [Note('wobblier', A('wobble'), 'note', pos=(W / 2, 600)), Note('12° to 38°', A('thirty-eight'), 'title', pos=(W / 2, 1300))])
    shot('t5', [], [earth('earth', .5, .52, .16), kit(F, 'ok', 'check', .76, .4, .2, **pop_in(A('flip'), (.76 * W, .4 * H)))],
         [Note('no sudden flip', A('flip'), 'title', pos=(W / 2, 600)), Note('no instant freeze', A('freeze'), 'title', pos=(W / 2, 1300))])
    shot('t6', [arka(x=.4, fy=.74, poses=[(0, 'think')], faces=[(0, 'neutral')])], [kit(F, 'q', 'question', .68, .44, .18)],
         [Note('not doomed?', A('doomed'), 'title', pos=(W / 2, 600))])
    shot('t7', [], [earth('earth', .5, .5, .16), kit(F, 'ok', 'check', .76, .38, .2, **pop_in(A('tonight'), (.76 * W, .38 * H)))],
         [end_note(A('tilt', 6)), Note('not doomed', A('tonight'), 'title', pos=(W / 2, 1320))])
    M = 'assets/music/'
    ep.music([('t1', M + '4-tense-b-standoff.mp3', 0, -2), ('t4', M + '5-uplifting-b-defying-gravity.mp3', 0)], dropouts=[('t4', 0, 1.0)], target_lufs=-16)

elif KEY == 'lions':
    ep.backdrop(stars=26)
    # l1 hook: the Moon goes out over a lion, which looks very pleased about it.
    shot('l1', [], [kit(F, 'lion', 'lion', .5, .6, .46, w=1.2, h=.8, level=lv((0, 1))),
                    moon('moon', .62, .36, .2, opacity=show_until(plus(A('tonight'), 2))), moon('ghost', .62, .36, .2, lit=0, opacity=show_from(plus(A('tonight'), 2)))],
         [Note('happiest?', A('happiest'), 'title', pos=(W / 2, 1410))], cam='push', sounds=[('whoosh', A('tonight'), -20)])
    shot('l2', [], [kit(F, 'b1', 'bar', .5, .42, .62, w=1.0, h=.4, text='full Moon', level=lv((0, 0), (20, .95)), color='#ffe27a'),
                    kit(F, 'b2', 'bar', .5, .6, .62, w=1.0, h=.4, text='stars only', level=lv((0, 0), (40, .012)), color='#7fc0ff')],
         [Note('~100x darker', A('hundred'), 'title', pos=(W / 2, 560)), Note('forever', A('Forever'), 'note', pos=(W / 2, 1300))])
    shot('l3', [], [kit(F, 'lion1', 'lion', .5, .4, .36, w=1.2, h=.8, level=lv((0, 1))),
                    kit(F, 'lion2', 'lion', .5, .64, .36, w=1.2, h=.8, level=lv((0, 0)), **pop_in(A('emptier'), (.5 * W, .64 * H))),
                    moon('m', .8, .56, .09, opacity=show_from(A('full')))],
         [Note('Serengeti, Tanzania', A('Serengeti'), 'small', pos=(W / 2, 560)), Note('dark night: full belly', A('dark'), 'note', pos=(W / 2, 1000)),
          Note('full Moon: hungry', A('emptier'), 'note', pos=(W / 2, 1420))])
    LEAP = A('Not')
    shot('l4', [], [kit(F, 'lion', 'lion', .32, .6, .4, w=1.2, h=.8, level=lv((0, 1)),
                        x=track((0, 0), (LEAP, 0), (plus(LEAP, 26), 300, 'ease-out-cubic')),
                        y=track((0, 0), (plus(LEAP, -10), 0), (LEAP, 14, 'smoothstep'), (plus(LEAP, 12), -90, 'ease-out-cubic'), (plus(LEAP, 26), 0, 'smoothstep')),
                        rotate=track((0, 0), (LEAP, 0), (plus(LEAP, 8), -14, 'smoothstep'), (plus(LEAP, 22), 8, 'smoothstep'), (plus(LEAP, 30), 0, 'smoothstep')),
                        anchor={'x': .32 * W, 'y': .6 * H}),
                    kit(F, 'zebra', 'zebra', .72, .6, .36, w=1.2, h=.9, x=track((0, 0), (plus(LEAP, 2), 0), (plus(LEAP, 22), 420, 'smoothstep')))],
         [Note("every night: a hunter's night", A("hunter's"), 'note', pos=(W / 2, 600)), Note('great for lions', A('lions'), 'small', pos=(W / 2, 1300))],
         sounds=[('whoosh', LEAP, -20)])
    shot('l5', [arka(x=.36, fy=.74, poses=[(0, 'cower')], faces=[(0, 'scared')])], [kit(F, 'zebra', 'zebra', .7, .62, .3, w=1.2, h=.9)],
         [end_note(A('zebra', 6))])
    M = 'assets/music/'
    ep.music([('l1', M + '6-space-event-horizon.mp3', 0), ('l3', M + '1-curious-b-frame-dragging.mp3', 0)], target_lufs=-16)

if S['night']:
    LIGHT_INK = {'doodle-stars', 'bar', 'question', 'crescent', 'lion', 'zebra', 'tilt-dial', 'earth-axis', 'check'}
    for layer in [pr.layer for pl in ep.plans.values() for pr in pl['props']] + ep._backdrop['layers']:
        k = layer.get('kit', {})
        if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k.setdefault('ink', '#c9d3ea')

board = ep.build()
out = ROOT / f"storyboards/{S['id']}.json"
out.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
print('wrote', out.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
