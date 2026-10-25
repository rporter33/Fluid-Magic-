"""Summarise focus.cjs sweep JSONs: python3 -I sumsweep.py <file.json>... -> per file: rows, failing rows, and per mode class the min and under counts at rest / hover / select"""
import json, sys
for f in sys.argv[1:]:
    R = json.load(open(f)); cls = lambda m: 'ownership' if m == 'ownership' else 'terrain' if m == 'terrain' else 'data'
    out = {}
    for r in R:
        k = cls(r['mode']); o = out.setdefault(k, {'rows': 0, 'fail': 0, 'rest': [9, 0, 0], 'hover': [9, 0, 0], 'select': [9, 0, 0], 'worst': []})
        o['rows'] += 1; o['fail'] += 0 if r['pass'] else 1
        for h, i in (('rest', 1), ('hover', 2), ('select', 2)):
            v = r[h]
            if v is None: continue
            mn, un, n = (v[1], v[2], v[0]) if h == 'rest' else (v[2], v[3], v[1])
            if mn is not None and mn < o[h][0]: o[h][0] = mn
            o[h][1] += un; o[h][2] += n
        if not r['pass']: o['worst'].append(f"{r['mode']}/{r['view']}: " + '; '.join(r['failing'][:2]))
    print('==', f.split('/')[-1], 'rows', len(R), 'failing', sum(0 if r['pass'] else 1 for r in R))
    for k, o in out.items():
        print(f"  {k:9s} rows {o['rows']:2d} fail {o['fail']:2d} | rest min {o['rest'][0]:.3f} under {o['rest'][1]}/{o['rest'][2]} | hover min {o['hover'][0]:.3f} under {o['hover'][1]}/{o['hover'][2]} | select min {o['select'][0]:.3f} under {o['select'][1]}/{o['select'][2]}")
        for w in o['worst'][:3]: print('      ', w[:200])
