# Overlay proof for an anchor: the idle's painting (faint) and the action frame drawn on one ground point at 1 wu per px x2,
# with the ground line; usage: dd_overlay.py OUT.png FIG VIEW ACT [ACT ...]
import os, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import dd_pack, dd_final  # noqa: E402
Z = 2.0  # px per wu


def place(png, wpp, anchor, fr=None):
    im = Image.open(png).convert('RGBA')
    if fr is not None:
        im = Image.fromarray(np.clip(dd_final.finish(np.asarray(im).astype(np.float64), fr), 0, 255).astype(np.uint8), 'RGBA')
    k = wpp * Z
    im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    return im, (anchor[0] * k, anchor[1] * k)


out, fig, view = sys.argv[1], sys.argv[2], sys.argv[3]
acts = sys.argv[4:]
idle = dd_final.idle_rec(fig, view)
ii, ia = place(os.path.join(dd_final.UNITS, idle['file']), idle['wuPerPx'], idle['anchor'])
tiles = []
for (v, act, png, fr, j, tag, rep) in dd_pack.frames_of(fig):
    if v != view or act not in acts:
        continue
    fi, fa = place(png, fr['wuPerPx'], fr['anchor'], fr)
    L = int(max(ia[0], fa[0])) + 20; T = int(max(ia[1], fa[1])) + 20
    R = int(max(ii.width - ia[0], fi.width - fa[0])) + 20; B = int(max(ii.height - ia[1], fi.height - fa[1])) + 20
    c = Image.new('RGBA', (L + R, T + B), (168, 167, 132, 255))
    gi = ii.copy(); a = np.asarray(gi).copy(); a[..., 3] = (a[..., 3] * 0.35).astype(np.uint8); gi = Image.fromarray(a)
    c.alpha_composite(gi, (int(L - ia[0]), int(T - ia[1])))
    fa_ = fi.copy(); a = np.asarray(fa_).copy(); a[..., 3] = (a[..., 3] * 0.8).astype(np.uint8); fa_ = Image.fromarray(a)
    c.alpha_composite(fa_, (int(L - fa[0]), int(T - fa[1])))
    d = ImageDraw.Draw(c); d.line([(0, T), (c.width, T)], fill=(255, 255, 255, 255), width=1)
    d.line([(L - 10, T), (L + 10, T)], fill=(255, 0, 0, 255), width=3)
    d.text((5, 5), f'{act} (faint: idle)', fill=(0, 0, 0, 255))
    tiles.append(c.convert('RGB'))
W = sum(t.width for t in tiles); H = max(t.height for t in tiles)
S = Image.new('RGB', (W, H), (40, 40, 40)); x = 0
for t in tiles:
    S.paste(t, (x, 0)); x += t.width
S.thumbnail((2000, 1400)); S.save(out); print(out, S.size)
