# Stage B calibration, part 3 (review change 8): Pro sheets at imageSize 2K against the same jobs at 1K.
# Camera (all cells), the stand figure's body height at its source, and the detail left at the game's tiers: the stand
# frame scaled to tier H (112 px) and to a 2x close-zoom (224 px), its mean gradient magnitude (OKLab L) and the
# difference image between the 1K and 2K versions at that size (both scaled from their own sheet).
# Usage: python3 cal_size.py
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pack import premul_resize, body_height  # noqa: E402
CAL = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS_DIR = os.path.abspath(os.path.join(CAL, '..', '..'))
PAIRS = {  # name: (1K checks dir, 2K checks dir, view)
    'front (AD job)': (os.path.join(UNITS_DIR, 'pilot', 'work', 'ad', 'cw.front.g3pro'), os.path.join(CAL, 'work', 'cw.front.2k'), 'front'),
    'back (r3 job)': (os.path.join(UNITS_DIR, 'pilot', 'work', 'r3', 'cw.back.g3pro'), os.path.join(CAL, 'work', 'cw.back.2k'), 'back'),
    'back (r3 job), roll 2': (os.path.join(UNITS_DIR, 'pilot', 'work', 'r3', 'cw.back.g3pro'), os.path.join(CAL, 'work', 'cw.back.2k.b'), 'back'),
}


def stand(d, view):
    fd = os.path.join(d, 'frames')
    meta = json.load(open(os.path.join(fd, f'cinderWarrior.{view}.json')))
    f = next(x for x in meta['frames'] if x['name'] == 'stand')
    return np.asarray(Image.open(os.path.join(fd, f['file'])).convert('RGBA')).astype(np.float64)


def grad(rgba, H):
    bh = body_height(rgba[..., 3] > 0.35 * 255)
    s = premul_resize(rgba, H / bh)
    a = s[..., 3] / 255
    L = (0.2126 * s[..., 0] + 0.7152 * s[..., 1] + 0.0722 * s[..., 2]) / 255
    gy, gx = np.gradient(L)
    m = a > 0.98
    return float(np.hypot(gx, gy)[m].mean()), s


def main():
    out = {}
    tiles = []
    for name, (d1, d2, view) in PAIRS.items():
        r1, r2 = json.load(open(os.path.join(d1, 'checks.json'))), json.load(open(os.path.join(d2, 'checks.json')))
        a, b = stand(d1, view), stand(d2, view)
        res = dict(cells1K=r1['cameraAll']['follow'], cells2K=r2['cameraAll']['follow'],
                   medianIoU1K=r1['cameraAll']['medianIoU'], medianIoU2K=r2['cameraAll']['medianIoU'],
                   standBodyPx1K=body_height(a[..., 3] > 89), standBodyPx2K=body_height(b[..., 3] > 89))
        for H in (112, 224):
            g1, s1 = grad(a, H); g2, s2 = grad(b, H)
            res[f'gradient{H}'] = [round(g1, 4), round(g2, 4)]
            if H == 224:
                tiles.append((name, s1, s2))
        out[name] = res
        print(name, res)
    json.dump(out, open(os.path.join(CAL, 'work', 'size.json'), 'w'), indent=1)
    # review image: the stand frame at 224 px from the 1K and the 2K sheet, and at 112 px x2
    rows = []
    for name, s1, s2 in tiles:
        ims = []
        for s in (s1, s2):
            im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
            bg = Image.new('RGBA', im.size, (150, 148, 128, 255)); bg.alpha_composite(im); ims.append(bg.convert('RGB'))
        w = sum(i.width for i in ims) + 10; h = max(i.height for i in ims)
        row = Image.new('RGB', (w, h), (28, 26, 23)); x = 0
        for i in ims:
            row.paste(i, (x, 0)); x += i.width + 10
        rows.append(row)
    W = sum(r.width for r in rows) + 20 * len(rows); Hh = max(r.height for r in rows)
    sheet = Image.new('RGB', (W, Hh), (28, 26, 23)); x = 0
    for r in rows:
        sheet.paste(r, (x, 0)); x += r.width + 20
    sheet.save(os.path.join(CAL, 'review', 'size-1k-vs-2k-224px.png'))


if __name__ == '__main__':
    main()
