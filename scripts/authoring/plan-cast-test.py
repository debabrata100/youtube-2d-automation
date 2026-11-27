"""M4.3 cast and sets test (27 Nov 2026): Arka and his rival in the four sets (cabin, ISS, Moon, Mars), 3 s each, silent.

The rival: taller and lankier than Arka, a boxy silver suit with a red stripe, a square helmet with a dark visor band and
an antenna, thick brows and a mustache. He faces Arka. Both nod as if talking (talk windows on fixed frames).
Usage: python3 scripts/authoring/plan-cast-test.py
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
from paintkit import figure

ROOT = pathlib.Path(__file__).resolve().parents[2]
SID = 'cast-test'
STORY = ROOT / f'stories/{SID}.json'
S = lambda sec: round(sec * FPS)
STORY.write_text(json.dumps({'schemaVersion': '1.0', 'id': SID, 'title': 'Cast and sets test', 'topic': 'Engine test: second character and sets',
    'language': 'en-US', 'targetAudience': 'internal test', 'durationSeconds': 12, 'storyboard': f'storyboards/{SID}.json',
    'beats': [{'id': 'k1', 'sceneId': 'kt-k1', 'intent': 'closing', 'narration': 'Test.', 'phrases': ['Test.'], 'phraseSpeakers': ['arka']}]}, indent=1) + '\n')

ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'clean-night'
ep.F['primary'] = 1.0
ep.backdrop(stars=0)

RIVAL = dict(build={'head': .9, 'torso': 1.08, 'arms': 1.12, 'legs': 1.18}, suitStyle='boxy', helmetStyle='visor', features=['brows', 'mustache'],
             stripe='#d6453b', skin='#f1d3b8', suit='#e6eaf1', visor='#3b4a73')
SETS = ['cabin', 'iss', 'moon', 'mars']
show = lambda i: track((0, 1 if i == 0 else 0), *([(S(3 * i) - 1, 0), (S(3 * i), 1, 'linear')] if i else []), *([(S(3 * i + 3) - 1, 1), (S(3 * i + 3), 0, 'linear')] if i < 3 else []))
talk_a = [{'from': S(3 * i + .3), 'to': S(3 * i + 1.1), 'text': 'seriously'} for i in range(4)]
talk_r = [{'from': S(3 * i + 1.5), 'to': S(3 * i + 2.5), 'text': 'obviously'} for i in range(4)]

arka = Char('arka', 'arka', x=.4, fy=.86, h=.42, idle='breathe',
            poses=sorted([(0, 'stand'), *[(S(3 * i + .3), 'point-right', 6, 'ease-out-back') for i in range(4)], *[(S(3 * i + 1.5), 'hands-on-hips', 6, 'smoothstep') for i in range(4)]]),
            faces=sorted([(0, 'neutral'), *[(S(3 * i + .2), 'neutral') for i in range(1, 4)], *[(S(3 * i + 1.5), 'angry') for i in range(4)]]))
rival = figure('rival', .6, .86, .42, [(0, 'stand'), *[(S(3 * i + 1.5), 'shrug', 6, 'ease-out-back') for i in range(4)]],
               [(0, 'smug')], outfit='astronaut', seed=7, facing='left', suit=RIVAL['suit'], visor=RIVAL['visor'])
rival['kit'].update({k: v for k, v in RIVAL.items() if k not in ('suit', 'visor')}, talk=talk_r)
props = [Prop({'id': f'set-{s}', 'kit': {'type': 'set', 'kind': s, 'part': 'room', 'seed': 3 + i}, 'opacity': show(i), 'depth': .85}) for i, s in enumerate(SETS)]
props += [Prop({'id': 'lamp', 'kit': {'type': 'light', 'kind': 'pool', 'x': .5, 'y': .1, 'radius': .5, 'color': '#ffe2b0', 'intensity': .3}}),
          Prop({'id': 'vignette', 'kit': {'type': 'light', 'kind': 'vignette', 'radius': .5, 'color': '#05070f', 'intensity': .7}, 'screen': True}),
          Prop(rival)]
ep.scene('k1', explain([arka], props, [], camera_preset=None, sounds=[]))

if __name__ == '__main__':
    board = ep.build()
    g = next(g for g in board['groups'] if g['id'] == 'g-k1')
    order = [f'set-{s}' for s in SETS] + ['lamp', 'arka', 'rival', 'vignette']
    g['layers'].sort(key=lambda l: order.index(l['id']) if l['id'] in order else 5)
    next(l for l in g['layers'] if l['id'] == 'arka')['kit']['talk'] = talk_a
    g['shots'] = [{'frame': 0, 'zoom': 1.05, 'x': W / 2, 'y': H * .52}]
    board['scenes'][0]['sounds'] = [{'sound': s, 'frame': S(3 * i + 1.5), 'gainDb': -8} for i, s in enumerate(['boing', 'slide-down', 'bonk', 'scratch'])]
    out = ROOT / f'storyboards/{SID}.json'
    out.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', out.name, board['scenes'][0]['durationFrames'], 'frames')
