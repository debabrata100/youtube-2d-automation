"""M4.2 acting test (27 Nov 2026): 12 s, 16:9, clean style, Arka E3's approved line cut from Episode 7 (no new paid audio).

Arka floats in the cabin; the console reads SPEED 12 cm/s. He glances, looks away, double-takes (wind-up + overshoot),
cut to a close-up: "Twelve centimetres a second?" (lip sync); insert of the screen; medium shot, deadpan to camera:
"I walk to the kitchen faster than that." Then a shrug, and the shot pulls back.

Narration: jobs/act-test-narration (cut from jobs/e7-narration with scripts/cut-narration.py, padded to start at 4.0 s).
Usage: python3 scripts/authoring/plan-acting-test.py
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
from acting import talk, snap, double_take

ROOT = pathlib.Path(__file__).resolve().parents[2]
SID = 'acting-test'
STORY = ROOT / f'stories/{SID}.json'
S = lambda sec: round(sec * FPS)
LINE1, LINE2 = 'Twelve centimetres a second?', 'I walk to the kitchen faster than that.'
TEXT = f'{LINE1} {LINE2}'
STORY.write_text(json.dumps({'schemaVersion': '1.0', 'id': SID, 'title': 'Acting test', 'topic': 'Engine test: lip sync and comic timing',
    'language': 'en-US', 'targetAudience': 'internal test', 'durationSeconds': 12, 'storyboard': f'storyboards/{SID}.json',
    'beats': [{'id': 'a1', 'sceneId': 'at-a1', 'intent': 'closing', 'narration': TEXT, 'phrases': [LINE1, LINE2], 'phraseSpeakers': ['arka', 'arka']}]}, indent=1) + '\n')

ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'clean-night'
ep.F['primary'] = 1.0
ep.backdrop(stars=0)

CONSOLE = {'y': .8, 'x0': .38, 'x1': 1.08, 'screenX': .66, 'text': 'SPEED\n12 cm/s', 'screenColor': '#5ee08a', 'blink': False}
ARKA = (.43, .9)
HEAD = (ARKA[0] * W + 50, (ARKA[1] - .5) * H)
SCREEN = (CONSOLE['screenX'] * W, CONSOLE['y'] * H - .17 * H * .3)
at_depth = lambda p, d: (W / 2 + (p[0] - W / 2) / d, H / 2 + (p[1] - H / 2) / d)
SCREEN_F = at_depth(SCREEN, 1.18)

GLANCE = S(1.6)                    # double-take starts here; the snap-back lands at GLANCE + 28 frames
L1, L1END = A('twelve'), A('second', edge='end')
L2, L2END = A('i'), A('that', edge='end')

shots = [
    {'frame': 0, 'zoom': 1.0, 'x': W / 2, 'y': H / 2},
    {'frame': GLANCE + 27, 'zoom': 1.06, 'x': W * .48, 'y': H * .5, 'ease': 'linear'},
    {'frame': GLANCE + 28, 'zoom': 2.3, 'x': HEAD[0], 'y': HEAD[1] + 40, 'cut': True},                    # snap-back: cut in
    {'frame': plus(L1END, 6), 'zoom': 2.42, 'x': HEAD[0], 'y': HEAD[1] + 40, 'ease': 'linear'},
    {'frame': plus(L1END, 7), 'zoom': 2.2, 'x': SCREEN_F[0], 'y': SCREEN_F[1], 'cut': True},             # insert: the screen
    {'frame': plus(L2, -9), 'zoom': 2.3, 'x': SCREEN_F[0], 'y': SCREEN_F[1], 'ease': 'linear'},
    {'frame': plus(L2, -8), 'zoom': 1.5, 'x': W * .47, 'y': H * .5, 'cut': True},                         # medium, to camera
    {'frame': plus(L2END, 20), 'zoom': 1.55, 'x': W * .47, 'y': H * .5, 'ease': 'linear'},
    {'frame': S(12), 'zoom': 1.0, 'x': W / 2, 'y': H / 2, 'ease': 'ease-out-cubic'},
]
blur_back = track((0, 0), (plus(L1END, 6), 0), (plus(L1END, 7), 8, 'linear'), (plus(L2, -9), 8), (plus(L2, -8), 0, 'linear'))
blur_arka = track((0, 0), (plus(L1END, 6), 0), (plus(L1END, 7), 12, 'linear'), (plus(L2, -9), 12), (plus(L2, -8), 0, 'linear'))

poses = [(0, 'float'), *double_take(GLANCE, look='point-right', away='float', back='reach'),
         *snap(plus(L2, -8), 'hands-on-hips', wind='cower', lead=4), *snap(plus(L2END, 14), 'shrug', wind='stand', lead=4)]
faces = [(0, 'happy'), (GLANCE, 'neutral'), (GLANCE + 14, 'happy'), (GLANCE + 26, 'shocked'), (plus(L2, -8), 'neutral'), (plus(L2END, 14), 'smug')]
arka = Char('arka', 'arka', x=ARKA[0], fy=ARKA[1], h=.5, idle='breathe', poses=poses, faces=faces,
            layer={'blur': blur_arka, 'y': track((0, 0), (GLANCE + 24, 0), (GLANCE + 28, -26, 'ease-out-cubic'), (GLANCE + 40, 0, 'ease-out-back'))})
props = [
    Prop({'id': 'room', 'kit': {'type': 'set', 'kind': 'cabin', 'part': 'room', 'porthole': {'x': .52, 'y': .36, 'r': .13, 'view': 'earth'}, 'seed': 3}, 'depth': .8, 'blur': blur_back}),
    Prop({'id': 'beam', 'kit': {'type': 'light', 'kind': 'beam', 'x': .52, 'y': .36, 'angle': 108, 'radius': .55, 'spread': .35, 'color': '#9fd2ff', 'intensity': .3}, 'depth': .8}),
    Prop({'id': 'lamp', 'kit': {'type': 'light', 'kind': 'pool', 'x': .45, 'y': .02, 'radius': .45, 'color': '#ffd9a0', 'intensity': .45}, 'depth': .9}),
    Prop({'id': 'desk', 'kit': {'type': 'set', 'kind': 'cabin', 'part': 'console', 'console': CONSOLE, 'seed': 5}, 'depth': 1.18}),
    Prop({'id': 'screenglow', 'kit': {'type': 'light', 'kind': 'pool', 'x': CONSOLE['screenX'], 'y': .7, 'radius': .2, 'color': '#5ee08a', 'intensity': .3}, 'depth': 1.18}),
    Prop({'id': 'grade', 'kit': {'type': 'light', 'kind': 'grade', 'color': '#2a3f7a', 'intensity': .3}, 'screen': True}),
    Prop({'id': 'vignette', 'kit': {'type': 'light', 'kind': 'vignette', 'radius': .5, 'color': '#05070f', 'intensity': .8}, 'screen': True}),
]
ep.scene('a1', explain([arka], props, [], camera_preset=None, sounds=[]))

if __name__ == '__main__':
    board = ep.build()
    g = next(g for g in board['groups'] if g['id'] == 'g-a1')
    order = ['room', 'beam', 'lamp', 'arka', 'desk', 'screenglow', 'grade', 'vignette']
    g['layers'].sort(key=lambda l: order.index(l['id']) if l['id'] in order else 3)
    g['shots'] = shots
    next(l for l in g['layers'] if l['id'] == 'arka')['kit']['talk'] = talk(TEXT)
    sc = board['scenes'][0]
    sc['sounds'] = [{'sound': 'pop', 'frame': GLANCE + 28, 'gainDb': -10}]
    board.setdefault('audio', {})
    out = ROOT / f'storyboards/{SID}.json'
    out.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', out.name, sc['durationFrames'], 'frames')
