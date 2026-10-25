# The re-rolled atlas frames before (pre-fix atlas) and after (the fix atlas), each on the battle ground as the game draws
# it (Ember's painted fire: a normal body and an added glow; Loam normal), the coil halves drawn as the game does (back half, a man's silhouette, front half).
#   python3 -I rerolls_compare.py OLD_ATLAS_DIR NEW_ATLAS_DIR OUT.jpg
import json, os, sys
from PIL import Image, ImageChops, ImageDraw
old_dir, new_dir, out = sys.argv[1:4]
GROUND = (168, 167, 132)
H = 150  # each cell's height


def load(d):
    return Image.open(os.path.join(d, 'fx-atlas.png')).convert('RGBA'), json.load(open(os.path.join(d, 'fx-atlas.json')))['frames']


def frame(at, name):
    im, fr = at
    f = fr[name]['frame']
    return im.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), fr[name].get('blend', 'normal')


def on_ground(im, blend, h=H):
    s = h / im.height if im.height > h else 1.0
    if im.width * s > 300: s = 300 / im.width
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    bg = Image.new('RGB', (im.width + 16, h + 16), GROUND)
    if blend == 'add':  # painted fire as the game draws it: a normal-blend body, then the same frame added at 0.45 as glow
        bg.paste(im, (8, 8 + h - im.height), im)
        rgb = Image.new('RGB', im.size, (0, 0, 0)); rgb.paste(im.convert('RGB'), (0, 0), im.split()[3])
        rgb = Image.eval(rgb, lambda v: int(v * 0.45))
        region = bg.crop((8, 8 + h - im.height, 8 + im.width, 8 + h))
        bg.paste(ImageChops.add(region, rgb), (8, 8 + h - im.height))
    else:
        bg.paste(im, (8, 8 + h - im.height), im)
    return bg


def coil_pair(at, stage):
    # back half, a dark man-shaped bar where the legs stand, then the front half (anchors are shared in the atlas)
    b, _ = frame(at, stage + 'B'); f, _ = frame(at, stage + 'F')
    w, h = max(b.width, f.width), max(b.height, f.height)
    c = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    c.alpha_composite(b, ((w - b.width) // 2, h - b.height))
    d = ImageDraw.Draw(c); mw = max(6, w // 7); d.rectangle([w // 2 - mw // 2, int(h * 0.05), w // 2 + mw // 2, h - 4], fill=(60, 52, 44, 255))
    c.alpha_composite(f, ((w - f.width) // 2, h - f.height))
    return c


def label(im, text):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 6 * len(text), 14], fill=(20, 18, 15)); d.text((3, 1), text, fill=(255, 240, 200)); return im


def row(cells):
    w = sum(c.width for c in cells) + 6 * (len(cells) - 1); h = max(c.height for c in cells)
    r = Image.new('RGB', (w, h), (40, 36, 30)); x = 0
    for c in cells: r.paste(c, (x, 0)); x += c.width + 6
    return r


OLD, NEW = load(old_dir), load(new_dir)
rows = []
rows.append(row([label(on_ground(*frame(OLD, n)), f'before {n} (E3.r2)') for n in ('burst4', 'burst5', 'burst6')]))
rows.append(row([label(on_ground(*frame(NEW, n)), f'after {n} (E3e.a)') for n in ('burst4', 'burst5', 'burst6')]))
rows.append(row([label(on_ground(*frame(OLD, n)), f'before {n} (L2.a)') for n in ('coil1', 'coil2', 'coil3', 'wither2')]))
rows.append(row([label(on_ground(coil_pair(NEW, s), 'normal'), f'after {s} B+F (L2h.b)') for s in ('coil1', 'coil2', 'coil3', 'dry3', 'wither2')]))
rows.append(row([label(on_ground(*frame(OLD, 'crackWide'), h=60), 'before crackWide (L3.a)'), label(on_ground(*frame(NEW, 'crackWide'), h=60), 'after crackWide (L3k.a)')]))
rows.append(row([label(on_ground(*frame(NEW, n), h=90), f'after {n} (L3k.a)') for n in ('crackHead', 'crackHead2', 'clod1', 'clod3', 'clod5')]))
rows.append(row([label(on_ground(*frame(NEW, n), h=120), f'new {n}') for n in ('glyphRingR', 'glyphR', 'glyphRingG', 'glyphG')]))
W = max(r.width for r in rows)
G = Image.new('RGB', (W, sum(r.height + 6 for r in rows) - 6), (40, 36, 30)); y = 0
for r in rows: G.paste(r, (0, y)); y += r.height + 6
G.save(out, quality=88)
print(out, G.size)
