# Stage B, key "cmdA": checks every re-dress sheet that has arrived and has no checks.json yet; loops until no job of the
# given runner log is pending. Usage: python3 cmda_follow.py JOBS.json RUN.log
import json, os, sys, time, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cmda  # noqa: E402
jobs = json.load(open(sys.argv[1])); log = sys.argv[2]
while True:
    todo = []
    for j in jobs:
        spec = j['job'].replace('.redress', '')
        d = os.path.join(cmda.W, 'faces', spec)
        if os.path.exists(j['out']) and not os.path.exists(os.path.join(d, 'checks.json')):
            todo.append(spec)
    if todo:
        p = subprocess.run([sys.executable, os.path.join(HERE, 'cmda_run_pipe.py')] + todo[:8], capture_output=True, text=True)
        print(p.stdout.strip(), p.stderr[-300:], flush=True)
        continue
    finished = sum(1 for ln in open(log) if '->' in ln) if os.path.exists(log) else 0
    if finished >= len(jobs):
        break
    time.sleep(20)
print('FOLLOW DONE', flush=True)
