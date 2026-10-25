# python3 -I sheet.py out.png a.png b.png c.png d.png: four screenshots at half size in a 2 x 2 sheet, each labeled
import sys
from PIL import Image, ImageDraw, ImageFont
out, files = sys.argv[1], sys.argv[2:]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
ims = [Image.open(f).convert('RGB') for f in files]
w, h = 720, 450
sheet = Image.new('RGB', (w * 2, (h + 22) * ((len(ims) + 1) // 2)), (24, 22, 20)); d = ImageDraw.Draw(sheet)
for k, (f, im) in enumerate(zip(files, ims)):
    t = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).crop((0, 0, w, h)); x, y = (k % 2) * w, (k // 2) * (h + 22)
    sheet.paste(t, (x, y + 22)); d.text((x + 6, y + 2), f.split('/')[-1], fill=(233, 228, 216), font=font)
sheet.save(out); print(out, sheet.size)
