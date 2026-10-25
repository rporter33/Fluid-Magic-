# Stage B, key "cmdA": runs cmda_pipe over re-dress sheets, a few in parallel, and prints one line each.
# Usage: python3 cmda_run_pipe.py FACE.VIEW[.TAG] ...    (raw: stage-b/raw/cmdA/<face>.<view>.redress[.tag].nb21.png)
import json, os, sys, subprocess
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cmda  # noqa: E402

W = cmda.W


def one(spec):
    parts = spec.split('.')
    face, view, tag = parts[0], parts[1], ('.' + parts[2]) if len(parts) > 2 else ''
    kind = cmda.kind_of(face, view)
    _k, nat, unit, num, sex, marks = cmda.FACES[face]
    raw = cmda.REUSED_REDRESS.get((face, view)) if not tag else None
    raw = raw or os.path.join(cmda.RAW, f'{face}.{view}.redress{tag}.nb21.png')
    body = json.load(open(os.path.join(W, 'bodies.json')))[f'{kind}.{view}']
    out = os.path.join(W, 'faces', f'{face}.{view}{tag}')
    p = subprocess.run([sys.executable, os.path.join(HERE, 'cmda_pipe.py'), raw, kind, view, cmda.key_of(kind, view), out,
                        '--body', os.path.join(W, body['frames']), '--portrait', cmda.PORTRAIT.format(nat, unit, num)],
                       capture_output=True, text=True)
    return spec, (p.stdout.strip() or p.stderr[-600:])


if __name__ == '__main__':
    specs = sys.argv[1:]
    with ThreadPoolExecutor(4) as ex:
        for s, r in ex.map(one, specs):
            print(r if r.startswith(s.split('.')[0]) else f'{s}: {r}', flush=True)
