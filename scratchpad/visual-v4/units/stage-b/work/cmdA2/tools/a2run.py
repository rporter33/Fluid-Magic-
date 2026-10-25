# Stage B, key "cmdA2": runs jobs through a2gen.py (logged "B cmdA2:", cap 50), at most 2 in flight. A rate limit or a
# server error backs off and retries (each retry is a logged call, so at most one retry); HTTP 402 stops everything.
# Usage: python3 a2run.py JOBS.json [JOB ...] [--par 2]
import json, os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
STOP = os.path.join(HERE, '..', 'STOPPED-402')


def run(j):
    args = [sys.executable, os.path.join(HERE, 'a2gen.py'), '--purpose', 'B cmdA2: ' + j['purpose'], j['model'], j['out'],
            j['promptFile']] + j['refs'] + ['--aspect', j.get('aspect', '1:1')]
    for attempt in range(2):
        if os.path.exists(j['out']):
            return j['job'], 'exists'
        if os.path.exists(STOP):
            return j['job'], 'SKIPPED: stopped after HTTP 402'
        p = subprocess.run(args, capture_output=True, text=True)
        if p.returncode == 0:
            return j['job'], 'ok ' + p.stdout.strip()[-120:]
        msg = (p.stdout + p.stderr)[-400:]
        if 'REFUSED' in msg or 'HTTP 402' in msg:
            return j['job'], 'STOP ' + msg
        if any(s in msg for s in ('HTTP 429', 'HTTP 503', 'HTTP 500', 'HTTP 502', 'HTTP 504', 'timed out', 'Connection reset',
                                  'NO IMAGE', 'RemoteDisconnected')) and attempt == 0:
            time.sleep(45); continue
        return j['job'], 'FAILED ' + msg
    return j['job'], 'FAILED after one retry'


if __name__ == '__main__':
    a = sys.argv[1:]
    par = 2
    if '--par' in a:
        i = a.index('--par'); par = min(2, int(a[i + 1])); del a[i:i + 2]
    jobs = json.load(open(a[0]))
    if a[1:]:
        jobs = [j for j in jobs if j['job'] in a[1:]]
    with ThreadPoolExecutor(par) as ex:
        for name, res in ex.map(run, jobs):
            print(time.strftime('%H:%M:%S'), name, '->', res, flush=True)
