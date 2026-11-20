"""Scene recipes for hand-drawn (paint-notebook) episodes - M3.6.

An episode is written as a short plan: per beat, a recipe plus the creative choices (who is on stage, their poses
and faces on word anchors, the notes and props). Everything mechanical is derived here, for either format:

* layout  - characters go to named stage slots; notes are placed automatically in free space, never over a
            character, prop, earlier note or a reserved zone (counter, YouTube Shorts UI); a collision is an error.
* motion  - idle drift or breathing, entrances, reaction jolts.
* camera  - presets (settle, push, punch, drift) keyed to word anchors and the end of the beat.
* sound   - whoosh on cuts, pops on notes, a thump on myth stamps, plus any extra cues.

Usage: ep = Episode(story, 'wide'); ep.backdrop(...); ep.scene('hook', explain(...)); ep.write('storyboards/x.json')
"""
import json, math, pathlib, re
from paintkit import A, plus, track, show_from, show_until, pop_in, figure, planet, prop, note, rain, bubbles, molecule, INK, RED, BLUE, PALE  # noqa: F401

FPS = 30
GOLD, GOLD_VISOR = '#e8b84a', '#ffe6a3'
EARTH, EARTH_LAND = '#5aa9e6', '#7cc576'

# Format profiles. Coordinates are fractions of the group; `reserved` boxes are group pixels no note may enter.
FORMATS = {
    'wide': dict(W=1920, H=1080, feet=.86, fig=.56, slots={'left': .2, 'center-left': .33, 'center': .42, 'right': .66, 'far-right': .82},
                 notes=(.03, .2, .98, .92), prefer=(.74, .3), reserved=[(1655, 50, 1890, 290)], counter=(.9, .17, .16), scale=1.0, primary=.9),
    'tall': dict(W=1080, H=1920, feet=.76, fig=.32, slots={'left': .26, 'center-left': .36, 'center': .46, 'right': .66, 'far-right': .74},
                 notes=(.05, .245, .84, .73), prefer=(.45, .3), reserved=[(0, 0, 1080, 460), (880, 960, 1080, 1920), (0, 1440, 1080, 1920), (360, 410, 690, 710)], counter=(.47, .29, .2), scale=.85, primary=.9),
}
# Scene groups render a little smaller than the frame (primary size); this maps a backdrop spot into a scene group.
SCENE_SCALE = .95
NOTE_SIZE = {'title': 92, 'note': 72, 'label': 58, 'small': 66, 'header': 64, 'skylabel': 46}  # small text sized for phone screens (M3.7)
_ADV = json.loads((pathlib.Path(__file__).resolve().parent / 'patrick-hand-widths.json').read_text())['advance']


def text_width(text, size):
    """Rendered width of a note in Patrick Hand (exact advances), plus room for the ink stroke and pop-in overshoot."""
    return sum(_ADV.get(c, .5) for c in text) * size * 1.04 + size * .25


def _words(text):
    return re.findall(r"[\w]+(?:['’-][\w]+)*", text)


class Box:
    def __init__(self, x0, y0, x1, y1, owner=''):
        self.x0, self.y0, self.x1, self.y1, self.owner = x0, y0, x1, y1, owner

    def hits(self, o, pad=14):
        return not (self.x1 + pad <= o.x0 or o.x1 + pad <= self.x0 or self.y1 + pad <= o.y0 or o.y1 + pad <= self.y0)

    def centre(self):
        return (self.x0 + self.x1) / 2, (self.y0 + self.y1) / 2


# --------------------------------------------------------------------------------------------- elements
class Char:
    """A figure on stage. who: 'you' (white astronaut, helmet off by default), 'arka' (gold mascot), 'stick'."""

    def __init__(self, cid, who='you', slot='center', x=None, h=None, fy=None, poses=((0, 'float'),), faces=((0, 'neutral'),),
                 helmet=None, flush=None, facing=None, idle='float', enter=None, react=(), layer=None, accessories=(), top=False):
        self.cid, self.who, self.slot, self.x, self.h, self.fy = cid, who, slot, x, h, fy
        self.poses, self.faces, self.helmet, self.flush, self.facing = list(poses), list(faces), helmet, flush, facing
        self.idle, self.enter, self.react, self.extra, self.accessories, self.top = idle, enter, list(react), dict(layer or {}), list(accessories), top

    def resolve(self, F):
        self.fx = self.x if self.x is not None else F['slots'][self.slot]
        self.fh = self.h if self.h is not None else F['fig'] * (.6 if self.who == 'arka' and self.slot != 'center' else 1)
        self.ffy = self.fy if self.fy is not None else F['feet']
        return self

    def head(self):
        return self.fx, self.ffy - self.fh * .82

    def box(self, F):
        W, H = F['W'], F['H']; hp = self.fh * H; cx = self.fx * W; feet = self.ffy * H
        b = Box(cx - hp * .34, feet - hp * 1.04, cx + hp * .34, feet + 4, self.cid)
        xs = [k['value'] for k in self.extra.get('x', [])] or [0]; ys = [k['value'] for k in self.extra.get('y', [])] or [0]
        if self.enter and self.enter[0] in ('left', 'right'): xs = [0]  # off-stage before entering; ends at its slot
        return Box(b.x0 + min(0, min(xs)), b.y0 + min(0, min(ys)), b.x1 + max(0, max(xs)), b.y1 + max(0, max(ys)), self.cid)

    def layer(self, F):
        W, H = F['W'], F['H']
        kw = dict(outfit='stick' if self.who == 'stick' else 'astronaut', seed=11 if self.who == 'arka' else 4, facing=self.facing, flush=self.flush)
        if self.who == 'arka': kw.update(suit=GOLD, visor=GOLD_VISOR)
        if self.who == 'you': kw['helmet'] = self.helmet if self.helmet is not None else [(0, False)]
        elif self.helmet is not None: kw['helmet'] = self.helmet
        layer = dict(self.extra)
        if self.idle == 'float' and 'y' not in layer:
            layer['y'] = drift(10 if self.fh > .4 else 8)
        elif self.idle == 'breathe' and 'scale' not in layer:
            layer['scale'] = track(*[(f, 1.012 if i % 2 else 1, 'smoothstep') for i, f in enumerate(range(0, 2400, 45))][:36])
            layer.setdefault('anchor', {'x': self.fx * W, 'y': self.ffy * H})
        if self.enter:
            kind, at = self.enter
            if kind == 'pop':
                layer.update(pop_in(at, (self.fx * W, self.ffy * H)))
            elif kind in ('left', 'right'):
                off = (-1 if kind == 'left' else 1) * W * .45
                layer['x'] = track((0, off), (plus(at, -1), off), (plus(at, 14), 0, 'ease-out-cubic'))
                layer['opacity'] = show_from(at)
        if self.react and 'x' not in layer:
            keys = [(0, 0)]
            for at in self.react:
                keys += [(plus(at, 0), 0), (plus(at, 2), -9), (plus(at, 4), 9), (plus(at, 6), -5), (plus(at, 9), 0)]
            layer['x'] = track(*keys)
        if any(k in layer for k in ('scale', 'rotate')) and 'anchor' not in layer:
            layer['anchor'] = {'x': self.fx * W, 'y': (self.ffy - self.fh * .45) * H}
        return figure(self.cid, self.fx, self.ffy, self.fh, self.poses, self.faces, accessories=self.accessories, **{k: v for k, v in kw.items() if v is not None}, **layer)


class Note:
    """A hand-written note placed by the layout solver. kind: title | note | label | small | header (fixed place-name
    at the top of the frame, visible for the whole shot). arrow: char id to point at."""

    def __init__(self, text, at, kind='note', color=None, near=None, arrow=None, until=None, size=None, pos=None):
        self.text, self.at, self.kind, self.near, self.arrow, self.until, self.pos = text, at, kind, near, arrow, until, pos
        self.color = color or (INK if kind in ('label', 'small', 'header', 'skylabel') else RED)
        self.size = size or NOTE_SIZE[kind]


class Prop:
    """A kit prop (or planet/effect) with an approximate footprint for the layout solver."""

    def __init__(self, layer, box=None, points=None):
        self.layer, self._box, self.points = layer, box, points or {}

    def box(self, F):
        return self._box(F) if callable(self._box) else self._box


# --------------------------------------------------------------------------------------------- motion helpers
def drift(amp=10, period=80, end=2400):
    keys, f, k = [], 0, 0
    while f <= end and len(keys) < 36:
        keys.append((f, amp if k % 2 else -amp, 'smoothstep')); f += period // 2; k += 1
    return track(*keys)


def kf(frame, zoom=1.0, about=(.5, .5), x=0.0, y=0.0):
    """Camera key zooming about a point: the engine's `focus` is the look-at point, so to keep `about` fixed on
    screen while zooming, look at centre + (about - centre) * (1 - 1/zoom)."""
    t = 1 - 1 / zoom
    k = {'frame': frame, 'focus': {'x': round(.5 + (about[0] - .5) * t, 4), 'y': round(.5 + (about[1] - .5) * t, 4)}, 'zoom': zoom, 'easing': 'smoothstep'}
    if x: k['x'] = x
    if y: k['y'] = y
    return k


def camera(preset, end, focus=(.5, .5), at=None):
    """settle: ease out of a slight zoom; push: slow zoom towards focus over the beat; punch: quick zoom at `at`;
    drift: slow sideways pan. `end` is the anchor of the beat's last word."""
    if preset == 'settle': return [kf(0, 1.05, focus), kf(24, 1.0, focus)]
    if preset == 'push': return [kf(0, 1.0, focus), kf(end, 1.07, focus)]
    if preset == 'punch': return [kf(0, 1.0, focus), kf(plus(at, -1), 1.0, focus), kf(plus(at, 6), 1.12, focus), kf(end, 1.08, focus)]
    if preset == 'drift': return [kf(0, 1.03, focus, x=-.015), kf(end, 1.03, focus, x=.015)]
    return None


# --------------------------------------------------------------------------------------------- props
def station(F, where='left', open_at=None, open_from=None):
    """Space-station module with an airlock; points['hatch'] is the airlock (group fractions)."""
    x, y, s = {'left': (.2, .36, .3), 'top-left': (.26, .42, .3)}[where] if F['W'] > F['H'] else {'left': (.26, .42, .3), 'top-left': (.26, .42, .3)}[where]
    level = [{'frame': 0, 'value': 1 if open_from == 0 else 0}]
    if open_at is not None: level += [{'frame': plus(open_at, -6), 'value': 0}, {'frame': open_at, 'value': 1}]
    W, H = F['W'], F['H']; sp = s * min(W, H)
    hatch = (x + sp * .5 / W, y)
    return Prop(prop('station', 'station', x, y, s, level=level), Box(x * W - sp * 1.15, y * H - sp * .32, x * W + sp * .62, y * H + sp * .32, 'station'), {'hatch': hatch})


def helmet_toss(F, char, at, dx=.14, dy=-.27, size=.15):
    hx, hy = char.resolve(F).head(); W, H = F['W'], F['H']
    layer = prop('helmet', 'helmet', hx, hy, size, anchor={'x': hx * W, 'y': hy * H}, opacity=show_from(at),
                 x=track((0, 0), (at, 0), (plus(at, 70), dx * W, 'ease-out-cubic')), y=track((0, 0), (at, 0), (plus(at, 70), dy * H, 'ease-out-cubic')),
                 rotate=track((0, 0), (at, 0), (plus(at, 70), 260, 'ease-out-cubic')))
    r = size * min(W, H) / 2
    return Prop(layer, Box((hx + dx) * W - r, (hy + dy) * H - r, (hx + dx) * W + r, (hy + dy) * H + r, 'helmet'))


def helmet_handover(F, giver, taker, at, size=.15):
    """A helmet carried from the giver's hand to the taker's head, arriving at `at`."""
    g = giver.resolve(F); t = taker.resolve(F); W, H = F['W'], F['H']
    sx, sy = g.fx + .06 * (1 if t.fx > g.fx else -1), g.ffy - g.fh * .55
    tx, ty = t.head()
    layer = prop('helmet', 'helmet', sx, sy, size, anchor={'x': sx * W, 'y': sy * H}, opacity=show_until(at),
                 x=track((0, 0), (plus(at, -12), 0), (at, (tx - sx) * W, 'smoothstep')), y=track((0, 0), (plus(at, -12), 0), (at, (ty - sy) * H, 'smoothstep')))
    r = size * min(W, H) / 2
    return Prop(layer, Box(sx * W - r, sy * H - r, sx * W + r, sy * H + r, 'helmet'))


def kit(F, pid, item, kx, ky, size, w=1.0, h=1.0, **extra):
    """Any kit prop with a footprint of w x h times its size (fractions of the shorter side). Layer tracks such as
    x/y/opacity may be passed as keywords (the position arguments are kx, ky so they never clash)."""
    W, H = F['W'], F['H']; sp = size * min(W, H)
    return Prop(prop(pid, item, kx, ky, size, **extra), Box(kx * W - sp * w / 2, ky * H - sp * h / 2, kx * W + sp * w / 2, ky * H + sp * h / 2, pid))


def effect(lid, *effects):
    return Prop({'id': lid, 'effects': list(effects)})


def chest_arrows(F, char, at, until=None, color=None, direction='out', size=.3):
    c = char.resolve(F)
    op = track((0, 0), (plus(at, -1), 0), (at, 1)) if until is None else track((0, 0), (plus(at, -1), 0), (at, 1), (plus(until, -1), 1), (until, 0))
    extra = {'color': color} if color else {}
    return Prop(prop(f'{char.cid}-arrows', 'pressure-arrows', c.fx, c.ffy - c.fh * .5, size, direction=direction, count=8, opacity=op, **extra))


def spit(F, char, at, count=22, eid='spit'):
    hx, hy = char.resolve(F).head()
    return effect(eid, bubbles(eid, hx + .012, hy + char.fh * .07, at, count))


def vignette(levels):
    return Prop(prop('dim', 'vignette', .5, .5, .5, level=[{'frame': f, 'value': v} for f, v in levels]))


def scene_counter(F, values, label='seconds left'):
    """A counter inside a scene group (above its vignette), at the backdrop counter's screen spot."""
    cx, cy, cs = F['counter']
    return Prop(prop('counter', 'counter', .5 + (cx - .5) / SCENE_SCALE, .5 + (cy - .5) / SCENE_SCALE, cs / SCENE_SCALE, text=label, values=values))


# --------------------------------------------------------------------------------------------- worlds (M3.7)
JUPITER = dict(base='#d9b38c', bands=['#b5733f', '#ecd9b6', '#a35f35', '#ecd9b6', '#c48a55'])
SATURN = dict(base='#e3c98f', bands=['#c9a86a', '#f0dfb2', '#d4b67c'], ring=True)
SKY_BODIES = {
    'earth': dict(base=EARTH, bands=[EARTH_LAND, EARTH, EARTH_LAND]), 'mars': dict(base='#c4501f', bands=['#d9703f', '#b2441a']),
    'jupiter': JUPITER, 'saturn': SATURN, 'uranus': dict(base='#9fe0e6', bands=['#b7ebef'], ring=True), 'neptune': dict(base='#3d63d6', bands=['#5a7fe3', '#3354be']),
    'pluto': dict(base='#d8b48a', bands=['#e9d3b4']),
}
SKY_NAMES = {'earth': 'Earth', 'mars': 'Mars', 'jupiter': 'Jupiter', 'saturn': 'Saturn', 'uranus': 'Uranus', 'neptune': 'Neptune', 'pluto': 'Pluto'}
# Planet systems for the where-are-we card: planet colour, moons inner to outer (name, colour), ring, belt, strip index.
SYSTEMS = {
    'earth': dict(color=EARTH, moons=[('The Moon', '#c4c4c0')], strip=2),
    'mars': dict(color='#c4501f', moons=[('Phobos', '#857a6f'), ('Deimos', '#9a8d80')], strip=3),
    'jupiter': dict(color='#d9b38c', moons=[('Io', '#e9c94b'), ('Europa', '#f1e8d8'), ('Ganymede', '#8e8376'), ('Callisto', '#6e5d4c')], strip=4, belt=True),
    'saturn': dict(color='#e3c98f', moons=[('Mimas', '#cfcfca'), ('Enceladus', '#f4f8fb'), ('Rhea', '#bdbdb8'), ('Titan', '#c9843b'), ('Iapetus', '#7a6a5a')], strip=5, ring=True),
    'uranus': dict(color='#9fe0e6', moons=[('Miranda', '#cfcfca'), ('Ariel', '#c8c8c4'), ('Umbriel', '#8d8d89'), ('Titania', '#b8b0a8'), ('Oberon', '#a39a90')], strip=6),
    'neptune': dict(color='#3d63d6', moons=[('Proteus', '#8d8d89'), ('Triton', '#ecdcd8'), ('Nereid', '#a8a8a4')], strip=7),
    'pluto': dict(color='#d8b48a', moons=[('Charon', '#a19c97'), ('Nix', '#c8c8c4'), ('Hydra', '#bdbdb8')], strip=8),
}


def where(F, system, moon, until=None, belt=None, start=None):
    """Where-are-we card: the planet's system with `moon` highlighted, and the solar system strip with the planet
    circled. Opaque, drawn above the stage; visible from the start of the shot until `until` (None = whole shot)."""
    sys_ = SYSTEMS[system]; names = [m[0] for m in sys_['moons']]
    keys = [(0, 1)] if start is None else [(0, 0), (plus(start, -1), 0), (plus(start, 4), 1)]
    if until is not None: keys += [(plus(until, -6), 1), (until, 0)]
    op = {} if keys == [(0, 1)] else {'opacity': track(*keys)}
    card = Prop(prop(f'map-{system}', 'system-map', .36, .58, .62, color=sys_['color'], labels=names, colors=[m[1] for m in sys_['moons']],
                     highlight=names.index(moon), ring=sys_.get('ring', False), belt=sys_.get('belt', False) if belt is None else belt,
                     text=SKY_NAMES.get(system, system.title()), **op))
    strip = Prop(prop('solar-strip', 'solar-strip', .5, .17, .56, highlight=sys_['strip'], **op))
    card.hides_labels = 'always' if until is None and start is None else (until if start is None else ('from', start, until))
    return [card, strip]


# Each moon: ground fill/detail, the parent body hanging in its sky (x, y, radius as fractions), crater count.
WORLDS = {
    'THE MOON': dict(ground='#c4c4c0', detail='#8c8c88', sky=('earth', .84, .24, .07), rocks=4),
    'CALLISTO': dict(ground='#6e5d4c', detail='#3f342b', sky=('jupiter', .84, .24, .07), rocks=6),
    'PHOBOS': dict(ground='#857a6f', detail='#5a5048', sky=('mars', .78, .3, .26), rocks=3),
    'DEIMOS': dict(ground='#9a8d80', detail='#6a5f55', sky=('mars', .84, .24, .1), rocks=2),
    'MIRANDA': dict(ground='#cfcfca', detail='#8f8f8a', sky=('uranus', .84, .22, .08), rocks=3),
    'ENCELADUS': dict(ground='#f4f8fb', detail='#a9c6db', sky=('saturn', .8, .22, .08), rocks=1),
    'TRITON': dict(ground='#ecdcd8', detail='#b48f88', sky=('neptune', .84, .22, .08), rocks=2),
    'CHARON': dict(ground='#a19c97', detail='#6e6a66', sky=('pluto', .84, .23, .11), rocks=3),
    'GANYMEDE': dict(ground='#8e8376', detail='#5d554c', sky=('jupiter', .82, .24, .12), rocks=3),
    'EUROPA': dict(ground='#f1e8d8', detail='#a3713f', sky=('jupiter', .8, .26, .18), rocks=1),
    'IO': dict(ground='#e9c94b', detail='#b0781c', sky=('jupiter', .78, .3, .26), rocks=2),
    'TITAN': dict(ground='#c9843b', detail='#8a5422', sky=('saturn', .84, .2, .05), rocks=2, haze='#f2a54a'),
}


def world(F, name, sky=True, ground=True, top=None):
    """Moon set: place-name header, the moon's ground colour and its parent planet in the sky. Returns (props, header).
    The header sits at the top centre for the whole shot (the Paint Explainer convention: viewers always know where they are)."""
    w = WORLDS[name]; W, H = F['W'], F['H']; props = []
    if w.get('haze'):
        props.append(Prop({'id': 'haze', 'kit': {'type': 'glow', 'x': .5, 'y': .55, 'rx': .9, 'ry': .75, 'tone': 'sun'}, 'opacity': track((0, .55))}))
    if sky and w.get('sky'):
        body, x, y, r = w['sky']; spec = dict(SKY_BODIES[body]); ring = spec.pop('ring', False)
        props.append(Prop(planet('sky-body', x, y, r, spec['base'], spec.get('bands', ()), ring=ring, shade=.25, seed=5),
                          Box((x - r * (1.9 if ring else 1.1) * H / W) * W, (y - r * 1.1) * H, (x + r * (1.9 if ring else 1.1) * H / W) * W, (y + r * 1.1) * H, 'sky-body')))
    if ground:
        t = top if top is not None else F['feet'] - .01
        props.append(Prop({'id': 'ground', 'kit': {'type': 'terrain', 'top': t, 'curve': .04, 'fill': w['ground'], 'detail': w['detail'], 'rocks': w['rocks'], 'bumps': 6, 'seed': len(name)}},
                          Box(0, t * H, W, H, 'ground')))
    header = Note(name, 0, 'header', pos=(W / 2, round(.085 * H)))
    if sky and w.get('sky'):
        body, x, y, r = w['sky']
        props.append(_SkyLabel(Note(SKY_NAMES[body], 0, 'skylabel', pos=(round((x - r * (2.1 if SKY_BODIES[body].get('ring') else 1.25) * H / W) * W - len(SKY_NAMES[body]) * 11), round(y * H + 14)))))
    return props, header


class _SkyLabel(Prop):
    """Carries the parent planet's name label from world() into the shot's notes (Episode.scene unpacks it)."""
    def __init__(self, note):
        super().__init__({'id': 'sky-label-carrier'}); self.note = note


def photo(ep, F, aid, rel_path, at, until=None, x=.5, y=.48, scale=.72, size=(1920, 1080), box=(.27, .16, .73, .82)):
    """A prepared, framed NASA photo (full-frame transparent PNG from prepare-photo-inserts) popping in at `at`."""
    ep.asset(aid, rel_path, *size); W, H = F['W'], F['H']
    op = track((0, 0), (plus(at, -1), 0), (plus(at, 4), 1)) if until is None else track((0, 0), (plus(at, -1), 0), (plus(at, 4), 1), (plus(until, -1), 1), (until, 0))
    layer = {'id': aid, 'asset': aid, 'opacity': op, 'anchor': {'x': W / 2, 'y': H / 2},
             'scale': track((0, scale * .9), (plus(at, -1), scale * .9), (plus(at, 6), scale, 'ease-out-back')),
             'x': track((0, (x - .5) * W)), 'y': track((0, (y - .5) * H))}
    bx0, by0, bx1, by1 = box
    return Prop(layer, Box(bx0 * W + (x - .5) * W, by0 * H + (y - .5) * H, bx1 * W + (x - .5) * W, by1 * H + (y - .5) * H, aid))


def cliff(F, x, y, size, text=None, pid='cliff'):
    """Cliff whose top edge is at (x, y): flat top to the left, face dropping `size`; points['edge'] is where to stand."""
    W, H = F['W'], F['H']; sp = size * min(W, H)
    extra = {'text': text} if text else {}
    return Prop(prop(pid, 'cliff', x, y, size, **extra), Box(x * W - sp * 1.6, y * H, x * W + sp * (.75 if text else .1), y * H + sp, pid), {'edge': (x - .02, y)})


def jet(F, item, x, base_y, size, level, pid=None, color=None, spread=.55):
    """Geyser or plume rising from a vent at (x, base_y); footprint from the vent up to its full height."""
    W, H = F['W'], F['H']; sp = size * min(W, H); top = max(v for _, v in level) if isinstance(level, (list, tuple)) else level
    keys = [{'frame': f, 'value': v} for f, v in level] if isinstance(level, (list, tuple)) else [{'frame': 0, 'value': level}]
    extra = {'color': color} if color else {}
    return Prop(prop(pid or item, item, x, base_y, size, level=keys, **extra), Box(x * W - sp * spread, base_y * H - sp * top * 1.1, x * W + sp * spread, base_y * H, pid or item))


# --------------------------------------------------------------------------------------------- recipes
def explain(chars=(), props=(), notes=(), camera_preset='settle', focus=None, sounds=(), stamps=()):
    """The workhorse: characters + props + auto-placed notes. stamps: [(note index, anchor)] MYTH stamps."""
    return dict(chars=list(chars), props=list(props), notes=list(notes), camera=camera_preset, focus=focus, sounds=list(sounds), stamps=list(stamps))


def myth_bust(claim, claim_at, bust_at, chars=(), truths=(), props=(), camera_preset='settle', sounds=()):
    """Claim as a big question, stamped MYTH on the busting word, followed by the truth notes."""
    notes = [Note(claim, claim_at, 'title', color=INK)] + list(truths)
    return explain(chars, props, notes, camera_preset, sounds=sounds, stamps=[(0, bust_at)])


def comparison(left, right, notes=(), props=(), camera_preset='settle', sounds=()):
    """Two characters side by side, each with a label above; extra notes go to free space."""
    l_char, l_label, l_at = left; r_char, r_label, r_at = right
    l_char.slot, r_char.slot = 'left', 'right'
    return explain([l_char, r_char], props, [Note(l_label, l_at, 'title', color=INK, near=l_char.cid), Note(r_label, r_at, 'title', near=r_char.cid)] + list(notes), camera_preset, sounds=sounds)


def countdown(chars=(), props=(), notes=(), counter=None, dim=None, heartbeats=(), focus_char=None, sounds=()):
    """Tension beat: a scene counter above a darkening vignette, heartbeats, and a slow push in."""
    extra_props = list(props) + ([dim] if dim else []) + ([counter] if counter else [])
    return dict(chars=list(chars), props=extra_props, notes=list(notes), camera='push', focus=focus_char, sounds=list(sounds) + [('heartbeat', a, -22) for a in heartbeats], stamps=[])


def flashback(year, year_at, caption, caption_at, chars=(), props=(), notes=(), sounds=()):
    """A memory: big year, a short caption, then the story notes."""
    return explain(chars, props, [Note(year, year_at, 'title'), Note(caption, caption_at, 'small')] + list(notes), 'drift', sounds=[('whoosh', 0, -22)] + list(sounds))


# --------------------------------------------------------------------------------------------- episode
class Episode:
    def __init__(self, story_path, fmt, project_id=None):
        self.root = pathlib.Path(story_path).resolve().parents[1]
        self.story_path = pathlib.Path(story_path)
        self.story = json.loads(self.story_path.read_text())
        self.F = FORMATS[fmt]; self.fmt = fmt; self.project = project_id or self.story['id']
        self.groups, self.plans, self.placements, self._backdrop, self.assets, self._audio = [], {}, [], None, [], None
        self.pop_db, self.deviation_tolerance = -22, .2
        self.theme = 'paint-notebook'

    def music(self, cues, dropouts=(), gain_db=-22, crossfade=1.5, target_lufs=-14):
        """Licensed music per section: cues [(beat_id, 'assets/music/x.mp3', offset_seconds)], dropouts [(beat_id, frame, seconds)]."""
        sid = {b['id']: b['sceneId'] for b in self.story['beats']}
        self._audio = {'music': 'cues', 'musicGainDb': gain_db, 'duckRatio': 8, 'targetLufs': target_lufs, 'crossfadeSeconds': crossfade,
                       'musicCues': [{'source': c[1], 'scene': sid[c[0]], 'offsetSeconds': c[2], **({'gainDb': c[3]} if len(c) > 3 else {})} for c in cues],
                       'musicDropouts': [{'scene': sid[b], 'frame': f, 'seconds': sec} for b, f, sec in dropouts]}

    def asset(self, aid, rel_path, width, height):
        """Register a PNG under assets/ (e.g. a prepared NASA photo insert) once; returns its id."""
        if not any(a['id'] == aid for a in self.assets):
            self.assets.append({'id': aid, 'path': rel_path, 'type': 'png', 'width': width, 'height': height, 'transparent': True})
        return aid

    # backdrop -----------------------------------------------------------------------------------
    def backdrop(self, stars=26, earth=None, counter=None, extra=()):
        F = self.F; layers = [{'id': 'page', 'kit': {'type': 'sky', 'horizon': .9, 'stars': 0, 'seed': 1}}]
        if stars: layers.append({'id': 'stars', 'kit': {'type': 'prop', 'item': 'doodle-stars', 'x': .37, 'y': .61, 'size': .5, 'count': stars}})
        if earth:
            e = {'id': 'earth', 'kit': {'type': 'planet', 'x': earth.get('x', .04 if self.fmt == 'wide' else .5), 'y': earth.get('y', 1.04 if self.fmt == 'wide' else 1.12),
                                        'radius': earth.get('r', .3 if self.fmt == 'wide' else .55), 'base': EARTH, 'bands': [EARTH_LAND, EARTH, EARTH_LAND], 'shade': .22, 'seed': 3}}
            if earth.get('hidden'):
                keys = [(0, 1)]
                for a, b in earth['hidden']:
                    keys += [(plus(a, -1), 1), (a, 0)] + ([(plus(b, -1), 0), (b, 1)] if b else [])
                e['opacity'] = track(*keys)
            layers.append(e)
        if counter:
            x, y, s = F['counter']
            c = {'id': 'counter', 'kit': {'type': 'prop', 'item': 'counter', 'x': x, 'y': y, 'size': s, 'text': counter.get('label', 'seconds left'), 'values': counter['values']}}
            keys = [(0, 0), (plus(counter['show'], -1), 0), (counter['show'], 1)]
            if counter.get('hide'): keys += [(plus(counter['hide'], -1), 1), (counter['hide'], 0)]
            c['opacity'] = track(*keys)
            layers.append(c)
        layers += list(extra)
        self._backdrop = {'id': 'backdrop', 'width': F['W'], 'height': F['H'], 'layers': layers}

    # scenes -------------------------------------------------------------------------------------
    def scene(self, beat_id, plan):
        labels = [p.note for p in plan['props'] if isinstance(p, _SkyLabel)]
        hide = next((p.hides_labels for p in plan['props'] if hasattr(p, 'hides_labels')), None)
        if hide == 'always': labels = []  # the where-are-we card already names the planet
        for n in labels: n.after = hide
        plan['props'] = [p for p in plan['props'] if not isinstance(p, _SkyLabel)]
        plan['notes'] = plan['notes'][:1] + labels + plan['notes'][1:] if labels else plan['notes']
        self.plans[beat_id] = plan

    def _end_anchor(self, beat):
        words = _words(beat['narration']); last = words[-1]
        return A(last, n=sum(1 for w in words if w.lower() == last.lower()), edge='end')

    def _place(self, beat_id, notes, obstacles, stamps=()):
        """Greedy placement: each note takes the free spot nearest its target (or reading order), never overlapping."""
        F = self.F; W, H = F['W'], F['H']; nx0, ny0, nx1, ny1 = F['notes']
        k = F['scale']; placed = []; taken = list(obstacles) + [Box(*r, 'reserved') for r in F['reserved']]
        stamp_of = {ni: at for ni, at in stamps}; self._stamps = []; last_y = None
        ss = (.15 if F['W'] > F['H'] else .13) * min(W, H)  # stamp size in px
        for i, n in enumerate(notes):
            size = round(n.size * k); width = text_width(n.text, size); asc, desc = size * .85, size * .3
            target = next((o.centre() for o in obstacles if o.owner == (n.near or n.arrow)), None)
            if n.pos:
                x, y = n.pos
                cand = [(x, y)]
            else:
                cand = [(x, y) for y in range(int(ny0 * H + asc), int(ny1 * H - desc), 12) for x in range(int(nx0 * W + width / 2), int(nx1 * W - width / 2) + 1, 16)]
            best = None
            for x, y in cand:
                b = Box(x - width / 2, y - asc, x + width / 2, y + desc, f'note{i}')
                if not n.pos and any(b.hits(o) for o in taken): continue
                if target: cost = math.hypot(x - target[0], y - target[1]) + (0 if n.near else 120)
                else: cost = abs(y - F['prefer'][1] * H) * .6 + abs(x - F['prefer'][0] * W) * .5  # right-side reading column by default
                if last_y is not None and y < last_y and not n.pos: continue  # reading order (pinned notes keep their place)
                if i in stamp_of:  # the claim's stamp must fit too
                    sx, sy = min(b.x1, W * .97) - 40, b.y1 + 18
                    if any(Box(sx - ss * .58, sy - ss * .32, sx + ss * .58, sy + ss * .32).hits(o) for o in taken): continue
                if best is None or cost < best[0]: best = (cost, x, y, b)
            if best is None: raise ValueError(f'{beat_id}: no free space for note "{n.text}"')
            _, x, y, b = best; taken.append(b); placed.append((n, x, y, b))
            if not (n.near or n.arrow): last_y = y
            if i in stamp_of:
                sx, sy = min(b.x1, W * .97) - 40, b.y1 + 18
                taken.append(Box(sx - ss * .58, sy - ss * .32, sx + ss * .58, sy + ss * .32, 'stamp')); self._stamps.append((sx, sy, ss / min(W, H), stamp_of[i]))
        return placed

    def build(self):
        F = self.F; W, H = F['W'], F['H']; beats = self.story['beats']
        groups = [self._backdrop] if self._backdrop else []
        scenes = []
        counts = [len(b['narration'].split()) for b in beats]; total = self.story['durationSeconds'] * FPS
        raw = [max(45, total * c / sum(counts)) for c in counts]; sc = total / sum(raw)
        nominal = [int(r * sc) for r in raw]; nominal[-1] += total - sum(nominal)
        for i, beat in enumerate(beats):
            plan = self.plans[beat['id']]
            chars = [c.resolve(F) for c in plan['chars']]
            obstacles = [c.box(F) for c in chars] + [b for b in (p.box(F) for p in plan['props']) if b]
            placed = self._place(beat['id'], plan['notes'], obstacles, plan['stamps'])
            TOP = ('vignette', 'counter', 'system-map', 'solar-strip')  # dimmers, counters and the where-are-we card cover the stage
            layers = [p.layer for p in plan['props'] if p.layer.get('kit', {}).get('item') not in TOP]
            layers += [c.layer(F) for c in chars if not c.top]
            layers += [p.layer for p in plan['props'] if p.layer.get('kit', {}).get('item') in TOP]  # dimmer, counter, map card on top
            layers += [c.layer(F) for c in chars if c.top]  # e.g. a rescuer staying bright over the blackout
            # Short mascot lines are easily masked: no cut whoosh or note pops under a beat Arka speaks alone.
            quiet = set(beat.get('phraseSpeakers') or ['narrator']) == {'arka'}
            annotations, sounds = [], [] if i == 0 or quiet else [('whoosh', 0, -24)]
            for j, (n, x, y, b) in enumerate(placed):
                to = frm = None
                if n.arrow:
                    c = next(c for c in chars if c.cid == n.arrow); hx, hy = c.head(); tx, ty = hx * W + (c.fh * H * .12) * (1 if x > hx * W else -1), hy * H
                    frm = (b.x0 + 20 if x > tx else b.x1 - 20, b.y1 - 10 if y < ty else b.y0); to = (tx, ty)
                elif getattr(n, 'point', None):  # arrow to a fixed spot (e.g. a Short's Related video link)
                    to = n.point; frm = (b.x0 + 40 if n.point[0] < x else b.x1 - 40, b.y1 + 6) if n.point[1] > y else ((b.x0 + b.x1) / 2, b.y0 - 4)
                a = note(f'n{j}', n.text, round(x), round(y), n.at, size=round(n.size * F['scale']), color=n.color, to=to, frm=frm)
                if n.kind in ('header', 'skylabel'):
                    a.pop('opacity', None); a['pop'] = False
                    after = getattr(n, 'after', None)
                    if isinstance(after, tuple):  # card shown from `start` (to `until`): label hides while it is up
                        _, st, un = after
                        a['opacity'] = track((0, 1), (plus(st, -1), 1), (st, 0)) if un is None else track((0, 1), (plus(st, -1), 1), (st, 0), (un, 0), (plus(un, 4), 1))
                    elif after is not None:
                        a['opacity'] = track((0, 0), (plus(after, -1), 0), (plus(after, 4), 1))
                if n.until is not None:
                    a['opacity'] = track((0, 0), (plus(n.at, -1), 0), (plus(n.at, 5), 1), (plus(n.until, -1), 1), (n.until, 0))
                annotations.append(a)
                if n.kind not in ('label', 'header', 'skylabel') and not quiet: sounds.append(('pop', n.at, self.pop_db))  # name labels appear silently (they often land on dialogue)
            for k_, (sx, sy, s, at) in enumerate(self._stamps):
                layers.append(prop(f'stamp{k_}', 'stamp', sx / W, sy / H, s, text='myth', **pop_in(at, (sx, sy))))
                sounds.append(('boom', at, -27))
            sounds += plan['sounds']
            fc = next((c for c in chars if c.cid == plan.get('focus')), chars[0] if chars else None)
            focus = (fc.fx, fc.ffy - fc.fh * .6) if fc else (.5, .5)
            cam = camera(plan['camera'], self._end_anchor(beat), focus) if plan['camera'] else None
            gid = f"g-{beat['id']}"
            groups.append({'id': gid, 'width': W, 'height': H, 'layers': layers, 'annotations': annotations})
            scenes.append({'id': beat['sceneId'], 'template': 'hero-reveal', 'durationFrames': nominal[i], 'animationDurationFrames': nominal[i],
                           'caption': {'text': beat['sceneId'], 'preset': 'body'},
                           'camera': {'preset': 'static', 'boundaryMode': 'backdrop', **({'keyframes': cam} if cam else {})},
                           'motion': {'preset': 'still'}, 'seed': 7000 + len(beat['sceneId']), 'transitionFrames': 0, 'environmentDim': 0,
                           'config': {'primary': {'asset': gid, 'x': .5, 'y': .5, 'size': F['primary']}},
                           'narrationCue': {'beatId': beat['id'], 'phraseIndex': 0, 'edge': 'start'},
                           'sounds': [{'sound': s, 'frame': f, 'gainDb': g} for s, f, g in sounds]})
            self.placements.append({'beat': beat['id'], 'notes': [(n.text, round(b.x0), round(b.y0), round(b.x1), round(b.y1)) for n, _, _, b in placed]})
        return {'schemaVersion': '2.1', 'projectId': self.project, 'title': self.story['title'], 'themeId': self.theme,
                'format': {'width': W, 'height': H, 'fps': FPS}, 'styleId': 'cinematic-illustrated', 'background': '@sky.top', 'accent': '@text.accent',
                'assets': self.assets, 'backdrop': {'group': 'backdrop'}, 'narrationTiming': {'minimumSceneFrames': 30 if self.fmt == 'tall' else 45, 'maximumDeviationSeconds': self.deviation_tolerance},
                'audio': self._audio or {'music': 'generated-pad', 'musicGainDb': -24, 'duckRatio': 8, 'targetLufs': -14}, 'groups': groups, 'scenes': scenes}

    def write(self, out=None):
        board = self.build()
        path = self.root / (out or self.story['storyboard'])
        path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
        return path, board


def brand_sting(at, W, H, gold='#ffd25e'):
    """The channel's 2-second brand sting (first used in Ep 5): a small Sun pops up, then the GAHANARKA wordmark and the
    tagline, with one whoosh. Place it right after the cold open's hook (never in Shorts). Returns (props, notes, sounds)
    to add to that shot; hide the shot's other elements from `at` (opacity show_until / Note until)."""
    sun = planet('sting-sun', .5, .36, .085, '#ffcf4a', ('#ffe27a', '#ffcf4a'), shade=.05, seed=2, **pop_in(at, (.5 * W, .36 * H)))
    props = [Prop(sun, Box(.5 * W - .085 * H, .36 * H - .085 * H, .5 * W + .085 * H, .36 * H + .085 * H, 'sting-sun'))]
    notes = [Note('GAHANARKA', plus(at, 5), 'title', size=100, pos=(W / 2, round(.6 * H)), color=gold),
             Note('light in the unfathomable', plus(at, 16), 'small', size=56, pos=(W / 2, round(.7 * H)))]
    return props, notes, [('whoosh', at, -18)]
