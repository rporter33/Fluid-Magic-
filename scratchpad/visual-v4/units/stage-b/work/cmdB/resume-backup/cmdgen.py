# Stage B, key "cmdB": one generation, logged to units/gen-log.tsv with the purpose "B cmdB: ...", through the shared
# tools/gen.py convention (tools/art/gemini_gen.py; the key is attached by the environment's network secret and is never
# read, printed or stored here). The cap for this task is 150 generations, failures included, counted from the log's
# own "B cmdB:" rows.
# Usage: python3 cmdgen.py --purpose "what" MODEL OUT.png PROMPT.txt [REF ...] [--aspect 1:1]
#        python3 cmdgen.py --count
import datetime, fcntl, json, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))  # .../visual-v4/units
LOG = os.path.join(UNITS, 'gen-log.tsv')
LOCK = os.path.join(HERE, '..', '..', 'cmdgen.lock')
GEN = '/home/user/Fluid-Magic-/tools/art/gemini_gen.py'
CAP, TAG = 150, 'B cmdB:'
COLS = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult'.split('\t')
PENDING = os.path.join(HERE, '..', '..', 'cmdgen.pending')


def used():
    with open(LOG) as f:
        rows = [dict(zip(COLS, ln.split('\t'))) for ln in f.read().splitlines()[1:] if ln.strip()]
    return sum(1 for r in rows if r.get('purpose', '').startswith(TAG))


def reserve():
    """Reserve one call under a file lock: used (logged) + in flight must stay below the cap."""
    with open(LOCK, 'a+') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        pend = int(open(PENDING).read() or 0) if os.path.exists(PENDING) else 0
        if used() + pend >= CAP:
            return False
        open(PENDING, 'w').write(str(pend + 1))
        return True


def release():
    with open(LOCK, 'a+') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        pend = int(open(PENDING).read() or 0) if os.path.exists(PENDING) else 0
        open(PENDING, 'w').write(str(max(0, pend - 1)))


def main():
    args = sys.argv[1:]
    if args and args[0] == '--count':
        print(json.dumps({'key': 'cmdB', 'used': used(), 'cap': CAP})); return
    purpose = ''
    if '--purpose' in args:
        i = args.index('--purpose'); purpose = args[i + 1]; del args[i:i + 2]
    purpose = purpose if purpose.startswith(TAG) else f'{TAG} {purpose}'
    if not reserve():
        print(f'REFUSED: key cmdB has used its {CAP} generations'); sys.exit(3)
    try:
        model, out = args[0], args[1]
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        t0 = time.time()
        p = subprocess.run([sys.executable, GEN] + args, capture_output=True, text=True)
        secs = round(time.time() - t0, 1)
        tokens, result = '', 'ok' if p.returncode == 0 else f'failed ({p.returncode})'
        side = out.rsplit('.', 1)[0] + '.json'
        if p.returncode == 0 and os.path.exists(side):
            meta = json.load(open(side))
            tokens = str(meta.get('usage', {}).get('totalTokenCount', ''))
            secs = meta.get('seconds', secs)
        row = [os.path.relpath(out, UNITS), model, str(secs), tokens, 'B', purpose.replace('\t', ' '),
               datetime.date.today().isoformat(), result]
        with open(LOG, 'a') as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            f.write('\t'.join(row) + '\n')
    finally:
        release()
    sys.stdout.write(p.stdout[-400:])
    if p.returncode != 0:
        sys.stderr.write(p.stderr[-400:] + p.stdout[-400:])
        sys.exit(p.returncode)


if __name__ == '__main__':
    main()
