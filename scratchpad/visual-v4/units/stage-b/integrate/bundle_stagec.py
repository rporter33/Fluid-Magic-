# Stage C integration (owner review 2: figures standing in the game, no new animation): the painted creatures, mounts
# and gods the three battles use, read from the stage C production atlases and repacked for the battle mockup by
# bundle.py (which imports this module):
#   - key-pose figures (size 1 and 2 creatures and the mounted troops): atlas/creatures/<family>-<S|H>.0.png frames by
#     the names in figures/<figure>.json (both views; the Wolf Rider's three: back, front = the War Wolf harness edit,
#     frontKept = the owner-kept test); the Hornet Swarm's single view is composed 12 hornets a figure (the art plan's
#     "the game draws 12 per figure") into three seeded cluster layouts per pose;
#   - big bodies (size 3 and up): the idle cutout and its silhouette shadow per view, with the ground anchor and the true
#     height (heightWu) read from each figure's own metadata (figures/<figure>.json for the Salamander faces 02 to 04,
#     the Treant and the Giant; gods.json through bundle_gods.py for the gods), never from the Salamander 01 guides;
#   - card art: each creature's, mount's and god's approved stage B portrait (picks.json; the Hornet's candidate B is
#     provisional), gods with their card crop.
import json, os, random, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..'))
SC = os.path.join(UNITS, 'stage-c')
CA = os.path.join(SC, 'atlas', 'creatures')
GA = os.path.join(SC, 'atlas', 'gods')
TIERS = ('S', 'H')
WU = {'S': 0.5, 'H': 0.25}
PAD = {'S': 1, 'H': 2}  # the keyline's width in px around every cutout (1 px at tier S, 2 at H)
# unit -> (figure, look kind, layout) for the key-pose figures
KEYPOSE = {
    'fireSprite': ('fireSprite', 'creature', 'sprite'),
    'hornetSwarm': ('hornetSwarm', 'swarm', 'hornet'),
    'wolf': ('wolf', 'creature', 'beast'),
    'oakheart': ('oakheart', 'creature', 'melee'),
    'ashRider': ('ashRider', 'mounted', 'cavalry'),
    'wolfRider': ('wolfRider', 'mounted', 'wolfrider'),
}
# the owner's stage B pick each card follows (picks.json keys): mounted troops show their mount's approved portrait
PICK_KEY = {'ashRider': 'ashHorse', 'wolfRider': 'warWolf'}
HORNET_CLUSTERS, HORNET_N, HORNET_R = 3, 12, 10.0  # layouts a pose, hornets a figure, cloud radius (wu)
PICKS = json.load(open(os.path.join(SC, 'picks.json')))
GODS = json.load(open(os.path.join(GA, 'gods.json')))


def fig_meta(fig):
    return json.load(open(os.path.join(CA, 'figures', fig + '.json')))


_AT = {}


def atlas(family, tier, load_atlas):
    k = family + tier
    if k not in _AT:
        _AT[k] = load_atlas(os.path.join(CA, f'{family}-{tier}'))
    return _AT[k]


def view_status(fig, view):
    """A view's status and failed gates, read from the figure's own metadata (figures/<fig>.json), the record cpack.py
    writes with the shipped job (stage C fix 3: index.json had gone stale against the re-rolls)."""
    x = fig_meta(fig)['views'][view]
    return x['status'], list(x.get('failedGates') or [])


# ---------------------------------------------------------------- key-pose figures
def keypose_items(unit, tier, load_atlas, crop):
    """(items for the plain creature page, look record) of one key-pose figure at one tier."""
    fig, kind, layout = KEYPOSE[unit]
    meta = fig_meta(fig)
    at = atlas(fig, tier, load_atlas)
    items, views = [], {}
    for v, mv in meta['views'].items():
        names = mv['atlas'][tier]['frames']
        st, failed = view_status(fig, v)
        views[v] = dict(status=st, failed=failed, frames=[n.split('.', 2)[2] for n in names if not n.endswith('.white')],
                        job=mv.get('job'), sheet=mv.get('sheet'))
        if unit == 'hornetSwarm':
            continue  # composed below, 12 hornets a figure
        for n in names:
            img, anc = crop(*at[n])
            items.append(dict(name=n, img=img, anchor=anc))
    if unit == 'hornetSwarm':
        items += hornet_clusters(at, crop, tier)
    look = dict(kind=kind, unit=unit, nation=meta['nation'], layout=layout, prefix=fig, cloth=meta.get('cloth'),
                portrait=meta['portrait'], stage='C', views={v: views[v] for v in ('back', 'front') if v in views})
    if unit == 'wolfRider':
        # the front the owner compares: 'harness' (the War Wolf A tack and coat, the default) or 'kept' (the kept test)
        look['alt'] = {'front': {'harness': 'front', 'kept': 'frontKept'}}
        look['altViews'] = {'frontKept': views['frontKept']}
        look['note'] = ('stage C: back (new), front = the kept test edited to the War Wolf A harness (default), '
                        'frontKept = the owner-kept test as it was; the page control switches the front')
    if unit == 'hornetSwarm':
        look['oneView'] = True       # the layout has one view (plan 5.1); it serves both sides unflagged
        look['clusters'] = HORNET_CLUSTERS
        look['perFigure'] = HORNET_N
        look['views']['back']['frames'] = ['glide', 'up', 'down', 'sting', 'deadA', 'deadB']
    return items, look


def hornet_clusters(at, crop, tier):
    """Each pose of the Hornet Swarm figure as a cloud of 12 painted hornets, in HORNET_CLUSTERS seeded layouts: every
    hornet keeps its heading (0, 90 or 180 degrees), mirror, place and size through the poses; in the wing poses half
    the cloud has its wings up while the other half has them down. The anchor is the cloud's centre (the hover point,
    as the Fire Sprite's frames have it)."""
    fr = {}
    for n, v in at.items():
        if n.startswith('hornetSwarm.back.'):
            fr[n.split('.', 2)[2]] = crop(*v)
    wu = WU[tier]
    pick = {
        'glide': lambda h, i: {0: 'glide0', 90: 'glide90', 180: 'down180'}[h],
        'up': lambda h, i: (f'up{h}' if i % 2 == 0 else f'down{h}'),
        'down': lambda h, i: (f'down{h}' if i % 2 == 0 else f'up{h}'),
        'sting': lambda h, i: {0: 'sting0', 90: 'sting90', 180: 'down180'}[h],
        'deadA': lambda h, i: 'deadA' if i % 2 == 0 else 'deadB',
        'deadB': lambda h, i: 'deadB' if i % 2 == 0 else 'deadA',
    }
    out = []
    for k in range(HORNET_CLUSTERS):
        r = random.Random(f'stage-c/hornet-cluster/{k}')
        bugs = []
        for i in range(HORNET_N):
            h = r.choices([0, 90, 180], [0.4, 0.4, 0.2])[0]
            a, u = r.random() * 2 * np.pi, r.random()
            rr = HORNET_R * (0.25 + 0.75 * np.sqrt(u))
            bugs.append(dict(h=h, i=i, mir=r.random() < 0.5, dx=rr * np.cos(a), dy=0.62 * rr * np.sin(a) + r.uniform(-2, 2), s=r.uniform(0.85, 1.1)))
        bugs.sort(key=lambda b: b['dy'])  # farther (higher on screen) first
        for pose, f in pick.items():
            M = int(round((HORNET_R + 8) / wu)) * 2
            canvas = Image.new('RGBA', (M, M), (0, 0, 0, 0))
            cx = cy = M // 2
            for b in bugs:
                img, anc = fr[f(b['h'], b['i'])]
                w2, h2 = max(1, round(img.width * b['s'])), max(1, round(img.height * b['s']))
                im = img.convert('RGBa').resize((w2, h2), Image.LANCZOS).convert('RGBA')  # premultiplied resample
                ax = anc[0] * w2
                if b['mir']:
                    im = im.transpose(Image.FLIP_LEFT_RIGHT); ax = w2 - ax
                ay = anc[1] * h2
                canvas.alpha_composite(im, (round(cx + b['dx'] / wu - ax), round(cy + b['dy'] / wu - ay)))
            c = canvas
            bb = c.getbbox()
            c = c.crop(bb)
            anchor = ((cx - bb[0]) / c.width, (cy - bb[1]) / c.height)
            out.append(dict(name=f'hornetSwarm.back.c{k}.{pose}', img=c, anchor=anchor))
            if pose in ('glide', 'down'):
                a = np.asarray(c)[..., 3]
                wht = np.zeros((c.height, c.width, 4), np.uint8); wht[..., :3] = 255; wht[..., 3] = a
                out.append(dict(name=f'hornetSwarm.back.c{k}.{pose}.white', img=Image.fromarray(wht, 'RGBA'), anchor=anchor))
    return out


# ---------------------------------------------------------------- big bodies
def big_from_creature(fig, views, durl_webp, load_atlas, crop, report):
    """A stage C creature's idle cutout (Salamander 02-04, Treant, Giant): anchor and heightWu from its metadata."""
    meta = fig_meta(fig)
    fam = meta['unit']
    rec = dict(unit=fam, face=meta.get('face'), nation=meta['nation'], kind='creature', stage='C', views={},
               portrait=meta.get('portrait'))
    for v in views:
        mv = meta['views'][v]
        st, failed = view_status(fig, v)
        rv = dict(heightWu=mv['heightWu'], status=st, failed=failed, job=mv.get('job'), anchorFrom=mv.get('anchorFrom'))
        for t in TIERS:
            at = atlas(fam, t, load_atlas)
            a = mv['atlas'][t]
            img, anc = crop(*at[a['frame']])
            sh, sanc = crop(*at[a['shadow']])
            url, n1 = durl_webp(img)
            surl, n2 = durl_webp(sh, quality=60)
            report.append(dict(kind=f'big-{fig}-{v}', tier=t, size=img.size, webpBytes=n1 + n2))
            d = dict(url=url, w=img.width, h=img.height, ax=round(anc[0], 4), ay=round(anc[1], 4), pad=PAD[t],
                     shadow=dict(url=surl, w=sh.width, h=sh.height, ax=round(sanc[0], 4), ay=round(sanc[1], 4)))
            if a.get('mouthWu'):
                d['mouth'] = list(a['mouthWu'])
            rv[t] = d
        rec['views'][v] = rv
    return rec


def big_from_god(fig, views, durl_webp, report):
    """A god's idle cutout through bundle_gods.py (the structure bundle.py builds for the Salamander)."""
    sys.path.insert(0, GA)
    from bundle_gods import gods_bundle  # noqa: E402
    rep = []
    g = gods_bundle(durl_webp, [fig], rep)[fig]
    report += [r for r in rep if r['kind'].rsplit('-', 1)[1] in views]  # it encodes every view; only these are bundled
    f = GODS['figures'][fig]
    rec = dict(unit=f['god'], face=None, nation=f['nation'], kind='god', stage='C', sizeClass=f['sizeClass'], views={},
               portrait=f['portrait']['file'])
    for v in views:
        x = f['views'][v]
        rv = dict(heightWu=g[v]['heightWu'], status=x['status'], failed=list(x.get('failed') or []), anchorFrom=x.get('anchorFrom'))
        for t in TIERS:
            rv[t] = dict(g[v][t], pad=PAD[t])
        rec['views'][v] = rv
    return rec


# ---------------------------------------------------------------- cards
def card_from_portrait(master, box=None):
    """The approved portrait as a 128 x 120 card (64 x 60 css px at 2x), framed as the leader portraits and the busts."""
    im = Image.open(master).convert('RGB')
    if box:
        s = im.width / 512
        im = im.crop(tuple(round(c * s) for c in box))
    return im.resize((128, 128), Image.LANCZOS).crop((0, 2, 128, 122))


def creature_card(unit):
    fig = KEYPOSE[unit][0]
    meta = fig_meta(fig)
    rel = meta['portrait']
    key = PICK_KEY.get(unit, unit)
    letter = os.path.basename(rel)[2].upper()
    if key in PICKS['portraits']:
        assert PICKS['portraits'][key] == letter, (unit, key, letter)
        kind = f'approved portrait ({key} {letter}, owner stage B pick)'
    else:
        assert PICKS['provisional'][key].startswith(letter), (unit, key, letter)
        kind = f'portrait candidate {letter} (provisional: not yet picked by the owner)'
    return card_from_portrait(os.path.join(UNITS, rel.replace('.webp', '-512.webp'))), kind, rel


def god_card(fig):
    f = GODS['figures'][fig]
    p = f['portrait']
    god = f['god']
    assert PICKS['portraits'][god] == p['pick'], (fig, p['pick'])
    return card_from_portrait(os.path.join(UNITS, p['master']), p['cardCrop']['box512']), \
        f"approved portrait ({god} {p['pick']}, owner stage B pick), card crop", p['file']
