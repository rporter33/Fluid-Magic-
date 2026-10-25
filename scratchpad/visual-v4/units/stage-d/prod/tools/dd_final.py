# Rest of stage D: an accepted action frame as it ships (used by the boards, the packer and the checks' summary), from its
# post.json record and the art director's look:
#   scale    dd_scale.final_wpp (the area, thickness and fit estimates; the art director's factors)
#   ground   the ground anchor of a standing two-footed frame (humanoid gods, giants, treants) set by its painted soles: where the maquette registered badly the mapped anchor left the figure floating or sinking (the
#            Treant 02 back windup stood 18 wu in the air). The sole of each foot is the last opaque row of the run going
#            straight down from the snapped foot point; the anchor keeps the idle's height above the lower sole (in wu).
#            The fix applies when it moves the anchor 2 wu or more and less than a quarter of the figure's height, or when
#            the registration put the anchor outside the frame (then its x follows the feet too).
#   anchor   the art director's anchor for a frame whose registration failed and that has no two feet to walk from
#            (selection.json "anchor": {"<job>/<action>": [x, y]} in the frame's px)
#   align    a frame whose pose stays close to the idle's (selection.json "alignAnchor"): the anchor from sliding its
#            silhouette over the idle's (dd_align.py)
#   base     a pedestal body's frame (selection.json "baseMatch"): the anchor puts its painted base where the idle's stands
#   fadeTop  frames whose painting ran off the top of the generated image (selection.json "fadeTop": ["<job>/<action>"]):
#            the top rows fade out over 4% of the height so the cut reads as twig or flame ends, not a straight edge
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
PROD = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(PROD, '..', '..'))
CUT = os.path.join(PROD, 'cut')
from dd_scale import final_wpp  # noqa: E402

_alpha = {}


def alpha_of(png):
    if png not in _alpha:
        _alpha[png] = np.asarray(Image.open(png).convert('RGBA'))[..., 3]
    return _alpha[png]


def feet(fr):
    """The feet of a two-footed body (a four-footed body's hind feet hide behind the body or the tail too often in a rear or
    a tail lash for the sole walk: its anchors stay as registered unless the art director sets one, selection "anchor")."""
    return [n for n in fr['points'] if n.startswith('foot') and not n.endswith('Snapped')]


def sole(alpha, pt, colw):
    H, W = alpha.shape
    x, y = int(round(pt[0])), int(round(pt[1]))
    x0, x1 = max(0, x - colw), min(W, x + colw + 1)
    col = alpha[:, x0:x1] > 127
    need = max(2, int(0.15 * (x1 - x0)))
    yy, gap, last = max(0, min(H - 1, y)), 0, None
    while yy < H:
        if col[yy].sum() >= need:
            last, gap = yy, 0
        else:
            gap += 1
            if gap > 3 and last is not None:
                break
            if gap > 40 and last is None:
                break
        yy += 1
    return last


def idle_rec(fig, view):
    base = fig.replace('-thornwood', '-cinderHorde') if os.path.exists(os.path.join(CUT, f'{fig.replace("-thornwood", "-cinderHorde")}.{view}.idle')) \
        and not os.path.exists(os.path.join(CUT, f'{fig}.{view}.idle')) else fig
    p = os.path.join(CUT, f'{base}.{view}.idle', 'idle.json')
    return json.load(open(p)) if os.path.exists(p) else None


def lower_sole(alpha, fr, wpp, with_x=False):
    colw = max(2, int(round(1.5 / wpp)))   # a 3 wu wide column
    out = []
    for n in feet(fr):
        q = fr['points'].get(n + 'Snapped', fr['points'][n])
        s = sole(alpha, q, colw)
        if s is not None:
            out.append((s, q[0]))
    if not out:
        return (None, None) if with_x else None
    y = max(o[0] for o in out); x = float(np.mean([o[1] for o in out]))
    return (y, x) if with_x else y


def ground_fix(fig, view, fr, png, wpp):
    if fr.get('kind', 'standing') != 'standing' or len(feet(fr)) != 2:
        return None
    idle = idle_rec(fig, view)
    if not idle or len(feet(idle)) != 2:
        return None
    ia = alpha_of(os.path.join(UNITS, idle['file']))
    s_i, x_i = lower_sole(ia, idle, idle['wuPerPx'], True)
    s_a, x_a = lower_sole(alpha_of(png), fr, wpp, True)
    if s_i is None or s_a is None:
        return None
    off_wu = (idle['anchor'][1] - s_i) * idle['wuPerPx']
    y_new = s_a + off_wu / wpp
    d_wu = (y_new - fr['anchor'][1]) * wpp
    h_wu = fr['height'] * wpp
    W, H = fr['size']
    # a registration that put the anchor outside the frame (by more than a tenth of its size) is broken: its x goes too,
    # to the feet's mean x with the idle's offset from them
    broken = not (-0.1 * W <= fr['anchor'][0] <= 1.1 * W and -0.1 * H <= fr['anchor'][1] <= 1.1 * H)
    if abs(d_wu) < 2 or (abs(d_wu) > 0.25 * h_wu and not broken):
        return dict(applied=False, shiftWu=round(d_wu, 1), feet=feet(fr))
    out = dict(applied=True, shiftWu=round(d_wu, 1), anchorY=round(float(y_new), 1), idleAnchorBelowSoleWu=round(off_wu, 1), feet=feet(fr))
    if broken:
        out['anchorX'] = round(x_a + (idle['anchor'][0] - x_i) * idle['wuPerPx'] / wpp, 1)
        out['brokenRegistration'] = True
    return out


def _low_extent(a):
    ys, xs = np.nonzero(a)
    y0, y1 = ys.min(), ys.max()
    low = a[int(y1 - 0.35 * (y1 - y0 + 1)):y1 + 1]
    xx = np.nonzero(low.any(0))[0]
    return y1, (xx.min() + xx.max()) / 2.0


def base_match(fig, view, fr, png, wpp):
    """A pedestal body's frame (the idols' shattered state): the ground anchor set so the painted base stands where the
    idle's does, its bottom the same height above the anchor and the lower third's centre over it (in wu)."""
    idle = idle_rec(fig, view)
    if not idle:
        return None
    iy, ix = _low_extent(alpha_of(os.path.join(UNITS, idle['file'])) > 127)
    y1, cx = _low_extent(alpha_of(png) > 127)
    k = idle['wuPerPx'] / wpp
    ax = cx - (ix - idle['anchor'][0]) * k
    ay = y1 - (iy - idle['anchor'][1]) * k
    return dict(applied=True, rule="base match (the pedestal against the idle's)", anchor=[round(float(ax), 1), round(float(ay), 1)],
                shiftWu=round(float((ay - fr['anchor'][1]) * wpp), 1))


def sole_points(r, png):
    """The stomp points of a standing two-footed frame at the painted soles: from each snapped foot point straight down the
    3 wu column to its last opaque row (a registration that mapped a foot onto the shin or the hem snapped it there). A
    sole is used only in the lowest 35% of the figure; the snapped points are kept in pointsBeforeSoleFix."""
    if r.get('kind', 'standing') != 'standing' or len(feet(r)) != 2:
        return
    a = alpha_of(png)
    ys = np.nonzero((a > 127).any(1))[0]
    if not len(ys):
        return
    y0, y1 = ys[0], ys[-1]
    colw = max(2, int(round(1.5 / r['wuPerPx'])))
    before = {}
    for n in feet(r):
        q = r['points'].get(n + 'Snapped', r['points'][n])
        s_ = sole(a, q, colw)
        if s_ is not None and s_ >= y1 - 0.35 * (y1 - y0) and abs(s_ - q[1]) > 1:
            before[n + 'Snapped'] = q
            r['points'][n + 'Snapped'] = [q[0], int(s_)]
    if before:
        r['pointsBeforeSoleFix'] = before


def align_anchor(fig, view, fr, png, wpp):
    """A frame whose pose stays close to the idle's (a bite with the jaws open, a breath): its silhouette slid over the
    idle's at 1 wu per px (FFT cross-correlation of the masks, whole and lower half; the better overlap wins) gives the
    anchor that keeps the body where the idle's stands (dd_align.py found registrations off by up to 81 wu)."""
    import dd_align
    idle = idle_rec(fig, view)
    ma, ka = dd_align.mask(os.path.join(UNITS, idle['file']), idle['wuPerPx'])
    mb, kb = dd_align.mask(png, wpp)
    best = None
    for lower in (False, True):
        a, b = ma.copy(), mb.copy()
        if lower:
            ya = np.nonzero(a.any(1))[0]; yb = np.nonzero(b.any(1))[0]
            a[:int(ya[0] + 0.5 * (ya[-1] - ya[0]))] = False; b[:int(yb[0] + 0.5 * (yb[-1] - yb[0]))] = False
        dx, dy, iou = dd_align.best_shift(a, b)
        if best is None or iou > best[2]:
            best = (dx, dy, iou, lower)
    dx, dy, iou, lower = best
    ax = (idle['anchor'][0] * ka - dx) / kb
    ay = (idle['anchor'][1] * ka - dy) / kb
    return dict(applied=True, rule='aligned to the idle (%s silhouette, IoU %.2f)' % ('lower-half' if lower else 'whole', iou),
                anchor=[round(float(ax), 1), round(float(ay), 1)], shiftWu=round(float((ay - fr['anchor'][1]) * wpp), 1),
                shiftXWu=round(float((ax - fr['anchor'][0]) * wpp), 1))


def resolve(fig, view, fr, png, job, sel=None):
    """A copy of the post frame record as it ships: final scale, ground-fixed anchor, the shipped height."""
    sel = sel if sel is not None else (json.load(open(os.path.join(PROD, 'selection.json'))) if os.path.exists(os.path.join(PROD, 'selection.json')) else {})
    r = json.loads(json.dumps(fr))
    w, rule = final_wpp(fr, job, sel.get('scale', {}))
    r['wuPerPxPost'] = fr['wuPerPx']; r['wuPerPx'] = round(w, 5); r['scaleRule'] = rule
    r['heightWu'] = round(fr['height'] * w, 2)
    g = ground_fix(fig, view, fr, png, w)
    if g:
        r['groundFix'] = g
        if g['applied']:
            r['anchorBeforeGroundFix'] = fr['anchor']
            r['anchor'] = [g.get('anchorX', fr['anchor'][0]), g['anchorY']]
    if f'{job}/{fr["action"]}' in sel.get('baseMatch', []):
        b = base_match(fig, view, fr, png, w)
        if b:
            r['anchorBeforeGroundFix'] = fr['anchor']; r['anchor'] = b['anchor']; r['groundFix'] = b
    if f'{job}/{fr["action"]}' in sel.get('alignAnchor', []):
        b = align_anchor(fig, view, fr, png, w)
        r['anchorBeforeGroundFix'] = fr['anchor']; r['anchor'] = b['anchor']; r['groundFix'] = b
    man = sel.get('anchor', {}).get(f'{job}/{fr["action"]}')
    if man:
        r['anchorBeforeGroundFix'] = fr['anchor']; r['anchor'] = [float(man[0]), float(man[1])]
        r['groundFix'] = dict(applied=True, artDirector=True, shiftWu=round((man[1] - fr['anchor'][1]) * w, 1))
    sole_points(r, png)
    if f'{job}/{fr["action"]}' in sel.get('fadeTop', []):
        r['fadeTop'] = True
    if f'{job}/{fr["action"]}' in sel.get('fadeEdge', {}):
        r['fadeEdge'] = sel['fadeEdge'][f'{job}/{fr["action"]}']
    if f'{job}/{fr["action"]}' in sel.get('eraseClay', {}):
        r['eraseClay'] = sel['eraseClay'][f'{job}/{fr["action"]}']
    if f'{job}/{fr["action"]}' in sel.get('warmClay', []):
        r['warmClay'] = True
    return r


def fade_top(rgba, share=0.04):
    """Fade the top rows of an RGBA float array (the painting ran off the image's top): alpha ramps from 0 over share x height
    from the frame's first opaque row."""
    a = rgba[..., 3]
    rows = np.nonzero((a > 127).any(1))[0]
    if not len(rows):
        return rgba
    y0 = rows[0]; n = max(2, int(share * (rows[-1] - y0 + 1)))
    ramp = np.ones(a.shape[0]); ramp[:y0] = 0; ramp[y0:y0 + n] = np.linspace(0.0, 1.0, n) ** 1.5
    out = rgba.copy(); out[..., 3] = a * ramp[:, None]
    return out


def _hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def erase_clay(rgba, boxes):
    """The grey clay the painting kept from its maquette (a ball and a rod at a tail's end): inside each box [x0, y0, x1,
    y1] or polygon [[x, y], ...] (frame px) every pixel but the painting's warm scales (hue under 50, saturation over 0.30, value over 0.22) loses
    its alpha, softened by a 2 px blur of the mask."""
    from PIL import ImageFilter
    h, s, v = _hsv(rgba[..., :3] / 255.0)
    from PIL import ImageDraw
    keep = (h < 50) & (s > 0.30) & (v > 0.22)
    region = Image.new('L', (rgba.shape[1], rgba.shape[0]), 0)
    d = ImageDraw.Draw(region)
    force = Image.new('L', region.size, 0)
    df = ImageDraw.Draw(force)
    for b in boxes:
        if isinstance(b[0], (list, tuple)):
            d.polygon([tuple(q) for q in b], fill=255)
        elif len(b) == 5 and b[4] == 'all':      # a box erased whatever its colour (a dark gap shadow beside the clay)
            df.rectangle(b[:4], fill=255)
        else:
            d.rectangle(b, fill=255)
    m = ((np.asarray(region) > 127) & ~keep) | (np.asarray(force) > 127)
    mm = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))) / 255.0
    out = rgba.copy(); out[..., 3] = rgba[..., 3] * (1 - mm)
    return out, int(m.sum())


def warm_clay(rgba):
    """The clay-blue undersides the painting kept from its maquette (a reared belly): blue and cyan greys (hue 170 to 260,
    saturation under 0.40) take the warm belly tan at their own value; a soft weight at the hue window's edges."""
    rgb = rgba[..., :3] / 255.0
    h, s, v = _hsv(rgb)
    w = np.clip((h - 170) / 15, 0, 1) * np.clip((260 - h) / 15, 0, 1) * np.clip((0.40 - s) / 0.08, 0, 1) * (rgba[..., 3] > 0)
    lum = rgb @ np.array([0.3, 0.55, 0.15])
    tan = np.clip(lum[..., None] * np.array([1.16, 0.98, 0.78]), 0, 1)
    out = rgba.copy()
    out[..., :3] = (rgb * (1 - w[..., None]) + tan * w[..., None]) * 255
    return out, round(100 * float((w > 0.5).sum() / max(1, (rgba[..., 3] > 127).sum())), 2)


def finish(rgba, fr):
    """The art director's pixel fixes of a frame as it ships (top fade, clay erase, clay warm), on a float RGBA array."""
    if fr.get('fadeTop'):
        rgba = fade_top(rgba)
    if fr.get('fadeEdge'):
        rgba = fade_edge(rgba, fr['fadeEdge'], 0.03)
    if fr.get('eraseClay'):
        rgba, _ = erase_clay(rgba, fr['eraseClay'])
    if fr.get('warmClay'):
        rgba, _ = warm_clay(rgba)
    return rgba


def fade_edge(rgba, side, share=0.04):
    """fade_top for any side ('top', 'right', 'left', 'bottom'): a part cut by the generated image's edge (a sword tip)
    fades out over `share` of the frame's extent from that side, so it reads as a tip in motion, not a blunt cut."""
    k = {'top': 0, 'left': 1, 'bottom': 2, 'right': 3}[side]
    r = np.rot90(rgba, k)          # bring the side to the top
    r = fade_top(np.ascontiguousarray(r), share)
    return np.ascontiguousarray(np.rot90(r, -k))
