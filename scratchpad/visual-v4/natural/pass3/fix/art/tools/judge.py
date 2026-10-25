"""Judge-art measures on the dumps (land layer: rails, pieces, labels off; contour and rim are in it), identical views on p2, relief, massif, open.
Per wild: rim share (verifier: a pixel of L* >= 65 within -2.5..+4 px of the outline), light line (a line inside 0..4 px lighter by >= 8 L* than both
the ground 7-10 px inside and 7-10 px outside), ground step (CIE76 between the means 6-12 px outside and 6-12 px inside), rock/water start distance
from the outline (median in D, CV along the outline), busyness of 6 px cells in the core (>10/>20 L*), fine detail (mean |L - 3x3 mean|) core / land,
and peak L* p5/p50/p95. Usage: python3 -I judge.py view [view ...]"""
import sys, json, numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/verify/tools')
import vlib
from vlib import lab, distmap, busy
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/fix/art/out/dump/'
WILD = {13: 'ash', 14: 'ash', 15: 'ash', 37: 'grey', 48: 'grey', 39: 'mere'}

def load(tag):
    info = json.load(open(D + tag + '.json')); W2, H2 = info['info']['W2'], info['info']['H2']
    rd = lambda k: np.fromfile(D + f'{tag}-{k}.bin', np.uint8).reshape(H2, W2, 4)
    return info, rd('land'), rd('meta')

def box3(a):
    p = np.pad(a, 1, mode='edge'); s = sum(p[1 + dy:1 + dy + a.shape[0], 1 + dx:1 + dx + a.shape[1]] for dy in (-1, 0, 1) for dx in (-1, 0, 1)); return s / 9

def run(tag):
    info, land, meta = load(tag); I = info['info']; v = I['view']; H2, W2 = I['H2'], I['W2']; Dpx = I['Dpx']
    pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]; inm = (fl & 2) > 0; water = (fl & 1) > 0; wild = (fl & 4) > 0
    LB = lab(land[..., :3].astype(np.float64)); Lm = LB[..., 0]; Cm = np.hypot(LB[..., 1], LB[..., 2])
    vm = np.zeros(pid.shape, bool); vm[int(v['t'] + 4):int(v['b'] - 4), int(v['l'] + 4):int(v['r'] - 4)] = True
    dm = distmap(pid, maxd=14)
    det = np.abs(Lm - box3(Lm))
    pas = inm & vm & ~wild & ~water & (pid != 255)
    out = {'tag': tag, 'Dpx': round(Dpx, 1), 'w': {}}
    def px(arr, sx, sy):
        X, Y = int(np.floor(sx)), int(np.floor(sy))
        if X < 0 or Y < 0 or X >= W2 or Y >= H2: return None
        return arr[Y, X]
    acc = {}
    for e in info['edges']:
        if e['type'] != 'wild': continue
        wi = e['i'] if e['i'] in info['wilds'] else e['j']; oi = e['j'] if wi == e['i'] else e['i']
        if oi in info['wilds']: continue
        (ax, ay), (bx, by) = e['a'], e['b']; Ln = np.hypot(bx - ax, by - ay)
        if Ln < 12: continue
        nx, ny = -(by - ay) / Ln, (bx - ax) / Ln; mx, my = (ax + bx) / 2, (ay + by) / 2
        q8 = px(pid, mx + nx * 8, my + ny * 8)
        if q8 is None: continue
        if q8 != oi: nx, ny = -nx, -ny   # n points outside (to the land)
        k = WILD.get(wi); a = acc.setdefault(k, {'n': 0, 'rim': 0, 'light': 0, 'step': [], 'start': [], 'prof': []})
        for s in np.arange(5, Ln - 5, 2):
            sx, sy = ax + (bx - ax) * s / Ln, ay + (by - ay) * s / Ln
            if not (v['l'] + 14 < sx < v['r'] - 14 and v['t'] + 14 < sy < v['b'] - 14): continue
            if px(pid, sx + nx * 10, sy + ny * 10) != oi or px(pid, sx - nx * 10, sy - ny * 10) != wi: continue
            prof = [px(Lm, sx + nx * o, sy + ny * o) for o in np.arange(-12, 12.01, 0.5)]
            if any(p_ is None for p_ in prof): continue
            prof = np.array(prof); offs = np.arange(-12, 12.01, 0.5)
            a['n'] += 1; a['prof'].append(prof)
            rimwin = prof[(offs >= -2.5) & (offs <= 4)]; a['rim'] += rimwin.max() >= 65
            inner = prof[(offs >= -4) & (offs <= 0)].max(); gin = prof[(offs <= -7) & (offs >= -10)].mean(); gout = prof[(offs >= 7) & (offs <= 10)].mean()
            a['light'] += (inner - gin >= 8) and (inner - gout >= 8)
            labs_o = np.array([LB[int(sy + ny * o), int(sx + nx * o)] for o in np.arange(6, 12.01, 1)]).mean(0)
            labs_i = np.array([LB[int(sy - ny * o), int(sx - nx * o)] for o in np.arange(6, 12.01, 1)]).mean(0)
            a['step'].append(float(np.linalg.norm(labs_o - labs_i)))
            # first rock (peaks: C* < 7 for 3 px) / water (a* < -10 and b* < 6 for 3 px) walking inward from 4 px
            run_ = 0; found = None
            for o in np.arange(4, min(0.9 * Dpx, 160), 1):
                X, Y = int(sx - nx * o), int(sy - ny * o)
                if X < 0 or Y < 0 or X >= W2 or Y >= H2 or pid[Y, X] != wi: break
                c = LB[Y, X]; hit = (c[1] < -10 and c[2] < 6) if k == 'mere' else (np.hypot(c[1], c[2]) < 7 and c[0] < 70)
                run_ = run_ + 1 if hit else 0
                if run_ >= 3: found = o - 2; break
            a['start'].append(found)
    for k, a in acc.items():
        if not a['n']: continue
        st = [x for x in a['start'] if x is not None]; prof = np.array(a['prof']).mean(0)
        r = {'n': a['n'], 'rim65': round(a['rim'] / a['n'], 3), 'lightLine': round(a['light'] / a['n'], 3), 'groundStepP50': round(float(np.median(a['step'])), 1),
             'startFound': round(len(st) / a['n'], 2)}
        if st: r['startD_p50'] = round(float(np.median(st)) / Dpx, 3); r['startCV'] = round(float(np.std(st) / max(np.mean(st), 1e-6)), 2); r['startD_p10_p90'] = [round(float(np.percentile(st, 10)) / Dpx, 3), round(float(np.percentile(st, 90)) / Dpx, 3)]
        r['profL'] = [round(float(x), 1) for x in prof[::4]]  # offsets -12..+12 step 2 (outside positive)
        out['w'][k] = r
    # cores
    for k, ids in (('ash', [13, 14, 15]), ('grey', [37, 48]), ('mere', [39])):
        core = np.isin(pid, ids) & inm & vm & (dm >= 4)
        if core.sum() < 500: continue
        r = out['w'].setdefault(k, {})
        # busyness on 6 px cells fully inside the core
        cell = 6; h, w = H2 // cell * cell, W2 // cell * cell
        cm = core[:h, :w].reshape(h // cell, cell, w // cell, cell).all((1, 3))
        g = busy(land[..., :3], cell); ok = cm[:-1, :-1] & cm[:-1, 1:] & cm[1:, :-1]
        if ok.sum() > 20: r['busy'] = [round(float((g[ok] > 10).mean() * 100), 1), round(float((g[ok] > 20).mean() * 100), 1)]
        r['fineRatio'] = round(float(det[core].mean() / det[pas].mean()), 2) if pas.any() else None
        r['L'] = [round(float(np.percentile(Lm[core], p)), 1) for p in (5, 50, 95)]
    out['landFine'] = round(float(det[pas].mean()), 2)
    return out

if __name__ == '__main__':
    views = sys.argv[1:]; rows = []
    for vw in views:
        for k in ['f3', 'fx']:
            try: r = run(f'{k}-dpr1-{vw}')
            except FileNotFoundError: continue
            rows.append(r); print(json.dumps({'tag': r['tag'], 'Dpx': r['Dpx'], **{w: {kk: vv for kk, vv in x.items() if kk != 'profL'} for w, x in r['w'].items()}}))
    json.dump(rows, open('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/fix/art/out/judge-' + '-'.join(views) + '.json', 'w'), indent=1)
