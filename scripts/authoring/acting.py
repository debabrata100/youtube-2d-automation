"""Acting helpers (M4.2): lip sync windows and comic pose timing for figure layers.

    talk(text, beat)            one mouth window per spoken word (start/end word anchors), for the figure's `talk`
    snap(at, pose, wind='cower') anticipation (a quick wind-up pose) then the pose with an overshooting ease
    double_take(at, away, back)  look, look away, then snap back: the classic comic double-take
"""
import re
from paintkit import A, plus

_norm = lambda w: re.sub(r"[^\w'-]+", '', w.lower().replace('’', "'"))


def talk(text, beat=None, lead=-1, tail=1):
    """Windows for every word of `text` (the beat's full narration, so occurrence numbers match the anchors)."""
    seen, out = {}, []
    for raw in text.split():
        w = _norm(raw)
        if not w: continue
        seen[w] = seen.get(w, 0) + 1
        out.append({'from': A(w, lead, n=seen[w], beat=beat), 'to': A(w, tail, n=seen[w], edge='end', beat=beat), 'text': w})
    return out


def snap(at, pose, wind='cower', lead=5, blend=9):
    """Pose keys (frame, pose, blend, ease): a short wind-up `lead` frames before `at`, then an overshooting arrival."""
    return [(plus(at, -lead), wind, 4, 'smoothstep'), (at, pose, blend, 'ease-out-back')]


def double_take(at, look='point-right', away='stand', back='reach', gap=14):
    """Glance at something (`at`), look away, then snap back with a wind-up and overshoot."""
    return [(at, look, 8, 'smoothstep'), (plus(at, gap), away, 8, 'smoothstep'), *snap(plus(at, gap * 2), back, lead=4, blend=7)]
