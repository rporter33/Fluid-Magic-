# Runs dd_post.py on every generated job without a post.json (or the named ones), one after another; N workers.
import json, os, subprocess, sys, threading
HERE = os.path.dirname(os.path.abspath(__file__)); PROD = os.path.abspath(os.path.join(HERE, '..'))
a = sys.argv[1:]
par = 2
if '--par' in a:
    i = a.index('--par'); par = int(a[i + 1]); del a[i:i + 2]
force = '--force' in a; a = [x for x in a if x != '--force']
rev = '--reverse' in a; a = [x for x in a if x != '--reverse']
since = None
if '--since' in a:
    i = a.index('--since'); since = float(a[i + 1]); del a[i:i + 2]
jobs = json.load(open(os.path.join(PROD, 'jobs', 'actions.json')))
todo = []
for j in jobs:
    tag = os.path.basename(j['out']).rsplit('.png', 1)[0]
    if a and j['job'] not in a:
        continue
    if os.path.exists(j['out']) and (force or not os.path.exists(os.path.join(PROD, 'cut', tag, 'post.json'))):
        todo.append(j['job'])
if rev:
    todo.reverse()
lock = threading.Lock()
TAG = {j['job']: os.path.basename(j['out']).rsplit('.png', 1)[0] for j in jobs}
def fresh(job):
    p = os.path.join(PROD, 'cut', TAG[job], 'post.json')
    return since is not None and os.path.exists(p) and os.path.getmtime(p) >= since
def worker():
    while True:
        with lock:
            if not todo:
                return
            job = todo.pop(0)
            if fresh(job):
                continue
        p = subprocess.run([sys.executable, '-I', os.path.join(HERE, 'dd_post.py'), job], capture_output=True, text=True)
        with lock:
            print(p.stdout.strip() if p.returncode == 0 else f'{job}: FAILED {p.stderr[-600:]}', flush=True)
ts = [threading.Thread(target=worker) for _ in range(par)]
[t.start() for t in ts]; [t.join() for t in ts]
