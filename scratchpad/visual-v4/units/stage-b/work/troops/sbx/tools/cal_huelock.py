# Stage B calibration, part 2 (review change 9): the Thornwood cloth hue range, set from the approved Warden sheet, with
# a mask proof. The lock is ad_huelock.py's (hue to the nation's, chroma held in [0.6, 1.0] x the cloth's, painted
# lightness kept, the mask opened by 3 px), with the selection made explicit:
#   band A: hue in [lo, hi] and chroma >= 0.03 (soft to 0.05), the AD's rule, with the range set from the sheet;
#   band B: hue within +-W of the nation's cloth hue and chroma >= 0.015 (soft to 0.025): cloth the generator painted on
#           the right hue but too grey (the Longbow Hunter with the "fir needles in shade" wording: C 0.024 at hue 173).
# Usage: python3 cal_huelock.py   (writes ../../work/huelock.json and ../../review/huelock-*.png)
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import oklch, to_oklab  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402
import checks  # noqa: E402
from ad_measures import tinted_keyline, SHADE  # noqa: E402
from cal_hue import pixels  # noqa: E402

CAL = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS_DIR = os.path.abspath(os.path.join(CAL, '..', '..'))
CLOTH = '#1F6A50'
_, _cc, _ch = oklch(np.array([[[0x1F, 0x6A, 0x50]]], np.float64))
CC, CH = float(_cc[0, 0]), float(_ch[0, 0])


def mask(rgba, lo, hi, band_b=None, open_px=3, floor=0.03):
    _, C, h = oklch(rgba[..., :3])
    wa = ((h >= lo) & (h <= hi)) * np.clip((C - floor) / 0.02, 0, 1)
    w = wa
    if band_b:
        dh = np.abs((h - CH + 180) % 360 - 180)
        wb = (dh <= band_b) * np.clip((C - 0.015) / 0.01, 0, 1)
        w = np.maximum(wa, wb)
    w = w * (rgba[..., 3] > 128)
    m = Image.fromarray((w * 255).astype(np.uint8))
    k = 2 * open_px + 1
    m = np.asarray(m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))).astype(np.float64) / 255
    return np.minimum(w, m)


def lock(rgba, w):
    lab = to_oklab(rgba[..., :3])
    Cn = np.hypot(lab[..., 1], lab[..., 2])
    newC = np.clip(Cn, 0.6 * CC, 1.0 * CC)
    hc = np.radians(CH)
    a2, b2 = newC * np.cos(hc), newC * np.sin(hc)
    lab2 = np.dstack([lab[..., 0], lab[..., 1] + w * (a2 - lab[..., 1]), lab[..., 2] + w * (b2 - lab[..., 2])])
    out = rgba.copy(); out[..., :3] = oklab_to_srgb(lab2)
    return out


def side(rgba, f, kl=None):
    old = checks.keyline
    if kl:
        checks.keyline = kl
    r = checks.side_report(rgba, f['anchor'], f['height'], CLOTH, 'heavy')
    checks.keyline = old
    return r['share'], min(r[g]['below'] for g in checks.GROUNDS)


def range_from(d, fig, view):
    """The Warden sheet's chroma-weighted hue histogram (C >= 0.03, 5 degree bins): the cloth peak, the valley between
    the warm browns (bark, leather, skin) and the cloth, and the cloth's spread."""
    px = pixels(d, fig, view)
    L, C, h = [x[0] for x in oklch(px[None])]
    m = C >= 0.03
    bins = np.arange(0, 361, 5)
    hist, _ = np.histogram(h[m], bins=bins, weights=C[m])
    sm = np.convolve(hist, np.ones(3) / 3, mode='same')
    warm = int(np.argmax(sm[(bins[:-1] >= 30) & (bins[:-1] < 90)])) + 6      # warm peak, 30-90
    cool = int(np.argmax(sm[(bins[:-1] >= 95) & (bins[:-1] < 230)])) + 19    # cloth peak, 95-230
    valley = warm + int(np.argmin(sm[warm:cool]))
    cloth = m & (h >= bins[valley])
    q = np.percentile(h[cloth], [1, 50, 99])
    return dict(warmPeak=int(bins[warm]), clothPeak=int(bins[cool]), valley=int(bins[valley]),
                clothHueP1=round(float(q[0]), 1), clothHueMedian=round(float(q[1]), 1), clothHueP99=round(float(q[2]), 1),
                hist={int(b): round(float(x / hist.sum()), 4) for b, x in zip(bins[:-1], hist) if x / hist.sum() >= 0.003})


def proof(rows, out):
    tiles = []
    for label, rgba, w, locked in rows:
        def on(im):
            bg = np.zeros_like(im); bg[..., :3] = (150, 148, 128); bg[..., 3] = 255
            a = im[..., 3:4] / 255
            return np.dstack([im[..., :3] * a + bg[..., :3] * (1 - a), bg[..., 3]])
        g = on(rgba)
        ov = g.copy()
        grey = ov[..., :3].mean(-1, keepdims=True)
        sel = (w > 0.5)[..., None]
        ov[..., :3] = np.where(sel, np.array([255, 0, 200.]), grey * 0.6 + 60)
        ov[..., :3] = np.where((rgba[..., 3] < 128)[..., None], g[..., :3], ov[..., :3])
        trip = np.concatenate([g, ov, on(locked)], 1)
        im = Image.fromarray(np.clip(trip, 0, 255).astype(np.uint8), 'RGBA').convert('RGB')
        im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
        t = Image.new('RGB', (max(im.width, 420), im.height + 24), (28, 26, 23))
        ImageDraw.Draw(t).text((6, 5), label, fill=(235, 230, 215)); t.paste(im, (0, 24)); tiles.append(t)
    Wd = sum(t.width for t in tiles) + 8 * len(tiles); Hh = max(t.height for t in tiles)
    sheet = Image.new('RGB', (Wd, Hh), (20, 18, 15)); x = 0
    for t in tiles:
        sheet.paste(t, (x, 0)); x += t.width + 8
    sheet.save(out)


def main():
    W = os.path.join(UNITS_DIR, 'pilot', 'ad', 'frames')
    sheets = {'warden (approved, Pro)': (os.path.join(W, 'warden.front'), 'warden'),
              'warden hex edit (teal)': (os.path.join(W, 'warden.front.rs'), 'warden'),
              'hunter r1 (fir needles in shade)': (os.path.join(CAL, 'work', 'longbowHunter.front.green', 'frames'), 'longbowHunter'),
              'hunter r2 (bottle green)': (os.path.join(CAL, 'work', 'longbowHunter.front.green.r2', 'frames'), 'longbowHunter')}
    rng = range_from(*sheets['warden (approved, Pro)'], 'front')
    lo, hi = rng['valley'], 230.0
    print('range from the Warden sheet:', {k: v for k, v in rng.items() if k != 'hist'})
    rules = {'AD (85-225)': dict(lo=85, hi=225, band_b=None), f'set ({lo}-{int(hi)})': dict(lo=lo, hi=hi, band_b=None),
             f'set, chroma floor 0.02': dict(lo=lo, hi=hi, band_b=None, floor=0.02),
             f'set, floor 0.02 + grey band (+-25 at C>=0.015)': dict(lo=lo, hi=hi, band_b=25, floor=0.02)}
    res = dict(range=rng, rules={k: v for k, v in rules.items()}, sheets={})
    kl = tinted_keyline(SHADE['thornwood'])
    for name, (d, fig) in sheets.items():
        meta = json.load(open(os.path.join(d, f'{fig}.front.json')))
        st = next(f for f in meta['frames'] if f['name'] == 'stand')
        rgba = checks.load(os.path.join(d, st['file']))
        r = dict(painted=side(rgba, st), paintedKl=side(rgba, st, kl))
        prow = []
        for rn, ru in rules.items():
            w = mask(rgba, ru['lo'], ru['hi'], ru['band_b'], floor=ru.get('floor', 0.03))
            lk = lock(rgba, w)
            r[rn] = dict(maskShare=round(float((w > 0.5).sum() / max(1, (rgba[..., 3] > 128).sum())), 3),
                         side=side(lk, st), sideKl=side(lk, st, kl))
            prow.append((f'{name}: {rn}', rgba, w, lk))
        res['sheets'][name] = r
        proof(prow, os.path.join(CAL, 'review', 'huelock-' + name.split(' ')[0] + ('-' + name.split(' ')[1] if 'r' in name.split(' ')[1][:2] or 'hex' in name else '') + '.png'))
        print(name, json.dumps(r))
    # the mask on more frames of the approved sheet, with the chosen rule
    d, fig = sheets['warden (approved, Pro)']
    meta = json.load(open(os.path.join(d, f'{fig}.front.json')))
    rows = []
    for n in ('idle2', 'strike', 'recoil', 'deadA', 'fleeA', 'cheer'):
        f = next(x for x in meta['frames'] if x['name'] == n)
        rgba = checks.load(os.path.join(d, f['file']))
        w = mask(rgba, lo, hi, 25, floor=0.02)
        rows.append((n, rgba, w, lock(rgba, w)))
    proof(rows, os.path.join(CAL, 'review', 'huelock-warden-frames.png'))
    json.dump(res, open(os.path.join(CAL, 'work', 'huelock.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
