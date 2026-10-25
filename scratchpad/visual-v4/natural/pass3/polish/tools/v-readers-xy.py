"""The verifier's own terrain reader on rendered land pixels (the land layer: rails, pieces, labels off; water masked out):
square patches of 0.3 D_px wholly inside one province, 12 lightness features of my own choosing, a shrunk linear discriminant,
leave-one-province-out (every province tested by a reader that never saw it). Patches of several views of one zoom are pooled by province.
Also under simulated deutan / protan / tritan (Machado 2009 on linear RGB, the repo's matrices). Usage: python3 -I readers.py name tag [tag ...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
RT = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
MACH = {'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
        'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
        'tritan': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]}

def L_of(rgb, vision):
    if vision == 'normal': return Lstar(rgb)
    l = lin(rgb); s = np.clip(l @ np.array(MACH[vision]).T, 0, 1)
    y = 0.2126729 * s[..., 0] + 0.7151522 * s[..., 1] + 0.072175 * s[..., 2]
    return np.where(y > 216 / 24389, 116 * np.cbrt(y) - 16, 24389 / 27 * y)

def feats(P):
    n = P.shape[0]; mu = P.mean(); sd = P.std() + 1e-6; v = np.sort(P.ravel())
    gx = P[1:-1, 2:] - P[1:-1, :-2]; gy = P[2:, 1:-1] - P[:-2, 1:-1]; g1 = np.hypot(gx, gy).mean()
    H = P[: n // 2 * 2, : n // 2 * 2].reshape(n // 2, 2, n // 2, 2).mean((1, 3)); g2 = np.hypot(H[1:-1, 2:] - H[1:-1, :-2], H[2:, 1:-1] - H[:-2, 1:-1]).mean()
    lap = np.abs(4 * P[1:-1, 1:-1] - P[:-2, 1:-1] - P[2:, 1:-1] - P[1:-1, :-2] - P[1:-1, 2:]).mean()
    jxx, jyy, jxy = (gx * gx).sum(), (gy * gy).sum(), (gx * gy).sum(); coh = np.sqrt((jxx - jyy) ** 2 + 4 * jxy ** 2) / (jxx + jyy + 1e-6)
    d = P - mu
    ac = lambda k: (((d[:, k:] * d[:, :-k]).mean() + (d[k:, :] * d[:-k, :]).mean()) / 2) / sd ** 2
    return [mu, v[int(0.1 * v.size)], v[int(0.9 * v.size)], np.log(sd), (d ** 3).mean() / sd ** 3, np.log(g1 + 1e-3), np.log(g2 + 1e-3), np.log(lap + 1e-3), coh, (d < -6).mean(), (d > 6).mean(), ac(2), ac(4)]

def patches(tag, visions):
    info, L = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']
    meta = L['meta']; pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]; tt = meta[..., 2]
    ok = ((fl & 2) > 0) & ((fl & 4) == 0) & (pid != 255)
    n = int(min(48, max(12, round(0.3 * I['Dpx'])))) * dpr; st = max(4, n // 2)
    d = distmap(pid, maxd=n + 2)
    fog = {p['i']: p['fog'] for p in info['provs']}
    x0, x1, y0, y1 = int(v['l'] * dpr), int(v['r'] * dpr), int(v['t'] * dpr), int(v['b'] * dpr)
    Ls = {vi: L_of(L['land'][..., :3].astype(np.float64), vi) for vi in visions}
    out = []
    for y in range(y0, y1 - n, st):
        for x in range(x0, x1 - n, st):
            q = pid[y:y + n, x:x + n]; i = q[0, 0]
            if i == 255 or not (q == i).all() or not ok[y:y + n, x:x + n].all(): continue
            if d[y + n // 2, x + n // 2] < 0.525 * n: continue  # centre at least about half a patch from the edge
            if ((fl[y:y + n, x:x + n] & 1) > 0).mean() > 0.05: continue  # mostly no water
            out.append({'i': int(i), 't': int(tt[y, x]), 'fog': fog.get(int(i), ''), 'f': {vi: feats(Ls[vi][y:y + n, x:x + n]) for vi in visions}, 'view': tag, 'xy': (x, y), 'dE': int(min(x - x0, x1 - x - n, y - y0, y1 - y - n))})
    return out, n

def lda_fit(X, y, K=7, shrink=0.1):
    mu, sd = X.mean(0), X.std(0) + 1e-9; Z = (X - mu) / sd
    cls = [c for c in range(K) if (y == c).any()]; M = np.array([Z[y == c].mean(0) for c in cls])
    S = sum(((Z[y == c] - M[k]).T @ (Z[y == c] - M[k])) for k, c in enumerate(cls)) / len(Z)
    S = (1 - shrink) * S + shrink * np.diag(np.diag(S)) + 1e-6 * np.eye(len(S)); Si = np.linalg.inv(S)
    Wt = M @ Si; b0 = -0.5 * np.einsum('ij,ij->i', Wt, M)
    return lambda Xt: np.array(cls)[np.argmax(((Xt - mu) / sd) @ Wt.T + b0, 1)]

def run(P, vision, cols=None):
    X = np.array([p['f'][vision] for p in P]); y = np.array([p['t'] for p in P]); prov = np.array([p['i'] for p in P])
    if cols is not None: X = X[:, cols]
    pred = np.zeros(len(P), int)
    for i in np.unique(prov):
        te = prov == i; pred[te] = lda_fit(X[~te], y[~te])(X[te])
    acc = float((pred == y).mean()); provs = np.unique(prov); okp = 0; missed = []
    for i in provs:
        m = prov == i; vote = np.bincount(pred[m], minlength=7).argmax()
        if vote == y[m][0]: okp += 1
        else: missed.append((int(i), RT[y[m][0]], RT[vote]))
    fogs = {}
    for f in set(p['fog'] for p in P):
        m = np.array([p['fog'] == f for p in P]); fogs[f or 'sight'] = round(float((pred[m] == y[m]).mean()), 3)
    return {'patches': len(P), 'patchAcc': round(acc, 3), 'provinces': len(provs), 'provinceAcc': round(okp / len(provs), 3), 'byFog': fogs, 'missed': missed[:8]}

if __name__ == '__main__':
    name, tags = sys.argv[1], sys.argv[2:]; vis = ['normal', 'deutan', 'protan', 'tritan']
    P = []; n = None
    for t in tags:
        pp, n = patches(t, vis); P += pp
    res = {'name': name, 'views': tags, 'patchPx': n}
    for vi in vis:
        res[vi] = {'lightness': run(P, vi), 'texture': run(P, vi, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
    names = {}
    for t in tags[:1]:
        info = json.load(open(DUMP + t + '.json')); names = {p['i']: p['name'] for p in info['provs']}
    for vi in vis:
        for k in ('lightness', 'texture'): res[vi][k]['missed'] = [f'{names.get(i, i)} ({a} read {b})' for i, a, b in res[vi][k]['missed']]
    print(json.dumps(res))
    json.dump(res, open(OUT + f'myreaders-{name}.json', 'w'), indent=1)
