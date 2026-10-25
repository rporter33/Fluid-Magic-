# Stage B calibration, part 4b: the edit route's halves against the joint sheet they came from. The three keyed
# sheets share one canvas, so the halves are registered to the joint figure by construction. Per cell:
#   containment: the share of a half's opaque pixels that lie inside the joint figure (1.0 = no drift);
#   recompose:   IoU of (wolf-alone OR rider-alone) against the joint figure;
#   light:       the OKLab lightness of the figure's upper-left half minus its lower-right half (the sun's side), for
#                the joint figure and each half; and the median lightness of the shared pixels, half against joint.
# Also: the recomposed figure over the joint one, cell by cell (review image), and the riderless and dismounted cells.
# Usage: python3 cal_mount_split.py
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_oklab  # noqa: E402
from poses import LAYOUTS  # noqa: E402
CAL = os.path.abspath(os.path.join(HERE, '..', '..'))
W = os.path.join(CAL, 'work')


def load(d):
    im = np.asarray(Image.open(os.path.join(W, d, 'keyed.png')).convert('RGBA')).astype(np.float64)
    return im


def main():
    J, Wo, Ri = load('wr.front.blue.joint'), load('wolfOnly.front.edit.nb21'), load('wolfRiderSeat.front.edit.nb21')
    assert J.shape == Wo.shape == Ri.shape, (J.shape, Wo.shape, Ri.shape)
    cols, rows, _, cells = LAYOUTS['wolfrider']
    H, Wd = J.shape[:2]; cw, ch = Wd / cols, H / rows
    res = {}
    tiles = []
    for i, c in enumerate(cells):
        sl = (slice(int(i // cols * ch), int((i // cols + 1) * ch)), slice(int(i % cols * cw), int((i % cols + 1) * cw)))
        j, w, r = (x[sl] for x in (J, Wo, Ri))
        mj, mw, mr = j[..., 3] > 128, w[..., 3] > 128, r[..., 3] > 128
        rec = mw | mr
        L = to_oklab(j[..., :3])[..., 0]
        ys, xs = np.nonzero(mj)
        cx, cy = xs.mean(), ys.mean()
        yy, xx = np.mgrid[0:mj.shape[0], 0:mj.shape[1]]
        ul = (xx - cx) + (yy - cy) < 0  # the upper-left half, toward the sun

        def light(img, m):
            Lm = to_oklab(img[..., :3])[..., 0]
            a, b = m & ul, m & ~ul
            return round(float(Lm[a].mean() - Lm[b].mean()), 3) if a.any() and b.any() else None

        def shared(img, m):
            s = m & mj
            if s.sum() < 50:
                return None
            return round(float(np.median(to_oklab(img[..., :3])[..., 0][s]) - np.median(L[s])), 3)
        res[c] = dict(containWolf=round(float((mw & mj).sum() / max(1, mw.sum())), 3) if mw.any() else None,
                      containRider=round(float((mr & mj).sum() / max(1, mr.sum())), 3) if mr.any() else None,
                      recomposeIoU=round(float((rec & mj).sum() / max(1, (rec | mj).sum())), 3),
                      lightJoint=light(j, mj), lightWolf=light(w, mw), lightRider=light(r, mr),
                      dLwolf=shared(w, mw), dLrider=shared(r, mr))
        # review tile: joint | wolf alone | rider alone | recomposed (wolf under rider)
        def on(img):
            bg = np.zeros_like(img); bg[..., :3] = (150, 148, 128); bg[..., 3] = 255
            a = img[..., 3:4] / 255
            return np.dstack([img[..., :3] * a + bg[..., :3] * (1 - a), bg[..., 3]])
        comp = on(w)
        a = r[..., 3:4] / 255
        comp[..., :3] = r[..., :3] * a + comp[..., :3] * (1 - a)
        tiles.append((c, np.concatenate([on(j), on(w), on(r), comp], 1)))
    cm = lambda k: [v[k] for v in res.values() if v[k] is not None]
    summ = dict(containWolfMedian=float(np.median(cm('containWolf'))), containRiderMedian=float(np.median(cm('containRider'))),
                recomposeIoUMedian=float(np.median(cm('recomposeIoU'))), lightJointMedian=float(np.median(cm('lightJoint'))),
                lightWolfMedian=float(np.median(cm('lightWolf'))), lightRiderMedian=float(np.median(cm('lightRider'))),
                dLwolfMedian=float(np.median(cm('dLwolf'))), dLriderMedian=float(np.median(cm('dLrider'))))
    print(json.dumps(summ, indent=1))
    json.dump(dict(cells=res, summary=summ), open(os.path.join(W, 'mount-split.json'), 'w'), indent=1)
    sel = [t for t in tiles if t[0] in ('stand', 'lopeA', 'charge', 'bite', 'fall', 'deadA', 'boltA', 'cheer')]
    rows_ = []
    for c, t in sel:
        im = Image.fromarray(np.clip(t, 0, 255).astype(np.uint8), 'RGBA').convert('RGB')
        lab = Image.new('RGB', (im.width, 20), (28, 26, 23)); ImageDraw.Draw(lab).text((4, 4), f'{c}: joint | wolf alone (edit) | rider alone (edit) | recomposed', fill=(230, 225, 210))
        both = Image.new('RGB', (im.width, im.height + 20)); both.paste(lab, (0, 0)); both.paste(im, (0, 20)); rows_.append(both)
    sheet = Image.new('RGB', (rows_[0].width * 2 + 10, sum(r.height for r in rows_[::2]) + 10 * 4), (20, 18, 15))
    y = 0
    for k in range(0, len(rows_), 2):
        sheet.paste(rows_[k], (0, y)); sheet.paste(rows_[k + 1], (rows_[0].width + 10, y)); y += rows_[k].height + 10
    sheet.save(os.path.join(CAL, 'review', 'mount-split-edit.png'))


if __name__ == '__main__':
    main()
