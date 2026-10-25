# Keys and cuts the art director's re-rolls (fx_reroll.py) with fx_process.py: each candidate into work/cut/<sheet>.<cand>/.
# L2h.b painted its stages in a 6 by 4 grid (a row of thick roots, the growing halves, the dried halves and the withering
# halves) instead of the asked 6 by 2: it is cut with its own grid (L2hb). Usage: python3 -I fx_fix_cut.py [JOB ...]
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fx_layouts  # noqa: E402
from fx_layouts import grid  # noqa: E402
from fx_reroll import REROLL  # noqa: E402
import fx_process  # noqa: E402
WORK = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(WORK, '..'))
ROWS4 = [f'big{s}{h}' for s in (1, 2, 3) for h in 'BF'] + [f'coil{s}{h}' for s in (1, 2, 3) for h in 'BF'] + \
        [f'dry{s}{h}' for s in (1, 2, 3) for h in 'BF'] + [f'wither{s}{h}' for s in (1, 2, 3) for h in 'BF']
fx_layouts.SHEETS.update(REROLL)
fx_layouts.SHEETS['L2hb'] = {'title': 'open root coils, back and front halves (as painted: 6 by 4)', 'aspect': '4:3', 'bg': 'magenta', 'blend': 'normal', 'color': 'loam',
                             'els': [dict(e, shape='halfcoil') for e in grid(0, 0, 1200, 896, 6, 4, ROWS4, pad=0)]}
JOBS = {'L2h.a': ('L2h', 'L2h.a.nb21.png'), 'L2h.b': ('L2hb', 'L2h.b.g3pro.png'), 'L3k.a': ('L3k', 'L3k.a.nb21.png'), 'L3k.b': ('L3k', 'L3k.b.g3pro.png'),
        'E3e.a': ('E3', 'E3e.a.nb21.png'), 'E3e.b': ('E3', 'E3e.b.g3pro.png'), 'G1f.a': ('G1f', 'G1f.a.nb21.png'), 'G1f.b': ('G1f', 'G1f.b.g3pro.png'),
        'G1l.a': ('G1l', 'G1l.a.nb21.png'), 'G1l.b': ('G1l', 'G1l.b.g3pro.png')}


def main():
    todo = sys.argv[1:] or list(JOBS)
    for j in todo:
        layout, raw = JOBS[j]
        out = os.path.join(WORK, 'cut', j)
        r = fx_process.process(os.path.join(STAGE, 'raw', raw), layout, out)
        miss = [e['name'] for e in r['elements'] if e.get('missing')]
        edge = [e['name'] for e in r['elements'] if e.get('touchesSheetEdge')]
        k = r.get('key', {})
        print(f"{j}: {len(r['elements']) - len(miss)}/{len(r['elements'])} cut; missing {miss}; edge {edge}; stray {r['strayAlphaPct']}%; "
              f"unowned {r['unownedComponents']}; fringe {k.get('fringePct')}; key in art {k.get('keyInUnitPct')}")


if __name__ == '__main__':
    main()
