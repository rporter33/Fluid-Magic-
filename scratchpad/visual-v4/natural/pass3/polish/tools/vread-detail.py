"""per-province detail of the verifier's reader (v-readers.py), normal lightness: python3 -I vread-detail.py tag [tag ...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('vr', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v-readers.py')); vr = importlib.util.module_from_spec(spec); spec.loader.exec_module(vr)
tags = sys.argv[1:]; P = []
for t in tags: pp, n = vr.patches(t, ['normal']); P += pp
info = json.load(open(vr.DUMP + tags[0] + '.json')); names = {p['i']: p['name'] for p in info['provs']}
X = np.array([p['f']['normal'] for p in P]); y = np.array([p['t'] for p in P]); prov = np.array([p['i'] for p in P])
pred = np.zeros(len(P), int)
for i in np.unique(prov): te = prov == i; pred[te] = vr.lda_fit(X[~te], y[~te])(X[te])
fog = np.array([p['fog'] for p in P])
print('patch px', n, 'patches', len(P), 'acc', round(float((pred == y).mean()), 3))
for f in sorted(set(fog)):
  m = fog == f; print('fog', f or 'sight', 'patches', int(m.sum()), 'acc', round(float((pred[m] == y[m]).mean()), 3))
rows = []
for i in np.unique(prov):
  m = prov == i; rows.append((names.get(int(i)), vr.RT[y[m][0]], fog[m][0] or 'sight', int(m.sum()), int((pred[m] == y[m]).sum()), np.bincount(pred[m], minlength=7)))
for r in sorted(rows, key=lambda r: (r[2], r[4] / r[3])):
  if r[4] < r[3]: print(r[2], r[0], r[1], f'{r[4]}/{r[3]}', {vr.RT[k]: int(v) for k, v in enumerate(r[5]) if v})
