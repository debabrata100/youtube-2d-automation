"""Generate storyboards/lightning.json - M3.0 episode built only from the vector kit and existing effects.

Colours are theme references (explainer-storm). Scene effect timings use each scene's nominal
(animation) frames; narration scheduling rescales them. NOMINAL durations below come from the
estimated-timing schedule so the scale factor stays close to 1 (camera keys use output frames).
"""
import json, pathlib, random

ROOT = pathlib.Path(__file__).resolve().parents[2]
W, H = 1000, 1300
# Scene lengths from the approved narration's schedule (38 s timeline), so effect clocks run at 1x and the
# word-anchored frames below land on the spoken words (anchors measured from provider word timings).
NOMINAL = [119, 150, 134, 150, 157, 174, 256]
assert sum(NOMINAL) == 1140, sum(NOMINAL)


def n(x, y):
    return {'x': round(x, 4), 'y': round(y, 4)}


def track(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def kf(frame, x, y, zoom, rotation=0.0, easing='smoothstep'):
    k = {'frame': frame, 'focus': {'x': x, 'y': y}, 'zoom': zoom, 'easing': easing}
    if rotation:
        k['rotation'] = rotation
    return k


def shake(start, x, y, zoom, amount=1.0):
    return [kf(start, x, y, zoom, .7 * amount), kf(start + 3, x, y, zoom, -.6 * amount), kf(start + 6, x, y, zoom, .35 * amount), kf(start + 10, x, y, zoom)]


def jagged(start, end, segments, amp, seed):
    """Seeded zigzag polyline between two normalized points (line segments)."""
    rng = random.Random(seed)
    (x0, y0), (x1, y1) = start, end
    dx, dy = x1 - x0, y1 - y0
    length = (dx * dx + dy * dy) ** .5
    px, py = -dy / length, dx / length
    pts = []
    for i in range(1, segments + 1):
        t = i / segments
        off = 0 if i == segments else (rng.random() - .5) * 2 * amp
        pts.append((x0 + dx * t + px * off, y0 + dy * t + py * off))
    return {'start': n(x0, y0), 'segments': [{'type': 'line', 'to': n(x, y)} for x, y in pts]}


def point_on(path, k):
    seg = path['segments'][k - 1]['to']
    return seg['x'], seg['y']


def circle(cx, cy, r):
    k = .5523 * r
    pts = [(cx + r, cy), (cx, cy + r), (cx - r, cy), (cx, cy - r), (cx + r, cy)]
    ctrl = [((cx + r, cy + k), (cx + k, cy + r)), ((cx - k, cy + r), (cx - r, cy + k)), ((cx - r, cy - k), (cx - k, cy - r)), ((cx + k, cy - r), (cx + r, cy - k))]
    return {'start': n(*pts[0]), 'segments': [{'type': 'cubic-bezier', 'control1': n(*c1), 'control2': n(*c2), 'to': n(*pts[i + 1])} for i, (c1, c2) in enumerate(ctrl)]}


def stroke(eid, path, progress, width, color, glow, glow_scale=2.6, glow_opacity=.35, head=True, arrow=None):
    e = {'id': eid, 'type': 'stroke-reveal', 'path': path, 'progress': progress, 'width': width, 'color': color,
         'glow': {'color': glow, 'widthScale': glow_scale, 'opacity': glow_opacity}, 'headGlow': head}
    if arrow:
        e['arrowHead'] = arrow
    return e


def particles(eid, seed, count, start, end, emitter, angle, spread, speed, life, radius, colors, shape='circle', accel=(0, 0), opacity=None, scale=None):
    return {'id': eid, 'type': 'particles', 'count': count, 'seed': seed, 'startFrame': start, 'endFrame': end,
            'emitter': emitter, 'lifetimeFrames': list(life), 'velocity': {'angleDegrees': angle, 'spreadDegrees': spread, 'speed': list(speed)},
            'acceleration': {'x': accel[0], 'y': accel[1]}, 'radius': list(radius), 'colors': colors, 'shape': shape,
            'opacity': opacity or [{'at': 0, 'value': 0}, {'at': .12, 'value': .95}, {'at': .8, 'value': .85}, {'at': 1, 'value': 0}],
            'scale': scale or [{'at': 0, 'value': .6}, {'at': .2, 'value': 1}, {'at': 1, 'value': .8}]}


def label(lid, text, x, y, show, anchor='middle', size=44, frm=None, to=None):
    a = {'id': lid, 'text': text, 'x': x, 'y': y, 'size': size, 'anchor': anchor, 'variant': 'pill', 'pop': True,
         'opacity': track((0, 0), (show[0], 0), (show[1], 1))}
    if to:
        a['connector'] = {'from': {'x': frm[0], 'y': frm[1]}, 'to': {'x': to[0], 'y': to[1]}}
    return a


SMOKE = {'light': '@smoke.light', 'mid': '@smoke.mid', 'shadow': '@smoke.shadow'}
CLOUDS = [  # towering storm cloud: anvil, tower, shoulders, wide base
    {'id': 'anvil', 'kit': {'type': 'cloud', 'x': .5, 'y': .13, 'width': 1.05, 'lobes': 9, 'seed': 71}},
    {'id': 'tower', 'kit': {'type': 'cloud', 'x': .52, 'y': .23, 'width': .56, 'lobes': 6, 'seed': 72}},
    {'id': 'shoulder-l', 'kit': {'type': 'cloud', 'x': .34, 'y': .33, 'width': .56, 'lobes': 6, 'seed': 73}},
    {'id': 'shoulder-r', 'kit': {'type': 'cloud', 'x': .67, 'y': .32, 'width': .52, 'lobes': 6, 'seed': 74}},
    {'id': 'base', 'kit': {'type': 'cloud', 'x': .5, 'y': .43, 'width': 1.02, 'lobes': 9, 'seed': 75}},
]
HILL = {'id': 'hill', 'kit': {'type': 'mountain', 'cx': .66, 'baseY': .9, 'baseWidth': .46, 'height': .11, 'crater': 0, 'concavity': .3, 'part': 'full', 'gullies': 3, 'seed': 81}}
CLOUD_BASE, HILL_TOP = (.45, .44), (.66, .79)
BOLT = jagged(CLOUD_BASE, HILL_TOP, 10, .035, 901)
BRANCH_A = jagged(point_on(BOLT, 3), (.33, .63), 4, .02, 902)
BRANCH_B = jagged(point_on(BOLT, 6), (.79, .72), 3, .018, 903)
STREAMER = jagged(HILL_TOP, point_on(BOLT, 9), 2, .006, 904)


def bolt_layers(prefix, at, flicker_until, width=.012):
    """Full bright strike: main channel, branches, flicker, and a screen-wide flash."""
    flick = track((at - 1, 0), (at, 1), (at + 5, 1), (at + 6, .25), (at + 8, 1), (flicker_until, 1), (flicker_until + 14, 0))
    return [
        {'id': f'{prefix}-flash', 'kit': {'type': 'glow', 'x': .5, 'y': .45, 'rx': 1.3, 'ry': 1.0, 'tone': 'sun'},
         'opacity': track((at - 1, 0), (at + 1, .8), (at + 6, 0), (at + 8, .45), (at + 14, 0))},
        {'id': f'{prefix}-bolt', 'opacity': flick, 'effects': [
            stroke(f'{prefix}-main', BOLT, track((at - 2, 0), (at + 1, 1)), width, '@hot.core', '@hot.glow', 4, .6, head=False),
            stroke(f'{prefix}-branch-a', BRANCH_A, track((at - 1, 0), (at + 2, 1)), width * .55, '@hot.mid', '@hot.glow', 3.5, .45, head=False),
            stroke(f'{prefix}-branch-b', BRANCH_B, track((at - 1, 0), (at + 2, 1)), width * .5, '@hot.mid', '@hot.glow', 3.5, .45, head=False),
        ]},
    ]


def group(gid, *layers, annotations=None):
    g = {'id': gid, 'width': W, 'height': H, 'layers': [*CLOUDS, HILL, *[l for layer in layers for l in (layer if isinstance(layer, list) else [layer])]]}
    if annotations:
        g['annotations'] = annotations
    return g


ice_up = lambda seed, count=56, start=6: particles('ice-rising', seed, count, start, 145, {'x': .5, 'y': .44, 'width': .55, 'height': .04}, -90, 18, (.0022, .0038), (60, 110), (.007, .011), ['@hot.mid', '@water.foam'], 'diamond')
groups = [
    {'id': 'backdrop', 'width': 1080, 'height': 1920, 'layers': [
        {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .7, 'stars': 0, 'seed': 5}},
        {'id': 'ridges', 'kit': {'type': 'ridges', 'top': .66, 'bottom': .76, 'layers': 3, 'peaks': 6, 'roughness': .5, 'drift': .00006, 'seed': 22}},
        {'id': 'ground', 'kit': {'type': 'ground', 'top': .753, 'rocks': 6, 'seed': 10}},
    ]},
    group('g-hook', bolt_layers('hook', 8, 26), annotations=[
        label('bolt-temp', 'Lightning ~30,000 °C', 500, 880, (34, 48)),
        label('sun-temp', "Sun's surface ~5,500 °C", 500, 965, (84, 98)),
    ]),
    group('g-cloud',
        {'id': 'updraft', 'effects': [
            stroke(f'updraft-{i}', jagged((x, .74), (x + .02, .28), 1, 0, 0), track((s, 0), (s + 45, 1)), .008, '@smoke.light', '@water.light', head=False, arrow=2.6)
            for i, (x, s) in enumerate([(.34, 82), (.5, 90), (.66, 98)])]},
        {'id': 'ice', 'effects': [ice_up(601, start=96)]},
        annotations=[label('updraft-label', 'Updraft', 780, 640, (108, 122))]),
    group('g-collide', {'id': 'ice', 'effects': [ice_up(602, 50)]},
          {'id': 'hail', 'effects': [particles('hail-falling', 603, 26, 0, 125, {'x': .5, 'y': .2, 'width': .5, 'height': .04}, 90, 14, (.0016, .0026), (70, 110), (.014, .021), ['@rock.light', '@smoke.light'])]},
          {'id': 'sparks', 'effects': [particles('charge-sparks', 604, 46, 50, 130, {'x': .5, 'y': .31, 'width': .5, 'height': .1}, 0, 180, (.002, .004), (6, 11), (.005, .008), ['@hot.core', '@text.accent'], 'streak')]},
          annotations=[label('ice-label', 'Ice crystals', 250, 255, (10, 24), size=42), label('hail-label', 'Soft hail', 760, 420, (28, 42), size=42)]),
    group('g-separate',
          {'id': 'positive', 'effects': [particles('positive', 701, 54, 0, 110, {'x': .5, 'y': .33, 'width': .6, 'height': .06}, -90, 26, (.0018, .0024), (150, 175), (.008, .012), ['@text.accent'], accel=(0, .0000125),
                                                  opacity=[{'at': 0, 'value': 0}, {'at': .1, 'value': .95}, {'at': 1, 'value': .9}])]},
          {'id': 'negative', 'effects': [particles('negative', 702, 54, 64, 120, {'x': .5, 'y': .3, 'width': .6, 'height': .06}, 90, 26, (.0016, .0022), (150, 175), (.008, .012), ['@water.light'], accel=(0, -.0000115),
                                                  opacity=[{'at': 0, 'value': 0}, {'at': .1, 'value': .95}, {'at': 1, 'value': .9}])]},
          annotations=[label('positive-label', '+  Positive', 500, 130, (8, 22)), label('negative-label', '−  Negative', 500, 640, (74, 88))]),
    group('g-leader',
          {'id': 'base-charge', 'kit': {'type': 'glow', 'x': .45, 'y': .44, 'rx': .32, 'ry': .06, 'tone': 'sky'}, 'opacity': track((0, .6))},
          {'id': 'ground-charge', 'effects': [particles('ground-positive', 801, 26, 20, 140, {'x': .66, 'y': .84, 'width': .4, 'height': .04}, -90, 30, (.0004, .0008), (60, 90), (.005, .007), ['@text.accent'])]},
          {'id': 'leader', 'effects': [
              stroke('leader-main', BOLT, [{'frame': f, 'value': v} for f, v in [(24, 0), (32, .16), (46, .16), (54, .32), (68, .32), (76, .48), (98, .48), (104, .64), (124, .64), (130, .82)]],
                     .006, '@hot.edge', '@hot.glow', 3, .35),
              stroke('leader-branch-a', BRANCH_A, track((60, 0), (68, .4), (80, .4), (88, .7)), .004, '@hot.edge', '@hot.glow', 3, .3),
              stroke('leader-branch-b', BRANCH_B, track((104, 0), (112, .5)), .004, '@hot.edge', '@hot.glow', 3, .3),
          ]},
          annotations=[label('leader-label', 'Stepped leader', 225, 760, (62, 76), frm=(330, 745), to=(420, 700))]),
    group('g-strike',
          {'id': 'waiting-leader', 'effects': [stroke('leader-hold', BOLT, track((0, .82)), .006, '@hot.edge', '@hot.glow', 3, .35)], 'opacity': track((0, 1), (113, 1), (115, 0))},
          {'id': 'streamer', 'effects': [stroke('streamer', STREAMER, track((30, 0), (74, 1)), .006, '@hot.edge', '@hot.glow', 3, .4)], 'opacity': track((0, 1), (113, 1), (115, 0))},
          bolt_layers('strike', 114, 158, width=.014),
          annotations=[label('streamer-label', 'Streamer', 830, 980, (42, 56), size=40), label('return-label', 'Return stroke', 225, 840, (138, 152), frm=(340, 825), to=(560, 760))]),
    group('g-thunder',
          {'id': 'afterglow', 'effects': [stroke('afterglow', BOLT, track((0, 1)), .012, '@hot.mid', '@hot.glow', 3, .4, head=False)], 'opacity': track((0, .9), (36, 0))},
          *[{'id': f'shock-{i}', 'anchor': {'x': 560, 'y': 790}, 'effects': [stroke(f'ring-{i}', circle(.56, .6077, .05), track((0, 1)), .006, '@smoke.light', '@water.light', head=False)],
             'scale': track((d, .3), (d + 60, 2.9)), 'opacity': track((d, 0), (d + 4, .9), (d + 60, 0))} for i, d in enumerate([10, 24, 38])],
          {'id': 'rain', 'effects': [particles('rain', 951, 90, 10, 240, {'x': .5, 'y': .46, 'width': 1.0, 'height': .02}, 100, 4, (.009, .012), (22, 30), (.003, .0045), ['@water.light', '@water.mid'], 'streak',
                                                opacity=[{'at': 0, 'value': 0}, {'at': .15, 'value': .8}, {'at': .85, 'value': .75}, {'at': 1, 'value': 0}], scale=[{'at': 0, 'value': 1}, {'at': 1, 'value': 1}])]},
          annotations=[label('thunder-label', 'Thunder', 500, 1000, (128, 140), size=52)]),
]


def scene(sid, gid, cue, cam, sounds, nominal, caption):
    return {'id': sid, 'template': 'hero-reveal', 'durationFrames': nominal, 'animationDurationFrames': nominal,
            'caption': {'text': caption, 'preset': 'body'}, 'camera': {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': cam},
            'motion': {'preset': 'still'}, 'seed': 3000 + len(sid), 'transitionFrames': 0, 'environmentDim': 0,
            'config': {'primary': {'asset': gid, 'x': .5, 'y': .5, 'size': .9}},
            'narrationCue': {'beatId': cue, 'phraseIndex': 0, 'edge': 'start'},
            'sounds': [{'sound': s, 'frame': f, 'gainDb': g} for s, f, g in sounds]}


scenes = [
    scene('strike-hook', 'g-hook', 'hook', [kf(0, .5, .5, 1.12)] + shake(7, .5, .5, 1.12) + [kf(44, .5, .48, 1.0, 0, 'ease-out-back')],
          [('rumble', 0, -18), ('boom', 7, -9), ('pop', 36, -17), ('pop', 86, -17)], NOMINAL[0], 'How lightning forms'),
    scene('storm-cloud', 'g-cloud', 'setup', [kf(0, .5, .48, 1.0), kf(70, .5, .42, 1.08)], [('whoosh', 86, -14), ('pop', 110, -17)], NOMINAL[1], 'Inside a storm cloud'),
    scene('ice-collisions', 'g-collide', 'collisions', [kf(0, .5, .42, 1.08), kf(36, .5, .32, 1.26)],
          [('pop', 12, -17), ('pop', 30, -17), ('pop', 56, -19), ('pop', 74, -19), ('pop', 106, -19)], NOMINAL[2], 'Collisions trade charge'),
    scene('charge-separation', 'g-separate', 'separation', [kf(0, .5, .32, 1.26), kf(34, .5, .36, 1.05)], [('pop', 10, -17), ('pop', 76, -17)], NOMINAL[3], 'Charges separate'),
    scene('stepped-leader', 'g-leader', 'leader', [kf(0, .5, .36, 1.05), kf(40, .5, .52, 1.0)],
          [('sizzle', 24, -26), ('pop', 64, -17), ('riser', 128, -20)], NOMINAL[4], 'The stepped leader'),
    scene('return-stroke', 'g-strike', 'strike', [kf(0, .5, .52, 1.0), kf(100, .5, .52, 1.0)] + shake(114, .5, .52, 1.0, 1.4) + [kf(140, .5, .5, 1.02)],
          [('pop', 44, -19), ('boom', 114, -7), ('pop', 140, -17)], NOMINAL[5], 'Return stroke'),
    scene('thunder', 'g-thunder', 'closing', [kf(0, .5, .5, 1.02), kf(90, .5, .5, 1.06)], [('rumble', 10, -14), ('whoosh', 10, -18), ('pop', 132, -17), ('rumble', 146, -8)], NOMINAL[6], 'Thunder'),
]

board = {
    'schemaVersion': '2.1', 'projectId': 'lightning', 'title': 'How Lightning Forms', 'themeId': 'explainer-storm',
    'format': {'width': 1080, 'height': 1920, 'fps': 30}, 'styleId': 'cinematic-illustrated', 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'backdrop': {'group': 'backdrop'}, 'crossfadeFrames': 8,
    'narrationTiming': {'minimumSceneFrames': 45, 'maximumDeviationSeconds': .2},
    'audio': {'music': 'generated-pad', 'musicGainDb': -22, 'duckRatio': 8, 'targetLufs': -14},
    'groups': groups, 'scenes': scenes,
}
(ROOT / 'storyboards/lightning.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
print('wrote lightning', sum(s['durationFrames'] for s in scenes), 'frames')
