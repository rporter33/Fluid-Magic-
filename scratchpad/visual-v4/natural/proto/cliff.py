"""The model's south face: as built (a crop of the start view) against the design's strata-led face, prototyped in numpy at the start zoom.
Stripe index: the share of gradient energy across x (vertical edges) in the face, |d/dx|^2 / (|d/dx|^2 + |d/dy|^2), and the light streaks (columns whose mean L* stands more than 3 above the 9-px running median, per 100 px). Usage: python3 -I cliff.py"""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from natlib import VNoise, hash2, rgb2lab, lab2rgb, hex2rgb
from PIL import Image
O = os.path.join(os.path.dirname(__file__), 'renders') + '/'

def stripe(Lf):
    gx = np.diff(Lf, axis=1)[:-1, :]; gy = np.diff(Lf, axis=0)[:, :-1]; ex, ey = (gx ** 2).sum(), (gy ** 2).sum()
    col = Lf.mean(0); med = np.array([np.median(col[max(0, k - 4):k + 5]) for k in range(len(col))]); streak = (col - med > 3).sum() / len(col) * 100
    return round(float(ex / (ex + ey)), 3), round(float(streak), 1)

def face(width, Hpx, upx, seed='12'):
    """the strata-led face: Hpx tall on screen, upx screen px per mapgen unit"""
    nz = VNoise(seed, 'cliff'); X, Y = np.meshgrid(np.arange(width) / upx, np.arange(Hpx) / upx)  # mapgen units along and down the face
    Hu = Hpx / upx
    top, foot = rgb2lab(hex2rgb('#3A3436')), rgb2lab(hex2rgb('#221E20'))
    t = Y / Hu; L = top[0] + (foot[0] - top[0]) * t; a = top[1] + (foot[1] - top[1]) * t; b = top[2] + (foot[2] - top[2]) * t
    # strata: band boundaries 6 to 13 units apart, bent gently (60-unit waves) and stepped at faults every 80 to 200 units
    fault = np.floor((X + 40 * nz(X / 140, 3.3)) / 130); _, _, fo = hash2(fault, fault * 0, 5)
    yb = Y + 1.6 * nz(X / 60, 7.1) + (fo - 0.5) * 5
    edges = np.cumsum([0] + [6 + 7 * hash2(np.array([k]), np.array([0]), 9)[2][0] for k in range(12)])
    band = np.searchsorted(edges, yb) - 1; _, _, bv = hash2(band, band * 0, 13)
    L = L + (bv - 0.5) * 7.0                                                  # each stratum its own value, +-2.5 L*
    rel = yb - edges[np.clip(band, 0, len(edges) - 1)]
    L = L + 7.0 * np.exp(-rel / 0.5) * (rel >= 0) - 4.5 * np.exp(-np.maximum(0, 1.2 - rel) / 0.6) * (rel < 1.2) * (band > 0) * 0  # the lit ledge on each band's top
    L = L - 5.0 * np.exp(-np.abs(rel - 1.0) / 0.6) * (band > 0) * 0.6        # its shadow just below
    # joints: short vertical cracks inside one stratum, 14 to 40 units apart, each band its own spacing
    _, _, js = hash2(band, band * 0 + 1, 17); sp = 18 + 30 * js; jx = (X + 97 * js + 14 * nz(X / 23 + band * 3.1, 11.0)) / sp; jf = jx - np.floor(jx)
    _, _, jon = hash2(np.floor(jx), band, 19)
    L = L - 6.0 * (np.abs(jf - 0.5) > 0.5 - 0.35 / sp) * (jon > 0.55)
    # broad weathering: low-frequency mottle along the face (no vertical streaks), darker toward the foot
    L = L + 2.5 * nz.fbm(X / 30, Y / 12 + 40, 3) - 3.0 * t ** 2
    lab = np.stack([L, a, b], -1); return np.clip(lab2rgb(lab), 0, 255).astype(np.uint8)

if __name__ == '__main__':
    shot = np.asarray(Image.open(O + 'after-start.png').convert('RGB'))
    # the as-built face in the start view (1440 x 900): rows from the model's south edge down to the plinth, x inside the corners
    y0, y1, x0, x1 = 671, 696, 360, 1030
    before = shot[y0:y1, x0:x1]
    upx = 0.484 * 1.947                       # start view: 0.484 px a world unit, 1.947 world units a mapgen unit
    after = face(x1 - x0, y1 - y0, upx)
    Lb, La = rgb2lab(before.astype(float))[..., 0], rgb2lab(after.astype(float))[..., 0]
    print('as built: stripe index %.3f, light streak columns per 100 px %.1f' % stripe(Lb)); print('strata face: stripe index %.3f, light streak columns per 100 px %.1f' % stripe(La))
    big = face(1340, 2 * (y1 - y0), 2 * upx)
    sheet = np.full((2 * (y1 - y0) * 2 + 30, 1340, 3), 30, np.uint8)
    sheet[:2 * (y1 - y0)] = np.asarray(Image.fromarray(before).resize((1340, 2 * (y1 - y0)), Image.NEAREST)); sheet[2 * (y1 - y0) + 30:] = big
    Image.fromarray(sheet).save(O + 'cliff-before-after.png')
