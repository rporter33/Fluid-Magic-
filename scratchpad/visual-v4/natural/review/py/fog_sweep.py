"""Review: natural fog candidates. For each (haze h toward gesso #E8DCC2, desaturation d), (1) the lightness-only reading trained on
in-sight provinces (one fold) and tested on the other fold under that fog; (2) the fog's visibility: mean CIEDE2000 between each
terrain's p10/p50/p90 in-sight ground (natural core texels) and the same under the fog, and against out of sight (25% desaturation)."""
import sys, os, json, numpy as np
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/proto'
sys.path.insert(0, P); sys.path.insert(0, os.path.dirname(__file__))
import classify as C
from natlib import *
from classify_states import grey_eq, mixc, desat, fold_of
BH, BW = C.BH, C.BW
img = np.fromfile(os.path.join(DATA, 'natural.rgba'), np.uint8).reshape(BH, BW, 4)
def de(a, b): return float(np.mean(de2000(rgb2lab(a), rgb2lab(b)))) if 'de2000' in globals() else None
# ground quantiles per terrain from core texels (0.15 D in)
lab = rgb2lab(img[..., :3].astype(np.float64)); core = C.DIST > 0.15
G = {}
for t in C.T:
    msk = core & np.isin(C.ID, [i for i in range(len(C.terr)) if C.terr[i] == t and not C.wild[i]])
    Ls = lab[..., 0][msk]; px = img[..., :3][msk].astype(np.float64); o = np.argsort(Ls)
    G[t] = [px[o[int(q * (len(o) - 1))]] for q in (0.1, 0.5, 0.9)]
import importlib
cands = [(0.04, 0.0), (0.04, 0.25), (0.04, 0.40), (0.06, 0.25), (0.06, 0.40), (0.08, 0.25), (0.10, 0.25)]
out = {}
for h, d in cands:
    fn = lambda x: desat(mixc(x, '#E8DCC2', h), d)
    vis = {t: float(np.mean([de2000(rgb2lab(g), rgb2lab(fn(g))) for g in G[t]])) for t in C.T}
    vso = {t: float(np.mean([de2000(rgb2lab(desat(g, 0.25)), rgb2lab(fn(g))) for g in G[t]])) for t in C.T}
    row = {'dE fog vs in sight': [round(min(vis.values()), 1), round(max(vis.values()), 1)], 'dE fog vs out of sight 25%': [round(min(vso.values()), 1), round(max(vso.values()), 1)]}
    for zn, dpx in [('Far', 50), ('Start', 85), ('Mid', 120)]:
        rgb0, idn, dn = C.screen(img, dpx)
        Xr, yr, pr_ = C.patches(rgb0, idn, dn, dpx, 'normal')[:3]; Xf, yf, pf = C.patches(np.clip(fn(rgb0.astype(np.float64)), 0, 255), idn, dn, dpx, 'normal')[:3]
        f = fold_of(pr_); ok = tot = 0; pv = {}
        for k in (0, 1):
            mod = C.lda_fit(Xr[f != k][:, C.ALL], yr[f != k]); pr = C.lda_pred(mod, Xf[f == k][:, C.ALL]); ok += (pr == yf[f == k]).sum(); tot += (f == k).sum()
            for i in np.unique(pf[f == k]): v = np.bincount(pr[pf[f == k] == i], minlength=7); pv[i] = (int(np.argmax(v)), int(yf[f == k][pf[f == k] == i][0]))
        row[zn] = (round(ok / tot, 3), round(float(np.mean([a == b for a, b in pv.values()])), 3))
    out[f'haze {h} desat {d}'] = row; print(f'haze {h:.2f} desat {d:.2f}', json.dumps(row), flush=True)
json.dump(out, open('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/review/fog-sweep.json', 'w'), indent=1)
