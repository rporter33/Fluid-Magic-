# merepool.py tag...: dE76 of medians (Lab after simulation) between the mere's water and the swamp pools, per vision (the player judge's Machado matrices)
import sys, json, numpy as np
O = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/build/out/final/'
M = {'normal': np.eye(3), 'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
     'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]], 'tritan': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]}
def lin(c): c = np.asarray(c, float) / 255; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lab(l):
    X = l @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]).T / np.array([0.95047, 1, 1.08883])
    f = np.where(X > 0.008856, np.cbrt(X), 7.787 * X + 16 / 116); return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], 1)
for t in sys.argv[1:]:
    r = json.load(open(O + 'merepool-' + t + '.json'))
    for v, s in r.items():
        a, b = np.array(s['mere']), np.array(s['pool']); row = []
        for k, m in M.items():
            la, lb = lab(np.clip(lin(a) @ np.array(m).T, 0, 1)), lab(np.clip(lin(b) @ np.array(m).T, 0, 1)); ma, mb = np.median(la, 0), np.median(lb, 0)
            row.append(f"{k} {np.linalg.norm(ma - mb):.1f}")
        print(t, v, 'n', len(a), len(b), 'mereL', round(float(np.median(lab(lin(a))[:, 0])), 1), 'poolL', round(float(np.median(lab(lin(b))[:, 0])), 1), '|', ', '.join(row))
