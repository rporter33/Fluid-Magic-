"""Side by side: pass 2's shot (left) against this prototype's (right), each labelled. Usage: python3 -I sbs.py left.png right.png out.png [crop x0,y0,x1,y1]"""
import sys
from PIL import Image, ImageDraw, ImageFont
a, b, o = sys.argv[1:4]; crop = [int(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 else None
A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
if crop: A, B = A.crop(crop), B.crop(crop)
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
except Exception: F = ImageFont.load_default()
W, H = A.width + B.width + 12, max(A.height, B.height) + 40; out = Image.new('RGB', (W, H), (24, 22, 19)); d = ImageDraw.Draw(out)
out.paste(A, (0, 40)); out.paste(B, (A.width + 12, 40))
d.text((10, 8), 'Pass 2 (current build)', fill=(240, 234, 220), font=F); d.text((A.width + 22, 8), 'Pass 3 prototype: sculpted massif', fill=(240, 234, 220), font=F)
out.save(o); print(o, out.size)
