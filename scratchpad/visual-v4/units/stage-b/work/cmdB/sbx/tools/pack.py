# Packs sliced painted frames into battle atlases (art plan section 8.4 and 8.5).
#   - one scale per figure and view: the stand frame's height becomes the tier's standing height (HEIGHT_PX in units.json:
#     tier S at index 0 for devicePixelRatio < 1.5 and the automatic camera, tier H at index 1 for DPR >= 1.5 and the
#     player's close zoom); premultiplied-alpha Lanczos; then the design's dark keyline (#1C1A17, 60%, 1 px per tier unit)
#   - white silhouettes of 'stand' and 'recoil' per view for the hit flash (design 12.1)
#   - optional cloth variants (design revision 6: a side wears base, mid, light or dark cloth): the cloth is found by hue
#     (the side-share rule of checks.py) and moved to the variant's colour in OKLab, keeping the painted shading
#   - shelf packing into 2048 x 2048 pages, 2 px gutters; frames keep their foot anchor
#   - per atlas a Pixi spritesheet JSON (frames, anchors) and a summary; mirrored views are not stored (scale.x = -1)
# Usage: python3 pack.py OUT_PREFIX TIER(S|H) SLICED_DIR:FIGURE:VIEW[:CLOTHHEX] ...
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import oklch, to_oklab  # noqa: E402
from checks import keyline  # noqa: E402

UNITS = json.load(open(os.path.join(HERE, '..', 'units.json')))
PAGE, GUTTER = 2048, 2


def premul_resize(rgba, k):
    a = rgba[..., 3:4] / 255
    pm = np.dstack([rgba[..., :3] * a, rgba[..., 3]])
    im = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), 'RGBA')
    w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
    pm = np.asarray(im.resize((w, h), Image.LANCZOS)).astype(np.float64)
    a = pm[..., 3:4] / 255
    rgb = np.where(a > 0, pm[..., :3] / np.maximum(a, 1e-6), 0)
    return np.dstack([np.clip(rgb, 0, 255), pm[..., 3]])


def oklab_to_srgb(lab):
    M2i = np.linalg.inv(np.array([[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099],
                                  [0.0259040371, 0.7827717662, -0.8086757660]]))
    M1i = np.linalg.inv(np.array([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566],
                                  [0.0883024619, 0.2817188376, 0.6299787005]]))
    lin = (lab @ M2i.T) ** 3 @ M1i.T
    lin = np.clip(lin, 0, 1)
    return 255 * np.where(lin <= 0.0031308, 12.92 * lin, 1.055 * lin ** (1 / 2.4) - 0.055)


def recolor_cloth(rgba, base_hex, to_hex):
    """Move the side's cloth from base_hex to to_hex: a soft mask by hue and chroma, the OKLab offset of the two."""
    hx = lambda h: np.array([[[int(h[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)
    _, cc, ch = oklch(hx(base_hex))
    _, C, h = oklch(rgba[..., :3])
    dh = np.abs((h - float(ch[0, 0]) + 180) % 360 - 180)
    w = np.clip((26 - dh) / 8, 0, 1) * np.clip((C - max(0.03, 0.35 * float(cc[0, 0]))) / 0.03, 0, 1)
    d = to_oklab(hx(to_hex))[0, 0] - to_oklab(hx(base_hex))[0, 0]
    lab = to_oklab(rgba[..., :3]) + w[..., None] * d
    out = rgba.copy()
    out[..., :3] = oklab_to_srgb(lab)
    return out, float((w > 0.5).mean())


def cloth_boost(rgba, cloth_hex, strength=1.0, open_px=3):
    """Pilot option (art plan 1.4, measured in pilot.md): normalise the side's painted cloth toward the cloth colour's
    chroma, keeping its painted lightness and brushwork. The mask is the side-hue window (26 degrees, chroma above
    0.02) opened by `open_px`, so only large connected cloth areas (cape, tabard, mantle, shield face) move; thin rust
    edges, skin and wood specks do not. Returns the image and the share of the figure that moved."""
    hx = np.array([[[int(cloth_hex[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)
    _, cc, ch = oklch(hx)
    cc, ch = float(cc[0, 0]), float(ch[0, 0])
    _, C, h = oklch(rgba[..., :3])
    dh = np.abs((h - ch + 180) % 360 - 180)
    w = np.clip((26 - dh) / 8, 0, 1) * np.clip((C - 0.02) / 0.02, 0, 1) * (rgba[..., 3] > 128)
    m = Image.fromarray((w * 255).astype(np.uint8))
    k = 2 * open_px + 1
    m = np.asarray(m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))).astype(np.float64) / 255
    w = np.minimum(w, m) * strength
    lab = to_oklab(rgba[..., :3])
    a, b = lab[..., 1], lab[..., 2]
    Cn = np.hypot(a, b)
    target = np.maximum(Cn, 0.9 * cc)
    newC = Cn + w * (target - Cn)
    hr = np.arctan2(b, a)
    hc = np.radians(ch)
    dhr = np.angle(np.exp(1j * (hc - hr)))
    hn = hr + 0.5 * w * dhr
    lab2 = np.dstack([lab[..., 0], newC * np.cos(hn), newC * np.sin(hn)])
    out = rgba.copy()
    out[..., :3] = oklab_to_srgb(lab2)
    return out, float((w > 0.5).sum() / max(1, (rgba[..., 3] > 128).sum()))


def body_height(mask):
    """Height of the figure's body: an opening (5% of the height) cuts hafts, shafts and staffs, then the largest
    component is measured; weapons held above the head stop counting."""
    from slice import label
    ys, xs = np.nonzero(mask)
    h = int(ys.max() - ys.min() + 1)
    r = max(3, (int(0.05 * h) // 2) * 2 + 1)
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(r)).filter(ImageFilter.MaxFilter(r))
    m = np.asarray(m) > 127
    if not m.any():
        return h
    lab = label(m)
    ids, n = np.unique(lab[lab > 0], return_counts=True)
    ys, _ = np.nonzero(lab == ids[np.argmax(n)])
    return int(ys.max() - ys.min() + 1)


MOUNTED_PX = {'wolfrider': (65, 131), 'cavalry': (79, 159)}  # maquette hood-to-feet height at a man's scale, 2 / 4 px per wu


def mounted_height(mask):
    from slice import label  # noqa: F401
    ys, xs = np.nonzero(mask)
    h = int(ys.max() - ys.min() + 1)
    r = max(3, (int(0.05 * h) // 2) * 2 + 1)
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(r)).filter(ImageFilter.MaxFilter(r))
    top = int(np.nonzero(np.asarray(m) > 127)[0].min())
    return int(ys.max() - top + 1)


def frames_of(sdir, fig, view, tier, cloth_to=None, boost=False):
    meta = json.load(open(os.path.join(sdir, f'{fig}.{view}.json')))
    u = next(x for x in UNITS['units'] if x['id'] == fig)
    hp = UNITS['heightPx'].get(u['body'], UNITS['heightPx']['infantry'])
    target = hp[0 if tier == 'S' else 1]
    st = next(f for f in meta['frames'] if f['name'] in ('stand', 'wingMid', 'up0') and not f.get('missing'))
    # pilot change: the stand frame's body height (an opening removes a weapon raised above the head) sets the scale,
    # so a sheet whose stand pose holds the axe high does not shrink the man (the bbox height was used before)
    stand_mask = np.asarray(Image.open(os.path.join(sdir, st['file'])).convert('RGBA'))[..., 3] > 0.35 * 255
    bh = body_height(stand_mask)
    if u['body'] in MOUNTED_PX:
        # stage B calibration (mounts): the opening that drops a raised haft also drops a wolf's or a horse's legs, so a
        # mounted figure was scaled by hood-to-chest and drawn 1.56x a man (its rider's head 1.56x a foot soldier's).
        # Mounted figures are measured from the top of the opened body (hood or helm; the spear and pennon above it
        # are cut) down to the lowest painted pixel (the paws or hooves), and that height is set to the maquette's
        # hood-to-feet height at a man's scale (the rider is a man): wolf rider 32.7 wu, Ash Rider 39.7 wu.
        bh = mounted_height(stand_mask)
        target = MOUNTED_PX[u['body']][0 if tier == 'S' else 1]
    k = target / bh
    out = []
    for f in meta['frames']:
        if f.get('missing'):
            continue
        rgba = np.asarray(Image.open(os.path.join(sdir, f['file'])).convert('RGBA')).astype(np.float64)
        if boost:
            rgba, _ = cloth_boost(rgba, UNITS['nations'][u['nation']]['cloth']['hex'])
        if cloth_to:
            rgba, _ = recolor_cloth(rgba, UNITS['nations'][u['nation']]['cloth']['hex'], cloth_to)
        s = premul_resize(rgba, k)
        for _ in range(1 if tier == 'S' else 2):
            s = keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
        ax, ay = f['anchor'][0] * k + (1 if tier == 'S' else 2), f['anchor'][1] * k + (1 if tier == 'S' else 2)
        name = f'{fig}.{view}.{f["name"]}' + (f'.{cloth_to[1:]}' if cloth_to else '')
        out.append((name, s, (ax, ay)))
        if f['name'] in ('stand', 'recoil'):
            wht = s.copy(); wht[..., :3] = 255
            out.append((name + '.white', wht, (ax, ay)))
    return out, dict(figure=fig, view=view, scale=round(k, 4), standPx=target, bodyHeightSrc=bh, bboxHeightSrc=st['height'])


def pack(items):
    items = sorted(items, key=lambda t: -t[1].shape[0])
    pages, placed = [], {}
    x = y = shelf = 0
    page = None
    for name, img, anc in items:
        h, w = img.shape[:2]
        if page is None or x + w + GUTTER > PAGE:
            x, y, shelf = 0, y + shelf + GUTTER if page is not None else 0, 0
        if page is None or y + h > PAGE:
            page = np.zeros((PAGE, PAGE, 4)); pages.append(page); x = y = shelf = 0
        page[y:y + h, x:x + w] = img
        placed[name] = dict(page=len(pages) - 1, frame=dict(x=x, y=y, w=w, h=h), anchor=dict(x=round(anc[0] / w, 4), y=round(anc[1] / h, 4)),
                            sourceSize=dict(w=w, h=h))
        x += w + GUTTER; shelf = max(shelf, h)
    return pages, placed


def main():
    prefix, tier, specs = sys.argv[1], sys.argv[2], sys.argv[3:]
    items, figs = [], []
    for sp in specs:
        parts = sp.split(':')
        sdir, fig, view = parts[:3]
        cloth = parts[3] if len(parts) > 3 and parts[3] not in ('', 'boost') else None
        fr, info = frames_of(sdir, fig, view, tier, ('#' + cloth) if cloth else None, boost='boost' in parts[3:])
        items += fr; figs.append(info)
    pages, placed = pack(items)
    used_rows = []
    for i, p in enumerate(pages):
        rows = np.nonzero(p[..., 3].max(1) > 0)[0]
        h = int(rows.max() + 1) if rows.size else 1
        h = 1 << (h - 1).bit_length()  # power-of-two height: a partly filled page is cut
        Image.fromarray(np.clip(p[:h], 0, 255).astype(np.uint8), 'RGBA').save(f'{prefix}.{i}.png')
        used_rows.append(h)
        sheet = dict(frames={n: {k: v for k, v in d.items() if k != 'page'} for n, d in placed.items() if d['page'] == i},
                     meta=dict(image=os.path.basename(f'{prefix}.{i}.png'), size=dict(w=PAGE, h=h), scale=1, tier=tier,
                               app='units/tools/pack.py'))
        json.dump(sheet, open(f'{prefix}.{i}.json', 'w'), indent=1)
    area = sum(d['frame']['w'] * d['frame']['h'] for d in placed.values())
    print(json.dumps(dict(tier=tier, frames=len(placed), pages=len(pages), pageHeights=used_rows,
                          fill=round(area / sum(PAGE * h for h in used_rows), 3), figures=figs)))


if __name__ == '__main__':
    main()
