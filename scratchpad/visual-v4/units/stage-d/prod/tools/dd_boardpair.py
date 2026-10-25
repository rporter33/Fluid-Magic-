# Two figure-view boards stacked (dd_board.py), downscaled to fit 2000 px, for the art director's look.
import sys
from PIL import Image
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import dd_board
out = sys.argv[1]; pairs = [a.split(':') for a in sys.argv[2:]]
ims = [Image.open(dd_board.board(f, v)[0]) for f, v in pairs]
W = max(i.width for i in ims); H = sum(i.height + 10 for i in ims)
B = Image.new('RGB', (W, H), (30, 30, 30)); y = 0
for i in ims:
    B.paste(i, (0, y)); y += i.height + 10
B.thumbnail((2000, 2400)); B.save(out); print(out, B.size)
