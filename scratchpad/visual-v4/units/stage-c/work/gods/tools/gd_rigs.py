# Stage C gods: clay rigs for the sixteen god bodies at their size-ladder height, posed as their approved portraits
# stand (idle, variant 0 of every slot), with the nation's tint zone in the material 'zone'. Built from the stage A
# rigs (units/tools/rigs.py: humanoid, wyrm, the salamander's body plan) plus small custom bodies where no rig exists
# (bird, deer, bison, tree, slab). Units: a man is 1.0 tall (feet to crown); every body is scaled so its standing
# height (world z, weapons above the head left out) is its ladder multiple (battle-overhead.md 3.2):
# size 2 x1.5, 3 x2.3, 4 x3.4, 5 x4.6, 6 x6.0. Local frame: x right, y forward (the body faces +y), z up.
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(UNITS, 'tools'))
import sdf  # noqa: E402
from rigs import Xf, humanoid, wyrm, chain, curve, sph, rx, ry, rz, HUM  # noqa: E402

sdf.MAT_RGB.update({'gold': (0.72, 0.60, 0.33), 'stone': (0.58, 0.57, 0.55), 'bark': (0.42, 0.33, 0.25),
                    'hide': (0.50, 0.40, 0.31), 'coal': (0.25, 0.23, 0.22)})

LADDER = {2: 1.5, 3: 2.3, 4: 3.4, 5: 4.6, 6: 6.0}
SIZE = {'oracle': 2, 'wildSpirit': 2, 'ascendedHero': 2, 'emberHierophant': 2, 'ashPhoenix': 3,
        'titan': 4, 'pyreLord': 4, 'hornedHunter': 4, 'motherOfBeasts': 4, 'ashColossus': 5,
        'greatWyrm': 6, 'livingMonolith': 6, 'primordial': 6, 'elderWyrm': 6, 'worldTree': 6, 'cinderIdol': 6}


def scaled(x, s):
    """A copy of an Xf with every position and radius multiplied by s."""
    y = Xf()
    for kind, ps, args, mat in x.items:
        ps2 = [np.asarray(p, float) * s for p in ps]
        if kind == 'cap':
            a2 = (args[0] * s, None if args[1] is None else args[1] * s)
        elif kind == 'ell':
            a2 = (tuple(float(v) * s for v in args[0]), args[1])
        elif kind == 'box':
            a2 = (tuple(float(v) * s for v in args[0]), args[1], args[2] * s)
        elif kind == 'disc':
            a2 = (args[0], args[1] * s, args[2] * s)
        else:
            a2 = (args[0] * s,)
        y.items.append((kind, ps2, a2, mat))
    return y


def zext(x, weapons=()):
    """World height (z extent) of an Xf, exact per primitive (a rotated ellipsoid's or box's own vertical half extent),
    leaving out the items whose index is in `weapons`."""
    lo, hi = 1e9, -1e9
    for i, (kind, ps, args, mat) in enumerate(x.items):
        if i in weapons:
            continue
        if kind == 'cap':
            hz = [args[0], args[1] if args[1] is not None else args[0]]
        elif kind == 'ell':
            R = np.eye(3) if args[1] is None else np.asarray(args[1], float)
            hz = [float(np.sqrt(sum((R[2, j] * args[0][j]) ** 2 for j in range(3))))]
        elif kind == 'box':
            R = np.eye(3) if args[1] is None else np.asarray(args[1], float)
            hz = [float(sum(abs(R[2, j]) * args[0][j] for j in range(3)) + args[2])]
        elif kind == 'disc':
            n = np.asarray(args[0], float); n = n / np.linalg.norm(n)
            hz = [float(args[1] * np.sqrt(max(0.0, 1 - n[2] ** 2)) + args[2])]
        else:
            hz = [args[0]]
        for j, p in enumerate(ps):
            r = hz[min(j, len(hz) - 1)]
            lo = min(lo, p[2] - r); hi = max(hi, p[2] + r)
    return hi - lo


# ------------------------------------------------------------------ humanoid gods
HEAD_Z = HUM['hip'] + HUM['spine'] + HUM['neck'] + HUM['headR'] * 1.05  # head centre of an upright humanoid
CHEST_Z = HUM['hip'] + HUM['spine']


def _base(gear, pose):
    """The stage A humanoid with no zones (every surface clay); the tint zone is added as overlays."""
    return humanoid(gear, pose, zones=False)


def _mantle(x, bulk, length=0.62, mat='zone', front=False, shoulders=True):
    """A mantle: over both shoulders, and a cape down the back to `length` below the shoulders (to the ground ~0.7)."""
    sh = HUM['sh'] * bulk
    z0 = CHEST_Z - 0.02
    if shoulders:
        for s in (1, -1):
            x.ell((s * sh, 0, z0 + 0.01), (0.075 * bulk, 0.075 * bulk, 0.055), mat=mat)
        x.ell((0, -0.01, z0 + 0.01), (sh * 0.95, 0.09 * bulk, 0.05), mat=mat)
    x.box((0, -0.105 * bulk, z0 - length / 2), (sh * 1.02, 0.022, length / 2), rx(-4), 0.02, mat=mat)
    if front:  # the mantle's two front panels, open over the chest
        for s in (1, -1):
            x.box((s * sh * 0.72, 0.095 * bulk, z0 - length * 0.42), (sh * 0.28, 0.018, length * 0.42), rx(3), 0.015, mat=mat)


def _staff(x, at, top, r=0.013, mat='bark'):
    x.cap((at[0], at[1], 0.0), (at[0], at[1], top), r, r, mat=mat)


def titan():
    """Great helm, plain gold plate, the tabard (tint zone), a great sword held point-down before it, both hands on the
    pommel; no cape."""
    bulk = 1.35
    pose = dict(rUA=(-65, 30), rFA=(-2, -59), lUA=(-65, -30), lFA=(-2, 59))
    x = _base(dict(helm=None, weapon=None, bulk=bulk, pauldrons=False), pose)
    x.box((0, 0.0, HEAD_Z + 0.005), (0.092, 0.098, 0.112), None, 0.04, mat='gold')  # the closed flat-topped great helm
    for s in (1, -1):
        x.ell((s * HUM['sh'] * bulk, 0, CHEST_Z), (0.085 * bulk, 0.08, 0.06), mat='gold')  # pauldrons
    for fy in (1, -1):  # the tabard: a front and a back panel from the chest to the knees
        x.box((0, fy * 0.112 * bulk, 0.46), (0.085 * bulk, 0.014, 0.25), rx(-fy * 3), 0.012, mat='zone')
    w = len(x.items)
    x.cap((0, 0.2, 0.6), (0, 0.2, 0.02), 0.022, 0.012, mat='dark')  # the blade, point-down
    x.cap((-0.1, 0.2, 0.5), (0.1, 0.2, 0.5), 0.014, 0.014, mat='gold')  # the cross-guard
    x.ell((0, 0.2, 0.62), (0.025, 0.025, 0.025), mat='gold')  # the pommel
    return x, set(range(w, len(x.items))), 'humanoid, bulk 1.35, great helm, gold plate, tabard (zone), great sword point-down'


def ascendedHero():
    """Gold circlet, long cape (tint zone) over the shoulders and to the calves, plain breastplate, a straight sword
    held upright before the chest."""
    bulk = 1.15
    pose = dict(rUA=(-45, 20), rFA=(45, -45), w=(80, -10), lUA=(-80, -15), lFA=(-60, 5))
    x = _base(dict(helm='circlet', weapon='sword', bulk=bulk, pauldrons=False), pose)
    _mantle(x, bulk, length=0.58)
    return x, set(), 'humanoid, bulk 1.15, circlet, long cape (zone), sword upright'


def oracle():
    """A deep cowl and a robe to a ragged floating hem (both the tint zone), a gold-caged orb staff in the right hand."""
    bulk = 1.1
    pose = dict(rUA=(-75, 30), rFA=(-5, 15), lUA=(-70, -20), lFA=(-20, -40))
    x = _base(dict(helm='cowl', robe=True, weapon=None, bulk=bulk), pose)
    # the robe and cowl in the zone: an outer robe cone, the torso and the cowl
    x.cap((0, 0, 0.50), (0, 0.01, 0.06), 0.12 * bulk, 0.19, mat='zone')
    x.ell((0, 0, 0.6), (0.17 * bulk, 0.12 * bulk, 0.2), mat='zone')
    x.ell((0, -0.02, HEAD_Z + 0.01), (0.125, 0.13, 0.125), mat='zone')
    x.cap((0, -0.03, HEAD_Z + 0.06), (0, -0.05, HEAD_Z + 0.21), 0.07, 0.012, mat='zone')
    for s in (1, -1):
        x.ell((s * HUM['sh'] * bulk, 0, CHEST_Z - 0.01), (0.075 * bulk, 0.07, 0.06), mat='zone')
    w = len(x.items)
    _staff(x, (0.26, 0.12), 1.0, 0.012, mat='bark')
    x.ell((0.26, 0.12, 1.04), (0.045, 0.045, 0.045), mat='gold')  # the gold-caged orb
    return x, set(range(w, len(x.items))), 'humanoid, robe and cowl (zone), orb staff, floating 0.08 above the ground'


def pyreLord():
    """A gold flame crown, the ember mantle (tint zone) from the shoulders to the ground, dark scale armour, a glaive
    in the right hand, its butt on the ground, the left palm open at the side."""
    bulk = 1.2
    pose = dict(rUA=(-70, 35), rFA=(-5, 10), lUA=(-60, -40), lFA=(-20, -55))
    x = _base(dict(helm=None, weapon=None, bulk=bulk), pose)
    for i in range(7):  # the flame crown
        a = np.radians(-90 + i * 30)
        b = np.array([0.085 * np.sin(a), 0.085 * np.cos(a) * 0.9, HEAD_Z + 0.06])
        x.cap(b, b + np.array([0, 0, 0.06 + 0.02 * (i % 2)]), 0.014, 0.003, mat='gold')
    x.disc((0, 0, HEAD_Z + 0.06), (0, 0, 1.0), 0.095, 0.014, mat='gold')
    _mantle(x, bulk, length=0.7, front=True)
    w = len(x.items)
    _staff(x, (0.27, 0.12), 1.08, 0.014, mat='dark')
    x.tri((0.27, 0.12, 1.06), (0.27, 0.12, 1.3), (0.27 + 0.08, 0.12, 1.13), 0.012, mat='dark')  # the glaive's blade
    x.ell((0.27, 0.12, 1.06), (0.022, 0.022, 0.022), mat='gold')
    return x, set(range(w, len(x.items))), 'humanoid, bulk 1.2, flame crown, ember mantle (zone), glaive butt-down'


def emberHierophant():
    """A charcoal hood over a gold mask, the ember mantle (tint zone) over the shoulders and in two front panels to the
    knees, a dark robe, an orb staff in a gold claw in the right hand, the left palm raised."""
    bulk = 1.1
    pose = dict(rUA=(-75, 30), rFA=(-5, 15), lUA=(-55, -35), lFA=(35, -10))
    x = _base(dict(helm='hood', robe=True, weapon=None, bulk=bulk), pose)
    x.ell((0, -0.02, HEAD_Z + 0.005), (0.11, 0.115, 0.115), mat='coal')  # the charcoal hood
    x.cap((0, -0.03, HEAD_Z + 0.05), (0, -0.06, HEAD_Z + 0.15), 0.06, 0.01, mat='coal')
    x.ell((0, 0.075, HEAD_Z - 0.005), (0.06, 0.03, 0.07), mat='gold')  # the gold mask
    _mantle(x, bulk, length=0.5, front=True)
    w = len(x.items)
    _staff(x, (0.26, 0.12), 0.98, 0.012, mat='bark')
    x.ell((0.26, 0.12, 1.02), (0.042, 0.042, 0.042), mat='gold')
    return x, set(range(w, len(x.items))), 'humanoid, charcoal hood, gold mask, ember mantle (zone), orb staff'


def hornedHunter():
    """Tall branching antlers, the leaf mantle (tint zone) over the shoulders and down the back, a bare chest and a
    leather kilt, a gold leaf-bladed spear in the right hand, its butt on the ground."""
    bulk = 1.15
    pose = dict(rUA=(-70, 35), rFA=(-5, 10), lUA=(-80, -18), lFA=(-70, -10))
    x = _base(dict(helm=None, weapon=None, bulk=bulk, bare=True), pose)
    x.ell((0, 0, 0.62), (0.165 * bulk, 0.112 * bulk, 0.17), mat='skin')  # the bare chest
    x.cap((0, 0, 0.45), (0, 0, 0.28), 0.14 * bulk, 0.15 * bulk, mat='hide')  # the leather kilt
    for s in (1, -1):  # branching antlers
        b = np.array([s * 0.05, -0.01, HEAD_Z + 0.07])
        t = b + np.array([s * 0.13, -0.04, 0.2])
        x.cap(b, t, 0.014, 0.007, mat='dark')
        for f, (dz, dx) in enumerate(((0.06, 0.06), (0.12, 0.02), (0.16, 0.09))):
            p = b + (t - b) * (0.35 + 0.22 * f)
            x.cap(p, p + np.array([s * dx, 0.02, dz * 0.6]), 0.009, 0.004, mat='dark')
    _mantle(x, bulk, length=0.48)
    w = len(x.items)
    _staff(x, (0.27, 0.12), 1.12, 0.012, mat='bark')
    x.ell((0.27, 0.12, 1.2), (0.022, 0.012, 0.08), mat='gold')  # the leaf blade
    return x, set(range(w, len(x.items))), 'humanoid, antlers, leaf mantle (zone), bare chest, spear butt-down'


def motherOfBeasts():
    """An antler crown, a bear-pelt cloak with the bear's head on her shoulder, a long dress (tint zone), a gold-banded
    maul held head-down at her right side."""
    bulk = 1.25
    pose = dict(rUA=(-75, 25), rFA=(-60, 10), lUA=(-80, -18), lFA=(-55, 10))
    x = _base(dict(helm=None, robe=True, weapon=None, bulk=bulk), pose)
    x.ell((0, 0, 0.6), (0.168 * bulk, 0.113 * bulk, 0.19), mat='zone')  # the dress's bodice
    x.cap((0, 0, 0.50), (0, 0.01, 0.04), 0.125 * bulk, 0.18, mat='zone')  # its skirt to the ankles
    for s in (1, -1):  # the antler crown
        b = np.array([s * 0.05, 0, HEAD_Z + 0.07])
        t = b + np.array([s * 0.1, -0.03, 0.13])
        x.cap(b, t, 0.011, 0.006, mat='dark')
        x.cap((b + t) / 2, (b + t) / 2 + np.array([s * 0.05, 0.02, 0.05]), 0.008, 0.004, mat='dark')
    _mantle(x, bulk, length=0.6, mat='hide')  # the bear pelt over the shoulders and down the back
    x.ell((-HUM['sh'] * bulk * 1.05, 0.0, CHEST_Z + 0.07), (0.07, 0.085, 0.06), mat='hide')  # the bear's head
    x.cap((-HUM['sh'] * bulk * 1.05, 0.06, CHEST_Z + 0.06), (-HUM['sh'] * bulk * 1.05, 0.13, CHEST_Z + 0.04), 0.035, 0.025, mat='hide')
    w = len(x.items)
    x.cap((0.27, 0.13, 0.5), (0.29, 0.15, 0.14), 0.012, 0.012, mat='bark')  # the haft
    x.box((0.29, 0.15, 0.08), (0.06, 0.05, 0.065), None, 0.01, mat='dark')  # the maul head on the ground
    x.disc((0.29, 0.15, 0.08), (1.0, 0, 0), 0.07, 0.01, mat='gold')
    return x, set(range(w, len(x.items))), 'humanoid, bulk 1.25, antler crown, bear pelt, dress (zone), maul head-down'


COLOSSUS_V1 = False  # True rebuilds the first (stocky) maquette the first paintings were checked against


def ashColossus():
    """A charred giant: a brazier bowl for a head, bare shoulders and bare fists, the kilt (tint zone) on a gold chain.
    Stage C fix 8 (art director's critique): built as its portrait (pick A), lean and long-legged: thighs and shins
    0.31 each (a man's 0.22), so the legs are about half the standing height; long arms (upper 0.2, fore 0.19); slim
    limbs (limb 0.05, bulk 1.15 against the first maquette's 0.06 and 1.4); the rock fists closed at the ends of the
    hanging arms (the first maquette left them floating beside the hips); the brazier a little smaller than the head's
    width at the shoulders."""
    if COLOSSUS_V1:
        bulk = 1.4
        pose = dict(rUA=(-78, 25), rFA=(-70, 15), lUA=(-78, -25), lFA=(-70, -15))
        x = _base(dict(helm=None, weapon=None, bulk=bulk, bare=True, pauldrons=False), pose)
        x.ell((0, 0, HEAD_Z + 0.02), (0.13, 0.13, 0.085), mat='coal')  # the brazier bowl
        x.disc((0, 0, HEAD_Z + 0.09), (0, 0, 1.0), 0.135, 0.012, mat='gold')
        x.ell((0, 0, HEAD_Z + 0.1), (0.11, 0.11, 0.025), mat='dark')  # the coals
        x.cap((0, 0, 0.43), (0, 0.01, 0.3), 0.1 * bulk, 0.115 * bulk, mat='zone')  # the kilt
        x.disc((0, 0, 0.45), (0, 0, 1.0), 0.105 * bulk, 0.012, mat='gold')  # its gold chain belt
        for s in (1, -1):
            x.ell((s * (HUM['sh'] * bulk + 0.06), 0.03, 0.25), (0.06, 0.06, 0.06), mat='coal')  # the rock fists
        return x, set(), 'humanoid, bulk 1.55, brazier head, bare, kilt (zone)'
    import rigs as _rigs
    from rigs import STAND
    bulk = 1.15
    leg = dict(thigh=0.31, shin=0.31, ua=0.2, fa=0.19, limb=0.05)
    hip = leg['thigh'] + leg['shin'] - 0.01  # the stage A humanoid's feet sit 0.01 below its pelvis drop
    pose = dict(rUA=(-80, 60), rFA=(-86, 30), lUA=(-80, -60), lFA=(-86, -30),
                rTh=(-86, 85), rSh=(-89, 60), lTh=(-86, -85), lSh=(-89, -60))
    saved = dict(_rigs.HUM)
    _rigs.HUM.update(leg, hip=hip)
    try:
        x = _base(dict(helm=None, weapon=None, bulk=bulk, bare=True, pauldrons=False), pose)
        H = dict(_rigs.HUM)
    finally:
        _rigs.HUM.clear(); _rigs.HUM.update(saved)
    p = dict(STAND); p.update(pose)
    chest = np.array([0, 0, H['hip'] + H['spine']])
    head_z = H['hip'] + H['spine'] + H['neck'] + H['headR'] * 1.05
    x.ell((0, 0, head_z + 0.015), (0.115, 0.115, 0.075), mat='coal')  # the brazier bowl
    x.disc((0, 0, head_z + 0.075), (0, 0, 1.0), 0.12, 0.011, mat='gold')
    x.ell((0, 0, head_z + 0.085), (0.098, 0.098, 0.022), mat='dark')  # the coals
    x.cap((0, 0, hip - 0.01), (0, 0.012, hip - 0.27), 0.088 * bulk, 0.1 * bulk, mat='zone')  # the kilt, waist to knees
    x.disc((0, 0, hip + 0.01), (0, 0, 1.0), 0.092 * bulk, 0.011, mat='gold')  # its gold chain belt
    for s, ua, fa in ((1, p['rUA'], p['rFA']), (-1, p['lUA'], p['lFA'])):
        sh0 = chest + np.array([s * H['sh'] * bulk, 0, -0.02])
        hand = sh0 + H['ua'] * sph(*ua) + H['fa'] * sph(*fa)
        x.ell(hand + np.array([0, 0, -0.02]), (0.048, 0.05, 0.055), mat='coal')  # the rock fist, closed at the arm's end
    return x, set(), 'humanoid, bulk 1.15, long legs (thigh and shin 0.31), long slim arms, brazier head, bare, kilt (zone) [stage C fix 8]'


# ------------------------------------------------------------------ beasts, idols and the tree
def greatWyrm():
    """Standing four-square, the long neck raised in an S so the head is the highest point, the wings half raised and
    folded at the elbows (membranes: the tint zone), the tail curling forward round its side; swept-back horns."""
    x = wyrm(dict(wing=(55, -25), neck=(88, 0, 0), neckLift=-28, head=(-12, 0), tail=210))
    return x, set(), 'wyrm rig, neck raised in an S, wings half raised (membranes zone), tail curled forward'


def elderWyrm():
    """A long, low, wingless wyrm built like a giant salamander: belly near the ground, short splayed legs, the head
    held level a little raised, a crown of spines, the moss along its back (tint zone), a club tail."""
    x = Xf()
    S = 6.0
    c = np.array([0, 0, 0.13 * S])
    x.ell(c, (0.2 * S, 0.5 * S, 0.14 * S), mat='hide')
    x.ell(c + np.array([0, 0.0, 0.11 * S]), (0.15 * S, 0.44 * S, 0.05 * S), mat='zone')  # the moss mantle along the spine
    for fy, sx in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        top = np.array([sx * 0.15 * S, fy * 0.3 * S, c[2] - 0.03 * S])
        knee = top + 0.14 * S * sph(-12, sx * 80)
        foot = knee + 0.14 * S * sph(-85, sx * 15)
        x.cap(top, knee, 0.075 * S, 0.06 * S, mat='hide'); x.cap(knee, foot, 0.06 * S, 0.05 * S, mat='hide')
        x.ell(foot + np.array([0, 0.02 * S, 0]), (0.055 * S, 0.065 * S, 0.016 * S), mat='hide')
    n0 = c + np.array([0, 0.45 * S, 0.03 * S])
    n1 = n0 + 0.2 * S * sph(22, 0)
    x.cap(n0, n1, 0.12 * S, 0.1 * S, mat='hide')
    x.ell(n0 + (n1 - n0) * 0.5 + np.array([0, 0, 0.08 * S]), (0.08 * S, 0.12 * S, 0.03 * S), mat='zone')
    Mh = rx(8)
    hc = n1 + Mh @ np.array([0, 0.14 * S, 0.0])
    x.ell(hc, (0.12 * S, 0.18 * S, 0.065 * S), Mh, mat='hide')
    x.ell(n1 + Mh @ np.array([0, 0.13 * S, -0.055 * S]), (0.11 * S, 0.16 * S, 0.035 * S), Mh, mat='hide')
    for i in range(7):  # the crown of spines round the back of the head
        a = np.radians(-150 + i * 50)
        b = n1 + np.array([0.08 * S * np.sin(a), 0.05 * S * np.cos(a) + 0.02 * S, 0.04 * S])
        x.cap(b, b + 0.12 * S * sph(45, np.degrees(a) * 0.4 + 180), 0.014 * S, 0.003 * S, mat='dark')
    t0 = c + np.array([0, -0.48 * S, 0.0])
    pts = curve(t0, np.array([0.15, -1.0, -0.04]), 0.95 * S, 55, 9)
    chain(x, pts, 0.11 * S, 0.035 * S, mat='hide')
    chain(x, [p + np.array([0, 0, 0.05 * S * (1 - i / 9) + 0.03 * S]) for i, p in enumerate(pts[:5])], 0.07 * S, 0.035 * S, mat='zone')
    x.ell(pts[-1], (0.075 * S, 0.09 * S, 0.06 * S), mat='dark')  # the bony club
    return x, set(), 'serpent rig (the salamander body plan at size 6), head level, crown of spines, moss back (zone), club tail'


def primordial():
    """A massive bison-like beast: a high humped back overgrown with moss (tint zone), thick pillar legs, the great head
    carried low and forward below the shoulder line, huge curling ram's horns, a short tail with a bony club."""
    x = Xf()
    c = np.array([0, 0, 0.62])
    x.ell(c, (0.32, 0.62, 0.36), mat='hide')
    x.ell(c + np.array([0, 0.22, 0.2]), (0.3, 0.32, 0.3), mat='hide')  # the hump over the shoulders
    x.ell(c + np.array([0, 0.12, 0.42]), (0.25, 0.42, 0.13), mat='zone')  # the moss mantle on the hump and back
    x.ell(c + np.array([0, -0.32, 0.27]), (0.2, 0.25, 0.08), mat='zone')
    for fy, sx in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        top = c + np.array([sx * 0.2, fy * 0.38, -0.12])
        x.cap(top, top + np.array([sx * 0.02, 0, -0.62]), 0.13, 0.1, mat='hide')
        x.ell(top + np.array([sx * 0.02, 0.03, -0.64]), (0.11, 0.13, 0.05), mat='dark')
    n0 = c + np.array([0, 0.55, 0.05])
    hd = n0 + np.array([0, 0.28, -0.12])
    x.cap(n0, hd, 0.24, 0.17, mat='hide')
    x.ell(hd + np.array([0, 0.08, -0.06]), (0.16, 0.2, 0.17), rx(-25), mat='hide')  # the heavy low skull
    x.ell(hd + np.array([0, 0.03, -0.22]), (0.09, 0.08, 0.1), mat='dark')  # the beard
    for s in (1, -1):  # the ram's horns: a thick ridged coil round the side of the skull
        pts = [hd + np.array([s * 0.12, 0.02, 0.1])]
        for i in range(8):
            a = np.radians(i * 40)
            pts.append(hd + np.array([s * (0.2 + 0.03 * i), 0.02 - 0.13 * np.sin(a), 0.06 + 0.13 * np.cos(a)]))
        chain(x, pts, 0.075, 0.03, mat='dark')
    t0 = c + np.array([0, -0.6, 0.12])
    t1 = t0 + np.array([0.05, -0.2, -0.12])
    x.cap(t0, t1, 0.07, 0.05, mat='hide')
    x.ell(t1 + np.array([0.02, -0.08, -0.03]), (0.11, 0.12, 0.1), mat='dark')  # the club
    s = LADDER[6] / zext(x)
    return scaled(x, s), set(), 'bison body (custom), hump moss (zone), head low below the shoulders, ram horns, club tail'


def wildSpirit(view=None):
    """A slender stag-spirit: long legs, one forefoot lifted, a long neck, tall branching antlers, a leaf ruff (tint
    zone) round the neck and chest, striped flanks. Stage C fix 5 (R3): the back view stands square on all four hooves
    (seen from behind and above, the lifted forefoot and the far forelegs high in the frame read as rearing); the
    front keeps the portrait's lifted forefoot."""
    x = Xf()
    c = np.array([0, 0, 0.58])
    x.ell(c, (0.15, 0.38, 0.17), mat='hide')
    legs = {(1, 1): (-60, -150), (1, -1): (-90, -90), (-1, 1): (-92, -88), (-1, -1): (-88, -92)}  # right fore lifted
    if view == 'back' and WILD_SPIRIT_BACK_SQUARE:
        legs[(1, 1)] = (-90, -90)  # all four hooves down
    for (fy, sx), (t, sh) in legs.items():
        top = c + np.array([sx * 0.08, fy * 0.26, -0.08])
        knee = top + 0.25 * sph(t, 0)
        foot = knee + 0.26 * sph(sh, 0)
        x.cap(top, knee, 0.055, 0.03, mat='hide'); x.cap(knee, foot, 0.028, 0.02, mat='hide')
    n0 = c + np.array([0, 0.3, 0.08])
    n1 = n0 + 0.36 * sph(62, 0)
    x.cap(n0, n1, 0.075, 0.05, mat='hide')
    x.ell(n0 + (n1 - n0) * 0.35, (0.13, 0.12, 0.14), mat='zone')  # the leaf ruff
    h1 = n1 + 0.2 * sph(-35, 0)
    x.cap(n1, h1, 0.055, 0.025, mat='hide')
    for s in (1, -1):
        x.cap(n1 + np.array([s * 0.04, -0.01, 0.03]), n1 + np.array([s * 0.07, -0.03, 0.09]), 0.016, 0.004, mat='hide')
        b = n1 + np.array([s * 0.03, -0.01, 0.05])
        t = b + np.array([s * 0.12, -0.06, 0.32])
        x.cap(b, t, 0.012, 0.006, mat='dark')
        for f in range(3):
            p = b + (t - b) * (0.3 + 0.25 * f)
            x.cap(p, p + np.array([s * 0.05, 0.05, 0.08]), 0.008, 0.003, mat='dark')
    t0 = c + np.array([0, -0.35, 0.06])
    x.cap(t0, t0 + np.array([0, -0.08, 0.03]), 0.03, 0.01, mat='hide')
    s = LADDER[2] / zext(x)
    return scaled(x, s), set(), 'deer body (custom), right forefoot lifted, tall antlers, leaf ruff (zone)'


def ashPhoenix():
    """A great coal-dark bird of prey standing upright on its talons, its wings raised high and fanned (the flight
    feathers: the tint zone), a tall plume crest, a hooked gold beak, a long trailing tail."""
    x = Xf()
    c = np.array([0, 0, 0.75])
    Mb = rx(18)  # leaning forward a little
    x.ell(c, (0.17, 0.2, 0.3), Mb, mat='coal')
    for s in (1, -1):  # legs and talons
        hip = c + np.array([s * 0.08, -0.02, -0.22])
        foot = hip + np.array([s * 0.02, 0.03, -0.5])
        x.cap(hip, foot, 0.04, 0.02, mat='dark')
        for a in (-30, 0, 30):
            x.cap(foot, foot + 0.09 * sph(-10, a), 0.012, 0.004, mat='gold')
    nk = c + Mb @ np.array([0, 0.06, 0.3])
    hd = nk + np.array([0, 0.06, 0.14])
    x.cap(nk, hd, 0.09, 0.07, mat='coal')
    x.ell(hd, (0.075, 0.09, 0.075), mat='coal')
    x.cap(hd + np.array([0, 0.07, -0.01]), hd + np.array([0, 0.16, -0.06]), 0.028, 0.006, mat='gold')  # the hooked beak
    for i in range(5):  # the plume crest
        x.cap(hd + np.array([0, -0.02, 0.05]), hd + np.array([0.03 * (i - 2), -0.1 - 0.02 * i, 0.22 + 0.02 * (i % 2)]), 0.014, 0.004, mat='coal')
    for s in (1, -1):  # broad wings raised high in a V and spread like fans (the portrait's pose)
        root = c + Mb @ np.array([s * 0.13, 0.0, 0.18])
        elbow = root + 0.3 * sph(35, s * 82)
        wrist = elbow + 0.32 * sph(62, s * 86)
        x.cap(root, elbow, 0.05, 0.035, mat='coal'); x.cap(elbow, wrist, 0.035, 0.025, mat='coal')
        x.tri(root, elbow, root + 0.3 * sph(-40, s * 100), 0.02, mat='coal')  # the coverts
        prim = [wrist + (0.5 - 0.03 * k) * sph(80 - 14 * k, s * (88 + 5 * k)) for k in range(5)]  # primaries up and out
        sec = [elbow + (elbow - root) * 0.1 + 0.48 * sph(-5 - 12 * k, s * (92 + 4 * k)) for k in range(4)]  # secondaries out and down
        fan = prim + [wrist + 0.45 * sph(0, s * 95)] + sec
        for k in range(len(fan) - 1):
            a0 = wrist if k < len(prim) else elbow
            x.tri(a0, fan[k], fan[k + 1], 0.012, mat='zone')
        x.tri(wrist, elbow, fan[len(prim)], 0.012, mat='zone')
        x.tri(elbow, root, sec[-1], 0.012, mat='zone')
    for i in range(5):  # the long trailing tail
        a = -20 + 10 * i
        t0 = c + Mb @ np.array([0, -0.15, -0.2])
        x.cap(t0, t0 + 0.85 * sph(-70, 180 + a), 0.03, 0.01, mat='coal')
    s = LADDER[3] / zext(x)
    return scaled(x, s), set(), 'bird body (custom), wings raised and fanned (flight feathers zone), plume crest, long tail'


def worldTree():
    """A great tree: a gnarled twisting trunk on spreading buttress roots under a round dome canopy (the leaves: the tint
    zone); no face, no blossom."""
    x = Xf()
    pts = [np.array([0, 0, 0.0])]
    for i in range(6):
        pts.append(pts[-1] + np.array([0.06 * np.sin(i * 1.3), 0.04 * np.cos(i * 1.1), 0.5]))
    chain(x, pts, 0.62, 0.36, mat='bark')
    for a in range(0, 360, 45):  # buttress roots
        d = sph(-25, a + 10)
        x.cap(np.array([0, 0, 0.45]), np.array([0, 0, 0.45]) + 1.25 * d, 0.3, 0.06, mat='bark')
    top = pts[-1]
    for a in (-50, 10, 70, 130, 200, 260):  # main boughs
        x.cap(top - np.array([0, 0, 0.4]), top + 0.9 * sph(35, a), 0.14, 0.07, mat='bark')
    x.ell(top + np.array([0, 0, 1.0]), (2.05, 1.9, 1.15), mat='zone')  # the dome canopy
    x.ell(top + np.array([0, 0, 0.4]), (1.85, 1.7, 0.55), mat='zone')
    s = LADDER[6] / zext(x)
    return scaled(x, s), set(), 'tree (custom): twisting trunk, buttress roots, dome canopy (zone)'


def _glyph_rows(x, cx, w, z0, z1, face_y, rows, mat='zone', both=True):
    for r in range(rows):
        z = z0 + (z1 - z0) * (r + 0.5) / rows
        for fy in ((1, -1) if both else (1,)):
            x.box((cx, fy * face_y, z), (w * 0.38, 0.012, 0.045), None, 0.004, mat=mat)


def livingMonolith():
    """A weathered standing slab with a plain broken top, carved runic glyphs filled with the nation's colour (tint zone)
    on its faces, no face, no overgrowth, its base gripped by roots among loose stones."""
    x = Xf()
    W, D, Hs = 1.25, 0.4, 2.7
    x.box((0, 0, 0.12 + Hs / 2), (W / 2, D / 2, Hs / 2), None, 0.03, mat='stone')
    x.box((0.22, 0, 0.12 + Hs + 0.02), (0.25, D / 2, 0.08), ry(18), 0.02, mat='stone')  # the broken top's stub
    _glyph_rows(x, 0.0, W, 0.75, 2.45, D / 2 + 0.003, 6)
    x.ell((0.05, 0.0, 0.05), (1.05, 0.8, 0.26), mat='bark')  # the low mound of dark earth and stones it rises from
    for a in range(0, 360, 30):  # thick old roots gripping the base and spreading over the mound
        d = sph(-12, a)
        x.cap(np.array([0.0, 0.0, 0.45]) + d * np.array([0.45, 0.17, 0]), np.array([0, 0, 0.3]) + 1.1 * d, 0.08, 0.025, mat='bark')
    for i, a in enumerate(range(10, 360, 45)):
        x.ell(0.85 * sph(0, a) + np.array([0, 0, 0.12]), (0.12, 0.1, 0.08), mat='stone')
    s = LADDER[6] / zext(x)
    return scaled(x, s), set(), 'slab (custom): broken top, glyph rows on both broad faces (zone), a mound of earth, roots and stones'


def cinderIdol():
    """A tall squared granite slab, chipped at its top corner, its upper front carved into a stern face with dark hollow
    eyes and mouth, a brazier bowl in its top with a worn gold rim, glyphs in ember pigment (tint zone) below the face
    and round the stepped plinth."""
    x = Xf()
    W, D, Hs = 1.05, 0.68, 2.55
    x.box((0, 0, 0.12), (0.85, 0.7, 0.12), None, 0.02, mat='stone')  # the stepped plinth
    x.box((0, 0, 0.3), (0.7, 0.55, 0.08), None, 0.02, mat='stone')
    x.box((0, 0, 0.38 + Hs / 2), (W / 2, D / 2, Hs / 2), None, 0.03, mat='stone')
    x.disc((0, 0, 0.38 + Hs + 0.02), (0, 0, 1.0), 0.36, 0.05, mat='gold')  # the brazier's gold rim
    x.ell((0, 0, 0.38 + Hs + 0.03), (0.3, 0.2, 0.04), mat='dark')  # the coals
    fz = 0.38 + Hs * 0.78
    for s in (1, -1):
        x.ell((s * 0.17, D / 2, fz + 0.05), (0.08, 0.03, 0.05), mat='dark')  # eye hollows
    x.ell((0, D / 2, fz - 0.25), (0.13, 0.03, 0.06), mat='dark')  # the mouth hollow
    x.box((0, D / 2 + 0.01, fz - 0.08), (0.04, 0.02, 0.12), None, 0.01, mat='stone')  # the nose ridge
    _glyph_rows(x, 0.0, W, 0.6, 0.38 + Hs * 0.55, D / 2 + 0.003, 4)
    x.box((0, 0.702, 0.12), (0.7, 0.006, 0.05), None, 0.004, mat='zone')  # the plinth's glyph band (front)
    x.box((0, -0.702, 0.12), (0.7, 0.006, 0.05), None, 0.004, mat='zone')
    s = LADDER[6] / zext(x)
    return scaled(x, s), set(), 'slab on a stepped plinth (custom): carved face front, brazier, glyphs both faces (zone)'


BUILD = dict(titan=titan, ascendedHero=ascendedHero, oracle=oracle, pyreLord=pyreLord, emberHierophant=emberHierophant,
             hornedHunter=hornedHunter, motherOfBeasts=motherOfBeasts, ashColossus=ashColossus, greatWyrm=greatWyrm,
             elderWyrm=elderWyrm, primordial=primordial, wildSpirit=wildSpirit, ashPhoenix=ashPhoenix,
             worldTree=worldTree, livingMonolith=livingMonolith, cinderIdol=cinderIdol)
FLOAT = {'oracle': 0.08}  # men above the ground (the floating hem), before scaling
HUMANOID = {'titan', 'ascendedHero', 'oracle', 'pyreLord', 'emberHierophant', 'hornedHunter', 'motherOfBeasts', 'ashColossus'}


WILD_SPIRIT_BACK_SQUARE = True  # False rebuilds the first back maquette (right forefoot lifted)


def build(gid, view=None):
    """The god's rig at its ladder height: (Xf, weapon item indices, note, ladder multiple, world height in men).
    `view` lets a body differ by view (the Wild Spirit's back stands square, stage C fix 5)."""
    x, weapons, note = BUILD[gid](view) if gid == 'wildSpirit' else BUILD[gid]()
    L = LADDER[SIZE[gid]]
    if gid in HUMANOID:  # a humanoid's height is its body (feet to crown) without the weapon above it
        x = scaled(x, L / zext(x, weapons))
    if gid == 'greatWyrm':  # rigs.wyrm is built at S = 6; its head-up height is set to the ladder exactly
        x = scaled(x, L / zext(x))
    # the Elder Wyrm keeps the approved Salamander's body plan at S = 6 (the Salamander is S = 2.3 for size 3): a low
    # crawler whose ladder height is its height with the head held up, as for the Salamander
    return x, weapons, note, L, zext(x, weapons)
