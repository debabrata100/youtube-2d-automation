"""Attraction report (docs/VISUAL_CHECKLIST.md section 10): does the picture keep up with the narration?

Reads a prepared job (render-cached-story --prepare-only) and measures, over the whole video or a window:
  - picture changes a minute and the longest stretch with nothing new (target: something new at least every 4 s)
  - shots with a locked camera (no keyframes, no shake)
  - on-screen words a minute: notes plus text drawn on props, each text counted once (target: 40 or fewer)
  - action beats: narration pauses of 1 s or more (the animation plays with sound; target: one or more per chapter)
  - sound cues a minute
No network, no cost.

Usage: python3 scripts/attraction-report.py <prepared-job> [from_seconds to_seconds]
"""
import json, pathlib, sys

TRACKS = ('x', 'y', 'scale', 'rotate', 'opacity')
KIT_KEYS = ('level', 'level2', 'values', 'poses', 'faces', 'helmet', 'flush')


def frames_of(keys):
    return [k['frame'] for k in keys if isinstance(k, dict) and isinstance(k.get('frame'), (int, float))]


def changes(keys):
    """Frames where a keyed value starts to change (or a pose/face switches)."""
    out = []
    for a, b in zip(keys, keys[1:]):
        va = a.get('value', a.get('pose', a.get('face', a.get('on')))); vb = b.get('value', b.get('pose', b.get('face', b.get('on'))))
        if va != vb: out.append(a['frame'] if 'value' in a else b['frame'])
    return out


def main(job, t0=None, t1=None):
    job = pathlib.Path(job); board = json.loads((job / 'storyboard.json').read_text()); fps = board['format']['fps']
    narr = json.loads((job / 'narration-props.json').read_text())
    groups = {g['id']: g for g in board['groups']}
    events, words, static, cues, start = [], [], [], [], 0
    for sc in board['scenes']:
        dur, anim = sc['durationFrames'], sc.get('animationDurationFrames', sc['durationFrames'])
        to_out = lambda f, s=start, d=dur, a=anim: s + round(f * (d - 1) / max(1, a - 1))
        events.append((start, f"cut to {sc['id']}"))
        cam = sc.get('camera', {})
        if not cam.get('keyframes') and not cam.get('shake'): static.append(sc['id'])
        for k in cam.get('keyframes', [])[1:]: events.append((start + k['frame'], 'camera'))
        for k in cam.get('shake', []): events.append((start + k['frame'], 'shake'))
        for s in sc.get('sounds', []): cues.append(start + s['frame'])
        g = groups.get(sc['config']['primary']['asset'], {})
        for layer in g.get('layers', []):
            kit = layer.get('kit', {})
            for key in TRACKS:  # idle loops (drift, breathing: many keys) are motion, not something new
                if key in layer and len(layer[key]) <= 10: events += [(to_out(f), layer['id']) for f in changes(layer[key])]
            for key in KIT_KEYS:
                if isinstance(kit.get(key), list): events += [(to_out(f), layer['id']) for f in changes(kit[key])]
            if kit.get('text'):
                on = next((k['frame'] for k in layer.get('opacity', []) if k.get('value', 0) > 0), 0)
                words.append((to_out(on), kit['text']))
        for a in g.get('annotations', []):
            on = next((k['frame'] for k in a.get('opacity', []) if k.get('value', 0) > 0), 0)
            events.append((to_out(on), 'note')); words.append((to_out(on), a['text']))
        start += dur
    end = start
    lo = round((t0 or 0) * fps); hi = round(t1 * fps) if t1 else end
    ev = sorted({f for f, _ in events if lo <= f <= hi})
    gaps = [(b - a, a) for a, b in zip([lo] + ev, ev + [hi])]
    longest = max(gaps) if gaps else (hi - lo, lo)
    minutes = (hi - lo) / fps / 60
    spoken = sorted((w['startFrame'], w['endFrame']) for c in narr['cues'] for w in c['words'])
    pauses = [(a[1], b[0]) for a, b in zip(spoken, spoken[1:]) if b[0] - a[1] >= fps and lo <= a[1] <= hi]
    report = {
        'window': [round(lo / fps, 1), round(hi / fps, 1)],
        'pictureChangesPerMinute': round(len(ev) / minutes, 1),
        'longestStillSeconds': round(longest[0] / fps, 1), 'longestStillAt': round(longest[1] / fps, 1),
        'stillStretchesOver4s': [round(a / fps, 1) for g_, a in gaps if g_ > 4 * fps],
        'onScreenWordsPerMinute': round(sum(len(t.split()) for t in {t for f, t in words if lo <= f <= hi}) / minutes, 1),  # each text counted once
        'lockedCameraShots': static if t1 is None else [s for s in static],
        'actionBeatPauses': [{'at': round(a / fps, 1), 'seconds': round((b - a) / fps, 1)} for a, b in pauses],
        'soundCuesPerMinute': round(sum(1 for f in cues if lo <= f <= hi) / minutes, 1),
        'targets': {'longestStillSeconds': 4, 'onScreenWordsPerMinute': 40, 'actionBeats': 'one or more per chapter'},
    }
    out = job / 'reports/attraction-report.json'; out.write_text(json.dumps(report, indent=1) + '\n')
    print(json.dumps(report, indent=1))


if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], float(a[1]) if len(a) > 1 else None, float(a[2]) if len(a) > 2 else None)
