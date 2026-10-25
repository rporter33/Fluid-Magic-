"""The lightness-only comparison: per terrain, the spread of each L* feature over screen patches (normal vision), and for every pair of
terrains the best single feature and the two-class accuracy of a linear discriminant on L* features (provinces split in two folds).
Usage: python3 -I lighttable.py"""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from classify import *
NAMES = ['mean L*', 'p10 L*', 'p90 L*', 'log sd', 'skew', 'log grad1', 'log grad2', 'log lap', 'coherence', 'dark frac', 'light frac', 'ac2', 'ac4']
img = np.fromfile(os.path.join(DATA, 'natural.rgba'), np.uint8).reshape(BH, BW, 4)
for zn, dpx in [('Mid start', 85), ('ref zoom', 200)]:
    rgb, idn, dn = screen(img, dpx); X, y, prov, P = patches(rgb, idn, dn, dpx, 'normal')
    print(f'\n## {zn} (D_px {dpx}, patches of {P} px)\n')
    print('| terrain | patches | mean L* p10 / p50 / p90 | sd L* p50 | gradient p50 | coherence p50 | dark share p50 |'); print('|---|---|---|---|---|---|---|')
    for t in range(7):
        Z = X[y == t]
        print(f'| {T[t]} | {len(Z)} | {np.percentile(Z[:, 0], 10):.1f} / {np.median(Z[:, 0]):.1f} / {np.percentile(Z[:, 0], 90):.1f} | {np.exp(np.median(Z[:, 3])):.1f} | {np.exp(np.median(Z[:, 5])):.2f} | {np.median(Z[:, 8]):.2f} | {np.median(Z[:, 9]):.2f} |')
    print('\n| pair | two-class accuracy, lightness | texture only | best single feature (accuracy) |'); print('|---|---|---|---|')
    rows = []
    for a in range(7):
        for b in range(a + 1, 7):
            sel = (y == a) | (y == b); Xs, ys, ps = X[sel], y[sel], prov[sel]
            accs = []
            for cols in (ALL, TEX):
                pa, pacc, conf, pv = two_fold(Xs, ys, ps, cols); accs.append(pa)
            best = (0, '')
            for f in range(X.shape[1]):
                pa, _, _, _ = two_fold(Xs, ys, ps, [f]); best = max(best, (pa, NAMES[f]))
            rows.append((accs[0], T[a], T[b], accs[1], best))
    for acc, a, b, tex, best in sorted(rows)[:10]:
        print(f'| {a} / {b} | {acc:.3f} | {tex:.3f} | {best[1]} ({best[0]:.3f}) |')
