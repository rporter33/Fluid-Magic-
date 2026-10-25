"""determinism within a page and sameness across pages from det-<page>-<look>-dpr1.json: python3 -I detcmp.py"""
import json, os
O = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-rules/out/'
for look in ['natural', 'clear', 'terrain']:
    base = O + f'det-p2-{look}-dpr1.json'; B = json.load(open(base)) if os.path.exists(base) else None
    for p in ['p2', 'relief', 'massif', 'open']:
        f = O + f'det-{p}-{look}-dpr1.json'
        if not os.path.exists(f): continue
        d = json.load(open(f)); runs = d['runs']
        within = all(s for _, s in d['same']) and all(s for _, s in (d['bakeSame'] or []))
        row = f'{look:8} {p:7} loads {len(runs)} within-page identical {within} pageErrors {sum(r["pageErrors"] for r in runs)} readyMs {[r["readyMs"] for r in runs]} bake {runs[0].get("bake")}'
        if B and p != 'p2':
            hv = {v: runs[0]['hashes'][v] == B['runs'][0]['hashes'][v] for v in runs[0]['hashes']}; bk = {k: runs[0]['bake'].get(k) == B['runs'][0]['bake'].get(k) for k in runs[0]['bake']}
            row += f'\n         vs p2 frames identical {sum(hv.values())}/{len(hv)} {[v for v, s in hv.items() if not s]} bake {bk}'
        print(row)
