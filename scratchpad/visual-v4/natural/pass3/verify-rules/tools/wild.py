"""The wilds on the verifier's dumps (land layer: rails, pieces, labels off; the wild contour and rim are in it): the peaks' and the mere's lightness against the land,
the light rim's share of the outline (a pixel of L* >= 65 within -2.5..+4 px of the outline, outside positive), the dark ink's share, the mere's water against the map's water.
Usage: python3 -I wild.py tag [tag ...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
PEAKS = {13: 'The Ashspine', 14: 'The Ashspine', 15: 'The Ashspine', 37: 'The Greyteeth', 48: 'The Greyteeth'}; MERE = {39: 'The Still Mere'}

def run(tag):
    info, L = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']; H2, W2 = I['H2'], I['W2']
    meta = L['meta']; pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]
    inm = (fl & 2) > 0; water = (fl & 1) > 0; wild = (fl & 4) > 0
    land = L['land'][..., :3]; Lm = Lstar(land.astype(np.float64))
    vm = np.zeros(pid.shape, bool); vm[int((v['t'] + 4) * dpr):int((v['b'] - 4) * dpr), int((v['l'] + 4) * dpr):int((v['r'] - 4) * dpr)] = True
    d = distmap(pid, maxd=12 * dpr)
    r = {'tag': tag, 'band': I['band'], 'Dpx': round(I['Dpx'], 1)}
    pk = np.isin(pid, list(PEAKS)) & inm & vm & (d >= 4 * dpr); me = np.isin(pid, list(MERE)) & inm & vm & (d >= 4 * dpr)
    pas = inm & vm & ~wild & ~water & (pid != 255)
    q = lambda a, p: round(float(np.percentile(a, p)), 1)
    if pas.any(): r['landL'] = [q(Lm[pas], 5), q(Lm[pas], 50), q(Lm[pas], 95), q(Lm[pas], 99)]
    if pk.any(): r['peaksL'] = [q(Lm[pk], 5), q(Lm[pk], 50), q(Lm[pk], 95), q(Lm[pk], 99)]; r['peaksOverLandP95pct'] = round(float((Lm[pk] > np.percentile(Lm[pas], 95)).mean() * 100), 2)
    if me.any():
        lb = lab(land[me].astype(np.float64)); r['mereLabMean'] = [round(float(x), 1) for x in lb.mean(0)]; r['mereL'] = [q(Lm[me], 5), q(Lm[me], 50), q(Lm[me], 95)]
        wo = water & inm & vm & ~wild
        if wo.sum() > 50: r['mapWaterLabMean'] = [round(float(x), 1) for x in lab(land[wo].astype(np.float64)).mean(0)]
    # the rim along every wild/passable edge, dense
    n = 0; rim = 0; ink = 0; per = {}
    def px(arr, sx, sy):
        X, Y = int(np.floor(sx * dpr)), int(np.floor(sy * dpr))
        if X < 0 or Y < 0 or X >= W2 or Y >= H2: return None
        return arr[Y, X]
    for e in info['edges']:
        if e['type'] != 'wild': continue
        wi = e['i'] if e['i'] in info['wilds'] else e['j']; oi = e['j'] if wi == e['i'] else e['i']
        if oi in info['wilds']: continue
        (ax, ay), (bx, by) = e['a'], e['b']; Ln = np.hypot(bx - ax, by - ay)
        if Ln < 12: continue
        nx, ny = -(by - ay) / Ln, (bx - ax) / Ln
        mx, my = (ax + bx) / 2, (ay + by) / 2
        q8 = px(pid, mx + nx * 8, my + ny * 8)
        if q8 is None: continue
        if q8 != oi: nx, ny = -nx, -ny
        nm = PEAKS.get(wi, MERE.get(wi, str(wi)))
        for s in np.arange(4, Ln - 4, 2):
            sx, sy = ax + (bx - ax) * s / Ln, ay + (by - ay) * s / Ln
            if not (v['l'] + 12 < sx < v['r'] - 12 and v['t'] + 12 < sy < v['b'] - 12): continue
            if px(pid, sx + nx * 8, sy + ny * 8) != oi or not px(inm, sx + nx * 10, sy + ny * 10): continue
            prof = [px(Lm, sx + nx * o, sy + ny * o) for o in np.arange(-2.5, 4.01, 0.5)]
            if any(p_ is None for p_ in prof): continue
            n += 1; hasRim = max(prof) >= 65; hasInk = min(prof) <= 12; rim += hasRim; ink += hasInk
            k = per.setdefault(nm, [0, 0]); k[0] += 1; k[1] += hasRim
    r['outlineSamples'] = n; r['rimShare'] = round(rim / n, 3) if n else None; r['inkShare'] = round(ink / n, 3) if n else None; r['rimShareByWild'] = {k: round(b / a, 3) for k, (a, b) in per.items()}
    return r

if __name__ == '__main__':
    rows = [run(t) for t in sys.argv[1:]]
    for r in rows: print(json.dumps(r))
    json.dump(rows, open(OUT + 'wild-' + str(len(rows)) + '.json', 'w'), indent=1)
