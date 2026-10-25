# python3 -I metrics.py: the critique's value and flatness measures (review/tools/valstats.py and flat.py, same crops and formulas) on the
# built page's shots (fixes/views/) against the as-built previews (review/preview/painted-asbuilt-*) and the reference.
import json, numpy as np
from PIL import Image, ImageFilter
R = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/'
X = R + 'palette-ab/fixes/'
def lab(a):
    a = a.astype(np.float64) / 255
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = lin @ M.T; xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return 116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])
def boxmean(x, r):
    p = np.pad(x, r, mode='edge'); c = p.cumsum(0).cumsum(1); c = np.pad(c, ((1, 0), (1, 0))); n = 2 * r + 1
    return (c[n:, n:] - c[:-n, n:] - c[n:, :-n] + c[:-n, :-n]) / (n * n)
def flat(im, r=3, th=2.0):
    L = lab(np.asarray(im.convert('RGB')))[0]; m = boxmean(L, r); v = boxmean(L * L, r) - m * m; sd = np.sqrt(np.maximum(v, 0))
    return round(float((sd < th).mean()), 3)
def start(im):
    a = np.asarray(im.convert('RGB')); L, A, B = lab(a); C = np.hypot(A, B); h = (np.degrees(np.arctan2(B, A)) + 360) % 360
    Li = Image.fromarray(np.clip(L * 2.55, 0, 255).astype(np.uint8)); w = im.size[0]
    blur = lambda s: np.asarray(Li.filter(ImageFilter.GaussianBlur(s))).astype(np.float64) / 2.55
    b1, b2 = blur(w / 400), blur(w / 60)
    return dict(warm=round(float(((h > 20) & (h < 100) & (C > 8)).mean() * 100), 1), light_gt80=round(float((L > 80).mean() * 100), 1),
                dark_lt30=round(float((L < 30).mean() * 100), 1), patch_sd=round(float(b2.std()), 2), object_sd=round(float((b1 - b2).std()), 2), meanC=round(float(C.mean()), 1))
SC = (233, 268, 904, 688); ZC = (17, 181, 1060, 737)
rows = {}
for nm, d in [('painted as built', R + 'palette-ab/review/preview/painted-asbuilt'), ('painted fixed (built)', X + 'views/painted-built'),
              ('bright (built; pixel-identical to as built)', X + 'views/bright-built'), ('critique preview: painted fixes', R + 'palette-ab/review/preview/painted-fixes'),
              ('critique preview: bright fixes', R + 'palette-ab/review/preview/bright-fixes')]:
    r = start(Image.open(d + '-start.png').crop(SC))
    for s, n in [('0.957', 'Elmwick'), ('1.4', 'Stagmoor'), ('1.4', 'Halebrook'), ('2.04', 'Redbarrow'), ('2.04', 'Brambarrow'), ('2.04', 'Rookmere')]:
        try: r[f'flat {s} {n}'] = flat(Image.open(f'{d}-{s}-{n}.png').crop(ZC))
        except FileNotFoundError: pass
    rows[nm] = r
ref = Image.open(R + 'handdrawn-design/reference-map.png').convert('RGB')
rows['reference (scaled to 671 px)'] = start(ref.resize((671, round(ref.size[1] * 671 / ref.size[0])), Image.LANCZOS)); rows['reference (scaled to 671 px)']['flat native 1536'] = flat(ref)
for k, v in rows.items(): print(k.ljust(44), json.dumps(v))
json.dump(rows, open(X + 'data/metrics.json', 'w'), indent=1)
