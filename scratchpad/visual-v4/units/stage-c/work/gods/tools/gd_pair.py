# Stage C gods: a god's back and front looks stacked into one image.  Usage: python3 -I gd_pair.py GOD BACK_TAG FRONT_TAG OUT.png [H]
import os, subprocess, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
god, bt, ft, out = sys.argv[1:5]
H = sys.argv[5] if len(sys.argv) > 5 else '420'
ims = []
for tag, v in ((bt, 'back'), (ft, 'front')):
    p = out + f'.{v}.png'
    subprocess.run([sys.executable, '-I', os.path.join(HERE, 'gd_look.py'), tag, god, v, p, H], check=True, capture_output=True)
    ims.append(Image.open(p)); os.remove(p)
s = Image.new('RGB', (max(i.width for i in ims), sum(i.height + 8 for i in ims)), (20, 20, 20)); y = 0
for i in ims:
    s.paste(i, (0, y)); y += i.height + 8
s.save(out); print(out, s.size)
