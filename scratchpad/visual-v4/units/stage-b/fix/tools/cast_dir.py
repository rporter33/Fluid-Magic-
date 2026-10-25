# Diagnostic over a frames dir: tiles every frame with its key-cast mask (thin features magenta, thick cyan).
import os, sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/tools')
from v4color import to_oklab
d, out, lo, hi, cmin, k = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
tiles = []; tot = [0, 0, 0]
for f in sorted(os.listdir(d)):
    if not f.endswith('.png') or 'white' in f: continue
    a = np.asarray(Image.open(os.path.join(d, f)).convert('RGBA')).astype(np.float64)
    solid = a[..., 3] > 128
    op = np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))) > 127
    thin = solid & ~op
    lab = to_oklab(a[..., :3]); C = np.hypot(lab[..., 1], lab[..., 2]); h = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
    hit = solid & (((h - lo) % 360) <= ((hi - lo) % 360)) & (C > cmin)
    tot[0] += solid.sum(); tot[1] += (hit & thin).sum(); tot[2] += (hit & ~thin).sum()
    al = a[..., 3:4] / 255; comp = a[..., :3] * al + np.array([120, 112, 92]) * (1 - al)
    v = comp.copy(); v[hit & thin] = [255, 0, 255]; v[hit & ~thin] = [0, 200, 255]
    t = np.concatenate([comp, v], 1).astype(np.uint8)
    tiles.append(Image.fromarray(t))
W = max(t.width for t in tiles); H = max(t.height for t in tiles); n = len(tiles); cols = 4
c = Image.new('RGB', (cols * W, ((n + cols - 1) // cols) * H), (120, 112, 92))
for i, t in enumerate(tiles): c.paste(t, ((i % cols) * W, (i // cols) * H))
c.save(out)
print(f'thin hits {100*tot[1]/tot[0]:.2f}%  thick hits {100*tot[2]/tot[0]:.2f}% of solid px')
