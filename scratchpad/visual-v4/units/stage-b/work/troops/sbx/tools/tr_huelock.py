# Stage B troops: the production cloth hue lock (review change 9, calibration part 2). For Thornwood the side's cloth is
# selected by:
#   band A: OKLCH hue in [90, 230] (set from the approved Warden sheet: the valley between the warm browns and the cloth
#           is at 90; the top covers the teal an edit overshoots to) at chroma >= 0.02 (soft to 0.04);
#   (for banners both fade out above OKLab L 0.68: pale sigils are not cloth)
#   band B: hue within 25 degrees of the nation's cloth hue at chroma >= 0.015 (soft to 0.025): cloth painted at the
#           right hue but too grey;
# opened by 3 px so specks stay; the selection takes the nation's cloth hue, its chroma held in [0.6, 1.0] x the
# cloth's; the painted lightness and strokes stay. Cinder needs no lock (its cloth sits on its hue); independents wear
# undyed grey and are not locked.
# Usage: python3 tr_huelock.py NATION IN_DIR OUT_DIR   (every .png; .json copied) or as a module: lock(rgba, nation)
import os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import oklch, to_oklab  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402

RULES = {'thornwood': dict(cloth='#1F6A50', lo=90.0, hi=230.0, floor=0.02, band=25.0, open_px=3)}


def mask(rgba, r, pale_fade=False):
    hx = np.array([[[int(r['cloth'][i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)
    _, cc, ch = oklch(hx)
    _, C, h = oklch(rgba[..., :3])
    wa = ((h >= r['lo']) & (h <= r['hi'])) * np.clip((C - r['floor']) / 0.02, 0, 1)
    dh = np.abs((h - float(ch[0, 0]) + 180) % 360 - 180)
    wb = (dh <= r['band']) * np.clip((C - 0.015) / 0.01, 0, 1)
    w = np.maximum(wa, wb) * (rgba[..., 3] > 128)
    if pale_fade:
        # banners: a pale sigil is never cloth; the lock fades out from OKLab L 0.68 to 0.76 (on the Thornwood banner the
        # leaf's faint green shading turned cyan). Troops keep the calibration's rule (0.3% of their locked pixels are
        # that light; the Warden's blossom sigil reads unchanged)
        L = to_oklab(rgba[..., :3])[..., 0]
        w = w * np.clip((0.76 - L) / 0.08, 0, 1)
    k = 2 * r['open_px'] + 1
    m = Image.fromarray((w * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))
    return np.minimum(w, np.asarray(m).astype(np.float64) / 255), float(cc[0, 0]), float(ch[0, 0])


def lock(rgba, nation, pale_fade=False):
    if nation not in RULES:
        return rgba, 0.0
    w, cc, ch = mask(rgba, RULES[nation], pale_fade)
    lab = to_oklab(rgba[..., :3])
    Cn = np.hypot(lab[..., 1], lab[..., 2])
    newC = np.clip(Cn, 0.6 * cc, 1.0 * cc)
    hc = np.radians(ch)
    lab2 = np.dstack([lab[..., 0], lab[..., 1] + w * (newC * np.cos(hc) - lab[..., 1]), lab[..., 2] + w * (newC * np.sin(hc) - lab[..., 2])])
    out = rgba.copy(); out[..., :3] = oklab_to_srgb(lab2)
    return out, float((w > 0.5).sum() / max(1, (rgba[..., 3] > 128).sum()))


def run_dir(nation, src, dst):
    os.makedirs(dst, exist_ok=True)
    shares = {}
    for f in sorted(os.listdir(src)):
        if f.endswith('.png'):
            rgba = np.asarray(Image.open(os.path.join(src, f)).convert('RGBA')).astype(np.float64)
            out, s = lock(rgba, nation)
            Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, f))
            shares[f] = round(s, 3)
        elif f.endswith('.json'):
            shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    return shares


if __name__ == '__main__':
    print(run_dir(*sys.argv[1:4]))
