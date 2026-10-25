# Chroma-key a generated image on a flat key color, despill the fringe, report what was keyed.
# Usage: python3 -I key.py IN.png OUT.png magenta|green
import sys, time, json
import numpy as np
from PIL import Image
src, dst, kc = sys.argv[1], sys.argv[2], sys.argv[3]
t0 = time.time()
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
r, g, b = im[..., 0], im[..., 1], im[..., 2]
if kc == 'magenta':
    # key strength: how much R and B exceed G (magenta has R = B = 1, G = 0)
    k = np.minimum(r, b) - g
    spill = np.clip(np.minimum(r, b) - g, 0, None)
else:
    k = g - np.maximum(r, b)
    spill = np.clip(g - np.maximum(r, b), 0, None)
lo, hi = 0.18, 0.55  # below lo: opaque; above hi: transparent; soft ramp between
alpha = 1 - np.clip((k - lo) / (hi - lo), 0, 1)
# despill: pull the key channel(s) down toward the others on partly keyed or tinted pixels
out = im.copy()
if kc == 'magenta':
    m = np.minimum(r, b); ex = np.clip(m - np.maximum(g, 0) , 0, None) * 0.0
    lim = np.maximum(g, (r + b) / 2 * 0.0)
    out[..., 0] = np.where(k > 0.06, np.minimum(r, g + (r - g) * 0.35 + 0.05), r)
    out[..., 2] = np.where(k > 0.06, np.minimum(b, g + (b - g) * 0.35 + 0.05), b)
else:
    out[..., 1] = np.where(k > 0.04, np.maximum(r, b) + 0.02, g)
rgba = np.dstack([np.clip(out, 0, 1), alpha])
Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(dst)
opaque = (alpha > 0.99).sum(); partial = ((alpha > 0.01) & (alpha <= 0.99)).sum()
# residual fringe: visible pixels still tinted toward the key color after despill
if kc == 'magenta': tint = (np.minimum(out[..., 0], out[..., 2]) - out[..., 1]) > 0.12
else: tint = (out[..., 1] - np.maximum(out[..., 0], out[..., 2])) > 0.12
fringe = (tint & (alpha > 0.3)).sum()
print(json.dumps({'file': dst, 'size': im.shape[1::-1], 'ms': round((time.time() - t0) * 1000), 'opaquePx': int(opaque), 'partialPx': int(partial), 'residualFringePx': int(fringe), 'fringePctOfVisible': round(100 * fringe / max(1, opaque + partial), 2)}))
