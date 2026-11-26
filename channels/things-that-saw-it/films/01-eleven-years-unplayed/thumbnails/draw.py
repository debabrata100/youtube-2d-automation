"""Thumbnails for film 01 "11 Years Unplayed" (Things That Saw It). Code-drawn storybook paintings, no AI images.

Writes a.svg, b.svg, c.svg next to this file; render each to a 1280x720 PNG with
  node --import tsx scripts/render-svg.ts --input <x.svg> --output <x.png>
A  "11 YEARS / UNPLAYED"  dusty piano in a hallway, afternoon light, moving boxes, nobody there
B  "SHE CAME / BACK."     the same piano at night: lamp on, lid open, bench out, tea, one key glowing
C  "I WAITED / 11 YEARS"  close-up of the closed lid: dust, a finger trail, a child's sticker and practice note
Deterministic: every random detail comes from a seeded generator.
"""
import pathlib, random

HERE = pathlib.Path(__file__).resolve().parent
W, H = 1280, 720
FONTS = """<style>
@font-face{font-family:'Poppins';font-weight:700;src:url('../../../brand/fonts/Poppins-Bold.ttf')}
@font-face{font-family:'Hand';src:url('../../../../../src/engine/style/fonts/PatrickHand-Regular.ttf')}
</style>"""
INK, GOLD, CREAM = '#1b1410', '#ffd36b', '#fff4df'


def common_defs():
    return """
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.10 0"/>
</filter>
<filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="soft3"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="textshadow" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.55"/></filter>
<radialGradient id="vignette" cx="50%" cy="48%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.62"/></radialGradient>
<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3c26"/><stop offset="1" stop-color="#3a2016"/></linearGradient>
<linearGradient id="woodFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a30"/><stop offset="0.5" stop-color="#4f2c1c"/><stop offset="1" stop-color="#341c12"/></linearGradient>
<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d58a"/><stop offset="1" stop-color="#9c7432"/></linearGradient>
<filter id="woodgrain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="3" seed="3" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 0.55 0"/>
  <feComposite in2="SourceGraphic" operator="in"/>
</filter>"""


def headline(lines, x=56, y0=168, sizes=(128, 108), gap=118):
    """Bold two-line lettering: line 1 cream, line 2 gold, dark outline and shadow, readable at phone size."""
    out, y = [], y0
    for i, (text, size) in enumerate(zip(lines, sizes)):
        col = CREAM if i == 0 else GOLD
        out.append(f'<text x="{x}" y="{y}" font-family="Poppins" font-weight="700" font-size="{size}" letter-spacing="-2" '
                   f'fill="{col}" stroke="{INK}" stroke-width="12" stroke-linejoin="round" paint-order="stroke" filter="url(#textshadow)">{text}</text>')
        y += gap
    return '\n'.join(out)


def piano(x0, x1, top, floor, open_lid=False, dust=0.0, glow_key=None, rim='#ffcf87', rim_op=0.35, seed=1):
    """Front view of an upright piano between x0..x1, lid at `top`, standing on `floor`."""
    rnd = random.Random(seed); w = x1 - x0; cx = (x0 + x1) / 2
    fb_top, fb_bot = top + 150, top + 188          # fallboard / keyboard band
    out = [f'<ellipse cx="{cx}" cy="{floor + 6}" rx="{w * .62}" ry="22" fill="#000" opacity=".55" filter="url(#soft)"/>']
    # upper case and lid
    out += [f'<rect x="{x0}" y="{top + 16}" width="{w}" height="{fb_top - top - 16}" fill="url(#wood)"/>',
            f'<rect x="{x0 + 34}" y="{top + 38}" width="{w - 68}" height="{fb_top - top - 64}" rx="6" fill="none" stroke="#2a150d" stroke-width="3" opacity=".8"/>',
            f'<rect x="{x0 + 40}" y="{top + 44}" width="{w - 80}" height="{fb_top - top - 76}" rx="5" fill="none" stroke="#8a5a3c" stroke-width="1.5" opacity=".5"/>',
            f'<path d="M {cx - 70} {top + 92} q 70 -40 140 0" fill="none" stroke="#8a5a3c" stroke-width="3" opacity=".55"/>',
            f'<path d="M {cx - 46} {top + 104} q 46 -24 92 0" fill="none" stroke="#8a5a3c" stroke-width="2" opacity=".45"/>',
            f'<rect x="{x0 - 14}" y="{top}" width="{w + 28}" height="20" rx="4" fill="url(#woodFront)"/>',
            f'<rect x="{x0 - 14}" y="{top}" width="{w + 28}" height="4" rx="2" fill="#a57352" opacity=".7"/>']
    if dust:
        out.append(f'<rect x="{x0 - 14}" y="{top}" width="{w + 28}" height="7" rx="3" fill="#b9a48f" opacity="{.75 * dust}"/>')
        out += [f'<circle cx="{x0 - 10 + rnd.random() * (w + 20):.1f}" cy="{top + 1 + rnd.random() * 5:.1f}" r="{.6 + rnd.random() * 1.2:.1f}" fill="#d9c8b4" opacity="{.6 * dust:.2f}"/>' for _ in range(70)]
    # arms (cheeks) and fallboard / keys
    out += [f'<rect x="{x0 - 22}" y="{fb_top - 6}" width="26" height="{fb_bot - fb_top + 30}" rx="4" fill="url(#woodFront)"/>',
            f'<rect x="{x1 - 4}" y="{fb_top - 6}" width="26" height="{fb_bot - fb_top + 30}" rx="4" fill="url(#woodFront)"/>']
    if open_lid:
        kx0, kx1, ky0, ky1 = x0 + 4, x1 - 4, fb_top + 8, fb_bot + 6
        n = 36; kw = (kx1 - kx0) / n
        out.append(f'<rect x="{x0}" y="{fb_top - 18}" width="{w}" height="26" fill="#2a150d"/>')        # open fallboard edge
        out.append(f'<rect x="{kx0}" y="{ky0}" width="{kx1 - kx0}" height="{ky1 - ky0}" fill="#f6efe2"/>')
        for i in range(n):
            out.append(f'<line x1="{kx0 + i * kw:.1f}" y1="{ky0}" x2="{kx0 + i * kw:.1f}" y2="{ky1}" stroke="#b8ab96" stroke-width="1"/>')
        for i in range(n - 1):
            if i % 7 in (0, 1, 3, 4, 5):
                out.append(f'<rect x="{kx0 + (i + 1) * kw - kw * .3:.1f}" y="{ky0}" width="{kw * .6:.1f}" height="{(ky1 - ky0) * .6:.1f}" rx="1" fill="#1c120d"/>')
        if glow_key is not None:
            gx = kx0 + glow_key * kw
            out.append(f'<rect x="{gx:.1f}" y="{ky0}" width="{kw:.1f}" height="{ky1 - ky0}" fill="{GOLD}" filter="url(#glow)"/>')
        out.append(f'<rect x="{x0 - 4}" y="{ky1}" width="{w + 8}" height="14" fill="#2b170e"/>')
        lower_top = ky1 + 14
    else:
        out += [f'<rect x="{x0 - 6}" y="{fb_top}" width="{w + 12}" height="{fb_bot - fb_top}" rx="10" fill="url(#woodFront)"/>',
                f'<rect x="{x0 - 6}" y="{fb_top + 2}" width="{w + 12}" height="6" rx="3" fill="#b07c58" opacity=".55"/>',
                f'<text x="{cx}" y="{fb_top + 27}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="11" letter-spacing="3" fill="url(#brass)">ELLIS &amp; SON</text>']
        if dust:
            out.append(f'<rect x="{x0 - 6}" y="{fb_top + 1}" width="{w + 12}" height="5" rx="3" fill="#c3ae98" opacity="{.6 * dust}"/>')
        out.append(f'<rect x="{x0 - 4}" y="{fb_bot}" width="{w + 8}" height="16" fill="#2b170e"/>')
        lower_top = fb_bot + 16
    # lower panel, legs, plinth, pedals
    plinth = floor - 26
    out += [f'<rect x="{x0 + 8}" y="{lower_top}" width="{w - 16}" height="{plinth - lower_top}" fill="url(#wood)"/>',
            f'<rect x="{x0 + 30}" y="{lower_top + 18}" width="{w / 2 - 44}" height="{plinth - lower_top - 34}" rx="5" fill="none" stroke="#2a150d" stroke-width="3" opacity=".75"/>',
            f'<rect x="{cx + 14}" y="{lower_top + 18}" width="{w / 2 - 44}" height="{plinth - lower_top - 34}" rx="5" fill="none" stroke="#2a150d" stroke-width="3" opacity=".75"/>',
            f'<rect x="{x0 - 18}" y="{lower_top}" width="18" height="{floor - lower_top}" fill="url(#woodFront)"/>',
            f'<rect x="{x1}" y="{lower_top}" width="18" height="{floor - lower_top}" fill="url(#woodFront)"/>',
            f'<rect x="{x0 - 24}" y="{floor - 14}" width="30" height="14" rx="3" fill="#2b170e"/>',
            f'<rect x="{x1 - 6}" y="{floor - 14}" width="30" height="14" rx="3" fill="#2b170e"/>',
            f'<rect x="{x0}" y="{plinth}" width="{w}" height="26" fill="#2e180f"/>']
    out += [f'<rect x="{cx + d - 9}" y="{floor - 18}" width="18" height="9" rx="4" fill="url(#brass)"/>' for d in (-30, 0, 30)]
    # rim light from the window on the right edge
    out.append(f'<linearGradient id="rim{seed}" x1="0" y1="0" x2="1" y2="0"><stop offset="0.82" stop-color="{rim}" stop-opacity="0"/><stop offset="1" stop-color="{rim}" stop-opacity="{rim_op}"/></linearGradient>')
    out.append(f'<rect x="{x0 - 22}" y="{top}" width="{w + 44}" height="{floor - top}" fill="url(#rim{seed})"/>')
    return '\n'.join(out)


def photo_frame(x, y, w=64, h=50, fade=0.0):
    """A small framed photo on the lid: a little girl at a piano (sepia)."""
    return f"""<g transform="translate({x} {y})">
<rect x="0" y="0" width="{w}" height="{h}" rx="3" fill="url(#brass)"/>
<rect x="5" y="5" width="{w - 10}" height="{h - 10}" fill="#d8c09a"/>
<rect x="5" y="{h - 20}" width="{w - 10}" height="15" fill="#6b4a33"/>
<rect x="{w * .5}" y="{h - 26}" width="{w * .4}" height="10" fill="#3f2a1c"/>
<circle cx="{w * .32}" cy="{h * .42}" r="6" fill="#8a5a3c"/><circle cx="{w * .32 - 7}" cy="{h * .38}" r="3" fill="#5a3826"/><circle cx="{w * .32 + 7}" cy="{h * .38}" r="3" fill="#5a3826"/>
<path d="M {w * .32 - 8} {h - 8} L {w * .32} {h * .52} L {w * .32 + 8} {h - 8} Z" fill="#b8574a"/>
<rect x="5" y="5" width="{w - 10}" height="{h - 10}" fill="#f2e6cc" opacity="{.25 + fade}"/>
<path d="M {w / 2} {h} l -14 18 M {w / 2} {h} l 14 18" stroke="#9c7432" stroke-width="3"/>
</g>"""


def metronome(x, y):
    return f"""<g transform="translate({x} {y})"><path d="M 0 52 L 14 0 L 30 0 L 44 52 Z" fill="url(#woodFront)"/>
<path d="M 22 46 L 30 8" stroke="#e9d9b8" stroke-width="2.5"/><circle cx="28" cy="17" r="3" fill="url(#brass)"/></g>"""


def boxes(x, y, label=True):
    def box(bx, by, bw, bh, depth, tone):
        f, t, s = tone
        return (f'<path d="M {bx} {by} l {depth} {-depth * .55} l {bw} 0 l {-depth} {depth * .55} Z" fill="{t}"/>'
                f'<path d="M {bx + bw} {by} l {depth} {-depth * .55} l 0 {bh} l {-depth} {depth * .55} Z" fill="{s}"/>'
                f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="{f}"/>'
                f'<rect x="{bx + bw / 2 - 12}" y="{by}" width="24" height="{bh * .35}" fill="#d9c39c" opacity=".7"/>')
    out = [f'<ellipse cx="{x + 120}" cy="{y + 196}" rx="150" ry="16" fill="#000" opacity=".5" filter="url(#soft)"/>',
           box(x, y + 80, 220, 116, 34, ('#a97a49', '#c99a63', '#7d5632')),
           box(x + 30, y, 160, 80, 28, ('#b4834f', '#d4a56c', '#86603a'))]
    if label:
        out.append(f'<text x="{x + 110}" y="{y + 56}" text-anchor="middle" font-family="Hand" font-size="30" fill="#2a1a10" transform="rotate(-3 {x + 110} {y + 50})">MUSIC</text>')
        out.append(f'<text x="{x + 110}" y="{y + 150}" text-anchor="middle" font-family="Hand" font-size="24" fill="#2a1a10" opacity=".85">BOOKS - KEEP</text>')
    return '\n'.join(out)


def hallway(wall=('#2c393d', '#4b5751'), window_sky=('#fff1c9', '#ffc983'), night=False, seed=4):
    rnd = random.Random(seed)
    wall_top, wall_bot = wall
    out = [f'<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{wall_top}"/><stop offset="1" stop-color="{wall_bot}"/></linearGradient>',
           f'<rect width="{W}" height="{H}" fill="url(#wall)"/>']
    out += [f'<rect x="{i * 40}" y="0" width="2" height="600" fill="#fff" opacity=".035"/>' for i in range(33)]
    out += [f'<circle cx="{20 + (i % 32) * 40}" cy="{30 + (i // 32) * 60}" r="3" fill="#fff" opacity=".04"/>' for i in range(32 * 10)]
    # window on the right (cut by the frame edge) and a curtain
    sky0, sky1 = window_sky
    out += [f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky0}"/><stop offset="1" stop-color="{sky1}"/></linearGradient>',
            '<rect x="1092" y="48" width="220" height="420" fill="#e8dcc6"/>',
            '<rect x="1108" y="64" width="200" height="388" fill="url(#sky)"/>',
            '<rect x="1196" y="64" width="10" height="388" fill="#e8dcc6"/><rect x="1108" y="250" width="200" height="10" fill="#e8dcc6"/>',
            '<path d="M 1040 40 C 1060 200 1030 360 1056 480 L 1100 480 C 1086 340 1104 180 1094 40 Z" fill="#7d3328"/>',
            '<path d="M 1052 40 C 1066 200 1046 360 1066 480" stroke="#5c2219" stroke-width="5" fill="none" opacity=".6"/>',
            '<rect x="1030" y="30" width="270" height="12" rx="6" fill="url(#brass)"/>']
    if night:
        out += [f'<circle cx="{1120 + rnd.random() * 180:.0f}" cy="{80 + rnd.random() * 160:.0f}" r="{.8 + rnd.random():.1f}" fill="#fff" opacity=".7"/>' for _ in range(14)]
    # baseboard and floor
    out += ['<rect x="0" y="588" width="1280" height="20" fill="#d9cdb6"/><rect x="0" y="604" width="1280" height="4" fill="#000" opacity=".25"/>',
            '<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4630"/><stop offset="1" stop-color="#2c1b12"/></linearGradient>',
            '<rect x="0" y="608" width="1280" height="112" fill="url(#floor)"/>']
    vx = 700
    for i in range(-14, 16):
        x_far, x_near = vx + i * 56, vx + i * 150
        out.append(f'<line x1="{x_far}" y1="608" x2="{x_near}" y2="720" stroke="#1d110a" stroke-width="2" opacity=".45"/>')
    return '\n'.join(out)


def light_shaft(seed=9, strength=1.0):
    rnd = random.Random(seed)
    out = ['<linearGradient id="shaft" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2cf" stop-opacity=".42"/><stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></linearGradient>',
           f'<g opacity="{strength}"><path d="M 1110 64 L 1110 452 L 520 720 L 160 720 Z" fill="url(#shaft)" filter="url(#soft)"/>',
           '<path d="M 1200 64 L 1200 452 L 760 720 L 470 720 Z" fill="url(#shaft)" opacity=".6" filter="url(#soft)"/>']
    for _ in range(110):
        t, u = rnd.random(), rnd.random()
        x = 1110 - t * (1110 - 330) + (u - .5) * 260 * t; y = 80 + t * 600 + (u - .5) * 360 * (1 - t)
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{.7 + rnd.random() * 1.8:.1f}" fill="#fff6dc" opacity="{.25 + rnd.random() * .6:.2f}"/>')
    out.append('<ellipse cx="560" cy="660" rx="260" ry="34" fill="#ffd9a0" opacity=".18" filter="url(#soft)"/></g>')
    return '\n'.join(out)


def finish():
    return (f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity=".9" style="mix-blend-mode:overlay"/>'
            f'<rect width="{W}" height="{H}" fill="url(#vignette)"/>')


def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{FONTS}<defs>{common_defs()}</defs>{body}</svg>\n'


# ---------------------------------------------------------------- A: 11 YEARS UNPLAYED (afternoon, dust, nobody there)
def scene_a():
    px0, px1, top, floor = 600, 1010, 250, 610
    body = [hallway(), piano(px0, px1, top, floor, dust=1.0, seed=1), photo_frame(668, top - 50, fade=.25), metronome(920, top - 52),
            '<path d="M 1012 252 L 1060 196 M 1012 252 L 1048 238 M 1012 252 L 1030 206 M 1022 240 q 14 -8 22 -26 M 1030 230 q 10 -2 18 -10" stroke="#e8e1d6" stroke-width="1" opacity=".35" fill="none"/>',
            boxes(70, 420), light_shaft(strength=.72), headline(['11 YEARS', 'UNPLAYED'], y0=150, sizes=(130, 112), gap=122), finish()]
    return svg('\n'.join(body))


# ---------------------------------------------------------------- B: SHE CAME BACK. (night, lamp, lid open, one key lit)
def scene_b():
    px0, px1, top, floor = 600, 1010, 250, 610
    lamp_x = 520
    body = [hallway(wall=('#151c28', '#252f3e'), window_sky=('#22304a', '#3a4a66'), night=True),
            f'<radialGradient id="lamp" cx="{lamp_x / W:.3f}" cy="{350 / H:.3f}" r="55%"><stop offset="0" stop-color="#ffcf87" stop-opacity=".62"/><stop offset=".45" stop-color="#ffb35c" stop-opacity=".22"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>',
            f'<rect width="{W}" height="{H}" fill="url(#lamp)"/>',
            piano(px0, px1, top, floor, open_lid=True, glow_key=17, rim='#ffcf87', rim_op=.0, seed=2),
            # light from the lamp on the left face of the piano
            f'<linearGradient id="lampface" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffcf87" stop-opacity=".35"/><stop offset=".35" stop-color="#ffcf87" stop-opacity="0"/></linearGradient>',
            f'<rect x="{px0 - 22}" y="{top}" width="{px1 - px0 + 44}" height="{floor - top}" fill="url(#lampface)"/>',
            # music book open on the stand
            f'<path d="M 742 {top + 92} l 62 -8 l 0 64 l -62 8 Z" fill="#f4ead6"/><path d="M 804 {top + 84} l 62 8 l 0 64 l -62 -8 Z" fill="#efe3cb"/>',
            ''.join(f'<line x1="{752}" y1="{top + 104 + i * 10}" x2="{796}" y2="{top + 98 + i * 10}" stroke="#7a6a58" stroke-width="1.2" opacity=".7"/>'
                    f'<line x1="{812}" y1="{top + 98 + i * 10}" x2="{856}" y2="{top + 104 + i * 10}" stroke="#7a6a58" stroke-width="1.2" opacity=".7"/>' for i in range(5)),
            photo_frame(668, top - 50), metronome(920, top - 52),
            # mug with steam
            f'<g transform="translate(626 {top - 40})"><rect x="0" y="0" width="30" height="38" rx="5" fill="#d8e1e8"/><path d="M 30 10 q 14 2 0 20" stroke="#d8e1e8" stroke-width="5" fill="none"/>'
            '<path d="M 8 -6 q -8 -14 4 -26 q 10 -12 0 -26 M 20 -6 q -6 -12 4 -22" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/></g>',
            # bench pulled out
            '<ellipse cx="805" cy="690" rx="150" ry="16" fill="#000" opacity=".55" filter="url(#soft)"/>',
            '<path d="M 670 566 L 940 566 L 960 600 L 650 600 Z" fill="#4b2a1b"/><rect x="650" y="600" width="310" height="22" fill="#331b11"/>',
            '<path d="M 676 560 Q 805 548 934 560 L 940 570 L 670 570 Z" fill="#7a2f2a"/>',
            '<rect x="664" y="620" width="20" height="74" fill="#2b170e"/><rect x="926" y="620" width="20" height="74" fill="#2b170e"/>',
            # floor lamp
            f'<rect x="{lamp_x - 4}" y="380" width="8" height="230" fill="url(#brass)"/><ellipse cx="{lamp_x}" cy="612" rx="40" ry="8" fill="#2b170e"/>',
            f'<path d="M {lamp_x - 58} 384 L {lamp_x + 58} 384 L {lamp_x + 38} 316 L {lamp_x - 38} 316 Z" fill="#ffe2ad" filter="url(#glow)"/>',
            # floating notes from the glowing key
            ''.join(f'<g transform="translate({x} {y}) rotate({r})" opacity="{o}"><ellipse cx="0" cy="0" rx="12" ry="8.5" fill="{GOLD}" transform="rotate(-20)"/><rect x="9" y="-44" width="4.5" height="44" fill="{GOLD}"/></g>'
                    for x, y, r, o in ((800, 360, -8, .95), (850, 318, 6, .85), (776, 286, -4, .7), (884, 270, 10, .55))),
            headline(['SHE CAME', 'BACK.'], y0=150, sizes=(124, 124), gap=126), finish()]
    return svg('\n'.join(body))


# ---------------------------------------------------------------- C: I WAITED 11 YEARS (close-up of the closed lid)
def scene_c():
    rnd = random.Random(11)
    body = ['<linearGradient id="lidwood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d3321"/><stop offset=".5" stop-color="#7a4429"/><stop offset="1" stop-color="#4a2718"/></linearGradient>',
            f'<rect width="{W}" height="{H}" fill="url(#lidwood)"/>',
            f'<rect width="{W}" height="{H}" fill="#7a4429" filter="url(#woodgrain)"/>',
            # explicit grain lines (long, slightly wavy)
            ''.join(f'<path d="M -20 {y:.0f} C 300 {y + rnd.uniform(-14, 14):.0f} 800 {y + rnd.uniform(-18, 18):.0f} 1300 {y + rnd.uniform(-10, 10):.0f}" stroke="#2e170d" stroke-width="{rnd.uniform(1, 3.5):.1f}" fill="none" opacity="{rnd.uniform(.12, .35):.2f}"/>' for y in [rnd.uniform(0, H) for _ in range(46)]),
            # brass maker's name, inlaid (bottom right)
            '<text x="1010" y="664" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="30" letter-spacing="12" fill="url(#brass)" opacity=".9">ELLIS &amp; SON</text>',
            # dust everywhere except where a finger wiped through it
            '<mask id="trail"><rect width="1280" height="720" fill="#fff"/><path d="M 560 650 C 660 560 760 520 870 476 S 1060 392 1150 340" stroke="#000" stroke-width="40" stroke-linecap="round" fill="none" filter="url(#soft3)"/></mask>',
            '<g mask="url(#trail)">',
            f'<rect width="{W}" height="{H}" fill="#d9c6ae" opacity=".34"/>']
    body += [f'<circle cx="{rnd.random() * W:.0f}" cy="{rnd.random() * H:.0f}" r="{.6 + rnd.random() * 1.8:.1f}" fill="#f3e8d8" opacity="{.3 + rnd.random() * .55:.2f}"/>' for _ in range(1600)]
    body += ['</g>',
             # gloss along the wiped strip
             '<path d="M 570 638 C 670 552 768 514 876 470 S 1062 388 1146 342" stroke="#ffe7c4" stroke-width="5" stroke-linecap="round" fill="none" opacity=".35" filter="url(#soft3)"/>',
             # child's practice note, taped, faded
             '<g transform="translate(870 90) rotate(5)"><rect x="6" y="8" width="250" height="230" fill="#000" opacity=".35" filter="url(#soft)"/>'
             '<rect x="0" y="0" width="250" height="230" fill="#f3e7a8"/><rect x="0" y="0" width="250" height="230" fill="#fff" opacity=".18"/>'
             '<rect x="88" y="-14" width="74" height="28" fill="#e8e2d0" opacity=".75" transform="rotate(-4 125 0)"/>'
             '<text x="24" y="70" font-family="Hand" font-size="40" fill="#3a5bb0" opacity=".75">practise</text>'
             '<text x="24" y="118" font-family="Hand" font-size="40" fill="#3a5bb0" opacity=".75">every day!!</text>'
             '<text x="24" y="176" font-family="Hand" font-size="30" fill="#c04a3c" opacity=".7">- Mia, age 8</text>'
             '<path d="M 250 230 l -34 0 l 34 -30 Z" fill="#d8c98a"/></g>',
             # gold star sticker, faded
             '<g transform="translate(760 300) rotate(-12)" opacity=".85"><path d="M 0 -46 L 13 -14 L 46 -14 L 19 7 L 29 40 L 0 20 L -29 40 L -19 7 L -46 -14 L -13 -14 Z" fill="#fff" transform="scale(1.18)"/>'
             '<path d="M 0 -46 L 13 -14 L 46 -14 L 19 7 L 29 40 L 0 20 L -29 40 L -19 7 L -46 -14 L -13 -14 Z" fill="#f0c24a"/><path d="M 0 -46 L 13 -14 L 46 -14 L 19 7 L 29 40 L 0 20 L -29 40 L -19 7 L -46 -14 L -13 -14 Z" fill="#fff" opacity=".28"/></g>',
             # warm light from the top right
             '<radialGradient id="lidlight" cx="85%" cy="5%" r="80%"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>',
             f'<rect width="{W}" height="{H}" fill="url(#lidlight)"/>',
             headline(['I WAITED', '11 YEARS'], y0=200, sizes=(124, 132), gap=138), finish()]
    return svg('\n'.join(body))


if __name__ == '__main__':
    for name, fn in (('a', scene_a), ('b', scene_b), ('c', scene_c)):
        (HERE / f'{name}.svg').write_text(fn())
        print('wrote', (HERE / f'{name}.svg').relative_to(HERE.parents[4]))
