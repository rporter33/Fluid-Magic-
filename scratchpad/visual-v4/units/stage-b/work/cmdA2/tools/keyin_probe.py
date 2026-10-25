# cmdA2: where do keyInUnit pixels sit and how green are they (k / kbg), per sheet
import sys, numpy as np
from PIL import Image, ImageFilter
from PIL import ImageDraw
sys.path.insert(0, sys.argv[1])
import key as K
for src in sys.argv[3:]:
    kc = sys.argv[2]
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    k = K.strength(im, kc)
    border = np.concatenate([k[:6].ravel(), k[-6:].ravel(), k[:, :6].ravel(), k[:, -6:].ravel()])
    kbg = float(np.median(border))
    rgba, rep = K.key_image(src, kc, 1)
    alpha = rgba[..., 3]
    vis = alpha > 0.3
    m8 = Image.fromarray((vis * 255).astype(np.uint8))
    for _ in range(3): m8 = m8.filter(ImageFilter.MinFilter(3))
    inner = np.asarray(m8) > 127
    t = (k > 0.08) & vis & inner
    r = k[t] / kbg
    # enclosed holes: background-like (k > 0.5 kbg) components not connected to the border
    bgl = k > 0.5 * kbg
    # background reachable from the border: geodesic growth inside bgl
    reach = np.zeros_like(bgl); reach[0] = bgl[0]; reach[-1] = bgl[-1]; reach[:, 0] = bgl[:, 0]; reach[:, -1] = bgl[:, -1]
    while True:
        g = np.asarray(Image.fromarray(reach.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 127
        g &= bgl
        if (g == reach).all(): break
        reach = g
    holes = bgl & ~reach
    near_hole = np.asarray(Image.fromarray(holes.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7))) > 127
    print(src.split('/')[-1], 'kbg %.2f' % kbg, 'keyIn %.3f' % rep['keyInUnitPct'], 'n', int(t.sum()),
          'k/kbg pct10/50/90 %.2f %.2f %.2f' % tuple(np.percentile(r, [10, 50, 90])) if t.any() else '',
          'holes px', int(holes.sum()), 'keyIn near holes %.0f%%' % (100 * (t & near_hole).sum() / max(1, t.sum())))
