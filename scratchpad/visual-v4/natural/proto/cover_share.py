"""How much of each province the natural view draws in its own terrain, on 60 mapgen maps (visual-v4/mapwork/maps60.json: Small, Medium,
Large x 2 and 4 nations x seeds 1 to 10, wilds on) and on the mockup's map. The cover decision is natural.py's, at 1.25 px a unit:
the v4 lookup warp (0.10 D; features 40 and 9 units), the cover blend (sigma 0.04 D), the forest edge (0.07 D blend + noise 0.42 at
10 units), glades, copses (fBm 15 units > 0.80 on plains and hills), field parcels decided at their centres (0.06 D blend) with a
+-0.18 parcel offset, everything else the cover blend's argmax. Shares: whole province, and its core (>= 0.15 D from every edge).
Usage: python3 -I cover_share.py [maps.json]"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from natlib import VNoise, hash2, gauss, up2, seed_of
from PIL import Image, ImageDraw
T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']; TI = {t: k for k, t in enumerate(T)}
P_, A_, F_, H_, M_, S_, W_ = range(7)

def covers(LT, LP, land, U, V, DT, upx, seed='1'):
    """the natural cover per pixel (0..6), given the warped terrain LT, warped province LP, map units U, V, texels per D and per unit"""
    BH, BW = LT.shape; wc = np.zeros((7, BH, BW), np.float32)
    for t in range(7): wc[t] = gauss((LT == t).astype(np.float32), 0.04 * DT)
    s = wc.sum(0); s[s < 1e-4] = 1; wc /= s
    nz = {k: VNoise(seed, k) for k in ['edge', 'glade', 'copse', 'field']}
    ang = np.zeros(256, np.float32)
    for i in range(256):
        r = np.random.default_rng(seed_of('natural', seed, 'parcel', i)); ang[i] = [0, np.pi / 2, np.pi / 6, -np.pi / 6][r.integers(4)] + (r.random() - 0.5) * 0.12
    a = ang[LP.astype(int) % 256]; ca, sa = np.cos(a), np.sin(a)
    pu = U * ca + V * sa; pv = -U * sa + V * ca
    pv = pv + 1.6 * nz['field'](pu / 28 + 90, pv / 28); pv = pv + 2.5 * nz['field'](pu / 9 + 17, pv / 61)
    RH = 8.5; row = np.floor(pv / RH); _, _, hr = hash2(row, row * 0 + 3, 41); _, _, hp = hash2(row, row * 0 + 5, 43)
    L = 13 + 19 * hr; uu = (pu + hp * 40) / L; col = np.floor(uu); _, _, bid = hash2(row, col, 47)
    cu_ = (col + 0.5) * L - hp * 40; cv_ = (row + 0.5) * RH
    CX = np.clip(((cu_ * ca - cv_ * sa) * upx).astype(int), 0, BW - 1); CY = np.clip(((cu_ * sa + cv_ * ca) * upx).astype(int), 0, BH - 1)
    wA7 = up2(gauss((LT == A_).astype(np.float32)[1::2, 1::2], 0.06 * DT / 2), (BH, BW))
    field = ((0.6 * wA7[CY, CX] + 0.4 * wc[A_]) + 0.36 * (((bid * 7.31) % 1.0) - 0.5) > 0.5) & land
    wF = up2(gauss((LT == F_).astype(np.float32)[1::2, 1::2], 0.07 * DT / 2), (BH, BW))
    canopy = (0.5 * wF + 0.5 * wc[F_] + 0.42 * nz['edge'].fbm(U / 10, V / 10, 3) > 0.52)
    glade = (wc[F_] > 0.85) & (nz['glade'].fbm(U / 9, V / 9, 2) < -0.62)
    copse = (nz['copse'].fbm(U / 15, V / 15, 3) > 0.80) & ((wc[P_] + wc[H_]) > 0.6) & ~field
    canopy = (canopy & ~glade | copse) & land
    rest = np.argmax(np.where(np.arange(7)[:, None, None] == A_, -1, wc), 0)
    return np.where(canopy, F_, np.where(field, A_, rest)).astype(np.uint8), copse

def edge_dist(poly, X0, Y0, W, H, ppu):
    """distance (map units) from each pixel of a bbox to the polygon's edges"""
    xs = X0 + (np.arange(W) + 0.5) / ppu; ys = Y0 + (np.arange(H) + 0.5) / ppu; X, Y = np.meshgrid(xs, ys); d = np.full(X.shape, 1e9)
    for k in range(len(poly)):
        ax, ay = poly[k]; bx, by = poly[(k + 1) % len(poly)]; dx, dy = bx - ax, by - ay; l2 = dx * dx + dy * dy or 1
        t = np.clip(((X - ax) * dx + (Y - ay) * dy) / l2, 0, 1); d = np.minimum(d, np.hypot(X - ax - t * dx, Y - ay - t * dy))
    return d

def run_map(m, ppu=1.25, D=90.0):
    Wd, Ht = int(m['width'] * ppu) + 1, int(m['height'] * ppu) + 1
    img = Image.new('I', (Wd, Ht), 0); dr = ImageDraw.Draw(img)
    for i, p in enumerate(m['provinces']): dr.polygon([(x * ppu, (m['height'] - y) * ppu) for x, y in p['polygon']], fill=i + 1)
    for k, w in enumerate(m['wilds']):
        for c in w: dr.polygon([(x * ppu, (m['height'] - y) * ppu) for x, y in c], fill=1000 + k)
    ID = np.array(img, np.int32)
    U, V = np.meshgrid((np.arange(Wd) + 0.5) / ppu, (np.arange(Ht) + 0.5) / ppu)
    # the v4 lookup warp, 0.10 D, features 40 and 9 units (natlib noise; the mockup's tables differ, the statistics do not)
    nw = VNoise(m['seed'], 'warp'); WARP = 0.10 * D
    wx = (0.7 * nw.fbm(U / 40, V / 40, 3) + 0.3 * nw.fbm(U / 9 + 50, V / 9, 2)) * WARP * 1.8; wy = (0.7 * nw.fbm(U / 40 + 90, V / 40, 3) + 0.3 * nw.fbm(U / 9 + 150, V / 9, 2)) * WARP * 1.8
    mag = np.hypot(wx, wy); lim = np.minimum(1, WARP / np.maximum(mag, 1e-9)); wx *= lim; wy *= lim
    ci = np.clip(((U + wx) * ppu).astype(int), 0, Wd - 1); ri = np.clip(((V + wy) * ppu).astype(int), 0, Ht - 1)
    WID = ID[ri, ci]; ok = (ID > 0) & (ID < 1000) & (WID > 0) & (WID < 1000); WID = np.where(ok, WID, ID)
    terr = np.array([255] + [TI[p['terrain']] for p in m['provinces']], np.uint8)
    LT = np.where((ID > 0) & (ID < 1000), terr[np.clip(WID, 0, len(terr) - 1)], np.where(ID >= 1000, 7, 255)).astype(np.uint8)
    LP = np.where((ID > 0) & (ID < 1000), WID, 0)
    cov, copse = covers(LT, LP, LT < 7, U, V, D * ppu, ppu, str(m['seed']))
    out = []
    for i, p in enumerate(m['provinces']):
        mask = ID == i + 1; n = mask.sum()
        if n < 30: continue
        ys, xs = np.nonzero(mask); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        poly = [(x, m['height'] - y) for x, y in p['polygon']]
        d = edge_dist(poly, x0 / ppu, y0 / ppu, x1 - x0, y1 - y0, ppu)
        sub = mask[y0:y1, x0:x1]; own = cov[y0:y1, x0:x1] == TI[p['terrain']]; core = sub & (d >= 0.15 * D)
        own2 = own | (copse[y0:y1, x0:x1] & (p['terrain'] in ('plains', 'hills')))
        out.append((p['terrain'], own[sub].mean(), own[core].mean() if core.sum() > 20 else np.nan, n, own2[sub].mean(), own2[core].mean() if core.sum() > 20 else np.nan))
    return out

if __name__ == '__main__':
    maps = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/mapwork/maps60.json'))
    allr = []
    for k, m in enumerate(maps):
        allr += run_map(m)
        if k % 10 == 9: print('maps', k + 1, 'provinces', len(allr), flush=True)
    a = np.array([r[1] for r in allr]); c = np.array([r[2] for r in allr]); c = c[~np.isnan(c)]
    print(f'provinces {len(a)}: whole-province own share min {a.min():.3f} p1 {np.percentile(a, 1):.3f} p5 {np.percentile(a, 5):.3f} median {np.median(a):.3f}; under 0.70 {(a < 0.7).sum()}, under 0.75 {(a < 0.75).sum()}')
    a2 = np.array([r[4] for r in allr]); c2 = np.array([r[5] for r in allr]); c2 = c2[~np.isnan(c2)]
    print(f'copses counted as their plains or hills: whole min {a2.min():.3f} p1 {np.percentile(a2, 1):.3f} median {np.median(a2):.3f}; core min {c2.min():.3f} p1 {np.percentile(c2, 1):.3f}; core under 0.90 {(c2 < 0.9).sum()}')
    print(f'cores (>= 0.15 D in): min {c.min():.3f} p1 {np.percentile(c, 1):.3f} median {np.median(c):.3f}; under 0.90 {(c < 0.9).sum()}, under 0.85 {(c < 0.85).sum()}')
    for t in T:
        s = np.array([r[1] for r in allr if r[0] == t]); cc = np.array([r[2] for r in allr if r[0] == t and not np.isnan(r[2])])
        if len(s): print(f'  {t:10s} n {len(s):4d}  whole min {s.min():.3f} median {np.median(s):.3f}   core min {cc.min():.3f} median {np.median(cc):.3f}')
    json.dump([[r[0], float(r[1]), None if np.isnan(r[2]) else float(r[2]), int(r[3]), float(r[4]), None if np.isnan(r[5]) else float(r[5])] for r in allr], open(os.path.join(os.path.dirname(__file__), 'renders', 'cover-share-60.json'), 'w'))
