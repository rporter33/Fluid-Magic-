"""The 'frame' around each wild, on the judge's dumps (land layer: the wild contour and rim are in it), every 1 px along each wild/passable edge:
light: a pixel 0.5 to 4 px inside the outline lighter than both grounds (W 6-9 px inside, G 6-9.5 px outside) by 6 L* or more (a light inner line, whatever its absolute L*);
rim65: the verifier's metric (a pixel of L* >= 65 within -2.5..+4 px); ink: a pixel within 1.5 px darker than both grounds by 8 L* or more;
step: |L(W) - L(G)| (does the ground itself change at the outline). Usage: python3 -I frame.py tag [...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
NM = {13: 'Ashspine', 14: 'Ashspine', 15: 'Ashspine', 37: 'Greyteeth', 48: 'Greyteeth', 39: 'Mere'}
def run(tag):
    info, Ld = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']; H2, W2 = I['H2'], I['W2']
    pid = Ld['meta'][..., 0].astype(np.int32); inm = (Ld['meta'][..., 1] & 2) > 0; Lm = Lstar(Ld['land'][..., :3].astype(np.float64))
    def px(a, sx, sy):
        X, Y = int(np.floor(sx * dpr)), int(np.floor(sy * dpr))
        return None if X < 0 or Y < 0 or X >= W2 or Y >= H2 else a[Y, X]
    per = {}
    for e in info['edges']:
        if e['type'] != 'wild': continue
        wi = e['i'] if e['i'] in info['wilds'] else e['j']; oi = e['j'] if wi == e['i'] else e['i']
        if oi in info['wilds']: continue
        (ax, ay), (bx, by) = e['a'], e['b']; Ln = np.hypot(bx - ax, by - ay)
        if Ln < 12: continue
        nx, ny = -(by - ay) / Ln, (bx - ax) / Ln
        if px(pid, (ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8) != oi: nx, ny = -nx, -ny
        k = per.setdefault(NM.get(wi, str(wi)), {'n': 0, 'light': 0, 'rim65': 0, 'ink': 0, 'step': [], 'lightAmt': []})
        for s in np.arange(5, Ln - 5, 1.0):
            sx, sy = ax + (bx - ax) * s / Ln, ay + (by - ay) * s / Ln
            if not (v['l'] + 12 < sx < v['r'] - 12 and v['t'] + 12 < sy < v['b'] - 12): continue
            if px(pid, sx + nx * 8, sy + ny * 8) != oi or not px(inm, sx + nx * 10, sy + ny * 10): continue
            g = lambda o: px(Lm, sx + nx * o, sy + ny * o)
            Wv = [g(-o) for o in (6, 7, 8, 9)]; Gv = [g(o) for o in (6, 7, 8, 9, 9.5)]
            if any(x is None for x in Wv + Gv): continue
            Lw, Lg = float(np.median(Wv)), float(np.median(Gv)); band = [g(-o) for o in np.arange(0.5, 4.01, 0.5)]; core = [g(o) for o in np.arange(-1.5, 1.51, 0.5)]; r65 = [g(o) for o in np.arange(-2.5, 4.01, 0.5)]
            k['n'] += 1; la = max(band) - max(Lw, Lg); k['lightAmt'].append(la); k['light'] += la >= 6; k['rim65'] += max(r65) >= 65; k['ink'] += min(core) <= min(Lw, Lg) - 8; k['step'].append(abs(Lw - Lg))
    out = {'tag': tag, 'band': I['band'], 'Dpx': round(I['Dpx'], 1)}; tot = {'n': 0, 'light': 0, 'rim65': 0, 'ink': 0}
    for nm, k in per.items():
        if not k['n']: continue
        out[nm] = {'n': k['n'], 'light': round(k['light'] / k['n'], 3), 'lightP50': round(float(np.median(k['lightAmt'])), 1), 'rim65': round(k['rim65'] / k['n'], 3), 'ink': round(k['ink'] / k['n'], 3), 'stepP50': round(float(np.median(k['step'])), 1), 'stepOver10': round(float(np.mean(np.array(k['step']) >= 10)), 3)}
        for q in tot: tot[q] += k[q]
    if tot['n']: out['all'] = {q: round(tot[q] / tot['n'], 3) for q in ('light', 'rim65', 'ink')} | {'n': tot['n']}
    return out
if __name__ == '__main__':
    rows = [run(t) for t in sys.argv[1:]]
    for r in rows: print(json.dumps(r))
    json.dump(rows, open(OUT + 'frame-' + str(abs(hash(' '.join(sys.argv[1:]))) % 100000) + '.json', 'w'), indent=1)
