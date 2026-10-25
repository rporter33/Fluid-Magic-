#!/usr/bin/env python3
"""sheet.py DIR [OUT] [--size N]: contact sheet of every *.png (not sheet*) in DIR, 4 per row, labelled."""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
args = sys.argv[1:]
size = 200
if '--size' in args:
    i = args.index('--size'); size = int(args[i + 1]); del args[i:i + 2]
d = args[0]; out = args[1] if len(args) > 1 else os.path.join(d, 'sheet.png')
files = sorted(f for f in glob.glob(os.path.join(d, '*.png')) if not os.path.basename(f).startswith('sheet'))
cols = 4; rows = (len(files) + cols - 1) // cols; pad = 8; lab = 18
W = cols * (size + pad) + pad; H = rows * (size + pad + lab) + pad
sheet = Image.new('RGB', (W, H), (24, 22, 20)); dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except OSError: font = ImageFont.load_default()
for k, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((size, size), Image.LANCZOS)
    x = pad + (k % cols) * (size + pad); y = pad + (k // cols) * (size + pad + lab)
    sheet.paste(im, (x, y))
    dr.text((x + 2, y + size + 2), os.path.basename(f).split('__')[-1].replace('.png', '') + f'  {Image.open(f).size[0]}px', fill=(200, 190, 170), font=font)
sheet.save(out); print(out, len(files))
