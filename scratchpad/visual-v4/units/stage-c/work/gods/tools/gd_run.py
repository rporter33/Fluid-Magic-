# Stage C gods: run one job (god, view) through the generator and the post-processing. Every call goes through
# tools/gen.py --stage C (gen2k.py, its copy with --size, for a 2K job) with a purpose starting "C gods:", so the log
# carries it and gen.py holds the stage's total. This key's own cap (60 of stage C's 130) is checked here first. An
# HTTP 402 writes work/gods/STOP and every later call refuses at once.
# Usage: python3 -I gd_run.py GOD VIEW [--reroll "what failed and how to fix it"] [--tag SUFFIX] [--1k]
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import UNITS  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..'))
LOG = os.path.join(UNITS, 'gen-log.tsv')
STOP = os.path.join(W, 'STOP')
CAP, TAG = 60, 'C gods:'
COLS = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult'.split('\t')


def used():
    rows = [dict(zip(COLS, ln.split('\t'))) for ln in open(LOG).read().splitlines()[1:] if ln.strip()]
    return sum(1 for r in rows if r.get('stage') == 'C' and r.get('purpose', '').startswith(TAG))


def main():
    args = sys.argv[1:]
    opt = {}
    for k in ('--reroll', '--tag'):
        if k in args:
            i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
    force1k = '--1k' in args
    args = [a for a in args if a != '--1k']
    god, view = args
    if os.path.exists(STOP):
        print('REFUSED: HTTP 402 seen earlier (work/gods/STOP)'); sys.exit(4)
    if used() >= CAP:
        print(f'REFUSED: key "C gods" has used its {CAP} generations'); sys.exit(3)
    job = next(j for j in json.load(open(os.path.join(W, 'jobs.json'))) if j['god'] == god and j['view'] == view)
    size = None if force1k else job['size']
    prompt = os.path.join(UNITS, job['prompt'])
    out = os.path.join(UNITS, job['out'])
    suffix = opt.get('--tag', '')
    if size is None and job['size']:
        out = out.replace('.2k.png', '.png')
    if '--reroll' in opt:
        text = open(prompt).read().rstrip('\n') + '\n\nCorrections from the previous attempt, which must be fixed: ' + opt['--reroll'] + '\n'
        prompt = os.path.join(W, 'prompts', f'{god}.{view}.{suffix or "r2"}.txt')
        open(prompt, 'w').write(text)
        out = out.replace('.png', f'.{suffix or "r2"}.png')
    elif suffix:
        out = out.replace('.png', f'.{suffix}.png')
    purpose = (f"{TAG} {god} {view} idle cutout (nb21: maquette + approved portrait {job['portraitJob']}, pick {job['pick']}"
               f"{', 2K' if size else ''})" + (f" [re-roll: {opt['--reroll'][:120]}]" if '--reroll' in opt else ''))
    gen = os.path.join(HERE, 'gen2k.py') if size else os.path.join(UNITS, 'tools', 'gen.py')
    cmd = [sys.executable, '-I', gen, '--stage', 'C', '--purpose', purpose, job['model'], out, prompt] + \
          [os.path.join(UNITS, r) for r in job['refs']] + ['--aspect', job['aspect']] + (['--size', size] if size else [])
    p = subprocess.run(cmd, capture_output=True, text=True)
    msg = (p.stdout + p.stderr)
    if 'HTTP 402' in msg:
        open(STOP, 'w').write(msg[-600:])
        print('HTTP 402: stopping at once'); print(msg[-400:]); sys.exit(4)
    if p.returncode != 0:
        print('generation failed', p.returncode, msg[-500:]); sys.exit(p.returncode)
    print(msg.strip()[-200:])
    import gd_post
    rep = gd_post.process(god, view, out)
    print(json.dumps({k: rep[k] for k in ('god', 'view', 'pass', 'failed')}))
    print(' camera', json.dumps(rep['camera']))
    print(' side', json.dumps(rep['side']), '| value', rep['value']['worstBelow'], '| identity', json.dumps(rep['identity']),
          '| rim', rep['rim']['keyHueShiftedPct'], '| fringe', json.dumps(rep['fringe']), '| upscaleH', rep['tierHupscale'])
    print(' used', used(), 'of', CAP)


if __name__ == '__main__':
    main()
