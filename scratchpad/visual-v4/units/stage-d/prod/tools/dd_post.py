# Rest of stage D: one generated action image (a 2 x 2 sheet or a single cutout) -> keyed, rim-fixed, sliced frames, each
# registered to its maquette, with its scale, ground anchor, rig anchors, mesh region weights and checks (art plan 8):
#   key       the stage C keyer (units/stage-c/work/creatures/sbx/tools/key.py = tools/key.py + --shafts; --shafts on for
#             the bodies with long thin hafts: glaive, spear, staff, sword, club) and the art director's rim fix (ad_rimfix)
#   slice     per cell: the slicer's components in a window 22% larger than the cell (slice.frame_from); singles: the
#             slicer's main component (slice_single)
#   register  the cell's maquette silhouette (the guide's part-ID pass) to the painted silhouette: centroid and area first,
#             then an affine fit (scale, aspect, shear, shift) by coordinate descent on IoU at about 220 px
#   scale     wu per px = the maquette's wu per px / the fitted scale, times the figure's idle correction: the approved idle
#             cutout registered the same way to its own idle maquette, against the shipped idle scale (heightWu / height:
#             the commander factor 1.15 of the gods and stage C's height override come with it), so every action keeps the
#             approved idle's size and only the pose changes it
#   anchors   the ground anchor (the maquette's world origin under the body, mapped), and the rig points mapped and snapped
#             to the paint: weapon tip, mouth (breath origin), feet (stomps), hands
#   weights   the warped part-ID map, filled to every painted pixel by the nearest part, one-hot per part, blurred (sigma 4%
#             of the frame's longer side), normalised, sampled at a 24 x 16 vertex grid over the frame's texture (art plan 6)
#   checks    camera (box-normalised IoU against the maquette, facing margin against its mirror), fit IoU, cut-off (the
#             frame touching its window or the image edge), keyer fringe, rim, value on the four grounds at tier S, identity
#             (CIEDE2000 of the median colour, whole and upper third, against the approved idle cutout), scale (step frames'
#             height within 15% of the idle's)
# Usage: python3 -I dd_post.py JOB [--raw RAW.png] [--tag TAG]    (JOB from prod/jobs/actions.json)
#        python3 -I dd_post.py --idle FIGURE VIEW                 (the idle cutout: registration, correction, weights)
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
PROD = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(PROD, '..'))
UNITS = os.path.abspath(os.path.join(STAGE, '..'))
SBX = os.path.join(UNITS, 'stage-c', 'work', 'creatures', 'sbx', 'tools')
GODT = os.path.join(UNITS, 'stage-c', 'work', 'gods', 'tools')
sys.path.insert(0, GODT)
import gd_post  # noqa: E402  (rim, value, tier_s; puts units/tools on the path)
sys.path.insert(0, SBX)
import importlib.util as _ilu  # noqa: E402
_spec = _ilu.spec_from_file_location('key_sbx', os.path.join(SBX, 'key.py'))
keymod = _ilu.module_from_spec(_spec); _spec.loader.exec_module(keymod)  # the stage C keyer (tools/key.py + --shafts)
_edge_dev_full = keymod.edge_deviation


def _edge_dev_half(rgb, alpha):
    """The keyer's edge deviation (a report figure) on every second pixel: the same measure in a quarter of the time."""
    return _edge_dev_full(rgb[::2, ::2], alpha[::2, ::2])


keymod.edge_deviation = _edge_dev_half
_bleed_full = keymod.bleed


def _bleed10(rgb, alpha, iters=24):
    """The keyer's colour bleed into transparent pixels, 10 px deep instead of 24: the tiers downscale 2x or more and the
    Lanczos kernel reaches 3 tier px (6 to 9 source px), so 10 is enough and the sheet keys in half the time."""
    return _bleed_full(rgb, alpha, min(iters, 10))


keymod.bleed = _bleed10
import ad_rimfix  # noqa: E402
import slice as slicer  # noqa: E402
import checks  # noqa: E402
from v4color import to_lab  # noqa: E402
from pilot_metrics import de2000  # noqa: E402
import dd_jobs  # noqa: E402
from dd_thick import thickness  # noqa: E402

GUIDES = os.path.join(PROD, 'guides')
CUT = os.path.join(PROD, 'cut')
SHAFTS = {'titan', 'ascendedHero', 'oracle', 'pyreLord', 'emberHierophant', 'hornedHunter', 'motherOfBeasts', 'giant'}
LYING = {'dead', 'burnOutB', 'shattered', 'dissolving'}
AIR = {'flight', 'glide', 'wingsUp', 'wingsDown', 'rake', 'hit', 'dive', 'burnOutA'}  # for the Phoenix; flight for the Great Wyrm
GRID_W, GRID_H = 24, 16
GATES = dict(facing=0.03, iouNorm=0.45, rim=2.0, fringe=0.2, keyInUnit=0.5, edgeDev=8.0, valueBelow=15.0, identity=10.0, stepScale=0.15)


def figure_rec(fig):
    if fig in dd_jobs.CREATURES:
        return dd_jobs.CREATURES[fig]
    return dd_jobs.GODS[fig]


def rig_of(body):
    return body


# ---------------------------------------------------------------- the shipped idle scale
def shipped_idle(fig, view):
    """(heightWu, cutout height px, anchor px) of the approved idle cutout."""
    p = dd_jobs.idle_path(fig, view)
    a = np.asarray(Image.open(p).convert('RGBA'))[..., 3] > 0.35 * 255
    ys, xs = np.nonzero(a)
    hpx = int(ys.max() - ys.min() + 1)
    if fig == 'salamander-01':
        m = json.load(open(p.replace('.png', '.json')))
        G = json.load(open(os.path.join(UNITS, 'refs', 'guides', 'guides.json')))[f'salamander-01.idle.{view}']
        import dd_guides
        wpr = dd_guides.wu_per_rig()
        hw = (G['box'][3] - G['box'][1]) * G['k'] * wpr
        sys.path.insert(0, os.path.join(UNITS, 'tools'))
        return hw, m['height'], None
    if fig in dd_jobs.CREATURES:
        f = json.load(open(os.path.join(UNITS, 'stage-c', 'atlas', 'creatures', 'figures', fig + '.json')))['views'][view]
        m = json.load(open(p.replace('.png', '.json')))
        return f['heightWu'], m.get('height', hpx), f.get('anchorPx')
    g = json.load(open(os.path.join(UNITS, 'stage-c', 'atlas', 'gods', 'gods.json')))['figures'][fig]['views'][view]
    return g['heightWu'], g['height'], g['anchor']


# ---------------------------------------------------------------- registration
def _warp(mask, M, t, shape):
    """Maps a binary mask by p = M g + t into an image of `shape` (nearest)."""
    Mi = np.linalg.inv(M)
    ti = -Mi @ t
    im = Image.fromarray((mask * 255).astype(np.uint8))
    out = im.transform((shape[1], shape[0]), Image.AFFINE, data=(Mi[0, 0], Mi[0, 1], ti[0], Mi[1, 0], Mi[1, 1], ti[1]), resample=Image.NEAREST)
    return np.asarray(out) > 127


def _iou(a, b):
    u = (a | b).sum()
    return float((a & b).sum() / u) if u else 0.0


def _open(m, frac=0.035):
    ys = np.nonzero(m)[0]
    if not len(ys):
        return m
    r = max(3, int(frac * (ys.max() - ys.min() + 1)) // 2 * 2 + 1)
    o = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(r)).filter(ImageFilter.MaxFilter(r))) > 127
    return o if o.sum() > 0.5 * m.sum() else m


def register(gmask, pmask, s_target=None):
    """Affine (M, t) with painted ~ M @ guide + t, both masks in one pixel frame. The bodies' boxes (after an opening that
    drops thin hafts, staffs and tails' tips) give the start: x and y scale from the box widths and heights, the boxes'
    corners aligned (stage C's maquette-anchor mapping); then a bounded fit (scale and aspect within 12%, shear within 0.2,
    shift within 6% of the size) by coordinate descent on IoU at about 220 px. Returns M, t, fitted IoU, parameters."""
    H, W = pmask.shape
    r = max(1.0, max(H, W) / 220.0)
    sh = (int(np.ceil(H / r)), int(np.ceil(W / r)))
    def small(m):
        return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((sh[1], sh[0]), Image.BILINEAR)) > 127
    g, p = _open(small(gmask)), _open(small(pmask))
    gy, gx = np.nonzero(g); py, px = np.nonzero(p)
    gw, gh = np.ptp(gx) + 1, np.ptp(gy) + 1
    pw, ph = np.ptp(px) + 1, np.ptp(py) + 1
    sx0, sy0 = pw / gw, ph / gh
    g0 = np.array([gx.min(), gy.min()]); p0 = np.array([px.min(), py.min()])
    if s_target is not None:  # the scale is known (from the areas): start there, aligned on the centroids, and fit the rest
        sx0 = sy0 = s_target
        g0 = np.array([gx.mean(), gy.mean()]); p0 = np.array([px.mean(), py.mean()])
    prm = dict(s=0.0, a=0.0, h=0.0, tx=0.0, ty=0.0)
    def M_of(q):
        return np.array([[sx0 * (1 + q['s']) * (1 + q['a']), q['h'] * sy0], [0.0, sy0 * (1 + q['s']) / (1 + q['a'])]])
    def t_of(q, M):
        return p0 + np.array([q['tx'], q['ty']]) - M @ g0
    def ev(q):
        M = M_of(q)
        return _iou(_warp(g, M, t_of(q, M), p.shape), p)
    best = ev(prm)
    size = max(pw, ph)
    bounds = dict(s=0.12, a=0.12, h=0.2, tx=0.06 * size, ty=0.06 * size) if s_target is None else \
        dict(s=0.08, a=0.10, h=0.15, tx=0.12 * size, ty=0.12 * size)
    steps = dict(s=0.04, a=0.04, h=0.05, tx=0.02 * size, ty=0.02 * size)
    for _ in range(4):
        improved = True
        while improved:
            improved = False
            for k_ in ('tx', 'ty', 's', 'a', 'h'):
                for sg in (1, -1):
                    q = dict(prm); q[k_] += sg * steps[k_]
                    if abs(q[k_]) > bounds[k_]:
                        continue
                    v = ev(q)
                    if v > best + 1e-4:
                        best, prm, improved = v, q, True
        steps = {k_: v / 2 for k_, v in steps.items()}
    M = M_of(prm)
    t = t_of(prm, M)
    prm['a'] = 1 + prm['a']
    return M, t * r, best, prm


def apply(M, t, pt):
    return (M @ np.asarray(pt, float) + t).tolist()


# ---------------------------------------------------------------- part weights
def fill_labels(lab, opaque, iters=400):
    """Unlabelled opaque pixels take the label of the nearest labelled pixel (repeated 3x3 propagation)."""
    lab = lab.copy()
    todo = opaque & (lab == 0)
    for _ in range(iters):
        if not todo.any():
            break
        p = np.pad(lab, 1)
        cand = np.zeros_like(lab)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                v = p[1 + dy:1 + dy + lab.shape[0], 1 + dx:1 + dx + lab.shape[1]]
                cand = np.where((cand == 0) & (v > 0), v, cand)
        grow = todo & (cand > 0)
        lab[grow] = cand[grow]
        todo &= ~grow
    return lab


def weights(lab_full, alpha, legend):
    """Per-vertex region weights on a 24 x 16 grid over the frame texture (art plan 6)."""
    H, W = alpha.shape
    r = max(1.0, max(H, W) / 256.0)
    sh = (max(2, int(round(W / r))), max(2, int(round(H / r))))
    lab = np.asarray(Image.fromarray(lab_full.astype(np.uint8)).resize(sh, Image.NEAREST))
    a = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).resize(sh, Image.BILINEAR)).astype(np.float32) / 255
    present = sorted(set(np.unique(lab)) - {0})
    sigma = 0.04 * max(sh)
    maps = {}
    for i in present:
        m = ((lab == i) & (a > 0.2)).astype(np.float32)
        maps[i] = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32) / 255 + 1e-6 * m
    stack = np.stack([maps[i] for i in present], 0)
    tot = stack.sum(0)
    # far outside the figure, a vertex follows the nearest part (a wide blur), so the mesh never tears there
    wide = np.stack([np.asarray(Image.fromarray(np.clip(maps[i] * 255 * 40, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma * 4))).astype(np.float32)
                     for i in present], 0) + 1e-9
    w = np.where(tot[None] > 0.02, stack / np.maximum(tot[None], 1e-9), wide / wide.sum(0, keepdims=True))
    xs = np.linspace(0, sh[0] - 1, GRID_W).round().astype(int)
    ys = np.linspace(0, sh[1] - 1, GRID_H).round().astype(int)
    out = {}
    for k_, i in enumerate(present):
        out[legend[i - 1]] = np.round(w[k_][np.ix_(ys, xs)], 3).tolist()
    dom = np.array(present)[np.argmax(w, 0)]
    return out, dom, sh


# ---------------------------------------------------------------- checks
def identity_vs(rgba, idle_rgba):
    def med(r):
        a = r[..., 3] / 255
        m = a > 0.9
        lab = to_lab(r[..., :3])
        ys = np.nonzero(m)[0]
        top = m.copy(); top[ys.min() + int((ys.max() - ys.min()) / 3):] = False
        return np.median(lab[m], 0), np.median(lab[top], 0)
    fw, ft = med(rgba); iw, it = med(idle_rgba)
    dw, dt = float(de2000(fw, iw)), float(de2000(ft, it))
    return dict(dE_whole=round(dw, 1), dE_upperThird=round(dt, 1), pass_=bool(dw < GATES['identity']))


def camera(pmask, gmask):
    c, ps, gs = gd_post.camera(pmask, gmask)
    return c


def frame_from_fast(alpha, x0, y0, x1, y1, cell_box):
    """slice.frame_from on a 2x or 4x reduced window (the slicer's own components and rules: the cell's largest component by
    its share inside the cell, plus parts mostly inside it that are big or near), then the full-resolution pixels of the
    kept components (the reduced mask grown by the step). The full-size labelling took a minute per 2K sheet."""
    win = alpha[y0:y1, x0:x1]
    st = 4 if max(win.shape) > 1200 else 2
    small_alpha = win[::st, ::st]
    cx0, cy0, cx1, cy1 = [(v - o) // st for v, o in zip(cell_box, (x0, y0, x0, y0))]
    m, flags = slicer.frame_from(np.pad(small_alpha, 0), 0, 0, small_alpha.shape[1], small_alpha.shape[0], (cx0, cy0, cx1, cy1))
    if m is None:
        return None, flags
    big = np.kron(m, np.ones((st, st), bool))[:win.shape[0], :win.shape[1]]
    pad = np.zeros(win.shape, bool); pad[:big.shape[0], :big.shape[1]] = big
    g = pad.copy()
    for _ in range(st + 1):
        q = np.pad(g, 1)
        g = g | q[:-2, 1:-1] | q[2:, 1:-1] | q[1:-1, :-2] | q[1:-1, 2:]
    mask = (win > slicer.A_MIN) & g
    ys, xs = np.nonzero(mask)
    flags['touchesWindow'] = bool(xs.min() == 0 or ys.min() == 0 or xs.max() == win.shape[1] - 1 or ys.max() == win.shape[0] - 1)
    return mask, flags


# ---------------------------------------------------------------- one frame
def frame_record(fig, body, view, action, rgba_cut, box, gcell, gmeta, gparts_cell, f, corr, idle_ref, key, flags, outdir, tag, idle_info=None):
    """rgba_cut: the frame (trimmed, raw px); box: its place in the raw image; gcell: the guide cell record; gparts_cell:
    the guide part map of this cell placed in raw px (full raw image size); f: raw px per guide px."""
    alpha = rgba_cut[..., 3].astype(np.float32) / 255
    pmask = alpha > 0.35
    x0, y0 = box[0], box[1]
    # the guide mask in the frame's own coords
    gfull = gparts_cell > 0
    gcrop = np.zeros_like(pmask)
    H, W = pmask.shape
    gy0, gx0 = y0, x0
    sub = gfull[max(0, gy0):gy0 + H, max(0, gx0):gx0 + W]
    gcrop[:sub.shape[0], :sub.shape[1]] = sub
    # the guide silhouette may run outside the frame box: register on a canvas holding both
    ys, xs = np.nonzero(gfull)
    X0, Y0 = min(x0, xs.min()), min(y0, ys.min())
    X1, Y1 = max(x0 + W, xs.max() + 1), max(y0 + H, ys.max() + 1)
    cg = np.zeros((Y1 - Y0, X1 - X0), bool); cg[ys - Y0, xs - X0] = True
    cp = np.zeros_like(cg); cp[y0 - Y0:y0 - Y0 + H, x0 - X0:x0 - X0 + W] = pmask
    wpp_guide = gcell['wuPerPx'] / f  # wu per raw px on the maquette
    wpp_area = None
    s_target = None
    if idle_info:
        # the pose-robust scale: the painted area against the approved idle's, as the maquette's area changes between the
        # idle pose and this one (a box height follows a raised weapon, a reared head or a pose the painting did not match)
        A_ma = float(gfull.sum()) * wpp_guide ** 2
        wpp_area = idle_info['wpp'] * np.sqrt((A_ma / idle_info['A_maq']) * (idle_info['P_px'] / float(pmask.sum())))
        s_target = wpp_guide * corr / wpp_area
    M, t, fit, prm = register(cg, cp, s_target)
    wpp_thick = None
    if idle_info and 'T_px' in idle_info:
        # where the painting's pose departs from its maquette's (a poor fit), the body's thickness against the idle's decides
        # the scale (art director's look, stage D: the Salamander 01 front's hit and tail lash were drawn smaller in their
        # cells than their maquettes and came out 15 to 26% small by area); a good fit keeps the area scale
        wpp_thick = idle_info['wpp'] * idle_info['T_px'] / thickness(alpha)[0]
        w_area = float(np.clip((fit - 0.65) / 0.10, 0, 1))
        wpp_final = w_area * wpp_area + (1 - w_area) * wpp_thick
        if abs(wpp_final / wpp_area - 1) > 0.05:
            s_target = wpp_guide * corr / wpp_final
            M, t, fit2, prm = register(cg, cp, s_target)
            prm['fitAtAreaScale'] = round(fit, 3); fit = fit2
        wpp_area_only = wpp_area
        wpp_area = wpp_final
    # map guide px (guide image) -> canvas px: g_raw = f * g_guide; canvas = g_raw - (X0, Y0); painted canvas = M canvas + t
    def g2frame(pt):
        q = np.asarray(pt, float) * f - np.array([X0, Y0])
        p = M @ q + t
        return [round(float(p[0] - (x0 - X0)), 1), round(float(p[1] - (y0 - Y0)), 1)]
    scale_fit = float(np.sqrt(abs(np.linalg.det(M))))
    wpp_reg = wpp_guide / scale_fit * corr
    wpp = wpp_area if wpp_area is not None else wpp_reg
    anchor = g2frame(gcell['anchor'])
    pts = {n: g2frame(p) for n, p in gcell['points'].items()}
    # snap: the tip to the painted pixel farthest along the weapon from the hand within 6% of the frame's size; the
    # mouth and feet to the nearest painted pixel
    oy, ox = np.nonzero(pmask)
    R = 0.06 * max(H, W)
    if 'tip' in pts:
        hand = np.array(pts.get('handR', pts.get('fistR', anchor)))
        tp = np.array(pts['tip'])
        d = tp - hand
        d = d / (np.linalg.norm(d) + 1e-6)
        near = (ox - tp[0]) ** 2 + (oy - tp[1]) ** 2 <= R * R
        if near.any():
            pr = (ox[near] - hand[0]) * d[0] + (oy[near] - hand[1]) * d[1]
            j = np.argmax(pr)
            pts['tipSnapped'] = [int(ox[near][j]), int(oy[near][j])]
    # the head's centre from the guide's part map (its 'head' pixels), mapped: the mouth snaps to the painted pixel farthest
    # out along head -> mouth within 10% of the frame's size (the snout tip, the breath origin)
    legend = gmeta['partLegend']
    if 'head' in legend and 'mouth' in pts:
        hy, hx = np.nonzero(gparts_cell == legend.index('head') + 1)
        if len(hx):
            hc = g2frame([hx.mean() / f, hy.mean() / f])
            pts['head'] = hc
            mo = np.array(pts['mouth']); d = mo - np.array(hc); d = d / (np.linalg.norm(d) + 1e-6)
            Rm = 0.10 * max(H, W)
            near = (ox - mo[0]) ** 2 + (oy - mo[1]) ** 2 <= Rm * Rm
            if near.any():
                pr = (ox[near] - hc[0]) * d[0] + (oy[near] - hc[1]) * d[1]
                j = int(np.argmax(pr))
                pts['mouthSnapped'] = [int(ox[near][j]), int(oy[near][j])]
    for n in list(pts):
        if n == 'mouth' and 'mouthSnapped' in pts:
            continue
        if n.startswith(('mouth', 'foot', 'talon', 'hand', 'fist', 'brazier')) and not n.endswith('Snapped'):
            q = np.array(pts[n])
            dd = (ox - q[0]) ** 2 + (oy - q[1]) ** 2
            j = int(np.argmin(dd))
            pts[n + 'Snapped'] = [int(ox[j]), int(oy[j])]
    # part labels: the guide's part map warped into the frame, then filled to every painted pixel
    lab_c = np.zeros_like(cg, np.uint8)
    gp = gparts_cell[Y0:Y1, X0:X1]
    lab_c[:gp.shape[0], :gp.shape[1]] = gp
    Mi = np.linalg.inv(M); ti = -Mi @ t
    lab_w = np.asarray(Image.fromarray(lab_c).transform((cg.shape[1], cg.shape[0]), Image.AFFINE,
                                                         data=(Mi[0, 0], Mi[0, 1], ti[0], Mi[1, 0], Mi[1, 1], ti[1]), resample=Image.NEAREST))
    lab_f = lab_w[y0 - Y0:y0 - Y0 + H, x0 - X0:x0 - X0 + W]
    r = max(1.0, max(H, W) / 384.0)
    sh = (max(2, int(round(W / r))), max(2, int(round(H / r))))
    lab_s = np.asarray(Image.fromarray(lab_f).resize(sh, Image.NEAREST))
    op_s = np.asarray(Image.fromarray((pmask * 255).astype(np.uint8)).resize(sh, Image.NEAREST)) > 127
    lab_s = np.where(op_s, lab_s, 0)
    lab_s = fill_labels(lab_s, op_s)
    lab_full = np.asarray(Image.fromarray(lab_s).resize((W, H), Image.NEAREST))
    wts, dom, wsh = weights(lab_full, alpha, gmeta['partLegend'])
    # checks
    cam = camera(pmask, gcrop if gcrop.any() else cg)
    rgba64 = rgba_cut.astype(np.float64)
    # the rim check on the frame at its tier H size (what the player sees close up; the full 2K frame took 4 s a frame)
    kH = min(1.0, wpp / 0.25)
    rim = gd_post.rim(gd_post.premul_resize(rgba64, kH) if kH < 0.999 else rgba64, key)
    hwu = (int(oy.max() - oy.min() + 1)) * wpp
    val = gd_post.value(gd_post.tier_s(rgba64, int(oy.max() - oy.min() + 1), hwu))
    ident = identity_vs(rgba64, idle_ref['rgba'])
    rec = dict(action=action, file=None, box=list(map(int, box)), size=[W, H], height=int(oy.max() - oy.min() + 1), width=int(ox.max() - ox.min() + 1),
               kind='lying' if action in LYING else 'airborne' if (body, action) in dd_rigs_air() else 'standing',
               wuPerPx=round(wpp, 5), heightWu=round(hwu, 2), anchor=anchor, points=pts,
               registration=dict(fitIoU=round(fit, 3), scale=round(scale_fit, 4), aspect=round(prm['a'], 3), shear=round(prm['h'], 3),
                                 M=np.round(M, 5).tolist(), t=np.round(t, 2).tolist(), guideWuPerPx=gcell['wuPerPx'], rawPerGuidePx=round(f, 4), idleCorrection=round(corr, 4),
                                 wuPerPxFromArea=None if wpp_thick is None else round(wpp_area_only, 5), wuPerPxFromThickness=None if wpp_thick is None else round(wpp_thick, 5),
                                 wuPerPxFromFit=round(wpp_reg, 5), fitAtAreaScale=prm.get('fitAtAreaScale'),
                                 scaleRule='area against the idle where the fit at that scale is 0.75 or better, body thickness against the idle where it is 0.65 or worse, blended between; the fit at the chosen scale places the anchor and the parts'),
               weights=dict(grid=[GRID_W, GRID_H], parts=list(wts), w=wts),
               checks=dict(camera=cam, rim=rim, value=val, identity=ident, cutoff=bool(flags.get('touchesWindow') or flags.get('touchesImage')),
                           parts=flags.get('parts'), specksDropped=flags.get('specksDropped', 0)))
    # a dominant-part preview
    pal = np.array([[0, 0, 0], [230, 25, 75], [60, 180, 75], [255, 225, 25], [0, 130, 200], [245, 130, 48], [145, 30, 180], [70, 240, 240],
                    [240, 50, 230], [210, 245, 60], [250, 190, 212], [0, 128, 128], [220, 190, 255], [170, 110, 40], [255, 250, 200]], np.uint8)
    legend = gmeta['partLegend']
    idx = np.array([legend.index(n) + 1 for n in wts])
    dmap = pal[np.minimum(dom, len(pal) - 1)]
    a_s = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).resize(wsh, Image.BILINEAR))
    Image.fromarray(np.dstack([dmap, a_s])).save(os.path.join(outdir, f'{tag}.{action}.parts.png'))
    return rec


def dd_rigs_air():
    import dd_rigs
    return dd_rigs.FLIGHT


# ---------------------------------------------------------------- idle (correction and weights)
def idle_post(fig, view):
    body, key, noun, prio = figure_rec(fig)
    gid = f'{body}.idle.{view}'
    gmeta = json.load(open(os.path.join(GUIDES, gid + '.json')))
    gparts = np.asarray(Image.open(os.path.join(GUIDES, gid + '.parts.png')))
    rgba = np.asarray(Image.open(dd_jobs.idle_path(fig, view)).convert('RGBA'))
    hw, hpx, anchor_shipped = shipped_idle(fig, view)
    alpha = rgba[..., 3] / 255
    pm = alpha > 0.35
    ys, xs = np.nonzero(pm)
    hpx_now = int(ys.max() - ys.min() + 1)
    wpp_shipped = hw / hpx_now
    # register the idle maquette to the idle cutout: scale the guide to the cutout first (box heights), then fit
    gb = gmeta['cells'][0]['box']
    f = hpx_now / (gb[3] - gb[1] + 1)
    gsc = np.asarray(Image.fromarray(gparts).resize((int(gparts.shape[1] * f), int(gparts.shape[0] * f)), Image.NEAREST))
    # place the scaled guide so its box sits on the cutout's box
    gy, gx = np.nonzero(gsc > 0)
    dx, dy = xs.min() - gx.min(), ys.min() - gy.min()
    canvas = np.zeros((max(rgba.shape[0], gsc.shape[0] + max(0, dy)) + 2, max(rgba.shape[1], gsc.shape[1] + max(0, dx)) + 2), np.uint8)
    yy, xx = gy + dy, gx + dx
    ok = (yy >= 0) & (xx >= 0) & (yy < canvas.shape[0]) & (xx < canvas.shape[1])
    canvas[yy[ok], xx[ok]] = gsc[gy[ok], gx[ok]]
    gpl = canvas[:rgba.shape[0], :rgba.shape[1]]
    cell = dict(gmeta['cells'][0])
    # express the guide cell in the canvas: points and anchor scaled by f and shifted
    cell['anchor'] = [(cell['anchor'][0] * f + dx), (cell['anchor'][1] * f + dy)]
    cell['points'] = {n: [p[0] * f + dx, p[1] * f + dy] for n, p in cell['points'].items()}
    cell['wuPerPx'] = gmeta['cells'][0]['wuPerPx'] / f  # per canvas px
    outdir = os.path.join(CUT, f'{fig}.{view}.idle')
    os.makedirs(outdir, exist_ok=True)
    idle_ref = dict(rgba=rgba.astype(np.float64))
    rec = frame_record(fig, body, view, 'idle', rgba, (0, 0, rgba.shape[1], rgba.shape[0]), cell, gmeta, gpl, 1.0, 1.0, idle_ref,
                       key, {}, outdir, f'{fig}.{view}')
    # rec['wuPerPx'] is the registered scale with the guide expressed at f: the guide wu per px was per guide px, now per
    # canvas px = guide px * f -> divide by f
    wpp_reg = rec['wuPerPx']
    corr = wpp_shipped / wpp_reg
    rec['wuPerPx'] = round(wpp_shipped, 5)
    rec['heightWu'] = round(hw, 2)
    rec['shipped'] = dict(heightWu=hw, heightPx=hpx_now, anchor=anchor_shipped)
    rec['idleCorrection'] = round(corr, 4)
    rec['file'] = os.path.relpath(dd_jobs.idle_path(fig, view), UNITS)
    rec['areas'] = dict(P_px=int(pm.sum()), A_maq=float((gparts > 0).sum()) * gmeta['cells'][0]['wuPerPx'] ** 2, wpp=wpp_shipped,
                        T_px=thickness(alpha)[0])
    if anchor_shipped:
        rec['anchorRegistered'] = rec['anchor']; rec['anchor'] = anchor_shipped
    json.dump(rec, open(os.path.join(outdir, 'idle.json'), 'w'), indent=1)
    return rec


# ---------------------------------------------------------------- one job
def post(job, raw=None, tag=None):
    J = next(j for j in json.load(open(os.path.join(PROD, 'jobs', 'actions.json'))) if j['job'] == job)
    fig, body, view, key = J['figure'], J['body'], J['view'], J['key']
    raw = raw or J['out']
    tag = tag or os.path.basename(raw).rsplit('.png', 1)[0]
    outdir = os.path.join(CUT, tag)
    os.makedirs(outdir, exist_ok=True)
    ip = os.path.join(CUT, f'{fig}.{view}.idle', 'idle.json')
    idle = json.load(open(ip)) if os.path.exists(ip) else idle_post(fig, view)
    if 'areas' not in idle or 'T_px' not in idle['areas']:
        idle = idle_post(fig, view)
    corr = idle['idleCorrection']
    idle_rgba = np.asarray(Image.open(dd_jobs.idle_path(fig, view)).convert('RGBA')).astype(np.float64)
    rgba, krep = keymod.key_image(raw, key, 1, body in SHAFTS)
    rgba = rgba.astype(np.float64) * 255
    # the rim fix on each figure's box only (the 2K sheets are mostly key; the whole-sheet pass took 25 s)
    a_ = rgba[..., 3] > 2.5
    Hh_, Ww_ = a_.shape
    rects = [(0, 0, Ww_ // 2, Hh_ // 2), (Ww_ // 2, 0, Ww_, Hh_ // 2), (0, Hh_ // 2, Ww_ // 2, Hh_), (Ww_ // 2, Hh_ // 2, Ww_, Hh_)] \
        if J['layout'] == 'grid' else [(0, 0, Ww_, Hh_)]
    fixed_px, tot_px = 0.0, 0
    for (rx0, ry0, rx1, ry1) in rects:
        ys_, xs_ = np.nonzero(a_[ry0:ry1, rx0:rx1])
        if not len(xs_):
            continue
        bx0, by0 = max(rx0, rx0 + xs_.min() - 10), max(ry0, ry0 + ys_.min() - 10)
        bx1, by1 = min(rx1, rx0 + xs_.max() + 11), min(ry1, ry0 + ys_.max() + 11)
        sub, share = ad_rimfix.fix(rgba[by0:by1, bx0:bx1].copy(), key)
        rgba[by0:by1, bx0:bx1] = sub
        n_ = int(a_[by0:by1, bx0:bx1].sum()); fixed_px += share * n_; tot_px += n_
    rimshare = fixed_px / max(1, tot_px)
    krep['rimFixedPct'] = round(100 * rimshare, 2)
    keyed = np.clip(rgba + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(keyed, 'RGBA').save(os.path.join(outdir, 'keyed.png'))
    json.dump({k: v for k, v in krep.items() if k != 'shafts'} | {'shafts': len(krep.get('shafts') or [])}, open(os.path.join(outdir, 'key.json'), 'w'), indent=1)
    gmeta = json.load(open(os.path.join(GUIDES, J['guide'] + '.json')))
    gparts = np.asarray(Image.open(os.path.join(GUIDES, J['guide'] + '.parts.png')))
    Hr, Wr = keyed.shape[:2]
    f = Wr / gmeta['size'][0]
    gparts_raw = np.asarray(Image.fromarray(gparts).resize((Wr, Hr), Image.NEAREST))
    alpha = keyed[..., 3].astype(np.float32) / 255
    frames = []
    for gcell in gmeta['cells']:
        act = gcell['action']
        cx0, cy0, cx1, cy1 = [int(round(v * f)) for v in gcell['cell']]
        cell_parts = np.zeros_like(gparts_raw)
        cell_parts[cy0:cy1, cx0:cx1] = gparts_raw[cy0:cy1, cx0:cx1]
        if J['layout'] == 'grid':
            cw, ch = cx1 - cx0, cy1 - cy0
            mx, my = int(0.22 * cw), int(0.22 * ch)
            x0, y0, x1, y1 = max(0, cx0 - mx), max(0, cy0 - my), min(Wr, cx1 + mx), min(Hr, cy1 + my)
            mask, flags = frame_from_fast(alpha, x0, y0, x1, y1, (cx0, cy0, cx1, cy1))
            if mask is None:
                frames.append(dict(action=act, missing=True)); continue
            crop, box = slicer.cut(keyed, mask, x0, y0)
        else:
            m = slicer.slice_single(os.path.join(outdir, 'keyed.png'), fig, view, act, outdir)
            crop = np.asarray(Image.open(os.path.join(outdir, m['file'])).convert('RGBA'))
            box = m['box']
            flags = dict(parts=m['parts'], specksDropped=m['specks'])
        a = crop[..., 3] > 0.35 * 255
        yy, xx = np.nonzero(a)
        if box[0] + xx.min() <= 1 or box[1] + yy.min() <= 1 or box[0] + xx.max() >= Wr - 2 or box[1] + yy.max() >= Hr - 2:
            flags['touchesImage'] = True
        fn = f'{fig}.{view}.{act}.png'
        Image.fromarray(crop, 'RGBA').save(os.path.join(outdir, fn))
        rec = frame_record(fig, body, view, act, crop, box, gcell, gmeta, cell_parts, f, corr, dict(rgba=idle_rgba), key, flags, outdir, f'{fig}.{view}',
                           idle_info=idle['areas'])
        rec['file'] = fn
        frames.append(rec)
    # the scale gate for the step frames, against the idle's height
    for r in frames:
        if r.get('missing'):
            continue
        if r['action'] in ('stepA', 'stepB'):
            rr = r['heightWu'] / idle['heightWu']
            r['checks']['scale'] = dict(ratioToIdle=round(rr, 3), pass_=bool(abs(rr - 1) <= GATES['stepScale']))
        else:
            r['checks']['scale'] = dict(ratioToIdle=round(r['heightWu'] / idle['heightWu'], 3))
        c = r['checks']
        fails = []
        if c['camera']['facingMargin'] < GATES['facing'] and r['kind'] != 'lying':
            fails.append('facing')
        if c['camera']['iou'] < GATES['iouNorm'] and r['kind'] != 'lying':
            fails.append('camera')
        if c['cutoff']:
            fails.append('cutoff')
        if not c['rim']['pass_']:
            fails.append('rim')
        if not c['value']['pass']:
            fails.append('value')
        if not c['identity']['pass_']:
            fails.append('identity')
        if c['scale'].get('pass_') is False:
            fails.append('scale')
        r['flags'] = fails
    fr = dict(fringePct=krep.get('fringePct'), keyInUnitPct=krep.get('keyInUnitPct'), edgeDevPct=krep.get('edgeDevPct'))
    fr['pass_'] = bool((fr['fringePct'] or 0) <= GATES['fringe'] and (fr['keyInUnitPct'] or 0) <= GATES['keyInUnit'] and (fr['edgeDevPct'] or 0) <= GATES['edgeDev'])
    raw_meta = json.load(open(raw.rsplit('.png', 1)[0] + '.json'))
    rep = dict(job=job, figure=fig, body=body, view=view, layout=J['layout'], raw=os.path.relpath(raw, UNITS), rawSha256=raw_meta.get('sha256'),
               model=raw_meta.get('model'), imageSize=raw_meta.get('imageSize') or '1K', rawSize=[Wr, Hr], guide=J['guide'], key=key,
               fringe=fr, idle=dict(heightWu=idle['heightWu'], correction=corr), frames=frames, gates=GATES)
    json.dump(rep, open(os.path.join(outdir, 'post.json'), 'w'), indent=1)
    return rep


def summary(rep):
    out = [f"{rep['job']} fringe {rep['fringe']}"]
    for r in rep['frames']:
        if r.get('missing'):
            out.append(f"  {r['action']}: MISSING"); continue
        c = r['checks']
        out.append(f"  {r['action']:10s} {r['kind']:9s} h {r['heightWu']:6.1f}wu x{c['scale']['ratioToIdle']:.2f} | iou {c['camera']['iou']:.2f} face {c['camera']['facingMargin']:+.2f} "
                   f"fit {r['registration']['fitIoU']:.2f} | rim {c['rim']['keyHueShiftedPct']} val {c['value']['worstBelow']} dE {c['identity']['dE_whole']}/{c['identity']['dE_upperThird']} "
                   f"| flags {r['flags']}")
    return '\n'.join(out)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--idle':
        r = idle_post(a[1], a[2])
        print(a[1], a[2], 'correction', r['idleCorrection'], 'fit', r['registration']['fitIoU'], 'parts', r['weights']['parts'])
    else:
        opt = {}
        for k in ('--raw', '--tag'):
            if k in a:
                i = a.index(k); opt[k[2:]] = a[i + 1]; del a[i:i + 2]
        for job in a:
            print(summary(post(job, **opt)), flush=True)
