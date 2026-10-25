# A shoot.cjs series magnified with nearest-neighbour pixels (so play-zoom detail stays honest), in a labelled grid.
#   python3 -I fix_shots_mag.py SERIES.json COLS FACTOR OUT.jpg
import json, sys
from PIL import Image, ImageDraw
src, cols, k, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
d = json.load(open(src))
ims = []
for o in d['out']:
    im = Image.open(o['file']).convert('RGB')
    im = im.resize((im.width * k, im.height * k), Image.NEAREST)
    dr = ImageDraw.Draw(im)
    lab = f"{o['rel']:+.3f}s  man {o['man']}px (x{k})"
    dr.rectangle([0, 0, 8 + 7 * len(lab), 16], fill=(20, 18, 15))
    dr.text((4, 2), lab, fill=(255, 240, 200))
    ims.append(im)
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
G = Image.new('RGB', (cols * w + (cols - 1) * 4, rows * h + (rows - 1) * 4), (40, 36, 30))
for i, im in enumerate(ims):
    G.paste(im, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
G.save(out, quality=88)
