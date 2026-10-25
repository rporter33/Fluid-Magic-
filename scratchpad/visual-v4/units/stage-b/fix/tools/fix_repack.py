# Stage B fix pass, critique fix 9: the key's cast taken out of the picked sheets' frames (units/tools/keycast.py) and the
# troop and commander atlases re-packed from them with the stages' own packers (tr_pack.py, cmdb_pack.py), unchanged:
#   - Ember Skirmisher back (green key): olive javelin bundles and scarf ends, whole figure (a Cinder kit holds no green);
#   - the magenta-keyed sheets with a staff, bow or spear: Thorn Militia, Briar Guard, Longbow Hunter (both views) and
#     the Elder Druid 05 and 08 fronts (their staffs), thin features only. The owner-kept Warden is left as kept.
# The processed frames go to stage-b/fix/work/sheets/<sheet>/frames (the original checks.json and key.json copied
# beside them); a copy of each stage's picks points at them; the packers write stage-b/atlas/troops and atlas/cmdB as
# before (the pre-fix atlases are kept in stage-b/pre-fix/atlas).
# Usage: python3 fix_repack.py
import json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SB = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS = os.path.abspath(os.path.join(SB, '..'))
FIXW = os.path.join(SB, 'fix', 'work')
sys.path.insert(0, os.path.join(UNITS, 'tools'))
import keycast  # noqa: E402

TROOPS = {('emberSkirmisher', 'back'): ('green', None)}
for u in ('thornMilitia', 'briarGuard', 'longbowHunter'):
    for v in ('back', 'front'):
        TROOPS[(u, v)] = ('magenta', None)
FACES = {'ed05.front': 'magenta', 'ed08.front': 'magenta'}


def process(src_dir, key, name):
    dst = os.path.join(FIXW, 'sheets', name)
    if os.path.exists(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    for f in ('checks.json', 'key.json'):
        if os.path.exists(os.path.join(src_dir, f)):
            shutil.copy(os.path.join(src_dir, f), os.path.join(dst, f))
    sh = keycast.run_dir(key, os.path.join(src_dir, 'frames'), os.path.join(dst, 'frames'))
    return dst, dict(key=key, scope=keycast.RULES[key]['scope'], maxShare=max(sh.values()), meanShare=round(sum(sh.values()) / len(sh), 4))


def run_packer(tools, code):
    """A stage's own packer, in its own interpreter and sandbox (its pack.py and checks.py, not units/tools')."""
    p = subprocess.run([sys.executable, '-I', '-c', f'import sys; sys.path.insert(0, {tools!r}); ' + code], cwd=tools,
                       capture_output=True, text=True)
    if p.returncode:
        raise SystemExit(p.stderr[-2000:])
    print(p.stdout[-600:])


def troops(report):
    W0 = os.path.join(SB, 'work', 'troops')
    picks = json.load(open(os.path.join(W0, 'picks.json')))
    for (u, v), (key, _) in TROOPS.items():
        p = picks[u][v]
        d, r = process(p['dir'], key, os.path.basename(p['dir'].rstrip('/')))
        p['dir'] = d; p['keyCast'] = r
        report[f'{u}.{v}'] = r
    W = os.path.join(FIXW, 'troopsw')  # at the same depth below units/ as work/troops (the packer's relative paths)
    os.makedirs(W, exist_ok=True)
    json.dump(picks, open(os.path.join(W, 'picks.json'), 'w'), indent=1)
    run_packer(os.path.join(W0, 'sbx', 'tools'), f"import tr_pack; tr_pack.W = {W!r}; tr_pack.main({os.path.join(SB, 'atlas', 'troops')!r})")
    for (u, v), _ in TROOPS.items():  # record the post-pass in each figure's metadata
        mp = os.path.join(SB, 'atlas', 'troops', 'figures', f'{u}.json')
        m = json.load(open(mp))
        m['views'][v]['keyCast'] = dict(tool='units/tools/keycast.py', **report[f'{u}.{v}'])
        json.dump(m, open(mp, 'w'), indent=1)


def commanders(report):
    W0 = os.path.join(SB, 'work', 'cmdB')
    W = os.path.join(FIXW, 'cmdBw')
    os.makedirs(W, exist_ok=True)
    picks = json.load(open(os.path.join(W0, 'picks.json')))
    for k, key in FACES.items():
        d, r = process(picks[k]['dir'], key, 'cmdB.' + k)
        picks[k]['dir'] = d; picks[k]['keyCast'] = r
        report[k] = r
    json.dump(picks, open(os.path.join(W, 'picks.json'), 'w'), indent=1)
    for f in ('scales.json', 'bodies.json', 'summary.json'):
        shutil.copy(os.path.join(W0, f), os.path.join(W, f))
    run_packer(os.path.join(W0, 'sbx', 'tools'), f"import cmdb_pack; cmdb_pack.W = {W!r}; cmdb_pack.pack_all()")
    for k in FACES:
        fid = {'ed05': 'elderDruid-05', 'ed08': 'elderDruid-08'}[k.split('.')[0]]
        mp = os.path.join(SB, 'atlas', 'cmdB', 'figures', f'{fid}.json')
        m = json.load(open(mp))
        m['views'][k.split('.')[1]]['keyCast'] = dict(tool='units/tools/keycast.py', **report[k])
        json.dump(m, open(mp, 'w'), indent=1)


if __name__ == '__main__':
    rep = {}
    troops(rep)
    commanders(rep)
    json.dump(rep, open(os.path.join(SB, 'fix', 'keycast-report.json'), 'w'), indent=1)
    print(json.dumps(rep, indent=1))
