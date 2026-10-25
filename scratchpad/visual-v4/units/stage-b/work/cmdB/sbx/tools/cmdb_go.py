# Stage B, key "cmdB": the whole run, in order, resumable (a sheet already on disk is never generated again):
#   1. body edits (3) -> pipeline -> one re-roll of a body under 14/16, failure named;
#   2. the re-dress jobs whose bodies now exist;
#   3. every re-dress (one per face and view) with the checks following as sheets arrive;
#   4. picks -> one re-roll per failing sheet, failure named, while the cap allows -> picks;
#   5. summary, contact sheets, identity boards, scales, atlases.
# Every call goes through cmdb_run.py -> cmdgen.py (logged as "B cmdB: ...", capped at 150, failures included). An HTTP
# 402 (prepaid credits used up) stops the run at once and is reported; rerunning this script resumes where it stopped.
# Usage: python3 cmdb_go.py [--no-rerolls] [--par 3]
import json, os, subprocess, sys, threading
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402

W, J = cmdb.W, os.path.join(cmdb.W, 'jobs')
STOP = os.path.join(W, 'STOPPED-402')
PY = sys.executable


def sh(*a, log=None):
    p = subprocess.run([PY] + list(a), capture_output=True, text=True, cwd=HERE)
    out = p.stdout + (p.stderr[-1500:] if p.returncode else '')
    if log:
        open(os.path.join(W, log), 'a').write(out)
    print(out.strip()[-3000:], flush=True)
    return out


def used():
    return json.loads(subprocess.run([PY, os.path.join(HERE, 'cmdgen.py'), '--count'], capture_output=True, text=True).stdout)['used']


def stopped():
    return os.path.exists(STOP)


def bodies(par):
    sh('cmdb_run.py', os.path.join(J, 'bodies.json'), '--par', str(par), log='run-bodies.log')
    if stopped():
        return False
    sh('cmdb_bodies.py', 'edits', log='bodies-edits.log')
    B = json.load(open(os.path.join(W, 'bodies.json')))
    for (kind, view) in cmdb.EDIT_SRC:
        b = B.get(f'{kind}.{view}')
        if b and not b.get('gateCells') and not os.path.exists(os.path.join(cmdb.RAW, f'{kind}.{view}.body.edit.r2.nb21.png')):
            r = json.load(open(os.path.join(W, b['frames'], '..', 'checks.json')))
            fail = r['cameraAll'].get('failing') or []
            why = (f'only {b["cells"]} cells kept the camera of Image 1: in the cells {", ".join(fail)} the figure came out '
                   'turned, or larger or smaller in its cell than in Image 1.')
            sh('cmdb.py', 'body-reroll', kind, view, why)
            sh('cmdb_run.py', os.path.join(J, f'body-reroll-{kind}.{view}.json'), log='run-bodies.log')
            if stopped():
                return False
            sh('cmdb_bodies.py', 'edits', f'{kind}.{view}.r2', log='bodies-edits.log')
    return True


def build_redress():
    B = json.load(open(os.path.join(W, 'bodies.json')))
    jobs = []
    for unit, faces in GROUPS.items():
        for f in faces:
            for v in ('front', 'back'):
                if (f, v) in cmdb.REUSED_REDRESS:
                    continue
                kind = FACES[f][0]
                if not cmdb.body_sheet(kind, v):
                    print('no body yet for', f, v); continue
                jobs.append(cmdb.redress_job(f, v))
    # fronts first (the portrait's own view), then backs; within a view, group by kind
    jobs.sort(key=lambda j: (j['view'] != 'front', j['figure'], j['face']))
    json.dump(jobs, open(os.path.join(J, 'redress-all.json'), 'w'), indent=1)
    print(len(jobs), 're-dress jobs', flush=True)
    return jobs


def run_with_follow(jobs_file, log, par):
    open(os.path.join(W, log), 'w').close()
    t = threading.Thread(target=lambda: sh('cmdb_follow.py', jobs_file, os.path.join(W, log), log='follow-' + log))
    t.start()
    p = subprocess.run([PY, os.path.join(HERE, 'cmdb_run.py'), jobs_file, '--par', str(par)], cwd=HERE,
                       stdout=open(os.path.join(W, log), 'a'), stderr=subprocess.STDOUT)
    t.join()
    return p.returncode


def reason(r):
    g, why = r['gate'], []
    ca = r.get('cameraRel') or r.get('cameraAll') or {}
    if g.get('cells') is False:
        why.append(f'in the cells {", ".join(ca.get("failing") or [])} the figure did not keep the camera, facing or size of '
                   'the same cell of Image 1')
    if g.get('variety') is False:
        why.append('the two marching figures came out too alike: keep their legs apart as in Image 1')
    if g.get('fringe') is False:
        why.append('the edges of the figures were tinted by the background colour: keep the background colour off every '
                   'figure and its edges')
    if g.get('side') is False:
        why.append('the figure came out too pale to stand out from a light ground: keep its values as dark as Image 1')
    if g.get('identity') is False:
        why.append('the colours of the head and shoulders did not match the portrait')
    if g.get('facingByEye') is False:
        why.append('some figures turned to face us although Image 1 shows their backs')
    return '; '.join(why) + '.'


def rerolls(par, budget_left):
    sh('cmdb_review.py', 'picks')
    P = json.load(open(os.path.join(W, 'picks.json')))
    eye = json.load(open(os.path.join(W, 'eye.json'))) if os.path.exists(os.path.join(W, 'eye.json')) else {}
    todo = []
    for key, p in P.items():
        if not p or p['rolls'] > 1:
            continue
        r = json.load(open(os.path.join(p['dir'], 'checks.json')))
        if key in eye.get('facing', {}):
            r['gate']['facingByEye'] = False; r['pass'] = False
        if not r['pass']:
            todo.append((key, r))
    # the cheapest wins first: a single failing gate before several
    todo.sort(key=lambda kr: sum(1 for v in kr[1]['gate'].values() if v is False))
    todo = todo[:max(0, budget_left)]
    jobs = []
    for key, r in todo:
        f, v = key.split('.')
        extra = 'The last attempt failed: ' + reason(r) + ' Keep every figure exactly where, how large and facing which ' \
                'way Image 1 has it.'
        jobs.append(cmdb.redress_job(f, v, '.r2', extra))
    json.dump(jobs, open(os.path.join(J, 'rerolls.json'), 'w'), indent=1)
    print(len(jobs), 're-rolls', flush=True)
    if jobs:
        run_with_follow(os.path.join(J, 'rerolls.json'), 'run-rerolls.log', par)


def finish():
    for step in ('picks', 'summary', 'contact'):
        sh('cmdb_review.py', step)
    sh('cmdb_pack.py', 'scales')
    sh('cmdb_review.py', 'identity')
    sh('cmdb_pack.py', 'pack')


def main():
    a = sys.argv[1:]
    par = int(a[a.index('--par') + 1]) if '--par' in a else 3
    if stopped():
        os.rename(STOP, STOP + '.' + str(len(os.listdir(W))))
    ok = bodies(par)
    if ok:
        build_redress()
        run_with_follow(os.path.join(J, 'redress-all.json'), 'run-redress.log', par)
    if ok and not stopped() and '--no-rerolls' not in a:
        rerolls(par, 150 - used())
    finish()
    print(json.dumps({'used': used(), 'stopped402': stopped()}))


if __name__ == '__main__':
    main()
