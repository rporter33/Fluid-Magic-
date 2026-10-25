# Stage B portraits, resume: a family check sheet. Approved leader portraits beside candidates, each at 256 px and at
# 48 px (shown 1x and 3x nearest), on the card bar's dark ground. Gods are shown whole and as their 64 px card crop.
# Usage: python3 -I pt_compare.py OUT.png IMG [IMG ...]   (IMG may be a .webp leader portrait or a raw candidate .png;
#        a candidate path may be followed by ":crop=x0,y0,x1,y1" in 512 px master coordinates)
import sys
from PIL import Image, ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
out, items = sys.argv[1], sys.argv[2:]
CW = 270
sheet = Image.new('RGB', (12 + CW * len(items), 470), (18, 17, 15))
dr = ImageDraw.Draw(sheet)
f = ImageFont.truetype(FONT, 11)
for i, it in enumerate(items):
    crop = None
    if ':crop=' in it:
        it, c = it.split(':crop=')
        crop = tuple(int(v) for v in c.split(','))
    im = Image.open(it).convert('RGB')
    x = 8 + i * CW
    sheet.paste(im.resize((256, 256), Image.LANCZOS), (x, 22))
    name = '/'.join(it.split('/')[-3:])[-42:]
    dr.text((x, 4), name, fill=(220, 210, 195), font=f)
    src = im.resize((512, 512), Image.LANCZOS)
    if crop:
        src = src.crop(crop)
    s48 = src.resize((48, 48), Image.LANCZOS)
    sheet.paste(s48, (x, 290))
    sheet.paste(s48.resize((144, 144), Image.NEAREST), (x + 60, 290))
    dr.text((x, 440), '48 px (1x, 3x)' + (' card crop' if crop else ''), fill=(150, 142, 130), font=f)
sheet.save(out)
print(out, sheet.size)
