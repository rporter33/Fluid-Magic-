# Lays screenshots out in a titled grid. Usage:
#   python3 -I compose.py <out.png> <cols> <cell width> <crop l,t,r,b or -> <title>|<path> [<title>|<path> ...]
# The crop (CSS px of the 1440 x 900 shot) is applied to every image whose size is 1440 x 900; others are scaled whole.
import sys
from PIL import Image, ImageDraw, ImageFont
out, ncol, cw, crop = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
items = [a.split('|', 1) for a in sys.argv[5:]]
box = None if crop == '-' else tuple(int(v) for v in crop.split(','))
def font(sz):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        try: return ImageFont.truetype(p, sz)
        except OSError: pass
    return ImageFont.load_default()
F = font(15)
cells = []
for title, path in items:
    im = Image.open(path).convert('RGB')
    if box and im.size == (1440, 900): im = im.crop(box)
    im = im.resize((cw, round(im.height * cw / im.width)), Image.LANCZOS)
    cells.append((title, im))
ch = max(im.height for _, im in cells); th = 26; gap = 10
nrow = (len(cells) + ncol - 1) // ncol
W = gap + ncol * (cw + gap); H = gap + nrow * (th + ch + gap)
S = Image.new('RGB', (W, H), (28, 26, 23)); d = ImageDraw.Draw(S)
for k, (title, im) in enumerate(cells):
    x = gap + (k % ncol) * (cw + gap); y = gap + (k // ncol) * (th + ch + gap)
    d.text((x, y + 4), title, fill=(240, 232, 214), font=F); S.paste(im, (x, y + th))
S.save(out); print('wrote', out, S.size)
