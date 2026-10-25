# Stage B, key "cmdA": commander body maquettes with their kit zones painted (calibration route, review change 5),
# for the kinds the calibration did not make: the Pyre Priest (hooded robe, brazier staff, bless), the Cinder Scout
# (hood, scarf, light jerkin, long knife) and the two Independent Captain outfits (levy: iron cap and padded jerkin;
# hunter: fur-trimmed hood, short cloak and quiver), both views. The Ash Chieftain (cmdChief) and the robed caster
# (cmdCaster: Ember Adept and Cinder Magus) reuse the calibration's maquettes, which this sandbox copied.
# Same rig and re-materialling as cmd_guides.py, plus a jerkin zone and a separate collar zone.
# Writes ../refs/guides/<id>.<view>.png, their guides.json entries, and adds the kinds and the independents' nation
# (grey cloth #8C8A80 from the mockup's palette) to ../units.json (this sandbox's copy only).
# Usage: python3 cmda_guides.py
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sdf  # noqa: E402
import guides  # noqa: E402
import rigs  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..'))
UPATH = os.path.join(ROOT, 'units.json')

INDEPENDENT = dict(name='Independents', house='a captain of a free village militia: a weathered human face, plain '
                   'leather and iron, no insignia', cloth=dict(name='undyed grey', hex='#8C8A80', light='#AAA79C',
                                                              dark='#5C5A54'), key='blue')

BODIES = {
    'cmdPriest': dict(nation='cinderHorde', key='green', act='bless',
                      gear=dict(weapon='staff', helm='hood', robe=True, glow=True, cape=True),
                      mats=dict(hood=(0.38, 0.35, 0.33), pauldron=(0.52, 0.50, 0.49), mantle=(0.52, 0.50, 0.49),
                                robe=(0.26, 0.24, 0.24), staffhead=(0.86, 0.46, 0.20))),
    'cmdScout': dict(nation='cinderHorde', key='green', act='rally',
                     gear=dict(weapon='knife', helm='hood', cape=True),
                     mats=dict(hood=(0.30, 0.29, 0.28), pauldron=(0.42, 0.34, 0.27), mantle=(0.30, 0.29, 0.28),
                               collar=(0.66, 0.64, 0.60))),
    'cmdLevy': dict(nation='independent', key='blue', act='rally',
                    gear=dict(weapon='sword', helm='kettle', tabard=True),
                    mats=dict(helm=(0.50, 0.50, 0.52), pauldron=(0.50, 0.42, 0.32), jerkin=(0.58, 0.50, 0.38)),
                    collar=False),
    'cmdHunter': dict(nation='independent', key='blue', act='rally',
                      gear=dict(weapon='sword', helm='hood', cape=True, quiver=True),
                      mats=dict(hood=(0.42, 0.31, 0.22), pauldron=(0.40, 0.31, 0.23), mantle=(0.40, 0.31, 0.23),
                                collar=(0.74, 0.70, 0.62))),
}


def rematerial(x, body):
    """Re-material the humanoid's primitives by shape (cmd_guides.py's rules), with a jerkin zone for the torso, its
    skirt and the pelvis when the kind wears no hood, and a separate collar (fur ruff, scarf) over the shoulders."""
    m = body['mats']
    hooded = body['gear'].get('helm') in ('hood', 'cowl')
    paul = []
    items = []
    for kind, ps, args, mat in x.items:
        new = mat
        if kind == 'ell' and mat == 'zone':
            radii = np.asarray(args[0], float)
            if abs(radii[2] - 0.045) < 1e-6 and abs(radii[1] - 0.06) < 1e-6:  # a pauldron
                new = 'k_pauldron'; paul.append((np.asarray(ps[0], float), args[1]))
            elif hooded and radii.max() < 0.2:  # the hood or cowl
                new = 'k_hood'
            else:  # the tabard-flagged torso and pelvis: the jerkin
                new = 'k_jerkin'
        elif kind == 'box' and mat == 'zone':  # the cape hanging down the back
            new = 'k_mantle'
        elif kind == 'cap' and mat == 'zone2':  # the robe skirt
            new = 'k_robe'
        elif kind == 'cap' and mat == 'zone':  # the jerkin's skirt
            new = 'k_jerkin'
        elif kind == 'cap' and mat == 'dark' and len(ps) == 2 and args[0] == 0.012 and args[1] == 0.003:
            new = 'k_crown'
        elif kind == 'disc' and mat == 'dark':
            new = 'k_crown'
        elif kind == 'ell' and mat == 'dark' and np.asarray(args[0]).max() > 0.09:
            new = 'k_helm'
        elif kind == 'ell' and mat == 'glow':
            new = 'k_staffhead'
        items.append((kind, ps, args, new))
    x.items = items
    if len(paul) == 2 and body.get('collar', True):  # a collar (fur ruff, scarf, mantle) over both shoulders
        (a, rot), (b, _) = paul
        c = (a + b) / 2 + rot @ np.array([0, -0.01, 0.035])
        x.items.append(('ell', [c], ((0.21, 0.11, 0.06), rot), 'k_collar' if 'collar' in m else 'k_mantle'))
    return x


def install(body):
    base = dict(crown=sdf.MAT_RGB['dark'], helm=sdf.MAT_RGB['dark'], hood=sdf.MAT_RGB['clay'], robe=sdf.MAT_RGB['clay'],
                jerkin=sdf.MAT_RGB['clay'], mantle=sdf.MAT_RGB['clay'], pauldron=sdf.MAT_RGB['clay'],
                collar=sdf.MAT_RGB['clay'], staffhead=sdf.MAT_RGB['dark'])
    base.update({k: v for k, v in body['mats'].items() if v is not None})
    sdf.MAT_RGB.update({f'k_{k}': v for k, v in base.items()})
    orig = rigs.humanoid

    def humanoid(gear, pose, zones=True):
        return rematerial(orig(gear, pose, True), body)
    guides.humanoid = humanoid
    return orig


def main():
    U = json.load(open(UPATH))
    U['nations']['independent'] = INDEPENDENT
    guides.UNITS['nations']['independent'] = INDEPENDENT
    U['units'] = [u for u in U['units'] if u['id'] not in BODIES]
    gpath = os.path.join(guides.OUT, 'guides.json')
    meta = json.load(open(gpath))
    for bid, b in BODIES.items():
        u = dict(id=bid, role='commander', layout='commander', body='commander', nation=b['nation'], key=b['key'],
                 gear=b['gear'], act=b['act'], track='commander', calibration=False, kindOf='cmdA')
        U['units'].append(u)
        orig = install(b)
        for v in ('back', 'front'):
            img, m = guides.render_sheet(u, v, zones=True)
            guides.save(img, os.path.join(guides.OUT, f'{bid}.{v}.png'))
            meta[f'{bid}.{v}'] = m
            print(bid, v, 'k', round(m['k'], 5), flush=True)
        guides.humanoid = orig
    json.dump(meta, open(gpath, 'w'), indent=1)
    json.dump(U, open(UPATH, 'w'), indent=1)


if __name__ == '__main__':
    main()
