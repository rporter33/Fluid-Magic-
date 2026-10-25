# Stage C creatures (key "C creatures"): one generation through the shared units/tools/gen.py (stage C, its budget of
# 130 enforced there), with this task's own cap of 70 counted from the log's "C creatures:" rows, a lock so reserved
# calls in flight count against the cap, a refusal once an HTTP 402 stop marker exists, and an optional --size
# (imageConfig.imageSize, the stage B calibration's gemini_gen_size.py) for the one 2K output test.
# The key is never read here: the environment's network secret attaches it to the request.
# Usage: python3 cgen.py --purpose "C creatures: ..." MODEL OUT.png PROMPT.txt [REF ...] [--aspect 1:1] [--size 2K]
#        python3 cgen.py --count
import fcntl, importlib.util, json, os, sys, time, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
WORK = os.path.abspath(os.path.join(HERE, '..', '..'))
LOCK = os.path.join(WORK, '.gen.lock')
RES = os.path.join(WORK, '.reserved')
STOP = os.path.join(WORK, 'STOPPED-402')
TAG, CAP = 'C creatures:', 70


def shared_gen():
    spec = importlib.util.spec_from_file_location('shared_gen', os.path.join(UNITS, 'tools', 'gen.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def used(g):
    return sum(1 for r in g.rows() if r.get('stage') == 'C' and r.get('purpose', '').startswith(TAG))


def reserved(drop=None, add=None):
    res = [r for r in (json.load(open(RES)) if os.path.exists(RES) else []) if time.time() - r['t'] < 900 and r['id'] != drop]
    if add:
        res.append(dict(id=add, t=time.time()))
    json.dump(res, open(RES, 'w'))
    return res


def main():
    g = shared_gen()
    args = sys.argv[1:]
    if args and args[0] == '--count':
        print(json.dumps({'key': TAG, 'used': used(g), 'cap': CAP, 'stageC': g.used('C'), 'stageBudget': g.BUDGET['C']})); return
    if os.path.exists(STOP):
        print('REFUSED: HTTP 402 stop marker present'); sys.exit(4)
    purpose = args[args.index('--purpose') + 1]
    if not purpose.startswith(TAG):
        print('REFUSED: purpose must start with', TAG); sys.exit(3)
    me = uuid.uuid4().hex
    with open(LOCK, 'a') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        res = reserved()
        if used(g) + len(res) >= CAP:
            print(f'REFUSED: {TAG} has {used(g)} used and {len(res)} in flight of {CAP}'); sys.exit(3)
        reserved(add=me)
    code = 0
    try:
        if '--size' in args:  # the calibration's size variant: the same request plus imageConfig.imageSize
            g.GEN = os.path.join(HERE, 'gemini_gen_size.py')
        sys.argv = [os.path.join(UNITS, 'tools', 'gen.py'), '--stage', 'C'] + args
        try:
            g.main()
        except SystemExit as e:
            code = e.code or 0
    finally:
        with open(LOCK, 'a') as lk:
            fcntl.flock(lk, fcntl.LOCK_EX)
            reserved(drop=me)
    sys.exit(code)


if __name__ == '__main__':
    main()
