"""Shared helpers for hand-drawn (paint-notebook) storyboard generators.

Layer, kit, annotation and effect builders with word-anchor timing. Format-agnostic: callers pass
fractions of the group size (kit) or group pixels (annotations), so 16:9 and 9:16 boards share them.
"""
INK, RED, BLUE, PALE = '@text.fill', '@text.accent', '@water.mid', '@water.light'


def A(word, offset=0, n=1, edge=None, beat=None):
    a = {'at': word}
    if n != 1: a['n'] = n
    if edge: a['edge'] = edge
    if offset: a['offset'] = offset
    if beat: a['beat'] = beat
    return a


def plus(t, k):
    if isinstance(t, dict):
        o = dict(t); total = o.pop('offset', 0) + k
        if total: o['offset'] = total
        return o
    return t + k


def track(*pairs):
    out = []
    for p in pairs:
        k = {'frame': p[0], 'value': p[1]}
        if len(p) > 2: k['ease'] = p[2]
        out.append(k)
    return out


def show_from(at):
    return track((0, 0), (plus(at, -1), 0), (at, 1))


def show_until(at):
    return track((0, 1), (plus(at, -1), 1), (at, 0))


def pop_in(at, anchor=None):
    d = {'opacity': show_from(at), 'scale': track((0, .6), (plus(at, -1), .6), (plus(at, 9), 1, 'ease-out-back'))}
    if anchor: d['anchor'] = {'x': anchor[0], 'y': anchor[1]}
    return d


def figure(fid, fx, fy, h, poses, faces, accessories=(), outfit='stick', shiver=0, seed=3, **layer):
    kit = {'type': 'figure', 'x': fx, 'y': fy, 'height': h, 'outfit': outfit, 'shiver': shiver, 'seed': seed,
           'poses': [{'frame': f, 'pose': p} for f, p in poses], 'faces': [{'frame': f, 'face': c} for f, c in faces]}
    if accessories:
        kit['accessories'] = [dict(item=i, **({'from': f} if f != 0 else {})) for i, f in accessories]
    return {'id': fid, 'kit': kit, **layer}


def planet(pid, px, py, r, base, bands=(), craters=0, ring=False, shade=.2, seed=1, **layer):
    return {'id': pid, 'kit': {'type': 'planet', 'x': px, 'y': py, 'radius': r, 'base': base, 'bands': list(bands), 'craters': craters, 'ring': ring, 'shade': shade, 'seed': seed}, **layer}


def prop(pid, item, px, py, size, **extra):
    layer = {k: extra.pop(k) for k in list(extra) if k in ('opacity', 'scale', 'anchor', 'x', 'y')}
    return {'id': pid, 'kit': {'type': 'prop', 'item': item, 'x': px, 'y': py, 'size': size, **extra}, **layer}


def note(nid, text, x, y, at, size=72, color=RED, to=None, frm=None):
    a = {'id': nid, 'text': text, 'x': x, 'y': y, 'size': size, 'anchor': 'middle', 'variant': 'ink', 'color': color, 'pop': True,
         'opacity': track((0, 0), (plus(at, -1), 0), (plus(at, 5), 1))}
    if to: a['connector'] = {'from': {'x': frm[0], 'y': frm[1]}, 'to': {'x': to[0], 'y': to[1]}}
    return a


def rain(eid, x, width, speed, start, end, color, count=26, seed=5, outline=True, top=.14):
    e = {'id': eid, 'type': 'particles', 'count': count, 'seed': seed, 'startFrame': start, 'endFrame': end,
         'emitter': {'x': x, 'y': top, 'width': width, 'height': .02}, 'lifetimeFrames': [int(.9 / speed) if speed < .02 else 45, int(1.0 / speed) if speed < .02 else 50],
         'velocity': {'angleDegrees': 90, 'spreadDegrees': 2, 'speed': [speed * .9, speed * 1.1]}, 'acceleration': {'x': 0, 'y': 0},
         'radius': [.009, .013], 'colors': [color], 'shape': 'drop',
         'opacity': [{'at': 0, 'value': 1}, {'at': .9, 'value': 1}, {'at': 1, 'value': 0}], 'scale': [{'at': 0, 'value': 1}, {'at': 1, 'value': 1}]}
    if outline: e['outline'] = '#1d1d1f'
    return e


def bubbles(eid, x, y, at, count=24):
    return {'id': eid, 'type': 'particles', 'count': count, 'seed': 41, 'startFrame': plus(at, 0), 'endFrame': plus(at, 50),
            'emitter': {'x': x, 'y': y, 'width': .04, 'height': .01}, 'lifetimeFrames': [16, 26],
            'velocity': {'angleDegrees': -90, 'spreadDegrees': 40, 'speed': [.002, .004]}, 'acceleration': {'x': 0, 'y': 0},
            'radius': [.005, .01], 'colors': [PALE], 'outline': '#1d1d1f', 'shape': 'circle',
            'opacity': [{'at': 0, 'value': 0}, {'at': .15, 'value': 1}, {'at': 1, 'value': 0}], 'scale': [{'at': 0, 'value': .5}, {'at': 1, 'value': 1.2}]}


def molecule(prefix, cx, cy, r, color, at, n=2, aspect=1080 / 1920):
    """aspect = min(group width, height) / width, so the atoms touch in any format."""
    return [planet(f'{prefix}-{i}', cx + (i - (n - 1) / 2) * r * 1.5 * aspect * 1.6, cy, r, color, shade=.12, seed=60 + i, **pop_in(plus(at, i))) for i in range(n)]


def scene(sid, gid, cue, nominal, sounds, cam=None):
    return {'id': sid, 'template': 'hero-reveal', 'durationFrames': nominal, 'animationDurationFrames': nominal,
            'caption': {'text': sid, 'preset': 'body'},
            'camera': {'preset': 'static', 'boundaryMode': 'backdrop', **({'keyframes': cam} if cam else {})},
            'motion': {'preset': 'still'}, 'seed': 7000 + len(sid), 'transitionFrames': 0, 'environmentDim': 0,
            'config': {'primary': {'asset': gid, 'x': .5, 'y': .5, 'size': .9}},
            'narrationCue': {'beatId': cue, 'phraseIndex': 0, 'edge': 'start'},
            'sounds': [{'sound': s, 'frame': f, 'gainDb': g} for s, f, g in sounds]}


kf = lambda f, z: {'frame': f, 'focus': {'x': .5, 'y': .5}, 'zoom': z, 'easing': 'smoothstep'}
