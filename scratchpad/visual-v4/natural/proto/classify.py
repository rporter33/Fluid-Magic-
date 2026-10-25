"""Can the terrain be told apart without hue? Lightness-only and texture-only classifiers on screen-scale patches of a bake.
The bake is resampled to the screen size a province has at each zoom (D_px), converted to CIELAB L* (normal vision, and L* of the
Machado-simulated image for protan, deutan and tritan), and cut into square patches that lie wholly inside one province.
Features come from L* only. 'lightness' uses all of them; 'texture' drops the patch's mean, p10 and p90 (so value alone cannot do it).
Classifier: linear discriminant (shared covariance), trained and tested on disjoint provinces (two folds, each province tested once),
and across noise seeds (train on one bake, test on a bake made with other noise tables). Patch accuracy and province accuracy
(majority of a province's patches). Usage: python3 -I classify.py [bakes...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from natlib import *
from PIL import Image
T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']; TI = {t: k for k, t in enumerate(T)}
m = load_meta(); BW, BH, TX, D = m['BW'], m['BH'], m['TX'], m['MED_DIAM']; DT = D * TX
ID = load_arr('id', np.uint8, (BH, BW)); terr = m['terr']; cells = m['cells']; wild = m['wild']
OUT = os.path.join(os.path.dirname(__file__), 'renders')

def dist_raster():
    """distance (in D) from each texel to its own province's polygon edges"""
    f = os.path.join(DATA, 'dist.npy')
    if os.path.exists(f): return np.load(f)
    d = np.zeros((BH, BW), np.float32)
    for i, poly in enumerate(cells):
        mask = ID == i
        if not mask.any(): continue
        ys, xs = np.nonzero(mask); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        X, Y = np.meshgrid((np.arange(x0, x1) + 0.5) / TX, (np.arange(y0, y1) + 0.5) / TX); dd = np.full(X.shape, 1e9)
        for k in range(len(poly) - 1):
            ax, ay = poly[k]; bx, by = poly[k + 1]; dx, dy = bx - ax, by - ay; l2 = dx * dx + dy * dy or 1
            t = np.clip(((X - ax) * dx + (Y - ay) * dy) / l2, 0, 1); dd = np.minimum(dd, np.hypot(X - ax - t * dx, Y - ay - t * dy))
        sub = d[y0:y1, x0:x1]; sub[mask[y0:y1, x0:x1]] = (dd / D)[mask[y0:y1, x0:x1]]
    np.save(f, d); return d

DIST = dist_raster()

def screen(img, dpx):
    f = dpx / DT
    rgb = resize_area(img[..., :3].astype(np.float32), f)
    idn = np.asarray(Image.fromarray(ID).resize(rgb.shape[1::-1], Image.NEAREST)); dn = np.asarray(Image.fromarray(DIST).resize(rgb.shape[1::-1], Image.NEAREST))
    return rgb, idn, dn

def feats(Lp):
    mu = Lp.mean(); sd = Lp.std() + 1e-6
    gx = Lp[:, 2:] - Lp[:, :-2]; gy = Lp[2:, :] - Lp[:-2, :]; g1 = np.hypot(gx[1:-1], gy[:, 1:-1])
    h = (Lp[0::2, 0::2] + Lp[1::2, 0::2] + Lp[0::2, 1::2] + Lp[1::2, 1::2]) / 4; g2 = np.hypot((h[:, 2:] - h[:, :-2])[1:-1], (h[2:, :] - h[:-2, :])[:, 1:-1]).mean() if min(h.shape) > 3 else 0
    lap = (4 * Lp[1:-1, 1:-1] - Lp[:-2, 1:-1] - Lp[2:, 1:-1] - Lp[1:-1, :-2] - Lp[1:-1, 2:])
    Jxx = (gx[1:-1] ** 2).mean(); Jyy = (gy[:, 1:-1] ** 2).mean(); Jxy = (gx[1:-1] * gy[:, 1:-1]).mean()
    coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / (Jxx + Jyy + 1e-6)
    z = (Lp - mu)
    ac = lambda k: ((z[:, k:] * z[:, :-k]).mean() + (z[k:, :] * z[:-k, :]).mean()) / 2 / (sd * sd)
    sk = (z ** 3).mean() / sd ** 3
    lumpy = [mu, np.percentile(Lp, 10), np.percentile(Lp, 90)]
    tex = [np.log(sd), sk, np.log(g1.mean() + 1e-3), np.log(g2 + 1e-3), np.log(np.abs(lap).mean() + 1e-3), coh, (z < -6).mean(), (z > 6).mean(), ac(2), ac(4)]
    return lumpy + tex

def patches(rgb, idn, dn, dpx, vision, stride_k=0.5):
    P = int(min(48, max(12, round(0.3 * dpx)))); s = max(4, int(P * stride_k)); need = (0.5 * P * 1.05) / dpx
    L = lin2lab(cvd_lin(s2l(rgb), vision))[..., 0]
    X, y, prov = [], [], []
    for cy in range(P // 2, L.shape[0] - P // 2, s):
        for cx in range(P // 2, L.shape[1] - P // 2, s):
            i = int(idn[cy, cx])
            if i == 255 or wild[i] or dn[cy, cx] < need: continue
            blk = idn[cy - P // 2: cy + P // 2, cx - P // 2: cx + P // 2]
            if (blk != i).any(): continue
            X.append(feats(L[cy - P // 2: cy + P // 2, cx - P // 2: cx + P // 2])); y.append(TI[terr[i]]); prov.append(i)
    return np.array(X), np.array(y), np.array(prov), P

def lda_fit(X, y):
    mu = X.mean(0); sd = X.std(0) + 1e-9; Z = (X - mu) / sd
    cls = np.unique(y); means = np.array([Z[y == c].mean(0) for c in cls]); S = sum(((Z[y == c] - means[k]).T @ (Z[y == c] - means[k])) for k, c in enumerate(cls)) / len(Z)
    Si = np.linalg.pinv(S + 1e-3 * np.eye(S.shape[0])); return (mu, sd, cls, means, Si)

def lda_pred(mod, X):
    mu, sd, cls, means, Si = mod; Z = (X - mu) / sd
    sc = np.stack([Z @ Si @ mk - 0.5 * mk @ Si @ mk for mk in means], 1); return cls[np.argmax(sc, 1)]

def evaluate(Xtr, ytr, Xte, yte, pte, cols):
    mod = lda_fit(Xtr[:, cols], ytr); pr = lda_pred(mod, Xte[:, cols])
    pa = (pr == yte).mean(); conf = np.zeros((7, 7), int)
    for a, b in zip(yte, pr): conf[a, b] += 1
    pv = {}
    for i in np.unique(pte):
        votes = np.bincount(pr[pte == i], minlength=7); pv[i] = (int(np.argmax(votes)), int(yte[pte == i][0]))
    pacc = np.mean([a == b for a, b in pv.values()])
    return pa, pacc, conf, pv

def two_fold(X, y, prov, cols):
    rng = np.random.default_rng(7); provs = np.unique(prov); fold = {}
    for t in range(7):
        ps = [p for p in provs if terr[p] == T[t]]; rng.shuffle(ps)
        for k, p in enumerate(ps): fold[p] = k % 2
    f = np.array([fold[p] for p in prov]); tot_conf = np.zeros((7, 7), int); pv_all = {}; n_ok = 0
    for k in (0, 1):
        tr, te = f != k, f == k
        pa, pacc, conf, pv = evaluate(X[tr], y[tr], X[te], y[te], prov[te], cols); tot_conf += conf; pv_all.update(pv)
    pa = np.trace(tot_conf) / tot_conf.sum(); pacc = np.mean([a == b for a, b in pv_all.values()])
    return pa, pacc, tot_conf, pv_all

LUMPY = [0, 1, 2]; TEX = list(range(3, 13)); ALL = LUMPY + TEX

if __name__ == '__main__':
    bakes = {'natural': os.path.join(DATA, 'natural.rgba'), 'natural-seed99': os.path.join(DATA, 'natural-s99.rgba'), 'clear': os.path.join(DATA, 'clear-img.rgba')}
    imgs = {k: np.fromfile(v, np.uint8).reshape(BH, BW, 4) for k, v in bakes.items() if os.path.exists(v)}
    zooms = [('Far', 50), ('Mid start', 85), ('Mid', 120), ('ref zoom', 200), ('Near', 420)]
    res = {}
    for bk in ['natural', 'clear']:
        for zn, dpx in zooms:
            rgb, idn, dn = screen(imgs[bk], dpx)
            for vis in ['normal', 'deutan', 'protan', 'tritan']:
                X, y, prov, P = patches(rgb, idn, dn, dpx, vis)
                for cn, cols in [('lightness', ALL), ('texture', TEX)]:
                    if vis != 'normal' and cn == 'texture' and bk == 'clear': continue
                    pa, pacc, conf, pv = two_fold(X, y, prov, cols)
                    per = {T[t]: round(conf[t, t] / max(1, conf[t].sum()), 2) for t in range(7)}
                    off = conf.copy(); np.fill_diagonal(off, 0); top = sorted([(off[a, b] + off[b, a], T[a], T[b]) for a in range(7) for b in range(a + 1, 7)], reverse=True)[:3]
                    miss = [f"{m['names'][i]} ({T[b]} as {T[a]})" for i, (a, b) in pv.items() if a != b]
                    res[f'{bk}|{zn}|{vis}|{cn}'] = {'patches': int(len(y)), 'P': P, 'patchAcc': round(float(pa), 3), 'provinceAcc': round(float(pacc), 3), 'perTerrain': per, 'topConfusions': [f'{a}/{b} {n}' for n, a, b in top if n], 'provincesMissed': miss}
                    print(f'{bk:8s} {zn:9s} Dpx {dpx:3d} P {P:2d} {vis:6s} {cn:9s} patches {len(y):5d}  patch acc {pa:.3f}  province acc {pacc:.3f}  per terrain {per}  conf {[f"{a}/{b} {n}" for n, a, b in top if n]}', flush=True)
    # across seeds: train on the natural bake, test on the natural bake made with other noise tables (same map)
    if 'natural-seed99' in imgs:
        for zn, dpx in zooms:
            r1 = screen(imgs['natural'], dpx); r2 = screen(imgs['natural-seed99'], dpx)
            for cn, cols in [('lightness', ALL), ('texture', TEX)]:
                X1, y1, p1, P = patches(*r1, dpx, 'normal'); X2, y2, p2, _ = patches(*r2, dpx, 'normal')
                pa, pacc, conf, pv = evaluate(X1, y1, X2, y2, p2, cols)
                per = {T[t]: round(conf[t, t] / max(1, conf[t].sum()), 2) for t in range(7)}
                res[f'cross-seed|{zn}|normal|{cn}'] = {'patchAcc': round(float(pa), 3), 'provinceAcc': round(float(pacc), 3), 'perTerrain': per}
                print(f'cross-seed {zn:9s} {cn:9s} patch acc {pa:.3f} province acc {pacc:.3f} per terrain {per}', flush=True)
    json.dump(res, open(os.path.join(OUT, 'classify.json'), 'w'), indent=1)
