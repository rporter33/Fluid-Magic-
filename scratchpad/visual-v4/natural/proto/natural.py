"""The natural view's bake, prototyped in numpy on the mockup's own map and the relief bake's shared rasters (exported by
tools/export.cjs): the warped terrain lookup LT, the province ids, the heightfield's hillshade fS, cast shadow shd and valley
term ao. Everything that differs from the Clear bake is here: the natural materials (CIELAB), the two blends (a wide ground
blend and a narrow cover blend with noise), the cover features of each terrain, and the natural relief caps.
Usage: python3 -I natural.py [out.png] [--seed S]   (writes the bake, its Lab mips and the cover raster under data/)"""
import sys, os, time, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from natlib import *
from PIL import Image

T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
P_, A_, F_, H_, M_, S_, W_ = range(7)

# ---- the natural palette (CIELAB D65). One ground per terrain, and the cover materials drawn on it.
NAT = {
    'plains':    {'ground': (43, -11, 33), 'light': (48, -14, 35), 'dry': (46, -5, 31)},
    'farmland':  {'ground': (45, -9, 30), 'ripe': (53, 2, 31), 'straw': (56, 1, 25), 'green': (46, -12, 30), 'ploughed': (43, 5, 19), 'fallow': (49, -4, 25), 'hedge': (29, -12, 19)},
    'forest':    {'ground': (28, -11, 21), 'canopy': (19, -15, 21), 'conifer': (16, -11, 13)},
    'hills':     {'ground': (35, 3, 21), 'turf': (40, -8, 27), 'bracken': (37, 7, 24), 'rock': (50, 1, 6)},
    'mountains': {'ground': (42, 1, -5), 'scree': (49, 1, -2), 'turf': (35, -7, 17)},
    'swamp':     {'ground': (34, -8, 22), 'pool': (25, -8, 2), 'reed': (42, -4, 29), 'shrub': (24, -11, 16)},
    'wasteland': {'ground': (54, 4, 17), 'crack': (45, 4, 13), 'scrub': (36, -5, 15), 'pale': (59, 3, 14)},
}
WATER = (37, -24, -3)     # natural lakes, ponds and streams (the page's vector water takes this colour in Natural)
CAP = [6, 4, 7, 13, 18, 3, 8]   # natural relief swing caps (L*): plains, farmland, forest, hills, mountains, swamp, wasteland
LIT = 0.6                  # the lit cap (as Clear): a lit face gains at most 0.6 of the cap
SIG_G, SIG_C = 0.12, 0.04  # the ground blend and the cover blend, in D (median province diameter)

def run(seed='12', meta=None, rasters=None):
    t0 = time.time(); tm = {}
    m = meta or load_meta(); BW, BH, TX, RLK, D = m['BW'], m['BH'], m['TX'], m['RLK'], m['MED_DIAM']
    if rasters is None:
        LT = load_arr('LT', np.uint8, (BH, BW)); ID = load_arr('id', np.uint8, (BH, BW)); LP = load_arr('LP', np.uint8, (BH, BW))
        HW, HH = BW // 2, BH // 2
        fS = up2(load_arr('fS', np.float32, (HH, HW)), (BH, BW)); shd = up2(load_arr('shd', np.float32, (HH, HW)), (BH, BW)); ao = up2(load_arr('ao', np.float32, (HH, HW)), (BH, BW))
        clear = np.fromfile(os.path.join(DATA, 'clear-img.rgba'), np.uint8).reshape(BH, BW, 4)
    else:
        LT, ID, LP, fS, shd, ao, clear = rasters
    land = LT < 7
    DT = D * TX                                   # texels per D
    tx = (np.arange(BW, dtype=np.float32) + 0.5) / TX / RLK; ty = (np.arange(BH, dtype=np.float32) + 0.5) / TX / RLK
    U, V = np.meshgrid(tx, ty)                    # mapgen units (D = 90)
    tm['setup'] = time.time() - t0; t1 = time.time()
    # ---- the two blends of the warped one-hot: wide for the ground colour, narrow for the cover
    wg = np.zeros((7, BH, BW), np.float32); wc = np.zeros((7, BH, BW), np.float32)
    for t in range(7):
        oh = (LT == t).astype(np.float32)
        small = oh[1::2, 1::2]
        wg[t] = up2(gauss(small, SIG_G * DT / 2), (BH, BW)); wc[t] = gauss(oh, SIG_C * DT)
    sg = wg.sum(0); sg[sg < 1e-4] = 1; wg /= sg; sc = wc.sum(0); sc[sc < 1e-4] = 1; wc /= sc
    tm['blends'] = time.time() - t1; t1 = time.time()
    nz = {k: VNoise(seed, k) for k in ['edge', 'glade', 'copse', 'mottle', 'streak', 'heath', 'rock', 'pool', 'reed', 'scrub', 'dust', 'conifer', 'micro', 'field', 'tree']}
    # ---- the ground: the wide blend of each terrain's ground colour (Lab), plus a broad mottle
    lab = np.zeros((BH, BW, 3), np.float32)
    for t in range(7):
        lab += wg[t][..., None] * np.array(NAT[T[t]]['ground'], np.float32)
    mot = nz['mottle'].fbm(U / 26, V / 26, 3)
    lab[..., 0] += 2.2 * mot
    def put(mask, col, alpha=1.0):  # alpha-blend a material colour (Lab) where mask
        a = (mask.astype(np.float32) * alpha)[..., None]
        lab[:] = lab * (1 - a) + np.array(col, np.float32) * a
    pres = lambda t, k=0.25, n=None: np.clip((wc[t] - 0.35 + k * (n if n is not None else 0)) / 0.3, 0, 1)
    # plains: wind streaks (anisotropic), dry and light patches
    st = nz['streak'](U / 14 + 0.6 * V / 14, V / 3.2)
    pp = pres(P_)
    lab[..., 0] += pp * 1.6 * st
    lt_ = nz['mottle'].fbm(U / 11 + 40, V / 11, 2)
    lab[:] = lab + (pp * np.clip(lt_ - 0.2, 0, 1) * 0.6)[..., None] * (np.array(NAT['plains']['light'], np.float32) - lab)
    dry = nz['dust'].fbm(U / 18 + 70, V / 18, 2)
    lab[:] = lab + (pp * np.clip(dry - 0.3, 0, 1) * 0.8)[..., None] * (np.array(NAT['plains']['dry'], np.float32) - lab)
    # hills: heath blotches of turf and bracken, a few rock specks
    ph = pres(H_)
    hb = nz['heath'].fbm(U / 9, V / 9, 3)
    lab[:] = lab + (ph * np.clip(hb * 1.4, 0, 1) * 0.75)[..., None] * (np.array(NAT['hills']['turf'], np.float32) - lab)
    lab[:] = lab + (ph * np.clip(-hb * 1.4 - 0.2, 0, 1) * 0.6)[..., None] * (np.array(NAT['hills']['bracken'], np.float32) - lab)
    rk = nz['rock'](U / 1.6, V / 1.6)
    put(ph * (rk > 0.78), NAT['hills']['rock'], 0.7)
    # mountains: scree where the ground is concave or on shade-side feet, valley turf low down, rock micro-relief
    pm = pres(M_)
    scr = np.clip(ao * 1.2 + 0.4 * nz['rock'].fbm(U / 5 + 9, V / 5, 2) - 0.1, 0, 1)
    lab[:] = lab + (pm * scr * 0.6)[..., None] * (np.array(NAT['mountains']['scree'], np.float32) - lab)
    lab[:] = lab + (pm * np.clip((ao - 0.5) * 2, 0, 1) * 0.5)[..., None] * (np.array(NAT['mountains']['turf'], np.float32) - lab)
    lab[..., 0] += pm * 2.0 * nz['micro'].fbm(U / 3.5, V / 3.5, 3)
    # swamp: dark pools, reed beds (short horizontal strokes), shrubs
    ps = pres(S_)
    pn = nz['pool'].fbm(U / 9, V / 9, 3)
    pool = np.clip((pn - 0.40) / 0.08, 0, 1) * ps
    reed = np.clip((nz['reed'](U / 0.9, V / 4.5) * 0.6 + nz['reed'].fbm(U / 12 + 7, V / 12, 2) - 0.25) * 2, 0, 1) * ps * (1 - pool)
    lab[:] = lab + (reed * 0.7)[..., None] * (np.array(NAT['swamp']['reed'], np.float32) - lab)
    shrub = (nz['scrub'](U / 1.3 + 3, V / 1.3) > 0.72) * ps * (1 - pool)
    put(shrub, NAT['swamp']['shrub'], 0.8)
    # wasteland: cracked crust (cell edges), scrub dots, pale dust drifts, faint ripples
    pw = pres(W_)
    cu, cv = U / 6.0, V / 6.0; iu, iv = np.floor(cu), np.floor(cv); d1 = np.full(U.shape, 9.0, np.float32); d2 = np.full(U.shape, 9.0, np.float32)
    for oy in (-1, 0, 1):
        for ox in (-1, 0, 1):
            jx, jy, _ = hash2(iu + ox, iv + oy, 11); dd = (cu - (iu + ox + jx)) ** 2 + (cv - (iv + oy + jy)) ** 2
            d2 = np.where(dd < d1, d1, np.minimum(d2, dd)); d1 = np.minimum(d1, dd)
    crack = np.clip(1 - (np.sqrt(d2) - np.sqrt(d1)) / 0.05, 0, 1) * (nz['dust'](U / 7, V / 7) > -0.35)
    lab[:] = lab + (pw * np.clip(nz['dust'].fbm(U / 16 + 5, V / 16, 2), 0, 1) * 0.7)[..., None] * (np.array(NAT['wasteland']['pale'], np.float32) - lab) * 0.6
    put(pw * crack, NAT['wasteland']['crack'], 0.8)
    lab[..., 0] += pw * (1.2 * np.sin((U * 0.8 + V * 0.6) / 1.3 + 3 * nz['dust'](U / 20, V / 20)) + 2.5 * nz['dust'].fbm(U / 8 + 3, V / 3, 2))
    put(pw * (nz['scrub'](U / 1.4, V / 1.4) > 0.78), NAT['wasteland']['scrub'], 0.85)
    tm['ground'] = time.time() - t1; t1 = time.time()
    # ---- fields: strip parcels in each province's frame (rows 6 to 9 units deep, gently bent; parcels 8 to 20 units long), tones,
    # furrows along the strip (seen at Near), hedgerows on the seams; a parcel is a field when the farmland cover weight at its centre passes 0.5
    ang = np.zeros(256, np.float32)
    for i in range(256):
        r = np.random.default_rng(seed_of('natural', seed, 'parcel', i)); ang[i] = [0, np.pi / 2, np.pi / 6, -np.pi / 6][r.integers(4)] + (r.random() - 0.5) * 0.12
    a = ang[LP.astype(int)]; ca, sa = np.cos(a), np.sin(a)
    pu = U * ca + V * sa; pv = -U * sa + V * ca
    pv = pv + 1.6 * nz['field'](pu / 28 + 90, pv / 28)                          # rows bend a little
    pv = pv + 2.5 * nz['field'](pu / 9 + 17, pv / 61)                            # uneven row depths
    RH = 8.5; row = np.floor(pv / RH); fv = pv / RH - row
    _, _, hr = hash2(row, row * 0 + 3, 41); _, _, hp = hash2(row, row * 0 + 5, 43)
    L = 13 + 19 * hr; uu = (pu + hp * 40) / L; col = np.floor(uu); fu = uu - col
    _, _, bid = hash2(row, col, 47)
    seam = np.minimum(np.minimum(fv, 1 - fv) * RH, np.minimum(fu, 1 - fu) * L)    # distance to the parcel's edge, in units
    cu_ = (col + 0.5) * L - hp * 40; cv_ = (row + 0.5) * RH                       # the parcel's centre back in map units
    CX = np.clip(((cu_ * ca - cv_ * sa) * RLK * TX).astype(int), 0, BW - 1); CY = np.clip(((cu_ * sa + cv_ * ca) * RLK * TX).astype(int), 0, BH - 1)
    wA7 = up2(gauss((LT == A_).astype(np.float32)[1::2, 1::2], 0.06 * DT / 2), (BH, BW))
    wA = 0.6 * wA7[CY, CX] + 0.4 * wc[A_]
    field = (wA + 0.36 * (((bid * 7.31) % 1.0) - 0.5) > 0.5) & land
    tone_keys = ['ripe', 'straw', 'green', 'ploughed', 'fallow', 'ripe', 'green', 'fallow']
    tid = np.floor(bid * 8).astype(int) % 8
    ftone = np.zeros((BH, BW, 3), np.float32)
    for k, key in enumerate(tone_keys):
        ftone[tid == k] = NAT['farmland'][key]
    ftone[..., 0] += 1.2 * nz['field'](U / 3, V / 3)
    fur = np.sin(pv * 2 * np.pi / 1.25 + bid * 20)                                # furrows 1.25 units apart along the strip
    ftone[..., 0] += 1.6 * fur * (tid != 2)
    hseam = np.where(np.minimum(fv, 1 - fv) * RH < np.minimum(fu, 1 - fu) * L, (((row * 0.618) % 1.0) < 0.45), True)   # about half the row seams carry a hedge, every parcel end does
    hedge = np.clip(1 - seam / 0.4, 0, 1) * hseam * (nz['field'](U / 6 + 50, V / 6) > -0.35)
    hedgeT = (nz['tree'](U / 1.0, V / 1.0) > 0.55) & (seam < 0.6)                 # trees along the hedges
    fm = field.astype(np.float32)[..., None]
    lab[:] = lab * (1 - fm) + ftone * fm
    hm = (field * hedge * 0.6)[..., None]
    lab[:] = lab * (1 - hm) + np.array(NAT['farmland']['hedge'], np.float32) * hm
    tm['fields'] = time.time() - t1; t1 = time.time()
    # ---- canopy: forest masses with ragged edges that cross borders, glades inside, copses and lone trees on open land
    ne = nz['edge'].fbm(U / 10, V / 10, 3)
    wF = gauss((LT == F_).astype(np.float32)[1::2, 1::2], 0.07 * DT / 2); wF = up2(wF, (BH, BW))
    canopy = (0.5 * wF + 0.5 * wc[F_] + 0.42 * ne > 0.52)
    glade = (wc[F_] > 0.85) & (nz['glade'].fbm(U / 9, V / 9, 2) < -0.62)
    copse = (nz['copse'].fbm(U / 15, V / 15, 3) > 0.80) & ((wc[P_] + wc[H_] + wc[A_] * 0.0) > 0.6) & ~field
    lone = (nz['tree'](U / 1.1 + 31, V / 1.1) > 2.0)   # lone trees are Near-only live sprites, not in the bake & ((wc[P_] + wc[H_]) > 0.6) & ~field
    canopy = (canopy & ~glade | copse | lone | (field & hedgeT)) & land
    # crowns: a jittered grid of domes 2 to 3.4 units across, lit from the upper left
    cs = 2.3; gu, gv = U / cs, V / cs; iu, iv = np.floor(gu), np.floor(gv); best = np.full(U.shape, 9.0, np.float32); bdx = np.zeros_like(best); bdy = np.zeros_like(best); bh = np.zeros_like(best)
    for oy in (-1, 0, 1):
        for ox in (-1, 0, 1):
            jx, jy, hv = hash2(iu + ox, iv + oy, 37); rr = 0.55 + 0.35 * hv
            ddx = (gu - (iu + ox + jx)) / rr; ddy = (gv - (iv + oy + jy)) / rr; dd = np.sqrt(ddx * ddx + ddy * ddy); c = dd < best
            best = np.where(c, dd, best); bdx = np.where(c, ddx, bdx); bdy = np.where(c, ddy, bdy); bh = np.where(c, hv, bh)
    crown = np.clip(1 - best * best, 0, 1); litc = -(bdx + bdy) * 0.7071
    cl = np.where(best < 1, 3.5 * crown + 5.0 * litc * np.sqrt(crown) - 1.0, -6.0)
    con = nz['conifer'].fbm(U / 22, V / 22, 2) > 0.25                            # darker, bluer conifer stands
    ccol = np.where(con[..., None], np.array(NAT['forest']['conifer'], np.float32), np.array(NAT['forest']['canopy'], np.float32))
    ccol = ccol.copy(); ccol[..., 0] += cl + 2.0 * nz['mottle'].fbm(U / 30 + 11, V / 30, 2)
    cm = canopy.astype(np.float32)
    # the canopy's own shadow on the ground to the lower right, and a soft fringe
    sh = np.zeros_like(cm); k = max(1, int(round(1.2 * RLK * TX)))
    sh[k:, k:] = cm[:-k, :-k]
    shb = gauss(sh, 1.2) * (1 - cm)
    lab[..., 0] -= 9.0 * shb
    lab[:] = lab * (1 - cm[..., None]) + ccol * cm[..., None]
    tm['canopy'] = time.time() - t1; t1 = time.time()
    # ---- relief: the shared hillshade with the natural caps (blended by the cover weights), cast shadow and valleys
    cap = np.tensordot(np.array(CAP, np.float32), wc, axes=1)
    rel = cap * np.clip(fS, -1, LIT) - 6.0 * shd - 4.0 * ao
    rel = np.where(canopy, rel * 0.7, rel)   # a canopy damps the ground's shading a little (crowns carry their own light)
    lab[..., 0] += rel
    # cover class per texel (what is drawn there): 2 canopy, 1 field, else the narrow-blend argmax (copses count as forest)
    cover = np.where(canopy, F_, np.where(field, A_, np.argmax(np.where(np.arange(7)[:, None, None] == A_, -1, wc), 0))).astype(np.uint8)
    cover = np.where(land, cover, 255).astype(np.uint8)
    # pools are drawn last (flat dark water in the marsh)
    lab[:] = lab * (1 - pool[..., None]) + np.array(NAT['swamp']['pool'], np.float32) * pool[..., None]
    lab[..., 0] += pool * (1.2 * nz['pool'](U / 2, V / 2))
    tm['relief'] = time.time() - t1; t1 = time.time()
    rgb = lab2rgb(lab.astype(np.float64))
    out = np.zeros((BH, BW, 4), np.uint8); out[..., :3] = np.clip(np.round(rgb), 0, 255); out[..., 3] = 255
    wild = (LT == 7) | (LT == 8)
    out[wild] = clear[wild]; out[~land & ~wild] = clear[~land & ~wild]
    corner = (clear[..., 3] < 255) & land; out[corner, 3] = clear[corner, 3]
    tm['color'] = time.time() - t1; tm['total'] = time.time() - t0
    return out, lab, cover, canopy, field, wc, tm

def lab_mip(img):
    """2 x 2 mip averaged in CIELAB (the mockup's labMip), alpha averaged."""
    H, W = img.shape[0] // 2, img.shape[1] // 2
    lab = rgb2lab(img[..., :3].astype(np.float64)); a = img[..., 3].astype(np.float64)
    q = lambda p: (p[0:2 * H:2, 0:2 * W:2] + p[1:2 * H:2, 0:2 * W:2] + p[0:2 * H:2, 1:2 * W:2] + p[1:2 * H:2, 1:2 * W:2]) / 4
    L = np.stack([q(lab[..., c]) for c in range(3)], -1); out = np.zeros((H, W, 4), np.uint8)
    out[..., :3] = np.clip(np.round(lab2rgb(L)), 0, 255); out[..., 3] = np.clip(np.round(q(a)), 0, 255); return out

if __name__ == '__main__':
    seed = '12'
    if '--seed' in sys.argv: seed = sys.argv[sys.argv.index('--seed') + 1]
    out, lab, cover, canopy, field, wc, tm = run(seed)
    print('timings (s):', {k: round(v, 2) for k, v in tm.items()})
    tag = '' if seed == '12' else '-s' + seed
    Image.fromarray(out, 'RGBA').save(os.path.join(DATA, f'natural{tag}.png'))
    m1 = lab_mip(out); m2 = lab_mip(m1)
    out.tofile(os.path.join(DATA, f'natural{tag}.rgba')); m1.tofile(os.path.join(DATA, f'natural{tag}-m1.rgba')); m2.tofile(os.path.join(DATA, f'natural{tag}-m2.rgba'))
    cover.tofile(os.path.join(DATA, f'cover{tag}.bin'))
    print('written', out.shape, m1.shape, m2.shape)
