#!/usr/bin/env python3
"""Contact sheet: sheet.py DIR -> DIR/sheet.png, ~200 px per face, plus a 48 px row to check silhouettes."""
import glob, os, sys
from PIL import Image, ImageDraw

d = sys.argv[1]
files = sorted(f for f in glob.glob(os.path.join(d, '*.png')) if not f.endswith('sheet.png'))
T, G, L = 200, 8, 18
sheet = Image.new('RGB', (G + len(files) * (T + G), G + T + L + 48 + G * 2), (24, 22, 20))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB')
    x = G + i * (T + G)
    sheet.paste(im.resize((T, T), Image.LANCZOS), (x, G))
    dr.text((x + 2, G + T + 3), os.path.basename(f).rsplit('__', 1)[-1].replace('.png', ''), fill=(200, 190, 170))
    sheet.paste(im.resize((48, 48), Image.LANCZOS), (x, G + T + L + G))
sheet.save(os.path.join(d, 'sheet.png'))
print(os.path.join(d, 'sheet.png'), sheet.size)
