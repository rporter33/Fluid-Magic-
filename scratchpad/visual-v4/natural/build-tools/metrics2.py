# the prototype's look metrics (proto/metrics.py measure) on the built page's shots: python3 -I metrics2.py
import sys, os, json
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/'
sys.path.insert(0, P + 'proto'); from metrics import measure, R
rows = [('ref-2 (zoomed in)', measure(R + 'ref-2.png', (800, 129, 2230, 1144), 400, 1630 * 2868 / 2000)), ('ref-4 (further out)', measure(R + 'ref-4.png', (800, 129, 2230, 1144), 300, 1630 * 2868 / 2000))]
for tag in ['', 'clear-']:
    for v, box, pp in [('look-ref200a', (30, 160, 1330, 730), 200), ('look-ref200b', (30, 160, 1330, 730), 200), ('look-mid', (30, 160, 1330, 730), 108), ('look-start', (270, 160, 1120, 690), 96)]:
        f = P + 'shots/' + tag + v + '.png'
        if os.path.exists(f): rows.append(((tag or 'natural-') + v, measure(f, box, pp, 1440)))
keys = ['Lp5', 'Lp50', 'Lp95', 'Lsd', 'Cmean', 'Cover012pct', 'busy10', 'busy20', 'patch10', 'patch15']
print('| view | ' + ' | '.join(keys) + ' |'); print('|' + '---|' * (len(keys) + 1))
for n, r in rows: print(f'| {n} | ' + ' | '.join(str(r[k]) for k in keys) + ' |')
json.dump(dict(rows), open(P + 'out/metrics.json', 'w'), indent=1)
