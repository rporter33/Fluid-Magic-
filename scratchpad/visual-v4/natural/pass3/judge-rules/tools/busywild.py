"""pass 3: busyness of the wild cores and their edges, by the verifier's metric (6 CSS px cells, share of neighbouring cells with dL* > 10 / > 20), on the land layer
(rails, pieces, labels off; the wild contour and rim are in it) and on the lines layer for the edge band; fine-detail energy |L - box5(L)| of the peaks' cores over the land's
in the same view; peak L* percentiles. Usage: python3 -I busywild.py tag [tag ...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
PEAKS = {13, 14, 15, 37, 48}; MERE = {39}
def box(a, r):
    k = 2 * r + 1; p = np.pad(a, r, mode='edge'); c = np.cumsum(np.cumsum(p, 0), 1); c = np.pad(c, ((1, 0), (1, 0)))
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
def dil(m, n):
    o = m.copy()
    for _ in range(n): o = o | np.roll(o, 1, 0) | np.roll(o, -1, 0) | np.roll(o, 1, 1) | np.roll(o, -1, 1)
    return o
def run(tag):
    info, L = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']; meta = L['meta']; pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]
    inm = (fl & 2) > 0; water = (fl & 1) > 0; wild = (fl & 4) > 0
    vm = np.zeros(pid.shape, bool); vm[int((v['t'] + 4) * dpr):int((v['b'] - 4) * dpr), int((v['l'] + 4) * dpr):int((v['r'] - 4) * dpr)] = True
    cell = 6 * dpr; k = 1 / cell; land = L['land'][..., :3]; lines = L['lines'][..., :3]
    d = distmap(pid, maxd=int(4 * dpr) + 2)
    g = busy_img(Image.fromarray(np.ascontiguousarray(land)), k); gl = busy_img(Image.fromarray(np.ascontiguousarray(lines)), k)
    r = {'tag': tag, 'band': I['band'], 'Dpx': round(I['Dpx'], 1)}
    def bz(mask, G):
        cm = cellmask(mask, cell); cm = cm[:G.shape[0], :G.shape[1]]
        return busy_pct(G[:cm.shape[0], :cm.shape[1]], cm) + (int(cm.sum()),) if cm.sum() >= 12 else None
    pk = np.isin(pid, list(PEAKS)); me = np.isin(pid, list(MERE))
    r['coreWild'] = bz((d >= 4 * dpr) & wild & inm & vm & ~water, g)
    r['corePeaks'] = bz((d >= 4 * dpr) & pk & inm & vm, g); r['coreMere'] = bz((d >= 4 * dpr) & me & inm & vm, g)
    # the edge band: within 12 CSS px of the wild / passable boundary (both sides), on the lines layer (contour, rim and lines in it)
    bnd = (wild != np.roll(wild, 1, 0)) | (wild != np.roll(wild, 1, 1)); bnd &= inm
    band = dil(bnd, int(12 * dpr)) & inm & vm
    r['edgeBand'] = bz(band, gl); r['edgeBandLand'] = bz(band, g)
    lpm = dil(bnd & pk, int(12 * dpr)) & inm & vm; r['edgePeaks'] = bz(lpm, gl); r['edgeMere'] = bz(dil(bnd & me, int(12 * dpr)) & inm & vm, gl)
    # fine detail on the land layer: |L - box5(L)|, peaks' cores (8 px in) against the passable land (not water, 8 px from any wild)
    Lm = Lstar(land.astype(np.float64)); hf = np.abs(Lm - box(Lm, 2 * dpr))
    pc = (d >= 4 * dpr) & pk & vm & inm; ld = ~dil(wild, int(8 * dpr)) & ~water & inm & vm & (pid != 255)
    if pc.sum() > 200 and ld.sum() > 200: r['fineDetailPeaksOverLand'] = round(float(hf[pc].mean() / hf[ld].mean()), 2); r['fineDetailPeaks'] = round(float(hf[pc].mean()), 2); r['fineDetailLand'] = round(float(hf[ld].mean()), 2)
    mc = (d >= 4 * dpr) & me & vm & inm
    if mc.sum() > 200 and ld.sum() > 200: r['fineDetailMereOverLand'] = round(float(hf[mc].mean() / hf[ld].mean()), 2)
    if pc.sum() > 200: q = lambda p: round(float(np.percentile(Lm[pc], p)), 1); r['peaksL_p5_50_95_99'] = [q(5), q(50), q(95), q(99)]
    return r
if __name__ == '__main__':
    rows = [run(t) for t in sys.argv[1:]]
    for r in rows: print(json.dumps(r))
    json.dump(rows, open(OUT + 'busywild-' + sys.argv[1].split('-')[0] + '-' + str(len(rows)) + '.json', 'w'), indent=1)
