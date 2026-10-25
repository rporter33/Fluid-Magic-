# Contact sheet: a labelled grid of images, each fitted into a cell (aspect kept), on a dark ground.
# Usage: python3 -I contact.py OUT.png CELL_PX COLS IMG [IMG ...]
import os, sys
from PIL import Image, ImageDraw

out, cell, cols, files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
lab = 16
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cell, rows * (cell + lab)), (28, 26, 23))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGBA')
    k = min(cell / im.width, cell / im.height)
    im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    x, y = (i % cols) * cell, (i // cols) * (cell + lab)
    sheet.paste(im, (x + (cell - im.width) // 2, y + lab + (cell - im.height) // 2), im)
    d.text((x + 4, y + 2), os.path.basename(f)[:40], fill=(230, 225, 214))
sheet.save(out)
print(out, sheet.size)
