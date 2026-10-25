"""Where the rock (or water) starts, walking in from the outline: the step in L* and CIE76 from the 3 px of ground before it to the 3 px of rock after it
(median), and the share of samples whose first rock pixels are darker than the ground before by >= 15 L* (a dark silhouette edge, the 'pasted' read)."""
import sys, json, numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/tools')
from judge import load, WILD
from vlib import lab
def run(tag):
    info, land, meta = load(tag); I = info['info']; v = I['view']; H2, W2 = I['H2'], I['W2']; Dpx = I['Dpx']; pid = meta[..., 0].astype(np.int32)
    LB = lab(land[..., :3].astype(np.float64)); res = {}
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
        k = WILD[wi]; r = res.setdefault(k, {'dL': [], 'dE': [], 'dark': 0, 'n': 0})
        for s in np.arange(5, Ln - 5, 2):
            sx, sy = ax + (bx - ax) * s / Ln, ay + (by - ay) * s / Ln
            if not (v['l'] + 14 < sx < v['r'] - 14 and v['t'] + 14 < sy < v['b'] - 14): continue
            run_ = 0; found = None
            for o in np.arange(4, min(0.9 * Dpx, 160), 1):
                X, Y = int(sx - nx * o), int(sy - ny * o)
                if X < 0 or Y < 0 or X >= W2 or Y >= H2 or pid[Y, X] != wi: break
                c = LB[Y, X]; hit = (c[1] < -10 and c[2] < 6) if k == 'mere' else (np.hypot(c[1], c[2]) < 7 and c[0] < 70)
                run_ = run_ + 1 if hit else 0
                if run_ >= 3: found = o - 2; break
            if found is None or found < 8: continue
            g = np.array([LB[int(sy - ny * o), int(sx - nx * o)] for o in (found - 4, found - 3, found - 2)]).mean(0)
            rk = np.array([LB[int(sy - ny * o), int(sx - nx * o)] for o in (found + 1, found + 2, found + 3)]).mean(0)
            r['n'] += 1; r['dL'].append(rk[0] - g[0]); r['dE'].append(float(np.linalg.norm(rk - g))); r['dark'] += (rk[0] - g[0]) <= -15
    return {k: {'n': r['n'], 'dLp50': round(float(np.median(r['dL'])), 1) if r['n'] else None, 'dEp50': round(float(np.median(r['dE'])), 1) if r['n'] else None, 'darkEdge': round(r['dark'] / r['n'], 2) if r['n'] else None} for k, r in res.items()}
if __name__ == '__main__':
    for vw in sys.argv[1:]:
        for k in ['relief', 'massif', 'open']: print(f'{k}-{vw}', json.dumps(run(f'{k}-dpr1-{vw}')))
