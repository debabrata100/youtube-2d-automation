"""Generate storyboards/helmet-off.json - Episode 2 "What happens if you take your helmet off in space?" (16:9).

Narrator + Arka (gold astronaut mascot). A countdown counter in the backdrop steps 15 -> 0 on the narrated
numbers. Every story moment is a word anchor, so the real (multi-voice) take lines up without retiming.
Usage: python3 scripts/authoring/build-helmet-off-storyboard.py [duration_seconds]
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from paintkit import *  # noqa: F401,F403 - shared builders

ROOT = HERE.parents[1]
story = json.loads((ROOT / 'stories/helmet-off.json').read_text())
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else story['durationSeconds']
FPS, W, H = 30, 1920, 1080
FEET, FIG = .86, .56
GOLD, GOLD_VISOR = '#e8b84a', '#ffe6a3'
EARTH, EARTH_LAND = '#5aa9e6', '#7cc576'
GX = lambda f: f * W
GY = lambda f: f * H


def head(fx, h=FIG, fy=FEET):
    """Approximate head centre (group fractions) of a standing/floating figure."""
    return fx, fy - h * .82


def bob(amp=10, period=70, end=2400, phase=0):
    """Gentle zero-g drift as a y track (keys alternate up/down)."""
    keys, f, k = [], 0, phase
    while f <= end and len(keys) < 36:
        keys.append((f, amp if k % 2 else -amp, 'smoothstep')); f += period // 2; k += 1
    return track(*keys)


def you(fid, fx, h=FIG, fy=FEET, poses=((0, 'float'),), faces=((0, 'neutral'),), helmet=((0, False),), **layer):
    return figure(fid, fx, fy, h, list(poses), list(faces), outfit='astronaut', helmet=list(helmet) if helmet else None, seed=4, **layer)


def arka(fid, fx, h, fy=FEET, poses=((0, 'float'),), faces=((0, 'happy'),), **layer):
    return figure(fid, fx, fy, h, list(poses), list(faces), outfit='astronaut', suit=GOLD, visor=GOLD_VISOR, seed=11, **layer)


def scene_counter(values):
    """Counter drawn inside a scene group (above its vignette), at the same screen spot as the backdrop counter."""
    # Scene groups render at ~0.95 of the frame around its centre (measured), so the backdrop spot (.9, .17, size .16) maps here.
    return prop('counter', 'counter', .921, .153, .168, text='seconds left', values=values)


def stamp(sid, px, py, at, size=.2, text='myth'):
    return prop(sid, 'stamp', px, py, size, text=text, **pop_in(at, (GX(px), GY(py))))


def mouth_bubbles(eid, fx, at, h=FIG, count=22):
    hx, hy = head(fx, h)
    return bubbles(eid, hx + .012, hy + h * .07, at, count)


groups = [
    {'id': 'backdrop', 'width': W, 'height': H, 'layers': [
        {'id': 'page', 'kit': {'type': 'sky', 'horizon': .9, 'stars': 0, 'seed': 1}},
        {'id': 'stars', 'kit': {'type': 'prop', 'item': 'doodle-stars', 'x': .37, 'y': .61, 'size': .5, 'count': 26}},
        {'id': 'earth', 'kit': {'type': 'planet', 'x': .04, 'y': 1.04, 'radius': .3, 'base': EARTH, 'bands': [EARTH_LAND, EARTH, EARTH_LAND], 'shade': .22, 'seed': 3},
         'opacity': track((0, 1), (A('We', -1, beat='history'), 1), (A('We', beat='history'), 0), (A('So', -1, beat='closing'), 0), (A('So', beat='closing'), 1))},
        {'id': 'counter', 'kit': {'type': 'prop', 'item': 'counter', 'x': .9, 'y': .17, 'size': .16, 'text': 'seconds left',
                                  'values': [{'frame': 0, 'value': 15}, {'frame': A('Twelve', beat='explode'), 'value': 12}, {'frame': A('Ten', beat='boil'), 'value': 10},
                                             {'frame': A('Seven', beat='cold'), 'value': 7}, {'frame': A('Four', beat='blackout'), 'value': 4}, {'frame': A('Three', beat='blackout'), 'value': 3},
                                             {'frame': A('Two', beat='blackout'), 'value': 2}, {'frame': A('One', beat='blackout'), 'value': 1}, {'frame': A('Zero', beat='rescue'), 'value': 0}]},
         'opacity': track((0, 0), (A('fifteen', -1, beat='hook'), 0), (A('fifteen', beat='hook'), 1), (A('Four', -1, beat='blackout'), 1), (A('Four', beat='blackout'), 0))},
    ]},

    # 1 hook: helmet off, counter appears, Arka panics in the airlock -------------------------------------
    {'id': 'g-hook', 'width': W, 'height': H, 'layers': [
        prop('station', 'station', .2, .36, .3, level=[{'frame': 0, 'value': 0}, {'frame': A('Wait', -8), 'value': 0}, {'frame': A('Wait', -2), 'value': 1}]),
        arka('arka', .3, .32, fy=.6, poses=[(0, 'panic')], faces=[(0, 'shocked')], **pop_in(A('Wait', -2), (GX(.3), GY(.5)))),
        you('you', .6, poses=[(0, 'float'), (A('helmet', -2), 'reach'), (A('off', 2), 'wave'), (A('fifteen'), 'shrug')],
            faces=[(0, 'happy'), (A('off', 2), 'grin'), (A('fifteen'), 'shocked'), (A('Wait'), 'scared')], helmet=[(A('off'), False)], y=bob(12, 80)),
        prop('helmet', 'helmet', *head(.6), .15, anchor={'x': GX(.6), 'y': GY(head(.6)[1])},
             opacity=show_from(A('off')), x=track((0, 0), (A('off'), 0), (A('off', 70), 260, 'ease-out-cubic')),
             y=track((0, 0), (A('off'), 0), (A('off', 70), -290, 'ease-out-cubic')), rotate=track((0, 0), (A('off'), 0), (A('off', 70), 260, 'ease-out-cubic'))),
    ], 'annotations': [
        note('no-helmet', 'no helmet!', 1500, 600, A('off', 4), size=74, to=(1215, 440), frm=(1390, 570)),
        note('arka-name', 'Arka', 576, 730, A('Wait', 6), size=50, color=INK),
    ]},

    # 2 breathe out ----------------------------------------------------------------------------------
    {'id': 'g-breath', 'width': W, 'height': H, 'layers': [
        you('you', .4, poses=[(0, 'float'), (A('out'), 'stand'), (A('hold'), 'hands-on-hips'), (A('expands'), 'scared')],
            faces=[(0, 'neutral'), (A('out'), 'happy'), (A('hold'), 'puffed'), (A('expands'), 'pain')], y=bob(10, 80)),
        prop('exhale', 'motion-lines', head(.4)[0] + .085, head(.4)[1] + .06, .14, rotation=180, opacity=track((0, 0), (A('out'), 0), (A('out', 3), 1), (A('hold', -2), 1), (A('hold'), 0))),
        prop('burst', 'pressure-arrows', .4, FEET - FIG * .52, .32, direction='out', count=8, opacity=track((0, 0), (A('expands', -1), 0), (A('expands'), 1))),
    ], 'annotations': [
        note('out', 'BREATHE OUT', 1250, 360, A('out'), size=88),
        note('hold', "don't hold it!", 1250, 470, A('hold'), size=62, color=INK),
        note('tears', 'lungs tear', 1250, 700, A('tears'), size=66),
    ]},

    # 3 explode? myth ------------------------------------------------------------------------------
    {'id': 'g-explode', 'width': W, 'height': H, 'layers': [
        you('you', .4, poses=[(0, 'float'), (A('explode'), 'panic'), (A("wouldn't"), 'float'), (A('pop'), 'cheer')],
            faces=[(0, 'neutral'), (A('explode'), 'scared'), (A("wouldn't"), 'happy'), (A('swell'), 'puffed'), (A('pop'), 'grin')],
            anchor={'x': GX(.4), 'y': GY(FEET - FIG * .45)}, scale=track((0, 1), (A('swell'), 1), (A('swell', 10), 1.16, 'ease-out-back'))),
        stamp('myth', .72, .37, A("wouldn't"), size=.16),
    ], 'annotations': [
        note('boom', 'BOOM?', 1270, 360, A('explode'), size=96, color=INK),
        note('skin', 'skin holds you together', 1270, 570, A('skin'), size=58, color=INK),
        note('swell', 'swell, not pop', 1270, 680, A('swell'), size=68),
    ]},

    # 4 blood vs spit ---------------------------------------------------------------------------------
    {'id': 'g-boil', 'width': W, 'height': H, 'layers': [
        you('you', .33, h=.6, poses=[(0, 'float'), (A('blood'), 'shrug'), (A('tongue'), 'stand')],
            faces=[(0, 'neutral'), (A('blood'), 'shocked'), (A('No'), 'happy'), (A('tongue'), 'tongue')], y=bob(10, 80)),
        {'id': 'spit-a', 'effects': [mouth_bubbles('spit-a', .33, A('bubble', -2), h=.6)]},
        {'id': 'spit-b', 'effects': [mouth_bubbles('spit-b', .33, A('bubble', 26), h=.6)]},
        stamp('myth', .75, .38, A('No'), size=.15),
        arka('arka', .9, .4, poses=[(0, 'float'), (A('Gross'), 'shrug')], faces=[(0, 'shocked'), (A('Gross'), 'pain')], facing='left',
             **pop_in(A('Gross', -4), (GX(.9), GY(FEET)))),
    ], 'annotations': [
        note('boil-q', 'blood boils?', 1270, 330, A('blood'), size=80, color=INK),
        note('blood', 'blood: safe', 1270, 520, A('pressure'), size=62, color=INK),
        note('spit', 'spit: bubbles!', 1270, 640, A('bubble'), size=72),
    ]},

    # 5 not frozen, sunburnt -----------------------------------------------------------------------------
    {'id': 'g-cold', 'width': W, 'height': H, 'layers': [
        {'id': 'sun', 'kit': {'type': 'sun', 'x': .12, 'y': .2, 'radius': .07}},
        you('you', .42, poses=[(0, 'float'), (A('freeze'), 'hands-on-hips'), (A('sunburn'), 'cower')],
            faces=[(0, 'neutral'), (A('freeze'), 'smug'), (A('sunburn'), 'pain')], y=bob(10, 80)),
        prop('thermo', 'thermometer', .7, .58, .4, level=[{'frame': 0, 'value': .62}, {'frame': A('cold'), 'value': .62}, {'frame': A('slowly', 12), 'value': .52}]),
        stamp('myth', .79, .3, A('freeze', 2), size=.14),
    ], 'annotations': [
        note('ice-q', 'instant ice?', 1344, 245, A('freeze'), size=74, color=INK),
        note('slow', 'heat leaves slowly', 1340, 930, A('slowly'), size=56, color=INK),
        note('burn', 'sunburn!', 560, 330, A('sunburn'), size=80),
    ]},

    # 6 the real killer: lungs work in reverse, countdown, blackout, Arka flies in --------------------------
    {'id': 'g-blackout', 'width': W, 'height': H, 'layers': [
        you('you', .4, poses=[(0, 'float'), (A('killer'), 'scared'), (A('Three'), 'float'), (A('One'), 'tumble')],
            faces=[(0, 'neutral'), (A('killer'), 'scared'), (A('pull'), 'pain'), (A('Three'), 'dizzy'), (A('One'), 'asleep')], y=bob(8, 90)),
        prop('o2', 'pressure-arrows', .4, FEET - FIG * .5, .3, direction='out', count=6, color='#2f7fd0', opacity=track((0, 0), (A('pull', -1), 0), (A('pull'), 1), (A('Three'), 1), (A('Two'), 0))),
        prop('dim', 'vignette', .5, .5, .5, level=[{'frame': 0, 'value': 0}, {'frame': A('Three'), 'value': 0}, {'frame': A('Two'), 'value': .35}, {'frame': A('One', 8), 'value': .72}]),
        scene_counter([{'frame': 0, 'value': 4}, {'frame': A('Three'), 'value': 3}, {'frame': A('Two'), 'value': 2}, {'frame': A('One'), 'value': 1}]),
        arka('arka', .82, .42, fy=.92, poses=[(0, 'reach')], faces=[(0, 'angry')], facing='left', anchor={'x': GX(.82), 'y': GY(.75)},
             opacity=show_from(A('Hang', -6)), x=track((0, 700), (A('Hang', -6), 700), (A('Hang', 10), 0, 'ease-out-cubic'))),
        prop('jet', 'motion-lines', .89, .7, .2, rotation=180, opacity=show_from(A('Hang', -6)), x=track((0, 700), (A('Hang', -6), 700), (A('Hang', 10), 0, 'ease-out-cubic'))),
    ], 'annotations': [
        note('killer', 'the real killer', 1270, 330, A('killer'), size=78),
        note('reverse', 'lungs work in reverse', 1270, 430, A('reverse'), size=56, color=INK),
        dict(note('o2-label', 'O2 out', 1110, 560, A('pull', 2), size=62, color='#2f7fd0'), opacity=track((0, 0), (A('pull', 1), 0), (A('pull', 7), 1), (A('Three'), 1), (A('Two'), 0))),
    ]},

    # 7 zero: black out, Arka tows you to the airlock ----------------------------------------------------
    {'id': 'g-rescue', 'width': W, 'height': H, 'layers': [
        prop('station', 'station', .2, .38, .3, level=[{'frame': 0, 'value': 1}]),
        you('you', .8, h=.48, fy=.82, poses=[(0, 'tumble')], faces=[(0, 'asleep')], anchor={'x': GX(.8), 'y': GY(.62)},
            rotate=track((0, -60)), x=track((0, 0), (A('Get'), 0), (A('survive', 6), -720, 'smoothstep'))),
        arka('arka', .66, .42, fy=.78, poses=[(0, 'reach')], faces=[(0, 'angry'), (A('survive'), 'grin')], facing='left',
             x=track((0, 0), (A('Get'), 0), (A('survive', 6), -720, 'smoothstep'))),
        prop('dim', 'vignette', .5, .5, .5, level=[{'frame': 0, 'value': .85}, {'frame': A('But'), 'value': .85}, {'frame': A('dead', 8), 'value': .2}]),
        scene_counter([{'frame': 0, 'value': 0}]),
        prop('ok', 'check', .8, .3, .14, **pop_in(A('survive', 2), (GX(.8), GY(.3)))),
    ], 'annotations': [
        note('dead', 'not dead yet!', 1150, 300, A('dead'), size=80),
        note('ninety', '~90 seconds to get air', 1150, 400, A('minute'), size=58, color=INK),
    ]},

    # 8 1966: the real NASA chamber accident -------------------------------------------------------------
    {'id': 'g-history', 'width': W, 'height': H, 'layers': [
        prop('chamber', 'chamber', .52, .55, .62, **pop_in(A('NASA', -2), (GX(.52), GY(.55)))),
        you('engineer', .52, h=.42, fy=.82, poses=[(0, 'stand'), (A('lost'), 'panic'), (A('remembered'), 'scared'), (A('back'), 'stand'), (A('fine'), 'cheer')],
            faces=[(0, 'neutral'), (A('lost'), 'shocked'), (A('saliva'), 'tongue'), (A('boil', 6), 'asleep'), (A('back', 4), 'happy'), (A('fine'), 'grin')], helmet=None,
            **pop_in(A('NASA', -1), (GX(.52), GY(.82)))),
        prop('alarm', 'exclaim', .52, .26, .12, opacity=track((0, 0), (A('lost', -1), 0), (A('lost'), 1), (A('back'), 1), (A('back', 4), 0))),
        {'id': 'spit', 'effects': [bubbles('spit', .53, .82 - .42 * .75, A('saliva', 2), 20)]},
        prop('ok', 'check', .8, .32, .14, **pop_in(A('fine', 1), (GX(.8), GY(.32)))),
    ], 'annotations': [
        note('year', '1966', 300, 300, A('1966'), size=100),
        note('nasa', 'NASA vacuum test', 300, 390, A('NASA'), size=50, color=INK),
        note('lost', 'suit pressure lost!', 1620, 360, A('lost'), size=52),
        note('fine', 'he was fine', 1500, 760, A('fine'), size=66, color=INK),
    ]},

    # 9 closing: helmet back on --------------------------------------------------------------------------
    {'id': 'g-closing', 'width': W, 'height': H, 'layers': [
        prop('station', 'station', .2, .36, .3, level=[{'frame': 0, 'value': 1}]),
        arka('arka', .42, .5, poses=[(0, 'float'), (A('So'), 'reach'), (A('Helmet', 0, n=2), 'hands-on-hips')], faces=[(0, 'smug'), (A('Helmet', 0, n=2), 'grin')]),
        you('you', .66, poses=[(0, 'float'), (A('Helmet', 0, n=2), 'cheer')], faces=[(0, 'neutral'), (A('So'), 'smug'), (A('Helmet', 0, n=2), 'grin')],
            helmet=[(0, False), (A('Helmet', 2, n=2), True)], y=bob(10, 80)),
        prop('helmet', 'helmet', .5, .5, .15, anchor={'x': GX(.5), 'y': GY(.5)}, opacity=show_until(A('Helmet', 2, n=2)),
             x=track((0, 0), (A('Helmet', -10, n=2), 0), (A('Helmet', 2, n=2), GX(.66 - .5), 'smoothstep')),
             y=track((0, 0), (A('Helmet', -10, n=2), 0), (A('Helmet', 2, n=2), GY(head(.66)[1] - .5), 'smoothstep'))),
    ], 'annotations': [
        note('on', 'helmet ON', 1350, 300, A('on', 2, n=2), size=84),
    ]},
]

counts = [len(b['narration'].split()) for b in story['beats']]
total = DURATION * FPS
raw = [max(60, total * c / sum(counts)) for c in counts]
scale_ = total / sum(raw)
NOMINAL = [int(r * scale_) for r in raw]
NOMINAL[-1] += total - sum(NOMINAL)

P, WH, T, HB = 'pop', 'whoosh', 'tick', 'heartbeat'
sounds = {
    'hook': [(P, A('off'), -21), (WH, A('off', 2), -24), (T, A('fifteen', -3), -20), (P, A('Wait', -2), -21)],
    'breath': [(WH, 0, -24), (T, A('Fifteen', -3), -20), (P, A('out'), -21), (P, A('hold'), -21), (P, A('tears'), -21)],
    'explode': [(WH, 0, -24), (T, A('Twelve', -3), -20), (P, A('explode'), -21), ('boom', A("wouldn't", -2), -26), (P, A('swell'), -21)],
    'boil': [(WH, 0, -24), (T, A('Ten', -3), -20), (P, A('No'), -21), ('bubble', A('bubble'), -22), ('bubble', A('bubble', 26), -24), (P, A('Gross', -4), -21)],
    'cold': [(WH, 0, -24), (T, A('Seven', -3), -20), (P, A('freeze', 2), -21), (P, A('sunburn'), -21)],
    'blackout': [(WH, 0, -24), (T, A('Four', -3), -20), (P, A('killer'), -21), (T, A('Three', -3), -20), (HB, A('Three'), -22), (T, A('Two', -3), -20), (HB, A('Two'), -22),
                 (T, A('One', -3), -20), (HB, A('One'), -21), (WH, A('Hang', -6), -22)],
    'rescue': [(T, A('Zero', -3), -18), (P, A('dead'), -21), (WH, A('Get'), -24), (P, A('survive', 2), -21)],
    'history': [(WH, 0, -24), (P, A('1966'), -21), (P, A('lost'), -21), ('bubble', A('saliva', 2), -22), (P, A('fine', 1), -21)],
    'closing': [(WH, 0, -24), (P, A('So'), -21), (WH, A('Helmet', -10, n=2), -24), (P, A('on', 2, n=2), -21), ('riser', A('So', 4), -28)],
}
cams = {
    'hook': [kf(0, 1.06), kf(A('off'), 1.0)],
}
scenes = [scene(b['sceneId'], f"g-{b['id']}", b['id'], NOMINAL[i], sounds[b['id']], cams.get(b['id'])) for i, b in enumerate(story['beats'])]
board = {
    'schemaVersion': '2.1', 'projectId': 'helmet-off', 'title': story['title'], 'themeId': 'paint-notebook',
    'format': {'width': W, 'height': H, 'fps': FPS}, 'styleId': 'cinematic-illustrated', 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'backdrop': {'group': 'backdrop'},
    'narrationTiming': {'minimumSceneFrames': 45, 'maximumDeviationSeconds': .2},
    'audio': {'music': 'generated-pad', 'musicGainDb': -24, 'duckRatio': 8, 'targetLufs': -14},
    'groups': groups, 'scenes': scenes,
}
if __name__ == '__main__':
    (ROOT / 'storyboards/helmet-off.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    if DURATION != story['durationSeconds']:
        story['durationSeconds'] = DURATION
        (ROOT / 'stories/helmet-off.json').write_text(json.dumps(story, indent=2, ensure_ascii=False) + '\n')
    print('wrote helmet-off', sum(NOMINAL), 'frames', NOMINAL)
