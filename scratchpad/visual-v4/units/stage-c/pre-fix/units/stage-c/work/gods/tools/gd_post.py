# Stage C gods: one generated idle image -> keyed (tools/key.py), rim-fixed (ad_rimfix), sliced (slice.py --single),
# its ground anchor mapped from the maquette (pilot review change 12, as ad_page.maquette_anchor does for the
# Salamander), and checked:
#   camera   the cutout's silhouette against its maquette's, one height, each on its own ground point (checks.norm_sil):
#            IoU >= 0.60, IoU - IoU with the mirrored maquette >= 0.03 (facing), aspect 0.75 to 1.33 of the maquette's,
#            head offset over the feet within 0.10 heights of the maquette's (art plan 8.6)
#   rim      the opaque boundary ring's share whose hue moved toward the key (ad_measures.rim) <= 2% (review change 15)
#   fringe   key.py: fringePct <= 0.2, keyInUnitPct <= 0.5, edgeDevPct <= 8
#   value    the body at tier S with its keyline on the four battle grounds: its mean L* at least 15 below each
#   side     the tint zone in the nation's colour: share of the body's pixels in the cloth window (plan 1.4 rule), and
#            for Thornwood the calibrated lock (hue 90 to 230); gated as the portraits are (Cinder window >= 0.03;
#            Thornwood lock >= 0.05 and window >= 0.01), reported beside the portrait's own share
#   size     the maquette at its ladder height (world height / ladder: 1.0 for upright bodies; the serpent keeps the
#            approved Salamander's body plan, 0.48 to 0.50), the cutout's box matching the maquette's (the aspect gate),
#            and its screen length within the design's long-body box (2.6x the ladder height for wyrms, 2x otherwise)
#   identity CIEDE2000 between the body's median colour and its portrait subject's (plan 5.5: < 18), whole body and
#            upper third; the identity marks are ticked by eye on the contact sheet
# Usage: python3 -I gd_post.py GOD VIEW RAW.png [--fig FIGURE_ID] [--nation cinderHorde|thornwood] [--keyed KEYED.png]
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import UNITS, resolve  # noqa: E402
sys.path.insert(0, os.path.join(UNITS, 'tools'))
sys.path.insert(0, os.path.join(UNITS, '..', 'tools'))
sys.path.insert(0, os.path.join(UNITS, 'stage-b', 'work', 'portraits', 'tools'))
import key as keymod  # noqa: E402
import ad_rimfix  # noqa: E402
import slice as slicer  # noqa: E402
import checks  # noqa: E402
from pack import premul_resize  # noqa: E402
from v4color import to_lab, oklch  # noqa: E402
from pilot_metrics import de2000  # noqa: E402
from pt_checks import cloth_window, thorn_lock  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..'))
GUIDES = os.path.join(W, 'guides')
KEYS = {'green': np.array([0, 255, 0.]), 'magenta': np.array([255, 0, 255.]), 'blue': np.array([0, 0, 255.])}
LONG = {'greatWyrm': 2.6, 'ashPhoenix': 2.6}  # wyrm-class box; other long bodies 2x (battle-overhead.md 3.2)
SERPENT = {'elderWyrm'}
GATES = dict(cameraIoU=0.60, facing=0.03, aspect=(0.75, 1.33), headDx=0.10, rim=2.0, fringe=0.2, keyInUnit=0.5,
             edgeDev=8.0, valueBelow=15.0, sideCinder=0.03, sideThornLock=0.05, sideThornWindow=0.01, identity=18.0)


def guide_mask(g, view):
    G = json.load(open(os.path.join(GUIDES, 'guides-merged.json')))[f'{g}.idle.{view}']
    rgb = np.asarray(Image.open(os.path.join(GUIDES, f'{g}.idle.{view}.png')).convert('RGB')).astype(np.float64) / 255
    key = rgb[2, 2]
    return G, np.abs(rgb - key).sum(-1) > 0.2


def maquette_anchor(alpha, G):
    """The maquette's ground anchor mapped onto the cutout's alpha box (ad_page.maquette_anchor)."""
    gx0, gy0, gx1, gy1 = G['box']
    gx1 += 1; gy1 += 1
    ax, ay = G['anchor']
    ys, xs = np.nonzero(alpha > 90 / 255)
    fx0, fx1, fy0, fy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return [float(fx0 + (ax - gx0) / (gx1 - gx0) * (fx1 - fx0)), float(fy0 + (ay - gy0) / (gy1 - gy0) * (fy1 - fy0))]


def camera(mask, gmask):
    def sil(m):
        ys, xs = np.nonzero(m)
        return checks.norm_sil(m, None, int(ys.max() - ys.min() + 1), size=288, H=170)
    ps, gs = sil(mask), sil(gmask)
    ys, xs = np.nonzero(mask); gy, gx = np.nonzero(gmask)
    ar = ((np.ptp(xs) + 1) / (np.ptp(ys) + 1)) / ((np.ptp(gx) + 1) / (np.ptp(gy) + 1))
    c = dict(iou=round(checks.iou(ps, gs), 3), iouMirrored=round(checks.iou(ps, gs[:, ::-1]), 3), aspectRatio=round(float(ar), 3),
             headDx=round(checks.head_dx(ps), 3), guideHeadDx=round(checks.head_dx(gs), 3))
    c['facingMargin'] = round(c['iou'] - c['iouMirrored'], 3)
    c['pass'] = bool(c['iou'] >= GATES['cameraIoU'] and c['facingMargin'] >= GATES['facing']
                     and GATES['aspect'][0] <= ar <= GATES['aspect'][1] and abs(c['headDx'] - c['guideHeadDx']) <= GATES['headDx'])
    return c, ps, gs


def rim(rgba, key):
    a = rgba[..., 3] / 255
    rgb = rgba[..., :3]
    trans = (a < 0.5).astype(np.uint8) * 255
    near = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(5))) > 127
    ring = near & (a >= 0.97)
    far = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(11))) > 127
    core = (~far) & (a >= 0.97)
    num = np.zeros_like(rgb); den = np.zeros(a.shape)
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            num += np.roll(np.roll(rgb * core[..., None], dy, 0), dx, 1)
            den += np.roll(np.roll(core.astype(float), dy, 0), dx, 1)
    ok = ring & (den > 0)
    inner = num[ok] / den[ok][:, None]
    _, Cp, hp = oklch(rgb[ok][None]); _, Ci, hi = oklch(inner[None]); _, _, hk = oklch(KEYS[key][None, None])
    Cp, hp, Ci, hi = Cp[0], hp[0], Ci[0], hi[0]
    d_pk = (hp - hi + 180) % 360 - 180
    d_ik = (float(hk[0, 0]) - hi + 180) % 360 - 180
    toward = (np.sign(d_pk) == np.sign(d_ik)) & (np.abs(d_pk) > 20) & (np.abs(d_pk) <= np.abs(d_ik) + 10)
    mixed = toward & (Cp > 0.04) & (Ci > 0.04)
    pct = round(100 * float(mixed.mean()), 2) if ok.any() else 0.0
    return dict(ringPx=int(ok.sum()), keyHueShiftedPct=pct, pass_=bool(pct <= GATES['rim']))


def tier_s(rgba, height_px_src, height_wu):
    k = (height_wu / 0.5) / height_px_src
    s = premul_resize(rgba, k)
    return checks.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))


def value(rgba_s):
    a = rgba_s[..., 3] / 255
    m = Image.fromarray(((a > 0.5) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    area = np.asarray(m) > 127
    out = {}
    for name, g in checks.GROUNDS.items():
        gr = checks.hexrgb(g)
        comp = rgba_s[..., :3] * a[..., None] + gr * (1 - a[..., None])
        L = float(to_lab(comp)[..., 0][area].mean())
        gL = float(to_lab(gr[None, None])[0, 0, 0])
        out[name] = dict(bodyL=round(L, 1), groundL=round(gL, 1), below=round(gL - L, 1))
    out['worstBelow'] = min(v['below'] for v in out.values() if isinstance(v, dict))
    out['pass'] = bool(out['worstBelow'] >= GATES['valueBelow'])
    return out


def side(rgba, nation, portrait_side):
    a = rgba[..., 3] / 255
    m = a > 0.9
    rgb = rgba[..., :3]
    win = float((cloth_window(rgb, nation) & m).sum() / max(1, m.sum()))
    out = dict(nation=nation, window=round(win, 4), portrait=portrait_side)
    if nation == 'thornwood':
        out['lock'] = round(float((thorn_lock(rgb) & m).sum() / max(1, m.sum())), 4)
        out['pass'] = bool(out['lock'] >= GATES['sideThornLock'] and win >= GATES['sideThornWindow'])
    else:
        out['pass'] = bool(win >= GATES['sideCinder'])
    return out


def portrait_subject_lab(path):
    im = Image.open(path).convert('RGB').resize((512, 512), Image.LANCZOS)
    lab = to_lab(np.asarray(im).astype(np.float64))
    blab = to_lab(np.array([[[28, 26, 23]]], np.float64))[0, 0]
    m = np.sqrt(((lab - blab) ** 2).sum(-1)) > 9
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))) > 127
    ys = np.nonzero(m)[0]
    top = m.copy(); top[ys.min() + int((ys.max() - ys.min()) / 3):] = False
    return np.median(lab[m], 0), np.median(lab[top], 0)


def identity(rgba, portrait_png):
    a = rgba[..., 3] / 255
    m = a > 0.9
    lab = to_lab(rgba[..., :3])
    ys = np.nonzero(m)[0]
    top = m.copy(); top[ys.min() + int((ys.max() - ys.min()) / 3):] = False
    pw, pt = portrait_subject_lab(portrait_png)
    fw, ft = np.median(lab[m], 0), np.median(lab[top], 0)
    dw, dt = float(de2000(fw, pw)), float(de2000(ft, pt))
    return dict(dE_whole=round(dw, 1), dE_upperThird=round(dt, 1), figureL=round(float(fw[0]), 1), portraitL=round(float(pw[0]), 1),
                pass_=bool(dw < GATES['identity']))


def size(G, cam, god):
    L = G['ladder']; wr = G['worldHeightMen'] / L
    cap = LONG.get(god, 2.0) * L * 28
    ok_world = (0.45 <= wr <= 0.55) if god in SERPENT else (0.9 <= wr <= 1.1)
    return dict(sizeClass=G['sizeClass'], ladder=L, ladderWu=round(L * 28, 1), worldHeightMen=G['worldHeightMen'], worldRatio=round(wr, 3),
                heightWu=G['heightWu'], widthWu=G['widthWu'], lengthCapWu=round(cap, 1),
                rule='serpent: the Salamander body plan (its world height 0.50 of its ladder)' if god in SERPENT else 'world height = ladder multiple',
                pass_=bool(ok_world and G['widthWu'] <= cap and cam['pass']))


def process(god, view, raw, fig=None, nation=None, keyed=None, tag=None):
    R = resolve()
    G, gmask = guide_mask(god, view)
    key = G['key']
    nation = nation or ('thornwood' if key == 'magenta' else 'cinderHorde')
    fig = fig or f'{god}-{nation}'
    tag = tag or os.path.basename(raw).rsplit('.png', 1)[0]
    wdir = os.path.join(W, 'cut', tag)
    os.makedirs(wdir, exist_ok=True)
    if keyed is None:
        rgba, krep = keymod.key_image(raw, key, 1)
        rgba = rgba.astype(np.float64) * 255
        rgba, rimshare = ad_rimfix.fix(rgba, key)
        krep['rimFixedPct'] = round(100 * rimshare, 2)
        keyed = os.path.join(wdir, f'{tag}.keyed.png')
        Image.fromarray(np.clip(rgba + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(keyed)
        json.dump(krep, open(os.path.join(wdir, 'key.json'), 'w'), indent=1)
    else:
        krep = json.load(open(os.path.join(os.path.dirname(keyed), 'key.json'))) if os.path.exists(os.path.join(os.path.dirname(keyed), 'key.json')) else {}
    meta = slicer.slice_single(keyed, fig, view, 'idle', wdir)
    cut = os.path.join(wdir, meta['file'])
    rgba = np.asarray(Image.open(cut).convert('RGBA')).astype(np.float64)
    alpha = rgba[..., 3] / 255
    mask = alpha > 0.35
    meta['anchorSlicer'] = meta['anchor']
    meta['anchor'] = [round(v, 1) for v in maquette_anchor(alpha, G)]
    meta['anchorFrom'] = 'maquette (guide ground anchor mapped onto the cutout box: pilot review change 12)'
    meta['heightWu'] = G['heightWu']; meta['widthWu'] = G['widthWu']
    meta['guide'] = dict(file=f'{god}.idle.{view}.png', box=G['box'], anchor=[round(v, 2) for v in G['anchor']], k=G['k'])
    json.dump(meta, open(os.path.join(wdir, meta['file'].rsplit('.png', 1)[0] + '.json'), 'w'), indent=1)
    cam, ps, gs = camera(mask, gmask)
    pick = R[god].get(nation) or R[god]['cinderHorde']
    pside = json.load(open(pick['sidecar'])).get('checks', {}).get('measures', {}).get('side')
    s_img = tier_s(rgba, meta['height'], G['heightWu'])
    rep = dict(god=god, view=view, figure=fig, nation=nation, raw=os.path.relpath(raw, UNITS), cutout=os.path.relpath(cut, UNITS),
               camera=cam, rim=rim(rgba, key),
               fringe=dict(fringePct=krep.get('fringePct'), keyInUnitPct=krep.get('keyInUnitPct'), edgeDevPct=krep.get('edgeDevPct'),
                           pass_=bool((krep.get('fringePct') or 0) <= GATES['fringe'] and (krep.get('keyInUnitPct') or 0) <= GATES['keyInUnit']
                                      and (krep.get('edgeDevPct') or 0) <= GATES['edgeDev'])),
               value=value(s_img), side=side(rgba, nation, pside), size=size(G, cam, god),
               identity=identity(rgba, pick['p512']), parts=meta['parts'], specks=meta['specks'],
               cutoutPx=[int(rgba.shape[1]), int(rgba.shape[0])], tierHpx=[round(G['widthWu'] * 4), round(G['heightWu'] * 4)])
    rep['tierHupscale'] = round(G['heightWu'] * 4 / meta['height'], 2)
    rep['pass'] = all(rep[k].get('pass', rep[k].get('pass_')) for k in ('camera', 'rim', 'fringe', 'value', 'side', 'size'))
    rep['failed'] = [k for k in ('camera', 'rim', 'fringe', 'value', 'side', 'size', 'identity') if not rep[k].get('pass', rep[k].get('pass_'))]
    json.dump(rep, open(os.path.join(wdir, 'checks.json'), 'w'), indent=1)
    # the camera proof: maquette silhouette (red), cutout (green), overlap (yellow)
    proof = np.zeros(ps.shape + (3,), np.uint8)
    proof[..., 0] = gs * 255; proof[..., 1] = ps * 255
    Image.fromarray(proof).save(os.path.join(wdir, 'camera-proof.png'))
    return rep


if __name__ == '__main__':
    args = sys.argv[1:]
    opt = {}
    for k in ('--fig', '--nation', '--keyed', '--tag'):
        if k in args:
            i = args.index(k); opt[k[2:]] = args[i + 1]; del args[i:i + 2]
    r = process(args[0], args[1], args[2], **opt)
    print(json.dumps({k: r[k] for k in ('god', 'view', 'pass', 'failed')}), json.dumps(r['camera']), json.dumps(r['side']),
          'value', r['value']['worstBelow'], 'identity', r['identity'], 'rim', r['rim']['keyHueShiftedPct'], 'upscaleH', r['tierHupscale'])
