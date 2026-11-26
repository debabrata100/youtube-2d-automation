"""Draft 3 of the Moon Shorts: real NASA photos as the main picture (26 Nov 2026).

Why: the winning Shorts on this topic show a realistic Moon and Earth that fill the phone screen and keep moving; our flat
kit discs read as a children's drawing (see stories/moon-shorts-script.md, "Draft 3"). Photos come from
scripts/prepare-moon-photos.py as 2160x3840 transparent layers, so a layer can zoom to 2x without losing detail.

Frame units are the 1080x1920 Shorts frame. Every subject is anchored at its own centre, so `scale` zooms around it and
`x`/`y` move it. Everything important stays above the Shorts interface (y < 1500).
"""
from recipes import *  # noqa: F401,F403

MOON_Y, LIMB_TOP, LIMB_R = 780, 1180, 1300        # must match scripts/prepare-moon-photos.py


def build(ep, NAME, P, lv, end, on):
    W, H = ep.F['W'], ep.F['H']
    ep.theme = 'photo-night'        # no ink boil: the displacement filter wobbles photos and darkens soft glows
    ep.F['primary'] = 1.0           # the picture fills the whole phone screen (kit scenes keep 90%)

    def ph(aid, file, scale=None, x=None, y=None, opacity=None, rotate=None, bright=None, anchor_y=MOON_Y):
        ep.asset(aid, f'nasa/moon-photos/{file}.png', 2160, 3840)
        L = {'id': aid, 'asset': aid, 'anchor': {'x': W / 2, 'y': anchor_y}}
        for k, v in (('scale', scale), ('x', x), ('y', y), ('opacity', opacity), ('rotate', rotate), ('brightness', bright)):
            if v is not None: L[k] = v if isinstance(v, list) else track((0, v))
        return P(L)

    def limb(): return ph('earth-limb', 'earth-limb', anchor_y=LIMB_TOP)
    def arka(poses, faces, x=.82):
        dx = abs(x - .5) * W
        feet = (LIMB_TOP + LIMB_R - (LIMB_R ** 2 - dx ** 2) ** .5 + 8) / H     # stands on Earth's curved edge
        return Char('arka', 'arka', x=x, fy=round(feet, 4), h=.13, idle=None, poses=poses, faces=faces)
    K = 1.6                          # the Sun-and-Moon close-up: Sun 480 px wide, the Moon covering it at .31 * K
    def sun(glow=None):
        op = glow if glow is not None else track((0, 1))
        return [ph('sun', 'sun', opacity=op, scale=track((0, K)))]
    def glow(op): return P({'id': 'hot', 'kit': {'type': 'glow', 'x': .5, 'y': (MOON_Y - 80) / H, 'rx': .9, 'ry': .5, 'tone': 'hot'}, 'opacity': op})
    def scene(bid, chars, props, sounds=(), shake=()):
        # Real black space under every shot, drifting slowly so even a still moment moves.
        sky = ph('space', 'space', anchor_y=H / 2, scale=track((0, 1.07)), y=track((0, 0), (900, -60)))   # overscan so the slow drift never shows an edge
        ep.scene(bid, explain(chars, [sky, *props], [], camera_preset=None, sounds=list(sounds), shake=list(shake)))

    if NAME == 'sky':
        BIG = 1.35                                 # the hook: tonight's Moon through a long lens, wider than the phone
        e1 = end('it.')
        scene('a1', [], [ph('moon', 'moon', scale=track((0, BIG), (e1, 1.18, 'smoothstep')), y=track((0, 0), (e1, -30, 'smoothstep')))],
              sounds=[('rumble', A('leaving'), -24)])
        # Earth and Moon together: the Moon steps away on every stressed word.
        steps = ['Every', 'year,', 'slips', 'four', 'farther']
        sk, yk = [(0, .2)], [(0, -260)]
        for k, wd in enumerate(steps):
            sk += [(plus(A(wd), -1), round(.2 - .012 * k, 3)), (plus(A(wd), 3), round(.2 - .012 * (k + 1), 3), 'ease-out-cubic')]
            yk += [(plus(A(wd), -1), -260 - 22 * k), (plus(A(wd), 3), -260 - 22 * (k + 1), 'ease-out-cubic')]
        earth = lambda s0, s1, a, b: ph('earth', 'earth', scale=track((0, s0), (a, s0), (b, s1, 'smoothstep')), y=track((0, 420)), rotate=track((0, 0), (b, 3)))
        scene('a2', [], [earth(.62, .66, 0, end('away.')), ph('moon', 'moon', scale=track(*sk), y=track(*yk))],
              sounds=[('tick', A(wd), -16) for wd in steps])
        # Rewind: the Moon rushes back toward Earth, spinning backwards.
        r = A('rewind.')
        scene('a3', [], [earth(.66, .72, r, plus(r, 14)),
                         ph('moon', 'moon', scale=track((0, .14), (r, .14), (plus(r, 14), .42, 'smoothstep')), y=track((0, -370), (r, -370), (plus(r, 14), -40, 'smoothstep')),
                            rotate=track((0, 0), (r, 0), (plus(r, 14), -120, 'smoothstep')))],
              sounds=[('rewind', r, -12)])
        # Four billion years ago: a molten Moon fills the sky over Earth's curved edge.
        f4 = A('Four')
        scene('a4', [], [glow(track((0, 0), (plus(f4, -1), 0), (plus(f4, 10), .9))),
                         ph('moonhot', 'moon-molten', scale=track((0, .42), (plus(f4, -1), .42), (plus(f4, 14), 1.25, 'ease-out-back'), (end('sky.'), 1.34)),
                            y=track((0, -180), (plus(f4, -1), -180), (plus(f4, 14), 0, 'ease-out-cubic'))),
                         limb()],
              sounds=[('boom', f4, -10)], shake=[(f4, 14, .035)])
        # Running ever since: it shrinks and cools to tonight's grey Moon.
        e5 = end('since.')
        sh = track((0, 1.34), (A('running'), 1.34), (e5, .3, 'smoothstep'))
        yy = track((0, 0), (A('running'), 0), (e5, -330, 'smoothstep'))
        scene('a5', [], [glow(track((0, .9), (e5, 0))), ph('moon', 'moon', scale=sh, y=yy),
                         ph('moonhot', 'moon-molten', scale=sh, y=yy, opacity=track((0, 1), (A('running'), 1), (e5, 0))), limb()],
              sounds=[('riser', A('And'), -22)])
        ann = lambda s: ph('ann', 'eclipse-annular', scale=s, opacity=track((0, 0), (8, 1)), anchor_y=806)
        scene('a6', [], [ann(track((0, 1.0), (end('Sun.'), 1.22, 'smoothstep'), (end('Forever.'), 1.3)))], sounds=[('slam', A('Forever.'), -10)])
        q = end('eclipse?')
        scene('a7', [arka([(0, 'point-left')], [(0, 'shocked')])],
              [ann(track((0, 1.3), (q, 1.42, 'smoothstep'))), limb(),
               ph('moon', 'moon', scale=track((0, .6), (q, .6), (plus(q, 12), BIG, 'smoothstep')), opacity=track((0, 0), (q, 0), (plus(q, 6), 1)))],
              sounds=[('whoosh', q, -18)])
    else:
        tot = lambda s, b=None, op=None: ph('tot', 'eclipse-total', scale=s, bright=b, opacity=op, anchor_y=806)
        scene('b1', [], [tot(track((0, 1.25), (end('time.'), 1.42, 'smoothstep')), b=track((0, 1.1), (end('time.'), .8)))],
              sounds=[('heartbeat', A('dark'), -16)])
        scene('b2', [], [ph('earth', 'earth', scale=track((0, .6), (end('last.'), .78, 'smoothstep')), y=track((0, 40)), rotate=track((0, 0), (end('last.'), 5)))],
              sounds=[('heartbeat', A('know'), -16)])
        # The Moon slides over the Sun and fits exactly; then the real total eclipse.
        p = end('perfectly.')
        out = track((0, 1), (p, 1), (plus(p, 4), 0))
        scene('b3', [], [*sun(glow=out), ph('moon', 'moon', scale=track((0, .31 * K)), x=track((0, 760), (A('Moon'), 760), (p, 0, 'smoothstep')), bright=track((0, .5)), opacity=out),
                         tot(track((0, 1.0), (end('luck.'), 1.12)), op=track((0, 0), (p, 0), (plus(p, 4), 1)))],
              sounds=[('chime', A('perfectly.'), -20)])
        # Drifting away: the real Earth-and-Moon photo pulls back; then the Moon's disc shrinks off the Sun's edge.
        sd = A('shadow')
        scene('b4', [], [*sun(), ph('moon', 'moon', scale=track((0, .31 * K), (sd, .31 * K), (end('shrinking.'), .255 * K, 'smoothstep')), bright=track((0, .5))),
                         ph('em', 'earth-moon', scale=track((0, 1.25), (sd, 1.0, 'smoothstep')), opacity=track((0, 1), (plus(sd, -4), 1), (sd, 0)))],
              sounds=[('riser', A('drifting'), -22), ('heartbeat', sd, -16)])
        a = A('all.')
        scene('b5', [], [ph('ann', 'eclipse-annular', scale=track((0, 1.0), (a, 1.25, 'smoothstep')), anchor_y=806)],
              sounds=[('slam', a, -10)], shake=[(a, 12, .025)])
        q = end('sky?')
        scene('b6', [arka([(0, 'point-left')], [(0, 'shocked')])],
              [glow(track((0, 0), (A('fill'), 0), (q, .8))),
               ph('moonhot', 'moon-molten', scale=track((0, .25), (A('fill'), .25), (plus(q, 10), 1.25, 'ease-out-back')), y=track((0, -400), (A('fill'), -400), (plus(q, 10), 0, 'ease-out-cubic'))),
               limb()],
              sounds=[('whoosh', A('fill'), -18), ('boom', A('whole'), -16)])   # the boom lands on 'whole', not after the last word: the ending stays quiet
