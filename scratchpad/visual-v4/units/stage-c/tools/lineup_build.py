# Builds stage-c/lineup.html: every stage C creature figure (15) and god figure (22) standing by size on one ground
# line, in the battle's camera on battle a's own painted ground, with a painted man for scale, the Thornwood palettes
# beside the Cinder ones, and each figure's name, size, true height and gate status. WebP data URIs.
# Stage C fix 10 (art director's critique): tier H art beside tier S, loaded on first use and swapped in above 2 device
# px per wu as the battle does (PAINT_TIER_UP); each figure's approved portrait (its card, 256 px) in its legend row and
# beside the focused figure; a painted commander (Ash Chieftain 06, 32 wu) beside each man; riders labelled by their body
# height (standPx x 0.5 wu, hood to hooves), not the lance tip. Budget 12 MB.
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
WUH = 0.25  # tier H
REPO = '/home/user/Fluid-Magic-'
PAD = {'S': 1, 'H': 2}


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
BYTES_H = [0]
BYTES_P = [0]


def tex(img, anc, shadow=None, tier='S'):
    url, n = durl(img, **({'quality': 84} if tier == 'H' else {}))
    (BYTES_H if tier == 'H' else BYTES)[0] += n
    d = dict(url=url, w=img.width, h=img.height, ax=round(anc[0], 4), ay=round(anc[1], 4))
    if shadow:
        s, sa = shadow
        surl, n2 = durl(s, quality=60)
        (BYTES_H if tier == 'H' else BYTES)[0] += n2
        d['shadow'] = dict(url=surl, w=s.width, h=s.height, ax=round(sa[0], 4), ay=round(sa[1], 4))
    return d


def portrait(master, box=None):
    """The approved portrait as its card, 256 x 240 (the battle card's framing at 2x the battle card's pixels), for the
    legend row and the focused view."""
    im = Image.open(master).convert('RGB')
    if box:
        k = im.width / 512
        im = im.crop(tuple(round(c * k) for c in box))
    im = im.resize((256, 256), Image.LANCZOS).crop((0, 4, 256, 244))
    url, n = durl(im, quality=86)
    BYTES_P[0] += n
    return dict(url=url, w=256, h=240, src=os.path.relpath(master, UNITS) if master.startswith(UNITS) else os.path.relpath(master, REPO))


def master_of(rel):
    """A figure's portrait path (units-relative or absolute) to its 512 px master."""
    p = rel if os.path.isabs(rel) else os.path.join(UNITS, rel)
    m = p.replace('.webp', '-512.webp')
    return m if os.path.exists(m) else p


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
        at = {t: load_atlas(os.path.join(SCB.CA, f'{fig}-{t}')) for t in ('S', 'H')}
        views = {}
        if unit == 'hornetSwarm':
            st, failed = SCB.view_status(fig, 'back')
            its = {t: next(i for i in SCB.hornet_clusters(at[t], crop, t) if i['name'] == 'hornetSwarm.back.c0.glide') for t in ('S', 'H')}
            for v in ('front', 'back'):  # one view (plan 5.1) serves both sides
                views[v] = dict(tex(its['S']['img'], its['S']['anchor']), H=tex(its['H']['img'], its['H']['anchor'], tier='H'),
                                status=st, failed=failed, heightWu=round(its['S']['img'].height * WU, 1))
        else:
            for v in meta['views']:
                img, anc = crop(*at['S'][f'{fig}.{v}.{stand[layout]}'])
                imh, anch = crop(*at['H'][f'{fig}.{v}.{stand[layout]}'])
                st, failed = SCB.view_status(fig, v)
                # riders by their body height, hood to hooves (the packer's standPx at 0.5 wu a px), not the lance tip
                hw = meta['views'][v]['atlas']['S']['standPx'] * WU if layout in ('cavalry', 'wolfrider') else round((img.height - 2) * WU, 1)
                views[v] = dict(tex(img, anc), H=tex(imh, anch, tier='H'), status=st, failed=failed, heightWu=hw,
                                heightNote='body, hood to hooves (the lance above it not counted)' if layout in ('cavalry', 'wolfrider') else None)
        e = dict(id=fig, name=NAMES[unit], sub=None, size=SIZE[unit], nation=meta['nation'], group='creature', kind=kind,
                 flier=layout in ('sprite', 'hornet'), views={v: views[v] for v in ('front', 'back') if v in views},
                 note='one figure = 12 hornets; portrait B is provisional (owner question 1)' if unit == 'hornetSwarm' else None,
                 portrait=portrait(master_of(meta['portrait'])))
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
            # the pilot's cutouts, cut at both tiers as bundle.py's salamander01() cuts them
            sys.path.insert(0, os.path.join(SB, 'cal', 'sbx', 'tools'))
            for v in ('front', 'back'):
                views[v] = dict(_sal01(v, 'S'), H=_sal01(v, 'H'), status='pass', failed=[])
            out.append(dict(id=fig, name='Salamander', sub='face 01 (pilot, kept)', size=3, nation='cinderHorde', group='creature', kind='big', views=views,
                            portrait=portrait(f'{REPO}/art-source/portraits/cinderHorde/salamander/01.webp')))
            continue
        meta = SCB.fig_meta(fig)
        at = {t: load_atlas(os.path.join(SCB.CA, f'{unit}-{t}')) for t in ('S', 'H')}
        for v in ('front', 'back'):
            mv = meta['views'][v]
            tx = {}
            for t in ('S', 'H'):
                a = mv['atlas'][t]
                img, anc = crop(*at[t][a['frame']]); sh, sa = crop(*at[t][a['shadow']])
                tx[t] = tex(img, anc, (sh, sa), tier=t)
            st, failed = SCB.view_status(fig, v)
            views[v] = dict(tx['S'], H=tx['H'], status=st, failed=failed, heightWu=mv['heightWu'])
        out.append(dict(id=fig, name=NAMES[unit], sub=f'face {face}', size=SIZE[unit], nation=meta['nation'], group='creature', kind='big', views=views,
                        portrait=portrait(master_of(meta['portrait']))))
    return out


def _sal01(v, tier='S'):
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
    q = WU if tier == 'S' else WUH
    k = wu / q / meta['height']
    s = calpack.premul_resize(np.asarray(Image.open(png).convert('RGBA')).astype(np.float64), k)
    for _ in range(PAD[tier]):
        s = calchecks.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
    im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
    bl = int(round(5 / q)); P = bl * 3
    a = Image.fromarray(np.asarray(im)[..., 3]).convert('L')
    big = Image.new('L', (im.width + 2 * P, im.height + 2 * P), 0); big.paste(a, (P, P))
    big = big.filter(ImageFilter.GaussianBlur(bl / 2))
    sh = Image.new('RGBA', big.size, (0, 0, 0, 0)); sh.putalpha(big.point(lambda z: int(z * 0.42)))
    ax, ay = anc[0] * k + PAD[tier], anc[1] * k + PAD[tier]
    d = tex(im, (ax / im.width, ay / im.height), (sh, ((ax + P) / sh.width, (ay + P) / sh.height)), tier=tier)
    if tier == 'S':
        d['heightWu'] = round(wu, 2)
    return d


def god_entries():
    out = []
    G = SCB.GODS['figures']
    for fig, f in G.items():
        views = {}
        for v in ('front', 'back'):
            x = f['views'][v]
            tx = {}
            for tr in ('S', 'H'):
                t = x['tiers'][tr]
                img = Image.open(os.path.join(SCB.GA, t['file'])).convert('RGBA')
                sh = Image.open(os.path.join(SCB.GA, t['shadow']['file'])).convert('RGBA')
                tx[tr] = tex(img, (t['ax'], t['ay']), (sh, (t['shadow']['ax'], t['shadow']['ay'])), tier=tr)
            views[v] = dict(tx['S'], H=tx['H'], status=x['status'], failed=list(x.get('failed') or []), heightWu=x['heightWu'],
                            heightNote=f"{x.get('heightWuBody')} wu x the commander factor {x.get('commanderFactor')}" if x.get('commanderFactor', 1) != 1 else None)
        both = (fig.rsplit('-', 1)[0] + ('-thornwood' if f['nation'] == 'cinderHorde' else '-cinderHorde')) in G
        p = f['portrait']
        out.append(dict(id=fig, name=GOD_NAMES[f['god']], sub=(NAT[f['nation']] + ' palette') if both else None, size=f['sizeClass'],
                        nation=f['nation'], group='god', kind='god', chassis=f['god'], views=views,
                        portrait=portrait(os.path.join(UNITS, p['master']), (p.get('cardCrop') or {}).get('box512')),
                        note='Thornwood palette: a tint-zone edit of the Cinder figure' if both and f['nation'] == 'thornwood' else None))
    return out


def man_entry():
    at = {t: load_atlas(os.path.join(SB, 'atlas', 'troops', f'troops-cinderHorde-{t}')) for t in ('S', 'H')}
    views = {}
    for v in ('front', 'back'):
        img, anc = crop(*at['S'][f'cinderWarrior.{v}.stand'])
        imh, anch = crop(*at['H'][f'cinderWarrior.{v}.stand'])
        views[v] = dict(tex(img, anc), H=tex(imh, anch, tier='H'), status='pass', failed=[], heightWu=28)
    return dict(id='man', name='a man', sub='Cinder Warrior, for scale', size=1, nation='cinderHorde', group='scale', kind='troop', views=views)


def commander_entry():
    """Fix 10: a painted commander for scale, Ash Chieftain 06 (the pilot's kept commander), 32 wu (design 3.2: 1.15 x a man)."""
    at = {t: load_atlas(os.path.join(SB, 'atlas', 'cmdA', f'ashChieftain.{t}')) for t in ('S', 'H')}
    meta = json.load(open(os.path.join(SB, 'atlas', 'cmdA', 'figures', 'ashChieftain-06.json')))
    views = {}
    for v in ('front', 'back'):
        img, anc = crop(*at['S'][f'ashChieftain-06.{v}.stand'])
        imh, anch = crop(*at['H'][f'ashChieftain-06.{v}.stand'])
        views[v] = dict(tex(img, anc), H=tex(imh, anch, tier='H'), status='pass', failed=[], heightWu=meta['heightPx']['S'] * WU)
    return dict(id='cmd', name='a commander', sub='Ash Chieftain 06, 32 wu, for scale', size=1, nation='cinderHorde', group='scale', kind='commander',
                views=views, portrait=portrait(f'{REPO}/art-source/portraits/cinderHorde/ashChieftain/06.webp'))


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
    man, cmd = man_entry(), commander_entry()
    seq, last = [], None
    for e in figs:
        if e['size'] != last:  # a painted man and a painted commander open each size
            seq.append(dict(man, id=f'man-{e["size"]}', size=e['size']))
            seq.append(dict(cmd, id=f'cmd-{e["size"]}', size=e['size']))
            last = e['size']
        seq.append(e)
    tile = Image.open(os.path.join(HERE, 'ground-a.png')).convert('RGB')
    per = Image.new('RGB', (tile.width * 2, tile.height * 2))  # mirrored 2 x 2: the tile repeats without a seam
    per.paste(tile, (0, 0)); per.paste(tile.transpose(Image.FLIP_LEFT_RIGHT), (tile.width, 0))
    per.paste(tile.transpose(Image.FLIP_TOP_BOTTOM), (0, tile.height)); per.paste(tile.transpose(Image.ROTATE_180), (tile.width, tile.height))
    gurl, gn = durl(per, quality=82)
    BYTES[0] += gn
    data = dict(version='stage-c-lineup-fix-1', wuPerPx=WU, wuPerPxH=WUH, tierUp=2.0, tierDown=53 / 28, groundRes=0.8,
                commanderFactor=SCB.GODS.get('commanderFactor'), bytes=dict(tierS=BYTES[0], tierH=BYTES_H[0], portraits=BYTES_P[0]), ground=dict(url=gurl, w=per.width, h=per.height, src='battle a (The Wyrm at Callea), plains, summer: the field middle'),
                figures=seq, counts=dict(creatures=sum(1 for e in figs if e['group'] == 'creature' and e['id'] not in ('salamander-01', 'wolfRider-kept')),
                                          gods=sum(1 for e in figs if e['group'] == 'god')))
    json.dump(data, open(os.path.join(HERE, 'lineup-data.json'), 'w'), separators=(',', ':'))
    write_page(data)


def write_page(data):
    js = json.dumps(data, separators=(',', ':')).replace('</', '<\\/')
    page = open(os.path.join(HERE, 'lineup-page.html')).read().replace('/*DATA*/', js)
    out = os.path.join(SC, 'lineup.html')
    open(out, 'w').write(page)
    print(out, len(page), 'bytes;', data['counts'], len(data['figures']), 'entries;', data.get('bytes'))


if __name__ == '__main__':
    if '--page' in sys.argv:  # the template only, on the last data
        write_page(json.load(open(os.path.join(HERE, 'lineup-data.json'))))
    else:
        main()
