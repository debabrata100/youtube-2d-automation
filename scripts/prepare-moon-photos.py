"""Turn public-domain NASA photos into full-frame 9:16 photo layers for the Moon Shorts (26 Nov 2026).

Every output is a transparent PNG at twice the Shorts frame (2160x3840), so a layer can zoom in to 2x and keep full detail.
The subject is cut out (discs) or faded into transparent space at the edges (eclipse photos), so the kit's star sky shows
around it. Offline and deterministic. Sources live in assets/nasa/ (downloaded by Debabrata, not committed).

Usage: python3 scripts/prepare-moon-photos.py [--only id,id]
"""
import pathlib, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC, OUT = ROOT / 'assets/nasa', ROOT / 'assets/nasa/moon-photos'
CW, CH = 2160, 3840                       # 2x the 1080x1920 Shorts frame
Image.MAX_IMAGE_PIXELS = None


def load(*patterns):
    """First file in assets/nasa/ matching any pattern (browsers rename downloads, so match loosely)."""
    hits = [p for pat in patterns for p in sorted(SRC.glob(pat))]
    if not hits: sys.exit(f'missing {patterns[0]} in {SRC}: save it from NASA first (see stories/moon-shorts-script.md, photo list)')
    p = hits[0]
    im = Image.open(p)
    if im.mode in ('I;16', 'I;16B', 'I'): im = Image.fromarray((np.asarray(im, dtype=np.float32) / 256).clip(0, 255).astype(np.uint8))
    return im.convert('RGB')


def disc_box(im, thresh=28):
    """Bounding square of the bright disc on a black background."""
    a = np.asarray(im.convert('L')) > thresh
    ys, xs = np.where(a)
    x0, x1, y0, y1 = np.percentile(xs, .2), np.percentile(xs, 99.8), np.percentile(ys, .2), np.percentile(ys, 99.8)
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) / 2
    return cx, cy, r


def disc(im, diameter, center, feather=3, box=None):
    cx, cy, r = box or disc_box(im)
    crop = im.crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r))).resize((diameter, diameter), Image.LANCZOS)
    yy, xx = np.mgrid[0:diameter, 0:diameter]
    d = np.hypot(xx - (diameter - 1) / 2, yy - (diameter - 1) / 2)
    alpha = np.clip((diameter / 2 - d) / feather, 0, 1)
    out = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    tile = crop.convert('RGBA'); tile.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
    out.alpha_composite(tile, (int(center[0] - diameter / 2), int(center[1] - diameter / 2)))
    return out


def sphere(img, strength=.35):
    """Gentle limb darkening so a flat-lit mosaic reads as a ball."""
    a = np.asarray(img).astype(np.float32)
    al = a[..., 3] > 0
    ys, xs = np.where(al); cx, cy, r = xs.mean(), ys.mean(), (xs.max() - xs.min()) / 2
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]].astype(np.float32)
    mu = np.sqrt(np.clip(1 - ((xx - cx) ** 2 + (yy - cy) ** 2) / r ** 2, 0, 1))
    a[..., :3] *= (1 - strength + strength * mu ** .5)[..., None]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def molten(img):
    """The young Moon: a dark, cracked crust with the low basins (today's dark maria) glowing as lava."""
    rgba = np.asarray(img).astype(np.float32)
    l = rgba[..., :3].mean(axis=2) / 255
    smooth = np.asarray(Image.fromarray((l * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255
    detail = np.clip(.5 + (l - smooth) * 3, 0, 1)                    # crater rims and cracks
    t = np.clip((.36 - smooth) / .16, 0, 1) ** 1.3                   # dark basins -> hottest
    stops = np.array([[62, 20, 12], [104, 30, 12], [176, 50, 12], [245, 112, 24], [255, 190, 80]], np.float32)
    pos = t * (len(stops) - 1); i = np.clip(pos.astype(int), 0, len(stops) - 2); f = (pos - i)[..., None]
    col = stops[i] * (1 - f) + stops[i + 1] * f
    rgb = col * (.55 + .9 * detail[..., None])
    return Image.fromarray(np.dstack([rgb.clip(0, 255), rgba[..., 3]]).astype(np.uint8), 'RGBA')


def spot(im, ring_frac, out_w=CW, center_y=None, fade=.16, thresh=200):
    """Eclipse photo: centre on the bright ring, scale so the ring spans ring_frac of the frame width, fade edges to clear."""
    a = np.asarray(im.convert('L')).astype(np.float32)
    ys, xs = np.where(a > thresh)
    cx, cy = np.median(xs), np.median(ys)
    ring = max(np.percentile(xs, 99) - np.percentile(xs, 1), np.percentile(ys, 99) - np.percentile(ys, 1))
    k = ring_frac * out_w / ring
    big = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS).convert('RGBA')
    cy_out = center_y if center_y is not None else CH * .42
    ox, oy = int(CW / 2 - cx * k), int(cy_out - cy * k)
    canvas = Image.new('RGBA', (CW, CH), (0, 0, 0, 0)); canvas.paste(big, (ox, oy))
    # fade: radial falloff around the ring plus the photo's own edges
    yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    d = np.hypot(xx - CW / 2, (yy - cy_out)) / (CW * .5)
    radial = np.clip((1.0 - d) / .45, 0, 1)
    edge = np.zeros((CH, CW), np.float32)
    x0, y0, x1, y1 = max(ox, 0), max(oy, 0), min(ox + big.width, CW), min(oy + big.height, CH)
    edge[y0:y1, x0:x1] = 1
    edge = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(CW * fade / 3))).astype(np.float32) / 255
    al = np.asarray(canvas)[..., 3].astype(np.float32) / 255 * np.minimum(radial, edge)
    # darkness carries no information: let the sky show through the photo's black
    al *= key_black(canvas, big)
    canvas.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
    return canvas


def key_black(canvas, photo):
    """Alpha from brightness above the photo's own sky level, so its grey-black sky never shows as a dark rectangle."""
    sky = np.percentile(np.asarray(photo.convert('L')), 40) / 255
    lum = np.asarray(canvas.convert('L')).astype(np.float32) / 255
    return np.clip((lum - sky - .015) / .12, 0, 1) ** .7


def bloom(img, radius=28, gain=1.6):
    """Soft light spill around bright parts (a thin eclipse ring reads as blazing, not as a drawn line)."""
    a = np.asarray(img).astype(np.float32)
    rgb, al = a[..., :3] * (a[..., 3:] / 255), a[..., 3]
    glow = np.zeros_like(rgb)
    for r, g in ((radius, .6), (radius * 3, .4)):
        glow += np.asarray(Image.fromarray(rgb.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) * g
    out = rgb + glow * gain
    lum = out.max(axis=2)
    alpha = np.clip(np.maximum(al / 255, lum / 255 * 1.4), 0, 1)
    col = out / np.maximum(alpha[..., None], 1e-3)
    return Image.fromarray(np.dstack([col.clip(0, 255), alpha * 255]).astype(np.uint8), 'RGBA')


def full(im, center_y=None, fade=.12):
    """Whole photo fitted to the frame width, edges faded to clear (for Earth-and-Moon pictures)."""
    k = CW / im.width
    big = im.resize((CW, int(im.height * k)), Image.LANCZOS).convert('RGBA')
    cy = center_y if center_y is not None else CH * .42
    oy = int(cy - big.height / 2)
    canvas = Image.new('RGBA', (CW, CH), (0, 0, 0, 0)); canvas.paste(big, (0, oy))
    edge = np.zeros((CH, CW), np.float32); edge[max(oy, 0):min(oy + big.height, CH), :] = 1
    edge = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(CW * fade / 3))).astype(np.float32) / 255
    al = edge * key_black(canvas, big)
    canvas.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
    return canvas


def space(seed=7):
    """Deep black sky with fine, realistic stars (not the kit's sparkles), so photos sit in real space."""
    rng = np.random.default_rng(seed)
    img = np.zeros((CH, CW, 3), np.float32); img[...] = (3, 4, 10)
    yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    band = np.exp(-((xx * .55 + yy * .35 - CW * 1.3) / (CW * .28)) ** 2)            # faint diagonal Milky Way haze
    img += band[..., None] * np.array([10, 10, 16], np.float32)
    for _ in range(2600):
        x, y = rng.uniform(0, CW), rng.uniform(0, CH); b = rng.random() ** 4
        r = .8 + b * 2.2; col = np.array([255, 245, 230] if rng.random() < .7 else [210, 225, 255], np.float32) * (.25 + .75 * b)
        x0, x1, y0, y1 = int(max(x - 4, 0)), int(min(x + 5, CW)), int(max(y - 4, 0)), int(min(y + 5, CH))
        d = np.hypot(xx[y0:y1, x0:x1] - x, yy[y0:y1, x0:x1] - y)
        img[y0:y1, x0:x1] += np.exp(-(d / r) ** 2)[..., None] * col
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')
    return out


def sun_disc(diameter, center):
    """A white-hot Sun with limb darkening and a soft glow, drawn (not photographed) to match the photos."""
    yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    d = np.hypot(xx - center[0], yy - center[1]) / (diameter / 2)
    mu = np.sqrt(np.clip(1 - d ** 2, 0, 1))
    limb = .45 + .55 * mu ** .6
    disc = np.clip((1 - d) * diameter / 3, 0, 1)
    glow = np.exp(-np.clip(d - 1, 0, None) * 1.5) * .5 + np.exp(-np.clip(d - 1, 0, None) * 9) * .5
    col = np.array([255, 246, 222], np.float32)[None, None] * limb[..., None]
    gcol = np.array([255, 196, 96], np.float32)
    rgb = col * disc[..., None] + gcol * (1 - disc[..., None])
    a = np.maximum(disc, glow * (d > 1))
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8), 'RGBA')


# Frame-space layout (1080x1920 units; doubled on the canvas). Everything sits above the Shorts interface (y < 1500).
MOON_D, MOON_Y = 1000, 780                 # moon disc at scale 1: 1000 px wide, centred at y 780
EARTH_D, EARTH_Y = 1000, 780
LIMB_D, LIMB_TOP = 2600, 1180
EARTH_TURN = 0                             # degrees; set after seeing the downloaded Blue Marble              # Earth's curved edge along the bottom: top of the arc at y 1180

SUN_D = 300                                # the Sun at scale 1: 300 px wide, centred at MOON_Y (the Moon at scale .31 covers it)
def moon_src():
    """LRO WAC near side (PIA14011, smooth); the SVS 1,231-tile mosaic shows its patchwork up close, so it is only a fallback.
    The WAC mosaic is shot at low phase and prints dark: stretch it to a bright full-Moon grey."""
    im = load('PIA14011*', 'moon_mosaic*')
    a = np.asarray(im.convert('L')).astype(np.float32)
    lo, hi = np.percentile(a[a > 20], 1), np.percentile(a[a > 20], 99.7)
    a = np.clip((a - lo) / (hi - lo), 0, 1) ** .72 * 250
    a[np.asarray(im.convert('L')) <= 20] = 0
    g = Image.fromarray(a.astype(np.uint8))
    return Image.merge('RGB', (g, g.point(lambda v: v * .985), g.point(lambda v: v * .955)))   # a touch warm, like moonlight on camera


JOBS = {
    'space':       lambda: space(),
    'sun':         lambda: sun_disc(SUN_D * 2, (CW / 2, MOON_Y * 2)),
    'moon':        lambda: sphere(disc(moon_src(), MOON_D * 2, (CW / 2, MOON_Y * 2))),
    'moon-molten': lambda: bloom(sphere(molten(disc(moon_src(), MOON_D * 2, (CW / 2, MOON_Y * 2))), .5), radius=24, gain=.35),
    'earth':       lambda: disc(load('as17-148-22727*').rotate(EARTH_TURN), EARTH_D * 2, (CW / 2, EARTH_Y * 2)),
    'earth-limb':  lambda: disc(load('as17-148-22727*').rotate(EARTH_TURN), LIMB_D * 2, (CW / 2, (LIMB_TOP + LIMB_D / 2) * 2), feather=6),
    'eclipse-total':   lambda: spot(load('nasa-eclipse-2017-madras*', 'eclipse2017*'), .5),
    'eclipse-annular': lambda: bloom(spot(load('14450_00[23]*', '14450_*'), .52)),
    'earth-moon':  lambda: full(load('*DSCOVR*', '*dscovr*', 'ap150807*', '*FullMoonFullEarth*', 'epic*moon*', 'globe_epc*')),
}

if __name__ == '__main__':
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    for name, job in JOBS.items():
        if only and name not in only: continue
        job().save(OUT / f'{name}.png', optimize=False, compress_level=6)
        print('wrote', (OUT / f'{name}.png').relative_to(ROOT))
