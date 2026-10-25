"""Skirt vs outside land, ink weight, rock grain. Usage: python3 -I skirt.py tag [tag...]
skirt: wild pixels 4-30 px inside the outline that are not rock (C* >= 7 or L* >= 70) and not water; outside: land pixels 4-30 px outside the wild.
Per wild: mean L*, mean C*, texture (mean |L - 5x5 box mean|), each inside and outside. Grain: mean |L - 3x3 median| on rock vs passable land (core, >= 8 px from any border)."""
import sys, json, numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/verify/tools')
from vlib import lab, distmap
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/art/out/dump/'
W = {'ash': [13, 14, 15], 'grey': [37, 48], 'mere': [39]}
def boxk(a, k):
    p = np.pad(a, k, mode='edge'); c = np.cumsum(np.cumsum(p, 0), 1); c = np.pad(c, ((1, 0), (1, 0)))
    n = 2 * k + 1; return (c[n:, n:] - c[:-n, n:] - c[n:, :-n] + c[:-n, :-n]) / (n * n)
def med3(a):
    p = np.pad(a, 1, mode='edge'); st = np.stack([p[1 + dy:1 + dy + a.shape[0], 1 + dx:1 + dx + a.shape[1]] for dy in (-1, 0, 1) for dx in (-1, 0, 1)]); return np.median(st, 0)
for tag in sys.argv[1:]:
    info = json.load(open(D + tag + '.json')); I = info['info']; H2, W2 = I['H2'], I['W2']; v = I['view']
    land = np.fromfile(D + tag + '-land.bin', np.uint8).reshape(H2, W2, 4); meta = np.fromfile(D + tag + '-meta.bin', np.uint8).reshape(H2, W2, 4)
    pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]; inm = (fl & 2) > 0; water = (fl & 1) > 0
    vm = np.zeros(pid.shape, bool); vm[int(v['t'] + 4):int(v['b'] - 4), int(v['l'] + 4):int(v['r'] - 4)] = True
    LB = lab(land[..., :3].astype(np.float64)); L = LB[..., 0]; C = np.hypot(LB[..., 1], LB[..., 2]); tex = np.abs(L - boxk(L, 2)); gr = np.abs(L - med3(L))
    allw = np.isin(pid, sum(W.values(), [])); dwild = distmap(np.where(allw, 1, 0), maxd=40)  # distance to the wild/land line, either side
    dm = distmap(pid, maxd=12); rock = (C < 7) & (L < 70)
    out = {'tag': tag, 'Dpx': round(I['Dpx'], 1)}
    for k, ids in W.items():
        wm = np.isin(pid, ids) & inm & vm
        if wm.sum() < 500: continue
        ins = wm & (dwild >= 4) & (dwild <= 30) & ~rock & ~water
        # outside: within 30 px of this wild only
        dk = distmap(np.where(np.isin(pid, ids), 1, 0), maxd=40); outs = inm & vm & ~allw & ~water & (pid != 255) & (dk >= 4) & (dk <= 30)
        if ins.sum() < 200 or outs.sum() < 200: continue
        f = lambda a, m: round(float(a[m].mean()), 1)
        out[k] = {'skirtPx': int(ins.sum()), 'L_in_out': [f(L, ins), f(L, outs)], 'C_in_out': [f(C, ins), f(C, outs)], 'tex_in_out': [round(float(tex[ins].mean()), 2), round(float(tex[outs].mean()), 2)]}
        rk = wm & rock & (dm >= 4)
        if rk.sum() > 500: out[k]['grainRock'] = round(float(gr[rk].mean()), 2)
    pas = inm & vm & ~allw & ~water & (pid != 255) & (dm >= 8); out['grainLand'] = round(float(gr[pas].mean()), 2)
    print(json.dumps(out))
