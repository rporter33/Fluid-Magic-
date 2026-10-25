# Rest of stage D: runs generation jobs through units/tools/gen.py --stage D (one log, one budget), N at a time.
# This part's own cap: 165 generations whose purpose starts "D rest:" (stage D 210; the pilot used 29; 16 kept back for
# later fix re-rolls). A job whose output already exists is skipped (re-run safe). HTTP 402 stops everything.
# Usage: python3 -I dd_gen.py JOBS.json [--only JOB ...] [--par N]
import json, os, subprocess, sys, threading, time

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
GEN = os.path.join(UNITS, 'tools', 'gen.py')
LOG = os.path.join(UNITS, 'gen-log.tsv')
CAP, TAG = 165, 'D rest:'
STOP = os.path.join(HERE, '..', 'STOP')
lock = threading.Lock()


def used():
    n = 0
    for ln in open(LOG).read().splitlines()[1:]:
        c = ln.split('\t')
        if len(c) > 5 and c[4] == 'D' and c[5].startswith(TAG):
            n += 1
    return n


def run(job, out_lines):
    if os.path.exists(STOP):
        out_lines.append(f"{job['job']}: STOP present"); return
    if os.path.exists(job['out']):
        out_lines.append(f"{job['job']}: exists, skipped"); return
    with lock:
        if used() >= CAP:
            out_lines.append(f"{job['job']}: REFUSED, cap {CAP} reached"); return
    if not job.get('aspect'):
        job['aspect'] = json.load(open(job['refs'][0].rsplit('.png', 1)[0] + '.json'))['aspect']
    cmd = [sys.executable, '-I', GEN, '--stage', 'D', '--purpose', job['purpose'], job['model'], job['out'], job['prompt']] + job['refs'] + ['--aspect', job['aspect']]
    if job.get('size'):
        cmd += ['--size', job['size']]
    t0 = time.time()
    p = subprocess.run(cmd, capture_output=True, text=True)
    msg = (p.stdout + p.stderr).strip()
    if 'HTTP 402' in msg:
        open(STOP, 'w').write(msg[-500:])
    out_lines.append(f"{job['job']}: rc={p.returncode} {round(time.time() - t0)}s {msg[-160:]}")


def main():
    a = sys.argv[1:]
    par = 3
    if '--par' in a:
        i = a.index('--par'); par = int(a[i + 1]); del a[i:i + 2]
    only = None
    if '--only' in a:
        i = a.index('--only'); only = set(a[i + 1:]); a = a[:i]
    jobs = json.load(open(a[0]))
    if only:
        jobs = [j for j in jobs if j['job'] in only]
    print('used before', used(), 'of', CAP, '| jobs', len(jobs), flush=True)
    lines = []
    pending = list(jobs)
    threads = []
    while pending or threads:
        threads = [t for t in threads if t.is_alive()]
        while pending and len(threads) < par:
            j = pending.pop(0)
            t = threading.Thread(target=run, args=(j, lines)); t.start(); threads.append(t)
        while lines:
            print(lines.pop(0), flush=True)
        time.sleep(1)
    while lines:
        print(lines.pop(0), flush=True)
    print('used after', used(), 'of', CAP, flush=True)


if __name__ == '__main__':
    main()
