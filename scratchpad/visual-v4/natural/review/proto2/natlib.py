"""Shared helpers for the natural-view prototype: colour (mirrors the repo's tests/content/colorMath.ts: sRGB -> CIELAB D65,
CIEDE2000, Machado 2009 full severity on linear RGB), OKLCH, seeded value noise, box/Gaussian blurs on numpy planes.
Deterministic: every random table comes from numpy's PCG64 seeded by a string hash, never from the clock."""
import numpy as np, hashlib, json, os

DATA = os.environ.get('NATDATA') or os.path.join(os.path.dirname(__file__), 'data')

# ---------------------------------------------------------------- colour
def s2l(c):
    c = np.asarray(c, np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def l2s(v):
    v = np.clip(v, 0, 1)
    return 255.0 * np.where(v <= 0.0031308, 12.92 * v, 1.055 * np.power(v, 1 / 2.4) - 0.055)

def _f(t):
    return np.where(t > 216 / 24389, np.cbrt(t), ((24389 / 27) * t + 16) / 116)

def lin2lab(lin):
    r, g, b = lin[..., 0], lin[..., 1], lin[..., 2]
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
    z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
    fx, fy, fz = _f(x), _f(y), _f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)

def rgb2lab(rgb):
    return lin2lab(s2l(rgb))

def lab2lin(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16) / 116; fx = fy + a / 500; fz = fy - b / 200
    fi = lambda t: np.where(t ** 3 > 216 / 24389, t ** 3, (116 * t - 16) / (24389 / 27))
    X, Y, Z = fi(fx) * 0.95047, fi(fy), fi(fz) * 1.08883
    r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z
    g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z
    bb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
    return np.stack([r, g, bb], -1)

def lab2rgb(lab):
    return l2s(lab2lin(lab))

def hex2rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float64)

def rgb2hex(c):
    c = np.clip(np.round(np.asarray(c, np.float64)), 0, 255).astype(int)
    return '#%02X%02X%02X' % tuple(c)

def lab2hex(lab):
    return rgb2hex(lab2rgb(np.asarray(lab, np.float64)))

MACHADO = {
    'protan': np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]),
    'deutan': np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]]),
    'tritan': np.array([[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]),
}

def cvd_lin(lin, vision):
    if vision == 'normal':
        return lin
    return np.clip(lin @ MACHADO[vision].T, 0, 1)

def lab_as(rgb, vision='normal'):
    return lin2lab(cvd_lin(s2l(rgb), vision))

def de2000(l1, l2):
    l1 = np.asarray(l1, np.float64); l2 = np.asarray(l2, np.float64)
    L1, a1, b1 = l1[..., 0], l1[..., 1], l1[..., 2]; L2, a2, b2 = l2[..., 0], l2[..., 1], l2[..., 2]
    C1 = np.hypot(a1, b1); C2 = np.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p = (1 + G) * a1; a2p = (1 + G) * a2; C1p = np.hypot(a1p, b1); C2p = np.hypot(a2p, b2)
    h1p = np.where((a1p == 0) & (b1 == 0), 0, np.degrees(np.arctan2(b1, a1p)) % 360)
    h2p = np.where((a2p == 0) & (b2 == 0), 0, np.degrees(np.arctan2(b2, a2p)) % 360)
    dhp = h2p - h1p; dhp = np.where(dhp > 180, dhp - 360, np.where(dhp < -180, dhp + 360, dhp)); dhp = np.where(C1p * C2p == 0, 0, dhp)
    dLp = L2 - L1; dCp = C2p - C1p; dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dhp / 2))
    Lbp = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hs = h1p + h2p
    hbp = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) > 180, np.where(hs < 360, hs + 360, hs - 360), hs) / 2)
    T = 1 - 0.17 * np.cos(np.radians(hbp - 30)) + 0.24 * np.cos(np.radians(2 * hbp)) + 0.32 * np.cos(np.radians(3 * hbp + 6)) - 0.2 * np.cos(np.radians(4 * hbp - 63))
    dT = 30 * np.exp(-(((hbp - 275) / 25) ** 2)); Rc = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + (0.015 * (Lbp - 50) ** 2) / np.sqrt(20 + (Lbp - 50) ** 2); Sc = 1 + 0.045 * Cbp; Sh = 1 + 0.015 * Cbp * T
    Rt = -np.sin(np.radians(2 * dT)) * Rc
    return np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))

def oklch(rgb):
    lin = s2l(rgb); r, g, b = lin[..., 0], lin[..., 1], lin[..., 2]
    l = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b); m = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b); s = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s; A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s; B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return np.stack([L, np.hypot(A, B), np.degrees(np.arctan2(B, A)) % 360], -1)

def lum(rgb):
    lin = s2l(rgb); return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]

def wcag(a, b):
    la, lb = lum(a), lum(b); return (np.maximum(la, lb) + 0.05) / (np.minimum(la, lb) + 0.05)

# ---------------------------------------------------------------- seeded noise
def seed_of(*parts):
    return int.from_bytes(hashlib.sha256(':'.join(str(p) for p in parts).encode()).digest()[:8], 'little')

class VNoise:
    """value noise on a 256 x 256 seeded table, smoothstep interpolation, in [-1, 1] (the mockup's rlVN)."""
    def __init__(self, *purpose):
        self.T = np.random.default_rng(seed_of('natural', *purpose)).random(65536) * 2 - 1
    def __call__(self, x, y):
        ix = np.floor(x); iy = np.floor(y); fx = x - ix; fy = y - iy; sx = fx * fx * (3 - 2 * fx); sy = fy * fy * (3 - 2 * fy)
        ix = ix.astype(np.int64); iy = iy.astype(np.int64)
        x0 = ix & 255; x1 = (ix + 1) & 255; y0 = (iy & 255) << 8; y1 = ((iy + 1) & 255) << 8; T = self.T
        a = T[y0 | x0]; b = T[y0 | x1]; c = T[y1 | x0]; d = T[y1 | x1]
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
    def fbm(self, x, y, oct=4, gain=0.5, lac=2.03):
        s = 0; amp = 1; f = 1; n = 0
        for k in range(oct):
            s = s + amp * self(x * f + k * 37.31, y * f + k * 91.17); n += amp; amp *= gain; f *= lac
        return np.clip(s / n * 1.75, -1, 1)

def hash2(ix, iy, salt):
    """integer hash of lattice coordinates -> three floats in [0, 1) (jitter x, jitter y, a value)."""
    h = (ix.astype(np.int64) * 374761393 + iy.astype(np.int64) * 668265263 + salt * 2246822519) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h & 1023) / 1023.0, ((h >> 10) & 1023) / 1023.0, ((h >> 20) & 1023) / 1023.0

# ---------------------------------------------------------------- blurs
def box1(a, r, axis):
    if r <= 0:
        return a
    n = a.shape[axis]; pad = [(0, 0)] * a.ndim; pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float64)
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis); lo = np.take(c, np.arange(0, n), axis=axis)
    return (hi - lo) / (2 * r + 1)

def gauss(a, sigma, passes=3):
    """three box passes approximate a Gaussian of the given sigma (texels)."""
    r = max(1, int(round((np.sqrt(12 * sigma * sigma / passes + 1) - 1) / 2)))
    out = a.astype(np.float64)
    for _ in range(passes):
        out = box1(box1(out, r, 0), r, 1)
    return out

def up2(a, shape):
    """bilinear upsample of a half-resolution plane to `shape` (texel centres aligned as the mockup's rlBilin)."""
    H, W = shape; h, w = a.shape
    y = (np.arange(H) + 0.5) * h / H - 0.5; x = (np.arange(W) + 0.5) * w / W - 0.5
    y = np.clip(y, 0, h - 1); x = np.clip(x, 0, w - 1)
    y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int); y1 = np.minimum(y0 + 1, h - 1); x1 = np.minimum(x0 + 1, w - 1)
    fy = (y - y0)[:, None]; fx = (x - x0)[None, :]
    A = a[y0][:, x0]; B = a[y0][:, x1]; C = a[y1][:, x0]; D = a[y1][:, x1]
    return A + (B - A) * fx + (C - A) * fy + (A - B - C + D) * fx * fy

def resize_area(img, f):
    """area-average downscale by an integer-free factor f < 1 (box resampling via PIL on float planes)."""
    from PIL import Image
    H, W = img.shape[:2]; nw, nh = max(1, int(round(W * f))), max(1, int(round(H * f)))
    if img.ndim == 2:
        return np.asarray(Image.fromarray(img.astype(np.float32), 'F').resize((nw, nh), Image.BOX if f < 1 else Image.BILINEAR))
    return np.stack([np.asarray(Image.fromarray(img[..., c].astype(np.float32), 'F').resize((nw, nh), Image.BOX if f < 1 else Image.BILINEAR)) for c in range(img.shape[2])], -1)

def load_meta():
    return json.load(open(os.path.join(DATA, 'meta.json')))

def load_arr(name, dtype, shape):
    return np.fromfile(os.path.join(DATA, name + '.bin'), dtype=dtype).reshape(shape)
