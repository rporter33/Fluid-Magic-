# Builds stage-c/lineup.html: every stage C creature figure (15) and god figure (22) standing by size on one ground
# line, in the battle's camera on battle a's own painted ground, with a painted man for scale, the Thornwood palettes
# beside the Cinder ones, and each figure's name, size, true height and gate status. Tier S art as WebP data URIs.
# The stage C review page links or embeds it. Usage: python3 -I lineup_build.py
import base64, io, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SC = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(SC, '..'))
SB = os.path.join(UNITS, 'stage-b')
sys.path.insert(0, os.path.join(SB, 'integrate'))
import bundle_stagec as SCB  # noqa: E402

WEBP = dict(quality=88, alpha_quality=100, method=6)
WU = 0.5  # tier S


def durl(im, **kw):
    b = io.BytesIO(); im.save(b, 'WEBP', **{**WEBP, **kw})
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())


def load_atlas(prefix):
    out, i = {}, 0
    while os.path.exists(f'{prefix}.{i}.json'):
        j = json.load(open(f'{prefix}.{i}.json'))
        img = Image.open(f'{prefix}.{i}.png').convert('RGBA')
        for n, f in j['frames'].items():
            out[n] = (img, f)
        i += 1
    return out


def crop(img, f):
    r = f['frame']
    return img.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (f['anchor']['x'], f['anchor']['y'])


BYTES = [0]


def tex(img, anc, shadow=None):
    url, n = durl(img)
    BYTES[0] += n
    d = dict(url=url, w=img.width, h=img.height, ax=round(anc[0], 4), ay=round(anc[1], 4))
    if shadow:
        s, sa = shadow
        surl, n2 = durl(s, quality=60)
        BYTES[0] += n2
        d['shadow'] = dict(url=surl, w=s.width, h=s.height, ax=round(sa[0], 4), ay=round(sa[1], 4))
    return d


NAMES = {'fireSprite': 'Fire Sprite', 'hornetSwarm': 'Hornet Swarm', 'wolf': 'Wolf', 'oakheart': 'Oakheart', 'ashRider': 'Ash Rider',
         'wolfRider': 'Wolf Rider', 'salamander': 'Salamander', 'treant': 'Treant', 'giant': 'Giant'}
SIZE = {'fireSprite': 1, 'hornetSwarm': 1, 'wolf': 1, 'oakheart': 2, 'ashRider': 2, 'wolfRider': 2, 'salamander': 3, 'treant': 4, 'giant': 4}
GOD_NAMES = {'oracle': 'Oracle of the Flux', 'titan': 'Titan', 'greatWyrm': 'Great Wyrm', 'livingMonolith': 'Living Monolith',
             'ascendedHero': 'Ascended Hero', 'primordial': 'Primordial', 'ashColossus': 'Ash Colossus', 'ashPhoenix': 'Ash Phoenix',
             'pyreLord': 'Pyre Lord', 'cinderIdol': 'Cinder Idol', 'emberHierophant': 'Ember Hierophant', 'wildSpirit': 'Wild Spirit',
             'worldTree': 'World Tree', 'hornedHunter': 'Horned Hunter', 'elderWyrm': 'Elder Wyrm', 'motherOfBeasts': 'Mother of Beasts'}
NAT = {'cinderHorde': 'Cinder', 'thornwood': 'Thornwood', 'independent': 'Independent', 'common': 'any nation'}


def keypose_entries():
    out = []
    stand = {'sprite': 'wingMid', 'hornet': None, 'cavalry': 'stand', 'wolfrider': 'stand', 'beast': 'stand', 'melee': 'stand'}
    for unit in ('fireSprite', 'hornetSwarm', 'wolf', 'oakheart', 'ashRider', 'wolfRider'):
        fig, kind, layout = SCB.KEYPOSE[unit]
        meta = SCB.fig_meta(fig)
        at = load_atlas(os.path.join(SCB.CA, f'{fig}-S'))
        views = {}
        if unit == 'hornetSwarm':
            items = SCB.hornet_clusters(at, crop, 'S')
            it = next(i for i in items if i['name'] == 'hornetSwarm.back.c0.glide')
            st, failed = SCB.view_status(fig, 'back')
            for v in ('front', 'back'):  # one view (plan 5.1) serves both sides
                views[v] = dict(tex(it['img'], it['anchor']), status=st, failed=failed, heightWu=round(it['img'].height * WU, 1))
        else:
            for v in meta['views']:
                img, anc = crop(*at[f'{fig}.{v}.{stand[layout]}'])
                st, failed = SCB.view_status(fig, v)
                views[v] = dict(tex(img, anc), status=st, failed=failed, heightWu=round((img.height - 2) * WU, 1))
        e = dict(id=fig, name=NAMES[unit], sub=None, size=SIZE[unit], nation=meta['nation'], group='creature', kind=kind,
                 flier=layout in ('sprite', 'hornet'), views={v: views[v] for v in ('front', 'back') if v in views},
                 note='one figure = 12 hornets' if unit == 'hornetSwarm' else None)
        if unit == 'wolfRider':
            e['sub'] = 'front: War Wolf harness'; e['subView'] = 'front'
            out.append(e)
            out.append(dict(e, id='wolfRider-kept', sub='front: kept test', views={'front': views['frontKept']}, frontOnly=True))
            continue
        out.append(e)
    return out


def big_entries():
    out = []
    # the pilot's approved Salamander 01 as the reference beside its stage C faces (from the battle bundle's own encode)
    pd = json.load(open(os.path.join(SB, 'integrate', 'paint-data.json')))
    for fig in ['salamander-01', 'salamander-02', 'salamander-03', 'salamander-04', 'treant-01', 'treant-02', 'treant-03', 'treant-04', 'giant-01', 'giant-02']:
        unit, face = fig.split('-')
        views = {}
        if fig == 'salamander-01':
            b = pd['bigs'].get(fig)
            for v in ('front', 'back'):
                if b and v in b['views']:
                    s = b['views'][v]['S']
                    views[v] = dict(url=s['url'], w=s['w'], h=s['h'], ax=s['ax'], ay=s['ay'], shadow=s['shadow'], status='pass',
                                    failed=[], heightWu=b['views'][v]['heightWu'])
            if 'front' not in views or 'back' not in views:
                views.update(salamander01_missing(views))
            out.append(dict(id=fig, name='Salamander', sub='face 01 (pilot, kept)', size=3, nation='cinderHorde', group='creature', kind='big', views=views))
            continue
        meta = SCB.fig_meta(fig)
        at = load_atlas(os.path.join(SCB.CA, f'{unit}-S'))
        for v in ('front', 'back'):
            mv = meta['views'][v]
            a = mv['atlas']['S']
            img, anc = crop(*at[a['frame']]); sh, sa = crop(*at[a['shadow']])
            st, failed = SCB.view_status(fig, v)
            views[v] = dict(tex(img, anc, (sh, sa)), status=st, failed=failed, heightWu=mv['heightWu'])
        out.append(dict(id=fig, name=NAMES[unit], sub=f'face {face}', size=SIZE[unit], nation=meta['nation'], group='creature', kind='big', views=views))
    return out


def salamander01_missing(have):
    """The Salamander 01 views the battles do not bundle, cut as bundle.py's salamander01() cuts them."""
    sys.path.insert(0, os.path.join(SB, 'cal', 'sbx', 'tools'))  # pack and checks from the calibration sandbox, as bundle.py
    return {v: _sal01(v) for v in ('front', 'back') if v not in have}


def _sal01(v):
    from PIL import ImageFilter
    import pack as calpack  # noqa: E402
    import checks as calchecks  # noqa: E402
    sys.path.insert(0, os.path.join(UNITS, 'tools'))
    from pilot_page import true_height_wu  # noqa: E402
    import ad_page  # noqa: E402
    png = os.path.join(UNITS, 'pilot', 'ad', 'frames', f'salamander-01.{v}', f'salamander-01.{v}.idle.png')
    meta = json.load(open(png.rsplit('.', 1)[0] + '.json'))
    anc = ad_page.maquette_anchor(png, v)
    wu = true_height_wu('salamander-01', v, 'idle')
    k = wu / WU / meta['height']
    s = calpack.premul_resize(np.asarray(Image.open(png).convert('RGBA')).astype(np.float64), k)
    s = calchecks.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
    im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
    bl = int(round(5 / WU)); P = bl * 3
    a = Image.fromarray(np.asarray(im)[..., 3]).convert('L')
    big = Image.new('L', (im.width + 2 * P, im.height + 2 * P), 0); big.paste(a, (P, P))
    big = big.filter(ImageFilter.GaussianBlur(bl / 2))
    sh = Image.new('RGBA', big.size, (0, 0, 0, 0)); sh.putalpha(big.point(lambda q: int(q * 0.42)))
    ax, ay = anc[0] * k + 1, anc[1] * k + 1
    return dict(tex(im, (ax / im.width, ay / im.height), (sh, ((ax + P) / sh.width, (ay + P) / sh.height))), status='pass', failed=[], heightWu=round(wu, 2))


def god_entries():
    out = []
    G = SCB.GODS['figures']
    for fig, f in G.items():
        views = {}
        for v in ('front', 'back'):
            x = f['views'][v]
            t = x['tiers']['S']
            img = Image.open(os.path.join(SCB.GA, t['file'])).convert('RGBA')
            sh = Image.open(os.path.join(SCB.GA, t['shadow']['file'])).convert('RGBA')
            views[v] = dict(tex(img, (t['ax'], t['ay']), (sh, (t['shadow']['ax'], t['shadow']['ay']))), status=x['status'],
                            failed=list(x.get('failed') or []), heightWu=x['heightWu'])
        both = (fig.rsplit('-', 1)[0] + ('-thornwood' if f['nation'] == 'cinderHorde' else '-cinderHorde')) in G
        out.append(dict(id=fig, name=GOD_NAMES[f['god']], sub=(NAT[f['nation']] + ' palette') if both else None, size=f['sizeClass'],
                        nation=f['nation'], group='god', kind='god', chassis=f['god'], views=views,
                        note='Thornwood palette: a tint-zone edit of the Cinder figure' if both and f['nation'] == 'thornwood' else None))
    return out


def man_entry():
    at = load_atlas(os.path.join(SB, 'atlas', 'troops', 'troops-cinderHorde-S'))
    views = {}
    for v in ('front', 'back'):
        img, anc = crop(*at[f'cinderWarrior.{v}.stand'])
        views[v] = dict(tex(img, anc), status='pass', failed=[], heightWu=round((img.height - 2) * WU, 1))
    return dict(id='man', name='a man', sub='Cinder Warrior, for scale', size=1, nation='cinderHorde', group='scale', kind='troop', views=views)


def main():
    figs = keypose_entries() + big_entries() + god_entries()
    # by size, then by height (the Cinder version's), the Thornwood palette right after its Cinder twin, faces together
    base = lambda e: e.get('chassis') or e['id'].split('-')[0]
    hb = {}
    for e in figs:
        hb[base(e)] = max(hb.get(base(e), 0), max(v['heightWu'] for v in e['views'].values()))
    def key(e):  # (the list reads empty while it sorts: the twins' heights are taken before)
        return (e['size'], 0 if e['group'] == 'creature' else 1, round(hb[base(e)], 1), base(e), e['id'])
    figs.sort(key=key)
    man = man_entry()
    seq, last = [], None
    for e in figs:
        if e['size'] != last:  # a painted man opens each size
            seq.append(dict(man, id=f'man-{e["size"]}', size=e['size']))
            last = e['size']
        seq.append(e)
    tile = Image.open(os.path.join(HERE, 'ground-a.png')).convert('RGB')
    per = Image.new('RGB', (tile.width * 2, tile.height * 2))  # mirrored 2 x 2: the tile repeats without a seam
    per.paste(tile, (0, 0)); per.paste(tile.transpose(Image.FLIP_LEFT_RIGHT), (tile.width, 0))
    per.paste(tile.transpose(Image.FLIP_TOP_BOTTOM), (0, tile.height)); per.paste(tile.transpose(Image.ROTATE_180), (tile.width, tile.height))
    gurl, gn = durl(per, quality=82)
    BYTES[0] += gn
    data = dict(version='stage-c-lineup-1', wuPerPx=WU, groundRes=0.8, ground=dict(url=gurl, w=per.width, h=per.height, src='battle a (The Wyrm at Callea), plains, summer: the field middle'),
                figures=seq, counts=dict(creatures=sum(1 for e in figs if e['group'] == 'creature' and e['id'] not in ('salamander-01', 'wolfRider-kept')),
                                          gods=sum(1 for e in figs if e['group'] == 'god')))
    json.dump(data, open(os.path.join(HERE, 'lineup-data.json'), 'w'), separators=(',', ':'))
    write_page(data)


def write_page(data):
    js = json.dumps(data, separators=(',', ':')).replace('</', '<\\/')
    page = open(os.path.join(HERE, 'lineup-page.html')).read().replace('/*DATA*/', js)
    out = os.path.join(SC, 'lineup.html')
    open(out, 'w').write(page)
    print(out, len(page), 'bytes;', data['counts'], len(data['figures']), 'entries')


if __name__ == '__main__':
    if '--page' in sys.argv:  # the template only, on the last data
        write_page(json.load(open(os.path.join(HERE, 'lineup-data.json'))))
    else:
        main()
