# strip.py out.png prefix N : one row of N frames shots/<prefix>-<i>.png, each 400x330, scaled 0.6
import sys
from PIL import Image
out, rows = sys.argv[1], sys.argv[2:]
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique-resume/shots/'
N = 10; sc = 0.48
w, h = int(400 * sc), int(330 * sc)
M = Image.new('RGB', (N * (w + 2), len(rows) * (h + 4)), (0, 0, 0))
for r, p in enumerate(rows):
    for i in range(N):
        try:
            im = Image.open(D + f'{p}-{i}.png').convert('RGB').resize((w, h), Image.LANCZOS)
            M.paste(im, (i * (w + 2), r * (h + 4)))
        except Exception:
            pass
M.save(out); print(M.size)
