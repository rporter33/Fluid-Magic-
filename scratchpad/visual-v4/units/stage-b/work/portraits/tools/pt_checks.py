# Stage B portraits (key "portraits"): the automatic checks for a painted portrait of a creature, mount or god.
# Portraits are not keyed or sliced; these measures stand in for the figure sheets' camera, rim and side checks.
# All measures run on the image resized to 512 px (the masters' size). Thresholds are calibrated on the 136
# approved leader portraits (calibrate() below; numbers in work/portraits/calib/calib.json).
#
#   background  border median (top band and the upper side bands) within dE2000 10 of the portraits' #1C1A17, and
#               plain: the band's L* spread (p90 - p10) small, so no pattern or object
#   framing     bust: the top of the subject 3% to 16% from the top (template 9%), the subject cut by the bottom edge
#               (mid-chest), centred; body (gods): top 2% to 13% (template 6%), lowest painted row 82% to 99%
#               (template 94%), the body filling the height
#   light       the key light from the upper left: the subject's left half lighter than its right half (median L*)
#   rim         the share of the upper silhouette's boundary ring at least 12 L* above the background
#   read48      at 48 px, the subject's median L* above the background's (the silhouette reads when shrunk)
#   muted       share of subject pixels with OKLCH chroma > 0.10 outside the allowed hue windows (the side's cloth
#               for subjects with a tint zone; flame for the Fire Sprite)
#   side        subjects with a tint zone: share of subject pixels in the nation's cloth window (plan 1.4 rule) and,
#               for Thornwood, in the calibrated lock range (hue 90 to 230, chroma >= 0.02); reported, gated by kind
# Usage: python3 pt_checks.py IMAGE.png bust|body [--nation cinderHorde|thornwood|none] [--flame]
#        python3 pt_checks.py --calibrate
import glob, json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
V4 = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(V4, 'tools'))
sys.path.insert(0, os.path.join(V4, 'units', 'tools'))
from v4color import to_lab, oklch  # noqa: E402
from pilot_metrics import de2000  # noqa: E402

REPO = '/home/user/Fluid-Magic-'
BG = np.array([28, 26, 23], np.float64)
CLOTH = {'cinderHorde': '#C4532C', 'thornwood': '#1F6A50'}
GATES = None  # filled from calib.json


def _hexrgb(h):
    return np.array([[[int(h[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)


def cloth_window(rgb, nation):
    _, cc, ch = oklch(_hexrgb(CLOTH[nation]))
    _, C, h = oklch(rgb)
    dh = np.abs((h - float(ch[0, 0]) + 180) % 360 - 180)
    # resume (portraits): the Thornwood floor follows calibration 2.1 (painted Thornwood cloth is dark and muted, median
    # chroma 0.029; the lock's floor is 0.02). The War Wolf 01a blanket, clearly green on the card, sits at hue 156 and
    # chroma 0.027 and missed the old floor of 0.04 (window 0.005). Cinder keeps 0.04.
    # and its hue band is the calibration's +-25 around the cloth (2.1: "a band +-25 deg around 166"), not +-20
    floor = 0.025 if nation == 'thornwood' else max(0.04, 0.45 * float(cc[0, 0]))
    return (dh <= (25 if nation == 'thornwood' else 20)) & (C >= floor)


def thorn_lock(rgb):
    _, C, h = oklch(rgb)
    band = np.abs((h - 166 + 180) % 360 - 180) <= 25
    return ((h >= 90) & (h <= 230) & (C >= 0.02)) | (band & (C >= 0.015))


def _erode(mask, r):
    im = Image.fromarray((mask * 255).astype(np.uint8))
    for _ in range(r):
        im = im.filter(ImageFilter.MinFilter(3))
    return np.asarray(im) > 127


def _dilate(mask, r):
    im = Image.fromarray((mask * 255).astype(np.uint8))
    for _ in range(r):
        im = im.filter(ImageFilter.MaxFilter(3))
    return np.asarray(im) > 127


def measure(path, kind='bust', nation=None, flame=False):
    im = Image.open(path).convert('RGB').resize((512, 512), Image.LANCZOS)
    a = np.asarray(im).astype(np.float64)
    lab = to_lab(a)
    L = lab[..., 0]
    n = 512
    band = np.zeros((n, n), bool)
    band[:20] = True
    band[:int(0.6 * n), :16] = True
    band[:int(0.6 * n), -16:] = True
    bmed = np.median(a[band], 0)
    blab = to_lab(bmed[None, None])[0, 0]
    bg_de = de2000(blab, to_lab(BG[None, None])[0, 0])
    # the subject: away from the background colour, cleaned
    d = np.sqrt(((lab - blab) ** 2).sum(-1))
    m = d > 9
    m = _dilate(_erode(m, 2), 2)
    m = _erode(_dilate(m, 3), 3)
    bl = L[band & ~_dilate(m, 4)]
    spread = float(np.percentile(bl, 90) - np.percentile(bl, 10)) if bl.size > 500 else 0.0
    cen = m[:, 64:448]
    rows = np.nonzero(cen.mean(1) > 0.04)[0]
    top = float(rows.min() / n) if rows.size else 1.0
    # resume (portraits): the lowest row of a god. Two things fooled the bust-calibrated mask (distance > 9 from the
    # background): a faint painted floor under the feet, which the prompt allows ("a faint soft shadow under the feet"),
    # made the bottom band read as subject (Great Wyrm 01a: 1.0), and feet that sink into the candle shadow (the wave 1
    # light change) read as background (Pyre Lord 01b: 0.67 with the feet at 0.94). Here a subject pixel differs from the
    # background by more than 6 and, when there is a floor (bottom band more than 4 from the background), from the
    # floor's colour in its own row (median of the 40 px outer columns), so a gradient floor is followed; a row counts
    # at 2% coverage of the central columns (feet are narrow). The floor's distance is reported and gated for bodies.
    flab = to_lab(np.median(a[-12:].reshape(-1, 3), 0)[None, None])[0, 0]
    floor = float(de2000(flab, blab))
    mlow = d > 6
    if floor > 4:
        rowc = np.median(np.concatenate([lab[:, :40], lab[:, -40:]], 1), 1)
        mlow &= np.sqrt(((lab - rowc[:, None, :]) ** 2).sum(-1)) > 6
    mlow = _erode(_dilate(_dilate(_erode(mlow, 2), 2), 3), 3)
    rows_l = np.nonzero(mlow[:, 64:448].mean(1) > 0.02)[0]
    low = float((rows_l.max() + 1) / n) if rows_l.size else 0.0
    bottom_cut = float(mlow[-6:].mean())
    ys, xs = np.nonzero(m)
    cx = float(xs.mean() / n) if xs.size else 0.5
    sub = m.sum() / (n * n)
    # light: left half against right half of the subject (median L*)
    xc = int(cx * n)
    left = L[:, :xc][m[:, :xc]]
    right = L[:, xc:][m[:, xc:]]
    light = float(np.median(left) - np.median(right)) if left.size > 200 and right.size > 200 else 0.0
    # rim: boundary ring of the upper part of the subject
    ring = m & ~_erode(m, 3)
    if rows.size:
        y0, y1 = rows.min(), rows.min() + int(0.6 * (rows.max() - rows.min() + 1))
        rr = ring.copy(); rr[:y0] = False; rr[y1:] = False
        rr[-8:] = False
    else:
        rr = ring
    rim = float((L[rr] >= blab[0] + 12).mean()) if rr.sum() > 50 else 0.0
    # read at 48 px
    s48 = np.asarray(im.resize((48, 48), Image.LANCZOS)).astype(np.float64)
    m48 = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((48, 48), Image.BOX)) > 200
    L48 = to_lab(s48)[..., 0]
    read48 = float(np.median(L48[m48]) - blab[0]) if m48.sum() > 20 else 0.0
    # colour
    _, C, h = oklch(a)
    sat = m & (C > 0.10)
    allowed = np.zeros_like(sat)
    side = None
    if nation in CLOTH:
        win = cloth_window(a, nation) & m
        allowed |= cloth_window(a, nation)
        side = dict(window=round(float(win.sum() / max(1, m.sum())), 4))
        if nation == 'thornwood':
            lk = thorn_lock(a) & m
            side['lock'] = round(float(lk.sum() / max(1, m.sum())), 4)
            # the generator's leaf-green and teal cloth: allowed as cloth, measured by the lock
            allowed |= thorn_lock(a)
    if flame:
        allowed |= (h >= 15) & (h <= 95)
    muted = float((sat & ~allowed).sum() / max(1, m.sum()))
    sat_all = float(sat.sum() / max(1, m.sum()))
    return dict(background=round(bg_de, 1), bgSpread=round(spread, 1), floor=round(floor, 1), top=round(top, 3), low=round(low, 3),
                bottomCut=round(bottom_cut, 3), cx=round(cx, 3), subject=round(float(sub), 3), light=round(light, 1),
                rim=round(rim, 3), read48=round(read48, 1), muted=round(muted, 4), satAll=round(sat_all, 4),
                side=side)


def load_gates():
    global GATES
    p = os.path.join(HERE, '..', 'calib', 'calib.json')
    GATES = json.load(open(p))['gates']
    return GATES


def verdict(r, kind, nation=None, tint=False):
    """The failed gates of one measured portrait (empty: passes). tint: the subject has a tint zone in its side's cloth."""
    g = GATES or load_gates()
    fails = []
    if r['background'] > g['background']:
        fails.append(f"background dE {r['background']} > {g['background']}")
    if r['bgSpread'] > g['bgSpread']:
        fails.append(f"background not plain (spread {r['bgSpread']} > {g['bgSpread']})")
    if kind == 'bust':
        if not (g['bustTop'][0] <= r['top'] <= g['bustTop'][1]):
            fails.append(f"framing: top {r['top']} outside {g['bustTop']}")
    else:
        if not (g['bodyTop'][0] <= r['top'] <= g['bodyTop'][1]):
            fails.append(f"framing: top {r['top']} outside {g['bodyTop']}")
        if not (g['bodyLow'][0] <= r['low'] <= g['bodyLow'][1]):
            fails.append(f"framing: lowest row {r['low']} outside {g['bodyLow']}")
        if r.get('floor', 0) > g.get('bodyFloor', 99):
            fails.append(f"background: painted floor dE {r['floor']} > {g['bodyFloor']}")
        if r['low'] - r['top'] < g['bodyFill']:
            fails.append(f"framing: body fills {round(r['low'] - r['top'], 3)} of the height < {g['bodyFill']}")
    if not (g['cx'][0] <= r['cx'] <= g['cx'][1]):
        fails.append(f"framing: off centre (cx {r['cx']})")
    if r['rim'] < g['rim']:
        fails.append(f"rim {r['rim']} < {g['rim']}")
    if r['read48'] < g['read48']:
        fails.append(f"read48 {r['read48']} < {g['read48']}")
    if r['muted'] > g['muted']:
        fails.append(f"muted: saturated share {r['muted']} > {g['muted']}")
    if tint and r['side'] is not None:
        if nation == 'cinderHorde' and r['side']['window'] < g['sideCinderWindow']:
            fails.append(f"side window {r['side']['window']} < {g['sideCinderWindow']}")
        if nation == 'thornwood':
            if r['side']['lock'] < g['sideThornLock']:
                fails.append(f"side lock {r['side']['lock']} < {g['sideThornLock']}")
            if r['side']['window'] < g['sideThornWindow']:
                fails.append(f"side window {r['side']['window']} < {g['sideThornWindow']}")
    return fails


def calibrate():
    files = sorted(glob.glob(os.path.join(REPO, 'art-source/portraits/*/*/[0-9][0-9].webp')))
    out = {}
    for f in files:
        rel = os.path.relpath(f, os.path.join(REPO, 'art-source/portraits'))
        out[rel] = measure(f, 'bust')
    keys = ['background', 'bgSpread', 'top', 'bottomCut', 'cx', 'light', 'rim', 'read48', 'muted', 'satAll']
    stats = {k: dict(min=min(v[k] for v in out.values()), p5=float(np.percentile([v[k] for v in out.values()], 5)),
                     p50=float(np.percentile([v[k] for v in out.values()], 50)),
                     p95=float(np.percentile([v[k] for v in out.values()], 95)), max=max(v[k] for v in out.values()))
             for k in keys}
    return out, stats


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--calibrate':
        out, stats = calibrate()
        os.makedirs(os.path.join(HERE, '..', 'calib'), exist_ok=True)
        json.dump(dict(n=len(out), stats=stats, per=out), open(os.path.join(HERE, '..', 'calib', 'measures.json'), 'w'), indent=1)
        print(json.dumps(stats, indent=1))
    else:
        nat = a[a.index('--nation') + 1] if '--nation' in a else None
        r = measure(a[0], a[1] if len(a) > 1 else 'bust', nat, '--flame' in a)
        print(json.dumps(r))
