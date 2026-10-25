# Runs pilot effect-sheet jobs through units/tools/gen.py (logged, budgeted: --stage D), a few at a time.
# Stops scheduling new calls at the first HTTP 402 (prepaid credits depleted) and reports it.
# Usage: python3 -I run_fx_jobs.py JOBS.json JOB [JOB ...] [--par 3]
import json, os, subprocess, sys, threading, time

HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.abspath(os.path.join(HERE, '..', '..', '..', 'tools', 'gen.py'))
args = sys.argv[1:]
par = 3
if '--par' in args:
    i = args.index('--par'); par = int(args[i + 1]); del args[i:i + 2]
jobs = {j['job']: j for j in json.load(open(args[0]))}
todo = [jobs[k] for k in args[1:]]
stop = threading.Event()
lock = threading.Lock()
results = []


def run(j):
    if stop.is_set():
        results.append((j['job'], 'skipped (stopped)')); return
    if os.path.exists(j['out']):
        results.append((j['job'], 'exists')); return
    cmd = [sys.executable, GEN, '--stage', 'D', '--purpose', j['purpose'], j['model'], j['out'], j['prompt']] + j['refs'] + ['--aspect', j['aspect']]
    t0 = time.time()
    p = subprocess.run(cmd, capture_output=True, text=True)
    out = (p.stdout + p.stderr).strip().replace('\n', ' | ')
    with lock:
        if 'HTTP 402' in out:
            stop.set()
        results.append((j['job'], f'rc={p.returncode} {time.time() - t0:.0f}s {out[-300:]}'))
        print(j['job'], f'rc={p.returncode}', out[-300:], flush=True)


threads = []
for j in todo:
    while sum(t.is_alive() for t in threads) >= par:
        time.sleep(0.5)
    if stop.is_set():
        results.append((j['job'], 'skipped (HTTP 402)')); continue
    t = threading.Thread(target=run, args=(j,)); t.start(); threads.append(t)
    time.sleep(1.0)
for t in threads:
    t.join()
print(json.dumps({'results': results, 'stopped402': stop.is_set()}, indent=1))
