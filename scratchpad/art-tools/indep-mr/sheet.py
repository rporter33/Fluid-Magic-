import sys, os
from PIL import Image, ImageDraw
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/art-gen/round2/independentCaptain'
outfit = sys.argv[1]; T = int(sys.argv[2]) if len(sys.argv) > 2 else 260
cols, pad, lab = 4, 6, 18
sheet = Image.new('RGB', (cols * (T + pad) + pad, 3 * (T + pad + lab) + pad), (24, 23, 21))
d = ImageDraw.Draw(sheet)
for i in range(12):
    p = f'{D}/independent__independentCaptain-{outfit}__{i+1:02d}.png'
    x = pad + (i % cols) * (T + pad); y = pad + (i // cols) * (T + pad + lab)
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert('RGB').resize((T, T), Image.LANCZOS), (x, y))
    d.text((x + 2, y + T + 3), f'{outfit} {i+1:02d}', fill=(220, 215, 200))
out = sys.argv[3] if len(sys.argv) > 3 else f'{D}/sheet-{outfit}.png'
sheet.save(out); print(out)
