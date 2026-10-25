"""frontier visibility (natural §8.3's measure): per terrain, the Lab of the p10 / p50 / p90 (by L*) of core pixels (>= 0.15 D in), in sight vs unexplored; mean dE76 per terrain. python3 -I fogvis.py <sightTag> <unexTag>"""
import sys, os, json, numpy as np, importlib.util
d = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, d); from vlib import *
def cores(tag):
  info, L = load(tag); I = info['info']; meta = L['meta']; pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]; tt = meta[..., 2]
  ok = ((fl & 2) > 0) & ((fl & 4) == 0) & ((fl & 1) == 0) & (pid != 255); dist = distmap(pid, maxd=int(0.15 * I['Dpx'] * I['dpr']) + 2)
  m = ok & (dist >= 0.15 * I['Dpx'] * I['dpr']); lab_ = lab(L['land'][..., :3].astype(np.float64)); RT = I['RT']; out = {}
  for t in np.unique(tt[m]):
    if t >= len(RT): continue
    q = lab_[m & (tt == t)]; o = np.argsort(q[:, 0]); out[RT[t]] = [q[o[int(f * (len(o) - 1))]] for f in (0.1, 0.5, 0.9)]
  return out
a, b = cores(sys.argv[1]), cores(sys.argv[2]); rows = {}
for t in a:
  if t in b: rows[t] = round(float(np.mean([np.linalg.norm(x - y) for x, y in zip(a[t], b[t])])), 2)
print(json.dumps(rows), 'min', min(rows.values()), 'max', max(rows.values()))
