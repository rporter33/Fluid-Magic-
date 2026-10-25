# Chroma key for generated sheets on a flat key colour (art plan section 8.2). Improves painted/key.py:
#   1. the key is measured from the sheet's own border, not assumed to be pure #00FF00 / #FF00FF / #0000FF;
#   2. key strength is the excess of the key channel(s) over the others, normalised by the measured background;
#   3. a soft alpha ramp, then a 1 px erosion (min filter) of the alpha where it is tinted by the key, so the
#      outermost tinted ring goes and thin untinted weapon shafts stay;
#   4. despill on every pixel that kept any alpha: the key channel(s) are clamped to the other channels;
#   5. colour bleed: transparent and part-transparent pixels take the colour of the nearest opaque pixels, so
#      mipmaps and premultiplied downscales never pull the key or black into the edge;
#   6. a report: visible pixels still tinted toward the key ("fringe"), alpha statistics, the measured key.
#   7. --shafts (opt in, stage C lance fix): thin shafts painted cast through with the key are found by their shape and
#      kept whole (section 7 below).
# Usage: python3 -I key.py IN.png OUT.png green|magenta|blue [--erode N] [--json REPORT.json] [--shafts]
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


def hue_despill(rgb, kc):
    """Stage B calibration: remove the part of a pixel's OKLab chroma that points toward the key's hue, keep its
    lightness and the rest of its chroma (a brown antler blended with magenta keeps its brown, loses its pink)."""
    import os as _os
    sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', 'tools'))
    sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
    from v4color import to_oklab
    from pack import oklab_to_srgb
    lab = to_oklab(np.clip(rgb, 0, 1) * 255)
    k = to_oklab(np.array([[KEYS[kc]]], np.float64) * 255)[0, 0]
    kh = k[1:] / np.linalg.norm(k[1:])
    d = np.clip(lab[..., 1:] @ kh, 0, None)
    lab[..., 1:] -= d[..., None] * kh
    return (oklab_to_srgb(lab) / 255).astype(np.float32)


# ---------------------------------------------------------------- 7. thin key-cast shafts (--shafts; stage C lance fix)
# The owner's stage C verdict: the Ash Rider's lance and the Wolf Rider front's spear did not read whole. The paint is
# whole and inside its cell, but the model painted those shafts cast through with the key (a dark green shaft about
# (3, 122, 0) on the green sheets, a navy one about (14, 41, 118) on the blue), 2 to 5 px wide: the key strength made
# them part-transparent (alpha 0.2 to 0.6), the 1 px erosion took what was left, and the slicer dropped the remains as
# specks, so only the pennon and the tip floated free of the hand. With --shafts (default off; the lance fix driver,
# stage-c/lance-fix/lance_fix.py, passes it for the Ash Rider and Wolf Rider sheets) the keyer finds such shafts by
# their shape and keeps them:
#   - paint evidence e per pixel: how much darker than the measured key the key channel is (relative), or how much
#     lighter another channel is (0 on the key, about 0.5 on those shafts, 0.15 on a painted grid line);
#   - ridge pixels: e at least 0.25 and a local maximum across one of four directions, falling by 0.2 within 3 px on
#     both sides (a line up to about 5 px wide), among the pixels the keyer left part-transparent (alpha below 0.97);
#   - straight segments of them (6 px or more, elongated 3:1), merged when collinear (8 degrees, 2.5 px; a piece
#     under 12 px only by its ends against the longer line; gaps up to 45 px), lines of 18 px or more kept;
#   - each line traced on along its axis while there is paint (e 0.2 or more) within 2 px of it, gaps of 2 px at most,
#     through opaque paint (a pennon, a hand) for 14 px at most: the tip above a pennon and the butt are reached;
#   - the band within 1.2 px of the traced axis: part-transparent pixels with e of 0.2 or more take alpha
#     (e - 0.2) / 0.25 where that is more than the keyer gave, and one colour along the line: its core (e 0.35 or more)
#     with the key's hue taken out, as this keyer treats thin features dirty all through, at 60% (the key's light taken
#     off: the painted shafts read dark, and a lighter grey pole inside the 2 px tier H keyline read as a ladder);
#     light paint (a steel tip, another channel at least 0.3 above the key's) keeps its own colour, key hue taken out.
#   Rows and columns running mostly off-key across the whole sheet (a painted grid) are never touched. key.json lists
#   every line kept (place, angle, found and traced length, pixels raised, colour).
SHAFT = dict(emin=0.25, drop=0.2, reach=3, segpx=6, ratio=3.0, ang=8.0, perp=2.5, gap=45.0, short=12.0, solid=0.97, minlen=18.0, minpx=12,
             trace=0.2, maxext=60, opaque=14, miss=2, half=1.2, e0=0.20, e1=0.45, core=0.35, dark=0.6, light=0.3)


def _shift(a, dx, dy, fill):
    """out[p] = a[p + (dx, dy)], `fill` outside the image."""
    h, w = a.shape
    out = np.full_like(a, fill)
    ys0, ys1 = max(0, -dy), min(h, h - dy)
    xs0, xs1 = max(0, -dx), min(w, w - dx)
    out[ys0:ys1, xs0:xs1] = a[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx]
    return out


def shaft_evidence(im, kc, K):
    """Paint evidence per pixel (0 on the key): how much darker than the measured key the key channel is (relative), or
    how much lighter another channel is; and whether the paint is light (a steel tip) rather than dark."""
    ki = {'green': [1], 'blue': [2], 'magenta': [0, 2]}[kc]
    oth = [c for c in range(3) if c not in ki]
    dk = np.clip(np.min((K[ki] - im[..., ki]) / np.maximum(K[ki], 1e-3), -1), 0, 1)
    el = np.clip(np.max(im[..., oth] - K[oth], -1), 0, 1)
    return np.maximum(dk, el).astype(np.float32), (el > dk) & (el >= SHAFT['light'])  # light: clearly lighter than the key


def _ridges(e, P):
    r = np.zeros(e.shape, bool)
    for dx, dy in ((1, 0), (0, 1), (1, 1), (1, -1)):
        lo_p = np.min([_shift(e, a * dx, a * dy, 0.0) for a in range(1, P['reach'] + 1)], 0)
        lo_m = np.min([_shift(e, -a * dx, -a * dy, 0.0) for a in range(1, P['reach'] + 1)], 0)
        peak = (e >= _shift(e, dx, dy, 0.0)) & (e >= _shift(e, -dx, -dy, 0.0))
        r |= peak & (e - lo_p >= P['drop']) & (e - lo_m >= P['drop'])
    return r & (e >= P['emin'])


def _fit(pts):
    c = pts.mean(0)
    _, s, vt = np.linalg.svd(pts - c, full_matrices=False)
    d = vt[0]
    t = (pts - c) @ d
    return c, d, s / np.sqrt(len(pts)), float(t.min()), float(t.max())


def _segments(mask, P):
    import os as _os
    sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
    from slice import label
    lab = label(mask)
    ys, xs = np.nonzero(lab)
    if not len(xs):
        return []
    ls = lab[ys, xs]
    o = np.argsort(ls, kind='stable')
    ys, xs, ls = ys[o], xs[o], ls[o]
    cuts = np.nonzero(np.diff(ls))[0] + 1
    segs = []
    for gy, gx in zip(np.split(ys, cuts), np.split(xs, cuts)):
        if len(gx) < P['segpx']:
            continue
        pts = np.stack([gx, gy], 1).astype(np.float64)
        c, d, sd, t0, t1 = _fit(pts)
        if sd[0] / max(sd[1] if len(sd) > 1 else 0.0, 0.35) < P['ratio']:
            continue
        segs.append(dict(c=c, d=d, t0=t0, t1=t1, pts=pts))
    return segs


def _merge(segs, P):
    n = len(segs)
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    cosmin = np.cos(np.radians(P['ang']))
    for i in range(n):
        for j in range(i + 1, n):
            a, b = segs[i], segs[j]
            if a['t1'] - a['t0'] < b['t1'] - b['t0']:
                a, b = b, a  # a: the longer one
            short = b['t1'] - b['t0'] < P['short']
            if not short and abs(a['d'] @ b['d']) < cosmin:
                continue
            ok = True
            # each one's ends against the other's line (a short piece's own direction is too noisy: only its ends
            # against the longer one's line count)
            for u, v in ((a, b),) if short else ((a, b), (b, a)):
                nrm = np.array([-u['d'][1], u['d'][0]])
                if max(abs((v['c'] + v['d'] * t - u['c']) @ nrm) for t in (v['t0'], v['t1'])) > P['perp']:
                    ok = False
            if not ok:
                continue
            tb = [(b['c'] + b['d'] * t - a['c']) @ a['d'] for t in (b['t0'], b['t1'])]
            if max(0.0, min(tb) - a['t1'], a['t0'] - max(tb)) > P['gap']:
                continue
            parent[find(i)] = find(j)
    groups = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(segs[i])
    lines = []
    for g in groups.values():
        pts = np.concatenate([s['pts'] for s in g])
        c, d, _, t0, t1 = _fit(pts)
        lines.append(dict(c=c, d=d, t0=t0, t1=t1, n=len(pts), parts=len(g)))
    return lines


def _trace(L, e, a_pre, grid, P):
    """Carry a line on along its axis while there is paint within 2 px of it (gaps of at most P['miss'] px), through
    opaque paint (a pennon, a hand) for at most P['opaque'] px; returns the new (t0, t1)."""
    h, w = e.shape
    c, d = L['c'], L['d']
    nrm = np.array([-d[1], d[0]])
    ext = {}
    for sgn, t_end in ((1, L['t1']), (-1, L['t0'])):
        last = miss = opq = 0
        for s in range(1, P['maxext'] + 1):
            p = c + d * (t_end + sgn * s)
            paint = False
            for u in (-2, -1, 0, 1, 2):
                x, y = int(round(p[0] + u * nrm[0])), int(round(p[1] + u * nrm[1]))
                if 0 <= x < w and 0 <= y < h and not grid[y, x] and e[y, x] >= P['trace']:
                    paint = True
                    break
            if not paint:
                miss += 1
                if miss > P['miss']:
                    break
                continue
            miss = 0
            x, y = int(round(p[0])), int(round(p[1]))
            opaque = 0 <= x < w and 0 <= y < h and a_pre[y, x] >= 0.97
            opq = opq + 1 if opaque else 0
            if opq > P['opaque']:
                break
            if not opaque:
                last = s
        ext[sgn] = last
    return L['t0'] - ext[-1], L['t1'] + ext[1]


def protect_shafts(im, kc, K, a_pre, alpha, hue_despill, P=SHAFT):
    """Returns (alpha with the shafts kept, mask of shaft pixels, their colour, report)."""
    e, light = shaft_evidence(im, kc, K)
    grid = np.zeros(e.shape, bool)
    grid[(e > 0.1).mean(1) > 0.6, :] = True
    grid[:, (e > 0.1).mean(0) > 0.6] = True
    r = _ridges(e, P) & (a_pre < P['solid']) & ~grid
    lines = [L for L in _merge(_segments(r, P), P) if L['t1'] - L['t0'] >= P['minlen'] and L['n'] >= P['minpx']]
    h, w = e.shape
    a_out = alpha.copy()
    smask = np.zeros(e.shape, bool)
    scol = np.zeros(im.shape, np.float32)
    hd = hue_despill(im, kc) if lines else None
    rec = []
    for L in lines:
        t0, t1 = _trace(L, e, a_pre, grid, P)
        c, d = L['c'], L['d']
        nrm = np.array([-d[1], d[0]])
        p0, p1 = c + d * t0, c + d * t1
        hw = P['half'] + 1
        x0, x1 = int(max(0, np.floor(min(p0[0], p1[0]) - hw))), int(min(w, np.ceil(max(p0[0], p1[0]) + hw) + 1))
        y0, y1 = int(max(0, np.floor(min(p0[1], p1[1]) - hw))), int(min(h, np.ceil(max(p0[1], p1[1]) + hw) + 1))
        yy, xx = np.mgrid[y0:y1, x0:x1]
        X, Y = xx - c[0], yy - c[1]
        t, s = X * d[0] + Y * d[1], X * nrm[0] + Y * nrm[1]
        se = e[y0:y1, x0:x1]
        m = (np.abs(s) <= P['half']) & (t >= t0 - 0.5) & (t <= t1 + 0.5) & (se >= P['e0']) & ~grid[y0:y1, x0:x1] & \
            (a_pre[y0:y1, x0:x1] < 0.97)
        if not m.any():
            continue
        al = np.clip((se - P['e0']) / (P['e1'] - P['e0']), 0, 1).astype(np.float32)
        lt = light[y0:y1, x0:x1]
        # the line's colour: its part-transparent core (e 0.35 or more) with the key's hue taken out (the keyer's rule
        # for thin features dirty all through), at 80% (the key's light taken off), one colour along the shaft
        core = m & (se >= P['core']) & ~lt
        lc = np.median(hd[y0:y1, x0:x1][core], 0) * P['dark'] if core.sum() >= 3 else None
        sub = a_out[y0:y1, x0:x1]
        up = m & (al > sub)
        a_out[y0:y1, x0:x1] = np.where(up, al, sub)
        own = hd[y0:y1, x0:x1]
        colr = own if lc is None else np.where(lt[..., None], own, lc[None, None, :])
        scol[y0:y1, x0:x1] = np.where(m[..., None], colr, scol[y0:y1, x0:x1])
        smask[y0:y1, x0:x1] |= m
        rec.append(dict(at=[round(float(c[0])), round(float(c[1]))], angle=round(float(np.degrees(np.arctan2(d[1], d[0])) % 180), 1),
                        found=round(L['t1'] - L['t0'], 1), traced=round(t1 - t0, 1), parts=L['parts'], px=int(m.sum()), raised=int(up.sum()),
                        colour='#%02X%02X%02X' % tuple(int(round(v * 255)) for v in (lc if lc is not None else own[m].mean(0)))))
    return a_out, smask, scol, rec


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


def key_flat(im, src, kc):
    """Stage B troops: a sheet whose model ignored the key colour but painted one flat, uniform background (white, grey,
    grey-teal) is keyed against that measured colour instead: alpha from the OKLab distance to it (a soft ramp), allowed
    only in the background region connected to the border (light highlights inside a figure stay opaque), the colour of
    part-transparent edge pixels un-mixed from the background, then bled outward like the key path."""
    import os as _os
    sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', 'tools'))
    from v4color import to_oklab
    h, w, _ = im.shape
    bpx = np.concatenate([im[:6].reshape(-1, 3), im[-6:].reshape(-1, 3), im[:, :6].reshape(-1, 3), im[:, -6:].reshape(-1, 3)])
    bg = np.median(bpx, 0)
    lab = to_oklab(im * 255)
    blab = to_oklab(bg[None, None] * 255)[0, 0]
    d = np.linalg.norm(lab - blab, axis=-1)
    bd = np.linalg.norm(to_oklab(bpx[None] * 255)[0] - blab, axis=-1)
    if np.percentile(bd, 90) > 0.035:
        raise SystemExit(f'the border is neither the {kc} key nor one flat colour (90th pct distance {np.percentile(bd, 90):.3f})')
    lo, hi = 0.04, 0.14
    near = d < hi
    # the background: the part of `near` connected to the border (a flood by repeated dilation inside `near`)
    reg = np.zeros_like(near); reg[:2] = near[:2]; reg[-2:] = near[-2:]; reg[:, :2] |= near[:, :2]; reg[:, -2:] |= near[:, -2:]
    for _ in range(2000):
        g = reg.copy()
        g[1:] |= reg[:-1]; g[:-1] |= reg[1:]; g[:, 1:] |= reg[:, :-1]; g[:, :-1] |= reg[:, 1:]
        g &= near
        if (g == reg).all():
            break
        reg = g
    # enclosed pockets of the background (between an arm and the body, inside a bow): components of pixels within 0.025 of
    # the background colour that are not connected to the border, 12 px or more, are background too
    sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
    from slice import label as _label
    strict = (d < 0.025) & ~reg
    if strict.any():
        lab_ = _label(strict)
        ids, n = np.unique(lab_[lab_ > 0], return_counts=True)
        for i, c in zip(ids, n):
            if c >= 12:
                reg |= lab_ == i
    # the background region grown by 2 px, so the edge ring blended with the background can go part-transparent
    grow = reg.copy()
    for _ in range(2):
        g = grow.copy(); g[1:] |= grow[:-1]; g[:-1] |= grow[1:]; g[:, 1:] |= grow[:, :-1]; g[:, :-1] |= grow[:, 1:]; grow = g
    alpha = np.where(grow, np.clip((d - lo) / (hi - lo), 0, 1), 1.0).astype(np.float32)
    # part-transparent edge pixels take the colour of the opaque paint next to them (as the key path's dirty pixels do;
    # un-mixing by alpha was tried and failed: alpha here is a distance ramp, not coverage)
    # the 2 px ring next to the background was painted blended with it (a light rim on a white sheet): its alpha loses one
    # pixel and its colour is taken from the paint just inside it
    a8 = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
    alpha = np.where(grow, np.minimum(alpha, np.asarray(a8).astype(np.float32) / 255), alpha)
    solid = ((alpha >= 0.97) & ~grow).astype(np.float32)
    rgb = np.where(solid[..., None] > 0, im, bleed(im.astype(np.float32), solid, iters=6)).astype(np.float32)
    rgb = bleed(rgb, alpha)
    vis = alpha > 0.3
    nvis = max(1, int(vis.sum()))
    rep = dict(file=src, key=kc, size=[w, h], keyMeasured='#%02X%02X%02X' % tuple(int(round(v * 255)) for v in bg),
               keyStrengthBg=None, flatBackground=True, opaquePx=int((alpha > 0.99).sum()),
               partialPx=int(((alpha > 0.01) & (alpha <= 0.99)).sum()), spillEdgePct=0.0, keyInUnitPct=0.0, fringePct=0.0,
               edgeDevPct=edge_deviation(rgb, alpha), erode=0)
    return np.dstack([np.clip(rgb, 0, 1), alpha]), rep


def key_image(src, kc, erode=1, shafts=False):
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    h, w, _ = im.shape
    k = strength(im, kc)
    border = np.concatenate([k[:6].ravel(), k[-6:].ravel(), k[:, :6].ravel(), k[:, -6:].ravel()])
    bpx = np.concatenate([im[:6].reshape(-1, 3), im[-6:].reshape(-1, 3), im[:, :6].reshape(-1, 3), im[:, -6:].reshape(-1, 3)])
    kbg = float(np.median(border))
    if kbg < 0.3:
        return key_flat(im, src, kc)
    lo, hi = 0.30 * kbg, 0.70 * kbg  # below lo opaque, above hi transparent, a soft ramp between
    alpha = 1 - np.clip((k - lo) / (hi - lo), 0, 1)
    a_pre = alpha.copy()
    if erode > 0:
        a8 = Image.fromarray((alpha * 255).astype(np.uint8))
        for _ in range(erode):
            a8 = a8.filter(ImageFilter.MinFilter(3))
        eroded = np.asarray(a8).astype(np.float32) / 255
        # the outermost ring goes only where it carries the key (k above 10% of the background's strength):
        # a thin dark spear shaft or staff keeps its untinted core, so weapons 2 to 3 px wide survive
        alpha = np.where(k > 0.10 * kbg, np.minimum(alpha, eroded), alpha)
    srec = None
    if shafts:  # 7: thin key-cast shafts kept whole (after the erosion, so it cannot take them)
        alpha, smask, scol, srec = protect_shafts(im, kc, np.median(bpx, 0), a_pre, alpha, hue_despill)
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
    # stage B calibration fix: a dirty pixel takes its clean neighbours' colour only where the 6-step bleed reached it.
    # A thin feature that is dirty all through (an antler, a staff, a spear shaft, a bow, 2 to 6 px wide) has no clean
    # pixel within reach, and the bleed left it black (0, 0, 0); it now keeps its own paint with the key's hue taken out.
    # (Tried: a 2-step reach, so thin features keep their own paint more often: edgeDevPct rose above the 8% gate.)
    reached = bleed(np.ones_like(rgb), clean.astype(np.float32), iters=6).sum(-1) > 1.5
    rgb = np.where((dirty & reached)[..., None], bleed(rgb, clean.astype(np.float32), iters=6), rgb)
    rgb = np.where((dirty & ~reached)[..., None], hue_despill(rgb, kc), rgb)
    if shafts:  # 7: the kept shafts' colour (their part-transparent edge is bled from it below)
        rgb = np.where(smask[..., None], scol, rgb)
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
    if shafts:
        rep['shafts'] = srec
    return np.dstack([np.clip(rgb, 0, 1), alpha]), rep


if __name__ == '__main__':
    args = sys.argv[1:]
    erode, rj = 1, None
    shafts = '--shafts' in args
    args = [a for a in args if a != '--shafts']
    if '--erode' in args:
        i = args.index('--erode'); erode = int(args[i + 1]); del args[i:i + 2]
    if '--json' in args:
        i = args.index('--json'); rj = args[i + 1]; del args[i:i + 2]
    src, dst, kc = args
    t0 = time.time()
    rgba, rep = key_image(src, kc, erode, shafts)
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(dst)
    rep['ms'] = round((time.time() - t0) * 1000)
    if rj:
        json.dump(rep, open(rj, 'w'), indent=1)
    print(json.dumps(rep))
