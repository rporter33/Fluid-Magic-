# The art director's re-rolls for the stage D pilot (units/stage-d/critique.md, "Re-rolls"): layouts, layout guides,
# prompts and jobs for
#   L2h  roots and vines as open coils, each growth stage and each withered stage as a back half and a front half
#   L3k  the ground crack as a heaved furrow strip on magenta (normal blend, sunlit clods), a crack head and clods
#   E3e  the fire burst's frames 4 to 6 repainted with fire and embers only (an edit of E3.r2; a fresh g3pro after it)
#   G1f  the flame mana ring on black (additive) with the flame glyph at its front, and the glyph alone
#   G1l  the leaf mana ring on magenta (Loam is matter) with the leaf glyph at its front, and the glyph alone
# Two candidates per sheet (a = gemini-nano-banana-2.1, the portraits' model; b = gemini-3-pro-image). Prompts never name
# another game, franchise, artist or studio (checked). The glyphs are the game's own mana symbols (the map mockup's
# MANA paths, visual-v4/map/parts/p10a-icons.js), drawn into the guides.
# Usage: python3 -I fx_reroll.py   -> work/guides/<sheet>.guide.png, work/prompts/<sheet>.txt, work/jobs-fix.json
import json, math, os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fx_layouts import SIZES, BG, SQ, grid  # noqa: E402
import fx_guides as FG  # noqa: E402
import fx_prompts as FP  # noqa: E402

WORK = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(WORK, '..'))
FLAME = 'M12 21c-4 0-6-3-6-6 0-4 3-6 4-10 1 3 3 4 3 6 1-1 2-2 2-4 2 2 3 5 3 8 0 3-2 6-6 6z'
LEAF = 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8'

# ---- layouts (boxes in the generator's output pixels, as fx_layouts.py) ----
STAGES = ['coil1', 'coil2', 'coil3', 'wither1', 'wither2', 'wither3']
L2H_NAMES = [f'{s}{h}' for s in STAGES for h in ('B', 'F')]
REROLL = {
    'L2h': {'title': 'open root coils, back and front halves', 'aspect': '4:3', 'bg': 'magenta', 'blend': 'normal', 'color': 'loam',
            'els': [dict(e, shape='halfcoil', stage=i // 2, half='BF'[i % 2]) for i, e in enumerate(grid(0, 0, 1200, 896, 6, 2, L2H_NAMES, pad=6))]},
    'L3k': {'title': 'heaved ground crack, keyed', 'aspect': '3:2', 'bg': 'magenta', 'blend': 'normal', 'color': 'earth', 'els': [
        {'name': 'crackWide', 'box': [24, 36, 1240, 236], 'shape': 'furrow'},
        {'name': 'crackHead', 'box': [60, 300, 600, 640], 'shape': 'head'},
        {'name': 'crackHead2', 'box': [680, 330, 1180, 620], 'shape': 'head'},
    ] + [dict(e, shape='clod', k=i) for i, e in enumerate(grid(40, 676, 1224, 832, 6, 1, ['clod%d' % i for i in range(1, 7)], pad=14))]},
    'G1f': {'title': 'flame mana ring and glyph', 'aspect': '1:1', 'bg': 'black', 'blend': 'add', 'color': 'ember', 'els': [
        {'name': 'glyphRingR', 'box': [70, 70, 954, 690], 'shape': 'glyphring', 'glyph': 'flame'},
        {'name': 'glyphR', 'box': [392, 730, 632, 990], 'shape': 'glyph', 'glyph': 'flame'},
    ]},
    'G1l': {'title': 'leaf mana ring and glyph', 'aspect': '1:1', 'bg': 'magenta', 'blend': 'normal', 'color': 'loam', 'els': [
        {'name': 'glyphRingG', 'box': [70, 70, 954, 690], 'shape': 'glyphring', 'glyph': 'leaf'},
        {'name': 'glyphG', 'box': [392, 730, 632, 990], 'shape': 'glyph', 'glyph': 'leaf'},
    ]},
}
# the coil geometry in a cell (shared with the slicer's anchors): the ring's centre sits 82% down the cell, radius 70 px;
# the man's hips are 150 px above the ring's centre (stage 3 reaches them)
COIL = {'baseK': 0.80, 'rx': 66, 'hips': 150, 'heights': [44, 100, 150, 118, 64, 18]}


# ---- an SVG path (the mana glyph) as polygons ----
def svg_polys(d, scale, ox, oy, steps=14):
    toks = re.findall(r'[MmLlHhVvCcSsZz]|-?\d*\.?\d+(?:e-?\d+)?', d)
    polys, cur, i, cmd = [], [], 0, None
    x = y = sx0 = sy0 = 0.0
    lc = None

    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v

    def cubic(p0, p1, p2, p3):
        for k in range(1, steps + 1):
            t = k / steps; u = 1 - t
            cur.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
                        u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))
    while i < len(toks):
        if re.match(r'[A-Za-z]', toks[i]):
            cmd = toks[i]; i += 1
            if cmd in 'Zz':
                if cur: polys.append(cur)
                cur = []; x, y = sx0, sy0; lc = None
                continue
        rel = cmd.islower(); c = cmd.upper()
        if c == 'M':
            if cur: polys.append(cur)
            nx, ny = num(), num()
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            sx0, sy0 = x, y; cur = [(x, y)]; cmd = 'l' if rel else 'L'; lc = None
        elif c == 'L':
            nx, ny = num(), num(); x, y = (x + nx, y + ny) if rel else (nx, ny); cur.append((x, y)); lc = None
        elif c == 'H':
            nx = num(); x = x + nx if rel else nx; cur.append((x, y)); lc = None
        elif c == 'V':
            ny = num(); y = y + ny if rel else ny; cur.append((x, y)); lc = None
        elif c in 'CS':
            if c == 'C':
                a = [num() for _ in range(6)]
                p1 = (x + a[0], y + a[1]) if rel else (a[0], a[1])
                p2 = (x + a[2], y + a[3]) if rel else (a[2], a[3])
                p3 = (x + a[4], y + a[5]) if rel else (a[4], a[5])
            else:
                a = [num() for _ in range(4)]
                p1 = (2 * x - lc[0], 2 * y - lc[1]) if lc else (x, y)
                p2 = (x + a[0], y + a[1]) if rel else (a[0], a[1])
                p3 = (x + a[2], y + a[3]) if rel else (a[2], a[3])
            cubic((x, y), p1, p2, p3); lc = p2; x, y = p3
    if cur: polys.append(cur)
    return [[(ox + px * scale, oy + py * scale) for px, py in p] for p in polys]


def glyph_draw(cv, name, cx, cy, size, col, width_k=0.13):
    """The game's mana glyph centred at (cx, cy), size px across its 24-unit box: a filled flame, or a filled leaf with
    its midrib (the guide's grey placeholder)."""
    s = size / 24
    if name == 'flame':
        polys = svg_polys(FLAME, s, cx - 12 * s, cy - 12 * s)
        m = FG.poly_mask(cv.w, cv.h, polys[0], 1.2)
        yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
        cv.shade(m, col + 40 * np.clip((cx - xx) / size + (cy - yy) / size, -0.5, 0.5))
    else:
        polys = svg_polys(LEAF, s, cx - 12 * s, cy - 12 * s)
        m = FG.poly_mask(cv.w, cv.h, polys[0], 1.2)
        yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
        cv.shade(m, col + 40 * np.clip((cx - xx) / size + (cy - yy) / size, -0.5, 0.5))
        rib = polys[1] if len(polys) > 1 else [(cx - 7 * s, cy + 7 * s), (cx + 1 * s, cy - 1 * s)]
        cv.blend(FG.line_mask(cv.w, cv.h, rib, max(3, size * 0.035), 1.0), col - 55)


def legs_outline(cv, cx, base_y, hips, col=(236, 226, 236)):
    """A thin pale outline of a man's two legs, from the ground to his hips (the space the coils leave empty)."""
    im = Image.new('L', (cv.w, cv.h), 0)
    d = ImageDraw.Draw(im)
    for side in (-1, 1):
        pts = [(cx + side * 2, base_y - hips), (cx + side * 23, base_y - hips + 6), (cx + side * 19, base_y - hips * 0.45), (cx + side * 17, base_y - 4),
               (cx + side * 5, base_y - 4), (cx + side * 4, base_y - hips * 0.45)]
        d.line(pts + [pts[0]], fill=255, width=2)
    m = np.asarray(im.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
    cv.blend(m, col)


def draw_halfcoil(cv, e, seed):
    x0, y0, x1, y1 = e['box']
    cx, bh = (x0 + x1) / 2, y1 - y0
    st, half = e['stage'], e['half']
    wither = st >= 3
    base_y = y0 + bh * COIL['baseK']
    rx = COIL['rx'] * ([1.0, 1.0, 1.0, 1.05, 1.12, 1.18][st])
    ry = rx * SQ
    hgt = COIL['heights'][st]
    R = FG.rng(seed)
    # the ring of cracked earth: the far arc (back half) or the near arc (front half), a band 14 px thick
    a0, a1 = (math.pi, 2 * math.pi) if half == 'B' else (0, math.pi)
    outer = [(cx + math.cos(a) * (rx + 10), base_y + math.sin(a) * (ry + 6)) for a in np.linspace(a0, a1, 30)]
    inner = [(cx + math.cos(a) * (rx - 8), base_y + math.sin(a) * (ry - 5)) for a in np.linspace(a1, a0, 30)]
    cv.blend(FG.poly_mask(cv.w, cv.h, outer + inner, 2) * 0.85, 112)
    # tendrils lying on the ground, radiating out from the ring (two per half)
    for j in range(2):
        a = (a0 + (j + 0.5) / 2 * (a1 - a0)) + R.uniform(-0.3, 0.3)
        p0 = (cx + math.cos(a) * rx, base_y + math.sin(a) * ry)
        L = R.uniform(22, 30) * (0.6 if st == 0 else 1)
        pts = [(p0[0] + math.cos(a) * L * q + 5 * math.sin(q * 6), p0[1] + math.sin(a) * L * q * SQ) for q in np.linspace(0, 1, 12)]
        cv.blend(FG.line_mask(cv.w, cv.h, pts, 6, 1.0), 92)
    # the man's legs (outline only, never painted): the empty middle
    legs_outline(cv, cx, base_y, COIL['hips'])
    # rising tendrils: open spirals with clear gaps, on the far side (behind the legs) or the near side (in front)
    n = [3, 4, 5, 4, 3, 0][st]
    for s in range(n):
        ph = s * 2 * math.pi / max(1, n) + R.uniform(-0.3, 0.3)
        pts = []
        for i in range(40):
            q = i / 39
            a = ph + q * 1.6 * math.pi
            rr = rx * (1.0 - 0.38 * q) * (1.1 if wither and st >= 4 else 1)
            y = base_y - q * hgt + math.sin(a) * rr * SQ * 0.55
            if wither:
                y += (q ** 2) * hgt * (0.25 if st == 3 else 0.5)  # sagging
            far = math.sin(a) < 0  # the far side of the spiral (behind the legs)
            px = cx + math.cos(a) * rr
            hidden = half == 'B' and abs(px - cx) < 22  # a back tendril passes behind the legs: a gap in the guide
            if (half == 'B') == far and not hidden:
                pts.append((px, y))
            elif len(pts) > 2:
                cv.blend(FG.line_mask(cv.w, cv.h, pts, 7, 1.0), 72 + 24 * (s % 2)); pts = []
            else:
                pts = []
        if len(pts) > 2:
            cv.blend(FG.line_mask(cv.w, cv.h, pts, 7, 1.0), 72 + 24 * (s % 2))
    if st == 5:  # fallen: broken dry pieces on the ground along the half ring
        for j in range(8):
            a = a0 + (j + 0.5) / 8 * (a1 - a0)
            p = (cx + math.cos(a) * rx * R.uniform(0.8, 1.1), base_y + math.sin(a) * ry * R.uniform(0.8, 1.1))
            ang = R.uniform(0, math.pi)
            cv.blend(FG.line_mask(cv.w, cv.h, [(p[0] - 12 * math.cos(ang), p[1] - 6 * math.sin(ang)), (p[0] + 12 * math.cos(ang), p[1] + 6 * math.sin(ang))], 6, 1.0), 90)


def draw_el(cv, sheet, e):
    x0, y0, x1, y1 = e['box']
    cx, cy, bw, bh = (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0
    seed = sum(map(ord, sheet + e['name']))
    s = e['shape']
    if s == 'halfcoil':
        draw_halfcoil(cv, e, seed)
    elif s == 'furrow':  # light lips with clods along both sides, a dark jagged split along the middle, tapered ends
        R = FG.rng(seed)
        n = 90
        xs = np.linspace(x0 + 10, x1 - 10, n)
        taper = np.sin(np.linspace(0, math.pi, n)) ** 0.55
        mid = cy + 6 * np.sin(np.linspace(0, 9, n))
        for side in (-1, 1):  # the heaved lips: lit grey bands
            top = [(x, m + side * 4 * t) for x, m, t in zip(xs, mid, taper)]
            bot = [(x, m + side * (4 + 46 * t)) for x, m, t in zip(xs, mid, taper)]
            cv.blend(FG.poly_mask(cv.w, cv.h, top + bot[::-1], 3), 168 if side < 0 else 142)
        for j in range(60):  # clods along the lips
            k = R.integers(4, n - 4)
            side = R.choice([-1, 1])
            FG.sphere(cv, xs[k], mid[k] + side * R.uniform(14, 40) * taper[k], R.uniform(5, 11) * taper[k] + 2, 80, 205)
        split = [(x, m + 9 * t * math.sin(i * 1.9)) for i, (x, m, t) in enumerate(zip(xs, mid, taper))]
        cv.blend(FG.line_mask(cv.w, cv.h, split, 14, 1.2), 45)
    elif s == 'head':  # clods and dust thrown up and forward (to the right)
        R = FG.rng(seed)
        FG.cloud(cv, cx - bw * 0.18, cy + bh * 0.2, bh * 0.30, seed, n=6, lo=120, hi=190, sq=0.7)
        for j in range(26):
            q = R.uniform(0, 1)
            px = x0 + bw * (0.25 + 0.65 * q) + R.uniform(-20, 20)
            py = y1 - bh * (0.25 + 0.55 * math.sin(math.pi * q) * R.uniform(0.6, 1.0))
            FG.sphere(cv, px, py, R.uniform(6, 15), 80, 205)
        cv.blend(FG.ell_mask(cv.w, cv.h, x0 + bw * 0.22, y1 - bh * 0.18, bw * 0.2, bw * 0.2 * SQ, 6) * 0.8, 70)
    elif s == 'clod':
        FG.blob(cv, cx, cy + 6, min(bw, bh) * 0.32, seed, n=9, jitter=0.3, col=120, sq=0.8)
        FG.sphere(cv, cx - 6, cy, min(bw, bh) * 0.22, 90, 210)
    elif s == 'glyphring':
        rx, ry = bw / 2 - 30, (bw / 2 - 30) * SQ
        ecy = y0 + 30 + ry + 40
        band = FG.ell_mask(cv.w, cv.h, cx, ecy, rx + 16, ry + 11, 3) - FG.ell_mask(cv.w, cv.h, cx, ecy, rx - 16, ry - 11, 3)
        cv.blend(np.clip(band, 0, 1), 110)
        R = FG.rng(seed)
        for j in range(30):  # small elements along the ring (flame tongues or leaves)
            a = 2 * math.pi * j / 30 + R.uniform(-0.05, 0.05)
            px, py = cx + math.cos(a) * rx, ecy + math.sin(a) * ry
            if e['glyph'] == 'flame':
                h = R.uniform(26, 40)
                FG.Canvas.blend(cv, FG.poly_mask(cv.w, cv.h, [(px - 7, py + 4), (px, py - h), (px + 7, py + 4)], 1.5), 165)
            else:
                ang = a + math.pi / 2 + R.uniform(-0.6, 0.6)
                pts = [(px + math.cos(q) * 16 * math.cos(ang) - math.sin(q) * 7 * math.sin(ang), py + (math.cos(q) * 16 * math.sin(ang) + math.sin(q) * 7 * math.cos(ang)) * SQ) for q in np.linspace(0, 2 * math.pi, 16)]
                cv.blend(FG.poly_mask(cv.w, cv.h, pts, 1.2), 150)
        # the glyph standing at the ring's front (its foot on the near arc)
        gs = 190
        glyph_draw(cv, e['glyph'], cx, ecy + ry - gs * 0.42, gs, 150)
    elif s == 'glyph':
        glyph_draw(cv, e['glyph'], cx, cy, min(bw, bh) - 20, 150)


def render_guide(sheet, out):
    S = REROLL[sheet]
    w, h = SIZES[S['aspect']]
    cv = FG.Canvas(w, h, BG[S['bg']])
    for e in S['els']:
        draw_el(cv, sheet, e)
    Image.fromarray(np.clip(cv.img, 0, 255).astype(np.uint8)).save(out)
    return out


# ---- prompts ----
LOAM_MATTER = FP.LIGHT_MATTER
BODY = {
    'L2h': ['A game effects sheet: roots and vines that seize a man by the legs, painted on magenta, in twelve separate '
            'sprites, one in each cell of a 6 by 2 grid, each where its grey placeholder is and as large as it.', '',
            'The man is never painted. In each cell a thin pale outline marks where his two legs stand, from the ground '
            'to his hips: leave that space empty magenta, never paint legs, feet or a body there, and never paint the '
            'outline itself.',
            'Each growth stage is painted as two separate sprites side by side, so the game can draw the man\'s legs '
            'between them: on the left the back half, on the right the front half.',
            'The back half: the far arc of a ring of cracked, heaved earth around the empty middle, the roots and vines '
            'that rise from that far arc and curl up behind where the legs stand, and a few tendrils lying on the ground '
            'radiating outward from the ring.',
            'The front half: the near arc of the same ring and the roots and vines that rise from it and spiral up '
            'across the front of where the legs stand, crossing it at a slant.',
            'Both halves are open and see-through: separate twisting tendrils with clear magenta gaps between them, '
            'like a loose basket of roots, never a solid mound, a cocoon or a filled shape.',
            'Top row, three growth stages of living roots, each as its back half and its front half: 1: roots just '
            'breaking out of the cracked ring, ankle high; 2: tendrils climbing and twisting to the knees; 3: fully '
            'grown, spiralling up to the hips, with a few small leaves and thorns.',
            'Bottom row, the same three stages withered: 1: brittle and brown, sagging; 2: collapsing, strands breaking '
            'and falling outward; 3: fallen: a low litter of dry broken root pieces lying on the ground in the ring.',
            'Living roots: bark browns and moss, with living green on the newest growth and a few small yellow-green '
            'shoots; withered roots: dry grey-brown, ochre and dead-leaf brown, with no green.'],
    'L3k': ['A game effects sheet: a crack heaved up through the ground by roots, painted on magenta, in separate sprites, '
            'each exactly where its grey placeholder is and as large as it.', '',
            'Top, across the whole width: a heaved furrow, seen from high above: a dark jagged split along its middle, '
            'and broken clods and torn turf pushed up along both of its lips. The clods\' upper-left faces are lit by '
            'the sun, with soft shadow to their lower right, so the strip reads light, dark, light across its width '
            'even when it is shrunk to 16 pixels tall. It tapers cleanly to a point at both ends and keeps the same '
            'look all along, because the game stretches it along the ground like a rope.',
            'Middle, two sprites: the running head of the crack: clods of earth, torn turf and a puff of dust thrown up '
            'and forward to the right, as the crack tears along the ground toward the right; seen from high above at '
            '40 degrees, the clods in the air higher up the image than those on the ground.',
            'Bottom row: six loose clods of earth and turf, each a different shape, lit from the upper left.',
            'Earth colours: soil browns, dark umber in the split, a little green and ochre turf on the lips.'],
    'G1f': ['A game effects sheet: the flame mana ring, painted on black, two separate sprites, each exactly where its '
            'grey placeholder is and as large as it.', '',
            'Top: a ring of small painted flame tongues lying on the ground, seen from high above at 40 degrees, so the '
            'ring is a flat ellipse about two thirds as tall as it is wide; the tongues lick upward from the ring line, '
            'small and even all around. At the front of the ring, its foot on the ring\'s near edge, stands the flame '
            'glyph: the game\'s flame symbol, the bold flame silhouette of the grey placeholder (a tall main tongue '
            'curling up with a smaller tongue at its side), painted as living fire, brighter than the ring.',
            'Bottom: the flame glyph alone, the same symbol, standing upright, as a bold, simple shape of living fire '
            'that still reads as the flame symbol when it is shrunk to 20 pixels.'],
    'G1l': ['A game effects sheet: the leaf mana ring, painted on magenta, two separate sprites, each exactly where its '
            'grey placeholder is and as large as it.', '',
            'Top: a ring of leaves and young vines lying on the ground, seen from high above at 40 degrees, so the ring '
            'is a flat ellipse about two thirds as tall as it is wide: small fresh leaves and thin twining vine stems '
            'along the ring line, even all around. At the front of the ring, its foot on the ring\'s near edge, stands '
            'the leaf glyph: the game\'s leaf symbol, the bold leaf silhouette of the grey placeholder (a pointed leaf '
            'with a straight midrib running from its stem), painted as a living leaf, larger and brighter than the '
            'ring\'s leaves.',
            'Bottom: the leaf glyph alone, the same symbol, as a bold, simple living leaf that still reads as the leaf '
            'symbol when it is shrunk to 20 pixels.'],
}
REFS = {'L2h': ['treant', 'worldTree'], 'L3k': ['worldTree', 'anchor'], 'G1f': ['fireSprite', 'anchor'], 'G1l': ['treant', 'worldTree']}
BANNED = ('Total War', 'Warhammer', 'Dominions', 'Age of Wonders', 'Riot', 'League of Legends', 'Blizzard', 'Diablo', 'Warcraft',
          'Magic: The Gathering', 'Disney', 'Pixar', 'Ghibli', 'Frazetta', 'Rembrandt', 'Rutkowski', 'Hearthstone', 'Elden', 'Final Fantasy')


def check(txt, tag):
    for w in BANNED:
        assert w.lower() not in txt.lower(), (tag, w)
    return txt


def prompt(sheet):
    S = REROLL[sheet]
    bg = FP.BGW[S['bg']]
    lines = [f'Image 1 is the layout guide: flat grey placeholder shapes on a {bg.split(" (")[0].replace("perfectly flat ", "")} '
             'background, one for each element of this sheet. Keep every element exactly where its placeholder is, at '
             'exactly its size, and paint it as described below; no grey placeholder may remain. Copy only the layout '
             'and the sizes from Image 1, never its flat grey shading.']
    for i, r in enumerate(REFS[sheet], start=2):
        lines.append(f'Image {i} is {FP.REF_WORDS[r]}. Copy its hand, its brushwork and its palette, but nothing of its '
                     'subject, framing, lighting or background.')
    lines.append('')
    lines += BODY[sheet]
    lines += ['', FP.CAM]
    if S['blend'] == 'add':
        lines += ['', FP.LIGHT_ADD, FP.EMBER.replace('; dark charcoal smoke where the fire thins', '; no smoke')]
    elif sheet == 'L3k':
        lines += ['', LOAM_MATTER.replace('every root, thorn and leaf', 'every clod and lip of earth')]
    else:
        lines += ['', LOAM_MATTER, FP.LOAM]
    lines += ['', FP.STYLE, '',
              f'Background: {bg}, completely uniform from edge to edge, with no texture, no vignette, no grid lines, no '
              'frames, no labels, no numbers and no text. Every element stands apart from the others with clear '
              'background between them, and none touches the edge of the image.']
    if S['bg'] == 'magenta':
        lines.append('No magenta, pink or purple anywhere in the painted elements.')
    return check('\n'.join(lines) + '\n', sheet)


E3E = ('Image 1 is a finished game effects sheet: six frames of one fireball exploding on the ground, painted on pure '
       'black, in a 3 by 2 grid, read left to right, top row then bottom row. Repaint it exactly as it is: the top row '
       '(frames 1, 2 and 3) stays exactly the same, the same painting, colours, brushwork, sizes and places. Only the '
       'bottom row (frames 4, 5 and 6) is repainted, with fire and embers only and no smoke anywhere: no dark clouds, '
       'no grey or brown billows, no smoke columns or wisps, because the game adds its own smoke.\n\n'
       'Frame 4 (bottom left): the dome of frame 3 tearing open into curling orange and deep red tongues of flame, '
       'licking outward and down, its middle dimmer; the same low, wide dome shape seen from high above, no more than '
       'a tenth wider than frame 3, centred in its cell with black all around it.\n\n'
       'Frame 5 (bottom middle): a ring of low flames running along the ground around a dark, burnt middle; the ring is '
       'a flat ellipse about two thirds as tall as it is wide, seen from high above at 40 degrees; the middle is dark '
       'charred ground with a few glowing cracks, not smoke.\n\n'
       'Frame 6 (bottom right): small glowing embers and flickers lying in a broken ring on the ground, the same flat '
       'ellipse as frame 5, fading; no smoke.\n\n'
       'Image 2 is the approved painted portrait of the game\'s Fire Sprite: it shows how fire is painted in this game; '
       'keep that hand.\n\n'
       'Ember\'s colours: a pale golden-white to golden-yellow core (#FFE9A8 to #FFB347), an orange body (#FD6533) and '
       'deep red edges (#7A1E12) that fade into the black.\n\n'
       'Background: perfectly flat pure black (#000000), completely uniform from edge to edge, with no texture, no '
       'vignette, no grid lines, no frames, no labels, no numbers and no text. Every frame stands apart from the others '
       'with black between them, and none touches the edge of the image.\n')
E3E_B = E3E.replace('Image 1 is a finished game effects sheet', 'Image 1 is the reference: a finished game effects sheet').replace(
    'Repaint it exactly as it is:', 'Paint this sheet again, matching Image 1 as closely as you can:')

MODELS = (('a', 'gemini-nano-banana-2.1', 'nb21'), ('b', 'gemini-3-pro-image', 'g3pro'))


def main():
    os.makedirs(os.path.join(WORK, 'prompts'), exist_ok=True)
    jobs = []
    for sheet in REROLL:
        g = render_guide(sheet, os.path.join(WORK, 'guides', sheet + '.guide.png'))
        p = os.path.join(WORK, 'prompts', sheet + '.txt')
        open(p, 'w').write(prompt(sheet))
        refs = [g] + [FP.REF[r] for r in REFS[sheet]]
        for cand, model, tag in MODELS:
            jobs.append({'job': f'{sheet}.{cand}', 'sheet': sheet, 'cand': cand, 'model': model, 'aspect': REROLL[sheet]['aspect'], 'prompt': p,
                         'refs': refs, 'out': os.path.join(STAGE, 'raw', f'{sheet}.{cand}.{tag}.png'),
                         'purpose': f'D pilot fix: {sheet} {REROLL[sheet]["title"]}, candidate {cand} ({tag})'})
    r2 = os.path.join(STAGE, 'raw', 'E3.r2.nb21.png')
    for cand, model, tag, txt in (('a', 'gemini-nano-banana-2.1', 'nb21', E3E), ('b', 'gemini-3-pro-image', 'g3pro', E3E_B)):
        p = os.path.join(WORK, 'prompts', f'E3e.{cand}.txt')
        open(p, 'w').write(check(txt, 'E3e'))
        jobs.append({'job': f'E3e.{cand}', 'sheet': 'E3e', 'cand': cand, 'model': model, 'aspect': '3:2', 'prompt': p,
                     'refs': [r2, FP.REF['fireSprite']], 'out': os.path.join(STAGE, 'raw', f'E3e.{cand}.{tag}.png'),
                     'purpose': f'D pilot fix: E3 frames 4 to 6 without smoke, ' + ('an edit of E3.r2 (nb21)' if cand == 'a' else 'a fresh g3pro with E3.r2 as reference')})
    json.dump(jobs, open(os.path.join(WORK, 'jobs-fix.json'), 'w'), indent=1)
    print(len(jobs), 'jobs:', ' '.join(j['job'] for j in jobs))


if __name__ == '__main__':
    main()
