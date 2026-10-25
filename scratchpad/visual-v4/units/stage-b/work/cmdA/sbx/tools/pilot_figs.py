# The pilot's review images (../pilot/): per-piece contact sheets of every raw sheet by round and model, the picks'
# sliced frames with a pose strip and a feet overlay, the 40 px look, the Salamander beside its card portrait and
# the procedural body, and the Warden's card bust beside two leader portraits. Usage: python3 pilot_figs.py
import glob, json, os, shutil, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
import pilot_metrics as PM  # noqa: E402

PIL_DIR = os.path.join(ROOT, 'pilot')
REPO = '/home/user/Fluid-Magic-'
PICKS = json.load(open(os.path.join(PIL_DIR, 'picks.json')))
MEAS = json.load(open(os.path.join(PIL_DIR, 'measures.json')))
MODEL = {'nb21': 'Nano Banana 2.1', 'g3pro': 'Nano Banana Pro (gemini-3-pro-image)', 'nbpro': 'Nano Banana Pro (nano-banana-pro-preview)'}
BG = (142, 142, 120)


def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


F14, F18, F24 = font(14), font(18), font(24)


def caption(m):
    if 'error' in m:
        return 'pipeline error'
    if 'identity' in m:
        return f"camera IoU {m['camera']['iou']:.2f} {'ok' if m['camera']['pass'] else 'FAIL'} | identity dE {m['identity']['dE2000']}"
    ca = m['cameraAll']
    return (f"camera cells {ca['follow']} | side {100 * m['side']['share']:.0f}% | march IoU {m['variety'].get('marchIoU') or '-'}"
            f" | cons dE {m['consistency']['maxDE'][1]}")


def contact(piece, names, out, w=520):
    tiles = []
    for n in names:
        p = os.path.join(PIL_DIR, 'raw', n + '.png')
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert('RGB')
        im = im.resize((w, int(im.height * w / im.width)))
        rnd, rest = n.split('/')
        m = rest.rsplit('.', 1)[1]
        meas = MEAS.get(n, {})
        head = Image.new('RGB', (w, 58), (28, 26, 23))
        d = ImageDraw.Draw(head)
        tag = ('repaint of the Pro sheet by ' if '.rs.' in rest else '') + MODEL[m]
        d.text((8, 6), f'{rnd}: {tag}', fill=(243, 238, 228), font=F14)
        d.text((8, 30), caption(meas) if meas else 'second failure (not keyable or wrong camera): reported, not used', fill=(200, 192, 178), font=F14)
        t = Image.new('RGB', (w, im.height + 58)); t.paste(head, (0, 0)); t.paste(im, (0, 58))
        tiles.append(t)
    cols = 3
    rows = (len(tiles) + cols - 1) // cols
    H = max(t.height for t in tiles)
    sheet = Image.new('RGB', (cols * w + (cols + 1) * 8, rows * H + (rows + 1) * 8 + 40), (20, 18, 15))
    ImageDraw.Draw(sheet).text((10, 10), piece, fill=(243, 238, 228), font=F24)
    for i, t in enumerate(tiles):
        sheet.paste(t, (8 + (i % cols) * (w + 8), 48 + (i // cols) * (H + 8)))
    sheet.save(out)


def pose_strip(frames_dir, fig, view, out, h=150):
    meta = json.load(open(os.path.join(frames_dir, f'{fig}.{view}.json')))
    fr = [f for f in meta['frames'] if not f.get('missing')]
    k = h / max(f['height'] for f in fr if f['name'] == 'stand')
    cells = []
    for f in fr:
        im = Image.open(os.path.join(frames_dir, f['file'])).convert('RGBA')
        im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
        c = Image.new('RGBA', (int(h * 2.1), int(h * 1.5) + 20), BG + (255,))
        ax, ay = f['anchor'][0] * k, f['anchor'][1] * k
        c.alpha_composite(im, (int(c.width / 2 - ax), int(c.height - 26 - ay)))
        ImageDraw.Draw(c).text((4, c.height - 18), f['name'], fill=(28, 26, 23), font=F14)
        cells.append(c)
    cols = 8
    rows = (len(cells) + cols - 1) // cols
    W, H = cells[0].size
    sheet = Image.new('RGBA', (cols * W, rows * H), BG + (255,))
    for i, c in enumerate(cells):
        sheet.alpha_composite(c, ((i % cols) * W, (i // cols) * H))
    # feet overlay: the upright frames stacked on their ground anchors (they must not slide)
    ov = Image.new('RGBA', (int(h * 1.6), int(h * 1.5)), BG + (255,))
    for f in fr:
        if f['name'] not in ('stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'brace', 'lopeA', 'lopeB', 'charge'):
            continue
        im = Image.open(os.path.join(frames_dir, f['file'])).convert('RGBA')
        im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
        a = np.asarray(im).copy(); a[..., 3] = (a[..., 3] * 0.28).astype(np.uint8)
        ov.alpha_composite(Image.fromarray(a), (int(ov.width / 2 - f['anchor'][0] * k), int(ov.height - 12 - f['anchor'][1] * k)))
    d = ImageDraw.Draw(ov); d.line((ov.width / 2 - 30, ov.height - 12, ov.width / 2 + 30, ov.height - 12), fill=(200, 30, 30), width=2)
    out_im = Image.new('RGBA', (sheet.width + ov.width + 10, max(sheet.height, ov.height)), BG + (255,))
    out_im.alpha_composite(sheet, (0, 0)); out_im.alpha_composite(ov, (sheet.width + 10, 0))
    out_im.convert('RGB').save(out)


def on_bg(path, h, bg=BG):
    im = Image.open(path).convert('RGBA')
    im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    c = Image.new('RGBA', (im.width + 20, h + 20), bg + (255,)); c.alpha_composite(im, (10, 10))
    return c


def labelled(img, text, w=None):
    w = w or img.width
    c = Image.new('RGBA', (max(w, img.width), img.height + 30), (28, 26, 23, 255))
    c.alpha_composite(img, (0, 30))
    ImageDraw.Draw(c).text((6, 7), text, fill=(243, 238, 228), font=F14)
    return c


def row(imgs, gap=10, bg=(20, 18, 15)):
    H = max(i.height for i in imgs)
    out = Image.new('RGBA', (sum(i.width for i in imgs) + gap * (len(imgs) + 1), H + 2 * gap), bg + (255,))
    x = gap
    for i in imgs:
        out.alpha_composite(i, (x, gap)); x += i.width + gap
    return out


def main():
    os.makedirs(os.path.join(PIL_DIR, 'review'), exist_ok=True)
    R = lambda *a: os.path.join(PIL_DIR, 'review', *a)
    # 1. contact sheets of every raw sheet, by round and model
    raws = sorted(os.path.relpath(p, os.path.join(PIL_DIR, 'raw'))[:-4] for p in glob.glob(os.path.join(PIL_DIR, 'raw', '*', '*.png')))
    order = {'r1': 0, 'r2': 1, 'r3': 2, 'r3b': 3, 'r3x': 4}
    for piece, pre in (('Cinder Warrior, back view', 'cw.back'), ('Cinder Warrior, front view', 'cw.front'),
                       ('Wolf Rider, front view (mount pipeline probe)', 'wr.front'), ('Salamander face 01, back view', 'sal.back'),
                       ('Salamander face 01, front view', 'sal.front'), ('Warden card bust', 'warden.bust')):
        names = sorted([n for n in raws if n.split('/')[1].startswith(pre + '.')], key=lambda n: (order[n.split('/')[0]], n))
        contact(piece, names, R(f'contact-{pre}.png'))
    # 2. the picks' frames: copies, pose strips with feet overlays, the 40 px look
    os.makedirs(os.path.join(PIL_DIR, 'frames'), exist_ok=True)
    look = []
    for fig, view, name in (('cinderWarrior', 'back', PICKS['cinderWarrior']['back']), ('cinderWarrior', 'front', PICKS['cinderWarrior']['front']),
                            ('wolfRider', 'front', PICKS['wolfRider']['front'])):
        src = os.path.join(PIL_DIR, 'work', name, 'frames')
        dst = os.path.join(PIL_DIR, 'frames', f'{fig}.{view}')
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        pose_strip(src, fig, view, R(f'poses-{fig}.{view}.png'))
        meta = json.load(open(os.path.join(src, f'{fig}.{view}.json')))
        st = next(f for f in meta['frames'] if f['name'] == 'stand')
        o = PM.look40(os.path.join(src, st['file']), st['anchor'], st['height'], R(f'look40-{fig}.{view}.png'))
        look.append((f'{fig} {view}', o))
    for v in ('back', 'front'):
        dst = os.path.join(PIL_DIR, 'frames', f'salamander-01.{v}')
        os.makedirs(dst, exist_ok=True)
        shutil.copy(PICKS['salamander'][v], dst)
        shutil.copy(PICKS['salamander'][v].rsplit('.', 1)[0] + '.json', dst)
    # 3. the Salamander beside its card portrait (and the procedural body it replaces)
    H = 460
    por = Image.open(f'{REPO}/art-source/portraits/cinderHorde/salamander/01.webp').convert('RGBA').resize((H, H), Image.LANCZOS)
    proc = os.path.join(ROOT, 'refs', 'mockup', 'monster.salamander.back.png')
    tiles = [labelled(por, 'approved card portrait, face 01'),
             labelled(on_bg(PICKS['salamander']['back'], H - 20), 'painted figure, back view (battle c)'),
             labelled(on_bg(PICKS['salamander']['front'], H - 20), 'painted figure, front view')]
    if os.path.exists(proc):
        from key import key_image
        rgba, _ = key_image(proc, 'green', erode=0)
        kp = os.path.join(PIL_DIR, 'work', 'procedural-salamander.keyed.png')
        Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(kp)
        tiles.append(labelled(on_bg(kp, int(H * 0.55)), 'procedural body it replaces'))
    row(tiles).convert('RGB').save(R('salamander-vs-portrait.png'))
    # identity close-up: the portrait's head beside the front view's head, at the same head width
    fr = Image.open(PICKS['salamander']['front']).convert('RGBA')
    hb = fr.getbbox()
    head = fr.crop((hb[0], int(hb[1] + 0.35 * (hb[3] - hb[1])), int(hb[0] + 0.55 * (hb[2] - hb[0])), hb[3]))
    hc = Image.new('RGBA', head.size, BG + (255,)); hc.alpha_composite(head)
    hc = hc.resize((int(hc.width * 380 / hc.height), 380), Image.LANCZOS)
    row([labelled(por.resize((380, 380)), 'portrait'), labelled(hc, 'figure head, front view')]).convert('RGB').save(R('salamander-head-identity.png'))
    # 4. the Warden's card bust beside two leader portraits (full size, card size 128, small 64)
    bust = Image.open(os.path.join(PIL_DIR, 'raw', PICKS['wardenBust'] + '.png')).convert('RGBA')
    leaders = [('thornwood/wardenCaptain/07', 'Warden Captain 07 (leader)'), ('thornwood/elderDruid/08', 'Elder Druid 08 (leader)')]
    big = [labelled(bust.resize((400, 400), Image.LANCZOS), 'Warden card bust (pilot)')] + \
          [labelled(Image.open(f'{REPO}/art-source/portraits/{p}.webp').convert('RGBA').resize((400, 400), Image.LANCZOS), t) for p, t in leaders]
    small = []
    for im in [bust] + [Image.open(f'{REPO}/art-source/portraits/{p}.webp').convert('RGBA') for p, _ in leaders]:
        a = im.resize((128, 128), Image.LANCZOS); b = im.resize((64, 64), Image.LANCZOS)
        c = Image.new('RGBA', (128 + 64 + 30, 140), (20, 18, 15, 255)); c.alpha_composite(a, (6, 6)); c.alpha_composite(b, (144, 6))
        small.append(c)
    top = row(big)
    bottom = row(small)
    out = Image.new('RGBA', (max(top.width, bottom.width), top.height + bottom.height), (20, 18, 15, 255))
    out.alpha_composite(top, (0, 0)); out.alpha_composite(bottom, (0, top.height))
    out.convert('RGB').save(R('bust-vs-leaders.png'))
    print('review images in', R(''))


if __name__ == '__main__':
    main()
