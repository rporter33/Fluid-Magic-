# Rest of stage D: exact-camera maquette guides for the big bodies' actions (art plan 2.3, 5.3) and their part-ID pass
# (art plan 6, last paragraph). A guide is Image 1 of an action prompt: a 2 x 2 sheet of four actions for size 4 and
# under (1024 x 1024, 512 px cells, one shared scale so the four poses keep their sizes), or one action per image for
# size 5 and 6 (the aspect nearest its box, the body filling 86%, as stage C's gd_guides did). Each guide is written with
#   <id>.png          the clay render on the body's key colour (the god's tint zone in the nation's cloth)
#   <id>.parts.png    the part-ID pass: one index per pixel (0 background), the legend in the JSON
#   <id>.json         size, grid, per cell: action, cell box, k (rig units per px), wuPerPx, anchor (the world origin
#                     under the body, px), box, the named rig points in px (tip, mouth, feet, hands), parts present
# Usage: python3 -I dd_guides.py JOB_ID ...   (jobs from dd_jobs.py: guides.json lists them)   or  --all
import json, os, sys, time
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dd_rigs as RG  # noqa: E402
from sdf import Scene, R as SR, U as SU, F as SF, LIGHT, MAT_RGB  # noqa: E402

PROD = os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.join(PROD, 'guides')
VIEWS = {'back': 0.0, 'front': 180.0}
SHEET_PX = {'1:1': (768, 768), '4:3': (896, 672), '3:4': (672, 896), '16:9': (1024, 576), '9:16': (576, 1024),
            '3:2': (960, 640), '2:3': (640, 960), '21:9': (1176, 504)}
KEYS = {'green': (0.0, 1.0, 0.0), 'magenta': (1.0, 0.0, 1.0), 'blue': (0.0, 0.0, 1.0)}
CLOTH = {'cinderHorde': (0.769, 0.325, 0.173), 'thornwood': (0.122, 0.416, 0.314)}
MON_ZONE = (0.42, 0.40, 0.38)  # the creatures' crowns and membranes: a darker clay (stage A render_monster)
WU_PER_RIG = 28 / 0.895  # world units per rig unit: a man's guide body (0.895 rig units feet to crown, stage C wu_per_rig) is 28 wu


def wu_per_rig():
    global WU_PER_RIG
    try:
        sys.path.insert(0, os.path.join(RG.UNITS, 'stage-c', 'work', 'gods', 'tools'))
        import gd_guides
        WU_PER_RIG = gd_guides.wu_per_rig()
    except Exception as e:  # noqa: BLE001
        print('wu_per_rig fallback', e)
    return WU_PER_RIG


def render2(scene, w, h, k, cx, cy, zone, bg, steps=140):
    """sdf.render, also returning the primitive index under each pixel (-1 for the background)."""
    img = np.empty((h, w, 3), np.float32); img[:] = bg
    prim = np.full((h, w), -1, np.int32)
    lo, hi = scene.bounds()
    corners = np.array([[x, y, z] for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])])
    sx = corners @ SR; sy = -(corners @ SU)
    x0 = max(0, int(np.floor(cx + sx.min() / k)) - 2); x1 = min(w, int(np.ceil(cx + sx.max() / k)) + 2)
    y0 = max(0, int(np.floor(cy + sy.min() / k)) - 2); y1 = min(h, int(np.ceil(cy + sy.max() / k)) + 2)
    if x1 <= x0 or y1 <= y0:
        return img, prim
    jj, ii = np.mgrid[y0:y1, x0:x1]
    px = ((ii - cx) * k).astype(np.float32).ravel(); py = ((jj - cy) * k).astype(np.float32).ravel()
    center = (lo + hi) / 2
    rad = float(np.linalg.norm(hi - lo)) / 2 + 0.05
    T0 = float(center @ SF) - rad
    O = (px[:, None] * SR[None] - py[:, None] * SU[None] + T0 * SF[None]).astype(np.float32)
    t = np.zeros(O.shape[0], np.float32)
    alive = np.ones(O.shape[0], bool); hit = np.zeros(O.shape[0], bool); mat = np.zeros(O.shape[0], np.int32)
    eps = k * 0.35
    Ff = SF.astype(np.float32)
    for _ in range(steps):
        idx = np.nonzero(alive)[0]
        if idx.size == 0:
            break
        P = O[idx] + t[idx, None] * Ff
        d, m = scene.sdf(P)
        done = d < eps
        hit[idx[done]] = True; mat[idx[done]] = m[done]; alive[idx[done]] = False
        t[idx] += np.maximum(d, eps * 0.5) * 0.9
        alive[idx[t[idx] > 2 * rad + 0.1]] = False
    hi_idx = np.nonzero(hit)[0]
    if hi_idx.size:
        P = O[hi_idx] + t[hi_idx, None] * Ff
        e = k * 0.5
        n = sum(np.array(s, np.float32)[None] * scene.sdf(P + np.array(s, np.float32) * e)[0][:, None]
                for s in ((1, -1, -1), (-1, -1, 1), (-1, 1, -1), (1, 1, 1)))
        n /= (np.linalg.norm(n, axis=1, keepdims=True) + 1e-9)
        lam = np.clip(n @ LIGHT.astype(np.float32), 0, 1)
        rim = np.clip(1 - np.abs(n @ (-Ff)), 0, 1) ** 3 * 0.12
        shade = 0.38 + 0.62 * lam + rim
        cols = np.zeros((hi_idx.size, 3), np.float32)
        for i, (_, _, mname) in enumerate(scene.prims):
            sel = mat[hi_idx] == i
            if sel.any():
                cols[sel] = zone if mname in ('zone', 'zone2') else MAT_RGB[mname]
        out = cols * shade[:, None]
        flat = img[y0:y1, x0:x1].reshape(-1, 3); flat[hi_idx] = np.clip(out, 0, 1); img[y0:y1, x0:x1] = flat.reshape(y1 - y0, x1 - x0, 3)
        pf = prim[y0:y1, x0:x1].ravel(); pf[hi_idx] = mat[hi_idx]; prim[y0:y1, x0:x1] = pf.reshape(y1 - y0, x1 - x0)
    return img, prim


def screen_box(sc):
    a = np.array([[*p[:3]] for p in sc.points]); r = np.array([p[3] for p in sc.points])
    sx = a @ SR; sy = -(a @ SU)
    return float((sx - r).min()), float((sy - r).min()), float((sx + r).max()), float((sy + r).max())


def scene_for(body, action, view):
    x, kw, note, s = RG.build(body, action, view)
    sc = Scene()
    pts = RG.place(x, sc, facing=VIEWS[view], **kw)
    return sc, pts, note, s


def key_of(body):
    return RG.GOD_KEY.get(body) or RG.BODY[body]['key']


def zone_of(body):
    if body in ('salamander', 'treant', 'giant'):
        return MON_ZONE
    return CLOTH['thornwood' if key_of(body) == 'magenta' else 'cinderHorde']


def to_px(p, k, ax, ay):
    return [round(float(p @ SR) / k + ax, 1), round(float(-(p @ SU)) / k + ay, 1)]


def render_job(job, preview=False):
    """job: dict(id, body, view, actions=[...], layout='grid'|'single')."""
    body, view, acts = job['body'], job['view'], job['actions']
    key = KEYS[key_of(body)]
    zone = zone_of(body)
    scenes = [scene_for(body, a, view) for a in acts]
    boxes = [screen_box(s[0]) for s in scenes]
    steps = 90 if preview else 110
    wpr = WU_PER_RIG
    if job['layout'] == 'grid':
        W = H = 512 if preview else 768
        cw = ch = W // 2
        # each pose fills its own cell (88% of its longer side): the painted figures keep the most pixels, and each cell's
        # scale is recovered from its own registration (dd_post.py); the cell's k is in its record
        ks = [max((b[2] - b[0]) / (0.88 * cw), (b[3] - b[1]) / (0.88 * ch)) for b in boxes]
        k = max(ks)
        img = np.zeros((H, W, 3), np.float32); img[:] = key
        part = np.zeros((H, W), np.uint8)
        cells = []
        legend = []
        for i, (a, (sc, pts, note, s), b, kc) in enumerate(zip(acts, scenes, boxes, ks)):
            c, r = i % 2, i // 2
            ax = c * cw + cw / 2 - (b[0] + b[2]) / 2 / kc
            ay = r * ch + ch / 2 - (b[1] + b[3]) / 2 / kc
            im, pr = render2(sc, W, H, kc, ax, ay, zone, key, steps)
            inside = np.zeros((H, W), bool); inside[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = True
            m = (pr >= 0) & inside
            img[m] = im[m]
            for pi in np.unique(pr[m]):
                nm = sc.prim_parts[pi]
                if nm not in legend:
                    legend.append(nm)
                part[m & (pr == pi)] = legend.index(nm) + 1
            ys, xs = np.nonzero(m)
            cells.append(dict(action=a, cell=[c * cw, r * ch, (c + 1) * cw, (r + 1) * ch], anchor=[round(ax, 2), round(ay, 2)],
                              box=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if xs.size else None,
                              points={n: to_px(p, kc, ax, ay) for n, p in pts.items()}, scale=s, k=kc, wuPerPx=round(kc * wpr, 5),
                              parts=sorted(set(sc.prim_parts[pi] for pi in np.unique(pr[m])))))
        meta = dict(id=job['id'], body=body, view=view, layout='grid', size=[W, H], grid=[2, 2], aspect='1:1', k=k,
                    wuPerPx=round(k * wpr, 5), key=key_of(body), cells=cells, partLegend=legend)
    else:
        (sc, pts, note, s), b, a = scenes[0], boxes[0], acts[0]
        w, h = b[2] - b[0], b[3] - b[1]
        aspect = min(SHEET_PX, key=lambda q: abs(np.log((SHEET_PX[q][0] / SHEET_PX[q][1]) / (w / h))))
        W, H = (int(v * (0.5 if preview else 0.85)) for v in SHEET_PX[aspect])
        k = max(w / (0.86 * W), h / (0.86 * H))
        ax = W / 2 - (b[0] + b[2]) / 2 / k; ay = H / 2 - (b[1] + b[3]) / 2 / k
        img, pr = render2(sc, W, H, k, ax, ay, zone, key, steps)
        legend = []
        part = np.zeros((H, W), np.uint8)
        for pi in np.unique(pr[pr >= 0]):
            nm = sc.prim_parts[pi]
            if nm not in legend:
                legend.append(nm)
            part[pr == pi] = legend.index(nm) + 1
        ys, xs = np.nonzero(pr >= 0)
        cells = [dict(action=a, cell=[0, 0, W, H], anchor=[round(ax, 2), round(ay, 2)], box=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
                      points={n: to_px(p, k, ax, ay) for n, p in pts.items()}, scale=s, k=k, wuPerPx=round(k * wpr, 5), parts=legend)]
        meta = dict(id=job['id'], body=body, view=view, layout='single', size=[W, H], aspect=aspect, k=k, wuPerPx=round(k * wpr, 5),
                    key=key_of(body), cells=cells, partLegend=legend)
    return img, part, meta


PALETTE = np.array([[0, 0, 0], [230, 25, 75], [60, 180, 75], [255, 225, 25], [0, 130, 200], [245, 130, 48], [145, 30, 180], [70, 240, 240],
                    [240, 50, 230], [210, 245, 60], [250, 190, 212], [0, 128, 128], [220, 190, 255], [170, 110, 40], [255, 250, 200],
                    [128, 0, 0], [170, 255, 195], [128, 128, 0]], np.uint8)


def save(job, img, part, meta, out=OUT):
    os.makedirs(out, exist_ok=True)
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, job['id'] + '.png'))
    Image.fromarray(part).save(os.path.join(out, job['id'] + '.parts.png'))
    Image.fromarray(PALETTE[np.minimum(part, len(PALETTE) - 1)]).save(os.path.join(out, job['id'] + '.parts-view.png'))
    json.dump(meta, open(os.path.join(out, job['id'] + '.json'), 'w'), indent=1)


def main(args):
    wu_per_rig()
    preview = '--preview' in args
    args = [a for a in args if a != '--preview']
    jobs = json.load(open(os.path.join(PROD, 'jobs', 'guides.json')))
    if args and args[0] != '--all':
        jobs = [j for j in jobs if j['id'] in args or j['body'] in args]
    out = os.path.join(PROD, 'guides-preview') if preview else OUT
    force = '--force' in sys.argv
    for j in jobs:
        if not force and os.path.exists(os.path.join(out, j['id'] + '.json')):
            continue
        t0 = time.time()
        img, part, meta = render_job(j, preview)
        save(j, img, part, meta, out)
        print(j['id'], meta['size'], 'k', round(meta['k'], 5), round(time.time() - t0, 1), 's', flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])
