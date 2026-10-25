# Stage B, key "cmdB", resumed run: one wave of jobs through cmdb_run.py (par 2: several agents share the API) with the
# checks following as sheets arrive (cmdb_follow.py). Stops with the runner on HTTP 402 (STOPPED-402).
# Usage: python3 cmdb_wave.py JOBS.json LOGNAME [--par 2]
import os, subprocess, sys, threading
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
W, PY = cmdb.W, sys.executable
a = sys.argv[1:]
par = a[a.index('--par') + 1] if '--par' in a else '2'
jobs, log = a[0], os.path.join(W, a[1])
open(log, 'w').close()
fl = open(log + '.follow', 'w')
t = threading.Thread(target=lambda: subprocess.run([PY, os.path.join(HERE, 'cmdb_follow.py'), jobs, log], stdout=fl, stderr=subprocess.STDOUT, cwd=HERE))
t.start()
subprocess.run([PY, os.path.join(HERE, 'cmdb_run.py'), jobs, '--par', par], cwd=HERE, stdout=open(log, 'a'), stderr=subprocess.STDOUT)
t.join()
print(open(log).read()); print(open(log + '.follow').read()[-4000:])
