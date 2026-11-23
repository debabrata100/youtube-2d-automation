"""Approval trailer (16:9, about 2 min) for S2 "Would a Black-Hole Sun Suck Us In? (No, But…)" (stories/black-hole-sun-script.md).

Free: Piper placeholder voices + licensed music (trailerkit). People first: Karl Schwarzschild's hospital bed
in 1915, Andrea Ghez and Reinhard Genzel, the viewer stepping into sunshine.
Usage: python3 scripts/authoring/plan-s2-trailer.py
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from trailerkit import *  # noqa: F401,F403

SPACE, NOON, WARD = '#070912', '#9fd0f0', '#e8e1d0'


def sun(x, y, r, sid='sun'):
    return {'id': sid, 'kit': {'type': 'sun', 'x': x, 'y': y, 'radius': r}}


def hole(x, y, r, hid='bh'):
    return [glow(f'{hid}-g', x, y, r * 3, r * 3, 'sky'), planet(hid, x, y, r, '#030305', (), shade=0, seed=2)]


def grip(level, at=0):
    return prop('grip', 'bar', .5, .86, .5, level=lv((0, level)), color='#4caf50')


shot('s1', [(N, "Imagine a magic trick. At noon, someone takes the Sun and squeezes it. All of it, every gram, crushed into a ball about six kilometres across.")], lambda d: (
    [bg(SPACE), sun(.5, .45, .16), prop('arrows', 'pressure-arrows', .5, .45, .55, direction='in', color=CREAM)],
    [note('k', '6 km', .5, .84, 80, GOLD, int(d * .8))]), zoom=(1.0, 1.1))
shot('s2', [(N, "Most people know what happens next. Earth gets sucked in.")], lambda d: (
    [bg(SPACE)] + hole(.5, .45, .03) + [move(earth('earth', .82, .45, .06), dx=((0, 0), (d, -500)))],
    [note('m', 'right?', .5, .82, 80, CREAM, int(d * .6))]))
shot('s3', [(A, "I mean… that's what black holes do, isn't it?")], lambda d: (
    [bg(SPACE)] + hole(.76, .3, .04) + [ground('#2a2f48', '#1c2036', top=.84, curve=.06), arka(.36, .84, .44, poses=((0, 'shrug'),), faces=((0, 'neutral'),))], []))
shot('s4', [(N, "It's the most famous answer in space. And it's wrong. Earth would stay right where it is.")], lambda d: (
    [bg(SPACE)] + hole(.5, .5, .03) + [prop('orbit', 'orbit-ring', .5, .5, .7, color=SOFT), earth('earth', .85, .5, .05), prop('st', 'stamp', .24, .24, .22, text='WRONG')], []))
shot('s5', [(N, "For eight minutes and twenty seconds, nothing changes. Look at the grip meter. One hundred percent. It doesn't even flicker.")], lambda d: (
    [bg(NOON), sun(.74, .26, .08), ground('#7fb069', '#5e8f4c', top=.74, curve=.04), prop('town', 'town', .3, .74, .4), grip(1)],
    [note('g', 'GRIP 100%', .5, .78, 64, INK, int(d * .45)), note('t', '8 min 20 s', .2, .18, 70, INK, 6)]))
shot('s6', [(N, "Then the light runs out. And Earth keeps circling, on schedule, around something it can no longer see.")], lambda d: (
    [bg(SPACE), prop('orbit', 'orbit-ring', .5, .5, .7, color=SOFT), earth('earth', .15, .5, .05)] + hole(.5, .5, .02),
    [note('l', 'light: 0%', .5, .86, 76, SOFT, int(d * .25))]))
shot('s7', [(A, "So we keep going around the Sun… without a Sun.")], lambda d: (
    [bg('#10131f'), ground('#2a2f48', '#1c2036', top=.84, curve=.06), arka(.46, .84, .46, poses=((0, 'think'),), faces=((0, 'sad'),))], []))
shot('s8', [(N, "Step outside and look up, where the Sun was. You'd see nothing. Like trying to spot a single grain of sand on the far side of a country.")], lambda d: (
    [bg('#4a5684'), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .8, 'stars': 120, 'seed': 8}}, ground('#6a7398', '#555e85', top=.8, curve=.04),
     person('you', .3, .8, .38, poses=((0, 'point-right'),), faces=((0, 'shocked'),)), prop('mag', 'magnifier', .66, .34, .2)],
    [note('n', 'stars at midday', .66, .6, 64, GOLD, int(d * .7))]))
shot('s9', [(A, "So the scariest object in the universe arrives, and the main thing we notice is… the lights went out.")], lambda d: (
    [bg('#0b0e1c'), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .84, 'stars': 120, 'seed': 8}}, ground('#2a3350', '#1c2440', top=.84, curve=.04),
     arka(.46, .84, .46, poses=((0, 'shrug'),), faces=((0, 'smug'),))], []))
shot('s10', [(N, "Fly closer. About seventeen hundred kilometres out, the pull on your feet starts stretching you. Scientists really do call it spaghettification.")], lambda d: (
    [bg(SPACE)] + hole(.72, .5, .06) + [arka(.36, .62, .3, poses=((0, 'float'), (int(d * .5), 'tumble')), faces=((0, 'neutral'), (int(d * .5), 'dizzy')), dx=((0, 0), (d, 200)))],
    [note('sp', 'spaghettification', .4, .2, 76, GOLD, int(d * .72))]))
shot('s11', [(N, "That answer was first worked out in a hospital bed. In 1915, a German astronomer named Karl Schwarzschild, sick, within earshot of the guns near the Russian front, solved Einstein's brand-new equations, and posted the answer to Einstein.")], lambda d: (
    [bg(WARD), prop('bed', 'bed', .4, .72, .5), prop('letter', 'sign', .76, .6, .3, text='TO: EINSTEIN'), ground('#d6ccb4', '#b8aa8c', top=.84, curve=0)],
    [note('who', 'Karl Schwarzschild', .4, .18, 76, INK, 8), note('y', '1915', .4, .3, 70, '#7a4b12', 8), source('Physics Today; Einstein Papers', 10)]))
shot('s12', [(N, "A few months later, he was dead. He never knew his maths described something real.")], lambda d: (
    [bg('#1a1712'), prop('bed', 'bed', .5, .7, .44)], [note('y', '1873–1916', .5, .3, 76, SOFT, int(d * .2))]), tail=1.0)
shot('s13', [(A, "He worked out a black hole from a hospital bed, near a war. And never got to see one.")], lambda d: (
    [bg('#1a1712'), ground('#3a332a', '#2a241c', top=.84, curve=0), arka(.46, .84, .46, poses=((0, 'stand'),), faces=((0, 'sad'),))], []))
shot('s14', [(N, "Decades later, two teams began watching stars at the centre of our galaxy. Andrea Ghez's first proposal was turned down. In 2020, she and Reinhard Genzel won the Nobel Prize, for proving a real black hole is there, with a star swinging round it every sixteen years.")], lambda d: (
    [bg(SPACE), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': 1, 'stars': 140, 'seed': 21}}] + hole(.5, .52, .03)
    + [prop('orbit', 'orbit-ring', .5, .52, .5, rotation=25, color=SOFT), move(prop('s2', 'sparkle', .74, .42, .09, color=GOLD), dx=((0, 0), (d, -470)), dy=((0, 0), (d, 120)))],
    [note('who', 'Andrea Ghez · Reinhard Genzel', .5, .12, 70, CREAM, 8), note('nb', 'Nobel Prize 2020', .5, .88, 76, GOLD, int(d * .62))]))
shot('s15', [(A, "So a star just… circles a black hole. Like we circle the Sun.")], lambda d: (
    [bg(SPACE)] + hole(.76, .32, .03) + [ground('#2a2f48', '#1c2036', top=.84, curve=.06), arka(.36, .84, .44, poses=((0, 'point-right'),), faces=((0, 'happy'),))], []))
shot('s16', [(N, "Next time you step into sunshine, remember. It's not the Sun's grip that keeps you alive. It's the glow.")], lambda d: (
    [bg(NOON), glow('warm', .7, .24, .8, .6, 'sun'), sun(.7, .24, .08), ground('#7fb069', '#5e8f4c', top=.8, curve=.04),
     person('you', .36, .8, .4, poses=((0, 'stand'), (int(d * .6), 'cheer')), faces=((0, 'happy'),))], []))
title_card('s17', 'WOULD A BLACK-HOLE SUN SUCK US IN?', '(NO, BUT…) · GAHANARKA')

build('s2-trailer', 'S2 Black-Hole Sun: approval trailer', music='6-space-event-horizon.mp3', music_start=0, dropouts=('s12',))
