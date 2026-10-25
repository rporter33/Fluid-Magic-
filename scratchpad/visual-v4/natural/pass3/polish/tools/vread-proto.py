"""protocol comparison on one actual-state dump (and optionally a forced-unexplored dump of the same view): python3 -I vread-proto.py actualTag [forcedTag]"""
import sys, os, json, numpy as np, importlib.util
d = os.path.dirname(os.path.abspath(__file__)); spec = importlib.util.spec_from_file_location('vr', os.path.join(d, 'v-readers.py')); vr = importlib.util.module_from_spec(spec); spec.loader.exec_module(vr)
A = sys.argv[1]; P, n = vr.patches(A, ['normal']); X = np.array([p['f']['normal'] for p in P]); y = np.array([p['t'] for p in P]); prov = np.array([p['i'] for p in P]); fog = np.array([p['fog'] for p in P])
U = fog == 'unexplored'
# 1 verifier: LOPO, all states in training
pred = np.zeros(len(P), int)
for i in np.unique(prov): te = prov == i; pred[te] = vr.lda_fit(X[~te], y[~te])(X[te])
print('LOPO all-states   unexplored', round(float((pred[U] == y[U]).mean()), 3), 'all', round(float((pred == y).mean()), 3))
# 2 LOPO, training on non-unexplored only
pred2 = np.zeros(len(P), int)
for i in np.unique(prov): te = prov == i; tr = (~te) & (~U); pred2[te] = vr.lda_fit(X[tr], y[tr])(X[te])
print('LOPO sight-trained unexplored', round(float((pred2[U] == y[U]).mean()), 3))
if len(sys.argv) > 2:
  Q, n2 = vr.patches(sys.argv[2], ['normal']); Xq = np.array([p['f']['normal'] for p in Q]); yq = np.array([p['t'] for p in Q]); pq = np.array([p['i'] for p in Q])
  pred3 = np.zeros(len(Q), int)
  for i in np.unique(pq): tr = (prov != i) & (~U); pred3[pq == i] = vr.lda_fit(X[tr], y[tr])(Xq[pq == i])
  print('forced unexplored, LOPO sight-trained', round(float((pred3 == yq).mean()), 3), 'patches', len(Q))
  pred4 = np.zeros(len(Q), int)
  for i in np.unique(pq): tr = (prov != i); pred4[pq == i] = vr.lda_fit(X[tr], y[tr])(Xq[pq == i])
  print('forced unexplored, LOPO all-trained', round(float((pred4 == yq).mean()), 3))
