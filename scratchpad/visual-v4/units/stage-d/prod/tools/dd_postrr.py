# Post-processes the re-roll images (prod/jobs/rerolls.json) that have no post.json yet: dd_post.py BASE --raw --tag.
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); PROD = os.path.abspath(os.path.join(HERE, '..'))
force = '--force' in sys.argv
for r in json.load(open(os.path.join(PROD, 'jobs', 'rerolls.json'))):
    tag = os.path.basename(r['out']).rsplit('.png', 1)[0]
    if not os.path.exists(r['out']) or (os.path.exists(os.path.join(PROD, 'cut', tag, 'post.json')) and not force):
        continue
    p = subprocess.run([sys.executable, '-I', os.path.join(HERE, 'dd_post.py'), r['base'], '--raw', r['out'], '--tag', tag], capture_output=True, text=True)
    print(p.stdout.strip() if p.returncode == 0 else f"{r['job']}: FAILED {p.stderr[-500:]}", flush=True)
