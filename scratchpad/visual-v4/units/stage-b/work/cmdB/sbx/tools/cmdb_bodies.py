# Stage B, key "cmdB": runs the pipeline over the body sheets (cmdb_pipe.py, no --body) and records the picks in
# ../../bodies.json: raw sheet, frames dir, cells, key, source. A body edit is picked when it passes the camera gate
# (14/16 cells, calibration 1.2); the side-colour gate does not apply to a body (it carries no face and no keyline
# choice of its own), and its other checks are reported.
# Usage: python3 cmdb_bodies.py fixed | edits [KIND.VIEW ...]
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
W = cmdb.W
BJ = os.path.join(W, 'bodies.json')
FIXED_SRC = {('twDruid', 'front'): 'calibration Pro body (cal/raw/cmdDruid.front.body.g3pro.png), as it is',
             ('twScout', 'front'): 'cmdA cmdScout front body (Nano Banana 2.1 edit of its levy body, 15/16) laid on magenta',
             ('twScout', 'back'): 'cmdA cmdLevy back body (Pro, 14/16) laid on magenta',
             ('cmdLevy', 'front'): 'cmdA cmdLevy front body (Pro, 16/16), blue key, as it is',
             ('cmdLevy', 'back'): 'cmdA cmdLevy back body (Pro, 14/16), blue key, as it is'}


def run(kind, view, raw, tag=''):
    out = os.path.join(W, 'bodies', f'{kind}.{view}{tag}')
    extra = []
    src = os.path.join(W, 'bodies', f'src.{kind}.{view}', 'frames')
    if tag.startswith('.edit') and os.path.isdir(src):
        # resumed run: a body edit is a re-dress of a camera-correct sheet, so its camera gate is measured at that
        # source sheet's body scale (calibration 1.3: antlers, hoods and a new weapon must not shrink the man), with
        # the inheritance IoU against the source's own cells; the source frames are the source sheet run through this
        # same pipeline (bodies/src.<kind>.<view>)
        extra = ['--body', src]
    p = subprocess.run([sys.executable, os.path.join(HERE, 'cmdb_pipe.py'), raw, kind, view, cmdb.key_of(kind, view), out]
                       + extra, capture_output=True, text=True)
    print(p.stdout.strip() or p.stderr[-800:], flush=True)
    r = json.load(open(os.path.join(out, 'checks.json')))
    return out, r


def main():
    a = sys.argv[1:]
    B = json.load(open(BJ)) if os.path.exists(BJ) else {}
    if a[0] == 'fixed':
        for (kind, view), what in FIXED_SRC.items():
            raw = cmdb.FIXED_BODY[(kind, view)]
            out, r = run(kind, view, raw)
            B[f'{kind}.{view}'] = dict(raw=raw, frames=os.path.relpath(os.path.join(out, 'frames'), W),
                                      cells=r['cameraAll']['follow'], key=cmdb.key_of(kind, view), source=what,
                                      gateCells=r['gate']['cells'])
    else:
        want = a[1:] or [f'{k}.{v}' for (k, v) in cmdb.EDIT_SRC]
        for kv in want:
            kind, view = kv.split('.')[:2]
            tag = kv[len(kind) + len(view) + 1:]
            raw = os.path.join(cmdb.RAW, f'{kind}.{view}.body.edit{tag}.nb21.png')
            if not os.path.exists(raw):
                print('missing', raw); continue
            out, r = run(kind, view, raw, '.edit' + tag)
            ca = r.get('cameraRel') or r['cameraAll']
            n = int(ca['follow'].split('/')[0])
            prev = B.get(f'{kind}.{view}')
            pn = int(prev['cells'].split('/')[0]) if prev and prev.get('raw', '').startswith(cmdb.RAW) else -1
            if n >= 14 or not prev or n > pn:
                B[f'{kind}.{view}'] = dict(raw=raw, frames=os.path.relpath(os.path.join(out, 'frames'), W),
                                          cells=ca['follow'], cellsOwnHeight=r['cameraAll']['follow'],
                                          cellsScale='source body' if 'cameraRel' in r else 'own height',
                                          inheritMedian=ca.get('inheritMedian'), failing=ca.get('failing'),
                                          key='magenta', gateCells=n >= 14,
                                          source=f'cmdB: Nano Banana 2.1 edit of the {cmdb.EDIT_SRC[(kind, view)][1]} laid on magenta')
    json.dump(B, open(BJ, 'w'), indent=1)
    print(json.dumps({k: v['cells'] for k, v in B.items()}))


if __name__ == '__main__':
    main()
