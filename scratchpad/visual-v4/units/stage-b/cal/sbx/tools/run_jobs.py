# Runs a pilot jobs file (from pilot_jobs.py) through gen.py (logged in ../gen-log.tsv, stage A budget enforced),
# a few at a time. A job whose output already exists is skipped, so a re-run never spends twice.
# Usage: python3 run_jobs.py ../pilot/jobs-r1.json [--par 4]
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))


def run(j):
    if os.path.exists(j['out']):
        return j['out'], 'exists', ''
    cmd = [sys.executable, os.path.join(HERE, 'gen.py'), '--stage', 'A', '--purpose',
           f'pilot {j["round"]}: {j["job"]} ({j["figure"]} {j["view"]})', j['model'], j['out'], j['promptFile']] + j['refs'] + \
          ['--aspect', j['aspect']]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return j['out'], 'ok' if p.returncode == 0 else f'failed {p.returncode}', (p.stdout + p.stderr)[-300:]


def main():
    args = sys.argv[1:]
    par = 4
    if '--par' in args:
        i = args.index('--par'); par = int(args[i + 1]); del args[i:i + 2]
    jobs = json.load(open(args[0]))
    used = json.loads(subprocess.run([sys.executable, os.path.join(HERE, 'gen.py'), '--count'], capture_output=True, text=True).stdout)
    todo = [j for j in jobs if not os.path.exists(j['out'])]
    if used['used'] + len(todo) > used['budget']:
        sys.exit(f'refused: {used["used"]} used + {len(todo)} new > budget {used["budget"]}')
    with ThreadPoolExecutor(par) as ex:
        for out, st, msg in ex.map(run, jobs):
            print(st, os.path.basename(out), msg.strip().replace('\n', ' ')[-200:], flush=True)


if __name__ == '__main__':
    main()
