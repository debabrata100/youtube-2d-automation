"""M4.1 cinematic toolkit test (27 Nov 2026): 15 s, 16:9, clean style.

Arka floats happily in a spacecraft cabin. Cut to his face. Insert: the console screen blinks "COFFEE 0%". Over-the-
console shot with a rack focus from the screen to Arka, who panics; a red alarm light pulses as the shot pulls back.
Exercises: shots with cuts and pushes, depth (parallax), blur (depth of field / rack focus), light pools, a beam, rim
light, vignette, colour grade, the cabin set and the clean-night theme. No narration (silent test).

Usage: python3 scripts/authoring/plan-cinema-test.py
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403

ROOT = pathlib.Path(__file__).resolve().parents[2]
SID = 'cinema-test'
STORY = ROOT / f'stories/{SID}.json'
S = lambda sec: round(sec * FPS)
STORY.write_text(json.dumps({'schemaVersion': '1.0', 'id': SID, 'title': 'Cinematic toolkit test', 'topic': 'Engine test: shots, depth of field, lighting (no narration)',
    'language': 'en-US', 'targetAudience': 'internal test', 'durationSeconds': 15, 'storyboard': f'storyboards/{SID}.json',
    'beats': [{'id': 'c1', 'sceneId': 'ct-c1', 'intent': 'closing', 'narration': 'Coffee.', 'phrases': ['Coffee.'], 'phraseSpeakers': ['arka']}]}, indent=1) + '\n')

ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'clean-night'
ep.F['primary'] = 1.0
ep.backdrop(stars=0)

CONSOLE = {'y': .8, 'x0': .38, 'x1': 1.08, 'screenX': .66, 'text': 'COFFEE\n0%', 'screenColor': '#ff5a4f', 'blink': True}
room = {'type': 'set', 'kind': 'cabin', 'part': 'room', 'porthole': {'x': .52, 'y': .36, 'r': .13, 'view': 'earth'}, 'seed': 3}
desk = {'type': 'set', 'kind': 'cabin', 'part': 'console', 'console': CONSOLE, 'seed': 5}

ARKA = (.43, .9)                          # x, feet (fraction of the frame); he floats a little above the floor
HEAD = (ARKA[0] * W, (ARKA[1] - .5) * H)  # roughly his helmet, for the close-up
SCREEN = (CONSOLE['screenX'] * W, CONSOLE['y'] * H - .17 * H * .3)
ALARM = S(9)
at_depth = lambda p, d: (W / 2 + (p[0] - W / 2) / d, H / 2 + (p[1] - H / 2) / d)   # shot focus that centres point p on a layer at depth d
SCREEN_F = at_depth(SCREEN, 1.18)

# Shots: wide (slow push) | CUT close-up | CUT insert on the screen | CUT over-the-console medium + rack focus | pull back.
shots = [
    {'frame': 0, 'zoom': 1.0, 'x': W / 2, 'y': H / 2},
    {'frame': S(3) - 1, 'zoom': 1.08, 'x': W * .48, 'y': H * .5, 'ease': 'linear'},
    {'frame': S(3), 'zoom': 2.5, 'x': HEAD[0], 'y': HEAD[1] + 30, 'cut': True},
    {'frame': S(5) - 1, 'zoom': 2.65, 'x': HEAD[0], 'y': HEAD[1] + 30, 'ease': 'linear'},
    {'frame': S(5), 'zoom': 2.2, 'x': SCREEN_F[0], 'y': SCREEN_F[1], 'cut': True},
    {'frame': S(7.5) - 1, 'zoom': 2.35, 'x': SCREEN_F[0], 'y': SCREEN_F[1], 'ease': 'linear'},
    {'frame': S(7.5), 'zoom': 1.55, 'x': W * .58, 'y': H * .55, 'cut': True},
    {'frame': S(11), 'zoom': 1.6, 'x': W * .56, 'y': H * .55, 'ease': 'linear'},
    {'frame': S(15), 'zoom': 1.0, 'x': W / 2, 'y': H / 2, 'ease': 'ease-out-cubic'},
]
# Depth of field: in the insert the screen is sharp and everything behind it soft; in the medium shot focus racks
# from the screen to Arka.
blur_back = track((0, 0), (S(5) - 1, 0), (S(5), 9, 'linear'), (S(7.5) - 1, 9), (S(7.5), 6, 'linear'), (S(8.6), 6), (S(9.6), 0), (S(15), 0))
blur_arka = track((0, 0), (S(5) - 1, 0), (S(5), 14, 'linear'), (S(7.5) - 1, 14), (S(7.5), 12, 'linear'), (S(8.6), 12), (S(9.6), 0), (S(15), 0))
blur_desk = track((0, 0), (S(7.5) - 1, 0), (S(8.6), 0), (S(9.6), 10), (S(12.5), 10), (S(14), 0))
alarm = track((0, 0), (ALARM - 1, 0), (ALARM + 4, 1, 'linear'))

arka = Char('arka', 'arka', x=ARKA[0], fy=ARKA[1], h=.5, idle='breathe',
            poses=[(0, 'float'), (S(3), 'float'), (S(8.6), 'float'), (ALARM, 'panic'), (S(12.5), 'cower')],
            faces=[(0, 'happy'), (S(3.4), 'neutral'), (S(4.2), 'shocked'), (ALARM, 'scream'), (S(12.5), 'sad')],
            layer={'blur': blur_arka, 'depth': 1.0, 'y': drift(10, 90, S(15)), 'rotate': track((0, -4), (S(3), 3), (S(8.6), -3), (ALARM, 0, 'ease-out-back'))})
props = [
    Prop({'id': 'room', 'kit': room, 'depth': .8, 'blur': blur_back}),
    Prop({'id': 'beam', 'kit': {'type': 'light', 'kind': 'beam', 'x': .52, 'y': .36, 'angle': 108, 'radius': .55, 'spread': .35, 'color': '#9fd2ff', 'intensity': .35}, 'depth': .8}),
    Prop({'id': 'lamp', 'kit': {'type': 'light', 'kind': 'pool', 'x': .45, 'y': .02, 'radius': .45, 'color': '#ffd9a0', 'intensity': .45}, 'depth': .9}),
    Prop({'id': 'rim', 'kit': {'type': 'light', 'kind': 'pool', 'x': ARKA[0] + .04, 'y': .42, 'radius': .16, 'color': '#8fc8ff', 'intensity': .35}, 'depth': 1.0}),
    Prop({'id': 'desk', 'kit': desk, 'depth': 1.18, 'blur': blur_desk}),
    Prop({'id': 'screenglow', 'kit': {'type': 'light', 'kind': 'pool', 'x': CONSOLE['screenX'], 'y': .7, 'radius': .22, 'color': '#ff5a4f', 'intensity': .4, 'flicker': .6}, 'depth': 1.18}),
    Prop({'id': 'alarm', 'kit': {'type': 'light', 'kind': 'pool', 'x': .5, 'y': .05, 'radius': .9, 'color': '#ff2a2a', 'intensity': .55, 'flicker': .9}, 'opacity': alarm, 'screen': True}),
    Prop({'id': 'grade', 'kit': {'type': 'light', 'kind': 'grade', 'color': '#2a3f7a', 'intensity': .35}, 'screen': True}),
    Prop({'id': 'vignette', 'kit': {'type': 'light', 'kind': 'vignette', 'radius': .5, 'color': '#05070f', 'intensity': .85}, 'screen': True}),
]
ep.scene('c1', explain([arka], props, [], camera_preset=None, sounds=[]))

if __name__ == '__main__':
    board = ep.build()
    g = next(g for g in board['groups'] if g['id'] == 'g-c1')
    order = ['room', 'beam', 'lamp', 'arka', 'rim', 'desk', 'screenglow', 'alarm', 'grade', 'vignette']
    g['layers'].sort(key=lambda l: order.index(l['id']) if l['id'] in order else 3)
    g['shots'] = shots
    board['scenes'][0]['sounds'] = []
    out = ROOT / f'storyboards/{SID}.json'
    out.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', out.name, board['scenes'][0]['durationFrames'], 'frames')
