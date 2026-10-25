# Stage B, key "cmdB": one line per face and view from the newest checks of every roll (faces/<face>.<view>[.r2]).
# Usage: python3 cmdb_status.py [GROUP_PREFIX ...]
import glob, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402
pre = sys.argv[1:]
for unit, faces in GROUPS.items():
    for f in faces:
        if pre and not any(f.startswith(p) for p in pre):
            continue
        for v in ('front', 'back'):
            rolls = sorted(glob.glob(os.path.join(cmdb.W, 'faces', f'{f}.{v}*', 'checks.json')))
            rolls = [r for r in rolls if os.path.basename(os.path.dirname(r)).split('.')[1] == v]
            if not rolls:
                err = glob.glob(os.path.join(cmdb.W, 'faces', f'{f}.{v}*', 'pipe-error.txt'))
                print(f'{f}.{v}: ' + ('PIPE ERROR' if err else ('no sheet' if not os.path.exists(os.path.join(cmdb.RAW, f'{f}.{v}.redress.nb21.png')) else 'unchecked')))
                continue
            out = []
            for rp in rolls:
                r = json.load(open(rp)); ca = r.get('cameraRel') or r['cameraAll']
                bad = [k for k, x in r['gate'].items() if x is False]
                out.append(f"{os.path.basename(os.path.dirname(rp))[len(f)+len(v)+2:] or 'r1'} {'PASS' if r['pass'] else 'FAIL'} "
                           f"{ca['follow']} {','.join(ca.get('failing') or [])} {('[' + ','.join(bad) + ']') if bad else ''} "
                           f"side {r['sideCmd']['share']} id {(r.get('identity') or {}).get('dE2000')} keyIn {r['fringe']['keyInUnitPct']}")
            print(f'{f}.{v}: ' + ' || '.join(out))
