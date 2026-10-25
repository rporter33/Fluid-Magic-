# coarse busyness per terrain core (the critique's m3.py measure) on the land-only shots, before (critique build) and after (this build)
import sys, json, numpy as np
N = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/'
sys.path.insert(0, N + 'proto'); from natlib import rgb2lab
from PIL import Image, ImageDraw
polys = json.load(open(N + 'ad/polys.json'))
def mask(poly, shape, erode):
    im = Image.new('L', (shape[1], shape[0]), 0); d = ImageDraw.Draw(im); pts = [tuple(p) for p in poly]; d.polygon(pts, fill=255)
    if erode > 0: d.line(pts + [pts[0]], fill=0, width=2 * erode, joint='curve')
    return np.asarray(im) > 0
def busy(f, view, D):
    im = Image.open(f).convert('RGB'); W, H = im.size
    sm = im.resize((W // 6, H // 6), Image.BOX); L = rgb2lab(np.asarray(sm, np.float64))[..., 0]
    gx = np.abs(L[:, 1:] - L[:, :-1]); gy = np.abs(L[1:, :] - L[:-1, :]); g = np.zeros_like(L); g[:, :-1] = np.maximum(g[:, :-1], gx); g[:-1, :] = np.maximum(g[:-1, :], gy)
    out = {}
    for pr in polys[view]['provs']:
        m = mask(pr['poly'], (H, W), int(0.15 * D)); m[:165] = False; m[735:] = False; m[:, 1230:] = False
        ms = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((W // 6, H // 6), Image.BOX)) > 250
        if ms.sum() < 4: continue
        k = 'WILD' if pr['wild'] else pr['t']; out.setdefault(k, []).append(g[ms])
    return {k: (round(float((np.concatenate(v) > 10).mean() * 100), 1), round(float(np.median(np.concatenate(v))), 2)) for k, v in sorted(out.items())}
res = {}
for view, D in [('start', 96), ('refC', 200), ('refW', 200)]:
    for tag in ['before', 'new']:
        r = busy(N + f'ad-fix/shots-dev/L-{tag}-{view}-landonly.png', view, D); res[f'{view}/{tag}'] = r; print(view, tag, json.dumps(r))
json.dump(res, open(N + 'ad-fix/out/terrain-busy.json', 'w'), indent=1)
