# Stage B review page: image assets. Reads the stage B atlases, the repo's approved portraits (read only), the
# calibration review images and the block shots in review-build/shots; returns WebP data URIs. Writes nothing outside
# review-build/.
import base64, io, json, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SB = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(SB, '..'))
REPO = '/home/user/Fluid-Magic-'
PORTRAITS = os.path.join(REPO, 'src', 'assets', 'raster', 'portraits')
BG = np.array([28, 26, 23], np.float64)

STATS = {'n': 0, 'bytes': 0}


def durl(im, q=82, lossless=False):
    b = io.BytesIO()
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA')
    im.save(b, 'WEBP', quality=q, method=6, lossless=lossless)
    data = b.getvalue()
    STATS['n'] += 1
    STATS['bytes'] += len(data)
    return 'data:image/webp;base64,' + base64.b64encode(data).decode('ascii'), im.size


_ATL = {}


def atlas(prefix):
    """All pages of a packed atlas: {frame: (page image, frame dict)}."""
    if prefix not in _ATL:
        out, i = {}, 0
        while os.path.exists(f'{prefix}.{i}.json'):
            j = json.load(open(f'{prefix}.{i}.json'))
            img = Image.open(f'{prefix}.{i}.png').convert('RGBA')
            for n, f in j['frames'].items():
                out[n] = (img, f)
            i += 1
        _ATL[prefix] = out
    return _ATL[prefix]


def frame(prefix, name):
    a = atlas(prefix)
    if name not in a:
        return None
    img, f = a[name]
    r = f['frame']
    return img.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (f['anchor']['x'], f['anchor']['y'])


def row(frames, gap=10, pad=4):
    """Frames side by side, their ground anchors on one line; transparent background."""
    frames = [f for f in frames if f]
    up = max(int(round(a[1] * im.height)) for im, a in frames)
    dn = max(im.height - int(round(a[1] * im.height)) for im, a in frames)
    W = sum(im.width for im, _ in frames) + gap * (len(frames) - 1) + 2 * pad
    out = Image.new('RGBA', (W, up + dn + 2 * pad), (0, 0, 0, 0))
    x = pad
    for im, a in frames:
        out.alpha_composite(im, (x, pad + up - int(round(a[1] * im.height))))
        x += im.width + gap
    return out


def scaled(im, k):
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


# ------------------------------------------------------------------ troops
def troop_prefix(nation):
    return os.path.join(SB, 'atlas', 'troops', f'troops-{nation}-H')


def troop_view(unit, nation, view, poses):
    p = troop_prefix(nation)
    stand = frame(p, f'{unit}.{view}.stand')
    strip = row([frame(p, f'{unit}.{view}.{q}') for q in poses], gap=6)
    return durl(stand[0], q=86), durl(scaled(strip, 0.8), q=80)


def card_crop(unit, nation):
    """The interim card the bundle makes (integrate/bundle.py card_from_frame), for troop types outside the battles."""
    img, _ = frame(troop_prefix(nation), f'{unit}.front.stand')
    img = img.transpose(Image.FLIP_LEFT_RIGHT)
    a = np.asarray(img)[..., 3] > 60
    wid = a.sum(1)
    rows = np.nonzero(wid >= 0.18 * wid.max())[0]
    top, bot = int(rows.min()), int(np.nonzero(a.any(1))[0].max()); body = bot - top
    head = a[top:top + max(2, int(body * 0.12))]
    hx = float(np.nonzero(head)[1].mean())
    W, H = 128, 120
    ch = body * 0.36; cw = ch * W / H
    x0, y0 = hx - cw * 0.46, top - 0.09 * ch
    pad = Image.new('RGBA', (img.width + 400, img.height + 400), (0, 0, 0, 0)); pad.paste(img, (200, 200))
    cut = pad.crop((round(x0 + 200), round(y0 + 200), round(x0 + 200 + cw), round(y0 + 200 + ch))).resize((W, H), Image.LANCZOS)
    yy, xx = np.mgrid[0:H, 0:W]
    glow = 1 - np.clip(((xx - 54) / 70) ** 2 + ((yy - 44) / 60) ** 2, 0, 1)
    warm = BG[None, None, :] * (0.78 + 0.22 * glow[..., None]) + np.array([10, 7, 4]) * glow[..., None]
    canvas = Image.fromarray(np.clip(warm, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
    canvas.alpha_composite(cut)
    return canvas.convert('RGB')


def troop_card(unit, nation):
    # fix2: a painted bust that is kept or passed its gates is the card (as the bundle uses it in the battles)
    bj = os.path.join(SB, 'portraits', nation, unit, 'bust.json')
    if unit != 'warden' and os.path.exists(bj):
        m = json.load(open(bj))
        if m.get('approved') or (m.get('checks') or {}).get('pass'):
            im = Image.open(os.path.join(SB, 'portraits', nation, unit, 'bust-512.webp')).convert('RGB').resize((256, 256), Image.LANCZOS)
            return durl(im, q=84), 'bust'
    if unit == 'warden':
        im = Image.open(os.path.join(SB, 'portraits', 'thornwood', 'warden', 'bust-512.webp')).convert('RGB').resize((256, 256), Image.LANCZOS)
        return durl(im, q=84), 'bust'
    p = os.path.join(SB, 'integrate', 'pages', f'card-{unit}.png')
    if os.path.exists(p):
        return durl(Image.open(p).convert('RGB'), q=88), 'crop'
    return durl(card_crop(unit, nation), q=88), 'crop'


# ------------------------------------------------------------------ commanders
def cmd_prefix(unit, batch):
    return os.path.join(SB, 'atlas', batch, f'{unit}.H')


def cmd_figure(unit, face, batch):
    """Front stand, back stand and the front act pose (rally or cast), on one ground line."""
    p = cmd_prefix(unit, batch)
    fid = f'{unit}-{face}'
    fr = [frame(p, f'{fid}.front.stand'), frame(p, f'{fid}.back.stand'), frame(p, f'{fid}.front.actA')]
    have = [x is not None for x in fr]
    return durl(scaled(row(fr, gap=14), 0.9), q=84), have


def portrait(nation, unit, face, px=160):
    path = os.path.join(PORTRAITS, nation, unit, f'{face}.webp')
    im = Image.open(path).convert('RGB').resize((px, px), Image.LANCZOS)
    return durl(im, q=80)


# ------------------------------------------------------------------ files
def file_img(path, max_w=None, q=82, crop=None):
    im = Image.open(path)
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if crop:
        im = im.crop(crop)
    if max_w and im.width > max_w:
        im = scaled(im, max_w / im.width)
    return durl(im, q=q)


def mount_split():
    """The calibration's mount-and-rider split (cal/review/mount-split-edit.png), four poses, tight crops."""
    src = Image.open(os.path.join(SB, 'cal', 'review', 'mount-split-edit.png')).convert('RGB')
    a = np.asarray(src).astype(int)
    ground = np.array([150, 148, 128])
    panels = {'stand': (0, 20), 'charge': (0, 274), 'deadA': (1210, 528), 'cheer': (1210, 782)}
    out = {}
    for pose, (x0, y0) in panels.items():
        quarters = [(x0 + 300 * i, y0, x0 + 300 * (i + 1), y0 + 224) for i in range(4)]
        box = None
        for q in quarters:
            sub = a[q[1]:q[3], q[0]:q[2]]
            m = np.abs(sub - ground).sum(2) > 40
            ys, xs = np.nonzero(m)
            if len(xs) == 0:
                continue
            b = (xs.min(), ys.min(), xs.max(), ys.max())
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        bx = (max(0, box[0] - 10), max(0, box[1] - 10), min(300, box[2] + 10), min(224, box[3] + 10))
        cells = [src.crop((q[0] + bx[0], q[1] + bx[1], q[0] + bx[2], q[1] + bx[3])) for q in quarters]
        out[pose] = [durl(scaled(c, 1.25), q=86) for c in cells]
    return out


# ------------------------------------------------------------------ portrait candidates (fix2, critique-resume fix 1)
PW = os.path.join(SB, 'work', 'portraits')
VERSIONS = ('r4', 'r3', 'r2', '')  # the fix2 reserve re-roll, the corrected designs, the resume's re-roll, the first
_PJ = {}


def _jobs():
    if 'jobs' not in _PJ:
        _PJ['jobs'] = json.load(open(os.path.join(PW, 'jobs.json')))
        _PJ['review'] = json.load(open(os.path.join(PW, 'ad-review.json')))
    return _PJ['jobs'], _PJ['review']


def subject_jobs(unit, face='01'):
    """The (nation, job) pairs of a portrait subject, Cinder first (a generic god has both palettes)."""
    jobs, _ = _jobs()
    out = sorted({(j['nation'], j['job'].rsplit('.', 1)[0]) for j in jobs if j['unit'] == unit and j['face'] == face},
                 key=lambda x: (x[0] != 'cinderHorde', x[0]))
    return out


def candidate(nation, unit, face, cand, px=256):
    """A candidate's current painting: the newest version not marked 'replaced' or 'reject' in ad-review.json (-r4 over
    -r3 over -r2 over the first), read from stage-b/portraits/<nation>/<unit>/<name>-512.webp. Returns (durl of the
    painting at px, the art director's review, durl of the 64 px card (a god's card crop), version tag) or None. Never
    reads work/portraits/dryrun/ or work/portraits/refs/ (test stand-ins and clay maquettes)."""
    jobs, review = _jobs()
    job = next(j['job'] for j in jobs if j['unit'] == unit and j['nation'] == nation and j['face'] == face and j['cand'] == cand)
    d = os.path.join(SB, 'portraits', nation, unit)
    for v in VERSIONS:
        name = f'{face}{cand}' + (f'-{v}' if v else '')
        p = os.path.join(d, f'{name}-512.webp')
        if not os.path.exists(p):
            continue
        rv = review.get(job + (f'.{v}' if v else '')) or {}
        if rv.get('verdict') in ('replaced', 'reject'):
            continue
        assert '/dryrun/' not in p and '/refs/' not in p
        im = Image.open(p).convert('RGB').resize((px, px), Image.LANCZOS)
        small = Image.open(os.path.join(d, f'{name}-64.webp')).convert('RGB')
        return durl(im, q=80)[0], rv, durl(small, q=92)[0], v
    return None
