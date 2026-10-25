import sys, os, json, numpy as np, importlib.util
d = os.path.dirname(os.path.abspath(__file__)); spec = importlib.util.spec_from_file_location('vr', os.path.join(d, 'v-readers.py')); vr = importlib.util.module_from_spec(spec); spec.loader.exec_module(vr)
A, B = sys.argv[1], sys.argv[2]; pa, n = vr.patches(A, ['normal']); pb, n = vr.patches(B, ['normal'])
FN = ['mu', 'p10', 'p90', 'logsd', 'skew', 'g1', 'g2', 'lap', 'coh', 'dark', 'light', 'ac2', 'ac4']
def bt(P):
  by = {}
  for p in P: by.setdefault(vr.RT[p['t']], []).append(p['f']['normal'])
  return {k: np.array(v).mean(0) for k, v in by.items()}
a, b = bt(pa), bt(pb)
print('terrain  ', ' '.join(f'{f:>6}' for f in FN))
for k in sorted(a): print(f'{k[:8]:8} A', ' '.join(f'{v:6.2f}' for v in a[k])); print(f'{k[:8]:8} B', ' '.join(f'{v:6.2f}' for v in b[k]))
