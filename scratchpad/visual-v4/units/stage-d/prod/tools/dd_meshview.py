# A look at the mesh region weights: the 24 x 16 vertex grid over a frame, each vertex a dot in its strongest part's colour
# (size by that weight), over the painted frame; the head/neck weight as a heat map beside it.
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
PAL = [(230, 25, 75), (60, 180, 75), (255, 225, 25), (0, 130, 200), (245, 130, 48), (145, 30, 180), (70, 240, 240), (240, 50, 230), (210, 245, 60),
       (250, 190, 212), (0, 128, 128), (220, 190, 255), (170, 110, 40)]


def view(png, weights, out, scale=1.0):
    im = Image.open(png).convert('RGBA')
    W, H = im.size
    bg = Image.new('RGBA', im.size, (168, 167, 132, 255)); bg.alpha_composite(im)
    d = ImageDraw.Draw(bg)
    parts = list(weights)
    arr = np.stack([np.array(weights[p]) for p in parts], 0)  # P x 16 x 24
    for r in range(16):
        for c in range(24):
            x, y = c / 23 * (W - 1), r / 15 * (H - 1)
            k = int(np.argmax(arr[:, r, c])); w = arr[k, r, c]
            rad = 2 + 5 * w
            d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=PAL[k % len(PAL)] + (255,), outline=(0, 0, 0, 255))
    y0 = 4
    for k, p in enumerate(parts):
        d.rectangle([4, y0, 16, y0 + 12], fill=PAL[k % len(PAL)] + (255,)); d.text((20, y0), p, fill=(0, 0, 0, 255)); y0 += 16
    bg.convert('RGB').save(out)


if __name__ == '__main__':
    tag, action, out = sys.argv[1:4]
    rep = json.load(open(os.path.join('cut', tag, 'post.json')))
    fr = next(f for f in rep['frames'] if f['action'] == action)
    w = fr['weights']['w']
    s = np.sum([np.array(v) for v in w.values()], 0)
    print('vertex weight sums: min', round(float(s.min()), 3), 'max', round(float(s.max()), 3))
    view(os.path.join('cut', tag, fr['file']), w, out)
