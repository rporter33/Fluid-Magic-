# Stage C gods: the review images. Per god, its approved portrait beside its idle figure in both views (both palettes
# for a generic god), the figures on the battle's plains ground, then the same figures at the game's tier S scale beside
# a painted Cinder Warrior (a man, 28 wu) and the approved Salamander (size 3), with the checks and the identity marks.
# And lineups by size at tier S (front views, back views, the Thornwood palettes), on the plains ground.
# Usage: python3 -I gd_contact.py      (reads work/gods/selection.json, marks.json; writes stage-c/atlas/gods/contact/)
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import resolve, UNITS, GODS, GENERIC  # noqa: E402
sys.path.insert(0, os.path.join(UNITS, 'tools'))
sys.path.insert(0, os.path.join(UNITS, 'stage-b', 'cal', 'sbx', 'tools'))
import pack as calpack  # noqa: E402
import checks as calchecks  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.join(UNITS, 'stage-c', 'atlas', 'gods', 'contact')
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font = ImageFont.truetype(F, 15); small = ImageFont.truetype(F, 13); big = ImageFont.truetype(FB, 22)
PLAINS = (0xA8, 0xA7, 0x84)
BG = (30, 28, 25)
NAMES = dict(greatWyrm='Great Wyrm', titan='Titan', oracle='Oracle of the Flux', livingMonolith='Living Monolith', ascendedHero='Ascended Hero',
             primordial='Primordial', ashColossus='Ash Colossus', ashPhoenix='Ash Phoenix', pyreLord='Pyre Lord', cinderIdol='Cinder Idol',
             emberHierophant='Ember Hierophant', wildSpirit='Wild Spirit', worldTree='World Tree', hornedHunter='Horned Hunter',
             elderWyrm='Elder Wyrm', motherOfBeasts='Mother of Beasts')
SEL = json.load(open(os.path.join(W, 'selection.json')))['figures']
MARKS = json.load(open(os.path.join(W, 'marks.json'))) if os.path.exists(os.path.join(W, 'marks.json')) else {}


def cut(fig, v):
    s = SEL[fig][v]
    d = os.path.join(W, 'cut', s['tag'])
    ck = json.load(open(os.path.join(d, 'checks.json')))
    meta = json.load(open(os.path.join(d, f'{fig}.{v}.idle.json')))
    return Image.open(os.path.join(d, f'{fig}.{v}.idle.png')).convert('RGBA'), meta, ck, s


def on_ground(im, color=PLAINS):
    bg = Image.new('RGBA', im.size, color + (255,)); bg.alpha_composite(im); return bg.convert('RGB')


def tier_s(im, meta):
    """The cutout at tier S (0.5 wu a px) with its keyline, and its anchor, as the bundler makes it."""
    rgba = np.asarray(im).astype(np.float64)
    k = meta['heightWu'] / 0.5 / meta['height']
    s = calchecks.keyline(np.pad(calpack.premul_resize(rgba, k), ((1, 1), (1, 1), (0, 0))))
    return Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA'), (meta['anchor'][0] * k + 1, meta['anchor'][1] * k + 1)


def man_s(view):
    A = os.path.join(UNITS, 'stage-b', 'atlas', 'troops', 'troops-cinderHorde-S.0')
    j = json.load(open(A + '.json'))
    f = j['frames'][f'cinderWarrior.{view}.stand']
    r = f['frame']
    im = Image.open(A + '.png').convert('RGBA').crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    return im, (f['anchor']['x'] * r['w'], f['anchor']['y'] * r['h'])


def salamander_s(view):
    sys.path.insert(0, os.path.join(UNITS, 'tools'))
    from pilot_page import true_height_wu
    import ad_page
    png = os.path.join(UNITS, 'pilot', 'ad', 'frames', f'salamander-01.{view}', f'salamander-01.{view}.idle.png')
    meta = json.load(open(png.replace('.png', '.json')))
    meta['anchor'] = ad_page.maquette_anchor(png, view)
    meta['heightWu'] = true_height_wu('salamander-01', view, 'idle')
    return tier_s(Image.open(png).convert('RGBA'), meta)


def ground_row(items, pad=26, label_h=40, scale=1.0):
    """items: (label, rgba, anchor). Each stands on one ground line, left to right."""
    ims = [(t, im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS), (a[0] * scale, a[1] * scale)) for t, im, a in items]
    above = max(a[1] for _, _, a in ims); below = max(im.height - a[1] for _, im, a in ims)
    slot = [max(im.width, max(small.getlength(ln) for ln in t.split('\n')) + 6) for t, im, _ in ims]
    Wd = sum(slot) + pad * (len(ims) + 1)
    H = int(above + below + label_h + 30)
    can = Image.new('RGBA', (int(Wd), H), PLAINS + (255,))
    d = ImageDraw.Draw(can)
    x = pad; gy = int(above + 15)
    for (t, im, a), sw in zip(ims, slot):
        ox = x + (sw - im.width) / 2
        can.alpha_composite(im, (int(round(ox)), int(round(gy - a[1]))))
        d.ellipse((ox + a[0] - 3, gy - 2, ox + a[0] + 3, gy + 2), outline=(120, 40, 20))
        for i, ln in enumerate(t.split('\n')):
            d.text((x, gy + below + 4 + 15 * i), ln, fill=(30, 30, 30), font=small)
        x += sw + pad
    return can.convert('RGB')


def tick(x):
    return {True: 'reads', 'partly': 'partly', False: 'absent', None: '?', 'game': 'drawn by the game', 'hidden': 'hidden by the view'}.get(x, str(x))


def god_sheet(god):
    R = resolve()
    nations = [n for n in ('cinderHorde', 'thornwood') if f'{god}-{n}' in SEL]
    rows = []
    for n in nations:
        fig = f'{god}-{n}'
        por = Image.open(R[god][n]['p512']).convert('RGB').resize((420, 420), Image.LANCZOS)
        cb, mb, ckb, sb = cut(fig, 'back'); cf, mf, ckf, sf = cut(fig, 'front')
        H = 420
        # both views at one world scale: px per wu equal, the taller fills 420 px
        ppw = min(H / mb['heightWu'] * mb['height'] / cb.height, H / mf['heightWu'] * mf['height'] / cf.height)
        sb_ = ppw * mb['heightWu'] / mb['height']; sf_ = ppw * mf['heightWu'] / mf['height']
        ib = on_ground(cb).resize((round(cb.width * sb_), round(cb.height * sb_)), Image.LANCZOS)
        if_ = on_ground(cf).resize((round(cf.width * sf_), round(cf.height * sf_)), Image.LANCZOS)
        panels = [('portrait (pick %s, %s)' % (R[god][n]['pick'], R[god][n]['name']), por), ('back view (near side)', ib), ('front view (far side)', if_)]
        Wd = sum(p.width for _, p in panels) + 20 * (len(panels) + 1)
        row = Image.new('RGB', (Wd, H + 30), BG); d = ImageDraw.Draw(row); x = 20
        for t, p in panels:
            row.paste(p, (x, 26)); d.text((x, 4), t, fill=(230, 225, 210), font=font); x += p.width + 20
        rows.append(row)
        # in game: tier S beside a man and the Salamander
        items = []
        for v, im, meta in (('back', cb, mb), ('front', cf, mf)):
            s, a = tier_s(im, meta)
            items.append((f'{v}\n{meta["heightWu"]:.0f} wu', s, a))
        m, ma = man_s('front'); items.insert(0, ('a man\n28 wu', m, ma))
        sl, sa = salamander_s('front'); items.insert(1, ('Salamander\nsize 3', sl, sa))
        gr = ground_row(items, scale=1.0)
        lab = Image.new('RGB', (gr.width, 24), BG); ImageDraw.Draw(lab).text((20, 4), f'{n}: in game, tier S (0.5 wu/px), plains ground; ring = ground anchor', fill=(230, 225, 210), font=font)
        rows.append(lab); rows.append(gr)
        # checks text
        lines = []
        for v, ck, s in (('back', ckb, sb), ('front', ckf, sf)):
            c = ck['camera']
            st = s['status'] + (f" ({s.get('failed')})" if s.get('failed') else '') + (' [facing n/a: a tree has no front]' if s.get('facingNA') else '')
            lines.append(f"{v}: {st}. camera IoU {c['iou']}, facing {c['facingMargin']:+.3f}, aspect {c['aspectRatio']}, head {c['headDx']:+.3f} (maquette {c['guideHeadDx']:+.3f}); "
                         f"rim {ck['rim']['keyHueShiftedPct']}%; key-in-unit {ck['fringe']['keyInUnitPct']}%; value {ck['value']['worstBelow']} L* below the darkest ground; "
                         f"side {ck['side']['window']:.3f}" + (f" lock {ck['side'].get('lock'):.3f}" if 'lock' in ck['side'] else '') +
                         f" (portrait {ck['side']['portrait'].get('window') if ck['side']['portrait'] else '-'}); identity dE {ck['identity']['dE_whole']}; "
                         f"size: x{ck['size']['worldRatio']} of the ladder's {ck['size']['ladder']} men, {ck['size']['heightWu']:.0f} x {ck['size']['widthWu']:.0f} wu")
        mk = MARKS.get(god, {})
        if mk:
            lines.append('identity marks (back / front): ' + '; '.join(f"{m['mark']}: {tick(m.get('back'))} / {tick(m.get('front'))}" for m in mk.get('marks', [])))
            if mk.get('note'):
                lines.append('note: ' + mk['note'])
        tw = max(r.width for r in rows)
        wrapped = []
        for ln in lines:
            words, cur = ln.split(' '), ''
            for w_ in words:
                if small.getlength(cur + ' ' + w_) > tw - 40:
                    wrapped.append(cur); cur = '   ' + w_
                else:
                    cur = (cur + ' ' + w_).strip(' ') if cur else w_
            wrapped.append(cur)
        txt = Image.new('RGB', (tw, 18 * len(wrapped) + 12), BG); d = ImageDraw.Draw(txt)
        for i, ln in enumerate(wrapped):
            d.text((20, 6 + 18 * i), ln, fill=(210, 205, 190), font=small)
        rows.append(txt)
    Wd = max(r.width for r in rows)
    head = Image.new('RGB', (Wd, 40), BG)
    ck0 = cut(f'{god}-{nations[0]}', 'back')[2]['size']
    ImageDraw.Draw(head).text((20, 8), f"{NAMES[god]}  -  size {ck0['sizeClass']} (ladder {ck0['ladder']} men, {ck0['ladderWu']:.0f} wu)  -  stage C idle figure, owner review 2", fill=(240, 235, 220), font=big)
    rows.insert(0, head)
    sheet = Image.new('RGB', (Wd, sum(r.height for r in rows)), BG); y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, f'{god}.png'); sheet.save(p, optimize=True)
    return p


def lineup(view, nation_pref, out, gods=GODS):
    items = []
    m, ma = man_s(view); items.append(('man\n28 wu', m, ma))
    sl, sa = salamander_s(view); items.append(('Salamander\n(size 3)', sl, sa))
    order = []
    for g in gods:
        n = nation_pref if f'{g}-{nation_pref}' in SEL else ('cinderHorde' if f'{g}-cinderHorde' in SEL else 'thornwood')
        im, meta, ck, s = cut(f'{g}-{n}', view)
        order.append((ck['size']['sizeClass'], meta['heightWu'], g, n, im, meta))
    order.sort(key=lambda x: (x[0], x[1]))
    for sc, hw, g, n, im, meta in order:
        s, a = tier_s(im, meta)
        items.append((f'{NAMES[g]}\nsize {sc}, {hw:.0f} wu', s, a))
    row = ground_row(items, pad=18, scale=0.5)
    head = Image.new('RGB', (row.width, 34), BG)
    ImageDraw.Draw(head).text((14, 6), f'Gods by size, {view} view, {"Thornwood palettes" if nation_pref == "thornwood" else "Cinder palette for the generic gods"}: tier S at half size (1 px = 1 wu), on one ground line, with a painted man and the approved Salamander', fill=(240, 235, 220), font=font)
    sheet = Image.new('RGB', (row.width, row.height + 34), BG); sheet.paste(head, (0, 0)); sheet.paste(row, (0, 34))
    sheet.save(os.path.join(OUT, out), optimize=True)
    return os.path.join(OUT, out), sheet.size


def main():
    os.makedirs(OUT, exist_ok=True)
    for g in (sys.argv[1:] if len(sys.argv) > 1 and sys.argv[1] != '--lineups' else ([] if '--lineups' in sys.argv else GODS)):
        print(god_sheet(g))
    print(lineup('front', 'cinderHorde', 'lineup-front.png'))
    print(lineup('back', 'cinderHorde', 'lineup-back.png'))
    print(lineup('front', 'thornwood', 'lineup-thornwood-front.png', gods=list(GENERIC) + ['wildSpirit', 'worldTree', 'hornedHunter', 'elderWyrm', 'motherOfBeasts']))


if __name__ == '__main__':
    main()
