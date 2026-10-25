"""v4 relief map: a numpy preview of map-design.md on a real mapgen map, plus the measurements the design quotes.

Not the game's renderer and not its art: flat placeholder miniatures, value noise instead of the GPU passes. It exists to
check the design's numbers on pixels: each province's core mean against its albedo, the share of each province painted in
its own terrain, value, chroma and coarse busyness against the references, and the look at the three zoom bands.

Usage: python3 -I preview.py <map.json> <palette.json> <outdir> [water]
"""
import sys, json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

MAP = json.load(open(sys.argv[1])); PAL = json.load(open(sys.argv[2])); OUT = sys.argv[3]
WATER = sys.argv[4] if len(sys.argv) > 4 else '#50AF9B'
os.makedirs(OUT, exist_ok=True)
TERR = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
TI = {t: i for i, t in enumerate(TERR)}
# relief: base height, noise amplitude, feature size (world units), ridged?; and the p95 lightness swing (L*), as map-design §3
BASE = dict(plains=0.10, farmland=0.08, forest=0.14, hills=0.28, mountains=0.48, swamp=0.03, wasteland=0.18)
AMPH = dict(plains=0.06, farmland=0.03, forest=0.07, hills=0.30, mountains=0.62, swamp=0.015, wasteland=0.10)
FEAT = dict(plains=60, farmland=60, forest=45, hills=30, mountains=22, swamp=60, wasteland=40)
AMPL = dict(plains=4, farmland=4, forest=6, hills=9, mountains=16, swamp=3, wasteland=6)
BANNER = {0: '#FD6533', 1: '#00674B'}  # Cinder Horde, Thornwood (the M1 nations' first banners)
INK, LIGHT = '#1C1A17', '#F4EEDF'
GRANITE, MERE, RIM, SNOW, LITROCK = '#2A292C', '#24222A', '#E9E4D8', '#F2EEE6', '#8A857E'
OAK = dict(lit='#B08A5E', body='#8F7459', grain='#715636', shade='#5E4630', edge='#3E2E20')
SKIRT_TOP, SKIRT_BASE = '#4A4246', '#2A2527'
D = 90.0  # median province diameter (world units), measured on 180 maps
W_BAND = 0.05 * D  # rim-glow width (§5, coverage.ts)
WARP = float(os.environ.get('WARP', '0.10')) * D  # largest displacement of the terrain lookup (§3.1)

def hx(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
def s2l(c): c = c / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def l2s(c): c = np.clip(c, 0, 1); return 255 * np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)
M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]); Mi = np.linalg.inv(M); WP = np.array([0.95047, 1, 1.08883])
def rgb2lab(rgb):
    xyz = s2l(rgb) @ M.T / WP; f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)
def lab2rgb(lab):
    fy = (lab[..., 0] + 16) / 116; fx = fy + lab[..., 1] / 500; fz = fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], -1); xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * WP
    return l2s(xyz @ Mi.T)
ALB = np.array([rgb2lab(hx(PAL[t])) for t in TERR])

# ---- seeded value noise in world coordinates (presentation only; the game uses its own seeded noise)
RNG = np.random.default_rng(MAP['seed'] * 7919 + 13)
PERM = RNG.permutation(4096); VALS = RNG.random(4096) * 2 - 1
def vnoise(x, y, salt):
    xi, yi = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64); fx, fy = x - xi, y - yi
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    def h(i, j): return VALS[PERM[(PERM[(i + salt * 131) & 4095] + j) & 4095]]
    a, b, c, d = h(xi, yi), h(xi + 1, yi), h(xi, yi + 1), h(xi + 1, yi + 1)
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy
def fbm(x, y, feat, octaves, salt, ridged=False):
    tot, amp, norm, f = 0.0, 1.0, 0.0, 1.0 / feat
    for o in range(octaves):
        n = vnoise(x * f, y * f, salt + o * 17)
        if ridged: n = 1 - 2 * np.abs(n)
        tot = tot + amp * n; norm += amp; amp *= 0.5; f *= 2.03
    return tot / norm

provs = MAP['provinces']; NP = len(provs)
PID = {p['id']: i for i, p in enumerate(provs)}
owner = {}  # province index -> nation slot; each capital and its 8 nearest provinces by hops (a mid-game picture)
for slot, cap in enumerate(MAP['capitals']):
    seen, frontier, got = {PID[cap]}, [PID[cap]], [PID[cap]]
    while frontier and len(got) < 9:
        nxt = []
        for i in frontier:
            for nb in provs[i]['neighbors']:
                j = PID[nb]
                if j not in seen and j not in owner and len(got) < 9: seen.add(j); nxt.append(j); got.append(j)
        frontier = nxt
    for i in got: owner[i] = slot
def tier(pop): return 1 if pop < 2000 else 2 if pop < 5000 else 3 if pop < 10000 else 4 if pop < 20000 else 5  # UI.popSteps (docs/09-balance)

def render(x0, y0, x1, y1, ppu, name, table=True, labels='mid', selected=None, fog=False):
    Wd, Ht = int(round((x1 - x0) * ppu)), int(round((y1 - y0) * ppu))
    X = x0 + (np.arange(Wd) + 0.5) / ppu; Y = y1 - (np.arange(Ht) + 0.5) / ppu
    X, Y = np.meshgrid(X, Y)
    def to_px(p): return ((p['x'] - x0) * ppu, (y1 - p['y']) * ppu)
    # ids: 1..NP provinces, 200+k wild cells, 0 outside
    idimg = Image.new('I', (Wd, Ht), 0); dr = ImageDraw.Draw(idimg)
    for i, p in enumerate(provs): dr.polygon([to_px(q) for q in p['polygon']], fill=i + 1)
    for k, w in enumerate(MAP['wilds']):
        for c in w['cells']: dr.polygon([to_px(q) for q in c], fill=200 + k)
    ID = np.array(idimg, dtype=np.int32)
    land = ID > 0; isprov = (ID > 0) & (ID < 200); iswild = ID >= 200
    # distance (world units) to the nearest edge of the pixel's own province, and the id across it
    dist = np.full(ID.shape, 1e9); across = np.zeros(ID.shape, np.int32)
    for i, p in enumerate(provs):
        poly = p['polygon']; xs = [q['x'] for q in poly]; ys = [q['y'] for q in poly]
        c0, c1 = max(0, int((min(xs) - x0) * ppu) - 2), min(Wd, int((max(xs) - x0) * ppu) + 3)
        r0, r1 = max(0, int((y1 - max(ys)) * ppu) - 2), min(Ht, int((y1 - min(ys)) * ppu) + 3)
        if c0 >= c1 or r0 >= r1: continue
        m = ID[r0:r1, c0:c1] == i + 1
        if not m.any(): continue
        px, py = X[r0:r1, c0:c1], Y[r0:r1, c0:c1]
        for k in range(len(poly)):
            a, b = poly[k], poly[(k + 1) % len(poly)]; dx, dy = b['x'] - a['x'], b['y'] - a['y']; L2 = dx * dx + dy * dy
            t = np.clip(((px - a['x']) * dx + (py - a['y']) * dy) / L2, 0, 1); dd = np.hypot(px - a['x'] - t * dx, py - a['y'] - t * dy)
            l = math.sqrt(L2); mx, my = (a['x'] + b['x']) / 2 + dy / l * 2.5, (a['y'] + b['y']) / 2 - dx / l * 2.5
            ci, ri = int((mx - x0) * ppu), int((y1 - my) * ppu)
            other = ID[ri, ci] if 0 <= ri < Ht and 0 <= ci < Wd else 0
            if not (0 <= ri < Ht and 0 <= ci < Wd):  # outside the window: decide by geometry
                other = -1
            sub = dist[r0:r1, c0:c1]; upd = m & (dd < sub)
            sub[upd] = dd[upd]; across[r0:r1, c0:c1][upd] = other
    # terrain per pixel, domain-warped within the band, then blended
    wx = (0.7 * fbm(X, Y, 40, 3, 101) + 0.3 * fbm(X, Y, 9, 2, 103)) * WARP * 1.8; wy = (0.7 * fbm(X, Y, 40, 3, 202) + 0.3 * fbm(X, Y, 9, 2, 203)) * WARP * 1.8
    mag = np.hypot(wx, wy); lim = np.minimum(1, WARP / np.maximum(mag, 1e-9)); wx *= lim; wy *= lim
    ci = np.clip(((X + wx - x0) * ppu).astype(int), 0, Wd - 1); ri = np.clip(((y1 - (Y + wy)) * ppu).astype(int), 0, Ht - 1)
    WID = ID[ri, ci]; ok = isprov & (WID > 0) & (WID < 200); WID = np.where(ok, WID, ID)
    tid = np.full(ID.shape, -1)
    for i, p in enumerate(provs): tid[WID == i + 1] = TI[p['terrain']]
    one = np.stack([(tid == k).astype(np.float32) for k in range(7)], -1)
    rad = max(1, int(0.012 * D * ppu))
    wts = np.stack([np.asarray(Image.fromarray((one[..., k] * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(rad)), np.float32) / 255 for k in range(7)], -1)
    s = wts.sum(-1, keepdims=True); wts = np.where(s > 0, wts / np.maximum(s, 1e-6), one)
    wts[~isprov] = 0
    # heightfield
    H = np.zeros(ID.shape)
    for k, t in enumerate(TERR):
        n = fbm(X, Y, FEAT[t], 5, 300 + k, ridged=(t == 'mountains'))
        if t == 'mountains': n = n * 1.2 - 0.2
        H += wts[..., k] * (BASE[t] + AMPH[t] * n)
    for k, w in enumerate(MAP['wilds']):
        m = ID == 200 + k
        if not m.any(): continue
        if w['kind'] == 'peaks':
            cxw, cyw = w['center']['x'], w['center']['y']; rr = np.hypot(X[m] - cxw, Y[m] - cyw) / (0.55 * D)
            H[m] = 0.9 + 0.65 * np.clip(1 - rr, 0, 1) ** 0.7 + 0.22 * fbm(X[m], Y[m], 30, 3, 500 + k, ridged=True)
        else: H[m] = -0.05
    Z = 26.0  # vertical scale: world units per height unit
    gy, gx = np.gradient(H * Z, 1 / ppu)
    gy = -gy  # rows run down, world y up
    nx, ny, nz = -gx, -gy, np.ones_like(H); nl = np.sqrt(nx * nx + ny * ny + 1); nx, ny, nz = nx / nl, ny / nl, nz / nl
    el = math.radians(40); lx, ly, lz = -math.cos(el) / math.sqrt(2), math.cos(el) / math.sqrt(2), math.sin(el)
    shade = np.clip(nx * lx + ny * ly + nz * lz, 0, 1); raw = shade - math.sin(el)
    # lightness swing per terrain, compressed to its amplitude, then made mean-neutral over each province's core
    A = (wts * np.array([AMPL[t] for t in TERR])).sum(-1)
    dL = np.clip(A * np.tanh(raw * 3.2) * 1.15, -A, A)
    # ground detail: canopy stipple, field strips, crack mottle, grass mottle (all lightness, all mean-neutral)
    det = np.zeros(ID.shape)
    st = fbm(X, Y, 0.9, 2, 900); det += wts[..., TI['forest']] * (6 * np.tanh(st * 3) + 2 * fbm(X, Y, 14, 2, 905))
    det += wts[..., TI['plains']] * (3.5 * fbm(X, Y, 22, 3, 901) + 1.0 * fbm(X, Y, 1.5, 2, 906))
    det += wts[..., TI['hills']] * 2.0 * fbm(X, Y, 16, 3, 907)
    det += wts[..., TI['wasteland']] * (3 * np.tanh(3 * fbm(X, Y, 6, 3, 902)) + 1.5 * fbm(X, Y, 1.2, 2, 908))
    det += wts[..., TI['swamp']] * 2.0 * fbm(X, Y, 0.8, 2, 909)
    # farmland: parcels of four tones, each with fine furrows in its own direction (0, 90, +-30 degrees)
    pv = fbm(X + 3 * fbm(X, Y, 10, 2, 910), Y, 7, 1, 911); q = np.clip(((pv + 0.6) / 1.2 * 4).astype(int), 0, 3)
    tone = np.array([-3.0, -1.0, 1.0, 3.0])[q]; a = np.radians(np.array([0.0, 90.0, 30.0, -30.0])[q]); u = X * np.cos(a) + Y * np.sin(a)
    det += wts[..., TI['farmland']] * (tone + 1.2 * np.sign(np.sin(u * 2 * np.pi / 1.3)))
    dL = dL + det
    own_t = np.zeros(ID.shape, np.int32) - 1
    for i, p in enumerate(provs): own_t[ID == i + 1] = TI[p['terrain']]
    pure = np.take_along_axis(wts, np.clip(own_t, 0, 6)[..., None], -1)[..., 0] > 0.97
    core = isprov & pure
    for rep in range(3):  # mean-neutral per province, then hold the p95 swing to the terrain's amplitude, twice over
        for i in range(NP):
            m = core & (ID == i + 1)
            if m.sum() > 20: dL[(ID == i + 1)] -= dL[m].mean()
        if rep < 2: dL = np.clip(dL, -A, A)
    lab = np.einsum('hwk,kc->hwc', wts, ALB); lab[..., 0] += dL
    # water inside provinces: swamp pools (part of the swamp's mean), one lake in some lowland cores
    wat = np.zeros(ID.shape, bool)
    pools = isprov & (fbm(X, Y, 3.5, 3, 950) > 0.40) & (wts[..., TI['swamp']] > 0.8)
    wat |= pools
    for i, p in enumerate(provs):
        if p['terrain'] in ('plains', 'forest', 'farmland') and (i * 13 + MAP['seed']) % 5 == 0:
            cx, cy = p['center']['x'] + 14, p['center']['y'] - 10
            r = np.hypot((X - cx) / 1.4, Y - cy) + 4 * fbm(X, Y, 6, 2, 960 + i)
            wat |= (ID == i + 1) & (r < 7.5) & (dist > W_BAND + 2)
    WL = rgb2lab(hx(WATER))
    lakes = wat & ~pools
    lab[lakes] = WL; lab[lakes, 0] += 4 * shade[lakes] - 2
    lab[pools] = ALB[TI['swamp']] + np.array([-9.0, -2.0, -4.0])  # swamp pools: darker wet ground, part of the swamp's mean
    # swamp mean-neutral again with its pools counted (the swamp albedo is the mean of ground and pools)
    for i, p in enumerate(provs):
        if p['terrain'] != 'swamp': continue
        m = core & (ID == i + 1)
        if m.sum() > 20: lab[(ID == i + 1) & ~wat] -= (lab[m].mean(0) - ALB[TI['swamp']]) * (m.sum() / max(1, (m & ~wat).sum()))
    # wilds: granite massifs lit and snowed, sunken meres
    for k, w in enumerate(MAP['wilds']):
        m = ID == 200 + k
        if not m.any(): continue
        if w['kind'] == 'peaks':
            g, lit, sn = rgb2lab(hx(GRANITE)), rgb2lab(hx(LITROCK)), rgb2lab(hx(SNOW))
            sh = shade[m][:, None]; c = g + (lit - g) * np.clip((sh - 0.2) / 0.65, 0, 1)
            hm = H[m][:, None]; p88, p97 = np.percentile(H[m], 88), np.percentile(H[m], 97)
            sw = np.clip((hm - p88) / max(1e-6, p97 - p88), 0, 1) * np.clip((sh - 0.45) / 0.2, 0, 1)
            lab[m] = c * (1 - sw) + sn * sw
        else:
            lab[m] = rgb2lab(hx(MERE)); lab[m, 0] += 3 * fbm(X[m], Y[m], 4, 2, 970)
    base_lab = lab.copy()
    # ownership: rim glow along realm edges, selection tint
    own_px = np.full(ID.shape, -1)
    for i in range(NP):
        if i in owner: own_px[ID == i + 1] = owner[i]
    acr_owner = np.full(ID.shape, -1)
    for i in range(NP):
        if i in owner: acr_owner[across == i + 1] = owner[i]
    acr_owner[(across >= 200) | (across == 0)] = -2  # wilds and the outline: not a realm edge
    rgb = lab2rgb(lab)
    realm_edge = (own_px >= 0) & (acr_owner != own_px) & (acr_owner != -2)
    tglow = np.where(realm_edge, 0.35 * (1 - np.clip(dist / W_BAND, 0, 1) ** 1.0) ** 1.6, 0.0)
    if selected is not None: tglow = np.where(ID == PID[selected] + 1, np.maximum(tglow, 0.30), tglow)
    for slot, b in BANNER.items():
        m = own_px == slot
        rgb[m] = rgb[m] * (1 - tglow[m, None]) + hx(b) * tglow[m, None]
    if selected is not None and PID[selected] not in owner:
        m = ID == PID[selected] + 1; rgb[m] = rgb[m] * 0.7 + hx('#E9E4D8') * 0.3
    if fog:  # unexplored: provinces whose center lies east of x = 0.62 W. The dust sheet: no painted detail, half relief,
        # 4% gesso; a hem of 12% gesso fading to 4% over 0.05 D along borders with explored land
        unex = np.zeros(NP + 1, bool)
        for i, p in enumerate(provs): unex[i + 1] = p['center']['x'] > MAP['width'] * 0.62
        fm = isprov & unex[np.clip(ID, 0, NP)]
        flat_lab = np.einsum('hwk,kc->hwc', wts, ALB); flat_lab[..., 0] += 0.5 * np.clip(A * np.tanh(raw * 3.2) * 1.15, -A, A)
        flat = lab2rgb(flat_lab)
        hem = fm & (across > 0) & (across < 200) & ~unex[np.clip(across, 0, NP)]
        a = np.full(ID.shape, 0.04); a[hem] = 0.04 + 0.08 * (1 - np.clip(dist[hem] / W_BAND, 0, 1))
        rgb[fm] = flat[fm] * (1 - a[fm, None]) + hx('#E8DCC2') * a[fm, None]
    # the table, the cast shadow, the skirt (painted oblique on south-facing outline edges)
    SKIRT_H = 24.0
    img = np.zeros((Ht, Wd, 3))
    if table:
        gr = fbm(X * 0.15, Y * 4.0, 3, 3, 990)
        oak = hx(OAK['body']) + (hx(OAK['lit']) - hx(OAK['body'])) * np.clip(gr, 0, 1)[..., None] + (hx(OAK['grain']) - hx(OAK['body'])) * np.clip(-gr, 0, 1)[..., None]
        img[:] = oak
        sh = Image.new('L', (Wd, Ht), 0); sd = ImageDraw.Draw(sh)
        off = (0.10 * D * ppu * 0.5, 0.10 * D * ppu * 0.5)
        sd.polygon([(to_px(q)[0] + off[0], to_px(q)[1] + off[1] + SKIRT_H * ppu) for q in MAP['outline']], fill=150)
        sh = np.asarray(sh.filter(ImageFilter.GaussianBlur(max(2, 0.06 * D * ppu))), float) / 255
        img *= (1 - 0.55 * sh)[..., None]
        sk = Image.new('RGBA', (Wd, Ht), (0, 0, 0, 0)); skd = ImageDraw.Draw(sk)
        ol = MAP['outline']
        for k in range(len(ol)):
            a, b = ol[k], ol[(k + 1) % len(ol)]; dx, dy = b['x'] - a['x'], b['y'] - a['y']
            if dx <= 0: continue  # CCW outline, y up: edges running +x are the south side
            pa, pb = to_px(a), to_px(b); h = SKIRT_H * ppu
            for j in range(int(h)):
                tt = j / max(1, h - 1); c = hx(SKIRT_TOP) * (1 - tt) + hx(SKIRT_BASE) * tt
                if (j // max(2, int(3 * ppu))) % 4 == 3: c = c * 0.86
                skd.line([(pa[0], pa[1] + j), (pb[0], pb[1] + j)], fill=tuple(int(v) for v in c) + (255,), width=2)
        ska = np.asarray(sk, float); al = ska[..., 3:] / 255
        img = img * (1 - al) + ska[..., :3] * al
    else:
        img[:] = hx('#15130F')
    img[land] = rgb[land]
    # rails, internal lines, hairlines, wild contours: drawn at 2x and downsampled
    S2 = 2; ov = Image.new('RGBA', (Wd * S2, Ht * S2), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    def P2(q, nx=0.0, ny=0.0): x, y = to_px({'x': q['x'] + nx, 'y': q['y'] + ny}); return (x * S2, y * S2)
    def col(h, a=255): return tuple(int(v) for v in hx(h)) + (a,)
    def keyline(i): return LIGHT if rgb2lab(hx(PAL[provs[i]['terrain']]))[0] < 55 else INK
    px1 = 1.0 / ppu  # one screen px in world units
    drawn = set()
    for i, p in enumerate(provs):
        poly = p['polygon']
        for k in range(len(poly)):
            a, b = poly[k], poly[(k + 1) % len(poly)]; dx, dy = b['x'] - a['x'], b['y'] - a['y']; l = math.hypot(dx, dy)
            inx, iny = -dy / l, dx / l  # inward normal (CCW, y up)
            mx, my = (a['x'] + b['x']) / 2 - inx * 2.5, (a['y'] + b['y']) / 2 - iny * 2.5
            ci_, ri_ = int((mx - x0) * ppu), int((y1 - my) * ppu)
            oth = int(ID[ri_, ci_]) if 0 <= ri_ < Ht and 0 <= ci_ < Wd else -1
            if oth >= 200 or oth == 0: continue  # wild contour and the outline are drawn elsewhere
            j = oth - 1 if oth > 0 else None
            o_i, o_j = owner.get(i), owner.get(j) if j is not None else None
            if o_i is not None and o_i == o_j:  # internal border of one realm: one centered rail
                key = tuple(sorted((i, j)))
                if key in drawn: continue
                drawn.add(key)
                # a lit bead: the light keyline on the side facing the upper left, the dark one on the other
                lightside = 1 if (inx * -1 + iny * 1) > 0 else -1; q = 1.0 * px1
                od.line([P2(a, inx * q * lightside, iny * q * lightside), P2(b, inx * q * lightside, iny * q * lightside)], fill=col(LIGHT, 235), width=int(1.0 * S2))
                od.line([P2(a, -inx * q * lightside, -iny * q * lightside), P2(b, -inx * q * lightside, -iny * q * lightside)], fill=col(INK, 235), width=int(1.0 * S2))
                od.line([P2(a), P2(b)], fill=col(BANNER[o_i]), width=int(1.5 * S2))
            elif o_i is not None:  # realm edge: an inset rail on this side, keyline toward the interior
                # an inset lit bead: dark keyline on the border side, the banner, light keyline toward the interior
                od.line([P2(a, inx * 1.4 * px1, iny * 1.4 * px1), P2(b, inx * 1.4 * px1, iny * 1.4 * px1)], fill=col(INK, 235), width=int(1.0 * S2))
                od.line([P2(a, inx * 2.6 * px1, iny * 2.6 * px1), P2(b, inx * 2.6 * px1, iny * 2.6 * px1)], fill=col(BANNER[o_i]), width=int(1.6 * S2))
                od.line([P2(a, inx * 3.8 * px1, iny * 3.8 * px1), P2(b, inx * 3.8 * px1, iny * 3.8 * px1)], fill=col(LIGHT, 235), width=int(1.0 * S2))
            elif o_j is None and j is not None:  # two unowned provinces: one neutral hairline
                key = tuple(sorted((i, j)))
                if key in drawn: continue
                drawn.add(key)
                k2 = keyline(i); od.line([P2(a), P2(b)], fill=col(k2, 150 if k2 == INK else 140), width=int(1.25 * S2))
    for k, w in enumerate(MAP['wilds']):
        for c in w['cells']:
            pts = [P2(q) for q in c] + [P2(c[0])]
            od.line(pts, fill=col(INK), width=int(3 * S2), joint='curve')
    ov = ov.resize((Wd, Ht), Image.LANCZOS); ova = np.asarray(ov, float); al = ova[..., 3:] / 255
    img = img * (1 - al) + ova[..., :3] * al
    # the model's lit lip along the whole outline
    base_img = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    lip = Image.new('RGBA', (Wd * S2, Ht * S2), (0, 0, 0, 0)); ld = ImageDraw.Draw(lip)
    ld.line([P2(q) for q in MAP['outline']] + [P2(MAP['outline'][0])], fill=(233, 228, 216, 110), width=int(1.5 * S2))
    base_img.alpha_composite if False else None
    base_img = Image.alpha_composite(base_img.convert('RGBA'), lip.resize((Wd, Ht), Image.LANCZOS)).convert('RGB')
    land_rgb = np.asarray(base_img, float)  # before miniatures and labels: what the land metrics read
    # miniatures: towns on bases, armies on bases (placeholders: shapes, not art)
    mini = Image.new('RGBA', (Wd * S2, Ht * S2), (0, 0, 0, 0)); md = ImageDraw.Draw(mini)
    Dpx = D * ppu
    items = []
    for i, p in enumerate(provs):
        c = p['center']; t = tier(p['startPop']) + (1 if p['capitalSlot'] is not None else 0)
        dia = min(120, max(18, (0.16 + 0.045 * (t - 1)) * Dpx)); items.append(('town' if t >= 4 or p['capitalSlot'] is not None else 'hamlet', c['x'], c['y'], dia, i, t))
    for slot in BANNER:
        mine = [i for i in owner if owner[i] == slot]
        for n, i in enumerate(sorted(mine)[:3]):
            c = provs[i]['center']; items.append(('army', c['x'] + 0.17 * D, c['y'] - 0.06 * D, 0, i, slot))
    items.sort(key=lambda it: -it[2])  # far (north) first
    for it in items:
        kind, wx_, wy_, dia, i, extra = it; cx, cy = to_px({'x': wx_, 'y': wy_}); cx *= S2; cy *= S2
        if kind == 'hamlet':
            o = owner.get(i); roof = {0: '#3A3633', 1: '#4E6B3A'}.get(o, '#B9A06A'); nh = [0, 2, 4, 7, 12, 18][min(5, extra)]; hs = max(2.5, 0.035 * Dpx) * S2
            for h in range(nh):
                ang = h * 2.4 + i; rad = hs * 1.1 * math.sqrt(h); hxp, hyp = cx + rad * math.cos(ang), cy + 0.6 * rad * math.sin(ang)
                md.ellipse([hxp - hs * 0.4 + hs * 0.25, hyp - hs * 0.1, hxp + hs * 0.9, hyp + hs * 0.35], fill=(0, 0, 0, 60))
                md.rectangle([hxp - hs / 2, hyp - hs * 0.8, hxp + hs / 2, hyp], fill=col('#CFC6B4'))
                md.polygon([(hxp - hs * 0.62, hyp - hs * 0.7), (hxp + hs * 0.62, hyp - hs * 0.7), (hxp, hyp - hs * 1.35)], fill=col(roof))
            continue
        if kind == 'town':
            r = dia * S2 / 2; o = owner.get(i)
            md.ellipse([cx - r + 0.18 * r, cy - r * 0.55 + 0.25 * r, cx + r + 0.18 * r, cy + r * 0.55 + 0.25 * r], fill=(0, 0, 0, 70))
            md.ellipse([cx - r, cy - r * 0.55 + 0.12 * r, cx + r, cy + r * 0.55 + 0.12 * r], fill=col('#141210'))
            md.ellipse([cx - r, cy - r * 0.55, cx + r, cy + r * 0.55], fill=col('#2A2622'), outline=col(BANNER[o] if o is not None else '#91A092'), width=int(2.2 * S2))
            wallc = {0: '#5E5953', 1: '#6B4A2B'}.get(o, '#9A958C'); rr = r * 0.72
            md.ellipse([cx - rr, cy - rr * 0.55 - 0.18 * r, cx + rr, cy + rr * 0.55 - 0.18 * r], outline=col(wallc), width=max(2, int(0.08 * r)))
            nh = [1, 3, 6, 11, 16, 22][min(5, extra)]
            for h in range(nh):
                ang = h * 2.4; rad = 0.12 * rr + 0.55 * rr * math.sqrt(h / max(1, nh))
                hxp, hyp = cx + rad * math.cos(ang), cy - 0.18 * r + 0.55 * rad * math.sin(ang); hs = max(2, 0.14 * r)
                roof = {0: '#3A3633', 1: '#4E6B3A'}.get(o, '#C2A86B')
                md.rectangle([hxp - hs / 2, hyp - hs * 0.9, hxp + hs / 2, hyp], fill=col('#CFC6B4'))
                md.polygon([(hxp - hs * 0.6, hyp - hs * 0.8), (hxp + hs * 0.6, hyp - hs * 0.8), (hxp, hyp - hs * 1.5)], fill=col(roof))
        else:
            s = max(22, min(34, 0.2 * Dpx)) * S2; r = s / 2; b = BANNER[extra]
            md.ellipse([cx - r + 0.3 * r, cy - 0.5 * r + 0.35 * r, cx + r + 0.5 * r, cy + 0.5 * r + 0.35 * r], fill=(0, 0, 0, 80))
            md.ellipse([cx - r, cy - 0.5 * r + 0.15 * r, cx + r, cy + 0.5 * r + 0.15 * r], fill=col('#141210'))
            md.ellipse([cx - r, cy - 0.5 * r, cx + r, cy + 0.5 * r], fill=col('#1E1B18'), outline=col(b), width=int(2.4 * S2))
            md.arc([cx - r, cy - 0.5 * r, cx + r, cy + 0.5 * r], 180, 270, fill=col('#B8B1A4'), width=int(1 * S2))
            fh = 1.15 * s; body = {0: '#5A4F48', 1: '#4A5A3A'}[extra]
            md.polygon([(cx - 0.18 * s, cy), (cx + 0.18 * s, cy), (cx + 0.12 * s, cy - 0.62 * fh), (cx - 0.12 * s, cy - 0.62 * fh)], fill=col(body))
            md.ellipse([cx - 0.1 * s, cy - 0.82 * fh, cx + 0.1 * s, cy - 0.62 * fh], fill=col('#C9A88A'))
            md.line([(cx + 0.22 * s, cy + 0.02 * s), (cx + 0.3 * s, cy - fh)], fill=col('#3A3633'), width=int(1.2 * S2))
            md.polygon([(cx + 0.3 * s, cy - fh), (cx + 0.58 * s, cy - 0.92 * fh), (cx + 0.3 * s, cy - 0.82 * fh)], fill=col(b))
    if selected is not None:
        c = provs[PID[selected]]['center']; cx, cy = to_px(c)
    mini = mini.resize((Wd, Ht), Image.LANCZOS)
    out = Image.alpha_composite(base_img.convert('RGBA'), mini)
    # labels by zoom: Mid shows capitals and Wellsprings; Near shows every name at the town's foot
    if labels:
        dl = ImageDraw.Draw(out); fnt = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf', 13 if labels == 'mid' else 15)
        for i, p in enumerate(provs):
            show = labels == 'near' or p['capitalSlot'] is not None or p['wellspring'] is not None
            if not show: continue
            c = p['center']; cx, cy = to_px(c); t = tier(p['startPop']) + (1 if p['capitalSlot'] is not None else 0)
            dia = min(120, max(18, (0.16 + 0.045 * (t - 1)) * Dpx)); ty = cy + (dia * 0.42 if (t >= 4 or p['capitalSlot'] is not None) else 0.09 * Dpx)
            dl.text((cx, ty), p['name'], font=fnt, anchor='mt', fill=(244, 238, 223), stroke_width=2, stroke_fill=(28, 26, 23))
        fi = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf', 14)
        for w in MAP['wilds']:
            cx, cy = to_px(w['center']); dl.text((cx, cy), 'the ' + w['name'], font=fi, anchor='mm', fill=(233, 228, 216), stroke_width=2, stroke_fill=(28, 26, 23))
    out.convert('RGB').save(os.path.join(OUT, name + '.png'))
    return dict(ID=ID, isprov=isprov, core=core, dist=dist, wts=wts, base_lab=base_lab, wat=wat, land_rgb=land_rgb, land=land, tid=tid, dL=dL, A=A)

# ---- the three views
Wm, Hm = MAP['width'], MAP['height']
m = 0.35 * Hm  # the table beyond the model, as the war table's 0.35 x the cloth's height
far = render(-m, -m - 30, Wm + m, Hm + m, 1440 / (Wm + 2 * m), 'far', labels='mid')
ppu_mid = min((1440 - 64) / Wm, (900 - 64) / (Hm + 24))
cxm, cym = Wm / 2, Hm / 2 - 12
mid = render(cxm - 720 / ppu_mid, cym - 450 / ppu_mid, cxm + 720 / ppu_mid, cym + 450 / ppu_mid, ppu_mid, 'mid', labels='mid', selected=None)
cap = next(p for p in provs if p['id'] == MAP['capitals'][0]); ppu_near = 4.4
ncx = cap['center']['x'] * 0.5 + Wm / 2 * 0.5; ncy = cap['center']['y'] * 0.5 + Hm / 2 * 0.5
near = render(ncx - 720 / ppu_near, ncy - 450 / ppu_near, ncx + 720 / ppu_near, ncy + 450 / ppu_near, ppu_near, 'near', table=False, labels='near', selected=cap['id'])
fogv = render(cxm - 720 / ppu_mid, cym - 450 / ppu_mid, cxm + 720 / ppu_mid, cym + 450 / ppu_mid, ppu_mid, 'mid-fog', labels='mid', fog=True)

# ---- measurements on the Mid view (no table, no miniatures, no labels: the land as baked, with rails and glow)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from v4color import to_lab  # noqa: E402  (the references' converter, so the numbers compare with refs-analysis §1.1)
def ciede2000(l1, l2):
    L1, a1, b1 = l1; L2, a2, b2 = l2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cb = (C1 + C2) / 2; G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2; C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360; h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dLp, dCp = L2 - L1, C2p - C1p; dhp = 0 if C1p * C2p == 0 else (h2p - h1p if abs(h2p - h1p) <= 180 else h2p - h1p - 360 if h2p > h1p else h2p - h1p + 360)
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2)); Lbp = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hbp = h1p + h2p if C1p * C2p == 0 else ((h1p + h2p) / 2 if abs(h1p - h2p) <= 180 else (h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2)
    T = 1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp)) + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.2 * math.cos(math.radians(4 * hbp - 63))
    dT = 30 * math.exp(-(((hbp - 275) / 25) ** 2)); Rc = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / math.sqrt(20 + (Lbp - 50) ** 2); Sc = 1 + 0.045 * Cbp; Sh = 1 + 0.015 * Cbp * T; Rt = -math.sin(math.radians(2 * dT)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))
res = {}
v = mid; ID = v['ID']; lines = []
worst = (0, ''); dom_min = (1, ''); means = []
for i, p in enumerate(provs):
    m_all = ID == i + 1; m = v['core'] & m_all & (~v['wat'] if p['terrain'] != 'swamp' else True)
    if m.sum() < 50: continue
    mean = v['base_lab'][m].mean(0); de = ciede2000(tuple(mean), tuple(ALB[TI[p['terrain']]])); means.append(de)
    if de > worst[0]: worst = (de, f"{p['id']} {p['terrain']}")
    dom = (v['tid'][m_all & ~v['wat']] == TI[p['terrain']]).mean()
    if dom < dom_min[0]: dom_min = (dom, f"{p['id']} {p['terrain']}")
res['core_mean_dE_max'] = round(worst[0], 2); res['core_mean_dE_max_at'] = worst[1]; res['core_mean_dE_median'] = round(float(np.median(means)), 2)
res['own_terrain_share_min'] = round(float(dom_min[0]), 3); res['own_terrain_share_min_at'] = dom_min[1]
# p95 lightness swing of relief + detail, per terrain, over cores
for k, t in enumerate(TERR):
    m = v['core'] & (v['tid'] == k) & ~v['wat']
    if m.sum() > 100: res[f'swing_p95_{t}'] = round(float(np.percentile(np.abs(v['dL'][m]), 95)), 1)
# value, chroma, coarse busyness of the land with rails and glow (the references' method)
lab = to_lab(v['land_rgb'])[v['land']]
res['L_p5_p50_p95'] = [round(float(np.percentile(lab[:, 0], q)), 1) for q in (5, 50, 95)]; res['L_sd'] = round(float(lab[:, 0].std()), 1)
rgbl = s2l(v['land_rgb'][v['land']]); lms = np.cbrt(rgbl @ np.array([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]]).T)
okA = lms @ np.array([1.9779984951, -2.428592205, 0.4505937099]); okB = lms @ np.array([0.0259040371, 0.7827717662, -0.808675766]); C = np.hypot(okA, okB)
res['C_mean_p90'] = [round(float(C.mean()), 3), round(float(np.percentile(C, 90)), 3)]; res['C_over_0.12_pct'] = round(float((C > 0.12).mean() * 100), 2)
def busy(rgbimg, mask):
    im = Image.fromarray(np.clip(rgbimg, 0, 255).astype(np.uint8)); k = 1 / 6
    sm = np.asarray(im.resize((int(im.width * k), int(im.height * k)), Image.BOX), float)
    mk = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).resize(sm.shape[1::-1], Image.BOX)) > 250
    Lc = to_lab(sm)[..., 0]; gx = np.abs(Lc[:, 1:] - Lc[:, :-1]); gy = np.abs(Lc[1:, :] - Lc[:-1, :]); g = np.maximum(gx[:-1, :], gy[:, :-1]); mm = mk[:-1, :-1] & mk[1:, :-1] & mk[:-1, 1:]
    return round(float((g[mm] > 10).mean() * 100), 1), round(float((g[mm] > 20).mean() * 100), 1)
res['busy_mid_land'] = busy(v['land_rgb'], v['land'])
full = np.asarray(Image.open(os.path.join(OUT, 'mid.png')).convert('RGB'), float)
res['busy_mid_with_miniatures_and_labels'] = busy(full, v['land'])
nv = near; res['busy_near_land'] = busy(nv['land_rgb'], nv['land'])
json.dump(res, open(os.path.join(OUT, 'metrics.json'), 'w'), indent=1); print(json.dumps(res, indent=1))

# ---- the start view as a deuteranope sees it (Machado 2009, full severity, the matrix colorMath.ts uses)
MD = np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]])
for nm in ('mid', 'near'):
    im = np.asarray(Image.open(os.path.join(OUT, nm + '.png')).convert('RGB'), float)
    sim = l2s(np.clip(s2l(im) @ MD.T, 0, 1)); Image.fromarray(sim.astype(np.uint8)).save(os.path.join(OUT, nm + '-deutan.png'))
