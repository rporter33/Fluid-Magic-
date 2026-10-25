# Stage B, key "cmdA": key.py's edge deviation, split by feature width. edgeDevPct compares an edge pixel (alpha 0.3 to
# 0.97) with the solid paint within 2 px; on a feature under about 3 px wide (a sword blade, a knife, a staff) there is
# almost no solid paint in reach, so a painted highlight along a blade counts as "deviating" although nothing of the key
# is in it. Measured on the blue-keyed levy, hunter and scout sheets that failed the 8% gate: the deviating pixels'
# OKLab chroma shift is 0.002 (no key tint; the AD's despill rim moved hue by 15 to 40 degrees), their lightness
# differs by 0.18, and 70 to 80% of them have fewer than 8 solid pixels in their 5 x 5 window.
# edgeDevThickPct = the same rule over edge pixels with at least 8 solid neighbours (thin features left out).
import os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_oklab  # noqa: E402


def edge_dev_split(keyed_png):
    im = np.asarray(Image.open(keyed_png).convert('RGBA')).astype(np.float32) / 255
    rgb, alpha = im[..., :3], im[..., 3]
    edge = (alpha > 0.3) & (alpha < 0.97); solid = (alpha >= 0.97).astype(np.float32)
    lab = to_oklab(np.clip(rgb, 0, 1) * 255)
    num = np.zeros_like(lab); den = np.zeros(alpha.shape, np.float32)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            num += np.roll(np.roll(lab * solid[..., None], dy, 0), dx, 1); den += np.roll(np.roll(solid, dy, 0), dx, 1)
    ok = edge & (den > 0)
    ref = np.zeros_like(lab); ref[ok] = num[ok] / den[ok][:, None]
    d = np.zeros(alpha.shape, np.float32); d[ok] = np.linalg.norm(lab[ok] - ref[ok], axis=1)
    bad = ok & (d > 0.10); thick = ok & (den >= 8)
    ab = np.zeros(alpha.shape, np.float32); ab[ok] = np.hypot(*(lab[ok][:, 1:] - ref[ok][:, 1:]).T)
    return dict(edgeDevPct=round(100 * float(bad.sum()) / max(1, ok.sum()), 2),
                edgeDevThickPct=round(100 * float((bad & thick).sum()) / max(1, thick.sum()), 2),
                deviatingChromaShift=round(float(ab[bad].mean()), 3) if bad.any() else 0.0)


if __name__ == '__main__':
    print(edge_dev_split(sys.argv[1]))
