# Stage B portraits, resume: a look sheet for the art director (raw candidates in a grid, labelled).
# Usage: python3 -I pt_look.py OUT.png COLS SIZE RAW [RAW ...]
import os, sys
from PIL import Image, ImageDraw, ImageFont
out, cols, size, items = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (size + 6) + 6, rows * (size + 22) + 6), (18, 17, 15))
dr = ImageDraw.Draw(sheet)
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
for i, it in enumerate(items):
    x, y = 6 + (i % cols) * (size + 6), 6 + (i // cols) * (size + 22)
    sheet.paste(Image.open(it).convert('RGB').resize((size, size), Image.LANCZOS), (x, y + 18))
    dr.text((x, y + 1), os.path.basename(it).replace('.nb21.png', ''), fill=(230, 220, 200), font=f)
sheet.save(out)
