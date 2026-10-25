# Art director's rim fix (pilot-review.md change 4), a post-pass on keyed frames: on the opaque boundary ring (within
# 2 px of transparency) a pixel whose OKLCH hue has moved more than 15 degrees from the paint 3 to 8 px inside, toward
# the key's hue, takes the inside paint's chroma and hue (OKLab a, b) and keeps its own lightness. The key-blended,
# despilled yellow-olive rim on orange crests and capes goes; the painted edge light (a lightness change) stays.
# Usage: python3 -I ad_rimfix.py green|magenta|blue IN.png OUT.png   (or a directory pair: IN_DIR OUT_DIR, every .png)
import os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import oklch, to_oklab  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402

KEYS = {'green': (0, 255, 0), 'magenta': (255, 0, 255), 'blue': (0, 0, 255)}


def fix(rgba, key):
    a = rgba[..., 3] / 255
    rgb = rgba[..., :3]
    trans = (a < 0.5).astype(np.uint8) * 255
    near = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(5))) > 127
    far = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(7))) > 127
    ring = near & (a > 0.02)
    core = (~far) & (a >= 0.97)
    lab = to_oklab(np.clip(rgb, 0, 255))
    num = np.zeros_like(lab); den = np.zeros(a.shape)
    for dy in range(-5, 6):
        for dx in range(-5, 6):
            num += np.roll(np.roll(lab * core[..., None], dy, 0), dx, 1)
            den += np.roll(np.roll(core.astype(float), dy, 0), dx, 1)
    ok = ring & (den > 0)
    inner = np.zeros_like(lab); inner[ok] = num[ok] / den[ok][:, None]
    Cp = np.hypot(lab[..., 1], lab[..., 2]); hp = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
    Ci = np.hypot(inner[..., 1], inner[..., 2]); hi = np.degrees(np.arctan2(inner[..., 2], inner[..., 1])) % 360
    _, _, hk = oklch(np.array(KEYS[key], np.float64)[None, None])
    d_pk = (hp - hi + 180) % 360 - 180
    d_ik = (float(hk[0, 0]) - hi + 180) % 360 - 180
    bad = ok & (np.sign(d_pk) == np.sign(d_ik)) & (np.abs(d_pk) > 15) & (Ci > 0.03)
    # a grey interior (steel, fur) with a ring that picked up the key's chroma: pull the chroma back to the inside's
    bad |= ok & (Ci <= 0.03) & (Cp > Ci + 0.025) & (np.abs((hp - float(hk[0, 0]) + 180) % 360 - 180) < 40)
    out_lab = lab.copy()
    out_lab[bad, 1] = inner[bad, 1]
    out_lab[bad, 2] = inner[bad, 2]
    out = rgba.copy()
    out[..., :3] = np.where(bad[..., None], oklab_to_srgb(out_lab), rgb)
    return out, float(bad.sum() / max(1, ok.sum()))


def mauve(rgba, lo=330.0, hi=10.0, band=4, to_hue=70.0, cmax=0.014):
    """Stage C fix 12: a faint mauve rim along a grey beast's edge (the summoned Wolf's back: RGB about 162/139/145) is the
    key's despill left on grey fur. On the edge band (within `band` px of transparency), a pixel whose OKLCH hue lies in
    [lo, hi] (wrapping through 0) at chroma above 0.008 is turned to a warm grey: hue to_hue, chroma at most cmax, its
    lightness kept. Interior paint (the mouth, the tongue) is left alone."""
    a = rgba[..., 3] / 255
    trans = (a < 0.5).astype(np.uint8) * 255
    near = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(2 * band + 1))) > 127
    ring = near & (a > 0.02)
    lab = to_oklab(np.clip(rgba[..., :3], 0, 255))
    C = np.hypot(lab[..., 1], lab[..., 2]); h = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
    inside = ((h - lo) % 360) <= ((hi - lo) % 360)
    hit = ring & inside & (C > 0.008)
    C2 = np.minimum(C, cmax); hr = np.radians(to_hue)
    lab2 = lab.copy()
    lab2[..., 1] = np.where(hit, C2 * np.cos(hr), lab[..., 1]); lab2[..., 2] = np.where(hit, C2 * np.sin(hr), lab[..., 2])
    out = rgba.copy()
    out[..., :3] = np.where(hit[..., None], oklab_to_srgb(lab2), rgba[..., :3])
    return out, int(hit.sum())


def run(key, src, dst):
    rgba = np.asarray(Image.open(src).convert('RGBA')).astype(np.float64)
    out, share = fix(rgba, key)
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(dst)
    return share


if __name__ == '__main__':
    key, src, dst = sys.argv[1:4]
    if os.path.isdir(src):
        os.makedirs(dst, exist_ok=True)
        for f in sorted(os.listdir(src)):
            if f.endswith('.png'):
                s = run(key, os.path.join(src, f), os.path.join(dst, f))
                print(f, round(100 * s, 1), '% of the ring recoloured')
            elif f.endswith('.json'):
                shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    else:
        print(round(100 * run(key, src, dst), 1), '% of the ring recoloured')
