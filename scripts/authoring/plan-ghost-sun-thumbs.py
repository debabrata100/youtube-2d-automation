"""Ep 5 thumbnail art (free, offline): three 1920x1080 frames drawn with our own kit, in the episode's style.

Writes storyboards/ghost-sun-thumbs.json (one 30-frame scene per thumbnail, no narration). Render the art with
  npx tsx scripts/preview-stills.ts --storyboard storyboards/ghost-sun-thumbs.json --frames 15,45,75 --output jobs/<dir>
then letter each one with scripts/compose-thumbnail.ts and thumbnails/ghost-sun/<a|b|c>.json (big text is added there).

A  the air falls: a frozen town under a black sky, the air snowing down, the Sun's empty place, a shivering Arka
B  lights out: Earth with its night side lit by cities and the day side going black, the clock at 12:08:20, the Sun's empty place
C  the last life: frozen ocean surface above, tube worms at a glowing vent in the dark below
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
src = json.loads((ROOT / 'storyboards/ghost-sun.json').read_text())
EARTH, LAND, SUN = '#5aa9e6', '#7cc576', '#ffcf4a'


def prop(pid, item, x, y, size, **k):
    return {'id': pid, 'kit': {'type': 'prop', 'item': item, 'x': x, 'y': y, 'size': size, **k}}


def planet(pid, x, y, r, base, bands, shade=.2, seed=3):
    return {'id': pid, 'kit': {'type': 'planet', 'x': x, 'y': y, 'radius': r, 'base': base, 'bands': bands, 'craters': 0, 'ring': False, 'shade': shade, 'seed': seed}}


def lv(v):
    return [{'frame': 0, 'value': v}]


A = [prop('town', 'town', .72, .88, .5, level=lv(0), ink='#c9d3ea'),
     prop('snow', 'snowfall', .7, .5, .75, count=40, level=lv(1)), prop('snow2', 'snowfall', .66, .62, .7, count=30, level=lv(1)),
     prop('ice', 'ice-layer', .5, .97, 1.0, level=lv(.55)),
     prop('ghost', 'orbit-ring', .9, .17, .2, ink='#c9d3ea'),
     {'id': 'arka', 'kit': {'type': 'figure', 'x': .16, 'y': .93, 'height': .5, 'outfit': 'astronaut', 'shiver': 1, 'seed': 11,
                            'poses': [{'frame': 0, 'pose': 'cower'}], 'faces': [{'frame': 0, 'face': 'scared'}], 'suit': '#e8b84a', 'visor': '#ffe6a3'}},
     prop('frost', 'frost', .16, .93, .22, count=14, level=lv(.9))]
B = [planet('earth', .27, .6, .34, EARTH, [LAND, EARTH, LAND]),
     prop('night', 'night-half', .27, .6, .68, rotation=180, level=lv(1)),
     prop('city', 'city-lights', .27, .6, .68, count=30, level=lv(.95)),
     prop('day', 'night-half', .27, .6, .68, rotation=0, level=lv(.5)),
     prop('ghost', 'orbit-ring', .1, .14, .16, ink='#c9d3ea'),
     prop('clock', 'clock-time', .76, .66, .36, values=[{'frame': 0, 'value': 500}], ink='#c9d3ea')]
C = [{'id': 'water', 'kit': {'type': 'prop', 'item': 'sky', 'x': .5, 'y': .5, 'size': 1.0, 'rotation': 180, 'color': '#06182e', 'level': lv(.92)}},   # light under the ice, dark in the deep
     prop('ice', 'ice-layer', .5, .16, 1.0, level=lv(1)),
     prop('ice2', 'ice-layer', .5, .2, 1.0, level=lv(.6)),
     prop('glow', 'sparkle', .74, .66, .56, count=8, color='#ff9a4a', level=lv(.85)),
     prop('vent', 'vent', .74, .76, .52, count=10, level=lv(1)),
     prop('worms', 'coral', .55, .88, .24)]
groups = [g for g in src['groups'] if g['id'] == 'backdrop']
scenes = []
for i, (gid, layers) in enumerate((('g-ta', A), ('g-tb', B), ('g-tc', C))):
    groups.append({'id': gid, 'width': 1920, 'height': 1080, 'layers': layers, 'annotations': []})
    sc = {k: v for k, v in src['scenes'][4].items() if k not in ('narrationCue', 'sounds')}
    sc.update({'id': f'thumb-{"abc"[i]}', 'durationFrames': 30, 'animationDurationFrames': 30, 'caption': {'text': ' ', 'preset': 'body'},   # no scene caption on a thumbnail
               'camera': {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': [{'frame': 0, 'focus': {'x': .5, 'y': .5}, 'zoom': 1.0, 'easing': 'smoothstep'}]},
               'seed': 9100 + i, 'config': {'primary': {'asset': gid, 'x': .5, 'y': .5, 'size': .9}}})
    scenes.append(sc)
board = {k: v for k, v in src.items() if k not in ('groups', 'scenes', 'narrationTiming', 'audio')}
board.update({'projectId': 'ghost-sun-thumbs', 'title': 'Ep 5 thumbnails', 'assets': [], 'groups': groups, 'scenes': scenes})
out = ROOT / 'storyboards/ghost-sun-thumbs.json'
out.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
print('wrote', out.name)
