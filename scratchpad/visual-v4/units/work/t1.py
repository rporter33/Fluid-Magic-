import sys, time
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/tools')
import numpy as np
from PIL import Image
from sdf import Scene, render
from rigs import humanoid, place
gear = dict(weapon='axe', shield='round', helm='crest', cape=True)
out = []
t0 = time.time()
for facing in (0, 180):
    sc = Scene(); x = humanoid(gear, {}); place(x, sc, facing=facing)
    img, a = render(sc, 256, 256, 1.6/256, 128, 200)
    out.append(img)
print('ms', round((time.time()-t0)*1000))
Image.fromarray((np.concatenate(out, 1)*255).astype(np.uint8)).save('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/work/t1.png')
