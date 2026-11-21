"""Approval trailer (16:9, about 90 s) for the reworked "How You'd Die on Every Moon" (script draft 5).

Free and offline: placeholder voices (Piper TTS, not the episode voices), scenes timed to each spoken line,
a synthesized radiation alarm that speeds up through the climax. Never reveals Io or Titan.

Writes storyboards/every-moon-trailer.json and jobs/em-trailer/trailer-audio.wav. Then:
  npx tsx scripts/render-storyboard.ts storyboards/every-moon-trailer.json        (silent video)
  ffmpeg -i <video> -i jobs/em-trailer/trailer-audio.wav -c:v copy -c:a aac -shortest <out>.mp4
Usage: python3 scripts/authoring/plan-every-moon-trailer.py [piper-voices-dir]
"""
import json, math, pathlib, struct, subprocess, sys, wave

ROOT = pathlib.Path(__file__).resolve().parents[2]
VOICES = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/piper')
JOB = ROOT / 'jobs/em-trailer'; (JOB / 'seg').mkdir(parents=True, exist_ok=True)
FPS, W, H, RATE = 30, 1920, 1080, 22050
NARR, ARKA = (VOICES / 'en-us-ryan-high.onnx', '1.05'), (VOICES / 'en-us-lessac-medium.onnx', '1.0')
SUIT, VISOR = '#e8b84a', '#ffe6a3'
CREAM, GOLD, SOFT = '#f4efe2', '#ffd25e', '#cfd8ea'


# ------------------------------------------------------------------ layer helpers
def lv(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def prop(pid, item, x, y, size, **k):
    return {'id': pid, 'kit': {'type': 'prop', 'item': item, 'x': x, 'y': y, 'size': size, **k}}


def bg(color, level=1):
    # a flat page colour over the whole frame (terrain from the top edge)
    return {'id': 'bg', 'kit': {'type': 'terrain', 'top': 0, 'curve': 0, 'fill': color, 'detail': color, 'rocks': 0, 'bumps': 1, 'seed': 1}}


def ground(fill, detail, top=.8, curve=.08, seed=5):
    return {'id': 'ground', 'kit': {'type': 'terrain', 'top': top, 'curve': curve, 'fill': fill, 'detail': detail, 'rocks': 4, 'bumps': 6, 'seed': seed}}


def planet(pid, x, y, r, base, bands=(), shade=.25, seed=3, craters=0):
    return {'id': pid, 'kit': {'type': 'planet', 'x': x, 'y': y, 'radius': r, 'base': base, 'bands': list(bands), 'craters': craters, 'ring': False, 'shade': shade, 'seed': seed}}


def arka(x, y, h=.42, poses=((0, 'stand'),), faces=((0, 'neutral'),), acc=(), dx=None, dy=None, shiver=0, facing='right'):
    k = {'type': 'figure', 'x': x, 'y': y, 'height': h, 'outfit': 'astronaut', 'shiver': shiver, 'seed': 11, 'facing': facing,
         'poses': [{'frame': f, 'pose': p} for f, p in poses], 'faces': [{'frame': f, 'face': fc} for f, fc in faces],
         'suit': SUIT, 'visor': VISOR}
    if acc: k['accessories'] = [{'item': a, 'from': 0} for a in acc]
    layer = {'id': 'arka', 'kit': k}
    if dx: layer['x'] = [{'frame': f, 'value': v, 'ease': 'smoothstep'} for f, v in dx]
    if dy: layer['y'] = [{'frame': f, 'value': v, 'ease': 'smoothstep'} for f, v in dy]
    return layer


def note(nid, text, x, y, size=64, color=CREAM, at=0, pop=True):
    n = {'id': nid, 'text': text, 'x': round(x * W), 'y': round(y * H), 'size': size, 'anchor': 'middle', 'variant': 'ink', 'color': color, 'pop': pop}
    if at: n['opacity'] = [{'frame': 0, 'value': 0}, {'frame': at, 'value': 0}, {'frame': at + 6, 'value': 1}]
    return n


def tag(text, color, at=0):
    """Survival-time tag (top right), green -> amber -> red as danger rises; text never red (VISUAL_CHECKLIST)."""
    return [note('tag-k', 'SURVIVAL TIME', .15, .1, 34, SOFT, at, False), note('tag', text, .15, .18, 60, color, at)]


def unknown():
    return note('who', 'MOON ?', .5, .09, 56, CREAM, 0, False)


# ------------------------------------------------------------------ shots: (id, [(voice, text)], builder(frames) -> (layers, notes), extra seconds)
S = []


def shot(sid, lines, build, tail=.35):
    S.append((sid, lines, build, tail))


N, A = 'N', 'A'
# 1-3 the anonymous hook (no names, no planets)
shot('t1', [(N, 'On one moon in our solar system, you could step off a cliff and fall for twelve whole minutes.')], lambda d: (
    [bg('#6f8296'), ground('#aab6c2', '#7d8a98', top=.97, curve=0), prop('cliff', 'cliff', .52, .3, .67, color='#c3ccd5'),
     arka(.485, .3, .2, poses=((0, 'stand'), (int(d * .55), 'scared')), faces=((0, 'neutral'), (int(d * .55), 'shocked')))],
    [unknown()]))
shot('t2', [(N, 'On another, walking a little too fast would launch you into space. Permanently.')], lambda d: (
    [bg('#3a2320'), ground('#9a6b55', '#6e4535', top=.78, curve=.12), prop('speed', 'speedometer', .8, .3, .2, level=lv((0, .2), (int(d * .4), .8))),
     arka(.4, .78, .32, poses=((0, 'walk'), (int(d * .45), 'float')), faces=((0, 'happy'), (int(d * .5), 'shocked')), dy=((0, 0), (int(d * .45), 0), (d, -330)), dx=((0, 0), (d, 120)))],
    [unknown()]))
shot('t3', [(N, 'And on one of them, you could take off your spacesuit, strap on wings, and fly.')], lambda d: (
    [bg('#d9893a'), {'id': 'glow', 'kit': {'type': 'glow', 'x': .5, 'y': .35, 'rx': .9, 'ry': .5, 'tone': 'sun'}}, ground('#b8742f', '#8c531d', top=.84, curve=.04),
     arka(.42, .78, .34, poses=((0, 'flap'),), faces=((0, 'grin'),), acc=('wings',), dy=((0, 0), (d, -260)), dx=((0, 0), (d, 260)))],
    [unknown()]))
# 4 the two locked cards
LOCK = lambda d, glow=False: [bg('#0b0d16'), planet('lock1', .32, .5, .2, '#2b2f3d', shade=.4), planet('lock2', .68, .5, .2, '#2b2f3d', shade=.4),
                              prop('q1', 'question', .32, .5, .16, color=GOLD), prop('q2', 'question', .68, .5, .16, color=GOLD)]
shot('t4', [(N, 'Two places stay locked until the very end. The deadliest moon of all. And the one where you can fly.')], lambda d: (
    LOCK(d), [note('l1', 'DEADLIEST', .32, .82, 64, GOLD, int(d * .4)), note('l2', 'YOU CAN FLY', .68, .82, 64, GOLD, int(d * .72))]))
# 5-6 a taste of the dangers
shot('t5', [(N, 'In 1972, after a moonwalk, Apollo 17\'s Harrison Schmitt took off his helmet inside the lander and started sneezing. His eyes watered, his throat itched. He called it "lunar hay fever."')], lambda d: (
    [bg('#141a28'), ground('#b5b5b0', '#7d7d78', top=.8, curve=.1), planet('earth', .84, .2, .07, '#5aa9e6', ('#7cc576', '#5aa9e6', '#7cc576')),
     prop('dust', 'smell-lines', .47, .4, .14, color='#d9d4c7'), arka(.42, .8, .4, poses=((0, 'stand'), (int(d * .45), 'cower')), faces=((0, 'neutral'), (int(d * .45), 'puffed')), shiver=0)],
    [note('h', 'OUR MOON', .5, .09, 56, CREAM, 0, False), note('hf', '"lunar hay fever"', .72, .5, 62, GOLD, int(d * .78)), note('ap', 'Apollo 17, 1972', .72, .6, 40, SOFT, int(d * .1))]))
shot('t6', [(A, 'Allergic to the Moon. That\'s a very specific way to ruin a holiday.')], lambda d: (
    [bg('#141a28'), ground('#b5b5b0', '#7d7d78', top=.8, curve=.1), arka(.5, .8, .46, poses=((0, 'shrug'),), faces=((0, 'smug'),))],
    [note('h', 'OUR MOON', .5, .09, 56, CREAM, 0, False)]))
shot('t7', [(N, 'On Deimos, one strong jump would do it. Survival time: one step too many. Then you drift, watching Mars turn, until your air runs out.')], lambda d: (
    [bg('#1c1216'), planet('mars', .8, .32, .22, '#c1532f', ('#a8452a', '#c1532f')), prop('moonlet', 'small-moon', .3, 1.02, .5, color='#8a7468'),
     prop('air', 'battery', .62, .86, .12, level=lv((0, 1), (d, .25))),
     arka(.32, .62, .26, poses=((0, 'cheer'), (int(d * .2), 'float')), faces=((0, 'grin'), (int(d * .35), 'scared')), dy=((0, 0), (d, -260)), dx=((0, 0), (d, 220)))],
    [note('h', 'DEIMOS', .5, .09, 56, CREAM, 0, False)] + tag('one step', '#9be07a', int(d * .3))))
shot('t8', [(N, 'Step off the edge, and Miranda\'s gravity is so weak that you\'d fall for about twelve minutes. Twelve silent minutes, watching the ground come up to meet you.')], lambda d: (
    [bg('#6f8296'), prop('cliff', 'cliff', .36, .1, .92, color='#c3ccd5'), ground('#aab6c2', '#7d8a98', top=.97, curve=0),
     arka(.48, .28, .24, poses=((0, 'tumble'),), faces=((0, 'scared'),), dy=((0, 0), (d, 420)))],
    [note('h', 'MIRANDA', .5, .09, 56, CREAM, 0, False)] + tag('12 minutes', '#f2b134', int(d * .6))))
# 9-13 the climax building (radiation), cut at the peak
JUP = lambda: [planet('jup', .5, .52, .24, '#d8a76a', ('#c58a4f', '#e8c99a', '#b9773f', '#e8c99a'), seed=4)]
shot('t9', [(N, 'So far, everything that could kill you, you could see coming: a cliff, a jet, the cold. The next part of the solar system is different. Here, the thing that kills you is invisible.')], lambda d: (
    [bg('#07080f')] + [prop('belt', 'radiation-belt', .5, .52, .5, color='#a24bd6')] + JUP(),
    [note('inv', 'invisible', .5, .86, 72, GOLD, int(d * .82))]))
shot('t10', [(N, 'And the closer you get to Jupiter, the faster it clicks.')], lambda d: (
    [bg('#07080f'), prop('belt', 'radiation-belt', .5, .52, .5, color='#a24bd6')] + JUP() + [prop('meter', 'radiation-meter', .84, .78, .26, level=lv((0, .15), (d, .4)))],
    []))
shot('t11', [(N, 'Survival time: about two months, before you\'d absorb a deadly dose.')], lambda d: (
    [bg('#2a2824'), ground('#a39a88', '#6f685a', top=.8, curve=.1), planet('jup', .82, .26, .14, '#d8a76a', ('#c58a4f', '#e8c99a', '#b9773f')),
     prop('meter', 'radiation-meter', .82, .62, .2, level=lv((0, .45), (d, .55))), arka(.48, .8, .4, poses=((0, 'think'),), faces=((0, 'neutral'),))],
    tag('2 months', '#9be07a', 6)))
shot('t12', [(N, 'On the surface, the alarm never stops. Survival time: about one day.')], lambda d: (
    [bg('#0f1a2e'), ground('#eef4fa', '#7fb3d9', top=.8, curve=.1), planet('jup', .8, .25, .16, '#d8a76a', ('#c58a4f', '#e8c99a', '#b9773f')),
     prop('meter', 'radiation-meter', .82, .62, .2, level=lv((0, .7), (d, .82))), arka(.48, .8, .4, poses=((0, 'panic'),), faces=((0, 'scared'),), shiver=2)],
    tag('1 day', '#f2b134', int(d * .55))))
shot('t13', [(N, 'And now, the first locked card.')], lambda d: (
    LOCK(d) + [prop('meter', 'radiation-meter', .5, .66, .16, level=lv((0, .95), (d, 1)))],
    [note('l1', 'DEADLIEST', .32, .82, 64, GOLD), note('l2', 'YOU CAN FLY', .68, .82, 64, GOLD)]), tail=2.2)
shot('t14', [], lambda d: ([bg('#06070c', 1)], [note('t', "HOW YOU'D DIE ON EVERY MOON", .5, .44, 92, CREAM, 8), note('g', 'GAHANARKA', .5, .6, 48, GOLD, 30)]), tail=4.0)


# ------------------------------------------------------------------ audio: Piper per line, then one track with the alarm and a low drone
def synth(path, model, scale, text):
    if not path.exists():
        subprocess.run(['python3', '-m', 'piper', '-m', str(model), '--length-scale', scale, '-f', str(path)], input=text.encode(), check=True, capture_output=True)
    with wave.open(str(path)) as w:
        fr, n, raw = w.getframerate(), w.getnframes(), w.readframes(w.getnframes())
    s = struct.unpack(f'<{n}h', raw)
    if fr != RATE:  # simple linear resample
        s = [s[min(n - 1, int(i * fr / RATE))] for i in range(int(n * RATE / fr))]
    return list(s)


timeline, scenes_frames, cursor = [], [], 0.0
for sid, lines, build, tail in S:
    start = cursor; pos = cursor + .15
    for i, (who, text) in enumerate(lines):
        model, scale = NARR if who == N else ARKA
        samples = synth(JOB / 'seg' / f'{sid}-{i}.wav', model, scale, text)
        timeline.append((pos, samples)); pos += len(samples) / RATE + .25
    dur = max(pos - start - .25 + tail, 1.0)
    frames = math.ceil(dur * FPS); scenes_frames.append(frames); cursor = start + frames / FPS

total = cursor
mix = [0.0] * (int(total * RATE) + RATE)
for at, samples in timeline:
    o = int(at * RATE)
    for i, v in enumerate(samples): mix[o + i] += v * .9
# radiation alarm: clicks from t10 to t13, getting faster; a long tone at the end of t13
starts = [sum(scenes_frames[:i]) / FPS for i in range(len(S))]
idx = {sid: i for i, (sid, *_r) in enumerate(S)}
c0, c1 = starts[idx['t10']], starts[idx['t13']] + scenes_frames[idx['t13']] / FPS - 2.0
t = c0
while t < c1:
    p = (t - c0) / (c1 - c0); gap = .9 * (1 - p) + .07 * p
    o = int(t * RATE)
    for i in range(int(.012 * RATE)): mix[o + i] += 5200 * math.sin(2 * math.pi * 2400 * i / RATE) * math.exp(-i / (.003 * RATE))
    t += gap
for i in range(int(1.8 * RATE)):
    mix[int(c1 * RATE) + i] += 2600 * math.sin(2 * math.pi * 1800 * i / RATE) * min(1, i / 400) * (1 if i < 1.6 * RATE else (1.8 * RATE - i) / (.2 * RATE))
# low drone under the climax (t9..t13), fading in
d0, d1 = starts[idx['t9']], c1 + 1.8
for i in range(int(d0 * RATE), int(d1 * RATE)):
    x = (i / RATE - d0) / (d1 - d0)
    mix[i] += 1300 * min(1, x * 4) * (math.sin(2 * math.pi * 55 * i / RATE) + .5 * math.sin(2 * math.pi * 82.5 * i / RATE))
peak = max(1, max(abs(v) for v in mix))
gain = min(1.0, 30000 / peak)
with wave.open(str(JOB / 'trailer-audio.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
    w.writeframes(struct.pack(f'<{len(mix)}h', *[int(max(-32767, min(32767, v * gain))) for v in mix]))

# ------------------------------------------------------------------ storyboard
src = json.loads((ROOT / 'storyboards/ghost-sun.json').read_text())
template = {k: v for k, v in src['scenes'][4].items() if k not in ('narrationCue', 'sounds')}
groups = [g for g in src['groups'] if g['id'] == 'backdrop']
scenes = []
for i, ((sid, lines, build, tail), frames) in enumerate(zip(S, scenes_frames)):
    layers, notes = build(frames)
    groups.append({'id': f'g-{sid}', 'width': W, 'height': H, 'layers': layers, 'annotations': notes})
    sc = dict(template)
    sc.update({'id': sid, 'durationFrames': frames, 'animationDurationFrames': frames, 'caption': {'text': ' ', 'preset': 'body'},
               'camera': {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': [{'frame': 0, 'focus': {'x': .5, 'y': .52}, 'zoom': 1.1, 'easing': 'smoothstep'}, {'frame': frames, 'focus': {'x': .5, 'y': .52}, 'zoom': 1.06, 'easing': 'smoothstep'}]},
               'seed': 9300 + i, 'transitionFrames': 0, 'config': {'primary': {'asset': f'g-{sid}', 'x': .5, 'y': .5, 'size': .9}}})
    scenes.append(sc)
board = {k: v for k, v in src.items() if k not in ('groups', 'scenes', 'narrationTiming', 'audio')}
board.update({'projectId': 'every-moon-trailer', 'title': 'Every Moon rework: approval trailer', 'assets': [], 'groups': groups, 'scenes': scenes})
(ROOT / 'storyboards/every-moon-trailer.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'scenes': len(scenes), 'seconds': round(total, 1), 'frames': sum(scenes_frames), 'perScene': dict(zip([s[0] for s in S], [round(f / FPS, 1) for f in scenes_frames]))}))
