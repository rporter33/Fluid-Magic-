# Stage B troops2: runs generation jobs through t2gen.py (logged, capped at 50 for key "troops2"), at most 2 in flight,
# with back-off on rate limits and upstream errors. A job whose output already exists is skipped. HTTP 402 stops the
# whole run at once (a STOPPED-402 marker is written beside the jobs; no probing).
# Usage: python3 t2run.py JOBS.json [JOB ...] [--par 2]
import json, os, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..'))
STOP = os.path.join(W, 'STOPPED-402')
stop = threading.Event()


def run(j):
    args = [sys.executable, os.path.join(HERE, 't2gen.py'), '--purpose', os.environ.get('T2_KEY', 'B troops2:') + ' ' + j['purpose'], '--job', j['job'],
            j['model'], j['out'], j['promptFile']] + j['refs'] + ['--aspect', j.get('aspect', '1:1')]
    for attempt in range(4):
        if os.path.exists(j['out']):
            return j['job'], 'exists'
        if stop.is_set() or os.path.exists(STOP):
            return j['job'], 'SKIPPED (402 stop)'
        p = subprocess.run(args, capture_output=True, text=True)
        if p.returncode == 0:
            return j['job'], p.stdout.strip()[-160:]
        msg = (p.stdout + p.stderr)[-400:]
        if 'REFUSED' in msg:
            return j['job'], msg
        if 'HTTP 402' in msg:
            stop.set()
            open(STOP, 'w').write(time.strftime('%H:%MZ', time.gmtime()) + ' ' + j['job'] + ': HTTP 402\n')
            return j['job'], 'STOP HTTP 402 ' + msg[-200:]
        if any(s in msg for s in ('HTTP 429', 'HTTP 503', 'HTTP 500', 'HTTP 502', 'HTTP 504', 'timed out', 'NO IMAGE')) and attempt < 3:
            time.sleep(45 * (attempt + 1)); continue
        return j['job'], 'FAILED ' + msg
    return j['job'], 'FAILED after retries'


def main():
    args = sys.argv[1:]
    par = 2
    if '--par' in args:
        i = args.index('--par'); par = min(2, int(args[i + 1])); del args[i:i + 2]
    jobs = json.load(open(args[0]))
    if args[1:]:
        jobs = [j for j in jobs if j['job'] in args[1:]]
    with ThreadPoolExecutor(par) as ex:
        for name, res in ex.map(run, jobs):
            print(name, '->', res, flush=True)


if __name__ == '__main__':
    main()
