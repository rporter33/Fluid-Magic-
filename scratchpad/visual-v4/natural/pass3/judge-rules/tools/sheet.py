"""2 x 2 sheets of the judge's shots (pass 2, relief, massif, open) for one view, optionally cropped and scaled: python3 -I sheet.py <suffix> <out> [x0 y0 x1 y1] [scale]"""
import sys
from PIL import Image, ImageDraw
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-rules/shots/'
suf, out = sys.argv[1], sys.argv[2]; box = tuple(int(x) for x in sys.argv[3:7]) if len(sys.argv) >= 7 else None; sc = float(sys.argv[7]) if len(sys.argv) >= 8 else 1.0
names = [('p2', 'Pass 2 (live)'), ('relief', 'Continuous relief'), ('massif', 'Sculpted massif'), ('open', 'Open (spill)')]
ims = []
for p, t in names:
    im = Image.open(f'{S}{p}-{suf}.png').convert('RGB')
    if box: im = im.crop(box)
    if sc != 1: im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
    ims.append((t, im))
w, h = ims[0][1].size; sheet = Image.new('RGB', (2 * w + 10, 2 * (h + 24) + 10), (16, 16, 16)); d = ImageDraw.Draw(sheet)
for k, (t, im) in enumerate(ims):
    x, y = (k % 2) * (w + 10), (k // 2) * (h + 34); sheet.paste(im, (x, y + 24)); d.text((x + 6, y + 5), t, fill=(240, 240, 240))
sheet.save(S + out); print(out, sheet.size)
