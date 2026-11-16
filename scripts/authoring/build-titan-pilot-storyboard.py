"""Generate storyboards/titan-pilot.json - M3.3 hand-drawn pilot (16:9, paint-notebook theme, ~80 s).

Only reusable kit parts: figure (poses, faces, accessories), planet, terrain, water, props, ink notes and
particles. Story moments are word anchors, so the real narration take lines up without retiming.
Usage: python3 scripts/authoring/build-titan-pilot-storyboard.py [duration_seconds]
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from paintkit import *  # noqa: F401,F403 - shared builders

ROOT = pathlib.Path(__file__).resolve().parents[2]
story = json.loads((ROOT / 'stories/titan-pilot.json').read_text())
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else story['durationSeconds']
FPS, W, H = 30, 1920, 1080
FEET = .86
TITAN, TITAN_DETAIL, SATURN = '#e8a54b', '#f3c98a', '#e3c58d'
METHANE = '#d08a2e'


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
        *molecule('n2a', .6, .42, .035, BLUE, A('nitrogen'), aspect=min(W, H) / W),
        *molecule('n2b', .74, .55, .035, BLUE, A('nitrogen', 4), aspect=min(W, H) / W),
        *molecule('n2c', .66, .68, .035, BLUE, A('nitrogen', 8), aspect=min(W, H) / W),
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
        figure('you', .42, FEET, .56, [(0, 'stand'), (A('fun'), 'cheer'), (A('fourteen'), 'stand'), (A('wings', 2), 'hands-on-hips'), (A('flap', -2), 'flap')],
               [(0, 'happy'), (A('fun'), 'grin'), (A('fourteen'), 'neutral'), (A('wings'), 'smug'), (A('flap'), 'grin')],
               accessories=[('mask', 0), ('coat', 0), ('wings', A('wings'))], anchor={'x': GX(.42), 'y': GY(FEET)},
               y=track((0, 0), (A('flap', -2), 0), (A('fly', 20), -90, 'ease-out-cubic')), x=track((0, 0), (A('flap', -2), 0), (A('fly', 20), 150))),
        prop('whoosh', 'motion-lines', .35, .56, .18, opacity=track((0, 0), (A('flap'), 0), (A('flap', 4), 1)),
             y=track((0, 0), (A('flap', -2), 0), (A('fly', 20), -90, 'ease-out-cubic')), x=track((0, 0), (A('flap', -2), 0), (A('fly', 20), 150))),
    ], 'annotations': [
        note('g', '14% gravity', 1580, 330, A('fourteen'), size=84),
        note('thick', 'thick air', 1580, 430, A('thick'), size=60, color=INK),
        note('wheee', 'WHEEE!', 1580, 620, A('fly', 4), size=96),
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


P, WH = 'pop', 'whoosh'
sounds = {
    'hook': [(P, A('step', -2), -21), (P, A('without'), -21), (WH, A('Titan', -4), -24), (P, A('Titan'), -21), (P, A("Saturn's"), -21)],
    'pressure': [(WH, 0, -24), (P, A('Moon'), -21), (P, A('But', 2), -21), ('boom', A('presses'), -20), (P, A('one', 0, beat='pressure'), -21), (P, A('safe', 1), -21)],
    'oxygen': [(WH, 0, -24), (P, A('catch'), -21), ('bubble', A('nitrogen'), -24), (P, A('oxygen'), -21), (P, A('mask'), -21)],
    'cold': [(WH, 0, -24), ('rumble', A('minus'), -24), (P, A('seventy-nine'), -21), (P, A('Celsius'), -21), (WH, A('coat', -2), -24), (P, A('coat'), -21)],
    'fly': [(WH, 0, -24), (P, A('fourteen'), -21), (P, A('wings'), -21), ('riser', A('flap', -6), -26), (P, A('fly', 4), -21)],
    'rain': [(WH, 0, -24), (P, A('methane'), -21), (P, A('five'), -21)],
    'lakes': [(WH, 0, -24), (P, A('bigger'), -21), (WH, A('swimming', 2), -24), ('bubble', A('sink', 2), -20), (P, A('sink', 2), -21)],
    'closing': [(WH, 0, -24), (P, A('No', 0, beat='closing'), -21), (P, A('mask', 1), -21), (P, A('coat', 1), -21), (P, A('wings', 1), -21), ('riser', A('wings', 2), -26)],
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
if __name__ == '__main__':
    (ROOT / 'storyboards/titan-pilot.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    if DURATION != story['durationSeconds']:
        story['durationSeconds'] = DURATION
        (ROOT / 'stories/titan-pilot.json').write_text(json.dumps(story, indent=2, ensure_ascii=False) + '\n')
    print('wrote titan-pilot', sum(NOMINAL), 'frames', NOMINAL)
