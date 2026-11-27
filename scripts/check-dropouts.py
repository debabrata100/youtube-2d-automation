"""Find single-frame dropouts in a rendered video (a character or layer that vanishes for a frame or a few, then returns).

A dropout frame differs from the frames around it while those frames match each other. Motion and the ink boil make
whole-frame differences noisy, so pass the region where the subject is (--crop in source pixels: x,y,w,h).

  python3 scripts/check-dropouts.py <video.mp4> [--crop 380,800,320,520] [--until 1000]
Exit code 1 when dropouts are found. Needs ffmpeg and numpy; free and local.
"""
import argparse, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--crop', default=None); ap.add_argument('--until', type=int, default=None)
ap.add_argument('--ratio', type=float, default=3.0, help='how much more a dropout differs from its neighbours than they differ from each other')
o = ap.parse_args()
crop = [int(v) for v in o.crop.split(',')] if o.crop else None
vf = (f'crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]},' if crop else '') + 'scale=160:-2,format=gray'
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', o.video], capture_output=True, text=True).stdout.strip()
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', o.video, '-vf', vf, '-f', 'rawvideo', '-'], capture_output=True).stdout
w = 160
cw, ch = (crop[2], crop[3]) if crop else map(int, probe.split(','))
flat = np.frombuffer(raw, np.uint8)
h = next(hh for hh in (int(ch * w / cw) // 2 * 2, int(ch * w / cw) // 2 * 2 + 2) if flat.size % (hh * w) == 0)
a = flat.reshape(-1, h, w).astype(np.int16)
if o.until: a = a[:o.until]
d = lambda i, j: float(np.abs(a[i] - a[j]).mean())
bad = []
for i in range(1, len(a) - 1):
    # neighbours one and two frames away, so two-frame dropouts are caught too
    for k in (1, 2):
        if i - k < 0 or i + k >= len(a): continue
        around = d(i - k, i + k)
        mine = min(d(i, i - k), d(i, i + k))
        if mine > 2.0 and mine > o.ratio * around + .5:
            bad.append((i, round(mine, 1), round(around, 1))); break
print({'frames': len(a), 'dropouts': [b[0] for b in bad], 'detail': bad[:60]})
sys.exit(1 if bad else 0)
