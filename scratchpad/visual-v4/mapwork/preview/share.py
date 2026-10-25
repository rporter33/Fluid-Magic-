"""Own-terrain share per province under the lookup warp of map-design §3.1, on 60 mapgen maps (Small, Medium, Large x 2
and 4 nations x seeds 1-10). The share is the fraction of a province's pixels whose warped terrain lookup lands in a
province of its own terrain (the dominant-terrain rule). Usage: python3 -I share.py maps.json [warp_fraction ...]"""
import sys, json, numpy as np
from PIL import Image, ImageDraw
maps = json.load(open(sys.argv[1])); fracs = [float(x) for x in sys.argv[2:]] or [0.05, 0.08, 0.1, 0.12]
D = 90.0; PPU = 1.0
def mk(seed):
    r = np.random.default_rng(seed * 7919 + 13); return r.permutation(4096), r.random(4096) * 2 - 1
def vnoise(P, V, x, y, salt):
    xi, yi = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64); fx, fy = x - xi, y - yi; sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    h = lambda i, j: V[P[(P[(i + salt * 131) & 4095] + j) & 4095]]
    a, b, c, d = h(xi, yi), h(xi + 1, yi), h(xi, yi + 1), h(xi + 1, yi + 1)
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy
def fbm(P, V, x, y, feat, octv, salt):
    t, amp, n, f = 0.0, 1.0, 0.0, 1 / feat
    for o in range(octv): t = t + amp * vnoise(P, V, x * f, y * f, salt + o * 17); n += amp; amp *= 0.5; f *= 2.03
    return t / n
res = {f: [] for f in fracs}
for m in maps:
    Wd, Ht = int(m['width'] * PPU) + 1, int(m['height'] * PPU) + 1
    img = Image.new('I', (Wd, Ht), 0); dr = ImageDraw.Draw(img)
    for i, p in enumerate(m['provinces']): dr.polygon([(x * PPU, (m['height'] - y) * PPU) for x, y in p['polygon']], fill=i + 1)
    for k, w in enumerate(m['wilds']):
        for c in w: dr.polygon([(x * PPU, (m['height'] - y) * PPU) for x, y in c], fill=1000 + k)
    ID = np.array(img, np.int32); terr = np.array([-1] + [hash(p['terrain']) % 1000 for p in m['provinces']])
    X, Y = np.meshgrid((np.arange(Wd) + 0.5) / PPU, m['height'] - (np.arange(Ht) + 0.5) / PPU)
    P, V = mk(m['seed'])
    for f in fracs:
        WARP = f * D
        wx = (0.7 * fbm(P, V, X, Y, 40, 3, 101) + 0.3 * fbm(P, V, X, Y, 9, 2, 103)) * WARP * 1.8; wy = (0.7 * fbm(P, V, X, Y, 40, 3, 202) + 0.3 * fbm(P, V, X, Y, 9, 2, 203)) * WARP * 1.8
        mag = np.hypot(wx, wy); lim = np.minimum(1, WARP / np.maximum(mag, 1e-9)); wx *= lim; wy *= lim
        ci = np.clip(((X + wx) * PPU).astype(int), 0, Wd - 1); ri = np.clip(((m['height'] - (Y + wy)) * PPU).astype(int), 0, Ht - 1)
        WID = ID[ri, ci]; ok = (ID > 0) & (ID < 1000) & (WID > 0) & (WID < 1000); WID = np.where(ok, WID, ID)
        same = np.where((ID > 0) & (ID < 1000), terr[np.clip(WID, 0, len(terr) - 1)] == terr[np.clip(ID, 0, len(terr) - 1)], False)
        cnt = np.bincount(ID[(ID > 0) & (ID < 1000)], minlength=len(terr)); sm = np.bincount(ID[same], minlength=len(terr))
        for i in range(1, len(terr)):
            if cnt[i] > 30: res[f].append(sm[i] / cnt[i])
for f in fracs:
    a = np.array(res[f]); print(f'warp {f:.2f} D: provinces {len(a)}; own-terrain share min {a.min():.3f}, p1 {np.percentile(a, 1):.3f}, p5 {np.percentile(a, 5):.3f}, median {np.median(a):.3f}; under 0.80: {(a < 0.8).sum()}, under 0.75: {(a < 0.75).sum()}')
