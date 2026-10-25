# Stage B troops: the camera references (Image 2 of every Pro troop sheet). The calibration found that a camera-correct
# sheet of the same view given as Image 2 holds Pro's camera (commander bodies 13 to 16 of 16 against 1 of 16 bare);
# no camera-correct Thornwood back sheet or independent sheet exists yet, so those are made from approved pilot sheets:
# the sheet is keyed, its side cloth moved to the target side's colour (so the model has no foreign cloth to copy) and
# it is laid on the target key. Once a production sheet of that nation and view passes, it replaces the derived one.
# Usage: python3 tr_camrefs.py   (writes ../../camrefs/*.png and camrefs.json)
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from key import key_image  # noqa: E402
from pack import recolor_cloth, oklab_to_srgb  # noqa: E402
from v4color import oklch, to_oklab  # noqa: E402

UNITS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
OUT = os.path.abspath(os.path.join(HERE, '..', '..', 'camrefs'))
CW_BACK = UNITS + '/pilot/raw/r3/cw.back.g3pro.png'     # 14/15, the kept near soldier (Pro)
CW_FRONT = UNITS + '/pilot/raw/ad/cw.front.g3pro.png'   # 15/15 (Pro, surcoat)
WD_FRONT = UNITS + '/pilot/raw/ad/wd.front.g3pro.png'   # 15/15 (Pro), the kept Warden
KEYRGB = {'green': (0, 255, 0), 'magenta': (255, 0, 255)}


def on_key(rgba, key):
    a = rgba[..., 3:4]
    bg = np.array(KEYRGB[key], np.float64)
    return np.clip(rgba[..., :3] * a + bg * (1 - a), 0, 255).astype(np.uint8)


def grey_cloth(rgba, lo, hi, cmin=0.02, to_hex='#8C8A80'):
    """Every pixel in the hue range [lo, hi] with chroma >= cmin loses its chroma (to the grey cloth's), keeping L."""
    _, C, h = oklch(rgba[..., :3])
    inside = ((h >= lo) & (h <= hi)) if lo < hi else ((h >= lo) | (h <= hi))
    w = inside * np.clip((C - cmin) / 0.02, 0, 1) * (rgba[..., 3] > 0.5)
    lab = to_oklab(rgba[..., :3])
    t = to_oklab(np.array([[[int(to_hex[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64))[0, 0]
    lab2 = lab.copy()
    lab2[..., 1] = lab[..., 1] + w * (t[1] - lab[..., 1])
    lab2[..., 2] = lab[..., 2] + w * (t[2] - lab[..., 2])
    out = rgba.copy(); out[..., :3] = oklab_to_srgb(lab2)
    return out


def keyed(path, key):
    rgba, _ = key_image(path, key, erode=1)
    out = rgba.copy(); out[..., :3] *= 255; out[..., 3] = rgba[..., 3]
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    refs = {}
    # as painted: the nation's own camera-correct sheets
    refs['cinderHorde.back'] = CW_BACK
    refs['cinderHorde.front'] = CW_FRONT
    refs['thornwood.front'] = WD_FRONT
    # Thornwood back: the Cinder back, its orange cloth moved to the Thornwood green, on magenta
    cb = keyed(CW_BACK, 'green')
    tb, _ = recolor_cloth(cb, '#C4532C', '#1F6A50')
    p = os.path.join(OUT, 'thornwood.back.from-cw.png'); Image.fromarray(on_key(tb, 'magenta')).save(p); refs['thornwood.back'] = p
    # independents: grey cloth on magenta (back from the Cinder back, front from the Warden front)
    ib = grey_cloth(cb, 15, 60, cmin=0.06)
    p = os.path.join(OUT, 'independent.back.from-cw.png'); Image.fromarray(on_key(ib, 'magenta')).save(p); refs['independent.back'] = p
    wf = keyed(WD_FRONT, 'magenta')
    if_ = grey_cloth(wf, 90, 230, cmin=0.02)
    p = os.path.join(OUT, 'independent.front.from-wd.png'); Image.fromarray(on_key(if_, 'magenta')).save(p); refs['independent.front'] = p
    json.dump(refs, open(os.path.join(OUT, 'camrefs.json'), 'w'), indent=1)
    print(json.dumps(refs, indent=1))


if __name__ == '__main__':
    main()
