# Stage C creatures: the fill-in base for a re-roll (a re-dress of a camera-correct base, stage B's best route).
# The first sheet's raw image is kept as painted except in the cells that failed the camera gate: there the painted
# figure is cleared to the sheet's measured key colour (its sliced mask grown by 4 px) and the clay figure of the same
# cell of the camera guide is laid in at the sheet's scale, at the same place in the cell. The re-roll then keeps every
# painted figure and paints only the clay ones, so the passing cells stay passing by construction and the failing cells
# get the guide's camera, size, facing and pose.
# Usage (module): build(sheet_dir, fig, view, guide_png, cells, out_png) -> report dict
import json, os
import numpy as np
from PIL import Image, ImageFilter


def build(sheet_dir, fig, view, guide_png, cells, out_png):
    k = json.load(open(os.path.join(sheet_dir, 'key.json')))
    raw = np.asarray(Image.open(k['file']).convert('RGB')).astype(np.float64)
    H, W = raw.shape[:2]
    kc = k['keyMeasured']
    key = np.array([int(kc[i:i + 2], 16) for i in (1, 3, 5)], np.float64)
    fd = os.path.join(sheet_dir, 'frames0')
    meta = json.load(open(os.path.join(fd, f'{fig}.{view}.json')))
    fr = {f['name']: f for f in meta['frames']}
    cols, rows = meta['grid']
    g = Image.open(guide_png).convert('RGB').resize((W, H), Image.BILINEAR)
    g = np.asarray(g).astype(np.float64)
    gkey = g[2, 2]
    clay = np.abs(g - gkey).sum(-1) > 60
    out = raw.copy()
    rep = []
    for c in cells:
        f = fr.get(c)
        if f and not f.get('missing'):
            x0, y0, x1, y1 = f['box']
            a = np.asarray(Image.open(os.path.join(fd, f['file'])).convert('RGBA'))[..., 3] > 20
            pad = 6
            m = np.zeros((H, W), bool)
            hh, ww = min(a.shape[0], H - y0), min(a.shape[1], W - x0)
            m[y0:y0 + hh, x0:x0 + ww] = a[:hh, :ww]
            m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * pad + 1))) > 0
            out[m] = key
        i = meta['frames'].index(f) if f else None
        idx = [x['name'] for x in meta['frames']].index(c)
        cx, cy = idx % cols, idx // cols
        X0, Y0, X1, Y1 = int(cx * W / cols), int(cy * H / rows), int((cx + 1) * W / cols), int((cy + 1) * H / rows)
        cm = np.zeros((H, W), bool); cm[Y0:Y1, X0:X1] = clay[Y0:Y1, X0:X1]
        out[cm] = g[cm]
        rep.append(dict(cell=c, cleared=bool(f and not f.get('missing')), clayPx=int(cm.sum())))
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(out_png)
    return dict(base=out_png, fromSheet=k['file'], guide=guide_png, cells=rep, key=kc)
