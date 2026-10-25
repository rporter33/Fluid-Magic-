# Stage B, key "cmdB": lays a camera-correct sheet keyed from its own key colour onto another flat key colour, so a
# Nano Banana 2.1 edit or re-dress can use it as Image 1 and keep the new key (cmdA did the same for its blue
# references, cw.*.onblue.png). Thornwood uses the magenta key (art plan 5.2): its moss and pine greens rule out green.
# Usage: python3 cmdb_onkey.py RAW.png FROMKEY TOKEY OUT.png
import os, subprocess, sys, tempfile
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
FLAT = {'magenta': (255, 0, 255), 'blue': (0, 0, 255), 'green': (0, 255, 0)}
raw, fk, tk, out = sys.argv[1:5]
with tempfile.TemporaryDirectory() as d:
    kp = os.path.join(d, 'k.png')
    subprocess.run([sys.executable, '-I', os.path.join(HERE, 'key.py'), raw, kp, fk], check=True, capture_output=True)
    k = np.asarray(Image.open(kp).convert('RGBA')).astype(np.float64)
a = k[..., 3:4] / 255
bg = np.array(FLAT[tk], np.float64)
img = k[..., :3] * a + bg * (1 - a)
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
Image.fromarray(np.clip(img + 0.5, 0, 255).astype(np.uint8), 'RGB').save(out)
print('ok', out)
