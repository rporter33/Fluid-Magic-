# Stage B troops: the shared variation overlays and limits the calibration chose (part 5: owner note 1, "variation within
# the troops ... through shader or reused assets"), produced for every troop type, and a proof that they work on all of
# them, not only the three calibrated sheets.
#   overlays.png / overlays.json - the shared cloth stencils as masks: 8 shield-face designs on the unit disc (plain, rim,
#       ring, pale, fess, quartered, chevron, per bend), crest tip and crest stripes on the top 17% of the body, belt, sash
#       and hem on the body; ids are the variation shader's (calibration var_scene.js). They change only the cloth's
#       lightness, never its hue: light for Cinder (+0.07), dark for Thornwood (-0.11).
#   variation.json - the production limits: cloth one-sided per side (each side's cloth moves only away from the other
#       side's, so the protan/deutan contrast of the two cloths does not drop), skin, metal, leather, brightness, scale,
#       lean, jitter, rest frame, tempo; independents wear undyed grey (no cloth window): their grey wool falls in the
#       metal class (low chroma) and varies warmer or cooler with it. Commanders, creatures and gods get no tints.
#   var-<side>.png - the proof: each troop type's stand frame (tier H) as 8 copies, then 8 figures varied by a numpy port
#       of the shader (material classes, one-sided tints, stencils, brightness, scale, lean), at 2x.
# Usage: python3 tr_variation.py ATLAS_DIR OUT_DIR
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_oklab  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402

LIM = dict(
    cloth={'cinderHorde': dict(L=[0, 0.030], hueDeg=[0, 6], C=[1.0, 1.08], stencil='light', hueRef='#C4532C'),
           'thornwood': dict(L=[-0.035, 0], hueDeg=[0, 6], C=[0.92, 1.0], stencil='dark', hueRef='#1F6A50'),
           'independent': None},
    skinL=[-0.07, 0.05], skinHueDeg=[-6, 6], metalL=[-0.06, 0.05], metalWarm=[-1, 1], leatherL=[-0.05, 0.05],
    bright=[0.92, 1.0], scale=[0.96, 1.04], leanDeg=[-1.5, 1.5], jitterWu=1.2, restIdle2=0.3, tempo=[0.92, 1.08],
    stencilDark=-0.11, stencilLight=0.07, stencilsAtTier='H',
    excluded=['commanders', 'creatures', 'gods', 'mounts'],
    rule='cloth varies one-sidedly per side; the colour-vision contrast of the two cloths must not drop (calibration 5.2)')
SHIELDS = ['plain', 'rim', 'ring', 'pale', 'fess', 'quartered', 'chevron', 'per bend']
BANDS = ['crest tip', 'crest stripes', 'belt', 'sash', 'hem']


def shield_mask(i, p):
    x, y = p[..., 0], p[..., 1]
    r = np.hypot(x, y)
    inside = r < 1
    m = np.zeros(r.shape, bool)
    if i == 1: m = r >= 0.70
    elif i == 2: m = (r >= 0.42) & (r <= 0.60)
    elif i == 3: m = np.abs(x) <= 0.22
    elif i == 4: m = np.abs(y) <= 0.22
    elif i == 5: m = x * y >= 0
    elif i == 6:
        y0 = 0.15 - 0.9 * np.abs(x); m = (y >= y0) & (y <= y0 + 0.36)
    elif i == 7: m = x + y >= 0
    return m & inside


def band_mask(kind, fy, fx):
    if kind == 'crest tip': return fy <= 0.07
    if kind == 'crest stripes': return (fy < 0.17) & (np.floor(fx * 7 * 2) % 2 == 1)
    if kind == 'belt': return np.abs(fy - 0.55) <= 0.03
    if kind == 'sash': return (np.abs((fy - 0.30) - 0.75 * (fx - 0.35)) <= 0.045) & (fy >= 0.2) & (fy <= 0.75)
    return fy >= 0.80


def overlays(out):
    S = 64
    yy, xx = np.mgrid[0:S, 0:S]
    p = np.dstack([(xx + 0.5) / S * 2 - 1, (yy + 0.5) / S * 2 - 1])
    atlas = Image.new('RGBA', (S * 8, S * 3), (0, 0, 0, 0))
    meta = dict(cell=[S, S], shields={}, bands={}, note='white = stencil; shields on the unit disc of the shield ellipse '
                '(var.json per frame), bands in body coordinates (fy from the body top to the feet, fx across the frame)')
    for i in range(8):
        m = shield_mask(i, p) if i else (np.hypot(p[..., 0], p[..., 1]) < 0)
        a = np.where(np.hypot(p[..., 0], p[..., 1]) < 1, 60, 0) + m * 195
        im = Image.fromarray(np.dstack([np.full((S, S, 3), 255), a]).astype(np.uint8), 'RGBA')
        atlas.alpha_composite(im, (i * S, 0)); meta['shields'][SHIELDS[i]] = dict(id=i, x=i * S, y=0)
    fy, fx = (yy + 0.5) / (2 * S), (xx + 0.5) / S
    yy2, xx2 = np.mgrid[0:2 * S, 0:S]
    fy, fx = (yy2 + 0.5) / (2 * S), (xx2 + 0.5) / S
    for j, b in enumerate(BANDS):
        m = band_mask(b, fy, fx)
        im = Image.fromarray(np.dstack([np.full((2 * S, S, 3), 255), m * 255 + (~m) * 40]).astype(np.uint8), 'RGBA')
        atlas.alpha_composite(im, (j * S, S)); meta['bands'][b] = dict(id=j, x=j * S, y=S, h=2 * S)
    atlas.save(os.path.join(out, 'overlays.png'))
    json.dump(meta, open(os.path.join(out, 'overlays.json'), 'w'), indent=1)
    json.dump(LIM, open(os.path.join(out, 'variation.json'), 'w'), indent=1)


def rng(seed):
    a = np.uint32(seed)
    def r():
        nonlocal a
        a = np.uint32((int(a) * 1664525 + 1013904223) & 0xFFFFFFFF)
        return int(a) / 4294967296
    return r


def vary(rgba, nation, shield, body_top, seed):
    """A numpy port of the variation shader's fragment stage, for proofs."""
    r = rng(seed * 7919 + 13)
    U = lambda lo, hi: lo + (hi - lo) * r()  # noqa: E731
    cl = LIM['cloth'][nation]
    t1 = [U(*cl['L']), np.radians(U(*cl['hueDeg'])), U(*cl['C'])] if cl else [0, 0, 1]
    bright = U(*LIM['bright'])
    skinL, skinH = U(*LIM['skinL']), np.radians(U(*LIM['skinHueDeg']))
    metL, warm, leaL = U(*LIM['metalL']), U(*LIM['metalWarm']), U(*LIM['leatherL'])
    sid = 1 + int(r() * 8); crest = 0 if r() < 0.5 else 1 + int(r() * 2); band = int(r() * 4)
    a = rgba[..., 3] / 255
    lab = to_oklab(np.clip(rgba[..., :3], 0, 255))
    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(A, B); h = np.arctan2(B, A); hd = np.degrees(h) % 360
    solid = np.clip((a - 0.86) / 0.10, 0, 1)
    if cl:
        ref = to_oklab(np.array([[[int(cl['hueRef'][i:i + 2], 16) for i in (1, 3, 5)]]], np.float64))[0, 0]
        ch, cc = np.arctan2(ref[2], ref[1]), np.hypot(ref[1], ref[2])
        dh = np.abs((h - ch + np.pi) % (2 * np.pi) - np.pi)
        wC = solid * np.clip((0.4538 - dh) / 0.1396, 0, 1) * np.clip((C - max(0.04, 0.45 * cc)) / 0.02, 0, 1)
    else:
        wC = np.zeros_like(L)
    warmm = np.clip((hd - 15) / 15, 0, 1) * (1 - np.clip((hd - 90) / 20, 0, 1))
    wM = solid * (1 - wC) * np.clip((0.032 - C) / 0.012, 0, 1) * np.clip((L - 0.22) / 0.10, 0, 1)
    chrom = np.clip((C - 0.018) / 0.015, 0, 1); lit = np.clip((L - 0.52) / 0.10, 0, 1)
    wS = solid * (1 - wC) * (1 - wM) * warmm * chrom * lit
    wL = solid * (1 - wC) * (1 - wM) * warmm * chrom * (1 - lit)
    Hh, Wd = L.shape
    yy, xx = np.mgrid[0:Hh, 0:Wd]
    st = np.zeros_like(L)
    if shield is not None:
        p = np.dstack([(xx / Wd - shield[0]) / shield[2], (yy / Hh - shield[1]) / shield[3]])
        st = np.maximum(st, shield_mask(sid, p))
    fy = (yy / Hh - body_top) / max(0.01, (Hh - 1) / Hh - body_top)
    fx = xx / Wd
    if crest:
        st = np.maximum(st, band_mask('crest tip' if crest == 1 else 'crest stripes', fy, fx) & (fy >= 0))
    if band:
        st = np.maximum(st, band_mask(['', 'belt', 'sash', 'hem'][band], fy, fx))
    shade = (LIM['stencilLight'] if cl and cl['stencil'] == 'light' else LIM['stencilDark'])
    cr, sr = np.cos(t1[1]), np.sin(t1[1])
    Ac, Bc = (A * cr - B * sr) * t1[2], (A * sr + B * cr) * t1[2]
    LC = L + t1[0] + st * shade
    cs, ss = np.cos(skinH), np.sin(skinH)
    As, Bs = A * cs - B * ss, A * ss + B * cs
    Am = A + (0.629 * 0.012 if warm > 0 else -0.342 * 0.008) * abs(warm)
    Bm = B + (0.777 * 0.012 if warm > 0 else -0.940 * 0.008) * abs(warm)
    wO = 1 - wC - wS - wM - wL
    Lo = wC * LC + wS * (L + skinL) + wM * (L + metL) + wL * (L + leaL) + wO * L
    Ao = wC * Ac + wS * As + wM * Am + wL * A + wO * A
    Bo = wC * Bc + wS * Bs + wM * Bm + wL * B + wO * B
    out = rgba.copy()
    out[..., :3] = np.clip(oklab_to_srgb(np.dstack([Lo, Ao, Bo])) * bright, 0, 255)
    # per-figure transforms: scale and lean
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')
    k = U(*LIM['scale']); lean = U(*LIM['leanDeg'])
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    im = im.rotate(-lean, resample=Image.BICUBIC, expand=True, center=(im.width / 2, im.height))
    return im


def proof(atlas_dir, nation, out):
    meta = json.load(open(os.path.join(atlas_dir, f'troops-{nation}-H.0.json')))
    var = json.load(open(os.path.join(atlas_dir, f'troops-{nation}-H.var.json')))
    page = np.asarray(Image.open(os.path.join(atlas_dir, f'troops-{nation}-H.0.png')).convert('RGBA')).astype(np.float64)
    figs = sorted({n.split('.')[0] for n in meta['frames']})
    rows = []
    for fig in figs:
        for view in ('front', 'back'):
            n = f'{fig}.{view}.stand'
            if n not in meta['frames']:
                continue
            f = meta['frames'][n]['frame']
            img = page[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']]
            v = var['frames'][n]
            row = Image.new('RGBA', (f['w'] * 16 + 40, f['h'] + 30), (150, 148, 128, 255))
            base = Image.fromarray(img.astype(np.uint8), 'RGBA')
            for i in range(8):
                row.alpha_composite(base, (i * f['w'], 24))
            for i in range(8):
                vi = vary(img, nation, v['shield'], v['body'][0], hash((fig, view, i)) & 0xFFFF)
                row.alpha_composite(vi, (40 + (8 + i) * f['w'] + (f['w'] - vi.width) // 2, 24 + f['h'] - vi.height))
            ImageDraw.Draw(row).text((4, 4), f'{fig} {view}: 8 copies | 8 varied (tints, stencils, brightness, scale, lean)', fill=(20, 20, 20))
            rows.append(row)
    Wd = max(r.width for r in rows); Ht = sum(r.height for r in rows)
    sheet = Image.new('RGBA', (Wd, Ht), (150, 148, 128, 255)); y = 0
    for r in rows:
        sheet.alpha_composite(r, (0, y)); y += r.height
    sheet.convert('RGB').save(os.path.join(out, f'var-{nation}.png'))


if __name__ == '__main__':
    atlas, out = sys.argv[1:3]
    os.makedirs(out, exist_ok=True)
    overlays(out)
    for nat in ('cinderHorde', 'thornwood', 'independent'):
        proof(atlas, nat, out)
    print('ok')
