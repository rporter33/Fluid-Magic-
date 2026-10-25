# Texture-only terrain identification: per-province descriptors on mean-subtracted L* (no hue, no mean lightness),
# nearest-centroid with leave-one-out, at each zoom band. Also a separation index for every terrain pair:
# the distance between the two terrains' descriptor centroids in units of their pooled within-terrain spread.
import sys, json, itertools
import numpy as np
exec(open(__file__.replace('texclass.py', 'texstats.py')).read().split("if __name__")[0])
CLIP = [17, 220.3125, 1116, 736]
def orient(L, M):
    gy, gx = np.gradient(L); a = np.degrees(np.arctan2(gy, gx)) % 180; w = np.hypot(gx, gy)
    h = np.histogram(a[M], bins=4, range=(-22.5 + 0, 157.5 + 22.5 - 22.5), weights=w[M])[0]
    return h / max(1e-9, h.sum())
def desc(img, provs, erode):
    im = np.asarray(Image.open(img).convert('RGB')).astype(float); L = lstar(im); H, W = L.shape
    Lc = blur(L, 3.0); Lf = L - Lc; Lb = blur(L, 1.0)
    out = []
    for p in json.load(open(provs)):
        if p['fog'] == 'unexplored': continue
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([tuple(q) for q in p['poly']], fill=255)
        m = m.filter(ImageFilter.MinFilter(2 * erode + 1)); M = np.asarray(m) > 0
        C = np.zeros_like(M); C[int(CLIP[1]):int(CLIP[3]), int(CLIP[0]):int(CLIP[2])] = True; M &= C
        if M.sum() < 200: continue
        v = L[M] - L[M].mean(); med = np.median(v)
        gy, gx = np.gradient(Lb); g = np.hypot(gx, gy)[M]
        Jxx, Jyy, Jxy = (gx[M] ** 2).mean(), (gy[M] ** 2).mean(), (gx[M] * gy[M]).mean(); tr = Jxx + Jyy
        coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / tr if tr > 0 else 0
        o = orient(Lb, M)
        f = [Lc[M].std(), Lf[M].std(), g.mean(), coh, (v < med - 12).mean(), (v > med + 8).mean(), np.percentile(v, 95) - np.percentile(v, 5), o[0], o[2]]
        out.append((p['terrain'], np.array(f, float), p['i']))
    return out
NAMES = ['coarseSD', 'fineSD', 'grad', 'coherence', 'darkMarks', 'lightMarks', 'p95-p5', 'horizEdges', 'vertEdges']
def run(img, provs, erode, label):
    D = desc(img, provs, erode); T = sorted(set(t for t, _, _ in D)); X = np.array([f for _, f, _ in D]); y = [t for t, _, _ in D]
    mu, sd = X.mean(0), X.std(0) + 1e-9; Z = (X - mu) / sd
    ok = 0; conf = {}
    for k in range(len(D)):
        cents = {t: Z[[j for j in range(len(D)) if y[j] == t and j != k]].mean(0) for t in T if sum(1 for j in range(len(D)) if y[j] == t and j != k) > 0}
        pred = min(cents, key=lambda t: np.linalg.norm(Z[k] - cents[t])); ok += pred == y[k]
        if pred != y[k]: conf[(y[k], pred)] = conf.get((y[k], pred), 0) + 1
    sep = {}
    for a, b in itertools.combinations(T, 2):
        A, B = Z[[j for j in range(len(D)) if y[j] == a]], Z[[j for j in range(len(D)) if y[j] == b]]
        pooled = np.sqrt(((A.var(0) * len(A) + B.var(0) * len(B)) / (len(A) + len(B))).mean()) + 1e-9
        sep[f'{a}/{b}'] = float(np.linalg.norm(A.mean(0) - B.mean(0)) / pooled)
    print(f"{label}: {ok}/{len(D)} provinces identified by texture alone (leave-one-out nearest centroid on {len(NAMES)} lightness descriptors); confusions {conf}")
    return {'label': label, 'ok': ok, 'n': len(D), 'conf': {f'{a}->{b}': c for (a, b), c in conf.items()}, 'sep': sep,
            'centroids': {t: dict(zip(NAMES, map(float, X[[j for j in range(len(D)) if y[j] == t]].mean(0)))) for t in T}}
if __name__ == '__main__':
    d = sys.argv[1]; res = {}
    for look in ('v3', 'painted'):
        for vn, er in (('far', 2), ('start', 3), ('near', 5)):
            res[f'{look}-{vn}'] = run(f'{d}/{look}-{vn}-clean.png', f'{d}/{look}-{vn}-provs.json', er, f'{look} {vn}')
    json.dump(res, open(f'{d}/texclass.json', 'w'), indent=1)
    RELAX = ['plains/farmland', 'hills/wasteland', 'mountains/plains', 'swamp/wasteland', 'forest/hills', 'forest/swamp', 'mountains/wasteland', 'hills/swamp']
    print('\nseparation index (centroid distance / pooled within-terrain SD) for the pairs under 20/12, painted:')
    for k in RELAX:
        a, b = k.split('/'); key = k if k in res['painted-start']['sep'] else f'{b}/{a}'
        print(f"  {k:22s} far {res['painted-far']['sep'].get(key, float('nan')):.2f}  start {res['painted-start']['sep'].get(key, float('nan')):.2f}  near {res['painted-near']['sep'].get(key, float('nan')):.2f}")
