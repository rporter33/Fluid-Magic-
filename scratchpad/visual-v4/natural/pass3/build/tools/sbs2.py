# sbs2.py out.png scale a.png b.png [c.png ...]: side by side with a 10 px gap
import sys
from PIL import Image
o, k = sys.argv[1], float(sys.argv[2]); ims = [Image.open(f).convert('RGB') for f in sys.argv[3:]]
W = sum(i.width for i in ims) + 10 * (len(ims) - 1); H = max(i.height for i in ims); c = Image.new('RGB', (W, H), (255, 255, 255)); x = 0
for i in ims: c.paste(i, (x, 0)); x += i.width + 10
c = c.resize((int(c.width * k), int(c.height * k)), Image.NEAREST if k >= 2 else Image.LANCZOS); c.save(o)
