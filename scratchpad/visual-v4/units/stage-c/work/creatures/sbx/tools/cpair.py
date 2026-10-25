# Stage C creatures: a raw sheet beside its clay guide (for looking). Usage: python3 cpair.py RAW GUIDE OUT [W]
import sys
from PIL import Image
raw, guide, out = sys.argv[1:4]
w = int(sys.argv[4]) if len(sys.argv) > 4 else 900
a, b = Image.open(raw).convert('RGB'), Image.open(guide).convert('RGB')
a = a.resize((w, int(a.height * w / a.width))); b = b.resize((w, int(b.height * w / b.width)))
o = Image.new('RGB', (w * 2 + 10, max(a.height, b.height)), (30, 30, 30)); o.paste(a, (0, 0)); o.paste(b, (w + 10, 0)); o.save(out)
