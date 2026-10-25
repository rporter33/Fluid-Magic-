# Re-applies cmda_pipe's fringe gate (cmda_edge.py) to checks.json files written before it. Usage: python3 cmda_regate.py DIR ...
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from cmda_edge import edge_dev_split
for d in sys.argv[1:]:
    c = os.path.join(d, 'checks.json')
    if not os.path.exists(c):
        continue
    r = json.load(open(c))
    if 'edgeDevThickPct' in r['fringe']:
        continue
    r['fringe'].update(edge_dev_split(os.path.join(d, 'keyed.png')))
    f = r['fringe']
    f['pass_'] = bool(f['fringePct'] <= 0.2 and f['keyInUnitPct'] <= 0.5 and f['edgeDevThickPct'] <= 8.0)
    g = r['gate']; g['fringe'] = f['pass_']
    r['pass'] = bool(g['cells'] and g['variety'] and g['rim'] and g['fringe'] and g['side'] and g['identity'] is not False)
    json.dump(r, open(c, 'w'), indent=1)
    print(os.path.basename(d), 'edgeDev', f['edgeDevPct'], 'thick', f['edgeDevThickPct'], 'shift', f['deviatingChromaShift'], 'pass', r['pass'])
