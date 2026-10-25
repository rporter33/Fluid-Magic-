# Stage B troops2: puts the troop sheets that now pass every gate into the troop atlases, in place of the flagged
# stand-ins, with the stage's own packer (work/troops/sbx/tools/tr_pack.py, unchanged) and the fix pass's key-cast
# post-pass where the fix pass applied it (units/tools/keycast.py: magenta Thornwood sheets, thin features; the green
# Ember Skirmisher back, whole figure). Starts from the picks the atlas was last packed from (fix/work/troopsw/picks.json);
# only the listed views change. The atlas as it was is kept beside the new one in atlas/troops/prev-troops2/.
# Usage: python3 t2_pack.py   (PASSED below lists the replacements; writes ../picks.json, atlas/troops, review/)
import json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W2 = os.path.abspath(os.path.join(HERE, '..'))
SB = os.path.abspath(os.path.join(W2, '..', '..'))
UNITS = os.path.abspath(os.path.join(SB, '..'))
TOOLS = os.path.join(SB, 'work', 'troops', 'sbx', 'tools')
ATLAS = os.path.join(SB, 'atlas', 'troops')
sys.path.insert(0, os.path.join(UNITS, 'tools'))
import keycast  # noqa: E402

KEYCAST = {('emberSkirmisher', 'back'): 'green'}
# passed every automatic gate but failed the eye check (review/new-pass-frames.png); their .patched copies replace them
EYE_FAIL = {'t2b.briarGuard.front.dress': 'dropped-weapon cell holds a cheering man',
            't2b.heavyInfantry.back.dress': 'hit frame faces the camera in a back sheet'}
for u in ('thornMilitia', 'briarGuard', 'longbowHunter'):
    for v in ('back', 'front'):
        KEYCAST[(u, v)] = 'magenta'


def passed():
    """(figure, view) -> troops2 sheet name, for every troops2 sheet whose checks pass (the latest passing round wins)."""
    out = {}
    for name in sorted(os.listdir(os.path.join(W2, 'sheets'))):
        ck = os.path.join(W2, 'sheets', name, 'checks.json')
        if not os.path.exists(ck) or name in EYE_FAIL:
            continue
        r = json.load(open(ck))
        if r.get('pass'):
            parts = name.split('.')
            out[(parts[1], parts[2])] = name
    return out


def main():
    picks = json.load(open(os.path.join(SB, 'fix', 'work', 'troopsw', 'picks.json')))
    rep = {}
    for (fig, view), name in sorted(passed().items()):
        if fig not in picks:
            continue  # the Wolf Rider is packed by t2_wolfpack.py
        d = os.path.join(W2, 'sheets', name)
        r = json.load(open(os.path.join(d, 'checks.json')))
        old = picks[fig][view]
        entry = dict(dir=d, sheet=r['sheet'], status='pass', autoPass=True, failed=[],
                     note=f'troops2: replaces the {old["status"]} {os.path.basename(old["sheet"])} (failed {old["failed"]})',
                     replaces=dict(sheet=old['sheet'], status=old['status'], failed=old['failed']))
        if (fig, view) in KEYCAST:
            key = KEYCAST[(fig, view)]
            dst = os.path.join(W2, 'packw', 'sheets', name)
            if os.path.exists(dst):
                shutil.rmtree(dst)
            os.makedirs(dst)
            for f in ('checks.json', 'key.json', 'proof.sideKeyline.png', 'proof.neutral.png'):
                if not os.path.exists(os.path.join(d, f)):
                    continue
                shutil.copy(os.path.join(d, f), os.path.join(dst, f))
            sh = keycast.run_dir(key, os.path.join(d, 'frames'), os.path.join(dst, 'frames'))
            entry['dir'] = dst
            entry['keyCast'] = dict(key=key, scope=keycast.RULES[key]['scope'], maxShare=max(sh.values()),
                                    meanShare=round(sum(sh.values()) / len(sh), 4))
        picks[fig][view] = entry
        rep[f'{fig}.{view}'] = dict(new=name, old=os.path.basename(old['sheet']), oldStatus=old['status'])
    json.dump(picks, open(os.path.join(W2, 'picks.json'), 'w'), indent=1)
    # keep the atlas as it was beside the new one
    prev = os.path.join(ATLAS, 'prev-troops2')
    if not os.path.exists(prev):
        os.makedirs(prev)
        for f in os.listdir(ATLAS):
            p = os.path.join(ATLAS, f)
            if f.startswith('troops-') and os.path.isfile(p):
                shutil.copy2(p, os.path.join(prev, f))
        shutil.copytree(os.path.join(ATLAS, 'figures'), os.path.join(prev, 'figures'))
    p = subprocess.run([sys.executable, '-I', '-c', f'import sys; sys.path.insert(0, {TOOLS!r}); import tr_pack; tr_pack.W = {W2!r}; '
                        f'tr_pack.main({ATLAS!r})'], cwd=TOOLS, capture_output=True, text=True)
    if p.returncode:
        raise SystemExit(p.stderr[-2000:])
    # carry the fix pass's key-cast record for the views not replaced, and record the replacements
    for fig in {k[0] for k in KEYCAST} | {k.split('.')[0] for k in rep}:
        mp = os.path.join(ATLAS, 'figures', f'{fig}.json')
        m = json.load(open(mp))
        for view in ('back', 'front'):
            e = picks[fig][view]
            if e.get('keyCast'):
                m['views'][view]['keyCast'] = dict(tool='units/tools/keycast.py', **e['keyCast'])
            if e.get('replaces'):
                m['views'][view]['replaces'] = e['replaces']
                m['views'][view]['madeBy'] = 'stage B troops2 (stage-b/work/troops2)'
        json.dump(m, open(mp, 'w'), indent=1)
    json.dump(rep, open(os.path.join(W2, 'pack-report.json'), 'w'), indent=1)
    print(p.stdout[-800:])
    print(json.dumps(rep, indent=1))


if __name__ == '__main__':
    main()
