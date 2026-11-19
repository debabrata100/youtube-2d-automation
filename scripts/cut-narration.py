"""Build a Short's narration from approved, already-paid narration: no network, no cost.

Cuts exact text spans out of one or more cached narration takes (audio/narration.wav + audio/narration-metadata.json,
with ElevenLabs character timing), joins them with short pauses and writes a new narration.wav + narration-metadata.json
whose text and character timing match the Short's story script, so `story:render-cached` accepts it.

Spec (JSON, written by the Short's plan script):
  {"id": "...", "segments": [{"source": "jobs/mg-narration-b", "text": "exact text", "gapAfter": 0.35}, ...]}

Usage: python3 scripts/cut-narration.py <spec.json> <new-output-dir>
The output directory must not exist (an approved cut is never overwritten).
"""
import hashlib, json, pathlib, sys, wave

RATE = 24000
LEAD, TAIL = 0.05, 0.18      # seconds kept before the first and after the last character of each span
DEFAULT_GAP = 0.35           # silence between spans


def load(source):
    d = pathlib.Path(source) / 'audio'
    meta = json.loads((d / 'narration-metadata.json').read_text())
    with wave.open(str(d / 'narration.wav'), 'rb') as w:
        assert (w.getframerate(), w.getnchannels(), w.getsampwidth()) == (RATE, 1, 2), f'{source}: expected 24 kHz mono 16-bit'
        pcm = w.readframes(w.getnframes())
    if hashlib.sha256((d / 'narration.wav').read_bytes()).hexdigest() != meta['sha256']:
        raise SystemExit(f'{source}: audio does not match its metadata hash')
    a = meta['alignment']
    if ''.join(a['characters']) != meta['text']:
        raise SystemExit(f'{source}: alignment does not match its text')
    return meta, pcm


def main(spec_path, out_dir):
    spec = json.loads(pathlib.Path(spec_path).read_text())
    out = pathlib.Path(out_dir)
    if out.exists(): raise SystemExit(f'{out} already exists; use a new directory')
    cache, pcm_out, chars, starts, ends, used = {}, bytearray(), [], [], [], []
    t = 0.0
    for i, seg in enumerate(spec['segments']):
        src = seg['source']
        if src not in cache: cache[src] = load(src)
        meta, pcm = cache[src]
        text, a = seg['text'], meta['alignment']
        hits = [k for k in range(len(meta['text'])) if meta['text'].startswith(text, k)]
        occ = seg.get('occurrence', 0)
        if not hits: raise SystemExit(f'segment {i}: text not found in {src}: {text!r}')
        if len(hits) > 1 and 'occurrence' not in seg: raise SystemExit(f'segment {i}: text appears {len(hits)} times in {src}; set "occurrence"')
        k0 = hits[occ]; k1 = k0 + len(text) - 1
        s0, s1 = a['character_start_times_seconds'][k0], a['character_end_times_seconds'][k1]
        prev_end = a['character_end_times_seconds'][k0 - 1] if k0 > 0 else 0.0
        next_start = a['character_start_times_seconds'][k1 + 1] if k1 + 1 < len(a['characters']) else meta['measured']['durationSeconds']
        c0 = max(prev_end, s0 - LEAD) if k0 > 0 else max(0.0, s0 - LEAD)
        c1 = min(next_start, s1 + TAIL)
        b0, b1 = round(c0 * RATE) * 2, round(c1 * RATE) * 2
        if chars:  # the space that joins this span to the previous one sits inside the pause
            chars.append(' '); starts.append(round(t - 0.01, 3)); ends.append(round(t, 3))
        shift = t - c0
        for k in range(k0, k1 + 1):
            chars.append(a['characters'][k])
            starts.append(round(a['character_start_times_seconds'][k] + shift, 3)); ends.append(round(a['character_end_times_seconds'][k] + shift, 3))
        pcm_out += pcm[b0:b1]
        t += (b1 - b0) / 2 / RATE
        used.append({'source': src, 'text': text, 'fromSeconds': round(c0, 3), 'toSeconds': round(c1, 3), 'requestKey': meta['key']})
        if i < len(spec['segments']) - 1:
            gap = seg.get('gapAfter', DEFAULT_GAP); n = round(gap * RATE)
            pcm_out += b'\x00\x00' * n; t += n / RATE
    out.mkdir(parents=True); (out / 'audio').mkdir()
    wav_path = out / 'audio/narration.wav'
    with wave.open(str(wav_path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(bytes(pcm_out))
    data = wav_path.read_bytes(); text = ''.join(chars)
    first = next(iter(cache.values()))[0]
    meta = {'key': hashlib.sha256(json.dumps(spec, sort_keys=True).encode()).hexdigest(), 'sha256': hashlib.sha256(data).hexdigest(),
            'provider': first['provider'], 'model': first['model'], 'voice': first['voice'], 'syntheticTestAudio': False,
            'multiVoice': any(m.get('multiVoice') for m, _ in cache.values()),
            'measured': {'durationSeconds': round(len(pcm_out) / 2 / RATE, 6), 'sampleRate': RATE, 'channels': 1, 'codec': 'pcm_s16le'},
            'audioPath': str(wav_path.resolve()), 'sourceAudio': str(wav_path.resolve()), 'text': text, 'characters': len(text),
            'paidRequestsThisExecution': 0, 'speedAdjustment': 1, 'cutFromApprovedNarration': used,
            'alignment': {'characters': chars, 'character_start_times_seconds': starts, 'character_end_times_seconds': ends}}
    (out / 'audio/narration-metadata.json').write_text(json.dumps(meta, indent=1) + '\n')
    print(json.dumps({'output': str(out), 'seconds': meta['measured']['durationSeconds'], 'segments': len(used), 'characters': len(text), 'paidRequests': 0}))


if __name__ == '__main__':
    if len(sys.argv) != 3: raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
