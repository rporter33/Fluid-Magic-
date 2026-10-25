# crop.py IN OUT x0 y0 x1 y1 [scale]: crop a screenshot region and upscale it (nearest) for inspection
import sys
from PIL import Image
a = sys.argv
im = Image.open(a[1]); x0, y0, x1, y1 = map(int, a[3:7]); s = float(a[7]) if len(a) > 7 else 2
c = im.crop((x0, y0, x1, y1)); c = c.resize((int(c.width * s), int(c.height * s)), Image.NEAREST); c.save(a[2])
