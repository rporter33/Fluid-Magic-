# Stage C review page: image assets. Reads the stage C atlases (atlas/creatures, atlas/gods), the approved portraits
# (stage-b/portraits and the repo's art-source/portraits, read only), the battle shots (shots/, shots/fix/battle) and
# returns WebP data URIs. Writes nothing outside review-build/ (look/ previews only when LOOK=1).
import base64, io, json, os, sys
sys.dont_write_bytecode = True  # importing stage B's bundle helper must not write into stage B
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SC = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(SC, '..'))
SB = os.path.join(UNITS, 'stage-b')
REPO = '/home/user/Fluid-Magic-'
CA = os.path.join(SC, 'atlas', 'creatures')
GA = os.path.join(SC, 'atlas', 'gods')
SHOTS = os.path.join(SC, 'shots')
LOOK = os.path.join(HERE, 'look')
GODS = json.load(open(os.path.join(GA, 'gods.json')))

STATS = {'n': 0, 'bytes': 0}


def durl(im, q=80, name=None):
    b = io.BytesIO()
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA')
    im.save(b, 'WEBP', quality=q, alpha_quality=90, method=6)
    data = b.getvalue()
    STATS['n'] += 1
    STATS['bytes'] += len(data)
    if name and os.environ.get('LOOK'):
        os.makedirs(LOOK, exist_ok=True)
        im.save(os.path.join(LOOK, f'emb-{name}.png'))
    return 'data:image/webp;base64,' + base64.b64encode(data).decode('ascii'), im.size


def scaled(im, k):
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def premul_scaled(im, k):
    """Downscale an RGBA cutout without dark fringes (premultiplied resample)."""
    if k == 1:
        return im
    return im.convert('RGBa').resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS).convert('RGBA')


# ------------------------------------------------------------------ atlases
_ATL = {}


def atlas(prefix):
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


def crop(img, f):
    r = f['frame']
    return img.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (f['anchor']['x'], f['anchor']['y'])


def frame(prefix, name):
    return crop(*atlas(prefix)[name])


def fig_meta(fig):
    return json.load(open(os.path.join(CA, 'figures', fig + '.json')))


def with_shadow(fig_img, fanc, sh_img, sanc):
    """The figure over its silhouette shadow, anchors on one point. Returns (image, anchor)."""
    fx, fy = fanc[0] * fig_img.width, fanc[1] * fig_img.height
    sx, sy = sanc[0] * sh_img.width, sanc[1] * sh_img.height
    x0, y0 = min(-fx, -sx), min(-fy, -sy)
    x1, y1 = max(fig_img.width - fx, sh_img.width - sx), max(fig_img.height - fy, sh_img.height - sy)
    W, H = int(np.ceil(x1 - x0)), int(np.ceil(y1 - y0))
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    c.alpha_composite(sh_img, (round(-sx - x0), round(-sy - y0)))
    c.alpha_composite(fig_img, (round(-fx - x0), round(-fy - y0)))
    bb = c.getbbox()
    c = c.crop(bb)
    return c, ((-x0 - bb[0]) / c.width, (-y0 - bb[1]) / c.height)


def ground_pad(views, margin=4):
    """Views of one figure padded to one height with their ground anchors on one line (same scale kept)."""
    up = max(a[1] * im.height for im, a in views)
    dn = max(im.height - a[1] * im.height for im, a in views)
    out = []
    for im, a in views:
        u = a[1] * im.height
        c = Image.new('RGBA', (im.width + 2 * margin, int(round(up + dn)) + 2 * margin), (0, 0, 0, 0))
        c.alpha_composite(im, (margin, int(round(up - u)) + margin))
        out.append(c)
    return out


# ------------------------------------------------------------------ portraits
def portrait(path, px=320, q=80, box512=None):
    """An approved portrait (units-relative, or absolute), from its 512 px master when there is one."""
    p = path if os.path.isabs(path) else os.path.join(UNITS, path)
    m = p.replace('.webp', '-512.webp') if not p.endswith('-512.webp') else p
    im = Image.open(m if os.path.exists(m) else p).convert('RGB')
    if box512:
        k = im.width / 512
        im = im.crop(tuple(round(c * k) for c in box512))
    return durl(im.resize((px, px), Image.LANCZOS), q=q)


# ------------------------------------------------------------------ creature figures (tier H, as packed)
REST = {'sprite': 'wingMid', 'cavalry': 'stand', 'wolfrider': 'stand', 'beast': 'stand', 'melee': 'stand'}
KEYPOSE_LAYOUT = {'fireSprite': 'sprite', 'wolf': 'beast', 'oakheart': 'melee', 'ashRider': 'cavalry', 'wolfRider': 'wolfrider'}


def creature_view(fig, view):
    """One view of a creature figure as the game packs it at its top zoom (tier H): the rest pose of a key-pose figure,
    or a big body's idle cutout over its shadow. Returns (image, anchor)."""
    if fig in KEYPOSE_LAYOUT:
        return frame(os.path.join(CA, f'{fig}-H'), f'{fig}.{view}.{REST[KEYPOSE_LAYOUT[fig]]}')
    meta = fig_meta(fig)
    a = meta['views'][view]['atlas']['H']
    pre = os.path.join(CA, f'{meta["unit"]}-H')
    im, anc = frame(pre, a['frame'])
    sh, sanc = frame(pre, a['shadow'])
    return with_shadow(im, anc, sh, sanc)


def god_view(fig, view):
    x = GODS['figures'][fig]['views'][view]['tiers']['H']
    im = Image.open(os.path.join(GA, x['file'])).convert('RGBA')
    sh = Image.open(os.path.join(GA, x['shadow']['file'])).convert('RGBA')
    return with_shadow(im, (x['ax'], x['ay']), sh, (x['shadow']['ax'], x['shadow']['ay']))


def view_set(views, cap_h=None, q=82, name=None):
    """[(image, anchor), ...] of one figure -> [(durl, size), ...] padded to one ground line; embedded no taller than
    cap_h (a premultiplied downscale; never upscaled)."""
    padded = ground_pad(views)
    k = 1.0
    if cap_h and padded[0].height > cap_h:
        k = cap_h / padded[0].height
    return [durl(premul_scaled(p, k), q=q, name=f'{name}-{i}' if name else None) for i, p in enumerate(padded)], k


# ------------------------------------------------------------------ hornets
def hornet_images():
    """The Hornet Swarm: one painted hornet as packed at tier H (24 px) and as painted (the packer's input frame), and
    one figure of 12 hornets at tier H as the battle composes it (stage B bundle_stagec.hornet_clusters)."""
    sys.path.insert(0, os.path.join(SB, 'integrate'))
    import bundle_stagec as SCB  # noqa: E402
    at = atlas(os.path.join(CA, 'hornetSwarm-H'))
    single, sanc = crop(*at['hornetSwarm.back.glide0'])
    src = Image.open(os.path.join(CA, 'frames', 'hornetSwarm.back', 'hornetSwarm.back.glide0.png')).convert('RGBA')
    cl = next(i for i in SCB.hornet_clusters(at, crop, 'H') if i['name'] == 'hornetSwarm.back.c0.glide')
    return {
        'painted': durl(src, q=84, name='hornet-painted'),
        'single': durl(single, q=90, name='hornet-single'),
        'cluster': durl(cl['img'], q=86, name='hornet-cluster'),
    }


# ------------------------------------------------------------------ shots
def shot(path, box=None, max_w=None, q=78, name=None):
    im = Image.open(path).convert('RGB')
    if box:
        im = im.crop(box)
    if max_w and im.width > max_w:
        im = scaled(im, max_w / im.width)
    return durl(im, q=q, name=name)


def battle(key, unit, zoom='top-dpr2'):
    return os.path.join(SHOTS, 'fix', 'battle', f'after-{key}-{unit}-{zoom}.png')


# ------------------------------------------------------------------ scale strips for the questions
WU_S = 0.5


def tier_s(kind, ref, view):
    """A figure at tier S (0.5 wu a px, the play-zoom art) for the scale strips: (image, anchor)."""
    if kind == 'troop':
        return frame(os.path.join(SB, 'atlas', 'troops', 'troops-cinderHorde-S'), f'{ref}.{view}.stand')
    if kind == 'cmd':
        return frame(os.path.join(SB, 'atlas', 'cmdA', 'ashChieftain.S'), f'{ref}.{view}.stand')
    if kind == 'key':
        return frame(os.path.join(CA, f'{ref}-S'), f'{ref}.{view}.{REST[KEYPOSE_LAYOUT[ref]]}')
    if kind == 'god':
        x = GODS['figures'][ref]['views'][view]['tiers']['S']
        return Image.open(os.path.join(GA, x['file'])).convert('RGBA'), (x['ax'], x['ay'])
    if kind == 'big':
        meta = fig_meta(ref)
        a = meta['views'][view]['atlas']['S']
        return frame(os.path.join(CA, f'{meta["unit"]}-S'), a['frame'])
    raise ValueError(kind)


def strip(items, gap=14, pad=8, k=1.0, name=None, q=86):
    """Figures side by side on one ground line at one scale; each item (image, anchor[, scale]). k: display scale of the
    whole strip (LANCZOS; the strips are scale comparisons, so the scale is uniform)."""
    fr = []
    for it in items:
        im, a = it[0], it[1]
        s = it[2] if len(it) > 2 else 1.0
        if s != 1.0:
            im = premul_scaled(im, s)
        fr.append((im, a))
    up = max(a[1] * im.height for im, a in fr)
    dn = max(im.height - a[1] * im.height for im, a in fr)
    W = sum(im.width for im, _ in fr) + gap * (len(fr) - 1) + 2 * pad
    out = Image.new('RGBA', (W, int(round(up + dn)) + 2 * pad), (0, 0, 0, 0))
    x = pad
    for im, a in fr:
        out.alpha_composite(im, (x, pad + int(round(up - a[1] * im.height))))
        x += im.width + gap
    if k != 1.0:
        out = out.resize((round(out.width * k), round(out.height * k)), Image.LANCZOS)
    return durl(out, q=q, name=name)
