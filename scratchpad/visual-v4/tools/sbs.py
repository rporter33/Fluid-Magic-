# Side by side for look only: ours | reference, both scaled to the same height.
import sys
from PIL import Image, ImageDraw, ImageFont
ours, ref, out = sys.argv[1:4]
H = 900
a = Image.open(ours).convert('RGB')
b = Image.open(ref).convert('RGB')
b = b.crop((263, 0, 2598, b.height))  # the reference's game area, without the side bars
a = a.resize((round(a.width * H / a.height), H), Image.LANCZOS)
b = b.resize((round(b.width * H / b.height), H), Image.LANCZOS)
pad = 12
img = Image.new('RGB', (a.width + b.width + pad, H + 40), (20, 18, 15))
img.paste(a, (0, 40)); img.paste(b, (a.width + pad, 40))
d = ImageDraw.Draw(img)
try:
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
except Exception:
    f = ImageFont.load_default()
d.text((12, 8), 'ours (procedural placeholder art, real sim battle)', fill=(240, 234, 220), font=f)
d.text((a.width + pad + 12, 8), 'reference (direction only)', fill=(240, 234, 220), font=f)
img.save(out)
print(out, img.size)
