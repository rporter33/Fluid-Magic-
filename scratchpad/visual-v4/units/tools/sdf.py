# Orthographic SDF raymarcher at the battle camera (design 3.1: pitch 40, yaw 30), numpy only.
# World: x lateral (near side's right), y depth (toward the far side), z up. Units: figure heights
# (a size-1 man stands 1.0 tall). Used to draw grey "maquette" pose guides for the image model.
import numpy as np

PITCH, YAW = np.radians(40.0), np.radians(30.0)
# camera basis (see art-plan.md section 2): forward f into the scene, screen right r, screen up u
F = np.array([-np.sin(YAW) * np.cos(PITCH), np.cos(YAW) * np.cos(PITCH), -np.sin(PITCH)])
R = np.array([np.cos(YAW), np.sin(YAW), 0.0])
U = np.cross(R, F)
# daylight from the screen's upper left, high in the sky
LIGHT = -0.55 * R + 0.35 * U + 0.75 * np.array([0, 0, 1.0]) - 0.15 * F
LIGHT /= np.linalg.norm(LIGHT)


def to_screen(p):
    """World point -> (sx, sy) in world units on the screen plane, sy pointing down."""
    p = np.asarray(p, dtype=np.float64)
    return float(p @ R), float(-(p @ U))


def _len(v):
    return np.sqrt(np.sum(v * v, axis=-1))


# ---- primitives: each returns distance for points P (N,3) ----
def sd_capsule(P, a, b, ra, rb=None):
    """Round cone from a (radius ra) to b (radius rb)."""
    rb = ra if rb is None else rb
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32)
    ba = b - a
    l2 = float(ba @ ba) + 1e-9
    pa = P - a
    h = np.clip((pa @ ba) / l2, 0.0, 1.0)
    return _len(pa - h[:, None] * ba) - (ra + (rb - ra) * h)


def sd_ellipsoid(P, c, radii, rot=None):
    q = P - np.asarray(c, np.float32)
    if rot is not None:
        q = q @ rot  # rot: columns are the ellipsoid's axes in world
    r = np.asarray(radii, np.float32)
    k0 = _len(q / r)
    k1 = _len(q / (r * r))
    return k0 * (k0 - 1.0) / (k1 + 1e-9)


def sd_box(P, c, half, rot=None, rr=0.0):
    q = P - np.asarray(c, np.float32)
    if rot is not None:
        q = q @ rot
    d = np.abs(q) - (np.asarray(half, np.float32) - rr)
    return _len(np.maximum(d, 0.0)) + np.minimum(np.max(d, axis=-1), 0.0) - rr


def sd_disc(P, c, normal, radius, thick):
    n = np.asarray(normal, np.float32); n = n / np.linalg.norm(n)
    q = P - np.asarray(c, np.float32)
    h = q @ n
    rad = _len(q - h[:, None] * n)
    d = np.stack([rad - radius, np.abs(h) - thick], -1)
    return np.minimum(np.max(d, -1), 0.0) + _len(np.maximum(d, 0.0))


def sd_tri(P, a, b, c, thick):
    """Thin triangle slab (wing membranes, blades)."""
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); c = np.asarray(c, np.float32)
    ba, pa = b - a, P - a
    cb, pb = c - b, P - b
    ac, pc = a - c, P - c
    nor = np.cross(ba, ac)

    def dot2(v):
        return np.sum(v * v, -1)
    s = (np.sign(np.cross(ba, nor) @ pa.T) + np.sign(np.cross(cb, nor) @ pb.T) + np.sign(np.cross(ac, nor) @ pc.T))
    e1 = dot2(ba[None] * np.clip((pa @ ba) / (ba @ ba), 0, 1)[:, None] - pa)
    e2 = dot2(cb[None] * np.clip((pb @ cb) / (cb @ cb), 0, 1)[:, None] - pb)
    e3 = dot2(ac[None] * np.clip((pc @ ac) / (ac @ ac), 0, 1)[:, None] - pc)
    inside = (pa @ nor) ** 2 / (nor @ nor)
    d = np.sqrt(np.where(s < 2.0, np.minimum(np.minimum(e1, e2), e3), inside))
    return d - thick


class Scene:
    """A list of (kind, args, material). Materials: 'clay', 'dark', 'zone', 'zone2', 'skin', 'glow'."""

    def __init__(self):
        self.prims = []
        self.points = []  # (x, y, z, r) bounds helpers

    def add(self, fn, args, mat='clay', bound=None):
        self.prims.append((fn, args, mat))
        if bound is not None:
            self.points.extend(bound)
        return self

    def cap(self, a, b, ra, rb=None, mat='clay'):
        rb = ra if rb is None else rb
        return self.add(sd_capsule, (a, b, ra, rb), mat, [(*a, ra), (*b, rb)])

    def ell(self, c, radii, rot=None, mat='clay'):
        return self.add(sd_ellipsoid, (c, radii, rot), mat, [(*c, max(radii))])

    def box(self, c, half, rot=None, rr=0.0, mat='clay'):
        return self.add(sd_box, (c, half, rot, rr), mat, [(*c, float(np.linalg.norm(half)))])

    def disc(self, c, normal, radius, thick, mat='clay'):
        return self.add(sd_disc, (c, normal, radius, thick), mat, [(*c, radius)])

    def tri(self, a, b, c, thick, mat='clay'):
        return self.add(sd_tri, (a, b, c, thick), mat, [(*a, thick), (*b, thick), (*c, thick)])

    def sdf(self, P):
        d = np.full(P.shape[0], 1e9, np.float32)
        m = np.zeros(P.shape[0], np.int16)
        for i, (fn, args, _) in enumerate(self.prims):
            di = fn(P, *args)
            better = di < d
            d = np.where(better, di, d)
            m = np.where(better, i, m)
        return d, m

    def bounds(self):
        a = np.array(self.points, np.float64)
        lo = (a[:, :3] - a[:, 3:4]).min(0)
        hi = (a[:, :3] + a[:, 3:4]).max(0)
        return lo, hi

    def lowest_z(self):
        a = np.array(self.points, np.float64)
        return float((a[:, 2] - a[:, 3]).min())


MAT_RGB = {
    'clay': (0.66, 0.65, 0.63), 'dark': (0.30, 0.29, 0.28), 'skin': (0.74, 0.70, 0.66),
    'glow': (1.0, 0.85, 0.45), 'zone': None, 'zone2': None,
}


def render(scene, w, h, k, cx, cy, zone=(0.77, 0.33, 0.17), zone2=None, bg=(0, 1, 0), steps=90):
    """Render scene into an (h, w, 3) float image. k: world units per pixel; (cx, cy): pixel of the
    world origin. Returns (rgb, alpha)."""
    img = np.empty((h, w, 3), np.float32); img[:] = bg
    alpha = np.zeros((h, w), np.float32)
    if not scene.prims:
        return img, alpha
    lo, hi = scene.bounds()
    # screen-space bbox of the scene's bounds -> only march those pixels
    corners = np.array([[x, y, z] for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])])
    sx = corners @ R; sy = -(corners @ U)
    x0 = max(0, int(np.floor(cx + sx.min() / k)) - 2); x1 = min(w, int(np.ceil(cx + sx.max() / k)) + 2)
    y0 = max(0, int(np.floor(cy + sy.min() / k)) - 2); y1 = min(h, int(np.ceil(cy + sy.max() / k)) + 2)
    if x1 <= x0 or y1 <= y0:
        return img, alpha
    jj, ii = np.mgrid[y0:y1, x0:x1]
    px = ((ii - cx) * k).astype(np.float32).ravel(); py = ((jj - cy) * k).astype(np.float32).ravel()
    center = (lo + hi) / 2
    rad = float(np.linalg.norm(hi - lo)) / 2 + 0.05
    T0 = float(center @ F) - rad
    O = px[:, None] * R[None] - py[:, None] * U[None] + T0 * F[None]
    O = O.astype(np.float32)
    t = np.zeros(O.shape[0], np.float32)
    alive = np.ones(O.shape[0], bool)
    hit = np.zeros(O.shape[0], bool)
    mat = np.zeros(O.shape[0], np.int16)
    eps = k * 0.35
    Ff = F.astype(np.float32)
    for _ in range(steps):
        idx = np.nonzero(alive)[0]
        if idx.size == 0:
            break
        P = O[idx] + t[idx, None] * Ff
        d, m = scene.sdf(P)
        done = d < eps
        hit[idx[done]] = True; mat[idx[done]] = m[done]
        alive[idx[done]] = False
        t[idx] += np.maximum(d, eps * 0.5) * 0.9
        far = t[idx] > 2 * rad + 0.1
        alive[idx[far]] = False
    hi_idx = np.nonzero(hit)[0]
    if hi_idx.size:
        P = O[hi_idx] + t[hi_idx, None] * Ff
        e = k * 0.5
        kx = np.array([1, -1, -1], np.float32) * e; ky = np.array([-1, -1, 1], np.float32) * e
        kz = np.array([-1, 1, -1], np.float32) * e; kw = np.array([1, 1, 1], np.float32) * e
        n = (np.array([1, -1, -1], np.float32)[None] * scene.sdf(P + kx)[0][:, None]
             + np.array([-1, -1, 1], np.float32)[None] * scene.sdf(P + ky)[0][:, None]
             + np.array([-1, 1, -1], np.float32)[None] * scene.sdf(P + kz)[0][:, None]
             + np.array([1, 1, 1], np.float32)[None] * scene.sdf(P + kw)[0][:, None])
        n /= (np.linalg.norm(n, axis=1, keepdims=True) + 1e-9)
        lam = np.clip(n @ LIGHT.astype(np.float32), 0, 1)
        rim = np.clip(1 - np.abs(n @ (-Ff)), 0, 1) ** 3 * 0.12
        shade = 0.38 + 0.62 * lam + rim
        cols = np.zeros((hi_idx.size, 3), np.float32)
        for i, (_, _, mname) in enumerate(scene.prims):
            sel = mat[hi_idx] == i
            if not sel.any():
                continue
            c = zone if mname == 'zone' else (zone2 or zone) if mname == 'zone2' else MAT_RGB[mname]
            cols[sel] = c
        glow = np.array([scene.prims[m][2] == 'glow' for m in mat[hi_idx]])
        out = cols * shade[:, None]
        out[glow] = cols[glow]
        flat = img[y0:y1, x0:x1].reshape(-1, 3)
        flat[hi_idx] = np.clip(out, 0, 1)
        img[y0:y1, x0:x1] = flat.reshape(y1 - y0, x1 - x0, 3)
        a = alpha[y0:y1, x0:x1].ravel(); a[hi_idx] = 1; alpha[y0:y1, x0:x1] = a.reshape(y1 - y0, x1 - x0)
    return img, alpha
