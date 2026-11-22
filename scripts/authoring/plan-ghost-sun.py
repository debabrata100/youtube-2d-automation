"""Ep 5 long episode (16:9): "If the Sun Disappeared, Even the Air Would Fall".

Single source for the story script (stories/ghost-sun.json), generated from the approved script draft 3 in
stories/ghost-sun-script.md (one shot per line; the markdown tables are parsed, so edit the script there).
The storyboard section is added after narration, once real timing exists.

Usage:
  python3 scripts/authoring/plan-ghost-sun.py --script-only [seconds]   # writes stories/ghost-sun.json
  python3 scripts/authoring/plan-ghost-sun.py [seconds]                 # also writes a placeholder storyboards/ghost-sun.json

The storyboard starts as a placeholder (one Earth per shot) so the free narration dry run and paid synthesis can
validate; the real shots are designed after narration, on real timing (as for Ep 4).
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT_MD = ROOT / 'stories/ghost-sun-script.md'
STORY = ROOT / 'stories/ghost-sun.json'
SPEAKERS = {'Narrator': 'narrator', 'Arka': 'arka'}


def read_shots():
    """(beat id, intent, [(speaker, text)]) for every script line, in order."""
    text = SCRIPT_MD.read_text().split('## Script', 1)[1].split('## Shorts', 1)[0]
    shots, chapter = [], ''
    for row in text.splitlines():
        h = re.match(r'^### (.*)', row)
        if h:
            chapter = h.group(1).lower(); continue
        m = re.match(r'^\| (s\d+) \| (\w+) \| (.*) \|$', row)
        if not m: continue
        bid, who, line = m.groups()
        n = int(bid[1:])
        if chapter.startswith('cold open'): intent = 'hook'
        elif chapter.startswith('ending'): intent = 'payoff' if n <= 66 else 'closing'
        else: intent = 'explanation'
        shots.append((bid, intent, [(SPEAKERS[who], line)]))
    ids = [int(b[1:]) for b, _, _ in shots]
    assert ids == list(range(1, len(ids) + 1)), 'script line ids must run s1..sN'
    return shots


def phrases(text, limit=34):
    """Caption phrases: break at sentence ends, otherwise before a word that would pass `limit` characters."""
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…]$', cur): out.append(cur); cur = ''
    return out + ([cur] if cur else [])


def write_story(duration):
    beats = []
    for bid, intent, parts in read_shots():
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
        assert len(ph) <= 12, f'{bid}: {len(ph)} phrases (max 12); split the line'
        beats.append({'id': bid, 'sceneId': f'gs-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'ghost-sun', 'title': 'If the Sun Disappeared, Even the Air Would Fall',
             'topic': 'Thought experiment: the Sun vanishes for 8 min 20 s (blackout longer than any eclipse, silent bees, the Moon goes out, Earth 740 m off course, a 1 AU shell of darkness passing the planets and Voyager 1), then for good: Earth flies off, cooling to 0, -20, -70 and -240 C, oxygen lasts, trees last decades, oceans freeze from the top, the air freezes and falls, survivors (fungi, tardigrades, vent life), the Sun cannot really vanish',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/ghost-sun.json', 'candidatesReport': 'stories/ghost-sun-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    args = [a for a in sys.argv[1:] if a != '--script-only']
    s = write_story(int(args[0]) if args else 720)
    words = sum(len(b['narration'].split()) for b in s['beats'])
    print('wrote', STORY.name, len(s['beats']), 'beats,', words, 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ storyboard (16:9, night sky), on the measured R1 narration timing
# Applies docs/EPISODE_VISUAL_LESSONS.md from the first pass: yellow notes (red only for danger), readable signs from frame 0,
# big props, header at top centre, every change on its word, real motion in each chapter, photo captions off the photo.
from recipes import *  # noqa: E402,F401,F403
import recipes  # noqa: E402
YELLOW, WARN, ICE = '#ffd25e', '#ff5a4a', '#bfe3ff'
recipes.RED = YELLOW
recipes.INK = '#eef1f8'
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 716  # narration 701.4 s (with the 2.6 s brand-sting gap after s7) + 2.6 s tail + 12 s end card
END_CARD = 12
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.story['durationSeconds'] = DURATION - END_CARD
ep.theme = 'paint-night-gold'  # 22 Nov: gold accents + outlined notes (same look as Every Moon v2)
ep.backdrop(stars=26)
SUN = '#ffcf4a'


def head(text, color=None):
    return Note(text, 0, 'header', pos=(W / 2, round(.085 * H)), color=color)


def arka(x=.3, fy=.8, h=.5, poses=((0, 'float'),), faces=((0, 'happy'),), **k):
    return Char('arka', 'arka', x=x, fy=fy, h=h, poses=list(poses), faces=list(faces), **k)


def lv(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def disc(pid, px, py, r, base, bands, shade=.2, seed=3, craters=0, **layer):
    return Prop(planet(pid, px, py, r, base, bands, craters=craters, shade=shade, seed=seed, **layer), Box((px - r * H / W) * W, (py - r) * H, (px + r * H / W) * W, (py + r) * H, pid))


def earth(pid, px, py, r, **layer):
    return disc(pid, px, py, r, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), **layer)


def sun(pid, px, py, r, **layer):
    return disc(pid, px, py, r, SUN, ('#ffe27a', SUN), shade=.05, seed=2, **layer)


def moon(pid, px, py, size, lit=1, **extra):
    return kit(F, pid, 'crescent', px, py, size, level=extra.pop('level', lv((0, lit))), **extra)


def shadow(pid, px, py, r, level, side='left'):
    """Darken the side of a planet disc facing the (gone) Sun: side='left' darkens the left half."""
    return Prop(prop(pid, 'night-half', px, py, 2 * r, rotation=180 if side == 'left' else 0, level=level))


def thermo(pid, px, py, size, level, color=None):
    return kit(F, pid, 'thermometer', px, py, size, w=.4, h=1.2, level=level, **({'color': color} if color else {}))


def shot(bid, chapter, chars=(), props=(), notes=(), cam='settle', sounds=(), stamps=(), day=False):
    ep.scene(bid, explain(list(chars), list(props), ([head(chapter, DAYTXT if day else None)] if chapter else []) + list(notes), camera_preset=cam, sounds=list(sounds),
                          stamps=[(i + (1 if chapter else 0), a) for i, a in stamps]))


DAYTXT, NOTE_BLUE = '#14213d', '#a9d8ff'   # text on the bright noon page; handwritten notes on the night page (no red text, docs/VISUAL_CHECKLIST.md)


def window(a, b):
    """Visible from a until b."""
    return track((0, 0), (plus(a, -1), 0), (a, 1), (plus(b, -1), 1), (b, 0))


def sky(pid, level):
    """Daytime sky over the whole frame (first prop of a shot, so everything else sits on top)."""
    return Prop(prop(pid, 'sky', .5, .5, 1.0, level=level))


def earth_lit(pid, px, py, r, sun_side='right', dark=None, relight=None, lights_on=None):
    """Earth as it really looks: the half away from the Sun is always night (with city lights); the day half goes dark
    at `dark` ('always' = dark for the whole shot) and comes back at `relight`. lights_on: the day half's city lights switch on."""
    away = 'left' if sun_side == 'right' else 'right'
    out = [earth(pid, px, py, r), shadow(pid + '-night', px, py, r, lv((0, 1)), side=away),
           Prop(prop(pid + '-city', 'city-lights', px, py, 2 * r, count=16, rotation=0 if away == 'left' else 180, level=lv((0, .9))))]
    if dark == 'always':
        keys = [(0, 1)] + ([(plus(relight, -1), 1), (plus(relight, 12), 0)] if relight is not None else [])
        out.append(shadow(pid + '-day', px, py, r, lv(*keys), side=sun_side))
    elif dark is not None:
        out.append(shadow(pid + '-day', px, py, r, lv((0, 0), (plus(dark, -1), 0), (plus(dark, 8), 1)), side=sun_side))
    if lights_on is not None:
        out.append(Prop(prop(pid + '-city2', 'city-lights', px, py, 2 * r, count=16, rotation=180 if away == 'left' else 0,
                             level=lv((0, 0), (plus(lights_on, -1), 0), (plus(lights_on, 20), .9)))))
    return out


def clock_t(pid, px, py, size, keys, text=None, **layer):
    """A clock set to real time: keys = (frame, seconds after 12:00:00, ramp to the next key?)."""
    vals = [{'frame': f, 'value': v, **({'ramp': True} if r else {})} for f, v, r in keys]
    return kit(F, pid, 'clock-time', px, py, size, w=.9, h=1.5, values=vals, **({'text': text} if text else {}), **layer)


def span(pid, px, py, size, text, at):
    return Prop(prop(pid, 'span', px, py, size, text=text, level=lv((0, 0), (plus(at, -1), 0), (plus(at, 20), 1))))


def pulse(pid, px, py, size, a, b, color='#fff6c8'):
    return Prop(prop(pid, 'pulse', px, py, size, color=color, level=lv((0, 0), (a, 0), (b, 1))))


def arrow(pid, px, py, size, at, **layer):
    return Prop(prop(pid, 'arrow', px, py, size, level=lv((0, 0), (plus(at, -1), 0), (plus(at, 14), 1)), **layer))


def bee_flying(pid, px, py, size, dx, dy, land):
    """A bee that flies in from (dx, dy) px away and lands at (px, py) at `land`, then stops."""
    return kit(F, pid, 'bee', px, py, size, level=lv((0, 1), (plus(land, 20), 1), (plus(land, 21), 0)),
               x=track((0, dx), (land, dx), (plus(land, 22), 0, 'smoothstep')), y=track((0, dy), (land, dy), (plus(land, 22), 0, 'smoothstep')))


def dim(at):
    """Opacity dip as the shell of darkness passes (each world gets its own short night)."""
    return track((0, 1), (plus(at, -1), 1), (plus(at, 4), .25), (plus(at, 34), .25), (plus(at, 44), 1))


T0, T1, T2, T3 = 'NOON: THE SUN VANISHES', '8 MINUTES, 20 SECONDS', 'THE GREAT BLACKOUT', 'THE SHELL OF DARKNESS'
T4, T5, T6, T7, T8, TE = 'LIGHTS OUT · 0°C', 'MINUS 20°C', 'MINUS 70°C', 'MINUS 240°C', "WHO'S STILL HERE?", 'THE GOOD NEWS'
DAY = '#7fc0ff'

# ------------------------------------------------------------------ cold open (bright noon page until the Sun goes)
shot('s1', T0, [], [sky('sky', lv((0, 1))), kit(F, 'town', 'town', .36, .88, .8, w=1.1, h=.5, level=lv((0, 0))),
                    sun('sun', .7, .32, .14, opacity=track((0, 1), (A('gone', -1), 1), (plus(A('gone'), 8), .6))),
                    kit(F, 'ghost', 'orbit-ring', .7, .32, .36, color=DAYTXT, opacity=show_from(A('gone'))),
                    clock_t('clock', .14, .4, .24, [(0, 0, False)])],
     [Note('already gone.', A('gone'), 'title', pos=(1340, 640), color=DAYTXT)], cam='push', day=True)
shot('s2', None, [arka(x=.32, poses=[(0, 'point-right')], faces=[(0, 'grin')])], [sky('sky', lv((0, 1))), sun('sun', .7, .32, .12)],
     [Note('getting a tan!', A('tan'), 'title', pos=(1340, 640), color=DAYTXT)])
shot('s3', T0, [], [sun('sun', .22, .5, .12), earth('earth', .78, .5, .08), pulse('light', .5, .5, .99, A('left'), A('ago'))],
     [Note('a ghost', A('ghost'), 'title', pos=(W / 2, .24 * H)), Note('light left 8 min 20 s ago', A('eight'), 'note', pos=(W / 2, .68 * H)),
      Note('no way of knowing', A('knowing'), 'small', pos=(W / 2, .78 * H))])
shot('s4', T0, [], [sun('sun', .3, .5, .16, opacity=track((0, 1), (A('disappears', -1), 1), (A('disappears'), 0), (A('back', -1), 0), (A('back'), 1))),
                    kit(F, 'ghost', 'orbit-ring', .3, .5, .32, opacity=track((0, 0), (A('disappears', -1), 0), (A('disappears'), 1), (A('back', -1), 1), (A('back'), 0))),
                    clock_t('clock', .68, .42, .34, [(0, 0, False), (A('disappears'), 0, True), (A('back', -2), 500, False)])],
     [Note('the experiment', A('experiment'), 'note', pos=(.3 * W, .22 * H)), Note('gone for 8 min 20 s', A('exactly'), 'title', pos=(.3 * W, .8 * H)),
      Note('then back', A('back'), 'note', pos=(.3 * W, .9 * H))])
shot('s5', T0, [], earth_lit('earth', .26, .55, .17, dark=A('out')) + [sun('sun', .84, .42, .09, opacity=show_from(A('back'))),
                    clock_t('clock', .55, .4, .22, [(0, 500, False)], opacity=show_from(A('out')))],
     [Note('the twist', A('twist'), 'note', pos=(.6 * W, .18 * H)), Note('lights out on Earth: 12:08:20', A('out'), 'note', pos=(.6 * W, .76 * H)),
      Note('...the Sun is already back', A('back'), 'title', pos=(.6 * W, .87 * H))], cam='push')
shot('s6', None, [arka(x=.32, poses=[(0, 'think')], faces=[(0, 'shocked')])], [kit(F, 'q', 'question', .66, .45, .24)],
     [Note('not gone anymore?', A('anymore'), 'title', pos=(1320, 800))])
STING = plus(A('sky', edge='end'), 8)   # the brand sting starts right after the hook (docs/EPISODE_VISUAL_LESSONS.md)
sting_chars, sting_props, sting_notes, sting_sounds = brand_sting(STING, W, H)
Q, FALL = A('question'), A('fall')
LAMP = lv((0, 0), (A('darkness'), 0), (plus(A('darkness'), 1), 1))
shot('s7', None, sting_chars, [kit(F, 'town', 'town', .3, .88, .78, w=1.1, h=.5, level=LAMP, opacity=show_until(Q)),
                    Prop(prop('lamp1', 'streetlight', .06, .76, .3, level=LAMP, opacity=show_until(Q))), Prop(prop('lamp2', 'streetlight', .56, .76, .3, level=LAMP, opacity=show_until(Q))),
                    clock_t('clock', .76, .4, .32, [(0, 500, False), (A('darkness'), 500, True), (plus(Q, -8), 1000, False)], opacity=show_until(Q)),
                    kit(F, 'ghost', 'orbit-ring', .72, .26, .26, opacity=window(Q, STING)), kit(F, 'q', 'question', .72, .26, .13, opacity=window(Q, FALL)),
                    Prop(prop('snow', 'snowfall', .72, .6, .55, count=30, level=lv((0, 0), (plus(FALL, -2), 0), (FALL, 1)), opacity=show_until(STING))),
                    Prop(prop('ice', 'ice-layer', .72, .93, .27, level=lv((0, 0), (FALL, 0), (plus(FALL, 40), .7)), opacity=show_until(STING)))] + sting_props,
     [Note('still 8 min 20 s of dark', A('still'), 'note', pos=(.3 * W, .3 * H), until=Q), Note('what if it never came back?', Q, 'note', pos=(.3 * W, .42 * H), until=STING),
      Note('even the air would fall', FALL, 'title', pos=(.3 * W, .56 * H), until=STING),
      Note('(millions of years later)', plus(FALL, 6), 'small', pos=(.3 * W, .66 * H), until=STING)] + sting_notes,
     sounds=sting_sounds)

# ------------------------------------------------------------------ chapter 1: 8 minutes, 20 seconds
shot('s8', T1, [], [sun('sun', .22, .5, .12), earth('earth', .78, .5, .07), span('dist', .5, .64, .99, '150,000,000 km', A('hundred')),
                    pulse('light', .5, .5, .99, A('needs'), A('gap'))],
     [Note('why the delay?', A('delay'), 'note', pos=(W / 2, .22 * H)), Note('light: 8 min 20 s', A('eight'), 'title', pos=(W / 2, .78 * H)),
      Note('(sped up)', A('needs'), 'small', pos=(W / 2, .88 * H))])
shot('s9', T1, [], [kit(F, 'ring', 'orbit-ring', .36, .55, .62), sun('sun', .36, .55, .1, opacity=show_until(A('vanished'))),
                    earth('earth', .36 + .31 * H / W, .55, .06, x=track((0, 0), (A('circling'), 0), (A('happened'), -60, 'smoothstep')), y=track((0, 0), (A('circling'), 0), (A('happened'), -150, 'smoothstep')))],
     [Note('gravity is just as slow', A('Gravity'), 'title', pos=(.74 * W, .3 * H)), Note('still circling the empty spot', A('spot'), 'note', pos=(.74 * W, .42 * H)),
      Note('still moving: ~15,000 km', A('happened'), 'small', pos=(.74 * W, .54 * H)), Note('in 8 min 20 s', A('happened'), 'small', pos=(.74 * W, .62 * H))])
shot('s10', None, [arka(x=.3, poses=[(0, 'cheer')], faces=[(0, 'grin')])], [kit(F, 'ring', 'orbit-ring', .68, .5, .4)],
     [Note('invisible partner', A('partner'), 'title', pos=(1300, 820))])
shot('s11', T1, [], [sun('sun', .22, .5, .1, opacity=show_until(A('go'))), kit(F, 'ghost', 'orbit-ring', .22, .5, .2, opacity=show_from(A('go'))),
                     earth('earth', .78, .5, .07), kit(F, 'ml', 'motion-lines', .78, .62, .1, rotation=90),
                     Prop(prop('rope', 'rope', .5, .5, .99, color='#e8d9b0', level=lv((0, 0), (A('travel'), 0), (A('light'), 1)))),
                     pulse('light', .5, .36, .99, A('travel'), A('light'))],
     [Note('a ball on a string', A('string'), 'note', pos=(W / 2, .2 * H)), Note('light', A('travel'), 'label', pos=(W / 2, .31 * H)),
      Note('the news (gravity)', A('travel'), 'label', pos=(W / 2, .57 * H)), Note("doesn't go slack at once", A('slack'), 'note', pos=(W / 2, .72 * H)),
      Note('no faster than light', A('faster'), 'title', pos=(W / 2, .85 * H))])
shot('s12', T1, [], [kit(F, 'cal', 'calendar', .26, .5, .3, text='1915'), kit(F, 'cal2', 'calendar', .5, .5, .3, text='2017', **pop_in(A('2017'), (.5 * W, .5 * H)))],
     [Note('Einstein predicted it', A('Einstein'), 'note'), Note('2017: we checked', A('checked'), 'title')])
shot('s13', T1, [], [disc('s1', .2, .4, .05, '#e6ecff', ('#ffffff',), shade=.1, x=track((0, 0), (A('collided', -12), 0), (A('collided'), 90, 'ease-in-back')), opacity=show_until(plus(A('collided'), 2))),
                     disc('s2', .32, .4, .05, '#e6ecff', ('#ffffff',), shade=.1, x=track((0, 0), (A('collided', -12), 0), (A('collided'), -90, 'ease-in-back')), opacity=show_until(plus(A('collided'), 2))),
                     kit(F, 'boom', 'impact', .26, .4, .3, count=10, level=lv((0, .8)), **pop_in(A('collided'), (.26 * W, .4 * H))),
                     pulse('g', .57, .44, .96, A('raced'), A('arrived'), color='#9fb8ff'), pulse('l', .57, .56, .96, A('raced'), plus(A('arrived'), 2)),
                     earth('earth', .88, .5, .06)],
     [Note('130 million light-years', A('hundred'), 'small', pos=(.26 * W, .62 * H)), Note('gravity ripple', A('raced'), 'label', pos=(.57 * W, .37 * H)),
      Note('flash of light', A('raced'), 'label', pos=(.57 * W, .64 * H)), Note('< 2 seconds apart', A('less'), 'title', pos=(.5 * W, .86 * H))], sounds=[('pop', A('collided'), -20)])
shot('s14', T1, [], [kit(F, 'eq', 'sign', .32, .5, .4, w=1.8, h=1.0, text='LIGHT = GRAVITY')],
     [Note('same speed', A('speed'), 'title'), Note('feel it go when we see it go', A('go'), 'note'), Note('and come back together', A('back'), 'note')])

# ------------------------------------------------------------------ chapter 2: the great blackout
shot('s15', T2, [], earth_lit('earth', .28, .55, .2, dark=A('dark')) + [sun('sun', .88, .36, .06, opacity=show_until(A('vanishes'))),
                     clock_t('clock', .66, .5, .28, [(0, 0, False), (A('vanishes'), 0, True), (A('Then'), 500, False)])],
     [Note('noon: the Sun vanishes', A('vanishes'), 'note', pos=(.66 * W, .2 * H)), Note('nothing happens...', A('nothing'), 'note', pos=(.66 * W, .29 * H)),
      Note('the whole day side goes dark', A('dark'), 'title', pos=(.6 * W, .9 * H))], cam='push')
shot('s16', T2, [], [photo(ep, F, 'photo-eclipse', 'nasa/inserts/photo-eclipse.png', 0, x=.3, y=.5, scale=.62, box=(.1, .2, .5, .8))]
     + earth_lit('earth', .78, .52, .13, dark=A('blackout')),
     [Note('2017 total eclipse (NASA/Aubrey Gemignani)', 2, 'small', pos=(.3 * W, .88 * H)), Note('max ~7.5 min, a narrow strip', A('seven'), 'note', pos=(.74 * W, .26 * H)),
      Note('blackout: half of Earth', A('blackout'), 'title', pos=(.74 * W, .8 * H))])
COOL = A('cool')
NIGHTFALL = lv((0, 0), (plus(COOL, 10), 0), (plus(COOL, 11), 1))
shot('s17', T2, [], [sky('sky', lv((0, .5), (COOL, .5), (plus(COOL, 30), 0))), kit(F, 'town', 'town', .55, .9, .7, w=1.1, h=.5, level=NIGHTFALL),
                     Prop(prop('lamp1', 'streetlight', .3, .78, .28, level=NIGHTFALL)), Prop(prop('lamp2', 'streetlight', .86, .78, .28, level=NIGHTFALL)),
                     disc('venus', .78, .24, .02, '#fff4c8', ('#ffffff',), shade=.05, opacity=show_from(plus(COOL, 24))),
                     thermo('th', .1, .45, .4, lv((0, .62), (A('dropped'), .62), (plus(A('dropped'), 40), .5)))],
     [Note('2017 eclipse, USA', A('2017'), 'small', pos=(.42 * W, .2 * H)), Note('-3 to 4°C in minutes', A('three'), 'title', pos=(.42 * W, .31 * H)),
      Note('now: half the world', A('half'), 'note', pos=(.42 * W, .42 * H)), Note('Venus', plus(COOL, 24), 'label', pos=(.78 * W, .3 * H)),
      Note('streetlights switch on', plus(COOL, 14), 'small', pos=(.86 * W, .5 * H))])
GONE = A('disappeared')
shot('s18', T2, [], [sky('sky', lv((0, .5), (GONE, .5), (plus(GONE, 10), 0))), sun('sun', .86, .22, .05, opacity=show_until(GONE)),
                     kit(F, 'fl', 'flower', .3, .64, .55), bee_flying('b1', .26, .5, .12, 300, -160, GONE), bee_flying('b2', .34, .49, .12, 420, -60, plus(GONE, 4)),
                     bee_flying('b3', .3, .44, .12, 220, -260, plus(GONE, 8)), Prop(prop('buzz', 'smell-lines', .44, .3, .14, opacity=show_until(A('silent'))))],
     [Note('microphones in flowers', A('microphones'), 'small', pos=(.66 * W, .24 * H)), Note('bees went silent', A('silent'), 'title', pos=(.66 * W, .48 * H)),
      Note('stopped flying', A('flying'), 'note', pos=(.66 * W, .58 * H)), Note('Galen et al. 2018', A('flying'), 'small', pos=(.66 * W, .68 * H))])
shot('s19', None, [arka(x=.3, poses=[(0, 'hands-on-hips')], faces=[(0, 'smug')])],
     [kit(F, 'fl', 'flower', .66, .62, .45), kit(F, 'b1', 'bee', .62, .5, .1, level=lv((0, 0))), kit(F, 'b2', 'bee', .69, .5, .1, level=lv((0, 0))),
      kit(F, 'b3', 'bee', .66, .45, .1, level=lv((0, 0))), kit(F, 'sign', 'sign', .84, .68, .3, w=1.8, h=1.0, text='ON STRIKE', **pop_in(A('strike'), (.84 * W, .7 * H)))],
     [Note('bees on strike.', A('strike'), 'title', pos=(1320, 200))])
shot('s20', T2, [], earth_lit('earth', .3, .55, .17, dark='always') + [moon('moon', .66, .4, .2, level=lv((0, 1), (A('out', -1), 1), (A('out'), 0)))],
     [Note('the night side', A('night'), 'small'), Note('the Moon goes out', A('out'), 'title'), Note('it only reflects sunlight', A('reflected'), 'note')])
shot('s21', T2, [], [kit(F, 'ring', 'orbit-ring', .3, .55, .5), earth('earth', .3 + .25 * H / W, .55, .06, y=track((0, 0), (A('straight'), 0), (plus(A('straight'), 60), -120, 'linear'))),
                     kit(F, 'ml', 'motion-lines', .3 + .25 * H / W, .62, .12, rotation=90, opacity=show_from(A('straight')))],
     [Note('drifts in a straight line', A('straight'), 'note'), Note('~740 m off course', A('seven'), 'title'), Note('almost nothing', A('nothing'), 'small')])
shot('s22', T2, [], earth_lit('earth', .24, .55, .15, dark='always', relight=A('back')) + [
                     clock_t('clock', .76, .3, .22, [(0, 1000, False)], opacity=show_from(A('sixteen'))),
                     moon('moon', .52, .35, .14, level=lv((0, 0), (A('reappears', -1), 0), (A('reappears'), 1))),
                     kit(F, 'bee', 'bee', .66, .62, .14, level=lv((0, 0), (A('bees'), 1)), x=track((0, 0), (A('bees'), 0), (plus(A('bees'), 40), 120, 'smoothstep')))],
     [Note('16 min 40 s: light returns', A('sixteen'), 'title', pos=(.6 * W, .84 * H)), Note('the Moon reappears', A('reappears'), 'note', pos=(.52 * W, .18 * H)),
      Note('bees back to work', A('work'), 'note', pos=(.72 * W, .72 * H))])

# ------------------------------------------------------------------ chapter 3: the shell of darkness
shot('s23', T3, [], [sun('sun', .3, .55, .08), Prop(prop('shell', 'shell', .3, .55, .95, count=7, level=lv((0, .1), (A('racing'), .9), (plus(A('racing'), 60), 1)))), earth('earth', .62, .55, .04)],
     [Note('a ripple in a pond', A('ripple'), 'note'), Note('a hollow shell of darkness', A('shell'), 'title'), Note('at light speed', A('racing'), 'small')])
shot('s24', T3, [], [Prop(prop('shell', 'shell', .22, .55, 1.0, count=40, level=lv((0, .2), (A('deep'), .62)))), sun('sun', .22, .55, .07), earth('earth', .22 + .31 * H / W, .55, .04)],
     [Note("and it's thick", A('thick'), 'note'), Note('150 million km deep', A('hundred'), 'title'), Note('= Sun to Earth', A('distance'), 'note')])
JUP = A('Jupiter')
SAT, URA = plus(JUP, 25), plus(JUP, 50)
SHELL = [(0, .01), (A('Mars'), .24), (JUP, .41), (SAT, .56), (URA, .71), (A('Neptune'), .86), (A('night'), .9)]   # x distance from the Sun / frame width
PLANETS = [('mer', 'Mercury 3 min', .1, .02, '#a39a92', ('#8c847d',), 18), ('ven', 'Venus 6 min', .15, .024, '#e8d49a', ('#f2e2b0',), 37),
           ('ear', 'Earth 8 min', .21, .025, EARTH, (EARTH_LAND, EARTH), 60), ('mar', 'Mars 13 min', .28, .022, '#c4501f', ('#d9703f',), A('Mars')),
           ('jup', 'Jupiter 43 min', .45, .06, '#d9a066', ('#b5835a', '#e8c49a', '#c98f5a'), JUP), ('sat', 'Saturn 1 h 20', .6, .048, '#e3c98f', ('#cdb27a', '#eedcab'), SAT),
           ('ura', 'Uranus 2 h 40', .75, .034, '#8fd3e0', ('#a6e0ea',), URA), ('nep', 'Neptune 4 h', .9, .034, '#3f6fd6', ('#5a8ae8',), A('Neptune'))]
shot('s25', T3, [], [sun('sun', .04, .55, .06), Prop(prop('shell', 'shell', .04, .55, 1.0, count=24, direction='out', level=lv(*SHELL), rotation=0))]   # band = Sun-Earth distance in this drawing
     + [disc(pid, px, .55, r, base, bands, seed=i + 3, opacity=dim(at)) for i, (pid, _, px, r, base, bands, at) in enumerate(PLANETS)]
     + [Prop(prop('nts', 'caption', .88, .2, .16, text='not to scale', color='#c9d3ea'))],
     [Note('Mercury 3 · Venus 6 · Earth 8 min', 18, 'label', pos=(.16 * W, .68 * H))]
     + [Note(label, at, 'label', pos=(px * W, (.76 if i % 2 == 0 else .68) * H)) for i, (_, label, px, _r, _b, _bd, at) in enumerate(PLANETS[3:])]
     + [Note('each gets an 8-minute night', A('night'), 'title', pos=(.55 * W, .9 * H))])
shot('s26', T3, [], [kit(F, 'probe', 'probe', .34, .55, .45), sun('star', .82, .35, .025, opacity=track((0, 1), (A('missing', -1), 1), (A('missing'), 0)))],
     [Note('Voyager 1: one light-day away', A('light-day'), 'title'), Note('the Sun: just a bright star', A('star'), 'note'), Note('gone for 8 minutes', A('missing'), 'note')])
shot('s27', None, [arka(x=.3, poses=[(0, 'shrug')], faces=[(0, 'smug')])], [kit(F, 'probe', 'probe', .68, .5, .32)],
     [Note('last to find out', A('out'), 'title', pos=(1300, 820))])
shot('s28', T3, [], [sun('sun', .3, .55, .08), Prop(prop('shell', 'shell', .3, .55, 1.0, count=4, level=lv((0, .7), (80, 1)), opacity=track((0, 1), (A('forever'), .3, 'smoothstep'))))],
     [Note('fainter and fainter', A('fainter'), 'note'), Note('back to normal', A('normal'), 'note')])
shot('s29', T3, [], [sun('sun', .5, .5, .16, opacity=show_until(A('back')))],
     [Note("let's not bring it back", A('back'), 'title', color=WARN, pos=(W / 2, .82 * H))], cam='push')

# ------------------------------------------------------------------ chapter 4: lights out (0 C)
shot('s30', T4, [], earth_lit('earth', .3, .55, .2, dark=A('out'), lights_on=A('everywhere')),
     [Note('the lights go out', A('out'), 'note'), Note('...and stay out', A('stay'), 'title'), Note('night everywhere', A('everywhere'), 'note')], cam='push')
FADE = A('fade')
shot('s31', T4, [], [moon('moon', .26, .45, .22, level=lv((0, 1), (A('dark'), 0))),
                     disc('ven', .56, .3, .02, '#f2e2b0', ('#e8d49a',), seed=5, opacity=track((0, 1), (FADE, 1), (plus(FADE, 10), 0, 'smoothstep'))),
                     disc('mars', .66, .5, .02, '#c4501f', ('#d9703f',), seed=4, opacity=track((0, 1), (plus(FADE, 14), 1), (plus(FADE, 24), 0, 'smoothstep'))),
                     disc('jup', .78, .32, .03, '#d9a066', ('#b5835a', '#e8c49a'), seed=6, opacity=track((0, 1), (plus(FADE, 28), 1), (plus(FADE, 38), 0, 'smoothstep'))),
                     disc('sat', .88, .52, .024, '#e3c98f', ('#cdb27a',), seed=7, opacity=track((0, 1), (plus(FADE, 42), 1), (plus(FADE, 52), 0, 'smoothstep')))],
     [Note('the Moon stays dark', A('stays'), 'note', pos=(.26 * W, .78 * H)), Note('the planets fade, one by one', FADE, 'note', pos=(.72 * W, .7 * H)),
      Note('only the stars', A('stars'), 'title', pos=(.6 * W, .86 * H))])
shot('s32', None, [arka(x=.3, poses=[(0, 'panic')], faces=[(0, 'scared')])],
     [Prop(prop('frost', 'frost', .3, .86, .22, count=10, level=lv((0, .8)))),
      clock_t('clock', .68, .42, .3, [(0, 500, False), (A('go'), 500, True), (A('version'), 380, False), (plus(A('version'), 1), 500, False)])],
     [Note('back to 8 minutes, please?', A('please'), 'title', pos=(1240, 860))])
shot('s33', T4, [], [kit(F, 'ring', 'orbit-ring', .3, .55, .6),
                     Prop(prop('rope', 'rope', .3 + .15 * H / W, .55, .3, direction='out', level=lv((0, 0), (A('snaps'), 0), (plus(A('snaps'), 16), 1)))),
                     earth('earth', .3 + .3 * H / W, .55, .06, y=track((0, 0), (A('snaps'), 0), (A('second'), -380, 'linear'))),
                     kit(F, 'ml', 'motion-lines', .3 + .3 * H / W, .66, .14, rotation=90, opacity=show_from(A('snaps')))],
     [Note('the rope snaps', A('snaps'), 'title'), Note('a straight line', A('straight'), 'note'), Note('30 km per second', A('thirty'), 'note'), Note('London → New York in 3 minutes', A('second'), 'small')])
shot('s34', T4, [], [earth('earth', .34, .55, .12, x=track((0, 0), (200, 120, 'linear'))), moon('moon', .5, .4, .1, lit=0, x=track((0, 0), (200, 120, 'linear')))],
     [Note('the Moon comes with us', A('us'), 'title'), Note('a dark companion', A('companion'), 'note')])
shot('s35', T4, [], [earth('earth', .2, .55, .06), sun('star', .9, .45, .02),
                     kit(F, 'cnt', 'counter', .55, .7, .22, text='thousand years', values=[{'frame': 0, 'value': 0}, {'frame': A('forty'), 'value': 0, 'ramp': True}, {'frame': plus(A('forty'), 40), 'value': 40}])],
     [Note('the nearest star', A('star'), 'note'), Note('40,000+ years', A('forty'), 'title'), Note('8 × all of written history', A('years'), 'small')])
shot('s36', T4, [], [kit(F, 'clock', 'clock', .26, .5, .3, level=lv((0, 1)), text='24 h days'), kit(F, 'cal', 'calendar', .5, .5, .26, text='YEAR'),
                     kit(F, 'x', 'cross', .5, .5, .3, **pop_in(A('years'), (.5 * W, .5 * H)))],
     [Note('days keep ticking', A('tick'), 'note'), Note('no sunrise, no sunset', A('sunset'), 'note'), Note('no more years', A('years'), 'title')])
shot('s37', None, [arka(x=.3, poses=[(0, 'cheer')], faces=[(0, 'grin')])], [kit(F, 'cal', 'calendar', .68, .5, .24, text='AGE')],
     [Note('forever young!', A('take'), 'title', pos=(1300, 300))])
shot('s38', T4, [], [kit(F, 'ghost', 'orbit-ring', .1, .5, .12), Prop(prop('bulge', 'tide-bulge', .45, .55, .3, level=lv((0, 1), (A('shrink'), 1), (plus(A('shrink'), 30), .55)))),
                     earth('earth', .45, .55, .15), moon('moon', .8, .55, .1)],
     [Note('~1/3 of the tide pull: the Sun', A('third'), 'note', pos=(W / 2, .2 * H)), Note('tides shrink', A('shrink'), 'title', pos=(W / 2, .82 * H)),
      Note('only the Moon tide left', A('disappears'), 'small', pos=(W / 2, .9 * H))])

# ------------------------------------------------------------------ chapter 5: minus 20 C
shot('s39', T5, [], [earth('earth', .3, .55, .18), thermo('th', .62, .55, .45, lv((0, .62), (A('cold'), .62), (plus(A('cold'), 50), .5)))],
     [Note('a warm planet', A('warm'), 'note'), Note('the cold arrives fast', A('fast'), 'title')])
shot('s40', T5, [], [thermo('th', .26, .55, .5, lv((0, .6), (A('twenty'), .45), (A('freezing'), .3)), color=ICE),
                     kit(F, 'cal', 'calendar', .5, .5, .24, text='72h')],
     [Note('-20°C a day', A('twenty'), 'title'), Note('below freezing in 2-3 days', A('freezing'), 'note'), Note('M. Summers, George Mason U.', A('scientist'), 'small')])
shot('s41', T5, [], [kit(F, 'o2', 'bar', .3, .5, .6, w=1.0, h=.4, level=lv((0, .95)), text='oxygen', color='#9fe0c0')],
     [Note('the air lasts', A('time'), 'note'), Note('~2 million years', A('two'), 'title')])
shot('s42', None, [arka(x=.3, poses=[(0, 'shrug')], faces=[(0, 'puffed')])], [thermo('th', .68, .5, .4, lv((0, .25)), color=ICE)],
     [Note('freeze while breathing', A('breathing'), 'title', pos=(1240, 820))])
shot('s43', T5, [], [kit(F, 'fl', 'flower', .28, .64, .5, rotate=track((0, 0), (A('die'), 0), (plus(A('die'), 30), 35, 'smoothstep')), anchor={'x': .28 * W, 'y': .64 * H + .3 * H})],
     [Note('photosynthesis stops', A('photosynthesis'), 'title'), Note('most plants: weeks', A('weeks'), 'note')])
shot('s44', T5, [], [kit(F, 'tree', 'tree', .3, .58, .7, level=lv((0, 1), (A('decades'), .45)))],
     [Note('big trees survive', A('survivors'), 'note'), Note('sugar stores', A('sugar'), 'note'), Note('decades, in the dark', A('decades'), 'title')])
shot('s45', None, [arka(x=.3, poses=[(0, 'point-right')], faces=[(0, 'grin')])], [kit(F, 'tree', 'tree', .68, .55, .5, level=lv((0, .5)))],
     [Note('snack stash!', A('stash'), 'title', pos=(1300, 260))])
SUNLIGHT = A('sunlight')
shot('s46', T5, [], [sun('sun', .1, .5, .07), kit(F, 'x', 'cross', .1, .5, .16, **pop_in(SUNLIGHT, (.1 * W, .5 * H))), arrow('a1', .2, .5, .1, 6),
                     kit(F, 'fl', 'flower', .3, .56, .34, opacity=track((0, 1), (plus(SUNLIGHT, 10), 1), (plus(SUNLIGHT, 20), .3))), arrow('a2', .42, .5, .1, A('eats')),
                     kit(F, 'z', 'zebra', .55, .5, .28, w=1.2, h=.9, opacity=track((0, 1), (plus(SUNLIGHT, 20), 1), (plus(SUNLIGHT, 30), .3))), arrow('a3', .68, .5, .1, A('eats', n=2)),
                     kit(F, 'l', 'lion', .8, .5, .28, w=1.2, h=.8, opacity=track((0, 1), (plus(SUNLIGHT, 30), 1), (plus(SUNLIGHT, 40), .3)))],
     [Note('food chains start with sunlight', SUNLIGHT, 'title', pos=(W / 2, .78 * H)), Note('the cold is only starting', A('started'), 'note', pos=(W / 2, .88 * H))])

# ------------------------------------------------------------------ chapter 6: minus 70 C
shot('s47', T6, [], [thermo('th', .26, .55, .55, lv((0, .3), (A('seventy'), .15)), color=ICE), kit(F, 'cal', 'calendar', .48, .5, .24, text='1yr')],
     [Note('-70°C', A('minus'), 'title'), Note("colder than Siberia's coldest night", A('Siberia'), 'note')])
shot('s48', T6, [], [kit(F, 'ice', 'ice-cutaway', .24, .62, .42, w=2.0, h=1.0, level=lv((0, 0)))],
     [Note('ponds: a week', A('week'), 'note'), Note('lakes: months', A('months'), 'note'), Note('oceans freeze from the top', A('top'), 'title', pos=(.75 * W, .62 * H))])
shot('s49', T6, [], [kit(F, 'ice', 'ice-cutaway', .24, .62, .42, w=2.0, h=1.0, level=lv((0, 0)))],
     [Note('ice = a blanket', A('blanket'), 'title'), Note('liquid underneath', A('liquid'), 'note')])
shot('s50', None, [arka(x=.3, poses=[(0, 'hands-on-hips')], faces=[(0, 'smug')])], [kit(F, 'ice', 'ice-cutaway', .68, .58, .45, w=1.2, h=.9, level=lv((0, 0)))],
     [Note('same, honestly.', A('honestly'), 'title', pos=(1300, 260))])
shot('s51', T6, [], [kit(F, 'vent', 'vent', .26, .6, .5, count=6, level=lv((0, 1)))],
     [Note("the planet's own heat", A('heat'), 'note'), Note('liquid while volcanoes run', A('running'), 'note'), Note('the strangest is to come', A('come'), 'title')])

# ------------------------------------------------------------------ chapter 7: minus 240 C
shot('s52', T7, [], [earth('earth', .3, .55, .18), disc('core', .3, .55, .05, '#ff8a3a', ('#ffb347', '#ff6a2a'), shade=.05, opacity=show_from(A('inside')))],
     [Note('millions of years', A('millions'), 'note'), Note('only heat from inside', A('inside'), 'title')])
shot('s53', T7, [], [thermo('th', .24, .55, .55, lv((0, .15), (A('forty'), .02)), color=ICE), kit(F, 'pluto', 'small-moon', .5, .5, .14, opacity=show_from(A('Pluto')))],
     [Note('-240°C', A('minus'), 'title'), Note('colder than Pluto', A('Pluto'), 'note')])
shot('s54', T7, [], [disc('frozen', .64, .5, .2, '#b9c9dc', ('#d7e2ee', '#9fb3cb', '#d7e2ee'), shade=.25,  # frozen Earth fills the opening beat, then gives way to the snow
                          opacity=track((0, 1), (plus(A('falls'), -1), 1), (plus(A('falls'), 18), 0))),
                     Prop(prop('snow', 'snowfall', .64, .5, .7, count=40, level=lv((0, 0), (A('falls', -2), 0), (plus(A('falls'), 20), 1)))),
                     Prop(prop('ice', 'ice-layer', .5, .95, .9, level=lv((0, 0), (A('ground'), 0), (plus(A('ground'), 40), .35))))],
     [Note('something eerie...', A('eerie'), 'note', pos=(.2 * W, .32 * H), until=A('freezes')), Note('the air freezes', A('freezes'), 'note', pos=(.2 * W, .32 * H)), Note('...and falls', A('falls'), 'title', pos=(.2 * W, .45 * H)),
      Note('nitrogen + oxygen snow', A('snow'), 'note', pos=(.2 * W, .58 * H)), Note('a frozen layer', A('layer'), 'small', pos=(.2 * W, .7 * H))], cam='push',
     sounds=[('whoosh', A('falls'), -22)])
shot('s55', None, [arka(x=.3, poses=[(0, 'cower')], faces=[(0, 'shocked')])], [Prop(prop('snow', 'snowfall', .66, .45, .6, count=24, level=lv((0, 1))))],
     [Note('no sky?!', A('sky'), 'title', pos=(1320, 820))])
shot('s56', T7, [], [Prop(prop('stars2', 'doodle-stars', .5, .5, .9, count=40)), Prop(prop('ice', 'ice-layer', .5, .95, .9, level=lv((0, .35))))],
     [Note('no sky. no wind.', A('wind'), 'title', pos=(W / 2, .4 * H)), Note('stars down to the ground', A('ground'), 'note', pos=(W / 2, .52 * H))])

# ------------------------------------------------------------------ chapter 8: who's still here?
shot('s57', T8, [], [kit(F, 'q', 'question', .3, .5, .3)], [Note('everything gone?', A('gone'), 'note'), Note('not quite.', A('quite'), 'title')])
shot('s58', T8, [], [kit(F, 'mush', 'mushroom', .3, .62, .5, count=4)],
     [Note('fungi feast on dead things', A('dead'), 'note'), Note('for a while', A('feast'), 'title')])
shot('s59', T8, [], [kit(F, 'tard', 'tardigrade', .3, .55, .5), kit(F, 'mag', 'magnifier', .52, .4, .2)],
     [Note('tardigrades', A('tardigrades'), 'title'), Note('~0.5 mm long', A('half'), 'small'), Note('frozen · radiation · space', A('space'), 'note'), Note('2007: 10 days in open space, and lived', A('space'), 'small')])
shot('s60', None, [arka(x=.3, poses=[(0, 'shrug')], faces=[(0, 'smug')])], [kit(F, 'tard', 'tardigrade', .68, .55, .3)],
     [Note('always the tardigrades.', A('always'), 'title', pos=(1240, 260))])
shot('s61', T8, [], [kit(F, 'vent', 'vent', .28, .7, .46, count=8, level=lv((0, 1))), kit(F, 'fish', 'fish', .52, .4, .1)],
     [Note('1977: deep-sea hot springs', A('1977'), 'note'), Note('tube worms, clams, shrimp', A('worms'), 'note'), Note('in total darkness', A('darkness'), 'title')])
shot('s62', T8, [], [kit(F, 'vent', 'vent', .16, .62, .36, count=6, level=lv((0, 1))), arrow('a1', .3, .52, .1, 6),
                     kit(F, 'bac', 'plankton', .42, .5, .34), arrow('a2', .55, .52, .1, A('bacteria')), kit(F, 'worm', 'coral', .7, .56, .26)],
     [Note('no sunlight needed', A('sunlight'), 'title', pos=(W / 2, .22 * H)), Note('vent', 4, 'label', pos=(.16 * W, .84 * H)),
      Note('bacteria', A('bacteria'), 'label', pos=(.42 * W, .7 * H)), Note('tube worms', A('chemicals'), 'label', pos=(.7 * W, .76 * H)),
      Note('energy from chemicals', A('chemicals'), 'note', pos=(.84 * W, .4 * H)),
      Note("today: Europa's ocean may hide vents like these", A('going'), 'small', pos=(W / 2, .9 * H))])
shot('s63', None, [arka(x=.3, poses=[(0, 'think')], faces=[(0, 'neutral')])], [kit(F, 'vent', 'vent', .68, .6, .4, count=6, level=lv((0, .8)))],
     [Note('...worms?', A('worms'), 'title', pos=(1320, 260))])
shot('s64', T8, [], [kit(F, 'gey', 'geyser', .22, .66, .36, level=lv((0, .6))), kit(F, 'bulb', 'bulb', .38, .44, .12, level=lv((0, 1)))],
     [Note('a few people underground', A('underground'), 'note'), Note('Iceland: geothermal', A('Iceland'), 'note'), Note('everything else: extinction', A('extinction'), 'title', color=WARN)])

# ------------------------------------------------------------------ ending
shot('s65', TE, [], [sun('sun', .3, .5, .18), kit(F, 'ok', 'check', .56, .56, .2, **pop_in(A('happen'), (.56 * W, .56 * H)))],
     [Note("this can't happen", A('happen'), 'title'), Note('mass does not just vanish', A('vanish'), 'note'), Note('4.6 billion years old · ~5 billion to go', A('four'), 'note')])
shot('s66', TE, [], [sun('sun', .14, .5, .1), earth('earth', .84, .5, .07), kit(F, 'beam', 'signal', .5, .5, .55, color='#fff6c8')],
     [Note('8 minutes', A('minutes'), 'note'), Note('150 million km', A('hundred'), 'note'), Note('right on time', A('time'), 'title')])
shot('s67', None, [arka(x=.3, poses=[(0, 'think')], faces=[(0, 'neutral')])],
     [earth('earth', .62, .55, .07), moon('moon', .74, .45, .08, x=track((0, 0), (A('leaving'), 0), (plus(A('leaving'), 60), 150, 'smoothstep')))],
     [Note('why is it leaving?', A('leaving', n=2), 'title', pos=(1300, 820))])
shot('s68', None, [], [moon('moon', .5, .45, .2)], [Note('next episode', A('episode'), 'title', pos=(W / 2, .78 * H))], cam='push')
shot('s69', None, [arka(x=.18, h=.4, poses=[(0, 'wave')], faces=[(0, 'grin')])],
     [kit(F, 'sub', 'sign', .5, .55, .3, w=1.8, h=1.0, text='SUBSCRIBE', **pop_in(A('Subscribe'), (.5 * W, .55 * H)))],
     [Note('GAHANARKA', 4, 'title', size=100, pos=(W / 2, 190), color=GOLD), Note('light in the unfathomable', 10, 'small', pos=(W / 2, 270)),
      Note('next: why is the Moon leaving?', A('it', edge='end'), 'note', size=84, pos=(W / 2, 370))])

# Text colour (docs/VISUAL_CHECKLIST.md): no red text on the night page. Titles and big numbers gold, handwritten notes sky blue.
for pl in ep.plans.values():
    for n in pl['notes']:
        if n.color in (YELLOW, WARN): n.color = YELLOW if n.kind == 'title' else NOTE_BLUE

LIGHT_INK = {'doodle-stars', 'counter', 'bar', 'bulb', 'question', 'thermometer', 'fish', 'crescent', 'orbit-ring', 'town', 'lion', 'zebra', 'tide-gauge',
             'clock', 'pressure-arrows', 'cross', 'ruler', 'check', 'small-moon', 'young-earth', 'probe', 'signal', 'calendar', 'motion-lines', 'magnifier',
             'bee', 'flower', 'tree', 'tardigrade', 'vent', 'mushroom', 'ice-cutaway', 'impact', 'geyser', 'span', 'arrow', 'streetlight', 'smell-lines', 'plankton', 'coral'}
for layer in [pr.layer for pl in ep.plans.values() for pr in pl['props']] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k.setdefault('ink', '#c9d3ea')

# One licensed track per chapter (YouTube Audio Library License, docs/MUSIC_SOURCES.md), a different order from Ep 4.
ep.music([('s1', 'assets/music/8-space-spaghettification.mp3', 0), ('s8', 'assets/music/1-curious-a-science-montage.mp3', 0),
          ('s15', 'assets/music/4-tense-a-false-vacuum-decay.mp3', 0, -2), ('s23', 'assets/music/6-space-event-horizon.mp3', 0),
          ('s30', 'assets/music/3-eerie-b-surface-of-the-moon.mp3', 0), ('s39', 'assets/music/1-curious-b-frame-dragging.mp3', 0),
          ('s47', 'assets/music/3-eerie-a-lake-jupiter.mp3', 0), ('s52', 'assets/music/8-space-laniakea.mp3', 0),
          ('s57', 'assets/music/2-playful-a-quirk-n-twerk.mp3', 0), ('s65', 'assets/music/5-uplifting-a-taking-flight.mp3', 0)],
         dropouts=[('s1', 0, 1.2), ('s15', 0, 1.0), ('s29', 0, 1.0), ('s54', 0, 1.0)], target_lufs=-16,
         # 22 Nov: louder music and the narrator treatment from Every Moon v2 (Debabrata: voice too close, music too quiet)
         gain_db=-17, duck_ratio=2, voice={'highpassHz': 95, 'lowMidDb': -4, 'presenceDb': 2, 'room': .08})

if __name__ == '__main__':
    board = ep.build()
    board['scenes'][-1]['durationFrames'] += END_CARD * FPS
    path = ROOT / 'storyboards/ghost-sun.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
