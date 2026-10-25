# Stage B, key "cmdA2" (resumes cmdA after the HTTP 402 outage): one generation through the repo's
# tools/art/gemini_gen.py (the shared units/tools/gen.py convention), logged to units/gen-log.tsv with the purpose
# "B cmdA2: ...". The key is attached by the environment's network secret and is never read, printed or stored here.
# Cap: 50 generations for this key, failures included, counted from the log's own "B cmdA2:" rows plus calls in flight.
# An HTTP 402 writes ../STOPPED-402 and every later call is refused until a person removes it.
# Usage: python3 a2gen.py --purpose "what" MODEL OUT.png PROMPT.txt [REF ...] [--aspect 1:1]
#        python3 a2gen.py --count
import datetime, fcntl, json, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
A2 = os.path.abspath(os.path.join(HERE, '..'))                      # stage-b/work/cmdA2
UNITS = os.path.abspath(os.path.join(A2, '..', '..', '..'))        # .../visual-v4/units
LOG = os.path.join(UNITS, 'gen-log.tsv')
LOCK, PENDING, STOP = os.path.join(A2, 'a2gen.lock'), os.path.join(A2, 'a2gen.pending'), os.path.join(A2, 'STOPPED-402')
GEN = '/home/user/Fluid-Magic-/tools/art/gemini_gen.py'
CAP, TAG = 50, 'B cmdA2:'
COLS = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult'.split('\t')


def used():
    with open(LOG) as f:
        rows = [dict(zip(COLS, ln.split('\t'))) for ln in f.read().splitlines()[1:] if ln.strip()]
    return sum(1 for r in rows if r.get('purpose', '').startswith(TAG))


def _pend(delta):
    with open(LOCK, 'a+') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        pend = int((open(PENDING).read().strip() or 0)) if os.path.exists(PENDING) else 0
        if delta > 0 and (os.path.exists(STOP) or used() + pend >= CAP):
            return False
        open(PENDING, 'w').write(str(max(0, pend + delta)))
        return True


def main():
    args = sys.argv[1:]
    if args and args[0] == '--count':
        print(json.dumps({'key': 'cmdA2', 'used': used(), 'cap': CAP, 'stopped402': os.path.exists(STOP)})); return
    purpose = ''
    if '--purpose' in args:
        i = args.index('--purpose'); purpose = args[i + 1]; del args[i:i + 2]
    purpose = purpose if purpose.startswith(TAG) else f'{TAG} {purpose}'
    if not _pend(+1):
        print('REFUSED: ' + ('stopped after HTTP 402' if os.path.exists(STOP) else f'key cmdA2 has used its {CAP} generations'))
        sys.exit(3)
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
        if p.returncode != 0 and 'HTTP 402' in (p.stdout + p.stderr):
            open(STOP, 'w').write(datetime.datetime.utcnow().isoformat() + 'Z HTTP 402 on ' + os.path.basename(out) + '\n')
    finally:
        _pend(-1)
    sys.stdout.write(p.stdout[-400:])
    if p.returncode != 0:
        sys.stderr.write(p.stderr[-600:] + p.stdout[-400:])
        sys.exit(p.returncode)


if __name__ == '__main__':
    main()
