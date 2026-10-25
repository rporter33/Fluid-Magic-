# Stage B calibration, part 1: measures for re-dressed commander sheets.
#   camera_rel: every cell against the maquette guide, with the re-dress silhouette scaled by its BODY sheet's frame
#     height (the re-dress keeps each figure's size in its cell; scaling by its own height lets a tall cowl or antlers
#     shrink the body and fail a cell whose camera is right), plus the IoU against the body sheet's own cell.
#   board: the identity board per face: the approved portrait, the stand and actA frames at sheet size, and the stand
#     frame at the commander's tier H height (128 px) shown 4x, with the marks list to tick.
# Usage: python3 cal_cmd_measure.py
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from checks import guide_cells, frame_mask, norm_sil, iou  # noqa: E402
from pack import premul_resize, body_height  # noqa: E402
import cal_cmd_prompts as P  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..'))
CAL = os.path.abspath(os.path.join(ROOT, '..'))
W = os.path.join(CAL, 'work')
BODY = {'cmdChief': 'cmdChief.front.zonesonly', 'cmdCaster': 'cmdCaster.front.body', 'cmdDruid': 'cmdDruid.front.body'}


def frames(d, fig, view):
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    return {f['name']: f for f in meta['frames'] if not f.get('missing')}


def camera_rel(face_dir, body_dir, fig, view='front'):
    gc = guide_cells(os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png'), fig, view)
    fr, bf = frames(face_dir, fig, view), frames(body_dir, fig, view)
    per = {}
    for n, f in fr.items():
        if n not in gc or n not in bf or n == 'dropped':
            continue
        _, m = frame_mask(face_dir, f)
        _, bm = frame_mask(body_dir, bf[n])
        g = gc[n]
        a = norm_sil(m, f['anchor'], bf[n]['height'])
        b = norm_sil(g['mask'], g['anchor'], g['height'])
        bb = norm_sil(bm, bf[n]['anchor'], bf[n]['height'])
        per[n] = (round(iou(a, b), 3), round(iou(a, b) - iou(a, b[:, ::-1]), 3), round(iou(a, bb), 3))
    follow = [k for k, v in per.items() if v[0] >= 0.55 and v[1] >= 0]
    return dict(cells=per, follow=f'{len(follow)}/{len(per)}', inheritMedian=round(float(np.median([v[2] for v in per.values()])), 3),
                inheritMin=min((v[2], k) for k, v in per.items()))


def font(sz):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def on_ground(rgba, ground=(150, 148, 128)):
    bg = Image.new('RGBA', (rgba.width, rgba.height), ground + (255,))
    bg.alpha_composite(rgba)
    return bg.convert('RGB')


def board(face, out):
    kind, nat, unit, num, sex, marks = P.FACES[face]
    d = os.path.join(W, f'{face}.front.redress', 'frames')
    fr = frames(d, kind, 'front')
    por = Image.open(P.PORTRAIT.format(nat, unit, num)).convert('RGB').resize((384, 384), Image.LANCZOS)
    st = Image.open(os.path.join(d, fr['stand']['file'])).convert('RGBA')
    act = Image.open(os.path.join(d, fr['actA']['file'])).convert('RGBA')
    k2 = 384 / max(st.height, act.height)
    big = [on_ground(im.resize((round(im.width * k2), round(im.height * k2)), Image.LANCZOS)) for im in (st, act)]
    rgba = np.asarray(st).astype(np.float64)
    bh = body_height(rgba[..., 3] > 0.35 * 255)
    s = premul_resize(rgba, 128 / bh)  # the stand body at the commander's tier H height, 128 px
    small = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
    x4 = on_ground(small).resize((small.width * 4, small.height * 4), Image.NEAREST)
    hh = max(384, x4.height)
    Wd = 384 + 12 + sum(b.width for b in big) + 12 * 2 + x4.width + 12
    img = Image.new('RGB', (Wd, hh + 40 + 26 * len(marks) + 12), (28, 26, 23))
    dr = ImageDraw.Draw(img)
    x = 0
    img.paste(por, (x, 30)); dr.text((x, 6), f'portrait {unit} {num}', fill=(230, 225, 210), font=font(16)); x += 396
    for b, lab in zip(big, ('stand (sheet px)', 'actA (sheet px)')):
        img.paste(b, (x, 30)); dr.text((x, 6), lab, fill=(230, 225, 210), font=font(16)); x += b.width + 12
    img.paste(x4, (x, 30)); dr.text((x, 6), 'stand at tier H 128 px, 4x', fill=(230, 225, 210), font=font(16))
    y = hh + 40
    for i, m in enumerate(marks):
        dr.text((8, y), f'({i + 1}) {m}', fill=(230, 225, 210), font=font(15)); y += 26
    img.save(out)


def main():
    res = {}
    for face, (kind, *_r) in P.FACES.items():
        res[face] = camera_rel(os.path.join(W, f'{face}.front.redress', 'frames'), os.path.join(W, BODY[kind], 'frames'), kind)
        board(face, os.path.join(CAL, 'review', f'identity-{face}.png'))
        print(face, res[face]['follow'], 'inherit median', res[face]['inheritMedian'], 'min', res[face]['inheritMin'])
    json.dump(res, open(os.path.join(W, 'cmd-camera-rel.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
