# Stage B, key "cmdA2": cmdA's checks (cmda_pipe.py, unchanged) over new re-dress sheets, with the body each was painted
# on (the scout backs: the levy back body; caster backs: the re-made caster back body when its job used it).
# Usage: python3 a2pipe.py JOBS.json [JOB ...]       (prints one line per sheet; writes cmdA/faces/<face>.<view>.<tag>/)
#        python3 a2pipe.py --body RAW FIG VIEW KEY OUTDIR
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import a2cfg as C  # noqa: E402
import cmda  # noqa: E402

def fix_side(out, face, kind):
    """cmda_pipe measures the side colour with the BODY kind's nation (units.json). A Cinder Scout re-dressed onto the
    independent levy body was then measured as an independent (no side share, value only). Re-measure it with the
    face's own nation (the keyline the packer gives it) and re-apply cmda_pipe's gate."""
    import numpy as np
    from PIL import Image
    import cmda_pipe as P
    nat = cmda.FACES[face][1]
    if P.BYID[kind]['nation'] == nat:
        return None
    r = json.load(open(os.path.join(out, 'checks.json')))
    fd = os.path.join(out, 'frames'); meta = json.load(open(os.path.join(fd, f'{kind}.{r["view"]}.json')))
    st = next(f for f in meta['frames'] if f['name'] == 'stand' and not f.get('missing'))
    rgba = np.asarray(Image.open(os.path.join(fd, st['file'])).convert('RGBA')).astype(np.float64)
    keep = P.BYID[kind]['nation']; P.BYID[kind]['nation'] = nat
    try:
        r['sideCmd'] = P.side_cmd(rgba, st['anchor'], st['height'], nat)
    finally:
        P.BYID[kind]['nation'] = keep
    r['sideCmd']['nationFrom'] = 'face (cmdA2 fix_side)'
    g = r['gate']; g['side'] = bool(r['sideCmd']['pass'])
    r['pass'] = bool(g['cells'] and g['variety'] and g['rim'] and g['fringe'] and g['side'] and g['identity'] is not False)
    json.dump(r, open(os.path.join(out, 'checks.json'), 'w'), indent=1)
    return f" | side re-measured as {nat}: {r['sideCmd']['share']} below {r['sideCmd']['worstBelow']} -> {'PASS' if r['pass'] else 'FAIL'}"


BODY_DIR = {}  # raw body sheet -> its checked frames dir
for k, b in json.load(open(os.path.join(C.WA, 'bodies.json'))).items():
    BODY_DIR[b['raw']] = os.path.join(C.WA, b['frames'])
BODY_DIR[C.CASTER_BACK_FALLBACK] = os.path.join(C.CASTER_BACK_FALLBACK_DIR, 'frames')
BODY_DIR[C.CASTER_BACK_R2] = os.path.join(C.CASTER_BACK_R2_DIR, 'frames')


def one(j):
    face, view, tag = j['face'], j['view'], j['tag']
    kind = cmda.kind_of(face, view)
    _k, nat, unit, num, sex, marks = cmda.FACES[face]
    out = os.path.join(C.WA, 'faces', f'{face}.{view}.{tag}')
    p = subprocess.run([sys.executable, os.path.join(HERE, 'a2pipe_core.py'), j['out'], kind, view, cmda.key_of(kind, view),
                        out, '--body', BODY_DIR[j['refs'][0]], '--portrait', cmda.PORTRAIT.format(nat, unit, num)],
                       capture_output=True, text=True)
    if p.returncode == 0:
        r = json.load(open(os.path.join(out, 'checks.json')))
        r['a2'] = dict(body=j['refs'][0], ownKit=j.get('ownKit'), kit=j.get('kit'), job=j['job'])
        json.dump(r, open(os.path.join(out, 'checks.json'), 'w'), indent=1)
        return j['job'], p.stdout.strip() + (fix_side(out, face, kind) or '')
    return j['job'], (p.stdout.strip() or p.stderr[-800:])


def rekey(spec):
    face, view = spec.split('.')[:2]
    src = os.path.join(C.WA, 'faces', spec)
    raw = json.load(open(os.path.join(src, 'checks.json')))['sheet']
    kind = cmda.kind_of(face, view)
    _k, nat, unit, num, sex, marks = cmda.FACES[face]
    bodies = json.load(open(os.path.join(C.WA, 'bodies.json')))
    body = os.path.join(C.WA, bodies[f'{kind}.{view}']['frames'])
    out = src + '.k2'
    p = subprocess.run([sys.executable, os.path.join(HERE, 'a2pipe_core.py'), raw, kind, view, cmda.key_of(kind, view), out,
                        '--body', body, '--portrait', cmda.PORTRAIT.format(nat, unit, num)], capture_output=True, text=True)
    if p.returncode == 0:
        r = json.load(open(os.path.join(out, 'checks.json')))
        r['a2'] = dict(rekeyOf=spec, body=bodies[f'{kind}.{view}']['raw'], ownKit=False)
        json.dump(r, open(os.path.join(out, 'checks.json'), 'w'), indent=1)
    return spec, (p.stdout.strip() or p.stderr[-800:])


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[0] == '--fixside':  # re-measure the side of finished checks: --fixside FACE.VIEW.TAG ...
        for spec in a[1:]:
            face, view = spec.split('.')[:2]
            print(spec, fix_side(os.path.join(C.WA, 'faces', spec), face, cmda.kind_of(face, view)))
        sys.exit()
    if a[0] == '--rekey':
        with ThreadPoolExecutor(3) as ex:
            for n, r in ex.map(rekey, a[1:]):
                print(n, '|', r, flush=True)
        sys.exit()
    if a[0] == '--body':
        raw, fig, view, key, out = a[1:6]
        p = subprocess.run([sys.executable, os.path.join(HERE, 'a2pipe_core.py'), raw, fig, view, key, out], capture_output=True, text=True)
        print(p.stdout.strip() or p.stderr[-800:]); sys.exit()
    jobs = json.load(open(a[0]))
    if a[1:]:
        jobs = [j for j in jobs if j['job'] in a[1:]]
    jobs = [j for j in jobs if os.path.exists(j['out'])]
    with ThreadPoolExecutor(3) as ex:
        for n, r in ex.map(one, jobs):
            print(n, '|', r, flush=True)
