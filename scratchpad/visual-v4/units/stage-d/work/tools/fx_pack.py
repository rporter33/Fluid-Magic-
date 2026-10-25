# Packs the picked pilot effect cuts into one effects atlas (art plan 7.2, skills audit stage D item 3): one page of at
# most 2048 x 2048, 2 px gutters with the colour bled into them, premultiplied-correct Lanczos downscales, plus the few
# procedural frames the layer needs (a keylined ground ring and its dashed twin, a footprint ring, a soft disc, white).
#   fire (E2, E3, E4): the alpha is raised x1.7 and the premultiplied colour kept, so one frame serves both passes: its
#   body in normal blend (the saturated paint holds on the light grounds) and its glow in additive blend (the same light).
#   decals (E6, L3): the multiply form of fx_process.py (alpha 1 - min(m), colour (m - min) / alpha), drawn in normal
#   blend inside the decal render group: exact for grey stains, within a few levels for the brown ones.
# Writes atlas/fx/fx-atlas.png, fx-atlas.webp, fx-atlas.json (Pixi spritesheet: frame, anchor, sourceSize; meta: picks,
# blends, nominal world sizes) and fx-data.json for the live build (and the old sandbox's copy).
# The art director's re-rolls (fx_reroll.py, fx_fix_cut.py; units/stage-d/critique.md) replace: the L2 coils by open back
# and front halves (L2h.b, with its dried and withering halves), the wide crack by a keyed heaved furrow with a crack head
# and clods (L3k.a), the burst's frames 4 to 6 by fire without smoke (E3e.a); they add the flame and leaf glyph rings and
# glyphs (G1f.b, G1l.a). Frames the pilot never draws (meteor, smoke columns, burnt ground, flowers, petals, litter,
# stars) stay in their cuts for the rest of stage D but are left out of the pilot's page.
# Usage: python3 -I fx_pack.py
import base64, io, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fx_layouts import SHEETS, SQ  # noqa: E402
WORK = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(WORK, '..'))
OUT = os.path.join(STAGE, 'atlas', 'fx')
PICKS = {'E2': 'a', 'E3': 'r2', 'E4': 'a', 'E5': 'a', 'E6': 'a', 'L1': 'a', 'L2': 'a', 'L3': 'a', 'L4': 'a'}
FIRE = {'E2', 'E3', 'E4', 'G1f'}
# the re-rolls: (sheet in the atlas meta, cut folder, blend, element names)
COILS = [f'{s}{h}' for s in ('coil1', 'coil2', 'coil3', 'dry3', 'wither1', 'wither2', 'wither3') for h in 'BF']
FIX = [('E3', 'E3e.a', 'add', ['burst4', 'burst5', 'burst6']), ('L2', 'L2h.b.clean', 'normal', COILS),
       ('L3', 'L3k.a', 'normal', ['crackWide', 'crackHead', 'crackHead2'] + ['clod%d' % i for i in range(1, 7)]),
       ('G1f', 'G1f.b', 'add', ['glyphRingR', 'glyphR']), ('G1l', 'G1l.a', 'normal', ['glyphRingG', 'glyphG'])]
FIX_PICKS = {'E3 frames 4-6': 'E3e.a', 'L2 halves': 'L2h.b', 'L3 furrow': 'L3k.a', 'G1 flame': 'G1f.b', 'G1 leaf': 'G1l.a'}
REPLACED = {'burst4', 'burst5', 'burst6', 'coil1', 'coil2', 'coil3', 'wither1', 'wither2', 'wither3', 'crackWide'}
UNUSED = {'meteor', 'column1', 'column2', 'burnPatch', 'burntTrack', 'crater', 'flowers1', 'flowers2', 'flowers3', 'litter', 'star1', 'star2', 'orbS'} | {'petal%d' % i for i in range(1, 9)}
# the generator tinted some matter with the key (the dried roots mauve, the crack head's dust pink): their hue goes to
# dry ochre, their value kept (a hue fix, not a repaint)
RECOLOUR = set(n for n in COILS if n.startswith(('dry', 'wither'))) | {'crackHead', 'crackHead2'}
BOOST = 1.7
# stored size: ('w', px) width, ('h', px) height, ('max', px) longer side, ('group', ref, px): the group shares the scale
# that brings its reference element to px wide (a flip-book or growth stages keep their relative sizes)
SIZE = {
    'orbS': ('max', 56), 'orbM': ('max', 88), 'orbL': ('max', 136), 'glow': ('max', 128), 'trail': ('w', 512), 'meteor': ('w', 224),
    'burst*': ('group', 'burst3', 352),
    'ember*': ('max', 40), 'spark*': ('max', 72), 'lick*': ('h', 56), 'dot*': ('max', 56), 'star*': ('max', 64),
    'puff*': ('max', 116), 'column*': ('h', 300),
    'scorchRing': ('w', 352), 'crater': ('w', 128), 'scorchDot': ('w', 72), 'burnPatch': ('w', 160), 'burntTrack': ('w', 320),
    'thornA*': ('group', 'thornA3', 120), 'thornB*': ('group', 'thornB3', 120), 'thornC*': ('group', 'thornC3', 120),
    'coil*': ('grouph', 'coil3B', 112), 'dry*': ('grouph', 'coil3B', 112), 'wither*': ('grouph', 'coil3B', 112), 'vineStrip': ('w', 512),
    'crackThin': ('w', 896), 'crackWide': ('w', 896), 'crackHead*': ('w', 200), 'clod*': ('max', 40), 'splitGround': ('w', 256), 'rootScar*': ('w', 96),
    'glyphRing*': ('w', 360), 'glyphR': ('h', 96), 'glyphG': ('h', 96),
    'leaf*': ('max', 36), 'petal*': ('max', 28), 'flowers*': ('w', 104), 'litter': ('w', 192),
}
# anchors: 'ground' = the centre of the base ellipse (a burst, a thorn cluster, a coil, smoke columns' foot); 'centre'
GROUND_ANCHOR = ('burst', 'thorn', 'coil', 'wither', 'column', 'flowers')


def size_rule(name):
    if name in SIZE: return SIZE[name]
    for k, v in SIZE.items():
        if k.endswith('*') and name.startswith(k[:-1]): return v
    return ('max', 128)


def load(sheet, name, folder=None):
    p = os.path.join(WORK, 'cut', folder or f'{sheet}.{PICKS[sheet]}', name + '.png')
    return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255


def recolour(c):
    """Moves magenta-to-pink hues (the key the generator tinted into dry matter) to a dry ochre, value and most of the
    saturation kept."""
    rgb = c[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    sat = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    bad = ((h > 255) | (h < 12)) & (sat > 0.08)
    H, S, V = 32.0, sat * 0.8, mx  # ochre at the same value
    C = V * S; X = C * (1 - abs((H / 60) % 2 - 1)); m = V - C
    o = np.stack([C + m, X + m, m + 0 * C], -1)  # hue 32: r = C, g = X, b = 0 (+ m)
    out = c.copy()
    out[..., :3] = np.where(bad[..., None], o, rgb)
    return out


def despeck(c, keep=0.03, near=10):
    """Drops the loose specks a cut picked up from its neighbours (a leaf or a crumb far below a coil): components of under
    keep of the element's alpha mass lying more than near px outside the main body's box. Trims the cut to what is left."""
    sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "..", "..", "tools")))
    from slice import label
    a = c[..., 3]
    lab = label(a > 0.08)
    ids, cnt = np.unique(lab[lab > 0], return_counts=True)
    if len(ids) < 2: return c
    mass = {int(i): float(a[lab == i].sum()) for i in ids}
    tot = sum(mass.values()); big = max(mass, key=mass.get)
    ys, xs = np.nonzero(lab == big); bx0, bx1, by0, by1 = xs.min() - near, xs.max() + near, ys.min() - near, ys.max() + near
    out = c.copy()
    for i, m in mass.items():
        if i == big or m >= keep * tot: continue
        yy, xx = np.nonzero(lab == i)
        if xx.max() < bx0 or xx.min() > bx1 or yy.max() < by0 or yy.min() > by1: out[lab == i] = 0
    ys, xs = np.nonzero(out[..., 3] > 0.004)
    return out[max(0, ys.min() - 3):ys.max() + 4, max(0, xs.min() - 3):xs.max() + 4], (max(0, xs.min() - 3), max(0, ys.min() - 3))


def pair_anchor(folder, nb, nf, cell=200):
    """The ring centre of a coil's back half and front half, painted in neighbouring grid cells: the two halves overlaid
    one cell apart close the ring; its centre is the anchor of both (so the game draws them exactly round the man)."""
    cj = json.load(open(os.path.join(WORK, 'cut', folder, 'cut.json')))
    E = {e['name']: e for e in cj['elements']}
    eb, ef = E[nb], E[nf]
    ab = load(None, nb, folder)[..., 3]; af = load(None, nf, folder)[..., 3]
    x0 = min(eb['cut'][0], ef['cut'][0] - cell); y0 = min(eb['cut'][1], ef['cut'][1])
    x1 = max(eb['cut'][2], ef['cut'][2] - cell); y1 = max(eb['cut'][3], ef['cut'][3])
    U = np.zeros((y1 - y0, x1 - x0), np.float32)
    def put(a, X, Y):
        U[Y - y0:Y - y0 + a.shape[0], X - x0:X - x0 + a.shape[1]] = np.maximum(U[Y - y0:Y - y0 + a.shape[0], X - x0:X - x0 + a.shape[1]], a)
    put(ab, eb['cut'][0], eb['cut'][1]); put(af, ef['cut'][0] - cell, ef['cut'][1])
    ys, xs = np.nonzero(U > 0.3)
    low = ys >= ys.min() + 0.6 * (ys.max() - ys.min())
    xa, xb = np.percentile(xs[low], 1.5), np.percentile(xs[low], 98.5)
    cx = (xa + xb) / 2; rx = (xb - xa) / 2
    mid = np.abs(xs - cx) < rx * 0.25
    ybot = np.percentile(ys[mid], 99) if mid.any() else ys.max()
    cy = ybot - rx * SQ * 0.9
    CX, CY = cx + x0, cy + y0
    fa = lambda e, dx: ((CX + dx - e['cut'][0]) / e['w'], (CY - e['cut'][1]) / e['h'])
    return fa(eb, 0), fa(ef, cell)


def ring_anchor(c):
    """A glyph ring's centre (its leftmost and rightmost painted points sit on the ring's middle line) and fk, the sprite's
    width over the ring line's diameter."""
    a = c[..., 3]
    ys, xs = np.nonzero(a > 0.3)
    xa, xb = xs.min(), xs.max()
    edge = (xs <= xa + 4) | (xs >= xb - 4)
    cy = float(np.median(ys[edge]))
    D = (xb - xa) * 0.96
    return ((xa + xb) / 2 / c.shape[1], cy / c.shape[0]), c.shape[1] / D


def boost(c):
    a = c[..., 3:4]
    a2 = np.clip(a * BOOST, 0, 1)
    rgb = np.where(a2 > 1e-4, c[..., :3] * a / np.maximum(a2, 1e-4), 0)
    return np.dstack([np.clip(rgb, 0, 1), a2[..., 0]])


def resize(c, w, h):
    w, h = max(1, int(round(w))), max(1, int(round(h)))
    pm = c.copy(); pm[..., :3] *= pm[..., 3:4]
    im = Image.fromarray((np.clip(pm, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').resize((w, h), Image.LANCZOS)
    o = np.asarray(im).astype(np.float32) / 255
    a = o[..., 3:4]
    o[..., :3] = np.where(a > 1e-4, o[..., :3] / np.maximum(a, 1e-4), 0)
    return np.clip(o, 0, 1)


def ground_anchor(c):
    """The centre of a ground-standing element's base ellipse: its lowest quarter's horizontal extent gives rx; the base
    ellipse is centred rx * 0.643 above the lowest painted row."""
    a = c[..., 3]
    ys, xs = np.nonzero(a > 0.25)
    if len(xs) < 4: return 0.5, 0.5
    y1 = np.percentile(ys, 99.0)
    y0 = y1 - (ys.max() - ys.min()) * 0.25
    sel = ys >= y0
    rx = (np.percentile(xs[sel], 97) - np.percentile(xs[sel], 3)) / 2
    cx = (np.percentile(xs[sel], 97) + np.percentile(xs[sel], 3)) / 2
    cy = y1 - rx * SQ
    return float(cx / c.shape[1]), float(np.clip(cy / c.shape[0], 0.3, 0.97))


def proc_frames():
    """Procedural frames (white with a dark keyline, tinted by the game): the ground ring, the dashed curse ring, the
    footprint ring, a soft disc, an elongated soft shadow and white."""
    out = {}
    S = 4  # supersample

    def ring(R, width, dashes=0, key=0.6):
        n = 2 * R + 8
        im = Image.new('RGBA', (n * S, n * S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        c = n * S / 2
        def arc_band(r0, r1, col):
            if dashes:
                for k in range(dashes):
                    a0 = 360 * k / dashes; a1 = a0 + 360 / dashes * 0.58
                    d.pieslice([c - r1, c - r1, c + r1, c + r1], a0, a1, fill=col)
            else:
                d.ellipse([c - r1, c - r1, c + r1, c + r1], fill=col)
            d.ellipse([c - r0, c - r0, c + r0, c + r0], fill=(0, 0, 0, 0))
        kw = width * 0.55
        arc_band((R - width / 2 - kw) * S, (R + width / 2 + kw) * S, (28, 26, 23, int(255 * key)))   # the keyline (#1C1A17)
        top = Image.new('RGBA', im.size, (0, 0, 0, 0)); d2 = ImageDraw.Draw(top)
        d = d2
        arc_band((R - width / 2) * S, (R + width / 2) * S, (255, 255, 255, 255))
        im.alpha_composite(top)
        im = im.resize((n, n), Image.LANCZOS)
        return np.asarray(im).astype(np.float32) / 255
    out['ring'] = ring(92, 3.6)            # large rings: band 3.9% of the radius
    out['ringBold'] = ring(48, 4.4)        # small rings: band 9.2% (the 2 px floor at play zoom, art plan 7.1)
    out['ringDash'] = ring(92, 4.4, dashes=18)
    out['ringDashB'] = ring(40, 4.8, dashes=14)  # the curse ring at 26 wu: a 3 wu band
    out['footRing'] = ring(20, 6)          # footprints at 7 wu: a 2 wu band
    yy, xx = np.mgrid[0:64, 0:64].astype(np.float32)
    dd = np.sqrt((xx - 31.5) ** 2 + (yy - 31.5) ** 2) / 31.5
    a = np.clip(1 - dd, 0, 1) ** 1.4
    out['disc'] = np.dstack([np.ones((64, 64, 3), np.float32), a])
    yy, xx = np.mgrid[0:48, 0:96].astype(np.float32)
    dd = np.sqrt(((xx - 47.5) / 47.5) ** 2 + ((yy - 23.5) / 23.5) ** 2)
    a = np.clip(1 - dd, 0, 1) ** 1.2
    out['shadowLong'] = np.dstack([np.zeros((48, 96, 3), np.float32), a])
    out['white'] = np.ones((8, 8, 4), np.float32)
    return out


def bleed(c, iters=3):
    """Colour into transparent pixels (alpha stays 0) so bilinear sampling never pulls black into an edge."""
    a = c[..., 3]
    known = a > 0.004
    col = np.where(known[..., None], c[..., :3], 0)
    w = known.astype(np.float32)
    for _ in range(iters):
        pc = np.pad(col * w[..., None], ((1, 1), (1, 1), (0, 0))); pw = np.pad(w, 1)
        s = sum(pc[1 + dy:pc.shape[0] - 1 + dy, 1 + dx:pc.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        n = sum(pw[1 + dy:pw.shape[0] - 1 + dy, 1 + dx:pw.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        grow = (~known) & (n > 0)
        col[grow] = s[grow] / n[grow][:, None]
        w = np.where(grow, 1.0, w); known = known | grow
    return np.dstack([col, a])


def main():
    items = []
    groups = {}
    ref_cuts = {}
    sources = []  # (sheet, folder, blend, name)
    for sheet, cand in PICKS.items():
        for e in SHEETS[sheet]['els']:
            if e['name'] in REPLACED or e['name'] in UNUSED: continue
            sources.append((sheet, f'{sheet}.{cand}', SHEETS[sheet]['blend'], e['name']))
    for sheet, folder, blend, names in FIX:
        for n in names: sources.append((sheet, folder, blend, n))
    anchors, fks = {}, {}
    # the coil halves without their loose specks (L2h.b/clean, with the trimmed cut boxes)
    cj = json.load(open(os.path.join(WORK, 'cut', 'L2h.b', 'cut.json')))
    os.makedirs(os.path.join(WORK, 'cut', 'L2h.b.clean'), exist_ok=True)
    for e in cj['elements']:
        if e['name'] not in COILS: continue
        c = load(None, e['name'], 'L2h.b')
        r = despeck(c)
        if isinstance(r, tuple):
            c2, (dx, dy) = r
            e['cut'] = [e['cut'][0] + dx, e['cut'][1] + dy, e['cut'][0] + dx + c2.shape[1], e['cut'][1] + dy + c2.shape[0]]; e['w'], e['h'] = c2.shape[1], c2.shape[0]
        else: c2 = r
        Image.fromarray((np.clip(c2, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(os.path.join(WORK, 'cut', 'L2h.b.clean', e['name'] + '.png'))
    json.dump(cj, open(os.path.join(WORK, 'cut', 'L2h.b.clean', 'cut.json'), 'w'), indent=1)
    for st in ('coil1', 'coil2', 'coil3', 'dry3', 'wither1', 'wither2', 'wither3'):
        anchors[st + 'B'], anchors[st + 'F'] = pair_anchor('L2h.b.clean', st + 'B', st + 'F')
    for sheet, folder, blend, n in sources:
        c = load(sheet, n, folder)
        if n in RECOLOUR: c = recolour(c)
        if sheet in FIRE: c = boost(c)
        rule = size_rule(n)
        if rule[0] in ('group', 'grouph'):
            ref = ref_cuts.get(rule[1])
            if ref is None:
                rf = next(f for (sh, f, bl, nn) in sources if nn == rule[1])
                ref = ref_cuts[rule[1]] = load(None, rule[1], rf)
            k = rule[2] / (ref.shape[0] if rule[0] == 'grouph' else ref.shape[1])
        elif rule[0] == 'w': k = rule[1] / c.shape[1]
        elif rule[0] == 'h': k = rule[1] / c.shape[0]
        else: k = rule[1] / max(c.shape[:2])
        k = min(k, 1.0)
        r = resize(c, c.shape[1] * k, c.shape[0] * k)
        fk = None
        if n in anchors: ax, ay = anchors[n]
        elif n.startswith('glyphRing'): (ax, ay), fk = ring_anchor(r)
        elif n.startswith(GROUND_ANCHOR): ax, ay = ground_anchor(r)
        else: ax, ay = 0.5, 0.5
        if fk: fks[n] = round(fk, 4)
        items.append({'name': n, 'sheet': sheet, 'img': r, 'ax': ax, 'ay': ay, 'blend': blend, 'scale': round(k, 4), 'src': folder})
    for n, img in proc_frames().items():
        items.append({'name': n, 'sheet': 'proc', 'img': img, 'ax': 0.5, 'ay': 0.5, 'blend': 'any', 'scale': 1})
    # shelf packing, tallest first, 2 px gutters
    W, gut = 2048, 2
    items.sort(key=lambda it: (-it['img'].shape[0], -it['img'].shape[1]))
    x = y = shelf = 0
    for it in items:
        h, w = it['img'].shape[:2]
        if x + w + gut > W: x = 0; y += shelf + gut; shelf = 0
        it['x'], it['y'] = x + gut, y + gut
        x += w + gut; shelf = max(shelf, h + gut)
    H = y + shelf + gut
    Hp = 1 << int(math.ceil(math.log2(H)))
    assert Hp <= 2048, ('atlas too tall', H)
    page = np.zeros((Hp, W, 4), np.float32)
    frames = {}
    for it in items:
        h, w = it['img'].shape[:2]
        pad = 2
        b = bleed(np.pad(it['img'], ((pad, pad), (pad, pad), (0, 0))))
        X0, Y0 = it['x'] - pad, it['y'] - pad
        reg = page[Y0:Y0 + h + 2 * pad, X0:X0 + w + 2 * pad]
        m = reg[..., 3:4] <= 0.004
        reg[:] = np.where(m, b, reg)
        frames[it['name']] = {'frame': {'x': it['x'], 'y': it['y'], 'w': w, 'h': h}, 'anchor': {'x': round(it['ax'], 4), 'y': round(it['ay'], 4)},
                              'sourceSize': {'w': w, 'h': h}, 'sheet': it['sheet'], 'blend': it['blend'], 'scale': it['scale'], 'src': it.get('src', '')}
        if it['name'] in fks: frames[it['name']]['ringK'] = fks[it['name']]
    os.makedirs(OUT, exist_ok=True)
    img = Image.fromarray((np.clip(page, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    img.save(os.path.join(OUT, 'fx-atlas.png'), optimize=True)
    img.save(os.path.join(OUT, 'fx-atlas.webp'), quality=90, method=6, alpha_quality=100)
    used = sum(it['img'].shape[0] * it['img'].shape[1] for it in items)
    raw = {}
    for s in PICKS:
        f = [x for x in os.listdir(os.path.join(STAGE, 'raw')) if x.startswith(f'{s}.{PICKS[s]}.') and x.endswith('.json')][0]
        raw[s] = {'candidate': PICKS[s], 'file': 'stage-d/raw/' + f, 'sha256': json.load(open(os.path.join(STAGE, 'raw', f)))['sha256'], 'title': SHEETS[s]['title'],
                  'blend': SHEETS[s]['blend']}
    for k, f in FIX_PICKS.items():
        j = [x for x in os.listdir(os.path.join(STAGE, 'raw')) if x.startswith(f + '.') and x.endswith('.json')][0]
        raw[k] = {'candidate': f, 'file': 'stage-d/raw/' + j, 'sha256': json.load(open(os.path.join(STAGE, 'raw', j)))['sha256']}
    meta = {'app': 'stage D magic pilot, fx_pack.py (with the art director\'s re-rolls)', 'image': 'fx-atlas.png', 'size': {'w': W, 'h': Hp}, 'format': 'RGBA8888', 'scale': 1,
            'fill': round(used / (W * Hp), 3), 'fireAlphaBoost': BOOST, 'picks': raw, 'leftOut': sorted(UNUSED)}
    json.dump({'frames': frames, 'meta': meta}, open(os.path.join(OUT, 'fx-atlas.json'), 'w'), indent=1)
    webp = open(os.path.join(OUT, 'fx-atlas.webp'), 'rb').read()
    fx = {'version': 2, 'image': 'data:image/webp;base64,' + base64.b64encode(webp).decode(), 'w': W, 'h': Hp,
          'frames': {k: [v['frame']['x'], v['frame']['y'], v['frame']['w'], v['frame']['h'], v['anchor']['x'], v['anchor']['y']] + ([v['ringK']] if 'ringK' in v else []) for k, v in frames.items()}}
    json.dump(fx, open(os.path.join(WORK, 'sbx', 'fx-data.json'), 'w'))
    json.dump(fx, open(os.path.join(OUT, 'fx-data.json'), 'w'))  # the live build's
    print(json.dumps({'items': len(items), 'size': [W, Hp], 'fill': meta['fill'], 'pngBytes': os.path.getsize(os.path.join(OUT, 'fx-atlas.png')), 'webpBytes': len(webp)}))


if __name__ == '__main__':
    main()
