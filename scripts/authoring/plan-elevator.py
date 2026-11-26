"""No-narration Short A: "Taking the Elevator to Space" (M3.8, 26 Nov 2026).

An ordinary office lift keeps going up. The world's fastest lift speed (21 m/s) drives a live floor display, height,
time, air and temperature; the world streams past (city, Burj Khalifa, clouds, Everest, a jet, the Armstrong limit,
the Kármán line, the ISS). No narration: music, dings and Arka's faces carry it, and Arka gets one line at the end.
Facts and sources: stories/no-narration-shorts-facts.md (section A).

Usage: python3 scripts/authoring/plan-elevator.py [output_storyboard]
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes

ROOT = pathlib.Path(__file__).resolve().parents[2]
SID = 'elevator-to-space'
STORY = ROOT / f'stories/{SID}.json'
UP, FLOOR_M, DOWN = 21.0, 3.5, 10.0          # m/s up (Hitachi, Guangzhou CTF), metres per storey, m/s down
LINE = "...I'll take the stairs."
DURATION = 42                                # seconds
S = lambda sec: round(sec * FPS)             # seconds -> frames

# ------------------------------------------------------------------ the ride (altitude over screen time)
# Each leg runs linearly in metres, so the picture rushes off each milestone and slows into the next one.
ISS = 419_000
RIDE = [(0, 0), (S(.8), 0), (S(4), 828), (S(10), 8849), (S(12.6), 10_700), (S(17.4), 19_200), (S(25.5), 100_000), (S(34), ISS)]
ARRIVE = RIDE[-1][0]
DOORS = S(36.2)                              # the doors open on the ISS
SAY = S(37.6)                                # Arka's line starts about here (the padded narration puts it there)
AIR = [(0, 100), (828, 91), (8849, 31), (10_700, 24), (19_200, 6.2), (30_000, 1.18), (50_000, .079), (70_000, .0052), (85_000, .00037), (100_000, .00003), (ISS, 0)]
TEMP = [(0, 15), (828, 10), (8849, -42), (10_700, -54), (19_200, -57), (25_000, -57)]


def write_story():
    story = {'schemaVersion': '1.0', 'id': SID, 'title': 'Taking the Elevator to Space',
             'topic': ('A lift at the world record speed of 21 m/s (Hitachi, Guangzhou CTF) climbing from the ground to the ISS at about 419 km: '
                       'Burj Khalifa top in 39 s, Everest in 7 min, the Armstrong limit in 15 min, space in 1 h 19 min, the ISS in 5 h 33 min; '
                       'going down at 10 m/s takes 11 h 38 min'),
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious adults, mostly 25-44', 'durationSeconds': DURATION,
             'storyboard': f'storyboards/{SID}.json', 'candidatesReport': 'stories/no-narration-shorts-facts.md',
             'beats': [{'id': 'e1', 'sceneId': 'el-e1', 'intent': 'closing', 'narration': LINE, 'phrases': [LINE], 'phraseSpeakers': ['arka']}]}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')


write_story()
ep = Episode(str(STORY), 'tall'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'paint-night'
ep.F['primary'] = 1.0
ep.backdrop(stars=0)
ep.music([('e1', 'assets/music/6-space-singularity.mp3', 0)], dropouts=[('e1', SAY - 6, 2.2)], gain_db=-16, target_lufs=-14)

ride = track(*[(f, a, 'linear') if i > 2 else (f, a) for i, (f, a) in enumerate(RIDE)])   # the first leg eases in from standing (smoothstep)
ride[-1]['ease'] = 'ease-out-cubic'                       # the last leg brakes into the station
CAR = dict(altitude=ride, carX=.5, carY=.66, carWidth=.36, carHeight=.21, decade=.62, offset=40)
world = {'type': 'ascent', 'part': 'world', **CAR, 'stars': 220, 'seed': 9, 'clearTop': .35, 'markers': [
    {'kind': 'city', 'altitude': 180, 'seed': 4},
    {'kind': 'tower', 'altitude': 828, 'x': .17, 'size': .17, 'label': 'Burj Khalifa'},
    {'kind': 'cloud', 'altitude': 2300, 'x': .16, 'size': .36, 'seed': 2}, {'kind': 'cloud', 'altitude': 3400, 'x': .86, 'size': .42, 'seed': 5},
    {'kind': 'cloud', 'altitude': 5200, 'x': .22, 'size': .3, 'seed': 8},
    {'kind': 'mountain', 'altitude': 8849, 'x': .16, 'size': .26, 'label': 'Everest', 'seed': 3},
    {'kind': 'jet', 'altitude': 10_700, 'x': 1.45, 'size': .3, 'drift': -.0025},
    {'kind': 'line', 'altitude': 19_200, 'x': .04, 'size': .075, 'label': 'ARMSTRONG LIMIT', 'color': '#ff8a5c'},
    {'kind': 'line', 'altitude': 100_000, 'x': .04, 'size': .075, 'label': 'SPACE STARTS HERE', 'color': '#ffd25e'},
    {'kind': 'station', 'altitude': ISS + 1500, 'x': .17, 'size': .3, 'label': 'ISS'},
]}
front = {'type': 'ascent', 'part': 'car-front', **CAR, 'markers': [], 'stars': 0,
         'doors': [{'frame': 0, 'value': .7}, {'frame': S(.7), 'value': 0, 'ease': 'ease-out-cubic'}, {'frame': DOORS, 'value': 0}, {'frame': DOORS + 18, 'value': 1, 'ease': 'ease-out-cubic'}]}
readout = {'type': 'readout', 'x': .5, 'y': .05, 'width': .66, 'value': ride, 'rows': [
    {'label': 'FLOOR', 'format': 'int', 'scale': round(1 / FLOOR_M, 6), 'big': True},
    {'label': 'HEIGHT', 'format': 'distance'},
    {'label': 'TIME', 'format': 'duration', 'scale': round(1 / UP, 6)},
    {'label': 'AIR', 'format': 'percent', 'curve': [list(p) for p in AIR]},
    {'label': 'OUTSIDE', 'format': 'celsius', 'curve': [list(p) for p in TEMP], 'max': 21_000}]}

# Arka rides inside the car: reacts at every milestone, then delivers the line when the doors open.
feet = CAR['carY'] - .006
arka = Char('arka', 'arka', x=.5, fy=feet, h=.135, idle='breathe',
            poses=[(0, 'stand'), (S(4), 'cheer'), (S(6), 'stand'), (S(10), 'scared'), (S(12.6), 'point-right'), (S(14.5), 'stand'), (S(17.4), 'panic'),
                   (S(20.5), 'stand'), (S(25.5), 'cheer'), (S(28), 'stand'), (ARRIVE, 'stand'), (DOORS + 10, 'point-left'), (SAY, 'shrug')],
            faces=[(0, 'neutral'), (S(4), 'happy'), (S(8), 'neutral'), (S(10), 'scared'), (S(12.6), 'shocked'), (S(14.5), 'neutral'), (S(17.4), 'scream'),
                   (S(20.5), 'puffed'), (S(25.5), 'grin'), (S(28), 'happy'), (DOORS + 10, 'shocked'), (SAY, 'smug')],
            react=[S(10), S(17.4)])

CALL_Y = 770                                        # one line of text between the readout and the car (above the Shorts UI)
def callout(cid, text, a, b, color='#ffffff'):
    return {'id': cid, 'text': text, 'x': W // 2, 'y': CALL_Y, 'size': 60, 'anchor': 'middle', 'variant': 'pill', 'color': color, 'pop': True,
            'opacity': track(*([(0, 1)] if a == 0 else [(0, 0), (a - 1, 0), (a + 6, 1)]), (b - 1, 1), (b + 6, 0))}
notes = [callout('c0', 'What if this lift never stopped?', 0, S(3.4)), callout('c1', 'Taller than Burj Khalifa', S(3.8), S(7)), callout('c2', 'Higher than Everest', S(9.6), S(12.4)),
         callout('c3', 'Where jets fly', S(12.4), S(15.2)), callout('c4', 'Your tears would boil', S(17), S(21.5)),
         callout('c5', 'You are in space', S(25.2), S(29)), callout('c6', 'The ISS. Doors opening...', ARRIVE, DOORS + 10),
         callout('c7', 'Going down: 11 h 38 min', DOORS + 14, S(DURATION) + 30)]
sounds = [('ding', S(.1), -14), ('rumble', S(.8), -20), ('ding', S(4), -16), ('wind', S(7.5), -24), ('ding', S(10), -16), ('whoosh', S(11.6), -16),
          ('ding', S(17.4), -14), ('heartbeat', S(18.2), -18), ('riser', S(22), -22), ('ding', S(25.5), -14), ('ding', ARRIVE + 6, -10), ('pop', DOORS + 14, -18)]
ep.scene('e1', explain([arka], [Prop({'id': 'world', 'kit': world}), Prop({'id': 'front', 'kit': front}), Prop({'id': 'readout', 'kit': readout})], [], camera_preset=None, sounds=sounds))

tag = note('brand-tag', 'GAHANARKA', 200, 1475, 0, size=40, color='#ffd25e')
tag.pop('opacity', None); tag['pop'] = False; tag['opacity'] = track((0, .85))
ep._backdrop.setdefault('annotations', []).append(tag)

if __name__ == '__main__':
    board = ep.build()
    g = next(g for g in board['groups'] if g['id'] == 'g-e1')
    order = {'world': 0, 'arka': 1, 'front': 2, 'readout': 3}
    g['layers'].sort(key=lambda l: order.get(l['id'], 1))     # world, rider, glass doors, then the readout on top
    g['annotations'] = notes
    sc = board['scenes'][0]
    sc['sounds'] = [{'sound': s, 'frame': f, 'gainDb': d} for s, f, d in sounds]     # no automatic cut whoosh
    out = ROOT / (sys.argv[1] if len(sys.argv) > 1 else f'storyboards/{SID}.json')
    out.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', out.name, sc['durationFrames'], 'frames')
