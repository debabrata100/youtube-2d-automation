"""Blind listening test: copy the same lines read by several voices to A.wav, B.wav... in random order.

Usage: python3 scripts/blind-voice-test.py <out-dir> <label:job-dir> [<label:job-dir> ...]
The answer key goes to jobs/voice-test-key.json (not into the listening folder), so the listener can't see it.
"""
import json, pathlib, random, shutil, sys
out = pathlib.Path(sys.argv[1]).expanduser(); out.mkdir(parents=True, exist_ok=True)
pairs = [a.split(':', 1) for a in sys.argv[2:]]
random.shuffle(pairs)
key = {}
for letter, (label, job) in zip('ABCDEFGH', pairs):
    shutil.copyfile(pathlib.Path(job) / 'audio/narration.wav', out / f'{letter}.wav')
    key[letter] = label
pathlib.Path('jobs/voice-test-key.json').write_text(json.dumps(key, indent=1) + '\n')
print('wrote', ', '.join(f'{l}.wav' for l in key), 'to', out)
