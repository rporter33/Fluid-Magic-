# Stage B fix pass, critique fix 11: writes every commander face's production kit (cmd_kits.py) to
# work/cmdA/kits.json and work/cmdB/kits.json, and records it in each painted figure's sidecar
# (atlas/cmdA|cmdB/figures/<unit>-<NN>.json, "productionKit"). Usage: python3 -I fix_kits.py
import json, os, subprocess, sys
SB = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CODE = """
import json, sys
from {mod} import FACES
from cmd_kits import kit
print(json.dumps({{f: dict(unit=v[2], num=v[3], **kit(f, v[5])) for f, v in FACES.items()}}))
"""
out = {}
for key, mod in (('cmdA', 'cmda_faces'), ('cmdB', 'cmdb_faces')):
    tools = os.path.join(SB, 'work', key, 'sbx', 'tools')
    p = subprocess.run([sys.executable, '-I', '-c', f'import sys; sys.path.insert(0, {tools!r})' + CODE.format(mod=mod)], capture_output=True, text=True, cwd=tools)
    if p.returncode:
        raise SystemExit(p.stderr)
    kits = json.loads(p.stdout)
    json.dump(kits, open(os.path.join(SB, 'work', key, 'kits.json'), 'w'), indent=1)
    n = 0
    figd = os.path.join(SB, 'atlas', key, 'figures')
    for f, k in kits.items():
        fp = os.path.join(figd, f"{k['unit']}-{k['num']}.json")
        if os.path.exists(fp):
            m = json.load(open(fp)); m['productionKit'] = {kk: vv for kk, vv in k.items() if kk not in ('unit', 'num')}
            json.dump(m, open(fp, 'w'), indent=1); n += 1
    changed = sum(1 for k in kits.values() if k.get('weaponChanged'))
    mant = sum(1 for k in kits.values() if k.get('mantle'))
    out[key] = dict(faces=len(kits), weaponChanged=changed, mantleAdded=mant, sidecarsUpdated=n)
print(json.dumps(out))
