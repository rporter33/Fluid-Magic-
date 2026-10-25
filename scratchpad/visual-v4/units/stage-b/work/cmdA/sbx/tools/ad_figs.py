# The art director's review images (pilot-review.md), into ../pilot/ad/review/:
#   ad-sheets.png         the review's raw sheets (pilot/raw/ad) with their measures (pilot/work/ad/summary.json)
#   salamander-scar.png   the portrait's snout, the pilot's front cutout and the review's edit, same crop
#   rimfix.png            the stand frames at 4x before and after ad_rimfix.py (back and front view)
#   wolf-key.png          the Wolf Rider stand frame at 4x: the pilot's magenta key against the blue key
#   front-before-after.png  the front stand frame at 4x: the pilot pick against the surcoat sheet, both rim-fixed
#   motion-strip.png      8 moments of the motion preset (ad_shoot.cjs shots), cropped to each block
#   contact-warden.bust.png  the Warden bust sheets with the right captions (the pilot's sheet called them failures)
#   commander-06.png      Ash Chieftain 06: the portrait and the stand frame of each of the three commander tests
#   warden-green.png      the Warden's stand frame: as painted, with the cloth hue lock (ad_huelock.py), and the hex edit
# Usage: python3 -I ad_figs.py
import json, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
from pilot_figs import font, labelled, row, on_bg, BG  # noqa: E402

P = os.path.join(ROOT, 'pilot')
OUT = os.path.join(P, 'ad', 'review')
F14, F18 = font(14), font(18)
REPO = '/home/user/Fluid-Magic-'


def x4(path, bg=BG, k=4):
    im = Image.open(path).convert('RGBA')
    c = Image.new('RGBA', im.size, bg + (255,)); c.alpha_composite(im)
    return c.resize((im.width * k, im.height * k), Image.NEAREST)


def head(text, w, h=30):
    t = Image.new('RGBA', (w, h), (28, 26, 23, 255)); ImageDraw.Draw(t).text((8, 7), text, fill=(243, 238, 228), font=F14); return t


def sheets():
    S = json.load(open(os.path.join(P, 'work', 'ad', 'summary.json')))
    items = [
        ('cw.front.rs.nb21', 'Nano Banana 2.1 edit of the pilot front pick: surcoat'),
        ('cw.front.g3pro', 'Nano Banana Pro from the maquette: surcoat'),
        ('cw.back.rs.nb21', 'Nano Banana 2.1 repaint of the back pick, front sheet as hand reference'),
        ('cw.back.quad.g3pro', 'Nano Banana Pro, 2 x 2 large cells (detail test)'),
        ('wr.front.blue.g3pro', 'Nano Banana Pro, Wolf Rider on a blue key'),
        ('sal.front.mark.nb21', 'Nano Banana 2.1 edit of the front cutout: snout scar'),
        ('ac06.front.g3pro', 'Ash Chieftain 06: Nano Banana Pro, maquette + portrait'),
        ('ac06.front.cam.g3pro', 'Ash Chieftain 06: Nano Banana Pro, maquette, no portrait'),
        ('ac06.front.redress.nb21', 'Ash Chieftain 06: Nano Banana 2.1 re-dress of the troop sheet'),
        ('wd.front.g3pro', 'Warden (Thornwood): Nano Banana Pro, maquette, surcoat'),
        ('wd.front.rs.nb21', 'Warden: Nano Banana 2.1 edit asking for the cloth hex'),
    ]
    tiles, w = [], 520
    for n, title in items:
        im = Image.open(os.path.join(P, 'raw', 'ad', n + '.png')).convert('RGB')
        im = im.resize((w, int(im.height * w / im.width)))
        m = S.get(n)
        if n == 'cw.back.quad.g3pro':
            cap = 'judged by eye: eye-level camera, strike cell turned; not usable'
        elif m and 'identity' in m:
            cap = f"camera IoU {m['camera']['iou']:.2f} | identity dE {m['identity']['dE2000']}"
        elif m:
            ca = m['cameraAll']
            cap = f"camera cells {ca['follow']} | side {100 * m.get('side', {}).get('share', 0):.0f}% | cons dE {m['consistency']['maxDE'][1]}"
            if n == 'cw.back.rs.nb21':
                cap += ' | FAIL: copied the front view'
            if n == 'wd.front.rs.nb21':
                cap += ' | overshot to teal'
            if n.startswith('ac06'):
                cap = f"camera cells {ca['follow']} | stand IoU {m['camera']['iou']:.2f} | cons dE {m['consistency']['maxDE'][1]}"
                cap += ' | FAIL' if not m['camera']['pass'] else ' | pass (melee layout)'
        else:
            cap = ''
        t = Image.new('RGB', (w, im.height + 58), (28, 26, 23)); d = ImageDraw.Draw(t)
        d.text((8, 6), 'ad: ' + title, fill=(243, 238, 228), font=F14); d.text((8, 30), cap, fill=(200, 192, 178), font=F14)
        t.paste(im, (0, 58)); tiles.append(t)
    cols = 3; H = max(t.height for t in tiles)
    rows_ = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w + (cols + 1) * 8, rows_ * H + (rows_ + 1) * 8 + 40), (20, 18, 15))
    ImageDraw.Draw(sheet).text((10, 10), "The art director's test sheets (11 generations)", fill=(243, 238, 228), font=font(24))
    for i, t in enumerate(tiles):
        sheet.paste(t, (8 + (i % cols) * (w + 8), 48 + (i // cols) * (H + 8)))
    sheet.save(os.path.join(OUT, 'ad-sheets.png'))


def scar():
    por = Image.open(f'{REPO}/art-source/portraits/cinderHorde/salamander/01.webp').convert('RGBA').crop((180, 100, 512, 330))
    por = por.resize((460, int(por.height * 460 / por.width)), Image.LANCZOS)
    box = (60, 560, 470, 1000)
    a = Image.open(os.path.join(P, 'raw', 'r1', 'sal.front.nb21.png')).convert('RGBA').crop(box)
    b = Image.open(os.path.join(P, 'raw', 'ad', 'sal.front.mark.nb21.png')).convert('RGBA').crop(box)
    a = a.resize((460, int(a.height * 460 / a.width)), Image.LANCZOS); b = b.resize(a.size, Image.LANCZOS)
    row([labelled(por, 'approved portrait 01: the pale scrape across the snout'), labelled(a, 'pilot front cutout'),
         labelled(b, 'review edit (one generation): the scar named')]).convert('RGB').save(os.path.join(OUT, 'salamander-scar.png'))


def rimfix():
    W = os.path.join(P, 'work')
    A = os.path.join(P, 'ad', 'frames')
    imgs = [labelled(x4(f'{W}/r3/cw.back.g3pro/frames/cinderWarrior.back.stand.png'), 'back, pilot keyer'),
            labelled(x4(f'{A}/cinderWarrior.back/cinderWarrior.back.stand.png'), 'back, + rim fix'),
            labelled(x4(f'{W}/ad/cw.front.rs.nb21/frames/cinderWarrior.front.stand.png'), 'front, pilot keyer'),
            labelled(x4(f'{A}/cinderWarrior.front/cinderWarrior.front.stand.png'), 'front, + rim fix')]
    row(imgs).convert('RGB').save(os.path.join(OUT, 'rimfix.png'))
    row([labelled(x4(f'{A}/cinderWarrior.front.r2/cinderWarrior.front.stand.png'), 'front, pilot pick (r2), rim-fixed'),
         labelled(x4(f'{A}/cinderWarrior.front/cinderWarrior.front.stand.png'), 'front, surcoat edit, rim-fixed')]).convert('RGB').save(
        os.path.join(OUT, 'front-before-after.png'))


def wolf():
    A = os.path.join(P, 'ad', 'frames')
    row([labelled(x4(f'{A}/wolfRider.front.r2/wolfRider.front.stand.png', k=3), 'pilot probe, magenta key'),
         labelled(x4(f'{A}/wolfRider.front/wolfRider.front.stand.png', k=3), 'blue key, lighter green, pennon')]).convert('RGB').save(
        os.path.join(OUT, 'wolf-key.png'))


def motion():
    shots = [os.path.join(P, 'ad', 'shots', f'ad-motion-{i}.png') for i in range(8)]
    far_box, near_box = (920, 40, 1290, 260), (300, 520, 690, 750)
    rows_ = []
    for box, name in ((far_box, 'far side: front rank strikes'), (near_box, 'near side: march cycle')):
        cells = [Image.open(s).convert('RGBA').crop(box) for s in shots]
        r = row([labelled(c, f'{name}, t = {0.225 * i:.2f} s' if i == 0 else f't = {0.225 * i:.2f} s') for i, c in enumerate(cells)], gap=4)
        rows_.append(r)
    W = max(r.width for r in rows_)
    out = Image.new('RGBA', (W, sum(r.height for r in rows_)), (20, 18, 15, 255)); y = 0
    for r in rows_:
        out.alpha_composite(r, (0, y)); y += r.height
    out.convert('RGB').save(os.path.join(OUT, 'motion-strip.png'))


def commander():
    W = os.path.join(P, 'work', 'ad')
    por = Image.open(f'{REPO}/art-source/portraits/cinderHorde/ashChieftain/06.webp').convert('RGBA').resize((300, 300), Image.LANCZOS)
    tiles = [labelled(por, 'approved portrait, face 06')]
    for n, cap in (('ac06.front.g3pro', 'Pro + portrait: eye level, 2/16'), ('ac06.front.cam.g3pro', 'Pro, no portrait: 1/16, stubby'),
                   ('ac06.front.redress.nb21', 'nb21 re-dress of the troop sheet: 13/15')):
        d = os.path.join(W, n, 'frames')
        f = [x for x in os.listdir(d) if x.endswith('.stand.png')][0]
        im = Image.open(os.path.join(d, f)).convert('RGBA')
        k = 300 / im.height
        im = im.resize((max(1, int(im.width * k)), 300), Image.LANCZOS)
        c = Image.new('RGBA', (max(im.width, 220) + 20, 320), BG + (255,)); c.alpha_composite(im, ((c.width - im.width) // 2, 10))
        tiles.append(labelled(c, cap))
    row(tiles).convert('RGB').save(os.path.join(OUT, 'commander-06.png'))


def warden():
    import numpy as np
    from ad_huelock import hue_lock
    A = os.path.join(P, 'ad', 'frames')
    st = 'warden.front.stand.png'
    rgba = np.asarray(Image.open(f'{A}/warden.front/{st}').convert('RGBA')).astype(np.float64)
    locked, _ = hue_lock(rgba, '#1F6A50', 'thornwood')
    tmp = os.path.join(OUT, '_lock.png')
    Image.fromarray(np.clip(locked + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(tmp)
    row([labelled(x4(f'{A}/warden.front/{st}', k=3), 'Pro sheet: leaf-green, hue 90 to 165'),
         labelled(x4(tmp, k=3), 'cloth hue lock to 166'),
         labelled(x4(f'{A}/warden.front.rs/{st}', k=3), 'edit asking for the hex: teal, 186 to 220')]).convert('RGB').save(
        os.path.join(OUT, 'warden-green.png'))
    os.remove(tmp)


def busts():
    w = 520
    items = [('r1', 'warden.bust.g3pro', 'Nano Banana Pro', 'shield and sword in frame, classical crested helmet'),
             ('r1', 'warden.bust.nb21', 'Nano Banana 2.1', 'shield and sword behind the shoulder'),
             ('r2', 'warden.bust.g3pro', 'Nano Banana Pro', 'shield and sword still in frame'),
             ('r2', 'warden.bust.nb21', 'Nano Banana 2.1', 'the pick: the leader portraits\' framing and light')]
    tiles = []
    for rnd, n, model, cap in items:
        im = Image.open(os.path.join(P, 'raw', rnd, n + '.png')).convert('RGB').resize((w, w))
        t = Image.new('RGB', (w, w + 58), (28, 26, 23)); d = ImageDraw.Draw(t)
        d.text((8, 6), f'{rnd}: {model}', fill=(243, 238, 228), font=F14); d.text((8, 30), 'judged by eye: ' + cap, fill=(200, 192, 178), font=F14)
        t.paste(im, (0, 58)); tiles.append(t)
    sheet = Image.new('RGB', (2 * w + 24, 2 * (w + 58) + 24 + 40), (20, 18, 15))
    ImageDraw.Draw(sheet).text((10, 10), 'Warden card bust', fill=(243, 238, 228), font=font(24))
    for i, t in enumerate(tiles):
        sheet.paste(t, (8 + (i % 2) * (w + 8), 48 + (i // 2) * (w + 66)))
    sheet.save(os.path.join(OUT, 'contact-warden.bust.png'))


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    sheets(); scar(); rimfix(); wolf(); motion(); busts(); commander(); warden()
    print(sorted(os.listdir(OUT)))
