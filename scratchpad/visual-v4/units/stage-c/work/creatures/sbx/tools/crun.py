# Stage C creatures: runs generation jobs through cgen.py (logged by the shared gen.py, stage C; this task's cap 70),
# at most 2 in flight. A job whose output exists is skipped. HTTP 402 stops the whole run at once and writes the
# STOPPED-402 marker (no probing, no retry). Other failures are not retried here (every call counts against the budget;
# gemini_gen.py already retries 429/500/503 inside one call).
# Usage: python3 crun.py JOBS.json [JOB ...] [--par 2]
import json, os, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.abspath(os.path.join(HERE, '..', '..'))
STOP = os.path.join(WORK, 'STOPPED-402')
stop = threading.Event()


def run(j):
    if os.path.exists(j['out']):
        return j['job'], 'exists'
    if stop.is_set() or os.path.exists(STOP):
        return j['job'], 'SKIPPED (402 stop)'
    args = [sys.executable, os.path.join(HERE, 'cgen.py'), '--purpose', 'C creatures: ' + j['purpose'],
            j['model'], j['out'], j['promptFile']] + j['refs'] + ['--aspect', j.get('aspect', '1:1')] + (['--size', j['size']] if j.get('size') else [])
    p = subprocess.run(args, capture_output=True, text=True)
    msg = (p.stdout + p.stderr)[-500:]
    if p.returncode == 0:
        side = j['out'].rsplit('.', 1)[0] + '.json'
        if os.path.exists(side):  # the job record beside the generator's own sidecar (prompt, references, usage)
            meta = json.load(open(side))
            meta.update(job=j['job'], purpose='C creatures: ' + j['purpose'], promptFile=j['promptFile'], referencePaths=j['refs'],
                        route=j.get('route'), logKey='C creatures')
            json.dump(meta, open(side, 'w'), indent=2)
        return j['job'], p.stdout.strip()[-160:]
    if 'HTTP 402' in msg:
        stop.set()
        open(STOP, 'w').write(time.strftime('%H:%MZ', time.gmtime()) + ' ' + j['job'] + ': HTTP 402\n')
        return j['job'], 'STOP HTTP 402 ' + msg[-200:]
    return j['job'], 'FAILED ' + msg


def main():
    args = sys.argv[1:]
    par = 2
    if '--par' in args:
        i = args.index('--par'); par = max(1, min(2, int(args[i + 1]))); del args[i:i + 2]
    jobs = json.load(open(args[0]))
    if args[1:]:
        jobs = [j for j in jobs if j['job'] in args[1:]]
    with ThreadPoolExecutor(par) as ex:
        for name, res in ex.map(run, jobs):
            print(name, '->', res, flush=True)


if __name__ == '__main__':
    main()
