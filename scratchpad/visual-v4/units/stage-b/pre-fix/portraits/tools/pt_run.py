# Stage B portraits: run jobs through the shared tools/gen.py (logged to gen-log.tsv with the purpose "B portraits: ..."),
# a few at a time, skipping jobs whose output exists. Counts this key's calls from the log and refuses past the cap.
# A failed call is retried once after a back-off; a job that fails twice is reported, not retried again.
# Usage: python3 pt_run.py JOB [JOB ...] [--workers 3] [--suffix r2 --prompt-dir DIR]
import json, os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(W, '..', '..', '..'))
GEN = os.path.join(UNITS, 'tools', 'gen.py')
LOG = os.path.join(UNITS, 'gen-log.tsv')
CAP = 80
KEY = 'B portraits:'


def used():
    n = 0
    with open(LOG) as f:
        for ln in f.read().splitlines()[1:]:
            c = ln.split('\t')
            if len(c) > 5 and c[5].startswith(KEY):
                n += 1
    return n


def run(job, tag='', tries=2):
    out = job['out'] if not tag else job['out'].replace('.nb21.png', f'.{tag}.nb21.png')
    if os.path.exists(out):
        return dict(job=job['job'], out=out, result='exists')
    err = ''
    for attempt in range(tries):
        if used() >= CAP:
            return dict(job=job['job'], out=out, result='refused: cap')
        purpose = (f"{KEY} {job['job']} {job['unit']} {job['nation']} candidate {job['face']}{job['cand']}"
                   f"{' ' + tag if tag else ''} ({'edit' if job.get('after') else 'new'}, nb21)")
        cmd = [sys.executable, GEN, '--stage', 'B', '--purpose', purpose, job['model'], out, job['promptFile']] + \
            job['refs'] + ['--aspect', job['aspect']]
        p = subprocess.run(cmd, capture_output=True, text=True)
        if p.returncode == 0 and os.path.exists(out):
            return dict(job=job['job'], out=out, result='ok', tail=p.stdout.strip()[-160:])
        err = (p.stdout + p.stderr).strip()[-300:]
        if attempt < tries - 1:
            time.sleep(30)
    return dict(job=job['job'], out=out, result='failed', err=err)


if __name__ == '__main__':
    a = sys.argv[1:]
    workers = 3
    tag = ''
    jobs_file = os.path.join(W, 'jobs.json')
    if '--workers' in a:
        i = a.index('--workers'); workers = int(a[i + 1]); del a[i:i + 2]
    if '--tag' in a:
        i = a.index('--tag'); tag = a[i + 1]; del a[i:i + 2]
    tries = 2
    if '--once' in a:
        a.remove('--once'); tries = 1
    if '--jobs' in a:
        i = a.index('--jobs'); jobs_file = a[i + 1]; del a[i:i + 2]
    jobs = {j['job']: j for j in json.load(open(jobs_file))}
    sel = [jobs[x] for x in a]
    print('used before', used())
    with ThreadPoolExecutor(workers) as ex:
        res = list(ex.map(lambda j: run(j, tag, tries), sel))
    for r in res:
        print(json.dumps(r))
    fl = os.path.join(W, 'api-failures.json')
    old = json.load(open(fl)) if os.path.exists(fl) else []
    stamp = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    old += [dict(at=stamp, job=r['job'], err=r['err']) for r in res if r['result'] == 'failed']
    json.dump(old, open(fl, 'w'), indent=1)
    print('used after', used())
