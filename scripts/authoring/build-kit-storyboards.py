"""Generate M2.6 kit storyboards: the volcano rebuilt from the vector kit, and a water-cycle reuse demo.

Every colour is a theme reference ("@role.path"); no hex values and no image assets are used.
Re-run after editing; output is deterministic JSON.
"""
import copy, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
proto = json.loads((ROOT / 'storyboards/volcano-motion-prototype.json').read_text())
W, H = 1000, 1300


def n(x, y):
    return {'x': round(x / W, 4), 'y': round(y / H, 4)}


def cubic(points):
    start, rest = points[0], points[1:]
    return {'start': n(*start), 'segments': [{'type': 'cubic-bezier', 'control1': n(*rest[i]), 'control2': n(*rest[i + 1]), 'to': n(*rest[i + 2])}
                                             for i in range(0, len(rest), 3)]}


def kf(frame, x, y, zoom, rotation=0.0):
    k = {'frame': frame, 'focus': {'x': x, 'y': y}, 'zoom': zoom, 'easing': 'smoothstep'}
    if rotation:
        k['rotation'] = rotation
    return k


def shake(start, x, y, zoom):
    return [kf(start, x, y, zoom, .55), kf(start + 4, x, y, zoom, -.45), kf(start + 8, x, y, zoom, .25), kf(start + 12, x, y, zoom)]


def track(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


SMOKE = {'light': '@smoke.light', 'mid': '@smoke.mid', 'shadow': '@smoke.shadow'}
EMBER = ['@hot.core', '@hot.mid', '@hot.glow']


def puffs(eid, x, y, colors, *, count, start, end, travel, radius, growth, softness, seed, wind, spread=16, life=(62, 92), lobes=5, opacity=None):
    return {'id': eid, 'type': 'puffs', 'count': count, 'seed': seed, 'startFrame': start, 'endFrame': end,
            'emitter': {'x': x, 'y': y, 'width': .05}, 'direction': {'angleDegrees': -90, 'spreadDegrees': spread},
            'travel': list(travel), 'lifetimeFrames': list(life), 'radius': list(radius), 'growth': growth,
            'wind': {'x': wind, 'y': 0}, 'lobes': lobes, 'colors': colors, 'softness': softness,
            'opacity': opacity or [{'at': 0, 'value': 0}, {'at': .06, 'value': .97}, {'at': .7, 'value': .85}, {'at': 1, 'value': 0}],
            'easing': 'ease-out-cubic'}


def stroke(eid, path, start, end, width, color, glow, flow, arrow=None, head=True):
    e = {'id': eid, 'type': 'stroke-reveal', 'path': path, 'progress': track((start, 0), (end, 1)), 'width': width, 'color': color,
         'glow': {'color': glow, 'widthScale': 2.6, 'opacity': .35}, 'headGlow': head}
    if flow:
        e['flow'] = {'color': flow, 'periodFrames': 26, 'dash': .07, 'gap': .2, 'opacity': .8, 'widthScale': .45}
    if arrow:
        e['arrowHead'] = arrow
    return e


def label(lid, text, x, y, *, anchor='middle', show=(0, 20), to=None, frm=None, size=44):
    a = {'id': lid, 'text': text, 'x': x, 'y': y, 'size': size, 'anchor': anchor, 'variant': 'pill',
         'opacity': track((0, 0), (show[0], 0), (show[1], 1)) if show[0] else track((0, 0), (show[1], 1))}
    if to:
        a['connector'] = {'from': {'x': frm[0], 'y': frm[1]}, 'to': {'x': to[0], 'y': to[1]}}
    return a


def backdrop(stars, sun, clouds, ridges_top=.55, ridges_bottom=.66, ground=.64):
    return {'id': 'backdrop', 'width': 1080, 'height': 1920, 'layers': [
        {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .64, 'stars': stars, 'seed': 4}},
        {'id': 'sun', 'kit': {'type': 'sun', **sun}},
        *[{'id': f'cloud-{i}', 'kit': {'type': 'cloud', **c}} for i, c in enumerate(clouds)],
        {'id': 'ridges', 'kit': {'type': 'ridges', 'top': ridges_top, 'bottom': ridges_bottom, 'layers': 3, 'peaks': 6, 'roughness': .55, 'drift': .00012, 'seed': 21}},
        {'id': 'ground', 'kit': {'type': 'ground', 'top': ground, 'rocks': 7, 'seed': 9}},
    ]}


# ------------------------------------------------------------------ volcano, rebuilt from the kit
CONE = {'cx': .5, 'baseY': .6154, 'baseWidth': .88, 'height': .4138, 'crater': .16, 'concavity': .55}
CRATER = (.5, .2015)
mountain = lambda part='full', **extra: {'type': 'mountain', **CONE, 'part': part, 'gullies': 6, 'seed': 3, **extra}
conduit = cubic([(500, 1000), (470, 820), (530, 560), (500, 268)])
lava_paths = {
    'lava-a': (cubic([(482, 290), (470, 360), (420, 430), (395, 520), (370, 600), (330, 660), (300, 760)]), 6, 62, .013),
    'lava-b': (cubic([(512, 292), (522, 380), (502, 470), (530, 560), (560, 650), (540, 720), (575, 790)]), 10, 72, .014),
    'lava-c': (cubic([(542, 288), (582, 340), (622, 400), (660, 470), (700, 540), (720, 600), (760, 660)]), 16, 66, .012),
    'lava-d': (cubic([(428, 446), (402, 472), (362, 502), (322, 560)]), 32, 74, .009),
}
wisp = puffs('idle-wisp', CRATER[0], CRATER[1], SMOKE, count=10, start=0, end=170, travel=(.12, .2), radius=(.012, .018), growth=2.2,
             softness=.1, seed=5201, wind=.04, life=(70, 100), opacity=[{'at': 0, 'value': 0}, {'at': .2, 'value': .6}, {'at': 1, 'value': 0}])
fade_in = track((0, 0), (18, 1))
volcano = {
    'schemaVersion': '2.1', 'projectId': 'volcano-kit', 'title': 'How a Volcano Erupts - M2.6 vector kit',
    'themeId': 'explainer-dusk', 'format': proto['format'], 'styleId': proto['styleId'], 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'crossfadeFrames': proto['crossfadeFrames'], 'narrationTiming': proto['narrationTiming'],
    'backdrop': {'group': 'backdrop'},
    'groups': [
        backdrop(46, {'x': .26, 'y': .6, 'radius': .045, 'glow': 3.2},
                 [{'x': .12, 'y': .24, 'width': .3, 'drift': .0004, 'seed': 31}, {'x': .72, 'y': .33, 'width': .22, 'drift': .0006, 'seed': 32},
                  {'x': .5, 'y': .14, 'width': .17, 'drift': .0003, 'seed': 33}]),
        {'id': 'quiet', 'width': W, 'height': H, 'layers': [{'id': 'cone', 'kit': mountain()}, {'id': 'wisp', 'effects': [wisp]}, {'id': 'rim', 'kit': mountain('rim-front')}]},
        {'id': 'split', 'width': W, 'height': H, 'layers': [
            {'id': 'left-half', 'kit': mountain('left'), 'x': track((4, 0), (30, -430)), 'opacity': track((12, 1), (26, 0))},
            {'id': 'right-half', 'kit': mountain('right'), 'x': track((4, 0), (30, 430)), 'opacity': track((12, 1), (26, 0))},
        ]},
        {'id': 'internal', 'width': W, 'height': H, 'layers': [
            {'id': 'cutaway', 'opacity': fade_in, 'kit': {'type': 'strata', 'mountain': CONE, 'groundY': .6154, 'left': .02, 'right': .98, 'bottom': .9, 'bowl': .06,
                                                         'layers': 6, 'seed': 12, 'cavities': [{'cx': .5, 'cy': .8154, 'rx': .25, 'ry': .081}],
                                                         'channels': [{'path': conduit, 'width': .042}]}},
            {'id': 'chamber', 'opacity': fade_in, 'pulse': {'periodFrames': 90, 'brightness': .06},
             'kit': {'type': 'blob', 'cx': .5, 'cy': .8154, 'rx': .228, 'ry': .066, 'seed': 14, 'irregularity': .14, 'fill': 'hot', 'bubbles': 6},
             'reveal': {'type': 'wipe', 'direction': 'up', 'bounds': {'x': 0, 'y': 960, 'width': W, 'height': 200}, 'progress': track((0, .35), (75, 1)), 'feather': 18}},
            {'id': 'magma', 'effects': [
                stroke('conduit-magma', conduit, 92, 172, .024, '@hot.mid', '@hot.glow', '@hot.core'),
                {'id': 'gas-bubbles', 'type': 'path-motion', 'path': conduit, 'startFrame': 104, 'durationFrames': 44, 'endFrame': 180, 'repeat': True,
                 'copies': 6, 'easing': 'linear', 'radius': .007, 'aspect': 1, 'scale': 1, 'opacity': .95, 'color': '@hot.core'},
            ]},
        ], 'annotations': [
            label('chamber-label', 'Magma chamber', 500, 1228, show=(0, 28)),
            label('conduit-label', 'Conduit', 668, 652, anchor='start', show=(100, 120), frm=(650, 640), to=(522, 640)),
        ]},
        {'id': 'active', 'width': W, 'height': H, 'layers': [
            {'id': 'cone', 'kit': mountain()},
            {'id': 'glow', 'kit': {'type': 'glow', 'x': CRATER[0], 'y': CRATER[1], 'rx': .16, 'ry': .05, 'tone': 'hot'}, 'opacity': track((0, 0), (6, 1)),
             'pulse': {'periodFrames': 30, 'brightness': .1}},
            {'id': 'column', 'effects': [
                puffs('burst-base', CRATER[0], CRATER[1], {'light': '@rock.light', 'mid': '@smoke.shadow', 'shadow': '@rock.outline'}, count=14, start=3, end=30,
                      travel=(.16, .28), radius=(.024, .036), growth=2.5, softness=.12, seed=5102, wind=.02, spread=55, life=(34, 52), lobes=4),
                puffs('smoke-column', CRATER[0], CRATER[1] - .002, SMOKE, count=40, start=6, end=172, travel=(.22, .37), radius=(.026, .04), growth=2.9,
                      softness=.08, seed=5101, wind=.06),
            ]},
            {'id': 'rim', 'kit': mountain('rim-front')},
            {'id': 'lava', 'effects': [stroke(k, p, s, e, w, '@hot.edge', '@hot.glow', '@hot.core') for k, (p, s, e, w) in lava_paths.items()]},
            {'id': 'ejecta', 'effects': [{
                'id': 'lava-bombs', 'type': 'particles', 'count': 22, 'seed': 5103, 'startFrame': 6, 'endFrame': 42,
                'emitter': {'x': .5, 'y': .195, 'width': .03, 'height': .005}, 'lifetimeFrames': [30, 48],
                'velocity': {'angleDegrees': -90, 'spreadDegrees': 75, 'speed': [.008, .014]}, 'acceleration': {'x': 0, 'y': .00034},
                'radius': [.004, .0075], 'colors': EMBER, 'shape': 'streak',
                'opacity': [{'at': 0, 'value': 0}, {'at': .08, 'value': 1}, {'at': .75, 'value': .9}, {'at': 1, 'value': 0}],
                'scale': [{'at': 0, 'value': .6}, {'at': .15, 'value': 1}, {'at': 1, 'value': .5}]}]},
        ], 'annotations': [label('lava-label', 'Lava', 800, 738, anchor='start', show=(100, 116), frm=(790, 718), to=(742, 652))]},
    ],
}
GY, GS = .56, .9


def subj(a, off=None):
    return {'asset': a, 'x': .5, 'y': GY, 'size': GS, **({'timeOffset': off} if off else {})}


cams = [
    [kf(0, .5, .55, 1.0), kf(65, .5, .52, 1.08)],
    [kf(0, .5, .52, 1.08), kf(83, .5, .68, 1.12)],
    [kf(0, .5, .68, 1.12), kf(92, .5, .5, 1.12)],
    [kf(0, .5, .5, 1.12)] + shake(6, .5, .42, 1.24) + [kf(74, .5, .47, 1.08)],
    [kf(0, .5, .47, 1.08), kf(131, .5, .48, 1.05)],
]
configs = [
    {'primary': subj('quiet')},
    # Comparison draws left then right: the cut-open interior sits under the separating halves.
    {'left': subj('internal'), 'right': subj('split')},
    {'primary': subj('internal', 90), 'fromScale': 1, 'toScale': 1},
    {'primary': subj('active'), 'count': 0, 'radiusX': .06, 'radiusY': .14},
    {'subjects': [subj('active', 90)]},
]
volcano['scenes'] = []
for s, cam, cfg in zip(copy.deepcopy(proto['scenes']), cams, configs):
    s.update({'camera': {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': cam}, 'config': cfg, 'environmentDim': 0})
    volcano['scenes'].append(s)

# ------------------------------------------------------------------ water cycle: reuse proof, no engine changes
river = cubic([(640, 560), (560, 640), (470, 700), (380, 760), (300, 800), (240, 820), (180, 830)])
evap = [cubic([(110, 830), (60, 640), (180, 480), (300, 330)]), cubic([(260, 840), (230, 650), (330, 500), (420, 360)])]
water = {
    'schemaVersion': '2.1', 'projectId': 'water-cycle-demo', 'title': 'The Water Cycle - M2.6 kit reuse demo',
    'themeId': 'explainer-day', 'format': proto['format'], 'styleId': proto['styleId'], 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'backdrop': {'group': 'backdrop'},
    'groups': [
        backdrop(0, {'x': .2, 'y': .16, 'radius': .06, 'glow': 2.8},
                 [{'x': .85, 'y': .1, 'width': .2, 'drift': .0003, 'seed': 41}, {'x': .1, 'y': .32, 'width': .16, 'drift': .0005, 'seed': 42}],
                 ridges_top=.5, ridges_bottom=.62),
        {'id': 'cycle', 'width': W, 'height': H, 'layers': [
            {'id': 'mountain', 'kit': {'type': 'mountain', 'cx': .72, 'baseY': .66, 'baseWidth': .64, 'height': .44, 'crater': 0, 'concavity': .2, 'part': 'full',
                                       'gullies': 4, 'snow': .26, 'seed': 6}},
            {'id': 'sea', 'kit': {'type': 'water', 'x': -.12, 'y': .62, 'width': .66, 'height': .3, 'waves': 3, 'periodFrames': 90, 'seed': 2}},
            {'id': 'river', 'effects': [stroke('runoff', river, 30, 110, .016, '@water.mid', '@water.light', '@water.foam')]},
            {'id': 'evaporation', 'effects': [stroke(f'evap-{i}', p, 8 + i * 12, 60 + i * 12, .01, '@water.foam', '@water.light', None, arrow=2.6, head=False)
                                              for i, p in enumerate(evap)]},
            {'id': 'cloud-a', 'kit': {'type': 'cloud', 'x': .46, 'y': .22, 'width': .34, 'seed': 51}},
            {'id': 'cloud-b', 'kit': {'type': 'cloud', 'x': .76, 'y': .17, 'width': .26, 'seed': 52}},
            {'id': 'rain', 'effects': [{
                'id': 'rain', 'type': 'particles', 'count': 80, 'seed': 61, 'startFrame': 40, 'endFrame': 150,
                'emitter': {'x': .76, 'y': .2, 'width': .18, 'height': .01}, 'lifetimeFrames': [18, 26],
                'velocity': {'angleDegrees': 100, 'spreadDegrees': 4, 'speed': [.009, .012]}, 'acceleration': {'x': 0, 'y': 0},
                'radius': [.005, .007], 'colors': ['@water.mid', '@water.deep'], 'shape': 'streak',
                'opacity': [{'at': 0, 'value': 0}, {'at': .15, 'value': .95}, {'at': .85, 'value': .9}, {'at': 1, 'value': 0}],
                'scale': [{'at': 0, 'value': 1}, {'at': 1, 'value': 1}]}]},
        ], 'annotations': [
            label('evaporation', 'Evaporation', 210, 560, show=(30, 46)),
            label('condensation', 'Condensation', 470, 168, show=(55, 70)),
            label('precipitation', 'Precipitation', 790, 520, show=(70, 85)),
            label('collection', 'Collection', 190, 1010, show=(95, 110)),
        ]},
    ],
    'scenes': [{
        'id': 'water-cycle', 'template': 'hero-reveal', 'durationFrames': 150,
        'caption': {'text': 'The water cycle', 'kicker': 'KIT REUSE DEMO', 'preset': 'headline'},
        'camera': {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': [kf(0, .5, .56, 1.0), kf(149, .5, .54, 1.06)]},
        'motion': {'preset': 'still'}, 'transitionFrames': 0, 'config': {'primary': subj('cycle')},
    }],
}

for name, board in [('volcano-kit', volcano), ('water-cycle-demo', water)]:
    (ROOT / f'storyboards/{name}.json').write_text(json.dumps(board, indent=2) + '\n')
    print('wrote', name)
