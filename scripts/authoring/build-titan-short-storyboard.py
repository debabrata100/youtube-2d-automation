"""Generate storyboards/titan-short.json - the Titan pilot re-laid out for YouTube Shorts (9:16).

Same story, approved narration, word anchors and sound cues as the 16:9 pilot; only the layout changes.
Shorts safe zones (1080x1920): YouTube draws its own UI over the top ~7%, the bottom ~22% (title,
channel, music) and a button column on the right (x > ~900) from about 50% height down. Story content
stays in x 60-900, y 440-1460; captions sit in a band under the title, above the action.
Usage: python3 scripts/authoring/build-titan-short-storyboard.py [duration_seconds]
"""
import importlib.util, json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from paintkit import *  # noqa: F401,F403 - shared builders

spec = importlib.util.spec_from_file_location('titan_pilot', HERE / 'build-titan-pilot-storyboard.py')
pilot = importlib.util.module_from_spec(spec); spec.loader.exec_module(pilot)  # story, sounds and beat lengths
ROOT, story, DURATION = pilot.ROOT, pilot.story, pilot.DURATION
TITAN, TITAN_DETAIL, SATURN, METHANE = pilot.TITAN, pilot.TITAN_DETAIL, pilot.SATURN, pilot.METHANE

FPS, W, H = 30, 1080, 1920
FEET, FIG = .76, .33         # ground line and figure height (fractions of H)
GX = lambda f: f * W
GY = lambda f: f * H
SQ = min(W, H) / W           # molecule spacing factor

groups = [
    {'id': 'backdrop', 'width': W, 'height': H, 'layers': [
        {'id': 'page', 'kit': {'type': 'sky', 'horizon': .9, 'stars': 0, 'seed': 1}},
        {'id': 'titan-ground', 'kit': {'type': 'terrain', 'top': .73, 'curve': 0, 'fill': TITAN, 'detail': TITAN_DETAIL, 'rocks': 2, 'bumps': 3, 'seed': 12},
         'opacity': track((0, 0), (A('On', -5, beat='pressure'), 0), (A('On', -4, beat='pressure'), 1))},
    ], 'annotations': [{'id': 'title', 'text': 'TITAN', 'x': W / 2, 'y': 215, 'size': 74, 'anchor': 'middle', 'variant': 'ink', 'color': INK}]},

    # 1 hook ------------------------------------------------------------------
    {'id': 'g-hook', 'width': W, 'height': H, 'layers': [
        figure('you', .26, FEET, FIG, [(0, 'stand'), (A('outside'), 'wave'), (A('Titan', -2), 'point-right')],
               [(0, 'neutral'), (A('without'), 'shocked'), (A('Titan'), 'grin')]),  # on screen from frame 0: no empty opening on Shorts
        planet('saturn', .8, .29, .07, SATURN, bands=['#c9a66b', '#f0dcae', '#d9b77c'], ring=True, seed=7, **pop_in(A("Saturn's", -2), (GX(.8), GY(.29)))),
        planet('titan', .64, .47, .14, TITAN, bands=['#f0b960', '#dc9840'], shade=.25, seed=8, **pop_in(A('Titan', -3), (GX(.64), GY(.47)))),
    ], 'annotations': [
        note('nosuit', 'no spacesuit?!', 300, 560, A('without'), size=74, to=(285, 800), frm=(300, 595)),
        note('titan-label', 'Titan', 691, 1125, A('Titan', 4), size=66, color=INK),
        note('saturn-label', 'Saturn', 864, 690, A("Saturn's", 3), size=46, color=INK),
    ]},

    # 2 pressure --------------------------------------------------------------
    {'id': 'g-pressure', 'width': W, 'height': H, 'layers': [
        figure('astro', .2, FEET, FIG * .92, [(0, 'stand'), (A('suit'), 'point-right')], [(0, 'neutral')], outfit='astronaut', seed=8),
        figure('you', .56, FEET, FIG, [(0, 'stand'), (A('presses'), 'scared'), (A('safe', -3), 'cheer')],
               [(0, 'happy'), (A('presses'), 'pain'), (A('Heavy'), 'neutral'), (A('safe'), 'grin')], **pop_in(A('But', 2), (GX(.56), GY(FEET)))),
        prop('squeeze', 'pressure-arrows', .56, .61, .5, count=8, opacity=track((0, 0), (A('presses', -1), 0), (A('presses'), 1), (A('safe', -2), 1), (A('safe', 3), 0))),
        prop('ok', 'check', .82, .44, .14, **pop_in(A('safe', 1), (GX(.82), GY(.44)))),
    ], 'annotations': [
        note('moon-mars', 'Moon / Mars', 220, 560, A('Moon'), size=56, color=INK),
        note('suit-needed', 'pressure suit', 220, 632, A('suit', -6), size=50),
        note('times', '1.5x Earth', 700, 560, A('one', 0, beat='pressure'), size=84),
    ]},

    # 3 oxygen ----------------------------------------------------------------
    {'id': 'g-oxygen', 'width': W, 'height': H, 'layers': [
        figure('you', .26, FEET, FIG, [(0, 'stand'), (A('catch'), 'shrug'), (A('oxygen'), 'scared'), (A('mask'), 'hands-on-hips')],
               [(0, 'happy'), (A('catch'), 'shocked'), (A('oxygen'), 'scream'), (A('mask', 2), 'smug')], accessories=[('mask', A('mask'))]),
        prop('bang', 'exclaim', .26, .37, .13, **pop_in(A('catch'), (GX(.26), GY(.37)))),
        *molecule('n2a', .6, .37, .035, BLUE, A('nitrogen'), aspect=SQ),
        *molecule('n2b', .76, .47, .035, BLUE, A('nitrogen', 4), aspect=SQ),
        *molecule('n2c', .62, .57, .035, BLUE, A('nitrogen', 8), aspect=SQ),
        prop('no-o2', 'cross', .87, .25, .09, **pop_in(A('oxygen', 2), (GX(.87), GY(.25)))),
    ], 'annotations': [
        note('o2', 'oxygen: 0%', 600, 505, A('oxygen'), size=70),
        note('n2', 'nitrogen', 700, 1215, A('nitrogen', 4), size=64, color=INK),
        note('mask-label', 'mask', 560, 965, A('mask', 2), size=60, to=(335, 925), frm=(490, 960)),
    ]},

    # 4 cold ------------------------------------------------------------------
    {'id': 'g-cold', 'width': W, 'height': H, 'layers': [
        figure('you-cold', .3, FEET, FIG, [(0, 'stand'), (A('minus'), 'cower')], [(0, 'neutral'), (A('minus'), 'scared')], accessories=[('mask', 0)], shiver=5,
               opacity=show_until(A('coat'))),
        figure('you-warm', .3, FEET, FIG, [(0, 'cheer')], [(0, 'grin')], accessories=[('mask', 0), ('coat', 0)], opacity=show_from(A('coat'))),
        prop('thermo', 'thermometer', .74, .53, .42, level=[{'frame': 0, 'value': .6}, {'frame': A('minus'), 'value': .6}, {'frame': A('Celsius'), 'value': .04}]),
    ], 'annotations': [
        note('c', '-179°C', 540, 565, A('seventy-nine'), size=100),
        note('f', '(-290°F)', 540, 655, A('Celsius'), size=60),
        note('coat-label', 'warmest coat ever', 330, 765, A('warmest'), size=54, color=INK),
    ]},

    # 5 fly -------------------------------------------------------------------
    {'id': 'g-fly', 'width': W, 'height': H, 'layers': [
        figure('you', .3, FEET, FIG * .94, [(0, 'stand'), (A('fun'), 'cheer'), (A('fourteen'), 'stand'), (A('wings', 2), 'hands-on-hips'), (A('flap', -2), 'flap')],
               [(0, 'happy'), (A('fun'), 'grin'), (A('fourteen'), 'neutral'), (A('wings'), 'smug'), (A('flap'), 'grin')],
               accessories=[('mask', 0), ('coat', 0), ('wings', A('wings'))], anchor={'x': GX(.3), 'y': GY(FEET)},
               y=track((0, 0), (A('flap', -2), 0), (A('fly', 20), -240, 'ease-out-cubic')), x=track((0, 0), (A('flap', -2), 0), (A('fly', 20), 400))),
        prop('whoosh', 'motion-lines', .22, .62, .18, opacity=track((0, 0), (A('flap'), 0), (A('flap', 4), 1)),
             y=track((0, 0), (A('flap', -2), 0), (A('fly', 20), -240, 'ease-out-cubic')), x=track((0, 0), (A('flap', -2), 0), (A('fly', 20), 400))),
    ], 'annotations': [
        note('g', '14% gravity', 330, 525, A('fourteen'), size=80),
        note('thick', 'thick air', 330, 610, A('thick'), size=58, color=INK),
        note('wheee', 'WHEEE!', 300, 1250, A('fly', 4), size=92),
    ]},

    # 6 rain ------------------------------------------------------------------
    {'id': 'g-rain', 'width': W, 'height': H, 'layers': [
        {'id': 'titan-rain', 'effects': [rain('methane', .64, .52, .0028, 0, 400, METHANE, count=46, seed=9, top=.3)]},
        {'id': 'earth-rain', 'effects': [rain('water', .18, .26, .022, A('five'), plus(A('five'), 200), BLUE, count=60, seed=10, top=.3)]},
        figure('you', .74, FEET, FIG, [(0, 'stand'), (A('strange'), 'shrug'), (A('methane'), 'reach')], [(0, 'neutral'), (A('strange'), 'shocked'), (A('slower'), 'happy')],
               accessories=[('mask', 0), ('coat', 0)]),
    ], 'annotations': [
        note('methane', 'liquid methane', 560, 520, A('methane'), size=62, to=(640, 650), frm=(600, 545)),
        note('slow', '5x slower', 430, 1130, A('five'), size=80),
        note('earth', 'Earth rain', 195, 520, A('Earth', -6, beat='rain'), size=54, color=INK),
    ]},

    # 7 lakes -----------------------------------------------------------------
    {'id': 'g-lakes', 'width': W, 'height': H, 'layers': [
        figure('you', .18, FEET, FIG, [(0, 'stand'), (A('swimming', -2), 'cheer'), (A('sink', -2), 'panic')],
               [(0, 'happy'), (A('swimming'), 'grin'), (A('light'), 'shocked'), (A('sink'), 'scream')], accessories=[('mask', 0), ('coat', 0)],
               anchor={'x': GX(.18), 'y': GY(FEET)},
               x=track((0, 0), (A('swimming', 2), 0), (A('swimming', 18), 470, 'ease-out-cubic')),
               y=track((0, 0), (A('swimming', 2), 0), (A('swimming', 10), -240, 'ease-out-cubic'), (A('swimming', 18), 30), (A('sink'), 60), (A('bottom', 6), 700, 'ease-in-back'))),
        {'id': 'lake', 'kit': {'type': 'water', 'x': .45, 'y': .75, 'width': .62, 'height': .3, 'waves': 2, 'periodFrames': 150, 'seed': 3}, **pop_in(A('lakes', -2), (GX(.75), GY(.85)))},
        {'id': 'glug', 'effects': [bubbles('glug-bubbles', .62, .77, A('sink', 4))]},
    ], 'annotations': [
        note('big', 'bigger than any Great Lake', 540, 545, A('bigger'), size=56),
        note('dont', "don't!", 330, 800, A('swimming', 4), size=80),
        note('sink', 'you sink!', 300, 1010, A('sink', 2), size=80),
    ]},

    # 8 closing ---------------------------------------------------------------
    {'id': 'g-closing', 'width': W, 'height': H, 'layers': [
        planet('titan-small', .14, .24, .07, TITAN, bands=['#f0b960'], shade=.25, seed=8),
        figure('you', .34, FEET, FIG, [(0, 'stand'), (A('needed'), 'hands-on-hips'), (A('wings'), 'flap')],
               [(0, 'happy'), (A('needed'), 'smug'), (A('wings'), 'grin')],
               accessories=[('mask', A('mask')), ('coat', A('coat')), ('wings', A('wings'))], anchor={'x': GX(.34), 'y': GY(FEET)},
               y=track((0, 0), (A('wings', 2), 0), (A('wings', 40), -200, 'ease-out-cubic'))),
        *[prop(f'tick-{i}', 'check', .64, .45 + i * .08, .06, **pop_in(A(w, 1), (GX(.64), GY(.45 + i * .08)))) for i, w in enumerate(['mask', 'coat', 'wings'])],
    ], 'annotations': [
        note('nosuit2', 'no spacesuit!', 600, 560, A('No', 0, beat='closing'), size=70, color=INK),
        *[note(f'item-{i}', w, 805, int(GY(.45 + i * .08)) + 22, A(w, 1), size=68, color=INK) for i, w in enumerate(['mask', 'coat', 'wings'])],
    ]},
]

scenes = [scene(b['sceneId'], f"g-{b['id']}", b['id'], pilot.NOMINAL[i], pilot.sounds[b['id']], pilot.cams.get(b['id'])) for i, b in enumerate(story['beats'])]
board = {
    'schemaVersion': '2.1', 'projectId': 'titan-short', 'title': story['title'], 'themeId': 'paint-notebook',
    'format': {'width': W, 'height': H, 'fps': FPS}, 'styleId': 'cinematic-illustrated', 'background': '@sky.top', 'accent': '@text.accent',
    'assets': [], 'backdrop': {'group': 'backdrop'},
    'narrationTiming': {'minimumSceneFrames': 45, 'maximumDeviationSeconds': .2},
    'audio': {'music': 'generated-pad', 'musicGainDb': -24, 'duckRatio': 8, 'targetLufs': -14},
    'groups': groups, 'scenes': scenes,
}
if __name__ == '__main__':
    (ROOT / 'storyboards/titan-short.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote titan-short', sum(pilot.NOMINAL), 'frames')
