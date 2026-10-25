# Per-province texture statistics from a clean screenshot (labels and tokens hidden) and the province polygons (screen px).
# Lightness only (CIE L*, D65, from sRGB), so the numbers do not depend on hue and hold under every color vision deficiency
# up to the small L* shift of the simulation.
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
def lstar(rgb):
    c = rgb / 255.0; lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    Y = 0.2126729 * lin[..., 0] + 0.7151522 * lin[..., 1] + 0.072175 * lin[..., 2]
    return np.where(Y > 216 / 24389, 116 * np.cbrt(Y) - 16, 24389 / 27 * Y)
def blur(a, s):
    r = int(3 * s); k = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2); k /= k.sum()
    p = np.pad(a, r, mode='edge')
    t = np.apply_along_axis(lambda v: np.convolve(v, k, mode='valid'), 1, p)
    return np.apply_along_axis(lambda v: np.convolve(v, k, mode='valid'), 0, t)
def stats(img_path, provs_path, erode=4, clip=None):
    im = np.asarray(Image.open(img_path).convert('RGB')).astype(float); L = lstar(im); H, W = L.shape
    Lc = blur(L, 3.0); Lf = L - Lc
    gy, gx = np.gradient(L)
    out = []
    for p in json.load(open(provs_path)):
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([tuple(q) for q in p['poly']], fill=255)
        m = m.filter(ImageFilter.MinFilter(2 * erode + 1)); M = np.asarray(m) > 0
        if clip: C = np.zeros_like(M); C[int(clip[1]):int(clip[3]), int(clip[0]):int(clip[2])] = True; M &= C
        n = int(M.sum())
        if n < 150: continue
        v = L[M]; gxx, gyy = gx[M], gy[M]
        # structure tensor coherence (0 isotropic .. 1 one orientation), dominant orientation
        Jxx, Jyy, Jxy = (gxx * gxx).mean(), (gyy * gyy).mean(), (gxx * gyy).mean()
        tr = Jxx + Jyy; coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / tr if tr > 0 else 0
        med = np.median(v)
        out.append(dict(i=p['i'], name=p['name'], terrain=p['terrain'], owner=p['owner'], fog=p['fog'], n=n,
            meanL=float(v.mean()), sdL=float(v.std()), grad=float(np.hypot(gxx, gyy).mean()), coh=float(coh),
            dark=float((v < med - 12).mean()), light=float((v > med + 8).mean()), sdC=float(Lc[M].std()), sdF=float(Lf[M].std())))
    return out
if __name__ == '__main__':
    r = stats(sys.argv[1], sys.argv[2], clip=json.loads(sys.argv[4]) if len(sys.argv) > 4 else None)
    json.dump(r, open(sys.argv[3], 'w'))
    by = {}
    for q in r: by.setdefault(q['terrain'], []).append(q)
    for t, a in sorted(by.items()):
        f = lambda k: np.mean([q[k] for q in a])
        print(f"{t:10s} n {len(a):2d} meanL {f('meanL'):5.1f} sdL {f('sdL'):5.2f} coarse {f('sdC'):5.2f} fine {f('sdF'):5.2f} grad {f('grad'):5.2f} coh {f('coh'):.3f} dark {f('dark'):.3f} light {f('light'):.3f}")
