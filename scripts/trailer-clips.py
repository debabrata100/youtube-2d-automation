"""Drop real episode clips into the trailer's question shots (free, local ffmpeg).

The trailer storyboard (scripts/authoring/plan-trailer.py) leaves an empty "screen" in shots t1-t4. After the
render, this script cuts a short, muted clip from each episode's final render and places it in that screen, timed
to the shot, with a thin gold frame. The trailer's own audio (narration + music) is kept as is.

Usage: python3 scripts/trailer-clips.py jobs/<trailer-job>
Output: jobs/<trailer-job>/output/channel-trailer.mp4

To refresh the trailer later: change a question line in plan-trailer.py, re-record only that line, and point its
entry in CLIPS at the new episode's render and moment.
"""
import json, pathlib, subprocess, sys

SCREEN = (384, 300, 1152, 648)   # x, y, width, height: must match SCREEN in plan-trailer.py
GOLD = '0xe8b84a'
CLIPS = {  # scene id: (episode render, start second in that render)
    'tr-t1': ('jobs/mg-final-b/output/narrated-animation.mp4', 0.8),     # Ep 4: the Moon vanishes over the town
    'tr-t2': ('jobs/m3-3-final/output/narrated-animation.mp4', 38.0),    # Ep 1: flying on Titan
    'tr-t3': ('jobs/m3-5-final/output/narrated-animation.mp4', 2.0),     # Ep 2: "no helmet!" + 15 s countdown
    'tr-t4': ('jobs/m3-7-final-e/output/narrated-animation.mp4', 151.0), # Ep 3: off Miranda's 20 km cliff
}

job = pathlib.Path(sys.argv[1])
board = json.loads((job / 'storyboard.json').read_text())
fps = board['format']['fps']
windows, t = {}, 0
for sc in board['scenes']:
    windows[sc['id']] = (t / fps, (t + sc['durationFrames']) / fps); t += sc['durationFrames']

x, y, w, h = SCREEN
inputs, filters, last = ['-i', str(job / 'output/narrated-animation.mp4')], [], '0:v'
for i, (sid, (src, at)) in enumerate(CLIPS.items(), start=1):
    a, b = windows[sid]
    inputs += ['-ss', f'{at:.3f}', '-t', f'{b - a:.3f}', '-i', src]
    filters.append(f'[{i}:v]scale={w}:{h},setpts=PTS-STARTPTS+{a:.3f}/TB[c{i}]')
    filters.append(f"[{last}]drawbox=x={x - 8}:y={y - 8}:w={w + 16}:h={h + 16}:color={GOLD}:t=8:enable='between(t,{a:.3f},{b:.3f})'[f{i}]")
    filters.append(f"[f{i}][c{i}]overlay=x={x}:y={y}:eof_action=pass:enable='between(t,{a:.3f},{b:.3f})'[v{i}]")
    last = f'v{i}'
out = job / 'output/channel-trailer.mp4'
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filters), '-map', f'[{last}]', '-map', '0:a',
       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', str(out)]
subprocess.run(cmd, check=True)
print(json.dumps({'output': str(out), 'clips': {k: [round(v, 2) for v in windows[k]] for k in CLIPS}}))
