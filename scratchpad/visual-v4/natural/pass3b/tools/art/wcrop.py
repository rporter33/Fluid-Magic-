"""crop a wild from dump shots side by side: python3 -I wcrop.py out.png scale pad ids(comma) tag1 [tag2 ...]  (tags like now-dpr1-far60); box from the meta layer's province ids"""
import sys, json, numpy as np
from PIL import Image, ImageDraw
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3b/out/art/dump/'
out, sc, pad, ids = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), [int(v) for v in sys.argv[4].split(',')]
ims = []
for tag in sys.argv[5:]:
    info = json.load(open(D + tag + '.json'))['info']; W2, H2 = info['W2'], info['H2']; dpr = info['dpr']; cr = info['canvasRect']
    meta = np.fromfile(D + tag + '-meta.bin', np.uint8).reshape(H2, W2, 4); m = np.isin(meta[..., 0], ids)
    ys, xs = np.nonzero(m); x0, x1, y0, y1 = xs.min() - pad, xs.max() + pad, ys.min() - pad, ys.max() + pad
    im = Image.open(D + tag + '-shot.png').convert('RGB'); ox, oy = int(cr[0] * dpr), int(cr[1] * dpr)
    c = im.crop((ox + x0, oy + y0, ox + x1, oy + y1)); ims.append((tag, c.resize((int(c.width * sc), int(c.height * sc)), Image.LANCZOS)))
W = sum(i.width for _, i in ims) + 8 * (len(ims) - 1); H = max(i.height for _, i in ims) + 18
o = Image.new('RGB', (W, H), (20, 18, 15)); d = ImageDraw.Draw(o); x = 0
for t, i in ims: o.paste(i, (x, 18)); d.text((x + 4, 3), t, fill=(230, 220, 200)); x += i.width + 8
o.save(out)
