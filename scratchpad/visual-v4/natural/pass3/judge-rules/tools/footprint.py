"""Land outside the wilds' cells: each prototype's natural bake against pass 2's, texel by texel (CIE76 on CIELAB), by distance from the wilds' footprint (in D),
by province and terrain, and by sign (darker / lighter / chroma); the approved V2 rule is that no wild material is drawn outside the wild's own cells.
Usage: python3 -I footprint.py proto [...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import lab, OUT
B = OUT + 'bake/'
def load(p):
    info = json.load(open(B + p + '.json')); W, H = info['BW'], info['BH']
    img = np.fromfile(B + p + '-img.bin', np.uint8).reshape(H, W, 4); ids = np.fromfile(B + p + '-id.bin', np.uint8).reshape(H, W); lt = np.fromfile(B + p + '-lt.bin', np.uint8)[:W * H].reshape(H, W)
    return info, img, ids, lt
def chamfer(mask, cap):
    d = np.where(mask, 0, cap).astype(np.int32)
    for _ in range(cap):
        n = d.copy()
        n[1:, :] = np.minimum(n[1:, :], d[:-1, :] + 1); n[:-1, :] = np.minimum(n[:-1, :], d[1:, :] + 1); n[:, 1:] = np.minimum(n[:, 1:], d[:, :-1] + 1); n[:, :-1] = np.minimum(n[:, :-1], d[:, 1:] + 1)
        if (n == d).all(): break
        d = n
    return d
i0, A, ids, lt0 = load('p2'); W, H = i0['BW'], i0['BH']; TX = i0['TX']; D = i0['RLD']; wild = np.isin(ids, i0['wild'])
la = lab(A[..., :3].astype(np.float64)); land = (ids != 255) & ~wild & (A[..., 3] == 255)
cap = int(np.ceil(0.6 * D * TX)); dist = chamfer(wild, cap) / (D * TX)  # in D (4-neighbour, an over-estimate of Euclidean by up to 1.41x)
rows = []
for p in sys.argv[1:]:
    ii, Bm, ids2, lt2 = load(p); assert (ids2 == ids).all()
    lb = lab(Bm[..., :3].astype(np.float64)); de = np.sqrt(((la - lb) ** 2).sum(-1)); dL = lb[..., 0] - la[..., 0]
    dC = np.hypot(lb[..., 1], lb[..., 2]) - np.hypot(la[..., 1], la[..., 2])
    m = land; ch = m & (de > 2)
    r = {'page': p, 'landTexels': int(m.sum()), 'changedOver2': int(ch.sum()), 'over5': int((m & (de > 5)).sum()), 'over10': int((m & (de > 10)).sum()), 'share': round(float(ch.sum() / m.sum()), 4)}
    if ch.any():
        r['maxDistD_over2'] = round(float(dist[ch].max()), 3); r['p95DistD_over2'] = round(float(np.percentile(dist[ch], 95)), 3)
        r['farOver2_beyond0.25D'] = int((ch & (dist > 0.25)).sum())
        r['dE_p50_p90_max'] = [round(float(np.percentile(de[ch], q)), 1) for q in (50, 90)] + [round(float(de[ch].max()), 1)]
        r['darker'] = int((ch & (dL < -2)).sum()); r['lighter'] = int((ch & (dL > 2)).sum()); r['greyer'] = int((ch & (dC < -3)).sum())
        names = ii['names']; terr = ii['terr']; byp = {}
        for i in np.unique(ids[ch]): byp[f"{names[i]}:{terr[i]}"] = int((ch & (ids == i)).sum())
        r['byProvince'] = dict(sorted(byp.items(), key=lambda kv: -kv[1])[:10])
        # far reach: changed texels more than 0.1 D out, how many lighter (relief, rubble) vs darker (shadow)
        f = ch & (dist > 0.1); r['beyond0.1D'] = {'n': int(f.sum()), 'lighter': int((f & (dL > 2)).sum()), 'darker': int((f & (dL < -2)).sum())}
    rows.append(r); print(json.dumps(r))
json.dump(rows, open(OUT + 'footprint.json', 'w'), indent=1)
