# Stage B troops2: cross-camera probe. For a target figure and view, every upright frame of every existing troop sheet of
# the same view is measured against each of the target guide's cells with the camera gate's own measure
# (pilot_metrics.camera_all: silhouette IoU at each one's own height and ground point, and the facing margin against the
# mirrored guide cell). It tells which existing painted frames already sit at the target maquette's camera and pose, so a
# base for a Nano Banana 2.1 re-dress can be laid from them (no generation).
# Usage: python3 t2_probe.py FIG VIEW [--json OUT]
import glob, json, os, sys

TR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/troops'
SBX = os.path.join(TR, 'sbx', 'tools')
sys.path.insert(0, SBX)
os.chdir(SBX)
import pilot_metrics as pm  # noqa: E402
from checks import guide_cells, frame_mask, norm_sil  # noqa: E402

ROOT = os.path.join(TR, 'sbx')


def frames_dirs(view):
    out = []
    for d in sorted(glob.glob(os.path.join(TR, 'sheets', '*'))):
        fd = os.path.join(d, 'frames')
        js = glob.glob(os.path.join(fd, f'*.{view}.json'))
        if js:
            ck = os.path.join(d, 'checks.json')
            out.append((os.path.basename(d), fd, json.load(open(js[0])), json.load(open(ck)) if os.path.exists(ck) else None))
    return out


def probe(fig, view):
    gc = guide_cells(os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png'), fig, view)
    gs = {n: norm_sil(g['mask'], g['anchor'], g['height']) for n, g in gc.items()}
    res = {}
    for name, fd, meta, ck in frames_dirs(view):
        for f in meta['frames']:
            if f.get('missing') or f['name'] == 'dropped':
                continue
            _, m = frame_mask(fd, f)
            a = norm_sil(m, f['anchor'], f['height'])
            for cell, b in gs.items():
                i, im = pm.iou(a, b), pm.iou(a, b[:, ::-1])
                res.setdefault(cell, []).append((round(i, 3), round(i - im, 3), name, f['name']))
    for cell in res:
        res[cell].sort(key=lambda t: -t[0])
    return res


if __name__ == '__main__':
    a = sys.argv[1:]
    r = probe(a[0], a[1])
    for cell, lst in r.items():
        ok = [t for t in lst if t[0] >= 0.55 and t[1] >= 0]
        print(f'{cell:8s}', ' | '.join(f'{t[0]:.2f}/{t[1]:+.2f} {t[2]}:{t[3]}' for t in ok[:5]) or 'none')
    if '--json' in a:
        json.dump(r, open(a[a.index('--json') + 1], 'w'))
