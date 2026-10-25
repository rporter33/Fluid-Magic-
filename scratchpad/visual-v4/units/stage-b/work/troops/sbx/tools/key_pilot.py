# Chroma key for generated sheets on a flat key colour (art plan section 8.2). Improves painted/key.py:
#   1. the key is measured from the sheet's own border, not assumed to be pure #00FF00 / #FF00FF / #0000FF;
#   2. key strength is the excess of the key channel(s) over the others, normalised by the measured background;
#   3. a soft alpha ramp, then a 1 px erosion (min filter) of the alpha where it is tinted by the key, so the
#      outermost tinted ring goes and thin untinted weapon shafts stay;
#   4. despill on every pixel that kept any alpha: the key channel(s) are clamped to the other channels;
#   5. colour bleed: transparent and part-transparent pixels take the colour of the nearest opaque pixels, so
#      mipmaps and premultiplied downscales never pull the key or black into the edge;
#   6. a report: visible pixels still tinted toward the key ("fringe"), alpha statistics, the measured key.
# Usage: python3 -I key.py IN.png OUT.png green|magenta|blue [--erode N] [--json REPORT.json]
import json, sys, time
import numpy as np
from PIL import Image, ImageFilter

KEYS = {'green': (0.0, 1.0, 0.0), 'magenta': (1.0, 0.0, 1.0), 'blue': (0.0, 0.0, 1.0)}


def strength(im, kc):
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    if kc == 'green':
        return g - np.maximum(r, b)
    if kc == 'magenta':
        return np.minimum(r, b) - g
    return b - np.maximum(r, g)


def despill(im, kc):
    out = im.copy()
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    if kc == 'green':
        out[..., 1] = np.minimum(g, np.maximum(r, b))
    elif kc == 'blue':
        out[..., 2] = np.minimum(b, np.maximum(r, g))
    else:  # magenta: R and B rise together over G; pull both down by their common excess over G
        ex = np.clip(np.minimum(r, b) - g, 0, None)
        out[..., 0] = r - ex
        out[..., 2] = b - ex
    return out


def bleed(rgb, alpha, iters=24):
    """Fill the colour of pixels with alpha < 0.5 from opaque neighbours (repeated 3x3 averaging)."""
    known = alpha >= 0.5
    col = np.where(known[..., None], rgb, 0.0)
    w = known.astype(np.float32)
    for _ in range(iters):
        if known.all():
            break
        pc = np.pad(col * w[..., None], ((1, 1), (1, 1), (0, 0)))
        pw = np.pad(w, 1)
        s = sum(pc[1 + dy:pc.shape[0] - 1 + dy, 1 + dx:pc.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        n = sum(pw[1 + dy:pw.shape[0] - 1 + dy, 1 + dx:pw.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        grow = (~known) & (n > 0)
        col[grow] = s[grow] / n[grow][:, None]
        w = np.where(grow, 1.0, w)
        known = known | grow
    return np.where((alpha >= 0.5)[..., None], rgb, col)


def edge_deviation(rgb, alpha):
    """The edge's colour against the figure just inside it: the share of edge pixels (alpha 0.3 to 0.97) whose OKLab
    colour is more than 0.10 from the mean of the opaque pixels within 2 px (a key-coloured or despill-tinted rim
    shows here; fringePct only sees pixels still leaning toward the key)."""
    import os as _os
    sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', 'tools'))
    from v4color import to_oklab
    edge = (alpha > 0.3) & (alpha < 0.97)
    solid = (alpha >= 0.97).astype(np.float32)
    lab = to_oklab(np.clip(rgb, 0, 1) * 255)
    num = np.zeros_like(lab); den = np.zeros(alpha.shape, np.float32)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            num += np.roll(np.roll(lab * solid[..., None], dy, 0), dx, 1)
            den += np.roll(np.roll(solid, dy, 0), dx, 1)
    ok = edge & (den > 0)
    if not ok.any():
        return 0.0
    ref = num[ok] / den[ok][:, None]
    d = np.linalg.norm(lab[ok] - ref, axis=1)
    return round(100 * float((d > 0.10).mean()), 2)


def key_image(src, kc, erode=1):
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    h, w, _ = im.shape
    k = strength(im, kc)
    border = np.concatenate([k[:6].ravel(), k[-6:].ravel(), k[:, :6].ravel(), k[:, -6:].ravel()])
    bpx = np.concatenate([im[:6].reshape(-1, 3), im[-6:].reshape(-1, 3), im[:, :6].reshape(-1, 3), im[:, -6:].reshape(-1, 3)])
    kbg = float(np.median(border))
    if kbg < 0.3:
        raise SystemExit(f'the border does not look like the {kc} key (median strength {kbg:.2f})')
    lo, hi = 0.30 * kbg, 0.70 * kbg  # below lo opaque, above hi transparent, a soft ramp between
    alpha = 1 - np.clip((k - lo) / (hi - lo), 0, 1)
    if erode > 0:
        a8 = Image.fromarray((alpha * 255).astype(np.uint8))
        for _ in range(erode):
            a8 = a8.filter(ImageFilter.MinFilter(3))
        eroded = np.asarray(a8).astype(np.float32) / 255
        # the outermost ring goes only where it carries the key (k above 10% of the background's strength):
        # a thin dark spear shaft or staff keeps its untinted core, so weapons 2 to 3 px wide survive
        alpha = np.where(k > 0.10 * kbg, np.minimum(alpha, eroded), alpha)
    vis = alpha > 0.3
    # where the paint leans toward the key before despill: near the edge it is spill (fixed below); deep inside
    # the figure it means the key colour is in the unit itself (choose another key for the unit, or re-roll)
    tinted = (k > 0.08) & vis
    m8 = Image.fromarray((vis * 255).astype(np.uint8))
    for _ in range(3):
        m8 = m8.filter(ImageFilter.MinFilter(3))
    inner = np.asarray(m8) > 127
    # pilot fix: a pixel that leans toward the key at all (key strength above 5% of the background's) takes the
    # colour of its clean neighbours (opaque and not leaning), keeping its alpha; the despill below stays as a safety.
    # Clamping alone turned an orange edge blended with green into yellow-olive (r2 sheets: a rim on crests and shield
    # rims that fringePct could not see). Un-mixing by alpha was tried and was worse: alpha here is a key-strength
    # ramp, not coverage, so a half-green orange edge counts as opaque.
    dirty = (alpha > 0.01) & (k > 0.05 * kbg)
    clean = (alpha >= 0.97) & ~dirty
    rgb = despill(im, kc)
    rgb = np.where(dirty[..., None], bleed(rgb, clean.astype(np.float32), iters=6), rgb)
    rgb = bleed(rgb, alpha)
    resid = int(((strength(rgb, kc) > 0.08) & vis).sum())  # after despill: 0 unless despill failed
    nvis = max(1, int(vis.sum()))
    edge_dev = edge_deviation(rgb, alpha)
    keymean = bpx.mean(0)
    rep = dict(file=src, key=kc, size=[w, h], keyMeasured='#%02X%02X%02X' % tuple(int(round(v * 255)) for v in keymean),
               keyStrengthBg=round(kbg, 3), opaquePx=int((alpha > 0.99).sum()), partialPx=int(((alpha > 0.01) & (alpha <= 0.99)).sum()),
               spillEdgePct=round(100 * int((tinted & ~inner).sum()) / nvis, 3),
               keyInUnitPct=round(100 * int((tinted & inner).sum()) / nvis, 3),
               fringePct=round(100 * resid / nvis, 3), edgeDevPct=edge_dev, erode=erode)
    return np.dstack([np.clip(rgb, 0, 1), alpha]), rep


if __name__ == '__main__':
    args = sys.argv[1:]
    erode, rj = 1, None
    if '--erode' in args:
        i = args.index('--erode'); erode = int(args[i + 1]); del args[i:i + 2]
    if '--json' in args:
        i = args.index('--json'); rj = args[i + 1]; del args[i:i + 2]
    src, dst, kc = args
    t0 = time.time()
    rgba, rep = key_image(src, kc, erode)
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(dst)
    rep['ms'] = round((time.time() - t0) * 1000)
    if rj:
        json.dump(rep, open(rj, 'w'), indent=1)
    print(json.dumps(rep))
