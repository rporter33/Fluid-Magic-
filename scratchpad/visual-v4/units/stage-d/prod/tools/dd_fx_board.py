# Review boards for the new effect sheets: each candidate's keyed sheet composited with its game blend on the plains
# ground of battle a (#A8A784) and, for light (additive), also on the dark ground; candidates a and b side by side.
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import dd_fx  # noqa: E402
FX = dd_fx.FX
PLAINS = np.array([168, 167, 132.]) / 255; DARK = np.array([28, 26, 23.]) / 255


def comp(sheet, cand, ground, blend):
    p = os.path.join(FX, 'cut', f'{sheet}.{cand}', 'keyed.png')
    k = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255
    rgb, a = k[..., :3], k[..., 3:4]
    g = np.ones_like(rgb) * ground
    if blend == 'add':
        b = np.clip(a * 1.7, 0, 1)  # the pilot's fire treatment: the body in normal blend (alpha x1.7), then the glow added
        out = g * (1 - b) + rgb * b
        out = np.clip(out + rgb * a, 0, 1)
    elif blend == 'multiply':
        out = g * (rgb * a + 1 - a)
    elif blend == 'luma':
        out = g * (1 - a * 0.8) + rgb * 0.75 * a * 0.8
    else:
        out = g * (1 - a) + rgb * a
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


def main(sheets, out):
    tiles = []
    for s in sheets:
        bl = dd_fx.SHEETS[s]['blend']
        row = []
        for c in ('a', 'b'):
            im = comp(s, c, PLAINS, bl)
            if bl == 'add':
                d = comp(s, c, DARK, bl)
                w = Image.new('RGB', (im.width, im.height * 2)); w.paste(im, (0, 0)); w.paste(d, (0, im.height)); im = w
            im.thumbnail((900, 1000)); row.append(im)
        tiles.append(row)
    W = sum(max(r[i].width for r in tiles) for i in range(2)) + 12
    H = sum(max(x.height for x in r) + 8 for r in tiles)
    B = Image.new('RGB', (W, H), (50, 50, 50)); y = 0
    for r in tiles:
        x = 0
        for im in r:
            B.paste(im, (x, y)); x += im.width + 12
        y += max(i.height for i in r) + 8
    B.save(out); print(out, B.size)


if __name__ == '__main__':
    main(sys.argv[2:], sys.argv[1])
