"""Verifier's own numpy helpers: dump loading, sRGB -> CIELAB (D65, the repo's constants) and OKLCH, coarse busyness, province distance maps."""
import json, numpy as np
from PIL import Image
OUT = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/out/'
DUMP = OUT + 'dump/'
REFS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-refs/'

def lin(c):
    c = np.asarray(c, np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def lab(rgb):
    l = lin(rgb); r, g, b = l[..., 0], l[..., 1], l[..., 2]
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
    z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
    f = lambda t: np.where(t > 216 / 24389, np.cbrt(t), ((24389 / 27) * t + 16) / 116)
    fx, fy, fz = f(x), f(y), f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)

def Lstar(rgb): return lab(rgb)[..., 0]

def oklch_c(rgb):
    l = lin(rgb); r, g, b = l[..., 0], l[..., 1], l[..., 2]
    L_ = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b); M_ = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b); S_ = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    a = 1.9779984951 * L_ - 2.4285922050 * M_ + 0.4505937099 * S_; bb = 0.0259040371 * L_ + 0.7827717662 * M_ - 0.8086757660 * S_
    return np.hypot(a, bb)

def load(tag):
    info = json.load(open(DUMP + tag + '.json')); W2, H2 = info['info']['W2'], info['info']['H2']
    rd = lambda k: np.fromfile(DUMP + f'{tag}-{k}.bin', np.uint8).reshape(H2, W2, 4)
    return info, {k: rd(k) for k in ['land', 'lines', 'full', 'meta']}

def busy(rgb, cell):
    """refs-analysis §1: average into cells (sRGB box mean, as PIL BOX), L* per cell, share of cells whose L* differs from its right or lower neighbour by > 10 (> 20)."""
    h, w = rgb.shape[0] // cell * cell, rgb.shape[1] // cell * cell
    if h < 2 * cell or w < 2 * cell: return None
    c = rgb[:h, :w, :3].astype(np.float64).reshape(h // cell, cell, w // cell, cell, 3).mean((1, 3))
    L = Lstar(c); g = np.maximum(np.abs(L[:-1, 1:] - L[:-1, :-1]), np.abs(L[1:, :-1] - L[:-1, :-1]))
    return g

def busy_pct(g, mask=None):
    if g is None: return None
    if mask is not None: g = g[mask]
    return round(float((g > 10).mean() * 100), 1), round(float((g > 20).mean() * 100), 1)

def cellmask(m, cell):
    """cells (for busy's g grid) whose pixels and right/lower neighbours' pixels are all True"""
    h, w = m.shape[0] // cell * cell, m.shape[1] // cell * cell
    c = m[:h, :w].reshape(h // cell, cell, w // cell, cell).all((1, 3))
    return c[:-1, :-1] & c[:-1, 1:] & c[1:, :-1]

def distmap(ids, maxd=80):
    """4-neighbour distance (px) to the nearest pixel of another id (or the image edge), capped"""
    d = np.zeros(ids.shape, np.int32); cur = np.ones(ids.shape, bool)
    same = lambda a, sh, ax: np.roll(a, sh, ax)
    inner = np.ones(ids.shape, bool)
    for ax in (0, 1):
        for sh in (1, -1):
            inner &= (np.roll(ids, sh, ax) == ids)
    inner[0, :] = inner[-1, :] = False; inner[:, 0] = inner[:, -1] = False
    cur = inner.copy(); k = 0
    while cur.any() and k < maxd:
        d[cur] += 1; k += 1
        nxt = cur.copy()
        for ax in (0, 1):
            for sh in (1, -1): nxt &= np.roll(cur, sh, ax)
        nxt[0, :] = nxt[-1, :] = False; nxt[:, 0] = nxt[:, -1] = False
        cur = nxt
    return d

def hexs(a): return ['#%02X%02X%02X' % (int(r), int(g), int(b)) for r, g, b in np.asarray(a).reshape(-1, 3)]

def busy_img(im, k):
    """PIL BOX resize by factor k (cells of 1/k px), then the cell grid's max(|dL right|, |dL down|)"""
    sm = np.asarray(im.convert('RGB').resize((max(8, int(im.width * k)), max(8, int(im.height * k))), Image.BOX), np.float64)
    L = Lstar(sm); return np.maximum(np.abs(L[:-1, 1:] - L[:-1, :-1]), np.abs(L[1:, :-1] - L[:-1, :-1]))

def stats(rgb):
    rgb = rgb.reshape(-1, 3); L = Lstar(rgb); C = oklch_c(rgb)
    return {'Lp5': round(float(np.percentile(L, 5)), 1), 'Lp50': round(float(np.percentile(L, 50)), 1), 'Lp95': round(float(np.percentile(L, 95)), 1), 'Lsd': round(float(L.std()), 1),
            'Cmean': round(float(C.mean()), 3), 'Cp90': round(float(np.percentile(C, 90)), 3), 'Cover012pct': round(float((C > 0.12).mean() * 100), 2)}
