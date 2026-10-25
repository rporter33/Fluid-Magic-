# cmdA2: before/after per figure-view (the 24 failing views and the battle faces' views), with generations used.
import json, os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import a2cfg as C  # noqa: E402
PRE = json.load(open(os.path.join(C.STAGEB, 'pre-cmdA2', 'work-cmdA', 'summary.json')))
PRES = json.load(open(os.path.join(C.STAGEB, 'pre-cmdA2', 'work-cmdA', 'scales.json')))
NOW = json.load(open(os.path.join(C.WA, 'summary.json')))
NOWS = json.load(open(os.path.join(C.WA, 'scales.json')))
gens = collections.Counter()
for ln in open(os.path.join(C.UNITS, 'gen-log.tsv')).read().splitlines()[1:]:
    r = ln.split('\t')
    if len(r) > 5 and r[5].startswith('B cmdA2:'):
        b = os.path.basename(r[0]).split('.')
        gens[f'{b[0]}.{b[1]}'] += 1
keys = [k for k, v in PRE.items() if v and not v['pass_']]
keys += [f'{f}.{v}' for f in C.BATTLE for v in ('front', 'back') if f'{f}.{v}' not in keys]
rows = []
for k in keys:
    a, b = PRE.get(k) or {}, NOW.get(k) or {}
    fa = [g for g, x in (a.get('gate') or {}).items() if x is False]
    fb = [g for g, x in (b.get('gate') or {}).items() if x is False]
    rows.append(dict(view=k, before=dict(pass_=a.get('pass_'), cells=a.get('cells'), keyIn=a.get('keyIn'), side=a.get('side'), failed=fa,
                                         bodyH=PRES.get(k, {}).get('bodyH')),
                     after=dict(pass_=b.get('pass_'), dir=b.get('dir'), cells=b.get('cells'), keyIn=b.get('keyIn'), side=b.get('side'),
                                failed=fb, failing=b.get('failing'), ownKit=b.get('ownKit'), keyer=b.get('keyer'), body=b.get('body'),
                                bodyH=NOWS.get(k, {}).get('bodyH')),
                     gens=gens.get(k, 0)))
json.dump(dict(rows=rows, gensByView=gens, total=sum(gens.values())), open(os.path.join(C.A2, 'before-after.json'), 'w'), indent=1)
for r in rows:
    a, b = r['before'], r['after']
    print(f"{r['view']:12} {('PASS' if a['pass_'] else 'FAIL'):4} {a['cells']:>5} kIn {a['keyIn']} {','.join(a['failed']):18} -> "
          f"{('PASS' if b['pass_'] else 'FAIL'):4} {b['cells']:>5} kIn {b['keyIn']} {','.join(b['failed']):10} {b['dir']:18} kit={b['ownKit']} gens={r['gens']}")
print('total gens', sum(gens.values()), dict(gens))
