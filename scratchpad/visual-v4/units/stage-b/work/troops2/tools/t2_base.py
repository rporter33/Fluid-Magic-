# Stage B troops2: lays a re-dress base (Image 1 of a Nano Banana 2.1 re-dress or edit) from painted frames that already
# sit at the target maquette's camera (t2_probe.py), without generating. The primary sheet's keyed image is kept whole
# (its dropped-weapon cell, specks and all); in each replaced cell the primary's own frame is cleared and a frame of
# another passing sheet is laid in, scaled by the ratio of the two sheets' stand heights and placed by its foot anchor
# at the same spot of the target cell as it had in its own cell. Cloth can be moved to the target side first
# (pack.recolor_cloth, tr_camrefs.grey_cloth). The result is laid flat on the target key.
# Usage (module): build(out, key, primary_dir, primary_fig, view, layout, swaps, recolor_primary=None)
#   swaps: [(target_cell, source_sheet_dir, source_fig, source_cell, recolor)], recolor = None | ('hue', from, to) |
#          ('grey', lo, hi) | ('tint', to_hex)
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

TR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/troops'
SBX = os.path.join(TR, 'sbx', 'tools')
sys.path.insert(0, SBX)
from poses import LAYOUTS  # noqa: E402
from pack import recolor_cloth, oklab_to_srgb  # noqa: E402
from tr_camrefs import grey_cloth, on_key  # noqa: E402
from v4color import oklch, to_oklab  # noqa: E402

UNITS = json.load(open(os.path.join(TR, 'sbx', 'units.json')))
BY = {u['id']: u for u in UNITS['units']}
KEYRGB = {'green': (0, 255, 0), 'magenta': (255, 0, 255), 'blue': (0, 0, 255)}


def tint_grey(rgba, to_hex, cmax=0.035, lmin=0.30, lmax=0.85):
    """Undyed grey wool (chroma below cmax) takes the target cloth's hue and chroma, keeping its own lightness, scaled
    so the cloth's lightness range is kept; skin, leather, wood and tan linen (chroma above it) stay."""
    L, C, h = oklch(rgba[..., :3])
    w = np.clip((cmax - C) / 0.012, 0, 1) * np.clip((L - lmin) / 0.05, 0, 1) * np.clip((lmax - L) / 0.05, 0, 1) * (rgba[..., 3] > 128)
    t = to_oklab(np.array([[[int(to_hex[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64))[0, 0]
    lab = to_oklab(rgba[..., :3])
    lab2 = lab.copy()
    lab2[..., 0] = lab[..., 0] * (1 - 0.25 * w)  # dyed wool reads a little darker than the undyed
    lab2[..., 1] = lab[..., 1] + 0.7 * w * (t[1] - lab[..., 1])  # 70% of the cloth's chroma: dyed wool, not paint
    lab2[..., 2] = lab[..., 2] + 0.7 * w * (t[2] - lab[..., 2])
    out = rgba.copy(); out[..., :3] = oklab_to_srgb(lab2)
    return out


def apply_recolor(rgba, rc):
    if not rc:
        return rgba
    if rc[0] == 'hue':
        return recolor_cloth(rgba, rc[1], rc[2])[0]
    if rc[0] == 'grey':
        return grey_cloth(rgba, rc[1], rc[2], cmin=0.04)
    if rc[0] == 'tint':
        return tint_grey(rgba, rc[1])
    raise ValueError(rc)


def sheet_meta(d, fig, view):
    fd = os.path.join(d, 'frames1') if os.path.isdir(os.path.join(d, 'frames1')) else os.path.join(d, 'frames')
    m = json.load(open(os.path.join(fd, f'{fig}.{view}.json')))
    return fd, m, {f['name']: f for f in m['frames']}


def cell_origin(layout, name, cell=(256.0, 256.0)):
    cols, rows, _a, cells = LAYOUTS[layout]
    i = cells.index(name)
    return (i % cols) * cell[0], (i // cols) * cell[1]


def keyed_rgba(d):
    return np.asarray(Image.open(os.path.join(d, 'keyed.png')).convert('RGBA')).astype(np.float64)


def raw_info(d):
    k = json.load(open(os.path.join(d, 'key.json')))
    kc = k.get('keyMeasured') or '#000000'
    return k['file'], k['key'], np.array([int(kc[i:i + 2], 16) for i in (1, 3, 5)], np.float64), bool(k.get('flatBackground'))


def recolor_raw(raw_rgb, keyed, rc):
    """A recolour applied to the painted pixels only (weighted by the keyed alpha), so key pixels never move."""
    if not rc:
        return raw_rgb
    rec = apply_recolor(keyed.copy(), rc)
    a = keyed[..., 3:4] / 255
    return raw_rgb * (1 - a) + rec[..., :3] * a


def dil(mask, r):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0


def build(out, key, primary_dir, primary_fig, view, layout, swaps, recolor_primary=None, report=None, guide_scale=None):
    """In raw space where it can be (same key, a real key background): the primary's raw sheet stays as painted, its
    replaced frames are filled with its measured key colour, and a laid-in frame from a sheet on the same key is copied
    from that sheet's raw pixels (its keyed mask grown by 3 px), so no thin shaft is lost to a second keying. Otherwise
    (another key, a flat white background) the keyed frame is laid over the key colour."""
    rawp, pkey, pkc, pflat = raw_info(primary_dir)
    keyed = keyed_rgba(primary_dir)
    raw_mode = (pkey == key and not pflat)
    if raw_mode:
        canvas = np.asarray(Image.open(rawp).convert('RGB')).astype(np.float64)
        canvas = recolor_raw(canvas, keyed, recolor_primary)
        bg = pkc
    else:
        rg = apply_recolor(keyed, recolor_primary)
        rgba = rg.copy(); rgba[..., 3] = rg[..., 3] / 255
        # moved to another key: thin features (shafts, bows) keyed to partial alpha are laid at full strength, so the
        # base still shows them against the new key (the base is a reference for the re-dress, never shipped)
        a = rgba[..., 3]
        rgba[..., 3] = np.where(a >= 0.12, np.clip(a / 0.6, 0, 1), a)
        canvas = on_key(rgba, key).astype(np.float64)
        bg = np.array(KEYRGB[key], np.float64)
    _, pm, pf = sheet_meta(primary_dir, primary_fig, view)
    pfd = os.path.join(primary_dir, 'frames1') if os.path.isdir(os.path.join(primary_dir, 'frames1')) else os.path.join(primary_dir, 'frames')
    pst = body_h(pfd, pf['stand'])
    H, Wd = canvas.shape[:2]
    rep = []
    for tcell, sdir, sfig, scell, rc in swaps:
        if tcell in pf and not pf[tcell].get('missing'):  # clear the primary's own frame of this cell
            x0, y0, x1, y1 = pf[tcell]['box']
            own = np.asarray(Image.open(os.path.join(pfd, pf[tcell]['file'])).convert('RGBA'))[..., 3] > 0
            own = dil(own, 3)
            hh, ww = min(own.shape[0], y1 - y0), min(own.shape[1], x1 - x0)
            reg = canvas[y0:y0 + hh, x0:x0 + ww]
            reg[own[:hh, :ww]] = bg
            # the grown ring around the crop box too (the keyed crop is tight)
            ys, xs = np.nonzero(own[:hh, :ww])
        sfd, sm, sf = sheet_meta(sdir, sfig, view)
        f = sf[scell]
        if guide_scale:  # (guide fig): the laid frame's size relative to the sheet's stand frame is the maquette's own
            gfig = guide_scale
            gc = guide_cells_of(gfig, view)
            ext = lambda h, w: max(h, w)  # noqa: E731  (lying figures are long, standing ones tall)
            want = ext(gc[tcell]['h'], gc[tcell]['w']) / gc['stand']['h'] * pf['stand']['height']
            s = float(np.clip(want / ext(f['height'], f.get('width') or f['size'][0]), 0.8, 1.25))
        else:
            s = pst / body_h(sfd, sf['stand'])
        if abs(s - 1) <= 0.06:
            s = 1.0  # laid in at its painted size
        srawp, skey, skc, sflat = raw_info(sdir)
        x0, y0, x1, y1 = f['box']
        fm = np.asarray(Image.open(os.path.join(sfd, f['file'])).convert('RGBA'))[..., 3] > 0
        pad = 4
        if skey == key and not sflat:
            sraw = np.asarray(Image.open(srawp).convert('RGB')).astype(np.float64)
            skeyed = keyed_rgba(sdir)
            sraw = recolor_raw(sraw, skeyed, rc)
            Y0, X0 = max(0, y0 - pad), max(0, x0 - pad)
            crop = sraw[Y0:y1 + pad, X0:x1 + pad].copy()
            m = np.zeros(crop.shape[:2], bool)
            m[y0 - Y0:y0 - Y0 + fm.shape[0], x0 - X0:x0 - X0 + fm.shape[1]] = fm[:crop.shape[0] - (y0 - Y0), :crop.shape[1] - (x0 - X0)]
            m = dil(m, 3)
            crop[~m] = bg
            mode = 'raw'
            offx, offy = x0 - X0, y0 - Y0
        else:
            fr = np.asarray(Image.open(os.path.join(sfd, f['file'])).convert('RGBA')).astype(np.float64)
            fr = apply_recolor(fr, rc)
            a = fr[..., 3:4] / 255
            crop = np.pad(fr[..., :3] * a + bg * (1 - a), ((pad, pad), (pad, pad), (0, 0)), constant_values=0)
            crop[:pad] = bg; crop[-pad:] = bg; crop[:, :pad] = bg; crop[:, -pad:] = bg
            m = dil(np.pad(fr[..., 3] > 0, pad), 2)
            mode = 'keyed'
            offx, offy = pad, pad
        if s != 1.0:
            im = Image.fromarray(np.clip(crop + 0.5, 0, 255).astype(np.uint8))
            nw, nh = max(1, round(im.width * s)), max(1, round(im.height * s))
            crop = np.asarray(im.resize((nw, nh), Image.LANCZOS)).astype(np.float64)
            m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((nw, nh), Image.BILINEAR)) > 64
        ax, ay = (offx + f['anchor'][0]) * s, (offy + f['anchor'][1]) * s
        sox, soy = cell_origin(BY[sfig]['layout'], scell)
        tox, toy = cell_origin(layout, tcell)
        gx = x0 + f['anchor'][0] - sox + tox  # the source anchor's place in its own cell, kept in the target cell
        gy = y0 + f['anchor'][1] - soy + toy
        px, py = int(round(gx - ax)), int(round(gy - ay))
        h, w = crop.shape[:2]
        X0, Y0, X1, Y1 = max(0, px), max(0, py), min(Wd, px + w), min(H, py + h)
        sub, sm_ = crop[Y0 - py:Y1 - py, X0 - px:X1 - px], m[Y0 - py:Y1 - py, X0 - px:X1 - px]
        dst = canvas[Y0:Y1, X0:X1]
        dst[sm_] = sub[sm_]
        rep.append(dict(cell=tcell, source=os.path.basename(sdir.rstrip('/')), sourceCell=scell, scale=round(s, 3),
                        recolor=list(rc) if rc else None, mode=mode))
    Image.fromarray(np.clip(canvas + 0.5, 0, 255).astype(np.uint8)).save(out)
    if report is not None:
        report[os.path.basename(out)] = dict(primary=os.path.basename(primary_dir.rstrip('/')), recolorPrimary=recolor_primary,
                                             rawMode=raw_mode, swaps=rep, key=key)
    return out


def guide_cells_of(fig, view):
    from checks import guide_cells
    gc = guide_cells(os.path.join(TR, 'sbx', 'refs', 'guides', f'{fig}.{view}.png'), fig, view)
    out = {}
    for n, g in gc.items():
        ys, xs = np.nonzero(g['mask'])
        out[n] = dict(h=int(ys.max() - ys.min() + 1), w=int(xs.max() - xs.min() + 1))
    return out


def body_h(fd, f):
    """The stand frame's opened body height (pack.body_height: a raised sword or spear stops counting)."""
    from pack import body_height
    m = np.asarray(Image.open(os.path.join(fd, f['file'])).convert('RGBA'))[..., 3] > 0.35 * 255
    return float(body_height(m))
