# Probe: share of a frame's opaque paint whose OKLab hue lies near the key's hue (key contamination in the paint itself).
import sys, os, json
import numpy as np
from PIL import Image
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/tools')
from v4color import to_oklab
KEYH = {}
for k, c in {'green': (0, 255, 0), 'magenta': (255, 0, 255), 'blue': (0, 0, 255)}.items():
    lab = to_oklab(np.array([[c]], np.float64))[0, 0]; KEYH[k] = np.degrees(np.arctan2(lab[2], lab[1])) % 360
def probe(path, kc, win=40, cmin=0.03):
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.float64)
    m = a[..., 3] > 200
    lab = to_oklab(a[..., :3])
    C = np.hypot(lab[..., 1], lab[..., 2]); h = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
    dh = np.abs((h - KEYH[kc] + 180) % 360 - 180)
    hit = m & (dh < win) & (C > cmin)
    return int(hit.sum()), int(m.sum())
if __name__ == '__main__':
    kc = sys.argv[1]
    for d in sys.argv[2:]:
        tot = [0, 0]
        for f in sorted(os.listdir(d)):
            if f.endswith('.png') and 'white' not in f:
                h, n = probe(os.path.join(d, f), kc); tot[0] += h; tot[1] += n
        print(f'{os.path.basename(d.rstrip("/"))[:50]:50s} key {kc} hue {KEYH[kc]:.0f}: {100*tot[0]/max(1,tot[1]):.2f}% of opaque px near the key hue')
