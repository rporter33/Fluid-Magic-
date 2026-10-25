# Stage B troops: runs tr_pipe.py over every sheet of a round's jobs whose raw image exists and has no checks yet.
# Usage: python3 tr_check_round.py JOBS.json [--force] [--par 4]
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..', '..'))


def one(j, force):
    d = os.path.join(W, 'sheets', os.path.basename(j['out']).rsplit('.', 2)[0])
    if not os.path.exists(j['out']) or j['view'] not in ('back', 'front'):
        return j['job'], 'no raw'
    if os.path.exists(os.path.join(d, 'checks.json')) and not force:
        r = json.load(open(os.path.join(d, 'checks.json')))
        sys.path.insert(0, HERE)
        import tr_pipe
        return j['job'], tr_pipe.line(os.path.basename(j['out']), r)
    p = subprocess.run([sys.executable, os.path.join(HERE, 'tr_pipe.py'), j['out'], j['figure'], j['view'], d],
                       capture_output=True, text=True, cwd=HERE)
    return j['job'], (p.stdout.strip().splitlines() or [''])[-1] if p.returncode == 0 else 'ERROR ' + p.stderr[-300:]


if __name__ == '__main__':
    a = sys.argv[1:]
    force = '--force' in a
    par = int(a[a.index('--par') + 1]) if '--par' in a else 4
    jobs = json.load(open(a[0]))
    with ThreadPoolExecutor(par) as ex:
        for name, res in ex.map(lambda j: one(j, force), jobs):
            print(res if res.startswith('r') or res.startswith('e') else f'{name}: {res}', flush=True)
