"""Shared kit for free approval trailers (16:9): shot list -> draft voice + licensed music -> storyboard.

Free and offline. Voices are Piper TTS placeholders (not the episode voices); music is a YouTube Audio
Library track from assets/music (see docs/MUSIC_SOURCES.md), ducked under the voice. Each trailer plan
calls shot(...) for every beat, then build(...).

    from trailerkit import *
    shot('t1', [(N, 'A spoken line.')], lambda d: ([bg('#123')], [note('n', 'WORD', .5, .2)]))
    build('m1-trailer', 'Moon Rewind: approval trailer', music='8-space-laniakea.mp3')

Writes storyboards/<name>.json and jobs/<name>/trailer-audio.wav. Then:
    npx tsx scripts/render-storyboard.ts storyboards/<name>.json
    ffmpeg -i <silent.mp4> -i jobs/<name>/trailer-audio.wav -c:v copy -c:a aac -b:a 192k -shortest <out>.mp4
"""
import json, math, os, pathlib, subprocess, wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
VOICES = pathlib.Path(os.environ.get('PIPER_VOICES', '/home/claude/tts/voices'))
FPS, W, H, RATE = 30, 1920, 1080, 22050
N, A = 'N', 'A'
VOICE = {N: ('en-us-ryan-high.onnx', '1.0'), A: ('en-us-lessac-medium.onnx', '1.0')}
CREAM, GOLD, SOFT, INK = '#f4efe2', '#ffd25e', '#cfd8ea', '#1d1a16'


# ------------------------------------------------------------------ layer helpers
def lv(*pairs):
    return [{'frame': int(f), 'value': v} for f, v in pairs]


def prop(pid, item, x, y, size, **k):
    return {'id': pid, 'kit': {'type': 'prop', 'item': item, 'x': x, 'y': y, 'size': size, **k}}


def bg(color):
    return {'id': 'bg', 'kit': {'type': 'terrain', 'top': 0, 'curve': 0, 'fill': color, 'detail': color, 'rocks': 0, 'bumps': 1, 'seed': 1}}


def ground(fill, detail, top=.8, curve=.08, seed=5, gid='ground'):
    return {'id': gid, 'kit': {'type': 'terrain', 'top': top, 'curve': curve, 'fill': fill, 'detail': detail, 'rocks': 4, 'bumps': 6, 'seed': seed}}


def planet(pid, x, y, r, base, bands=(), shade=.25, seed=3, craters=0, ring=False):
    return {'id': pid, 'kit': {'type': 'planet', 'x': x, 'y': y, 'radius': r, 'base': base, 'bands': list(bands), 'craters': craters, 'ring': ring, 'shade': shade, 'seed': seed}}


def earth(pid, x, y, r, **k):
    return planet(pid, x, y, r, '#4f9fe0', ('#6fbf6a', '#4f9fe0', '#6fbf6a', '#4f9fe0'), **k)


def moon(pid, x, y, r, **k):
    return planet(pid, x, y, r, '#cfcabc', ('#b9b4a6',), craters=5, **k)


def glow(gid, x, y, rx, ry, tone='sun'):
    return {'id': gid, 'kit': {'type': 'glow', 'x': x, 'y': y, 'rx': rx, 'ry': ry, 'tone': tone}}


def move(layer, dx=None, dy=None):
    if dx: layer['x'] = [{'frame': int(f), 'value': v, 'ease': 'smoothstep'} for f, v in dx]
    if dy: layer['y'] = [{'frame': int(f), 'value': v, 'ease': 'smoothstep'} for f, v in dy]
    return layer


def arka(x, y, h=.42, poses=((0, 'stand'),), faces=((0, 'neutral'),), acc=(), dx=None, dy=None, shiver=0, facing='right', outfit='astronaut', pid='arka'):
    k = {'type': 'figure', 'x': x, 'y': y, 'height': h, 'outfit': outfit, 'shiver': shiver, 'seed': 11, 'facing': facing,
         'poses': [{'frame': int(f), 'pose': p} for f, p in poses], 'faces': [{'frame': int(f), 'face': fc} for f, fc in faces]}
    if outfit == 'astronaut': k.update({'suit': '#e8b84a', 'visor': '#ffe6a3'})
    if acc: k['accessories'] = [{'item': a, 'from': 0} for a in acc]
    return move({'id': pid, 'kit': k}, dx, dy)


def person(pid, x, y, h=.4, poses=((0, 'stand'),), faces=((0, 'neutral'),), facing='right', dx=None, dy=None, suit=None):
    """A real person in the story (never Arka): a stick figure, or a white-suited astronaut when suit is given."""
    layer = arka(x, y, h, poses, faces, facing=facing, outfit='astronaut' if suit else 'stick', pid=pid, dx=dx, dy=dy)
    if suit: layer['kit'].update({'suit': suit, 'visor': '#cfe3f5'})
    return layer


def note(nid, text, x, y, size=76, color=CREAM, at=0, pop=True):
    n = {'id': nid, 'text': text, 'x': round(x * W), 'y': round(y * H), 'size': size, 'anchor': 'middle', 'variant': 'ink', 'color': color, 'pop': pop}
    if at: n['opacity'] = [{'frame': 0, 'value': 0}, {'frame': int(at), 'value': 0}, {'frame': int(at) + 6, 'value': 1}]
    return n


def header(text, color=CREAM):
    return note('hdr', text, .5, .09, 60, color, 0, False)


def source(text, at=0):
    """Small hand-written source tag, bottom right (honesty: every big claim shows where it comes from)."""
    return note('src', text, .8, .93, 38, SOFT, at, False)


# ------------------------------------------------------------------ shots
S = []


def shot(sid, lines, build_fn, tail=.35, zoom=(1.1, 1.05), focus=(.5, .52)):
    S.append((sid, lines, build_fn, tail, zoom, focus))


def title_card(sid, title, subtitle='GAHANARKA', bgc='#06070c', hold=4.5):
    shot(sid, [], lambda d: ([bg(bgc)], [note('t', title, .5, .44, 84, CREAM, 8), note('g', subtitle, .5, .6, 46, GOLD, 30),
                                         note('d', 'draft trailer · placeholder voices', .5, .93, 34, SOFT, 0, False)]), tail=hold, zoom=(1, 1))


# ------------------------------------------------------------------ audio
TAKES = {}


def use_take(who, wav, meta):
    """Register an already-paid real take (e.g. Arka E3): lines found in it word for word are cut from it, free."""
    TAKES[who] = (pathlib.Path(wav), json.loads(pathlib.Path(meta).read_text()))


def from_take(who, text):
    if who not in TAKES: return None
    wav, meta = TAKES[who]
    i = meta['text'].find(text)
    if i < 0: return None
    al = meta['alignment']
    t0 = max(0, al['character_start_times_seconds'][i] - .04)
    t1 = al['character_end_times_seconds'][i + len(text) - 1] + .12
    with wave.open(str(wav)) as w:
        fr = w.getframerate(); w.setpos(int(t0 * fr)); raw = w.readframes(int((t1 - t0) * fr))
    s = np.frombuffer(raw, dtype='<i2').astype(np.float32)
    s = np.interp(np.arange(0, len(s), fr / RATE), np.arange(len(s)), s).astype(np.float32)
    f = int(.02 * RATE); s[:f] *= np.linspace(0, 1, f); s[-f:] *= np.linspace(1, 0, f)
    return s * .92  # level-matched to the Piper narrator (measured RMS, 23 Nov)


def synth(path, who, text):
    real = from_take(who, text)
    if real is not None: return real
    model, scale = VOICE[who]
    said = path.with_suffix('.txt')
    key = f'{model}|{scale}|{text}'
    if not (path.exists() and said.exists() and said.read_text() == key):
        subprocess.run(['python3', '-m', 'piper', '-m', str(VOICES / model), '--length-scale', scale, '--sentence-silence', '.25', '-f', str(path)],
                       input=text.encode(), check=True, capture_output=True)
        said.write_text(key)
    with wave.open(str(path)) as w:
        fr, raw = w.getframerate(), w.readframes(w.getnframes())
    s = np.frombuffer(raw, dtype='<i2').astype(np.float32)
    if fr != RATE:
        s = np.interp(np.arange(0, len(s), fr / RATE), np.arange(len(s)), s).astype(np.float32)
    return s


def music_track(name, seconds, start=0.0):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-i', str(ROOT / 'assets/music' / name), '-ac', '1', '-ar', str(RATE), '-f', 's16le', '-'],
                         check=True, capture_output=True).stdout
    m = np.frombuffer(raw, dtype='<i2').astype(np.float32)
    n = int(seconds * RATE)
    while len(m) < n: m = np.concatenate([m, m])
    return m[:n]


def build(name, title, music, music_start=0.0, music_db=-17, dropouts=()):
    """dropouts: shot ids where the music cuts out for impact (it returns on the next shot)."""
    job = ROOT / 'jobs' / name; (job / 'seg').mkdir(parents=True, exist_ok=True)
    voice, frames_list, cursor = [], [], 0.0
    for sid, lines, fn, tail, *_ in S:
        start = cursor; pos = cursor + .2
        for i, (who, text) in enumerate(lines):
            seg = synth(job / 'seg' / f'{sid}-{i}.wav', who, text)
            voice.append((pos, seg)); pos += len(seg) / RATE + .3
        dur = max(pos - start - .3 + tail, 1.0)
        frames = math.ceil(dur * FPS); frames_list.append(frames); cursor = start + frames / FPS
    total = cursor
    n = int(total * RATE) + RATE
    vo = np.zeros(n, np.float32)
    for at, seg in voice:
        o = int(at * RATE); vo[o:o + len(seg)] += seg
    vo *= 22000 / max(1, np.abs(vo).max())
    # music: ducked under speech (smoothed envelope), fade in/out, dropouts on chosen shots
    mus = music_track(music, n / RATE, music_start)
    mus *= (10 ** (music_db / 20)) * 32767 / max(1, np.sqrt(np.mean(mus ** 2)) * 3.2)
    env = np.convolve((np.abs(vo) > 600).astype(np.float32), np.ones(int(.25 * RATE)) / int(.25 * RATE), 'same')
    duck = 1 - .55 * np.clip(env * 3, 0, 1)
    starts = np.cumsum([0] + frames_list) / FPS
    gate = np.ones(n, np.float32)
    ids = [s[0] for s in S]
    for sid in dropouts:
        i = ids.index(sid); a, b = int(starts[i] * RATE), int(starts[i + 1] * RATE)
        ramp = int(.3 * RATE)
        gate[a:b] = 0; gate[max(0, a - ramp):a] = np.linspace(1, 0, min(ramp, a))
    fade = np.ones(n, np.float32); fi, fo = int(1.5 * RATE), int(3 * RATE)
    fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
    mix = vo + mus * duck * gate * fade
    mix *= min(1.0, 30000 / max(1, np.abs(mix).max()))
    with wave.open(str(job / 'trailer-audio.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(mix.astype('<i2').tobytes())
    # storyboard (same scene template as the Every Moon trailer)
    src = json.loads((ROOT / 'storyboards/ghost-sun.json').read_text())
    template = {k: v for k, v in src['scenes'][4].items() if k not in ('narrationCue', 'sounds')}
    groups = [g for g in src['groups'] if g['id'] == 'backdrop']
    scenes = []
    for i, ((sid, lines, fn, tail, zoom, focus), frames) in enumerate(zip(S, frames_list)):
        layers, notes = fn(frames)
        assert sum(1 for l in layers if l['kit'].get('type') == 'prop') <= 40
        groups.append({'id': f'g-{sid}', 'width': W, 'height': H, 'layers': layers, 'annotations': notes})
        sc = dict(template)
        sc.update({'id': sid, 'durationFrames': frames, 'animationDurationFrames': frames, 'caption': {'text': ' ', 'preset': 'body'},
                   'camera': {'preset': 'static', 'boundaryMode': 'backdrop', 'keyframes': [
                       {'frame': 0, 'focus': {'x': focus[0], 'y': focus[1]}, 'zoom': zoom[0], 'easing': 'smoothstep'},
                       {'frame': frames, 'focus': {'x': focus[0], 'y': focus[1]}, 'zoom': zoom[1], 'easing': 'smoothstep'}]},
                   'seed': 9500 + i, 'transitionFrames': 0, 'config': {'primary': {'asset': f'g-{sid}', 'x': .5, 'y': .5, 'size': .9}}})
        scenes.append(sc)
    board = {k: v for k, v in src.items() if k not in ('groups', 'scenes', 'narrationTiming', 'audio')}
    board.update({'projectId': name, 'title': title, 'assets': [], 'groups': groups, 'scenes': scenes})
    (ROOT / 'storyboards' / f'{name}.json').write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    words = sum(len(t.split()) for _, ls, *_ in S for _, t in ls)
    print(json.dumps({'trailer': name, 'scenes': len(scenes), 'seconds': round(total, 1), 'words': words,
                      'perScene': {sid: round(f / FPS, 1) for (sid, *_), f in zip(S, frames_list)}}))
