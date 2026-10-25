# One generation through the repo's tools/art/gemini_gen.py, logged and budgeted (art plan section 8.1).
# The key is never read here: the environment's network secret attaches it to the request.
# Usage: python3 gen.py --stage A --purpose "pilot: cinderWarrior back sheet" MODEL OUT.png PROMPT.txt [REF ...] [--aspect 1:1]
#        python3 gen.py --count [--stage A]       (prints how many generations the stage has used)
# Every call appends one row to ../gen-log.tsv: file, model, seconds, tokens, stage, purpose, date, result.
# A stage's budget (BUDGET) is enforced: the call is refused once the stage has used it, failures included.
import datetime, json, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, '..', 'gen-log.tsv')
GEN = '/home/user/Fluid-Magic-/tools/art/gemini_gen.py'
# stage D (rest of stage D, 2026-10-25): --size 2K is passed to the stage B calibration copy of gemini_gen.py that sets
# imageConfig.imageSize, as stage C's gods/tools/gen2k.py did, so size-6 action cutouts match their 2K idle cutouts while
# every call stays in this one log and budget
GEN_SIZE = os.path.join(HERE, '..', 'stage-b', 'cal', 'sbx', 'tools', 'gemini_gen_size.py')
BUDGET = {'A': 60, 'C': 130, 'D': 210}  # C: set after the owner's stage B verdict; D: 40 for the magic pilot (set after the stage C verdict, 2026-10-24), raised to the art plan's 210 for all of stage D after the pilot verdict (2026-10-25)
HEADER = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult\n'


def rows():
    if not os.path.exists(LOG):
        return []
    with open(LOG) as f:
        lines = f.read().splitlines()[1:]
    return [dict(zip(HEADER.strip().split('\t'), ln.split('\t'))) for ln in lines if ln.strip()]


def used(stage):
    return sum(1 for r in rows() if r.get('stage') == stage)


def main():
    args = sys.argv[1:]
    opt = {}
    for k in ('--stage', '--purpose'):
        if k in args:
            i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
    stage = opt.get('--stage', 'A')
    if args and args[0] == '--count':
        print(json.dumps({'stage': stage, 'used': used(stage), 'budget': BUDGET.get(stage)}))
        return
    if stage in BUDGET and used(stage) >= BUDGET[stage]:
        print(f'REFUSED: stage {stage} has used its {BUDGET[stage]} generations'); sys.exit(3)
    model, out = args[0], args[1]
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    if not os.path.exists(LOG):
        with open(LOG, 'w') as f:
            f.write(HEADER)
    t0 = time.time()
    p = subprocess.run([sys.executable, GEN_SIZE if '--size' in args else GEN] + args, capture_output=True, text=True)
    secs = round(time.time() - t0, 1)
    tokens, result = '', 'ok' if p.returncode == 0 else f'failed ({p.returncode})'
    side = out.rsplit('.', 1)[0] + '.json'
    if p.returncode == 0 and os.path.exists(side):
        meta = json.load(open(side))
        tokens = str(meta.get('usage', {}).get('totalTokenCount', ''))
        secs = meta.get('seconds', secs)
    row = [os.path.relpath(out, os.path.join(HERE, '..')), model, str(secs), tokens, stage,
           opt.get('--purpose', '').replace('\t', ' '), datetime.date.today().isoformat(), result]
    with open(LOG, 'a') as f:
        f.write('\t'.join(row) + '\n')
    sys.stdout.write(p.stdout[-400:])
    if p.returncode != 0:
        sys.stderr.write(p.stderr[-400:])
        sys.exit(p.returncode)


if __name__ == '__main__':
    main()
