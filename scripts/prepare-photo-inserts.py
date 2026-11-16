"""Frame each NASA photo as a hand-placed print: white border, small credit line, slight tilt and a soft shadow,
centred on a transparent 1920x1080 canvas (layers scale/move it). Offline; reads config/photo-inserts.json.
Usage: python3 scripts/prepare-photo-inserts.py [--only id,id]"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
FONT = ROOT / 'src/engine/style/fonts/PatrickHand-Regular.ttf'
MAX_W, MAX_H, BORDER, CAPTION = 1000, 640, 18, 54

cfg = json.loads((ROOT / 'config/photo-inserts.json').read_text())
only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
out_dir = ROOT / 'assets/nasa/inserts'; out_dir.mkdir(parents=True, exist_ok=True)
for item in cfg['inserts']:
    if only and item['id'] not in only: continue
    src = ROOT / 'assets' / item['source']
    if not src.exists(): sys.exit(f"missing {src}: download it first (see config/photo-inserts.json)")
    credit = item['credit'].replace(':', r'\:').replace("'", '')
    tilt = -1.6 if sum(map(ord, item['id'])) % 2 else 1.4  # deterministic
    graph = (f"[0:v]scale={MAX_W}:{MAX_H}:force_original_aspect_ratio=decrease,format=rgba,"
             f"pad=iw+{2 * BORDER}:ih+{BORDER + CAPTION}:{BORDER}:{BORDER}:color=white,"
             f"drawtext=fontfile={FONT}:text='{credit}':fontsize=30:fontcolor=0x3a3a3a:x=w-tw-{BORDER + 6}:y=h-{CAPTION - 10},"
             f"drawbox=x=0:y=0:w=iw:h=ih:color=0x2b2b2b:t=4,split[card][sh];"
             f"[sh]colorchannelmixer=rr=0:gg=0:bb=0:aa=0.35,boxblur=12[shadow];"
             f"color=c=black@0:s=1920x1080,format=rgba[bg];"
             f"[bg][shadow]overlay=(W-w)/2+14:(H-h)/2+16[b1];[b1][card]overlay=(W-w)/2:(H-h)/2,"
             f"rotate={tilt}*PI/180:c=none:ow=1920:oh=1080[out]")
    dst = out_dir / f"{item['id']}.png"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-filter_complex', graph, '-map', '[out]', '-frames:v', '1', str(dst)], check=True)
    print('wrote', dst.relative_to(ROOT))
