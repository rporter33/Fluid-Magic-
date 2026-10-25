# Stage B calibration ("cal"): one generation, logged to units/gen-log.tsv with the purpose "B cal: ...".
# The cap for this task is 30 generations, failures included, counted from the log's own "B cal:" rows.
# Calls the repo's tools/art/gemini_gen.py, or the scratch copy gemini_gen_size.py when --size is given.
# The key is never read here: the environment's network secret attaches it to the request.
# Usage: python3 calgen.py --purpose "what" MODEL OUT.png PROMPT.txt [REF ...] [--aspect 1:1] [--size 2K]
#        python3 calgen.py --count
import datetime, json, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))  # .../visual-v4/units
LOG = os.path.join(UNITS, 'gen-log.tsv')
GEN = '/home/user/Fluid-Magic-/tools/art/gemini_gen.py'
GEN_SIZE = os.path.join(HERE, 'gemini_gen_size.py')
CAP, TAG = 30, 'B cal:'
COLS = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult'.split('\t')


def used():
    with open(LOG) as f:
        rows = [dict(zip(COLS, ln.split('\t'))) for ln in f.read().splitlines()[1:] if ln.strip()]
    return sum(1 for r in rows if r.get('purpose', '').startswith(TAG))


def main():
    args = sys.argv[1:]
    if args and args[0] == '--count':
        print(json.dumps({'key': 'cal', 'used': used(), 'cap': CAP})); return
    purpose = ''
    if '--purpose' in args:
        i = args.index('--purpose'); purpose = args[i + 1]; del args[i:i + 2]
    purpose = purpose if purpose.startswith(TAG) else f'{TAG} {purpose}'
    if used() >= CAP:
        print(f'REFUSED: key cal has used its {CAP} generations'); sys.exit(3)
    gen = GEN_SIZE if '--size' in args else GEN
    model, out = args[0], args[1]
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    t0 = time.time()
    p = subprocess.run([sys.executable, gen] + args, capture_output=True, text=True)
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
        f.write('\t'.join(row) + '\n')
    sys.stdout.write(p.stdout[-400:])
    if p.returncode != 0:
        sys.stderr.write(p.stderr[-400:] + p.stdout[-400:])
        sys.exit(p.returncode)


if __name__ == '__main__':
    main()
