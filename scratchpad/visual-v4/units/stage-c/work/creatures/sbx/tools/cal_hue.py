# Stage B calibration, part 2: the cloth's painted hue. For a set of sliced frame dirs, the OKLCH hue and chroma of the
# figure's chromatic pixels (C >= 0.03), as a chroma-weighted hue histogram, and the side share at 28 px as painted,
# hue-locked (with a given range) and hue-locked with the side keyline.
# Usage: python3 cal_hue.py LABEL:FRAMES_DIR:FIG:VIEW ...
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import oklch  # noqa: E402
import checks  # noqa: E402

UNITS = json.load(open(os.path.join(HERE, '..', 'units.json')))


def pixels(d, fig, view, names=None):
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    px = []
    for f in meta['frames']:
        if f.get('missing') or f['name'] == 'dropped' or (names and f['name'] not in names):
            continue
        im = np.asarray(Image.open(os.path.join(d, f['file'])).convert('RGBA')).astype(np.float64)
        px.append(im[..., :3][im[..., 3] > 200])
    return np.concatenate(px)


def hue_hist(px, step=10):
    L, C, h = oklch(px[None])
    L, C, h = L[0], C[0], h[0]
    m = C >= 0.03
    bins = np.arange(0, 361, step)
    hist, _ = np.histogram(h[m], bins=bins, weights=C[m])
    share = hist / max(1e-9, hist.sum())
    return {int(b): round(float(s), 3) for b, s in zip(bins[:-1], share) if s >= 0.005}, float(m.mean()), np.median(C[m]) if m.any() else 0


if __name__ == '__main__':
    out = {}
    for arg in sys.argv[1:]:
        label, d, fig, view = arg.split(':')
        px = pixels(d, fig, view)
        hh, chroma_share, medC = hue_hist(px)
        out[label] = dict(hist=hh, chromaticShare=round(chroma_share, 3), medianC=round(float(medC), 4))
        print(label, 'chromatic share', round(chroma_share, 3), 'median C', round(float(medC), 4))
        print('   ', ' '.join(f'{k}:{v}' for k, v in hh.items()))
    json.dump(out, open(os.path.join(HERE, '..', '..', 'work', 'hue-hist.json'), 'w'), indent=1)
