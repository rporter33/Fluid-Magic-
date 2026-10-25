# Rest of stage D: the remaining painted effect sheets (art plan 7.2) -- layouts, layout guides (Image 1), prompts and
# jobs, in the pilot's conventions (stage-d/work/tools/fx_layouts.py, fx_guides.py, fx_prompts.py, fx_reroll.py):
#   E1   flame tongues        black, additive   three 8-frame loops (slender, forked, broad), one row each
#   E7c  fire breath, core    black, additive   a 4-frame stream (2 x 2), the inner jet only
#   E7b  fire breath, billows blue key, normal  the same 4 frames' outer billows, aligned with E7c
#   L5   bark plating         opaque tile       a square bark texture (made seamless in code)
#   L6g  loam breath, gale    magenta, normal   4 frames of a gale of thorned seeds and torn leaves + 10 loose particles
#   L6s  loam breath, spores  black, luma       the same 4 frames' spore haze + 5 spore puffs (luminance as alpha)
#   H1   holy light           black, additive   the column of light, the sun disc, the halo ring, the soft rays
#   G1s  sun mana ring        black, additive   the Radiance ring with the sun glyph at its front, and the glyph alone
#   U1   umbra                white, multiply   a ripple ring, inward tendrils, four drips, a ripple band, a drain thread
#   V1   veins                black, additive   eight vein overlays and two tendril strips, pale (tinted by the game)
# Two candidates each: a = gemini-nano-banana-2.1, b = gemini-3-pro-image (the pilot's split). Boxes are in the
# generator's output pixels at the sheet's aspect (fx_layouts.SIZES); ground shapes are squashed to 0.643.
# Usage: python3 -I dd_fx.py   -> prod/fx/guides/<sheet>.guide.png, prod/fx/prompts/<sheet>.txt, prod/fx/jobs.json
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PROD = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(PROD, '..'))
UNITS = os.path.abspath(os.path.join(STAGE, '..'))
PT = os.path.join(STAGE, 'work', 'tools')
sys.path.insert(0, PT)
from fx_layouts import SIZES, BG, SQ, grid  # noqa: E402
import fx_guides as FG  # noqa: E402
import fx_prompts as FP  # noqa: E402

FX = os.path.join(PROD, 'fx')
REPO = '/home/user/Fluid-Magic-'
BG2 = dict(BG, blue=(0, 0, 255))

# ---------------------------------------------------------------- layouts
CONE4 = grid(0, 0, 1376, 768, 2, 2, ['f1', 'f2', 'f3', 'f4'], pad=14)
GALE4 = grid(0, 0, 1376, 560, 2, 2, ['f1', 'f2', 'f3', 'f4'], pad=12)
SHEETS = {
    'E1': {'title': 'flame tongues', 'aspect': '16:9', 'bg': 'black', 'blend': 'add', 'els':
           [dict(e, shape='tongue', kind=k, frame=i % 8) for k, row in enumerate(('tongueS', 'tongueM', 'tongueL'))
            for i, e in enumerate(grid(0, k * 256, 1376, (k + 1) * 256, 8, 1, [f'{row}{j}' for j in range(1, 9)], pad=6))]},
    'E7c': {'title': 'fire breath core', 'aspect': '16:9', 'bg': 'black', 'blend': 'add',
            'els': [dict(e, name='breathCore%d' % (i + 1), shape='cone', frame=i, layer='core') for i, e in enumerate(CONE4)]},
    'E7b': {'title': 'fire breath billows', 'aspect': '16:9', 'bg': 'blue', 'blend': 'normal',
            'els': [dict(e, name='breathBillow%d' % (i + 1), shape='cone', frame=i, layer='billow') for i, e in enumerate(CONE4)]},
    'L5': {'title': 'bark plating', 'aspect': '1:1', 'bg': 'none', 'blend': 'opaque', 'els': [{'name': 'barkTile', 'box': [0, 0, 1024, 1024], 'shape': 'tile'}]},
    'L6g': {'title': 'loam breath gale', 'aspect': '16:9', 'bg': 'magenta', 'blend': 'normal',
            'els': [dict(e, name='gale%d' % (i + 1), shape='gale', frame=i) for i, e in enumerate(GALE4)]
            + [dict(e, shape=s) for e, s in zip(grid(16, 584, 1360, 760, 10, 1, ['seed1', 'seed2', 'seed3', 'seed4', 'tornLeaf1', 'tornLeaf2', 'tornLeaf3',
                                                                               'sporeClump1', 'sporeClump2', 'sporeClump3'], pad=10),
                                               ['seed'] * 4 + ['tornleaf'] * 3 + ['clump'] * 3)]},
    'L6s': {'title': 'loam breath spores', 'aspect': '16:9', 'bg': 'black', 'blend': 'luma',
            'els': [dict(e, name='sporeHaze%d' % (i + 1), shape='haze', frame=i) for i, e in enumerate(GALE4)]
            + [dict(e, shape='puff', k=i) for i, e in enumerate(grid(16, 584, 1360, 760, 5, 1, ['sporePuff%d' % i for i in range(1, 6)], pad=14))]},
    'H1': {'title': 'holy light', 'aspect': '4:3', 'bg': 'black', 'blend': 'add', 'els': [
        {'name': 'lightColumn', 'box': [40, 24, 360, 872], 'shape': 'column'},
        {'name': 'sunDisc', 'box': [400, 24, 770, 394], 'shape': 'sundisc'},
        {'name': 'softRays', 'box': [800, 24, 1176, 394], 'shape': 'rays'},
        {'name': 'haloRing', 'box': [400, 440, 1176, 872], 'shape': 'halo'},
    ]},
    'G1s': {'title': 'sun mana ring and glyph', 'aspect': '1:1', 'bg': 'black', 'blend': 'add', 'els': [
        {'name': 'glyphRingW', 'box': [70, 70, 954, 690], 'shape': 'glyphring'},
        {'name': 'glyphW', 'box': [392, 730, 632, 990], 'shape': 'glyph'},
    ]},
    'U1': {'title': 'umbra', 'aspect': '3:2', 'bg': 'white', 'blend': 'multiply', 'els': [
        {'name': 'rippleRing', 'box': [24, 24, 600, 420], 'shape': 'ripples'},
        {'name': 'tendrilsIn', 'box': [630, 24, 1000, 420], 'shape': 'tendrils'},
    ] + [dict(e, shape='drip', k=i) for i, e in enumerate(grid(1016, 24, 1248, 420, 2, 2, ['drip1', 'drip2', 'drip3', 'drip4'], pad=10))] + [
        {'name': 'rippleBand', 'box': [24, 452, 1240, 640], 'shape': 'band'},
        {'name': 'drainThread', 'box': [24, 672, 1240, 752], 'shape': 'thread'},
        {'name': 'drainThread2', 'box': [24, 764, 1240, 828], 'shape': 'thread'},
    ]},
    'V1': {'title': 'veins', 'aspect': '4:3', 'bg': 'black', 'blend': 'add',
           'els': [dict(e, shape='veins', k=i) for i, e in enumerate(grid(0, 0, 1200, 680, 4, 2, ['veins%d' % i for i in range(1, 9)], pad=12))]
           + [{'name': 'veinStrip1', 'box': [24, 704, 1176, 780], 'shape': 'veinstrip'}, {'name': 'veinStrip2', 'box': [24, 800, 1176, 872], 'shape': 'veinstrip'}]},
}


# ---------------------------------------------------------------- guides
def flame_poly(cx, base, w, h, lean, curl, n=40):
    """A flame tongue's outline: wide at its base, narrowing to a tip that leans and curls."""
    left, right = [], []
    for i in range(n + 1):
        q = i / n
        half = w / 2 * (math.sin(math.pi * min(1, q * 0.9 + 0.35)) ** 0.6) * (1 - q) ** 0.8
        x = cx + lean * q ** 1.6 + curl * math.sin(q * math.pi * 1.5) * q
        y = base - h * q
        left.append((x - half, y)); right.append((x + half, y))
    return left + right[::-1]


def cone_pts(x0, y0, x1, y1, frame, wobble=1.0):
    """The breath stream in a cell: from the mouth at the left (narrow) to a broad billowing end at the right, lying on
    the ground (its lower edge 22% above the cell's bottom), as tall as 70% of the cell at its far end. Returns the top
    and bottom outlines, the ground line, the x samples, the half-heights and the centre line."""
    n = 50
    xs = np.linspace(x0 + 30, x1 - 26, n)
    q = np.linspace(0, 1, n)
    ground = y1 - (y1 - y0) * 0.16
    hw = 7 + (y1 - y0) * 0.33 * q ** 0.7
    yc = ground - hw * 0.92
    top = [(x, yc[i] - hw[i] * (1.0 + 0.10 * wobble * math.sin(i * 0.9 + frame * 1.7))) for i, x in enumerate(xs)]
    bot = [(x, min(ground + 4, yc[i] + hw[i] * (1.0 + 0.05 * math.sin(i * 1.3 + frame)))) for i, x in enumerate(xs)]
    return top, bot, ground, xs, hw, yc


def draw(cv, sheet, e):
    x0, y0, x1, y1 = e['box']
    cx, cy, bw, bh = (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0
    seed = sum(map(ord, sheet + e['name']))
    R = FG.rng(seed)
    s = e['shape']
    if s == 'tongue':
        k, f = e['kind'], e['frame']
        ph = 2 * math.pi * f / 8
        h = bh * (0.62, 0.78, 0.9)[k] * (1 + 0.06 * math.sin(ph))
        w = bw * (0.32, 0.5, 0.78)[k]
        base = y1 - 8
        lean = bw * 0.12 * math.sin(ph); curl = bw * 0.1 * math.sin(ph + 1.2)
        cv.blend(FG.poly_mask(cv.w, cv.h, flame_poly(cx, base, w, h, lean, curl), 1.5), 150)
        if k >= 1:  # a side tongue (forked), and for the broad flame a third
            for j, sx in enumerate((-1, 1)[: k]):
                cv.blend(FG.poly_mask(cv.w, cv.h, flame_poly(cx + sx * w * 0.28, base, w * 0.45, h * (0.55 + 0.1 * math.sin(ph + j * 2)),
                                                             lean * 0.6 + sx * 6, -curl * 0.5), 1.5), 125)
        cv.blend(FG.ell_mask(cv.w, cv.h, cx, base - h * 0.22, w * 0.22, h * 0.16, 3) * 0.8, 205)  # the bright core
    elif s == 'cone':
        top, bot, ground, xs, hw, yc = cone_pts(x0, y0, x1, y1, e['frame'])
        n = len(xs)
        if e['layer'] == 'core':
            # the inner jet: a bright tongue along the stream's centre line, narrowing to the right and ending at 85%
            m = int(n * 0.85)
            k = [(1 - i / m) ** 0.35 for i in range(m)]
            tp = [(xs[i], yc[i] - hw[i] * 0.42 * k[i] - 4) for i in range(m)]
            bt = [(xs[i], yc[i] + hw[i] * 0.42 * k[i] + 4) for i in range(m)]
            cv.blend(FG.poly_mask(cv.w, cv.h, tp + bt[::-1], 3), 130)
            cv.blend(FG.line_mask(cv.w, cv.h, [(xs[i], yc[i]) for i in range(int(n * 0.55))], 9, 3), 210)
        else:
            cv.blend(FG.poly_mask(cv.w, cv.h, top + bot[::-1], 2.5), 112)
            for j in range(18):  # billows along the upper edge
                i = int(R.integers(6, n - 2))
                FG.sphere(cv, xs[i], top[i][1] + hw[i] * 0.4, hw[i] * R.uniform(0.3, 0.45), 80, 190)
            cv.blend(FG.line_mask(cv.w, cv.h, [(xs[i], yc[i]) for i in range(int(n * 0.8))], 8, 3), 70)  # the core's place, left dark
        cv.blend(FG.ell_mask(cv.w, cv.h, xs[0], yc[0], 9, 7, 2), 230)  # the mouth
    elif s == 'gale':
        top, bot, ground, xs, hw, yc = cone_pts(x0, y0, x1, y1, e['frame'], wobble=1.4)
        for j in range(80):  # seeds and torn leaves streaming along the stream, dense near the jaws
            q = R.uniform(0, 1) ** 1.3
            i = min(len(xs) - 1, int(q * (len(xs) - 1)))
            px = xs[i] + R.uniform(-8, 8)
            py = yc[i] + R.uniform(-0.95, 0.95) * hw[i]
            ang = R.uniform(-0.6, 0.6)
            L = R.uniform(6, 13) * (0.7 + q)
            cv.blend(FG.line_mask(cv.w, cv.h, [(px - L * math.cos(ang), py - L * math.sin(ang)), (px + L * math.cos(ang), py + L * math.sin(ang))],
                                  max(3, L * 0.45), 1.0), 95 if j % 3 else 150)
        cv.blend(FG.ell_mask(cv.w, cv.h, xs[0], yc[0], 9, 7, 2), 200)
    elif s == 'haze':
        top, bot, ground, xs, hw, yc = cone_pts(x0, y0, x1, y1, e['frame'], wobble=1.4)
        for j in range(16):
            i = int(4 + (len(xs) - 10) * (j / 15) ** 0.8)
            FG.cloud(cv, xs[i], yc[i], hw[i] * 0.62, seed + j, n=5, lo=70, hi=170, sq=0.9)
    elif s == 'seed':
        ang = R.uniform(-0.8, 0.8)
        L = min(bw, bh) * 0.32
        cv.blend(FG.ell_mask(cv.w, cv.h, cx, cy, L, L * 0.45, 2), 120)
        for k in range(6):
            a = ang + k * math.pi / 3
            cv.blend(FG.line_mask(cv.w, cv.h, [(cx, cy), (cx + math.cos(a) * L * 1.35, cy + math.sin(a) * L * 1.35)], 4, 1), 90)
    elif s == 'tornleaf':
        pts = [(cx + math.cos(q) * bw * 0.36, cy + math.sin(q) * bh * 0.2 + (10 if math.cos(q) > 0.6 and math.sin(q) > 0 else 0)) for q in np.linspace(0, 2 * math.pi, 22)]
        cv.blend(FG.poly_mask(cv.w, cv.h, pts, 1.2), 140)
        cv.blend(FG.line_mask(cv.w, cv.h, [(cx - bw * 0.32, cy), (cx + bw * 0.3, cy)], 3, 1), 90)
    elif s == 'clump':
        FG.cloud(cv, cx, cy, min(bw, bh) * 0.3, seed, n=6, lo=90, hi=190)
    elif s == 'puff':
        FG.cloud(cv, cx, cy, min(bw, bh) * 0.36, seed, n=7, lo=80, hi=190)
    elif s == 'column':
        ell_cy = y1 - 60
        for k in range(9):  # rays of light coming straight down, widening to the ground
            xx = cx + (k - 4) * bw * 0.08
            cv.blend(FG.poly_mask(cv.w, cv.h, [(xx - 6, y0 + 10), (xx + 6, y0 + 10), (xx + 14 + (k - 4) * 4, ell_cy), (xx - 14 + (k - 4) * 4, ell_cy)], 6) * 0.45, 170)
        cv.blend(FG.poly_mask(cv.w, cv.h, [(cx - bw * 0.22, y0 + 10), (cx + bw * 0.22, y0 + 10), (cx + bw * 0.38, ell_cy), (cx - bw * 0.38, ell_cy)], 14) * 0.5, 150)
        cv.blend(FG.ell_mask(cv.w, cv.h, cx, ell_cy, bw * 0.45, bw * 0.45 * SQ, 10), 200)
    elif s == 'sundisc':
        r = min(bw, bh) * 0.22
        for k in range(12):
            a = k * math.pi / 6
            L = r * (2.0 if k % 2 == 0 else 1.55)
            cv.blend(FG.poly_mask(cv.w, cv.h, [(cx + math.cos(a - 0.08) * r, cy + math.sin(a - 0.08) * r), (cx + math.cos(a) * L, cy + math.sin(a) * L),
                                              (cx + math.cos(a + 0.08) * r, cy + math.sin(a + 0.08) * r)], 2), 150)
        FG.glow(cv, cx, cy, r * 2.0, 110)
        FG.sphere(cv, cx, cy, r, 150, 225)
    elif s == 'rays':
        for k in range(7):  # a fan of soft rays coming down from above
            a = math.pi / 2 + (k - 3) * 0.16
            L = bh * 0.92
            p0 = (cx, y0 + 6)
            cv.blend(FG.poly_mask(cv.w, cv.h, [(p0[0] - 4, p0[1]), (p0[0] + 4, p0[1]), (p0[0] + math.cos(a) * L + 16, p0[1] + math.sin(a) * L),
                                              (p0[0] + math.cos(a) * L - 16, p0[1] + math.sin(a) * L)], 8) * 0.55, 160)
    elif s == 'halo':
        rx, ry = bw / 2 - 24, (bw / 2 - 24) * SQ
        ecy = cy + 10
        band = FG.ell_mask(cv.w, cv.h, cx, ecy, rx + 14, ry + 10, 4) - FG.ell_mask(cv.w, cv.h, cx, ecy, rx - 14, ry - 10, 4)
        cv.blend(np.clip(band, 0, 1), 175)
        FG.glow(cv, cx, ecy, rx * 0.3, 40)
    elif s == 'glyphring':
        rx, ry = bw / 2 - 30, (bw / 2 - 30) * SQ
        ecy = y0 + 30 + ry + 40
        band = FG.ell_mask(cv.w, cv.h, cx, ecy, rx + 14, ry + 10, 3) - FG.ell_mask(cv.w, cv.h, cx, ecy, rx - 14, ry - 10, 3)
        cv.blend(np.clip(band, 0, 1), 110)
        for j in range(30):  # short rays standing up from the ring line
            a = 2 * math.pi * j / 30 + R.uniform(-0.05, 0.05)
            px, py = cx + math.cos(a) * rx, ecy + math.sin(a) * ry
            hh = R.uniform(22, 34)
            cv.blend(FG.poly_mask(cv.w, cv.h, [(px - 3, py + 3), (px, py - hh), (px + 3, py + 3)], 1.2), 165)
        sun_glyph(cv, cx, ecy + ry - 190 * 0.42, 190, 150)
    elif s == 'glyph':
        sun_glyph(cv, cx, cy, min(bw, bh) - 20, 150)
    elif s == 'ripples':
        ecx, ecy = cx, cy + 10
        for k, rr in enumerate((0.95, 0.74, 0.54, 0.34)):
            rx = (bw / 2 - 16) * rr
            band = FG.ell_mask(cv.w, cv.h, ecx, ecy, rx + 7, (rx + 7) * SQ, 3) - FG.ell_mask(cv.w, cv.h, ecx, ecy, rx - 7, (rx - 7) * SQ, 3)
            cv.blend(np.clip(band, 0, 1) * (0.6 + 0.1 * k), 120 - 12 * k)
        cv.blend(FG.ell_mask(cv.w, cv.h, ecx, ecy, bw * 0.1, bw * 0.1 * SQ, 6), 60)
    elif s == 'tendrils':
        ecx, ecy = cx, cy + 20
        for k in range(9):
            a = 2 * math.pi * k / 9 + R.uniform(-0.2, 0.2)
            pts = []
            for i in range(24):
                q = i / 23
                r = (bw / 2 - 14) * (1 - q) + 10
                aa = a + 0.9 * q
                pts.append((ecx + math.cos(aa) * r, ecy + math.sin(aa) * r * SQ))
            cv.blend(FG.line_mask(cv.w, cv.h, pts, 9, 1.5), 90)
        cv.blend(FG.ell_mask(cv.w, cv.h, ecx, ecy, 28, 18, 4), 55)
    elif s == 'drip':
        L = bh * 0.72
        top = y0 + bh * 0.12
        pts = [(cx + 10 * math.sin(q * math.pi) * (1 - q) - 2, top + q * L) for q in np.linspace(0, 1, 12)]
        cv.blend(FG.line_mask(cv.w, cv.h, pts, 12, 1.2), 80)
        cv.blend(FG.ell_mask(cv.w, cv.h, cx, top + L, 15, 18, 2), 70)
    elif s == 'band':
        xs = np.linspace(x0 + 10, x1 - 10, 60)
        for k in range(3):
            pts = [(x, cy + (k - 1) * bh * 0.28 + 10 * math.sin(x * 0.02 + k)) for x in xs]
            cv.blend(FG.line_mask(cv.w, cv.h, pts, 18 - 4 * abs(k - 1), 2.5), 105 - 15 * (k == 1))
    elif s == 'thread':
        xs = np.linspace(x0 + 10, x1 - 10, 80)
        pts = [(x, cy + 8 * math.sin(x * 0.015 + seed)) for x in xs]
        cv.blend(FG.line_mask(cv.w, cv.h, pts, bh * 0.28, 2), 70)
    elif s == 'veins':
        # a branching network of veins growing from a root point at the bottom middle of the cell
        def branch(x, y, ang, L, wd, depth):
            pts = [(x, y)]
            for i in range(8):
                ang += R.uniform(-0.25, 0.25)
                x += math.cos(ang) * L / 8; y += math.sin(ang) * L / 8
                pts.append((x, y))
            cv.blend(FG.line_mask(cv.w, cv.h, pts, max(2, wd), 1.0), 120 + 15 * depth)
            if depth < 3:
                for sgn in (-1, 1):
                    if R.uniform() < 0.85:
                        branch(x, y, ang + sgn * R.uniform(0.35, 0.8), L * 0.62, wd * 0.62, depth + 1)
        k = e['k']
        base = (cx + R.uniform(-20, 20), y1 - 14) if k % 2 == 0 else (cx, cy + R.uniform(-10, 10))
        for j in range(2 if k % 2 == 0 else 4):
            a0 = -math.pi / 2 + R.uniform(-0.5, 0.5) if k % 2 == 0 else j * math.pi / 2 + R.uniform(-0.3, 0.3)
            branch(base[0], base[1], a0, bh * (0.26 if k % 2 == 0 else 0.17), 7, 0)
    elif s == 'veinstrip':
        xs = np.linspace(x0 + 10, x1 - 10, 90)
        pts = [(x, cy + 10 * math.sin(x * 0.012 + seed) + 4 * math.sin(x * 0.07)) for x in xs]
        cv.blend(FG.line_mask(cv.w, cv.h, pts, 9, 1.2), 175)
        for j in range(22):
            i = int(R.integers(2, len(xs) - 6))
            a = R.choice([-1, 1]) * R.uniform(0.5, 1.1)
            L = R.uniform(14, 26)
            p = pts[i]
            cv.blend(FG.line_mask(cv.w, cv.h, [p, (p[0] + L * math.cos(a), p[1] + L * math.sin(a) * 0.8)], 3, 1), 140)


def sun_glyph(cv, cx, cy, size, col):
    """The game's Radiance symbol (visual-v4/map/parts/p10a-icons.js MANA.W, read only): a disc of radius 5 and eight
    rays in a 24-unit box, drawn bold for a placeholder."""
    s = size / 24
    FG.sphere(cv, cx, cy, 5.2 * s, col - 30, col + 40)
    for k in range(8):
        a = k * math.pi / 4
        p0 = (cx + math.cos(a) * 7.2 * s, cy + math.sin(a) * 7.2 * s)
        p1 = (cx + math.cos(a) * 10.6 * s, cy + math.sin(a) * 10.6 * s)
        cv.blend(FG.line_mask(cv.w, cv.h, [p0, p1], max(4, 2.0 * s), 1.0), col)


def render_guide(sheet, out):
    S = SHEETS[sheet]
    w, h = SIZES[S['aspect']]
    cv = FG.Canvas(w, h, BG2.get(S['bg'], (0, 0, 0)))
    for e in S['els']:
        draw(cv, sheet, e)
    Image.fromarray(np.clip(cv.img, 0, 255).astype(np.uint8)).save(out)


# ---------------------------------------------------------------- prompts
REF = dict(FP.REF)
REF.update({
    'G1f': os.path.join(STAGE, 'raw', 'G1f.b.g3pro.png'),
    'E2': os.path.join(STAGE, 'raw', 'E2.a.nb21.png'),
    'E4': os.path.join(STAGE, 'raw', 'E4.a.nb21.png'),
    'E6': os.path.join(STAGE, 'raw', 'E6.a.nb21.png'),
    'L4': os.path.join(STAGE, 'raw', 'L4.a.nb21.png'),
    'E5': os.path.join(STAGE, 'raw', 'E5.a.nb21.png'),
})
REF_WORDS = dict(FP.REF_WORDS)
REF_WORDS.update({
    'G1f': 'the game\'s approved flame mana ring sheet: the new sheet belongs to the same family of mana rings, with the same size, ring width, layout and hand, but in its own colour and symbol',
    'E2': 'an approved effects sheet from this game (a fireball, its trail and a meteor): it shows how flame is painted for the game\'s effects, at the same scale',
    'E4': 'an approved effects sheet from this game (embers, sparks and small flame licks): it shows how flame is painted for the game\'s effects',
    'E6': 'an approved decal sheet from this game (burn marks on white): it shows how stains on the ground are painted for the game\'s decals',
    'L4': 'an approved effects sheet from this game (leaves, petals and flowers on magenta): it shows how leaves are painted for the game\'s effects, at the same scale',
    'E5': 'an approved effects sheet from this game (smoke in greys on black): it shows how smoke and haze are painted for the game\'s effects',
})
REFS = {'E1': ['fireSprite', 'E4', 'anchor'], 'E7c': ['fireSprite', 'E2', 'anchor'], 'E7b': ['fireSprite', 'E2', 'anchor'],
        'L5': ['treant', 'worldTree'], 'L6g': ['treant', 'L4', 'worldTree'], 'L6s': ['E5', 'treant'],
        'H1': ['fireSprite', 'anchor'], 'G1s': ['G1f', 'anchor'], 'U1': ['E6', 'anchor'], 'V1': ['fireSprite', 'anchor']}
BGW = dict(FP.BGW, blue='perfectly flat pure blue (#0000FF)')
RADIANCE = ('Radiance\'s colours: white-gold light (#FFFFFF to #F3E6B8) in the brightest parts, a warm pale gold body '
            '(#F3E6B8) and deeper old-gold edges (#D9B85C) that fade into the black; never orange flame, never red.')
UMBRA = ('Umbra\'s colours: deep violet-black ink (#1A1024) in the darkest strokes, a dusky plum-grey (#3D2B4F) body and '
         'soft grey edges that fade into the white; no bright purple, no other colour.')
FIRE_BILLOW = ('The billows are matter seen in daylight, not light: rolling orange and deep red flame billows (#FD6533, '
               '#C4532C, #7A1E12) wrapped in dark charcoal and soot-brown smoke at their outer edges and tops, lit by the '
               'high sun from the upper left and by their own fire from inside; they must hold their colour drawn over '
               'a light grassland, so no pale washed-out haze.')

BODY = {
    'E1': ['A game effects sheet: three flip-book loops of a single flame tongue, painted on black: 24 frames in an 8 by 3 '
           'grid, each frame in its own cell exactly where its grey placeholder is and as large as it.', '',
           'Each row is one loop of eight frames, read left to right; the flame flickers, sways and curls a little from '
           'frame to frame, and frame 8 leads smoothly back into frame 1. Every frame stands on a flat base at the '
           'bottom of its cell, where the flame meets the ground or the burning thing.',
           'Top row: a slender single tongue of flame. Middle row: a forked flame of two tongues. Bottom row: a broad '
           'flame of three or four tongues, the largest. Within a row the flame keeps the same size; only its shape moves.',
           'Each flame: a pale golden-white core low in the flame, an orange body of curling flame-shaped brush strokes, '
           'deep red ragged tips that fade into the black, a few tiny sparks. Painted, not smooth: the tongues have '
           'the torn, flickering edges of real fire.'],
    'E7c': ['A game effects sheet: the inner core of a creature\'s fire breath, painted on black: four frames of the same '
            'stream of fire, one in each cell of a 2 by 2 grid, each exactly where its grey placeholder is and as large as it.', '',
            'In every frame the stream leaves a creature\'s jaws at the small bright point at the left of the cell and '
            'pours to the right, along the ground, widening as it goes. Paint only the core: a fierce jet of '
            'white-gold and yellow fire, brightest and narrowest at the left, which loosens into tongues and flickers '
            'and fades toward the right end. The outer billows are a separate sheet: leave them out.',
            'The four frames are one loop: the jet\'s tongues and flickers move from frame to frame while its length '
            'and width stay the same.'],
    'E7b': ['A game effects sheet: the outer billows of a creature\'s fire breath, painted on a flat blue key: four frames '
            'of the same stream of fire, one in each cell of a 2 by 2 grid, each exactly where its grey placeholder is '
            'and as large as it.', '',
            'In every frame the stream leaves a creature\'s jaws at the small bright point at the left of the cell and '
            'rolls to the right along the ground, widening as it goes, its lower edge touching the ground and its '
            'billows rising above it. Paint only the outer body of the stream: rolling billows of flame and smoke along '
            'its whole length, thicker and darker toward the right end, where it spreads and slows. Along the middle of '
            'the stream, where the dark line of the placeholder runs, the billows thin out: the bright core is a '
            'separate sheet drawn over them.',
            'The four frames are one loop: the billows roll forward from frame to frame while the stream\'s length and '
            'width stay the same.'],
    'L5': ['A seamless square texture of tree bark for a game: dark, deeply ridged, living oak and pine bark that fills the '
           'whole image from edge to edge, seen straight on, with no edges, no trunk outline, no background.', '',
           'Long vertical ridges and deep cracks, plates of bark overlapping like armour, small patches of moss and grey '
           'lichen in a few of the cracks; bark browns (#3E2E20 to #6B5640) with grey ridges catching a soft light from '
           'the upper left. Even detail and even lightness across the whole image, so it repeats as a tile without a '
           'visible seam or a dark or light patch; no single large feature, no knot hole, no face.'],
    'L6g': ['A game effects sheet: the breath of a great forest wyrm, a gale of thorned seeds and torn leaves, painted on '
            'magenta: four frames of the same gale in a 2 by 2 grid at the top, and ten loose particles in a row at the '
            'bottom, each exactly where its grey placeholder is and as large as it.', '',
            'In every frame the gale leaves the wyrm\'s jaws at the small point at the left of the cell and blasts to the '
            'right along the ground, widening as it goes: a dense stream of spiked seed pods, burrs, thorns, torn green '
            'and brown leaves and twigs, packed tight near the jaws and scattering apart toward the right end. The pale '
            'spore dust that rides with it is a separate sheet: leave it out, keep the magenta clean between the pieces. '
            'The four frames are one loop: the pieces move along the stream from frame to frame while its length and '
            'width stay the same.',
            'Bottom row, left to right: four spiked seed pods and burrs, each different; three torn leaves, ragged, each a '
            'different shape; three small clumps of pale green-grey spores.'],
    'L6s': ['A game effects sheet: the spore dust in a great forest wyrm\'s breath, painted in greys on black: four frames of '
            'the same cloud in a 2 by 2 grid at the top and five spore puffs in a row at the bottom, each exactly where '
            'its grey placeholder is and as large as it.', '',
            'In every frame the cloud leaves the wyrm\'s jaws at the left of the cell and rolls to the right along the '
            'ground, widening as it goes: soft, billowing, powdery dust, denser near the jaws and thinning into wisps at '
            'the right end. The four frames are one loop: the billows roll forward from frame to frame while the cloud\'s '
            'length and width stay the same.',
            'Spores are painted in greys only: a light warm grey where the dust is thick, fading through dark grey into '
            'the black at its edges. No colour, no glow, no pure white. In the game its brightness becomes its opacity '
            'and the game tints it, so keep the black background clean.'],
    'H1': ['A game effects sheet for a blessing of holy light: four separate painted sprites on black, each exactly where its '
           'grey placeholder is and as large as it.', '',
           'Left, tall: a column of holy light coming straight down from the sky onto the ground: bundled rays of pale '
           'gold light, soft-edged, brightest at the bottom where it meets the ground in a bright flat ellipse, with a '
           'few tiny motes of light drifting in it; it fades out at its top.',
           'Top middle: a sun disc: a round radiant disc of white-gold light with short straight rays all around it, '
           'brightest in the middle.',
           'Top right: a fan of soft rays of light coming down from above, faint and soft-edged, fading out at their '
           'lower ends.',
           'Bottom right: a halo ring lying on the ground, seen from high above, so it is a flat ellipse about two thirds '
           'as tall as it is wide: a band of soft gold light with a brighter inner edge, a few short rays standing up '
           'from it; dark in the middle.'],
    'G1s': ['A game effects sheet: the sun mana ring, painted on black, two separate sprites, each exactly where its grey '
            'placeholder is and as large as it.', '',
            'Top: a ring of light lying on the ground, seen from high above at 40 degrees, so the ring is a flat ellipse '
            'about two thirds as tall as it is wide: a band of soft white-gold light with short straight rays standing up '
            'from it, small and even all around. At the front of the ring, its foot on the ring\'s near edge, stands the '
            'sun glyph: the game\'s sun symbol, the bold shape of the grey placeholder (a round disc with eight short '
            'straight rays around it), painted as radiant light, brighter than the ring.',
            'Bottom: the sun glyph alone, the same symbol, as a bold, simple shape of radiant light that still reads as '
            'the sun symbol when it is shrunk to 20 pixels.'],
    'U1': ['A game decal sheet of dark magic: marks of creeping shadow, painted on white, each exactly where its grey '
           'placeholder is and as large as it.', '',
           'Top left: dark ripples spreading on the ground: four concentric rings of shadow, inky and uneven, the inner '
           'ones darker, around a dark middle; a flat ellipse.',
           'Top middle: inward tendrils: nine thin curling tendrils of shadow creeping inward over the ground to a dark '
           'middle, like ink drawn into a drain; a flat ellipse.',
           'Top right: four drips of shadow, each a thin inky trickle running down to a heavy drop at its lower end.',
           'Middle band: a long band of dark ripples crossing the whole width, two or three wavy inky bands with soft '
           'edges, for a ripple that rolls across the field.',
           'Bottom two strips: two thin dark threads, inky and slightly twisting, the same thickness from end to end, '
           'each filling its strip, for a thread of drained life.',
           'Soft, painterly ink and smoke edges; no hard vector lines.'],
    'V1': ['A game effects sheet of glowing veins, painted on black: eight vein overlays in a 4 by 2 grid at the top and two '
           'long vein strips at the bottom, each exactly where its grey placeholder is and as large as it.', '',
           'Each overlay is a branching network of veins of light, as if burning under a warrior\'s skin: thick trunks '
           'that split into thinner and thinner branches, brightest along the trunks and fading at the fine tips. The odd '
           'ones (first, third, fifth, seventh) grow up from the bottom of their cell like the veins of a leg and a torso; '
           'the even ones spread out from the middle in all directions like a web. Each is a different shape.',
           'Bottom: two long single veins running across the whole width, the same thickness from end to end, with short '
           'side branches, for a rope texture.',
           'The veins are pale: warm white light lines, almost without colour, because the game tints them (red for '
           'blood fury). No red, no orange flame, no fire, no sparks.'],
}


def prompt(sheet):
    S = SHEETS[sheet]
    lines = []
    refs = REFS[sheet]
    n0 = 1
    if sheet != 'L5':
        bgname = BGW[S['bg']].split(' (')[0].replace('perfectly flat ', '')
        lines.append(f'Image 1 is the layout guide: flat grey placeholder shapes on a {bgname} background, one for each element of '
                     'this sheet. Keep every element exactly where its placeholder is, at exactly its size, and paint it as '
                     'described below; no grey placeholder may remain. Copy only the layout and the sizes from Image 1, never its '
                     'flat grey shading.')
        n0 = 2
    for i, r in enumerate(refs, start=n0):
        lines.append(f'Image {i} is {REF_WORDS[r]}. Copy its hand, its brushwork and its palette, but nothing of its '
                     'subject, framing, lighting or background.')
    lines.append('')
    lines += BODY[sheet]
    lines.append('')
    if sheet != 'L5':
        lines.append(FP.CAM)
    b = S['blend']
    if b == 'add':
        lines += ['', FP.LIGHT_ADD]
        lines.append(RADIANCE if sheet in ('H1', 'G1s') else '' if sheet == 'V1' else
                     FP.EMBER.replace('; dark charcoal smoke where the fire thins.', '; no smoke.'))
    elif b == 'luma':
        lines += ['', 'The dust is matter, not light: it does not glow.']
    elif b == 'multiply':
        lines += ['', FP.DECAL, UMBRA]
    elif b == 'normal' and sheet == 'E7b':
        lines += ['', FIRE_BILLOW]
    elif b == 'normal':
        lines += ['', FP.LIGHT_MATTER, FP.LOAM]
    lines += ['', FP.STYLE.replace('20 pixels', '24 pixels') if sheet != 'L5' else FP.STYLE.split(' Each element')[0] + ' It is not a '
              'cartoon: no cel shading, no thick black outlines, no glossy 3D render, no pixel art, no photograph.', '']
    if sheet == 'L5':
        lines.append('The texture fills the whole square image; no border, no background, no text, no labels.')
    else:
        lines.append(f'Background: {BGW[S["bg"]]}, completely uniform from edge to edge, with no texture, no vignette, no grid lines, '
                     'no frames, no labels, no numbers and no text. Every element stands apart from the others with clear '
                     'background between them, and none touches the edge of the image.')
    if S['bg'] == 'magenta':
        lines.append('No magenta, pink or purple anywhere in the painted elements.')
    if S['bg'] == 'blue':
        lines.append('No blue, cyan or violet anywhere in the painted elements: the blue is cut away by the game.')
    txt = '\n'.join(x for x in lines if x is not None) + '\n'
    txt = txt.replace('\n\n\n', '\n\n')
    for w in ('Total War', 'Warhammer', 'Dominions', 'Age of Wonders', 'Riot', 'League of Legends', 'Blizzard', 'Diablo',
              'Warcraft', 'Magic: The Gathering', 'Disney', 'Pixar', 'Ghibli', 'Frazetta', 'Rembrandt', 'Rutkowski', 'Tolkien'):
        assert w.lower() not in txt.lower(), (sheet, w)
    return txt


def main(only=None):
    for d in ('guides', 'prompts', 'cut'):
        os.makedirs(os.path.join(FX, d), exist_ok=True)
    jobs = []
    for sheet in SHEETS:
        if only and sheet not in only:
            continue
        p = os.path.join(FX, 'prompts', sheet + '.txt')
        open(p, 'w').write(prompt(sheet))
        refs = []
        if sheet != 'L5':
            g = os.path.join(FX, 'guides', sheet + '.guide.png')
            render_guide(sheet, g)
            refs.append(g)
        refs += [REF[r] for r in REFS[sheet]]
        for cand, model, tag in (('a', 'gemini-nano-banana-2.1', 'nb21'), ('b', 'gemini-3-pro-image', 'g3pro')):
            jobs.append({'job': f'{sheet}.{cand}', 'sheet': sheet, 'cand': cand, 'model': model, 'aspect': SHEETS[sheet]['aspect'],
                         'prompt': p, 'refs': refs, 'out': os.path.join(STAGE, 'raw', f'{sheet}.{cand}.{tag}.png'),
                         'purpose': f'D rest: {sheet} {SHEETS[sheet]["title"]} sheet, candidate {cand} ({tag})'})
    json.dump(jobs, open(os.path.join(FX, 'jobs.json'), 'w'), indent=1)
    print(len(jobs), 'jobs')


if __name__ == '__main__':
    main(sys.argv[1:] or None)
