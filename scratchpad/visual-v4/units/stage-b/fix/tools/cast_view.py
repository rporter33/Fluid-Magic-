# Diagnostic: shows where a keyed sheet's paint sits near a hue window (magenta overlay), whole figure vs thin features.
import sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/tools')
from v4color import to_oklab
src, out, lo, hi, cmin, k = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float64)
solid = a[..., 3] > 128
op = np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))) > 127
thin = solid & ~op
lab = to_oklab(a[..., :3]); C = np.hypot(lab[..., 1], lab[..., 2]); h = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
inw = ((h - lo) % 360) <= ((hi - lo) % 360)
hit = solid & inw & (C > cmin)
print('solid', int(solid.sum()), 'thin', int(thin.sum()), 'hit all', int(hit.sum()), 'hit thin', int((hit & thin).sum()))
bg = np.zeros_like(a[..., :3]) + [120, 112, 92]
al = a[..., 3:4] / 255
comp = a[..., :3] * al + bg * (1 - al)
v = comp.copy(); v[hit & thin] = [255, 0, 255]; v[hit & ~thin] = [0, 200, 255]
im = np.concatenate([comp, v], 1).astype(np.uint8)
Image.fromarray(im).save(out)
