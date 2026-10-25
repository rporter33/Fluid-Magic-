"""Before / after crops side by side, each scaled x2 (nearest): python3 -I sbs.py <beforeDir> <afterDir> <outDir> [names...]"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
bd, ad, od = sys.argv[1:4]; os.makedirs(od, exist_ok=True); names = sys.argv[4:] or sorted(f[:-4] for f in os.listdir(ad) if f.endswith('.png') and not f.endswith('-full.png'))
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except Exception: F = ImageFont.load_default()
for n in names:
    A, B = Image.open(f'{bd}/{n}.png').convert('RGB'), Image.open(f'{ad}/{n}.png').convert('RGB')
    k = 2 if max(A.width, A.height) < 450 else 1; A, B = A.resize((A.width * k, A.height * k), Image.NEAREST), B.resize((B.width * k, B.height * k), Image.NEAREST)
    out = Image.new('RGB', (A.width + B.width + 12, max(A.height, B.height) + 32), (24, 22, 19)); d = ImageDraw.Draw(out); out.paste(A, (0, 32)); out.paste(B, (A.width + 12, 32))
    d.text((8, 6), f'Before (pass 3, 0ae9067f)  {n}', fill=(240, 234, 220), font=F); d.text((A.width + 20, 6), 'After (line pass)', fill=(240, 234, 220), font=F); out.save(f'{od}/{n}.png'); print(n, out.size)
