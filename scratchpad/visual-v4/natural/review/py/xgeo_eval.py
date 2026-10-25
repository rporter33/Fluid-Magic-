"""Review: train the lightness-only and texture-only readers on one map's natural bake, test on another map (other geometry and terrain layout)."""
import sys, json, numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/proto')
from classify import lda_fit, lda_pred, ALL, TEX
A = np.load(sys.argv[1]); B = np.load(sys.argv[2]); res = {}
def ev(tr, te, cols):
    mod = lda_fit(tr[0][:, cols], tr[1]); pr = lda_pred(mod, te[0][:, cols]); y, p = te[1], te[2]
    pv = [np.argmax(np.bincount(pr[p == i], minlength=7)) == y[p == i][0] for i in np.unique(p)]
    conf = np.zeros((7, 7), int)
    for a, b in zip(y, pr): conf[a, b] += 1
    return round(float((pr == y).mean()), 3), round(float(np.mean(pv)), 3), int(len(pv) - sum(pv)), conf
T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
for zn in ['Far', 'Start', 'Mid', 'ref', 'Near']:
    for vis in ['normal', 'deutan', 'protan', 'tritan']:
        for st in ['raw', 'fog10_25', 'fog6_40']:
            k = f'{zn}|{vis}|{st}'
            if k + '|X' not in B: continue
            tr = (A[f'{zn}|{vis}|raw|X'], A[f'{zn}|{vis}|raw|y']); te = (B[k + '|X'], B[k + '|y'], B[k + '|p'])
            for cn, cols in [('lightness', ALL), ('texture', TEX)]:
                pa, pp, miss, conf = ev(tr, te, cols)
                per = {T[t]: round(conf[t, t] / max(1, conf[t].sum()), 2) for t in range(7)}
                res[f'{k}|{cn}'] = {'patch': pa, 'province': pp, 'provincesMissed': miss, 'perTerrain': per}
                print(f'{zn:5s} {vis:6s} {st:8s} {cn:9s} patch {pa:.3f} province {pp:.3f} missed {miss}  {per}')
json.dump(res, open(sys.argv[3], 'w'), indent=1)
