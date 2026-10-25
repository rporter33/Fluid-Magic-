# Stage B fix pass, critique fix 12 (3): a full-length pose, parts and framing reference for every god's body portrait.
# The god portraits are whole figures from head to foot, but their only reference was the leader anchor, a
# head-and-shoulders bust, which invites a bust crop. No designer render of the gods exists yet, so each god's variant 0
# (inventory.json "look") is built as a grey clay maquette with the stage A rigs (units/tools/rigs.py) and rendered by
# the stage A raymarcher (units/tools/sdf.py) from a portrait camera: three-quarter front, 12 degrees above, the whole
# figure in the square with the portraits' margins, on the portraits' dark warm background. It is Image 1 of the god's
# body job (pose, parts, framing); the anchor is Image 2 (the hand). The serpent (Elder Wyrm) has no rig: its job keeps
# the anchor alone and says so.
# Usage: python3 -I pt_maquettes.py    (writes ../refs/gods/<id>.png and ../refs/gods/maquettes.json)
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(UNITS, 'tools'))
import sdf  # noqa: E402
import rigs  # noqa: E402
from rigs import humanoid, quadruped, place, treant, wyrm, Xf  # noqa: E402
from poses import humanoid_pose, Q  # noqa: E402

OUT = os.path.join(HERE, '..', 'refs', 'gods')
BG = (28 / 255, 26 / 255, 23 / 255)
SIZE = 768

# the portrait camera: three-quarter front (yaw 30), 12 degrees above (the battle camera is 40)
PITCH, YAW = np.radians(12.0), np.radians(30.0)
sdf.F = np.array([-np.sin(YAW) * np.cos(PITCH), np.cos(YAW) * np.cos(PITCH), -np.sin(PITCH)])
sdf.R = np.array([np.cos(YAW), np.sin(YAW), 0.0])
sdf.U = np.cross(sdf.R, sdf.F)
L = -0.55 * sdf.R + 0.45 * sdf.U + 0.55 * np.array([0, 0, 1.0]) - 0.35 * sdf.F  # candle-like key light, upper left
sdf.LIGHT = L / np.linalg.norm(L)

# variant 0 of every slot, as the rigs can build it (the prompt carries the rest)
BIPED = {
    'oracle': dict(gear=dict(helm='cowl', robe=True, weapon='staff', glow=False, bulk=1.1), pose='stand', float=0.1),
    'titan': dict(gear=dict(helm='kettle', weapon='greataxe', bulk=1.35, pauldrons=True), pose='stand', sword=True),
    'ascendedHero': dict(gear=dict(helm='circlet', cape=True, weapon='sword', bulk=1.15), pose='stand'),
    'ashColossus': dict(gear=dict(helm='wild', bare=True, weapon=None, bulk=1.5, pauldrons=False), pose='stand'),
    'pyreLord': dict(gear=dict(helm='spiked', cape=True, weapon='halberd', bulk=1.2), pose='stand'),
    'emberHierophant': dict(gear=dict(helm='hood', robe=True, weapon='staff', bulk=1.1), pose='stand'),
    'hornedHunter': dict(gear=dict(helm='antler', cape=True, weapon='spear', bulk=1.15), pose='stand'),
    'motherOfBeasts': dict(gear=dict(helm='antler', cape=True, weapon='greataxe', bulk=1.25), pose='stand'),
}


def slab():
    x = Xf()
    x.box((0, 0, 0.62), (0.22, 0.16, 0.62), rr=0.03)
    x.box((0, 0, 0.05), (0.32, 0.25, 0.05), rr=0.02, mat='dark')
    return x


def build(gid, body):
    sc = sdf.Scene()
    if gid in BIPED:
        b = BIPED[gid]
        gear = dict(b['gear'])
        if b.get('sword'):
            gear['weapon'] = 'sword'
        x = humanoid(gear, humanoid_pose(b['pose']), zones=True)
        place(x, sc, facing=180.0, offset=(0, 0, b.get('float', 0.0)), ground=not b.get('float'))
        return sc, 'humanoid rig, ' + ', '.join(f'{k} {v}' for k, v in gear.items() if v not in (None, False))
    if gid in ('greatWyrm', 'ashPhoenix'):
        x = wyrm(dict(wing=(35, 40)))
        place(x, sc, facing=180.0)
        return sc, 'wyrm rig, wings half raised'
    if gid == 'worldTree':
        place(treant(dict()), sc, facing=180.0)
        return sc, 'treant rig'
    if gid in ('primordial', 'wildSpirit'):
        x = quadruped('horse' if gid == 'primordial' else 'wolf', dict(Q['stand']), zones=False)
        place(x, sc, facing=150.0)
        return sc, f"quadruped rig ({'horse' if gid == 'primordial' else 'wolf'} frame)"
    if gid in ('livingMonolith', 'cinderIdol'):
        place(slab(), sc, facing=180.0)
        return sc, 'slab on a plinth'
    return None, 'no rig for this body (' + body + '): the anchor alone'


def render(sc):
    sx, sy = [], []
    lo, hi = sc.bounds()
    for x in (lo[0], hi[0]):
        for y in (lo[1], hi[1]):
            for z in (lo[2], hi[2]):
                a, b = sdf.to_screen((x, y, z)); sx.append(a); sy.append(b)
    w, h = max(sx) - min(sx), max(sy) - min(sy)
    k = max(w / (0.78 * SIZE), h / (0.86 * SIZE))  # whole figure, the portraits' margins
    cx = SIZE / 2 - (min(sx) + max(sx)) / 2 / k
    cy = SIZE * 0.52 - (min(sy) + max(sy)) / 2 / k
    img, a = sdf.render(sc, SIZE, SIZE, k, cx, cy, zone=(0.46, 0.44, 0.41), bg=BG, steps=140)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    inv = json.load(open(os.path.join(UNITS, 'inventory.json')))['items']
    rec = {}
    for it in inv:
        if it['kind'] != 'god':
            continue
        gid = it['id'].split('-')[0]
        path = os.path.join(OUT, f"{it['id']}.png")
        if gid in [k.split('-')[0] for k in rec] and os.path.exists(os.path.join(OUT, f"{gid}.png")):
            rec[it['id']] = dict(file=os.path.relpath(os.path.join(OUT, f'{gid}.png'), UNITS), how=rec[next(k for k in rec if k.startswith(gid))]['how'])
            continue
        sc, how = build(gid, it['body'])
        if sc is None:
            rec[it['id']] = dict(file=None, how=how)
            continue
        img = render(sc)
        p = os.path.join(OUT, f'{gid}.png')
        Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(p)
        rec[it['id']] = dict(file=os.path.relpath(p, UNITS), how=how, look=it['look'])
        print(it['id'], how)
    json.dump(rec, open(os.path.join(OUT, 'maquettes.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
