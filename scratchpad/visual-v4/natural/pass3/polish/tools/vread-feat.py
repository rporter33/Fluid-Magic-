import sys, os, json, numpy as np, importlib.util
d = os.path.dirname(os.path.abspath(__file__)); spec = importlib.util.spec_from_file_location('vr', os.path.join(d, 'v-readers.py')); vr = importlib.util.module_from_spec(spec); spec.loader.exec_module(vr)
t = sys.argv[1]; pp, n = vr.patches(t, ['normal']); info = json.load(open(vr.DUMP + t + '.json')); names = {p['i']: p['name'] for p in info['provs']}
FN = ['mu', 'p10', 'p90', 'logsd', 'skew', 'g1', 'g2', 'lap', 'coh', 'dark', 'light', 'ac2', 'ac4']
want = sys.argv[2].split(',')
by = {}
for p in pp:
  k = (vr.RT[p['t']], p['fog'] or 'sight'); by.setdefault(k, []).append(p['f']['normal'])
print('class/fog', ' '.join(f'{f:>6}' for f in FN))
for k in sorted(by):
  if k[0] in want: a = np.array(by[k]); print(f'{k[0][:5]:5} {k[1][:6]:6} n{len(a):3}', ' '.join(f'{v:6.2f}' for v in a.mean(0)))
for p_name in sys.argv[3:]:
  a = np.array([p['f']['normal'] for p in pp if names[p['i']] == p_name]); print(f'{p_name[:12]:12} n{len(a):3}', ' '.join(f'{v:6.2f}' for v in a.mean(0)))
