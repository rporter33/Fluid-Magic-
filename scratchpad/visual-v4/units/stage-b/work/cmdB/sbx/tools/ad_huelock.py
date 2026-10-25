# Art director's cloth hue lock (pilot-review.md change 8): the generators never hit a cloth hex (the Warden's green
# came out leaf-green at hue 90 to 165, and an edit asking for the hex overshot to teal at 186 to 220; the cloth is
# at 166). After keying, the side's cloth (a per-nation hue range, chroma above 0.03, opened by 3 px so specks stay)
# takes the nation's cloth hue, and its chroma is held inside [0.6, 1.0] x the cloth's; the painted lightness and
# strokes stay. Unlike pack.cloth_boost (hue pulled halfway, chroma pushed to 0.9 x the cloth's at least), this
# locks the hue and does not push chroma up.
import os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import oklch, to_oklab  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402

RANGES = {'cinderHorde': (25.0, 55.0), 'thornwood': (85.0, 225.0)}  # OKLCH hue, degrees


def hue_lock(rgba, cloth_hex, nation, open_px=3):
    hx = np.array([[[int(cloth_hex[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)
    _, cc, ch = oklch(hx)
    cc, ch = float(cc[0, 0]), float(ch[0, 0])
    lo, hi = RANGES[nation]
    _, C, h = oklch(rgba[..., :3])
    inside = ((h >= lo) & (h <= hi)).astype(np.float64)
    w = inside * np.clip((C - 0.03) / 0.02, 0, 1) * (rgba[..., 3] > 128)
    m = Image.fromarray((w * 255).astype(np.uint8))
    k = 2 * open_px + 1
    m = np.asarray(m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))).astype(np.float64) / 255
    w = np.minimum(w, m)
    lab = to_oklab(rgba[..., :3])
    Cn = np.hypot(lab[..., 1], lab[..., 2])
    newC = np.clip(Cn, 0.6 * cc, 1.0 * cc)
    hc = np.radians(ch)
    a2, b2 = newC * np.cos(hc), newC * np.sin(hc)
    lab2 = np.dstack([lab[..., 0], lab[..., 1] + w * (a2 - lab[..., 1]), lab[..., 2] + w * (b2 - lab[..., 2])])
    out = rgba.copy()
    out[..., :3] = oklab_to_srgb(lab2)
    return out, float((w > 0.5).sum() / max(1, (rgba[..., 3] > 128).sum()))
