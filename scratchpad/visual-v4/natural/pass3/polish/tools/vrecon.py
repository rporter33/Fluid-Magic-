"""the reconciled reader statistics with the verifier's own reader (v-readers.py patches and LDA), from three dumps of one view:
actual (the frame as it is; LOPO; by fog state), control (every province in sight; LOPO; on the provinces unexplored in the game), forced (trained in sight with the
held-out province left out, tested on the frame with every province unexplored). python3 -I vrecon.py <actualTag> <sightTag> <unexTag>"""
import sys, os, json, numpy as np, importlib.util
d = os.path.dirname(os.path.abspath(__file__)); spec = importlib.util.spec_from_file_location('vr', os.path.join(d, 'v-readers.py')); vr = importlib.util.module_from_spec(spec); spec.loader.exec_module(vr)
def load(t):
  P, n = vr.patches(t, ['normal']); return np.array([p['f']['normal'] for p in P]), np.array([p['t'] for p in P]), np.array([p['i'] for p in P]), np.array([p['fog'] or 'sight' for p in P]), n
def lopo(Xtr, ytr, ptr, Xte, pte):
  pred = np.zeros(len(Xte), int)
  for i in np.unique(pte): m = ptr != i; pred[pte == i] = vr.lda_fit(Xtr[m], ytr[m])(Xte[pte == i])
  return pred
Xa, ya, pa, fa, n = load(sys.argv[1]); Xs, ys, ps, fs, _ = load(sys.argv[2]); Xu, yu, pu, fu, _ = load(sys.argv[3])
pr = lopo(Xa, ya, pa, Xa, pa); acc = lambda m: (int(m.sum()), round(float((pr[m] == ya[m]).mean()), 3) if m.sum() else None)
uid = set(pa[fa == 'unexplored'].tolist()); mc = np.isin(ps, list(uid)); pc = lopo(Xs, ys, ps, Xs[mc], ps[mc]); pf = lopo(Xs, ys, ps, Xu, pu)
out = {'patchPx': n, 'all': acc(np.ones(len(pa), bool)), 'sight': acc(fa == 'sight'), 'outofsight': acc(fa == 'outofsight'), 'unexplored': acc(fa == 'unexplored'), 'control': (int(mc.sum()), round(float((pc == ys[mc]).mean()), 3)), 'forced': (len(Xu), round(float((pf == yu).mean()), 3))}
print(json.dumps(out))
