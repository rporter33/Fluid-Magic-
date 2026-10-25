# Automatic checks on a sliced figure sheet (art plan section 8.6). Thresholds are in CHECKS below.
#   camera   - the stand silhouette against the maquette guide's stand cell: IoU, aspect, head offset, facing
#   variety  - the two march frames and the action frames are different poses (silhouette IoU, legs IoU)
#   scale    - every upright frame's height against the stand frame's
#   fringe   - the keyer's report (spill fixed at the edge, key colour inside the unit, residual)
#   side     - the side-colour share of a formation's visible pixels at play zoom (f = 28 px), and the
#              block's mean L* against light and dark grounds (design 3.8)
# Usage: python3 -I checks.py SLICED_DIR FIGURE_ID VIEW [--guide GUIDE_SHEET.png] [--key KEY_REPORT.json] [--proof OUT.png]
#        python3 -I checks.py --figure-png FIG.png NATION FORMATION [--proof OUT.png]   (side share of one figure image)
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_lab, oklch  # noqa: E402
from slice import label  # noqa: E402

CHECKS = dict(
    cameraIoU=0.60,          # stand silhouette vs the guide's, same height, ground points aligned (maquette vs itself 0.89 to 0.93)
    aspectRatio=(0.75, 1.33),  # (painted w/h) / (guide w/h)
    headDx=0.10,             # |painted - guide| head offset over the foot, in standing heights
    facingMargin=0.03,       # IoU(guide) - IoU(mirrored guide) must be above this (maquette +0.20; the failed 2026-10-22 sheet -0.03)
    marchIoU=0.86,           # the two march frames must differ at least this much (whole silhouette)
    marchLegsIoU=0.72,       # ... and in the bottom 35% (the legs)
    distinctIoU=0.92,        # any two of stand, march, windup, strike, recoil
    marchIoURobe=0.95, distinctIoURobe=0.95,  # robes to the ground: the legs never show (maquette 0.89 to 0.95)
    scaleSpread=0.15,        # stand, idle and march frames' heights within +-15% of stand (maquette: up to +12%)
    fringePct=0.2, keyInUnitPct=0.5, edgeDevPct=8.0,  # edgeDevPct: pilot addition (key.py edge_deviation)
    sideShare=0.30,          # formation at f = 28 px
    valueBelowGround=15.0,   # block mean L* at least this far below the ground's
)
UPRIGHT = {'stand', 'idle2', 'marchA', 'marchB'}
# formation spacing in wu, files x ranks (design 3.5)
FORMATIONS = {'line': (13, 12), 'heavy': (13, 12), 'shock': (15, 14), 'archers': (16, 15), 'screen': (30, 26),
              'wedge': (26, 28.6), 'pack': (22, 22), 'cloud': (24, 24)}
# the mockup's terrain grounds (src/50-ground.js): plains dry grass, farmland stubble, swamp mud (the darkest), snow
GROUNDS = {'plains': '#A8A784', 'farmland': '#B4A27E', 'swamp': '#8E8E78', 'forest': '#938E70'}


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float64)


def load(path):
    return np.asarray(Image.open(path).convert('RGBA')).astype(np.float64)


def norm_sil(mask, anchor, height, size=192, H=128):
    """A silhouette scaled so `height` px -> H px, aligned on its own ground point (the centre of its lowest 25%,
    at its lowest row) placed at (size/2, size - 24), so two silhouettes compare by shape whatever their anchors."""
    ys, xs = np.nonzero(mask)
    band = ys >= ys.max() - 0.25 * (ys.max() - ys.min())
    anchor = (float(xs[band].mean()), float(ys.max()))
    k = H / max(1, height)
    im = Image.fromarray((mask * 255).astype(np.uint8)).resize((max(1, round(mask.shape[1] * k)), max(1, round(mask.shape[0] * k))), Image.BILINEAR)
    out = Image.new('L', (size, size), 0)
    out.paste(im, (int(round(size / 2 - anchor[0] * k)), int(round(size - 24 - anchor[1] * k))))
    return np.asarray(out) > 127


def iou(a, b):
    u = (a | b).sum()
    return float((a & b).sum() / u) if u else 0.0


def head_dx(sil):
    # an opening (5 px at the normalised 128 px height) removes staffs, spears and bows held above the head first
    m = Image.fromarray((sil * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    sil = np.asarray(m) > 127
    ys, xs = np.nonzero(sil)
    top = ys <= ys.min() + 0.15 * (ys.max() - ys.min())
    foot = ys >= ys.max() - 0.05 * (ys.max() - ys.min())
    return float((xs[top].mean() - np.median(xs[foot])) / max(1, ys.max() - ys.min()))


def guide_cells(guide_png, fig, view):
    """The guide sheet's cells, sliced the same way (the guide is already on a clean key)."""
    meta = json.load(open(os.path.join(os.path.dirname(guide_png), 'guides.json')))[f'{fig}.{view}']
    rgb = np.asarray(Image.open(guide_png).convert('RGB')).astype(np.float64) / 255
    key = rgb[2, 2]
    m = np.abs(rgb - key).sum(-1) > 0.2
    cols, rows = meta['grid']; cw, ch = meta['size'][0] / cols, meta['size'][1] / rows
    cells = {}
    for c in meta['cells']:
        x0, y0 = int(c['col'] * cw), int(c['row'] * ch)
        sub = m[y0:int(y0 + ch), x0:int(x0 + cw)]
        if not sub.any():
            continue
        ys, xs = np.nonzero(sub)
        anchor = (c['anchor'][0] - x0, c['anchor'][1] - y0)
        cells[c['cell']] = dict(mask=sub, anchor=anchor, height=int(ys.max() - ys.min() + 1))
    return cells


def frame_mask(d, f):
    im = load(os.path.join(d, f['file']))
    return im, im[..., 3] > 0.35 * 255


def camera_and_variety(d, meta, guide, robe=False):
    frames = {f['name']: f for f in meta['frames'] if not f.get('missing')}
    out = {}
    st = frames.get('stand') or frames.get('idle') or next(iter(frames.values()))
    _, sm = frame_mask(d, st)
    H = st['height']
    sil = {}
    for n, f in frames.items():
        _, m = frame_mask(d, f)
        sil[n] = norm_sil(m, f['anchor'], H)  # one scale for the sheet: the stand frame's height
    if guide is not None and 'stand' in guide and 'stand' in frames:
        g = guide['stand']
        gs = norm_sil(g['mask'], g['anchor'], g['height'])
        ps = norm_sil(sm, st['anchor'], H)
        gm = gs[:, ::-1]
        ys, xs = np.nonzero(sm); gy, gx = np.nonzero(g['mask'])
        ar = ((np.ptp(xs) + 1) / (np.ptp(ys) + 1)) / ((np.ptp(gx) + 1) / (np.ptp(gy) + 1))
        out['camera'] = dict(iou=round(iou(ps, gs), 3), iouMirrored=round(iou(ps, gm), 3), aspectRatio=round(float(ar), 3),
                             headDx=round(head_dx(ps), 3), guideHeadDx=round(head_dx(gs), 3))
        c = out['camera']
        c['pass'] = bool(c['iou'] >= CHECKS['cameraIoU'] and CHECKS['aspectRatio'][0] <= ar <= CHECKS['aspectRatio'][1]
                         and abs(c['headDx'] - c['guideHeadDx']) <= CHECKS['headDx'] and c['iou'] - c['iouMirrored'] >= CHECKS['facingMargin'])
    v = {}
    if 'marchA' in sil and 'marchB' in sil:
        a, b = sil['marchA'], sil['marchB']
        cut = int(np.nonzero(a | b)[0].max() - 0.35 * H * 128 / H)
        v['marchIoU'] = round(iou(a, b), 3)
        v['marchLegsIoU'] = round(iou(a[cut:], b[cut:]), 3)
    keys = [k for k in ('stand', 'marchA', 'marchB', 'windup', 'strike', 'recoil', 'draw', 'loose', 'gallopA', 'gallopB', 'charge') if k in sil]
    worst = (None, 0.0)
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            x = iou(sil[keys[i]], sil[keys[j]])
            if x > worst[1]:
                worst = (f'{keys[i]}~{keys[j]}', round(x, 3))
    v['mostAlike'] = worst
    if robe:  # a robe to the ground hides the stride: the walk is the hem's sway and the lean (art plan 6)
        v['robe'] = True
        v['pass'] = bool(v.get('marchIoU', 0) <= CHECKS['marchIoURobe'] and worst[1] <= CHECKS['distinctIoURobe'])
    else:
        v['pass'] = bool(v.get('marchIoU', 0) <= CHECKS['marchIoU'] and v.get('marchLegsIoU', 0) <= CHECKS['marchLegsIoU'] and worst[1] <= CHECKS['distinctIoU'])
    out['variety'] = v
    hs = {n: frames[n]['height'] / H for n in frames if n in UPRIGHT}
    out['scale'] = dict(heights={n: round(x, 3) for n, x in hs.items()}, pass_=bool(all(abs(x - 1) <= CHECKS['scaleSpread'] for x in hs.values())))
    return out


def keyline(rgba):
    """The atlas keyline (design 3.8): the silhouette grown 1 px in #1C1A17 at 60% under the figure."""
    a = rgba[..., 3] / 255
    grown = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))).astype(np.float64) / 255
    ink = np.array([28, 26, 23], np.float64)
    la = np.clip(grown * 0.6, 0, 1)
    out_a = a + la * (1 - a)
    rgb = (rgba[..., :3] * a[..., None] + ink * la[..., None] * (1 - a[..., None])) / np.maximum(out_a[..., None], 1e-6)
    return np.dstack([rgb, out_a * 255])


def scaled_figure(rgba, anchor, height_px, f_px):
    """Premultiplied downscale so the standing height becomes f_px; returns rgba and the scaled anchor."""
    k = f_px / height_px
    a = rgba[..., 3:4] / 255
    pm = np.dstack([rgba[..., :3] * a, a * 255])
    im = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), 'RGBA')
    w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
    pm = np.asarray(im.resize((w, h), Image.LANCZOS)).astype(np.float64)
    a = pm[..., 3:4] / 255
    rgb = np.where(a > 0, pm[..., :3] / np.maximum(a, 1e-6), 0)
    return keyline(np.dstack([np.clip(rgb, 0, 255), pm[..., 3]])), (anchor[0] * k, anchor[1] * k)


def formation(fig, anchor, files=8, ranks=4, spacing=(13, 12), ground='#B49A6E', near=True):
    """A block of identical figures at the design's projection (1 wu = 1 px at f = 28), drawn far to near."""
    fw, fh = fig.shape[1], fig.shape[0]
    pts = []
    for j in range(ranks):
        for i in range(files):
            x, y = (i - (files - 1) / 2) * spacing[0], (j - (ranks - 1) / 2) * spacing[1]
            X, Y = 0.866 * x + 0.5 * y, 0.321 * x - 0.557 * y
            pts.append((Y, X))
    pts.sort()
    W = int(0.866 * files * spacing[0] + 0.5 * ranks * spacing[1] + fw * 2 + 40)
    Hh = int(0.321 * files * spacing[0] + 0.557 * ranks * spacing[1] + fh * 2 + 40)
    canvas = np.zeros((Hh, W, 3)); canvas[:] = hexrgb(ground)
    cover = np.zeros((Hh, W))
    for Y, X in pts:
        x0 = int(round(W / 2 + X - anchor[0])); y0 = int(round(Hh / 2 + Y - anchor[1] + fh / 2))
        a = fig[..., 3:4] / 255
        sub = canvas[y0:y0 + fh, x0:x0 + fw]
        sub[:] = fig[..., :3] * a + sub * (1 - a)
        cover[y0:y0 + fh, x0:x0 + fw] = np.maximum(cover[y0:y0 + fh, x0:x0 + fw], fig[..., 3] / 255)
    return canvas, cover


def side_share(canvas, cover, cloth_hex):
    _, C, h = oklch(canvas)
    _, cc, ch = oklch(hexrgb(cloth_hex)[None, None])
    cc, ch = float(cc[0, 0]), float(ch[0, 0])
    dh = np.abs((h - ch + 180) % 360 - 180)
    # in the side's hue: within 20 degrees of the cloth's OKLCH hue, chroma above max(0.04, 0.45 x the cloth's);
    # this keeps shaded and dark cloth (Thornwood dark C 0.057, Cinder dark 0.113) and leaves out ash skin
    # (C 0.061 at hue 52), wood and bark (hue 59 to 63)
    side = (dh <= 20) & (C >= max(0.04, 0.45 * cc))
    vis = cover > 0.5
    # the block's area: the figures and the gaps between them (a morphological closing of the cover, r = 9 px)
    m = Image.fromarray((vis * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(19)).filter(ImageFilter.MinFilter(19))
    area = np.asarray(m) > 127
    L = to_lab(canvas)[..., 0][area].mean()
    return float((side & vis).sum() / max(1, vis.sum())), float(L)


def side_report(rgba, anchor, height, nation_cloth, kind, f_px=28, proof=None):
    fig, anc = scaled_figure(rgba, anchor, height, f_px)
    rep = {}
    imgs = []
    for gname, g in GROUNDS.items():
        canvas, cover = formation(fig, anc, spacing=FORMATIONS.get(kind, (13, 12)), ground=g)
        share, L = side_share(canvas, cover, nation_cloth)
        gL = float(to_lab(hexrgb(g)[None, None])[0, 0, 0])
        rep[gname] = dict(share=round(share, 3), blockL=round(L, 1), groundL=round(gL, 1), below=round(gL - L, 1))
        imgs.append(canvas)
    rep['share'] = rep['plains']['share']
    rep['pass'] = bool(rep['share'] >= CHECKS['sideShare'] and all(rep[g]['below'] >= CHECKS['valueBelowGround'] for g in GROUNDS))
    if proof:
        hmax = max(i.shape[0] for i in imgs)
        strip = np.concatenate([np.pad(i, ((0, hmax - i.shape[0]), (0, 4), (0, 0)), constant_values=28) for i in imgs], 1)
        im = Image.fromarray(np.clip(strip, 0, 255).astype(np.uint8))
        im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
        im.save(proof)
    return rep


def main():
    args = sys.argv[1:]
    opt = {}
    for k in ('--guide', '--key', '--proof', '--f'):
        if k in args:
            i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
    units = json.load(open(os.path.join(HERE, '..', 'units.json')))
    if args[0] == '--figure-png':
        _, png, nation, kind = args[:4]
        rgba = load(png)
        if (rgba[..., 3] < 255).sum() == 0:  # an unkeyed render on a flat key: key it like a generated sheet
            from key import key_image
            r, g, b = rgba[2, 2, :3]
            kc = 'green' if g > 200 and r < 60 else 'magenta' if r > 200 and b > 200 else 'blue'
            rgba = key_image(png, kc, erode=0)[0] * 255
        m = rgba[..., 3] > 90
        ys, xs = np.nonzero(m)
        bottom = ys.max(); band = ys >= bottom - 3
        anchor = (float(np.median(xs[band])), float(bottom))
        cloth = units['nations'][nation]['cloth']['hex'] if nation in units['nations'] else '#8C8A80'
        rep = side_report(rgba, anchor, int(np.ptp(ys) + 1), cloth, kind, f_px=float(opt.get('--f', 28)), proof=opt.get('--proof'))
        print(json.dumps(dict(file=os.path.basename(png), nation=nation, formation=kind, **rep)))
        return
    d, fig, view = args[:3]
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    u = next(x for x in units['units'] if x['id'] == fig)
    guide = guide_cells(opt['--guide'], fig, view) if '--guide' in opt else None
    rep = dict(figure=fig, view=view, missing=meta['missing'], overlaps=meta['overlaps'])
    rep.update(camera_and_variety(d, meta, guide, robe=bool((u.get('gear') or {}).get('robe'))))
    if '--key' in opt:
        k = json.load(open(opt['--key']))
        rep['fringe'] = dict(spillEdgePct=k['spillEdgePct'], keyInUnitPct=k['keyInUnitPct'], fringePct=k['fringePct'],
                             edgeDevPct=k.get('edgeDevPct'),
                             pass_=bool(k['fringePct'] <= CHECKS['fringePct'] and k['keyInUnitPct'] <= CHECKS['keyInUnitPct']
                                        and (k.get('edgeDevPct') or 0) <= CHECKS['edgeDevPct']))
    if u['role'] == 'troop':
        st = next(f for f in meta['frames'] if f['name'] in ('stand', 'wingMid', 'up0') and not f.get('missing'))
        rgba = load(os.path.join(d, st['file']))
        kind = u.get('formation') or ('archers' if u['layout'] == 'archer' else 'screen' if u['layout'] == 'thrower' else
                                      'wedge' if u['layout'] in ('cavalry', 'wolfrider') else 'cloud' if u['layout'] in ('sprite', 'hornet') else 'heavy')
        rep['side'] = side_report(rgba, st['anchor'], st['height'], units['nations'][u['nation']]['cloth']['hex'], kind, proof=opt.get('--proof'))
    rep['thresholds'] = CHECKS
    print(json.dumps(rep, indent=1))


if __name__ == '__main__':
    main()
