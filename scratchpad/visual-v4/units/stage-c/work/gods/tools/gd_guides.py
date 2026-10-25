# Stage C gods: exact-camera clay maquettes (pitch 40, yaw 30, orthographic) of every god body, idle, in both views
# (back: the near side facing up-right; front: the far side facing down-left), on the god's key colour, its tint zone
# painted in the nation's cloth. One image per god and view, the body filling 86% of the frame in the aspect nearest
# its box (as tools/guides.py render_monster does for the Salamander and the Treant). Writes
# work/gods/guides/<god>.idle.<view>.png and guides.json in the stage A format (id, action, view, size, aspect, k,
# anchor = the pixel of the world origin under the body, box), plus the body's true screen size in world units.
# Usage: python3 -I gd_guides.py [god ...]
import json, os, sys, time
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gd_rigs  # noqa: E402  (puts units/tools on the path)
from gd_rigs import build, FLOAT, SIZE, LADDER  # noqa: E402
from sdf import Scene, render  # noqa: E402
from rigs import place  # noqa: E402
import guides as stage_a_guides  # noqa: E402

OUT = os.path.join(HERE, '..', 'guides')
VIEWS = {'back': 0.0, 'front': 180.0}
SHEET_PX = {'1:1': (768, 768), '4:3': (896, 672), '3:4': (672, 896), '16:9': (1024, 576), '9:16': (576, 1024),
            '3:2': (960, 640), '2:3': (640, 960), '21:9': (1176, 504)}
KEYS = {'green': (0.0, 1.0, 0.0), 'magenta': (1.0, 0.0, 1.0), 'blue': (0.0, 0.0, 1.0)}
CLOTH = {'cinderHorde': '#C4532C', 'thornwood': '#1F6A50'}
# art plan 5.2: green for the Cinder palette (charcoal, ash, iron, ember), blue for the bodies of ember and coals,
# magenta for the Thornwood greens
KEY = dict(titan='green', oracle='green', ascendedHero='green', greatWyrm='green', livingMonolith='green',
           primordial='green', pyreLord='green', emberHierophant='green',
           ashColossus='blue', ashPhoenix='blue', cinderIdol='blue',
           wildSpirit='magenta', worldTree='magenta', hornedHunter='magenta', elderWyrm='magenta', motherOfBeasts='magenta')
PAINTED_NATION = {g: ('thornwood' if KEY[g] == 'magenta' else 'cinderHorde') for g in KEY}
WU_PER_RIG = None


def wu_per_rig():
    """World units per rig unit on screen: a man's guide body height is 28 wu (design 3.1; pilot_page.true_height_wu)."""
    global WU_PER_RIG
    if WU_PER_RIG is None:
        from pack import body_height
        from checks import guide_cells
        G = os.path.join(gd_rigs.UNITS, 'refs', 'guides')
        man = guide_cells(os.path.join(G, 'cinderWarrior.back.png'), 'cinderWarrior', 'back')['stand']
        k = json.load(open(os.path.join(G, 'guides.json')))['cinderWarrior.back']['k']
        WU_PER_RIG = 28 / (body_height(man['mask']) * k)
    return WU_PER_RIG


def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


PREVIEW = 1.0  # --preview renders at half size with fewer steps (a quick look while posing)


def render_god(gid, view, meta_only=False):
    """meta_only: the frame, scale and anchor from the geometry and the box from the saved guide image (no ray march),
    for rebuilding guides.json after parallel renders."""
    x, weapons, note, L, zh = build(gid, view)
    sc = Scene()
    fl = FLOAT.get(gid, 0.0) * L
    place(x, sc, facing=VIEWS[view], offset=(0, 0, fl))
    b = stage_a_guides.screen_box(sc)
    w, h = b[2] - b[0], b[3] - b[1]
    r = w / h
    aspect = min(SHEET_PX, key=lambda a: abs(np.log((SHEET_PX[a][0] / SHEET_PX[a][1]) / r)))
    W, Hh = (int(v * PREVIEW) for v in SHEET_PX[aspect])
    k = max(w / (0.86 * W), h / (0.86 * Hh))
    ax = W / 2 - (b[0] + b[2]) / 2 / k; ay = Hh / 2 - (b[1] + b[3]) / 2 / k
    key = KEYS[KEY[gid]]
    zone = hexrgb(CLOTH[PAINTED_NATION[gid]])
    if meta_only:
        img = np.asarray(Image.open(os.path.join(OUT, f'{gid}.idle.{view}.png')).convert('RGB')).astype(np.float64) / 255
        a = np.abs(img - np.array(key)).sum(-1) > 0.2
    else:
        img, a = render(sc, W, Hh, k, ax, ay, zone=zone, zone2=zone, bg=key, steps=160 if PREVIEW == 1.0 else 90)
    ys, xs = np.nonzero(a)
    wpr = wu_per_rig()
    box = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    return img, dict(id=gid, action='idle', view=view, size=[W, Hh], aspect=aspect, k=k, anchor=[ax, ay], box=box,
                     key=KEY[gid], zoneHex=CLOTH[PAINTED_NATION[gid]], rig=note, sizeClass=SIZE[gid], ladder=L,
                     worldHeightMen=round(zh, 3), floatMen=round(fl, 3),
                     heightWu=round((box[3] - box[1]) * k * wpr, 1), widthWu=round((box[2] - box[0]) * k * wpr, 1),
                     wuPerPx=round(k * wpr, 5))


def main(ids):
    global OUT, PREVIEW
    if '--preview' in ids:
        ids = [i for i in ids if i != '--preview']; PREVIEW = 0.5; OUT = os.path.join(HERE, '..', 'guides-preview')
    os.makedirs(OUT, exist_ok=True)
    mp = os.path.join(OUT, 'guides.json')
    if '--meta' in ids:  # rebuild guides.json from the saved images (parallel renders each wrote their own copy)
        meta = {}
        for gid in KEY:
            for v in VIEWS:
                if os.path.exists(os.path.join(OUT, f'{gid}.idle.{v}.png')):
                    meta[f'{gid}.idle.{v}'] = render_god(gid, v, meta_only=True)[1]
        json.dump(meta, open(os.path.join(OUT, 'guides-merged.json'), 'w'), indent=1)  # the readers' copy (parallel renders race on guides.json)
        print(len(meta), 'guides'); return
    meta = json.load(open(mp)) if os.path.exists(mp) else {}
    for gid in (ids or list(KEY)):
        t0 = time.time()
        for v in VIEWS:
            img, m = render_god(gid, v)
            Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, f'{gid}.idle.{v}.png'))
            meta[f'{gid}.idle.{v}'] = m
            json.dump(meta, open(mp, 'w'), indent=1)
        print(gid, m['aspect'], 'h', m['heightWu'], 'w', m['widthWu'], 'world', m['worldHeightMen'], 'ladder', m['ladder'],
              round(time.time() - t0, 1), 's', flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])
