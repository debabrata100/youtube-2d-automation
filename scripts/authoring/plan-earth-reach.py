"""Earth-reaches-the-Moon Shorts, 9:16. G1: the Moon is inside Earth's atmosphere (geocorona). R1: Earth is rusting the Moon.
Script and facts: stories/earth-reach-shorts-script.md (titles, sources, camera and caption decisions of 23 Nov 2026).

Look borrowed from the GeoGlobeTales frame study: one continuous world per Short (an Earth-Moon space the camera glides
through; the world layers share one zoom), big words on the reveals, small place labels, a NOT TO SCALE tag on diagrams,
burned-in captions (render with --caption-style config/caption-styles/shorts-night.json).

Usage: python3 scripts/authoring/plan-earth-reach.py geo|rust [duration_seconds] [output_storyboard]
       python3 scripts/authoring/plan-earth-reach.py geo|rust --script-only
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes
LIGHT = '#eef1f8'
recipes.INK = LIGHT

ROOT = pathlib.Path(__file__).resolve().parents[2]
NAME = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('geo', 'rust') else sys.exit(__doc__)
SID = {'geo': 'earth-atmosphere-moon', 'rust': 'moon-rusting'}[NAME]
STORY = ROOT / f'stories/{SID}.json'
N, K = 'narrator', 'arka'
SHOTS = []


def line(bid, *parts, intent='explanation'):
    SHOTS.append((bid, intent, list(parts)))


# ------------------------------------------------------------------ scripts (approved for narration 23 Nov 2026)
if NAME == 'geo':
    TITLE = "Why the Moon Is Inside Earth's Atmosphere"
    TOPIC = ("Earth's geocorona, a thin hydrogen cloud, reaches about 630,000 km (ESA/NASA SOHO, 2019), almost twice the Moon's distance, "
             'so the Moon moves inside it; Apollo 16 photographed it from the Moon in 1972; Artemis II (April 2026, 406,771 km) stayed inside it')
    line('g1', (N, "No human has ever left Earth's atmosphere. Not even the astronauts who flew around the Moon this year."), intent='hook')
    line('g2', (K, 'Wait. The Moon is in space!'), intent='hook')
    line('g3', (N, "We say space starts a hundred kilometers up. But Earth's air doesn't just stop. It fades into a thin cloud of hydrogen."))
    line('g4', (N, 'Old data from the SOHO spacecraft showed that cloud reaches six hundred and thirty thousand kilometers. Almost twice as far as the Moon.'), intent='payoff')
    line('g5', (N, "So the Moon flies through Earth's atmosphere. Apollo 16 astronauts photographed its glow from the Moon, never knowing they were inside it."), intent='payoff')
    line('g6', (N, 'In April, Artemis 2 flew humans farther than ever. Over four hundred thousand kilometers. Still inside.'), intent='payoff')
    line('g8', (N, "Out there it's so thin, we'd call it a vacuum. But where it touches the Moon, it's leaving a mark."), intent='closing')
else:
    TITLE = 'Why the Moon Is Rusting'
    TOPIC = ("Hematite (rust) near the Moon's poles in Chandrayaan-1 M3 data (Li et al., Science Advances 2020); oxygen from Earth's upper "
             "atmosphere reaches the Moon along Earth's magnetotail around full Moon, when the tail also blocks over 99% of the solar wind; more hematite on the near side")
    line('r1', (N, "The Moon is rusting. And it's Earth's fault."), intent='hook')
    line('r2', (K, "Rust? There's no air up there!"), intent='hook')
    line('r3', (N, "Then scientists studied data from India's Chandrayaan-1, and found hematite near the Moon's poles. Rust."))
    line('r4', (N, 'Rust needs oxygen. So where does the Moon get it? From us.'), intent='payoff')
    line('r5', (N, "Earth's magnetic field trails a long tail. Around every full Moon, the Moon passes through it, and oxygen from our air drifts along to the Moon."), intent='payoff')
    line('r6', (N, 'The tail also blocks the solar wind, which normally stops rust from forming.'))
    line('r7', (N, "The clue? There's more rust on the side that faces Earth."), intent='payoff')
    line('r9', (N, "A little of Earth's sky, turning to rust on the Moon."), intent='closing')


def phrases(text, limit=26):
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…:]$', cur): out.append(cur); cur = ''
    return out + ([cur] if cur else [])


def write_story(duration):
    beats = []
    for bid, intent, parts in SHOTS:
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
        assert len(ph) <= 12, bid
        beats.append({'id': bid, 'sceneId': f'{NAME[0]}r-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': SID, 'title': TITLE, 'topic': TOPIC,
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': f'storyboards/{SID}.json', 'candidatesReport': 'stories/earth-reach-shorts-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    s = write_story(50)
    print('wrote', STORY.name, len(s['beats']), 'beats,', sum(len(b['narration'].split()) for b in s['beats']), 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ storyboard (9:16)
DURATION = int(sys.argv[2]) if len(sys.argv) > 2 else (54 if NAME == 'geo' else 42)
write_story(DURATION)
ep = Episode(str(STORY), 'tall'); F = ep.F; W, H = F['W'], F['H']; MS = min(W, H)
ep.pop_db, ep.deviation_tolerance = -24, .3
ep.theme = 'paint-night'
GOLD, SKY, RUST, HAZE = '#ffd25e', '#a9d8ff', '#c2683a', '#9fc8ff'
MOONC = '#bdb8ad'
C = (W / 2, H / 2)
MOON_R = .05 if NAME == 'geo' else .075   # drawn far bigger than scale (NOT TO SCALE); R1 is about the Moon's surface
EARTH_SIZE = .16 if NAME == 'geo' else .12
WIDE = 1.15                                # wide shots: the 630,000 km cloud overfills the width, so the frame is full

# ---- the world: one Earth-Moon space in group pixels, drawn at zoom 1 so the 630,000 km geocorona just fits.
E = (540, 1180)                       # Earth (drawn far bigger than scale: NOT TO SCALE)
R_GC = 500                            # 630,000 km
R_MOON = R_GC * 384.4 / 630           # 305 px: the Moon's orbit
M = (E[0] + R_MOON * .5, E[1] - R_MOON * .866)  # Moon, up and to the right


def cam(keys):
    """World camera: keys [(frame, zoom, (px, py) world point shown at the screen centre)]. Returns layer tracks that every
    world layer shares (scale about the screen centre, then an offset), so the whole world zooms and glides as one."""
    sc, xs, ys = [], [], []
    for f, z, (px, py) in keys:
        sc.append((f, z, 'smoothstep')); xs.append((f, round(-z * (px - C[0]), 1), 'smoothstep')); ys.append((f, round(-z * (py - C[1]), 1), 'smoothstep'))
    return {'scale': track(*sc), 'x': track(*xs), 'y': track(*ys), 'anchor': {'x': C[0], 'y': C[1]}}


def wl(layer, view, **extra):
    """A world layer under the shared camera (extra opacity etc. kept)."""
    layer = dict(layer); layer.update(view)
    for k, v in extra.items(): layer[k] = v
    return Prop(layer, None)


def world(view, corona=1.0, corona_level=None, moon=True, orbit=True, earth=True, moon_extra=None, rust=None, corona_opacity=None, moon_r=None):
    moon_r = moon_r or MOON_R
    out = []
    lvl = corona_level or [{'frame': 0, 'value': corona}]
    if corona or corona_level:
        out.append(wl(prop('corona', 'geocorona', E[0] / W, E[1] / H, 2 * R_GC / MS, level=lvl, color=HAZE), view, **({'opacity': corona_opacity} if corona_opacity else {})))
    if orbit: out.append(wl(prop('moon-orbit', 'orbit-ring', E[0] / W, E[1] / H, 2 * R_MOON / MS), view))
    if earth: out.append(wl(prop('earth', 'globe', E[0] / W, E[1] / H, EARTH_SIZE, center=[78, 18]), view))
    if moon: out.append(wl(planet('moon', M[0] / W, M[1] / H, moon_r, MOONC, (), craters=5, shade=.3, seed=4), view, **(moon_extra or {})))
    if rust: out.append(wl(prop('moon-rust', 'rust-spots', (M[0] - moon_r * MS * .2) / W, (M[1] - moon_r * MS * .35) / H, moon_r * 1.5, level=rust, count=6), view))
    return out


def big(pid, text, at, y=.31, size=.12, color=GOLD, until=None):
    op = track((0, 0), (plus(at, -1), 0), (at, 1)) if until is None else track((0, 0), (plus(at, -1), 0), (at, 1), (plus(until, -1), 1), (until, 0))
    return Prop(prop(pid, 'bigword', .5, y, size, text=text, color=color, opacity=op,
                     scale=track((0, .5), (plus(at, -1), .5), (plus(at, 8), 1, 'ease-out-back')), anchor={'x': W / 2, 'y': y * H}), None)


def label(text, at, pos, until=None):
    return Note(text, at, 'label', pos=pos, until=until, size=62)


def item(pid, it, kx, ky, size, at=0, **extra):
    return Prop(prop(pid, it, kx, ky, size, **extra, **(pop_in(at, (kx * W, ky * H)) if at else {})), None)


NOT_TO_SCALE = lambda at=0: Note('NOT TO SCALE', at, 'label', pos=(220, 1395), size=40)


def screen(P, z, Fp):
    """Where world point P appears on screen under a static camera (zoom z, world point Fp at the centre)."""
    return (C[0] + z * (P[0] - Fp[0]), C[1] + z * (P[1] - Fp[1]))


def moving(layer, z, Fp, path):
    """A world layer that also travels: path [(frame, (dx, dy) world displacement)] under a static camera (z, Fp)."""
    base_x, base_y = -z * (Fp[0] - C[0]), -z * (Fp[1] - C[1])
    layer = dict(layer)
    layer.update(scale=track((0, z)), anchor={'x': C[0], 'y': C[1]},
                 x=track(*[(f, round(base_x + z * d[0], 1), 'smoothstep') for f, d in path]), y=track(*[(f, round(base_y + z * d[1], 1), 'smoothstep') for f, d in path]))
    return Prop(layer, None)


def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0], u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])


def free_return_points(n):
    """n points along the free-return prop's path (same curve as Paint.tsx), in world pixels, rotated -60 degrees about Earth."""
    import math
    D = R_MOON + 30; m = D * .07
    segs = [((0, 0), (D * .35, -D * .12), (D * .8, -D * .1), (D + m, -m * .2)), ((D + m, -m * .2), (D + m * 2.2, m * .6), (D + m * .6, m * 1.9), (D - m * .2, m * .8)),
            ((D - m * .2, m * .8), (D * .75, -m * .3), (D * .35, D * .11), (0, m * .1))]
    lens = [1.0, .35, 1.0]; tot = sum(lens); out = []
    a = math.radians(-60); ca, sa = math.cos(a), math.sin(a)
    for i in range(n):
        u = i / (n - 1) * tot; k = 0
        while k < 2 and u > lens[k]: u -= lens[k]; k += 1
        x, y = bez(*segs[k], min(1, u / lens[k]))
        out.append((x * ca - y * sa, x * sa + y * ca))
    return out

if NAME == 'geo':
    ep.backdrop(stars=34)
    ep.music([('g1', 'assets/music/6-space-event-horizon.mp3', 0)], target_lufs=-14)
    FW = (540, 1040)                                  # wide-shot centre (world)
    # g1 hook: Orion loops behind the Moon, the glow all around it. STILL INSIDE.
    v1 = cam([(0, 3, M), (A('Moon'), 2.6, M)])
    orion = item('orion', 'orion', .72, .4, .26, rotation=-30,
                 x=track((0, -300), (A('flew'), -140, 'smoothstep'), (A('year.', edge='end'), 0, 'smoothstep')), y=track((0, 300), (A('flew'), 140, 'smoothstep'), (A('year.', edge='end'), 0, 'smoothstep')))
    ep.scene('g1', explain([], world(v1) + [orion, big('still', 'STILL INSIDE', A('Not'))],
                           [label('Orion · Artemis II', A('astronauts'), (540, 1300)), label('Moon', 0, (540, 1200)), NOT_TO_SCALE()],
                           camera_preset=None, sounds=[('ding', A('Not', edge='end'), -20)]))
    # g2 Arka on the Moon points at the black sky: "the Moon is in space!"
    arka = Char('arka', 'arka', x=.5, fy=.74, h=.26, idle=None, poses=[(0, 'shrug')], faces=[(0, 'shocked')])
    ground = Prop({'id': 'moon-ground', 'kit': {'type': 'terrain', 'top': .74, 'curve': .05, 'fill': '#a9a59c', 'detail': '#8d897f', 'rocks': 4, 'bumps': 7, 'seed': 6}}, Box(0, .74 * H, W, H, 'ground'))
    sky_earth = item('sky-earth', 'globe', .27, .4, .2, center=[78, 18])
    sky_corona = item('sky-corona', 'geocorona', .27, .4, 1, level=[{'frame': 0, 'value': 1}], color=HAZE)
    ep.scene('g2', explain([arka], [sky_corona, sky_earth, ground], [Note('in space?', A('space!'), 'title', pos=(680, 760)), label('Earth', 0, (290, 620))], camera_preset='settle'))
    # g3 a big, close Earth fills the bottom of the frame. A rocket launches and crosses the dashed 100 km line ("SPACE STARTS?").
    # On "But Earth's air doesn't just stop" everything pulls back and the glow keeps spreading out past the line (GEOCORONA).
    BIG_C = (540, 1700)                               # big Earth's centre on screen (its top sits at y 1160)
    PULL = .4                                          # pull-back scale; Earth then sits where g4's camera starts
    def g3l(layer, extra_scale=1.0):
        layer = dict(layer); layer['anchor'] = {'x': C[0], 'y': C[1]}
        layer['scale'] = track((0, extra_scale), (A('But'), extra_scale), (A('stop.', edge='end'), extra_scale * PULL, 'smoothstep'))
        return Prop(layer, None)
    big_earth = g3l(prop('big-earth', 'globe', BIG_C[0] / W, BIG_C[1] / H, 1.0, center=[78, 18]))
    ring100 = g3l(prop('ring100', 'orbit-ring', BIG_C[0] / W, BIG_C[1] / H, 1.0, opacity=track((0, 0), (plus(A('hundred'), -1), 0), (A('hundred'), 1), (A('stop.'), 1), (A('fades'), .35))))
    rocket = Prop(prop('rocket3', 'rocket', .5, 1130 / H, .13, y=track((0, 0), (A('space'), 0), (A('up.', edge='end'), -330, 'smoothstep'), (A('But'), -420, 'smoothstep'), (A('stop.', edge='end'), -1200, 'smoothstep'))), None)
    earth_y = C[1] + PULL * (BIG_C[1] - C[1])          # 1252: big Earth's centre after the pull-back
    glow = Prop(prop('glow3', 'geocorona', BIG_C[0] / W, BIG_C[1] / H, 1.0, color=HAZE,
                     level=[{'frame': 0, 'value': .55}, {'frame': A('But'), 'value': .55}, {'frame': A('stop.', edge='end'), 'value': .7}, {'frame': A('hydrogen.', edge='end'), 'value': 1}],
                     y=track((0, 0), (A('But'), 0), (A('stop.', edge='end'), round(earth_y - BIG_C[1]), 'smoothstep')),
                     scale=track((0, .9), (A('But'), .9), (A('stop.', edge='end'), 1.3, 'smoothstep'), (A('hydrogen.', edge='end'), 2.4, 'smoothstep')),
                     anchor={'x': BIG_C[0], 'y': BIG_C[1]}, opacity=track((0, 0), (A("Earth's"), 0), (A("doesn't"), 1))), None)
    ep.scene('g3', explain([], [glow, big_earth, ring100, rocket, big('starts', 'SPACE STARTS?', A('space'), size=.1, until=A('But')), big('keeps', 'IT KEEPS GOING', A("doesn't"), size=.09, color=SKY, until=A('hydrogen.'))],
                           [label('100 km', A('hundred'), (860, 1060), until=A('But')), Note('GEOCORONA', A('hydrogen.'), 'title', pos=(540, 600), color=SKY), NOT_TO_SCALE(A('cloud'))],
                           camera_preset=None, sounds=[('whoosh', A('space'), -22), ('whoosh', A('fades'), -22)]))
    # g4 pull back past the Moon's orbit to the cloud's edge: 630,000 km. SOHO in the corner.
    z4 = 1080 * PULL / 2 / (EARTH_SIZE * MS / 2)       # g4 opens with Earth the same size and place as g3's last frame
    v4 = cam([(0, round(z4, 2), (E[0], E[1] - (1252 - C[1]) / z4)), (A('reaches'), 1.4, FW), (A('Moon.', edge='end'), WIDE, FW)])
    ruler = Prop(prop('reach', 'arrow', .5, (E[1] - R_GC / 2) / H, R_GC / MS, rotation=-90, opacity=show_from(A('six')), color=GOLD), None)
    soho = item('soho', 'satellite', .2, .4, .22, A('SOHO'), variant='soho')
    ep.scene('g4', explain([], world(v4) + [wl(ruler.layer, v4), soho, big('630', '630,000 km', A('six'), y=.29, size=.11)],
                           [label('SOHO', A('SOHO'), (210, 900)), Note('≈ 2× the Moon', A('Almost'), 'note', pos=(540, 1395), color=SKY), NOT_TO_SCALE()],
                           camera_preset=None, sounds=[('whoosh', A('reaches'), -22)]))
    # g5 the Moon flies through the glow (it moves along its orbit), then Apollo 16's ultraviolet photo fills the screen.
    import math
    arc = lambda deg: (E[0] + R_MOON * math.cos(math.radians(deg)) - M[0], E[1] + R_MOON * math.sin(math.radians(deg)) - M[1])
    v5 = cam([(0, WIDE, FW)])
    moon5 = moving(planet('moon', M[0] / W, M[1] / H, MOON_R, MOONC, (), craters=5, shade=.3, seed=4), WIDE, FW,
                   [(0, arc(-60)), (A('flies'), arc(-48)), (A("atmosphere."), arc(-25)), (A('Apollo'), arc(-15))])
    plate = item('plate', 'photo-plate', .5, .5, .66, A('Apollo'), text='Apollo 16 · 1972 · far-UV camera', level=[{'frame': 0, 'value': 0}])
    plate_earth = item('plate-earth', 'globe', .5, .5, .16, A('Apollo'), center=[0, 0])
    plate_glow = item('plate-glow', 'geocorona', .5, .5, .56, A('photographed'), level=[{'frame': 0, 'value': 1}], color='#c9b8ff')
    ep.scene('g5', explain([], world(v5, moon=False) + [moon5, plate, plate_glow, plate_earth],
                           [label('Moon', 0, (860, 700), until=A('Apollo')), Note('flies through it', A('flies'), 'note', pos=(540, 1395), until=A('Apollo'), color=SKY),
                            Note('taken from the Moon', A('from'), 'note', pos=(540, 545), color=SKY), Note('inside it', A('never'), 'title', pos=(540, 1395))],
                           camera_preset=None, sounds=[('tick', A('photographed'), -22)]))
    # g6 Artemis II: Orion rides its free-return path out past the Moon and home: 406,771 km. STILL INSIDE.
    v6 = cam([(0, WIDE, FW)])
    path = wl(prop('artemis-path', 'free-return', E[0] / W, E[1] / H, (R_MOON + 30) / MS, rotation=-60, color=GOLD,
                   level=[{'frame': 0, 'value': 0}, {'frame': A('flew'), 'value': 0}, {'frame': A('kilometers.', edge='end'), 'value': 1}]), v6)
    words = ['flew', 'humans', 'farther', 'than', 'ever.', 'Over', 'four', 'hundred', 'thousand', 'kilometers.']
    pts = free_return_points(len(words))
    orion6 = moving(prop('orion6', 'orion', E[0] / W, E[1] / H, .16, rotation=30), WIDE, FW, [(0, (0, 0))] + [(A(wd), p) for wd, p in zip(words, pts)])
    ep.scene('g6', explain([], world(v6) + [path, orion6, big('still2', 'STILL INSIDE', A('Still'))],
                           [Note('Artemis II · April 2026', A('April,'), 'small', pos=(540, 760)), Note('406,771 km', A('four'), 'title', pos=(540, 1395)), NOT_TO_SCALE()],
                           camera_preset=None, sounds=[('ding', A('Still'), -20)]))
    # g8 the glow thins; then push in on the Moon, where a clear red-brown mark appears. Part 2.
    v8 = cam([(0, WIDE, FW), (A('touches'), 2.2, M), (A('mark.', edge='end'), 3.0, M)])
    mark = [{'frame': 0, 'value': 0}, {'frame': A('leaving'), 'value': 0}, {'frame': A('mark.', edge='end'), 'value': 1}]
    ep.scene('g8', explain([], world(v8, corona_opacity=track((0, 1), (A('thin,'), .45), (A('But'), .45), (A('touches'), 1)), rust=mark),
                           [Note('≈ vacuum', A('thin,'), 'note', pos=(540, 1250), until=A('touches'), color=SKY), Note('Part 2 →', A('mark.'), 'title', pos=(540, 1395))],
                           camera_preset=None, sounds=[('chime', A('mark.'), -26)]))
else:
    ep.backdrop(stars=34)
    ep.music([('r1', 'assets/music/6-space-event-horizon.mp3', 0)], target_lufs=-14)
    rust_all = [{'frame': 0, 'value': 1}]
    FW = (540, 1060)
    # r1 hook: the Moon up close, red-brown patches. RUST.
    v1 = cam([(0, 3, M), (A("Earth's", edge='end'), 2.7, M)])
    rust1 = [{'frame': 0, 'value': .2}, {'frame': A('rusting.', edge='end'), 'value': 1}]
    ep.scene('r1', explain([], world(v1, corona=.0, orbit=False, rust=rust1) + [big('rust', 'RUST', A('rusting.'), y=.25, size=.16, color=RUST)],
                           [Note("Earth's fault", A('fault.'), 'title', pos=(540, 1395))],
                           camera_preset=None, sounds=[('crack', A('rusting.', edge='end'), -22)]))
    # r2 Arka on the Moon: there's no air up here!
    arka = Char('arka', 'arka', x=.5, fy=.74, h=.26, idle=None, poses=[(0, 'shrug')], faces=[(0, 'shocked')])
    ground = Prop({'id': 'moon-ground', 'kit': {'type': 'terrain', 'top': .74, 'curve': .05, 'fill': '#a9a59c', 'detail': '#8d897f', 'rocks': 4, 'bumps': 7, 'seed': 6}}, Box(0, .74 * H, W, H, 'ground'))
    spots = item('ground-rust', 'rust-spots', .3, .83, .26, level=rust_all, count=6)
    ep.scene('r2', explain([arka], [ground, spots], [Note('air: 0', A('air'), 'title', pos=(680, 760))], camera_preset='settle'))
    # r3 Chandrayaan-1 sweeps in big, close over the Moon; hematite = RUST.
    v3 = cam([(0, 2.7, M), (A('hematite'), 3.0, M)])
    cy1 = item('chandrayaan', 'satellite', .5, .3, .34, variant='chandrayaan-1', rotation=-8,
               x=track((0, -800), (A('scientists'), -800), (A('hematite'), 0, 'smoothstep'), (A('Rust.', edge='end'), 330, 'smoothstep')))
    ep.scene('r3', explain([], world(v3, corona=.0, orbit=False, rust=rust_all) + [cy1, big('rust3', 'HEMATITE = RUST', A('hematite'), y=.67, size=.085, color=RUST)],
                           [label('Chandrayaan-1 · ISRO', A("India's"), (540, 470))],
                           camera_preset=None, sounds=[('whoosh', A("India's"), -22), ('tick', A('hematite'), -22)]))
    # r4 rust needs oxygen (a big formula), then the camera pulls back until Earth is in frame: FROM US.
    v4 = cam([(0, 3.0, M), (A('So'), 1.8, ((E[0] + M[0]) / 2, (E[1] + M[1]) / 2)), (A('us.'), 1.45, FW)])
    arrow = wl(prop('from-us', 'arrow', (E[0] + M[0]) / 2 / W, (E[1] + M[1]) / 2 / H, R_MOON * .45 / MS, rotation=-60, color=GOLD, opacity=show_from(A('us.'))), v4)
    ep.scene('r4', explain([], world(v4, corona=.0, orbit=False, rust=rust_all) + [arrow, big('formula', 'IRON + OXYGEN = RUST', A('oxygen.'), y=.27, size=.065, color=SKY, until=A('us.')),
                                                                                  big('fromus', 'FROM US', A('us.'), y=.27)],
                           [label('Earth', A('us.'), (300, 1395))],
                           camera_preset=None, sounds=[('ding', A('us.'), -20)]))
    # r5-r6 one side-view diagram that fills the width, with a slow push-in: Sun, Earth, the tail; the full Moon slides in; then the wind.
    D = {'anchor': {'x': C[0], 'y': C[1]}}
    def dl(layer, z0, z1, a0, a1):
        layer = dict(layer); layer.update(D); layer['scale'] = track((a0, z0), (a1, z1, 'smoothstep')); return Prop(layer, None)
    end5, end6 = A('Moon.', beat='r5', edge='end'), A('forming.', edge='end')
    def diagram(z0, z1, a1, tail_level, wind, moon_y, dots):
        return [dl(prop('tail', 'magnetotail', .22, .5, .5, level=tail_level, level2=wind, count=dots), z0, z1, 0, a1),
                dl(planet('sun', .07, .5, .13, '#ffd25e', ('#ffb347', '#ffd25e'), shade=0, seed=2), z0, z1, 0, a1),
                dl(prop('earth-d', 'globe', .22, .5, .11, center=[78, 18]), z0, z1, 0, a1),
                dl(planet('moon-d', .64, .5, .035, MOONC, (), craters=4, shade=.3, seed=4, y=moon_y), z0, z1, 0, a1)]
    ep.scene('r5', explain([], diagram(1.3, 1.45, end5, [{'frame': 0, 'value': .15}, {'frame': A('tail.', edge='end'), 'value': 1}], [{'frame': 0, 'value': 0}],
                                       track((0, -330), (A('passes'), -330), (A('through'), 0, 'smoothstep')), 9),
                           [label('Sun', 0, (150, 1240)), label('Earth', 0, (330, 1180)), label('full Moon', A('full'), (760, 640), until=A('through')),
                            Note('magnetic tail', A('tail.'), 'note', pos=(600, 760), until=A('full'), color=SKY), Note('oxygen →', A('oxygen'), 'title', pos=(620, 1280), color='#ff9e6a'), NOT_TO_SCALE()],
                           camera_preset=None, sounds=[('whoosh', A('passes'), -22)]))
    ep.scene('r6', explain([], diagram(1.45, 1.55, end6, [{'frame': 0, 'value': 1}], [{'frame': 0, 'value': 0}, {'frame': A('blocks'), 'value': 1}], track((0, 0)), 9)
                           + [big('99', '99%+ BLOCKED', A('blocks'), y=.29, size=.09)],
                           [label('solar wind', A('solar'), (200, 760)), Note('its hydrogen stops rust', A('stops'), 'note', pos=(540, 1395), color=SKY), NOT_TO_SCALE()],
                           camera_preset=None))
    # r7 the clue, side by side: the near side (facing Earth) is rustier than the far side.
    nm = Prop(planet('near', .28, .53, .21, MOONC, (), craters=6, shade=.25, seed=4), None)
    fm = Prop(planet('far', .72, .53, .21, MOONC, (), craters=9, shade=.25, seed=9), None)
    nr = item('near-rust', 'rust-spots', .28, .53, .34, level=[{'frame': 0, 'value': 0}, {'frame': A('more'), 'value': 0}, {'frame': A('faces'), 'value': 1}], count=9)
    fr = item('far-rust', 'rust-spots', .72, .53, .3, level=[{'frame': 0, 'value': 0}, {'frame': A('more'), 'value': 0}, {'frame': A('faces'), 'value': 1}], count=2)
    ep.scene('r7', explain([], [nm, fm, nr, fr, big('clue', 'THE CLUE?', A('clue?'), y=.3, color=SKY, size=.1, until=A('more')), big('more', 'MORE RUST', A('more'), y=.3, color=RUST, size=.1)],
                           [label('faces Earth', A('faces'), (300, 1340)), label('far side', A('faces'), (780, 1340))],
                           camera_preset=None, sounds=[('tick', A('more'), -22)]))
    # r9 a little of Earth's sky (the glow from Part 1 reaching the Moon) turning to rust; back on the rusty Moon to loop.
    v9 = cam([(0, 1.45, FW), (A('turning'), 3.0, M)])
    ep.scene('r9', explain([], world(v9, corona=1.0, orbit=False, rust=rust_all, corona_opacity=track((0, 0), (A("sky,"), 1))),
                           [label('Part 1: the Moon is inside our atmosphere', A('sky,'), (540, 1395))],
                           camera_preset=None, sounds=[('chime', A('Moon.'), -26)]))

tag = note('brand-tag', 'GAHANARKA', 200, 1475, 0, size=40, color=GOLD)
tag.pop('opacity', None); tag['pop'] = False; tag['opacity'] = track((0, .85))
ep.backdrop_tag = tag
ep._backdrop.setdefault('annotations', []).append(tag)

NOTE_BLUE = '#a9d8ff'
for pl in ep.plans.values():
    for n in pl['notes']:
        if n.color == RED: n.color = GOLD if n.kind == 'title' else NOTE_BLUE
for layer in [l for pl in ep.plans.values() for pr in pl['props'] for l in [pr.layer]] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in {'doodle-stars', 'orbit-ring', 'arrow'}: k['ink'] = LIGHT

if __name__ == '__main__':
    path, board = ep.write(sys.argv[3] if len(sys.argv) > 3 else None)
    print('wrote', path.name, sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(pl['notes']) for pl in ep.placements), 'notes placed')
