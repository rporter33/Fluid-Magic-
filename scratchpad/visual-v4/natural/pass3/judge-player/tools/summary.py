import json, sys
J = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-player/out/'
B = ['p2', 'relief', 'massif', 'open']
V = sys.argv[1].split(',') if len(sys.argv) > 1 else ['far', 'start', 'mid', 'ref', 'ash', 'grey', 'mere', 'ashmax', 'greymax', 'meremax', 'phone-fit', 'phone-mid-ash', 'phone-near-ash']
CV = ['protan', 'deutan', 'tritan']
def g(d, *ks):
    for k in ks:
        if d is None: return None
        d = d.get(k) if isinstance(d, dict) else None
    return d
print('EDGE: line salience p10 | share>=20 | share<10 | light-line share | ground step p50   (normal; worst CVD share>=20)')
for v in V:
    row = [v]
    for b in B:
        try: d = json.load(open(J + f'an-{b}-{v}.json'))
        except FileNotFoundError: row.append('-'); continue
        e = g(d, 'vis', 'normal', 'edge') or {}
        cv = min((g(d, 'vis', c, 'edge', 'share_sal_ge20') or 0) for c in CV)
        row.append(f"{b}: {e.get('sal_p10')}|{e.get('share_sal_ge20')}|{e.get('share_sal_lt10')}|{e.get('light_line_share')}|{e.get('ground_p50')} cvd{cv}")
    print('  '.join(row))
print('\nONSET: ground AUC wild-core vs land ring | d50 (D) | wild-like share 0..0.15 D inside | wild-like share 0.03..0.25 D outside (all / hills+mtn edges) ; worst-CVD AUC')
for v in V:
    row = [v]
    for b in B:
        try: d = json.load(open(J + f'an-{b}-{v}.json'))
        except FileNotFoundError: row.append('-'); continue
        o = g(d, 'vis', 'normal', 'onset') or {}
        cv = min((g(d, 'vis', c, 'onset', 'auc') or 9) for c in CV)
        row.append(f"{b}: {o.get('auc')}|{g(o,'all','d50_D')}|{g(o,'all','inside_0_15')}|{g(o,'all','spill_share')}/{g(o,'hillsmtn','spill_share')} cvd{cv}")
    print('  '.join(row))
print('\nPER WILD (normal): core classed wild | inside 0..0.15 D | outside spill')
for v in V:
    row = [v]
    for b in B:
        try: d = json.load(open(J + f'an-{b}-{v}.json'))
        except FileNotFoundError: continue
        ow = g(d, 'vis', 'normal', 'onset_wild') or {}
        row.append(b + ': ' + ' '.join(f"{w[:4]}={x['core_as_wild']}/{x['inside_0_15']}/{x['spill_share']}" for w, x in ow.items()))
    print('  '.join(row))
print('\nVS PASSABLE: AUC peaks-core vs passable mountains | dE med ; vs hills | dE ; (normal / worst CVD)')
for v in V:
    row = [v]
    for b in B:
        try: d = json.load(open(J + f'an-{b}-{v}.json'))
        except FileNotFoundError: continue
        n = g(d, 'vis', 'normal') or {}
        cm = min((g(d, 'vis', c, 'auc_vs_mountains_peaks') or 9) for c in CV); ch = min((g(d, 'vis', c, 'auc_vs_hills_peaks') or 9) for c in CV)
        row.append(f"{b}: M {n.get('auc_vs_mountains_peaks')}/{cm} dE{n.get('dE_vs_mountains_peaks')}  H {n.get('auc_vs_hills_peaks')}/{ch} dE{n.get('dE_vs_hills_peaks')}")
    print('  '.join(row))
print('\nNEIGHBOURS: dE76 of median colour, band 0.03..0.2 D outside vs own interior (spill neighbours and mean of all)')
for v in V:
    row = [v]
    for b in B:
        try: d = json.load(open(J + f'an-{b}-{v}.json'))
        except FileNotFoundError: continue
        nb = d['nb']; keys = ['Halevale', 'Karreach', 'Ashvale', 'Morholt']
        mean = sum(x['dE_med'] for x in nb.values()) / max(1, len(nb))
        row.append(f"{b}: " + ' '.join(f"{k[:3]}{nb[k]['dE_med']}" for k in keys if k in nb) + f" all{mean:.1f}")
    print('  '.join(row))
