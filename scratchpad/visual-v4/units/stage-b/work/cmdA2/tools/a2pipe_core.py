# Stage B, key "cmdA2": cmdA's per-sheet pipeline (cmda_pipe.py, imported unchanged, same gates) with the keyer swapped
# for a2key.py (key.py + the green opening pass). Same arguments as cmda_pipe.py.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import a2cfg as C  # noqa: E402
import cmda_pipe  # noqa: E402
_py = cmda_pipe.py


def py(*a):
    if a and os.path.basename(a[0]) == 'key.py':
        a = (os.path.join(HERE, 'a2key.py'),) + tuple(a[1:])
    return _py(*a)


cmda_pipe.py = py
if __name__ == '__main__':
    a = sys.argv[1:]
    opt = {}
    for k in ('--body', '--portrait'):
        if k in a:
            i = a.index(k); opt[k] = a[i + 1]; del a[i:i + 2]
    r = cmda_pipe.pipe(*a[:5], body=opt.get('--body'), portrait=opt.get('--portrait'))
    print(cmda_pipe.line(os.path.basename(a[0]), r))
