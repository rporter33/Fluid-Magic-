import sys, numpy as np
from PIL import Image
O = sys.argv[1]
for look in ['clear', 'terrain', 'supply']:
    for v in ['start', 'mid', 'ref', 'ash', 'far']:
        a = np.asarray(Image.open(f'{O}/now-{look}-{v}.png').convert('RGB')).astype(int); b = np.asarray(Image.open(f'{O}/p2-{look}-{v}.png').convert('RGB')).astype(int)
        d = np.abs(a - b).max(2); n = int((d > 0).sum()); print(look, v, 'differing px', n, 'max', int(d.max()), 'bbox', (np.argwhere(d > 0).min(0).tolist() + np.argwhere(d > 0).max(0).tolist()) if n else '-')
