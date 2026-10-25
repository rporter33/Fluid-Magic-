"""side-by-sides against pass 2: python3 -I sbs.py <pass2 png> <this png> <out png> [crop x0,y0,x1,y1 scale]"""
import sys
from PIL import Image, ImageDraw, ImageFont
a, b, o = sys.argv[1:4]; A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB')
if len(sys.argv) > 4:
    x0, y0, x1, y1 = map(int, sys.argv[4].split(',')); k = float(sys.argv[5]) if len(sys.argv) > 5 else 1
    A = A.crop((x0, y0, x1, y1)); B = B.crop((x0, y0, x1, y1))
    if k != 1: A = A.resize((int(A.width * k), int(A.height * k)), Image.LANCZOS); B = B.resize((int(B.width * k), int(B.height * k)), Image.LANCZOS)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception: f = ImageFont.load_default()
gap, top = 16, 40; W = A.width + B.width + gap; H = max(A.height, B.height) + top
S = Image.new('RGB', (W, H), (24, 22, 20)); S.paste(A, (0, top)); S.paste(B, (A.width + gap, top)); d = ImageDraw.Draw(S)
d.text((10, 8), 'Pass 2 (current build)', fill=(235, 228, 216), font=f); d.text((A.width + gap + 10, 8), 'Pass 3 prototype "open": the range spills into hills and mountains', fill=(235, 228, 216), font=f)
S.save(o); print(o, S.size)
