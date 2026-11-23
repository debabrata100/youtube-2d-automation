"""Approval trailer (16:9, about 2 min) for E7 "What If Apophis Hit? Most Videos Get It Wrong" (stories/apophis-script.md).

Free: Piper placeholder narrator + licensed music; Arka's lines are cut word for word from her real E3 take
(paid on 22 Nov, reused at no cost). People first: the three discoverers, Christmas 2004, Roy Tucker,
two billion people looking up. Never states the full impact numbers or the tsunami answer.
Usage: python3 scripts/authoring/plan-e7-trailer.py [path/to/takes-dir]
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from trailerkit import *  # noqa: F401,F403

TAKES_DIR = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'jobs/e7-avt-e3/audio/takes')
use_take(A, TAKES_DIR / 'arka.wav', TAKES_DIR / 'arka.json')

SPACE, ROCK = '#070912', '#8f8a80'


def apophis(x, y, r, pid='apo', **k):
    return planet(pid, x, y, r, ROCK, ('#7b766c',), craters=4, shade=.35, seed=17, **k)


def rock_ground():
    return ground('#9a958b', '#6f6a61', top=.8, curve=.14, seed=31)


shot('p1', [(N, "On Friday the thirteenth of April, 2029, an asteroid the size of a skyscraper will pass closer to Earth than the satellites that carry our TV signals.")], lambda d: (
    [bg(SPACE), earth('earth', .34, .52, .18), prop('ring', 'orbit-ring', .34, .52, .62), prop('sat', 'station', .58, .3, .06),
     move(apophis(.95, .2, .04), dx=((0, 0), (d, -560)), dy=((0, 0), (d, 260)))],
    [note('date', 'FRIDAY 13 APRIL 2029', .66, .86, 76, GOLD, int(d * .15))]))
shot('p2', [(N, "You may have heard what happens next. It wipes out a continent. It ends the world. A wall of water hundreds of metres high.")], lambda d: (
    [bg('#1a0e10'), glow('fire', .5, .9, 1.2, .4, 'hot'), earth('earth', .5, .55, .2), prop('imp', 'impact', .56, .44, .2),
     prop('st', 'stamp', .78, .26, .2, text='CLAIM')],
    [note('c1', 'wipes out a continent?', .22, .2, 64, CREAM, int(d * .2)), note('c2', 'ends the world?', .22, .32, 64, CREAM, int(d * .45)),
     note('c3', 'a wall of water?', .22, .44, 64, CREAM, int(d * .7))]))
shot('p3', [(A, "Please tell me most of that is wrong.")], lambda d: (
    [bg(SPACE), rock_ground(), arka(.46, .8, .46, poses=((0, 'cower'),), faces=((0, 'scared'),))], []))
shot('p4', [(N, "Most of it is. And one part is more interesting than any of the scary versions. To check every claim properly, we're not going to watch from Earth. We're going to ride it.")], lambda d: (
    [bg(SPACE), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': 1, 'stars': 90, 'seed': 3}}, apophis(.5, .55, .22), earth('earth', .86, .2, .03)],
    [note('r', 'RIDE IT', .5, .14, 92, GOLD, int(d * .82))]), zoom=(1.0, 1.15))
shot('p5', [(N, "Apophis. A lumpy grey rock, four hundred and fifty metres long. The gravity is so weak that one gentle hop, faster than twelve centimetres a second, and you leave it forever.")], lambda d: (
    [bg(SPACE), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': 1, 'stars': 80, 'seed': 6}}, earth('earth', .82, .22, .05), rock_ground(),
     arka(.38, .8, .4, poses=((0, 'stand'), (int(d * .6), 'float')), faces=((0, 'happy'), (int(d * .7), 'shocked')), dy=((0, 0), (int(d * .6), 0), (d, -120)))],
    [note('s', '12 cm a second', .66, .5, 76, GOLD, int(d * .62))]))
shot('p6', [(A, "Twelve centimetres a second? I walk to the kitchen faster than that.")], lambda d: (
    [bg(SPACE), earth('earth', .82, .22, .05), rock_ground(), arka(.46, .8, .44, poses=((0, 'shrug'),), faces=((0, 'smug'),))], []))
shot('p7', [(N, "Christmas, 2004. Three astronomers had spotted this rock in Arizona, then lost it. When Gordon Garradd found it again from Australia, the odds of a hit kept climbing. One in three hundred. One in sixty. One in thirty-seven.")], lambda d: (
    [bg('#dfe3ee'), person('gg', .24, .82, .4, poses=((0, 'think'), (int(d * .55), 'scared')), faces=((0, 'neutral'), (int(d * .55), 'shocked'))),
     ground('#c3c9d8', '#a6adbf', top=.82, curve=0),
     prop('odds', 'counter', .64, .45, .3, text='1 IN …', values=[{'frame': 0, 'value': 300}, {'frame': int(d * .76), 'value': 60}, {'frame': int(d * .9), 'value': 37}])],
    [note('when', 'CHRISTMAS 2004', .5, .1, 76, INK, 6), note('who', 'Gordon Garradd', .24, .3, 60, '#2a3a5a', int(d * .35)),
     note('hi', 'highest danger rating ever', .64, .78, 64, '#8a3a12', int(d * .9))]))
shot('p8', [(N, "What saved the day was old photographs. Within days, 2029 was ruled out.")], lambda d: (
    [bg('#efe6d2'), prop('mag', 'magnifier', .4, .48, .34), prop('ok', 'check', .7, .46, .18), ground('#d8ccb0', '#b8aa8c', top=.86, curve=0)],
    [note('y', '2029: ruled out', .7, .78, 76, '#2a6a3a', int(d * .6))]))
shot('p9', [(N, "Then, closest approach. We pass inside the ring of satellites, about a tenth of the way to the Moon.")], lambda d: (
    [bg(SPACE), earth('earth', .5, .6, .36), prop('ring', 'orbit-ring', .5, .6, .95), prop('sat', 'station', .2, .34, .06), prop('sat2', 'probe', .82, .3, .06)],
    []), zoom=(1.0, 1.12), focus=(.5, .55))
shot('p10', [(A, "It's filling the whole sky.")], lambda d: (
    [bg(SPACE), earth('earth', .62, .3, .4), rock_ground(), arka(.24, .8, .38, poses=((0, 'point-right'),), faces=((0, 'shocked'),))], []))
shot('p11', [(A, "The ground just moved. Did you feel that?")], lambda d: (
    [bg(SPACE), earth('earth', .62, .28, .36), rock_ground(), arka(.3, .8, .4, poses=((0, 'panic'),), faces=((0, 'scared'),), shiver=2)], []))
shot('p12', [(N, "Earth won't tear it apart. But the tumbling may change, and there may be small landslides and quakes. Not destruction. A shiver.")], lambda d: (
    [bg(SPACE), earth('earth', .82, .3, .14), apophis(.38, .55, .2), prop('ml', 'motion-lines', .38, .55, .5, color=SOFT)],
    [note('sh', 'a shiver', .38, .86, 80, GOLD, int(d * .75))]))
shot('p13', [(A, "And before you answer, I've seen the maps. Scientists know exactly where it lands.")], lambda d: (
    [bg('#efe6d2'), earth('earth', .66, .44, .2), prop('path', 'arrow', .66, .44, .5, rotation=-20, color='#b0442a'), ground('#d8ccb0', '#b8aa8c', top=.84, curve=0),
     arka(.26, .84, .44, poses=((0, 'point-right'),), faces=((0, 'smug'),))], []))
shot('p14', [(N, "Half true. And the real story behind those maps is more interesting. So we'll check every claim. The maps. The odds. The wall of water. And for one of them, the honest answer is: we don't know.")], lambda d: (
    [bg('#efe6d2'), earth('earth', .5, .44, .2), prop('path', 'arrow', .5, .44, .5, rotation=-20, color='#b0442a'), prop('st', 'stamp', .78, .24, .24, text='HALF TRUE'), ground('#d8ccb0', '#b8aa8c', top=.86, curve=0)],
    [note('dk', "we don't know", .5, .8, 80, '#7a2a12', int(d * .85))]))
shot('p15', [(N, "On that Friday night, Apophis will look like a star that moves, crossing the width of the full Moon in about a minute.")], lambda d: (
    [bg('#0d1226'), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .78, 'stars': 90, 'seed': 13}}, moon('moon', .82, .2, .035),
     move(prop('apo', 'sparkle', .2, .3, .1, color=GOLD), dx=((0, 0), (d, 700))), ground('#2a3350', '#1c2440', top=.78, curve=.02),
     prop('town', 'town', .5, .78, .5)], []))
shot('p16', [(N, "Roy Tucker, one of the three who found it, died in 2021. He won't see that night. But about two billion people will be able to see what he found.")], lambda d: (
    [bg('#0d1226'), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .78, 'stars': 90, 'seed': 13}}, prop('apo', 'sparkle', .62, .26, .1, color=GOLD),
     ground('#2a3350', '#1c2440', top=.78, curve=.02), prop('city', 'city-lights', .5, .78, .6)],
    [note('rt', 'Roy Tucker, 1951–2021', .3, .2, 64, CREAM, 8), note('2b', '≈ 2 billion people', .62, .5, 76, GOLD, int(d * .7))]), tail=.9)
shot('p17', [(A, "So the scariest asteroid of 2004 becomes the most studied asteroid of 2029.")], lambda d: (
    [bg(SPACE), apophis(.7, .4, .14), prop('pr', 'probe', .5, .3, .08), rock_ground(), arka(.26, .8, .42, poses=((0, 'hands-on-hips'),), faces=((0, 'grin'),))], []))
title_card('p18', 'WHAT IF APOPHIS HIT?', 'MOST VIDEOS GET IT WRONG · GAHANARKA')

build('e7-trailer', 'E7 Apophis: approval trailer', music='4-tense-a-false-vacuum-decay.mp3', music_start=0, dropouts=('p16',))
