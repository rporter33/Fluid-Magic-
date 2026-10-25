# Stage B, key "cmdA2": picks, summary, contact sheets and identity boards over cmdA's faces/ (cmda_review.py's own
# functions, imported unchanged), with this run's pick rules:
#   - battle faces with their own kit (a2cfg.OWN_KIT): the ".kit" rolls in BOTH views, so a face never shows two kits;
#     a failing kit roll is used flagged (reported) only when it is the best of its view by the gate count;
#   - every other face: the cmdA rule (the latest passing roll, else the best failure), over the first rolls, their
#     re-keyed copies (".k2": the same sheet through a2key.py) and the re-rolls (".r2"); ".kit" rolls are not used;
#   - the facing review by eye (eye.json "facing", made on the first scout backs) rejects only the sheet it was made on;
#     eye2.json holds this run's facing review per roll directory;
#   - rolls = generated sheets (a re-key is not a roll).
# Usage: python3 a2review.py picks | summary | contact | identity | all
import glob, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import a2cfg as C  # noqa: E402
import cmda_review as R  # noqa: E402
from cmda_faces import GROUPS  # noqa: E402

W = C.WA
EYE2 = os.path.join(C.A2, 'eye2.json')


def eye2():
    return json.load(open(EYE2)) if os.path.exists(EYE2) else {}


def picks():
    out = {}
    e2 = eye2()
    for unit, faces in GROUPS.items():
        for f in faces:
            for v in ('front', 'back'):
                cands = sorted(glob.glob(os.path.join(W, 'faces', f'{f}.{v}*', 'checks.json')))
                cands = [c for c in cands if os.path.basename(os.path.dirname(c)).split('.')[1] == v]
                reps = []
                for c in cands:
                    r = json.load(open(c)); d = os.path.dirname(c); name = os.path.basename(d)
                    ok = bool(r['pass'])
                    if name in e2 and e2[name].get('facing') == 'rejected':
                        ok = False
                    if name == f'{f}.{v}' and f'{f}.{v}' in (R.json.load(open(os.path.join(W, 'eye.json'))).get('facing', {})):
                        ok = False  # the morning's facing rejection, on this very sheet
                    reps.append((r, d, name, ok))
                if not reps:
                    out[f'{f}.{v}'] = None; continue
                if f in C.OWN_KIT and f not in C.KIT_HELD_BACK and any(x[2].endswith(('.kit', '.kit2')) for x in reps):
                    pool = [x for x in reps if x[2].endswith(('.kit', '.kit2'))]
                else:
                    pool = [x for x in reps if not x[2].endswith(('.kit', '.kit2'))] or reps
                passing = [x for x in pool if x[3]]
                best = sorted(passing, key=lambda x: x[2])[-1] if passing else max(pool, key=lambda x: (R.score(x[0]), x[2]))
                sheets = sorted({x[0]['sheet'] for x in reps})
                out[f'{f}.{v}'] = dict(dir=best[1], sheet=best[0]['sheet'], pass_=best[3], rolls=len(sheets),
                                       ownKit=best[2].endswith(('.kit', '.kit2')), rekeyed=bool((best[0].get('a2') or {}).get('rekeyOf'))
                                       or best[2].endswith(('.kit', '.kit2', '.r2')),
                                       body=(best[0].get('a2') or {}).get('body'))
    json.dump(out, open(os.path.join(W, 'picks.json'), 'w'), indent=1)
    return out


def summary():
    R.summary()  # cmdA's table (applies eye.json facing by key: undone below where the pick is another sheet)
    P = json.load(open(os.path.join(W, 'picks.json')))
    S = json.load(open(os.path.join(W, 'summary.json')))
    eye = json.load(open(os.path.join(W, 'eye.json')))
    e2 = eye2()
    for key, row in S.items():
        p = P.get(key)
        if not row or not p:
            continue
        name = os.path.basename(p['dir'])
        r = json.load(open(os.path.join(p['dir'], 'checks.json')))
        if key in eye.get('facing', {}) and name != key:  # the rejection was of the first roll, not this one
            row['gate'].pop('facingByEye', None); row.pop('facingByEye', None); row['pass_'] = bool(r['pass'])
        if name in e2:
            row['eye2'] = e2[name]
            if e2[name].get('facing') == 'rejected':
                row['pass_'] = False; row['gate']['facingByEye'] = False
        row['dir'] = name; row['ownKit'] = p.get('ownKit'); row['keyer'] = 'a2key' if p.get('rekeyed') else 'key.py'
        row['body'] = os.path.basename(p['body']) if p.get('body') else None
    json.dump(S, open(os.path.join(W, 'summary.json'), 'w'), indent=1)
    fails = {k: v for k, v in S.items() if v and not v['pass_']}
    print(len(S), 'figure-views;', sum(1 for v in S.values() if v and v['pass_']), 'pass;', len(fails), 'fail')
    for k, v in fails.items():
        print(' FAIL', k, v['dir'], {g: x for g, x in v['gate'].items() if x is False}, v['cells'], v.get('failing'))


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd in ('picks', 'all'):
        picks()
    if cmd in ('summary', 'all'):
        summary()
    if cmd in ('contact', 'all'):
        R.contact()
    if cmd in ('identity', 'all'):
        R.identity()
