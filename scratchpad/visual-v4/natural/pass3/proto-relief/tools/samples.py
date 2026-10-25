"""Extract colour samples from the verifier's dumps for the repo's colour math (colours.ts): province core means, rail profiles,
hairline and internal-keyline profiles, wild rim profiles, passable-land colours for the snow rule, hamlet and hut pixels.
Usage: python3 -I samples.py tag [tag ...]  ->  out/samples/<tag>.json"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
RT = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
os.makedirs(OUT + 'samples', exist_ok=True)
DENSE = os.environ.get('DENSE') == '1'

def lab2rgb(Lab):
    L, a, b = Lab; fy = (L + 16) / 116; fx = fy + a / 500; fz = fy - b / 200
    finv = lambda t: t ** 3 if t ** 3 > 216 / 24389 else (116 * t - 16) / (24389 / 27)
    X, Y, Z = finv(fx) * 0.95047, finv(fy), finv(fz) * 1.08883
    r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z; g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z; bb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
    enc = lambda c: 255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055)
    return [int(round(min(255, max(0, enc(c))))) for c in (r, g, bb)]

def run(tag):
    info, Ls = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']; H2, W2 = I['H2'], I['W2']
    meta = Ls['meta']; pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]; tt = meta[..., 2]
    inm = (fl & 2) > 0; water = (fl & 1) > 0; wild = (fl & 4) > 0
    land, lines, full = Ls['land'][..., :3], Ls['lines'][..., :3], Ls['full'][..., :3]
    P = {p['i']: p for p in info['provs']}
    out = {'tag': tag, 'info': I}
    def px(arr, sx, sy):
        X, Y = int(np.floor(sx * dpr)), int(np.floor(sy * dpr))
        if X < 0 or Y < 0 or X >= W2 or Y >= H2: return None
        return arr[Y, X]
    inview = lambda sx, sy, m=10: v['l'] + m < sx < v['r'] - m and v['t'] + m < sy < v['b'] - m
    # 1. province core means (rails, pieces, labels off; pure core beyond 0.06 D; off the water), provinces wholly in the canvas
    d = distmap(pid, maxd=int(0.15 * I['Dpx'] * dpr) + 2); core = (d >= 0.06 * I['Dpx'] * dpr) & inm & ~water & ~wild & (pid != 255); core15 = core & (d >= 0.15 * I['Dpx'] * dpr)
    rows = []
    for i, p in P.items():
        if p['wild']: continue
        bb = p['bb']
        if bb[0] < 0 or bb[1] < 0 or bb[2] > W2 / dpr or bb[3] > H2 / dpr: continue
        m = core & (pid == i)
        if m.sum() < 40: continue
        lb = lab(land[m].astype(np.float64)).mean(0); li = lin(land[m].astype(np.float64)).mean(0)
        enc = lambda c: int(round(255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055)))
        m15 = core15 & (pid == i); lb15 = lab(land[m15].astype(np.float64)).mean(0) if m15.sum() >= 40 else lb
        rows.append({'i': i, 'name': p['name'], 'terrain': p['terrain'], 'fog': p['fog'], 'owner': p['owner'], 'n': int(m.sum()), 'n15': int(m15.sum()), 'labMean': hexs([lab2rgb(lb)])[0], 'linMean': '#%02X%02X%02X' % tuple(enc(c) for c in li), 'labMean15': hexs([lab2rgb(lb15)])[0]})
    out['cores'] = rows
    # 2. rail profiles along realm edges: from the edge 0 to 11 px into the owner's province, lines layer and land layer
    rails = []
    for e in info['realmEdges']:
        if e['fog'] or e['len'] < 24: continue
        nseg = max(1, int(e['len'] // 30))
        for k in range(nseg + 1):
            t = 0.2 + 0.6 * k / nseg; sx = e['a'][0] + (e['b'][0] - e['a'][0]) * t; sy = e['a'][1] + (e['b'][1] - e['a'][1]) * t
            if not inview(sx, sy, 12) or sy < 95: continue
            prof, lp, ok = [], [], True
            for o in np.arange(0, 11.01, 0.5):
                qx, qy = sx + e['nx'] * o, sy + e['ny'] * o; a = px(lines, qx, qy); b = px(land, qx, qy)
                if a is None: ok = False; break
                prof.append(a); lp.append(b)
            if not ok: continue
            gx, gy = sx + e['nx'] * 9, sy + e['ny'] * 9; gi = pid[int(gy * dpr), int(gx * dpr)]
            if gi != e['i'] or not inm[int(gy * dpr), int(gx * dpr)]: continue
            rails.append({'i': e['i'], 'j': e['j'], 'owner': e['owner'], 'terrain': P[e['i']]['terrain'], 'prof': hexs(prof), 'land': hexs(lp)})
    out['rails'] = rails
    # 3. hairlines (neutral edges) and internal keylines (one owner on both sides): profiles across the edge, lower-right normal
    hl = []
    for e in info['edges']:
        if e['type'] not in ('neutral', 'internal'): continue
        (ax, ay), (bx, by) = e['a'], e['b']; Ln = np.hypot(bx - ax, by - ay)
        if Ln * 1 < 18: continue
        nx, ny = -(by - ay) / Ln, (bx - ax) / Ln
        if nx + ny < 0: nx, ny = -nx, -ny
        for t in (np.arange(3, Ln - 3, 2) / Ln if DENSE else (0.25, 0.5, 0.75)):
            sx, sy = ax + (bx - ax) * t, ay + (by - ay) * t
            if not inview(sx, sy, 10): continue
            pl, pn, ok = [], [], True
            for o in np.arange(-7, 7.01, 0.5):
                a = px(lines, sx + nx * o, sy + ny * o); b = px(land, sx + nx * o, sy + ny * o)
                if a is None: ok = False; break
                pl.append(a); pn.append(b)
            if not ok: continue
            lr = pid[int((sy + ny * 5) * dpr), int((sx + nx * 5) * dpr)]; ul = pid[int((sy - ny * 5) * dpr), int((sx - nx * 5) * dpr)]
            T = lambda q: P[q]['terrain'] if q in P else '?'
            hl.append({'t': round(float(t), 3), 'type': e['type'], 'i': e['i'], 'j': e['j'], 'fog': [e['fogI'], e['fogJ']], 'lrT': T(lr), 'ulT': T(ul), 'lines': hexs(pl), 'land': hexs(pn)})
    out['hair'] = hl
    # 4. wild rims: across each edge between a wild and a passable province; W inside the wild, G outside (6 to 9 px), the profile between
    wr = []
    for e in info['edges']:
        if e['type'] != 'wild': continue
        wi = e['i'] if P.get(e['i'], {}).get('wild') or e['i'] in info['wilds'] else e['j']; oi = e['j'] if wi == e['i'] else e['i']
        if oi in info['wilds']: continue
        (ax, ay), (bx, by) = e['a'], e['b']; Ln = np.hypot(bx - ax, by - ay)
        if Ln < 18: continue
        nx, ny = -(by - ay) / Ln, (bx - ax) / Ln
        for t in (0.3, 0.5, 0.7):
            sx, sy = ax + (bx - ax) * t, ay + (by - ay) * t
            if not inview(sx, sy, 14): continue
            # orient so +o goes into the passable province
            q = pid[int((sy + ny * 8) * dpr), int((sx + nx * 8) * dpr)]
            s = 1 if q == oi else -1 if pid[int((sy - ny * 8) * dpr), int((sx - nx * 8) * dpr)] == oi else 0
            if not s: continue
            prof = [px(lines, sx + s * nx * o, sy + s * ny * o) for o in np.arange(-10, 10.01, 0.5)]
            if any(p_ is None for p_ in prof): continue
            wr.append({'wild': wi, 'prov': oi, 'terrain': P[oi]['terrain'] if oi in P else '?', 'fog': P[oi]['fog'] if oi in P else '', 'prof': hexs(prof)})
    out['wildRims'] = wr
    # 5. passable land colours (land layer) for the snow rule, unique with counts by terrain, 3 px clear of the model edge
    er = np.ones(inm.shape, bool); m3 = inm.copy()
    for _ in range(3 * dpr): m3 = m3 & np.roll(m3, 1, 0) & np.roll(m3, -1, 0) & np.roll(m3, 1, 1) & np.roll(m3, -1, 1)
    pas = m3 & ~wild & ~water & (pid != 255)
    snow = {}
    for t in range(7):
        m = pas & (tt == t)
        if not m.any(): continue
        c = land[m].astype(np.uint32); key = (c[:, 0] << 16) | (c[:, 1] << 8) | c[:, 2]; u, n = np.unique(key, return_counts=True)
        snow[RT[t]] = {'hex': ['#%06X' % k for k in u], 'n': n.tolist()}
    out['snow'] = snow
    # 6. hamlets and huts: pixels the pieces layer changed (full vs lines), lighter than beneath
    seats = []
    for s in info['seats']:
        if s['kind'] not in ('hamlet', 'hut', 'town'): continue
        b = s['box']; X0, Y0, X1, Y1 = int((b[0] - 2) * dpr), int((b[1] - 2) * dpr), int((b[2] + 2) * dpr), int((b[3] + 2) * dpr)
        if X0 < 0 or Y0 < 0 or X1 >= W2 or Y1 >= H2: continue
        A = full[Y0:Y1, X0:X1].reshape(-1, 3); B = lines[Y0:Y1, X0:X1].reshape(-1, 3); ch = (A != B).any(1)
        if ch.sum() < 6: continue
        LA, LB = Lstar(A[ch].astype(np.float64)), Lstar(B[ch].astype(np.float64)); up = LA > LB
        seats.append({'i': s['i'], 'name': P[s['i']]['name'] if s['i'] in P else str(s['i']), 'kind': s['kind'], 'on': hexs(A[ch][up]), 'off': hexs(B[ch][up])})
    out['seats'] = seats
    json.dump(out, open(OUT + 'samples/' + tag + '.json', 'w'))
    print(tag, 'cores', len(rows), 'rails', len(rails), 'hair', len(hl), 'wildRims', len(wr), 'snowColours', sum(len(s['hex']) for s in snow.values()), 'seats', len(seats))

if __name__ == '__main__':
    for t in sys.argv[1:]: run(t)
