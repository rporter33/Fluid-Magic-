# strip2.py out.png prefix... : rows of 8 frames s2-*.png (360x300) at 0.6
import sys
from PIL import Image, ImageDraw, ImageFont
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique-resume/shots/'
out, rows = sys.argv[1], sys.argv[2:]
N, sc = 8, 0.6
w, h = int(360 * sc), int(300 * sc)
M = Image.new('RGB', (N * (w + 2), len(rows) * (h + 18)), (0, 0, 0))
d = ImageDraw.Draw(M); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
for r, p in enumerate(rows):
    d.text((2, r * (h + 18)), p, fill=(255, 255, 0), font=f)
    for i in range(N):
        try:
            im = Image.open(D + f'{p}-{i}.png').convert('RGB').resize((w, h), Image.LANCZOS)
            M.paste(im, (i * (w + 2), r * (h + 18) + 16))
        except Exception:
            pass
M.save(out); print(M.size)
