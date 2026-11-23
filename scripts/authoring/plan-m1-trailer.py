"""Approval trailer (16:9, about 2 min) for M1 "Could the Moon Ever Come Back?" (stories/moon-rewind-script.md).

Free: Piper placeholder voices + licensed music (trailerkit). People first: the viewer's own fist, Aldrin,
the Babylonian astronomers, Stephenson, Wells, Lantink. Never reveals the answer or the Phobos twist.
Usage: python3 scripts/authoring/plan-m1-trailer.py
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from trailerkit import *  # noqa: F401,F403

NIGHT, DUSK = '#0d1226', '#1b2340'


def stripes(top=.42, n=9, a='#9c3b22', b='#3a2a28'):
    # banded-iron cliff: alternating thick red / thin dark layers
    out, y = [], top
    for i in range(n):
        out.append(ground(a if i % 2 == 0 else b, b if i % 2 == 0 else a, top=y, curve=0, seed=20 + i, gid=f'band{i}'))
        y += .07 if i % 2 == 0 else .025
    return out


shot('m1', [(N, "Look at the Moon tonight. You could hide it behind a pea, held at arm's length.")], lambda d: (
    [bg(NIGHT), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .8, 'stars': 70, 'seed': 4}}, moon('moon', .66, .26, .025),
     ground('#2a3350', '#1c2440', top=.8, curve=.04), person('you', .36, .8, .36, poses=((0, 'stand'), (int(d * .35), 'point-right')), faces=((0, 'happy'),))],
    [note('pea', 'a pea at arm\'s length', .66, .4, 70, GOLD, int(d * .6))]))
shot('m2', [(N, "Once, you'd have needed your whole fist. The Moon hung over Earth about twenty times wider than it does now.")], lambda d: (
    [bg(DUSK), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .8, 'stars': 40, 'seed': 5}}, moon('moon', .64, .34, .12),
     ground('#3b2b30', '#2a1d22', top=.8, curve=.04), person('you', .3, .8, .36, poses=((0, 'point-right'), (int(d * .5), 'scared')), faces=((0, 'neutral'), (int(d * .5), 'shocked')))],
    [note('x20', '20× wider', .62, .7, 70, GOLD, int(d * .7))]))
# the Moon grows during m2 via a second, larger moon fading in is not supported per-layer, so we cut to the giant Moon
shot('m3', [(A, "Twenty times wider. So where did it go?")], lambda d: (
    [bg(DUSK), moon('moon', .72, .36, .26), ground('#3b2b30', '#2a1d22', top=.82, curve=.04),
     arka(.32, .82, .42, poses=((0, 'shrug'),), faces=((0, 'shocked'),))], []))
shot('m4', [(N, "Away. And it's still going. Three point eight centimeters a year, measured to the millimeter.")], lambda d: (
    [bg(NIGHT), earth('earth', .2, .55, .12), move(moon('moon', .62, .55, .06), dx=((0, 0), (d, 260))),
     prop('ruler', 'ruler', .55, .78, .5, rotation=90)],
    [note('cm', '3.8 cm a year', .62, .3, 72, GOLD, int(d * .45))]))
shot('m5', [(A, "Then I'll ask again. Could it ever come back?")], lambda d: (
    [bg(NIGHT), moon('moon', .8, .22, .04), ground('#2a3350', '#1c2440', top=.82, curve=.04),
     arka(.42, .82, .44, poses=((0, 'think'), (int(d * .55), 'point-right')), faces=((0, 'neutral'), (int(d * .55), 'smug')))], []))
shot('m6', [(N, "Let's rewind the Moon to the day it was born, stopping only where real people left real evidence.")], lambda d: (
    [bg('#120f1c'), moon('moon', .5, .48, .14), prop('clock', 'clock', .5, .48, .5, level=lv((0, 0), (int(d * .3), 1)), color=GOLD)],
    [note('rw', 'REWIND', .5, .82, 84, GOLD, int(d * .25))]), zoom=(1.0, 1.12))
shot('m7', [(N, "July 1969. Buzz Aldrin leaves a panel of glass prisms on the Moon. We still fire lasers at it. Two and a half seconds later, the light comes home.")], lambda d: (
    [bg('#05060c'), ground('#b9b6ad', '#86837a', top=.74, curve=.06), earth('earth', .82, .2, .06),
     prop('refl', 'reflector', .58, .72, .2), person('aldrin', .34, .76, .38, poses=((0, 'stand'), (int(d * .3), 'reach')), faces=((0, 'happy'),), suit='#ecebe6')],
    [note('who', 'Buzz Aldrin, 1969', .3, .2, 70, CREAM, 6), note('s', '2.5 seconds', .7, .3, 70, GOLD, int(d * .75))]))
shot('m8', [(N, "Babylon, the fifteenth of April, 136 BC. In the morning, the Sun goes completely dark. Venus and Mercury come out. And the city's astronomers press it all into a clay tablet.")], lambda d: (
    [bg('#c9a26a'), prop('ecl', 'eclipse', .66, .3, .3), ground('#a87b45', '#7c5730', top=.78, curve=.02),
     person('astro1', .3, .78, .34, poses=((0, 'point-right'),), faces=((0, 'shocked'),)), person('astro2', .42, .78, .3, poses=((0, 'scared'),), faces=((0, 'shocked'),))],
    [note('when', 'BABYLON · 136 BC', .5, .09, 70, INK, 0, False), note('v', 'Venus · Mercury · stars', .66, .56, 70, INK, int(d * .45))]))
shot('m9', [(N, "That eclipse should never have been total in Babylon. Unless Earth was spinning faster back then. Richard Stephenson spent forty years gathering records like this one. He even learned Chinese characters to read them.")], lambda d: (
    [bg('#efe6d2'), person('rs', .3, .8, .42, poses=((0, 'think'),), faces=((0, 'neutral'),)), prop('mag', 'magnifier', .58, .44, .3),
     prop('ecl', 'eclipse', .58, .44, .12), ground('#d8ccb0', '#b8aa8c', top=.8, curve=0)],
    [note('who', 'Richard Stephenson', .58, .78, 70, INK, int(d * .55)), note('y', '40 years', .78, .22, 70, '#7a4b12', int(d * .7))]))
shot('m10', [(N, "Three hundred and eighty million years ago, corals kept a diary. In 1963, John Wells counted the daily ridges. Four hundred days, in a single year.")], lambda d: (
    [bg('#1f5c6e'), prop('coral', 'coral', .4, .6, .42), prop('mag', 'magnifier', .62, .5, .24), prop('days', 'counter', .84, .5, .22, text='DAYS A YEAR', values=[{'frame': 0, 'value': 365}, {'frame': int(d * .78), 'value': 400, 'ramp': True}]), ground('#d9c48f', '#b39d68', top=.86, curve=.02)],
    [note('who', 'John Wells, 1963', .62, .2, 70, CREAM, 6)]))
shot('m11', [(A, "Four hundred days a year. That's five extra Mondays.")], lambda d: (
    [bg('#1f5c6e'), prop('days', 'counter', .7, .4, .24, text='DAYS A YEAR', values=[{'frame': 0, 'value': 400}]), ground('#d9c48f', '#b39d68', top=.84, curve=.02),
     arka(.36, .84, .44, poses=((0, 'hands-on-hips'),), faces=((0, 'smug'),))], []))
shot('m12', [(N, "Two and a half billion years ago, in Western Australia, a cliff of rusty stripes remembers a day that lasted just seventeen hours.")], lambda d: (
    [bg('#e7b27a')] + stripes() + [person('ml', .76, .42, .14, poses=((0, 'point-left'),), faces=((0, 'happy'),))],
    [note('where', 'JOFFRE GORGE', .3, .2, 70, INK, 6), note('h', '17-hour day', .3, .32, 70, '#5a1d0e', int(d * .75)), source('Lantink et al., 2022', int(d * .3))]))
shot('m13', [(N, "And then the rewind finds something nobody expected. For a billion years, the day simply stopped growing.")], lambda d: (
    [bg('#141623'), prop('clock', 'clock', .5, .45, .42, level=lv((0, .8), (int(d * .55), 0)), color=SOFT)],
    [note('b', 'a billion-year stall', .5, .82, 70, GOLD, int(d * .6))]))
shot('m14', [(N, "Four and a half billion years ago, the Moon filled the sky. Your fist, at arm's length. Earth spun once every five hours.")], lambda d: (
    [bg('#2a0f12'), glow('lava', .5, .95, 1.2, .35, 'hot'), moon('moon', .5, .3, .3), ground('#5a1a10', '#ff7a2a', top=.86, curve=.06)],
    [note('t', '5-hour day', .2, .78, 70, GOLD, int(d * .55))]), zoom=(1.0, 1.08), focus=(.5, .45))
shot('m15', [(A, "A Moon that big, and nobody around to take a photo. Tragic.")], lambda d: (
    [bg('#2a0f12'), moon('moon', .75, .28, .2), ground('#5a1a10', '#ff7a2a', top=.84, curve=.06),
     arka(.34, .84, .4, poses=((0, 'shrug'),), faces=((0, 'sad'),))], []))
shot('m16', [(N, "So, could the Moon ever come back? The answer is fifty billion years away. And it's not the ending you'd expect.")], lambda d: (
    [bg(NIGHT), earth('earth', .5, .55, .14), moon('moon', .86, .4, .035)],
    [note('n', '50,000,000,000 years', .5, .2, 70, GOLD, int(d * .4))]))
shot('m17', [(N, "Because there is a moon in our solar system that really is coming back. Right now. And it won't survive the trip.")], lambda d: (
    [bg('#05060c'), planet('mars', .5, .55, .2, '#c1532f', ('#a8452a', '#c1532f'), seed=7), prop('ring', 'orbit-ring', .5, .55, .5),
     move(prop('phobos', 'small-moon', .74, .4, .07, color='#8a7468'), dx=((0, 0), (d, -230)), dy=((0, 0), (d, 90))), prop('q', 'question', .84, .24, .12, color=GOLD)], []), tail=.8)
shot('m18', [(N, "Tonight, if you're in your mid-twenties, the Moon is about a meter farther away than on the night you were born. Look up anyway.")], lambda d: (
    [bg(NIGHT), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .8, 'stars': 80, 'seed': 9}}, moon('moon', .7, .24, .03),
     ground('#2a3350', '#1c2440', top=.8, curve=.04), person('you', .4, .8, .36, poses=((0, 'stand'), (int(d * .7), 'wave')), faces=((0, 'happy'),))],
    [note('m', '1 metre since you were born', .7, .38, 70, GOLD, int(d * .5))]))
title_card('m19', 'COULD THE MOON EVER COME BACK?')

build('m1-trailer', 'M1 Moon Rewind: approval trailer', music='8-space-laniakea.mp3', music_start=8, dropouts=('m17',))
