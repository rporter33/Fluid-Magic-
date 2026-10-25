# Stage C fix pass (key "C fix", the art director's stage C critique): one generation through the shared
# units/tools/gen.py (or work/gods/tools/gen2k.py for a 2K big body), always --stage C so gen.py logs the row and holds
# the stage's total of 130. This key's own cap (18: the critique's 11 base re-rolls and at most 7 contingency) is
# counted here from the log's rows whose purpose starts "C fix:". An HTTP 402 writes work/fix/STOPPED-402 and every
# later call refuses at once (no probing, no retry). The key is never read here: the environment's network secret
# attaches it to the request.
# Usage: python3 -I fgen.py --purpose "C fix: ..." [--2k] MODEL OUT.png PROMPT.txt [REF ...] --aspect A:B
#        python3 -I fgen.py --count
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
FIX = os.path.abspath(os.path.join(HERE, '..'))
LOG = os.path.join(UNITS, 'gen-log.tsv')
STOP = os.path.join(FIX, 'STOPPED-402')
TAG, CAP = 'C fix:', 18
COLS = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult'.split('\t')


def rows():
    return [dict(zip(COLS, ln.split('\t'))) for ln in open(LOG).read().splitlines()[1:] if ln.strip()]


def used():
    return sum(1 for r in rows() if r.get('stage') == 'C' and r.get('purpose', '').startswith(TAG))


def main():
    a = sys.argv[1:]
    if a and a[0] == '--count':
        print(json.dumps({'key': TAG, 'used': used(), 'cap': CAP, 'stageC': sum(1 for r in rows() if r.get('stage') == 'C'), 'stageBudget': 130}))
        return
    if os.path.exists(STOP):
        print('REFUSED: HTTP 402 seen earlier (work/fix/STOPPED-402)'); sys.exit(4)
    i = a.index('--purpose'); purpose = a[i + 1]; del a[i:i + 2]
    if not purpose.startswith(TAG):
        print('REFUSED: purpose must start with', TAG); sys.exit(3)
    big = '--2k' in a
    a = [x for x in a if x != '--2k']
    if used() >= CAP:
        print(f'REFUSED: key "{TAG}" has used its {CAP} generations'); sys.exit(3)
    gen = os.path.join(UNITS, 'stage-c', 'work', 'gods', 'tools', 'gen2k.py') if big else os.path.join(UNITS, 'tools', 'gen.py')
    cmd = [sys.executable, '-I', gen, '--stage', 'C', '--purpose', purpose] + a + (['--size', '2K'] if big else [])
    p = subprocess.run(cmd, capture_output=True, text=True)
    msg = p.stdout + p.stderr
    if 'HTTP 402' in msg:
        open(STOP, 'w').write(purpose + '\n' + msg[-400:])
        print('HTTP 402: stopping at once'); print(msg[-300:]); sys.exit(4)
    print(msg.strip()[-300:])
    print('C fix used', used(), 'of', CAP)
    sys.exit(p.returncode)


if __name__ == '__main__':
    main()
