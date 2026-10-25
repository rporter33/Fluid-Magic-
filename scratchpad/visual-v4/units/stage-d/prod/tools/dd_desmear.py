# Rest of stage D, art director's fix (zero generations): Salamander 02 front tail-lash has a painted motion smear, a grey
# streak tinted by the green key, above the tail; the keyer keeps it as opaque grey-green matter. The smear pixels (green
# above both red and blue by more than 6, inside the tail-lash cell, the components touching the streak) are set to the key
# green in a cleaned copy of the raw, which is then post-processed as its own tag (prod/fixes/<raw>.clean.png). The raw stays.
import json, os, shutil, sys
import numpy as np
from PIL import Image
from PIL import ImageFilter


def morph(m, f, size):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(f(size))) > 127


HERE = os.path.dirname(os.path.abspath(__file__)); PROD = os.path.abspath(os.path.join(HERE, '..'))
RAW = os.path.join(PROD, '..', 'raw', 'act.salamander-02.front.S.nb21.2k.png')
OUT = os.path.join(PROD, 'fixes', 'act.salamander-02.front.S.nb21.2k.clean.png')
a = np.asarray(Image.open(RAW).convert('RGB')).astype(int)
H, W = a.shape[:2]
g = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
keyish = (a[..., 1] > 200) & (a[..., 0] < 60) & (a[..., 2] < 60)
m = (g > 6) & ~keyish
cell = np.zeros_like(m); cell[:H // 2, W // 2:] = True   # the tail-lash cell (upper right)
m &= cell
m = morph(morph(m, ImageFilter.MinFilter, 5), ImageFilter.MaxFilter, 5)          # opening: specks out
keep = morph(morph(m, ImageFilter.MaxFilter, 7), ImageFilter.MinFilter, 7)       # closing: the streak whole
keep = morph(keep, ImageFilter.MaxFilter, 5) & ((g > 0) | keyish | keep)        # two px out, only into greenish pixels
out = a.copy(); out[keep] = (0, 255, 0)
Image.fromarray(out.astype(np.uint8)).save(OUT)
meta = json.load(open(RAW.rsplit('.png', 1)[0] + '.json'))
meta['cleanedBy'] = 'prod/tools/dd_desmear.py: grey-green motion smear above the tail-lash tail set to key green (%d px)' % int(keep.sum())
json.dump(meta, open(OUT.rsplit('.png', 1)[0] + '.json', 'w'), indent=1)
pr = a[:H // 2, W // 2:].copy(); pr[keep[:H // 2, W // 2:]] = (255, 0, 255)
Image.fromarray(np.concatenate([a[:H // 2, W // 2:], pr], 1).astype(np.uint8)).resize((1024, 512)).save(os.path.join(PROD, 'look', 'final', 'sal02-desmear-proof.png'))
print(OUT, int(keep.sum()))
