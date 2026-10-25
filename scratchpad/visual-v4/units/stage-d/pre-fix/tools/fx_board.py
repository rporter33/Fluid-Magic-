# Contact boards for the pilot effect sheets: both candidates of a sheet, every cut composited with its own blend on the
# battle ground (plains of battle a, swamp of battle c) at a review scale, and at play zoom (a man of 18, 28 and 48 px,
# art plan 7.1) at each element's planned world size; plus the play-zoom readability measure per element.
# Usage: python3 -I fx_board.py SHEET OUT.png [cand ...]
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fx_layouts import SHEETS  # noqa: E402
WORK = os.path.abspath(os.path.join(HERE, '..'))
GROUND = {'plains': (168, 167, 132), 'swamp': (142, 142, 120), 'dark': (28, 26, 23)}
# planned world size of each element: its width in world units (wu) unless 'h' (height); a man is 28 wu tall
WU = {
    'orbS': 6, 'orbM': 10, 'orbL': 16, 'glow': 60, 'trail': 90, 'meteor': 60,
    'burst1': ('rel', 'burst3', 120), 'burst2': ('rel', 'burst3', 120), 'burst3': 120, 'burst4': ('rel', 'burst3', 120), 'burst5': ('rel', 'burst3', 120), 'burst6': ('rel', 'burst3', 120),
    'ember1': 3, 'ember2': 3, 'ember3': 3, 'ember4': 3, 'spark1': 7, 'spark2': 7, 'spark3': 7, 'spark4': 7, 'lick1': ('h', 6), 'lick2': ('h', 6), 'lick3': ('h', 6), 'lick4': ('h', 6),
    'dot1': 6, 'dot2': 6, 'star1': 7, 'star2': 7,
    'puff1': 24, 'puff2': 24, 'puff3': 24, 'puff4': 24, 'puff5': 24, 'puff6': 24, 'puff7': 24, 'puff8': 24, 'column1': ('h', 60), 'column2': ('h', 60),
    'scorchRing': 120, 'crater': 30, 'scorchDot': 12, 'burnPatch': 40, 'burntTrack': 160,
    'vineStrip': ('h', 5), 'crackThin': ('h', 6), 'crackWide': ('h', 10), 'splitGround': 70, 'rootScar1': 16, 'rootScar2': 16, 'rootScar3': 16,
    'litter': 40, 'flowers1': 14, 'flowers2': 14, 'flowers3': 14,
}
for v in 'ABC':
    for s in range(1, 5): WU[f'thorn{v}{s}'] = ('rel', f'thorn{v}3', 18)
for n in ['coil1', 'coil2', 'coil3', 'wither1', 'wither2', 'wither3']: WU[n] = ('relh', 'coil3', 10)
for i in range(1, 13): WU[f'leaf{i}'] = 3
for i in range(1, 9): WU[f'petal{i}'] = 2


def load_cut(sheet, cand, name):
    p = os.path.join(WORK, 'cut', f'{sheet}.{cand}', name + '.png')
    return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255 if os.path.exists(p) else None


def comp(dst, src, x, y, blend):
    """Composites straight-alpha src onto float rgb dst at (x, y) with the game's blend."""
    h, w = src.shape[:2]
    H, W = dst.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x0 >= x1 or y0 >= y1: return
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]
    d = dst[y0:y1, x0:x1]
    a = s[..., 3:4]
    if blend == 'add': d[:] = np.clip(d + s[..., :3] * a, 0, 1)
    elif blend == 'multiply': d[:] = d * (s[..., :3] * a + 1 - a)
    elif blend == 'luma': d[:] = d * (1 - a * 0.85) + np.array([0.23, 0.21, 0.19]) * s[..., :3] * a * 0.85  # tinted char
    else: d[:] = d * (1 - a) + s[..., :3] * a


def resize(src, w, h):
    w, h = max(1, int(round(w))), max(1, int(round(h)))
    pm = src.copy(); pm[..., :3] *= pm[..., 3:4]
    im = Image.fromarray((pm * 255 + 0.5).astype(np.uint8), 'RGBA').resize((w, h), Image.LANCZOS)
    o = np.asarray(im).astype(np.float32) / 255
    a = o[..., 3:4]
    o[..., :3] = np.where(a > 1e-4, o[..., :3] / np.maximum(a, 1e-4), 0)
    return np.clip(o, 0, 1)


def world_scale(sheet, cand, name, cut):
    """Pixels of the cut per world unit."""
    spec = WU.get(name)
    if spec is None: return None
    if isinstance(spec, tuple):
        if spec[0] == 'h': return cut.shape[0] / spec[1]
        ref = load_cut(sheet, cand, spec[1])
        if ref is None: return None
        return ref.shape[0] / spec[2] if spec[0] == 'relh' else ref.shape[1] / spec[2]
    return cut.shape[1] / spec


def solid_extent(src):
    """The smaller side of the bounding box of pixels with alpha >= 0.5 (or the brightest light, for additive)."""
    m = src[..., 3] >= 0.5
    if not m.any(): return 0
    ys, xs = np.nonzero(m)
    return int(min(xs.max() - xs.min() + 1, ys.max() - ys.min() + 1))


def board(sheet, out, cands):
    S = SHEETS[sheet]
    names = [e['name'] for e in S['els']]
    blend = S['blend']
    font = ImageFont.load_default()
    cols, cw, chh = 6, 230, 210
    rows = (len(names) + cols - 1) // cols
    zooms = [18, 28, 48]
    zh = 130
    Wd = cols * cw
    Ht = len(cands) * (rows * chh + 3 * zh + 40)
    img = np.zeros((Ht, Wd, 3), np.float32) + np.array([0.18, 0.17, 0.15])
    labels = []
    report = {}
    y = 0
    for cand in cands:
        labels.append((10, y + 6, f'{sheet} candidate {cand}: cuts on {"plains" if blend != "luma" else "plains (smoke tinted char)"} at review scale'))
        y += 24
        ground = np.array(GROUND['plains']) / 255
        img[y:y + rows * chh, :] = ground
        report[cand] = {}
        for i, n in enumerate(names):
            cut = load_cut(sheet, cand, n)
            cx, cy = (i % cols) * cw, y + (i // cols) * chh
            if cut is None:
                labels.append((cx + 8, cy + 8, n + ': MISSING')); continue
            sc = min((cw - 16) / cut.shape[1], (chh - 30) / cut.shape[0], 1.0)
            r = resize(cut, cut.shape[1] * sc, cut.shape[0] * sc)
            comp(img, r, int(cx + (cw - r.shape[1]) / 2), int(cy + 18 + (chh - 30 - r.shape[0]) / 2), blend)
            labels.append((cx + 6, cy + 4, n))
            pxwu = world_scale(sheet, cand, n, cut)
            if pxwu:
                ext = {}
                for f in zooms:
                    k = (f / 28) / pxwu
                    rr = resize(cut, cut.shape[1] * k, cut.shape[0] * k)
                    ext[f] = solid_extent(rr)
                report[cand][n] = {'wuW': round(cut.shape[1] / pxwu, 1), 'wuH': round(cut.shape[0] / pxwu, 1), 'solidPx@18': ext[18], 'solidPx@28': ext[28], 'solidPx@48': ext[48]}
        y += rows * chh + 8
        # play zoom strips: every element at its world size on the ground, three zooms
        for f in zooms:
            labels.append((10, y + 2, f'play zoom: a man is {f} px'))
            img[y + 14:y + zh, :] = np.array(GROUND['swamp' if sheet.startswith('L') else 'plains']) / 255
            x = 10
            for n in names:
                cut = load_cut(sheet, cand, n)
                if cut is None: continue
                pxwu = world_scale(sheet, cand, n, cut)
                if not pxwu: continue
                k = (f / 28) / pxwu
                rr = resize(cut, cut.shape[1] * k, cut.shape[0] * k)
                if x + rr.shape[1] > Wd - 10: break
                comp(img, rr, x, y + zh - 8 - rr.shape[0], blend)
                x += rr.shape[1] + 8
            # a man for scale: a dark bar f px tall
            img[y + zh - 8 - f:y + zh - 8, Wd - 18:Wd - 12] = np.array([0.25, 0.12, 0.08])
            y += zh
        y += 8
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for x, yy, t in labels:
        d.text((x + 1, yy + 1), t, fill=(0, 0, 0), font=font); d.text((x, yy), t, fill=(250, 245, 230), font=font)
    im.save(out)
    json.dump(report, open(out.rsplit('.', 1)[0] + '.json', 'w'), indent=1)
    return report


if __name__ == '__main__':
    sheet, out = sys.argv[1], sys.argv[2]
    cands = sys.argv[3:] or ['a', 'b']
    rep = board(sheet, out, cands)
    for c, r in rep.items():
        small = {n: v['solidPx@18'] for n, v in r.items()}
        print(c, small)
