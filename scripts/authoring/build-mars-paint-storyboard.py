"""Generate storyboards/mars-paint-test.json - M3.2 hand-drawn style prototype (16:9, paint-notebook theme).

Built from the reusable kit only: figure (stick figure / astronaut), planet, terrain, ink notes and existing
effects. Story moments are word anchors, so any narration take lines up without retiming.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
W, H = 1920, 1080          # scene group coordinates (rendered at 0.9 of the frame, centred)
FW, FH = 1920, 1080        # backdrop group = full frame
NOMINAL = [180, 168, 138, 113, 271]
INK, RED, BLUE, PALE = '@text.fill', '@text.accent', '@water.mid', '@water.light'


def A(word, offset=0, n=1, edge=None, beat=None):
    a = {'at': word}
    if n != 1: a['n'] = n
    if edge: a['edge'] = edge
    if offset: a['offset'] = offset
    if beat: a['beat'] = beat
    return a


def track(*pairs):
    out = []
    for p in pairs:
        k = {'frame': p[0], 'value': p[1]}
        if len(p) > 2: k['ease'] = p[2]
        out.append(k)
    return out


def figure(fid, fx, fy, h, poses, faces, outfit='stick', facing='right', shiver=0, seed=1, **layer):
    return {'id': fid, 'kit': {'type': 'figure', 'x': fx, 'y': fy, 'height': h, 'facing': facing, 'outfit': outfit,
            'poses': [{'frame': f, 'pose': p} for f, p in poses], 'faces': [{'frame': f, 'face': c} for f, c in faces], 'shiver': shiver, 'seed': seed}, **layer}


def planet(pid, px, py, r, base, craters=0, shade=.18, seed=1, **layer):
    return {'id': pid, 'kit': {'type': 'planet', 'x': px, 'y': py, 'radius': r, 'base': base, 'craters': craters, 'shade': shade, 'seed': seed}, **layer}


def note(nid, text, x, y, at, size=72, color=RED, to=None, frm=None, hide=None):
    a = {'id': nid, 'text': text, 'x': x, 'y': y, 'size': size, 'anchor': 'middle', 'variant': 'ink', 'color': color, 'pop': True,
         'opacity': track((0, 0), (plus(at, -1), 0), (plus(at, 5), 1))}
    if to:
        a['connector'] = {'from': {'x': frm[0], 'y': frm[1]}, 'to': {'x': to[0], 'y': to[1]}}
    return a


def plus(t, k):
    if isinstance(t, dict):
        o = dict(t); total = o.pop('offset', 0) + k
        if total: o['offset'] = total
        return o
    return t + k


def pop_in(at):
    return {'opacity': track((0, 0), (plus(at, -1), 0), (at, 1)), 'scale': track((0, .6), (plus(at, -1), .6), (plus(at, 9), 1, 'ease-out-back'))}


def wavy(x, y, w, amp, waves):
    segs, step = [], w / (waves * 2)
    for i in range(waves * 2):
        x0 = x + step * i
        segs.append({'type': 'cubic-bezier', 'control1': {'x': round(x0 + step * .3, 4), 'y': round(y - amp * (1 if i % 2 == 0 else -1), 4)},
                     'control2': {'x': round(x0 + step * .7, 4), 'y': round(y - amp * (1 if i % 2 == 0 else -1), 4)}, 'to': {'x': round(x0 + step, 4), 'y': round(y, 4)}})
    return {'start': {'x': x, 'y': y}, 'segments': segs}


def ink_stroke(eid, path, at, color=BLUE, width=.004):
    return {'id': eid, 'type': 'stroke-reveal', 'path': path, 'progress': track((plus(at, 0), 0), (plus(at, 10), 1)), 'width': width, 'color': color,
            'glow': {'color': color, 'widthScale': 1, 'opacity': 0}, 'headGlow': False}


def bubbles(at):
    return {'id': 'saliva', 'type': 'particles', 'count': 34, 'seed': 77, 'startFrame': plus(at, -2), 'endFrame': plus(at, 45),
            'emitter': {'x': .5, 'y': .52, 'width': .03, 'height': .01}, 'lifetimeFrames': [18, 30],
            'velocity': {'angleDegrees': -90, 'spreadDegrees': 55, 'speed': [.002, .004]}, 'acceleration': {'x': 0, 'y': -.00004},
            'radius': [.004, .009], 'colors': [PALE, BLUE], 'shape': 'circle',
            'opacity': [{'at': 0, 'value': 0}, {'at': .15, 'value': 1}, {'at': .8, 'value': .9}, {'at': 1, 'value': 0}],
            'scale': [{'at': 0, 'value': .5}, {'at': .3, 'value': 1}, {'at': 1, 'value': 1.2}]}


FEET = .86
groups = [
    {'id': 'backdrop', 'width': FW, 'height': FH, 'layers': [
        {'id': 'page', 'kit': {'type': 'sky', 'horizon': .9, 'stars': 0, 'seed': 1}},
        {'id': 'mars-ground', 'kit': {'type': 'terrain', 'top': .82, 'curve': 0, 'fill': '@ground.top', 'detail': '@ground.detail', 'rocks': 4, 'bumps': 6, 'seed': 9},
         'opacity': track((0, 0), (A('The', -5, beat='air'), 0), (A('The', -4, beat='air'), 1), (A('With', -5, beat='boil'), 1), (A('With', -4, beat='boil'), 0),
                          (A('And', -5, beat='cold'), 0), (A('And', -4, beat='cold'), 1))},
    ], 'annotations': [{'id': 'title', 'text': 'MARS', 'x': FW / 2, 'y': 105, 'size': 88, 'anchor': 'middle', 'variant': 'ink', 'color': INK}]},
    {'id': 'g-hook', 'width': W, 'height': H, 'layers': [
        planet('mars', .5, .5, .3, '@ground.top', craters=8, shade=.22, seed=4, anchor={'x': 960, 'y': 540},
               scale=track((0, .5), (12, 1, 'ease-out-back'), (A('spacesuit', -2), 1), (A('spacesuit', 10), .62)),
               x=track((0, 0), (A('spacesuit', -2), 0), (A('spacesuit', 10), -470))),
        figure('you', .7, .8, .6, [(0, 'stand'), (A('spacesuit'), 'wave'), (A('awake'), 'stand'), (A('fifteen'), 'panic')],
               [(0, 'happy'), (A('fifteen'), 'shocked')], seed=3, **pop_in(A('spacesuit', -1)), anchor={'x': 1344, 'y': 842}),
    ], 'annotations': [note('fifteen', '~15 seconds', 1580, 250, A('fifteen'), size=84, to=(1420, 340), frm=(1520, 275))]},
    {'id': 'g-air', 'width': W, 'height': H, 'layers': [
        figure('you', .24, FEET, .6, [(0, 'stand'), (A('carbon'), 'point-right'), (A('thinner', -4), 'scared')], [(0, 'neutral'), (A('carbon'), 'sad'), (A('thinner'), 'scared')], seed=3),
        *[planet(f'co2-{i}', x, .4, r, base, shade=.12, seed=20 + i, **pop_in(A('carbon', i))) for i, (x, r, base) in enumerate([(.56, .045, RED), (.645, .06, INK), (.73, .045, RED)])],
        {'id': 'thin-air', 'effects': [{'id': 'air-dots', 'type': 'particles', 'count': 18, 'seed': 31, 'startFrame': 0, 'endFrame': 160,
            'emitter': {'x': .7, 'y': .55, 'width': .5, 'height': .4}, 'lifetimeFrames': [60, 90], 'velocity': {'angleDegrees': 10, 'spreadDegrees': 30, 'speed': [.0006, .0012]},
            'acceleration': {'x': 0, 'y': 0}, 'radius': [.003, .005], 'colors': ['@smoke.shadow'], 'shape': 'circle',
            'opacity': [{'at': 0, 'value': 0}, {'at': .2, 'value': .7}, {'at': .8, 'value': .7}, {'at': 1, 'value': 0}], 'scale': [{'at': 0, 'value': 1}, {'at': 1, 'value': 1}]}]},
    ], 'annotations': [
        {'id': 'c', 'text': 'C', 'x': 1238, 'y': 457, 'size': 72, 'anchor': 'middle', 'variant': 'ink', 'color': '#ffffff', 'opacity': track((0, 0), (A('carbon', 0), 0), (A('carbon', 2), 1))},
        {'id': 'o1', 'text': 'O', 'x': 1075, 'y': 452, 'size': 56, 'anchor': 'middle', 'variant': 'ink', 'color': '#ffffff', 'opacity': track((0, 0), (A('carbon', -1), 0), (A('carbon', 1), 1))},
        {'id': 'o2', 'text': 'O', 'x': 1402, 'y': 452, 'size': 56, 'anchor': 'middle', 'variant': 'ink', 'color': '#ffffff', 'opacity': track((0, 0), (A('carbon', 1), 0), (A('carbon', 3), 1))},
        note('co2', 'carbon dioxide', 1500, 200, A('carbon', 4), to=(1330, 350), frm=(1430, 225)),
        note('thin', '100x thinner than Earth', 1240, 700, A('thinner'), size=70, color=INK),
    ]},
    {'id': 'g-boil', 'width': W, 'height': H, 'layers': [
        figure('you', .5, 1.48, 1.2, [(0, 'stand'), (A('boil', -2), 'scared')], [(0, 'neutral'), (A('pressure'), 'sad'), (A('boil', -2), 'pain')], seed=3),
        {'id': 'boiling', 'effects': [bubbles(A('boil'))]},
    ], 'annotations': [
        note('pressure', 'pressure < 1% of Earth', 430, 230, A('pressure'), size=70, color=INK),
        note('saliva', 'saliva boils!', 1480, 400, A('boil'), size=88, to=(1060, 560), frm=(1380, 450)),
    ]},
    {'id': 'g-cold', 'width': W, 'height': H, 'layers': [
        figure('you', .38, FEET, .6, [(0, 'stand'), (A('minus'), 'cower')], [(0, 'neutral'), (A('minus'), 'scared')], shiver=0, seed=3, opacity=track((0, 1), (A('minus', 9), 1), (A('minus', 10), 0))),
        figure('you-shiver', .38, FEET, .6, [(0, 'cower')], [(0, 'scared')], shiver=5, seed=3, opacity=track((0, 0), (A('minus', 9), 0), (A('minus', 10), 1))),
        {'id': 'cold-lines', 'effects': [ink_stroke(f'cold-{i}', wavy(x, y, .05, .012, 2), A('sixty', i * 3)) for i, (x, y) in enumerate([(.22, .5), (.49, .46), (.24, .66), (.5, .62)])]},
    ], 'annotations': [
        note('celsius', '-60°C', 1330, 420, A('sixty'), size=100),
        note('fahrenheit', '(-80°F)', 1330, 525, A('Celsius'), size=64),
    ]},
    {'id': 'g-closing', 'width': W, 'height': H, 'layers': [
        figure('you', .3, FEET, .6, [(0, 'stand'), (A('pass', -2), 'tumble'), (A('out', 2), 'lie')], [(0, 'scared'), (A('pass', -2), 'dizzy')], seed=3, anchor={'x': 576, 'y': 900},
               y=track((0, 0), (A('pass', -2), 0), (A('out', 8), 290, 'ease-in-back'))),
        figure('astronaut', .7, FEET, .62, [(0, 'stand'), (A('suit'), 'point-left')], [(0, 'happy'), (A('suit'), 'smug')], outfit='astronaut', seed=8,
               **pop_in(A('Mars', -2, beat='closing')), anchor={'x': 1344, 'y': 900}),
    ], 'annotations': [note('suit', 'keep it on!', 1600, 250, A('suit', 3), size=84, to=(1450, 380), frm=(1560, 280))]},
]


def scene(sid, gid, cue, nominal, sounds, cam=None):
    return {'id': sid, 'template': 'hero-reveal', 'durationFrames': nominal, 'animationDurationFrames': nominal,
            'caption': {'text': sid, 'preset': 'body'},
            'camera': {'preset': 'static', 'boundaryMode': 'backdrop', **({'keyframes': cam} if cam else {})},
            'motion': {'preset': 'still'}, 'seed': 6000 + len(sid), 'transitionFrames': 0, 'environmentDim': 0,
            'config': {'primary': {'asset': gid, 'x': .5, 'y': .5, 'size': .9}},
            'narrationCue': {'beatId': cue, 'phraseIndex': 0, 'edge': 'start'},
            'sounds': [{'sound': s, 'frame': f, 'gainDb': g} for s, f, g in sounds]}


kf = lambda f, z, y=.5: {'frame': f, 'focus': {'x': .5, 'y': y}, 'zoom': z, 'easing': 'smoothstep'}
scenes = [
    scene('mars-hook', 'g-hook', 'hook', NOMINAL[0], [('pop', 2, -16), ('whoosh', A('spacesuit', -4), -18), ('pop', A('spacesuit'), -16), ('pop', A('fifteen'), -14)], [kf(0, 1.06), kf(A('spacesuit', -2), 1.0)]),
    scene('mars-air', 'g-air', 'air', NOMINAL[1], [('whoosh', 0, -18), ('pop', A('carbon'), -17), ('pop', A('carbon', 4), -17), ('pop', A('thinner'), -16)]),
    scene('mars-boil', 'g-boil', 'boil', NOMINAL[2], [('whoosh', 0, -18), ('pop', A('pressure'), -17), ('bubble', A('boil', -2), -12), ('pop', A('boil'), -16)]),
    scene('mars-cold', 'g-cold', 'cold', NOMINAL[3], [('whoosh', 0, -18), ('pop', A('sixty'), -15), ('pop', A('Celsius'), -17)]),
    scene('mars-closing', 'g-closing', 'closing', NOMINAL[4], [('whoosh', 0, -18), ('boom', A('out', 6), -12), ('pop', A('Mars', -2, beat='closing'), -16), ('pop', A('suit', 3), -15)]),
]
board = {
    'schemaVersion': '2.1', 'projectId': 'mars-paint-test', 'title': 'What Would Happen on Mars Without a Suit', 'themeId': 'paint-notebook',
    'format': {'width': 1920, 'height': 1080, 'fps': 30}, 'styleId': 'cinematic-illustrated', 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'backdrop': {'group': 'backdrop'},
    'narrationTiming': {'minimumSceneFrames': 45, 'maximumDeviationSeconds': .2},
    'audio': {'music': 'generated-pad', 'musicGainDb': -24, 'duckRatio': 8, 'targetLufs': -14},
    'groups': groups, 'scenes': scenes,
}
assert sum(NOMINAL) == 29 * 30, sum(NOMINAL)
(ROOT / 'storyboards/mars-paint-test.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
print('wrote mars-paint-test', sum(NOMINAL), 'frames')
