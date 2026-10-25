"""Player-readability measures on the dumps (out/dump/<build>-<view>-{land,lines,meta}.bin + .json), per vision (normal, protan, deutan, tritan).
python3 -I analyze.py <build,...> <view,...>
1. edge: along every wild outline (3 px steps, 6 px off the corners), does the drawn edge stand apart from BOTH sides? salience = max over the
   +-4 px band of min(dE76(px, inside median), dE76(px, outside median)), sides = 5..14 px off the line, lines layer (contour, rim, rails).
   'ground' = dE76 between the two side medians (does the land itself change at the line).
2. onset: does the impassable GROUND look different from the land around it, and where does that difference begin? Fisher LDA on the land layer
   (sigma 2 px blur: L, a, b, local L sd 7x7) trained on wild cores (>= 0.3 D inside) against land 0.35..1.2 D outside; AUC, and the share of
   pixels classed 'wild' by signed distance to the outline (D units; + inside). d50 = first inside distance where the share reaches 0.5.
   'spill' = share classed wild 0.03..0.25 D OUTSIDE (land that looks like the wild).
3. nb: for every passable neighbour, its pixels 0.03..0.2 D outside the wild against its own pixels > 0.45 D from any wild: dE76 of medians, L sd ratio."""
import sys, json, numpy as np
ME = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-player/'
DUMP = ME + 'out/dump/'
MACH = {'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
        'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
        'tritan': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]}

def lin(c):
    c = np.asarray(c, np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def lab_from_lin(l):
    r, g, b = l[..., 0], l[..., 1], l[..., 2]
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
    z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
    f = lambda t: np.where(t > 216 / 24389, np.cbrt(t), ((24389 / 27) * t + 16) / 116)
    fx, fy, fz = f(x), f(y), f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)

def lab(rgb, vision='normal'):
    l = lin(rgb)
    if vision != 'normal': l = np.clip(l @ np.array(MACH[vision]).T, 0, 1)
    return lab_from_lin(l)

def box(a, r, axis):
    if r <= 0: return a
    c = np.cumsum(np.pad(a, [(r + 1, r) if k == axis else (0, 0) for k in range(a.ndim)], mode='edge'), axis=axis)
    n = a.shape[axis]
    return (np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis) - np.take(c, np.arange(0, n), axis=axis)) / (2 * r + 1)

def blur(a, r):  # three box passes ~ gaussian sigma ~ r
    for _ in range(3): a = box(box(a, r, 0), r, 1)
    return a

def load(tag):
    info = json.load(open(DUMP + tag + '.json')); W2, H2 = info['info']['W2'], info['info']['H2']
    rd = lambda k: np.fromfile(DUMP + f'{tag}-{k}.bin', np.uint8).reshape(H2, W2, 4)
    return info, rd('land')[..., :3], rd('lines')[..., :3], rd('meta')

def seg_dist(P, segs):
    best = np.full(len(P), np.inf); idx = np.full(len(P), -1)
    for k, (a, b) in enumerate(segs):
        a = np.array(a); b = np.array(b); ab = b - a; L2 = max(float(ab @ ab), 1e-9)
        t = np.clip(((P - a) @ ab) / L2, 0, 1); d = np.hypot(*(P - (a + t[:, None] * ab)).T)
        m = d < best; best[m] = d[m]; idx[m] = k
    return best, idx

def auc(s0, s1):
    s = np.concatenate([s0, s1]); r = s.argsort().argsort() + 1
    return float((r[len(s0):].sum() - len(s1) * (len(s1) + 1) / 2) / (len(s0) * len(s1)))

def run(build, view):
    info, land, lines, meta = load(f'{build}-{view}'); I = info['info']; Dpx = I['Dpx']; H2, W2 = land.shape[:2]
    model = (meta[..., 1] & 2) > 0; wild = (meta[..., 1] & 4) > 0; pid = meta[..., 0]
    # signed distance to the nearest wild outline (device px), + inside a wild, only near the wilds
    segs, segnb, segw, segnbT = [], [], [], []
    for w in info['wilds']:
        for e in w['edges']:
            if e['j'] < 0 or e['nbWild']: continue
            segs.append((e['a'], e['b'])); segnb.append(e['nb']); segw.append(w['id']); segnbT.append(e['nbT'])
    ys, xs = np.mgrid[0:H2, 0:W2]; near = np.zeros((H2, W2), bool)
    for (a, b) in segs:
        x0, x1 = min(a[0], b[0]) - 1.3 * Dpx, max(a[0], b[0]) + 1.3 * Dpx; y0, y1 = min(a[1], b[1]) - 1.3 * Dpx, max(a[1], b[1]) + 1.3 * Dpx
        near[max(0, int(y0)):max(0, int(y1)), max(0, int(x0)):max(0, int(x1))] = True
    near &= model
    P = np.stack([xs[near] + 0.5, ys[near] + 0.5], 1).astype(np.float64)
    if len(P) == 0 or not segs: return None
    d, si = seg_dist(P, segs); sd = np.where(wild[near], d, -d) / Dpx  # in D units
    res = {'build': build, 'view': view, 'Dpx': round(Dpx, 1), 'vis': {}}
    # wild cores need to exist in view
    core = sd >= 0.3; ring = (sd <= -0.35) & (sd >= -1.2) & ~wild[near]
    nbT = np.array(segnbT, dtype=object)[si]; wid = np.array(segw, dtype=object)[si]
    for vision in ['normal', 'protan', 'deutan', 'tritan']:
        out = {}
        # --- 1. edge salience on the lines layer
        Lb = lab(lines, vision)
        sal, grd, rimlight = [], [], []
        for k, (a, b) in enumerate(segs):
            a = np.array(a, float); b = np.array(b, float); L = np.hypot(*(b - a))
            if L < 14: continue
            e = next(e for w in info['wilds'] for e in w['edges'] if e['a'] == list(a) and e['b'] == list(b)) if False else None
            t = (b - a) / L; n = np.array([-t[1], t[0]])
            # outward normal: the side that is not wild
            mid = (a + b) / 2; q = (mid + n * 6).astype(int)
            if 0 <= q[1] < H2 and 0 <= q[0] < W2 and wild[q[1], q[0]]: n = -n
            for s in np.arange(6, L - 6, 3):
                c = a + t * s; offs = np.arange(-14, 15)
                pts = (c[None, :] + offs[:, None] * n[None, :]).round().astype(int)
                if (pts[:, 0] < 0).any() or (pts[:, 1] < 0).any() or (pts[:, 0] >= W2).any() or (pts[:, 1] >= H2).any(): continue
                if not model[pts[:, 1], pts[:, 0]].all(): continue
                prof = Lb[pts[:, 1], pts[:, 0]]  # offs<0 inside the wild
                inn = np.median(prof[:10], 0); outm = np.median(prof[-10:], 0); band = prof[10:19]
                dmin = np.minimum(np.linalg.norm(band - inn, axis=1), np.linalg.norm(band - outm, axis=1))
                sal.append(float(dmin.max())); grd.append(float(np.linalg.norm(inn - outm)))
                rimlight.append(bool((band[:, 0] > max(inn[0], outm[0]) + 12).any()))
        sal = np.array(sal); grd = np.array(grd)
        if len(sal):
            out['edge'] = {'n': int(len(sal)), 'sal_p10': round(float(np.percentile(sal, 10)), 1), 'sal_p50': round(float(np.median(sal)), 1),
                           'share_sal_ge20': round(float((sal >= 20).mean()), 3), 'share_sal_lt10': round(float((sal < 10).mean()), 3),
                           'ground_p50': round(float(np.median(grd)), 1), 'share_ground_ge20': round(float((grd >= 20).mean()), 3), 'light_line_share': round(float(np.mean(rimlight)), 3)}
        # --- 2. ground onset profile (land layer)
        La = lab(land, vision); F = np.concatenate([blur(La, 1), blur((La[..., :1] - blur(La[..., :1], 3)) ** 2, 3) ** 0.5], -1)[near]
        if core.sum() > 200 and ring.sum() > 200:
            X0, X1 = F[ring], F[core]; m0, m1 = X0.mean(0), X1.mean(0)
            Sw = np.cov(X0.T) + np.cov(X1.T) + 1e-3 * np.eye(F.shape[1]); wv = np.linalg.solve(Sw, m1 - m0)
            s = F @ wv; s0, s1 = s[ring], s[core]
            # threshold maximising balanced accuracy on the training classes
            th = np.quantile(np.concatenate([s0, s1]), np.linspace(0.02, 0.98, 97)); ba = [((s0 < x).mean() + (s1 >= x).mean()) / 2 for x in th]; thr = th[int(np.argmax(ba))]
            isw = s >= thr; prof = {}; okb = np.abs(sd * Dpx) >= 4
            edges_bins = np.arange(-0.40, 0.4001, 0.05)
            for groupname, gmask in [('all', np.ones(len(s), bool)), ('hillsmtn', np.isin(nbT, ['hills', 'mountains'])), ('other', ~np.isin(nbT, ['hills', 'mountains']))]:
                pr = []
                for lo, hi in zip(edges_bins[:-1], edges_bins[1:]):
                    m = gmask & okb & (sd >= lo) & (sd < hi); pr.append(round(float(isw[m].mean()), 2) if m.sum() > 30 else None)
                d50 = None
                for lo, v in zip(edges_bins[:-1], pr):
                    if lo >= 0 and v is not None and v >= 0.5: d50 = round(float(lo), 2); break
                sp = gmask & okb & (sd <= -0.03) & (sd >= -0.25)
                prof[groupname] = {'profile': pr, 'd50_D': d50, 'spill_share': round(float(isw[sp].mean()), 3) if sp.sum() > 30 else None,
                                   'inside_0_15': round(float(isw[gmask & okb & (sd >= 0.0) & (sd < 0.15)].mean()), 3) if (gmask & okb & (sd >= 0) & (sd < 0.15)).sum() > 30 else None}
            out['onset'] = {'auc': round(auc(s0, s1), 3), 'bal_acc': round(float(max(ba)), 3), 'bins': [round(float(x), 2) for x in edges_bins[:-1]], **prof}
            # per wild
            out['onset_wild'] = {}
            for wn in sorted(set(segw)):
                m = (wid == wn) & okb; mi = m & (sd >= 0) & (sd < 0.15); mo = m & (sd <= -0.03) & (sd >= -0.25); mc = m & core
                if mc.sum() > 50: out['onset_wild'][wn] = {'core_as_wild': round(float(isw[mc].mean()), 3), 'inside_0_15': round(float(isw[mi].mean()), 3) if mi.sum() > 30 else None, 'spill_share': round(float(isw[mo].mean()), 3) if mo.sum() > 30 else None}
        # --- 2b. wild cores against PASSABLE mountains and hills anywhere in view (is it a mountain I can cross?)
        tmap = np.full(256, '', dtype=object)
        for pp in info['provs']:
            if pp['i'] < 255: tmap[pp['i']] = pp['terrain'] if not pp['wild'] else 'WILD'
        Ffull = np.concatenate([blur(La, 1), blur((La[..., :1] - blur(La[..., :1], 3)) ** 2, 3) ** 0.5], -1)
        T = tmap[pid]; farw = np.ones((H2, W2), bool); farw[near] = sd < -0.08  # away from the wild line, or not near a wild at all
        coreF = np.zeros((H2, W2), bool); coreF[near] = core
        for tn in ['mountains', 'hills']:
            mt = (T == tn) & model & farw & ~wild
            for wkind, wsel in [('peaks', ['ashspine', 'greyteeth']), ('all', None)]:
                cm = coreF.copy()
                if wsel is not None:
                    wm = np.zeros((H2, W2), bool); wm[near] = np.isin(wid, wsel); cm &= wm
                if mt.sum() > 400 and cm.sum() > 200:
                    X0, X1 = Ffull[mt], Ffull[cm]
                    if len(X0) > 60000: X0 = X0[:: len(X0) // 60000]
                    if len(X1) > 60000: X1 = X1[:: len(X1) // 60000]
                    Sw = np.cov(X0.T) + np.cov(X1.T) + 1e-3 * np.eye(Ffull.shape[-1]); wv = np.linalg.solve(Sw, X1.mean(0) - X0.mean(0))
                    out[f'auc_vs_{tn}_{wkind}'] = round(auc(X0 @ wv, X1 @ wv), 3)
                    out[f'dE_vs_{tn}_{wkind}'] = round(float(np.linalg.norm(np.median(X1[:, :3], 0) - np.median(X0[:, :3], 0))), 1)
        res['vis'][vision] = out
    # --- 3. neighbours (normal vision only)
    La = lab(land, 'normal'); Lfull = La; nbres = {}
    names = {p['i']: p['name'] for p in info['provs']}; terr = {p['i']: p['terrain'] for p in info['provs']}
    # distance from any wild for all pixels near: sd (negative outside)
    pid_near = pid[near]; Lnear = Lfull[near]
    for nb in sorted(set(segnb)):
        i = next((p['i'] for p in info['provs'] if p['name'] == nb), None)
        if i is None or i > 254: continue
        mine = pid == i; m_near = (pid_near == i) & (sd <= -0.03) & (sd >= -0.2)
        # far part: pixels of this province not in the near-band set or farther than 0.45 D
        far_mask = mine.copy(); far_idx = np.zeros((H2, W2), bool); far_idx[near] = sd > -0.45; far_mask &= ~far_idx
        if m_near.sum() < 80 or far_mask.sum() < 400: continue
        a = Lnear[m_near]; bb = Lfull[far_mask]
        nbres[nb] = {'terrain': terr.get(i), 'dE_med': round(float(np.linalg.norm(np.median(a, 0) - np.median(bb, 0))), 1),
                     'L_near': round(float(np.median(a[:, 0])), 1), 'L_far': round(float(np.median(bb[:, 0])), 1),
                     'sd_ratio': round(float(a[:, 0].std() / max(bb[:, 0].std(), 0.1)), 2)}
    res['nb'] = nbres
    return res

if __name__ == '__main__':
    builds = sys.argv[1].split(','); views = sys.argv[2].split(',')
    allr = []
    for b in builds:
        for v in views:
            try:
                r = run(b, v)
            except FileNotFoundError:
                print('missing', b, v); continue
            if r: allr.append(r); json.dump(r, open(f'{ME}out/an-{b}-{v}.json', 'w'))
            n = r['vis']['normal'] if r else {}
            print(b, v, json.dumps({k: n.get(k) for k in ['edge']}), json.dumps(n.get('onset', {}).get('all', {})), n.get('onset', {}).get('auc'))
