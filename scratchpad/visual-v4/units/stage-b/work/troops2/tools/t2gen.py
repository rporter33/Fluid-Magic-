# Stage B troops2 (key "troops2", the resumed troop run after the 402 outage): one generation through the repo's tools/art/gemini_gen.py, logged to units/gen-log.tsv
# with the purpose "B troops2: ...". The cap for this task is 50 generations, failures included, counted from the log's
# own "B troops2:" rows (other stage B agents share the log and count their own keys).
# The key is never read here: the environment's network secret attaches it to the request.
# Usage: python3 tr_gen.py --purpose "what" [--job JOB] MODEL OUT.png PROMPT.txt [REF ...] [--aspect 1:1]
#        python3 tr_gen.py --count
import datetime, fcntl, json, os, subprocess, sys, time

UNITS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
LOG = os.path.join(UNITS, 'gen-log.tsv')
LOCK = os.path.join(UNITS, 'stage-b', 'work', 'troops2', '.gen.lock')
GEN = '/home/user/Fluid-Magic-/tools/art/gemini_gen.py'
# fix2: a later run may carry its own key and cap (T2_KEY, T2_CAP); the defaults are this run's own
CAP, TAG = int(os.environ.get('T2_CAP', 50)), os.environ.get('T2_KEY', 'B troops2:')
COLS = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult'.split('\t')


def rows():
    with open(LOG) as f:
        return [dict(zip(COLS, ln.split('\t'))) for ln in f.read().splitlines()[1:] if ln.strip()]


def used():
    return sum(1 for r in rows() if r.get('purpose', '').startswith(TAG))


def main():
    args = sys.argv[1:]
    if args and args[0] == '--count':
        print(json.dumps({'key': TAG, 'used': used(), 'cap': CAP})); return
    opt = {}
    for k in ('--purpose', '--job'):
        if k in args:
            i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
    purpose = opt.get('--purpose', '')
    purpose = purpose if purpose.startswith(TAG) else f'{TAG} {purpose}'
    model, out = args[0], args[1]
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    # the cap is checked and a placeholder row reserved under a lock, so parallel jobs can never pass the cap together
    with open(LOCK, 'a') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        n = used()
        if n >= CAP:
            print(f'REFUSED: key {TAG} has used its {CAP} generations'); sys.exit(3)
        reserve = os.path.join(os.path.dirname(LOCK), '.reserved')
        res = json.load(open(reserve)) if os.path.exists(reserve) else []
        res = [r for r in res if time.time() - r['t'] < 600]
        if n + len(res) >= CAP:
            print(f'REFUSED: key {TAG} has {n} used and {len(res)} in flight of {CAP}'); sys.exit(3)
        res.append(dict(out=out, t=time.time())); json.dump(res, open(reserve, 'w'))
    t0 = time.time()
    p = subprocess.run([sys.executable, GEN] + args, capture_output=True, text=True)
    secs = round(time.time() - t0, 1)
    tokens, result = '', 'ok' if p.returncode == 0 else f'failed ({p.returncode})'
    side = out.rsplit('.', 1)[0] + '.json'
    if p.returncode == 0 and os.path.exists(side):
        meta = json.load(open(side))
        tokens = str(meta.get('usage', {}).get('totalTokenCount', ''))
        secs = meta.get('seconds', secs)
        refs = [a for a in args[3:] if not a.startswith('--') and os.path.exists(a)]
        meta.update(referencePaths=refs, promptFile=os.path.abspath(args[2]), job=opt.get('--job'), purpose=purpose,
                    logKey=TAG.rstrip(':').split()[-1])
        json.dump(meta, open(side, 'w'), indent=2)
    row = [os.path.relpath(out, UNITS), model, str(secs), tokens, 'B', purpose.replace('\t', ' '),
           datetime.date.today().isoformat(), result]
    with open(LOCK, 'a') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        with open(LOG, 'a') as f:
            f.write('\t'.join(row) + '\n')
        reserve = os.path.join(os.path.dirname(LOCK), '.reserved')
        res = json.load(open(reserve)) if os.path.exists(reserve) else []
        res = [r for r in res if r['out'] != out]
        json.dump(res, open(reserve, 'w'))
    sys.stdout.write(p.stdout[-400:])
    if p.returncode != 0:
        sys.stderr.write(p.stderr[-400:] + p.stdout[-400:])
        sys.exit(p.returncode)


if __name__ == '__main__':
    main()
