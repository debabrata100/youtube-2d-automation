"""E7 thumbnail art (free, offline): three 1920x1080 frames drawn with our own kit, in the episode's style.

Writes storyboards/apophis-thumbs.json (one 30-frame scene per thumbnail, no narration). Render the art with
  npx tsx scripts/preview-stills.ts --storyboard storyboards/apophis-thumbs.json --frames 15,45,75 --output jobs/<dir>
then letter each one with scripts/compose-thumbnail.ts and thumbnails/apophis/<a|b|c>.json (big text is added there).

A  MYTH | REALITY: left, Earth blown apart (the scary videos); right, the real flyby: Arka riding Apophis past an intact Earth
B  INSIDE THE RING: Earth with the geostationary ring, Apophis (with Arka on it) cutting inside it
C  WE RODE IT: Arka cheering on Apophis's lumpy back, Earth filling the sky
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
src = json.loads((ROOT / 'storyboards/apophis.json').read_text())
EARTH, LAND, ROCK, SOFT = '#5aa9e6', '#7cc576', '#9a948a', '#c9d3ea'


def prop(pid, item, x, y, size, **k):
    return {'id': pid, 'kit': {'type': 'prop', 'item': item, 'x': x, 'y': y, 'size': size, **k}}


def planet(pid, x, y, r, base=EARTH, bands=(LAND, EARTH, LAND), shade=.2, seed=3):
    return {'id': pid, 'kit': {'type': 'planet', 'x': x, 'y': y, 'radius': r, 'base': base, 'bands': list(bands), 'craters': 0, 'ring': False, 'shade': shade, 'seed': seed}}


def rock(pid, x, y, size, rotation=0):
    return prop(pid, 'asteroid', x, y, size, color=ROCK, rotation=rotation)


def arka(x, y, h, pose, face, facing='right'):
    return {'id': 'arka', 'kit': {'type': 'figure', 'x': x, 'y': y, 'height': h, 'outfit': 'astronaut', 'shiver': 0, 'seed': 11, 'facing': facing,
                                  'poses': [{'frame': 0, 'pose': pose}], 'faces': [{'frame': 0, 'face': face}], 'suit': '#e8b84a', 'visor': '#ffe6a3'}}


def lv(v):
    return [{'frame': 0, 'value': v}]


A = [planet('earth-myth', .24, .62, .24), prop('boom', 'impact', .28, .52, .5, count=14, level=lv(1)),
     prop('fire', 'sparkle', .28, .52, .4, count=10, color='#ff9a4a', level=lv(.9)),
     prop('rock-myth', 'asteroid', .2, .32, .14, color=ROCK, rotation=-20),
     planet('earth-real', .86, .56, .17), rock('apo', .64, .78, .2, rotation=-8),
     arka(.64, .69, .24, 'cheer', 'grin'), prop('ml', 'motion-lines', .78, .78, .14, rotation=180, ink=SOFT)]
B = [planet('earth', .3, .6, .3), prop('geo', 'orbit-ring', .3, .6, .9, ink=SOFT),
     prop('sat1', 'station', .55, .24, .08, ink=SOFT), prop('sat2', 'probe', .06, .3, .07, ink=SOFT),
     rock('apo', .72, .78, .24, rotation=-6), arka(.72, .7, .24, 'point-left', 'shocked', facing='left'),
     prop('ml', 'motion-lines', .88, .78, .18, ink=SOFT)]
C = [planet('earth', .66, .34, .36), rock('ground', .5, 1.27, 1.0),
     arka(.26, .87, .36, 'cheer', 'grin')]
groups = [g for g in src['groups'] if g['id'] == 'backdrop']
scenes = []
for i, (gid, layers) in enumerate((('g-ta', A), ('g-tb', B), ('g-tc', C))):
    groups.append({'id': gid, 'width': 1920, 'height': 1080, 'layers': layers, 'annotations': []})
    sc = {k: v for k, v in src['scenes'][4].items() if k not in ('narrationCue', 'sounds')}
    sc.update({'id': f'thumb-{"abc"[i]}', 'durationFrames': 30, 'animationDurationFrames': 30, 'caption': {'text': ' ', 'preset': 'body'},
               'camera': {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': [{'frame': 0, 'focus': {'x': .5, 'y': .5}, 'zoom': 1.0, 'easing': 'smoothstep'}]},
               'seed': 9200 + i, 'config': {'primary': {'asset': gid, 'x': .5, 'y': .5, 'size': .9}}})
    scenes.append(sc)
board = {k: v for k, v in src.items() if k not in ('groups', 'scenes', 'narrationTiming', 'audio')}
board.update({'projectId': 'apophis-thumbs', 'title': 'E7 thumbnails', 'assets': [], 'groups': groups, 'scenes': scenes})
out = ROOT / 'storyboards/apophis-thumbs.json'
out.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
print('wrote', out.name)
