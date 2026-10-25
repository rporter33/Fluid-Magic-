# Stage B troops2: the troop pipeline and its gates (work/troops/sbx/tools/tr_pipe.py, unchanged: keyer, slicer, rim fix,
# Thornwood hue lock, all-cells camera, variety, scale, consistency, fringe, rim, side colour with the side keyline and
# the value rule) over every job's raw sheet, into ../sheets/<raw name>/checks.json. The job's key wins over units.json
# (the Wolf Rider back is on the blue key). Usage: python3 t2_check.py JOBS.json [JOB ...] [--force]
import json, os, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
T = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/troops/sbx/tools'
W2 = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, T)
os.chdir(T)
import tr_pipe  # noqa: E402


def name_of(j):
    return os.path.basename(j['out']).rsplit('.', 2)[0]


def one(j, force):
    d = os.path.join(W2, 'sheets', name_of(j))
    if not os.path.exists(j['out']):
        return j['job'], 'no raw'
    if os.path.exists(os.path.join(d, 'checks.json')) and not force:
        return j['job'], tr_pipe.line(name_of(j), json.load(open(os.path.join(d, 'checks.json'))))
    if j.get('key') and tr_pipe.BY[j['figure']]['key'] != j['key']:
        tr_pipe.BY[j['figure']] = dict(tr_pipe.BY[j['figure']], key=j['key'])
    try:
        r = tr_pipe.pipe(j['out'], j['figure'], j['view'], d)
    except Exception as e:  # noqa: BLE001
        return j['job'], f'ERROR {type(e).__name__}: {e}'
    return j['job'], tr_pipe.line(name_of(j), r)


if __name__ == '__main__':
    a = sys.argv[1:]
    force = '--force' in a
    a = [x for x in a if x != '--force']
    jobs = json.load(open(a[0] if os.path.isabs(a[0]) else os.path.join(W2, 'jobs', os.path.basename(a[0]))))
    if a[1:]:
        jobs = [j for j in jobs if j['job'] in a[1:]]
    with ThreadPoolExecutor(1) as ex:  # tr_pipe imports per call; one at a time keeps BY patches simple
        for name, res in ex.map(lambda j: one(j, force), jobs):
            print(f'{name}: {res}', flush=True)
