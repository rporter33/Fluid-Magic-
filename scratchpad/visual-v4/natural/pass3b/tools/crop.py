"""crop and upscale regions of shots side by side: python3 -I crop.py out.png scale x0,y0,x1,y1 in1.png [in2.png ...] (labels = file names)"""
import sys
from PIL import Image, ImageDraw
out, sc, box = sys.argv[1], float(sys.argv[2]), [int(v) for v in sys.argv[3].split(',')]
ims = [Image.open(f).convert('RGB').crop(box) for f in sys.argv[4:]]
ims = [im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS) for im in ims]
W = sum(im.width for im in ims) + 8 * (len(ims) - 1); H = max(im.height for im in ims) + 18
o = Image.new('RGB', (W, H), (20, 18, 15)); d = ImageDraw.Draw(o); x = 0
for f, im in zip(sys.argv[4:], ims): o.paste(im, (x, 18)); d.text((x + 4, 3), f.split('/')[-1], fill=(230, 220, 200)); x += im.width + 8
o.save(out)
