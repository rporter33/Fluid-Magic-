# cmdA2: the facing review by eye: chosen cells of each raw sheet, cropped from the 4 x 4 grid, side by side.
# Usage: python3 facing_board.py OUT.png CELL[,CELL] SHEET.png ...
import sys
from PIL import Image, ImageDraw
CELLS = ['stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'recoil', 'actA', 'actB', 'fall', 'deadA',
         'deadB', 'fleeA', 'fleeB', 'cheer']
out, cells, sheets = sys.argv[1], sys.argv[2].split(','), sys.argv[3:]
S = 200
W = Image.new('RGB', (len(cells) * S + 120, len(sheets) * S), (20, 18, 15)); d = ImageDraw.Draw(W)
for r, sh in enumerate(sheets):
    im = Image.open(sh).convert('RGB'); q = im.width // 4
    d.text((4, r * S + 90), sh.split('/')[-1][:16], fill=(235, 230, 215))
    for c, name in enumerate(cells):
        i = CELLS.index(name)
        cr = im.crop(((i % 4) * q, (i // 4) * q, (i % 4 + 1) * q, (i // 4 + 1) * q)).resize((S, S))
        W.paste(cr, (120 + c * S, r * S))
        if r == 0:
            d.text((124 + c * S, 2), name, fill=(255, 255, 0))
W.save(out)
