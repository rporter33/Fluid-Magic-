# Stage B calibration, part 4b: split maquettes for a mounted unit. From the Wolf Rider's own guide cells (wolfrider
# layout, front view), three sheets at one camera, one scale (k) and one cell anchor each:
#   wolfRiderJoint  - rider and wolf together (the pilot's guide, re-rendered on the blue key with a lighter green);
#   wolfOnly        - the wolf alone, in exactly the joint pose and place (saddle, blanket and harness, no rider);
#   wolfRiderSeat   - the rider alone, seated astride nothing, in exactly the joint pose and place; the two riderless
#                     cells (boltA, boltB) hold the rider dismounted on foot (standing, marching), for unhorsing.
# Each joint part is placed once (its ground and turn), then its mount primitives and its rider primitives are emitted
# into separate scenes with that same transform, so the two halves composite back into the joint figure exactly.
# Also writes, per cell, the boxes of the two halves (the composite anchors) to ../refs/guides/mount-split.json.
# Usage: python3 cal_mount_guides.py
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import guides  # noqa: E402
import rigs  # noqa: E402
from rigs import rz, ry, rx, humanoid  # noqa: E402
from sdf import Scene, render  # noqa: E402
from poses import LAYOUTS, humanoid_pose  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..'))
UPATH = os.path.join(ROOT, 'units.json')
_orig_quad = rigs.quadruped


def quad(kind, pose, zones=True, rider=None, rider_pose=None):
    n = len(_orig_quad(kind, dict(pose), zones).items)
    x = _orig_quad(kind, pose, zones, rider=rider, rider_pose=rider_pose)
    x.n_mount = n
    return x


guides.quadruped = quad


def place_split(x, kw):
    """rigs.place, returning the mount and rider halves emitted with the joint transform."""
    facing, pitch, roll = kw.get('facing', 0.0), kw.get('pitch_all', 0.0), kw.get('roll_all', 0.0)
    off = np.asarray(kw.get('offset', (0, 0, 0)), float)
    M = rz(facing) @ ry(roll) @ rx(pitch)
    T = np.zeros(3)
    if kw.get('ground', True):
        lowest = min((M @ p)[2] - r for p, r in x.pts())
        T = T + np.array([0, 0, -lowest])
    T = T + off
    n = getattr(x, 'n_mount', None)
    out = []
    for part, items in (('mount', x.items[:n] if n is not None else []), ('rider', x.items[n:] if n is not None else x.items)):
        y = rigs.Xf(); y.items = list(items)
        sc = Scene(); y.emit(sc, M, T); out.append((part, sc))
    return out


def cell_scenes(u, cell, view):
    facing = guides.VIEWS[view]
    joint, mount, rider = Scene(), Scene(), Scene()
    if cell in ('boltA', 'boltB'):  # riderless wolf; the rider sheet holds the rider dismounted, on foot
        for x, kw in guides.mount_cell(u, cell, facing, True):
            rigs.place(x, joint, **kw); rigs.place(x, mount, **kw)
        g = dict(u['gear']); g.pop('mount', None)
        p = humanoid_pose('stand' if cell == 'boltA' else 'marchA')
        for k in [k for k in p if k.startswith('_')]:
            p.pop(k)
        rigs.place(humanoid(g, p, True), rider, facing=facing)
        return joint, mount, rider
    for x, kw in guides.mount_cell(u, cell, facing, True):
        rigs.place(x, joint, **kw)
        if getattr(x, 'n_mount', None) is not None:
            for part, sc in place_split(x, kw):
                (mount if part == 'mount' else rider).prims += sc.prims
                (mount if part == 'mount' else rider).points += sc.points
        else:  # a separate rider (the dead cells)
            rigs.place(x, rider, **kw)
    return joint, mount, rider


def main():
    U = json.load(open(UPATH))
    base = next(x for x in U['units'] if x['id'] == 'wolfRider')
    view = 'front'
    cols, rows, aspect, cells = LAYOUTS['wolfrider']
    W, Hh = guides.SHEET_PX[aspect]
    cw, ch = W / cols, Hh / rows
    sc = [cell_scenes(base, c, view) for c in cells]
    boxes = [guides.screen_box(j) for j, _, _ in sc]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes); x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    k = max((x1 - x0) / (0.96 * cw), (y1 - y0) / (0.96 * ch))
    ax = cw / 2 - (x0 + x1) / 2 / k; ay = ch / 2 - (y0 + y1) / 2 / k
    key = guides.hexrgb(U['keys']['blue']); zone = guides.hexrgb('#2F8A68')
    gpath = os.path.join(guides.OUT, 'guides.json')
    meta_all = json.load(open(gpath))
    split = {}
    for which, idx in (('wolfRiderJoint', 0), ('wolfOnly', 1), ('wolfRiderSeat', 2)):
        sheet = np.zeros((Hh, W, 3), np.float32); sheet[:] = key
        meta = []
        for i, c in enumerate(cells):
            cx, cy = i % cols, i // cols
            s = sc[i][idx]
            if s.prims:
                img, a = render(s, int(cw), int(ch), k, ax, ay, zone=zone, zone2=zone, bg=key)
            else:
                img, a = np.zeros((int(ch), int(cw), 3), np.float32) + key, np.zeros((int(ch), int(cw)))
            sheet[int(cy * ch):int(cy * ch) + int(ch), int(cx * cw):int(cx * cw) + int(cw)] = img
            ys, xs = np.nonzero(a)
            box = [int(cx * cw + xs.min()), int(cy * ch + ys.min()), int(cx * cw + xs.max()), int(cy * ch + ys.max())] if xs.size else None
            meta.append(dict(cell=c, words=None, col=cx, row=cy, anchor=[cx * cw + ax, cy * ch + ay], box=box))
            split.setdefault(c, {})[which] = box
        guides.save(sheet, os.path.join(guides.OUT, f'{which}.{view}.png'))
        meta_all[f'{which}.{view}'] = dict(id=which, view=view, size=[W, Hh], grid=[cols, rows], aspect=aspect, k=k, cells=meta)
        u = dict(base, id=which, key='blue', calibration=True)
        U['units'] = [x for x in U['units'] if x['id'] != which] + [u]
        print(which, 'k', round(k, 5))
    json.dump(meta_all, open(gpath, 'w'), indent=1)
    json.dump(U, open(UPATH, 'w'), indent=1)
    json.dump(dict(k=k, cell=[cw, ch], anchor=[ax, ay], cells=split), open(os.path.join(guides.OUT, 'mount-split.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
