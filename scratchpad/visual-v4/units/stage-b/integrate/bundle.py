# Stage B integration: the painted asset bundle for the battle mockup (visual-v4/battle-mockup.html).
# Collects every painted figure the three battles use, repacks it per tier into WebP pages and writes
# paint-data.json, which visual-v4/build.py inlines into the page:
#   - foot troops (stage-b/atlas/troops, both views; flagged stand-ins included and marked);
#   - commander faces (stage-b/atlas/cmdA, cmdB): each battle commander's own face, matched to its card portrait;
#   - (stage C) the creatures and mounted troops' key-pose sheets and the big bodies' idle cutouts (bundle_stagec.py);
#     the stage B Wolf Rider pilot test and its fix2 back view are replaced by the stage C Wolf Rider;
#   - the nations' painted banners (stage-b/atlas/troops/banners, 128 and 256 px, with their strip mesh) for the block
#     standards and the generals (critique fix 6);
#   - the Salamander face 01 cutouts (pilot/ad/frames, maquette anchors) with a pre-baked silhouette shadow, now one of
#     the big bodies in `bigs` beside the stage C ones;
#   - card art: each troop type's painted card bust (stage-b/portraits/<nation>/<unit>/bust.webp: the owner-kept
#     Warden bust and the troops2 busts R20-R28, which passed their gates); a troop without a passing bust falls back
#     to a crop of its painted figure's own front stand frame on the portraits' background, framed as the portraits
#     are (head top 9% down, head and shoulders: critique fix 8), marked as such.
# Stage C (owner review 2, 2026-10-24): the creatures, mounts and gods the battles use come from the stage C atlases
# through bundle_stagec.py (key-pose figures on 'plain:creature' pages, big bodies as their own cutouts in `bigs`, the
# approved portraits as their cards); the stage B Wolf Rider pilot frames and the Salamander-only block are replaced.
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
# Frames that read wrong by eye in the battles (resume pass, 2026-10-23): the frame is not packed and its pose shows
# the named sibling frame instead. Sapling Druid 03 back cheer: the staff is bent into an S and cut flat by the cell's
# top edge (cmdB sheet sd03.back, a reported view); his raised-staff rally frame (actA) stands in.
FRAME_ALIAS = {'saplingDruid-03.back.cheer': 'saplingDruid-03.back.actA'}
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
    troops, faces, groups, bigs = {}, {}, [], {}
    for b in B:
        near = b['nearSide']
        for i, g in enumerate(b['groups']):
            nat = b['sides'][g['side']].get('def')
            view = 'back' if g['side'] == near else 'front'
            rec = dict(battle=b['key'], group=i, unit=g['unit'], side=g['side'], nation=nat, mainView=view, cmd=bool(g.get('cmd')))
            if g['size'] >= 3:
                # a big body: a summoned commander's face (its card portrait), or a god by chassis and nation
                if g.get('portrait'):
                    raw = base64.b64decode(g['portrait'].split(',', 1)[1])
                    nat2, unit2, face = idx[hashlib.sha1(raw).hexdigest()]
                    rec['face'] = face
                    fig = f'{unit2}-{face}'
                else:
                    fig = f"{g['unit']}-{nat}"
                rec['big'] = fig
                bigs.setdefault(fig, set()).add(view)
            elif g.get('cmd') and g.get('portrait'):
                raw = base64.b64decode(g['portrait'].split(',', 1)[1])
                nat2, unit2, face = idx[hashlib.sha1(raw).hexdigest()]
                rec['face'] = face
                faces.setdefault((nat2, unit2, face), set()).add(view)
            elif not g.get('cmd'):
                troops.setdefault(g['unit'], set()).add(view)
            groups.append(rec)
    return troops, faces, groups, bigs


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
    troops, faces, groups, big_needs = battle_needs()
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
                                reason='no painted figure for this face in atlas/cmdA or atlas/cmdB'))
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
            lk['views'][v] = dict(status='pass' if ok else 'reported',
                                  failed=[] if ok else vv.get('failedGates') or (vv.get('checks') or {}).get('failing') or [],
                                  frames=names, sheet=vv.get('sheet'), ownKit=bool(vv.get('ownKit')))
            for t in TIERS:
                at = load_atlas_cached(os.path.join(SB, 'atlas', d, unit), t)
                for n in names + ['stand.white', 'recoil.white']:
                    key = f'{fid}.{v}.{n}'
                    if key not in at or key in FRAME_ALIAS:
                        continue
                    img, f = crop(*at[key])
                    cmd_items[t].append(dict(name=key, img=img, anchor=f))
        for v in ('back', 'front'):
            if v not in have:
                missing.append(dict(look=fid, nation=nat, unit=unit, face=face, views=[v], reason=f'{v} view not made for this face'))
        looks[fid] = lk

    # ---- stage C key-pose creatures and mounted troops (both views; the Wolf Rider's three), on their own pages
    sys.path.insert(0, HERE)
    import bundle_stagec as SCB  # noqa: E402
    crea_items = {t: [] for t in TIERS}
    for unit in sorted(u for u in troops if u in SCB.KEYPOSE):
        for t in TIERS:
            items, look = SCB.keypose_items(unit, t, load_atlas, crop)
            crea_items[t] += items
        looks[unit] = look
    for t in TIERS:
        add_pages('plain:creature', t, crea_items[t])
    for t in TIERS:
        add_pages('plain:cmd', t, cmd_items[t])
        for bad, good in FRAME_ALIAS.items():
            if good in frame_index[t]:
                frame_index[t][bad] = list(frame_index[t][good])
    for bad, good in FRAME_ALIAS.items():
        fid, v, pose = bad.split('.', 2)
        if fid in looks and v in looks[fid]['views']:
            looks[fid]['views'][v].setdefault('aliased', {})[pose] = good.split('.', 2)[2]

    # ---- the Salamander, face 01: cutouts with the maquette anchor, keyline, silhouette shadow
    sys.path.insert(0, os.path.join(UNITS, 'tools'))
    from pilot_page import true_height_wu  # noqa: E402
    import ad_page  # noqa: E402
    def salamander01(views):
        sal = {}
        MOUTH = {'back': (650, 60), 'front': (40, 815)}  # snout tip in the cutout's own px (looked up on 2x crops)
        for v in views:
            png = os.path.join(UNITS, 'pilot', 'ad', 'frames', f'salamander-01.{v}', f'salamander-01.{v}.idle.png')
            meta = json.load(open(png.rsplit('.', 1)[0] + '.json'))
            anc = ad_page.maquette_anchor(png, v)
            wu = true_height_wu('salamander-01', v, 'idle')
            sal[v] = dict(heightWu=round(wu, 2), status='pass', failed=[], job='pilot (owner: keep)')
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
                sal[v][t] = dict(url=url, pad=pad, w=im.width, h=im.height, ax=round(ax / im.width, 4), ay=round(ay / im.height, 4),
                                 shadow=dict(url=surl, w=sh.width, h=sh.height, ax=round((ax + P) / sh.width, 4), ay=round((ay + P) / sh.height, 4)),
                                 mouth=[round((MOUTH[v][0] * k + pad - ax) * WU_PER_PX[t], 1), round((MOUTH[v][1] * k + pad - ay) * WU_PER_PX[t], 1)])
        return sal

    bigs = {}
    for fig, views in sorted(big_needs.items()):
        views = sorted(views)
        if fig == 'salamander-01':  # the pilot's approved cutouts (maquette anchors, true height from the pilot guides)
            bigs[fig] = dict(unit='salamander', face='01', nation='cinderHorde', kind='creature', stage='A (pilot, owner: keep)', views=salamander01(views))
        elif fig in SCB.GODS['figures']:
            bigs[fig] = SCB.big_from_god(fig, views, durl_webp, report)
        else:
            bigs[fig] = SCB.big_from_creature(fig, views, durl_webp, load_atlas, crop, report)
        b = bigs[fig]
        if b['kind'] == 'creature':  # matched to the battle's card portrait (the repo's 64 px leader portrait)
            nat_dir = {'salamander': 'cinderHorde', 'treant': 'thornwood'}.get(b['unit'], b['nation'])
            b['portraitHash'] = hash32(file_durl(f"{PORTRAITS}/{nat_dir}/{b['unit']}/{b['face']}-64.webp"))

    # ---- card art: the painted busts (the kept Warden bust, troops2 R20-R28); a figure crop only where none passed
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

    # fix2 (critique-resume fix 8): the Wolf Rider's painted bust too; it keeps the procedural card until a bust passes
    for unit in sorted(figs):
        bdir = os.path.join(SB, 'portraits', figs[unit]['nation'] if unit in figs else 'thornwood', unit)
        bj = json.load(open(os.path.join(bdir, 'bust.json'))) if os.path.exists(os.path.join(bdir, 'bust.json')) else None
        kept = bool(bj and bj.get('approved'))
        if bj and os.path.exists(os.path.join(bdir, bj['files']['game'])) and (kept or (bj.get('checks') or {}).get('pass')):
            # the bust is square, framed as the leader portraits; the card is 128 x 120 (64 x 60 css px at 2x)
            im = Image.open(os.path.join(bdir, bj['files']['game'])).convert('RGB')
            im = im.resize((128, 128), Image.LANCZOS).crop((0, 2, 128, 122))
            kind = 'painted bust (owner kept)' if kept else 'painted bust (troops2; passed its gates, not yet approved)'
            src = os.path.relpath(os.path.join(bdir, bj['files']['game']), UNITS)
        else:
            if unit not in figs:
                continue
            im = card_from_frame(unit)
            kind = 'figure crop, portrait framing (interim: no passing bust)'
            src = None
        url, n = durl_webp(im, quality=88)
        cards[unit] = dict(url=url, kind=kind, src=src)
        report.append(dict(kind='card-' + unit, tier='-', size=im.size, webpBytes=n))
        im.save(os.path.join(HERE, 'pages', f'card-{unit}.png'))
    # stage C: each creature's, mount's and god's approved portrait (picks.json), gods with their card crop
    for unit in sorted(u for u in looks if u in SCB.KEYPOSE):
        im, kind, src = SCB.creature_card(unit)
        url, n = durl_webp(im, quality=88)
        cards[unit] = dict(url=url, kind=kind, src=src)
        report.append(dict(kind='card-' + unit, tier='-', size=im.size, webpBytes=n))
        im.save(os.path.join(HERE, 'pages', f'card-{unit}.png'))
    for fig, b in bigs.items():
        if b['kind'] == 'creature':
            # stage C fix 12: the Salamander's and the Treant's card is the 128 px crop of their approved leader portrait
            # (art-source, 512 px), framed as the stage B cards, not the battle record's soft 64 px card; the face match
            # still reads the battle record's portrait (portraitHash), the card check this card (cardHash)
            nat_dir = {'salamander': 'cinderHorde', 'treant': 'thornwood'}.get(b['unit'], b['nation'])
            master = f"{REPO}/art-source/portraits/{nat_dir}/{b['unit']}/{b['face']}.webp"
            if os.path.exists(master):
                im = SCB.card_from_portrait(master)
                url, n = durl_webp(im, quality=88)
                cards[fig] = dict(url=url, kind=f"approved leader portrait ({b['unit']} {b['face']}), 128 px card crop", src=os.path.relpath(master, REPO))
                b['card'] = fig; b['cardHash'] = hash32(url)
                report.append(dict(kind='card-' + fig, tier='-', size=im.size, webpBytes=n))
                im.save(os.path.join(HERE, 'pages', f'card-{fig}.png'))
            continue
        if b['kind'] != 'god':
            continue
        im, kind, src = SCB.god_card(fig)
        url, n = durl_webp(im, quality=88)
        cards[fig] = dict(url=url, kind=kind, src=src)
        b['portraitHash'] = hash32(url)  # the hover card a god shows is this crop of its approved portrait
        b['cardHash'] = b['portraitHash']
        b['card'] = fig
        report.append(dict(kind='card-' + fig, tier='-', size=im.size, webpBytes=n))
        im.save(os.path.join(HERE, 'pages', f'card-{fig}.png'))
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
        version='stage-c-fix-1',
        wuPerPx=WU_PER_PX,
        tiers={t: dict(pages=[dict(kind=p['kind'], url=p['url'], w=p['w'], h=p['h']) for p in pages[t]], frames=frame_index[t]) for t in TIERS},
        looks=looks, missing=missing, groups=groups,
        bigs=bigs,
        cards=cards, limits=lim, banners=banners,
        cloth={'cinderHorde': '#C4532C', 'thornwood': '#1F6A50'},
    )
    out = os.path.join(HERE, 'paint-data.json')
    s = json.dumps(data, separators=(',', ':'))
    open(out, 'w').write(s)
    tot = sum(r['webpBytes'] for r in report)
    flagged = [dict(look=k, view=v, status=x['status'], failed=x['failed']) for k, L in sorted(looks.items()) if L.get('stage') == 'C'
               for v, x in list(L['views'].items()) + list((L.get('altViews') or {}).items()) if x['status'] != 'pass']
    flagged += [dict(look=k, view=v, status=x['status'], failed=x['failed']) for k, b in sorted(bigs.items()) for v, x in b['views'].items() if x['status'] != 'pass']
    json.dump(dict(report=report, webpBytes=tot, jsonBytes=len(s), looks=sorted(looks), bigs={k: sorted(b['views']) for k, b in bigs.items()},
                   cards={k: dict(kind=c['kind'], src=c['src']) for k, c in cards.items()}, flaggedStageC=flagged, missing=missing),
              open(os.path.join(HERE, 'bundle-report.json'), 'w'), indent=1)
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
