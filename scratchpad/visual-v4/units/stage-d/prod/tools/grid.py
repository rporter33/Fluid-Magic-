# grid.py IN.png OUT.png [step] : the frame on the plains colour with a px grid (labels every 5 steps), for setting anchors by eye
import sys
from PIL import Image, ImageDraw
im = Image.open(sys.argv[1]).convert('RGBA'); step = int(sys.argv[3]) if len(sys.argv) > 3 else 50
bg = Image.new('RGBA', im.size, (168, 167, 132, 255)); bg.alpha_composite(im); d = ImageDraw.Draw(bg)
for x in range(0, im.width, step):
    d.line([(x, 0), (x, im.height)], fill=(255, 0, 0) if x % (5 * step) == 0 else (255, 255, 255), width=1)
    if x % (5 * step) == 0: d.text((x + 2, 2), str(x), fill=(255, 0, 0))
for y in range(0, im.height, step):
    d.line([(0, y), (im.width, y)], fill=(255, 0, 0) if y % (5 * step) == 0 else (255, 255, 255), width=1)
    if y % (5 * step) == 0: d.text((2, y + 2), str(y), fill=(255, 0, 0))
bg.convert('RGB').save(sys.argv[2]); print(im.size)
