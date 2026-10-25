# Pilot measures beyond checks.py (art plan 8.6), written for the stage A pilot:
#   consistency(frames_dir, fig, view): is it the same figure in every cell? Per frame against the stand frame:
#       a Lab colour-histogram intersection (8 x 8 x 8 bins over the visible pixels), the CIEDE2000 distance of the
#       median colours, and the frame's own side-colour share (cloth pixels / figure pixels) against the stand's.
#   creature_report(frames_dir, fig, view, key_report): a single big-body cutout against its maquette guide
#       (silhouette IoU, mirrored IoU, aspect) and the identity colour check against its portrait (5.5).
#   look40(png, anchor, height, out): the stand frame at 40 px tall over the four grounds, then 4x nearest.
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_lab, oklch  # noqa: E402

UNITS = json.load(open(os.path.join(ROOT, 'units.json')))
BYID = {u['id']: u for u in UNITS['units']}
CONS = dict(histMin=0.55, medianDE=12.0, clothRatio=(0.6, 1.6))  # pilot thresholds (recorded in pilot.md)


def de2000(l1, l2):
    """CIEDE2000 between two CIELAB triples."""
    L1, a1, b1 = l1; L2, a2, b2 = l2
    C1, C2 = np.hypot(a1, b1), np.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = a1 * (1 + G), a2 * (1 + G)
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p, h2p = np.degrees(np.arctan2(b1, a1p)) % 360, np.degrees(np.arctan2(b2, a2p)) % 360
    dLp, dCp = L2 - L1, C2p - C1p
    dh = h2p - h1p
    if C1p * C2p == 0:
        dh = 0
    elif dh > 180:
        dh -= 360
    elif dh < -180:
        dh += 360
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lbp, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    hs = h1p + h2p
    if C1p * C2p == 0:
        hbp = hs
    elif abs(h1p - h2p) > 180:
        hbp = (hs + 360) / 2 if hs < 360 else (hs - 360) / 2
    else:
        hbp = hs / 2
    T = 1 - 0.17 * np.cos(np.radians(hbp - 30)) + 0.24 * np.cos(np.radians(2 * hbp)) + 0.32 * np.cos(np.radians(3 * hbp + 6)) \
        - 0.20 * np.cos(np.radians(4 * hbp - 63))
    SL = 1 + 0.015 * (Lbp - 50) ** 2 / np.sqrt(20 + (Lbp - 50) ** 2)
    SC, SH = 1 + 0.045 * Cbp, 1 + 0.015 * Cbp * T
    RT = -2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) * np.sin(np.radians(60 * np.exp(-((hbp - 275) / 25) ** 2)))
    return float(np.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH)))


def visible(png):
    im = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
    return im[..., :3][im[..., 3] > 200]


def cloth_mask(rgb, cloth_hex):
    h = cloth_hex.lstrip('#')
    c = np.array([[[int(h[i:i + 2], 16) for i in (0, 2, 4)]]], np.float64)
    _, cc, ch = oklch(c)
    _, C, H = oklch(rgb[None])
    dh = np.abs((H[0] - float(ch[0, 0]) + 180) % 360 - 180)
    return (dh <= 20) & (C[0] >= max(0.04, 0.45 * float(cc[0, 0])))


def hist(lab):
    q = np.clip(((lab - [0, -60, -60]) / [100, 120, 120] * 8).astype(int), 0, 7)
    hh = np.bincount(q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2], minlength=512).astype(np.float64)
    return hh / max(1, hh.sum())


def consistency(d, fig, view):
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    u = BYID[fig]
    cloth = UNITS['nations'][u['nation']]['cloth']['hex']
    fr = {f['name']: f for f in meta['frames'] if not f.get('missing') and f['name'] not in ('dropped',)}
    if 'stand' not in fr:
        return {'error': 'no stand frame'}
    base = visible(os.path.join(d, fr['stand']['file']))
    bl = to_lab(base[None])[0]
    bh, bmed, bcl = hist(bl), np.median(bl, 0), cloth_mask(base, cloth).mean()
    per = {}
    for n, f in fr.items():
        if n == 'stand':
            continue
        px = visible(os.path.join(d, f['file']))
        if len(px) < 50:
            continue
        lab = to_lab(px[None])[0]
        per[n] = dict(hist=round(float(np.minimum(hist(lab), bh).sum()), 3), de=round(de2000(bmed, np.median(lab, 0)), 1),
                      cloth=round(float(cloth_mask(px, cloth).mean()), 3))
    hmin = min(per.values(), key=lambda v: v['hist']) if per else {}
    worst = min(per, key=lambda k: per[k]['hist']) if per else None
    dmax = max(per, key=lambda k: per[k]['de']) if per else None
    ratios = [v['cloth'] / max(1e-6, bcl) for v in per.values()]
    rep = dict(standCloth=round(float(bcl), 3), frames=per, histMin=[worst, hmin.get('hist')], maxDE=[dmax, per[dmax]['de'] if dmax else None],
               clothRatio=[round(min(ratios), 2), round(max(ratios), 2)] if ratios else None)
    rep['pass'] = bool(hmin.get('hist', 0) >= CONS['histMin'] and (per[dmax]['de'] if dmax else 0) <= CONS['medianDE'])
    return rep


def norm_mask(mask, H=256, size=384):
    ys, xs = np.nonzero(mask)
    sub = mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = H / sub.shape[0]
    im = Image.fromarray((sub * 255).astype(np.uint8)).resize((max(1, round(sub.shape[1] * k)), H), Image.BILINEAR)
    out = Image.new('L', (size * 2, size), 0)
    out.paste(im, ((size * 2 - im.width) // 2, (size - H) // 2))
    return np.asarray(out) > 127


def iou(a, b):
    return float((a & b).sum() / max(1, (a | b).sum()))


def portrait_subject_lab(png):
    im = np.asarray(Image.open(png).convert('RGB')).astype(np.float64)
    lab = to_lab(im)
    bg = to_lab(np.array([[[28, 26, 23]]], np.float64))[0, 0]
    m = np.abs(lab[..., 0] - bg[0]) > 12  # the lit subject against the very dark background
    m[: int(0.05 * m.shape[0])] = False
    return np.median(lab[m], 0)


def creature_report(d, fig, view, key_report):
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.idle.json')))
    rgba = np.asarray(Image.open(os.path.join(d, meta['file'])).convert('RGBA')).astype(np.float64)
    m = rgba[..., 3] > 0.35 * 255
    gpng = os.path.join(ROOT, 'refs', 'guides', f'{fig}.idle.{view}.png')
    g = np.asarray(Image.open(gpng).convert('RGB')).astype(np.float64) / 255
    gm = np.abs(g - g[2, 2]).sum(-1) > 0.2
    a, b = norm_mask(m), norm_mask(gm)
    ys, xs = np.nonzero(m); gy, gx = np.nonzero(gm)
    ar = ((np.ptp(xs) + 1) / (np.ptp(ys) + 1)) / ((np.ptp(gx) + 1) / (np.ptp(gy) + 1))
    cam = dict(iou=round(iou(a, b), 3), iouMirrored=round(iou(a, b[:, ::-1]), 3), aspectRatio=round(float(ar), 3))
    cam['pass'] = bool(cam['iou'] >= 0.55 and cam['iou'] - cam['iouMirrored'] >= 0.03 and 0.75 <= ar <= 1.33)
    u = BYID[fig]
    top = rgba[ys.min():ys.min() + int(0.33 * (np.ptp(ys) + 1))]
    px = top[..., :3][top[..., 3] > 200]
    fl = np.median(to_lab(px[None])[0], 0)
    pl = portrait_subject_lab(u['portrait'])
    whole = np.median(to_lab(rgba[..., :3][rgba[..., 3] > 200][None])[0], 0)
    ident = dict(upperThirdLab=[round(float(v), 1) for v in fl], portraitLab=[round(float(v), 1) for v in pl],
                 dE2000=round(de2000(fl, pl), 1), wholeDE2000=round(de2000(whole, pl), 1))
    ident['pass'] = ident['dE2000'] < 18
    k = json.load(open(key_report))
    return dict(figure=fig, view=view, camera=cam, identity=ident, size=[int(np.ptp(xs) + 1), int(np.ptp(ys) + 1)],
                fringe=dict(spillEdgePct=k['spillEdgePct'], keyInUnitPct=k['keyInUnitPct'], fringePct=k['fringePct'],
                            edgeDevPct=k.get('edgeDevPct'),
                            pass_=bool(k['fringePct'] <= 0.2 and k['keyInUnitPct'] <= 0.5 and (k.get('edgeDevPct') or 0) <= 8.0)))


def look40(png, anchor, height, out, f_px=40, grounds=('#A8A784', '#8E8E78', '#938E70')):
    from checks import scaled_figure
    rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
    fig, anc = scaled_figure(rgba, anchor, height, f_px)
    tiles = []
    for gh in grounds:
        h = gh.lstrip('#')
        bg = np.zeros((fig.shape[0] + 8, fig.shape[1] + 8, 3)); bg[:] = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
        a = fig[..., 3:4] / 255
        sub = bg[4:4 + fig.shape[0], 4:4 + fig.shape[1]]
        sub[:] = fig[..., :3] * a + sub * (1 - a)
        tiles.append(bg)
    strip = np.concatenate(tiles, 1)
    im = Image.fromarray(np.clip(strip, 0, 255).astype(np.uint8))
    im.save(out.replace('.png', '.1x.png'))
    im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(out)
    return out


def camera_all(d, fig, view):
    """Every cell against the guide's cell: silhouette IoU (each normalised to its own height and ground point),
    the facing margin (IoU minus the IoU with the mirrored guide cell), and the share of cells that follow the
    guide (IoU >= 0.55 and margin >= 0). A model that paints one cell at the right camera and the rest from the
    side passes the stand-only check in checks.py; it does not pass this one."""
    from checks import guide_cells, frame_mask, norm_sil
    gc = guide_cells(os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png'), fig, view)
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    per = {}
    for f in meta['frames']:
        if f.get('missing') or f['name'] not in gc or f['name'] == 'dropped':
            continue
        _, m = frame_mask(d, f)
        g = gc[f['name']]
        a = norm_sil(m, f['anchor'], f['height'])
        b = norm_sil(g['mask'], g['anchor'], g['height'])
        i, im = iou(a, b), iou(a, b[:, ::-1])
        per[f['name']] = (round(i, 3), round(i - im, 3))
    ious = [v[0] for v in per.values()]
    follow = [k for k, v in per.items() if v[0] >= 0.55 and v[1] >= 0]
    return dict(cells=per, medianIoU=round(float(np.median(ious)), 3) if ious else None,
                medianMargin=round(float(np.median([v[1] for v in per.values()])), 3) if per else None,
                follow=f'{len(follow)}/{len(per)}', followShare=round(len(follow) / max(1, len(per)), 2))


def side_boost(d, fig, view, proof=None):
    """The side share at 28 px of the stand frame as painted, and after pack.py's cloth_boost (pilot option)."""
    from checks import side_report, FORMATIONS
    from pack import cloth_boost
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    u = BYID[fig]
    st = next(f for f in meta['frames'] if f['name'] == 'stand' and not f.get('missing'))
    rgba = np.asarray(Image.open(os.path.join(d, st['file'])).convert('RGBA')).astype(np.float64)
    cloth = UNITS['nations'][u['nation']]['cloth']['hex']
    kind = u.get('formation') or 'heavy'
    raw = side_report(rgba, st['anchor'], st['height'], cloth, kind)
    b, moved = cloth_boost(rgba, cloth)
    boosted = side_report(b, st['anchor'], st['height'], cloth, kind, proof=proof)
    if proof:
        pair = np.concatenate([rgba, b], 1)
        Image.fromarray(np.clip(pair, 0, 255).astype(np.uint8), 'RGBA').save(proof.replace('.png', '.pair.png'))
    worst = lambda r: min(r[g]['below'] for g in ('plains', 'farmland', 'swamp', 'forest'))
    return dict(raw=raw['share'], boosted=boosted['share'], moved=round(moved, 3), valueBelowRaw=worst(raw),
                valueBelowBoosted=worst(boosted))
