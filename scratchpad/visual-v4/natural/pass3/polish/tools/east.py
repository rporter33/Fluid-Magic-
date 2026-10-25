import sys, os, json, numpy as np, importlib.util
d = os.path.dirname(os.path.abspath(__file__)); spec = importlib.util.spec_from_file_location('vr', os.path.join(d, 'v-readers.py')); vr = importlib.util.module_from_spec(spec); spec.loader.exec_module(vr)
U8 = {'Oakford','Bramreach','Cinford','Rookmarch','Rookford','Thornwick','Wyrmere','Brammere'}
for t in sys.argv[1:]:
  P, n = vr.patches(t, ['normal']); info = json.load(open(vr.DUMP + t + '.json')); names = {p['i']: p['name'] for p in info['provs']}
  X = np.array([p['f']['normal'] for p in P]); y = np.array([p['t'] for p in P]); prov = np.array([p['i'] for p in P]); pred = np.zeros(len(P), int)
  for i in np.unique(prov): te = prov == i; pred[te] = vr.lda_fit(X[~te], y[~te])(X[te])
  m = np.array([names[p['i']] in U8 for p in P]); print(f'{t:42} east-strip {int((pred[m]==y[m]).sum())}/{int(m.sum())} = {(pred[m]==y[m]).mean():.3f} | rest {(pred[~m]==y[~m]).mean():.3f}')
