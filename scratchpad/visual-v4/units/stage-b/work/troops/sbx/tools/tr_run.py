# Stage B troops: runs generation jobs through tr_gen.py (logged, capped at 80 for key "troops"), a few at a time, with
# back-off on rate limits and upstream errors. A job whose output already exists is skipped.
# Usage: python3 tr_run.py JOBS.json [JOB ...] [--par 3]
import json, os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))


def run(j):
    args = [sys.executable, os.path.join(HERE, 'tr_gen.py'), '--purpose', 'B troops: ' + j['purpose'], '--job', j['job'],
            j['model'], j['out'], j['promptFile']] + j['refs'] + ['--aspect', j.get('aspect', '1:1')]
    for attempt in range(4):
        if os.path.exists(j['out']):
            return j['job'], 'exists'
        p = subprocess.run(args, capture_output=True, text=True)
        if p.returncode == 0:
            return j['job'], p.stdout.strip()[-160:]
        msg = (p.stdout + p.stderr)[-300:]
        if 'REFUSED' in msg:
            return j['job'], msg
        if any(s in msg for s in ('HTTP 429', 'HTTP 503', 'HTTP 500', 'HTTP 502', 'timed out', 'NO IMAGE')) and attempt < 3:
            time.sleep(40 * (attempt + 1)); continue
        return j['job'], 'FAILED ' + msg
    return j['job'], 'FAILED after retries'


def main():
    args = sys.argv[1:]
    par = 3
    if '--par' in args:
        i = args.index('--par'); par = int(args[i + 1]); del args[i:i + 2]
    jobs = json.load(open(args[0]))
    if args[1:]:
        jobs = [j for j in jobs if j['job'] in args[1:]]
    with ThreadPoolExecutor(par) as ex:
        for name, res in ex.map(run, jobs):
            print(name, '->', res, flush=True)


if __name__ == '__main__':
    main()
