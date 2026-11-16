"""Generate storyboards/helmet-off-short.json - Episode 2 Short (9:16), written hook-first.

The counter runs in real time: 15 at "fifteen seconds", stepping down each second to 0 at "zero".
Layout follows the Shorts safe zones (see build-titan-short-storyboard.py): content in x 60-900, y 440-1460.
Usage: python3 scripts/authoring/build-helmet-off-short-storyboard.py [duration_seconds]
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from paintkit import *  # noqa: F401,F403 - shared builders

ROOT = HERE.parents[1]
story = json.loads((ROOT / 'stories/helmet-off-short.json').read_text())
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else story['durationSeconds']
FPS, W, H = 30, 1080, 1920
FEET, FIG = .76, .32
GOLD, GOLD_VISOR = '#e8b84a', '#ffe6a3'
EARTH, EARTH_LAND = '#5aa9e6', '#7cc576'
GX = lambda f: f * W
GY = lambda f: f * H


def head(fx, h=FIG, fy=FEET):
    return fx, fy - h * .82


def bob(amp=10, period=70, end=1200):
    keys, f, k = [], 0, 0
    while f <= end and len(keys) < 36:
        keys.append((f, amp if k % 2 else -amp, 'smoothstep')); f += period // 2; k += 1
    return track(*keys)


def you(fid, fx, h=FIG, fy=FEET, poses=((0, 'float'),), faces=((0, 'neutral'),), helmet=((0, False),), **layer):
    return figure(fid, fx, fy, h, list(poses), list(faces), outfit='astronaut', helmet=list(helmet) if helmet else None, seed=4, **layer)


def arka(fid, fx, h, fy=FEET, poses=((0, 'float'),), faces=((0, 'happy'),), **layer):
    return figure(fid, fx, fy, h, list(poses), list(faces), outfit='astronaut', suit=GOLD, visor=GOLD_VISOR, seed=11, **layer)


def stamp(sid, px, py, at, size=.13):
    return prop(sid, 'stamp', px, py, size, text='myth', **pop_in(at, (GX(px), GY(py))))


groups = [
    {'id': 'backdrop', 'width': W, 'height': H, 'layers': [
        {'id': 'page', 'kit': {'type': 'sky', 'horizon': .9, 'stars': 0, 'seed': 1}},
        {'id': 'stars', 'kit': {'type': 'prop', 'item': 'doodle-stars', 'x': .41, 'y': .53, 'size': .5, 'count': 22}},
        {'id': 'earth', 'kit': {'type': 'planet', 'x': .5, 'y': 1.12, 'radius': .55, 'base': EARTH, 'bands': [EARTH_LAND, EARTH, EARTH_LAND], 'shade': .22, 'seed': 3}},
        {'id': 'counter', 'kit': {'type': 'prop', 'item': 'counter', 'x': .47, 'y': .29, 'size': .2, 'text': 'seconds left',
                                  'values': [{'frame': 0, 'value': 15, 'ramp': False}, {'frame': A('fifteen', beat='hook'), 'value': 15, 'ramp': True}, {'frame': A('zero', beat='blackout'), 'value': 0}]},
         'opacity': track((0, 0), (A('fifteen', -1, beat='hook'), 0), (A('fifteen', beat='hook'), 1), (A('Get', -1, beat='rescue'), 1), (A('Get', 8, beat='rescue'), 0))},
    ]},

    # 1 hook ------------------------------------------------------------------------------------------
    {'id': 'g-hook', 'width': W, 'height': H, 'layers': [
        you('you', .45, poses=[(0, 'float'), (A('helmet', -2), 'reach'), (A('off', 2), 'wave'), (A('fifteen'), 'shrug')],
            faces=[(0, 'happy'), (A('off', 2), 'grin'), (A('fifteen'), 'shocked')], helmet=[(A('off'), False)], y=bob(10, 80)),
        prop('helmet', 'helmet', *head(.45), .14, anchor={'x': GX(.45), 'y': GY(head(.45)[1])},
             opacity=show_from(A('off')), x=track((0, 0), (A('off'), 0), (A('off', 60), 300, 'ease-out-cubic')),
             y=track((0, 0), (A('off'), 0), (A('off', 60), -200, 'ease-out-cubic')), rotate=track((0, 0), (A('off'), 0), (A('off', 60), 240, 'ease-out-cubic'))),
    ], 'annotations': [
        note('no-helmet', 'no helmet!', 300, 760, A('off', 4), size=66, to=(440, 880), frm=(330, 790)),
    ]},

    # 2 three myths, three stamps ----------------------------------------------------------------------
    {'id': 'g-myths', 'width': W, 'height': H, 'layers': [
        you('you', .66, poses=[(0, 'float'), (A('explode'), 'shrug'), (A('freeze'), 'hands-on-hips')], faces=[(0, 'neutral'), (A('explode'), 'happy'), (A('freeze'), 'smug')], y=bob(10, 80)),
        stamp('m1', .36, .43, A('explode', 2)),
        stamp('m2', .36, .54, A('boil', 2)),
        stamp('m3', .36, .65, A('freeze', 2)),
    ], 'annotations': [
        note('explode', 'explode?', 280, 790, A('explode'), size=66, color=INK),
        note('boil', 'blood boils?', 280, 1000, A('boil'), size=60, color=INK),
        note('freeze', 'instant ice?', 280, 1210, A('freeze'), size=60, color=INK),
    ]},

    # 3 the real killer -------------------------------------------------------------------------------
    {'id': 'g-killer', 'width': W, 'height': H, 'layers': [
        you('you', .45, h=.34, poses=[(0, 'float'), (A('lungs'), 'scared')], faces=[(0, 'scared'), (A('pull'), 'pain'), (A('blood'), 'dizzy')], y=bob(8, 80)),
        prop('o2', 'pressure-arrows', .45, FEET - .34 * .5, .4, direction='out', count=6, color='#2f7fd0', opacity=track((0, 0), (A('pull', -1), 0), (A('pull'), 1))),
    ], 'annotations': [
        note('o2', 'O2 out!', 760, 820, A('oxygen'), size=70, color='#2f7fd0'),
    ]},

    # 4 zero: black out ----------------------------------------------------------------------------------
    {'id': 'g-blackout', 'width': W, 'height': H, 'layers': [
        you('you', .45, h=.34, poses=[(0, 'float'), (A('black'), 'tumble')], faces=[(0, 'dizzy'), (A('black'), 'asleep')], anchor={'x': GX(.45), 'y': GY(.62)},
            rotate=track((0, 0), (A('black'), 0), (A('out', 10), -50, 'ease-out-cubic'))),
        prop('dim', 'vignette', .5, .5, .5, level=[{'frame': 0, 'value': .15}, {'frame': A('zero'), 'value': .2}, {'frame': A('out', 6), 'value': .55}]),
    ], 'annotations': []},

    # 5 rescue in time + 1966 -----------------------------------------------------------------------------
    {'id': 'g-rescue', 'width': W, 'height': H, 'layers': [
        prop('station', 'station', .26, .42, .3, level=[{'frame': 0, 'value': 1}]),
        you('you', .62, h=.3, fy=.74, poses=[(0, 'tumble')], faces=[(0, 'asleep'), (A('survive'), 'happy')], anchor={'x': GX(.62), 'y': GY(.6)},
            rotate=track((0, -50)), x=track((0, 0), (A('Get'), 0), (A('survive', 4), -210, 'smoothstep')), y=track((0, 0), (A('Get'), 0), (A('survive', 4), -280, 'smoothstep'))),
        arka('arka', .5, .28, fy=.7, poses=[(0, 'reach')], faces=[(0, 'angry'), (A('survive'), 'grin')], facing='left',
             x=track((0, 0), (A('Get'), 0), (A('survive', 4), -210, 'smoothstep')), y=track((0, 0), (A('Get'), 0), (A('survive', 4), -280, 'smoothstep'))),
        prop('ok', 'check', .7, .5, .1, **pop_in(A('survive', 2), (GX(.7), GY(.5)))),
    ], 'annotations': [
        note('ninety', '~90 seconds', 600, 1200, A('minute'), size=72),
        note('year', '1966: it happened', 540, 1320, A('NASA'), size=56, color=INK),
    ]},

    # 6 closing ------------------------------------------------------------------------------------------
    {'id': 'g-closing', 'width': W, 'height': H, 'layers': [
        arka('arka', .28, .3, poses=[(0, 'reach'), (A('On'), 'hands-on-hips')], faces=[(0, 'smug'), (A('On'), 'grin')]),
        you('you', .64, poses=[(0, 'float'), (A('On'), 'cheer')], faces=[(0, 'neutral'), (A('On'), 'grin')], helmet=[(0, False), (A('On'), True)], y=bob(10, 80)),
        prop('helmet', 'helmet', .38, .52, .14, anchor={'x': GX(.38), 'y': GY(.52)}, opacity=show_until(A('On')),
             x=track((0, 0), (A('Back', -2), 0), (A('On'), GX(.64 - .38), 'smoothstep')), y=track((0, 0), (A('Back', -2), 0), (A('On'), GY(head(.64)[1] - .52), 'smoothstep'))),
    ], 'annotations': [
        note('on', 'helmet ON', 540, 560, A('On', 3), size=84),
    ]},
]

counts = [len(b['narration'].split()) for b in story['beats']]
total = DURATION * FPS
raw = [max(45, total * c / sum(counts)) for c in counts]
scale_ = total / sum(raw)
NOMINAL = [int(r * scale_) for r in raw]
NOMINAL[-1] += total - sum(NOMINAL)

P, WH, T, HB = 'pop', 'whoosh', 'tick', 'heartbeat'
sounds = {
    'hook': [(P, A('off'), -21), (WH, A('off', 2), -24), (T, A('fifteen', -2), -20)],
    'myths': [(T, 0, -20), (P, A('explode', 2), -21), (P, A('boil', 2), -21), (P, A('freeze', 2), -21)],
    'killer': [(T, 0, -20), (HB, A('lungs'), -22), (HB, A('blood'), -22)],
    'blackout': [(T, A('zero', -2), -18), (HB, A('black'), -21)],
    'rescue': [(WH, A('Get'), -24), (P, A('survive', 2), -21), (P, A('NASA'), -21)],
    'closing': [(WH, A('Back', -2), -24), (P, A('On'), -21)],
}
scenes = [scene(b['sceneId'], f"g-{b['id']}", b['id'], NOMINAL[i], sounds[b['id']]) for i, b in enumerate(story['beats'])]
board = {
    'schemaVersion': '2.1', 'projectId': 'helmet-off-short', 'title': story['title'], 'themeId': 'paint-notebook',
    'format': {'width': W, 'height': H, 'fps': FPS}, 'styleId': 'cinematic-illustrated', 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'backdrop': {'group': 'backdrop'},
    'narrationTiming': {'minimumSceneFrames': 30, 'maximumDeviationSeconds': .2},
    'audio': {'music': 'generated-pad', 'musicGainDb': -24, 'duckRatio': 8, 'targetLufs': -14},
    'groups': groups, 'scenes': scenes,
}
if __name__ == '__main__':
    (ROOT / 'storyboards/helmet-off-short.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    if DURATION != story['durationSeconds']:
        story['durationSeconds'] = DURATION
        (ROOT / 'stories/helmet-off-short.json').write_text(json.dumps(story, indent=2, ensure_ascii=False) + '\n')
    print('wrote helmet-off-short', sum(NOMINAL), 'frames', NOMINAL)
