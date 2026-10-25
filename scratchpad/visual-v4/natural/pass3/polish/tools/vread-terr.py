import sys, os, json, numpy as np, importlib.util
d = os.path.dirname(os.path.abspath(__file__)); spec = importlib.util.spec_from_file_location('vr', os.path.join(d, 'v-readers.py')); vr = importlib.util.module_from_spec(spec); spec.loader.exec_module(vr)
for t in sys.argv[1:]:
  pp, n = vr.patches(t, ['normal']); info = json.load(open(vr.DUMP + t + '.json')); names = {p['i']: p['name'] for p in info['provs']}
  by = {}
  for p in pp: by.setdefault(vr.RT[p['t']], {}).setdefault(names[p['i']] + ('*' if p['fog'] == 'unexplored' else ''), 0); by[vr.RT[p['t']]][names[p['i']] + ('*' if p['fog'] == 'unexplored' else '')] += 1
  print(t, n); [print(' ', k, v) for k, v in by.items()]
