# Posable clay rigs for the pose guides: humanoid (with gear), riders on a horse or a wolf, the
# salamander, the treant, the great wyrm, the fire sprite and the hornet. Angles in degrees.
# Local frame: x right, y forward, z up; the figure faces +y. facing=0 faces world +y (the near
# side seen from behind: the "back" view); facing=180 faces world -y (the "front" view).
import numpy as np
from sdf import Scene


def rz(a):
    a = np.radians(a); c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])


def rx(a):  # positive tips +z toward +y (lean forward)
    a = np.radians(a); c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, s], [0, -s, c]])


def ry(a):  # positive rolls +z toward +x (lean right)
    a = np.radians(a); c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def sph(elev, azim):
    e, a = np.radians(elev), np.radians(azim)
    return np.array([np.cos(e) * np.sin(a), np.cos(e) * np.cos(a), np.sin(e)])


class Xf:
    """Collects primitives in a local frame, then places them: rotate (M) and translate (T)."""

    def __init__(self):
        self.items = []

    def cap(self, a, b, ra, rb=None, mat='clay'): self.items.append(('cap', [a, b], (ra, rb), mat))
    def ell(self, c, radii, rot=None, mat='clay'): self.items.append(('ell', [c], (radii, rot), mat))
    def box(self, c, half, rot=None, rr=0.0, mat='clay'): self.items.append(('box', [c], (half, rot, rr), mat))
    def disc(self, c, normal, radius, thick, mat='clay'): self.items.append(('disc', [c], (normal, radius, thick), mat))
    def tri(self, a, b, c, thick, mat='clay'): self.items.append(('tri', [a, b, c], (thick,), mat))

    def pts(self):
        out = []
        for kind, ps, args, _ in self.items:
            r = {'cap': lambda: max(args[0], args[1] or args[0]), 'ell': lambda: max(args[0]), 'box': lambda: float(np.linalg.norm(args[0])),
                 'disc': lambda: args[1], 'tri': lambda: args[0]}[kind]()
            out += [(np.asarray(p, float), r) for p in ps]
        return out

    def emit(self, scene, M=np.eye(3), T=np.zeros(3)):
        tf = lambda p: M @ np.asarray(p, float) + T
        for kind, ps, args, mat in self.items:
            if kind == 'cap':
                scene.cap(tf(ps[0]), tf(ps[1]), args[0], args[1], mat)
            elif kind == 'ell':
                rot = M if args[1] is None else M @ args[1]
                scene.ell(tf(ps[0]), args[0], rot.astype(np.float32), mat)
            elif kind == 'box':
                rot = M if args[1] is None else M @ args[1]
                scene.box(tf(ps[0]), args[0], rot.astype(np.float32), args[2], mat)
            elif kind == 'disc':
                scene.disc(tf(ps[0]), M @ np.asarray(args[0], float), args[1], args[2], mat)
            elif kind == 'tri':
                scene.tri(tf(ps[0]), tf(ps[1]), tf(ps[2]), args[0], mat)


def place(x, scene, facing=0.0, pitch_all=0.0, roll_all=0.0, offset=(0, 0, 0), ground=True, pivot=(0, 0, 0)):
    """Rotate the local rig about pivot (pitch_all about x, roll_all about y), turn it to facing,
    drop it onto the ground (lowest point at z = 0) unless ground=False, and emit it."""
    M = rz(facing) @ ry(roll_all) @ rx(pitch_all)
    piv = np.asarray(pivot, float)
    T = piv - M @ piv
    if ground:
        lowest = min((M @ p + T)[2] - r for p, r in x.pts())
        T = T + np.array([0, 0, -lowest])
    T = T + np.asarray(offset, float)
    x.emit(scene, M, T)


# ------------------------------------------------------------------------------------------
# Humanoid. Heroic miniature proportions, about 6 heads tall (1.0 = feet to crown).
HUM = dict(hip=0.43, spine=0.29, neck=0.04, headR=0.098, sh=0.15, hipW=0.075, thigh=0.22, shin=0.22,
           ua=0.16, fa=0.15, limb=0.06, torsoW=0.165, torsoD=0.11)

STAND = dict(lean=0, twist=0, roll=0, head=(0, 0),
             rUA=(-80, 12), rFA=(-60, 5), lUA=(-80, -12), lFA=(-55, -5),
             rTh=(-88, 4), rSh=(-90, 4), lTh=(-88, -4), lSh=(-90, -4), w=(70, 15), crouch=0)


def humanoid(gear, pose, zones=True):
    """gear: dict(weapon, shield, helm, cape, quiver, robe, banner, bulk). Returns an Xf in local space,
    feet near z = 0 (exact grounding is done by place)."""
    p = dict(STAND); p.update(pose)
    H = dict(HUM)
    bulk = gear.get('bulk', 1.0)
    x = Xf()
    zm = 'zone' if zones else 'clay'
    # legs (pelvis frame = body facing)
    pel = np.array([0, 0, H['hip'] - p['crouch']])
    feet = []
    for side, th, sh in ((1, p['rTh'], p['rSh']), (-1, p['lTh'], p['lSh'])):
        hip = pel + np.array([side * H['hipW'], 0, 0])
        knee = hip + H['thigh'] * sph(*th)
        foot = knee + H['shin'] * sph(*sh)
        if not gear.get('robe'):
            x.cap(hip, knee, H['limb'] * 1.25 * bulk, H['limb'] * 1.05 * bulk)
            x.cap(knee, foot, H['limb'] * 1.05 * bulk, H['limb'] * 0.85)
        x.ell(foot + np.array([0, 0.035, 0.01]), (0.035, 0.06, 0.03), mat='dark')
        feet.append(foot)
    # torso frame
    Mt = rz(p['twist']) @ ry(p['roll']) @ rx(p['lean'])
    chest = pel + Mt @ np.array([0, 0, H['spine']])
    tw = H['torsoW'] * bulk
    tab = zm if gear.get('tabard') else 'clay'  # a cloth tabard: the side colour seen from the front and the back
    x.ell((pel + chest) / 2 + Mt @ np.array([0, 0, 0.02]), (tw, H['torsoD'] * bulk, H['spine'] * 0.62), Mt, mat=tab)
    x.ell(pel + np.array([0, 0, 0.03]), (tw * 0.85, H['torsoD'] * 0.95, 0.07), mat=tab)
    if gear.get('tabard') and not gear.get('robe'):  # its skirt to mid-thigh
        x.cap(pel + np.array([0, 0, 0.02]), pel + np.array([0, 0, -0.16]), tw * 0.82, tw * 0.95, mat=zm)
    if gear.get('robe'):  # a robe skirt to the ground: a round cone
        hem = np.array([0, 0.01, 0.03])
        x.cap(pel + np.array([0, 0, 0.05]), hem, 0.11, 0.17, mat='zone2' if zones else 'clay')
    # head
    neck = chest + Mt @ np.array([0, 0, H['neck']])
    Mh = Mt @ rx(p['head'][0]) @ rz(p['head'][1])
    head = neck + Mh @ np.array([0, 0.005, H['headR'] * 1.05])
    x.ell(head, (H['headR'], H['headR'] * 1.02, H['headR'] * 1.1), Mh, mat='skin')
    x.cap(head + Mh @ np.array([0, H['headR'] * 0.8, -0.005]), head + Mh @ np.array([0, H['headR'] * 1.15, -0.02]), 0.022, 0.014, mat='skin')
    helm = gear.get('helm')
    if helm in ('crest', 'horned', 'antler', 'leaf', 'spiked', 'kettle'):
        x.ell(head + Mh @ np.array([0, -0.005, 0.03]), (H['headR'] * 1.12, H['headR'] * 1.12, H['headR'] * 0.85), Mh, mat='dark')
    if helm == 'crest':
        x.ell(head + Mh @ np.array([0, -0.01, 0.105]), (0.022, H['headR'] * 1.15, 0.04), Mh, mat=zm)
    if helm == 'leaf':
        x.ell(head + Mh @ np.array([0, 0.0, 0.10]), (0.06, 0.08, 0.025), Mh, mat=zm)
    if helm == 'horned':
        for s in (1, -1):
            x.cap(head + Mh @ np.array([s * 0.08, 0, 0.05]), head + Mh @ np.array([s * 0.15, 0.04, 0.12]), 0.022, 0.008, mat='dark')
    if helm == 'antler':
        for s in (1, -1):
            b = head + Mh @ np.array([s * 0.05, 0, 0.08])
            t = b + Mh @ np.array([s * 0.07, -0.02, 0.12])
            x.cap(b, t, 0.012, 0.007, mat='dark'); x.cap((b + t) / 2, (b + t) / 2 + Mh @ np.array([s * 0.05, 0.02, 0.03]), 0.008, 0.005, mat='dark')
    if helm in ('hood', 'cowl'):
        x.ell(head + Mh @ np.array([0, -0.02, 0.01]), (H['headR'] * 1.25, H['headR'] * 1.3, H['headR'] * 1.25), Mh, mat=zm)
        if helm == 'cowl':
            x.cap(head + Mh @ np.array([0, -0.02, 0.06]), head + Mh @ np.array([0, -0.04, 0.24]), 0.07, 0.01, mat=zm)
    if helm == 'circlet' or helm == 'wreath':
        x.disc(head + Mh @ np.array([0, 0, 0.045]), Mh @ np.array([0, 0, 1.0]), H['headR'] * 1.08, 0.012, mat='dark' if helm == 'circlet' else zm)
    if helm == 'band':
        x.disc(head + Mh @ np.array([0, 0, 0.03]), Mh @ np.array([0, 0, 1.0]), H['headR'] * 1.06, 0.016, mat=zm)
    if helm == 'wild':
        for i in range(6):
            a = -60 + i * 24
            x.cap(head + Mh @ np.array([0, 0, 0.05]), head + Mh @ (np.array([0, -0.03, 0.06]) + 0.09 * sph(50, 180 + a)), 0.016, 0.006, mat='dark')
    if helm == 'spiked':
        for i in range(5):
            a = -80 + i * 40
            b = head + Mh @ (np.array([0, 0, 0.06]) + 0.06 * sph(0, a))
            x.cap(b, b + Mh @ np.array([0, 0, 0.06]), 0.012, 0.003, mat='dark')
    # shoulders: pauldrons / mantle (top-visible zone)
    shR = chest + Mt @ np.array([H['sh'] * bulk, 0, -0.02]); shL = chest + Mt @ np.array([-H['sh'] * bulk, 0, -0.02])
    x.ell(shR, (0.06 * bulk, 0.06, 0.045), Mt, mat=zm if gear.get('pauldrons', True) else 'clay')
    x.ell(shL, (0.06 * bulk, 0.06, 0.045), Mt, mat=zm if gear.get('pauldrons', True) else 'clay')
    if gear.get('cape'):  # a short shoulder cape hanging down the back
        x.box(chest + Mt @ np.array([0, -0.075, -0.13]), (0.15 * bulk, 0.02, 0.17), Mt @ rx(-8), 0.015, mat=zm)
    if gear.get('quiver'):
        x.cap(chest + Mt @ np.array([-0.06, -0.1, -0.2]), chest + Mt @ np.array([0.05, -0.1, 0.08]), 0.035, 0.035, mat='dark')
    # arms
    hands = {}
    for side, ua, fa in ((1, p['rUA'], p['rFA']), (-1, p['lUA'], p['lFA'])):
        s0 = shR if side == 1 else shL
        el = s0 + H['ua'] * (Mt @ sph(*ua))
        ha = el + H['fa'] * (Mt @ sph(*fa))
        x.cap(s0, el, H['limb'] * 1.1 * bulk, H['limb'] * 0.95)
        x.cap(el, ha, H['limb'] * 0.95, H['limb'] * 0.8, mat='skin' if gear.get('bare') else 'clay')
        hands[side] = (el, ha)
    # shield on the left forearm, face pointing out of the forearm's outer side
    if gear.get('shield'):
        el, ha = hands[-1]
        sn = p.get('shieldN', (0, -25))
        fwd = Mt @ sph(min(70, sn[0] + 22), sn[1])
        c = (el + ha) / 2 + fwd * 0.03
        x.disc(c, fwd, 0.13 if gear['shield'] == 'round' else 0.15, 0.012, mat=zm)
        x.disc(c - fwd * 0.014, fwd, 0.135, 0.008, mat='dark')
    # weapon in the right hand
    wpn = gear.get('weapon')
    if wpn:
        _, ha = hands[1]
        d = Mt @ sph(*p['w'])
        if wpn in ('spear', 'lance', 'halberd', 'javelin', 'staff'):
            L = {'spear': 0.95, 'lance': 1.25, 'halberd': 0.9, 'javelin': 0.6, 'staff': 0.75}[wpn]
            back = {'spear': 0.35, 'lance': 0.35, 'halberd': 0.3, 'javelin': 0.25, 'staff': 0.3}[wpn]
            a, b = ha - d * back, ha + d * (L - back)
            x.cap(a, b, 0.012, 0.012, mat='dark')
            if wpn in ('spear', 'lance', 'javelin'):
                x.cap(b, b + d * 0.09, 0.022, 0.003, mat='dark')
                if wpn == 'lance' and zones:
                    x.tri(b - d * 0.1, b - d * 0.28, b - d * 0.2 + np.array([0, 0, -0.07]), 0.004, mat=zm)
            if wpn == 'halberd':
                side = np.cross(d, np.array([0, 0, 1.0])); side = side / (np.linalg.norm(side) + 1e-9)
                x.tri(b - d * 0.02, b - d * 0.16, b - d * 0.08 + side * 0.09, 0.01, mat='dark')
                x.cap(b, b + d * 0.08, 0.012, 0.003, mat='dark')
            if wpn == 'staff':
                x.ell(b, (0.035, 0.035, 0.035), mat='glow' if gear.get('glow') else 'dark')
        elif wpn in ('axe', 'greataxe', 'sword', 'fireSword', 'knife'):
            L = {'axe': 0.36, 'greataxe': 0.62, 'sword': 0.42, 'fireSword': 0.44, 'knife': 0.16}[wpn]
            b = ha + d * L
            x.cap(ha - d * 0.04, b, 0.013 if 'sword' not in wpn.lower() else 0.016, 0.01, mat='glow' if wpn == 'fireSword' else 'dark')
            if wpn in ('axe', 'greataxe'):
                side = np.cross(d, Mt @ np.array([1.0, 0, 0])); side = side / (np.linalg.norm(side) + 1e-9)
                s = 0.11 if wpn == 'axe' else 0.16
                x.tri(b - d * 0.02, b - d * s * 1.2, b - d * s * 0.5 + side * s, 0.012, mat='dark')
        elif wpn in ('bow', 'longbow'):
            el, ha_l = hands[-1]
            L = 0.55 if wpn == 'bow' else 0.95
            up = Mt @ np.array([0, 0, 1.0])
            fwd = Mt @ sph(*p['lFA'])
            draw = p.get('draw', 0.0)
            top, bot = ha_l + up * L / 2 + fwd * 0.05, ha_l - up * L / 2 + fwd * 0.05
            x.cap(top, ha_l, 0.012, 0.016, mat='dark'); x.cap(ha_l, bot, 0.016, 0.012, mat='dark')
            if draw > 0:
                _, ha_r = hands[1]
                x.cap(top, ha_r, 0.004, 0.004, mat='dark'); x.cap(ha_r, bot, 0.004, 0.004, mat='dark')
                x.cap(ha_r, ha_l + fwd * 0.12, 0.007, 0.007, mat='dark')
                if gear.get('fire'):
                    x.ell(ha_l + fwd * 0.14, (0.025, 0.025, 0.035), mat='glow')
    if gear.get('banner'):
        base = chest + Mt @ np.array([-0.05, -0.1, -0.15])
        topb = base + Mt @ np.array([0, -0.03, 0.75])
        x.cap(base, topb, 0.01, 0.01, mat='dark')
        x.tri(topb, topb - Mt @ np.array([0, 0, 0.25]), topb + Mt @ np.array([0.0, -0.22, -0.1]), 0.006, mat=zm)
    x.feet = feet
    return x


# ------------------------------------------------------------------------------------------
def quadruped(kind, pose, zones=True, rider=None, rider_pose=None):
    """kind: 'horse' or 'wolf'. pose: legs (front/back, near/far) as (thigh, shin) spherical
    angles, body pitch, head (pitch), tail. Returns an Xf; the rider sits on the saddle."""
    x = Xf()
    big = kind == 'horse'
    S = 1.0 if big else 0.72
    bodyL, bodyR, legL = (0.5, 0.2, 0.31) if big else (0.38, 0.14, 0.22)
    h = legL * 2 + bodyR * 0.6 + pose.get('lift', 0)
    pitch = pose.get('pitch', 0)
    Mb = rx(-pitch)
    c = np.array([0, 0, h])
    x.ell(c, (bodyR * 0.95, bodyL, bodyR * 1.1), Mb)
    x.ell(c + Mb @ np.array([0, bodyL * 0.55, bodyR * 0.15]), (bodyR * 0.9, bodyL * 0.4, bodyR * 1.05), Mb)
    if zones:
        x.box(c + Mb @ np.array([0, -0.03, bodyR * 0.75]), (bodyR * 1.0, bodyL * 0.55, 0.03), Mb, 0.02, mat='zone')
    # legs
    for name, fy, sx in (('fr', 1, 1), ('fl', 1, -1), ('br', -1, 1), ('bl', -1, -1)):
        th, sh = pose.get(name, ((-90, 0), (-90, 0)))
        top = c + Mb @ np.array([sx * bodyR * 0.55, fy * bodyL * 0.7, -bodyR * 0.4])
        knee = top + legL * sph(*th)
        foot = knee + legL * sph(*sh)
        x.cap(top, knee, 0.075 if big else 0.05, 0.045 if big else 0.032)
        x.cap(knee, foot, 0.04 if big else 0.03, 0.035 if big else 0.026)
    # neck and head
    nk = pose.get('neck', (40, 0))
    n0 = c + Mb @ np.array([0, bodyL * 0.8, bodyR * 0.3])
    n1 = n0 + (0.34 if big else 0.17) * sph(*nk)
    x.cap(n0, n1, 0.12 if big else 0.09, 0.07 if big else 0.07)
    hd = pose.get('head', (-30, 0))
    hlen = 0.3 if big else 0.2
    h1 = n1 + hlen * sph(*hd)
    x.cap(n1, h1, 0.075 if big else 0.07, 0.045 if big else 0.03)
    if not big:  # ears
        for s in (1, -1):
            x.cap(n1 + np.array([s * 0.035, 0, 0.03]), n1 + np.array([s * 0.04, -0.01, 0.09]), 0.018, 0.004)
        if pose.get('jaw'):
            x.cap(n1 + np.array([0, 0, -0.03]), n1 + hlen * sph(hd[0] - pose['jaw'], hd[1]) + np.array([0, 0, -0.03]), 0.03, 0.015)
    # tail
    tl = pose.get('tail', (-40, 180))
    t0 = c + Mb @ np.array([0, -bodyL * 0.95, bodyR * 0.3])
    x.cap(t0, t0 + (0.42 if big else 0.3) * sph(*tl), 0.06 if big else 0.06, 0.02)
    if rider is not None:
        saddle = c + Mb @ np.array([0, -0.02, bodyR * 0.9])
        rp = dict(rider_pose or {})
        rp.setdefault('rTh', (-10, 25)); rp.setdefault('lTh', (-10, -25))
        rp.setdefault('rSh', (-80, 20)); rp.setdefault('lSh', (-80, -20))
        r = humanoid(rider, rp, zones)
        # move the rider so the pelvis sits on the saddle
        pel = np.array([0, 0, HUM['hip']])
        lean_extra = rx(-pitch)
        for kind_, ps, args, mat in r.items:
            ps2 = [lean_extra @ (np.asarray(q, float) - pel) + saddle for q in ps]
            if kind_ == 'ell' and args[1] is not None:
                args = (args[0], lean_extra @ args[1])
            elif kind_ == 'box' and args[1] is not None:
                args = (args[0], lean_extra @ args[1], args[2])
            elif kind_ == 'disc':
                args = (lean_extra @ np.asarray(args[0], float), args[1], args[2])
            x.items.append((kind_, ps2, args, mat))
    return x


# ------------------------------------------------------------------------------------------
def chain(x, pts, r0, r1, mat='clay'):
    n = len(pts) - 1
    for i in range(n):
        x.cap(pts[i], pts[i + 1], r0 + (r1 - r0) * i / n, r0 + (r1 - r0) * (i + 1) / n, mat)


def curve(p0, d0, length, bend, n=8, lift=0.0):
    """Points along a planar-ish curve starting at p0 heading d0 (unit), turning bend degrees in total
    about z, rising lift degrees in total."""
    pts = [np.asarray(p0, float)]
    d = np.asarray(d0, float)
    for i in range(n):
        d = rz(bend / n) @ d
        if lift:
            ax = np.cross(d, [0, 0, 1.0]); ax /= (np.linalg.norm(ax) + 1e-9)
            a = np.radians(lift / n)
            d = d * np.cos(a) + np.cross(ax, d) * np.sin(a) + ax * (ax @ d) * (1 - np.cos(a))
        pts.append(pts[-1] + d * length / n)
    return pts


def salamander(pose):
    """A heavy low fire lizard (size 3: 2.3 men tall with the head held up, about 2.4 long)."""
    x = Xf()
    S = 2.3 / 1.0
    lift = pose.get('rear', 0)
    c = np.array([0, 0, 0.13 * S])  # low-slung: the belly a hand above the ground
    Mb = rx(-lift)
    x.ell(c, (0.2 * S, 0.42 * S, 0.14 * S), Mb)
    for fy, sx, nm in ((1, 1, 'fr'), (1, -1, 'fl'), (-1, 1, 'br'), (-1, -1, 'bl')):
        th, sh = pose.get(nm, ((-12, sx * 80), (-85, sx * 15)))  # short legs splayed out to the side, then down
        top = c + Mb @ np.array([sx * 0.15 * S, fy * 0.26 * S, -0.03 * S])
        knee = top + 0.13 * S * sph(*th)
        foot = knee + 0.14 * S * sph(*sh)
        x.cap(top, knee, 0.07 * S, 0.055 * S); x.cap(knee, foot, 0.055 * S, 0.045 * S)
        x.ell(foot + np.array([0, 0.02 * S, 0]), (0.05 * S, 0.06 * S, 0.015 * S))
    # neck and head (broad, flat)
    n0 = c + Mb @ np.array([0, 0.38 * S, 0.04 * S])
    nk = pose.get('neck', (40, 0))  # the head held up (design: 63 wu tall with the head up)
    n1 = n0 + 0.18 * S * sph(*nk)
    x.cap(n0, n1, 0.12 * S, 0.1 * S)
    hd = pose.get('head', (-15, 0))
    Mh = rz(-hd[1]) @ rx(-hd[0])
    hc = n1 + Mh @ np.array([0, 0.13 * S, 0.0])
    x.ell(hc, (0.13 * S, 0.17 * S, 0.06 * S), Mh)
    jaw = pose.get('jaw', 4)
    Mj = Mh @ rx(jaw)
    x.ell(n1 + Mj @ np.array([0, 0.12 * S, -0.05 * S]), (0.12 * S, 0.15 * S, 0.035 * S), Mj)
    for s in (1, -1):
        for k in range(3):
            b = n1 + Mh @ np.array([s * 0.11 * S, (0.02 + 0.05 * k) * S, -0.03 * S])
            x.cap(b, b + Mh @ np.array([s * 0.03 * S, -0.01 * S, 0.0]), 0.012 * S, 0.004 * S, mat='dark')
    if pose.get('breath'):
        m = n1 + Mh @ np.array([0, 0.3 * S, -0.02 * S])
        x.ell(m + Mh @ np.array([0, 0.12 * S, 0]), (0.08 * S, 0.15 * S, 0.06 * S), Mh, mat='glow')
    # tail: a thick chain swinging sideways
    t0 = c + Mb @ np.array([0, -0.4 * S, 0.0])
    pts = curve(t0, Mb @ np.array([0, -1.0, -0.15]), 0.75 * S, pose.get('tail', 25), 8)
    chain(x, pts, 0.1 * S, 0.02 * S)
    return x


def treant(pose):
    """A walking tree (size 4: 3.4 men tall). Trunk, root legs, branch arms, a low twig crown."""
    x = Xf()
    S = 3.4
    lean = pose.get('lean', 0)
    Mt = rx(lean)
    pel = np.array([0, 0, 0.28 * S])
    for side, th in ((1, pose.get('rLeg', (-85, 8))), (-1, pose.get('lLeg', (-85, -8)))):
        hip = pel + np.array([side * 0.07 * S, 0, 0])
        foot = hip + 0.28 * S * sph(*th)
        x.cap(hip, foot, 0.06 * S, 0.05 * S)
        for a in (-40, 0, 40):
            x.cap(foot, foot + 0.07 * S * sph(-20, a + side * 10), 0.03 * S, 0.01 * S, mat='dark')
    top = pel + Mt @ np.array([0, 0, 0.55 * S])
    x.cap(pel, top, 0.12 * S, 0.095 * S)
    face = top + Mt @ np.array([0, 0.08 * S, -0.1 * S])
    x.ell(face, (0.06 * S, 0.03 * S, 0.035 * S), Mt, mat='dark')  # brow ridge
    for side, ua, fa in ((1, pose.get('rUA', (-60, 30)), pose.get('rFA', (-75, 20))), (-1, pose.get('lUA', (-60, -30)), pose.get('lFA', (-75, -20)))):
        s0 = top + Mt @ np.array([side * 0.1 * S, 0, -0.06 * S])
        el = s0 + 0.24 * S * (Mt @ sph(*ua))
        ha = el + 0.24 * S * (Mt @ sph(*fa))
        x.cap(s0, el, 0.05 * S, 0.04 * S); x.cap(el, ha, 0.04 * S, 0.025 * S)
        for a in (-30, 0, 30):
            x.cap(ha, ha + 0.06 * S * (Mt @ sph(fa[0] + a * 0.5, fa[1] + a)), 0.012 * S, 0.004 * S, mat='dark')
    for i in range(7):  # a low crown of short thick twigs (portrait face 01)
        a = -150 + i * 50
        b = top + Mt @ np.array([0.05 * S * np.sin(np.radians(a)), 0.04 * S * np.cos(np.radians(a)), 0.02 * S])
        x.cap(b, b + Mt @ (0.12 * S * sph(55 + (i % 2) * 15, a)), 0.022 * S, 0.008 * S, mat='dark')
        x.ell(b + Mt @ (0.12 * S * sph(55 + (i % 2) * 15, a)), (0.03 * S, 0.03 * S, 0.02 * S), mat='zone')
    return x


def wyrm(pose):
    """A great winged wyrm (size 6: 6 men tall at the shoulder line with the neck up, ~15 long)."""
    x = Xf()
    S = 6.0
    rear = pose.get('rear', 0)
    air = pose.get('air', 0)
    c = np.array([0, 0, 0.3 * S + air])
    Mb = rx(-rear)
    x.ell(c, (0.22 * S, 0.5 * S, 0.2 * S), Mb)
    legs = pose.get('legs', 'stand')
    for fy, sx in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        top = c + Mb @ np.array([sx * 0.17 * S, fy * 0.3 * S, -0.08 * S])
        if legs == 'tuck':
            knee = top + 0.15 * S * sph(-30, 180 if fy > 0 else 180)
            foot = knee + 0.12 * S * sph(10, 180)
        elif legs == 'sprawl':
            knee = top + 0.15 * S * sph(-20, sx * 80)
            foot = knee + 0.15 * S * sph(-30, sx * 60)
        else:
            knee = top + 0.16 * S * sph(-70, sx * 15 + (20 if fy > 0 else -20))
            foot = knee + 0.16 * S * sph(-95, 0)
        x.cap(top, knee, 0.07 * S, 0.05 * S); x.cap(knee, foot, 0.05 * S, 0.035 * S)
    # neck: S-curve chain to the head
    nk = pose.get('neck', (35, 0, 0))  # elevation, azimuth, curl
    n0 = c + Mb @ np.array([0, 0.45 * S, 0.08 * S])
    d0 = Mb @ sph(nk[0], nk[1])
    pts = curve(n0, d0, 0.55 * S, nk[2], 8, lift=pose.get('neckLift', -30))
    chain(x, pts, 0.11 * S, 0.06 * S)
    hd = pose.get('head', (-15, 0))
    Mh = rz(-hd[1]) @ rx(-hd[0])
    hpos = pts[-1]
    x.ell(hpos + Mh @ np.array([0, 0.09 * S, 0]), (0.075 * S, 0.14 * S, 0.06 * S), Mh)
    jaw = pose.get('jaw', 5)
    Mj = Mh @ rx(jaw)
    x.ell(hpos + Mj @ np.array([0, 0.09 * S, -0.045 * S]), (0.06 * S, 0.12 * S, 0.025 * S), Mj)
    for s in (1, -1):
        x.cap(hpos + Mh @ np.array([s * 0.04 * S, 0.02 * S, 0.04 * S]), hpos + Mh @ np.array([s * 0.07 * S, -0.12 * S, 0.1 * S]), 0.018 * S, 0.004 * S, mat='dark')
    if pose.get('breath'):
        m = hpos + Mh @ np.array([0, 0.24 * S, -0.02 * S])
        x.ell(m + Mh @ np.array([0, 0.15 * S, 0]), (0.07 * S, 0.17 * S, 0.06 * S), Mh, mat='glow')
    # tail
    t0 = c + Mb @ np.array([0, -0.48 * S, 0.02 * S])
    tp = curve(t0, Mb @ np.array([0, -1.0, -0.25]), 1.1 * S, pose.get('tail', 40), 10)
    chain(x, tp, 0.12 * S, 0.015 * S)
    # wings: arm bone, three fingers, membranes
    wing = pose.get('wing', (40, 30))  # arm elevation, spread
    for sx in (1, -1):
        root = c + Mb @ np.array([sx * 0.15 * S, 0.22 * S, 0.14 * S])
        wrist = root + 0.45 * S * sph(wing[0], sx * (90 - wing[1]))
        x.cap(root, wrist, 0.04 * S, 0.025 * S)
        tips = []
        for k, (de, da) in enumerate(((15, -10), (-10, 25), (-35, 55))):
            tip = wrist + (0.55 - 0.08 * k) * S * sph(wing[0] - 30 + de, sx * (90 + da - wing[1] * 0.4) + (180 if False else 0))
            x.cap(wrist, tip, 0.018 * S, 0.006 * S, mat='dark')
            tips.append(tip)
        x.tri(root, wrist, tips[0], 0.006 * S, mat='zone')
        x.tri(wrist, tips[0], tips[1], 0.006 * S, mat='zone')
        x.tri(wrist, tips[1], tips[2], 0.006 * S, mat='zone')
        x.tri(root, tips[2], root + Mb @ np.array([0, -0.35 * S, 0]), 0.006 * S, mat='zone')
    return x


def sprite(pose):
    """The fire sprite: a slender flame body with two small flame wings, no legs, hovering."""
    x = Xf()
    hover = pose.get('h', 0.9)
    lean = pose.get('lean', 0)
    M = rx(lean)
    c = np.array([0, 0, hover])
    x.ell(c, (0.11, 0.09, 0.18), M, mat='glow')
    x.cap(c - M @ np.array([0, 0, 0.12]), c - M @ np.array([0, 0.05, 0.42]), 0.08, 0.005, mat='glow')
    x.ell(c + M @ np.array([0, 0.02, 0.24]), (0.07, 0.07, 0.08), M, mat='glow')
    w = pose.get('wing', 0)  # +up, -down
    for sx in (1, -1):
        root = c + M @ np.array([sx * 0.06, -0.04, 0.08])
        tip = root + 0.35 * sph(w, sx * 100)
        x.tri(root, tip, root + M @ np.array([sx * 0.05, -0.06, -0.14]), 0.01, mat='zone')
    return x


def hornet(pose):
    x = Xf()
    c = np.array([0, 0, pose.get('h', 0.3)])
    M = rz(pose.get('yaw', 0)) @ rx(pose.get('pitch', 0))
    x.ell(c + M @ np.array([0, -0.06, 0]), (0.04, 0.08, 0.04), M, mat='zone')
    x.ell(c + M @ np.array([0, 0.03, 0.005]), (0.03, 0.035, 0.03), M)
    x.ell(c + M @ np.array([0, 0.075, 0.01]), (0.025, 0.025, 0.025), M, mat='dark')
    x.cap(c + M @ np.array([0, -0.14, -0.005]), c + M @ np.array([0, -0.18, -0.02 - 0.05 * pose.get('sting', 0)]), 0.01, 0.002, mat='dark')
    w = pose.get('wing', 30)
    for sx in (1, -1):
        root = c + M @ np.array([sx * 0.02, 0.03, 0.03])
        x.tri(root, root + M @ (0.13 * sph(w, sx * 120)), root + M @ (0.1 * sph(w - 10, sx * 150)), 0.003, mat='clay')
    return x
