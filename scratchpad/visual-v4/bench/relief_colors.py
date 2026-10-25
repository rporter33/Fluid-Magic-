# Per-terrain ground colors at the 10th / 50th / 90th lightness percentile of a relief bake.
# Usage: python3 -I relief_colors.py BAKE.png INDEX.png OUT.json
import json, sys, numpy as np
from PIL import Image
base = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32)
idx = np.asarray(Image.open(sys.argv[2]).convert('RGB'))[..., 0]
TERR = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
lum = 0.2126 * base[..., 0] + 0.7152 * base[..., 1] + 0.0722 * base[..., 2]
out = {}
for t, name in enumerate(TERR):
    m = idx == 10 + t * 20
    px = base[m]; L = lum[m]; order = np.argsort(L); n = len(order)
    def band(q):
        lo, hi = max(0, int((q - 0.02) * n)), min(n, int((q + 0.02) * n) + 1)
        c = px[order[lo:hi]].mean(axis=0); return '#%02X%02X%02X' % tuple(int(round(v)) for v in c)
    out[name] = {'p10': band(0.10), 'p50': band(0.50), 'p90': band(0.90), 'px': int(n)}
json.dump(out, open(sys.argv[3], 'w'), indent=1)
