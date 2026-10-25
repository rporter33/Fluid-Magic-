# Stage B calibration, part 5 (owner note 1): data for the troop-variation page. Packs the kept pilot frames (Cinder
# Warrior back and front with the surcoat, the Thornwood Warden front hue-locked; rim-fixed) into tier S and tier H
# atlases with the side keyline (pilot-review change 14), and per frame the data the shader's shared stencils need:
#   shield: the shield face as an ellipse in frame-local coordinates (front views), found as the roundest large patch
#           of side cloth below the head;
#   body:   the top of the body (an opening removes a raised weapon) and the foot anchor, frame-local.
# Writes ../../page/var-data.json (atlases as data URLs) and ../../review/var-stencil-proof.png.
# Usage: python3 cal_var_build.py
import base64, io, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pack  # noqa: E402
import checks  # noqa: E402
from ad_measures import tinted_keyline, SHADE  # noqa: E402
from slice import label  # noqa: E402
from v4color import oklch  # noqa: E402

CAL = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS_DIR = os.path.abspath(os.path.join(CAL, '..', '..'))
F = os.path.join(UNITS_DIR, 'pilot', 'ad', 'frames')
FIGS = [('cinderWarrior.back', 'cinderWarrior', 'back', 'cinderHorde'),
        ('cinderWarrior.front', 'cinderWarrior', 'front', 'cinderHorde'),
        ('warden.front.lock', 'warden', 'front', 'thornwood')]
KEEP = {'stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'brace', 'recoil'}
CLOTH = {'cinderHorde': '#C4532C', 'thornwood': '#1F6A50'}


def durl(im):
    b = io.BytesIO(); im.save(b, 'PNG'); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def cloth_mask(rgba, hexc):
    hx = np.array([[[int(hexc[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)
    _, cc, ch = oklch(hx)
    _, C, h = oklch(rgba[..., :3])
    dh = np.abs((h - float(ch[0, 0]) + 180) % 360 - 180)
    return (dh <= 22) & (C >= max(0.04, 0.45 * float(cc[0, 0]))) & (rgba[..., 3] > 240)


def shield(rgba, hexc, top_y):
    m = cloth_mask(rgba, hexc)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))) > 127
    lab = label(m)
    fig_area = (rgba[..., 3] > 128).sum()
    H = rgba.shape[0]
    best, score = None, 0
    for i in np.unique(lab[lab > 0]):
        ys, xs = np.nonzero(lab == i)
        n = len(ys)
        if n < 0.025 * fig_area:
            continue
        h, w = np.ptp(ys) + 1, np.ptp(xs) + 1
        asp, fill = w / h, n / (w * h)
        cy = (ys.min() + ys.max()) / 2
        cx = (xs.min() + xs.max()) / 2
        ty, tx = np.nonzero(rgba[top_y:top_y + max(3, int(0.12 * (H - top_y))), :, 3] > 128)
        head_x = float(np.median(tx)) if tx.size else 0.0
        on_arm = cx >= head_x + 0.08 * (H - top_y)  # front views: the shield arm is right of the head in the image
        if not (0.55 <= asp <= 1.7 and fill >= 0.55 and cy > top_y + 0.28 * (H - top_y) and on_arm):
            continue
        s = fill * n
        if s > score:
            best, score = (float((xs.min() + xs.max() + 1) / 2), float(cy + 0.5), float(w / 2), float(h / 2)), s
    return best


def build(tier, kl):
    items, info, meta = [], [], {}
    for d, fig, view, nat in FIGS:
        pack.keyline = kl[nat]
        fr, inf = pack.frames_of(os.path.join(F, d), fig, view, tier)
        tag = 'wd' if d.startswith('warden') else 'cw'
        for name, img, anc in fr:
            pose = name.split('.')[2]
            if pose not in KEEP or name.endswith('.white'):
                continue
            items.append((f'{tag}.{view}.{pose}', img, anc))
        info.append(inf)
    pack.keyline = checks.keyline
    pages, placed = pack.pack(items)
    assert len(pages) == 1
    p = pages[0]
    rows = np.nonzero(p[..., 3].max(1) > 0)[0]
    h = 1 << (int(rows.max() + 1) - 1).bit_length()
    page = Image.fromarray(np.clip(p[:h], 0, 255).astype(np.uint8), 'RGBA')
    return page, placed, info, {n: img for n, img, _ in items}


def main():
    kl = {n: tinted_keyline(SHADE[n]) for n in SHADE}
    out = dict(tiers={})
    proof = []
    for tier in ('S', 'H'):
        page, placed, info, imgs = build(tier, kl)
        frames = {}
        for n, d in placed.items():
            img = imgs[n]
            a = img[..., 3] > 128
            ys, xs = np.nonzero(a)
            hgt = ys.max() - ys.min() + 1
            r = max(3, (int(0.05 * hgt) // 2) * 2 + 1)
            o = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(r)).filter(ImageFilter.MaxFilter(r))) > 127
            top = int(np.nonzero(o)[0].min()) if o.any() else int(ys.min())
            nat = 'thornwood' if n.startswith('wd') else 'cinderHorde'
            sh = shield(img, CLOTH[nat], top) if '.front.' in n else None
            W, Hh = img.shape[1], img.shape[0]
            frames[n] = dict(frame=d['frame'], anchor=d['anchor'], body=[round(top / Hh, 4), d['anchor']['y']],
                             shield=[round(sh[0] / W, 4), round(sh[1] / Hh, 4), round(sh[2] / W, 4), round(sh[3] / Hh, 4)] if sh else None)
            if tier == 'H' and n.split('.')[2] in ('stand', 'strike', 'marchA', 'recoil') and '.front.' in n:
                im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA')
                bg = Image.new('RGBA', im.size, (150, 148, 128, 255)); bg.alpha_composite(im)
                dr = ImageDraw.Draw(bg)
                if sh:
                    dr.ellipse([sh[0] - sh[2], sh[1] - sh[3], sh[0] + sh[2], sh[1] + sh[3]], outline=(255, 0, 255), width=2)
                dr.line([(0, top), (W, top)], fill=(255, 255, 0))
                proof.append(bg.convert('RGB').resize((W * 2, Hh * 2), Image.NEAREST))
        out['tiers'][tier] = dict(page=durl(page), size=[page.width, page.height], frames=frames, figures=info,
                                  manPx=56 if tier == 'S' else 112)
        print(tier, page.size, len(frames), 'shields found:', sum(1 for f in frames.values() if f['shield']), 'of',
              sum(1 for k in frames if '.front.' in k))
    out['cloth'] = CLOTH
    json.dump(out, open(os.path.join(CAL, 'page', 'var-data.json'), 'w'))
    Wd = sum(t.width for t in proof) + 6 * len(proof); Hh = max(t.height for t in proof)
    sheet = Image.new('RGB', (Wd, Hh), (28, 26, 23)); x = 0
    for t in proof:
        sheet.paste(t, (x, 0)); x += t.width + 6
    sheet.save(os.path.join(CAL, 'review', 'var-stencil-proof.png'))


if __name__ == '__main__':
    main()
