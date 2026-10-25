"""side by side: python3 -I sbs.py out.png box(x0,y0,x1,y1 or 'full') scale labelA a.png labelB b.png"""
import sys
from PIL import Image, ImageDraw
out, box, sc = sys.argv[1], sys.argv[2], float(sys.argv[3]); pairs = list(zip(sys.argv[4::2], sys.argv[5::2])); ims = []
for lab, f in pairs:
    im = Image.open(f).convert('RGB')
    if box != 'full': im = im.crop(tuple(int(v) for v in box.split(',')))
    ims.append((lab, im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)))
W = sum(i.width for _, i in ims) + 10 * (len(ims) - 1); H = max(i.height for _, i in ims) + 24
o = Image.new('RGB', (W, H), (20, 18, 15)); d = ImageDraw.Draw(o); x = 0
for lab, i in ims: o.paste(i, (x, 24)); d.text((x + 6, 6), lab, fill=(235, 225, 205)); x += i.width + 10
o.save(out)
