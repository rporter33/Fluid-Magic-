# Stage B integration: the painted asset bundle for the battle mockup (visual-v4/battle-mockup.html).
# Collects every painted figure the three battles use, repacks it per tier into WebP pages and writes
# paint-data.json, which visual-v4/build.py inlines into the page:
#   - foot troops (stage-b/atlas/troops, both views; flagged stand-ins included and marked);
#   - commander faces (stage-b/atlas/cmdA, cmdB): each battle commander's own face, matched to its card portrait;
#   - the Wolf Rider pilot test (pilot/ad/frames/wolfRider.front, blue key), rescaled to the calibration's mounted
#     height (32.7 wu, stage-b/calibration.md 4.1), with the Thornwood cloth hue lock every Thornwood sheet gets
#     (stage-b/work/troops/sbx/tools/tr_huelock.py; stage B critique fix 2);
#   - the nations' painted banners (stage-b/atlas/troops/banners, 128 and 256 px, with their strip mesh) for the block
#     standards and the generals (critique fix 6);
#   - the Salamander face 01 cutouts (pilot/ad/frames, maquette anchors) with a pre-baked silhouette shadow;
#   - card art: the owner-kept Warden bust; for the other troop types (busts not made: API stop) a crop of the
#     painted figure's own front stand frame on the portraits' background, framed as the portraits are (head top 9%
#     down, head and shoulders: critique fix 8), marked as such.
# Troop frames go on pages per nation (the page shader varies them per figure); white flash frames, commanders and
# the Wolf Rider go on plain pages. Usage: python3 -I bundle.py
import base64, hashlib, io, json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SB = os.path.abspath(os.path.join(HERE, '..'))           # units/stage-b
UNITS = os.path.abspath(os.path.join(SB, '..'))          # units
V4 = os.path.abspath(os.path.join(UNITS, '..'))          # visual-v4
REPO = '/home/user/Fluid-Magic-'
PORTRAITS = f'{REPO}/src/assets/raster/portraits'
sys.path.insert(0, os.path.join(SB, 'cal', 'sbx', 'tools'))   # calibration sandbox: mounted height fix
import pack as calpack  # noqa: E402
import checks as calchecks  # noqa: E402
from ad_measures import tinted_keyline, SHADE  # noqa: E402  (units/tools via the sandbox path order)

PAGE_W, PAGE_HMAX, GUTTER = 2048, 2048, 6
WEBP = dict(quality=90, alpha_quality=100, method=6)
TIERS = ('S', 'H')
WU_PER_PX = {'S': 0.5, 'H': 0.25}


def hash32(s):
    """The mockup's hash32 (00-util.js): FNV-1a over UTF-16 code units with a murmur finaliser."""
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xffffffff
    h ^= h >> 16; h = (h * 0x85ebca6b) & 0xffffffff
    h ^= h >> 13; h = (h * 0xc2b2ae35) & 0xffffffff
    h ^= h >> 16
    return h


def durl_webp(im, **kw):
    b = io.BytesIO(); im.save(b, 'WEBP', **{**WEBP, **kw})
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())


def file_durl(path):
    ext = path.rsplit('.', 1)[1]
    return f'data:image/{ext};base64,' + base64.b64encode(open(path, 'rb').read()).decode()


# ---------------------------------------------------------------- what the battles use
def battle_needs():
    B = json.load(open(os.path.join(V4, 'battle-data', 'battles.json')))
    idx = {}
    for nat in [n for n in os.listdir(PORTRAITS) if os.path.isdir(f"{PORTRAITS}/{n}")]:
        for unit in os.listdir(f'{PORTRAITS}/{nat}'):
            d = f'{PORTRAITS}/{nat}/{unit}'
            if not os.path.isdir(d):
                continue
            for f in os.listdir(d):
                if f.endswith('-64.webp'):
                    idx[hashlib.sha1(open(f'{d}/{f}', 'rb').read()).hexdigest()] = (nat, unit, f[:2])
    troops, faces, groups = {}, {}, []
    for b in B:
        near = b['nearSide']
        for i, g in enumerate(b['groups']):
            nat = b['sides'][g['side']].get('def')
            view = 'back' if g['side'] == near else 'front'
            rec = dict(battle=b['key'], group=i, unit=g['unit'], side=g['side'], nation=nat, mainView=view, cmd=bool(g.get('cmd')))
            if g.get('cmd') and g.get('portrait') and g['size'] < 3:
                raw = base64.b64decode(g['portrait'].split(',', 1)[1])
                nat2, unit2, face = idx[hashlib.sha1(raw).hexdigest()]
                rec['face'] = face
                faces.setdefault((nat2, unit2, face), set()).add(view)
            elif not g.get('cmd'):
                troops.setdefault(g['unit'], set()).add(view)
            groups.append(rec)
    return troops, faces, groups


# ---------------------------------------------------------------- frames from existing atlases
def load_atlas(prefix):
    """All pages of a packed atlas: {frameName: (PIL page image, frame dict)}."""
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


# ---------------------------------------------------------------- packing
def shelf_pack(items):
    """items: list of dict(name, img). Places them on PAGE_W-wide pages; returns pages (sizes) and placements."""
    order = sorted(range(len(items)), key=lambda k: (-items[k]['img'].height, items[k]['name']))
    pages, place = [], {}
    x = y = shelf = 0
    cur = None
    for k in order:
        w, h = items[k]['img'].size
        if cur is None or x + w + GUTTER > PAGE_W:
            y += shelf + GUTTER if cur is not None else 0
            x, shelf = GUTTER, 0
            if cur is None or y + h + GUTTER > PAGE_HMAX:
                cur = dict(h=0); pages.append(cur); x, y, shelf = GUTTER, GUTTER, 0
        place[items[k]['name']] = (len(pages) - 1, x, y)
        x += w + GUTTER; shelf = max(shelf, h); cur['h'] = max(cur['h'], y + h + GUTTER)
    return pages, place


def emit_pages(items, kind, tier, report):
    pages, place = shelf_pack(items)
    imgs = [Image.new('RGBA', (PAGE_W, (p['h'] + 3) // 4 * 4), (0, 0, 0, 0)) for p in pages]
    for it in items:
        pi, x, y = place[it['name']]
        imgs[pi].paste(it['img'], (x, y))
    out = []
    for pi, im in enumerate(imgs):
        url, n = durl_webp(im)
        report.append(dict(kind=kind, tier=tier, size=im.size, webpBytes=n))
        out.append(dict(kind=kind, url=url, w=im.width, h=im.height))
        im.save(os.path.join(HERE, 'pages', f'{kind.replace(":", "-")}-{tier}.{pi}.png'))
    frames = {}
    for it in items:
        pi, x, y = place[it['name']]
        w, h = it['img'].size
        frames[it['name']] = [pi, x, y, w, h, round(it['anchor'][0], 4), round(it['anchor'][1], 4)] + (
            [it['var']] if it.get('var') else [])
    return out, frames


def main():
    os.makedirs(os.path.join(HERE, 'pages'), exist_ok=True)
    troops, faces, groups = battle_needs()
    report, looks, missing = [], {}, []
    pages = {t: [] for t in TIERS}
    frame_index = {t: {} for t in TIERS}

    def add_pages(kind, tier, items):
        out, frames = emit_pages(items, kind, tier, report)
        base = len(pages[tier])
        pages[tier] += out
        for n, v in frames.items():
            v[0] += base
            frame_index[tier][n] = v

    # ---- troops, per nation (varied pages) and their white frames (plain)
    figs = {}
    for t in TIERS:
        plain = []
        for nat in ('cinderHorde', 'thornwood'):
            at = load_atlas(os.path.join(SB, 'atlas', 'troops', f'troops-{nat}-{t}'))
            var = json.load(open(os.path.join(SB, 'atlas', 'troops', f'troops-{nat}-{t}.var.json')))['frames']
            items = []
            for unit, views in sorted(troops.items()):
                meta_p = os.path.join(SB, 'atlas', 'troops', 'figures', f'{unit}.json')
                if not os.path.exists(meta_p):
                    continue
                meta = json.load(open(meta_p))
                if meta['nation'] != nat:
                    continue
                figs[unit] = meta
                for view in ('back', 'front'):
                    for n in meta['views'][view]['atlas'][t]['frames']:
                        img, f = crop(*at[n])
                        it = dict(name=n, img=img, anchor=f)
                        if n.endswith('.white'):
                            plain.append(it)
                        else:
                            v = var.get(n) or {}
                            it['var'] = dict(body=v.get('body'), shield=v.get('shield'))
                            items.append(it)
            add_pages('troops:' + nat, t, items)
        add_pages('plain:troopwhite', t, plain)
    for unit, meta in figs.items():
        looks[unit] = dict(kind='troop', unit=unit, nation=meta['nation'], cloth=meta['cloth'],
                           layout={'flameArcher': 'archer', 'longbowHunter': 'archer', 'emberSkirmisher': 'thrower'}.get(unit, 'melee'),
                           views={v: dict(status=meta['views'][v]['status'], failed=meta['views'][v].get('failedGates') or [],
                                          frames=[n.split('.', 2)[2] for n in meta['views'][v]['atlas']['S']['frames']])
                                  for v in ('back', 'front')},
                           prefix=unit)

    # ---- commanders: the battles' own faces
    cmd_items = {t: [] for t in TIERS}
    for (nat, unit, face), need_views in sorted(faces.items()):
        fid = f'{unit}-{face}'
        src = None
        for d in ('cmdA', 'cmdB'):
            p = os.path.join(SB, 'atlas', d, 'figures', f'{fid}.json')
            if os.path.exists(p):
                src = (d, json.load(open(p)))
        portrait64 = f'{PORTRAITS}/{nat}/{unit}/{face}-64.webp'
        phash = hash32(file_durl(portrait64))
        if not src:
            missing.append(dict(look=fid, nation=nat, unit=unit, face=face, views=sorted(need_views),
                                reason='no painted figure: the cmdB run stopped on HTTP 402 before this face (stage-b report)'))
            continue
        d, meta = src
        have = sorted(meta['views'].keys())
        lk = dict(kind='commander', unit=unit, nation=nat, face=face, act=meta.get('act'), portraitHash=phash,
                  portraitFile=os.path.relpath(portrait64, REPO), views={}, prefix=fid,
                  layout='commander' if not (unit == 'ashChieftain' and face == '06') else 'commander')
        for v in have:
            vv = meta['views'][v]
            names = list(vv['frames'].keys())
            ok = vv.get('pass') if 'pass' in vv else (vv.get('checks') or {}).get('pass_')
            lk['views'][v] = dict(status='pass' if ok else 'reported', failed=[] if ok else (vv.get('checks') or {}).get('failing') or [],
                                  frames=names, sheet=vv.get('sheet'))
            for t in TIERS:
                at = load_atlas_cached(os.path.join(SB, 'atlas', d, unit), t)
                for n in names + ['stand.white', 'recoil.white']:
                    key = f'{fid}.{v}.{n}'
                    if key not in at:
                        continue
                    img, f = crop(*at[key])
                    cmd_items[t].append(dict(name=key, img=img, anchor=f))
        for v in ('back', 'front'):
            if v not in have:
                missing.append(dict(look=fid, nation=nat, unit=unit, face=face, views=[v], reason='view not made (cmdB stopped on HTTP 402)'))
        looks[fid] = lk

    # ---- the Wolf Rider pilot test (blue key), front view, at the calibration's mounted height
    wr_src = os.path.join(UNITS, 'pilot', 'ad', 'frames', 'wolfRider.front')
    wr_dir = os.path.join(SB, 'fix', 'work', 'wolfRider.front.locked')
    sys.path.insert(0, os.path.join(SB, 'work', 'troops', 'sbx', 'tools'))
    import tr_huelock  # noqa: E402
    wr_lock = tr_huelock.run_dir('thornwood', wr_src, wr_dir)  # the only Thornwood look that was packed without it
    for t in TIERS:
        calpack.keyline = tinted_keyline(SHADE['thornwood']) if t == 'S' else calchecks.keyline
        fr, info = calpack.frames_of(wr_dir, 'wolfRider', 'front', t)
        for name, s, anc in fr:
            im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
            cmd_items[t].append(dict(name=name, img=im, anchor=(anc[0] / im.width, anc[1] / im.height)))
    calpack.keyline = calchecks.keyline
    looks['wolfRider'] = dict(kind='mounted', unit='wolfRider', nation='thornwood', layout='wolfrider', prefix='wolfRider',
                              views={'front': dict(status='pilot test (owner: keep)', failed=[],
                                                   frames=[n.split('.', 2)[2] for n, _, _ in calpack.frames_of(wr_dir, 'wolfRider', 'front', 'S')[0] if not n.endswith('.white')])},
                              note='pilot test only: no back view; mounted height 32.7 wu (calibration 4.1); Thornwood hue lock',
                              hueLock=dict(src=os.path.relpath(wr_src, UNITS), lockedShareMax=max(wr_lock.values()) if wr_lock else 0))
    for t in TIERS:
        add_pages('plain:cmd', t, cmd_items[t])

    # ---- the Salamander, face 01: cutouts with the maquette anchor, keyline, silhouette shadow
    sys.path.insert(0, os.path.join(UNITS, 'tools'))
    from pilot_page import true_height_wu  # noqa: E402
    import ad_page  # noqa: E402
    sal = {}
    MOUTH = {'back': (650, 60), 'front': (40, 815)}  # snout tip in the cutout's own px (looked up on 2x crops)
    for v in ('back', 'front'):
        png = os.path.join(UNITS, 'pilot', 'ad', 'frames', f'salamander-01.{v}', f'salamander-01.{v}.idle.png')
        meta = json.load(open(png.rsplit('.', 1)[0] + '.json'))
        anc = ad_page.maquette_anchor(png, v)
        wu = true_height_wu('salamander-01', v, 'idle')
        sal[v] = dict(heightWu=round(wu, 2))
        for t in TIERS:
            k = wu / WU_PER_PX[t] / meta['height']
            rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
            s = calpack.premul_resize(rgba, k)
            pad = 1 if t == 'S' else 2
            for _ in range(pad):
                s = calchecks.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
            im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
            # the silhouette shadow (review change 13): black, alpha 0.42, blurred 5 wu, on a padded canvas
            bl = int(round(5 / WU_PER_PX[t]))
            a = Image.fromarray(np.asarray(im)[..., 3]).convert('L')
            P = bl * 3
            big = Image.new('L', (im.width + 2 * P, im.height + 2 * P), 0); big.paste(a, (P, P))
            big = big.filter(ImageFilter.GaussianBlur(bl / 2))
            sh = Image.new('RGBA', big.size, (0, 0, 0, 0)); sh.putalpha(big.point(lambda q: int(q * 0.42)))
            url, n1 = durl_webp(im)
            surl, n2 = durl_webp(sh, quality=60)
            report.append(dict(kind='salamander-' + v, tier=t, size=im.size, webpBytes=n1 + n2))
            ax, ay = anc[0] * k + pad, anc[1] * k + pad
            sal[v][t] = dict(url=url, w=im.width, h=im.height, ax=round(ax / im.width, 4), ay=round(ay / im.height, 4),
                             shadow=dict(url=surl, w=sh.width, h=sh.height, ax=round((ax + P) / sh.width, 4), ay=round((ay + P) / sh.height, 4)),
                             mouth=[round((MOUTH[v][0] * k + pad - ax) * WU_PER_PX[t], 1), round((MOUTH[v][1] * k + pad - ay) * WU_PER_PX[t], 1)])
    sal_portrait = file_durl(f'{PORTRAITS}/cinderHorde/salamander/01-64.webp')

    # ---- card art: the kept Warden bust; a figure crop for the rest (busts not made: the API stopped)
    cards = {}
    bg = np.array([28, 26, 23], np.float64)

    def card_from_frame(unit):
        """Head and shoulders of the painted front stand frame (tier H, as on the field), mirrored to face right like
        the portraits, on the portraits' dark warm background. An interim card until the troop's bust is painted."""
        img, f = crop(*load_atlas_cached(os.path.join(SB, 'atlas', 'troops', f'troops-{figs[unit]["nation"]}'), 'H')[f'{unit}.front.stand'])
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
        a = np.asarray(img)[..., 3] > 60
        # the head top: the first row at least 18% as wide as the widest row (a spear or bow tip above the head is not
        # the head); the card is framed as the portraits are: head top 9% down, cut at the chest (critique fix 8)
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
        warm = bg[None, None, :] * (0.78 + 0.22 * glow[..., None]) + np.array([10, 7, 4]) * glow[..., None]
        canvas = Image.fromarray(np.clip(warm, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
        canvas.alpha_composite(cut)
        return canvas.convert('RGB')

    for unit in sorted(figs):
        if unit == 'warden':
            im = Image.open(os.path.join(SB, 'portraits', 'thornwood', 'warden', 'bust.webp')).convert('RGB')
            im = im.resize((128, 128), Image.LANCZOS).crop((0, 2, 128, 122))
            kind = 'painted bust (owner kept)'
        else:
            im = card_from_frame(unit)
            kind = 'figure crop, portrait framing (interim: bust not made, API stop)'
        url, n = durl_webp(im, quality=88)
        cards[unit] = dict(url=url, kind=kind)
        im.save(os.path.join(HERE, 'pages', f'card-{unit}.png'))
    wr_img = None
    # ---- the nations' painted banners: tier S 128 px, tier H 256 px, pole edge left, a strip mesh (critique fix 6)
    banners = {}
    for nat in ('cinderHorde', 'thornwood', 'independent'):
        bj = json.load(open(os.path.join(SB, 'atlas', 'troops', 'banners', f'banner-{nat}.json')))
        bb = dict(cloth=bj['cloth'], symbol=bj['symbol'], poleEdge=bj['poleEdge'], mesh=dict(cols=bj['mesh']['cols'], rows=bj['mesh']['rows'], pinnedColumn=bj['mesh']['pinnedColumn']))
        for t, px in (('S', '128'), ('H', '256')):
            im = Image.open(os.path.join(SB, 'atlas', 'troops', 'banners', bj['files'][px])).convert('RGBA')
            url, n = durl_webp(im, quality=90)
            report.append(dict(kind='banner-' + nat, tier=t, size=im.size, webpBytes=n))
            bb[t] = dict(url=url, w=im.width, h=im.height)
        banners[nat] = bb
    lim = json.load(open(os.path.join(SB, 'atlas', 'troops', 'variation', 'variation.json')))

    data = dict(
        version='stage-b-fix-1',
        wuPerPx=WU_PER_PX,
        tiers={t: dict(pages=[dict(kind=p['kind'], url=p['url'], w=p['w'], h=p['h']) for p in pages[t]], frames=frame_index[t]) for t in TIERS},
        looks=looks, missing=missing, groups=groups,
        salamander={'01': sal, 'portraitHash': hash32(sal_portrait)},
        cards=cards, limits=lim, banners=banners,
        cloth={'cinderHorde': '#C4532C', 'thornwood': '#1F6A50'},
    )
    out = os.path.join(HERE, 'paint-data.json')
    s = json.dumps(data, separators=(',', ':'))
    open(out, 'w').write(s)
    tot = sum(r['webpBytes'] for r in report)
    json.dump(dict(report=report, webpBytes=tot, jsonBytes=len(s), looks=sorted(looks), missing=missing), open(os.path.join(HERE, 'bundle-report.json'), 'w'), indent=1)
    print(out, len(s), 'bytes json;', tot, 'bytes webp;', len(looks), 'looks;', len(missing), 'missing')
    for m in missing:
        print('  missing', m['look'], m['views'], m['reason'][:60])


_ATLAS = {}


def load_atlas_cached(prefix, tier):
    key = f'{prefix}.{tier}' if not prefix.endswith(('-S', '-H')) else prefix
    if prefix.rsplit('/', 1)[1].startswith('troops-'):
        key = f'{prefix}-{tier}'
    if key not in _ATLAS:
        _ATLAS[key] = load_atlas(key)
    return _ATLAS[key]


if __name__ == '__main__':
    main()
