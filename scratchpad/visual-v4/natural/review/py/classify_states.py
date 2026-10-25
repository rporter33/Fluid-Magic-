"""Review: does the lightness-only reading survive the map states? The design trained and tested on in-sight land only.
States applied to the whole bake (sRGB, as the composite does): natural unexplored (10% gesso haze + 25% desaturation toward
equal-L* grey), natural out of sight (25% desaturation), ash wash 10% (#8F8C88), moss wash 6% (#5E7F45); for Clear the approved
haze 4% and out of sight 10%. (a) trained on in-sight provinces of one fold, tested on the other fold in each state;
(b) trained on every state mixed (one fold), tested per state on the other fold. Usage: python3 -I classify_states.py"""
import sys, os, json, numpy as np
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/proto'
sys.path.insert(0, P)
import classify as C
from natlib import *
BH, BW = C.BH, C.BW
def grey_eq(rgb):
    lab = rgb2lab(rgb); lab[..., 1:] = 0; return lab2rgb(lab)
def mixc(rgb, col, t): return rgb * (1 - t) + hex2rgb(col) * t
def desat(rgb, t): return rgb * (1 - t) + grey_eq(rgb) * t
STATES = {
  'natural': {'raw': lambda x: x, 'unexplored': lambda x: desat(mixc(x, '#E8DCC2', 0.10), 0.25), 'outOfSight': lambda x: desat(x, 0.25),
              'ash10': lambda x: mixc(x, '#8F8C88', 0.10), 'moss6': lambda x: mixc(x, '#5E7F45', 0.06), 'hem20': lambda x: desat(mixc(x, '#E8DCC2', 0.20), 0.25)},
  'clear': {'raw': lambda x: x, 'unexplored': lambda x: mixc(x, '#E8DCC2', 0.04), 'outOfSight': lambda x: desat(x, 0.10), 'ash10': lambda x: mixc(x, '#8F8C88', 0.10), 'moss6': lambda x: mixc(x, '#5E7F45', 0.06)},
}
def fold_of(prov):
    rng = np.random.default_rng(7); provs = np.unique(prov); fold = {}
    for t in range(7):
        ps = [p for p in provs if C.terr[p] == C.T[t]]; rng.shuffle(ps)
        for k, p in enumerate(ps): fold[p] = k % 2
    return np.array([fold[p] for p in prov])
res = {}
imgs = {'natural': np.fromfile(os.path.join(DATA, 'natural.rgba'), np.uint8).reshape(BH, BW, 4), 'clear': np.fromfile(os.path.join(DATA, 'clear-img.rgba'), np.uint8).reshape(BH, BW, 4)}
for bk in ['natural', 'clear']:
    for zn, dpx in [('Far', 50), ('Start', 85), ('Mid', 120), ('ref', 200)]:
        rgb0, idn, dn = C.screen(imgs[bk], dpx)
        for vis in ['normal', 'deutan', 'tritan']:
            data = {}
            for sn, fn in STATES[bk].items():
                X, y, prov, Psz = C.patches(np.clip(fn(rgb0.astype(np.float64)), 0, 255), idn, dn, dpx, vis); data[sn] = (X, y, prov)
            f = fold_of(data['raw'][2])
            for cn, cols in [('lightness', C.ALL), ('texture', C.TEX)]:
                for train in ['raw', 'mixed']:
                    row = {}
                    for sn in STATES[bk]:
                        tot_ok = 0; tot = 0; pv = {}
                        for k in (0, 1):
                            if train == 'raw': Xtr, ytr = data['raw'][0][f != k], data['raw'][1][f != k]
                            else: Xtr = np.concatenate([data[s][0][f != k] for s in STATES[bk]]); ytr = np.concatenate([data[s][1][f != k] for s in STATES[bk]])
                            X, y, prov = data[sn]
                            mod = C.lda_fit(Xtr[:, cols], ytr); pr = C.lda_pred(mod, X[f == k][:, cols])
                            tot_ok += (pr == y[f == k]).sum(); tot += (f == k).sum()
                            for i in np.unique(prov[f == k]):
                                votes = np.bincount(pr[prov[f == k] == i], minlength=7); pv[i] = (int(np.argmax(votes)), int(y[f == k][prov[f == k] == i][0]))
                        row[sn] = (round(tot_ok / tot, 3), round(float(np.mean([a == b for a, b in pv.values()])), 3))
                    res[f'{bk}|{zn}|{vis}|{cn}|train {train}'] = row
                    print(f'{bk:7s} {zn:5s} {vis:6s} {cn:9s} train {train:5s}', '  '.join(f'{s} {a:.3f}/{b:.2f}' for s, (a, b) in row.items()), flush=True)
json.dump(res, open('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/review/classify-states.json', 'w'), indent=1)
