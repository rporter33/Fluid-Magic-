# side-by-side crops: python3 -I sbs.py out.png scale "file1:x0,y0,x1,y1" "file2:x0,y0,x1,y1" ...  (labels from file names)
import sys
from PIL import Image, ImageDraw
out, k = sys.argv[1], float(sys.argv[2]); tiles = []
for a in sys.argv[3:]:
    f, box = a.rsplit(':', 1); b = [int(v) for v in box.split(',')]
    im = Image.open(f).convert('RGB').crop(b); im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
    d = ImageDraw.Draw(im); t = f.split('/')[-1]; d.rectangle([0, 0, 7 * len(t) + 8, 16], fill=(0, 0, 0)); d.text((4, 2), t, fill=(255, 255, 255)); tiles.append(im)
W = sum(t.width for t in tiles) + 6 * (len(tiles) - 1); H = max(t.height for t in tiles)
s = Image.new('RGB', (W, H), (40, 40, 40)); x = 0
for t in tiles: s.paste(t, (x, 0)); x += t.width + 6
s.save(out); print(out, s.size)
