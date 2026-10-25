# Stage C fix pass: before-and-after sheets of each fixed figure, in the critique's views, from the shipped atlases
# (before: pre-fix/units/stage-c/atlas, after: stage-c/atlas), on the plains ground colour, captioned.
# Writes stage-c/shots/fix/fixNN-*.png. Usage: python3 -I fixshots.py
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
SC = os.path.join(UNITS, 'stage-c')
PRE = os.path.join(SC, 'pre-fix', 'units', 'stage-c')
OUT = os.path.join(SC, 'shots', 'fix')
SB = os.path.join(UNITS, 'stage-b')
REPO = '/home/user/Fluid-Magic-'
GROUND = (168, 166, 138)
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font, fontb, fonts = ImageFont.truetype(F, 18), ImageFont.truetype(FB, 22), ImageFont.truetype(F, 15)
sys.path.insert(0, os.path.join(SB, 'integrate'))


def atlas(root, fam, tier):
    out, i = {}, 0
    while os.path.exists(os.path.join(root, 'atlas', 'creatures', f'{fam}-{tier}.{i}.json')):
        j = json.load(open(os.path.join(root, 'atlas', 'creatures', f'{fam}-{tier}.{i}.json')))
        im = Image.open(os.path.join(root, 'atlas', 'creatures', f'{fam}-{tier}.{i}.png')).convert('RGBA')
        for n, f in j['frames'].items():
            r = f['frame']; out[n] = (im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (f['anchor']['x'], f['anchor']['y']))
        i += 1
    return out


def god_tier(root, fig, view, tier):
    g = json.load(open(os.path.join(root, 'atlas', 'gods', 'gods.json')))['figures'][fig]['views'][view]
    t = g['tiers'][tier]
    return Image.open(os.path.join(root, 'atlas', 'gods', t['file'])).convert('RGBA'), (t['ax'], t['ay']), g


def on_ground(im, scale=1, bg=GROUND, pad=8):
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.NEAREST if scale >= 2 and im.width < 120 else Image.LANCZOS)
    c = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), bg + (255,))
    c.alpha_composite(im, (pad, pad))
    return c.convert('RGB')


def row(ims, gap=10, bg=(28, 26, 23), align='bottom'):
    H = max(i.height for i in ims)
    out = Image.new('RGB', (sum(i.width for i in ims) + gap * (len(ims) - 1), H), bg)
    x = 0
    for i in ims:
        out.paste(i, (x, H - i.height if align == 'bottom' else 0)); x += i.width + gap
    return out


def col(ims, gap=10, bg=(28, 26, 23)):
    W = max(i.width for i in ims)
    out = Image.new('RGB', (W, sum(i.height for i in ims) + gap * (len(ims) - 1)), bg)
    y = 0
    for i in ims:
        out.paste(i, (0, y)); y += i.height + gap
    return out


def tw(text, f):
    return int(ImageDraw.Draw(Image.new('RGB', (4, 4))).textlength(text, font=f)) + 16


def caption(im, title, sub=None):
    h = 34 + (24 if sub else 0)
    out = Image.new('RGB', (max(im.width, tw(title, fontb), tw(sub or '', fonts)), im.height + h), (28, 26, 23))
    d = ImageDraw.Draw(out)
    d.text((8, 6), title, font=fontb, fill=(244, 238, 223))
    if sub:
        d.text((8, 34), sub, font=fonts, fill=(183, 173, 154))
    out.paste(im, (0, h))
    return out


def label(im, text):
    out = Image.new('RGB', (max(im.width, tw(text, fonts)), im.height + 26), (28, 26, 23))
    ImageDraw.Draw(out).text((4, 4), text, font=fonts, fill=(220, 212, 196))
    out.paste(im, (0, 26))
    return out


def portrait(path, h):
    im = Image.open(path).convert('RGB')
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def save(im, name):
    os.makedirs(OUT, exist_ok=True)
    im.save(os.path.join(OUT, name))
    print(name, im.size)


def fix1():
    import bundle_stagec as SCB
    cr = lambda img, f: (img.crop((f['frame']['x'], f['frame']['y'], f['frame']['x'] + f['frame']['w'], f['frame']['y'] + f['frame']['h'])), (f['anchor']['x'], f['anchor']['y']))
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        for t, sc in (('S', 6), ('H', 3)):
            at = {}
            i = 0
            while os.path.exists(os.path.join(root, 'atlas', 'creatures', f'hornetSwarm-{t}.{i}.json')):
                j = json.load(open(os.path.join(root, 'atlas', 'creatures', f'hornetSwarm-{t}.{i}.json')))
                img = Image.open(os.path.join(root, 'atlas', 'creatures', f'hornetSwarm-{t}.{i}.png')).convert('RGBA')
                for n, f in j['frames'].items():
                    at[n] = (img, f)
                i += 1
            cl = next(x for x in SCB.hornet_clusters({k: v for k, v in at.items()}, lambda img, f: cr(img, f), t) if x['name'] == 'hornetSwarm.back.c0.glide')
            ims.append(label(on_ground(cl['img'], sc), f'{tag}: tier {t} x{sc} (one figure = 12 hornets)'))
    save(caption(col([row(ims[:2]), row(ims[2:])]), 'Fix 1 and R4: the Hornet Swarm at play zoom (tier S) and close (tier H)',
                 'before: amber bee, Thornwood keyline 75% read teal (42% of a frame in hue 150-210 at S); after: black-and-ochre wasp, neutral keyline (1.9%)'), 'fix01-hornet.png')


def fix2():
    rows = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        at = atlas(root, 'wolfRider', 'H')
        cells = ['stand', 'lopeA', 'lopeB', 'leapA', 'leapB', 'charge', 'windup', 'strike', 'bite', 'recoil', 'fall', 'boltA']
        ims = [on_ground(at[f'wolfRider.front.{c}'][0], 1.0, pad=4) for c in cells]
        rows.append(label(row(ims, 4), f'{tag}: War Wolf harness front, tier H (stand, lopes, leaps, charge, windup, strike, bite, recoil, fall, boltA)'))
    save(caption(col(rows), 'Fix 2: the Wolf Rider harness front, coat and cloth',
                 'coat b x100 (lower half, cloth out): stand 0.64 -> 1.09, recoil 0.72 -> 1.08, fall 0.94 -> 1.03 against lopes 0.99 to 1.06; cloth L 0.432 -> 0.394'), 'fix02-wolfrider-front-cells.png')


def fix4():
    p = portrait(os.path.join(SB, 'portraits', 'thornwood', 'oakheart', '01b-512.webp'), 330)
    ims = [label(p, 'portrait B (approved)')]
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        at = atlas(root, 'oakheart', 'H')
        for v in ('front', 'back'):
            ims.append(label(on_ground(at[f'oakheart.{v}.stand'][0], 1.8), f'{tag}: {v}, tier H x1.8'))
    save(caption(row(ims), 'Fix 4 (R1): the Oakheart', 'the low flat cap becomes the portrait\'s tall helm of upright bark planks, thorn crown and oak-leaf rim (re-roll: a plain edit of the shipped sheet)'), 'fix04-oakheart.png')


def big_cut(root, fig, view, tier='H'):
    m = json.load(open(os.path.join(root, 'atlas', 'creatures', 'figures', f'{fig}.json')))
    at = atlas(root, m['unit'], tier)
    return at[m['views'][view]['atlas'][tier]['frame']][0], m['views'][view]['heightWu']


def fix5():
    ims = []
    for fig, v in (('treant-04', 'front'), ('treant-04', 'back'), ('treant-02', 'back')):
        for root, tag in ((PRE, 'before'), (SC, 'after')):
            im, hw = big_cut(root, fig, v)
            ims.append(label(on_ground(im, 0.75), f'{tag} {fig} {v} ({hw} wu)'))
    a = caption(row(ims, 8), 'Fix 5 (R2): the Treant crowns cut by the top edge, completed', 'the shipped cut\'s px-to-wu scale kept: heightWu grows with the crown (04 front 100.6 -> 122.8 wu, 04 back 95.3 -> 114.2, 02 back 95.3 -> 106.0)')
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        for v in ('back', 'front'):
            im, anc, g = god_tier(root, 'wildSpirit-thornwood', v, 'H')
            ims.append(label(on_ground(im, 1.6), f'{tag} {v} ({g["heightWu"]} wu)'))
    b = caption(row(ims, 8), 'Fix 5 (R3): the Wild Spirit\'s back view', 'before: reared on its hind legs (head offset 0.476 against the maquette\'s 0.237); after: all four hooves planted (0.238), on a square-standing back maquette')
    save(a, 'fix05-treants.png'); save(b, 'fix05-wildspirit.png')


def man(root, v, tier='S'):
    at = {}
    i = 0
    pre = os.path.join(SB, 'atlas', 'troops', f'troops-cinderHorde-{tier}')
    while os.path.exists(f'{pre}.{i}.json'):
        j = json.load(open(f'{pre}.{i}.json')); img = Image.open(f'{pre}.{i}.png').convert('RGBA')
        for n, f in j['frames'].items():
            r = f['frame']; at[n] = img.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
        i += 1
    return at[f'cinderWarrior.{v}.stand']


def fix6():
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        for v in ('front', 'back'):
            im, anc, g = god_tier(root, 'ascendedHero-cinderHorde', v, 'S')
            ims.append(label(row([on_ground(man(root, v), 4), on_ground(im, 4)], 0), f'{tag} {v}: {g["heightWu"]} wu'))
    save(caption(row(ims), 'Fix 6 and Q4: the Ascended Hero beside a man, tier S x4',
                 'before: front 35.0 wu, back 42.2 (17% short in front); after: both 42.2 x the commander factor 1.15 = 48.5 wu'), 'fix06-ascendedhero.png')


def fix7():
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        wr, wo = atlas(root, 'wolfRider', 'S'), atlas(root, 'wolf', 'S')
        ims.append(label(row([on_ground(man(root, 'front'), 6), on_ground(wo['wolf.front.stand'][0], 6), on_ground(wr['wolfRider.front.boltA'][0], 6),
                              on_ground(wr['wolfRider.front.stand'][0], 6), on_ground(wr['wolfRider.back.stand'][0], 6)], 4),
                         f'{tag}: a man, the summoned Wolf, the War Wolf (boltA), the Wolf Rider front and back; tier S x6'))
    save(caption(col(ims), 'Fix 7: the Wolf Rider at the plan\'s 74 px (37 wu, hood to paws)',
                 'War Wolf boltA 38 x 51 px -> 42 x 58 (the Wolf stands 48 x 59); rider front 39 x 66 -> 44 x 76, back 42 x 78 -> 46 x 87'), 'fix07-riders-vs-foot.png')


def fix8():
    p = portrait(os.path.join(SB, 'portraits', 'cinderHorde', 'ashColossus', '01a-512.webp'), 420)
    ims = [label(p, 'portrait A (approved)')]
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        for v in ('front', 'back'):
            im, anc, g = god_tier(root, 'ashColossus-cinderHorde', v, 'H')
            ims.append(label(on_ground(im, 420 / im.height), f'{tag} {v}'))
    g = os.path.join(SC, 'work', 'gods', 'guides', 'ashColossus.idle.front.png')
    g0 = os.path.join(PRE, 'work', 'gods', 'guides', 'ashColossus.idle.front.png')
    ims.append(label(portrait(g0, 300), 'maquette before'))
    ims.append(label(portrait(g, 300), 'maquette after'))
    save(caption(row(ims), 'Fix 8 (R5): the Ash Colossus', 'corrected maquette (lean, legs half the height, slim limbs, fists at the arms\' ends), then re-painted: dark charcoal ash with ember cracks (median OKLab L front/back 0.33/0.29 -> 0.29/0.27; width to height 0.60/0.67 -> 0.46/0.47)'), 'fix08-ashcolossus.png')


def fix9():
    p = portrait(os.path.join(SB, 'portraits', 'cinderHorde', 'ashHorse', '01b-512.webp'), 300)
    ims = [label(p, 'Ash Horse B (approved)')]
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        at = atlas(root, 'ashRider', 'H')
        ims.append(label(row([on_ground(at[f'ashRider.front.{c}'][0], 1.4) for c in ('stand', 'walkA', 'gallopA', 'charge')], 4), f'{tag}: front, tier H x1.4'))
    save(caption(row(ims), 'Fix 9 (R6): the Ash Rider front', 'the coat now the portrait\'s dark charcoal with pale dapples; the ember cape on both shoulders; side share 0.5% -> 2.2% (19.7%/21.5% -> 24.3% with the keyline); the chest caparison did not come'), 'fix09-ashrider-front.png')


def fix12():
    # Living Monolith bases
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        for fig in ('livingMonolith-cinderHorde', 'livingMonolith-thornwood'):
            for v in ('back', 'front'):
                im, anc, g = god_tier(root, fig, v, 'S')
                ims.append(label(on_ground(im, 0.9), f'{tag} {fig.split("-")[1][:6]} {v}'))
    save(caption(row(ims, 6), 'Fix 12 (R7): the Living Monolith\'s front takes its back\'s mound', 'tier S; the Thornwood front re-tinted from the new Cinder front (its turn measured from its own glyph hue)'), 'fix12-livingmonolith.png')
    # Horned Hunter pauldrons
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        im, anc, g = god_tier(root, 'hornedHunter-thornwood', 'back', 'H')
        ims.append(label(on_ground(im.crop((0, 0, im.width, im.height // 2)), 1.6), f'{tag}: back, tier H x1.6 (upper half)'))
    p = portrait(os.path.join(SB, 'portraits', 'thornwood', 'hornedHunter', '01a-512.webp'), 400)
    save(caption(row([label(p, 'portrait A')] + ims), 'Fix 12: the Horned Hunter\'s back pauldrons', 'teal-green plates (not in the portrait) tinted to worn bronze; teal in the plates 55% -> 0.3%; the leaf mantle untouched'), 'fix12-hornedhunter.png')
    # the Wolf's mauve rim
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        at = atlas(root, 'wolf', 'H')
        for v in ('front', 'back'):
            im = at[f'wolf.{v}.stand'][0]
            ims.append(label(on_ground(im, 3, bg=(150, 150, 150)), f'{tag} {v} x3'))
    save(caption(row(ims), 'Fix 12: the summoned Wolf\'s mauve edge', 'the edge band\'s rose to mauve (hue 325-35) turned warm grey (ad_rimfix.mauve): front stand at tier S 1.5% -> 0.06% of its pixels in hue 330-10'), 'fix12-wolf-rim.png')
    # cards
    ims = []
    for fig in ('salamander-01', 'treant-01'):
        unit, face = fig.split('-')
        nat = 'cinderHorde' if unit == 'salamander' else 'thornwood'
        c64 = Image.open(f'{REPO}/src/assets/raster/portraits/{nat}/{unit}/{face}-64.webp').convert('RGB').resize((256, 256), Image.LANCZOS)
        c128 = Image.open(os.path.join(SB, 'integrate', 'pages', f'card-{fig}.png')).convert('RGB').resize((256, 240), Image.LANCZOS)
        ims += [label(c64, f'{fig}: before (64 px card at 4x)'), label(c128, 'after (128 px card at 2x)')]
    save(caption(row(ims), 'Fix 12: the Salamander and Treant cards', 'the 128 px crop of the approved leader portrait (as the stage B cards), crisp at DPR 2'), 'fix12-cards.png')


def godsize():
    ims = []
    for root, tag in ((PRE, 'before'), (SC, 'after')):
        parts = [on_ground(man(root, 'front'), 3)]
        cm = {}
        pre = os.path.join(SB, 'atlas', 'cmdA', 'ashChieftain.S')
        i = 0
        while os.path.exists(f'{pre}.{i}.json'):
            j = json.load(open(f'{pre}.{i}.json')); img = Image.open(f'{pre}.{i}.png').convert('RGBA')
            for n, f in j['frames'].items():
                r = f['frame']; cm[n] = img.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
            i += 1
        parts.append(on_ground(cm['ashChieftain-06.front.stand'], 3))
        for fig in ('oracle-cinderHorde', 'ascendedHero-cinderHorde', 'emberHierophant-cinderHorde', 'wildSpirit-thornwood'):
            im, anc, g = god_tier(root, fig, 'front', 'S')
            parts.append(on_ground(im, 3))
        ims.append(label(row(parts, 4), f'{tag}: a man (28 wu), Ash Chieftain 06 (32 wu), then the size-2 gods Oracle, Ascended Hero, Ember Hierophant, Wild Spirit; tier S x3'))
    save(caption(col(ims), 'Owner question 4 (default applied): gods at the commander factor 1.15',
                 'size-2 gods 37 to 42 wu -> 42 to 48.5 wu: 1.3 to 1.5x a commander; one number per god in gd_pack.py COMMANDER_FACTOR'), 'fixQ4-gods-vs-commander.png')


if __name__ == '__main__':
    for f in (fix1, fix2, fix4, fix5, fix6, fix7, fix8, fix9, fix12, godsize):
        f()
