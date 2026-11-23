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
PAUSES = [('a1', None, 1.2), ('a2', None, 3.6), ('a3', None, 1.6), ('a6', None, 4.8),
          ('a34', None, 1.4), ('a35', "Here's a continent.", 4.6), ('a35', None, 1.2)]
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 610  # narration 594.9 s with 18.4 s of pauses + 3.1 s tail + 12 s end card
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


def shot(bid, chapter, chars=(), props=(), notes=(), cam='settle', sounds=(), stamps=(), shake=()):
    """stamps: [(note index, anchor[, label])], counted among `notes` (the header is added in front automatically)."""
    off = 1 if chapter else 0
    ep.scene(bid, explain(list(chars), list(props), ([head(chapter)] if chapter else []) + list(notes), camera_preset=cam, sounds=list(sounds), shake=list(shake),
                          stamps=[(st[0] + off,) + tuple(st[1:]) for st in stamps]))


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


def globe(pid, px, py, size, center=(20, 12), **layer):
    return kit(F, pid, 'globe', px, py, size, center=list(center), **layer)


def card(pid, px, py, size, text, **layer):
    return kit(F, pid, 'headline', px, py, size, w=1.6, text=text, **layer)


def rock(pid, px, py, size, rot=0, **layer):
    """Apophis at a given rotation (an upright rock is 'a skyscraper'); size = its height across its short axis."""
    layer.setdefault('anchor', {'x': px * W, 'y': py * H})
    if 'rotate' not in layer: layer['rotate'] = track((0, rot - 4), (1800, rot + 4, 'linear'))
    return kit(F, pid, 'asteroid', px, py, size, w=1.7, h=1.0, color=ROCK, **layer)


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
    kit(F, 'fl1', 'flash', .5, .5, .5, level=lv((0, 0), (HIT, 0), (plus(HIT, 2), .85), (plus(HIT, 12), 0))),
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
    kit(F, 'fl2', 'flash', .5, .5, .5, level=lv((0, 0), (plus(END2, 46), 0), (plus(END2, 48), .7), (plus(END2, 60), 0))),
], [], cam=[kf(0, 1.0), kf(plus(A('wipes'), -1), 1.0), kf(plus(A('wipes'), 2), 1.1, (.36, .48)), kf(plus(A('wall'), -1), 1.12, (.36, .48)), kf(plus(A('wall'), 2), 1.0),
            kf(plus(A('mapped'), 0), 1.06, (.36, .5)), kf(plus(END2, 8), 1.0)],
     shake=[(HIT, 24, .012), (A('world'), 30, .01), (plus(END2, 46), 20, .014)],
     sounds=[('boom', HIT, -10), ('crack', A('ends'), -10), ('rumble', A('world'), -12), ('splash', A('high'), -10), ('whoosh', A('mapped'), -16),
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
     [Note("we're going to ride it", A('going'), 'title', pos=(.5 * W, .2 * H), until=plus(END6, 4))] + sting_notes,
     cam=[kf(0, 1.0, (.5, .5)), kf(plus(END6, 2), 1.0, (.5, .5)), kf(LAND_ON, 1.1, (.6, .45)), kf(plus(LAND_ON, 30), 1.0, (.5, .5))],
     shake=[(LAND_ON, 10, .006)],
     sounds=[('whoosh', A('going'), -16), ('pop', plus(END6, 2), -18), ('slam', LAND_ON, -16), ('whoosh', plus(LAND_ON, 8), -10)] + sting_sounds)

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
    kit(F, 'flash', 'flash', .5, .5, .5, level=lv((0, 0), (IMP, 0), (plus(IMP, 2), .9), (plus(IMP, 14), 0))),
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
    pause_cut(json.loads(STORY.read_text()), 'jobs/e7-narration', PAUSES, 'apophis-beats', str(ROOT / 'stories/apophis-beats-cut.json'))
    board = ep.build()
    board['scenes'][-1]['durationFrames'] += END_CARD * FPS
    path = ROOT / 'storyboards/apophis.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
