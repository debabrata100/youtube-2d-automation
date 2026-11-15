"""Generate storyboards/titan-pilot.json - M3.3 hand-drawn pilot (16:9, paint-notebook theme, ~80 s).

Only reusable kit parts: figure (poses, faces, accessories), planet, terrain, water, props, ink notes and
particles. Story moments are word anchors, so the real narration take lines up without retiming.
Usage: python3 scripts/authoring/build-titan-pilot-storyboard.py [duration_seconds]
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
story = json.loads((ROOT / 'stories/titan-pilot.json').read_text())
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else story['durationSeconds']
FPS, W, H = 30, 1920, 1080
FEET = .86
INK, RED, BLUE, PALE = '@text.fill', '@text.accent', '@water.mid', '@water.light'
TITAN, TITAN_DETAIL, SATURN = '#e8a54b', '#f3c98a', '#e3c58d'
METHANE = '#d08a2e'


def A(word, offset=0, n=1, edge=None, beat=None):
    a = {'at': word}
    if n != 1: a['n'] = n
    if edge: a['edge'] = edge
    if offset: a['offset'] = offset
    if beat: a['beat'] = beat
    return a


def plus(t, k):
    if isinstance(t, dict):
        o = dict(t); total = o.pop('offset', 0) + k
        if total: o['offset'] = total
        return o
    return t + k


def track(*pairs):
    out = []
    for p in pairs:
        k = {'frame': p[0], 'value': p[1]}
        if len(p) > 2: k['ease'] = p[2]
        out.append(k)
    return out


def show_from(at):
    return track((0, 0), (plus(at, -1), 0), (at, 1))


def show_until(at):
    return track((0, 1), (plus(at, -1), 1), (at, 0))


def pop_in(at, anchor=None):
    d = {'opacity': show_from(at), 'scale': track((0, .6), (plus(at, -1), .6), (plus(at, 9), 1, 'ease-out-back'))}
    if anchor: d['anchor'] = {'x': anchor[0], 'y': anchor[1]}
    return d


def figure(fid, fx, fy, h, poses, faces, accessories=(), outfit='stick', shiver=0, seed=3, **layer):
    kit = {'type': 'figure', 'x': fx, 'y': fy, 'height': h, 'outfit': outfit, 'shiver': shiver, 'seed': seed,
           'poses': [{'frame': f, 'pose': p} for f, p in poses], 'faces': [{'frame': f, 'face': c} for f, c in faces]}
    if accessories:
        kit['accessories'] = [dict(item=i, **({'from': f} if f != 0 else {})) for i, f in accessories]
    return {'id': fid, 'kit': kit, **layer}


def planet(pid, px, py, r, base, bands=(), craters=0, ring=False, shade=.2, seed=1, **layer):
    return {'id': pid, 'kit': {'type': 'planet', 'x': px, 'y': py, 'radius': r, 'base': base, 'bands': list(bands), 'craters': craters, 'ring': ring, 'shade': shade, 'seed': seed}, **layer}


def prop(pid, item, px, py, size, **extra):
    layer = {k: extra.pop(k) for k in list(extra) if k in ('opacity', 'scale', 'anchor', 'x', 'y')}
    return {'id': pid, 'kit': {'type': 'prop', 'item': item, 'x': px, 'y': py, 'size': size, **extra}, **layer}


def note(nid, text, x, y, at, size=72, color=RED, to=None, frm=None):
    a = {'id': nid, 'text': text, 'x': x, 'y': y, 'size': size, 'anchor': 'middle', 'variant': 'ink', 'color': color, 'pop': True,
         'opacity': track((0, 0), (plus(at, -1), 0), (plus(at, 5), 1))}
    if to: a['connector'] = {'from': {'x': frm[0], 'y': frm[1]}, 'to': {'x': to[0], 'y': to[1]}}
    return a


def rain(eid, x, width, speed, start, end, color, count=26, seed=5, outline=True):
    e = {'id': eid, 'type': 'particles', 'count': count, 'seed': seed, 'startFrame': start, 'endFrame': end,
         'emitter': {'x': x, 'y': .02, 'width': width, 'height': .02}, 'lifetimeFrames': [int(.9 / speed) if speed < .02 else 45, int(1.0 / speed) if speed < .02 else 50],
         'velocity': {'angleDegrees': 90, 'spreadDegrees': 2, 'speed': [speed * .9, speed * 1.1]}, 'acceleration': {'x': 0, 'y': 0},
         'radius': [.009, .013], 'colors': [color], 'shape': 'drop',
         'opacity': [{'at': 0, 'value': 1}, {'at': .9, 'value': 1}, {'at': 1, 'value': 0}], 'scale': [{'at': 0, 'value': 1}, {'at': 1, 'value': 1}]}
    if outline: e['outline'] = '#1d1d1f'
    return e


def bubbles(eid, x, y, at, count=24):
    return {'id': eid, 'type': 'particles', 'count': count, 'seed': 41, 'startFrame': plus(at, 0), 'endFrame': plus(at, 50),
            'emitter': {'x': x, 'y': y, 'width': .04, 'height': .01}, 'lifetimeFrames': [16, 26],
            'velocity': {'angleDegrees': -90, 'spreadDegrees': 40, 'speed': [.002, .004]}, 'acceleration': {'x': 0, 'y': 0},
            'radius': [.005, .01], 'colors': [PALE], 'outline': '#1d1d1f', 'shape': 'circle',
            'opacity': [{'at': 0, 'value': 0}, {'at': .15, 'value': 1}, {'at': 1, 'value': 0}], 'scale': [{'at': 0, 'value': .5}, {'at': 1, 'value': 1.2}]}


def molecule(prefix, cx, cy, r, color, at, n=2):
    return [planet(f'{prefix}-{i}', cx + (i - (n - 1) / 2) * r * 1.5 * H / W * 1.6, cy, r, color, shade=.12, seed=60 + i, **pop_in(plus(at, i))) for i in range(n)]


GX = lambda f: f * W   # group fraction -> group units
GY = lambda f: f * H

groups = [
    {'id': 'backdrop', 'width': W, 'height': H, 'layers': [
        {'id': 'page', 'kit': {'type': 'sky', 'horizon': .9, 'stars': 0, 'seed': 1}},
        {'id': 'titan-ground', 'kit': {'type': 'terrain', 'top': .82, 'curve': 0, 'fill': TITAN, 'detail': TITAN_DETAIL, 'rocks': 3, 'bumps': 5, 'seed': 12},
         'opacity': track((0, 0), (A('On', -5, beat='pressure'), 0), (A('On', -4, beat='pressure'), 1))},
    ], 'annotations': [{'id': 'title', 'text': 'TITAN', 'x': W / 2, 'y': 105, 'size': 88, 'anchor': 'middle', 'variant': 'ink', 'color': INK}]},

    # 1 hook ------------------------------------------------------------------
    {'id': 'g-hook', 'width': W, 'height': H, 'layers': [
        figure('you', .3, .82, .6, [(0, 'stand'), (A('outside'), 'wave'), (A('Titan', -2), 'point-right')],
               [(0, 'neutral'), (A('without'), 'shocked'), (A('Titan'), 'grin')], **pop_in(A('step', -2), (GX(.3), GY(.82)))),
        planet('saturn', .86, .26, .09, SATURN, bands=['#c9a66b', '#f0dcae', '#d9b77c'], ring=True, seed=7, **pop_in(A("Saturn's", -2), (GX(.86), GY(.26)))),
        planet('titan', .64, .6, .15, TITAN, bands=['#f0b960', '#dc9840'], shade=.25, seed=8, **pop_in(A('Titan', -3), (GX(.64), GY(.6)))),
    ], 'annotations': [
        note('nosuit', 'no spacesuit?!', 1000, 250, A('without'), size=80, to=(700, 360), frm=(860, 270)),
        note('titan-label', 'Titan', 1230, 900, A('Titan', 4), size=70, color=INK),
        note('saturn-label', "Saturn", 1650, 430, A("Saturn's", 3), size=50, color=INK),
    ]},

    # 2 pressure --------------------------------------------------------------
    {'id': 'g-pressure', 'width': W, 'height': H, 'layers': [
        figure('astro', .2, FEET, .55, [(0, 'stand'), (A('suit'), 'point-right')], [(0, 'neutral')], outfit='astronaut', seed=8,
               ),
        figure('you', .52, FEET, .6, [(0, 'stand'), (A('presses'), 'scared'), (A('safe', -3), 'cheer')],
               [(0, 'happy'), (A('presses'), 'pain'), (A('Heavy'), 'neutral'), (A('safe'), 'grin')], **pop_in(A('But', 2), (GX(.52), GY(FEET)))),
        prop('squeeze', 'pressure-arrows', .52, .58, .52, count=8, opacity=track((0, 0), (A('presses', -1), 0), (A('presses'), 1), (A('safe', -2), 1), (A('safe', 3), 0))),
        prop('ok', 'check', .82, .5, .16, **pop_in(A('safe', 1), (GX(.82), GY(.5)))),
    ], 'annotations': [
        note('moon-mars', 'Moon / Mars', 384, 190, A('Moon'), size=62, color=INK),
        note('suit-needed', 'pressure suit', 384, 265, A('suit', -6), size=54),
        note('times', '1.5x Earth', 1450, 330, A('one', 0, beat='pressure'), size=90),
    ]},

    # 3 oxygen ----------------------------------------------------------------
    {'id': 'g-oxygen', 'width': W, 'height': H, 'layers': [
        figure('you', .3, FEET, .6, [(0, 'stand'), (A('catch'), 'shrug'), (A('oxygen'), 'scared'), (A('mask'), 'hands-on-hips')],
               [(0, 'happy'), (A('catch'), 'shocked'), (A('oxygen'), 'scream'), (A('mask', 2), 'smug')], accessories=[('mask', A('mask'))]),
        prop('bang', 'exclaim', .3, .2, .16, **pop_in(A('catch'), (GX(.3), GY(.2)))),
        *molecule('n2a', .6, .42, .035, BLUE, A('nitrogen')),
        *molecule('n2b', .74, .55, .035, BLUE, A('nitrogen', 4)),
        *molecule('n2c', .66, .68, .035, BLUE, A('nitrogen', 8)),
        prop('no-o2', 'cross', .84, .3, .12, **pop_in(A('oxygen', 2), (GX(.84), GY(.3)))),
    ], 'annotations': [
        note('n2', 'nitrogen', 1300, 240, A('nitrogen', 4), size=70, color=INK, to=(1180, 410), frm=(1260, 265)),
        note('o2', 'oxygen: 0%', 1560, 450, A('oxygen'), size=72),
        note('mask-label', 'mask', 820, 470, A('mask', 2), size=64, to=(640, 520), frm=(760, 480)),
    ]},

    # 4 cold ------------------------------------------------------------------
    {'id': 'g-cold', 'width': W, 'height': H, 'layers': [
        figure('you-cold', .32, FEET, .6, [(0, 'stand'), (A('minus'), 'cower')], [(0, 'neutral'), (A('minus'), 'scared')], accessories=[('mask', 0)], shiver=5,
               opacity=show_until(A('coat'))),
        figure('you-warm', .32, FEET, .6, [(0, 'cheer')], [(0, 'grin')], accessories=[('mask', 0), ('coat', 0)], opacity=show_from(A('coat'))),
        prop('thermo', 'thermometer', .72, .5, .5, level=[{'frame': 0, 'value': .6}, {'frame': A('minus'), 'value': .6}, {'frame': A('Celsius'), 'value': .04}]),
    ], 'annotations': [
        note('c', '-179°C', 1150, 330, A('seventy-nine'), size=100),
        note('f', '(-290°F)', 1150, 430, A('Celsius'), size=60),
        note('coat-label', 'warmest coat ever', 1000, 700, A('warmest'), size=58, color=INK),
    ]},

    # 5 fly -------------------------------------------------------------------
    {'id': 'g-fly', 'width': W, 'height': H, 'layers': [
        figure('you', .45, FEET, .6, [(0, 'stand'), (A('fun'), 'cheer'), (A('fourteen'), 'stand'), (A('wings', 2), 'hands-on-hips'), (A('flap', -2), 'flap')],
               [(0, 'happy'), (A('fun'), 'grin'), (A('fourteen'), 'neutral'), (A('wings'), 'smug'), (A('flap'), 'grin')],
               accessories=[('mask', 0), ('coat', 0), ('wings', A('wings'))], anchor={'x': GX(.45), 'y': GY(FEET)},
               y=track((0, 0), (A('flap', -2), 0), (A('fly', 20), -170, 'ease-out-cubic')), x=track((0, 0), (A('flap', -2), 0), (A('fly', 20), 200))),
        prop('whoosh', 'motion-lines', .38, .55, .18, opacity=track((0, 0), (A('flap'), 0), (A('flap', 4), 1)),
             y=track((0, 0), (A('flap', -2), 0), (A('fly', 20), -170, 'ease-out-cubic')), x=track((0, 0), (A('flap', -2), 0), (A('fly', 20), 200))),
    ], 'annotations': [
        note('g', '14% gravity', 1450, 330, A('fourteen'), size=84),
        note('thick', 'thick air', 1450, 430, A('thick'), size=60, color=INK),
        note('wheee', 'WHEEE!', 1450, 620, A('fly', 4), size=96),
    ]},

    # 6 rain ------------------------------------------------------------------
    {'id': 'g-rain', 'width': W, 'height': H, 'layers': [
        {'id': 'titan-rain', 'effects': [rain('methane', .66, .5, .0028, 0, 400, METHANE, count=60, seed=9)]},
        {'id': 'earth-rain', 'effects': [rain('water', .16, .22, .022, A('five'), plus(A('five'), 200), BLUE, count=90, seed=10)]},
        figure('you', .66, FEET, .6, [(0, 'stand'), (A('strange'), 'shrug'), (A('methane'), 'reach')], [(0, 'neutral'), (A('strange'), 'shocked'), (A('slower'), 'happy')],
               accessories=[('mask', 0), ('coat', 0)]),
    ], 'annotations': [
        note('methane', 'liquid methane', 1650, 260, A('methane'), size=70, to=(1520, 380), frm=(1600, 285)),
        note('slow', '5x slower', 600, 560, A('five'), size=84),
        note('earth', 'Earth rain', 310, 300, A('Earth', -6, beat='rain'), size=56, color=INK),
    ]},

    # 7 lakes -----------------------------------------------------------------
    {'id': 'g-lakes', 'width': W, 'height': H, 'layers': [
        figure('you', .22, FEET, .6, [(0, 'stand'), (A('swimming', -2), 'cheer'), (A('sink', -2), 'panic')],
               [(0, 'happy'), (A('swimming'), 'grin'), (A('light'), 'shocked'), (A('sink'), 'scream')], accessories=[('mask', 0), ('coat', 0)],
               anchor={'x': GX(.22), 'y': GY(FEET)},
               x=track((0, 0), (A('swimming', 2), 0), (A('swimming', 18), 820, 'ease-out-cubic')),
               y=track((0, 0), (A('swimming', 2), 0), (A('swimming', 10), -140, 'ease-out-cubic'), (A('swimming', 18), 30), (A('sink'), 60), (A('bottom', 6), 820, 'ease-in-back'))),
        {'id': 'lake', 'kit': {'type': 'water', 'x': .48, 'y': .84, 'width': .62, 'height': .3, 'waves': 2, 'periodFrames': 150, 'seed': 3}, **pop_in(A('lakes', -2), (GX(.79), GY(.9)))},
        {'id': 'glug', 'effects': [bubbles('glug-bubbles', .64, .85, A('sink', 4))]},
    ], 'annotations': [
        note('big', 'bigger than any Great Lake', 1420, 250, A('bigger'), size=62),
        note('dont', "don't!", 660, 470, A('swimming', 4), size=84),
        note('sink', 'you sink!', 1520, 560, A('sink', 2), size=84),
    ]},

    # 8 closing ---------------------------------------------------------------
    {'id': 'g-closing', 'width': W, 'height': H, 'layers': [
        planet('titan-small', .12, .25, .08, TITAN, bands=['#f0b960'], shade=.25, seed=8),
        figure('you', .4, FEET, .62, [(0, 'stand'), (A('needed'), 'hands-on-hips'), (A('wings'), 'flap')],
               [(0, 'happy'), (A('needed'), 'smug'), (A('wings'), 'grin')],
               accessories=[('mask', A('mask')), ('coat', A('coat')), ('wings', A('wings'))], anchor={'x': GX(.4), 'y': GY(FEET)},
               y=track((0, 0), (A('wings', 2), 0), (A('wings', 40), -120, 'ease-out-cubic'))),
        *[prop(f'tick-{i}', 'check', .66, .38 + i * .14, .07, **pop_in(A(w, 1), (GX(.66), GY(.38 + i * .14)))) for i, w in enumerate(['mask', 'coat', 'wings'])],
    ], 'annotations': [
        note('nosuit2', 'no spacesuit!', 1280, 230, A('No', 0, beat='closing'), size=72, color=INK),
        *[note(f'item-{i}', w, 1420, int(GY(.38 + i * .14)) + 22, A(w, 1), size=72, color=INK) for i, w in enumerate(['mask', 'coat', 'wings'])],
    ]},
]

counts = [len(b['narration'].split()) for b in story['beats']]
total = DURATION * FPS
raw = [max(60, total * c / sum(counts)) for c in counts]
scale = total / sum(raw)
NOMINAL = [int(r * scale) for r in raw]
NOMINAL[-1] += total - sum(NOMINAL)


def scene(sid, gid, cue, nominal, sounds, cam=None):
    return {'id': sid, 'template': 'hero-reveal', 'durationFrames': nominal, 'animationDurationFrames': nominal,
            'caption': {'text': sid, 'preset': 'body'},
            'camera': {'preset': 'static', 'boundaryMode': 'backdrop', **({'keyframes': cam} if cam else {})},
            'motion': {'preset': 'still'}, 'seed': 7000 + len(sid), 'transitionFrames': 0, 'environmentDim': 0,
            'config': {'primary': {'asset': gid, 'x': .5, 'y': .5, 'size': .9}},
            'narrationCue': {'beatId': cue, 'phraseIndex': 0, 'edge': 'start'},
            'sounds': [{'sound': s, 'frame': f, 'gainDb': g} for s, f, g in sounds]}


kf = lambda f, z: {'frame': f, 'focus': {'x': .5, 'y': .5}, 'zoom': z, 'easing': 'smoothstep'}
P, WH = 'pop', 'whoosh'
sounds = {
    'hook': [(P, A('step', -2), -16), (P, A('without'), -14), (WH, A('Titan', -4), -18), (P, A('Titan'), -15), (P, A("Saturn's"), -17)],
    'pressure': [(WH, 0, -18), (P, A('Moon'), -17), (P, A('But', 2), -17), ('boom', A('presses'), -16), (P, A('one', 0, beat='pressure'), -15), (P, A('safe', 1), -15)],
    'oxygen': [(WH, 0, -18), (P, A('catch'), -14), ('bubble', A('nitrogen'), -18), (P, A('oxygen'), -15), (P, A('mask'), -15)],
    'cold': [(WH, 0, -18), ('rumble', A('minus'), -20), (P, A('seventy-nine'), -14), (P, A('Celsius'), -17), (WH, A('coat', -2), -16), (P, A('coat'), -15)],
    'fly': [(WH, 0, -18), (P, A('fourteen'), -15), (P, A('wings'), -15), ('riser', A('flap', -6), -18), (WH, A('flap'), -14), (P, A('fly', 4), -13)],
    'rain': [(WH, 0, -18), (P, A('methane'), -16), (P, A('five'), -14)],
    'lakes': [(WH, 0, -18), (P, A('bigger'), -15), (WH, A('swimming', 2), -16), ('bubble', A('sink', 2), -12), (P, A('sink', 2), -15)],
    'closing': [(WH, 0, -18), (P, A('No', 0, beat='closing'), -16), (P, A('mask', 1), -15), (P, A('coat', 1), -15), (P, A('wings', 1), -14), ('riser', A('wings', 2), -20)],
}
cams = {'hook': [kf(0, 1.04), kf(A('Titan', -2), 1.0)]}
scenes = [scene(b['sceneId'], f"g-{b['id']}", b['id'], NOMINAL[i], sounds[b['id']], cams.get(b['id'])) for i, b in enumerate(story['beats'])]
board = {
    'schemaVersion': '2.1', 'projectId': 'titan-pilot', 'title': story['title'], 'themeId': 'paint-notebook',
    'format': {'width': W, 'height': H, 'fps': FPS}, 'styleId': 'cinematic-illustrated', 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'backdrop': {'group': 'backdrop'},
    'narrationTiming': {'minimumSceneFrames': 45, 'maximumDeviationSeconds': .2},
    'audio': {'music': 'generated-pad', 'musicGainDb': -24, 'duckRatio': 8, 'targetLufs': -14},
    'groups': groups, 'scenes': scenes,
}
(ROOT / 'storyboards/titan-pilot.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
if DURATION != story['durationSeconds']:
    story['durationSeconds'] = DURATION
    (ROOT / 'stories/titan-pilot.json').write_text(json.dumps(story, indent=2, ensure_ascii=False) + '\n')
print('wrote titan-pilot', sum(NOMINAL), 'frames', NOMINAL)
