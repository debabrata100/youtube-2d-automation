"""E7 long episode (16:9): "What If Apophis Hit? Most Videos Get It Wrong".

Single source for the story script (stories/apophis.json), generated from the approved script in
stories/apophis-script.md (one shot per line; the markdown tables are parsed, so edit the script there).
Arka's 15 lines are already recorded (E3 take in jobs/e7-avt-e3/audio/takes/arka.*); they must stay word for word
so the take is reused with --resume and only the narrator is paid.

Usage:
  python3 scripts/authoring/plan-apophis.py --script-only [seconds]   # writes stories/apophis.json
  python3 scripts/authoring/plan-apophis.py [seconds]                 # also writes a placeholder storyboards/apophis.json

The storyboard starts as a placeholder (one Earth per shot) so the free narration dry run and paid synthesis can
validate; the real shots are designed after narration, on real timing (as for Ep 4 and Ep 5).
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT_MD = ROOT / 'stories/apophis-script.md'
STORY = ROOT / 'stories/apophis.json'
SPEAKERS = {'Narrator': 'narrator', 'Arka': 'arka'}


def clean(line):
    """Spoken text: drop markdown emphasis (*for*) so the voice gets plain words."""
    return re.sub(r'\*([^*]+)\*', r'\1', line).strip()


def read_shots():
    """(beat id, intent, [(speaker, text)]) for every script line, in order."""
    text = SCRIPT_MD.read_text().split('## Script', 1)[1].split('## On-screen', 1)[0]
    shots, chapter = [], ''
    for row in text.splitlines():
        h = re.match(r'^### (.*)', row)
        if h:
            chapter = h.group(1).lower(); continue
        m = re.match(r'^\| (a\d+[a-z]?) \| (Narrator|Arka) \| (.*) \|$', row)
        if not m: continue
        bid, who, line = m.groups()
        if chapter.startswith('cold open'): intent = 'hook'
        elif chapter.startswith('ending'): intent = 'closing' if bid in ('a52', 'a53') else 'payoff'
        else: intent = 'explanation'
        shots.append((bid, intent, [(SPEAKERS[who], clean(line))]))
    ids = [b for b, _, _ in shots]
    assert len(ids) == len(set(ids)), 'duplicate line id'
    nums = [int(re.match(r'a(\d+)', b).group(1)) for b in ids]
    assert nums == sorted(nums), 'script line ids must run in order'
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
        beats.append({'id': bid, 'sceneId': f'ap-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'apophis', 'title': 'What If Apophis Hit? Most Videos Get It Wrong',
             'topic': 'Myth-busting ride on asteroid 99942 Apophis during its 13 April 2029 flyby: the scary claims, low gravity, '
                      'the 2004 scare and its discoverers, passing inside the geostationary ring, tidal shivers, what a hit would really do '
                      '(regional, not global), the honest unknown about tsunamis, OSIRIS-APEX and RAMSES, two billion people watching',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/apophis.json', 'candidatesReport': 'stories/apophis-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    args = [a for a in sys.argv[1:] if a != '--script-only']
    s = write_story(int(args[0]) if args else 660)
    words = sum(len(b['narration'].split()) for b in s['beats'])
    per = {}
    for b in s['beats']:
        for sp, ph in zip(b['phraseSpeakers'], b['phrases']): per[sp] = per.get(sp, 0) + len(ph) + 1
    print('wrote', STORY.name, len(s['beats']), 'beats,', words, 'words,', sum(len(b['narration']) for b in s['beats']), 'characters', per)
    sys.exit(0)




# ------------------------------------------------------------------ storyboard (16:9, night sky), on the measured R1 + Arka E3 narration timing
# Narration: jobs/e7-narration-sting (the paid take cut with a 3.4 s brand-sting gap after a6; stories/apophis-sting-cut.json, 0 paid requests).
# Applies docs/EPISODE_VISUAL_LESSONS.md and the 23 Nov lessons: people first (named people get a figure and a name label),
# one verdict stamp per claim (MYTH / HALF TRUE / TRUE / WE DON'T KNOW), a source tag beside every number, a new picture every few seconds.
from recipes import *  # noqa: E402,F401,F403
import recipes  # noqa: E402
YELLOW, WARN = '#ffd25e', '#ff5a4a'
recipes.RED = YELLOW
recipes.INK = '#eef1f8'
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 597  # narration 582.2 s (with the 3.4 s sting gap) + 2.6 s tail + 12 s end card
END_CARD = 12
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.story['durationSeconds'] = DURATION - END_CARD
ep.theme = 'paint-night-gold'
ep.backdrop(stars=26)
ROCK, ROCK2 = '#9a948a', '#7f796f'
NOTE_BLUE, SRC, CLAIM = '#a9d8ff', '#c9d3ea', '#eef1f8'  # CLAIM: the quoted scary claims, plain white


def head(text):
    return Note(text, 0, 'header', pos=(W / 2, round(.085 * H)))


def src(text, at=6):
    """Hand-written source tag, bottom right, beside the answer it backs (credibility rule)."""
    return Note(text, at, 'small', size=44, pos=(round(.8 * W), round(.95 * H)), color=SRC)


def arka(x=.3, fy=.86, h=.5, poses=((0, 'stand'),), faces=((0, 'happy'),), **k):
    return Char('arka', 'arka', x=x, fy=fy, h=h, poses=list(poses), faces=list(faces), **k)


COATS = ['#c9d3ea', '#f4d6a0', '#a9d8ff', '#d7c3f0', '#bfe3c0']


def person(cid, x, fy=.86, h=.44, poses=((0, 'stand'),), faces=((0, 'neutral'),), coat=None, **k):
    """A real person in the story (never Arka): a stick figure in a light coat (visible on the night page); their name goes on a label note."""
    coat = coat or COATS[sum(map(ord, cid)) % len(COATS)]
    return Char(cid, 'stick', x=x, fy=fy, h=h, poses=list(poses), faces=list(faces), idle='breathe', accessories=[('coat', 0)], coat=coat, **k)


def lv(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def disc(pid, px, py, r, base, bands, shade=.2, seed=3, craters=0, **layer):
    return Prop(planet(pid, px, py, r, base, bands, craters=craters, shade=shade, seed=seed, **layer), Box((px - r * H / W) * W, (py - r) * H, (px + r * H / W) * W, (py + r) * H, pid))


def earth(pid, px, py, r, **layer):
    return disc(pid, px, py, r, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), **layer)


def apophis(pid, px, py, r, tumble=10, **layer):
    """Apophis as a lumpy two-lobed rubble pile (kit 'asteroid', ~1.7 times as long as it is wide), slowly tumbling.
    r: half its height as a fraction of the frame height (so it sits where a disc of radius r would)."""
    size = min(1.0, 2 * r)
    if tumble and 'rotate' not in layer:
        layer['rotate'] = track((0, -tumble / 2), (1800, tumble / 2, 'linear'))
        layer.setdefault('anchor', {'x': px * W, 'y': py * H})
    return kit(F, pid, 'asteroid', px, py, size, w=1.7, h=1.0, color=ROCK, **layer)


def surface():
    """Standing on Apophis: the rock's lumpy, boulder-strewn back fills the bottom of the frame (top edge near 85%)."""
    return kit(F, 'surface', 'asteroid', .5, 1.27, 1.0, w=1.7, h=1.0, color=ROCK)


def moon_disc(pid, px, py, r, **layer):
    return disc(pid, px, py, r, '#cfcabc', ('#b9b4a6',), seed=5, craters=4, **layer)


def odds(pid, px, py, size, keys, text='1 IN …', **layer):
    """Odds counter: keys = (frame, denominator)."""
    return kit(F, pid, 'counter', px, py, size, w=1.2, h=.9, text=text, values=[{'frame': f, 'value': v} for f, v in keys], **layer)


def star(pid, px, py, **layer):
    """Apophis seen from Earth: a bright gold point with a soft sparkle (both carry the same motion track)."""
    return [disc(pid + '-core', px, py, .02, '#fff1b0', ('#ffe27a',), shade=0, seed=2, **layer),
            kit(F, pid, 'sparkle', px, py, .08, count=4, color=YELLOW, level=lv((0, 1)), **layer)]


def cal(pid, px, py, size, text, at=0, **k):
    """A date: a calendar page for a year, a hand-lettered sign for anything longer (the calendar fits four characters)."""
    pop = pop_in(at, (px * W, py * H)) if at else {}
    if len(text) <= 4: return kit(F, pid, 'calendar', px, py, size, text=text, **pop, **k)
    return kit(F, pid, 'sign', px, py, size * .9, w=1.8, h=1.0, text=text, **pop, **k)


def shot(bid, chapter, chars=(), props=(), notes=(), cam='settle', sounds=(), stamps=()):
    """stamps: [(note index, anchor[, label])], counted among `notes` (the header is added in front automatically)."""
    off = 1 if chapter else 0
    ep.scene(bid, explain(list(chars), list(props), ([head(chapter)] if chapter else []) + list(notes), camera_preset=cam, sounds=list(sounds),
                          stamps=[(st[0] + off,) + tuple(st[1:]) for st in stamps]))


T0, T1, T2, T3 = 'FRIDAY 13 APRIL 2029', 'ON APOPHIS · ONE DAY OUT', 'THE 2004 SCARE', 'THROUGH THE SATELLITE RING'
T4, T5, T6, TE = 'WHAT IF IT HIT?', 'QUICK ROUND', "WHO'S FLYING WITH US", 'FROM YOUR BALCONY'

# ------------------------------------------------------------------ cold open: the claims, and the ride
shot('a1', T0, [], [earth('earth', .3, .58, .2), kit(F, 'geo', 'orbit-ring', .3, .58, .62, color=SRC),
                    kit(F, 'sat', 'station', .52, .3, .07),
                    apophis('apo', .86, .3, .035, x=track((0, 0), (A('pass'), 0), (A('signals', edge='end'), -380, 'smoothstep')), y=track((0, 0), (A('pass'), 0), (A('signals', edge='end'), 170, 'smoothstep')))],
     [Note('a skyscraper-sized rock', A('skyscraper'), 'title', pos=(1440, 760)), Note('closer than our TV satellites', A('closer'), 'note', pos=(1440, 870))], cam='push')
shot('a2', None, [], [earth('earth', .28, .55, .2), kit(F, 'boom', 'impact', .34, .45, .3, count=10, level=lv((0, .8)), **pop_in(A('wipes'), (.34 * W, .45 * H))),
                      kit(F, 'map', 'arrow', .28, .55, .44, rotation=-20, color=WARN, opacity=show_from(A('mapped')))],
     [Note('wipes out a continent?', A('wipes'), 'note', color=CLAIM), Note('ends the world?', A('ends'), 'note', color=CLAIM),
      Note('a wall of water?', A('wall'), 'note', color=CLAIM), Note('mapped where it lands?', A('mapped'), 'note', color=CLAIM)])
shot('a3', None, [arka(x=.4, poses=[(0, 'cower')], faces=[(0, 'scared')])], [kit(F, 'q', 'question', .68, .42, .2)], [])
shot('a4', None, [], [kit(F, 'x1', 'cross', .24, .36, .14, **pop_in(4, (.24 * W, .36 * H))), kit(F, 'x2', 'cross', .4, .36, .14, **pop_in(4, (.4 * W, .36 * H))),
                      kit(F, 'half', 'check', .24, .64, .14, **pop_in(A('half'), (.24 * W, .64 * H))), kit(F, 'star', 'exclaim', .4, .64, .14, **pop_in(A('interesting'), (.4 * W, .64 * H)))],
     [Note('mostly wrong', 4, 'title'), Note('some half right', A('half'), 'note'), Note('one part: better than the scary version', A('interesting'), 'note')])
shot('a5', None, [], [kit(F, 'mag', 'magnifier', .3, .5, .3), earth('earth', .3, .5, .08)],
     [Note('check every claim', A('check'), 'title'), Note('not from Earth...', A('watch'), 'note')], cam='push')
STING = plus(A('it', edge='end'), 24)  # 0.8 s after the line, inside the 3.4 s gap (anchors map onto the real timing; plain frames would stretch)
sting_chars, sting_props, sting_notes, sting_sounds = brand_sting(STING, W, H)
shot('a6', None, [arka(x=.3, poses=[(0, 'point-right')], faces=[(0, 'grin')], layer={'opacity': show_until(STING)})] + sting_chars,
     [apophis('apo', .68, .45, .16, opacity=show_until(STING))] + sting_props,
     [Note("we're going to ride it", 4, 'title', pos=(.68 * W, .82 * H), until=STING)] + sting_notes, sounds=sting_sounds)

# ------------------------------------------------------------------ chapter 1: standing on Apophis (T minus 24 hours)
shot('a7', T1, [arka(x=.3, h=.46, poses=[(0, 'float')], faces=[(0, 'happy')], enter=('pop', 4))],
     [surface(), earth('earth', .78, .32, .025), kit(F, 'len', 'span', .62, .62, .5, text='~450 m', level=lv((0, 0), (A('four'), 0), (plus(A('four'), 20), 1)))],
     [Note('Apophis', A('Apophis'), 'title'), Note('a bright blue dot', A('blue'), 'note', pos=(.78 * W, .42 * H))], cam='drift')
shot('a8', None, [arka(x=.42, h=.5, poses=[(0, 'stand'), (A('step'), 'walk')], faces=[(0, 'neutral')])], [surface(), earth('earth', .8, .3, .025)], [])
shot('a9', T1, [arka(x=.3, h=.46, poses=[(0, 'stand'), (A('hop'), 'float')], faces=[(0, 'neutral'), (A('forever'), 'shocked')],
                     layer={'y': track((0, 0), (A('hop'), 0), (A('forever'), -260, 'ease-out-cubic'))})],
     [surface(), earth('earth', .8, .28, .025)],
     [Note('gravity: 1/4,000,000 of Earth', A('quarter'), 'note'), Note('hop faster than 12 cm/s...', A('twelve'), 'note'),
      Note('...gone forever', A('forever'), 'title'), src('ESA mass + size, our maths', A('gravity'))])
shot('a10', None, [arka(x=.4, h=.5, poses=[(0, 'shrug')], faces=[(0, 'smug')])], [surface(), kit(F, 'mug', 'mug', .66, .55, .12)], [])
shot('a11', T1, [arka(x=.3, h=.46, poses=[(0, 'stand')], faces=[(0, 'happy')])],
     [surface(), Prop(prop('dust', 'snowfall', .6, .55, .5, count=24, color='#b8b2a6', level=lv((0, 0), (A('Dropped'), 0), (plus(A('Dropped'), 30), 1)))),
      kit(F, 'cable', 'rope', .5, .7, .5, color='#e8d9b0', opacity=show_from(A('cable')))],
     [Note('dust falls for minutes', A('drifts'), 'note'), Note('clipped to a cable', A('cable'), 'title')])

# ------------------------------------------------------------------ the 2004 scare (people first)
shot('a12', T2, [], [cal('cal', .22, .45, .24, 'DEC 2004'),
                     odds('odds', .5, .45, .26, [(0, 300), (A('reached'), 300), (A('thirty-seven'), 37)])],
     [Note('1 in 37', A('thirty-seven'), 'title'), Note('highest danger rating ever', A('highest'), 'note'), src('ESA · Torino scale, Dec 2004', A('rating'))])
shot('a12b', T2, [person('tucker', .12, h=.4, poses=[(0, 'point-right')], faces=[(0, 'happy')], enter=('pop', A('Roy'))),
                  person('tholen', .22, h=.38, poses=[(0, 'stand')], faces=[(0, 'happy')], enter=('pop', A('David'))),
                  person('bernardi', .32, h=.4, poses=[(0, 'stand')], faces=[(0, 'neutral')], enter=('pop', A('Fabrizio'))),
                  person('garradd', .52, h=.4, poses=[(0, 'think'), (A('worse'), 'scared')], faces=[(0, 'neutral'), (A('worse'), 'shocked')], enter=('pop', A('Gordon')))],
     [kit(F, 'q', 'question', .22, .38, .1, opacity=track((0, 0), (plus(A('lost'), -1), 0), (A('lost'), 1), (plus(A('Gordon'), -1), 1), (A('Gordon'), 0))),
      odds('odds', .8, .45, .22, [(0, 300), (A('sixty'), 60), (A('thirty-seven'), 37)])],
     [Note('Tucker · Tholen · Bernardi', A('Roy'), 'label', pos=(.22 * W, .3 * H)), Note('Arizona, June 2004', A('Arizona'), 'small', pos=(.22 * W, .22 * H)),
      Note('Gordon Garradd, Australia', A('Gordon'), 'label', pos=(.52 * W, .3 * H)), Note('the odds got worse', A('worse'), 'title', pos=(.8 * W, .78 * H))])
shot('a12c', T2, [], [kit(F, 'mag', 'magnifier', .3, .5, .32), apophis('dot', .27, .45, .02),
                      cal('ok', .66, .45, .24, '2029', at=A('trail')), kit(F, 'x', 'cross', .66, .45, .2, **pop_in(A('ruled'), (.66 * W, .45 * H)))],
     [Note('old photographs', A('photographs'), 'title'), Note('found hiding in older images', A('hiding'), 'note'), Note('2029 ruled out', A('ruled'), 'note')])
shot('a13', None, [arka(x=.36, poses=[(0, 'think')], faces=[(0, 'neutral')])], [cal('cal', .66, .42, .22, 'DEC 2004')], [])
shot('a14', None, [], [odds('odds', .5, .45, .24, [(0, 37)])], [Note('hold that thought', A('Hold'), 'title'), Note('back to the odds later', A('odds'), 'note')])

# ------------------------------------------------------------------ chapter 2: through the satellite ring
shot('a15', T3, [arka(x=.24, h=.4, poses=[(0, 'point-right')], faces=[(0, 'happy')])],
     [surface(), earth('earth', .66, .38, .04, scale=track((0, 1), (A('stopped'), 1), (plus(A('grow'), 12), 3, 'smoothstep')), anchor={'x': .66 * W, 'y': .38 * H})],
     [Note('one hour out', A('hour'), 'title')], cam='push')
shot('a16', T3, [], [earth('earth', .3, .55, .3), apophis('apo', .78, .4, .03),
                     kit(F, 'gap', 'span', .56, .48, .4, text='32,000 km', rotation=-10, level=lv((0, 0), (A('thirty-two'), 0), (plus(A('thirty-two'), 20), 1)))],
     [Note('19° across', A('nineteen'), 'title'), Note('= 38 full Moons', A('thirty-eight'), 'note'), src('our maths: 32,000 km', A('thirty-two'))])
shot('a17', None, [arka(x=.24, h=.4, poses=[(0, 'point-right')], faces=[(0, 'shocked')])], [surface(), earth('earth', .62, .3, .38)], [])
shot('a18', T3, [], [earth('earth', .07, .55, .22),
                     kit(F, 'iss', 'station', .3, .55, .06, **pop_in(A('station'), (.3 * W, .55 * H))),
                     kit(F, 'gps', 'probe', .5, .55, .06, **pop_in(A('GPS'), (.5 * W, .55 * H))),
                     kit(F, 'geo', 'signal', .74, .55, .1, **pop_in(A('geostationary'), (.74 * W, .55 * H)))],
     [Note('400 km', A('four'), 'label', pos=(.3 * W, .68 * H)), Note('20,000 km', A('twenty'), 'label', pos=(.5 * W, .68 * H)),
      Note('36,000 km', A('thirty-six'), 'label', pos=(.74 * W, .68 * H)), Note('the altitude ladder', A('ladder'), 'title', pos=(.5 * W, .26 * H))])
shot('a19', T3, [], [earth('earth', .3, .55, .2), kit(F, 'geo', 'orbit-ring', .3, .55, .66, color=SRC),
                     apophis('apo', .7, .2, .03, x=track((0, 0), (A('passing'), 0), (A('Moon'), -420, 'smoothstep')), y=track((0, 0), (A('passing'), 0), (A('Moon'), 320, 'smoothstep'))),
                     moon_disc('moon', .93, .55, .03)],
     [Note('inside the ring', A('inside'), 'title'), Note('1/10 of the way to the Moon', A('tenth'), 'note')])
shot('a20', None, [arka(x=.36, poses=[(0, 'cower')], faces=[(0, 'scared')])], [kit(F, 'sat', 'station', .68, .4, .1)], [])
shot('a21', T3, [], [earth('earth', .24, .55, .18), kit(F, 'geo', 'orbit-ring', .24, .55, .58, color=SRC), kit(F, 'sat', 'probe', .42, .3, .05)],
     [Note('smash into satellites?', A('smash'), 'title', color=CLAIM), Note('very unlikely', A('unlikely'), 'note'),
      Note('space is far emptier than drawings', A('emptier'), 'note'), src('USGS 2025', A('unlikely'))], stamps=[(0, A('unlikely'))])
shot('a22', T3, [], [kit(F, 'speed', 'speedometer', .26, .5, .3, level=lv((0, .3), (A('seven'), .3), (plus(A('seven'), 30), .9))),
                     kit(F, 'ml', 'motion-lines', .5, .5, .2)],
     [Note('7+ km every second', A('seven'), 'title'), Note('across India in 7 minutes', A('India'), 'note'), src('Pravec et al. 2014', A('pull'))])
shot('a23', None, [arka(x=.36, h=.5, poses=[(0, 'panic')], faces=[(0, 'scared')], layer={'x': track(*[(f, (-8 if i % 2 else 8)) for i, f in enumerate(range(0, 60, 3))] + [(60, 0)])})],
     [surface(), earth('earth', .72, .3, .3)], [])
shot('a24', T3, [], [earth('earth', .22, .5, .22), apophis('apo', .62, .5, .12),
                     kit(F, 'pull', 'pressure-arrows', .62, .5, .34, direction='in', color=SRC, opacity=show_from(A('harder')))],
     [Note('tear it apart?', A('tear'), 'title', color=CLAIM), Note("gravity changes only a few %", A('percent'), 'note')], stamps=[(0, A("won't"))])
shot('a25', T3, [], [apophis('apo', .3, .52, .2), kit(F, 'ml', 'motion-lines', .3, .52, .4, color=SRC, opacity=show_from(A('tumbling'))),
                     Prop(prop('slide', 'snowfall', .3, .45, .3, count=14, color='#b8b2a6', level=lv((0, 0), (A('landslides'), 0), (plus(A('landslides'), 20), 1))))],
     [Note('the tumbling changes', A('tumbling'), 'note'), Note('small landslides', A('landslides'), 'note'), Note('not destruction. a shiver.', A('shiver'), 'title')])
shot('a26', T3, [arka(x=.22, h=.38, poses=[(0, 'stand')], faces=[(0, 'shocked')])],
     [surface(), earth('earth', .62, .32, .4, scale=track((0, 1), (A('slowly'), 1), (plus(A('shrink'), 20), .35, 'smoothstep')), anchor={'x': .62 * W, 'y': .32 * H})],
     [Note('closest approach', 4, 'title', pos=(.82 * W, .78 * H))], cam='drift')

# ------------------------------------------------------------------ chapter 3: what if we were heading for that?
shot('a27', T4, [arka(x=.3, h=.46, poses=[(0, 'point-left'), (A('heading'), 'think')], faces=[(0, 'neutral'), (A('heading'), 'shocked')])],
     [surface(), earth('earth', .8, .3, .06)], [Note('what if it hit?', A('heading'), 'title')])
shot('a28', None, [arka(x=.3, poses=[(0, 'point-right')], faces=[(0, 'smug')])],
     [earth('earth', .66, .45, .16), kit(F, 'path', 'arrow', .66, .45, .38, rotation=-20, color=WARN, opacity=show_from(A('maps')))], [])
shot('a29', T4, [], [earth('earth', .28, .52, .2), kit(F, 'path', 'arrow', .28, .52, .46, rotation=-20, color=WARN)],
     [Note('the risk maps', 4, 'title', color=CLAIM), Note("a what-if, not a prediction", A('prediction'), 'note'), src('B612 Foundation path of risk, 2008', A('strip'))],
     stamps=[(0, 8, 'half true')])
shot('a29b', T4, [], [cal('c29', .2, .45, .18, '2029'), kit(F, 'x29', 'cross', .2, .45, .16, **pop_in(A('2029'), (.2 * W, .45 * H))),
                      cal('c36', .4, .45, .18, '2036'), kit(F, 'x36', 'cross', .4, .45, .16, **pop_in(A('2036'), (.4 * W, .45 * H))),
                      cal('c68', .6, .45, .18, '2068'), kit(F, 'x68', 'cross', .6, .45, .16, **pop_in(A('2068'), (.6 * W, .45 * H)))],
     [Note('radar: Goldstone + Green Bank', A('radar'), 'note', pos=(.4 * W, .72 * H)), Note('no risk for 100+ years', A('hundred'), 'title', pos=(.4 * W, .84 * H)),
      src('NASA / ESA, March 2021', A('March'))])
shot('a30', None, [arka(x=.36, poses=[(0, 'think')], faces=[(0, 'neutral')])], [odds('odds', .68, .42, .2, [(0, 37)])], [])
shot('a31', T4, [], [apophis('apo', .58, .5, .1), apophis('pebble', .2, .3, .02, x=track((0, 0), (A('rock'), 0), (A('nudges'), 590, 'ease-in-back')), y=track((0, 0), (A('rock'), 0), (A('nudges'), 220, 'ease-in-back'))),
                     kit(F, 'hit', 'impact', .58, .44, .1, count=6, level=lv((0, .6)), **pop_in(A('nudges'), (.58 * W, .44 * H)))],
     [Note('"the odds went up"', 4, 'title', color=CLAIM), Note('a 2024 study', A('study'), 'note'), Note('an unseen rock nudges it?', A('nudges'), 'note')], stamps=[(0, A('half'), 'half true')])
shot('a32', T4, [], [kit(F, 'o1', 'sign', .26, .42, .22, w=1.8, h=1.0, text='1 IN 1,000,000', **pop_in(A('million'), (.26 * W, .42 * H))),
                     kit(F, 'o2', 'sign', .62, .42, .22, w=1.8, h=1.0, text='1 IN 1,000,000,000', **pop_in(A('billion'), (.62 * W, .42 * H)))],
     [Note('after 2029', A('after'), 'label', pos=(.26 * W, .62 * H)), Note('in 2029', A('Earth'), 'label', pos=(.62 * W, .62 * H)),
      Note('one look in 2027 settles most of it', A('2027'), 'note', pos=(.44 * W, .78 * H)), src('Wiegert 2024', A('million'))])
shot('a33', None, [arka(x=.36, poses=[(0, 'cheer')], faces=[(0, 'grin')])], [kit(F, 'o2', 'sign', .66, .42, .2, w=1.8, h=1.0, text='1 IN 1,000,000,000')], [])
shot('a34', T4, [], [earth('earth', .3, .5, .2), kit(F, 'pen', 'arrow', .62, .5, .2)],
     [Note('pretend it did hit', A('Pretend'), 'title'), Note('"wipes out a continent"', A('continent'), 'note', color=CLAIM), Note("let's draw it", A('draw'), 'note')])
CONT = '#7cc576'
shot('a35', T4, [], [disc('land', .36, .52, .3, CONT, ('#6db267', CONT), shade=.05, seed=41),
                     kit(F, 'zone', 'orbit-ring', .36, .52, .14, color=WARN, opacity=show_from(A('zone'))),
                     kit(F, 'boom', 'impact', .36, .52, .08, count=8, level=lv((0, .7)), **pop_in(A('zone'), (.36 * W, .52 * H)))],
     [Note('a continent', A('continent'), 'label', pos=(.36 * W, .17 * H)), Note('devastation: a few hundred km', A('few'), 'note'),
      Note('a small country', A('country'), 'title'), src('Planetary Society', A('zone'))])
shot('a36', None, [arka(x=.3, poses=[(0, 'shrug')], faces=[(0, 'shocked')])],
     [disc('land', .66, .5, .22, CONT, ('#6db267', CONT), shade=.05, seed=41), kit(F, 'zone', 'orbit-ring', .66, .5, .07, color=WARN)], [])

# ------------------------------------------------------------------ quick round
shot('a37', T5, [], [kit(F, 'dino', 'dino', .2, .66, .3), apophis('kpg', .2, .3, .1, opacity=show_from(A('dinosaur-killer'))),
                     apophis('apo', .42, .36, .02, opacity=show_from(A('Apophis')))],
     [Note('the end of the world?', A('end'), 'title', color=CLAIM), Note('global: 1 km+ asteroids', A('Global'), 'note'),
      Note('dinosaur-killer: ~10 km', A('dinosaur-killer'), 'note'), Note('Apophis: < 0.5 km', A('Apophis'), 'note'), src('1 km+ for global effects', A('Global'))],
     stamps=[(0, A('No'))])
shot('a38', T5, [], [kit(F, 'bar', 'bar', .3, .5, .4, level=lv((0, .05), (A('forty'), .05), (A('ten'), 1), (A('roughly'), .12)), color=YELLOW)],
     [Note('40 to 10,000 megatons?', A('forty'), 'note'), Note('best estimate: ~1,000', A('roughly'), 'title'), Note('tens of thousands of Hiroshimas', A('Hiroshima'), 'note'),
      src('NASA est. 880 Mt', A('roughly'))])
shot('a39', T5, [], [kit(F, 'wave', 'drop', .26, .5, .3, color=NOTE_BLUE), kit(F, 'q', 'question', .42, .38, .12, **pop_in(A('know'), (.42 * W, .38 * H)))],
     [Note('a wall of water?', A('wall'), 'title', color=CLAIM), Note('ocean strikes do raise tsunamis', A('tsunamis'), 'note')],
     stamps=[(0, A('know'), "we don't know")])
shot('a39b', T5, [person('melosh', .2, h=.42, poses=[(0, 'think'), (A('wrong'), 'point-right')], faces=[(0, 'neutral')])],
     [kit(F, 'wave', 'drop', .48, .52, .2, color=NOTE_BLUE), kit(F, 'x', 'cross', .48, .52, .16, **pop_in(A('wrong'), (.48 * W, .52 * H)))],
     [Note('impact researchers', A('researchers'), 'label', pos=(.2 * W, .32 * H)), Note('giant-wall models: waves break', A('wave-breaking'), 'note'),
      Note('Chile, ~2 million years ago: no giant tsunami', A('Chile'), 'note', pos=(.62 * W, .7 * H)), src('Acta Astronautica 2021 · Melosh', A('researchers'))])
shot('a40', T5, [], [kit(F, 'ok', 'check', .08, .4, .12), kit(F, 'no', 'question', .08, .64, .12)],
     [Note('dangerous coastal waves: yes', A('dangerous'), 'note', pos=(.56 * W, .4 * H)), Note('a guaranteed skyscraper of water: no one can promise', A('guaranteed'), 'note', pos=(.56 * W, .64 * H))])
shot('a41', None, [arka(x=.3, poses=[(0, 'point-right')], faces=[(0, 'smug')])], [],
     [Note('bad', A('bad'), 'title', pos=(.66 * W, .32 * H)), Note('regional', A('regional'), 'title', pos=(.66 * W, .46 * H)), Note('not happening', A('happening'), 'title', pos=(.66 * W, .6 * H))])
shot('a42', None, [], [kit(F, 'ok', 'check', .5, .45, .24, **pop_in(A('exactly'), (.5 * W, .45 * H)))], [], stamps=[])

# ------------------------------------------------------------------ chapter 4: who's flying with us
shot('a43', T6, [arka(x=.26, h=.4, poses=[(0, 'point-right')], faces=[(0, 'happy')])],
     [surface(), cal('cal', .64, .4, .22, '13 APR 2029'), kit(F, 'r1', 'rocket', .82, .5, .14, **pop_in(A('agencies'), (.82 * W, .5 * H)))],
     [Note("a date that can't move", A('date'), 'note')])
shot('a44', T6, [], [apophis('apo', .7, .5, .1), kit(F, 'ramses', 'probe', .36, .45, .12, x=track((0, -200), (A('launches'), -200), (A('February'), 0, 'ease-out-cubic'))),
                     cal('cal', .2, .72, .16, 'FEB 2029', at=A('February'))],
     [Note('RAMSES · Europe + Japan', A('Ramses'), 'title'), Note('"cannot be late"', A('late'), 'note'), src('ESA', A('Ramses'))])
shot('a44b', T6, [], [apophis('apo', .64, .5, .14), kit(F, 'c1', 'probe', .3, .36, .06, **pop_in(A('radar'), (.3 * W, .36 * H))),
                      kit(F, 'c2', 'probe', .3, .64, .06, **pop_in(A('land'), (.3 * W, .64 * H)), y=track((0, 0), (A('land'), 0), (plus(A('land'), 60), -30, 'smoothstep')))],
     [Note('two shoebox helpers', A('shoebox-sized'), 'title'), Note('radar: inside the rock', A('radar'), 'note'), Note('a lander', A('land'), 'note')])
shot('a45', T6, [], [apophis('apo', .66, .5, .12), kit(F, 'apex', 'probe', .3, .45, .12),
                     kit(F, 'puff', 'plume', .55, .5, .1, opacity=show_from(A('thrusters')))],
     [Note('OSIRIS-APEX · NASA', A('OSIRIS-APEX'), 'title'), Note('brought Bennu home, 2023', A('Bennu'), 'note'), Note('stays ~18 months', A('eighteen'), 'note'),
      src('NASA · Univ. of Arizona', A("NASA's"))])
shot('a45b', T6, [], [kit(F, 'apex', 'probe', .24, .5, .1), apophis('dot', .8, .5, .02), kit(F, 'eye', 'magnifier', .52, .5, .16)],
     [Note('watching from 2 weeks out', A('two'), 'note'), Note('millions of km ahead', A('millions'), 'small')])
shot('a46', None, [arka(x=.3, poses=[(0, 'cheer')], faces=[(0, 'grin')])], [apophis('apo', .68, .42, .1), kit(F, 'p1', 'probe', .56, .3, .05), kit(F, 'p2', 'probe', .82, .56, .05)],
     [Note('scariest → most studied', A('studied'), 'title', pos=(.68 * W, .78 * H))])

# ------------------------------------------------------------------ ending: from your balcony
shot('a47', TE, [person('you', .14, h=.42, poses=[(0, 'stand'), (A('see', n=1), 'point-right')], faces=[(0, 'happy')])],
     [kit(F, 'town', 'town', .44, .92, .5, w=1.1, h=.5, level=lv((0, .8)))], [Note("you don't have to ride it", A('ride'), 'title')])
shot('a48', TE, [person('you', .1, h=.38, poses=[(0, 'point-right')], faces=[(0, 'happy')])],
     [kit(F, 'town', 'town', .32, .92, .42, w=1.1, h=.5, level=lv((0, .8))), moon_disc('moon', .5, .25, .03),
      ] + star('star', .3, .3, x=track((0, 0), (A('crossing'), 0), (A('minute'), 260, 'linear'))),
     [Note('a star that moves', A('star'), 'title'), Note('one Moon-width a minute', A('crossing'), 'note'), Note('India: ~2 AM, 14 April', A('India'), 'note'),
      Note('~2 billion people', A('billion'), 'title'), src('JPL · ESA', A('star'))])
shot('a49', TE, [person('you', .1, h=.38, poses=[(0, 'stand')], faces=[(0, 'happy')])],
     [kit(F, 'town', 'town', .32, .92, .42, w=1.1, h=.5, level=lv((0, .3))), ] + star('star', .56, .3, opacity=show_until(plus(A('glare'), 30))) + [
      kit(F, 'clock', 'clock', .8, .32, .16)],
     [Note('brightest ~1 hour before', A('brightest'), 'note'), Note('be out early, somewhere dark', A('early'), 'title')])
shot('a49b', TE, [person('tucker', .3, h=.44, poses=[(0, 'stand')], faces=[(0, 'neutral')], layer={'opacity': track((0, 1), (A("won't"), 1), (plus(A("won't"), 30), .35))})],
     star('star', .66, .3),
     [Note('Roy Tucker, 1951–2021', 4, 'label', pos=(.3 * W, .3 * H)), Note('~2 billion people will see what he found', A('see'), 'title', pos=(.6 * W, .74 * H))])
shot('a50', TE, [person('you', .12, h=.42, poses=[(0, 'stand'), (A('watch'), 'wave')], faces=[(0, 'happy')])],
     [kit(F, 'town', 'town', .36, .92, .46, w=1.1, h=.5, level=lv((0, .8))), cal('cal', .7, .35, .2, 'FRI 13'),
      ] + star('star', .6, .2, x=track((0, 0), (A('Friday'), 0), (plus(A('star'), 20), 160, 'linear'))),
     [Note('fear → a date in the calendar', A('calendar'), 'title'), Note('go and watch a star that moves', A('watch'), 'note')])
shot('a51', None, [arka(x=.3, poses=[(0, 'think'), (A('black'), 'point-right')], faces=[(0, 'neutral'), (A('black'), 'shocked')])],
     [disc('bh', .7, .44, .1, '#030305', (), shade=0, seed=2, opacity=show_from(A('black'))), earth('earth', .88, .44, .03, opacity=show_from(A('black')))],
     [Note('the strongest pull there is?', A('strongest'), 'note', pos=(.7 * W, .74 * H))])
shot('a52', None, [arka(x=.3, poses=[(0, 'stand')], faces=[(0, 'grin')])], [disc('bh', .7, .44, .1, '#030305', (), shade=0, seed=2)],
     [Note("they're wrong", A('wrong'), 'title', pos=(.7 * W, .74 * H)), Note('next episode', A('next'), 'note', pos=(.7 * W, .84 * H))], cam='push')
shot('a53', None, [arka(x=.18, h=.4, poses=[(0, 'wave')], faces=[(0, 'grin')])],
     [kit(F, 'sub', 'sign', .5, .55, .3, w=1.8, h=1.0, text='SUBSCRIBE', **pop_in(4, (.5 * W, .55 * H)))],
     [Note('GAHANARKA', 4, 'title', size=100, pos=(W / 2, 190), color=GOLD), Note('light in the unfathomable', 10, 'small', pos=(W / 2, 270)),
      Note('next: would a black-hole Sun suck us in?', A('ride'), 'note', size=72, pos=(W / 2, 370))])

# Text colour (docs/VISUAL_CHECKLIST.md): no red text on the night page. Titles gold, handwritten notes sky blue; INK claims stay white.
for pl in ep.plans.values():
    for n in pl['notes']:
        if n.color in (YELLOW, WARN): n.color = YELLOW if n.kind == 'title' else NOTE_BLUE

LIGHT_INK = {'doodle-stars', 'counter', 'bar', 'bulb', 'question', 'thermometer', 'orbit-ring', 'town', 'clock', 'pressure-arrows', 'cross', 'ruler', 'check',
             'small-moon', 'probe', 'signal', 'motion-lines', 'magnifier', 'impact', 'span', 'arrow', 'station', 'speedometer', 'rocket', 'dino',
             'mug', 'rope', 'drop', 'plume', 'exclaim', 'sparkle'}
for layer in [pr.layer for pl in ep.plans.values() for pr in pl['props']] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k.setdefault('ink', '#c9d3ea')

# One licensed track per chapter (YouTube Audio Library License, docs/MUSIC_SOURCES.md); dropouts on the turns.
ep.music([('a1', 'assets/music/4-tense-a-false-vacuum-decay.mp3', 0), ('a7', 'assets/music/1-curious-a-science-montage.mp3', 0),
          ('a12', 'assets/music/3-eerie-b-surface-of-the-moon.mp3', 0), ('a15', 'assets/music/6-space-event-horizon.mp3', 0),
          ('a27', 'assets/music/1-curious-b-frame-dragging.mp3', 0), ('a37', 'assets/music/2-playful-b-sweet-math.mp3', 0),
          ('a43', 'assets/music/5-uplifting-a-taking-flight.mp3', 0), ('a47', 'assets/music/8-space-laniakea.mp3', 0),
          ('a51', 'assets/music/6-space-singularity.mp3', 0)],
         dropouts=[('a1', 0, 1.2), ('a15', 0, 1.0), ('a27', 0, 1.0), ('a49b', 0, 3.0)], target_lufs=-16,
         gain_db=-17, duck_ratio=2, voice={'highpassHz': 95, 'lowMidDb': -4, 'presenceDb': 2, 'room': .08})

if __name__ == '__main__':
    board = ep.build()
    board['scenes'][-1]['durationFrames'] += END_CARD * FPS
    path = ROOT / 'storyboards/apophis.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
