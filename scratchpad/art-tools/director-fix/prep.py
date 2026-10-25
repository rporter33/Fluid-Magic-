import json, os, shutil, sys
R = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/art-gen/round2'
jobs = json.load(open(os.path.join(os.path.dirname(__file__), 'jobs.json')))
tag = sys.argv[1]  # backup suffix, e.g. dir1
for j in jobs:
    png = os.path.join(R, j['file']); base = png[:-4]
    d, name = os.path.split(base)
    rej = os.path.join(d, 'rejected'); os.makedirs(rej, exist_ok=True)
    for ext in ('.png', '.json', '.txt'):
        dst = os.path.join(rej, f'{name}.{tag}{ext}')
        if os.path.exists(dst): sys.exit(f'exists: {dst}')
        shutil.copy2(base + ext, dst)
    lines = open(base + '.txt').read().split('\n')
    idx = [i for i, l in enumerate(lines) if l.startswith('Person:') or l.startswith('Creature:')]
    assert len(idx) == 1, (name, idx)
    kind = lines[idx[0]].split(':')[0]; assert j['line'].startswith(kind + ':'), (name, kind)
    lines[idx[0]] = j['line']
    open(base + '.txt', 'w').write('\n'.join(lines))
    print(base + '.txt')
