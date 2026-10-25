# Stage D animation part: the battle mockup's assets as separate files beside the page (visual-v4/assets/), loaded by
# relative path, so the page no longer inlines every texture (the artifact host takes a 16 MB page and 15 MB a file).
#   assets/paint/   the stage B/C painted bundle (units/stage-b/integrate/paint-data.json) split into its WebP pages,
#                   big-body idle cutouts, shadows and banners; paint.json keeps the metadata (the 128 px cards stay
#                   inline as data URIs: the face-match checks hash their URLs)
#   assets/fx/      the magic pilot's effects atlas (units/stage-d/atlas/fx/fx-data.json) as fx-atlas.webp + fx.json
#   assets/actions/ the stage D action atlases (units/stage-d/atlas/actions) as WebP pages, one frames file per family
#                   and tier, and per figure a compact metadata file (anchors, points, kinds, held-back fallbacks, and
#                   the 24 x 16 mesh weights quantized to bytes)
#   assets/idle/    the stage C standing cutouts of all 32 big figures, both views, both tiers (the gallery's "standing
#                   figure" and its idle frames)
#   assets/gallery/ key-pose looks the battles do not use (the Wolf, the Oakheart) in the paint format, for the gallery
#   assets/manifest.json  every file and its size
# Usage: python3 -I build_assets.py   (run under nice: it encodes about 80 WebP pages)
import base64, io, json, os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SD = os.path.abspath(os.path.join(HERE, '..'))            # units/stage-d
UNITS = os.path.abspath(os.path.join(SD, '..'))           # units
V4 = os.path.abspath(os.path.join(UNITS, '..'))           # visual-v4
OUT = os.path.join(V4, 'assets')
INTEG = os.path.join(UNITS, 'stage-b', 'integrate')
ACT = os.path.join(SD, 'atlas', 'actions')
SC = os.path.join(UNITS, 'stage-c')
CA = os.path.join(SC, 'atlas', 'creatures')
GA = os.path.join(SC, 'atlas', 'gods')
WEBP = dict(quality=90, alpha_quality=100, method=4)
WU = {'S': 0.5, 'H': 0.25}
PAD = {'S': 1, 'H': 2}
TIERS = ('S', 'H')


def rel(path):
    return os.path.relpath(path, V4).replace(os.sep, '/')


def save_webp(im, path, **kw):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', **{**WEBP, **kw})
    return rel(path)


def save_durl(durl, path):
    """A data URI written out as its own file (no re-encode)."""
    head, b64 = durl.split(',', 1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(base64.b64decode(b64))
    return rel(path)


# ---------------------------------------------------------------- the painted bundle
def split_paint():
    d = json.load(open(os.path.join(INTEG, 'paint-data.json')))
    P = os.path.join(OUT, 'paint')
    for t in TIERS:
        for i, p in enumerate(d['tiers'][t]['pages']):
            ext = p['url'].split(';')[0].split('/')[1]
            p['url'] = save_durl(p['url'], os.path.join(P, f"{p['kind'].replace(':', '-')}-{t}.{i}.{ext}"))
    for fig, b in d['bigs'].items():
        for v, bv in b['views'].items():
            for t in TIERS:
                s = bv[t]
                s['url'] = save_durl(s['url'], os.path.join(P, f'big-{fig}.{v}.{t}.webp'))
                s['shadow']['url'] = save_durl(s['shadow']['url'], os.path.join(P, f'big-{fig}.{v}.{t}.shadow.webp'))
    for nat, b in d['banners'].items():
        for t in TIERS:
            b[t]['url'] = save_durl(b[t]['url'], os.path.join(P, f'banner-{nat}.{t}.webp'))
    s = json.dumps(d, separators=(',', ':'))
    open(os.path.join(P, 'paint.json'), 'w').write(s)
    return d


def split_fx():
    d = json.load(open(os.path.join(SD, 'atlas', 'fx', 'fx-data.json')))
    d['image'] = save_durl(d['image'], os.path.join(OUT, 'fx', 'fx-atlas.webp'))
    open(os.path.join(OUT, 'fx', 'fx.json'), 'w').write(json.dumps(d, separators=(',', ':')))


# ---------------------------------------------------------------- the action atlases
def q8(rows):
    """16 rows x 24 weights in 0..1 as base64 bytes (row-major); the page renormalises each vertex."""
    a = np.clip(np.round(np.asarray(rows, np.float64) * 255), 0, 255).astype(np.uint8).reshape(-1)
    assert a.size == 384, a.size
    return base64.b64encode(a.tobytes()).decode()


def r2(v):
    return [round(float(v[0]), 1), round(float(v[1]), 1)]


def build_actions():
    idx = json.load(open(os.path.join(ACT, 'index.json')))
    A = os.path.join(OUT, 'actions')
    out = dict(version='stage-d-actions-anim-1', wuPerPx=WU, families={}, figures={})
    for fam, F in idx['families'].items():
        out['families'][fam] = {}
        for t in TIERS:
            frames, pages = {}, []
            for i, png in enumerate(F[t]['pages']):
                j = json.load(open(os.path.join(ACT, png.replace('.png', '.json'))))
                im = Image.open(os.path.join(ACT, png)).convert('RGBA')
                pages.append(dict(url=save_webp(im, os.path.join(A, png.replace('.png', '.webp'))), w=im.width, h=im.height))
                for n, f in j['frames'].items():
                    r = f['frame']
                    frames[n] = [i, r['x'], r['y'], r['w'], r['h'], round(f['anchor']['x'], 5), round(f['anchor']['y'], 5)]
            fp = os.path.join(A, 'frames', f'{fam}-{t}.json')
            os.makedirs(os.path.dirname(fp), exist_ok=True)
            open(fp, 'w').write(json.dumps(dict(pages=pages, frames=frames), separators=(',', ':')))
            out['families'][fam][t] = dict(file=rel(fp), pages=[p['url'] for p in pages], frames=len(frames))
    for fig, fx in idx['figures'].items():
        m = json.load(open(os.path.join(ACT, 'figures', fig + '.json')))
        w = json.load(open(os.path.join(ACT, 'figures', fig + '.weights.json')))
        rec = dict(figure=fig, family=m['family'], body=m['body'], codeOnly=m.get('codeOnly') or {}, heldBack=m.get('heldBack') or {}, views={}, weights={})
        for v, acts in m['views'].items():
            rec['views'][v] = {}
            rec['weights'][v] = {}
            for a, x in acts.items():
                pts = {k: r2(p) for k, p in (x.get('points') or {}).items()}
                r = dict(heightWu=x['heightWu'], kind=x['kind'], points=pts)
                at = x.get('atlas') or {}
                if a == 'idle':
                    r['idle'] = True
                    r['white'] = {t: (at.get(t) or {}).get('white') for t in TIERS}
                else:
                    r['frame'] = {t: at[t]['frame'] for t in TIERS}
                    r['shadow'] = {t: at[t]['shadow'] for t in TIERS}
                    r['white'] = {t: at[t].get('white') for t in TIERS}
                    r['shadowScale'] = at['S'].get('shadowScale', 2)
                if x.get('groundFix'):
                    r['groundFix'] = True
                rec['views'][v][a] = r
                wv = (w['views'].get(v) or {}).get(a)
                if wv:
                    assert wv['grid'] == [24, 16], wv['grid']
                    rec['weights'][v][a] = dict(parts=wv['parts'], w={p: q8(wv['w'][p]) for p in wv['parts']})
        fp = os.path.join(A, 'figures', fig + '.json')
        open(fp, 'w').write(json.dumps(rec, separators=(',', ':')))
        out['figures'][fig] = dict(family=m['family'], body=m['body'], file=rel(fp), views={v: sorted(a) for v, a in rec['views'].items()},
                                   heldBack={v: sorted(x) for v, x in rec['heldBack'].items()}, codeOnly=sorted(rec['codeOnly']))
    open(os.path.join(A, 'index.json'), 'w').write(json.dumps(out, separators=(',', ':')))
    return out


# ---------------------------------------------------------------- the standing cutouts of every big figure
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


def salamander01_views():
    """The pilot's Salamander 01 idle, both views (bundle.py's salamander01, copied: it is nested in its main())."""
    sys.path.insert(0, os.path.join(UNITS, 'stage-b', 'cal', 'sbx', 'tools'))
    sys.path.insert(0, os.path.join(UNITS, 'tools'))
    import pack as calpack  # noqa: E402
    import checks as calchecks  # noqa: E402
    from pilot_page import true_height_wu  # noqa: E402
    import ad_page  # noqa: E402
    MOUTH = {'back': (650, 60), 'front': (40, 815)}
    sal = {}
    for v in ('back', 'front'):
        png = os.path.join(UNITS, 'pilot', 'ad', 'frames', f'salamander-01.{v}', f'salamander-01.{v}.idle.png')
        meta = json.load(open(png.rsplit('.', 1)[0] + '.json'))
        anc = ad_page.maquette_anchor(png, v)
        wu = true_height_wu('salamander-01', v, 'idle')
        sal[v] = dict(heightWu=round(wu, 2))
        for t in TIERS:
            k = wu / WU[t] / meta['height']
            rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
            s = calpack.premul_resize(rgba, k)
            pad = PAD[t]
            for _ in range(pad):
                s = calchecks.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
            im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
            bl = int(round(5 / WU[t]))
            a = Image.fromarray(np.asarray(im)[..., 3]).convert('L')
            P = bl * 3
            big = Image.new('L', (im.width + 2 * P, im.height + 2 * P), 0); big.paste(a, (P, P))
            big = big.filter(ImageFilter.GaussianBlur(bl / 2))
            sh = Image.new('RGBA', big.size, (0, 0, 0, 0)); sh.putalpha(big.point(lambda q: int(q * 0.42)))
            ax, ay = anc[0] * k + pad, anc[1] * k + pad
            sal[v][t] = dict(img=im, ax=ax / im.width, ay=ay / im.height, pad=pad, shadow=dict(img=sh, ax=(ax + P) / sh.width, ay=(ay + P) / sh.height),
                             mouth=[round((MOUTH[v][0] * k + pad - ax) * WU[t], 1), round((MOUTH[v][1] * k + pad - ay) * WU[t], 1)])
    return sal


def build_idles(actions):
    I = os.path.join(OUT, 'idle')
    gods = json.load(open(os.path.join(GA, 'gods.json')))
    out = {}
    sal01 = None
    for fig in actions['figures']:
        rec = {}
        if fig == 'salamander-01':
            sal01 = sal01 or salamander01_views()
            for v in ('back', 'front'):
                rec[v] = dict(heightWu=sal01[v]['heightWu'])
                for t in TIERS:
                    s = sal01[v][t]
                    rec[v][t] = dict(url=save_webp(s['img'], os.path.join(I, f'{fig}.{v}.{t}.webp')), w=s['img'].width, h=s['img'].height,
                                     ax=round(s['ax'], 4), ay=round(s['ay'], 4), pad=s['pad'], mouth=s['mouth'],
                                     shadow=dict(url=save_webp(s['shadow']['img'], os.path.join(I, f'{fig}.{v}.{t}.shadow.webp'), quality=60),
                                                 w=s['shadow']['img'].width, h=s['shadow']['img'].height, ax=round(s['shadow']['ax'], 4), ay=round(s['shadow']['ay'], 4)))
        elif fig in gods['figures']:
            f = gods['figures'][fig]
            for v, x in f['views'].items():
                rec[v] = dict(heightWu=x['heightWu'])
                for t, tr in x['tiers'].items():
                    im = Image.open(os.path.join(GA, tr['file'])).convert('RGBA')
                    sh = Image.open(os.path.join(GA, tr['shadow']['file'])).convert('RGBA')
                    d = dict(url=save_webp(im, os.path.join(I, f'{fig}.{v}.{t}.webp')), w=tr['w'], h=tr['h'], ax=tr['ax'], ay=tr['ay'], pad=PAD[t],
                             shadow=dict(url=save_webp(sh, os.path.join(I, f'{fig}.{v}.{t}.shadow.webp'), quality=60), w=tr['shadow']['w'], h=tr['shadow']['h'],
                                         ax=tr['shadow']['ax'], ay=tr['shadow']['ay']))
                    if 'mouth' in tr:
                        d['mouth'] = tr['mouth']
                    rec[v][t] = d
        else:
            meta = json.load(open(os.path.join(CA, 'figures', fig + '.json')))
            fam = meta['unit']
            for v, mv in meta['views'].items():
                rec[v] = dict(heightWu=mv['heightWu'])
                for t in TIERS:
                    at = load_atlas(os.path.join(CA, f'{fam}-{t}'))
                    a = mv['atlas'][t]
                    img, anc = crop(*at[a['frame']])
                    sh, sanc = crop(*at[a['shadow']])
                    d = dict(url=save_webp(img, os.path.join(I, f'{fig}.{v}.{t}.webp')), w=img.width, h=img.height, ax=round(anc[0], 4), ay=round(anc[1], 4), pad=PAD[t],
                             shadow=dict(url=save_webp(sh, os.path.join(I, f'{fig}.{v}.{t}.shadow.webp'), quality=60), w=sh.width, h=sh.height, ax=round(sanc[0], 4), ay=round(sanc[1], 4)))
                    if a.get('mouthWu'):
                        d['mouth'] = list(a['mouthWu'])
                    rec[v][t] = d
        out[fig] = rec
    open(os.path.join(I, 'idle.json'), 'w').write(json.dumps(out, separators=(',', ':')))
    return out


# ---------------------------------------------------------------- gallery extras: key-pose looks the battles lack
def build_gallery_extras(paint):
    sys.path.insert(0, INTEG)
    import bundle_stagec as SCB  # noqa: E402
    G = os.path.join(OUT, 'gallery')
    want = [u for u in SCB.KEYPOSE if u not in paint['looks']]
    looks, tiers = {}, {}
    for t in TIERS:
        items = []
        for unit in want:
            its, look = SCB.keypose_items(unit, t, load_atlas, crop)
            items += its
            looks[unit] = look
        # one shelf-packed page per tier (they are small)
        W, gut = 2048, 4
        items.sort(key=lambda it: (-it['img'].height, it['name']))
        x = y = shelf = 0; place = {}
        for it in items:
            w, h = it['img'].size
            if x + w + gut > W:
                y += shelf + gut; x = 0; shelf = 0
            place[it['name']] = (x + gut, y + gut); x += w + gut; shelf = max(shelf, h)
        H = (y + shelf + 2 * gut + 3) // 4 * 4
        page = Image.new('RGBA', (W, max(4, H)), (0, 0, 0, 0))
        frames = {}
        for it in items:
            px, py = place[it['name']]
            page.paste(it['img'], (px, py))
            frames[it['name']] = [0, px, py, it['img'].width, it['img'].height, round(it['anchor'][0], 4), round(it['anchor'][1], 4)]
        url = save_webp(page, os.path.join(G, f'creature-extra-{t}.0.webp'))
        tiers[t] = dict(pages=[dict(kind='plain:creature', url=url, w=page.width, h=page.height)], frames=frames)
    open(os.path.join(G, 'gallery-paint.json'), 'w').write(json.dumps(dict(looks=looks, tiers=tiers), separators=(',', ':')))
    return looks


def manifest():
    files = []
    for root, _, fs in os.walk(OUT):
        for f in fs:
            p = os.path.join(root, f)
            files.append(dict(path=rel(p), bytes=os.path.getsize(p)))
    files.sort(key=lambda x: x['path'])
    tot = sum(f['bytes'] for f in files)
    big = max(files, key=lambda x: x['bytes'])
    m = dict(files=files, count=len(files), bytes=tot, largest=big)
    open(os.path.join(OUT, 'manifest.json'), 'w').write(json.dumps(m, indent=0))
    return m


def main():
    only = set(sys.argv[1:])
    for sub in ('paint', 'fx', 'actions', 'idle', 'gallery'):
        if not only or sub in only:
            shutil.rmtree(os.path.join(OUT, sub), ignore_errors=True)
    paint = None
    if not only or 'paint' in only:
        paint = split_paint()
    if not only or 'fx' in only:
        split_fx()
    actions = json.load(open(os.path.join(OUT, 'actions', 'index.json'))) if (only and 'actions' not in only) else build_actions()
    if not only or 'idle' in only:
        build_idles(actions)
    if not only or 'gallery' in only:
        paint = paint or json.load(open(os.path.join(OUT, 'paint', 'paint.json')))
        build_gallery_extras(paint)
    m = manifest()
    print('assets:', m['count'], 'files,', round(m['bytes'] / 1e6, 2), 'MB; largest', m['largest'])


if __name__ == '__main__':
    main()
