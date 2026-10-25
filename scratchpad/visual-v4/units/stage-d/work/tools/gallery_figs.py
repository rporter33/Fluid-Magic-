# The effects gallery's figures: painted tier S 'stand' frames (stage B paint data) of a Cinder warrior and a Warden (back
# and front, as the battle camera shows each side) and the two casters (the Cinder Magus, the Elder Druid), cut from their
# pages into small WebP data for pilot.html (critique fix 6: painted figures, not flat vector stand-ins).
# Usage: python3 -I gallery_figs.py  -> work/pilot-assets/gallery-figs.json
import base64, io, json, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(WORK, '..', '..'))
D = json.load(open(os.path.join(UNITS, 'stage-b', 'integrate', 'paint-data.json')))
T = D['tiers']['S']
WANT = {'R': 'cinderWarrior.back.stand', 'Rf': 'cinderWarrior.front.stand', 'G': 'warden.back.stand', 'Gf': 'warden.front.stand',
        'mageR': 'cinderMagus-03.back.stand', 'mageG': 'elderDruid-08.back.stand'}
pages = {}
out = {'wuPerPx': D['wuPerPx']['S'], 'figs': {}}
total = 0
for k, name in WANT.items():
    f = T['frames'][name]
    pi, x, y, w, h, ax, ay = f[:7]
    if pi not in pages:
        url = T['pages'][pi]['url']
        pages[pi] = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')
    im = pages[pi].crop((x, y, x + w, y + h))
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=88, method=6, alpha_quality=100)
    total += len(buf.getvalue())
    out['figs'][k] = {'name': name, 'w': w, 'h': h, 'ax': ax, 'ay': ay, 'src': 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()}
json.dump(out, open(os.path.join(WORK, 'pilot-assets', 'gallery-figs.json'), 'w'))
print({k: (v['w'], v['h']) for k, v in out['figs'].items()}, total, 'bytes')
