# Crop and tile shots for review: python3 crops.py OUT.png SCALE x0,y0,x1,y1 file1 [file2 ...]
# Each crop is enlarged SCALE times (Lanczos) and labelled with the beat name taken from the file name.
import sys
from PIL import Image, ImageDraw
out, scale, box = sys.argv[1], float(sys.argv[2]), [int(v) for v in sys.argv[3].split(',')]
files = sys.argv[4:]
tiles = []
for f in files:
    im = Image.open(f).convert('RGB').crop(box)
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    name = f.rsplit('/', 1)[-1].rsplit('.', 1)[0]
    d.rectangle([0, 0, 8 + 7 * len(name), 18], fill=(20, 20, 20))
    d.text((4, 3), name, fill=(255, 255, 255))
    tiles.append(im)
cols = 2 if len(tiles) > 1 else 1
w, h = tiles[0].size
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (w * cols + 4 * (cols - 1), h * rows + 4 * (rows - 1)), (0, 0, 0))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
sheet.save(out)
print(out, sheet.size)
