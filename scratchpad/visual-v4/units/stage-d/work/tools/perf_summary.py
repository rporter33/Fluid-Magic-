# Summarises perf_moments.cjs: per moment and figure mode, the median over rounds of each page's CPU p50 and p95 per
# frame (update + render submit), draw calls and the effects layer's own update time. Adds 'summary' lines to the JSON.
# Usage: python3 -I perf_summary.py work/perf-moments.json
import json, statistics, sys
p = sys.argv[1]
d = json.load(open(p))
rows, lines = {}, []
for r in d['runs']:
    rows.setdefault((r['moment'], r['mode']), {}).setdefault(r['page'], []).append(r)
med = lambda xs: round(statistics.median(xs), 2) if xs else None
for (moment, mode), pages in rows.items():
    out = {}
    for tag in ('A', 'B'):
        rs = pages.get(tag, [])
        out[tag] = {'cpuP50': med([x['cpuP50'] for x in rs]), 'cpuP95': med([x['cpuP95'] for x in rs]), 'updateP50': med([x['updateP50'] for x in rs]),
                    'renderP50': med([x['renderP50'] for x in rs]), 'drawsP50': med([x['drawsP50'] for x in rs]), 'drawsMax': max([x['drawsMax'] for x in rs] or [0]),
                    'fxP50': med([x['fxUpdateP50'] for x in rs if x.get('fxUpdateP50') is not None]), 'fxMax': max([x['fxUpdateMax'] or 0 for x in rs] or [0]), 'n': len(rs)}
    a, b = out['A'], out['B']
    lines.append(f"{moment}, {mode}: CPU per frame p50 {a['cpuP50']} -> {b['cpuP50']} ms, p95 {a['cpuP95']} -> {b['cpuP95']} ms; draws p50 {a['drawsP50']} -> {b['drawsP50']} (max {a['drawsMax']} -> {b['drawsMax']}); "
                 f"effects layer update p50 {b['fxP50']} ms (max {b['fxMax']}); {b['n']} rounds")
    rows[(moment, mode)] = out
d['summary'] = lines
d['table'] = [{'moment': k[0], 'mode': k[1], **v} for k, v in rows.items()]
json.dump(d, open(p, 'w'), indent=1)
print('\n'.join(lines))
