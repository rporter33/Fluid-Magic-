# cmdA2: the keyInUnit pixels: how key-like is their colour (relative key excess k / max channel) and their hue
import sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, sys.argv[1])
import key as K
kc = sys.argv[2]
for src in sys.argv[3:]:
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    k = K.strength(im, kc)
    rgba, rep = K.key_image(src, kc, 1)
    alpha = rgba[..., 3]; vis = alpha > 0.3
    m8 = Image.fromarray((vis * 255).astype(np.uint8))
    for _ in range(3): m8 = m8.filter(ImageFilter.MinFilter(3))
    inner = np.asarray(m8) > 127
    t = (k > 0.08) & vis & inner
    rel = k / np.maximum(im.max(-1), 1e-3)
    mx = im.max(-1)
    r = rel[t]
    print(src.split('/')[-1], 'keyIn', rep['keyInUnitPct'], 'n', int(t.sum()), 'rel p10/50/90 %.2f %.2f %.2f' % tuple(np.percentile(r, [10, 50, 90])),
          'max p50 %.2f' % np.median(mx[t]), 'share rel>=0.5: %.0f%%' % (100 * (r >= 0.5).mean()), 'rel>=0.35: %.0f%%' % (100 * (r >= 0.35).mean()))
    # same stats for all visible inner pixels (the figure's own paint)
    allr = rel[vis & inner & (k <= 0.08)]
    print('   figure paint rel p99 %.2f, share >=0.35 %.3f%%' % (np.percentile(allr, 99), 100 * (allr >= 0.35).mean()))
