# Renders the layout guides for the pilot effect sheets (Image 1 of each prompt): grey placeholder shapes on the
# sheet's own background, in the exact boxes of fx_layouts.py, lit softly from the upper left, with every ground shape
# squashed to 0.643. Usage: python3 -I fx_guides.py OUTDIR [SHEET ...]
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fx_layouts import SHEETS, SIZES, BG, SQ  # noqa: E402

L = np.array([-0.55, -0.6, 0.58]); L = L / np.linalg.norm(L)


def rng(seed):
    return np.random.default_rng(seed)


class Canvas:
    def __init__(self, w, h, bg):
        self.w, self.h = w, h
        self.img = np.zeros((h, w, 3), np.float32) + np.array(bg, np.float32)

    def blend(self, mask, col):
        """Paints colour col (scalar grey or rgb, 0..255) through a float mask 0..1 (h, w)."""
        col = np.array(col, np.float32).reshape(1, 1, -1)
        self.img = self.img * (1 - mask[..., None]) + col * mask[..., None]

    def shade(self, mask, grey):
        """Paints a per-pixel grey field through a mask."""
        self.img = self.img * (1 - mask[..., None]) + grey[..., None] * mask[..., None]


def poly_mask(w, h, pts, blur=1.2):
    im = Image.new('L', (w, h), 0)
    ImageDraw.Draw(im).polygon([tuple(map(float, p)) for p in pts], fill=255)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im).astype(np.float32) / 255


def line_mask(w, h, pts, width, blur=1.0):
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    d.line([tuple(map(float, p)) for p in pts], fill=255, width=int(max(1, width)), joint='curve')
    for p in pts[::max(1, len(pts) // 12)]:
        r = width / 2
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im).astype(np.float32) / 255


def ell_mask(w, h, cx, cy, rx, ry, soft=1.5):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - cx) / max(rx, 1)) ** 2 + ((yy - cy) / max(ry, 1)) ** 2)
    edge = soft / max(min(rx, ry), 1)
    return np.clip((1 - d) / edge, 0, 1)


def sphere(cv, cx, cy, r, lo=70, hi=210):
    yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
    dx, dy = (xx - cx) / r, (yy - cy) / r
    d2 = dx * dx + dy * dy
    m = np.clip((1 - np.sqrt(d2)) * r / 1.5, 0, 1)
    nz = np.sqrt(np.clip(1 - d2, 0, 1))
    lam = np.clip(dx * L[0] + dy * L[1] + nz * L[2], 0, 1)
    cv.shade(m, lo + (hi - lo) * lam)


def glow(cv, cx, cy, r, peak=170):
    yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    m = np.clip(1 - d, 0, 1) ** 1.6
    cv.blend(m, peak)


def dome(cv, cx, cy, rx, H, top_open=False, lo=70, hi=205):
    """A half ellipsoid on a ground ellipse (rx, rx*SQ), seen from 40 degrees: its outline is the ground ellipse's
    lower half joined to a raised arc of height H."""
    ry = rx * SQ
    yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
    u = (xx - cx) / rx
    inside = np.abs(u) <= 1
    top = cy - np.sqrt(np.clip(1 - u * u, 0, 1)) * (H + ry * 0.0) - np.sqrt(np.clip(1 - u * u, 0, 1)) * ry * 0.0
    bot = cy + np.sqrt(np.clip(1 - u * u, 0, 1)) * ry
    upper = cy - np.sqrt(np.clip(1 - u * u, 0, 1)) * (H)
    m = (inside & (yy >= upper) & (yy <= bot)).astype(np.float32)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
    # shading: normal of the ellipsoid approximated by the screen offset from the dome's centre
    ny = np.clip((yy - (cy - H * 0.45)) / (H + ry), -1, 1)
    nx = np.clip(u, -1, 1)
    nz = np.sqrt(np.clip(1 - nx * nx * 0.7 - ny * ny * 0.5, 0, 1))
    lam = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
    g = lo + (hi - lo) * lam
    if top_open:
        hole = ell_mask(cv.w, cv.h, cx, cy - H * 0.75, rx * 0.35, rx * 0.35 * SQ * 0.8, soft=6)
        g = g * (1 - 0.55 * hole)
    cv.shade(m, g)


def blob(cv, cx, cy, r, seed, n=9, jitter=0.35, col=150, soft=1.5, sq=1.0):
    R = rng(seed)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n + R.uniform(-0.2, 0.2)
        rr = r * (1 + R.uniform(-jitter, jitter))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * sq))
    cv.blend(poly_mask(cv.w, cv.h, pts, soft), col)


def cloud(cv, cx, cy, r, seed, n=7, lo=80, hi=190, sq=1.0):
    R = rng(seed)
    for i in range(n):
        a = R.uniform(0, 2 * math.pi); d = R.uniform(0, 0.55) * r
        rr = r * R.uniform(0.38, 0.62)
        sphere(cv, cx + math.cos(a) * d, cy + math.sin(a) * d * sq, rr, lo, hi)


def draw_el(cv, sheet, e):
    x0, y0, x1, y1 = e['box']
    cx, cy, bw, bh = (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0
    s, k = e['shape'], e.get('k', 0)
    seed = sum(map(ord, sheet + e['name']))
    if s == 'sphere':
        sphere(cv, cx, cy, e['r'])
    elif s == 'glow':
        glow(cv, cx, cy, e['r'])
    elif s == 'taper':  # thin at the left, thick and ragged at the right
        n = 40
        top, bot = [], []
        for i in range(n + 1):
            q = i / n
            x = x0 + q * (bw - 40)
            half = (3 + (e['thick'] / 2 - 3) * q ** 1.4) * (1 + 0.12 * math.sin(i * 1.7))
            top.append((x, cy - half)); bot.append((x, cy + half))
        cap = [(x1 - 40 + 40 * math.cos(a), cy + e['thick'] / 2 * math.sin(a)) for a in np.linspace(-math.pi / 2, math.pi / 2, 12)]
        m = poly_mask(cv.w, cv.h, top + cap + bot[::-1], 2)
        yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
        cv.shade(m, 80 + 120 * np.clip((xx - x0) / bw, 0, 1))
    elif s == 'meteor':
        rx, ry = x1 - 150, y1 - 110
        tail = [(rx - 40, ry - 60), (x0 + 30, y0 + 20), (x0 + 10, y0 + 40), (rx - 70, ry + 30)]
        m = poly_mask(cv.w, cv.h, tail, 6)
        yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
        cv.shade(m * np.clip((xx - x0) / (rx - x0), 0.15, 1), 150 + 0 * xx)
        blob(cv, rx, ry, 70, seed, n=11, jitter=0.25, col=120)
        sphere(cv, rx - 8, ry - 8, 52, 60, 190)
    elif s == 'dome':
        rx = [62, 118, 162, 182, 188, 178][k]; H = [58, 108, 140, 118, 64, 22][k]
        base_y = y0 + bh * 0.70
        if k <= 3:
            dome(cv, cx, base_y, rx, H, top_open=(k == 3))
        if k == 4:  # flames spread as a ring along the ground, the middle hollowing out; smoke rising from the top
            cv.blend(ell_mask(cv.w, cv.h, cx, base_y, rx, rx * SQ, 3) - 0.85 * ell_mask(cv.w, cv.h, cx, base_y, rx * 0.62, rx * 0.62 * SQ, 6), 150)
            cloud(cv, cx, base_y - 120, 70, seed, n=6, lo=60, hi=120)
        if k == 5:  # a low broken ring of embers
            R = rng(seed)
            for i in range(26):
                a = R.uniform(0, 2 * math.pi); d = R.uniform(0.5, 1.0)
                blob(cv, cx + math.cos(a) * rx * d, base_y + math.sin(a) * rx * SQ * d, R.uniform(5, 11), seed + i, n=7, col=170)
            cloud(cv, cx, base_y - 70, 40, seed + 5, n=4, lo=50, hi=90)
    elif s == 'fleck':
        blob(cv, cx, cy, [22, 30, 18, 36][k % 4], seed, n=8, jitter=0.45, col=175)
    elif s == 'streak':
        ang = [-0.5, 0.2, -1.1, 0.7][k % 4]
        L2 = [150, 110, 170, 90][k % 4]
        pts = [(cx - math.cos(ang) * L2 / 2, cy - math.sin(ang) * L2 / 2), (cx + math.cos(ang) * L2 / 2, cy + math.sin(ang) * L2 / 2)]
        cv.blend(line_mask(cv.w, cv.h, pts, 10, 2), 190)
    elif s == 'lick':
        hgt, wid = [140, 110, 170, 90][k % 4], [60, 46, 70, 40][k % 4]
        pts = [(cx, cy - hgt / 2), (cx + wid * 0.35, cy - hgt * 0.1), (cx + wid / 2, cy + hgt * 0.3), (cx, cy + hgt / 2), (cx - wid / 2, cy + hgt * 0.3), (cx - wid * 0.3, cy - hgt * 0.15)]
        cv.blend(poly_mask(cv.w, cv.h, pts, 3), 170)
    elif s == 'softdot':
        glow(cv, cx, cy, [80, 56][k % 2], 175)
    elif s == 'star':
        r1, r2 = 85, 14
        pts = []
        for i in range(8):
            a = i * math.pi / 4 - math.pi / 2
            rr = r1 if i % 2 == 0 else r2
            pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
        cv.blend(poly_mask(cv.w, cv.h, pts, 2), 190)
        glow(cv, cx, cy, 30, 150)
    elif s == 'puff':
        r = [92, 78, 104, 70, 98, 84, 110, 74][k % 8]
        cloud(cv, cx, cy + 20, r, seed, n=7, lo=70, hi=180)
    elif s == 'column':
        R = rng(seed)
        for i in range(14):
            q = i / 13
            yy_ = y1 - 40 - q * (bh - 120)
            xx_ = cx + (q ** 1.5) * (18 if e['name'].endswith('1') else -14) + R.uniform(-6, 6)
            sphere(cv, xx_, yy_, 26 + 34 * q, 70, 170)
    elif s == 'ring':  # E6 scorch ring: a dark ring band around a scorched middle, with streaks outward
        rx, ry = bw / 2 - 10, (bw / 2 - 10) * SQ
        cv.blend(ell_mask(cv.w, cv.h, cx, cy, rx, ry, 18) * 0.55, 120)
        cv.blend(ell_mask(cv.w, cv.h, cx, cy, rx * 0.72, ry * 0.72, 10) * 0.8, 70)
        cv.blend(ell_mask(cv.w, cv.h, cx, cy, rx * 0.42, ry * 0.42, 14) * 0.7, 150)
    elif s == 'crater':
        rx, ry = bw / 2 - 10, (bw / 2 - 10) * SQ
        cv.blend(ell_mask(cv.w, cv.h, cx, cy, rx, ry, 10) * 0.5, 150)
        cv.blend(ell_mask(cv.w, cv.h, cx, cy + 6, rx * 0.66, ry * 0.66, 8), 60)
    elif s == 'blot':
        rx = bw / 2 - 20
        cv.blend(ell_mask(cv.w, cv.h, cx, cy, rx, rx * SQ, 12) * 0.85, 80)
    elif s == 'patch':
        blob(cv, cx, cy, bw / 2 - 30, seed, n=13, jitter=0.25, col=90, soft=8, sq=SQ * 1.05)
    elif s == 'track':
        n = 30
        top, bot = [], []
        for i in range(n + 1):
            q = i / n
            x = x0 + q * bw
            half = (bh / 2 - 20) * math.sin(math.pi * q) ** 0.6
            yc = cy + 12 * math.sin(q * 5.0)
            top.append((x, yc - half)); bot.append((x, yc + half))
        cv.blend(poly_mask(cv.w, cv.h, top + bot[::-1], 10) * 0.8, 90)
    elif s == 'thorns':
        v = e.get('v', 0)
        hk = [0.24, 0.55, 1.0, 0.86][k]
        spread = [0.6, 0.8, 1.0, 1.12][k]
        base_y = y0 + bh * 0.80
        R = rng(seed // 7 + v)
        cv.blend(ell_mask(cv.w, cv.h, cx, base_y, 90 * spread, 90 * spread * SQ, 8) * 0.5, 120)
        if v == 0: spikes = [(R.uniform(-60, 60) * spread, R.uniform(-20, 20) * spread, R.uniform(120, 190) * hk) for _ in range(6)]
        elif v == 1: spikes = [(math.cos(a) * 80 * spread, math.sin(a) * 80 * SQ * spread, R.uniform(90, 140) * hk) for a in np.linspace(0, 2 * math.pi, 9)[:-1]]
        else: spikes = [(0, 0, 230 * hk)] + [(R.uniform(-75, 75) * spread, R.uniform(-22, 22) * spread, R.uniform(80, 140) * hk) for _ in range(5)]
        for dx, dy, hh in sorted(spikes, key=lambda s: s[1]):
            bxp, byp = cx + dx, base_y + dy
            lean = dx * 0.25
            wdt = max(6, hh * 0.16)
            pts = [(bxp - wdt, byp), (bxp + lean, byp - hh), (bxp + wdt, byp)]
            m = poly_mask(cv.w, cv.h, pts, 1.2)
            cv.blend(m, 95 + 60 * (dx < 0))
    elif s == 'coil':  # a knotted mound of roots and vines that hides a man's lower legs, rising to knee height
        wither = e.get('wither', 0)
        base_y = y0 + bh * 0.84
        rx = 74
        hgt = [34, 80, 132][k] if not wither else [118, 62, 16][k]
        sag = 1.0 if not wither else [1.15, 1.35, 1.6][k]
        cv.blend(ell_mask(cv.w, cv.h, cx, base_y, rx * sag, rx * sag * SQ, 6) * 0.7, 105)
        # the mound: a rounded cone from the ground ellipse up to its height, narrower at the top
        pts = []
        for i in range(25):
            q = i / 24
            a = math.pi * q
            pts.append((cx - math.cos(a) * rx * sag, base_y + math.sin(a) * rx * sag * SQ))
        top_w = rx * (0.55 if not wither else 0.75) * sag
        pts = pts + [(cx + top_w, base_y - hgt), (cx - top_w, base_y - hgt)]
        if hgt > 20:
            m = poly_mask(cv.w, cv.h, pts, 2)
            yy, xx = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
            cv.shade(m, 95 + 70 * np.clip((cx - xx) / rx * 0.5 + 0.5, 0, 1))
        R = rng(seed)
        for st in range(4):
            ph = st * 1.6
            pts = []
            for i in range(40):
                q = i / 39
                a = ph + q * 2.2 * math.pi
                rr = rx * sag * (1.0 - 0.45 * q)
                pts.append((cx + math.cos(a) * rr, base_y - q * hgt + math.sin(a) * rr * SQ * 0.5))
            if wither and k == 2:
                for j in range(0, 36, 7):
                    cv.blend(line_mask(cv.w, cv.h, pts[j:j + 4], 9, 1.2), 70)
            else:
                cv.blend(line_mask(cv.w, cv.h, pts, 9, 1.2), 60 + 25 * (st % 2))
    elif s == 'vine':
        pts = [(x0 + q * bw, cy + 14 * math.sin(q * 18)) for q in np.linspace(0, 1, 80)]
        cv.blend(line_mask(cv.w, cv.h, pts, 18, 1.5), 120)
        pts2 = [(x0 + q * bw, cy + 10 * math.sin(q * 18 + 2.2)) for q in np.linspace(0, 1, 80)]
        cv.blend(line_mask(cv.w, cv.h, pts2, 9, 1.2), 150)
        R = rng(seed)
        for i in range(16):
            lx = x0 + (i + 0.5) / 16 * bw
            blob(cv, lx, cy + R.choice([-1, 1]) * 22, 12, seed + i, n=6, jitter=0.2, col=140, sq=0.55)
    elif s == 'crack':
        R = rng(seed)
        n = 60
        pts = [(x0 + q * bw, cy + R.uniform(-1, 1) * bh * 0.18) for q in np.linspace(0, 1, n)]
        cv.blend(line_mask(cv.w, cv.h, pts, e['w'], 1.0), 60)
        for i in range(8 if e['w'] > 15 else 5):
            j = R.integers(4, n - 4)
            px, py = pts[j]
            br = [(px, py)]
            for s2 in range(5):
                br.append((br[-1][0] + R.uniform(10, 26), br[-1][1] + R.choice([-1, 1]) * R.uniform(6, 14)))
            cv.blend(line_mask(cv.w, cv.h, br, max(3, e['w'] // 3), 0.8), 90)
    elif s == 'split':
        R = rng(seed)
        rx = bw / 2 - 20
        cv.blend(ell_mask(cv.w, cv.h, cx, cy, rx * 0.25, rx * 0.25 * SQ, 8), 90)
        for i in range(11):
            a = 2 * math.pi * i / 11 + R.uniform(-0.2, 0.2)
            pts = [(cx, cy)]
            for s2 in range(7):
                d = (s2 + 1) / 7 * rx * R.uniform(0.8, 1.0)
                a2 = a + R.uniform(-0.15, 0.15)
                pts.append((cx + math.cos(a2) * d, cy + math.sin(a2) * d * SQ))
            cv.blend(line_mask(cv.w, cv.h, pts, 9 - (i % 3) * 2, 1.0), 70)
    elif s == 'scar':
        rx = bw / 2 - 30
        cv.blend(ell_mask(cv.w, cv.h, cx, cy, rx, rx * SQ, 10) * 0.5, 130)
        cv.blend(ell_mask(cv.w, cv.h, cx, cy + 4, rx * 0.5, rx * 0.5 * SQ, 6), 60)
        R = rng(seed)
        for i in range(5):
            a = R.uniform(0, 2 * math.pi)
            p0 = (cx + math.cos(a) * rx * 0.4, cy + math.sin(a) * rx * 0.4 * SQ)
            p1 = (cx + math.cos(a) * rx * 0.95, cy + math.sin(a) * rx * 0.95 * SQ - 10)
            cv.blend(line_mask(cv.w, cv.h, [p0, p1], 7, 1), 80)
    elif s == 'leaf':
        R = rng(seed)
        ang = R.uniform(-0.9, 0.9)
        lg, wd = R.uniform(70, 110), R.uniform(26, 44)
        pts = []
        for i in range(24):
            q = i / 23 * 2 * math.pi
            x = math.cos(q) * lg / 2; y = math.sin(q) * wd / 2 * (1 - 0.35 * math.cos(q))
            pts.append((cx + x * math.cos(ang) - y * math.sin(ang), cy + x * math.sin(ang) + y * math.cos(ang)))
        cv.blend(poly_mask(cv.w, cv.h, pts, 1.2), 140 if k % 3 else 110)
    elif s == 'petal':
        R = rng(seed)
        ang = R.uniform(0, math.pi)
        pts = []
        for i in range(20):
            q = i / 19 * 2 * math.pi
            x = math.cos(q) * 26; y = math.sin(q) * 15 * (1 + 0.3 * math.cos(q))
            pts.append((cx + x * math.cos(ang) - y * math.sin(ang), cy + x * math.sin(ang) + y * math.cos(ang)))
        cv.blend(poly_mask(cv.w, cv.h, pts, 1.2), 175)
    elif s == 'flowers':
        R = rng(seed)
        cv.blend(ell_mask(cv.w, cv.h, cx, cy + 20, 80, 80 * SQ, 10) * 0.45, 120)
        for i in range(7):
            fx, fy = cx + R.uniform(-60, 60), cy + 20 + R.uniform(-35, 35)
            for p in range(5):
                a = p * 2 * math.pi / 5
                sphere(cv, fx + math.cos(a) * 7, fy + math.sin(a) * 7 * SQ, 6, 120, 210)
    elif s == 'litter':
        R = rng(seed)
        for i in range(30):
            a = R.uniform(0, 2 * math.pi); d = math.sqrt(R.uniform(0, 1))
            lx, ly = cx + math.cos(a) * d * (bw / 2 - 30), cy + math.sin(a) * d * (bw / 2 - 30) * SQ
            blob(cv, lx, ly, R.uniform(9, 16), seed + i, n=6, jitter=0.25, col=R.choice([110, 140, 165]), sq=0.55)


def render(sheet, out):
    S = SHEETS[sheet]
    w, h = SIZES[S['aspect']]
    cv = Canvas(w, h, BG[S['bg']])
    for e in S['els']:
        draw_el(cv, sheet, e)
    Image.fromarray(np.clip(cv.img, 0, 255).astype(np.uint8)).save(out)
    return out


if __name__ == '__main__':
    outdir = sys.argv[1]
    os.makedirs(outdir, exist_ok=True)
    for s in (sys.argv[2:] or list(SHEETS)):
        print(render(s, os.path.join(outdir, s + '.guide.png')))
