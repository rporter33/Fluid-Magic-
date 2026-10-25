# Diagnostic: where a keyed sheet's edgeDevPct comes from (key.py edge_deviation, the same rule), split by how much
# solid paint the edge pixel has within 2 px (a thin feature has little), shown in red on a mid ground.
# Usage: python3 cmda_edgemap.py KEYED.png OUT.png
import sys, os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from PIL import Image
from v4color import to_oklab
im = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float32) / 255
rgb, alpha = im[..., :3], im[..., 3]
edge = (alpha > 0.3) & (alpha < 0.97); solid = (alpha >= 0.97).astype(np.float32)
lab = to_oklab(np.clip(rgb, 0, 1) * 255)
num = np.zeros_like(lab); den = np.zeros(alpha.shape, np.float32)
for dy in range(-2, 3):
    for dx in range(-2, 3):
        num += np.roll(np.roll(lab * solid[..., None], dy, 0), dx, 1); den += np.roll(np.roll(solid, dy, 0), dx, 1)
ok = edge & (den > 0)
ref = np.zeros_like(lab); ref[ok] = num[ok] / den[ok][:, None]
d = np.zeros(alpha.shape); d[ok] = np.linalg.norm(lab[ok] - ref[ok], axis=1)
bad = ok & (d > 0.10)
thin = den < 8
dl = (lab[..., 0] - ref[..., 0])
print(dict(edgePx=int(ok.sum()), badPct=round(100 * bad.sum() / ok.sum(), 2), badThinPct=round(100 * (bad & thin).sum() / ok.sum(), 2),
           badThickPct=round(100 * (bad & ~thin).sum() / ok.sum(), 2), badLighter=round(float((dl[bad] > 0).mean()), 2),
           badHueShift=round(float(np.hypot(*(lab[..., 1:] - ref[..., 1:])[bad].T).mean()), 3), badDL=round(float(np.abs(dl[bad]).mean()), 3)))
comp = rgb * alpha[..., None] + np.array([0.6, 0.59, 0.5]) * (1 - alpha[..., None])
comp[bad & ~thin] = [1, 0, 0]; comp[bad & thin] = [1, 1, 0]
Image.fromarray((comp * 255).astype(np.uint8)).save(sys.argv[2])
