import sys, os, json
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/'
sys.path.insert(0, P + 'proto'); from metrics import measure, R
S = P + 'ad/shots/'
rows = [('ref-2', measure(R + 'ref-2.png', (800, 129, 2230, 1144), 400, 1630 * 2868 / 2000)), ('ref-3', measure(R + 'ref-3.png', (300, 129, 2230, 1144), 300, 1630 * 2868 / 2000)), ('ref-4', measure(R + 'ref-4.png', (800, 129, 2230, 1144), 300, 1630 * 2868 / 2000))]
for v, box, pp in [('start', (262, 165, 1128, 690), 96), ('mid', (20, 165, 1230, 735), 175), ('refC', (20, 165, 1230, 735), 200), ('refW', (20, 165, 1230, 735), 200)]:
    for k in ['all', 'nohair', 'nohamlet', 'nolabels', 'landonly']:
        rows.append((f'{v}-{k}', measure(S + f'L-{v}-{k}.png', box, pp, 1440)))
keys = ['Lp5', 'Lp50', 'Lp95', 'Lsd', 'Cmean', 'Cp90', 'Cover012pct', 'busy10', 'busy20', 'patch10', 'patch15']
print('| view | ' + ' | '.join(keys) + ' |'); print('|' + '---|' * (len(keys) + 1))
for n, r in rows: print(f'| {n} | ' + ' | '.join(str(r[k]) for k in keys) + ' |')
json.dump(dict(rows), open(P + 'ad/layers-metrics.json', 'w'), indent=1)
