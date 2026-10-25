# Rest of stage D: posed, part-tagged clay rigs for every big body's actions (art plan 5.3, 6). Built from the stage A
# rigs (units/tools/rigs.py) and the stage C god rigs (stage-c/work/gods/tools/gd_rigs.py): the same bodies, materials,
# proportions and ladder heights, now posable per action, and every primitive tagged with the body part it belongs to
# (head, neck, body, armR/armL, legR/legL or legFR/legFL/legBR/legBL, tail, wingR/wingL, weapon, cape, ...) for the
# part-ID pass that becomes the mesh region weights (art plan 6, last paragraph). Named rig points (weapon tip, mouth,
# feet, hands) are carried through scaling and placing for the per-frame anchors.
# Local frame: x right, y forward (the body faces +y), z up; a man is 1.0 tall. Angles in degrees.
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(UNITS, 'tools'))
import sdf  # noqa: E402
from rigs import Xf, chain, curve, sph, rx, ry, rz, HUM, STAND  # noqa: E402

sdf.MAT_RGB.update({'gold': (0.72, 0.60, 0.33), 'stone': (0.58, 0.57, 0.55), 'bark': (0.42, 0.33, 0.25),
                    'hide': (0.50, 0.40, 0.31), 'coal': (0.25, 0.23, 0.22)})
LADDER = {2: 1.5, 3: 2.3, 4: 3.4, 5: 4.6, 6: 6.0}


class PXf(Xf):
    """An Xf whose primitives carry a part tag (self.part when added) and which keeps named points."""

    def __init__(self):
        super().__init__()
        self.parts, self.part, self.named = [], 'body', {}

    def _t(self):
        self.parts.append(self.part)

    def cap(self, *a, **k): super().cap(*a, **k); self._t()
    def ell(self, *a, **k): super().ell(*a, **k); self._t()
    def box(self, *a, **k): super().box(*a, **k); self._t()
    def disc(self, *a, **k): super().disc(*a, **k); self._t()
    def tri(self, *a, **k): super().tri(*a, **k); self._t()

    def pt(self, name, p):
        self.named[name] = np.asarray(p, float)


def scaled(x, s):
    y = PXf()
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
    y.parts = list(x.parts)
    y.named = {k: v * s for k, v in x.named.items()}
    return y


def zext(x, skip_parts=('weapon',)):
    """World height of the rig without the given parts (weapons held above the head are left out, as stage C did)."""
    lo, hi = 1e9, -1e9
    for (kind, ps, args, mat), part in zip(x.items, x.parts):
        if part in skip_parts:
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


def place(x, scene, facing=0.0, pitch_all=0.0, roll_all=0.0, offset=(0, 0, 0), ground=True, pivot=(0, 0, 0)):
    """rigs.place, plus: the parts go to scene.prim_parts and the named points come back placed (world coords)."""
    M = rz(facing) @ ry(roll_all) @ rx(pitch_all)
    piv = np.asarray(pivot, float)
    T = piv - M @ piv
    if ground:
        lowest = min((M @ p + T)[2] - r for p, r in x.pts())
        T = T + np.array([0, 0, -lowest])
    T = T + np.asarray(offset, float)
    x.emit(scene, M, T)
    if not hasattr(scene, 'prim_parts'):
        scene.prim_parts = []
    scene.prim_parts += list(x.parts)
    return {k: M @ v + T for k, v in x.named.items()}


# ======================================================================================== humanoid (posed, tagged)
def humanoid(x, gear, pose, H=None):
    """The stage A humanoid body (legs, torso, head, shoulders, arms; robe or tabard skirt) with part tags. Returns its
    joints for the gear: pel, chest, Mt, head, Mh, sh/el/ha per side (1 right, -1 left), feet, weapon direction d."""
    p = dict(STAND); p.update(pose)
    H = dict(HUM) if H is None else H
    bulk = gear.get('bulk', 1.0)
    pel = np.array([0, p.get('shift', 0.0), H['hip'] - p['crouch']])
    feet = {}
    for side, th, sh, nm in ((1, p['rTh'], p['rSh'], 'legR'), (-1, p['lTh'], p['lSh'], 'legL')):
        x.part = nm
        hip = pel + np.array([side * H['hipW'], 0, 0])
        knee = hip + H['thigh'] * sph(*th)
        foot = knee + H['shin'] * sph(*sh)
        if not gear.get('robe'):
            x.cap(hip, knee, H['limb'] * 1.25 * bulk, H['limb'] * 1.05 * bulk)
            x.cap(knee, foot, H['limb'] * 1.05 * bulk, H['limb'] * 0.85)
        x.ell(foot + np.array([0, 0.035, 0.01]), (0.035, 0.06, 0.03), mat='dark')
        feet[side] = foot
        x.pt('foot' + ('R' if side == 1 else 'L'), foot)
    x.part = 'body'
    Mt = rz(p['twist']) @ ry(p['roll']) @ rx(p['lean'])
    chest = pel + Mt @ np.array([0, 0, H['spine']])
    tw = H['torsoW'] * bulk
    x.ell((pel + chest) / 2 + Mt @ np.array([0, 0, 0.02]), (tw, H['torsoD'] * bulk, H['spine'] * 0.62), Mt)
    x.ell(pel + np.array([0, 0, 0.03]), (tw * 0.85, H['torsoD'] * 0.95, 0.07))
    if gear.get('robe'):
        hem = (feet[1] + feet[-1]) / 2 * np.array([1, 1, 0]) + np.array([0, 0.01, 0.03])
        x.part = 'cape'
        x.cap(pel + np.array([0, 0, 0.05]), hem, 0.11, 0.17)
        x.part = 'body'
    neck = chest + Mt @ np.array([0, 0, H['neck']])
    Mh = Mt @ rx(p['head'][0]) @ rz(p['head'][1])
    head = neck + Mh @ np.array([0, 0.005, H['headR'] * 1.05])
    x.part = 'head'
    x.ell(head, (H['headR'], H['headR'] * 1.02, H['headR'] * 1.1), Mh, mat='skin')
    x.cap(head + Mh @ np.array([0, H['headR'] * 0.8, -0.005]), head + Mh @ np.array([0, H['headR'] * 1.15, -0.02]), 0.022, 0.014, mat='skin')
    x.pt('mouth', head + Mh @ np.array([0, H['headR'] * 1.0, -0.04]))
    x.part = 'body'
    sh = {1: chest + Mt @ np.array([H['sh'] * bulk, 0, -0.02]), -1: chest + Mt @ np.array([-H['sh'] * bulk, 0, -0.02])}
    if gear.get('pauldrons', True):
        for s in (1, -1):
            x.ell(sh[s], (0.06 * bulk, 0.06, 0.045), Mt)
    el, ha = {}, {}
    for side, ua, fa in ((1, p['rUA'], p['rFA']), (-1, p['lUA'], p['lFA'])):
        x.part = 'armR' if side == 1 else 'armL'
        el[side] = sh[side] + H['ua'] * (Mt @ sph(*ua))
        ha[side] = el[side] + H['fa'] * (Mt @ sph(*fa))
        x.cap(sh[side], el[side], H['limb'] * 1.1 * bulk, H['limb'] * 0.95)
        x.cap(el[side], ha[side], H['limb'] * 0.95, H['limb'] * 0.8, mat='skin' if gear.get('bare') else 'clay')
        x.pt('hand' + ('R' if side == 1 else 'L'), ha[side])
    x.part = 'body'
    return dict(pel=pel, chest=chest, Mt=Mt, head=head, Mh=Mh, sh=sh, el=el, ha=ha, feet=feet, d=Mt @ sph(*p['w']),
                dL=Mt @ sph(*p.get('wL', p['w'])), bulk=bulk, H=H, p=p)


def hp(J, v):
    return J['head'] + J['Mh'] @ np.asarray(v, float)


def tp(J, v):
    return J['chest'] + J['Mt'] @ np.asarray(v, float)


def mantle(x, J, length=0.62, mat='zone', front=False, shoulders=True):
    """gd_rigs._mantle on the posed torso: shoulder pieces and a back panel hanging from the shoulders."""
    bulk = J['bulk']; Mt = J['Mt']
    sh = HUM['sh'] * bulk
    x.part = 'body'
    if shoulders:
        for s in (1, -1):
            x.ell(tp(J, (s * sh, 0, -0.01)), (0.075 * bulk, 0.075 * bulk, 0.055), Mt, mat=mat)
        x.ell(tp(J, (0, -0.01, -0.01)), (sh * 0.95, 0.09 * bulk, 0.05), Mt, mat=mat)
    x.part = 'cape'
    sway = J['p'].get('capeSway', 0.0)
    Mc = rz(J['p']['twist']) @ rx(-4 - sway)  # the cape hangs from the shoulders, turning with the torso, not leaning with it
    top = tp(J, (0, -0.105 * bulk, -0.02))
    x.box(top + Mc @ np.array([0, 0, -length / 2]), (sh * 1.02, 0.022, length / 2), Mc, 0.02, mat=mat)
    if front:
        for s in (1, -1):
            x.box(tp(J, (s * sh * 0.72, 0.095 * bulk, -0.02 - length * 0.42)), (sh * 0.28, 0.018, length * 0.42), Mt @ rx(3), 0.015, mat=mat)
    x.part = 'body'


def blade(x, J, L, back=0.06, r0=0.016, r1=0.01, mat='dark', guard=None, side=1):
    """A blade or haft in the hand along the weapon direction; its tip is the named point 'tip'."""
    d = J['d'] if side == 1 else J['dL']
    ha = J['ha'][side]
    x.part = 'weapon'
    a, b = ha - d * back, ha + d * L
    x.cap(a, b, r0, r1, mat=mat)
    if guard:
        n = np.cross(d, J['Mt'] @ np.array([0, 0, 1.0]))
        if np.linalg.norm(n) < 1e-3:
            n = J['Mt'] @ np.array([1.0, 0, 0])
        n = n / np.linalg.norm(n)
        g = ha + d * 0.03
        x.cap(g - n * guard, g + n * guard, 0.014, 0.014, mat='gold')
    x.pt('tip', b)
    x.pt('butt', a)
    x.part = 'body'
    return a, b


# ---------------------------------------------------------------- humanoid action poses (shared, then per god)
def biped_pose(action, idle, weapon='one', caster=False):
    """Action poses on the stage A angle conventions (sph(elevation, azimuth); azimuth 0 forward, 90 right; legs and arms
    in the torso frame). `idle` is the god's own idle pose (arms), kept where an action does not move a limb."""
    P = dict(idle)
    two = weapon in ('two', 'staff', 'pole')
    if action == 'idle':
        return P
    if action in ('stepA', 'stepB'):
        s = 1 if action == 'stepA' else -1  # stepA: the right foot forward
        fwd, back = ((-46, 0), (-92, 0)), ((-128, 0), (-150, 0))
        P.update(rTh=fwd[0] if s > 0 else back[0], rSh=fwd[1] if s > 0 else back[1],
                 lTh=back[0] if s > 0 else fwd[0], lSh=back[1] if s > 0 else fwd[1], lean=8, twist=-9 * s, crouch=0.05, capeSway=10)
        if not two:  # the free arm swings against the leading foot, the weapon arm with it
            P.update(lUA=(-62, -10 + 45 * s), lFA=(-40, -5 + 40 * s), rUA=(-62, 20 - 40 * s), rFA=(-45, 10 - 35 * s))
        return P
    if action == 'windup':
        P.update(lean=-8, twist=-28, rTh=(-104, 14), rSh=(-98, 8), lTh=(-66, -12), lSh=(-90, -6), crouch=0.04,
                 rUA=(50, 135), rFA=(72, 175), w=(64, 190), capeSway=-4)
        P.update(lUA=(40, 70), lFA=(62, 125)) if two else P.update(lUA=(-20, -45), lFA=(0, -15))
        return P
    if action == 'strike':  # the moment of the blow: the weapon level and forward-left of the body, the body lunging into it
        P.update(lean=16, twist=30, rTh=(-122, 6), rSh=(-140, 4), lTh=(-50, -8), lSh=(-92, -4), crouch=0.08,
                 rUA=(-8, -12), rFA=(-8, -30), w=(-14, -38), capeSway=12)
        if weapon == 'pole':  # a thrust: both hands on the haft, the point driven straight forward
            P.update(twist=12, rUA=(-25, 15), rFA=(-8, 0), w=(-6, 0), lUA=(-20, -25), lFA=(-6, 15))
        elif two:
            P.update(rUA=(-5, -5), rFA=(-12, -25), w=(-20, -30), lUA=(-8, -30), lFA=(-12, -20))
        else:
            P.update(lUA=(-55, -80), lFA=(-35, -70))
        return P
    if action == 'follow':
        P.update(lean=12, twist=44, rTh=(-114, 8), rSh=(-126, 4), lTh=(-56, -8), lSh=(-90, -4), crouch=0.06,
                 rUA=(-38, -40), rFA=(-45, -80), w=(-28, -115), capeSway=12)
        P.update(lUA=(-40, -45), lFA=(-45, -85)) if two else P.update(lUA=(-50, -95), lFA=(-30, -80))
        return P
    if action == 'hit':
        P.update(lean=-16, twist=-10, head=(18, 12), rTh=(-80, 10), rSh=(-92, 6), lTh=(-108, -10), lSh=(-118, -6),
                 rUA=(-20, 105), rFA=(-10, 120), w=(15, 125), lUA=(-25, -110), lFA=(-15, -125), wL=(15, -125), capeSway=-10)
        return P
    if action == 'fall':  # buckling forward onto one knee
        P.update(lean=30, head=(-15, 0), crouch=0.2, rTh=(-30, 6), rSh=(-100, 4), lTh=(-150, -6), lSh=(-175, -4),
                 rUA=(-70, 40), rFA=(-80, 20), w=(-60, 30), lUA=(-75, -30), lFA=(-85, -20), capeSway=6)
        return P
    if action == 'dead':  # laid flat on the back (placed with pitch_all), arms flung out, the weapon fallen beside
        P.update(lean=0, head=(-10, 25), crouch=0, rTh=(-90, 14), rSh=(-90, 10), lTh=(-90, -16), lSh=(-92, -12),
                 rUA=(-5, 80), rFA=(-5, 95), w=(-10, 100), lUA=(-10, -85), lFA=(-8, -110), wL=(-10, -110), capeSway=0)
        return P
    if action == 'call':  # the summoner's call: the pose comes from the god's poseFix
        return P
    if action == 'castA':  # the staff raised high in both hands
        P.update(lean=-4, head=(20, 0), rUA=(62, 25), rFA=(82, 10), w=(88, 0), lUA=(55, -25), lFA=(80, -5), capeSway=-3)
        return P
    if action == 'castB':  # the staff thrust forward at the foe, the free palm out
        P.update(lean=10, rTh=(-108, 6), rSh=(-118, 4), lTh=(-64, -6), lSh=(-92, -4), crouch=0.04,
                 rUA=(5, 15), rFA=(10, 5), w=(30, 0), lUA=(-10, -35), lFA=(5, -10), capeSway=8)
        return P
    raise KeyError(action)


def god_humanoid(gid, action, view):
    """One posed humanoid god (or the Giant) at its ladder height. Returns (PXf, note)."""
    x = PXf()
    spec = HUMANOIDS[gid]
    idle = dict(spec['idle'])
    act = 'idle' if action == 'idle' else action
    pose = biped_pose(act, idle, spec['weapon'])
    pose.update(spec.get('poseFix', {}).get(act, {}))
    H = dict(HUM); H.update(spec.get('H', {}))
    if 'hipFromLegs' in spec:
        H['hip'] = H['thigh'] + H['shin'] - 0.01
    J = humanoid(x, spec['gear'], pose, H)
    spec['dress'](x, J, act)
    return x, spec['note']


# god gear: each dresses the posed body (stage C gd_rigs overlays re-expressed on the posed joints)
def _titan(x, J, act):
    b = J['bulk']
    x.part = 'head'; x.box(hp(J, (0, -0.005, 0.005)), (0.092, 0.098, 0.112), J['Mh'], 0.04, mat='gold')
    x.part = 'body'
    for s in (1, -1):
        x.ell(tp(J, (s * HUM['sh'] * b, 0, 0.0)), (0.085 * b, 0.08, 0.06), J['Mt'], mat='gold')
    for fy in (1, -1):
        x.part = 'cape' if fy < 0 else 'body'
        x.box(J['pel'] + J['Mt'] @ np.array([0, fy * 0.112 * b, 0.03]), (0.085 * b, 0.014, 0.25), J['Mt'] @ rx(-fy * 3), 0.012, mat='zone')
    if act == 'idle':  # the great sword point-down before it, both hands on the pommel (stage C)
        x.part = 'weapon'
        x.cap((0, 0.2, 0.6), (0, 0.2, 0.02), 0.022, 0.012, mat='dark'); x.pt('tip', (0, 0.2, 0.02))
        x.cap((-0.1, 0.2, 0.5), (0.1, 0.2, 0.5), 0.014, 0.014, mat='gold'); x.ell((0, 0.2, 0.62), (0.025, 0.025, 0.025), mat='gold')
        x.part = 'body'
    else:
        blade(x, J, 0.62, 0.1, 0.022, 0.012, guard=0.1)


def _ascended(x, J, act):
    x.part = 'head'; x.disc(hp(J, (0, 0, 0.045)), J['Mh'] @ np.array([0, 0, 1.0]), HUM['headR'] * 1.08, 0.012, mat='dark')
    mantle(x, J, length=0.58)
    blade(x, J, 0.42, 0.04, 0.016, 0.01)


def _oracle(x, J, act):
    b = J['bulk']
    x.part = 'cape'; x.cap(J['pel'] + np.array([0, 0, 0.07]), (J['feet'][1] + J['feet'][-1]) / 2 * np.array([1, 1, 0]) + np.array([0, 0.01, 0.06]), 0.12 * b, 0.19, mat='zone')
    x.part = 'body'; x.ell(J['pel'] + J['Mt'] @ np.array([0, 0, 0.17]), (0.17 * b, 0.12 * b, 0.2), J['Mt'], mat='zone')
    x.part = 'head'
    x.ell(hp(J, (0, -0.025, 0.005)), (0.125, 0.13, 0.125), J['Mh'], mat='zone')
    x.cap(hp(J, (0, -0.035, 0.055)), hp(J, (0, -0.055, 0.205)), 0.07, 0.012, mat='zone')
    x.part = 'body'
    for s in (1, -1):
        x.ell(tp(J, (s * HUM['sh'] * b, 0, -0.01)), (0.075 * b, 0.07, 0.06), J['Mt'], mat='zone')
    _orbstaff(x, J, act, 1.0, 0.045, (0.26, 0.12))


def _orbstaff(x, J, act, top, orb, at):
    x.part = 'weapon'
    if act == 'idle':
        x.cap((at[0], at[1], 0.0), (at[0], at[1], top), 0.012, 0.012, mat='bark')
        x.ell((at[0], at[1], top + orb), (orb, orb, orb), mat='gold'); x.pt('tip', (at[0], at[1], top + orb))
    else:
        a, b = blade(x, J, 0.5, 0.48, 0.012, 0.012, mat='bark')
        x.part = 'weapon'; x.ell(b + J['d'] * orb, (orb, orb, orb), mat='gold'); x.pt('tip', b + J['d'] * orb)
    x.part = 'body'


def _pyre(x, J, act):
    b = J['bulk']
    x.part = 'head'
    for i in range(7):
        a = np.radians(-90 + i * 30)
        p0 = hp(J, (0.085 * np.sin(a), 0.085 * np.cos(a) * 0.9, 0.06))
        x.cap(p0, p0 + J['Mh'] @ np.array([0, 0, 0.06 + 0.02 * (i % 2)]), 0.014, 0.003, mat='gold')
    x.disc(hp(J, (0, 0, 0.06)), J['Mh'] @ np.array([0, 0, 1.0]), 0.095, 0.014, mat='gold')
    mantle(x, J, length=0.7, front=True)
    x.part = 'weapon'
    if act == 'idle':
        x.cap((0.27, 0.12, 0.0), (0.27, 0.12, 1.08), 0.014, 0.014, mat='dark')
        x.tri((0.27, 0.12, 1.06), (0.27, 0.12, 1.3), (0.35, 0.12, 1.13), 0.012, mat='dark'); x.pt('tip', (0.27, 0.12, 1.3))
    else:
        a, e = blade(x, J, 0.62, 0.45, 0.014, 0.014)
        n = np.cross(J['d'], np.array([0, 0, 1.0])); n = n / (np.linalg.norm(n) + 1e-9)
        x.part = 'weapon'; x.tri(e - J['d'] * 0.02, e + J['d'] * 0.22, e + J['d'] * 0.06 + n * 0.08, 0.012, mat='dark'); x.pt('tip', e + J['d'] * 0.22)
    x.part = 'body'


def _hiero(x, J, act):
    x.part = 'head'
    x.ell(hp(J, (0, -0.025, 0.0)), (0.11, 0.115, 0.115), J['Mh'], mat='coal')
    x.cap(hp(J, (0, -0.035, 0.045)), hp(J, (0, -0.065, 0.145)), 0.06, 0.01, mat='coal')
    x.ell(hp(J, (0, 0.07, -0.01)), (0.06, 0.03, 0.07), J['Mh'], mat='gold')
    mantle(x, J, length=0.5, front=True)
    _orbstaff(x, J, act, 0.98, 0.042, (0.26, 0.12))


def _hunter(x, J, act):
    b = J['bulk']
    x.part = 'body'
    x.ell(J['pel'] + J['Mt'] @ np.array([0, 0, 0.19]), (0.165 * b, 0.112 * b, 0.17), J['Mt'], mat='skin')
    x.cap(J['pel'] + np.array([0, 0, 0.02]), J['pel'] + np.array([0, 0, -0.15]), 0.14 * b, 0.15 * b, mat='hide')
    x.part = 'head'
    for s in (1, -1):
        p0 = hp(J, (s * 0.05, -0.01, 0.07)); t = p0 + J['Mh'] @ np.array([s * 0.13, -0.04, 0.2])
        x.cap(p0, t, 0.014, 0.007, mat='dark')
        for f, (dz, dx) in enumerate(((0.06, 0.06), (0.12, 0.02), (0.16, 0.09))):
            q = p0 + (t - p0) * (0.35 + 0.22 * f)
            x.cap(q, q + J['Mh'] @ np.array([s * dx, 0.02, dz * 0.6]), 0.009, 0.004, mat='dark')
    mantle(x, J, length=0.48)
    x.part = 'weapon'
    if act == 'idle':
        x.cap((0.27, 0.12, 0.0), (0.27, 0.12, 1.12), 0.012, 0.012, mat='bark')
        x.ell((0.27, 0.12, 1.2), (0.022, 0.012, 0.08), mat='gold'); x.pt('tip', (0.27, 0.12, 1.28))
    else:
        a, e = blade(x, J, 0.62, 0.5, 0.012, 0.012, mat='bark')
        x.part = 'weapon'; x.cap(e, e + J['d'] * 0.14, 0.022, 0.004, mat='gold'); x.pt('tip', e + J['d'] * 0.14)
    if act == 'call':  # the hunting horn raised to the lips in the left hand
        x.part = 'armL'
        m = hp(J, (0.0, 0.11, -0.03))
        x.cap(m, J['ha'][-1], 0.014, 0.03, mat='bark'); x.cap(J['ha'][-1], J['ha'][-1] + J['Mt'] @ np.array([-0.06, 0.02, 0.07]), 0.03, 0.045, mat='bark')
    x.part = 'body'


def _mother(x, J, act):
    b = J['bulk']
    x.part = 'body'; x.ell(J['pel'] + J['Mt'] @ np.array([0, 0, 0.17]), (0.168 * b, 0.113 * b, 0.19), J['Mt'], mat='zone')
    x.part = 'cape'; x.cap(J['pel'] + np.array([0, 0, 0.07]), (J['feet'][1] + J['feet'][-1]) / 2 * np.array([1, 1, 0]) + np.array([0, 0.01, 0.04]), 0.125 * b, 0.18, mat='zone')
    x.part = 'head'
    for s in (1, -1):
        p0 = hp(J, (s * 0.05, 0, 0.07)); t = p0 + J['Mh'] @ np.array([s * 0.1, -0.03, 0.13])
        x.cap(p0, t, 0.011, 0.006, mat='dark')
        x.cap((p0 + t) / 2, (p0 + t) / 2 + J['Mh'] @ np.array([s * 0.05, 0.02, 0.05]), 0.008, 0.004, mat='dark')
    mantle(x, J, length=0.6, mat='hide')
    x.part = 'body'
    bh = tp(J, (-HUM['sh'] * b * 1.05, 0.0, 0.07))
    x.ell(bh, (0.07, 0.085, 0.06), J['Mt'], mat='hide')
    x.cap(tp(J, (-HUM['sh'] * b * 1.05, 0.06, 0.06)), tp(J, (-HUM['sh'] * b * 1.05, 0.13, 0.04)), 0.035, 0.025, mat='hide')
    x.part = 'weapon'
    if act == 'idle':
        x.cap((0.27, 0.13, 0.5), (0.29, 0.15, 0.14), 0.012, 0.012, mat='bark')
        x.box((0.29, 0.15, 0.08), (0.06, 0.05, 0.065), None, 0.01, mat='dark'); x.pt('tip', (0.29, 0.15, 0.08))
        x.disc((0.29, 0.15, 0.08), (1.0, 0, 0), 0.07, 0.01, mat='gold')
    else:
        a, e = blade(x, J, 0.42, 0.1, 0.012, 0.012, mat='bark')
        x.part = 'weapon'; x.ell(e + J['d'] * 0.05, (0.065, 0.065, 0.065), mat='dark'); x.pt('tip', e + J['d'] * 0.08)
    x.part = 'body'


def _colossus(x, J, act):
    b = J['bulk']; H = J['H']
    x.part = 'head'
    x.ell(hp(J, (0, 0, 0.015)), (0.115, 0.115, 0.075), J['Mh'], mat='coal')
    x.disc(hp(J, (0, 0, 0.075)), J['Mh'] @ np.array([0, 0, 1.0]), 0.12, 0.011, mat='gold')
    x.ell(hp(J, (0, 0, 0.085)), (0.098, 0.098, 0.022), J['Mh'], mat='dark')
    x.pt('brazier', hp(J, (0, 0, 0.09)))
    x.part = 'body'
    x.cap(J['pel'] + np.array([0, 0, -0.01]), J['pel'] + np.array([0, 0.012, -0.27]), 0.088 * b, 0.1 * b, mat='zone')
    x.disc(J['pel'] + np.array([0, 0, 0.01]), (0, 0, 1.0), 0.092 * b, 0.011, mat='gold')
    for s in (1, -1):
        x.part = 'armR' if s == 1 else 'armL'
        f = J['ha'][s] + (J['ha'][s] - J['el'][s]) / max(1e-6, np.linalg.norm(J['ha'][s] - J['el'][s])) * 0.03
        x.ell(f, (0.048, 0.05, 0.055), J['Mt'], mat='coal')
        x.pt('fist' + ('R' if s == 1 else 'L'), f)
    x.pt('tip', x.named['fistR'])
    x.part = 'body'


def _giant(x, J, act):
    a, e = blade(x, J, 0.46, 0.06, 0.022, 0.05)


HUMANOIDS = {
    'titan': dict(gear=dict(bulk=1.35, pauldrons=False), weapon='two', dress=_titan, ladder=4,
                  idle=dict(rUA=(-65, 30), rFA=(-2, -59), lUA=(-65, -30), lFA=(-2, 59)), note='great helm, gold plate, tabard, great sword'),
    'ascendedHero': dict(gear=dict(bulk=1.15, pauldrons=False), weapon='one', dress=_ascended, ladder=2,
                         idle=dict(rUA=(-45, 20), rFA=(45, -45), w=(80, -10), lUA=(-80, -15), lFA=(-60, 5)), note='circlet, long cape, sword'),
    'oracle': dict(gear=dict(bulk=1.1, robe=True), weapon='staff', dress=_oracle, ladder=2, float=0.08,
                   idle=dict(rUA=(-75, 30), rFA=(-5, 15), lUA=(-70, -20), lFA=(-20, -40)), note='robe and cowl, orb staff, floating'),
    'pyreLord': dict(gear=dict(bulk=1.2), weapon='pole', dress=_pyre, ladder=4,
                     idle=dict(rUA=(-70, 35), rFA=(-5, 10), lUA=(-60, -40), lFA=(-20, -55)), note='flame crown, ember mantle, glaive'),
    'emberHierophant': dict(gear=dict(bulk=1.1, robe=True), weapon='staff', dress=_hiero, ladder=2,
                            idle=dict(rUA=(-75, 30), rFA=(-5, 15), lUA=(-55, -35), lFA=(35, -10)), note='hood and gold mask, mantle, orb staff'),
    'hornedHunter': dict(gear=dict(bulk=1.15, bare=True), weapon='pole', dress=_hunter, ladder=4,
                         idle=dict(rUA=(-70, 35), rFA=(-5, 10), lUA=(-80, -18), lFA=(-70, -10)), note='antlers, leaf mantle, spear'),
    'motherOfBeasts': dict(gear=dict(bulk=1.25, robe=True), weapon='two', dress=_mother, ladder=4,
                           idle=dict(rUA=(-75, 25), rFA=(-60, 10), lUA=(-80, -18), lFA=(-55, 10)), note='antler crown, bear pelt, dress, maul'),
    'ashColossus': dict(gear=dict(bulk=1.15, bare=True, pauldrons=False), weapon='fist', dress=_colossus, ladder=5,
                        H=dict(thigh=0.31, shin=0.31, ua=0.2, fa=0.19, limb=0.05), hipFromLegs=True,
                        idle=dict(rUA=(-80, 60), rFA=(-86, 30), lUA=(-80, -60), lFA=(-86, -30), rTh=(-86, 85), rSh=(-89, 60), lTh=(-86, -85), lSh=(-89, -60)),
                        note='brazier head, long legs, bare, kilt, rock fists'),
    'giant': dict(gear=dict(bulk=1.45, pauldrons=False), weapon='one', dress=_giant, ladder=None, scale=3.4,
                  idle=dict(rUA=(-75, 22), rFA=(-55, 10), w=(-30, 15), lUA=(-78, -22), lFA=(-60, -15), lean=6, head=(8, 0)), note='club (stage C giant rig)'),
}
# per-god pose fixes on top of the shared action poses
HUMANOIDS['ashColossus']['poseFix'] = {
    'stepA': dict(rTh=(-62, 30), lTh=(-112, -30), rSh=(-92, 20), lSh=(-128, -20)),
    'stepB': dict(rTh=(-112, 30), lTh=(-62, -30), rSh=(-128, 20), lSh=(-92, -20)),
    'windup': dict(rUA=(30, 140), rFA=(10, 175), lUA=(-50, -40), lFA=(-20, -10)),   # the right fist drawn back high
    'strike': dict(rUA=(0, 20), rFA=(-20, 5), lUA=(-60, -60), lFA=(-60, -40)),      # the fist driven forward and down
}
HUMANOIDS['giant']['poseFix'] = {'windup': dict(w=(55, 175))}
HUMANOIDS['pyreLord']['poseFix'] = {'call': dict(lean=6, twist=-30, rUA=(5, 95), rFA=(5, 80), w=(5, 70), lUA=(-20, -60), lFA=(10, -40),
                                                 rTh=(-80, 15), lTh=(-98, -15))}
HUMANOIDS['hornedHunter']['poseFix'] = {'call': dict(head=(30, 0), lean=-6, lUA=(-10, -20), lFA=(55, 70), rUA=(-70, 35), rFA=(-20, 10), w=(70, 0))}
# the floating Oracle walks by gliding: the step poses keep its legs under the robe and sway the hem
HUMANOIDS['oracle']['poseFix'] = {'stepA': dict(rTh=(-80, 0), lTh=(-100, 0), rSh=(-88, 0), lSh=(-96, 0), lean=7),
                                  'stepB': dict(rTh=(-100, 0), lTh=(-80, 0), rSh=(-96, 0), lSh=(-88, 0), lean=7)}


def extra_actions_for(gid):
    if gid in ('oracle', 'emberHierophant'):
        return ['castA', 'castB']
    if gid in ('pyreLord', 'hornedHunter'):
        return ['call', 'fall']
    return ['follow', 'fall']



# ======================================================================================== creatures
def salamander(pose, S=2.3):
    """rigs.salamander, tagged; adds a throat swell for the breath."""
    x = PXf()
    lift = pose.get('rear', 0)
    c = np.array([0, 0, 0.13 * S])
    Mb = rx(-lift)
    x.part = 'body'; x.ell(c, (0.2 * S, 0.42 * S, 0.14 * S), Mb)
    for fy, sx, nm in ((1, 1, 'legFR'), (1, -1, 'legFL'), (-1, 1, 'legBR'), (-1, -1, 'legBL')):
        x.part = nm
        th, sh = pose.get(nm, ((-12, sx * 80), (-85, sx * 15)))
        top = c + Mb @ np.array([sx * 0.15 * S, fy * 0.26 * S, -0.03 * S])
        knee = top + 0.13 * S * sph(*th)
        foot = knee + 0.14 * S * sph(*sh)
        x.cap(top, knee, 0.07 * S, 0.055 * S); x.cap(knee, foot, 0.055 * S, 0.045 * S)
        x.ell(foot + np.array([0, 0.02 * S, 0]), (0.05 * S, 0.06 * S, 0.015 * S))
        x.pt('foot' + nm[3:], foot)
    n0 = c + Mb @ np.array([0, 0.38 * S, 0.04 * S])
    nk = pose.get('neck', (40, 0))
    n1 = n0 + 0.18 * S * sph(*nk)
    x.part = 'neck'; x.cap(n0, n1, 0.12 * S, 0.1 * S)
    hd = pose.get('head', (-15, 0))
    Mh = rz(-hd[1]) @ rx(-hd[0])
    hc = n1 + Mh @ np.array([0, 0.13 * S, 0.0])
    x.part = 'head'; x.ell(hc, (0.13 * S, 0.17 * S, 0.06 * S), Mh)
    jaw = pose.get('jaw', 4)
    Mj = Mh @ rx(jaw)
    x.ell(n1 + Mj @ np.array([0, 0.12 * S, -0.05 * S]), (0.12 * S, 0.15 * S, 0.035 * S), Mj)
    for s in (1, -1):
        for k in range(3):
            b = n1 + Mh @ np.array([s * 0.11 * S, (0.02 + 0.05 * k) * S, -0.03 * S])
            x.cap(b, b + Mh @ np.array([s * 0.03 * S, -0.01 * S, 0.0]), 0.012 * S, 0.004 * S, mat='dark')
    x.pt('mouth', n1 + Mh @ np.array([0, 0.29 * S, -0.03 * S]))
    if pose.get('throat'):
        x.part = 'neck'; x.ell(n1 + Mh @ np.array([0, 0.04 * S, -0.08 * S]), (0.1 * S, 0.11 * S, 0.06 * S), Mh)
    t0 = c + Mb @ np.array([0, -0.4 * S, 0.0])
    pts = curve(t0, Mb @ np.array([0, -1.0, -0.15]), 0.75 * S, pose.get('tail', 25), 8)
    x.part = 'tail'; chain(x, pts, 0.1 * S, 0.02 * S)
    x.pt('tailTip', pts[-1])
    x.part = 'body'
    return x


SAL_ACTIONS = {
    'idle': dict(),
    'breath': dict(rear=9, neck=(6, 0), head=(12, 0), jaw=46, throat=True, tail=10,
                   legFR=((-25, 70), (-80, 25)), legFL=((-25, -70), (-80, -25))),
    'tailLash': dict(tail=-95, neck=(25, -30), head=(-8, -25), legFR=((-12, 60), (-85, 10)), legBL=((-30, -60), (-80, -15))),
    'hit': dict(rear=20, neck=(68, 32), head=(38, 32), jaw=22, tail=70),
    'dead': dict(neck=(-8, 35), head=(-12, 35), jaw=14, tail=40, _roll=78,
                 legFR=((-30, 70), (-40, 40)), legFL=((-30, -70), (-40, -40)), legBR=((-30, 70), (-40, 40)), legBL=((-30, -70), (-40, -40))),
}


def treant(pose, S=3.4):
    """rigs.treant, tagged (trunk = body, crown = head)."""
    x = PXf()
    lean = pose.get('lean', 0)
    Mt = rx(lean)
    pel = np.array([0, 0, 0.28 * S])
    for side, th, nm in ((1, pose.get('rLeg', (-85, 8)), 'legR'), (-1, pose.get('lLeg', (-85, -8)), 'legL')):
        x.part = nm
        hip = pel + np.array([side * 0.07 * S, 0, 0])
        foot = hip + 0.28 * S * sph(*th)
        x.cap(hip, foot, 0.06 * S, 0.05 * S)
        for a in (-40, 0, 40):
            x.cap(foot, foot + 0.07 * S * sph(-20, a + side * 10), 0.03 * S, 0.01 * S, mat='dark')
        x.pt('foot' + nm[3:], foot)
    top = pel + Mt @ np.array([0, 0, 0.55 * S])
    x.part = 'body'; x.cap(pel, top, 0.12 * S, 0.095 * S)
    x.part = 'head'; x.ell(top + Mt @ np.array([0, 0.08 * S, -0.1 * S]), (0.06 * S, 0.03 * S, 0.035 * S), Mt, mat='dark')
    for side, ua, fa, nm in ((1, pose.get('rUA', (-60, 30)), pose.get('rFA', (-75, 20)), 'armR'), (-1, pose.get('lUA', (-60, -30)), pose.get('lFA', (-75, -20)), 'armL')):
        x.part = nm
        s0 = top + Mt @ np.array([side * 0.1 * S, 0, -0.06 * S])
        el = s0 + 0.24 * S * (Mt @ sph(*ua))
        ha = el + 0.24 * S * (Mt @ sph(*fa))
        x.cap(s0, el, 0.05 * S, 0.04 * S); x.cap(el, ha, 0.04 * S, 0.025 * S)
        for a in (-30, 0, 30):
            x.cap(ha, ha + 0.06 * S * (Mt @ sph(fa[0] + a * 0.5, fa[1] + a)), 0.012 * S, 0.004 * S, mat='dark')
        x.pt('hand' + nm[3:], ha)
    x.part = 'head'
    for i in range(7):
        a = -150 + i * 50
        b = top + Mt @ np.array([0.05 * S * np.sin(np.radians(a)), 0.04 * S * np.cos(np.radians(a)), 0.02 * S])
        x.cap(b, b + Mt @ (0.12 * S * sph(55 + (i % 2) * 15, a)), 0.022 * S, 0.008 * S, mat='dark')
        x.ell(b + Mt @ (0.12 * S * sph(55 + (i % 2) * 15, a)), (0.03 * S, 0.03 * S, 0.02 * S), mat='zone')
    x.part = 'body'
    return x


TREANT_ACTIONS = {
    'idle': dict(),
    'windup': dict(lean=-8, rUA=(60, 30), rFA=(80, 10), lUA=(55, -30), lFA=(80, -10)),
    'slam': dict(lean=20, rUA=(-15, 20), rFA=(-72, 10), lUA=(-20, -20), lFA=(-72, -10), rLeg=(-70, 8), lLeg=(-100, -8)),
    'hit': dict(lean=-14, rUA=(-30, 70), rFA=(-20, 90), lUA=(-40, -60), lFA=(-30, -80), rLeg=(-98, 8)),
    'dead': dict(_pitch=-86, rUA=(0, 80), lUA=(-10, -70)),
}


# ---------------------------------------------------------------- the Great Wyrm (rigs.wyrm, tagged)
def wyrm(pose, S=6.0):
    x = PXf()
    rear = pose.get('rear', 0); air = pose.get('air', 0)
    c = np.array([0, 0, 0.3 * S + air])
    Mb = rx(-rear)
    x.part = 'body'; x.ell(c, (0.22 * S, 0.5 * S, 0.2 * S), Mb)
    legs = pose.get('legs', 'stand')
    for fy, sx in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        nm = 'leg' + ('F' if fy > 0 else 'B') + ('R' if sx > 0 else 'L')
        x.part = nm
        top = c + Mb @ np.array([sx * 0.17 * S, fy * 0.3 * S, -0.08 * S])
        if legs == 'tuck':
            knee = top + 0.15 * S * sph(-30, 180); foot = knee + 0.12 * S * sph(10, 180)
        elif legs == 'sprawl':
            knee = top + 0.15 * S * sph(-20, sx * 80); foot = knee + 0.15 * S * sph(-30, sx * 60)
        else:
            knee = top + 0.16 * S * sph(-70, sx * 15 + (20 if fy > 0 else -20)); foot = knee + 0.16 * S * sph(-95, 0)
        x.cap(top, knee, 0.07 * S, 0.05 * S); x.cap(knee, foot, 0.05 * S, 0.035 * S)
        x.pt('foot' + nm[3:], foot)
    nk = pose.get('neck', (35, 0, 0))
    n0 = c + Mb @ np.array([0, 0.45 * S, 0.08 * S])
    pts = curve(n0, Mb @ sph(nk[0], nk[1]), 0.55 * S, nk[2], 8, lift=pose.get('neckLift', -30))
    x.part = 'neck'; chain(x, pts, 0.11 * S, 0.06 * S)
    hd = pose.get('head', (-15, 0))
    Mh = rz(-hd[1]) @ rx(-hd[0])
    hpos = pts[-1]
    x.part = 'head'; x.ell(hpos + Mh @ np.array([0, 0.09 * S, 0]), (0.075 * S, 0.14 * S, 0.06 * S), Mh)
    jaw = pose.get('jaw', 5)
    Mj = Mh @ rx(jaw)
    x.ell(hpos + Mj @ np.array([0, 0.09 * S, -0.045 * S]), (0.06 * S, 0.12 * S, 0.025 * S), Mj)
    for s in (1, -1):
        x.cap(hpos + Mh @ np.array([s * 0.04 * S, 0.02 * S, 0.04 * S]), hpos + Mh @ np.array([s * 0.07 * S, -0.12 * S, 0.1 * S]), 0.018 * S, 0.004 * S, mat='dark')
    x.pt('mouth', hpos + Mh @ np.array([0, 0.22 * S, -0.02 * S]))
    t0 = c + Mb @ np.array([0, -0.48 * S, 0.02 * S])
    tp_ = curve(t0, Mb @ np.array([0, -1.0, -0.25]), 1.1 * S, pose.get('tail', 40), 10)
    x.part = 'tail'; chain(x, tp_, 0.12 * S, 0.015 * S)
    wing = pose.get('wing', (40, 30))
    for sx in (1, -1):
        x.part = 'wingR' if sx > 0 else 'wingL'
        root = c + Mb @ np.array([sx * 0.15 * S, 0.22 * S, 0.14 * S])
        wrist = root + 0.45 * S * sph(wing[0], sx * (90 - wing[1]))
        x.cap(root, wrist, 0.04 * S, 0.025 * S)
        tips = []
        for k, (de, da) in enumerate(((15, -10), (-10, 25), (-35, 55))):
            tip = wrist + (0.55 - 0.08 * k) * S * sph(wing[0] - 30 + de, sx * (90 + da - wing[1] * 0.4))
            x.cap(wrist, tip, 0.018 * S, 0.006 * S, mat='dark'); tips.append(tip)
        x.tri(root, wrist, tips[0], 0.006 * S, mat='zone'); x.tri(wrist, tips[0], tips[1], 0.006 * S, mat='zone')
        x.tri(wrist, tips[1], tips[2], 0.006 * S, mat='zone'); x.tri(root, tips[2], root + Mb @ np.array([0, -0.35 * S, 0]), 0.006 * S, mat='zone')
    x.part = 'body'
    return x


GREATWYRM_ACTIONS = {
    'idle': dict(wing=(55, -25), neck=(88, 0, 0), neckLift=-28, head=(-12, 0), tail=210),
    'breath': dict(rear=20, wing=(64, -6), neck=(14, 0, 0), neckLift=-2, head=(-2, 0), jaw=40, tail=200),
    'flight': dict(air=1.6, legs='tuck', wing=(68, 5), neck=(30, 0, 0), neckLift=-18, head=(-8, 0), tail=20),
    'dead': dict(legs='sprawl', wing=(-8, 15), neck=(-8, 35, 40), neckLift=-6, head=(-5, 40), jaw=16, tail=80),
}


# ---------------------------------------------------------------- the Elder Wyrm (gd_rigs.elderWyrm, posed)
def elderWyrm(pose):
    x = PXf()
    S = 6.0
    rear = pose.get('rear', 0)
    c = np.array([0, 0, 0.13 * S])
    piv = c + np.array([0, -0.3 * S, -0.1 * S])  # rears up about the hind hips
    Mb = rx(-rear)
    P = lambda v: piv + Mb @ (np.asarray(v, float) - piv)
    x.part = 'body'
    x.ell(P(c), (0.2 * S, 0.5 * S, 0.14 * S), Mb, mat='hide')
    x.ell(P(c + np.array([0, 0.0, 0.11 * S])), (0.15 * S, 0.44 * S, 0.05 * S), Mb, mat='zone')
    legs = pose.get('legs', {})
    for fy, sx in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        nm = 'leg' + ('F' if fy > 0 else 'B') + ('R' if sx > 0 else 'L')
        x.part = nm
        top = P(np.array([sx * 0.15 * S, fy * 0.3 * S, c[2] - 0.03 * S]))
        th, sh = legs.get(nm, ((-12, sx * 80), (-85, sx * 15)))
        knee = top + 0.14 * S * sph(*th)
        foot = knee + 0.14 * S * sph(*sh)
        x.cap(top, knee, 0.075 * S, 0.06 * S, mat='hide'); x.cap(knee, foot, 0.06 * S, 0.05 * S, mat='hide')
        x.ell(foot + np.array([0, 0.02 * S, 0]), (0.055 * S, 0.065 * S, 0.016 * S), mat='hide')
        x.pt('foot' + nm[3:], foot)
    n0 = P(c + np.array([0, 0.45 * S, 0.03 * S]))
    nk = pose.get('neck', (22, 0))
    n1 = n0 + pose.get('neckLen', 0.2) * S * sph(nk[0] + rear * 0.5, nk[1])
    x.part = 'neck'
    x.cap(n0, n1, 0.12 * S, 0.1 * S, mat='hide')
    x.ell(n0 + (n1 - n0) * 0.5 + np.array([0, 0, 0.08 * S]), (0.08 * S, 0.12 * S, 0.03 * S), mat='zone')
    hd = pose.get('head', (8, 0))
    Mh = rz(-hd[1]) @ rx(hd[0])
    x.part = 'head'
    x.ell(n1 + Mh @ np.array([0, 0.14 * S, 0.0]), (0.12 * S, 0.18 * S, 0.065 * S), Mh, mat='hide')
    jaw = pose.get('jaw', 0)
    Mj = Mh @ rx(jaw)
    x.ell(n1 + Mj @ np.array([0, 0.13 * S, -0.055 * S]), (0.11 * S, 0.16 * S, 0.035 * S), Mj, mat='hide')
    for i in range(7):
        a = np.radians(-150 + i * 50)
        b = n1 + Mh @ np.array([0.08 * S * np.sin(a), 0.05 * S * np.cos(a) + 0.02 * S, 0.04 * S])
        x.cap(b, b + Mh @ (0.12 * S * sph(45, np.degrees(a) * 0.4 + 180)), 0.014 * S, 0.003 * S, mat='dark')
    x.pt('mouth', n1 + Mh @ np.array([0, 0.31 * S, -0.04 * S]))
    t0 = P(c + np.array([0, -0.48 * S, 0.0]))
    pts = curve(t0, np.array([0.15, -1.0, -0.04]) if not rear else Mb @ np.array([0.1, -1.0, -0.5]), 0.95 * S, pose.get('tail', 55), 9)
    x.part = 'tail'
    chain(x, pts, 0.11 * S, 0.035 * S, mat='hide')
    chain(x, [p + np.array([0, 0, 0.05 * S * (1 - i / 9) + 0.03 * S]) for i, p in enumerate(pts[:5])], 0.07 * S, 0.035 * S, mat='zone')
    x.ell(pts[-1], (0.075 * S, 0.09 * S, 0.06 * S), mat='dark')
    x.part = 'body'
    return x


ELDERWYRM_ACTIONS = {
    'idle': dict(),
    'bite': dict(neck=(-10, 0), neckLen=0.34, head=(-18, 0), jaw=-42, tail=35, legs={'legFR': ((-20, 60), (-80, 30)), 'legFL': ((-20, -60), (-80, -30))}),
    'trample': dict(rear=34, neck=(30, 0), head=(18, 0), jaw=-20, tail=30,
                    legs={'legFR': ((10, 40), (-40, 30)), 'legFL': ((20, -40), (-30, -30)), 'legBR': ((-40, 70), (-90, 20)), 'legBL': ((-40, -70), (-90, -20))}),
    'dead': dict(neck=(-10, 30), head=(-4, 35), jaw=-14, tail=75, _roll=76,
                 legs={k: ((-30, 70 * (1 if k.endswith('R') else -1)), (-40, 40 * (1 if k.endswith('R') else -1))) for k in ('legFR', 'legFL', 'legBR', 'legBL')}),
}


# ---------------------------------------------------------------- the Primordial (gd_rigs.primordial, posed)
def primordial(pose):
    x = PXf()
    rear = pose.get('rear', 0)
    c = np.array([0, 0, 0.62])
    piv = c + np.array([0, -0.38, -0.74])  # rears about the hind feet
    Mb = rx(-rear)
    P = lambda v: piv + Mb @ (np.asarray(v, float) - piv)
    x.part = 'body'
    x.ell(P(c), (0.32, 0.62, 0.36), Mb, mat='hide')
    x.ell(P(c + np.array([0, 0.22, 0.2])), (0.3, 0.32, 0.3), Mb, mat='hide')
    x.ell(P(c + np.array([0, 0.12, 0.42])), (0.25, 0.42, 0.13), Mb, mat='zone')
    x.ell(P(c + np.array([0, -0.32, 0.27])), (0.2, 0.25, 0.08), Mb, mat='zone')
    legs = pose.get('legs', {})
    for fy, sx in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        nm = 'leg' + ('F' if fy > 0 else 'B') + ('R' if sx > 0 else 'L')
        x.part = nm
        top = P(c + np.array([sx * 0.2, fy * 0.38, -0.12]))
        d = np.array(legs.get(nm, (sx * 0.02, 0, -0.62)), float)
        end = top + d
        x.cap(top, end, 0.13, 0.1, mat='hide')
        x.ell(end + np.array([0, 0.03, -0.02]), (0.11, 0.13, 0.05), mat='dark')
        x.pt('foot' + nm[3:], end)
    hdrop = pose.get('headDrop', 0.0); hfwd = pose.get('headFwd', 0.0); hturn = pose.get('headTurn', 0.0)
    n0 = P(c + np.array([0, 0.55, 0.05]))
    hd = n0 + Mb @ np.array([0, 0.28 + hfwd, -0.12 - hdrop]) + np.array([hturn, 0, 0])
    x.part = 'neck'; x.cap(n0, hd, 0.24, 0.17, mat='hide')
    x.part = 'head'
    x.ell(hd + np.array([0, 0.08, -0.06]), (0.16, 0.2, 0.17), rx(-25 - pose.get('headPitch', 0)), mat='hide')
    x.ell(hd + np.array([0, 0.03, -0.22]), (0.09, 0.08, 0.1), mat='dark')
    for s in (1, -1):
        pts = [hd + np.array([s * 0.12, 0.02, 0.1])]
        for i in range(8):
            a = np.radians(i * 40)
            pts.append(hd + np.array([s * (0.2 + 0.03 * i), 0.02 - 0.13 * np.sin(a), 0.06 + 0.13 * np.cos(a)]))
        chain(x, pts, 0.075, 0.03, mat='dark')
    x.pt('mouth', hd + np.array([0, 0.24, -0.14]))
    x.pt('tip', hd + np.array([0, 0.2, 0.05]))  # the horns' forward point (the crushing blow)
    t0 = P(c + np.array([0, -0.6, 0.12]))
    t1 = t0 + Mb @ np.array([0.05 + pose.get('tailSwing', 0), -0.2, -0.12])
    x.part = 'tail'; x.cap(t0, t1, 0.07, 0.05, mat='hide'); x.ell(t1 + np.array([0.02, -0.08, -0.03]), (0.11, 0.12, 0.1), mat='dark')
    x.part = 'body'
    return x


PRIMORDIAL_ACTIONS = {
    'idle': dict(),
    'bite': dict(rear=-7, headDrop=0.3, headFwd=0.26, headPitch=38, legs={'legFR': (0.12, 0.3, -0.52), 'legFL': (-0.12, 0.26, -0.54), 'legBR': (0.04, -0.2, -0.6), 'legBL': (-0.04, -0.22, -0.6)}),
    'trample': dict(rear=40, headDrop=-0.08, headPitch=-20, legs={'legFR': (0.04, 0.4, -0.22), 'legFL': (-0.04, 0.3, -0.3), 'legBR': (0.03, 0.08, -0.62), 'legBL': (-0.03, 0.06, -0.62)}),
    'dead': dict(_roll=82, headDrop=0.05, headTurn=0.1, legs={'legFR': (0.4, 0.15, -0.45), 'legFL': (-0.1, 0.2, -0.55), 'legBR': (0.4, -0.1, -0.45), 'legBL': (-0.1, -0.15, -0.55)}),
}


# ---------------------------------------------------------------- the Wild Spirit (gd_rigs.wildSpirit, posed)
def wildSpirit(pose):
    x = PXf()
    lift = pose.get('lift', 0.0); pitch = pose.get('pitch', 0.0)
    c = np.array([0, 0, 0.58 + lift])
    Mb = rx(-pitch)
    x.part = 'body'; x.ell(c, (0.15, 0.38, 0.17), Mb, mat='hide')
    legs = pose.get('legs', {(1, 1): (-90, -90), (1, -1): (-90, -90), (-1, 1): (-92, -88), (-1, -1): (-88, -92)})
    for (fy, sx), (t, sh) in legs.items():
        nm = 'leg' + ('F' if fy > 0 else 'B') + ('R' if sx > 0 else 'L')
        x.part = nm
        top = c + Mb @ np.array([sx * 0.08, fy * 0.26, -0.08])
        knee = top + 0.25 * sph(t, 0)
        foot = knee + 0.26 * sph(sh, 0)
        x.cap(top, knee, 0.055, 0.03, mat='hide'); x.cap(knee, foot, 0.028, 0.02, mat='hide')
        x.pt('foot' + nm[3:], foot)
    n0 = c + Mb @ np.array([0, 0.3, 0.08])
    n1 = n0 + 0.36 * sph(*pose.get('neck', (62, 0)))
    x.part = 'neck'; x.cap(n0, n1, 0.075, 0.05, mat='hide'); x.ell(n0 + (n1 - n0) * 0.35, (0.13, 0.12, 0.14), mat='zone')
    hdir = sph(*pose.get('head', (-35, 0)))
    h1 = n1 + 0.2 * hdir
    x.part = 'head'; x.cap(n1, h1, 0.055, 0.025, mat='hide')
    tilt = pose.get('antler', 0.0)
    Ma = rx(-tilt)
    for s in (1, -1):
        x.cap(n1 + np.array([s * 0.04, -0.01, 0.03]), n1 + np.array([s * 0.07, -0.03, 0.09]), 0.016, 0.004, mat='hide')
        b = n1 + np.array([s * 0.03, -0.01, 0.05])
        t = b + Ma @ np.array([s * 0.12, -0.06, 0.32])
        x.cap(b, t, 0.012, 0.006, mat='dark')
        for f in range(3):
            q = b + (t - b) * (0.3 + 0.25 * f)
            x.cap(q, q + Ma @ np.array([s * 0.05, 0.05, 0.08]), 0.008, 0.003, mat='dark')
    x.pt('mouth', h1)
    x.pt('tip', n1 + Ma @ np.array([0, 0.1, 0.25]))
    t0 = c + Mb @ np.array([0, -0.35, 0.06])
    x.part = 'tail'; x.cap(t0, t0 + Mb @ np.array([0, -0.08, 0.03]), 0.03, 0.01, mat='hide')
    x.part = 'body'
    return x


WILDSPIRIT_ACTIONS = {
    'idle': dict(),  # the back's square stance (stage C fix 5); the front lifts the right forefoot (set in build)
    'leap': dict(lift=0.22, pitch=8, neck=(45, 0), head=(-20, 0),
                 legs={(1, 1): (-20, -60), (1, -1): (-25, -70), (-1, 1): (-150, -170), (-1, -1): (-145, -165)}),
    'rake': dict(lift=0.06, pitch=-14, neck=(30, 0), head=(-55, 0), antler=40,
                 legs={(1, 1): (-10, -100), (1, -1): (-40, -110), (-1, 1): (-100, -80), (-1, -1): (-96, -84)}),
    'hit': dict(pitch=-10, neck=(78, 0), head=(0, 0), legs={(1, 1): (-75, -100), (1, -1): (-90, -90), (-1, 1): (-112, -95), (-1, -1): (-105, -90)}),
    'dissolving': dict(lift=-0.22, pitch=6, neck=(25, 0), head=(-70, 0),
                       legs={(1, 1): (-150, -30), (1, -1): (-160, -20), (-1, 1): (-170, -20), (-1, -1): (-165, -25)}),
}


# ---------------------------------------------------------------- the Ash Phoenix (gd_rigs.ashPhoenix, posed)
def ashPhoenix(pose):
    x = PXf()
    air = pose.get('air', 0.0)
    c = np.array([0, 0, 0.75 + air])
    lean = pose.get('lean', 18)
    Mb = rx(lean)
    x.part = 'body'; x.ell(c, (0.17, 0.2, 0.3), Mb, mat='coal')
    legs = pose.get('legs', 'stand')
    for s in (1, -1):
        x.part = 'legs'
        hip = c + Mb @ np.array([s * 0.08, -0.02, -0.22])
        if legs == 'stand':
            foot = hip + np.array([s * 0.02, 0.03, -0.5])
        elif legs == 'rake':
            foot = hip + np.array([s * 0.05, 0.42, -0.2])
        elif legs == 'trail':
            foot = hip + Mb @ np.array([s * 0.02, -0.15, -0.4])
        else:  # limp
            foot = hip + np.array([s * 0.1, 0.1, -0.35])
        x.cap(hip, foot, 0.04, 0.02, mat='dark')
        for a in (-30, 0, 30):
            x.cap(foot, foot + 0.09 * sph(-10 if legs != 'rake' else 20, a), 0.012, 0.004, mat='gold')
        x.pt('talon' + ('R' if s > 0 else 'L'), foot)
    nk = c + Mb @ np.array([0, 0.06, 0.3])
    hd = nk + np.array([0, 0.06 + pose.get('headFwd', 0), 0.14 - pose.get('headDrop', 0)])
    x.part = 'head'
    x.cap(nk, hd, 0.09, 0.07, mat='coal'); x.ell(hd, (0.075, 0.09, 0.075), mat='coal')
    x.cap(hd + np.array([0, 0.07, -0.01]), hd + np.array([0, 0.16, -0.06]), 0.028, 0.006, mat='gold')
    for i in range(5):
        x.cap(hd + np.array([0, -0.02, 0.05]), hd + np.array([0.03 * (i - 2), -0.1 - 0.02 * i, 0.22 + 0.02 * (i % 2)]), 0.014, 0.004, mat='coal')
    x.pt('mouth', hd + np.array([0, 0.16, -0.06]))
    wE, wW = pose.get('wing', (35, 62))  # elbow and wrist elevations (the idle: raised high and fanned)
    fold = pose.get('fold', 0.0)
    for s in (1, -1):
        x.part = 'wingR' if s > 0 else 'wingL'
        root = c + Mb @ np.array([s * 0.13, 0.0, 0.18])
        elbow = root + 0.3 * sph(wE, s * (82 + fold * 60))
        wrist = elbow + 0.32 * sph(wW, s * (86 + fold * 80))
        x.cap(root, elbow, 0.05, 0.035, mat='coal'); x.cap(elbow, wrist, 0.035, 0.025, mat='coal')
        x.tri(root, elbow, root + 0.3 * sph(-40, s * 100), 0.02, mat='coal')
        prim = [wrist + (0.5 - 0.03 * k) * (1 - 0.4 * fold) * sph(wW + 18 - 14 * k, s * (88 + 5 * k + fold * 70)) for k in range(5)]
        sec = [elbow + (elbow - root) * 0.1 + 0.48 * (1 - 0.3 * fold) * sph(wE - 40 - 12 * k, s * (92 + 4 * k + fold * 60)) for k in range(4)]
        fan = prim + [wrist + 0.45 * sph(wW - 62, s * 95)] + sec
        for k in range(len(fan) - 1):
            a0 = wrist if k < len(prim) else elbow
            x.tri(a0, fan[k], fan[k + 1], 0.012, mat='zone')
        x.tri(wrist, elbow, fan[len(prim)], 0.012, mat='zone')
        x.tri(elbow, root, sec[-1], 0.012, mat='zone')
    x.part = 'tail'
    for i in range(5):
        a = -20 + 10 * i
        t0 = c + Mb @ np.array([0, -0.15, -0.2])
        x.cap(t0, t0 + 0.85 * sph(pose.get('tailElev', -70), 180 + a), 0.03, 0.01, mat='coal')
    x.part = 'body'
    return x


PHOENIX_ACTIONS = {
    'idle': dict(),
    'glide': dict(air=1.0, lean=72, wing=(5, 0), tailElev=-12, headFwd=0.06, headDrop=0.08, legs='trail'),
    'wingsUp': dict(air=1.0, lean=60, wing=(48, 70), tailElev=-20, headFwd=0.04, headDrop=0.06, legs='trail'),
    'wingsDown': dict(air=1.0, lean=60, wing=(-35, -55), tailElev=-20, headFwd=0.04, headDrop=0.06, legs='trail'),
    'rake': dict(air=0.55, lean=-12, wing=(30, 45), tailElev=-55, legs='rake'),
    'hit': dict(air=0.8, lean=-20, wing=(20, 10), tailElev=-60, headDrop=-0.02, legs='limp'),
    'dive': dict(air=1.1, lean=110, wing=(10, -10), fold=0.7, tailElev=10, headFwd=0.08, headDrop=0.12, legs='trail'),
    'burnOutA': dict(air=0.6, lean=50, wing=(-20, -60), fold=0.35, tailElev=-30, headDrop=0.2, legs='limp', _roll=25),
    'burnOutB': dict(lean=88, wing=(-15, -20), tailElev=-5, headDrop=0.25, headFwd=0.1, legs='limp', _roll=12),
}


# ---------------------------------------------------------------- the World Tree (gd_rigs.worldTree, posed)
def worldTree(pose):
    x = PXf()
    lean = pose.get('lean', 0.0)
    Mt = rx(lean)
    pts = [np.array([0, 0, 0.0])]
    for i in range(6):
        pts.append(pts[-1] + np.array([0.06 * np.sin(i * 1.3), 0.04 * np.cos(i * 1.1), 0.5]))
    base = np.array([0, 0, 0.3])
    pts = [p if p[2] <= base[2] else base + Mt @ (p - base) for p in pts]
    x.part = 'trunk'; chain(x, pts, 0.62, 0.36, mat='bark')
    x.part = 'roots'
    for a in range(0, 360, 45):
        d = sph(-25, a + 10)
        x.cap(np.array([0, 0, 0.45]), np.array([0, 0, 0.45]) + 1.25 * d, 0.3, 0.06, mat='bark')
    top = pts[-1]
    x.part = 'boughs'
    lash = pose.get('lash', 0.0)
    for a in (-50, 10, 70, 130, 200, 260):
        el = 35 + (lash if a in (-50, 10, 70) else lash * 0.3)
        x.cap(top - Mt @ np.array([0, 0, 0.4]), top + 0.9 * (Mt @ sph(el, a)), 0.14, 0.07, mat='bark')
    x.part = 'canopy'
    x.ell(top + Mt @ np.array([0, 0, 1.0]), (2.05, 1.9, 1.15), Mt, mat='zone')
    x.ell(top + Mt @ np.array([0, 0, 0.4]), (1.85, 1.7, 0.55), Mt, mat='zone')
    for i, a in enumerate(pose.get('swingBoughs', [])):  # great boughs swung out of the canopy (windup and slam)
        x.part = 'boughs'
        b0 = top + Mt @ np.array([0, 0, 0.2])
        b1 = b0 + 2.4 * (Mt @ sph(*a))
        x.cap(b0, b1, 0.22, 0.08, mat='bark')
        x.part = 'canopy'; x.ell(b1, (0.55, 0.55, 0.4), mat='zone')
        x.pt('bough%d' % i, b1)
    x.part = 'trunk'
    return x


WORLDTREE_ACTIONS = {
    'idle': dict(),
    'windup': dict(lean=-10, swingBoughs=[(55, 150), (60, 210)]),
    'slam': dict(lean=12, swingBoughs=[(-40, 20), (-45, -25)]),
    'dead': dict(_pitch=-84, lean=0),
}


# ---------------------------------------------------------------- idols, shattered
def _glyphs(x, cx, w, z0, z1, face_y, rows):
    for r in range(rows):
        z = z0 + (z1 - z0) * (r + 0.5) / rows
        for fy in (1, -1):
            x.box((cx, fy * face_y, z), (w * 0.38, 0.012, 0.045), None, 0.004, mat='zone')


def livingMonolith(pose):
    x = PXf()
    W, D, Hs = 1.25, 0.4, 2.7
    shattered = pose.get('shattered')
    x.part = 'base'
    x.ell((0.05, 0.0, 0.05), (1.05, 0.8, 0.26), mat='bark')
    for a in range(0, 360, 30):
        d = sph(-12, a)
        x.cap(np.array([0.0, 0.0, 0.45]) + d * np.array([0.45, 0.17, 0]), np.array([0, 0, 0.3]) + 1.1 * d, 0.08, 0.025, mat='bark')
    for i, a in enumerate(range(10, 360, 45)):
        x.ell(0.85 * sph(0, a) + np.array([0, 0, 0.12]), (0.12, 0.1, 0.08), mat='stone')
    x.part = 'slab'
    if not shattered:
        x.box((0, 0, 0.12 + Hs / 2), (W / 2, D / 2, Hs / 2), None, 0.03, mat='stone')
        x.box((0.22, 0, 0.12 + Hs + 0.02), (0.25, D / 2, 0.08), ry(18), 0.02, mat='stone')
        _glyphs(x, 0.0, W, 0.75, 2.45, D / 2 + 0.003, 6)
    else:  # broken across at a third of its height; the upper part lies in three chunks on the mound
        h0 = 0.95
        x.box((0, 0, 0.12 + h0 / 2), (W / 2, D / 2, h0 / 2), None, 0.03, mat='stone')
        for k, (c, half, rot) in enumerate((((0.55, -0.6, 0.35), (0.55, 0.2, 0.42), rz(25) @ ry(80)), (((-0.7, 0.4, 0.3), (0.45, 0.2, 0.35), rz(-35) @ ry(-75))),
                                            ((0.1, 0.85, 0.22), (0.3, 0.18, 0.22), rz(60) @ rx(70)))):
            x.part = 'chunk%d' % k
            x.box(c, half, rot, 0.03, mat='stone')
        x.part = 'slab'
        _glyphs(x, 0.0, W, 0.4, 0.95, D / 2 + 0.003, 2)
    x.part = 'slab'
    return x


def cinderIdol(pose):
    x = PXf()
    W, D, Hs = 1.05, 0.68, 2.55
    x.part = 'base'
    x.box((0, 0, 0.12), (0.85, 0.7, 0.12), None, 0.02, mat='stone')
    x.box((0, 0, 0.3), (0.7, 0.55, 0.08), None, 0.02, mat='stone')
    x.box((0, 0.702, 0.12), (0.7, 0.006, 0.05), None, 0.004, mat='zone')
    x.box((0, -0.702, 0.12), (0.7, 0.006, 0.05), None, 0.004, mat='zone')
    x.part = 'slab'
    if not pose.get('shattered'):
        x.box((0, 0, 0.38 + Hs / 2), (W / 2, D / 2, Hs / 2), None, 0.03, mat='stone')
        x.disc((0, 0, 0.38 + Hs + 0.02), (0, 0, 1.0), 0.36, 0.05, mat='gold')
        x.ell((0, 0, 0.38 + Hs + 0.03), (0.3, 0.2, 0.04), mat='dark')
        fz = 0.38 + Hs * 0.78
        for s in (1, -1):
            x.ell((s * 0.17, D / 2, fz + 0.05), (0.08, 0.03, 0.05), mat='dark')
        x.ell((0, D / 2, fz - 0.25), (0.13, 0.03, 0.06), mat='dark')
        x.box((0, D / 2 + 0.01, fz - 0.08), (0.04, 0.02, 0.12), None, 0.01, mat='stone')
        _glyphs(x, 0.0, W, 0.6, 0.38 + Hs * 0.55, D / 2 + 0.003, 4)
    else:  # broken at mid height; the carved face lies fallen forward, the brazier toppled beside the plinth
        h0 = 1.15
        x.box((0, 0, 0.38 + h0 / 2), (W / 2, D / 2, h0 / 2), None, 0.03, mat='stone')
        _glyphs(x, 0.0, W, 0.6, 0.38 + h0, D / 2 + 0.003, 2)
        x.part = 'chunk0'
        x.box((0.1, 1.25, 0.3), (W / 2, 0.3, 0.55), rx(80) @ rz(10), 0.03, mat='stone')  # the face block, fallen forward
        x.part = 'chunk1'
        x.box((-0.95, -0.4, 0.25), (0.3, 0.3, 0.45), ry(70) @ rz(30), 0.03, mat='stone')
        x.part = 'chunk2'
        x.disc((0.95, -0.55, 0.12), (0.6, 0, 0.8), 0.36, 0.05, mat='gold')  # the toppled brazier rim
    x.part = 'slab'
    return x


# ======================================================================================== the body table
BODY = {
    'salamander': dict(rig=salamander, actions=SAL_ACTIONS, key='green', size=3),
    'treant': dict(rig=treant, actions=TREANT_ACTIONS, key='magenta', size=4),
    'greatWyrm': dict(rig=wyrm, actions=GREATWYRM_ACTIONS, key='green', size=6, norm=True),
    'elderWyrm': dict(rig=elderWyrm, actions=ELDERWYRM_ACTIONS, key='magenta', size=6),
    'primordial': dict(rig=primordial, actions=PRIMORDIAL_ACTIONS, key='green', size=6, norm=True),
    'wildSpirit': dict(rig=wildSpirit, actions=WILDSPIRIT_ACTIONS, key='magenta', size=2, norm=True),
    'ashPhoenix': dict(rig=ashPhoenix, actions=PHOENIX_ACTIONS, key='blue', size=3, norm=True),
    'worldTree': dict(rig=worldTree, actions=WORLDTREE_ACTIONS, key='magenta', size=6, norm=True),
    'livingMonolith': dict(rig=livingMonolith, actions={'idle': {}, 'shattered': dict(shattered=True)}, key='green', size=6, norm=True),
    'cinderIdol': dict(rig=cinderIdol, actions={'idle': {}, 'shattered': dict(shattered=True)}, key='blue', size=6, norm=True),
}
GOD_KEY = dict(titan='green', oracle='green', ascendedHero='green', pyreLord='green', emberHierophant='green', ashColossus='blue',
               hornedHunter='magenta', motherOfBeasts='magenta', giant='magenta')
FLIGHT = {('greatWyrm', 'flight'), ('ashPhoenix', 'glide'), ('ashPhoenix', 'wingsUp'), ('ashPhoenix', 'wingsDown'), ('ashPhoenix', 'rake'),
          ('ashPhoenix', 'hit'), ('ashPhoenix', 'dive'), ('ashPhoenix', 'burnOutA')}


def build(body, action, view):
    """(PXf at world scale, place kwargs, note). Humanoid gods and the Giant take one scale from their idle pose, so every
    action keeps the idle's size; the other bodies likewise (stage C's ladder normalisation, applied to the idle)."""
    if body in HUMANOIDS:
        spec = HUMANOIDS[body]
        if spec.get('scale'):
            s = spec['scale']
        else:
            xi, _ = god_humanoid(body, 'idle', view)
            s = LADDER[spec['ladder']] / zext(xi)
        x, note = god_humanoid(body, action, view)
        x = scaled(x, s)
        kw = dict(ground=True)
        if action == 'dead':
            kw.update(pitch_all=-86, pivot=tuple(np.array([0, -0.1, 0.0]) * s))
        if spec.get('float') and action not in ('dead', 'fall'):
            kw.update(offset=(0, 0, spec['float'] * s))
        return x, kw, note, s
    B = BODY[body]
    p = dict(B['actions'][action])
    pitch = p.pop('_pitch', 0.0); roll = p.pop('_roll', 0.0)
    if body == 'wildSpirit' and action == 'idle' and view == 'front':
        p['legs'] = {(1, 1): (-60, -150), (1, -1): (-90, -90), (-1, 1): (-92, -88), (-1, -1): (-88, -92)}
    x = B['rig'](p)
    s = 1.0
    if B.get('norm'):
        xi = B['rig'](dict(B['actions']['idle']))
        s = LADDER[B['size']] / zext(xi)
        x = scaled(x, s)
    kw = dict(pitch_all=pitch, roll_all=roll, ground=(body, action) not in FLIGHT)
    if not kw['ground']:
        kw['offset'] = (0, 0, 0)
    return x, kw, body, s
