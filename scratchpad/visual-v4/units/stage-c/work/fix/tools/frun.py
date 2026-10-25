# Stage C fix pass: runs the fix jobs (work/fix/jobs.json) through fgen.py, at most 2 in flight. A job whose output
# exists is skipped. HTTP 402 stops the whole run (fgen writes the marker; every later call refuses). Failures are not
# retried here: every call counts. The generator's sidecar gets the job record (route, references, prompt file) that
# cpack.py and gd_pack.py read. Usage: python3 -I frun.py [JOB ...] [--par 2]
import json, os, subprocess, sys, threading
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, '..'))
STOP = os.path.join(FIX, 'STOPPED-402')
stop = threading.Event()


def run(j):
    if os.path.exists(j['out']):
        return j['job'], 'exists'
    if stop.is_set() or os.path.exists(STOP):
        return j['job'], 'SKIPPED (402 stop)'
    cmd = [sys.executable, '-I', os.path.join(HERE, 'fgen.py'), '--purpose', j['purpose']] + (['--2k'] if j.get('size') == '2K' else []) + \
          [j['model'], j['out'], j['promptFile']] + j['refs'] + ['--aspect', j['aspect']]
    p = subprocess.run(cmd, capture_output=True, text=True)
    msg = (p.stdout + p.stderr)
    if 'HTTP 402' in msg:
        stop.set()
        return j['job'], 'STOP HTTP 402'
    side = j['out'].rsplit('.', 1)[0] + '.json'
    if p.returncode == 0 and os.path.exists(side):
        meta = json.load(open(side))
        meta.update(job=j['job'], item=j['item'], purpose=j['purpose'], promptFile=j['promptFile'], referencePaths=j['refs'],
                    route=j['route'], logKey='C fix', **({'imageSize': j['size']} if j.get('size') else {}))
        json.dump(meta, open(side, 'w'), indent=2)
        return j['job'], 'ok ' + msg.strip().splitlines()[-1]
    return j['job'], 'FAILED ' + msg[-400:]


def main():
    a = sys.argv[1:]
    par = 2
    if '--par' in a:
        i = a.index('--par'); par = max(1, min(2, int(a[i + 1]))); del a[i:i + 2]
    jobs = json.load(open(os.path.join(FIX, 'jobs.json')))
    if a:
        jobs = [j for j in jobs if j['job'] in a]
    with ThreadPoolExecutor(par) as ex:
        for name, res in ex.map(run, jobs):
            print(name, '->', res, flush=True)


if __name__ == '__main__':
    main()
