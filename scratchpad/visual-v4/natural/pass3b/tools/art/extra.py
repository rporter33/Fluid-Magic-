"""Final verifier's extra art measures on the layer dumps (land layer), for the fix report's claims:
 - Greyteeth: rock share of the cell's inner width per row (rock = C* < 8, pixels more than 6 px inside the outline), and enclosed land hollows inside the rock
 - Still Mere: share of outline samples whose water begins within 8 px of the outline (the shore at the ink), and the median water start
 - each wild: share of outline samples with a light inner line (judge's measure) split by whether the land outside is dark (L* < 35)
Usage: python3 -I extra.py <key> <view> [<view> ...]"""
import sys, json, numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/verify/tools')
from vlib import lab, distmap
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3b/out/art/dump/'
WILD = {13: 'ash', 14: 'ash', 15: 'ash', 37: 'grey', 48: 'grey', 39: 'mere'}
def label4(m):
    H, W = m.shape; lab_ = np.zeros((H, W), np.int32); n = 0; idx = np.argwhere(m)
    for y0, x0 in idx:
        if lab_[y0, x0]: continue
        n += 1; st = [(y0, x0)]; lab_[y0, x0] = n
        while st:
            y, x = st.pop()
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab_[yy, xx]: lab_[yy, xx] = n; st.append((yy, xx))
    return lab_, n
def load(tag):
    info = json.load(open(D + tag + '.json')); W2, H2 = info['info']['W2'], info['info']['H2']
    rd = lambda k: np.fromfile(D + f'{tag}-{k}.bin', np.uint8).reshape(H2, W2, 4)
    return info, rd('land'), rd('meta')
def run(tag):
    info, land, meta = load(tag); I = info['info']; v = I['view']; H2, W2 = I['H2'], I['W2']
    pid = meta[..., 0].astype(np.int32); LB = lab(land[..., :3].astype(np.float64)); L = LB[..., 0]; C = np.hypot(LB[..., 1], LB[..., 2])
    vm = np.zeros(pid.shape, bool); vm[int(v['t'] + 4):int(v['b'] - 4), int(v['l'] + 4):int(v['r'] - 4)] = True
    out = {'tag': tag, 'Dpx': round(I['Dpx'], 1)}
    ids = pid.copy(); ids[np.isin(pid, [37, 48])] = 1000; grey = ids == 1000; dg = distmap(ids, maxd=12); inner = grey & (dg > 6) & vm
    if inner.sum() > 2000:
        rock = inner & (C < 8)
        rows = [(rock[y].sum() / inner[y].sum()) for y in range(H2) if inner[y].sum() >= 20]
        out['greyRockShareOfInner'] = round(float(rock.sum() / inner.sum()), 3)
        out['greyRowRockShare_p10_p50_p90'] = [round(float(np.percentile(rows, q)), 3) for q in (10, 50, 90)]
        out['greyRowsUnder70pct'] = round(float(np.mean(np.array(rows) < 0.7)), 3)
        land_in = inner & ~rock; edge = grey & (dg <= 8); lab_, n = label4(land_in)
        near_edge = edge.copy()
        for _ in range(2): near_edge = near_edge | np.roll(near_edge, 1, 0) | np.roll(near_edge, -1, 0) | np.roll(near_edge, 1, 1) | np.roll(near_edge, -1, 1)
        touching = set(np.unique(lab_[near_edge & land_in]).tolist())
        sizes = np.bincount(lab_.ravel(), minlength=n + 1)
        holes = [int(sizes[k]) for k in range(1, n + 1) if k not in touching]
        big = [h for h in holes if h >= (0.02 * I['Dpx']) ** 2 * 4]
        out['greyEnclosedHollows'] = {'count': len(big), 'areas_px': sorted(big, reverse=True)[:6], 'minArea_px': round((0.02 * I['Dpx']) ** 2 * 4)}
    mere = pid == 39
    acc = {}
    for e in info['edges']:
        if e['type'] != 'wild': continue
        wi = e['i'] if e['i'] in info['wilds'] else e['j']; oi = e['j'] if wi == e['i'] else e['i']
        if oi in info['wilds']: continue
        (ax, ay), (bx, by) = e['a'], e['b']; Ln = np.hypot(bx - ax, by - ay)
        if Ln < 12: continue
        nx, ny = -(by - ay) / Ln, (bx - ax) / Ln; mx, my = (ax + bx) / 2, (ay + by) / 2
        X, Y = int(mx + nx * 8), int(my + ny * 8)
        if not (0 <= X < W2 and 0 <= Y < H2): continue
        if pid[Y, X] != oi: nx, ny = -nx, -ny
        k = WILD.get(wi); a = acc.setdefault(k, {'n': 0, 'w8': 0, 'start': [], 'dark': 0, 'darkLight': 0, 'lightLight': 0})
        for s in np.arange(5, Ln - 5, 2):
            sx, sy = ax + (bx - ax) * s / Ln, ay + (by - ay) * s / Ln
            if not (v['l'] + 14 < sx < v['r'] - 14 and v['t'] + 14 < sy < v['b'] - 14): continue
            po, pi_ = (int(sx + nx * 10), int(sy + ny * 10)), (int(sx - nx * 10), int(sy - ny * 10))
            if pid[po[1], po[0]] != oi or pid[pi_[1], pi_[0]] != wi: continue
            prof = np.array([L[int(sy + ny * o), int(sx + nx * o)] for o in np.arange(-12, 12.01, 0.5)]); offs = np.arange(-12, 12.01, 0.5)
            inner_ = prof[(offs >= -4) & (offs <= 0)].max(); gin = prof[(offs <= -7) & (offs >= -10)].mean(); gout = prof[(offs >= 7) & (offs <= 10)].mean()
            light = (inner_ - gin >= 8) and (inner_ - gout >= 8); dark = gout < 35
            a['n'] += 1; a['dark'] += dark; a['darkLight'] += dark and light; a['lightLight'] += (not dark) and light
            if k == 'mere':
                found = None; run_ = 0
                for o in np.arange(2, min(0.9 * I['Dpx'], 160), 1):
                    X2, Y2 = int(sx - nx * o), int(sy - ny * o)
                    if pid[Y2, X2] != wi: break
                    c = LB[Y2, X2]; hit = c[1] < -10 and c[2] < 6; run_ = run_ + 1 if hit else 0
                    if run_ >= 3: found = o - 2; break
                a['start'].append(found); a['w8'] += found is not None and found <= 8
    for k, a in acc.items():
        if not a['n']: continue
        r = {'n': a['n'], 'darkOutside': round(a['dark'] / a['n'], 3), 'lightLineWhereDark': round(a['darkLight'] / max(1, a['dark']), 3), 'lightLineWhereNotDark': round(a['lightLight'] / max(1, a['n'] - a['dark']), 3)}
        if k == 'mere':
            st = [x for x in a['start'] if x is not None]
            r['waterWithin8px'] = round(a['w8'] / a['n'], 3); r['waterStartMedianPx'] = round(float(np.median(st)), 1) if st else None; r['waterStartMedianD'] = round(float(np.median(st)) / I['Dpx'], 3) if st else None
        out[k] = r
    return out
if __name__ == '__main__':
    key = sys.argv[1]
    for vw in sys.argv[2:]:
        try: print(json.dumps(run(f'{key}-dpr1-{vw}')))
        except FileNotFoundError as e: print(key, vw, 'missing', e)
