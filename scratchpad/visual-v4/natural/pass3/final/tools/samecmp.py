"""This build against the page before the fix pass, layer by layer, on the verifier's dumps: land (rails, pieces, labels off), lines minus land (the rails and lines alone),
full. Pixels that differ, and where (inside a wild, on the model edge, elsewhere). Usage: python3 -I samecmp.py <look> <view> [...]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
look = sys.argv[1]; out = []
for v in sys.argv[2:]:
    a_tag, b_tag = f'{look}-dpr1-1440x900-{v}', f'bf-{look}-dpr1-1440x900-{v}'
    try: ia, A = load(a_tag); ib, B = load(b_tag)
    except FileNotFoundError as e: print('missing', e); continue
    meta = A['meta']; wild = (meta[..., 1] & 4) > 0; inm = (meta[..., 1] & 2) > 0
    r = {'look': look, 'view': v}
    for k in ['land', 'lines', 'full']:
        d = (A[k][..., :3] != B[k][..., :3]).any(-1); r[k] = {'px': int(d.sum()), 'inWild': int((d & wild).sum()), 'offModel': int((d & ~inm).sum()), 'other': int((d & inm & ~wild).sum())}
    la = (A['lines'][..., :3] != A['land'][..., :3]).any(-1); lb = (B['lines'][..., :3] != B['land'][..., :3]).any(-1)
    r['lineMaskDiffPx'] = int((la != lb).sum()); r['lineColourDiffPx'] = int(((A['lines'][..., :3] != B['lines'][..., :3]).any(-1) & la & lb).sum())
    out.append(r); print(json.dumps(r))
json.dump(out, open(OUT + f'samecmp-{look}.json', 'w'), indent=1)
