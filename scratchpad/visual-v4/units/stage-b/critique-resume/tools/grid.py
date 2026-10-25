# grid.py out.png cols cell label1=path1 label2=path2 ...  (labels drawn under each image)
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols, cell = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
items = [a.split('=', 1) for a in sys.argv[4:]]
rows = (len(items) + cols - 1) // cols
lab = 22
W, H = cols * (cell + 8) + 8, rows * (cell + lab + 8) + 8
im = Image.new('RGB', (W, H), (24, 22, 20))
d = ImageDraw.Draw(im)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception:
    font = ImageFont.load_default()
for i, (l, p) in enumerate(items):
    r, c = divmod(i, cols)
    x, y = 8 + c * (cell + 8), 8 + r * (cell + lab + 8)
    try:
        a = Image.open(p).convert('RGBA')
        a.thumbnail((cell, cell), Image.LANCZOS)
        bg = Image.new('RGBA', (cell, cell), (28, 26, 23, 255))
        bg.alpha_composite(a, ((cell - a.width) // 2, (cell - a.height) // 2))
        im.paste(bg.convert('RGB'), (x, y))
    except Exception as e:
        d.text((x + 4, y + 4), 'missing', fill=(200, 80, 80), font=font)
    d.text((x + 2, y + cell + 3), l, fill=(230, 222, 210), font=font)
im.save(out)
print(out, im.size)
