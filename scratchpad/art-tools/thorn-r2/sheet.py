import sys, glob, os
from PIL import Image, ImageDraw
# usage: sheet.py UNIT_DIR [OUT]  -> 4x2 grid of 200px faces with labels
d = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(d, 'sheet.png')
files = sorted(f for f in glob.glob(os.path.join(d, '*.png')) if '__' in os.path.basename(f) and not os.path.basename(f).startswith('_'))
S, cols, pad, lab = 200, 4, 8, 18
rows = (len(files) + cols - 1) // cols
W = cols * (S + pad) + pad; H = rows * (S + pad + lab) + pad
sheet = Image.new('RGB', (W, H), (24, 22, 20)); dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    r, c = divmod(i, cols); x = pad + c * (S + pad); y = pad + r * (S + pad + lab)
    sheet.paste(Image.open(f).convert('RGB').resize((S, S), Image.LANCZOS), (x, y))
    dr.text((x + 2, y + S + 3), os.path.basename(f).split('__', 1)[1].replace('.png', ''), fill=(220, 210, 190))
sheet.save(out); print(out, len(files))
