# Stage B troops2: the gate pipeline (tr_pipe.py) run on each job's base image, so a laid base is known to sit at the
# maquette's camera before a generation is spent on it. Usage: python3 t2_basecheck.py JOBS.json [JOB ...]
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
T = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/troops/sbx/tools'
W2 = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
jobs = json.load(open(sys.argv[1]))
if sys.argv[2:]:
    jobs = [j for j in jobs if j['job'] in sys.argv[2:]]


def one(j):
    d = os.path.join(W2, 'basecheck', os.path.basename(j['refs'][0]).rsplit('.', 1)[0])
    p = subprocess.run([sys.executable, 'tr_pipe.py', j['refs'][0], j['figure'], j['view'], d], cwd=T, capture_output=True, text=True)
    if p.returncode:
        return 'ERR ' + p.stderr[-300:]
    r = json.load(open(d + '/checks.json'))
    bad = {k: v for k, v in r['cameraAll']['cells'].items() if not (v[0] >= 0.55 and v[1] >= 0)}
    return f"{r['cameraAll']['follow']} bad {bad} scale {r['scaleBody']['pass_']} gates {[k for k, v in r['gates'].items() if not v]}"


with ThreadPoolExecutor(3) as ex:
    for j, r in zip(jobs, ex.map(one, jobs)):
        print(j['job'], '::', r, flush=True)
