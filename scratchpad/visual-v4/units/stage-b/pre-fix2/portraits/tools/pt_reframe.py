# Stage B portraits, resume (key "portraits"): re-frame the grey clay maquettes (pt_maquettes.py) to the portrait
# framing the prompts ask for. The fix-pass maquettes put small bodies (Great Wyrm, Ash Phoenix) in the middle 28% of
# the square and the quadrupeds in the middle half, while the prompt says "follow its framing ... filling the square":
# the reference contradicted the text. Each maquette is cropped to its silhouette and scaled so that it stands from
# about 6% to 94% (bipeds, slabs) or, when the silhouette is wide, fills 90% of the width with its feet at 93%.
# No generation. Writes ../refs/gods-framed/<id>.png.
# Usage: python3 -I pt_reframe.py
import glob, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'refs', 'gods')
OUT = os.path.join(HERE, '..', 'refs', 'gods-framed')
BG = (28, 26, 23)
N = 768

# after wave 1: the biped maquettes (bulk 1.1 to 1.5) gave the Titan a squat, dwarf-like body; they are narrowed to
# 0.85 of their width so that the clay reads tall
BIPEDS = ('oracle', 'titan', 'ascendedHero', 'ashColossus', 'pyreLord', 'emberHierophant', 'hornedHunter',
          'motherOfBeasts')
os.makedirs(OUT, exist_ok=True)
for f in sorted(glob.glob(os.path.join(SRC, '*.png'))):
    im = Image.open(f).convert('RGB')
    a = np.asarray(im).astype(float)
    m = np.abs(a - np.array(BG)).sum(-1) > 18
    ys, xs = np.nonzero(m)
    pad = 4
    x0, x1 = max(0, xs.min() - pad), min(N, xs.max() + 1 + pad)
    y0, y1 = max(0, ys.min() - pad), min(N, ys.max() + 1 + pad)
    crop = im.crop((x0, y0, x1, y1))
    if os.path.basename(f)[:-4] in BIPEDS:
        crop = crop.resize((int(round(crop.size[0] * 0.85)), crop.size[1]), Image.LANCZOS)
    w, h = crop.size
    s = min(0.88 * N / h, 0.90 * N / w)
    nw, nh = int(round(w * s)), int(round(h * s))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    out = Image.new('RGB', (N, N), BG)
    bottom = 0.94 * N if nh >= 0.87 * N else 0.93 * N
    out.paste(crop, ((N - nw) // 2, int(round(bottom - nh))))
    out.save(os.path.join(OUT, os.path.basename(f)))
    print(os.path.basename(f), f'scale {s:.2f}', f'top {(bottom - nh) / N:.3f} low {bottom / N:.3f} width {nw / N:.3f}')
