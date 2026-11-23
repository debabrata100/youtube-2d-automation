"""Approval trailer (16:9, about 2 min) for E1 "When Will a Day Be 25 Hours Long?" (stories/day-25-script.md).

Free: Piper placeholder voices + licensed music (trailerkit). People first: Arka's list, Duncan Agnew, Mostafa
Kiani Shahvandi, the rover team with two watches, the viewer's own body clock. Never reveals the E7 teaser.
Usage: python3 scripts/authoring/plan-e1-trailer.py
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from trailerkit import *  # noqa: F401,F403

PAPER, GRID, CORE, POLAR, NIGHT = '#efe6d2', '#e3ecef', '#1f2a3a', '#d9ecf5', '#1b1f3a'


def hour_bar(level_keys, x=.5, y=.84, size=.6):
    return prop('bar25', 'bar', x, y, size, level=lv(*level_keys), color=GOLD, count=6)


shot('e1', [(A, "Okay. I've written a list of everything I'm going to do with my extra hour.")], lambda d: (
    [bg(PAPER), ground('#d8ccb0', '#b8aa8c', top=.84, curve=0), prop('sign', 'sign', .68, .62, .34, text='MY 25TH HOUR'),
     arka(.34, .84, .46, poses=((0, 'point-right'),), faces=((0, 'happy'),))], []))
shot('e2', [(N, "Good. You have about two hundred million years to finish it.")], lambda d: (
    [bg(PAPER), ground('#d8ccb0', '#b8aa8c', top=.84, curve=0), prop('sign', 'sign', .68, .62, .34, text='MY 25TH HOUR'),
     arka(.34, .84, .46, poses=((0, 'point-right'), (int(d * .5), 'shrug')), faces=((0, 'happy'), (int(d * .5), 'shocked')))],
    [note('n', '200,000,000 years', .68, .2, 76, '#7a4b12', int(d * .45))]))
shot('e3', [(A, "Two hundred million. I don't even reply to emails that fast.")], lambda d: (
    [bg(PAPER), ground('#d8ccb0', '#b8aa8c', top=.84, curve=0), arka(.5, .84, .5, poses=((0, 'hands-on-hips'),), faces=((0, 'smug'),))], []))
shot('e4', [(N, "The day really is growing. Today is about fifty billionths of a second longer than yesterday. And the twenty-fifth hour is being fought over. Something builds it. Something keeps stealing it back. And since the year two thousand, we've joined in.")], lambda d: (
    [bg('#14182a'), prop('clock', 'clock', .5, .4, .42, level=lv((0, .3)), color=SOFT), hour_bar(((0, .2), (int(d * .45), .55), (int(d * .65), .3), (int(d * .85), .6)))],
    [note('t', 'THE 25TH HOUR', .5, .7, 76, GOLD, int(d * .35))]), zoom=(1.0, 1.08))
shot('e5', [(N, "Since 1972, the world has paused its clocks twenty-seven times, for one extra second. Twenty-three fifty-nine, and sixty.")], lambda d: (
    [bg(GRID), prop('clock', 'clock', .28, .48, .36, level=lv((0, .2), (int(d * .7), 0))), ground('#c9d6db', '#a9b8be', top=.88, curve=0)],
    [note('ls', '23:59:60', .66, .45, 100, INK, int(d * .62)), note('n', '27 leap seconds', .66, .22, 70, '#2a4a6a', int(d * .25))]))
shot('e6', [(A, "So the planet runs late, and the entire world politely waits for it.")], lambda d: (
    [bg(GRID), earth('earth', .7, .42, .14), ground('#c9d6db', '#a9b8be', top=.86, curve=0),
     arka(.3, .86, .46, poses=((0, 'shrug'),), faces=((0, 'smug'),))], []))
shot('e7', [(N, "Then Earth started speeding up. On the fifth of July, 2024, it finished its turn one point six six milliseconds early. The shortest day since atomic clocks began.")], lambda d: (
    [bg('#0e1120'), earth('earth', .45, .5, .2), prop('ml', 'motion-lines', .7, .5, .3, color=CREAM)],
    [note('d', '5 July 2024', .78, .22, 72, CREAM, int(d * .4)), note('ms', '−1.66 ms', .78, .78, 88, GOLD, int(d * .62))]))
shot('e8', [(A, "The planet had a coffee.")], lambda d: (
    [bg('#0e1120'), earth('earth', .62, .45, .16), prop('mug', 'mug', .8, .7, .16), ground('#2a2f48', '#1c2036', top=.86, curve=.04),
     arka(.3, .86, .44, poses=((0, 'point-right'),), faces=((0, 'grin'),))], []))
shot('e9', [(N, "Geophysicist Duncan Agnew warned that the world's clocks may soon need something never done before. A second, taken away. And almost no software is built for that.")], lambda d: (
    [bg(GRID), person('agnew', .3, .84, .44, poses=((0, 'think'), (int(d * .5), 'point-right')), faces=((0, 'neutral'),)), ground('#c9d6db', '#a9b8be', top=.84, curve=0),
     prop('x', 'cross', .7, .45, .16)],
    [note('who', 'Duncan Agnew', .3, .2, 76, INK, 8), note('neg', '23:59:58 → 00:00', .66, .7, 76, INK, int(d * .45))]))
shot('e10', [(N, "Then he found something slowing Earth back down. Us.")], lambda d: (
    [bg('#05060c'), earth('earth', .5, .5, .16)], [note('us', 'US', .5, .82, 100, GOLD, int(d * .7))]), tail=.9)
shot('e11', [(N, "Ice from Greenland and Antarctica is melting, and the water spreads towards the equator. Like a skater stretching out her arms, Earth slows down. That missing second has been pushed back by three years.")], lambda d: (
    [bg(POLAR), earth('earth', .34, .5, .2), prop('arrows', 'pressure-arrows', .34, .5, .5, direction='out'),
     person('skater', .74, .8, .4, poses=((0, 'stand'), (int(d * .4), 'cheer')), faces=((0, 'happy'),)), ground('#bcd8e6', '#9fc0d0', top=.8, curve=0)],
    [note('y', '+3 years', .74, .22, 80, '#1d4a6a', int(d * .8)), source('Agnew, Nature 2024', 10)]))
shot('e12', [(N, "In a high-emissions future, a team led by Mostafa Kiani Shahvandi estimates that by 2100, we could be stretching our days more than the Moon does.")], lambda d: (
    [bg(POLAR), moon('moon', .3, .42, .12), earth('earth', .7, .42, .12), prop('vs', 'exclaim', .5, .42, .1)],
    [note('who', 'Mostafa Kiani Shahvandi', .5, .14, 70, INK, 8), note('n', 'by 2100: us > the Moon', .5, .78, 80, '#7a2a12', int(d * .7)), source('PNAS, 2024', 10)]))
shot('e13', [(A, "We finally beat the Moon at something, and it's this.")], lambda d: (
    [bg(POLAR), moon('moon', .76, .3, .08), ground('#bcd8e6', '#9fc0d0', top=.84, curve=0),
     arka(.4, .84, .46, poses=((0, 'cheer'), (int(d * .55), 'shrug')), faces=((0, 'grin'), (int(d * .55), 'sad')))], []))
shot('e14', [(N, "And you? Your body has its own clock. On average, it runs about twenty-four hours and eleven minutes. Could it live on a longer day?")], lambda d: (
    [bg(NIGHT), prop('bed', 'bed', .4, .74, .4), prop('clock', 'clock', .74, .38, .28, level=lv((0, .15)), color=SOFT), ground('#2a2f48', '#1c2036', top=.86, curve=0)],
    [note('bc', '24 h 11 min', .74, .7, 84, GOLD, int(d * .5)), source('Czeisler, Harvard, 1999', 10)]))
shot('e15', [(N, "In 2004, NASA's rover team found out. They lived on Mars time, starting work forty minutes later every single day. Some wore two watches. One for Earth, one for Mars.")], lambda d: (
    [bg('#ddd3ea'), planet('mars', .82, .26, .1, '#c1532f', ('#a8452a', '#c1532f'), seed=7),
     person('p1', .26, .84, .4, poses=((0, 'stand'), (int(d * .6), 'think')), faces=((0, 'neutral'), (int(d * .6), 'asleep'))),
     person('p2', .4, .84, .36, poses=((0, 'point-right'),), faces=((0, 'happy'),), facing='left'),
     prop('w1', 'clock', .6, .5, .16, level=lv((0, .2))), prop('w2', 'clock', .74, .58, .16, level=lv((0, .5)), color='#e8a07a'),
     ground('#c4b8d6', '#a99bc0', top=.84, curve=0)],
    [note('m', '+40 min a day', .5, .14, 76, '#5a2a8a', int(d * .35)), note('e', 'Earth', .6, .7, 50, INK, int(d * .75), False), note('ma', 'Mars', .74, .78, 50, INK, int(d * .75), False)]))
shot('e16', [(A, "Forty minutes later every day. That's not a lie-in. That's a very slow jet lag.")], lambda d: (
    [bg('#1d1530'), ground('#2a2240', '#1c1630', top=.84, curve=0), arka(.48, .84, .46, poses=((0, 'shrug'),), faces=((0, 'dizzy'),))], []))
shot('e17', [(N, "Tonight, before you sleep, your day will be a little longer than any day in human history.")], lambda d: (
    [bg(NIGHT), {'id': 'sky', 'kit': {'type': 'sky', 'horizon': .8, 'stars': 80, 'seed': 12}}, moon('moon', .76, .22, .03),
     ground('#2a3350', '#1c2440', top=.8, curve=.04), prop('town', 'town', .36, .8, .4)], []))
title_card('e18', 'WHEN WILL A DAY BE 25 HOURS LONG?')

build('e1-trailer', 'E1 The 25th Hour: approval trailer', music='1-curious-b-frame-dragging.mp3', music_start=4, dropouts=('e10',))
