"""Generate the M2.5 style-spike storyboards from the M2.4.1 prototype.

Variant B: painted art, re-staged eruption (procedural smoke column, larger ejecta, punch-in camera).
Variant C: flat vector art for all five scenes, same scene ids, narration cues and templates.
Re-run after editing; output is deterministic JSON.
"""
import copy, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
proto = json.loads((ROOT / 'storyboards/volcano-motion-prototype.json').read_text())


def kf(frame, x, y, zoom, rotation=0.0, easing='smoothstep'):
    k = {'frame': frame, 'focus': {'x': x, 'y': y}, 'zoom': zoom, 'easing': easing}
    if rotation:
        k['rotation'] = rotation
    return k


def shake(start, x, y, zoom):
    """Short deterministic impact wobble expressed as ordinary camera keyframes."""
    return [kf(start, x, y, zoom, .55), kf(start + 4, x, y, zoom, -.45), kf(start + 8, x, y, zoom, .25), kf(start + 12, x, y, zoom)]


def smoke_column(eid, x, y, colors, *, count=40, start=6, end=172, travel=(.32, .5), radius=(.026, .04),
                 growth=2.9, softness=.55, seed=5101, wind=.06):
    return {'id': eid, 'type': 'puffs', 'count': count, 'seed': seed, 'startFrame': start, 'endFrame': end,
            'emitter': {'x': x, 'y': y, 'width': .05}, 'direction': {'angleDegrees': -90, 'spreadDegrees': 16},
            'travel': list(travel), 'lifetimeFrames': [62, 92], 'radius': list(radius), 'growth': growth,
            'wind': {'x': wind, 'y': 0}, 'lobes': 5, 'colors': colors, 'softness': softness,
            'opacity': [{'at': 0, 'value': 0}, {'at': .06, 'value': .97}, {'at': .7, 'value': .85}, {'at': 1, 'value': 0}],
            'easing': 'ease-out-cubic'}


def burst(eid, x, y, colors, seed=5102):
    return {'id': eid, 'type': 'puffs', 'count': 14, 'seed': seed, 'startFrame': 3, 'endFrame': 30,
            'emitter': {'x': x, 'y': y, 'width': .04}, 'direction': {'angleDegrees': -90, 'spreadDegrees': 55},
            'travel': [.16, .28], 'lifetimeFrames': [34, 52], 'radius': [.024, .036], 'growth': 2.5,
            'wind': {'x': .02, 'y': 0}, 'lobes': 4, 'colors': colors, 'softness': .3,
            'opacity': [{'at': 0, 'value': 0}, {'at': .05, 'value': 1}, {'at': .6, 'value': .8}, {'at': 1, 'value': 0}],
            'easing': 'ease-out-cubic'}


def bombs(eid, x, y, colors, seed=5103):
    return {'id': eid, 'type': 'particles', 'count': 22, 'seed': seed, 'startFrame': 6, 'endFrame': 42,
            'emitter': {'x': x, 'y': y, 'width': .03, 'height': .005}, 'lifetimeFrames': [30, 48],
            'velocity': {'angleDegrees': -90, 'spreadDegrees': 75, 'speed': [.008, .014]},
            'acceleration': {'x': 0, 'y': .00034}, 'radius': [.004, .0075], 'colors': colors, 'shape': 'streak',
            'opacity': [{'at': 0, 'value': 0}, {'at': .08, 'value': 1}, {'at': .75, 'value': .9}, {'at': 1, 'value': 0}],
            'scale': [{'at': 0, 'value': .6}, {'at': .15, 'value': 1}, {'at': 1, 'value': .5}]}


# ------------------------------------------------------------------ Variant B (painted, re-staged)
b = copy.deepcopy(proto)
b['projectId'] = 'volcano-style-b'
b['title'] = 'How a Volcano Erupts - M2.5 variant B (painted, re-staged)'
active = next(g for g in b['groups'] if g['id'] == 'active')
crater = (640 / 1254, 334 / 1254)
column_layer = {
    'id': 'eruption-column',
    'masks': [{'asset': 'rim', 'mode': 'inverse-alpha'}],
    'maskPadding': 800,
    'effects': [
        burst('burst-base', crater[0], crater[1] - .004, {'light': '#b98b78', 'mid': '#6a5258', 'shadow': '#2d2228'}),
        smoke_column('smoke-column', crater[0], crater[1] - .006, {'light': '#e9cdb6', 'mid': '#8d7c80', 'shadow': '#4a3c42'}),
    ],
}
ejecta_layer = {'id': 'ejecta', 'effects': [bombs('lava-bombs', crater[0], crater[1] - .01, ['#ffd36b', '#ff8a2a', '#fff0b8'])]}
idx = [l['id'] for l in active['layers']].index('ash')
active['layers'][idx:idx] = [column_layer]
active['layers'].append(ejecta_layer)
erupt = next(s for s in b['scenes'] if s['id'] == 'eruption')
erupt['camera']['keyframes'] = [kf(0, .5, .555, 1.1)] + shake(6, .5, .5, 1.24) + [kf(74, .5, .5, 1.0)]
summary = next(s for s in b['scenes'] if s['id'] == 'final-summary')
summary['camera']['keyframes'] = [kf(0, .5, .5, 1.0), kf(131, .5, .51, .985)]

# ------------------------------------------------------------------ Variant C (flat vector)
W, H = 1000, 1300


def n(x, y):
    return {'x': round(x / W, 4), 'y': round(y / H, 4)}


def cubic(points):
    """points: start, then (c1, c2, to) triples in canvas units."""
    start, rest = points[0], points[1:]
    return {'start': n(*start), 'segments': [{'type': 'cubic-bezier', 'control1': n(*rest[i]), 'control2': n(*rest[i + 1]),
                                              'to': n(*rest[i + 2])} for i in range(0, len(rest), 3)]}


VD = 'illustrations/vector-volcano-v1/'


def asset(i, f, w=W, h=H, t=True):
    return {'id': i, 'path': VD + f, 'type': 'svg', 'width': w, 'height': h, 'transparent': t, 'styleId': 'flat-vector'}


c = {
    'schemaVersion': '2.1', 'projectId': 'volcano-style-c',
    'title': 'How a Volcano Erupts - M2.5 variant C (flat vector)',
    'format': proto['format'], 'styleId': proto['styleId'], 'background': '#1d1b47', 'accent': '#ffb46a',
    'assets': [asset('v-sky', 'sky.svg', 1080, 1920, False), asset('v-cone', 'cone.svg'), asset('v-cutaway', 'cutaway.svg'),
               asset('v-chamber', 'chamber.svg'), asset('v-crater-glow', 'crater-glow.svg'), asset('v-rim-front', 'rim-front.svg')],
    'backdrop': {'asset': 'v-sky', 'decoration': False, 'dim': 0},
    'crossfadeFrames': proto['crossfadeFrames'], 'narrationTiming': proto['narrationTiming'],
}
smoke_flat = {'light': '#fff4ea', 'mid': '#c9b3b4', 'shadow': '#7a6270'}
conduit = cubic([(500, 1000), (470, 820), (530, 560), (500, 268)])
lava_paths = {
    'lava-a': (cubic([(482, 290), (470, 360), (420, 430), (395, 520), (370, 600), (330, 660), (300, 760)]), 6, 62, .013),
    'lava-b': (cubic([(512, 292), (522, 380), (502, 470), (530, 560), (560, 650), (540, 720), (575, 790)]), 10, 72, .014),
    'lava-c': (cubic([(542, 288), (582, 340), (622, 400), (660, 470), (700, 540), (720, 600), (760, 660)]), 16, 66, .012),
    'lava-d': (cubic([(428, 446), (402, 472), (362, 502), (322, 560)]), 32, 74, .009),
}


def lava(eid, path, start, end, width):
    return {'id': eid, 'type': 'stroke-reveal', 'path': path, 'progress': [{'frame': start, 'value': 0}, {'frame': end, 'value': 1}],
            'width': width, 'color': '#ff6a1a', 'glow': {'color': '#ff9a3d', 'widthScale': 2.8, 'opacity': .38},
            'flow': {'color': '#ffe9a0', 'periodFrames': 26, 'dash': .07, 'gap': .2, 'opacity': .8, 'widthScale': .45}}


wisp = smoke_column('idle-wisp', .5, .2, smoke_flat, count=10, start=0, end=170, travel=(.12, .2), radius=(.012, .018),
                    growth=2.2, softness=.25, seed=5201, wind=.04)
wisp['opacity'] = [{'at': 0, 'value': 0}, {'at': .2, 'value': .55}, {'at': 1, 'value': 0}]
wisp['lifetimeFrames'] = [70, 100]
c['groups'] = [
    {'id': 'v-quiet', 'width': W, 'height': H,
     'layers': [{'id': 'cone', 'asset': 'v-cone'}, {'id': 'wisp', 'effects': [wisp]}, {'id': 'rim', 'asset': 'v-rim-front'}]},
    {'id': 'v-dissolve', 'width': W, 'height': H,
     'layers': [{'id': 'cone', 'asset': 'v-cone', 'opacity': [{'frame': 0, 'value': 1}, {'frame': 24, 'value': 0}]}]},
    {'id': 'v-internal', 'width': W, 'height': H,
     'layers': [
         {'id': 'cutaway', 'asset': 'v-cutaway', 'opacity': [{'frame': 0, 'value': 0}, {'frame': 24, 'value': 1}]},
         {'id': 'chamber', 'asset': 'v-chamber', 'opacity': [{'frame': 0, 'value': 0}, {'frame': 24, 'value': 1}],
          'pulse': {'periodFrames': 90, 'brightness': .06},
          'reveal': {'type': 'wipe', 'direction': 'up', 'bounds': {'x': 0, 'y': 960, 'width': W, 'height': 200},
                     'progress': [{'frame': 0, 'value': .35}, {'frame': 75, 'value': 1}], 'feather': 18}},
         {'id': 'magma', 'effects': [
             {'id': 'conduit-magma', 'type': 'stroke-reveal', 'path': conduit,
              'progress': [{'frame': 92, 'value': 0}, {'frame': 172, 'value': 1}], 'width': .024, 'color': '#ff7a22',
              'glow': {'color': '#ffb04a', 'widthScale': 2.2, 'opacity': .3},
              'flow': {'color': '#ffe9a0', 'periodFrames': 30, 'dash': .05, 'gap': .14, 'opacity': .75, 'widthScale': .4}},
             {'id': 'gas-bubbles', 'type': 'path-motion', 'path': conduit, 'startFrame': 104, 'durationFrames': 44, 'endFrame': 180,
              'repeat': True, 'copies': 6, 'easing': 'linear', 'radius': .007, 'aspect': 1, 'scale': 1, 'opacity': .95, 'color': '#fff3c4'},
         ]},
     ],
     'annotations': [
         {'id': 'chamber-label', 'text': 'Magma chamber', 'x': 500, 'y': 1225, 'size': 46,
          'opacity': [{'frame': 0, 'value': 0}, {'frame': 28, 'value': 1}]},
         {'id': 'conduit-label', 'text': 'Conduit', 'x': 650, 'y': 650, 'size': 46, 'anchor': 'start',
          'opacity': [{'frame': 0, 'value': 0}, {'frame': 100, 'value': 0}, {'frame': 120, 'value': 1}],
          'connector': {'from': {'x': 640, 'y': 637}, 'to': {'x': 522, 'y': 637}}},
     ]},
    {'id': 'v-active', 'width': W, 'height': H,
     'layers': [
         {'id': 'cone', 'asset': 'v-cone'},
         {'id': 'glow', 'asset': 'v-crater-glow', 'opacity': [{'frame': 0, 'value': 0}, {'frame': 6, 'value': 1}],
          'pulse': {'periodFrames': 30, 'brightness': .1}},
         {'id': 'column', 'effects': [burst('burst-base', .5, .2, {'light': '#d4a48e', 'mid': '#8a6e78', 'shadow': '#4a3542'}),
                                      smoke_column('smoke-column', .5, .199, smoke_flat, softness=.08, travel=(.22, .37))]},
         {'id': 'rim', 'asset': 'v-rim-front'},
         {'id': 'lava', 'effects': [lava(k, *v) for k, v in lava_paths.items()]},
         {'id': 'ejecta', 'effects': [bombs('lava-bombs', .5, .195, ['#ffd36b', '#ff8a2a', '#fff0b8'])]},
     ],
     'annotations': [
         {'id': 'lava-label', 'text': 'Lava', 'x': 800, 'y': 735, 'size': 50, 'anchor': 'start',
          'opacity': [{'frame': 0, 'value': 0}, {'frame': 100, 'value': 0}, {'frame': 116, 'value': 1}],
          'connector': {'from': {'x': 795, 'y': 718}, 'to': {'x': 740, 'y': 650}}},
     ]},
]
GY, GS = .56, .9


def subj(a, off=None):
    return {'asset': a, 'x': .5, 'y': GY, 'size': GS, **({'timeOffset': off} if off else {})}


scenes = copy.deepcopy(proto['scenes'])
cams = [
    [kf(0, .5, .55, 1.0), kf(65, .5, .52, 1.08)],
    [kf(0, .5, .52, 1.08), kf(83, .5, .68, 1.12)],
    [kf(0, .5, .68, 1.12), kf(92, .5, .5, 1.12)],
    [kf(0, .5, .5, 1.12)] + shake(6, .5, .42, 1.24) + [kf(74, .5, .47, 1.08)],
    [kf(0, .5, .47, 1.08), kf(131, .5, .48, 1.05)],
]
configs = [
    {'primary': subj('v-quiet')},
    {'left': subj('v-dissolve'), 'right': subj('v-internal')},
    {'primary': subj('v-internal', 90), 'fromScale': 1, 'toScale': 1},
    {'primary': subj('v-active'), 'count': 0, 'radiusX': .06, 'radiusY': .14},
    {'subjects': [subj('v-active', 90)]},
]
for s, cam, cfg in zip(scenes, cams, configs):
    s['camera'] = {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': cam}
    s['config'] = cfg
    s['environmentDim'] = 0
c['scenes'] = scenes

for name, board in [('volcano-style-b', b), ('volcano-style-c', c)]:
    (ROOT / f'storyboards/{name}.json').write_text(json.dumps(board, indent=2) + '\n')
    print('wrote', name)
