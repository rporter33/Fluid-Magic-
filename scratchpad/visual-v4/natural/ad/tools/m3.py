# coarse busyness (6 px cells on a 1440 screen, adjacent dL* > 10) inside each terrain's cores, land-only shots
import sys, json, numpy as np
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/'
sys.path.insert(0, P + 'proto'); from natlib import rgb2lab
from PIL import Image, ImageDraw
polys = json.load(open(P + 'ad/polys.json'))
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
for view, D in [('start', 96), ('refC', 200), ('refW', 200)]:
    print(view, json.dumps(busy(P + f'ad/shots/L-{view}-landonly.png', view, D)))
# ref-2 land patches for comparison (forest mass, open land) at the same metric on a 1440-wide game area
im = Image.open('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-refs/ref-2.png').convert('RGB')
s = 1440 / (1630 * 2868 / 2000); r = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
sm = r.resize((r.width // 6, r.height // 6), Image.BOX); L = rgb2lab(np.asarray(sm, np.float64))[..., 0]
for name, (x0, y0, x1, y1) in {'ref2 open land (centre-south)': (700, 560, 900, 700), 'ref2 forest mass': (560, 440, 700, 520), 'ref2 range': (1300, 200, 1550, 400)}.items():
    q = lambda v: int(v * s * 1.434 / 6)
    sub = L[q(y0):q(y1), q(x0):q(x1)]; g = np.maximum(np.abs(np.diff(sub, axis=1))[:-1, :], np.abs(np.diff(sub, axis=0))[:, :-1])
    print(name, round(float((g > 10).mean() * 100), 1), round(float(np.median(g)), 2))
