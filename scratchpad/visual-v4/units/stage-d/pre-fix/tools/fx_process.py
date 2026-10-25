# Keys and slices one pilot effect sheet candidate (art plan 7.2): the alpha by the sheet's blend, then one trimmed
# RGBA cut per layout element, with its checks.
#   add   (black ground): premultiplied light. alpha = max(r, g, b) after a curve that drops the dark smoke haze the
#         painter left on the black (it would add a grey veil on the field); colour = rgb / alpha.
#   luma  (grey smoke on black): alpha = a ramp of luminance; colour = the painted grey / alpha, tinted by the game.
#   multiply (white ground): m = rgb; alpha = 1 - min(m); colour = (m - min(m)) / alpha. Drawn with Pixi's multiply blend
#         (premultiplied: dst x (c a + 1 - a) = dst x m) it is exact; with normal blend it is exact for greys.
#   normal (magenta key): units/tools/key.py (measured key, despill, erosion, colour bleed, fringe report).
# Usage: python3 -I fx_process.py RAW.png SHEET OUTDIR
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..', '..', 'tools')))
from fx_layouts import SHEETS, SIZES, SQ  # noqa: E402


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def key_add(im):
    rgb = im.astype(np.float32) / 255
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
    # dark, grey pixels (smoke on the black) fade out; saturated fire keeps its glow down to its faint red edges
    keep = np.clip(smoothstep(0.03, 0.22, mx) * (0.25 + 0.75 * smoothstep(0.12, 0.45, sat)) + smoothstep(0.30, 0.60, mx), 0, 1)
    pm = rgb * keep[..., None]                      # the light actually added
    a = pm.max(-1)
    col = np.where(a[..., None] > 1e-4, pm / np.maximum(a[..., None], 1e-4), 0)
    return np.dstack([np.clip(col, 0, 1), a]), {'bgMeasured': border_rgb(im)}


def key_luma(im):
    rgb = im.astype(np.float32) / 255
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    a = smoothstep(0.035, 0.42, lum)
    # colour: the painted grey brought to full strength where the smoke is thin (its shade, not its opacity)
    col = np.where(a[..., None] > 1e-3, np.clip(rgb / np.maximum(np.maximum(lum, 0.42)[..., None], 1e-3) * 0.85, 0, 1), 0)
    return np.dstack([col, a]), {'bgMeasured': border_rgb(im)}


def key_mul(im):
    m = im.astype(np.float32) / 255
    mn = m.min(-1)
    a = np.clip(1 - mn, 0, 1)
    a = np.where(a < 0.035, 0, a)                   # the generator's white is not exactly white: below 3.5% is ground
    col = np.where(a[..., None] > 1e-4, (m - mn[..., None]) / np.maximum(a[..., None], 1e-4), 0)
    return np.dstack([np.clip(col, 0, 1), a]), {'bgMeasured': border_rgb(im)}


def key_magenta(path):
    from key import key_image
    rgba, rep = key_image(path, 'magenta', 1)
    return rgba.astype(np.float32), rep


def border_rgb(im):
    b = np.concatenate([im[:6].reshape(-1, 3), im[-6:].reshape(-1, 3), im[:, :6].reshape(-1, 3), im[:, -6:].reshape(-1, 3)])
    return '#%02X%02X%02X' % tuple(int(v) for v in np.median(b, 0))


def label(mask):
    """8-connected components by repeated max-propagation of ids (numpy only), as units/tools/slice.py does."""
    from slice import label as _label
    return _label(mask)


def moments(a):
    ys, xs = np.nonzero(a > 0.05)
    if len(xs) < 10: return None
    w = a[ys, xs]
    cx, cy = np.average(xs, weights=w), np.average(ys, weights=w)
    sx2, sy2 = np.average((xs - cx) ** 2, weights=w), np.average((ys - cy) ** 2, weights=w)
    return {'cx': float(cx), 'cy': float(cy), 'aspect': float(np.sqrt(sy2 / max(sx2, 1e-6)))}


def process(raw, sheet, outdir):
    S = SHEETS[sheet]
    im = np.asarray(Image.open(raw).convert('RGB'))
    H, W, _ = im.shape
    if (W, H) != SIZES[S['aspect']]:
        print('note: size', (W, H), 'differs from the layout', SIZES[S['aspect']])
    sx, sy = W / SIZES[S['aspect']][0], H / SIZES[S['aspect']][1]
    if S['blend'] == 'add': rgba, rep = key_add(im)
    elif S['blend'] == 'luma': rgba, rep = key_luma(im)
    elif S['blend'] == 'multiply': rgba, rep = key_mul(im)
    else: rgba, rep = key_magenta(raw)
    a = rgba[..., 3]
    thr = 0.06 if S['blend'] in ('add', 'luma', 'multiply') else 0.30
    lab = label(a > thr)
    ids, counts = np.unique(lab[lab > 0], return_counts=True)
    boxes = [[e['box'][0] * sx, e['box'][1] * sy, e['box'][2] * sx, e['box'][3] * sy] for e in S['els']]
    # each component goes to the element box it overlaps most (by alpha mass), or to the nearest box within 40 px
    owner = {}
    comp_info = {}
    split_n = [0]
    ys_all, xs_all = np.nonzero(lab > 0)
    lab_flat = lab[ys_all, xs_all]
    order = np.argsort(lab_flat)
    lab_sorted = lab_flat[order]
    starts = np.searchsorted(lab_sorted, ids)
    ends = np.searchsorted(lab_sorted, ids, side='right')
    for k, cid in enumerate(ids):
        sel = order[starts[k]:ends[k]]
        ys, xs = ys_all[sel], xs_all[sel]
        mass = a[ys, xs]
        best, bm = None, 0.0
        for i, b in enumerate(boxes):
            inside = (xs >= b[0]) & (xs < b[2]) & (ys >= b[1]) & (ys < b[3])
            m = float(mass[inside].sum())
            if m > bm: best, bm = i, m
        if best is None:
            cxm, cym = xs.mean(), ys.mean()
            dists = [max(b[0] - cxm, 0, cxm - b[2]) + max(b[1] - cym, 0, cym - b[3]) for b in boxes]
            i = int(np.argmin(dists))
            if dists[i] <= 40: best = i
        # a component that spans two or more boxes with real mass in each (two smoke columns joined by a faint halo)
        # is split by box: each pixel goes to the box it lies in, else the nearest box
        shares = []
        for i, b in enumerate(boxes):
            inside = (xs >= b[0]) & (xs < b[2]) & (ys >= b[1]) & (ys < b[3])
            shares.append(float(mass[inside].sum()) / max(float(mass.sum()), 1e-6))
        if sum(1 for q in shares if q >= 0.15) >= 2:
            cand = [i for i, q in enumerate(shares) if q >= 0.15]
            dist = np.stack([np.maximum.reduce([boxes[i][0] - xs, np.zeros_like(xs, dtype=np.float64), xs - boxes[i][2]]) +
                             np.maximum.reduce([boxes[i][1] - ys, np.zeros_like(ys, dtype=np.float64), ys - boxes[i][3]]) for i in cand])
            pick = np.array(cand)[np.argmin(dist, 0)]
            for i in cand:
                nid = int(lab.max()) + 1
                sel_i = pick == i
                lab[ys[sel_i], xs[sel_i]] = nid
                owner[nid] = i
                comp_info[nid] = (i, int(sel_i.sum()), float(mass[sel_i].sum()))
            split_n[0] += 1
            continue
        comp_info[int(cid)] = (best, int(len(xs)), float(mass.sum()))
        if best is not None: owner[int(cid)] = best
    os.makedirs(outdir, exist_ok=True)
    out = {'raw': os.path.abspath(raw), 'sheet': sheet, 'blend': S['blend'], 'size': [W, H], 'key': rep, 'elements': []}
    touch_px = 2
    for i, e in enumerate(S['els']):
        mine = np.isin(lab, [c for c, o in owner.items() if o == i])
        # keep the faint halo around the element's components (alpha below the label threshold) inside a 12 px reach
        grow = mine.copy()
        for _ in range(12):
            g = grow.copy(); g[1:] |= grow[:-1]; g[:-1] |= grow[1:]; g[:, 1:] |= grow[:, :-1]; g[:, :-1] |= grow[:, 1:]; grow = g
        other = (lab > 0) & ~mine
        keep = grow & ~other
        ea = np.where(keep, a, 0)
        ys, xs = np.nonzero(ea > 0.004)
        if len(xs) == 0:
            out['elements'].append({'name': e['name'], 'missing': True}); continue
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        pad = 3
        X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
        cut = rgba[Y0:Y1, X0:X1].copy()
        cut[..., 3] = ea[Y0:Y1, X0:X1]
        cut[..., :3] = np.where(cut[..., 3:4] > 0, cut[..., :3], 0)
        Image.fromarray((np.clip(cut, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(os.path.join(outdir, e['name'] + '.png'))
        b = boxes[i]
        bw, bh = b[2] - b[0], b[3] - b[1]
        mo = moments(cut[..., 3])
        edge = bool((ea[:touch_px] > 0.1).any() or (ea[-touch_px:] > 0.1).any() or (ea[:, :touch_px] > 0.1).any() or (ea[:, -touch_px:] > 0.1).any())
        out['elements'].append({
            'name': e['name'], 'shape': e['shape'], 'cut': [int(X0), int(Y0), int(X1), int(Y1)], 'w': int(X1 - X0), 'h': int(Y1 - Y0),
            'boxFill': [round((x1 - x0) / bw, 2), round((y1 - y0) / bh, 2)], 'components': int(sum(1 for o in owner.values() if o == i)),
            'touchesSheetEdge': edge, 'opaquePx': int((cut[..., 3] > 0.5).sum()), 'aspect': round(mo['aspect'], 3) if mo else None,
        })
    # background left over: alpha outside every element's cut (should be ~0)
    used = np.zeros((H, W), bool)
    for el in out['elements']:
        if el.get('missing'): continue
        X0, Y0, X1, Y1 = el['cut']; used[Y0:Y1, X0:X1] = True
    out['strayAlphaPct'] = round(100 * float((a[~used] > 0.06).mean()), 3)
    out['splitComponents'] = split_n[0]
    out['unownedComponents'] = int(sum(1 for c, (o, n, m) in comp_info.items() if o is None and n >= 30))
    json.dump(out, open(os.path.join(outdir, 'cut.json'), 'w'), indent=1)
    Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(os.path.join(outdir, 'keyed.png'))
    return out


if __name__ == '__main__':
    r = process(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps({k: v for k, v in r.items() if k != 'elements'}))
    for e in r['elements']: print(e)
