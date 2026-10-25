# Stage B calibration, review change 5: commander body maquettes with their kit zones painted, as the troop
# maquettes have their cloth zones. Three body kinds (an armoured chieftain, a robed caster with a staff, a hooded
# druid), commander layout, both views. The rig is the pilot's humanoid; after it is built, its primitives are
# re-materialled by shape: crown (spikes, circlet), helm dome, pauldrons, a mantle collar over the shoulders (added)
# and the hanging cape, hood, robe, staff head. Writes ../refs/guides/<id>.<view>.png and their guides.json entries,
# and adds the three bodies to ../units.json (this sandbox's copy only).
# Usage: python3 cmd_guides.py
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sdf  # noqa: E402
import guides  # noqa: E402
import rigs  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..'))
UPATH = os.path.join(ROOT, 'units.json')

BODIES = {
    'cmdChief': dict(nation='cinderHorde', key='green', act='rally',
                     gear=dict(weapon='axe', helm='spiked', cape=True, pauldrons=True),
                     mats=dict(crown=(0.60, 0.50, 0.36), helm=(0.30, 0.29, 0.28), pauldron=(0.46, 0.46, 0.50),
                               mantle=(0.20, 0.18, 0.17), staffhead=None)),
    'cmdCaster': dict(nation='cinderHorde', key='green', act='cast',
                      gear=dict(weapon='staff', helm='circlet', robe=True, glow=True, cape=True),
                      mats=dict(crown=(0.60, 0.50, 0.36), helm=None, pauldron=(0.52, 0.50, 0.49),
                                mantle=(0.52, 0.50, 0.49), robe=(0.34, 0.32, 0.32), staffhead=(0.86, 0.46, 0.20))),
    'cmdDruid': dict(nation='thornwood', key='magenta', act='cast',
                     gear=dict(weapon='staff', helm='hood', robe=True, glow=True, cape=True),
                     mats=dict(crown=None, helm=None, hood=(0.46, 0.42, 0.27), pauldron=(0.50, 0.38, 0.26),
                               mantle=(0.50, 0.38, 0.26), robe=(0.40, 0.31, 0.22), staffhead=(0.42, 0.62, 0.24))),
}


def rematerial(x, body):
    """Re-material the humanoid's primitives by shape, and add a mantle collar over the shoulders."""
    m = body['mats']
    paul = []
    items = []
    for kind, ps, args, mat in x.items:
        new = mat
        if kind == 'ell' and mat == 'zone':
            radii = np.asarray(args[0], float)
            if abs(radii[2] - 0.045) < 1e-6 and abs(radii[1] - 0.06) < 1e-6:  # a pauldron
                new = 'k_pauldron'; paul.append((np.asarray(ps[0], float), args[1]))
            else:  # the hood or cowl
                new = 'k_hood'
        elif kind == 'box' and mat == 'zone':  # the cape hanging down the back
            new = 'k_mantle'
        elif kind == 'cap' and mat == 'zone2':  # the robe skirt
            new = 'k_robe'
        elif kind == 'cap' and mat == 'dark' and len(ps) == 2 and args[0] == 0.012 and args[1] == 0.003:
            new = 'k_crown'  # the spikes of the crown
        elif kind == 'disc' and mat == 'dark':
            new = 'k_crown'  # the circlet
        elif kind == 'ell' and mat == 'dark' and np.asarray(args[0]).max() > 0.09:
            new = 'k_helm'
        elif kind == 'ell' and mat == 'glow':
            new = 'k_staffhead'
        items.append((kind, ps, args, new))
    x.items = items
    if len(paul) == 2:  # a mantle (fur, feathers or layered cloth) over both shoulders, around the neck
        (a, rot), (b, _) = paul
        c = (a + b) / 2 + rot @ np.array([0, -0.01, 0.035])
        x.items.append(('ell', [c], ((0.21, 0.11, 0.06), rot), 'k_mantle'))
    return x


def install(body):
    sdf.MAT_RGB.update({f'k_{k}': (v if v is not None else sdf.MAT_RGB['dark' if k in ('crown', 'helm') else 'clay'])
                        for k, v in body['mats'].items()})
    sdf.MAT_RGB.setdefault('k_hood', sdf.MAT_RGB['clay'])
    sdf.MAT_RGB.setdefault('k_robe', sdf.MAT_RGB['clay'])
    orig = rigs.humanoid

    def humanoid(gear, pose, zones=True):
        return rematerial(orig(gear, pose, True), body)
    guides.humanoid = humanoid


def main():
    U = json.load(open(UPATH))
    U['units'] = [u for u in U['units'] if u['id'] not in BODIES]
    gpath = os.path.join(guides.OUT, 'guides.json')
    meta = json.load(open(gpath))
    for bid, b in BODIES.items():
        u = dict(id=bid, role='commander', layout='commander', body='commander', nation=b['nation'], key=b['key'],
                 gear=b['gear'], act=b['act'], track='commander', calibration=True)
        U['units'].append(u)
        install(b)
        for v in ('back', 'front'):
            img, m = guides.render_sheet(u, v, zones=True)
            guides.save(img, os.path.join(guides.OUT, f'{bid}.{v}.png'))
            meta[f'{bid}.{v}'] = m
            print(bid, v, 'k', round(m['k'], 5))
    json.dump(meta, open(gpath, 'w'), indent=1)
    json.dump(U, open(UPATH, 'w'), indent=1)


if __name__ == '__main__':
    main()
