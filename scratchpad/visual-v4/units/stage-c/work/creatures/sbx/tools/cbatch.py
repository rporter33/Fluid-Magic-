# Stage C creatures: runs the right pipeline over every job's raw output (cgrid.py for key-pose sheets, cbig.py for
# big-body cutouts) into ../../sheets/<job>/checks.json, one subprocess per sheet so the pipelines' module patches stay
# separate. Usage: python3 cbatch.py JOBS.json [JOB ...] [--force]
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..', '..'))


def main():
    a = sys.argv[1:]
    force = '--force' in a
    a = [x for x in a if x != '--force']
    jobs = json.load(open(a[0]))
    if a[1:]:
        jobs = [j for j in jobs if j['job'] in a[1:]]
    for j in jobs:
        d = os.path.join(W, 'sheets', j['job'])
        if not os.path.exists(j['out']):
            print(j['job'], ': no raw', flush=True); continue
        if os.path.exists(os.path.join(d, 'checks.json')) and not force:
            print(j['job'], ': checked', flush=True); continue
        tool = 'cgrid.py' if j.get('kind') == 'grid' else 'cbig.py'
        p = subprocess.run([sys.executable, os.path.join(HERE, tool), j['out'], j['figure'], j['view'], d], capture_output=True, text=True, cwd=HERE)
        print((p.stdout.strip().splitlines() or [''])[-1] if p.returncode == 0 else f"{j['job']}: ERROR {p.stderr[-800:]}", flush=True)


if __name__ == '__main__':
    main()
