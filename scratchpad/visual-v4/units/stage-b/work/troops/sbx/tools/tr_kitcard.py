# Stage B troops: the kit card a card bust is painted from (plan 5.4: "made after its sheet is approved, with the sheet as
# the kit reference"): the passed sheet's front and back stand frames (rim-fixed, hue-locked), scaled up side by side on
# the portraits' dark background #1C1A17, so the bust model sees the kit and its cloth, not the camera or the grid.
# Usage: python3 tr_kitcard.py FIGURE ...   (reads ../../picks.json, writes ../../kitcards/<figure>.kit.png)
import json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..', '..'))


def frame(sheetdir, fig, view, name='stand'):
    d = os.path.join(sheetdir, 'frames')
    return Image.open(os.path.join(d, f'{fig}.{view}.{name}.png')).convert('RGBA')


def card(fig, picks):
    out = Image.new('RGBA', (1024, 576), (28, 26, 23, 255))
    x = 40
    for view in ('front', 'back'):
        im = frame(picks[fig][view]['dir'], fig, view)
        bb = im.getbbox(); im = im.crop(bb)
        k = 500 / im.height
        im = im.resize((max(1, round(im.width * k)), 500), Image.LANCZOS)
        out.alpha_composite(im, (x + (452 - im.width) // 2, 38))
        x += 492
    p = os.path.join(W, 'kitcards', f'{fig}.kit.png')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    out.convert('RGB').save(p)
    return p


if __name__ == '__main__':
    picks = json.load(open(os.path.join(W, 'picks.json')))
    for f in sys.argv[1:]:
        print(card(f, picks))
