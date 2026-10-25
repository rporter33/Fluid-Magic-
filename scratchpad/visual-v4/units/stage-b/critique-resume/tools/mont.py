# mont.py out.png cols scale img1 img2 ... (labels = file stem)
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, cols, sc = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
fs = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in fs]
w = int(ims[0].width * sc); h = int(ims[0].height * sc)
rows = (len(ims) + cols - 1) // cols
M = Image.new('RGB', (cols * (w + 4), rows * (h + 4)), (0, 0, 0))
d = ImageDraw.Draw(M)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
for i, (f, im) in enumerate(zip(fs, ims)):
    r, c = divmod(i, cols)
    x, y = c * (w + 4), r * (h + 4)
    M.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    d.text((x + 6, y + 4), os.path.basename(f)[:-4], fill=(255, 255, 0), font=font, stroke_width=2, stroke_fill=(0, 0, 0))
M.save(out); print(out, M.size)
