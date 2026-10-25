"""summary of the final verifier's checksx runs: per run, views, fails, page errors, console errors; per view the wild edge, rails, lines, layout, readers"""
import json, glob, os, sys
OUT = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/out/'
for f in sorted(glob.glob(OUT + 'checksx-*.json')):
    d = json.load(open(f)); log = d.get('log', {}); views = [k for k in d if isinstance(d[k], dict) and 'wildEdge' in d[k]]
    edge = sum(d[v]['wildEdge'].get('samples', 0) for v in views); efail = sum(d[v]['wildEdge'].get('fails', 0) for v in views)
    rails = sum(d[v]['rails'].get('samples', 0) for v in views); rfail = sum(d[v]['rails'].get('fails', 0) for v in views)
    cons = [c for c in log.get('console', []) if 'error' in c and 'software WebGL' not in c]
    print(os.path.basename(f), 'min', d.get('totalMin'), 'views', len(views), 'edge', edge, efail, 'rails', rails, rfail, 'FAILS', json.dumps(d.get('fails'))[:400], 'pageErrors', len(log.get('pageErrors', [])), 'consoleErrors', len(cons), json.dumps(cons[:2])[:200])
    for k in ['hover_start', 'hover_mid', 'hover_near', 'hover_near1180', 'focus_start', 'focus_mid', 'focus_near', 'focus_near1180']:
        if k in d: x = d[k]; print('   ', k, json.dumps({kk: x.get(kk) for kk in ['applicable', 'pass', 'provinces', 'hairMin', 'intMin']} if k.startswith('hover') else {'pass': x.get('pass'), 'provinces': x.get('provinces'), 'hover': [x['hover'].get('samples'), x['hover'].get('min'), x['hover'].get('under')], 'select': [x['select'].get('samples'), x['select'].get('min'), x['select'].get('under')]}))
    for k in ['wildLook', 'startClear', 'footprint', 'interact', 'rebake']:
        if k in d: x = d[k]; print('   ', k, json.dumps(x)[:300])
    if 'sweep' in d: s = d['sweep']; print('    sweep', json.dumps({k: s.get(k) for k in ['views', 'samples', 'fails', 'samplesUnder110', 'minRatio', 'worst', 'pass']}))
    if 'naturalStart' in d: n = d['naturalStart']; print('    natural@m70 chroma', n['chroma'].get('pass'), 'snow', n['snow'].get('pass'), 'cover', n['cover'].get('pass'))
    if 'snowNatural' in d: print('    snow', json.dumps(d['snowNatural'].get('pass')), json.dumps(d.get('snowClear', {}).get('pass') if d.get('snowClear') else None), 'design', json.dumps(d['design'].get('reliefRulesPass')))
    for v in views:
        r = d[v]; rd = r.get('readers')
        if rd and isinstance(rd, dict) and not rd.get('ERR'):
            print('    readers', v, r.get('Dpx'), 'pass', rd.get('pass'), 'farPass', rd.get('farPass'), 'normal', rd.get('normal'), 'unexplored', rd.get('unexplored'), 'verifier', json.dumps(rd.get('verifier'))[:160])
        elif rd: print('    readers', v, 'ERR', rd)
