# Slices a keyed sheet into pose frames (art plan section 8.3): connected components per grid cell, a foot
# anchor per frame, a trimmed crop per frame and one JSON per sheet. numpy and Pillow only.
# Usage: python3 -I slice.py KEYED.png FIGURE_ID VIEW OUTDIR      (a grid sheet: the layout comes from units.json)
#        python3 -I slice.py KEYED.png FIGURE_ID VIEW OUTDIR --single ACTION   (a monster cutout: one frame)
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from poses import LAYOUTS  # noqa: E402

LYING = {'deadA', 'deadB', 'dropped', 'mark', 'dead'}
FLYING_LAYOUTS = {'sprite', 'hornet'}
A_MIN = 0.35        # alpha that counts as the figure
SPECK = 30          # components smaller than this are dropped unless they sit near the figure
NEAR = 14           # px: a small component this close to the main one belongs to it (sparks, arrow tips, tassels)


def label(mask, max_iter=4000):
    """Connected components (8-neighbour) by max-propagation of pixel indices; returns int labels, 0 = none."""
    h, w = mask.shape
    lab = np.where(mask, np.arange(1, h * w + 1, dtype=np.int64).reshape(h, w), 0)
    for _ in range(max_iter):
        p = np.pad(lab, 1)
        m = lab.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy or dx:
                    m = np.maximum(m, p[1 + dy:h + 1 + dy, 1 + dx:w + 1 + dx])
        m = np.where(mask, m, 0)
        if np.array_equal(m, lab):
            break
        lab = m
    return lab


def dist_to(mask_a, mask_b, limit):
    """True when some pixel of mask_a lies within `limit` px (Chebyshev) of mask_b."""
    grown = mask_b.copy()
    for _ in range(limit):
        p = np.pad(grown, 1)
        grown = grown | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
        grown = grown | p[:-2, :-2] | p[2:, 2:] | p[:-2, 2:] | p[2:, :-2]
    return bool((mask_a & grown).any())


def frame_from(alpha, x0, y0, x1, y1, cell_box):
    """Components in the window (x0..x1, y0..y1) that belong to the cell; returns a mask in window coords."""
    win = alpha[y0:y1, x0:x1] > A_MIN
    lab = label(win)
    ids, counts = np.unique(lab[lab > 0], return_counts=True)
    if ids.size == 0:
        return None, {}
    cx0, cy0, cx1, cy1 = [v - o for v, o in zip(cell_box, (x0, y0, x0, y0))]
    keep, info = [], []
    for i, n in zip(ids, counts):
        ys, xs = np.nonzero(lab == i)
        inside = ((xs >= cx0) & (xs < cx1) & (ys >= cy0) & (ys < cy1)).mean()
        info.append((int(i), int(n), float(inside)))
    big = max(info, key=lambda t: t[1] * t[2])
    main = lab == big[0]
    flags = {}
    for i, n, inside in info:
        if i == big[0]:
            continue
        m = lab == i
        if inside >= 0.5 and (n >= SPECK or dist_to(m, main, NEAR)):
            keep.append(i)
        elif inside >= 0.5:
            flags['specksDropped'] = flags.get('specksDropped', 0) + 1
    mask = main.copy()
    for i in keep:
        mask |= lab == i
    ys, xs = np.nonzero(mask)
    if xs.min() == 0 or ys.min() == 0 or xs.max() == win.shape[1] - 1 or ys.max() == win.shape[0] - 1:
        flags['touchesWindow'] = True  # the figure runs into a neighbouring cell's area
    flags['parts'] = 1 + len(keep)
    return mask, flags


def anchor_of(mask, kind):
    ys, xs = np.nonzero(mask)
    if kind == 'lying' or kind == 'flying':
        return float(xs.mean()), float(ys.mean()) if kind == 'flying' else float(ys.max() - 0.25 * (ys.max() - ys.min()))
    bottom = ys.max()
    hgt = bottom - ys.min() + 1
    band = ys >= bottom - max(3, int(0.15 * hgt))  # both feet: the ground point is the centre of the lowest 15%
    return float(xs[band].mean()), float(bottom)


def cut(rgba, mask, x0, y0, pad=2):
    ys, xs = np.nonzero(mask)
    bx0, by0, bx1, by1 = xs.min() - pad, ys.min() - pad, xs.max() + 1 + pad, ys.max() + 1 + pad
    H, W = rgba.shape[:2]
    gx0, gy0 = max(0, x0 + bx0), max(0, y0 + by0)
    gx1, gy1 = min(W, x0 + bx1), min(H, y0 + by1)
    crop = rgba[gy0:gy1, gx0:gx1].copy()
    m = np.zeros(crop.shape[:2], bool)
    # the mask may touch its window's edge, so the padded box can start above or left of the window (cmdB resumed run:
    # a negative slice start here once emptied a whole frame): place the window's mask at its offset in the crop
    sy0, sx0 = max(0, gy0 - y0), max(0, gx0 - x0)
    oy, ox = max(0, y0 - gy0), max(0, x0 - gx0)
    mm = mask[sy0:max(sy0, gy1 - y0), sx0:max(sx0, gx1 - x0)]
    hh, ww = min(mm.shape[0], m.shape[0] - oy), min(mm.shape[1], m.shape[1] - ox)
    m[oy:oy + hh, ox:ox + ww] = mm[:hh, :ww]
    # pixels of other cells' figures inside the box are cleared; soft edges of this figure are kept
    near = m.copy()
    for _ in range(2):
        p = np.pad(near, 1)
        near = near | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    crop[..., 3] = np.where(near, crop[..., 3], 0)
    return crop, tuple(int(v) for v in (gx0, gy0, gx1, gy1))


def slice_sheet(path, fig, view, outdir, units):
    u = next(x for x in units['units'] if x['id'] == fig)
    cols, rows, _aspect, cells = LAYOUTS[u['layout']]
    rgba = np.asarray(Image.open(path).convert('RGBA'))
    alpha = rgba[..., 3].astype(np.float32) / 255
    H, W = alpha.shape
    cw, ch = W / cols, H / rows
    os.makedirs(outdir, exist_ok=True)
    frames = []
    for i, name in enumerate(cells):
        c, r = i % cols, i // cols
        cell = (int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch))
        mx, my = int(0.22 * cw), int(0.22 * ch)
        x0, y0, x1, y1 = max(0, cell[0] - mx), max(0, cell[1] - my), min(W, cell[2] + mx), min(H, cell[3] + my)
        mask, flags = frame_from(alpha, x0, y0, x1, y1, cell)
        if mask is None:
            frames.append(dict(name=name, missing=True)); continue
        kind = 'lying' if name in LYING else 'flying' if u['layout'] in FLYING_LAYOUTS and not name.startswith('dead') else 'standing'
        ax, ay = anchor_of(mask, kind)
        crop, box = cut(rgba, mask, x0, y0)
        fn = f'{fig}.{view}.{name}.png'
        Image.fromarray(crop, 'RGBA').save(os.path.join(outdir, fn))
        ys, xs = np.nonzero(mask)
        frames.append(dict(name=name, file=fn, kind=kind, box=list(box), size=[box[2] - box[0], box[3] - box[1]],
                           anchor=[round(x0 + ax - box[0], 1), round(y0 + ay - box[1], 1)],
                           height=int(ys.max() - ys.min() + 1), width=int(xs.max() - xs.min() + 1),
                           area=int(mask.sum()), **flags))
    meta = dict(figure=fig, view=view, sheet=os.path.basename(path), grid=[cols, rows], cell=[cw, ch], frames=frames,
                missing=[f['name'] for f in frames if f.get('missing')],
                overlaps=[f['name'] for f in frames if f.get('touchesWindow')])
    json.dump(meta, open(os.path.join(outdir, f'{fig}.{view}.json'), 'w'), indent=1)
    return meta


def slice_single(path, fig, view, action, outdir):
    rgba = np.asarray(Image.open(path).convert('RGBA'))
    alpha = rgba[..., 3].astype(np.float32) / 255
    H, W = alpha.shape
    # downsample the mask 4x for labelling speed on big cutouts, then take the main component's full-res pixels
    small = alpha[::4, ::4] > A_MIN
    lab = label(small)
    ids, counts = np.unique(lab[lab > 0], return_counts=True)
    main = np.kron(lab == ids[np.argmax(counts)], np.ones((4, 4), bool))[:H, :W]
    grown = main.copy()
    for _ in range(6):
        p = np.pad(grown, 1)
        grown = grown | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    mask = (alpha > A_MIN) & grown
    kind = 'lying' if action == 'dead' else 'flying' if action == 'flight' else 'standing'
    ax, ay = anchor_of(mask, kind)
    os.makedirs(outdir, exist_ok=True)
    crop, box = cut(rgba, mask, 0, 0)
    fn = f'{fig}.{view}.{action}.png'
    Image.fromarray(crop, 'RGBA').save(os.path.join(outdir, fn))
    ys, xs = np.nonzero(mask)
    meta = dict(figure=fig, view=view, action=action, file=fn, kind=kind, box=list(box), anchor=[round(ax - box[0], 1), round(ay - box[1], 1)],
                height=int(ys.max() - ys.min() + 1), width=int(xs.max() - xs.min() + 1), parts=int(ids.size), specks=int(ids.size - 1))
    json.dump(meta, open(os.path.join(outdir, f'{fig}.{view}.{action}.json'), 'w'), indent=1)
    return meta


if __name__ == '__main__':
    args = sys.argv[1:]
    units = json.load(open(os.path.join(HERE, '..', 'units.json')))
    if '--single' in args:
        i = args.index('--single'); action = args[i + 1]; del args[i:i + 2]
        print(json.dumps(slice_single(args[0], args[1], args[2], action, args[3])))
    else:
        m = slice_sheet(args[0], args[1], args[2], args[3], units)
        print(json.dumps(dict(figure=m['figure'], view=m['view'], frames=len(m['frames']), missing=m['missing'], overlaps=m['overlaps'])))
