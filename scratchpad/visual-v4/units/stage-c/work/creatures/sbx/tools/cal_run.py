# Runs calibration jobs through calgen.py (logged, capped at 30 for key "cal"), a few at a time.
# Usage: python3 cal_run.py JOBS.json [JOB ...] [--par 3]
import json, subprocess, sys, os, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))


def run(j):
    args = [sys.executable, os.path.join(HERE, 'calgen.py'), '--purpose', 'B cal: ' + j['purpose'], j['model'], j['out'],
            j['promptFile']] + j['refs'] + ['--aspect', j.get('aspect', '1:1')] + (['--size', j['size']] if j.get('size') else [])
    for attempt in range(3):
        if os.path.exists(j['out']):
            return j['job'], 'exists'
        p = subprocess.run(args, capture_output=True, text=True)
        if p.returncode == 0:
            return j['job'], p.stdout.strip()[-200:]
        msg = (p.stdout + p.stderr)[-300:]
        if 'REFUSED' in msg:
            return j['job'], msg
        if any(s in msg for s in ('HTTP 429', 'HTTP 503', 'HTTP 500', 'timed out')) and attempt < 2:
            time.sleep(30 * (attempt + 1)); continue
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
