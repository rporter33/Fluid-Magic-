# Stage C fix pass, gods (no generation): the deterministic edits of the critique.
#   hunter   fix 12: the Horned Hunter's back view shows teal-green pauldrons under its leaf mantle that the portrait (pick A)
#            does not have. A local tint edit in the style of gd_tint.py: inside the two shoulder plates (polygons in the
#            cutout's own px, drawn by eye on this painting), the teal-grey metal (OKLCH hue 110 to 210 at chroma below the
#            leaves' ~0.045, fading out from 0.036 to 0.046) is moved to a worn bronze beside the front's gold ornaments
#            (hue 74, chroma 0.05, lightness x 0.92), so the plates read as bronze and the green leaves over them stay
#            green. (The critique's literal window, hue 170 to 200 at C > 0.04, holds 0.3% of the plates: their teal sits
#            at hue 160 to 165 and chroma 0.027 to 0.034.) The edited keyed image goes through gd_post as a new cut.
#   tint     the Living Monolith's Thornwood front, re-made by gd_tint.py from the new Cinder front (R7).
# Usage: python3 -I fgods.py hunter|tint
import json, os, shutil, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(FIX, '..', '..', '..'))
GW = os.path.join(UNITS, 'stage-c', 'work', 'gods')
GT = os.path.join(GW, 'tools')
sys.path.insert(0, os.path.join(UNITS, 'stage-c', 'work', 'creatures', 'tools'))
sys.path.insert(0, os.path.join(UNITS, 'tools'))
from v4color import oklch, to_oklab  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402

# the two shoulder plates of hornedHunter-thornwood.back (cut hornedHunter.back.nb21, 587 x 1078 px), by eye
PLATES = [[(12, 335), (40, 308), (95, 298), (132, 312), (140, 345), (122, 385), (92, 420), (55, 445), (22, 440), (10, 400)],
          [(306, 432), (330, 398), (380, 378), (436, 380), (474, 404), (488, 452), (480, 520), (452, 562), (402, 576), (360, 560), (322, 515)]]
BRONZE = (74.0, 0.05, 0.92)  # hue, chroma, lightness factor: a dark worn bronze beside the gold rims


def hunter():
    src_tag = 'hornedHunter.back.nb21'
    cdir = os.path.join(GW, 'cut', src_tag)
    keyed = os.path.join(cdir, f'{src_tag}.keyed.png')
    cut = os.path.join(cdir, 'hornedHunter-thornwood.back.idle.png')
    meta = json.load(open(cut.replace('.png', '.json')))
    rgba = np.asarray(Image.open(keyed).convert('RGBA')).astype(np.float64)
    x0, y0 = meta['box'][0], meta['box'][1]  # the cutout's place in the keyed image
    poly = Image.new('L', (rgba.shape[1], rgba.shape[0]), 0)
    d = ImageDraw.Draw(poly)
    for P in PLATES:
        d.polygon([(x + x0, y + y0) for x, y in P], fill=255)
    pm = np.asarray(poly).astype(float) / 255
    L, C, h = oklch(rgba[..., :3])
    wh = ((h >= 110) & (h <= 210)).astype(float)
    wc = np.clip((0.046 - C) / 0.01, 0, 1)
    w = pm * wh * wc * (rgba[..., 3] > 20)
    from PIL import ImageFilter
    w = np.asarray(Image.fromarray((w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(float) / 255 * pm
    lab = to_oklab(np.clip(rgba[..., :3], 0, 255))
    hr = np.radians(BRONZE[0])
    new = np.dstack([lab[..., 0] * BRONZE[2], np.full(L.shape, BRONZE[1] * np.cos(hr)), np.full(L.shape, BRONZE[1] * np.sin(hr))])
    out_lab = lab * (1 - w[..., None]) + new * w[..., None]
    out = rgba.copy(); out[..., :3] = np.clip(oklab_to_srgb(out_lab), 0, 255)
    tag = 'hornedHunter.back.nb21.bronze'
    tdir = os.path.join(GW, 'cut', tag); os.makedirs(tdir, exist_ok=True)
    tkeyed = os.path.join(tdir, f'{tag}.keyed.png')
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(tkeyed)
    shutil.copy(os.path.join(cdir, 'key.json'), os.path.join(tdir, 'key.json'))
    plates = pm > 0.5
    teal_before = float(((((h >= 110) & (h <= 210)) & (C > 0.012)) & plates).sum() / max(1, plates.sum()))
    L2, C2, h2 = oklch(out[..., :3])
    teal_after = float(((((h2 >= 110) & (h2 <= 210)) & (C2 > 0.012)) & plates).sum() / max(1, plates.sum()))
    rec = dict(source=src_tag, plates=PLATES, bronze=dict(hue=BRONZE[0], chroma=BRONZE[1], lightness=BRONZE[2], from_='the front\'s gold discs (hue 84), darkened to worn bronze'),
               recolouredPx=int((w > 0.5).sum()), platePx=int(plates.sum()), tealInPlatesBefore=round(teal_before, 4), tealInPlatesAfter=round(teal_after, 4),
               fullFigure=dict(teal170to200before=None))
    json.dump(rec, open(os.path.join(tdir, 'tint.json'), 'w'), indent=1)
    a = rgba[..., 3:4] / 255; bg = np.array([170, 170, 140.])
    proof = np.concatenate([rgba[..., :3] * a + bg * (1 - a), out[..., :3] * a + bg * (1 - a)], 1)
    Image.fromarray(np.clip(proof, 0, 255).astype(np.uint8)).save(os.path.join(tdir, 'proof.png'))
    sys.path.insert(0, GT)
    import gd_post
    raw = json.load(open(os.path.join(cdir, 'checks.json')))['raw']
    rep = gd_post.process('hornedHunter', 'back', os.path.join(UNITS, raw), fig='hornedHunter-thornwood', nation='thornwood', keyed=tkeyed, tag=tag)
    rep['tintEdit'] = rec
    json.dump(rep, open(os.path.join(tdir, 'checks.json'), 'w'), indent=1)
    print(json.dumps(rec), json.dumps({k: rep[k] for k in ('pass', 'failed')}), json.dumps(rep['side']))


def tint():
    p = subprocess.run([sys.executable, '-I', os.path.join(GT, 'gd_tint.py'), 'livingMonolith', 'front', 'livingMonolith.front.nb21.2k.cfix'],
                       capture_output=True, text=True, cwd=GT)
    print(p.stdout[-1500:], p.stderr[-1500:])


if __name__ == '__main__':
    {'hunter': hunter, 'tint': tint}[sys.argv[1]]()
