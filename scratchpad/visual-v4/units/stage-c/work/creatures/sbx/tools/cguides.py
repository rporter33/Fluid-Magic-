# Stage C creatures: the units and camera guides this stage adds to the sandbox (stage-c/work/creatures/sbx).
#   - units.json gains the Wolf (beast layout, blue key: grey fur, pilot review change 11), the Oakheart (melee layout,
#     a size-2 walking oak with an oak maul, magenta key, Thornwood mantle as its side zone), the Giant faces 01 and 02
#     (a size-4 biped monster with a club, magenta key, independents), the Salamander faces 02 to 04 and the Treant
#     faces 02 to 04 (each on its face 01 rig), a 'common' nation (neutral, no side cloth) and the heights of the new
#     bodies (beast and large: tier S/H standing px).
#   - guides: the beast layout on the clay wolf of the wolf-rider rig (no rider, no tack), the Oakheart on the
#     humanoid rig (bulk 1.35, a maul), the Giant's idle on the humanoid rig scaled 3.4x (size 4, design 3.2), and copies
#     of the face 01 idle guides for the other Salamander and Treant faces (one rig per body).
# Usage: python3 cguides.py   (idempotent; renders only guides that are missing)
import json, os, shutil, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SBX = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
UP = os.path.join(SBX, 'units.json')
REPO_P = '/home/user/Fluid-Magic-/art-source/portraits'
PB = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/portraits'


def add_units():
    U = json.load(open(UP))
    U['nations'].setdefault('common', {'name': 'common', 'house': '', 'cloth': {'name': 'none', 'hex': '#8C8A80', 'light': '#A09E94', 'dark': '#5C5A52'}, 'key': 'blue'})
    U['heightPx'].update({'beast': [None, None], 'large': [84, 168]})
    have = {u['id'] for u in U['units']}
    new = []
    new.append(dict(id='wolf', unit='wolf', nation='common', role='troop', body='beast', layout='beast', gear={'mount': 'wolf'}, key='blue',
                    formation='pack', portrait=f'{PB}/common/wolf/01b.webp', stage='C',
                    kit='A Wolf of the deep wood: an old, heavy grey wolf, wild, with no harness, collar, saddle or cloth.'))
    new.append(dict(id='oakheart', unit='oakheart', nation='thornwood', role='troop', body='large', layout='melee', key='magenta', formation='heavy',
                    gear={'weapon': 'maul', 'shield': None, 'helm': 'spiked', 'cape': True, 'bulk': 1.35, 'pauldrons': True},
                    portrait=f'{PB}/thornwood/oakheart/01b.webp', stage='C',
                    kit='An Oakheart: a walking oak under thornplate, a sacred warrior of the Thornwood (size 2, an oak maul).'))
    for f, por in (('01', '01b-r2'), ('02', '02b-r2')):
        new.append(dict(id=f'giant-{f}', unit='giant', face=f, nation='independent', role='monster', body='giant', layout='monster', key='magenta',
                        portrait=f'{PB}/independent/giant/{por}.webp', actions=['idle'], stage='C',
                        kit='A Giant, an independent mountain giant (size 4, 3.4 men tall), with a club.'))
    for f in ('02', '03', '04'):
        new.append(dict(id=f'salamander-{f}', unit='salamander', face=f, nation='cinderHorde', role='monster', body='salamander', layout='monster',
                        key='green', portrait=f'{REPO_P}/cinderHorde/salamander/{f}.webp', actions=['idle'], guideOf='salamander-01', stage='C'))
        new.append(dict(id=f'treant-{f}', unit='treant', face=f, nation='thornwood', role='monster', body='treant', layout='monster',
                        key='magenta', portrait=f'{REPO_P}/thornwood/treant/{f}.webp', actions=['idle'], guideOf='treant-01', stage='C'))
    for u in new:
        if u['id'] in have:
            U['units'] = [x for x in U['units'] if x['id'] != u['id']]
        U['units'].append(u)
    json.dump(U, open(UP, 'w'), indent=1)
    return U


def scale_xf(x, s):
    """Scales an Xf's primitives (positions and radii) by s about the origin."""
    from rigs import Xf
    y = Xf()
    for kind, ps, args, mat in x.items:
        ps2 = [np.asarray(p, float) * s for p in ps]
        if kind == 'cap':
            a2 = (args[0] * s, None if args[1] is None else args[1] * s)
        elif kind == 'ell':
            a2 = (tuple(np.asarray(args[0], float) * s), args[1])
        elif kind == 'box':
            a2 = (tuple(np.asarray(args[0], float) * s), args[1], args[2] * s)
        elif kind == 'disc':
            a2 = (args[0], args[1] * s, args[2] * s)
        else:
            a2 = (args[0] * s,)
        y.items.append((kind, ps2, a2, mat))
    if hasattr(x, 'feet'):
        y.feet = [np.asarray(f) * s for f in x.feet]
    return y


def patch_rigs():
    """A maul and a club for the humanoid rig: a shaft and a heavy head (the rig had no blunt weapons)."""
    import rigs
    orig = rigs.humanoid

    def humanoid(gear, pose, zones=True):
        g = dict(gear)
        w = g.get('weapon')
        if w in ('maul', 'club'):
            g['weapon'] = None
        x = orig(g, pose, zones)
        if w in ('maul', 'club'):
            p = dict(rigs.STAND); p.update(pose)
            H = rigs.HUM
            bulk = g.get('bulk', 1.0)
            pel = np.array([0, 0, H['hip'] - p['crouch']])
            Mt = rigs.rz(p['twist']) @ rigs.ry(p['roll']) @ rigs.rx(p['lean'])
            chest = pel + Mt @ np.array([0, 0, H['spine']])
            shR = chest + Mt @ np.array([H['sh'] * bulk, 0, -0.02])
            el = shR + H['ua'] * (Mt @ rigs.sph(*p['rUA']))
            ha = el + H['fa'] * (Mt @ rigs.sph(*p['rFA']))
            d = Mt @ rigs.sph(*p['w'])
            if w == 'maul':
                a, b = ha - d * 0.12, ha + d * 0.5
                x.cap(a, b, 0.016, 0.016, mat='dark')
                x.ell(b, (0.07, 0.07, 0.1), rigs.rx(0) if False else None, mat='dark')
            else:
                a, b = ha - d * 0.06, ha + d * 0.46
                x.cap(a, b, 0.022, 0.05, mat='dark')
        return x
    rigs.humanoid = humanoid
    import guides
    guides.humanoid = humanoid
    return humanoid


def beast_cell(cell, facing):
    from rigs import quadruped
    from poses import Q
    q = {'stand': 'stand', 'idle2': 'stand', 'lopeA': 'gallopA', 'lopeB': 'gallopB', 'leapA': 'charge', 'leapB': 'gallopB',
         'bite': 'charge', 'howl': 'stand', 'recoil': 'recoil', 'fall': 'fall'}
    if cell in ('deadA', 'deadB'):
        return [(quadruped('wolf', dict(Q['dead']), zones=False), dict(facing=facing, roll_all=85 if cell == 'deadA' else -85))]
    p = dict(Q[q[cell]])
    if cell == 'idle2':
        p.update(neck=(30, 35), head=(-45, 35), fl=((-70, 0), (-100, 0)))
    if cell == 'leapA':
        p.update(lift=0.12, pitch=12, jaw=15, head=(-5, 0))
    if cell == 'leapB':
        p.update(pitch=-10, lift=0.05)
    if cell == 'bite':
        p.update(jaw=35, head=(-5, 0), neck=(10, 0))
    if cell == 'howl':
        p.update(neck=(70, 0), head=(45, 0), br=((-100, 0), (-80, 0)), bl=((-100, 0), (-80, 0)))
    return [(quadruped('wolf', p, zones=False), dict(facing=facing))]


def giant_rig(pose):
    from rigs import humanoid
    gear = dict(weapon='club', helm=None, cape=False, bulk=1.45, pauldrons=False)
    p = {'rUA': (-75, 22), 'rFA': (-55, 10), 'w': (-30, 15), 'lUA': (-78, -22), 'lFA': (-60, -15), 'lean': 6, 'head': (8, 0)}
    p.update(pose)
    return scale_xf(humanoid(gear, p, zones=True), 3.4)


def main():
    U = add_units()
    patch_rigs()
    import guides
    guides.UNITS = U
    orig_cell = guides.cell_scene

    def cell_scene(u, cell, view, zones):
        if u['layout'] == 'beast':
            from sdf import Scene
            from rigs import place
            sc = Scene()
            for x, kw in beast_cell(cell, guides.VIEWS[view]):
                place(x, sc, **kw)
            return sc
        return orig_cell(u, cell, view, zones)
    guides.cell_scene = cell_scene
    guides.MON['giant'] = dict(rig=giant_rig, actions={'idle': dict()})
    G = os.path.join(SBX, 'refs', 'guides')
    gj = os.path.join(G, 'guides.json')
    meta = json.load(open(gj))
    for u in U['units']:
        if u['id'] in ('wolf', 'oakheart'):
            for v in ('back', 'front'):
                p = os.path.join(G, f"{u['id']}.{v}.png")
                if not os.path.exists(p):
                    img, m = guides.render_sheet(u, v, zones=u['nation'] != 'common')
                    guides.save(img, p); meta[f"{u['id']}.{v}"] = m
                    json.dump(meta, open(gj, 'w'), indent=1); print('rendered', p, flush=True)
        if u['id'] == 'giant-01':
            for v in ('back', 'front'):
                p = os.path.join(G, f"giant-01.idle.{v}.png")
                if not os.path.exists(p):
                    img, m = guides.render_monster(u, 'idle', v)
                    guides.save(img, p); meta[f"giant-01.idle.{v}"] = m
                    json.dump(meta, open(gj, 'w'), indent=1); print('rendered', p, flush=True)
    # one rig per body: the other faces use face 01's guide (giant 02 uses giant 01's)
    for src, faces in (('salamander-01', ('02', '03', '04')), ('treant-01', ('02', '03', '04')), ('giant-01', ('02',))):
        for f in faces:
            dst = src.split('-')[0] + '-' + f
            for v in ('back', 'front'):
                a, b = os.path.join(G, f'{src}.idle.{v}.png'), os.path.join(G, f'{dst}.idle.{v}.png')
                if os.path.exists(a):
                    shutil.copyfile(a, b)
                    meta[f'{dst}.idle.{v}'] = dict(meta[f'{src}.idle.{v}'], id=dst, copyOf=src)
    json.dump(meta, open(gj, 'w'), indent=1)


if __name__ == '__main__':
    main()
