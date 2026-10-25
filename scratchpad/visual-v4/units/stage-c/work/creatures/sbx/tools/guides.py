# Renders the camera-and-pose guides: for every figure and view, a grid of clay maquettes in the
# sheet's exact layout, seen from the battle camera (pitch 40, yaw 30, orthographic), lit from the
# upper left, on the figure's key colour. Troop guides paint the side-colour zones (crest, shoulder
# cape, shield face, caparison) in the nation's cloth so the model sees where the cloth goes.
# Usage: python3 guides.py [figure-id ...]   (default: every figure in ../units.json)
# Writes ../refs/guides/<id>.<view>.png (monsters: <id>.<action>.<view>.png) and a cells JSON with
# each cell's anchor and screen box, used by the camera check.
import json, os, sys, time
import numpy as np
from PIL import Image
from sdf import Scene, render, to_screen
import rigs
from rigs import humanoid, quadruped, place, salamander, treant, wyrm, sprite, hornet, Xf
from poses import LAYOUTS, humanoid_pose, Q, RIDER

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = json.load(open(os.path.join(HERE, '..', 'units.json')))
OUT = os.path.join(HERE, '..', 'refs', 'guides')
os.makedirs(OUT, exist_ok=True)
VIEWS = {'back': 0.0, 'front': 180.0}
SHEET_PX = {'1:1': (768, 768), '4:3': (896, 672), '16:9': (1024, 576), '3:4': (672, 896), '3:2': (960, 640)}


def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def dropped(gear):
    x = Xf()
    if gear.get('shield'):
        x.disc((0.12, 0.05, 0.015), (0.15, -0.1, 1.0), 0.13, 0.012, mat='zone')
    w = gear.get('weapon')
    if w in ('spear', 'lance', 'halberd', 'javelin', 'staff'):
        x.cap((-0.45, -0.1, 0.015), (0.5, 0.2, 0.015), 0.012, 0.012, mat='dark')
    elif w:
        x.cap((-0.2, 0.1, 0.015), (0.15, -0.05, 0.015), 0.014, 0.014, mat='dark')
        x.tri((0.15, -0.05, 0.02), (0.08, -0.03, 0.02), (0.13, -0.13, 0.02), 0.01, mat='dark')
    if gear.get('mount'):
        x.cap((-0.3, 0.3, 0.015), (0.4, 0.15, 0.015), 0.012, 0.012, mat='dark')
    return x


def humanoid_cell(u, cell, facing, zones):
    gear = dict(u['gear'])
    act = u.get('act')
    if u['layout'] in ('archer',) and cell in ('windup', 'strike'):
        gear['weapon'] = 'knife'
    if u['layout'] == 'thrower' and cell in ('windup', 'strike'):
        gear['weapon'] = 'knife'
    if u['layout'] == 'thrower' and cell in ('runA', 'runB'):
        cell = {'runA': 'runA', 'runB': 'runB'}[cell]
    over = (u.get('cellOverrides') or {})
    name = cell
    if cell in ('fleeA', 'fleeB') and over:  # berserkers never flee
        name = 'cheer' if cell == 'fleeA' else 'follow'
    if cell == 'dropped':
        return [(dropped(gear), dict(facing=facing))]
    p = humanoid_pose(name, act)
    if cell in ('fleeA', 'fleeB') and not over:
        gear['weapon'] = None; gear['shield'] = None
    if p.pop('_thrown', False):
        gear['weapon'] = None
    p.pop('_nogear', None)
    pitch = p.pop('_pitch', 0.0); roll = p.pop('_roll', 0.0)
    x = humanoid(gear, p, zones)
    return [(x, dict(facing=facing, pitch_all=pitch, roll_all=roll))]


def mount_cell(u, cell, facing, zones):
    gear = dict(u['gear'])
    kind = gear.pop('mount')
    wolf = kind == 'wolf'
    rider = dict(gear)
    q, rp, riderless = 'stand', 'stand', False
    m = {'stand': ('stand', 'stand'), 'walkA': ('walkA', 'walk'), 'walkB': ('walkB', 'walk'),
         'lopeA': ('gallopA', 'gallop'), 'lopeB': ('gallopB', 'gallop'),
         'gallopA': ('gallopA', 'gallop'), 'gallopB': ('gallopB', 'gallop'),
         'leapA': ('charge', 'gallop'), 'leapB': ('gallopB', 'gallop'),
         'charge': ('charge', 'charge'), 'windup': ('stand', 'windup'), 'strike': ('walkA', 'thrust' if wolf else 'strike'),
         'bite': ('charge', 'gallop'), 'recoil': ('recoil', 'recoil'), 'fall': ('fall', 'fall'),
         'boltA': ('gallopA', None), 'boltB': ('gallopB', None), 'cheer': ('stand', 'cheer')}
    if cell == 'dropped':
        return [(dropped(dict(u['gear'])), dict(facing=facing))]
    if cell in ('deadA', 'deadB'):
        mpose = dict(Q['dead'])
        x = quadruped(kind, mpose, zones)
        r = humanoid(rider, humanoid_pose('deadA' if cell == 'deadA' else 'deadB'), zones)
        rp = humanoid_pose('deadA' if cell == 'deadA' else 'deadB')
        return [(x, dict(facing=facing, roll_all=85 if cell == 'deadA' else -85)),
                (humanoid(rider, {k: v for k, v in rp.items() if not k.startswith('_')}, zones),
                 dict(facing=facing + (30 if cell == 'deadA' else -40), pitch_all=rp['_pitch'], offset=(0.45 if cell == 'deadA' else -0.5, -0.35, 0)))]
    q, rp = m[cell]
    mpose = dict(Q[q])
    if cell == 'bite' or cell == 'leapA':
        mpose['jaw'] = 35 if cell == 'bite' else 15
        mpose['head'] = (-5, 0)
    if wolf and cell in ('leapA',):
        mpose['lift'] = 0.12; mpose['pitch'] = 12
    if cell in ('windup', 'strike') and not wolf:
        rider['weapon'] = 'sword'
    if rp is None:
        return [(quadruped(kind, mpose, zones), dict(facing=facing))]
    return [(quadruped(kind, mpose, zones, rider=rider, rider_pose=RIDER[rp]), dict(facing=facing))]


def sprite_cell(cell, facing):
    P = {'wingUp': dict(wing=45), 'wingMid': dict(wing=0), 'wingDown': dict(wing=-40), 'glide': dict(wing=10, lean=25),
         'dive': dict(wing=30, lean=60, h=0.6), 'strike': dict(wing=60, lean=-15, h=0.75), 'recoil': dict(wing=-20, lean=-30),
         'wingUp2': dict(wing=45), 'wingDown2': dict(wing=-40)}
    if cell == 'burstA' or cell == 'burstB':
        x = Xf()
        rng = np.random.default_rng(3 if cell == 'burstA' else 4)
        n = 9 if cell == 'burstA' else 4
        for i in range(n):
            c = np.array([rng.normal(0, 0.18), rng.normal(0, 0.18), 0.8 + rng.normal(0, 0.18)])
            r = (0.05 if cell == 'burstA' else 0.03) * (0.6 + rng.random())
            x.ell(c, (r, r, r * 1.3), mat='glow')
        return [(x, dict(facing=facing, ground=False))]
    if cell == 'mark':
        x = Xf(); x.ell((0, 0, 0.0), (0.22, 0.18, 0.01), mat='dark')
        return [(x, dict(facing=facing, ground=False))]
    p = P[cell]
    turn = 25 if cell.endswith('2') else 0
    return [(sprite(p), dict(facing=facing + turn, ground=False))]


def hornet_cell(cell, facing):
    yaw = {'0': 0, '90': 90, '180': 180}
    if cell.startswith('dead'):
        p = dict(h=0.03, yaw=40 if cell == 'deadA' else -70, pitch=0, wing=-5)
        return [(hornet(p), dict(facing=facing, roll_all=170, ground=True))]
    base = ''.join(ch for ch in cell if not ch.isdigit())
    ang = yaw[cell[len(base):]]
    p = dict(h=0.3, yaw=ang)
    if base == 'up': p['wing'] = 55
    if base == 'down': p['wing'] = -35
    if base == 'sting': p.update(pitch=-40, wing=20, sting=1)
    if base == 'glide': p['wing'] = 5
    return [(hornet(p), dict(facing=facing, ground=False))]


def cell_scene(u, cell, view, zones):
    facing = VIEWS[view]
    if u['layout'] in ('melee', 'archer', 'thrower', 'commander'):
        parts = humanoid_cell(u, cell, facing, zones)
    elif u['layout'] in ('cavalry', 'wolfrider'):
        parts = mount_cell(u, cell, facing, zones)
    elif u['layout'] == 'sprite':
        parts = sprite_cell(cell, facing)
    elif u['layout'] == 'hornet':
        parts = hornet_cell(cell, facing)
    sc = Scene()
    for x, kw in parts:
        place(x, sc, **kw)
    return sc


def screen_box(sc):
    a = np.array([[*p[:3]] for p in sc.points]); r = np.array([p[3] for p in sc.points])
    from sdf import R as SR, U as SU
    sx = a @ SR; sy = -(a @ SU)
    return float((sx - r).min()), float((sy - r).min()), float((sx + r).max()), float((sy + r).max())


def render_sheet(u, view, zones=True):
    cols, rows, aspect, cells = LAYOUTS[u['layout']]
    W, Hh = SHEET_PX[aspect]
    cw, ch = W / cols, Hh / rows
    over = u.get('cellOverrides') or {}
    scenes = [cell_scene(u, c, view, zones) for c in cells]
    boxes = [screen_box(s) for s in scenes]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes); x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    k = max((x1 - x0) / (0.96 * cw), (y1 - y0) / (0.96 * ch))
    ax = cw / 2 - (x0 + x1) / 2 / k; ay = ch / 2 - (y0 + y1) / 2 / k
    nat = UNITS['nations'][u['nation']]
    key = hexrgb(UNITS['keys'][u['key']])
    zone = hexrgb(nat['cloth']['hex']) if zones else (0.66, 0.65, 0.63)
    sheet = np.zeros((Hh, W, 3), np.float32); sheet[:] = key
    meta = []
    for i, (c, s) in enumerate(zip(cells, scenes)):
        cx, cy = i % cols, i // cols
        img, a = render(s, int(cw), int(ch), k, ax, ay, zone=zone, zone2=zone, bg=key)
        sheet[int(cy * ch):int(cy * ch) + int(ch), int(cx * cw):int(cx * cw) + int(cw)] = img
        ys, xs = np.nonzero(a)
        meta.append(dict(cell=c, words=over.get(c), col=cx, row=cy, anchor=[cx * cw + ax, cy * ch + ay],
                         box=[int(cx * cw + xs.min()), int(cy * ch + ys.min()), int(cx * cw + xs.max()), int(cy * ch + ys.max())] if xs.size else None))
    return sheet, dict(id=u['id'], view=view, size=[W, Hh], grid=[cols, rows], aspect=aspect, k=k, cells=meta)


# ---- monsters: one image per action and view ----
MON = {
    'salamander': dict(rig=salamander, actions={
        'idle': dict(), 'breath': dict(neck=(35, 0), head=(5, 0), jaw=28),
        'tailLash': dict(tail=-80, neck=(20, -25), head=(-5, -20)),
        'hit': dict(neck=(45, 15), head=(20, 15), tail=50, rear=6),
        'dead': dict(neck=(-5, 30), head=(-10, 30), jaw=12, tail=35, _roll=80)}),
    'treant': dict(rig=treant, actions={
        'idle': dict(), 'windup': dict(lean=-8, rUA=(60, 30), rFA=(80, 10), lUA=(55, -30), lFA=(80, -10)),
        'slam': dict(lean=18, rUA=(-20, 20), rFA=(-70, 10), lUA=(-25, -20), lFA=(-70, -10)),
        'hit': dict(lean=-14, rUA=(-30, 70), rFA=(-20, 90), lUA=(-40, -60), lFA=(-30, -80)),
        'dead': dict(_pitch=-86, rUA=(0, 80), lUA=(-10, -70))}),
    'wyrm': dict(rig=wyrm, actions={
        'idle': dict(wing=(15, 70)),
        'breath': dict(rear=14, neck=(20, 0, 0), neckLift=-10, head=(-5, 0), jaw=30, wing=(45, 30)),
        'bite': dict(neck=(5, 0, 0), neckLift=-40, head=(-35, 0), jaw=35, wing=(25, 50)),
        'flight': dict(air=1.2, legs='tuck', wing=(60, 0), neck=(25, 0, 0), tail=15),
        'hit': dict(rear=6, neck=(55, 25, 30), head=(0, 25), wing=(50, 20), tail=60),
        'dead': dict(legs='sprawl', neck=(-10, 30, 40), neckLift=-10, head=(-5, 40), jaw=15, wing=(-5, 10), tail=70, _roll=0)}),
}


def render_monster(u, action, view):
    m = MON[u['body']]
    p = dict(m['actions'][action])
    pitch = p.pop('_pitch', 0.0); roll = p.pop('_roll', 0.0)
    x = m['rig'](p)
    sc = Scene()
    place(x, sc, facing=VIEWS[view], pitch_all=pitch, roll_all=roll, ground=action != 'flight')
    b = screen_box(sc)
    w, h = b[2] - b[0], b[3] - b[1]
    r = w / h
    aspect = min(SHEET_PX, key=lambda a: abs(np.log((SHEET_PX[a][0] / SHEET_PX[a][1]) / r)))
    W, Hh = SHEET_PX[aspect]
    k = max(w / (0.86 * W), h / (0.86 * Hh))
    ax = W / 2 - (b[0] + b[2]) / 2 / k; ay = Hh / 2 - (b[1] + b[3]) / 2 / k
    key = hexrgb(UNITS['keys'][u['key']])
    zone = (0.42, 0.40, 0.38)  # wing membranes and crowns: a darker clay, no side colour on monsters
    img, a = render(sc, W, Hh, k, ax, ay, zone=zone, bg=key, steps=120)
    ys, xs = np.nonzero(a)
    return img, dict(id=u['id'], action=action, view=view, size=[W, Hh], aspect=aspect, k=k, anchor=[ax, ay],
                     box=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())])


def save(img, path):
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(path)


def main(ids):
    meta = {}
    mp = os.path.join(OUT, 'guides.json')
    if os.path.exists(mp):
        meta = json.load(open(mp))
    for u in UNITS['units']:
        if ids and u['id'] not in ids:
            continue
        views = ['back'] if u.get('singleView') else ['back', 'front']
        t0 = time.time()
        if u['role'] == 'monster':
            for a in u['actions']:
                for v in views:
                    img, m = render_monster(u, a, v)
                    save(img, os.path.join(OUT, f"{u['id']}.{a}.{v}.png")); meta[f"{u['id']}.{a}.{v}"] = m
        else:
            for v in views:
                img, m = render_sheet(u, v, zones=u['role'] == 'troop')
                save(img, os.path.join(OUT, f"{u['id']}.{v}.png")); meta[f"{u['id']}.{v}"] = m
        json.dump(meta, open(mp, 'w'), indent=1)  # after every figure, so an interrupted run keeps its work
        print(u['id'], round(time.time() - t0, 1), 's', flush=True)
    json.dump(meta, open(mp, 'w'), indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
