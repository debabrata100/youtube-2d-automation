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
import json, math, pathlib, re, sys
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
# Narration: jobs/e7-narration-beats (the paid take cut with action-beat pauses, PAUSES below; stories/apophis-beats-cut.json, 0 paid requests).
# Applies docs/EPISODE_VISUAL_LESSONS.md and the 23 Nov lessons: people first (named people get a figure and a name label),
# one verdict stamp per claim (MYTH / HALF TRUE / TRUE / WE DON'T KNOW), a source tag beside every number, a new picture every few seconds.
from recipes import *  # noqa: E402,F401,F403
import recipes  # noqa: E402
YELLOW, WARN = '#ffd25e', '#ff5a4a'
recipes.RED = YELLOW
recipes.INK = '#eef1f8'
# Action beats (docs/VISUAL_CHECKLIST.md §10): silent pauses cut into the approved take (free) so the animation plays with sound.
# (beat, text the pause follows or None for the line's end, seconds). Narration job: jobs/e7-narration-beats.
PAUSES = [('a1', None, 1.2), ('a2', None, 3.6), ('a3', None, 1.6), ('a6', None, 4.8), ('a9', None, 2.0), ('a15', None, 2.4),
          ('a20', None, 2.4), ('a23', 'The ground just moved.', 1.6), ('a26', None, 2.4), ('a34', None, 1.4), ('a35', "Here's a continent.", 4.6),
          ('a35', None, 1.2), ('a39', None, 2.6), ('a49b', None, 2.2), ('a51', None, 2.2)]
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 625  # narration 609.4 s with 36.2 s of pauses + 3.6 s tail + 12 s end card
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
    layer.setdefault('color', ROCK)
    return kit(F, pid, 'asteroid', px, py, size, w=1.7, h=1.0, **layer)


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


def shot(bid, chapter, chars=(), props=(), notes=(), cam='settle', sounds=(), stamps=(), shake=()):
    """stamps: [(note index, anchor[, label])], counted among `notes` (the header is added in front automatically)."""
    off = 1 if chapter else 0
    props = list(props) + [p for p in EXTRA.get(bid, []) if not isinstance(p, Char)]
    chars = list(chars) + [p for p in EXTRA.get(bid, []) if isinstance(p, Char)]
    ep.scene(bid, explain(list(chars), list(props), ([head(chapter)] if chapter else []) + list(notes), camera_preset=cam, sounds=list(sounds), shake=list(shake),
                          stamps=[(st[0] + off,) + tuple(st[1:]) for st in stamps]))


EXTRA = {}  # beat id -> extra props, filled in below the shots' helpers
T0, T1, T2, T3 = 'FRIDAY 13 APRIL 2029', 'ON APOPHIS · ONE DAY OUT', 'THE 2004 SCARE', 'THROUGH THE SATELLITE RING'
T4, T5, T6, TE = 'WHAT IF IT HIT?', 'QUICK ROUND', "WHO'S FLYING WITH US", 'FROM YOUR BALCONY'

# ------------------------------------------------------------------ cold open: the promise (docs/E7_VIEWER_REVIEW.md, VISUAL_CHECKLIST §10)
# Every object the narrator names is drawn as itself: a real skyline and skyscraper, Earth with its real continents, TV satellites
# on the geostationary ring, a real map of a continent, a wave over a city, the viral headlines as video cards.
def tk(v0, at, *keys):
    """A track that holds v0 until `at`, then runs keys (frames after `at`, value[, easing])."""
    return track((0, v0), (plus(at, -1), v0), *[(plus(at, k[0]),) + tuple(k[1:]) for k in keys])


def window(a, b, fade=6):
    """Visible from anchor a to anchor b (quick fades)."""
    return track((0, 0), (plus(a, -1), 0), (plus(a, fade), 1), (plus(b, -fade), 1), (b, 0))


def popw(a, b, x, y):
    """Pop in at anchor a (scale bounce about x, y in group fractions), fade out at anchor b."""
    d = pop_in(a, (x * W, y * H)); d['opacity'] = window(a, b, 3); return d


def flash(pid, **k):
    """A full-frame flash (no layout footprint, so notes can still be placed)."""
    layer = {key: k.pop(key) for key in list(k) if key in ('opacity',)}
    return Prop(prop(pid, 'flash', .5, .5, .5, **k, **layer))


def globe(pid, px, py, size, center=(20, 12), **layer):
    return kit(F, pid, 'globe', px, py, size, center=list(center), **layer)


def card(pid, px, py, size, text, **layer):
    return kit(F, pid, 'headline', px, py, size, w=1.6, text=text, **layer)


def rock(pid, px, py, size, rot=0, **layer):
    """Apophis at a given rotation (an upright rock is 'a skyscraper'); size = its height across its short axis."""
    layer.setdefault('anchor', {'x': px * W, 'y': py * H})
    if 'rotate' not in layer: layer['rotate'] = track((0, rot - 4), (1800, rot + 4, 'linear'))
    layer.setdefault('color', ROCK)
    return kit(F, pid, 'asteroid', px, py, size, w=1.7, h=1.0, **layer)


# ------------------------------------------------------------------ fill-ins: something new at least every ~4 s (attraction report, §10)
def popx(pid, item, x, y, size, at, until=None, **k):
    d = pop_in(at, (x * W, y * H))
    if until is not None: d['opacity'] = window(at, until, 3)
    return kit(F, pid, item, x, y, size, **d, **k)


EXTRA.update({
    'a11': [popx('mins', 'clock', .88, .62, .1, A('minutes'), level=lv((0, 0), (A('minutes'), 0), (plus(A('minutes'), 2), .8)))],
    'a7': [popx('tumble-lines', 'motion-lines', .5, .74, .3, A('tumbling'), A('four'), color=SRC)],
    'a12b': [kit(F, 'xmas', 'xmas-tree', .5, .55, .4, **popw(4, A('Roy'), .5, .55))],
    'a12': [globe('hit-earth', .36, .3, .1, center=(20, 10), **popw(A('Earth'), A('highest'), .36, .3))],
    'a16': [popx('surface-dist', 'arrow', .52, .42, .16, A('surface'), A('nineteen'), rotation=200, color=YELLOW)],
    'a21': [kit(F, 'paths', 'orbit-ring', .26, .55, .62, color=YELLOW, opacity=show_from(A('precisely'))),
            popx('ops', 'dish', .86, .62, .2, A('Operators'), level=lv((0, 0), (A('Operators'), 0), (plus(A('Operators'), 2), 1)))],
    'a24': [popx('g-gauge', 'speedometer', .86, .3, .14, A('modelling'), text='gravity', level=lv((0, .5), (A('few'), .5), (plus(A('few'), 12), .56)))],
    'a25': [popx('slope', 'arrow', .5, .3, .14, A('slopes'), A('tumbling'), rotation=150, color=YELLOW),
            kit(F, 'pebs', 'debris', .5, .34, .2, count=5, color='#8a8278', level=lv((0, 0), (A('enough'), 0), (plus(A('enough'), 40), 1)))],
    'a29': [odds('odds29', .16, .34, .14, [(0, 37)], **popw(A('odds'), A('prediction'), .16, .34))],
    'a32': [rock('apo32', .44, .2, .05), cal('c27', .44, .62, .14, '2027', at=A('single')), popx('look27', 'dish', .62, .66, .16, A('settle'), level=lv((0, 1)))],
    'a37': [rock('km1', .42, .5, .05, **popw(A('kilometre'), A('dinosaur-killer'), .42, .5))],
    'a39': [kit(F, 'ripple', 'shockwave', .28, .86, .2, color='#a9d8ff', level=lv((0, 0), (A('raise'), 0), (plus(A('raise'), 40), 1))),
            kit(F, 'myth-wave', 'wave', .3, .9, .5, level=lv((0, 0), (A('hundreds'), 0), (plus(A('hundreds'), 20), .6), (A('honest'), .6), (plus(A('honest'), 12), 0)), opacity=window(A('hundreds'), plus(A('honest'), 14)))],
    'a39b': [rock('chile-rock', .74, .2, .03, **popw(A('struck'), plus(A('struck'), 20), .74, .2)),
             kit(F, 'chile-fl', 'shockwave', .66, .5, .12, level=lv((0, 0), (plus(A('struck'), 18), 0), (plus(A('struck'), 40), 1)))],
    'a43': [popx('craft', 'probe', .62, .24, .1, A('spacecraft'))],
    'a44': [cal('c28', .2, .3, .14, '2028', at=A('spring')), person('manager', .9, h=.3, poses=[(0, 'point-left')], faces=[(0, 'happy')], enter=('pop', A('manager'))),
            globe('fly-earth', .12, .56, .12, center=(30, 15), **popw(A('flyby'), plus(A('flyby'), 80), .12, .56))],
    'a45': [kit(F, 'apex-glint', 'sparkle', .3, .45, .2, count=5, level=lv((0, 0), (A('spacecraft'), 0), (plus(A('spacecraft'), 6), 1), (plus(A('spacecraft'), 30), 0))),
            globe('home', .2, .38, .08, center=(-100, 35), **popw(A('home'), A('renamed'), .2, .38)),
            kit(F, 'arrive', 'sparkle', .3, .45, .2, count=5, color='#ffffff', level=lv((0, 0), (A('arrives'), 0), (plus(A('arrives'), 6), 1), (plus(A('arrives'), 30), 0))),
            rock('bennu', .2, .2, .06, color='#5f5a52', **popw(A('Bennu'), A('renamed'), .2, .2)),
            popx('rename', 'sign', .3, .76, .2, A('renamed'), w=1.8, text='OSIRIS-APEX'),
            popx('cal45', 'calendar', .86, .24, .12, A('eighteen'), text='18 M')],
    'a45b': [kit(F, 'dot-ring', 'orbit-ring', .8, .5, .08, color=YELLOW, opacity=show_from(A('dot')))],
    'a48': [*[kit(F, f'see{i}', 'sparkle', .34 + dx, .55 + dy, .14, count=5, color=YELLOW, level=lv((0, 0), (a, 0), (plus(a, 8), 1)), opacity=window(a, plus(A('eyes', edge='end'), 30)))
              for i, (dx, dy, a) in enumerate([(-.04, -.12, A('Europe')), (-.02, .02, A('Africa')), (.08, -.06, A('Asia'))])],
            popx('2am', 'clock', .6, .28, .08, A('morning'), level=lv((0, .2)))],
    'a49': [kit(F, 'pulse49', 'sparkle', .56, .3, .2, count=4, level=lv((0, 0), (A('closest'), 0), (plus(A('closest'), 8), 1), (plus(A('closest'), 30), 0))),
            popx('hour', 'clock', .9, .62, .1, A('hour'), level=lv((0, 0), (A('hour'), 0), (plus(A('hour'), 2), .6)))],
    'a49b': [person('tholen2', .2, h=.38, poses=[(0, 'stand')], faces=[(0, 'neutral')], layer={'opacity': window(A('three'), A('died'))}),
             person('bernardi2', .4, h=.38, poses=[(0, 'stand')], faces=[(0, 'neutral')], layer={'opacity': window(A('three'), A('died'))})],
    'a50': [popx('chaos', 'sign', .62, .42, .2, A('chaos'), A('fear'), w=1.8, text='APOPHIS = GOD OF CHAOS'),
            popx('ruler', 'ruler', .62, .62, .2, A('measuring'), A('fear'))],
    'a52': [popx('q52', 'question', .52, .3, .12, A('think'), A('wrong')), popx('x52', 'cross', .52, .3, .14, A('wrong'))],
})


SKY_OUT = plus(A('pass'), 18)
H1 = 'FRIDAY 13 APRIL 2029'
shot('a1', None, [], [
    # the city, then the camera tilts up into space on "pass"
    kit(F, 'city', 'skyline', .42, .93, .5, count=7, highlight=3, level=lv((0, 1)), opacity=show_until(SKY_OUT), y=tk(0, A('pass'), (18, 760, 'ease-in-back'))),
    rock('tower-rock', .66, .735, .23, rot=90, opacity=window(A('asteroid'), SKY_OUT),
         y=track((0, -900), (plus(A('asteroid'), -1), -900), (A('skyscraper'), 0, 'smoothstep'), (plus(A('pass'), -1), 0), (SKY_OUT, 760, 'ease-in-back'))),
    # space: Earth (real continents) inside the ring of TV satellites
    globe('earth', .3, .55, .5, center=(10, 20), spin=.05, opacity=show_from(A('pass')), y=tk(-700, A('pass'), (20, 0, 'ease-out-cubic'))),
    kit(F, 'geo', 'orbit-ring', .3, .55, .95, color=SRC, opacity=show_from(A('pass')), y=tk(-700, A('pass'), (20, 0, 'ease-out-cubic'))),
    *[kit(F, f'sat{i}', 'satellite', x, y, .15, opacity=show_from(A('pass')), y=tk(-700, A('pass'), (20 + 3 * i, 0, 'ease-out-cubic'))) for i, (x, y) in enumerate([(.3, .11), (.56, .73), (.06, .78)])],
    *[kit(F, f'tv{i}', 'signal', x, y, .1, rotation=r, opacity=show_from(A('TV'))) for i, (x, y, r) in enumerate([(.33, .2, 110), (.54, .66, 200)])],
    # Apophis threads between Earth and the ring, then is gone (in the pause)
    rock('apo', .92, .18, .06, x=tk(0, A('closer'), (int(1.2 * FPS), -560, 'smoothstep'), (int(4.2 * FPS), -1700, 'ease-in-back')),
         y=tk(0, A('closer'), (int(1.2 * FPS), 230, 'smoothstep'), (int(4.2 * FPS), 520, 'ease-in-back')), opacity=show_from(A('closer'))),
], [Note(H1, A('Friday'), 'title', size=100, pos=(W / 2, .2 * H), until=A('pass')),
    Note('closer than the TV satellites', A('satellites'), 'note', pos=(.74 * W, .86 * H))],
     shake=[(A('skyscraper'), 14, .008)],
     cam=[kf(0, 1.06, (.5, .6)), kf(plus(A('pass'), -1), 1.0, (.5, .6)), kf(plus(A('pass'), 20), 1.08, (.4, .5)), kf(plus(A('signals', edge='end'), 30), 1.0, (.4, .5))],
     sounds=[('slam', A('Friday'), -12), ('whoosh', A('asteroid'), -16), ('slam', A('skyscraper'), -12), ('whoosh', A('pass'), -14), ('whoosh', plus(A('signals', edge='end'), 4), -12)])

# The myths, played like a disaster trailer: each claim shown as it is said, each with its viral headline card; then the pile-up.
C1, C2, C3, C4 = 'ASTEROID WIPES OUT A CONTINENT?!', 'THE END OF THE WORLD?!', 'A WALL OF WATER 100s OF METRES HIGH', 'SCIENTISTS MAPPED WHERE IT HITS'
END2 = A('lands', edge='end')
HIT = plus(A('continent'), 4)
shot('a2', None, [], [
    card('c0', .5, .5, .34, 'WHAT HAPPENS WHEN APOPHIS HITS?', **popw(A('heard'), A('wipes'), .5, .5)),
    # 1: a continent wiped out (the myth version, exaggerated on purpose)
    globe('g1', .34, .52, .66, center=(18, 8), opacity=window(A('wipes'), A('ends'), 3)),
    kit(F, 'trail1', 'streak', .38, .44, .5, rotation=150, level=lv((0, 0), (plus(A('wipes'), 0), 0), (HIT, 1), (plus(HIT, 4), 0))),
    flash('fl1', level=lv((0, 0), (HIT, 0), (plus(HIT, 2), .85), (plus(HIT, 12), 0))),
    kit(F, 'sw1', 'shockwave', .38, .46, .5, color=WARN, level=lv((0, 0), (HIT, 0), (plus(HIT, 30), 1))),
    # 2: the world cracks open
    globe('g2', .34, .52, .66, center=(18, 8), level2=lv((0, 0), (A('ends'), 0), (A('world', edge='end'), 1)), opacity=window(A('ends'), A('wall'), 3),
          x=tk(0, A('world'), (2, -10), (4, 10), (6, -8), (8, 8), (10, -4), (12, 0))),
    # 3: a wall of water over a city
    kit(F, 'city3', 'skyline', .5, .93, .5, count=7, highlight=3, level=lv((0, 1)), opacity=window(A('wall'), A('Scientists'), 3)),
    kit(F, 'wave3', 'wave', .3, .93, .56, level=lv((0, 0), (A('wall'), 0), (A('high'), .6)), opacity=window(A('wall'), A('Scientists'), 3)),
    # 4: the "impact map": a red risk stripe drawn across the globe
    globe('g4', .34, .52, .66, center=(-60, 10), opacity=window(A('Scientists'), plus(END2, 6), 3)),
    kit(F, 'stripe', 'arrow', .34, .52, .62, rotation=-18, color=WARN, level=lv((0, 0), (A('mapped'), 0), (A('lands', edge='end'), 1)), opacity=window(A('mapped'), plus(END2, 6), 3)),
    # each claim's card, top right while it plays
    *[card(f'c{i}', .78, .3, .27, txt, opacity=window(a, b, 3)) for i, (txt, a, b) in enumerate([(C1, A('wipes'), A('ends')), (C2, A('ends'), A('wall')), (C3, A('wall'), A('Scientists')), (C4, A('Scientists'), plus(END2, 6))], 1)],
    # the pause: the trailer's finale - the four cards slam into a pile, flash, shake
    *[card(f'p{i}', x, y, .3, txt, rotate=lv((0, r)), **pop_in(plus(END2, 10 + 9 * i), (x * W, y * H)))
      for i, (txt, x, y, r) in enumerate([(C1, .3, .32, -6), (C2, .7, .34, 5), (C3, .32, .68, 4), (C4, .68, .68, -5)])],
    flash('fl2', level=lv((0, 0), (plus(END2, 46), 0), (plus(END2, 48), .7), (plus(END2, 60), 0))),
], [], cam=[kf(0, 1.0), kf(plus(A('wipes'), -1), 1.0), kf(plus(A('wipes'), 2), 1.1, (.36, .48)), kf(plus(A('wall'), -1), 1.12, (.36, .48)), kf(plus(A('wall'), 2), 1.0),
            kf(plus(A('mapped'), 0), 1.06, (.36, .5)), kf(plus(END2, 8), 1.0)],
     shake=[(HIT, 24, .012), (A('world'), 30, .01), (plus(END2, 46), 20, .014)],
     sounds=[('boom', HIT, -10), ('crack', A('ends'), -10), ('rumble', A('world'), -12), ('splash', plus(A('high', edge='end'), 3), -10), ('whoosh', A('mapped'), -16),
             ('slam', plus(END2, 10), -12), ('slam', plus(END2, 19), -12), ('slam', plus(END2, 28), -12), ('slam', plus(END2, 37), -12), ('boom', plus(END2, 46), -12)])

# Arka hides behind the pile; then the whole trailer rewinds (the pause) into a row of four to inspect.
PILE = [(C1, .36, .4, -6), (C2, .64, .42, 5), (C3, .36, .74, 4), (C4, .64, .74, -5)]
ROW = [(.25, .32), (.75, .32), (.25, .72), (.75, .72)]
END3 = A('wrong', edge='end')
shot('a3', None, [arka(x=.5, fy=.62, h=.36, poses=[(0, 'cower')], faces=[(0, 'scared')], layer={'y': tk(0, A('tell'), (8, -270, 'ease-out-back')), 'opacity': show_until(plus(END3, 6))})],
     [*[card(f'p{i}', x, y, .3, txt, anchor={'x': x * W, 'y': y * H}, rotate=tk(r, plus(END3, 6), (30, 0, 'smoothstep')),
             x=tk(0, plus(END3, 6), (30, (ROW[i][0] - x) * W, 'smoothstep')), y=tk(0, plus(END3, 6), (30, (ROW[i][1] - y) * H, 'smoothstep')))
       for i, (txt, x, y, r) in enumerate(PILE)],
      kit(F, 'rw', 'rewind', .08, .1, .16, level=lv((0, 0), (plus(END3, 4), 0), (plus(END3, 8), 1), (plus(END3, 38), 1), (plus(END3, 44), 0)))],
     [], cam='settle', sounds=[('rewind', plus(END3, 4), -12)])

# Verdicts on the four cards: two scribbled out, one HALF TRUE, one "we'll see"; and the more interesting part sparkles.
shot('a4', None, [], [
    *[card(f'r{i}', x, y, .3, txt) for i, ((txt, _, _, _), (x, y)) in enumerate(zip(PILE, ROW))],
    kit(F, 'pen', 'pen', .25, .32, .14, x=tk(0, A('Most', n=1, edge='end'), (4, 0), (14, 180), (18, 520), (28, 680)), y=tk(0, A('Most', n=1, edge='end'), (14, 0), (18, 0)),
        opacity=window(plus(A('Most', n=1, edge='end'), 0), plus(A('Most', n=1, edge='end'), 32), 3)),
    kit(F, 'sx1', 'scribble', .25, .32, .17, level=lv((0, 0), (plus(A('Most', n=1, edge='end'), 2), 0), (plus(A('Most', n=1, edge='end'), 14), 1))),
    kit(F, 'sx2', 'scribble', .75, .32, .17, level=lv((0, 0), (plus(A('Most', n=1, edge='end'), 18), 0), (plus(A('Most', n=1, edge='end'), 30), 1))),
    kit(F, 'half', 'stamp', .75, .84, .17, text='half true', **pop_in(A('half'), (.75 * W, .82 * H))),
    kit(F, 'q3', 'question', .25, .72, .16, **pop_in(A('half'), (.25 * W, .72 * H))),
    kit(F, 'spark', 'sparkle', .5, .52, .3, count=8, level=lv((0, 0), (A('interesting'), 0), (plus(A('interesting'), 10), 1))),
    rock('star-rock', .5, .52, .07, **pop_in(A('interesting'), (.5 * W, .52 * H))),
], [], cam='settle', sounds=[('tear', A('Most', n=1, edge='end'), -14), ('tear', plus(A('Most', n=1, edge='end'), 18), -14), ('boom', A('half'), -20), ('ding', A('interesting'), -12)])

# "check every claim" - a magnifier sweeps the cards; "not from Earth" - a stargazer on Earth, crossed out.
shot('a5', None, [person('gazer', .5, fy=.5, h=.16, poses=[(0, 'point-right')], faces=[(0, 'happy')], layer={'opacity': show_from(A('watch'))})], [
    *[card(f'k{i}', x, y, .3, txt, opacity=show_until(A('And')), x=tk(0, A('And'), (12, (x - .5) * W * 1.6, 'ease-in-back'))) for i, ((txt, _, _, _), (x, y)) in enumerate(zip(PILE, ROW))],
    kit(F, 'mag', 'magnifier', .2, .32, .22, x=tk(0, A('check'), (40, 1100, 'smoothstep')), y=tk(0, A('check'), (20, 330, 'smoothstep'), (40, 0, 'smoothstep')), opacity=show_until(A('And'))),
    globe('home', .5, .72, .46, center=(78, 20), opacity=show_from(A('And')), scale=tk(.6, A('And'), (12, 1, 'ease-out-back')), anchor={'x': .5 * W, 'y': .72 * H}),
    kit(F, 'nope', 'cross', .5, .3, .2, **pop_in(A('not'), (.5 * W, .3 * H))),
], [], cam='settle', sounds=[('whoosh', A('And'), -16), ('boom', A('not'), -22)])

# "We're going to ride it." - Arka leaps onto the tumbling rock and rides it out of frame (the pause), then the brand sting.
END6 = A('it', edge='end')
LAND_ON = plus(END6, 22)
STING = plus(END6, 62)  # inside the 4.8 s pause
sting_chars, sting_props, sting_notes, sting_sounds = brand_sting(STING, W, H)
RIDE_X = tk(0, plus(LAND_ON, 6), (34, 1500, 'ease-in-back'))
RIDE_Y = tk(0, plus(LAND_ON, 6), (34, -620, 'ease-in-back'))
shot('a6', None, [arka(x=.26, h=.4, poses=[(0, 'point-right'), (plus(END6, 2), 'reach'), (LAND_ON, 'cheer')], faces=[(0, 'grin'), (LAND_ON, 'grin')],
                       layer={'opacity': show_until(STING), 'x': track((0, 0), (plus(END6, 2), 0), (LAND_ON, 640, 'smoothstep'), (plus(LAND_ON, 6), 640), (plus(LAND_ON, 40), 2140, 'ease-in-back')),
                              'y': track((0, 0), (plus(END6, 2), 0), (plus(END6, 12), -300, 'ease-out-cubic'), (LAND_ON, -250, 'smoothstep'), (plus(LAND_ON, 6), -250), (plus(LAND_ON, 40), -870, 'ease-in-back'))})] + sting_chars,
     [rock('apo', .62, .62, .2, x=track((0, 900), (plus(A('going'), -1), 900), (plus(A('going'), 16), 0, 'ease-out-cubic'), (plus(LAND_ON, 6), 0), (plus(LAND_ON, 40), 1500, 'ease-in-back')),
           y=track((0, 0), (plus(LAND_ON, 6), 0), (plus(LAND_ON, 40), -620, 'ease-in-back'))),
      kit(F, 'ride-trail', 'streak', .62, .62, .5, rotation=-22, level=lv((0, 0), (plus(LAND_ON, 8), 0), (plus(LAND_ON, 20), 1), (plus(LAND_ON, 40), 1), (plus(LAND_ON, 44), 0)),
          x=RIDE_X, y=RIDE_Y)] + sting_props,
     [Note("we're going to ride it", 4, 'title', pos=(.5 * W, .2 * H), until=plus(END6, 20))] + sting_notes,
     cam=[kf(0, 1.0, (.5, .5)), kf(plus(END6, 2), 1.0, (.5, .5)), kf(LAND_ON, 1.1, (.6, .45)), kf(plus(LAND_ON, 30), 1.0, (.5, .5))],
     shake=[(LAND_ON, 10, .006)],
     sounds=[('whoosh', plus(END6, 1), -18), ('pop', plus(END6, 3), -18), ('slam', LAND_ON, -16), ('whoosh', plus(LAND_ON, 8), -10)] + sting_sounds)

# ------------------------------------------------------------------ chapter 1: standing on Apophis (T minus 24 hours)
def surf(**layer):
    """Standing on Apophis (the rock's lumpy back fills the bottom of the frame)."""
    return kit(F, 'surface', 'asteroid', .5, 1.27, 1.0, w=1.7, h=1.0, color=ROCK, **layer)


shot('a7', T1, [arka(x=.24, h=.46, poses=[(0, 'float')], faces=[(0, 'happy')], enter=('pop', 4))],
     [surf(), globe('earth', .12, .24, .05, center=(20, 10)),
      # 450 m to scale: the rock beside a skyscraper of about the same height
      kit(F, 'city', 'skyline', .7, .62, .34, count=5, highlight=2, level=lv((0, 1)), **popw(A('four'), plus(A('blue'), -2), .7, .5)),
      rock('mini', .7, .3, .16, opacity=window(A('four'), plus(A('blue'), -2), 4)),
      kit(F, 'len', 'span', .7, .19, .48, text='~450 m', level=lv((0, 0), (A('four'), 0), (plus(A('four'), 20), 1)), opacity=show_until(plus(A('blue'), -2))),
      kit(F, 'dot-ring', 'orbit-ring', .12, .24, .1, color=YELLOW, opacity=show_from(A('blue')))],
     [Note('Apophis', A('Apophis'), 'title', pos=(.5 * W, .2 * H), until=A('four'))],
     cam=[kf(0, 1.06, (.4, .6)), kf(A('four'), 1.0, (.5, .5)), kf(A('blue'), 1.0, (.5, .5)), kf(plus(A('blue'), 30), 1.12, (.15, .3))],
     sounds=[('pop', A('four'), -20), ('ding', A('blue'), -18)])
shot('a8', None, [arka(x=.3, h=.5, poses=[(0, 'stand'), (A('step'), 'walk'), (plus(A('step'), 12), 'float')], faces=[(0, 'neutral'), (plus(A('step'), 12), 'shocked')],
                       layer={'y': tk(0, plus(A('step'), 10), (40, -120, 'ease-out-cubic')), 'x': tk(0, A('step'), (30, 90, 'smoothstep'))})],
     [surf(), globe('earth', .8, .3, .05, center=(20, 10))], [], sounds=[('bubble', plus(A('step'), 10), -12)])
ESC = A('forever', edge='end')
shot('a9', T1, [arka(x=.3, h=.46, poses=[(0, 'stand'), (A('hop'), 'float'), (ESC, 'tumble')], faces=[(0, 'neutral'), (A('forever'), 'shocked'), (ESC, 'scream')],
                     layer={'y': track((0, 0), (A('hop'), 0), (A('forever'), -160, 'ease-out-cubic'), (plus(ESC, 60), -620, 'smoothstep')),
                            'x': track((0, 0), (plus(ESC, 0), 0), (plus(ESC, 60), 700, 'smoothstep')),
                            'scale': track((0, 1), (ESC, 1), (plus(ESC, 60), .15, 'smoothstep'))})],
     [surf(), globe('earth', .8, .28, .05, center=(20, 10)),
      kit(F, 'speed', 'speedometer', .74, .62, .2, text='cm/s', level=lv((0, .1), (A('hop'), .1), (A('twelve'), .5), (A('forever'), .8)))],
     [Note('gravity: 1/4,000,000 of Earth', A('quarter'), 'note', pos=(.68 * W, .2 * H)), Note('hop faster than 12 cm/s...', A('twelve'), 'note', pos=(.68 * W, .31 * H)),
      Note('...gone forever', A('forever'), 'title', pos=(.68 * W, .43 * H)), src('ESA mass + size, our maths', A('gravity'))],
     sounds=[('riser', A('forever'), -14), ('whoosh', ESC, -14)])
shot('a10', None, [arka(x=.2, h=.46, poses=[(0, 'walk')], faces=[(0, 'smug')], layer={'x': track((0, 0), (A('walk'), 0), (plus(A('that'), 20), 760, 'linear'))})],
     [kit(F, 'kitchen', 'sign', .82, .5, .26, w=1.8, text='KITCHEN', **popw(A('kitchen'), plus(A('that', edge='end'), 60), .82, .5)),
      kit(F, 'mug', 'mug', .3, .6, .1, x=track((0, 0), (A('walk'), 0), (plus(A('that'), 20), 760, 'linear'))),
      kit(F, 'speed', 'speedometer', .6, .25, .16, text='you', level=lv((0, .9)))],
     [], cam='drift')
DROP = A('Dropped')
shot('a11', T1, [arka(x=.3, h=.46, poses=[(0, 'stand'), (plus(DROP, -6), 'reach'), (A('cable'), 'panic'), (plus(A('cable'), 16), 'stand')],
                      faces=[(0, 'happy'), (A('cable'), 'shocked'), (plus(A('cable'), 16), 'grin')],
                      layer={'y': track((0, 0), (plus(A('cable'), -2), 0), (plus(A('cable'), 4), -90, 'ease-out-cubic'), (plus(A('cable'), 16), 0, 'ease-out-back'))})],
     [surf(), Prop(prop('dust', 'snowfall', .45, .55, .5, count=24, color='#b8b2a6', level=lv((0, 0), (DROP, 0), (plus(DROP, 30), 1)))),
      kit(F, 'kick', 'debris', .34, .82, .3, count=6, color='#b8b2a6', level=lv((0, 0), (DROP, 0), (plus(DROP, 200), .6))),
      kit(F, 'cable', 'rope', .5, .7, .5, color='#e8d9b0', opacity=show_from(A('cable')))],
     [Note('slow motion', A('slow'), 'title', pos=(.7 * W, .3 * H)), Note('clipped to a cable', A('cable'), 'note')],
     sounds=[('wind', DROP, -22)])

# ------------------------------------------------------------------ the 2004 scare (people first): a change of place, the observatory
shot('a12', T2, [], [kit(F, 'obs', 'observatory', .2, .58, .46, level=lv((0, 0), (A('people'), 0), (plus(A('people'), 30), 1))),
                     cal('cal', .5, .3, .2, 'DEC 2004', at=A('December')),
                     odds('odds', .52, .62, .28, [(0, 300), (A('reached'), 300), (plus(A('reached'), 8), 180), (plus(A('reached'), 14), 90), (A('thirty-seven'), 37)]),
                     kit(F, 'gauge', 'speedometer', .8, .55, .26, text='danger', level=lv((0, .15), (A('reached'), .15), (A('thirty-seven'), .7), (A('highest'), .98)))],
     [Note('1 in 37', A('thirty-seven'), 'title', pos=(.52 * W, .86 * H)), Note('highest danger rating ever', A('highest'), 'note', pos=(.78 * W, .2 * H)),
      src('ESA · Torino scale, Dec 2004', A('rating'))],
     cam=[kf(0, 1.06, (.2, .55)), kf(A('December'), 1.0), kf(A('highest'), 1.08, (.8, .55))],
     sounds=[('tick', plus(A('reached'), 8), -16), ('tick', plus(A('reached'), 14), -16), ('heartbeat', A('thirty-seven'), -12), ('riser', plus(A('rating', edge='end'), 2), -18)])
shot('a12b', T2, [person('tucker', .12, h=.4, poses=[(0, 'point-right')], faces=[(0, 'happy'), (A('lost'), 'shocked')], enter=('pop', A('Roy'))),
                  person('tholen', .22, h=.38, poses=[(0, 'stand'), (A('lost'), 'shrug')], faces=[(0, 'happy'), (A('lost'), 'sad')], enter=('pop', A('David'))),
                  person('bernardi', .32, h=.4, poses=[(0, 'stand'), (A('lost'), 'think')], faces=[(0, 'neutral')], enter=('pop', A('Fabrizio'))),
                  person('garradd', .55, h=.4, poses=[(0, 'think'), (A('found'), 'point-right'), (A('worse'), 'scared')], faces=[(0, 'neutral'), (A('found'), 'grin'), (A('worse'), 'shocked')], enter=('pop', A('Gordon')))],
     [kit(F, 'obs', 'observatory', .22, .9, .22, level=lv((0, 1))),
      apophis('dot', .4, .2, .02, opacity=track((0, 0), (plus(A('spotted'), -1), 0), (A('spotted'), 1), (A('lost'), 1), (plus(A('lost'), 20), 0))),
      kit(F, 'q', 'question', .4, .2, .08, opacity=track((0, 0), (plus(A('lost'), -1), 0), (A('lost'), 1), (plus(A('Gordon'), -1), 1), (A('Gordon'), 0))),
      kit(F, 'spot', 'sparkle', .62, .2, .2, count=6, level=lv((0, 0), (A('found'), 0), (plus(A('found'), 8), 1))),
      apophis('dot2', .62, .2, .02, opacity=show_from(A('found'))),
      odds('odds', .82, .45, .22, [(0, 300), (A('sixty'), 60), (A('thirty-seven'), 37)], opacity=show_from(A('observation')))],
     [Note('Tucker · Tholen · Bernardi', A('Roy'), 'label', pos=(.22 * W, .3 * H)), Note('Arizona, June 2004', A('Arizona'), 'small', pos=(.22 * W, .22 * H)),
      Note('LOST', A('lost'), 'title', pos=(.4 * W, .12 * H), until=A('Gordon')),
      Note('Gordon Garradd, Australia', A('Gordon'), 'label', pos=(.55 * W, .33 * H)), Note('the odds got worse', A('worse'), 'title', pos=(.8 * W, .78 * H))],
     sounds=[('pop', A('lost'), -18), ('ding', A('found'), -16), ('heartbeat', A('three', n=2), -12), ('heartbeat', A('sixty'), -12), ('heartbeat', A('thirty-seven'), -10)])
shot('a12c', T2, [], [*[kit(F, f'plate{i}', 'photo-plate', x, y, .3, **({'text': 'MARCH 2004'} if i == 2 else {}), rotation=r,
                             level=lv((0, 0), (A('hiding'), 0), (plus(A('hiding'), 20), 1)) if i == 2 else lv((0, 0)), **pop_in(plus(A('photographs'), 4 * i), (x * W, y * H)))
                       for i, (x, y, r) in enumerate([(.2, .42, -8), (.28, .46, 5), (.36, .5, -2)])],
                      kit(F, 'mag', 'magnifier', .2, .7, .2, x=tk(0, A('Astronomers'), (40, 340, 'smoothstep')), y=tk(0, A('Astronomers'), (40, -240, 'smoothstep'))),
                      globe('earth', .74, .45, .2, center=(20, 10), opacity=show_from(A('trail'))),
                      kit(F, 'path', 'arrow', .74, .25, .5, rotation=12, color=YELLOW, level=lv((0, 0), (A('trail'), 0), (plus(A('trail'), 24), 1))),
                      kit(F, 'ruled', 'stamp', .74, .78, .16, text='2029: ruled out', **pop_in(A('ruled'), (.74 * W, .78 * H)))],
     [Note('old photographs', A('photographs'), 'title', pos=(.3 * W, .16 * H))],
     sounds=[('pop', A('photographs'), -18), ('ding', plus(A('hiding'), 18), -16), ('whoosh', A('trail'), -16), ('boom', A('ruled'), -14)])
shot('a13', None, [arka(x=.18, poses=[(0, 'point-right')], faces=[(0, 'neutral'), (A('scary'), 'smug')])],
     [kit(F, 'board', 'corkboard', .6, .48, .5),
      *[card(f'pin{i}', x, y, .17, txt, rotate=lv((0, r)), **pop_in(plus(A('scary'), 5 * i), (x * W, y * H))) for i, (txt, x, y, r) in
        enumerate([(C1, .48, .36, -4), (C2, .72, .36, 3), (C3, .48, .6, 2), (C4, .72, .6, -3)])]], [],
     sounds=[('pop', A('scary'), -16), ('pop', plus(A('scary'), 5), -16), ('pop', plus(A('scary'), 10), -16), ('pop', plus(A('scary'), 15), -16)])
shot('a14', None, [], [kit(F, 'board', 'corkboard', .6, .48, .5), *[card(f'pin{i}', x, y, .17, txt, rotate=lv((0, r))) for i, (txt, x, y, r) in
                       enumerate([(C1, .48, .36, -4), (C2, .72, .36, 3), (C3, .48, .6, 2), (C4, .72, .6, -3)])],
                       odds('odds', .18, .45, .24, [(0, 37)], **pop_in(A('odds'), (.18 * W, .45 * H)))],
     [Note('hold that thought', A('Hold'), 'title', pos=(.5 * W, .16 * H))], cam=[kf(0, 1.0), kf(A('Hold'), 1.0), kf(plus(A('Hold'), 4), 1.1, (.6, .48))], sounds=[('slam', A('Hold'), -18)])

# ------------------------------------------------------------------ chapter 2: through the satellite ring
GROW = A('grow', edge='end')
shot('a15', T3, [arka(x=.22, h=.4, poses=[(0, 'point-right'), (GROW, 'cower')], faces=[(0, 'happy'), (GROW, 'shocked')])],
     [surf(), globe('earth', .64, .36, .3, center=(30, 15), spin=.03, scale=track((0, .33), (A('stopped'), .33), (GROW, .75, 'smoothstep'), (plus(GROW, 60), 2.8, 'smoothstep')),
                    anchor={'x': .64 * W, 'y': .36 * H})],
     [Note('one hour out', A('hour'), 'title', pos=(.3 * W, .2 * H), until=GROW)],
     cam=[kf(0, 1.0), kf(GROW, 1.04), kf(plus(GROW, 60), 1.2, (.64, .4))], shake=[(plus(GROW, 50), 20, .008)],
     sounds=[('riser', plus(GROW, -10), -12), ('boom', plus(GROW, 56), -14)])
MOONS = A('thirty-eight')
shot('a16', T3, [], [globe('earth', .3, .55, .62, center=(30, 15), spin=.03), rock('apo', .82, .36, .04),
                     kit(F, 'gap', 'span', .64, .45, .34, text='32,000 km', rotation=-12, level=lv((0, 0), (A('thirty-two'), 0), (plus(A('thirty-two'), 20), 1)), opacity=show_until(MOONS)),
                     kit(F, 'moons', 'moon-row', .3, .55, .62 * .985, count=38, level=lv((0, 0), (MOONS, 0), (plus(MOONS, 38), 1)))],
     [Note('19° across', A('nineteen'), 'title', pos=(.76 * W, .62 * H)), Note('= 38 full Moons', MOONS, 'note', pos=(.76 * W, .74 * H)), src('our maths: 32,000 km', A('thirty-two'))],
     sounds=[('tick', MOONS, -18), ('tick', plus(MOONS, 9), -18), ('tick', plus(MOONS, 18), -18), ('tick', plus(MOONS, 27), -18), ('ding', plus(MOONS, 38), -16)])
shot('a17', None, [arka(x=.2, h=.3, poses=[(0, 'cheer')], faces=[(0, 'shocked')])], [surf(), globe('earth', .6, .2, 1.0, center=(30, 15), spin=.03)], [],
     cam=[kf(0, 1.0, (.5, .4)), kf(A('sky', edge='end'), 1.08, (.5, .35))])
shot('a18', T3, [], [globe('earth', .5, 1.32, 1.0, center=(30, 15), spin=.03),
                     kit(F, 'iss', 'station', .5, .66, .1, **pop_in(A('station'), (.5 * W, .66 * H))),
                     kit(F, 'gps', 'satellite', .5, .44, .12, **pop_in(A('GPS'), (.5 * W, .44 * H))),
                     kit(F, 'geo', 'satellite', .5, .2, .14, **pop_in(A('geostationary'), (.5 * W, .2 * H))),
                     kit(F, 'tv', 'signal', .55, .26, .12, rotation=90, opacity=show_from(A('TV')))],
     [Note('400 km', A('four'), 'label', pos=(.64 * W, .66 * H)), Note('20,000 km', A('twenty'), 'label', pos=(.66 * W, .44 * H)),
      Note('36,000 km', A('thirty-six'), 'label', pos=(.68 * W, .2 * H)), Note('the altitude ladder', A('ladder'), 'title', pos=(.24 * W, .3 * H))],
     cam=[kf(0, 1.3, (.5, .85)), kf(A('station'), 1.3, (.5, .72)), kf(A('GPS'), 1.3, (.5, .5)), kf(A('geostationary'), 1.2, (.5, .3)), kf(A('thirty-six'), 1.0, (.5, .5))],
     sounds=[('ding', A('station'), -16), ('ding', A('GPS'), -16), ('ding', A('geostationary'), -16)])
shot('a19', T3, [], [globe('earth', .3, .55, .36, center=(30, 15), spin=.03), kit(F, 'geo', 'orbit-ring', .3, .55, .74, color=SRC),
                     *[kit(F, f's{i}', 'satellite', x, y, .07) for i, (x, y) in enumerate([(.3, .2), (.5, .74), (.1, .78), (.5, .32)])],
                     rock('apo', .78, .16, .03, x=track((0, 0), (A('passing'), 0), (A('Moon'), -440, 'smoothstep')), y=track((0, 0), (A('passing'), 0), (A('Moon'), 330, 'smoothstep'))),
                     moon_disc('moon', .93, .55, .03)],
     [Note('inside the ring', A('inside'), 'title', pos=(.74 * W, .78 * H)), Note('1/10 of the way to the Moon', A('tenth'), 'note', pos=(.7 * W, .9 * H))],
     sounds=[('whoosh', A('passing'), -16)])
HIT1 = A('one', edge='end')
shot('a20', None, [arka(x=.36, h=.42, poses=[(0, 'cower'), (HIT1, 'panic'), (plus(HIT1, 60), 'cower')], faces=[(0, 'scared')],
                        layer={'y': track((0, 0), (HIT1, 0), (plus(HIT1, 6), 40), (plus(HIT1, 24), 0), (plus(HIT1, 30), 40), (plus(HIT1, 48), 0))})],
     [surf(), *[kit(F, f'fly{i}', 'satellite', 1.2, y, .1 + .03 * (i % 2), x=track((0, 0), (plus(HIT1, d), 0), (plus(HIT1, d + 22), -2700, 'linear')),
                     rotate=track((0, 0), (plus(HIT1, d), 0), (plus(HIT1, d + 22), -40, 'linear')), anchor={'x': 1.2 * W, 'y': y * H})
                for i, (y, d) in enumerate([(.3, 0), (.55, 10), (.2, 22), (.45, 34), (.62, 46), (.25, 56)])]],
     [], cam=[kf(0, 1.0), kf(HIT1, 1.06, (.4, .5)), kf(plus(HIT1, 70), 1.0)],
     sounds=[('whoosh', plus(HIT1, 2), -10), ('whoosh', plus(HIT1, 24), -10), ('whoosh', plus(HIT1, 48), -10)])
shot('a21', T3, [], [globe('earth', .26, .55, .2, center=(30, 15), spin=.03), kit(F, 'geo', 'orbit-ring', .26, .55, .58, color=SRC),
                     *[kit(F, f'd{i}', 'satellite', .26 + .29 * 1080 / 1920 * math.cos(i * .7), .55 + .29 * math.sin(i * .7), .03) for i in range(9)],
                     kit(F, 'path', 'arrow', .3, .44, .5, rotation=32, color=YELLOW, level=lv((0, 0), (A('emptier'), 0), (plus(A('emptier'), 30), 1)))],
     [Note('smash into satellites?', A('smash'), 'title', color=CLAIM), Note('very unlikely', A('unlikely'), 'note'),
      Note('space is far emptier than drawings', A('emptier'), 'note'), src('USGS 2025', A('unlikely'))], stamps=[(0, A('unlikely'))])
IND = [66, 6, 98, 37]


def map_xy(bbox, mx, my, ms, lon, lat):
    k = ms * min(W, H) / (bbox[3] - bbox[1]); cm = math.cos(math.radians((bbox[1] + bbox[3]) / 2))
    return mx + (lon - (bbox[0] + bbox[2]) / 2) * cm * k / W, my - (lat - (bbox[1] + bbox[3]) / 2) * k / H


(NX, NY), (SX, SY) = map_xy(IND, .38, .52, .82, 76.5, 34.5), map_xy(IND, .38, .52, .82, 77.5, 8.2)
shot('a22', T3, [], [kit(F, 'india', 'map', .38, .52, .82, bbox=IND, opacity=show_from(A('India'))),
                     kit(F, 'speed', 'speedometer', .5, .5, .3, text='km/s', level=lv((0, .3), (A('seven'), .3), (plus(A('seven'), 30), .95)), opacity=show_until(A('India'))),
                     rock('r', NX, NY, .03, opacity=show_from(A('India')), x=tk(0, A('north'), (int(2.4 * FPS), (SX - NX) * W, 'linear')), y=tk(0, A('north'), (int(2.4 * FPS), (SY - NY) * H, 'linear'))),
                     kit(F, 'trail', 'streak', NX, NY, .2, rotation=-90, level=lv((0, 0), (A('north'), 0), (plus(A('north'), 6), 1)), opacity=show_from(A('north')),
                         x=tk(0, A('north'), (int(2.4 * FPS), (SX - NX) * W, 'linear')), y=tk(0, A('north'), (int(2.4 * FPS), (SY - NY) * H, 'linear'))),
                     kit(F, 'clock', 'clock', .8, .62, .2, text='7 min (sped up)', level=lv((0, 0), (A('north'), 0), (plus(A('north'), 2), 1), (plus(A('north'), int(2.4 * FPS)), 1), (plus(A('north'), int(2.4 * FPS) + 1), 0)), opacity=show_from(A('north')))],
     [Note('7+ km every second', A('seven'), 'title', pos=(.78 * W, .3 * H)), src('Pravec et al. 2014', A('pull'))],
     sounds=[('whoosh', A('north'), -14), ('ding', plus(A('minutes', edge='end'), 3), -16)])
MOVED = A('moved', edge='end')
shot('a23', None, [arka(x=.36, h=.5, poses=[(0, 'stand'), (MOVED, 'panic')], faces=[(0, 'neutral'), (MOVED, 'scared')])],
     [surf(), globe('earth', .74, .3, .5, center=(30, 15), spin=.03), kit(F, 'pebbles', 'debris', .5, .86, .5, count=10, color='#8a8278', level=lv((0, 0), (MOVED, 0), (plus(MOVED, 40), 1)))],
     [], shake=[(MOVED, 45, .014)], sounds=[('rumble', MOVED, -8), ('crack', plus(MOVED, 4), -16)])
shot('a24', T3, [], [globe('earth', .2, .5, .38, center=(30, 15), spin=.03), rock('apo', .64, .5, .22, scale=tk(1, A('harder'), (20, 1.12, 'smoothstep'), (40, .96, 'smoothstep'), (56, 1, 'smoothstep')), anchor={'x': .64 * W, 'y': .5 * H}),
                     kit(F, 'pull', 'pressure-arrows', .64, .5, .5, direction='out', color=SRC, opacity=window(A('harder'), plus(A('harder'), 70)))],
     [Note('tear it apart?', A('tear'), 'title', color=CLAIM), Note("gravity changes only a few %", A('percent'), 'note')], stamps=[(0, A("won't"))],
     sounds=[('tear', A('tear'), -18)])
shot('a25', T3, [], [rock('apo', .36, .55, .5, x=track(*([(0, 0), (plus(A('shiver'), -1), 0)] + [(plus(A('shiver'), k), (-10 if k % 4 else 10)) for k in range(2, 26, 2)] + [(plus(A('shiver'), 28), 0)]))),
                     kit(F, 'slide', 'debris', .46, .36, .4, count=10, color='#8a8278', level=lv((0, 0), (A('landslides'), 0), (plus(A('landslides'), 60), 1))),
                     kit(F, 'ml', 'motion-lines', .36, .55, .5, color=SRC, opacity=show_from(A('tumbling')))],
     [Note('the tumbling changes', A('tumbling'), 'note', pos=(.78 * W, .3 * H)), Note('small landslides', A('landslides'), 'note', pos=(.78 * W, .44 * H)),
      Note('not destruction. a shiver.', A('shiver'), 'title', pos=(.76 * W, .76 * H))],
     sounds=[('rumble', A('landslides'), -16), ('crack', A('quakes'), -18)])
END26 = A('us', edge='end')
shot('a26', T3, [arka(x=.22, h=.38, poses=[(0, 'stand'), (A('enormous'), 'cower'), (END26, 'wave')], faces=[(0, 'shocked'), (END26, 'grin')])],
     [surf(), globe('earth', .62, .3, .9, center=(30, 15), spin=.05,
                    x=track((0, 300), (A('Closest'), 300), (A('enormous'), 0, 'smoothstep'), (A('slowly'), -200, 'smoothstep'), (plus(END26, 60), -900, 'smoothstep')),
                    scale=track((0, 1), (A('slowly'), 1), (plus(END26, 60), .12, 'smoothstep')), anchor={'x': .62 * W, 'y': .3 * H})],
     [Note('closest approach', A('approach'), 'title', pos=(.5 * W, .9 * H), until=A('slowly'))],
     cam=[kf(0, 1.0), kf(A('enormous'), 1.08, (.6, .3)), kf(A('slowly'), 1.0, (.5, .5), x=.05), kf(plus(END26, 20), 1.0, (.5, .5), x=-.05), kf(plus(END26, 60), 1.0)],
     sounds=[('riser', plus(A('approach', edge='end'), 2), -16), ('whoosh', A('slowly'), -10), ('wind', END26, -18)])

# ------------------------------------------------------------------ chapter 3: what if we were heading for that?
WORLD = [-180, -60, 180, 80]
shot('a27', T4, [arka(x=.3, h=.46, poses=[(0, 'point-left'), (A('heading'), 'think')], faces=[(0, 'neutral'), (A('heading'), 'shocked')])],
     [surf(), globe('earth', .82, .3, .07, center=(30, 15))], [Note('what if it hit?', A('heading'), 'title')], sounds=[('slam', A('heading'), -16)])
shot('a28', None, [arka(x=.16, poses=[(0, 'point-right')], faces=[(0, 'smug')])],
     [kit(F, 'world', 'map', .6, .5, .5, bbox=WORLD, scale=tk(.2, A('maps'), (14, 1, 'ease-out-back')), anchor={'x': .6 * W, 'y': .5 * H}, opacity=show_from(A('maps'))),
      kit(F, 'stripe', 'arrow', .6, .5, .62, rotation=-14, color=WARN, level=lv((0, 0), (A('exactly'), 0), (A('lands', edge='end'), 1)))],
     [], sounds=[('tear', A('maps'), -16), ('whoosh', A('exactly'), -18)])
shot('a29', T4, [], [kit(F, 'world', 'map', .5, .6, .42, bbox=WORLD),
                     kit(F, 'stripe', 'arrow', .5, .6, .52, rotation=-14, color=WARN, opacity=show_until(A('prediction'))),
                     kit(F, 'if', 'sign', .5, .56, .2, w=1.8, text='IF IT HIT', **pop_in(A('prediction'), (.5 * W, .56 * H)))],
     [Note('the risk maps', 4, 'title', color=CLAIM, pos=(.3 * W, .2 * H)), Note("a what-if, not a prediction", A('prediction'), 'note', pos=(.5 * W, .9 * H)),
      src('B612 Foundation path of risk, 2008', A('strip'))],
     stamps=[(0, 8, 'half true')], sounds=[('pop', A('prediction'), -16)])


def fly_cal(pid, x, y, text, at):
    """A calendar page crossed out on `at`, then torn off and flying away."""
    return [cal(pid, x, y, .18, text, x=tk(0, plus(at, 14), (24, 900, 'ease-in-back')), y=tk(0, plus(at, 14), (24, -500, 'ease-in-back')), rotate=tk(0, plus(at, 14), (24, 70)), anchor={'x': x * W, 'y': y * H}),
            kit(F, pid + '-x', 'cross', x, y, .16, **popw(at, plus(at, 16), x, y))]


shot('a29b', T4, [], fly_cal('c29', .2, .4, '2029', A('2029')) + fly_cal('c36', .4, .4, '2036', A('2036')) + fly_cal('c68', .6, .4, '2068', A('2068')) +
     [kit(F, 'gold', 'dish', .78, .62, .3, level=lv((0, 0), (A('radar'), 0), (plus(A('radar'), 2), 1)), **pop_in(A('radar'), (.78 * W, .62 * H))),
      kit(F, 'gb', 'dish', .9, .72, .2, level=lv((0, 0), (A('Green'), 0), (plus(A('Green'), 2), 1)), **pop_in(A('Green'), (.9 * W, .72 * H)))],
     [Note('radar: Goldstone + Green Bank', A('radar'), 'note', pos=(.4 * W, .72 * H)), Note('no risk for 100+ years', A('hundred'), 'title', pos=(.4 * W, .84 * H)),
      src('NASA / ESA, March 2021', A('March'))],
     sounds=[('tear', plus(A('2029'), 14), -16), ('tear', plus(A('2036'), 14), -16), ('tear', plus(A('2068'), 14), -16), ('ding', A('hundred'), -16)])
shot('a30', None, [arka(x=.26, poses=[(0, 'think')], faces=[(0, 'neutral')])], [card('odds-card', .66, .42, .3, 'APOPHIS ODDS JUST WENT UP!', **pop_in(A('videos'), (.66 * W, .42 * H)))],
     [], sounds=[('pop', A('videos'), -16)])

shot('a31', T4, [], [apophis('apo', .58, .5, .1), apophis('pebble', .2, .3, .02, x=track((0, 0), (A('rock'), 0), (A('nudges'), 590, 'ease-in-back')), y=track((0, 0), (A('rock'), 0), (A('nudges'), 220, 'ease-in-back'))),
                     kit(F, 'hit', 'impact', .58, .44, .1, count=6, level=lv((0, .6)), **pop_in(A('nudges'), (.58 * W, .44 * H)))],
     [Note('"the odds went up"', 4, 'title', color=CLAIM), Note('a 2024 study', A('study'), 'note'), Note('an unseen rock nudges it?', A('nudges'), 'note')], stamps=[(0, A('half'), 'half true')])
shot('a32', T4, [], [kit(F, 'o1', 'sign', .26, .42, .22, w=1.8, h=1.0, text='1 IN 1,000,000', **pop_in(A('million'), (.26 * W, .42 * H))),
                     kit(F, 'o2', 'sign', .62, .42, .22, w=1.8, h=1.0, text='1 IN 1,000,000,000', **pop_in(A('billion'), (.62 * W, .42 * H)))],
     [Note('after 2029', A('after'), 'label', pos=(.26 * W, .62 * H)), Note('in 2029', A('Earth'), 'label', pos=(.62 * W, .62 * H)),
      Note('one look in 2027 settles most of it', A('2027'), 'note', pos=(.44 * W, .78 * H)), src('Wiegert 2024', A('million'))])
shot('a33', None, [arka(x=.36, poses=[(0, 'cheer')], faces=[(0, 'grin')])], [kit(F, 'o2', 'sign', .66, .42, .2, w=1.8, h=1.0, text='1 IN 1,000,000,000')], [])
# ------------------------------------------------------------------ the impact, shown honestly (a34-a36)
# A real map of Africa (Natural Earth); the zone is drawn to scale: ~150 km radius ("a few hundred kilometres across").
MAP_X, MAP_Y, MAP_S, BBOX, MARK, ZOOM = .4, .52, .82, [-20, -36, 55, 38], {'lon': -14, 'lat': 21, 'km': 150}, 12


def map_point(lon, lat):
    """Group fractions of a lon/lat on the map (same maths as the 'map' prop)."""
    import math
    k = MAP_S * min(W, H) / (BBOX[3] - BBOX[1]); cm = math.cos(math.radians((BBOX[1] + BBOX[3]) / 2))
    return MAP_X + (lon - (BBOX[0] + BBOX[2]) / 2) * cm * k / W, MAP_Y - (lat - (BBOX[1] + BBOX[3]) / 2) * k / H


MX, MY = map_point(MARK['lon'], MARK['lat'])  # the mark when the whole map shows; zoomed in it sits at the map's centre
ZX, ZY = MAP_X, MAP_Y
ZONE_D = 2 * MARK['km'] / 111 * MAP_S * min(W, H) / (BBOX[3] - BBOX[1]) * ZOOM / min(W, H)  # zone diameter when zoomed in (fraction of 1080)


def africa(pid, level, level2=None, **layer):
    return kit(F, pid, 'map', MAP_X, MAP_Y, MAP_S, w=.98, bbox=BBOX, mark=MARK, zoom=ZOOM, level=level, **({'level2': level2} if level2 else {}), **layer)


END34 = A('draw', edge='end')
shot('a34', T4, [], [
    globe('g', .3, .55, .5, center=(30, 10), opacity=show_until(A('draw'))),
    rock('fall', .78, .2, .06, x=tk(0, A('Pretend'), (30, -380, 'smoothstep')), y=tk(0, A('Pretend'), (30, 170, 'smoothstep')), opacity=show_until(A('draw'))),
    kit(F, 'ftrail', 'streak', .78, .2, .3, rotation=-24, level=lv((0, 0), (A('Pretend'), 0), (plus(A('Pretend'), 10), 1)),
        x=tk(0, A('Pretend'), (30, -380, 'smoothstep')), y=tk(0, A('Pretend'), (30, 170, 'smoothstep')), opacity=show_until(A('draw'))),
    kit(F, 'pause', 'sign', .62, .3, .2, w=1.8, text='WHAT IF?', **popw(plus(A('Pretend'), 30), A('heard'), .62, .3)),
    card('myth', .74, .6, .26, C1, **popw(A('heard'), A('draw'), .74, .6)),
    # "Let's draw it": the pen sweeps and the continent appears
    africa('map', lv((0, 1)), opacity=track((0, 0), (plus(A('draw'), -1), 0), (plus(END34, 36), 1))),
    kit(F, 'pen', 'pen', .2, .2, .16, x=tk(0, A('draw'), (14, 200), (24, 600), (36, 760), (44, 960)), y=tk(0, A('draw'), (14, 420), (24, 160), (36, 640), (44, 300)),
        opacity=window(A('draw'), plus(END34, 40), 3)),
], [], cam='settle', sounds=[('whoosh', A('Pretend'), -14), ('pop', A('heard'), -18), ('tear', A('draw'), -16), ('tear', plus(A('draw'), 22), -16)])

CONT = A('continent', edge='end')  # "Here's a continent." then the pause: zoom in, the rock falls, impact
ZIN, IMP = plus(CONT, 26), plus(CONT, 48)
shot('a35', T4, [], [
    africa('map', lv((0, 1), (plus(CONT, 2), 1), (ZIN, 0), (plus(A('look'), 0), 0), (plus(A('look'), 40), 1)),
           level2=lv((0, 0), (A('zone'), 0), (plus(A('zone'), 20), 1))),
    rock('fall', ZX + .3, ZY - .42, .05, x=tk(0, ZIN, (22, -.3 * W, 'smoothstep')), y=tk(0, ZIN, (22, .42 * H, 'smoothstep')), opacity=window(ZIN, IMP, 2)),
    kit(F, 'ftrail', 'streak', ZX + .3, ZY - .42, .35, rotation=-54, level=lv((0, 0), (ZIN, 0), (plus(ZIN, 6), 1), (IMP, 1), (plus(IMP, 1), 0)),
        x=tk(0, ZIN, (22, -.3 * W, 'smoothstep')), y=tk(0, ZIN, (22, .42 * H, 'smoothstep'))),
    flash('flash', level=lv((0, 0), (IMP, 0), (plus(IMP, 2), .9), (plus(IMP, 14), 0))),
    kit(F, 'sw', 'shockwave', ZX, ZY, ZONE_D, level=lv((0, 0), (IMP, 0), (plus(IMP, 45), 1))),
    kit(F, 'deb', 'debris', ZX, ZY, .5, count=12, level=lv((0, 0), (IMP, 0), (plus(IMP, 40), 1))),
    kit(F, 'dust', 'dust-cloud', ZX, ZY, ZONE_D * 1.1, level=lv((0, 0), (plus(IMP, 4), 0), (plus(IMP, 60), 1)), opacity=show_until(A('zone'))),
    # what "a terrible regional disaster" means: the towns inside the zone go dark
    *[kit(F, f'town{i}', 'town', ZX + dx, ZY + dy, .08, level=lv((0, 1), (plus(A('terrible'), 6 * i), 1), (plus(A('terrible'), 6 * i + 1), 0)), opacity=window(A('zone'), A('look')))
      for i, (dx, dy) in enumerate([(-.05, -.04), (.04, .02), (-.01, .08)])],
    kit(F, 'smoke', 'snowfall', ZX, ZY, ZONE_D * 1.2, count=10, color='#8a7f72', level=lv((0, 0), (A('regional'), 0), (plus(A('regional'), 20), 1)), opacity=window(A('regional'), A('look'))),
    kit(F, 'km', 'span', ZX, ZY + ZONE_D * .62, ZONE_D * .9, text='~300 km', level=lv((0, 0), (A('few'), 0), (plus(A('few'), 15), 1)), opacity=window(A('few'), A('look'))),
], [Note('a continent', A('continent'), 'title', pos=(.82 * W, .3 * H), until=ZIN),
    Note('a small country', A('country'), 'title', pos=(.8 * W, .78 * H), until=A('look')),
    Note('the same continent', plus(A('look'), 30), 'title', pos=(.82 * W, .3 * H))],
     cam=[kf(0, 1.0), kf(IMP, 1.0), kf(plus(IMP, 4), 1.08, (ZX, ZY)), kf(plus(IMP, 50), 1.0, (ZX, ZY)), kf(A('look'), 1.0), kf(plus(A('look'), 40), 1.0)],
     shake=[(IMP, 45, .016)],
     sounds=[('pop', A('continent'), -18), ('whoosh', plus(CONT, 2), -14), ('riser', plus(ZIN, -10), -16), ('boom', IMP, -6), ('rumble', plus(IMP, 6), -10),
             ('pop', A('zone'), -16), ('rumble', A('terrible'), -16), ('whoosh', A('look'), -14)])

shot('a36', None, [arka(x=.18, h=.42, poses=[(0, 'point-right'), (A('smaller'), 'shrug')], faces=[(0, 'shocked'), (A('smaller'), 'smug')])], [
    kit(F, 'map', 'map', .62, .5, .7, bbox=BBOX, mark=MARK, level2=lv((0, 1))),
    card('myth', .32, .3, .22, C1, rotate=lv((0, -5)), anchor={'x': .32 * W, 'y': .3 * H}),
    kit(F, 'sx', 'scribble', .32, .3, .14, level=lv((0, 0), (A('smaller'), 0), (plus(A('smaller'), 12), 1))),
    kit(F, 'myth-stamp', 'stamp', .34, .45, .13, text='myth', **pop_in(A('thumbnails'), (.34 * W, .45 * H))),
], [], cam='settle', sounds=[('tear', A('smaller'), -14), ('boom', A('thumbnails'), -20)])

# ------------------------------------------------------------------ quick round
shot('a37', T5, [], [kit(F, 'dino', 'dino', .16, .82, .22),
                     rock('kpg', .7, .52, .5, opacity=show_from(A('dinosaur-killer')), scale=tk(.3, A('dinosaur-killer'), (16, 1, 'ease-out-back')), anchor={'x': .7 * W, 'y': .52 * H}),
                     rock('apo', .3, .5, .02, **pop_in(A('Apophis'), (.3 * W, .5 * H)))],
     [Note('the end of the world?', A('end'), 'title', color=CLAIM, pos=(.2 * W, .2 * H)), Note('global: 1 km+ asteroids', A('Global'), 'note', pos=(.62 * W, .93 * H)),
      Note('dinosaur-killer: ~10 km', A('dinosaur-killer'), 'label', pos=(.7 * W, .16 * H)), Note('Apophis: < 0.5 km', A('Apophis'), 'label', pos=(.3 * W, .42 * H)),
      src('1 km+ for global effects', A('Global'))],
     stamps=[(0, A('No'))], cam=[kf(0, 1.0), kf(A('dinosaur-killer'), 1.0), kf(plus(A('dinosaur-killer'), 16), .94), kf(A('Apophis'), 1.25, (.3, .5))],
     sounds=[('boom', A('dinosaur-killer'), -14), ('pop', A('Apophis'), -14)])
shot('a38', T5, [], [kit(F, 'meter', 'speedometer', .3, .5, .42, text='megatons',
                         level=lv((0, .05), (A('forty'), .05), (plus(A('forty'), 8), .6), (plus(A('forty'), 16), .15), (A('ten'), .98), (plus(A('ten'), 10), .3), (A('rough'), .8), (A('roughly'), .45))),
                     *[flash(f'hb{i}', color='#ffe9a6', level=lv((0, 0), (plus(A('Hiroshima'), 3 * i), 0), (plus(A('Hiroshima'), 3 * i + 1), .25), (plus(A('Hiroshima'), 3 * i + 3), 0))) for i in range(4)]],
     [Note('40 to 10,000 megatons?', A('forty'), 'note'), Note('best estimate: ~1,000', A('roughly'), 'title'), Note('tens of thousands of Hiroshimas', A('Hiroshima'), 'note'),
      src('NASA est. 880 Mt', A('roughly'))], sounds=[('tick', A('forty'), -16), ('tick', A('ten'), -16), ('boom', A('Hiroshima'), -18)])
SEA = A('impact', edge='end')
shot('a39', T5, [], [kit(F, 'city', 'skyline', .72, .9, .36, count=6, highlight=2, level=lv((0, 1))),
                     kit(F, 'sea', 'wave', .3, .9, .5, level=lv((0, .02), (A('ocean'), .02), (plus(A('ocean'), 16), .2), (SEA, .3), (plus(SEA, 50), .6))),
                     rock('fall', .62, .1, .04, x=tk(0, A('ocean'), (14, -.34 * W, 'smoothstep')), y=tk(0, A('ocean'), (14, .64 * H, 'smoothstep')), opacity=show_until(plus(A('ocean'), 14))),
                     flash('fl', level=lv((0, 0), (plus(A('ocean'), 14), 0), (plus(A('ocean'), 16), .6), (plus(A('ocean'), 26), 0))),
                     kit(F, 'q', 'question', .5, .28, .14, **pop_in(A('know'), (.5 * W, .28 * H)))],
     [Note('a wall of water?', A('wall'), 'title', color=CLAIM)], stamps=[(0, A('know'), "we don't know")],
     shake=[(plus(A('ocean'), 14), 20, .01)], sounds=[('splash', plus(A('ocean'), 14), -10), ('riser', SEA, -14), ('rumble', plus(SEA, 30), -14)])
CHILE = [-82, -46, -60, -14]
shot('a39b', T5, [person('melosh', .14, h=.4, poses=[(0, 'think'), (A('wrong'), 'point-right')], faces=[(0, 'neutral')])],
     [kit(F, 'sea', 'wave', .42, .9, .5, level=lv((0, .6), (A('wave-breaking'), .6), (plus(A('wave-breaking'), 40), 1)), opacity=show_until(A('Chile'))),
      kit(F, 'chile', 'map', .62, .48, .7, bbox=CHILE, opacity=show_from(A('Chile'))),
      kit(F, 'ok', 'check', .66, .5, .12, **pop_in(A('tsunami'), (.66 * W, .5 * H)))],
     [Note('impact researchers', A('researchers'), 'label', pos=(.14 * W, .3 * H)), Note('waves break', A('wave-breaking'), 'title', pos=(.42 * W, .2 * H), until=A('Chile')),
      Note('~2 million years ago: no giant tsunami', A('tsunami'), 'note', pos=(.5 * W, .9 * H)), src('Acta Astronautica 2021 · Melosh', A('researchers'))],
     sounds=[('splash', A('wave-breaking'), -12), ('pop', A('Chile'), -16)])
shot('a40', T5, [], [kit(F, 'sea', 'wave', .22, .9, .2, level=lv((0, .45))), kit(F, 'ok', 'check', .08, .4, .12, **pop_in(A('yes'), (.08 * W, .4 * H))),
                     kit(F, 'city', 'skyline', .2, .9, .2, count=5, highlight=2, level=lv((0, 1)), opacity=show_from(A('guaranteed'))),
                     kit(F, 'no', 'question', .08, .64, .12, **pop_in(A('promise'), (.08 * W, .64 * H)))],
     [Note('dangerous coastal waves: yes', A('dangerous'), 'note', pos=(.6 * W, .4 * H)), Note('a guaranteed skyscraper of water: no one can promise', A('guaranteed'), 'note', pos=(.58 * W, .64 * H))],
     sounds=[('ding', A('yes'), -16)])
shot('a41', None, [arka(x=.3, poses=[(0, 'point-right')], faces=[(0, 'smug')])],
     [kit(F, f'tick{i}', 'check', .52, y, .08, **pop_in(a, (.52 * W, y * H))) for i, (y, a) in enumerate([(.32, A('bad')), (.46, A('regional')), (.6, A('happening'))])],
     [Note('bad', A('bad'), 'title', pos=(.68 * W, .32 * H)), Note('regional', A('regional'), 'title', pos=(.68 * W, .46 * H)), Note('not happening', A('happening'), 'title', pos=(.68 * W, .6 * H))])
shot('a42', None, [], [kit(F, 'ok', 'check', .5, .45, .24, **pop_in(A('exactly'), (.5 * W, .45 * H)))], [], stamps=[], sounds=[('ding', plus(A('exactly', edge='end'), 6), -16)])

# ------------------------------------------------------------------ chapter 4: who's flying with us
shot('a43', T6, [arka(x=.2, h=.4, poses=[(0, 'point-right'), (A('racing'), 'cheer')], faces=[(0, 'happy')])],
     [surf(), cal('cal', .5, .4, .22, '13 APR 2029'),
      *[kit(F, f'r{i}', 'rocket', x, .7, .14, y=tk(0, plus(A('agencies'), 4 + 8 * i), (50, -900, 'smoothstep')), **{'opacity': show_from(A('two'))}) for i, x in enumerate([.72, .86])]],
     [Note("a date that can't move", A('date'), 'note')], sounds=[('whoosh', plus(A('agencies'), 4), -12), ('rumble', plus(A('agencies'), 4), -16)])
shot('a44', T6, [], [rock('apo', .7, .5, .1, x=track(*([(0, 0), (plus(A('shiver'), -1), 0)] + [(plus(A('shiver'), k), (-6 if k % 4 else 6)) for k in range(2, 22, 2)] + [(plus(A('shiver'), 24), 0)]))),
                     kit(F, 'ramses', 'probe', .36, .45, .12, x=track((0, -200), (A('launches'), -200), (A('February'), 0, 'ease-out-cubic'))),
                     cal('cal', .2, .72, .16, 'FEB 2029', at=A('February')), kit(F, 'clock', 'clock', .5, .78, .12, level=lv((0, 0), (A('late'), 0), (plus(A('late'), 2), 1)))],
     [Note('RAMSES · Europe + Japan', A('Ramses'), 'title'), Note('"cannot be late"', A('late'), 'note'), src('ESA', A('Ramses'))], sounds=[('tick', A('late'), -14), ('rumble', A('shiver'), -18)])
shot('a44b', T6, [], [rock('apo', .64, .5, .14), kit(F, 'ramses', 'probe', .3, .2, .1),
                      kit(F, 'c1', 'satellite', .3, .36, .06, **pop_in(A('two'), (.3 * W, .36 * H))),
                      kit(F, 'scan', 'signal', .4, .36, .2, opacity=show_from(A('radar'))),
                      kit(F, 'c2', 'satellite', .3, .64, .06, **pop_in(plus(A('two'), 6), (.3 * W, .64 * H)),
                          x=tk(0, A('land'), (30, 300, 'smoothstep')), y=tk(0, A('land'), (16, -30, 'ease-out-cubic'), (30, 0, 'ease-out-back')))],
     [Note('two shoebox helpers', A('shoebox-sized'), 'title'), Note('radar: inside the rock', A('radar'), 'note'), Note('a lander', A('land'), 'note')],
     sounds=[('pop', A('two'), -14), ('pop', plus(A('two'), 6), -14), ('bubble', plus(A('land'), 30), -14)])
shot('a45', T6, [], [rock('apo', .66, .5, .14), kit(F, 'apex', 'probe', .3, .45, .12, x=tk(0, A('thrusters'), (20, 260, 'smoothstep'))),
                     kit(F, 'puff', 'plume', .55, .5, .14, opacity=show_from(plus(A('thrusters'), 18))),
                     kit(F, 'dust', 'debris', .6, .48, .3, count=8, color='#b8b2a6', level=lv((0, 0), (plus(A('thrusters'), 18), 0), (plus(A('thrusters'), 70), 1)))],
     [Note('OSIRIS-APEX · NASA', A('OSIRIS-APEX'), 'title'), Note('brought Bennu home, 2023', A('Bennu'), 'note'), Note('stays ~18 months', A('eighteen'), 'note'),
      src('NASA · Univ. of Arizona', A("NASA's"))], sounds=[('sizzle', plus(A('thrusters'), 18), -16)])
shot('a45b', T6, [], [kit(F, 'apex', 'probe', .24, .5, .1), rock('dot', .8, .5, .02), kit(F, 'eye', 'magnifier', .52, .5, .16, x=tk(0, A('watching'), (30, 120, 'smoothstep')))],
     [Note('watching from 2 weeks out', A('two'), 'note'), Note('millions of km ahead', A('millions'), 'small')], cam='push')
ORB = [(0, 0), (20, 1), (40, 0), (60, -1), (80, 0)]
shot('a46', None, [arka(x=.24, poses=[(0, 'cheer')], faces=[(0, 'grin')])],
     [rock('apo', .66, .45, .14),
      *[kit(F, f'p{i}', 'probe', .66 + dx, .45 + dy, .06, x=track(*[(f + 10 * i, v * 160 * (1 if i % 2 else -1), 'smoothstep') for f, v in ORB + [(100, 1), (120, 0), (140, -1), (160, 0)]]),
            y=track(*[(f + 10 * i, v * 60, 'smoothstep') for f, v in [(0, 1), (20, 0), (40, -1), (60, 0), (80, 1), (100, 0), (120, -1), (140, 0)]])) for i, (dx, dy) in enumerate([(-.12, -.18), (.12, .2), (.16, -.16)])],
      *[kit(F, f'f{i}', 'sparkle', .66 + dx, .45 + dy, .12, count=4, color='#ffffff', level=lv((0, 0), (plus(A('studied'), 8 * i), 0), (plus(A('studied'), 8 * i + 2), 1), (plus(A('studied'), 8 * i + 6), 0)))
        for i, (dx, dy) in enumerate([(-.12, -.18), (.12, .2), (.16, -.16), (-.1, .16)])]],
     [Note('scariest → most studied', A('studied'), 'title', pos=(.66 * W, .82 * H))],
     sounds=[('pop', A('studied'), -16), ('pop', plus(A('studied'), 8), -16), ('pop', plus(A('studied'), 16), -16), ('pop', plus(A('studied'), 24), -16)])

# ------------------------------------------------------------------ ending: from your balcony (a warm city at night)
shot('a47', TE, [person('you', .14, h=.42, poses=[(0, 'stand'), (A('see', n=1), 'point-right')], faces=[(0, 'happy')])],
     [kit(F, 'city', 'skyline', .58, .95, .5, count=7, highlight=4, level=lv((0, 1)))] + star('star', .6, .25, opacity=show_from(A('see', n=1))),
     [Note("you don't have to ride it", A('ride'), 'title', pos=(.6 * W, .14 * H))], cam='push', sounds=[('ding', plus(A('it', n=2, edge='end'), 3), -18)])
shot('a48', TE, [person('you', .1, h=.38, poses=[(0, 'point-right')], faces=[(0, 'happy')], layer={'opacity': show_until(A('Europe'))})],
     [kit(F, 'city', 'skyline', .34, .95, .42, count=7, highlight=4, level=lv((0, 1)), opacity=show_until(A('Europe'))), moon_disc('moon', .5, .25, .03, opacity=show_until(A('Europe'))),
      ] + star('star', .3, .3, x=track((0, 0), (A('crossing'), 0), (A('minute'), 260, 'linear')), opacity=show_until(A('Europe'))) + [
      globe('view', .34, .55, .66, center=(30, 20), spin=.02, **popw(A('Europe'), plus(A('eyes', edge='end'), 30), .34, .55)),
      kit(F, 'glow', 'sparkle', .3, .45, .5, count=10, level=lv((0, 0), (A('Europe'), 0), (plus(A('Europe'), 20), 1)), opacity=show_from(A('Europe'))),
      kit(F, 'ppl', 'sign', .76, .6, .22, w=1.8, text='~2 BILLION PEOPLE', **pop_in(A('billion'), (.76 * W, .6 * H)))],
     [Note('a star that moves', A('star'), 'title', until=A('Europe')), Note('one Moon-width a minute', A('crossing'), 'note', until=A('Europe')),
      Note('India: ~2 AM, 14 April', A('India'), 'note', pos=(.76 * W, .3 * H)), src('JPL · ESA', A('star'))],
     sounds=[('whoosh', A('Europe'), -16), ('ding', A('India'), -16), ('chime', A('billion'), -20)])
shot('a49', TE, [person('you', .1, h=.38, poses=[(0, 'stand')], faces=[(0, 'happy')])],
     [kit(F, 'city', 'skyline', .34, .95, .42, count=7, highlight=4, level=lv((0, 1)))] +
     star('star', .56, .3, opacity=show_until(plus(A('glare'), 30))) + [
      kit(F, 'bright', 'sparkle', .56, .3, .3, count=8, level=lv((0, 0), (A('brightest'), 0), (plus(A('brightest'), 30), 1), (A('glare'), 1), (plus(A('glare'), 30), 0))),
      flash('dawn', color='#ffb36b', level=lv((0, 0), (A('glare'), 0), (plus(A('glare'), 40), .22), (A('early'), .22), (plus(A('early'), 20), 0))),
      kit(F, 'clock', 'clock', .8, .32, .16, level=lv((0, .3)))],
     [Note('brightest ~1 hour before', A('brightest'), 'note'), Note('be out early, somewhere dark', A('early'), 'title')])
QUIET = A('found', n=2, edge='end')
shot('a49b', TE, [person('tucker', .3, h=.44, poses=[(0, 'point-right')], faces=[(0, 'neutral')], layer={'opacity': track((0, 1), (A("won't"), 1), (plus(A("won't"), 30), .35))}),
                  *[person(f'watcher{i}', x, h=.22, fy=.92, poses=[(0, 'point-right' if i % 2 else 'stand')], faces=[(0, 'happy')], enter=('pop', plus(A('two'), 5 * i)))
                    for i, x in enumerate([.5, .6, .7, .8, .9])]],
     [kit(F, 'obs', 'observatory', .14, .82, .3, level=lv((0, 1)), opacity=track((0, 1), (A("won't"), 1), (plus(A("won't"), 30), .35)))] + star('star', .66, .3),
     [Note('Roy Tucker, 1951–2021', 4, 'label', pos=(.3 * W, .3 * H)), Note('~2 billion people will see what he found', A('see'), 'title', pos=(.6 * W, .74 * H))],
     cam=[kf(0, 1.0), kf(QUIET, 1.0), kf(plus(QUIET, 60), 1.06, (.66, .4))])
shot('a50', TE, [person('you', .12, h=.42, poses=[(0, 'stand'), (A('watch'), 'wave')], faces=[(0, 'happy')])],
     [*[card(f'fold{i}', x, y, .16, txt, x=tk(0, A('fear'), (20, (.62 - x) * W, 'smoothstep')), y=tk(0, A('fear'), (20, (.4 - y) * H, 'smoothstep')),
             scale=tk(1, A('fear'), (20, .2, 'smoothstep')), anchor={'x': x * W, 'y': y * H}, opacity=show_until(plus(A('fear'), 22)))
        for i, (txt, x, y) in enumerate([(C1, .4, .28), (C2, .82, .28), (C3, .4, .56), (C4, .82, .56)])],
      cal('cal', .62, .4, .26, 'FRI 13 APRIL 2029', at=plus(A('fear'), 20)),
      kit(F, 'city', 'skyline', .5, .98, .4, count=7, highlight=4, level=lv((0, 1)))] + star('star', .62, .14, x=track((0, 0), (A('Friday'), 0), (plus(A('star'), 20), 160, 'linear'))),
     [Note('fear → a date in the calendar', A('calendar'), 'title', pos=(.6 * W, .66 * H)), Note('go and watch a star that moves', A('watch'), 'note', pos=(.6 * W, .78 * H))],
     sounds=[('whoosh', A('fear'), -14), ('chime', plus(A('fear'), 20), -18)])
PULL = A('in', edge='end')
shot('a51', None, [arka(x=.24, poses=[(0, 'think'), (A('black'), 'point-right'), (PULL, 'cower')], faces=[(0, 'neutral'), (A('black'), 'shocked')])],
     [disc('sun', .66, .44, .14, '#ffcf4a', ('#ffe27a', '#ffcf4a'), shade=.05, seed=2, scale=tk(1, A('black'), (30, .25, 'ease-in-back')), anchor={'x': .66 * W, 'y': .44 * H}, opacity=show_until(plus(A('black'), 30))),
      disc('bh', .66, .44, .04, '#030305', (), shade=0, seed=2, opacity=show_from(plus(A('black'), 28))),
      kit(F, 'ring', 'orbit-ring', .66, .44, .5, color='#ffb347', opacity=show_from(plus(A('black'), 28))),
      globe('earth', .9, .44, .06, center=(30, 15), x=track((0, 0), (PULL, 0), (plus(PULL, 20), -230, 'smoothstep'), (plus(PULL, 40), -460, 'smoothstep'), (plus(PULL, 60), -230, 'smoothstep')),
            y=track((0, 0), (PULL, 0), (plus(PULL, 20), -230, 'smoothstep'), (plus(PULL, 40), 0, 'smoothstep'), (plus(PULL, 60), 230, 'smoothstep')))],
     [Note('the strongest pull there is?', A('strongest'), 'note', pos=(.66 * W, .82 * H))],
     shake=[(plus(A('black'), 28), 20, .01)], sounds=[('boom', plus(A('black'), 28), -10), ('rumble', PULL, -16), ('whoosh', plus(PULL, 20), -18)])

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
    pause_cut(json.loads(STORY.read_text()), 'jobs/e7-narration', PAUSES, 'apophis-beats', str(ROOT / 'stories/apophis-beats-cut.json'))
    board = ep.build()
    board['scenes'][-1]['durationFrames'] += END_CARD * FPS
    path = ROOT / 'storyboards/apophis.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
