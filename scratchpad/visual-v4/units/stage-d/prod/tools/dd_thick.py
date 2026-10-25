# A pose-robust body measure: the thickness of the body (the 95th percentile of the distance to the silhouette's edge, in
# px), by repeated 3x3 erosions of the opaque mask at a working size; its ratio between a frame and the approved idle cutout
# gives the frame's scale against the idle's when the painting's pose departs from its maquette's.
import numpy as np
from PIL import Image, ImageFilter


def thickness(alpha, work=360):
    m = alpha > 0.5
    ys, xs = np.nonzero(m)
    m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = work / max(m.shape)
    im = Image.fromarray((m * 255).astype(np.uint8)).resize((max(2, int(m.shape[1] * k)), max(2, int(m.shape[0] * k))), Image.BILINEAR)
    cur = np.asarray(im) > 127
    dist = np.zeros(cur.shape, np.float32)
    step = 0
    pim = Image.fromarray((cur * 255).astype(np.uint8))
    while cur.any() and step < 400:
        step += 1
        dist[cur] = step
        pim = pim.filter(ImageFilter.MinFilter(3))
        cur = np.asarray(pim) > 127
    d = dist[dist > 0]
    return float(np.percentile(d, 95)) / k, float(d.max()) / k


def _lum(rgba):
    return (rgba[..., :3] @ np.array([0.299, 0.587, 0.114])) / 255.0


def _fftconv(a, b, shape):
    fa = np.fft.rfft2(a, shape); fb = np.fft.rfft2(b, shape)
    return np.fft.irfft2(fa * fb, shape)


def masked_ncc(img, imask, tpl, tmask):
    """Masked normalised cross-correlation of a template over an image (both float, masks 0/1), every placement where the
    template lies inside the image; returns the NCC map (valid part)."""
    H, W = img.shape; h, w = tpl.shape
    shape = (H + h, W + w)
    t = tpl * tmask
    n = tmask.sum()
    tm = t.sum() / n
    tz = (tpl - tm) * tmask
    tvar = (tz ** 2).sum()
    I = img * imask
    rot = lambda x: x[::-1, ::-1]
    s1 = _fftconv(I, rot(tmask), shape)[h - 1:H, w - 1:W]
    s2 = _fftconv(I * I, rot(tmask), shape)[h - 1:H, w - 1:W]
    cov = _fftconv(I, rot(tz), shape)[h - 1:H, w - 1:W]
    cnt = _fftconv(imask, rot(tmask), shape)[h - 1:H, w - 1:W]
    var = s2 - s1 * s1 / n
    ok = (cnt > 0.85 * n) & (var > 1e-6)
    out = np.full(var.shape, -1.0)
    out[ok] = cov[ok] / np.sqrt(var[ok] * tvar)
    return out


def head_scale(idle_rgba, idle_head_mask, act_rgba, work=200, scales=None, rots=(0, -20, 20, 160, 180, 200)):
    """The action frame's scale against the idle's from the head: the idle's head region (its box around the 'head'
    part, all paint inside it) as a template, searched over the action frame at scales 0.45 to 2.2 and a few rotations;
    returns (ratio action px / idle px, peak NCC, scale, rotation)."""
    ys, xs = np.nonzero(idle_head_mask)
    if len(xs) < 30:
        return None
    ia = idle_rgba[..., 3] / 255
    iy, ix = np.nonzero(ia > 0.5)
    fh = (iy.max() - iy.min() + 1)
    k = work / fh  # the idle body at `work` px
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    py, px = int(0.1 * (y1 - y0)), int(0.1 * (x1 - x0))
    y0, y1 = max(0, y0 - py), min(ia.shape[0], y1 + py); x0, x1 = max(0, x0 - px), min(ia.shape[1], x1 + px)
    T = Image.fromarray(np.clip(_lum(idle_rgba[y0:y1, x0:x1]) * 255, 0, 255).astype(np.uint8))
    TM = Image.fromarray(((ia[y0:y1, x0:x1] > 0.5) * 255).astype(np.uint8))
    A = act_rgba
    best = (-2, None, None)
    scales = scales or list(np.exp(np.linspace(np.log(0.45), np.log(2.2), 26)))
    for sc in scales:
        # the action frame scaled so that, if its true ratio is sc, its body is `work` px like the idle's
        ka = k / sc
        aw, ah = max(8, int(A.shape[1] * ka)), max(8, int(A.shape[0] * ka))
        if aw > 900 or ah > 900:
            continue
        ai = Image.fromarray(np.clip(_lum(A) * 255, 0, 255).astype(np.uint8)).resize((aw, ah), Image.BILINEAR)
        am = Image.fromarray(((A[..., 3] > 127) * 255).astype(np.uint8)).resize((aw, ah), Image.BILINEAR)
        img = np.asarray(ai).astype(np.float64) / 255; imask = (np.asarray(am) > 127).astype(np.float64)
        tw, th = max(6, int(T.width * k)), max(6, int(T.height * k))
        for r in rots:
            t = T.resize((tw, th), Image.BILINEAR).rotate(r, expand=True, resample=Image.BILINEAR)
            tm = TM.resize((tw, th), Image.BILINEAR).rotate(r, expand=True, resample=Image.NEAREST)
            tpl = np.asarray(t).astype(np.float64) / 255; tmask = (np.asarray(tm) > 127).astype(np.float64)
            if tpl.shape[0] >= img.shape[0] or tpl.shape[1] >= img.shape[1] or tmask.sum() < 20:
                continue
            ncc = masked_ncc(img, imask, tpl, tmask)
            v = float(ncc.max())
            if v > best[0]:
                best = (v, sc, r)
    if best[1] is None:
        return None
    return dict(ratio=float(best[1]), ncc=round(best[0], 3), rot=best[2])
