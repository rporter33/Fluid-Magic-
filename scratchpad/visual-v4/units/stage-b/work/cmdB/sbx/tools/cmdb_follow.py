# Stage B, key "cmdB": checks every re-dress sheet that has arrived and has no checks.json yet; loops until no job of the
# given runner log is pending. Usage: python3 cmda_follow.py JOBS.json RUN.log
import json, os, sys, time, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cmdb as cmda  # noqa: E402
jobs = json.load(open(sys.argv[1])); log = sys.argv[2]
while True:
    todo = []
    for j in jobs:
        spec = j['job'].replace('.redress', '')
        d = os.path.join(cmda.W, 'faces', spec)
        if os.path.exists(j['out']) and not os.path.exists(os.path.join(d, 'checks.json')) \
                and not os.path.exists(os.path.join(d, 'pipe-error.txt')):
            todo.append(spec)
    if todo:
        p = subprocess.run([sys.executable, os.path.join(HERE, 'cmdb_run_pipe.py')] + todo[:8], capture_output=True, text=True)
        print(p.stdout.strip(), p.stderr[-300:], flush=True)
        for spec in todo[:8]:  # a sheet the pipeline cannot read is recorded once, not retried in a loop
            d = os.path.join(cmda.W, 'faces', spec)
            if not os.path.exists(os.path.join(d, 'checks.json')):
                os.makedirs(d, exist_ok=True)
                open(os.path.join(d, 'pipe-error.txt'), 'w').write(p.stdout[-3000:] + p.stderr[-3000:])
        continue
    finished = sum(1 for ln in open(log) if '->' in ln) if os.path.exists(log) else 0
    if finished >= len(jobs):
        break
    time.sleep(20)
print('FOLLOW DONE', flush=True)
