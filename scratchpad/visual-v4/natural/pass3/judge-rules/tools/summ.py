"""summary of a checks-<page>-<look>-dpr<d>-1440x900.json: per check, the views that fail; wild edge samples/fails/rim share; hover; extras. Usage: python3 -I summ.py file [...]"""
import sys, json
for f in sys.argv[1:]:
    d = json.load(open(f)); views = [k for k, v in d.items() if isinstance(v, dict) and 'wildEdge' in v]
    fails = {}; we = []; rim = []; ms = []
    for v in views:
        r = d[v]
        def bad(name, cond):
            if cond: fails.setdefault(name, []).append(v)
        bad('lines', not r['lines']['pass']); bad('wildEdge', r['wildEdge']['fails'] > 0); bad('rails', r['rails']['fails'] > 0)
        bad('seats', not r['seats']['pass']); L = r['layout']; bad('layout', any(L.get(k) for k in ['labelOverlaps', 'labelPieceOverlaps', 'pieceOverlaps', 'armiesOutsideInset']))
        bad('hit', r['hit']['wrong'] or r['hit']['cornerWrong']); bad('hoverChips', not r['hoverChips']['pass']); bad('dayChips', r['dayChips'].get('overlaps')); bad('stable', not r['stable']['identical'])
        if r['means'] != 'n/a': bad('means', r['means'].get('overBudget'))
        we.append((v, r['wildEdge']['samples'], r['wildEdge']['fails'], r['wildEdge'].get('directShare'))); x = r['wildEdge']['rim']
        if isinstance(x, dict): rim.append(x.get('share', x.get('quietEdgeShare'))); ms.append(x.get('ms'))
    hov = {k: (d[k].get('pass'), d[k].get('hairMin'), d[k].get('intMin')) for k in d if k.startswith('hover')}
    print('==', f.split('/')[-1], 'views', len(views))
    print('  failing checks by view:', json.dumps(fails))
    print('  wild edge samples/fails total:', sum(w[1] for w in we), sum(w[2] for w in we), ' rim/quiet share min-max:', (min(rim), max(rim)) if rim else None, ' decision ms min-max:', (min(ms), max(ms)) if ms else None)
    print('  hover:', json.dumps(hov))
    for k in ['wildLook', 'oldCap', 'rebake', 'snowNatural', 'design']:
        if k in d: s = json.dumps(d[k]); print('  ', k, s[:420])
    if 'naturalStart' in d: n = d['naturalStart']; print('   natural@start chroma', n['chroma']['pass'], 'cover', n['cover'].get('pass'), 'snow', n['snow']['pass'], 'readers', n['readers']['pass'])
    for k in ['readersMid', 'readersRef']:
        if k in d: print('  ', k, d[k]['pass'], d[k]['normal']['lightness']['patchAcc'], d[k]['normal']['lightness']['provinceAcc'])
    if 'times' in d: t = d['times']; print('   bakeCpuMs', t['bakeCpuMs'], 'wall', t['bakeWallMs'], 'natural steps', json.dumps(t['naturalStepsMs']), 'staticMsMean', t.get('staticMsMean'))
    print('   pageErrors', len(d['log']['pageErrors']), 'console', len(d['log']['console']))
