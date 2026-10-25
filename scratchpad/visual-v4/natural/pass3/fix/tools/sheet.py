# contact sheet: python3 sheet.py <dir> [out] [maxw]: every png in dir (sorted) scaled to fit a cell, labelled
import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(d, '_sheet.png'); cw = int(sys.argv[3]) if len(sys.argv) > 3 else 720
fs = sorted(f for f in os.listdir(d) if f.endswith('.png') and not f.startswith('_'))
ims = []
for f in fs:
    im = Image.open(os.path.join(d, f)).convert('RGB'); s = min(cw / im.width, 1.0 if im.width > cw else 2.0); im = im.resize((int(im.width * s), int(im.height * s)))
    dr = ImageDraw.Draw(im); dr.rectangle([0, 0, 8 * len(f) + 8, 14], fill=(0, 0, 0)); dr.text((4, 1), f, fill=(255, 255, 255)); ims.append(im)
cols = 2; rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
W = cols * cw + (cols - 1) * 6; H = sum(max(i.height for i in r) for r in rows) + 6 * len(rows)
sh = Image.new('RGB', (W, H), (30, 30, 30)); y = 0
for r in rows:
    x = 0
    for im in r: sh.paste(im, (x, y)); x += cw + 6
    y += max(i.height for i in r) + 6
sh.save(out); print(out, sh.size)
