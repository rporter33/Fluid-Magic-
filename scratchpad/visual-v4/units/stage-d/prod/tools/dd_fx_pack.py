# Rest of stage D: packs the picked new effect sheets into a second effects atlas beside the pilot's (art plan 7.2):
# stage-d/atlas/fx2/fx2-atlas.png/.webp/.json (Pixi spritesheet) and fx2-data.json (the live build's form, as the pilot's
# fx-data.json: frames by name -> [x, y, w, h, anchorX, anchorY(, ringK)]); the bark tile (L5) beside it as its own
# repeating textures. The pilot's atlas (atlas/fx/) is not touched, and no frame name repeats one of its 99 frames.
# Conventions are the pilot's (stage-d/work/tools/fx_pack.py, whose helpers are used): premultiplied Lanczos downscale,
# 2 px gutters with the colour bled into them, fire light alpha x1.7 (one frame serves the normal-blend body and the
# additive glow), the decal multiply form, ground anchors at the base ellipse, ring anchors and ringK for glyph rings.
# Fixes in code (no generation): E7b's smoke edges that took the blue key's violet, desaturated (value kept); L6g's twigs
# that took the magenta key's mauve, turned to dry ochre (the pilot's RECOLOUR); the breath streams (E7c, E7b, L6g, L6s)
# fade out over the last 8% of their length, so the two frames whose far end met the sheet edge end like the others.
# Usage: python3 -I dd_fx_pack.py
import base64, json, math, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dd_fx  # noqa: E402
import fx_pack as FPK  # noqa: E402  (the pilot's helpers)

STAGE = dd_fx.STAGE
FX = dd_fx.FX
OUT = os.path.join(STAGE, 'atlas', 'fx2')
PICKS = {'E1': 'a', 'E7c': 'b', 'E7b': 'r2', 'L5': 'a', 'L6g': 'b', 'L6s': 'a', 'H1': 'a', 'G1s': 'a', 'U1': 'a', 'V1': 'a'}
WHY = {
    'E1': 'a: three clean painted loops; b left the grey placeholders showing under its flames',
    'E7c': 'b: a fierce white-gold jet that sits inside the billows; a is a whole flame stream of its own, too wide for a core',
    'E7b': 'r2 (one re-roll, g3pro with b as reference): rolling flame and soot billows that end in rounded puffs inside their cells; a copied the guide\'s hard dark wedge, b painted the guide\'s flat far end and two of its frames met the sheet edge',
    'L5': 'a: even ridged bark that tiles (seam step 4.7 against 4.1 inside); b has one large pale ridge that repeats visibly',
    'L6g': 'b: large readable burrs, seed pods and torn leaves; a\'s twigs and seeds are too small to read at play zoom',
    'L6s': 'a: the haze grows from the jaws like the gale; b\'s clouds start mid-cell and do not line up with the gale',
    'H1': 'a: all four elements fill their boxes (the halo ring at full size); b\'s halo ring is a third too small',
    'G1s': 'a: a filled sun disc with eight rays, the game\'s Radiance symbol, reads at 20 px; b\'s hollow outline thins away',
    'U1': 'a: painterly ink and smoke in the decals\' hand; b is smoother and tinted violet',
    'V1': 'a: soft glowing veins; b is crisp white branching that reads as trees',
}
FIRE = {'E1', 'E7c'}           # light painted as fire: the pilot's alpha boost
LIGHT = {'H1', 'G1s', 'V1'}    # light, additive only (Radiance; veins tinted by the game): no boost
STREAM = {'E7c', 'E7b', 'L6g', 'L6s'}
SIZE = {
    'tongueS*': ('grouph', 'tongueS1', 64), 'tongueM*': ('grouph', 'tongueM1', 80), 'tongueL*': ('grouph', 'tongueL1', 96),
    'breathCore*': ('w', 512), 'breathBillow*': ('w', 512), 'gale*': ('w', 512), 'sporeHaze*': ('w', 512),
    'seed*': ('max', 40), 'tornLeaf*': ('max', 36), 'sporeClump*': ('max', 40), 'sporePuff*': ('max', 96),
    'lightColumn': ('h', 320), 'sunDisc': ('max', 128), 'softRays': ('max', 192), 'haloRing': ('w', 360),
    'glyphRingW': ('w', 360), 'glyphW': ('h', 96),
    'rippleRing': ('w', 300), 'tendrilsIn': ('w', 220), 'drip*': ('h', 64), 'rippleBand': ('w', 896), 'drainThread*': ('w', 512),
    'veins*': ('max', 128), 'veinStrip*': ('w', 512),
}
# nominal world sizes for the code part (wu; a man is 28 wu tall), as the pilot's fx_board.WU
WU = {'tongueS': ('h', 10), 'tongueM': ('h', 16), 'tongueL': ('h', 24), 'breathCore': ('len', 260), 'breathBillow': ('len', 260), 'gale': ('len', 320),
      'sporeHaze': ('len', 320), 'seed': 4, 'tornLeaf': 4, 'sporeClump': 5, 'sporePuff': 24, 'lightColumn': ('h', 240), 'sunDisc': 30,
      'softRays': 60, 'haloRing': 80, 'glyphRingW': 80, 'glyphW': ('h', 14), 'rippleRing': 120, 'tendrilsIn': 60, 'drip': ('h', 12),
      'rippleBand': ('h', 30), 'drainThread': ('h', 4), 'veins': 24, 'veinStrip': ('h', 4)}


def size_rule(n):
    if n in SIZE:
        return SIZE[n]
    for k, v in SIZE.items():
        if k.endswith('*') and n.startswith(k[:-1]):
            return v
    return ('max', 128)


def wu_of(n):
    for k, v in WU.items():
        if n.startswith(k):
            return v
    return None


def load(sheet, name):
    p = os.path.join(FX, 'cut', f'{sheet}.{PICKS[sheet]}', name + '.png')
    return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255


def desat_violet(c):
    """E7b: smoke pixels whose hue went violet or blue from the key lose that chroma (value kept)."""
    rgb = c[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    bad = (h > 200) & (h < 330)
    grey = (rgb @ np.array([0.3, 0.55, 0.15], np.float32))[..., None] * np.array([1.04, 0.98, 0.92], np.float32)
    out = c.copy()
    out[..., :3] = np.where(bad[..., None], np.clip(grey, 0, 1), rgb)
    return out


def recolour_mauve(c):
    """L6g: mauve and pink (hue 250 to 345) to the pilot's dry ochre (fx_pack.recolour), reds and browns untouched."""
    rgb = c[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    sat = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    bad = (h > 250) & (h < 345) & (sat > 0.06)
    rc = FPK.recolour(c)
    out = c.copy()
    out[..., :3] = np.where(bad[..., None], rc[..., :3], rgb)
    return out, round(100 * float((bad & (c[..., 3] > 0.3)).sum() / max(1, (c[..., 3] > 0.3).sum())), 2)


def stream_fade(c, frac=0.08):
    """Fades a stream's far (right) end: alpha x a smooth ramp over the last `frac` of its painted length."""
    a = c[..., 3]
    xs = np.nonzero(a.max(0) > 0.05)[0]
    x0, x1 = xs.min(), xs.max()
    L = x1 - x0
    xx = np.arange(c.shape[1], dtype=np.float32)
    t = np.clip((x1 - xx) / max(1, frac * L), 0, 1)
    t = t * t * (3 - 2 * t)
    out = c.copy()
    out[..., 3] = a * t[None, :]
    return out


def bottom_fade(c, frac=0.08):
    """H1's light column met the sheet's bottom edge (its foot cut flat): its lowest `frac` fades out, so the column comes
    down into the ground light pool and the halo ring that the game draws there."""
    a = c[..., 3]
    ys = np.nonzero(a.max(1) > 0.05)[0]
    y0, y1 = ys.min(), ys.max()
    yy = np.arange(c.shape[0], dtype=np.float32)
    t = np.clip((y1 - yy) / max(1, frac * (y1 - y0)), 0, 1)
    t = t * t * (3 - 2 * t)
    out = c.copy(); out[..., 3] = a * t[:, None]
    return out


def mouth_anchor(c):
    """A stream's mouth: its leftmost painted columns, at their alpha-weighted middle."""
    a = c[..., 3]
    xs = np.nonzero(a.max(0) > 0.2)[0]
    x0 = xs.min()
    band = a[:, x0:x0 + max(3, int(0.03 * c.shape[1]))]
    ys = np.arange(c.shape[0])
    w = band.sum(1)
    return float(x0 / c.shape[1]), float((ys * w).sum() / max(1e-6, w.sum()) / c.shape[0]), float((xs.max() - x0) / c.shape[1])


def base_anchor(c):
    """A flame tongue's foot: the middle of its lowest 8% of painted rows, at the lowest row."""
    a = c[..., 3]
    ys, xs = np.nonzero(a > 0.25)
    sel = ys >= ys.max() - 0.08 * (ys.max() - ys.min())
    return float(xs[sel].mean() / c.shape[1]), float(ys.max() / c.shape[0])


def main():
    os.makedirs(OUT, exist_ok=True)
    pilot = json.load(open(os.path.join(STAGE, 'atlas', 'fx', 'fx-atlas.json')))['frames']
    items, refs, fixes = [], {}, {}
    for sheet, cand in PICKS.items():
        if sheet == 'L5':
            continue
        for e in dd_fx.SHEETS[sheet]['els']:
            n = e['name']
            assert n not in pilot, n
            c = load(sheet, n)
            if sheet == 'E7b':
                c = desat_violet(c)
            if sheet == 'L6g':
                c, share = recolour_mauve(c)
                fixes.setdefault('L6g mauve to ochre (% of opaque px)', {})[n] = share
            if sheet in STREAM and n.startswith(('breath', 'gale', 'sporeHaze')):
                c = stream_fade(c)
            if n == 'lightColumn':
                c = bottom_fade(c)
                fixes['H1 lightColumn'] = 'the foot met the sheet edge: its lowest 8% faded (anchor: the foot, where the ground pool is drawn)'
            if sheet in FIRE:
                c = FPK.boost(c)
            rule = size_rule(n)
            if rule[0] in ('group', 'grouph'):
                if rule[1] not in refs:
                    refs[rule[1]] = load(sheet, rule[1])
                ref = refs[rule[1]]
                k = rule[2] / (ref.shape[0] if rule[0] == 'grouph' else ref.shape[1])
            elif rule[0] == 'w':
                k = rule[1] / c.shape[1]
            elif rule[0] == 'h':
                k = rule[1] / c.shape[0]
            else:
                k = rule[1] / max(c.shape[:2])
            k = min(k, 1.0)
            r = FPK.resize(c, c.shape[1] * k, c.shape[0] * k)
            extra = {}
            if n.startswith(('breath', 'gale', 'sporeHaze')):
                ax, ay, ln = mouth_anchor(r); extra['len'] = round(ln, 4)
            elif n.startswith('tongue'):
                ax, ay = base_anchor(r)
            elif n in ('glyphRingW', 'haloRing'):
                (ax, ay), fk = FPK.ring_anchor(r); extra['ringK'] = round(fk, 4)
            elif n == 'lightColumn':
                a_ = r[..., 3]; ys_, xs_ = np.nonzero(a_ > 0.2)
                ax, ay = float(xs_[ys_ >= ys_.max() - 0.1 * (ys_.max() - ys_.min())].mean() / r.shape[1]), float(ys_.max() / r.shape[0])
            else:
                ax, ay = 0.5, 0.5
            blend = dd_fx.SHEETS[sheet]['blend']
            items.append(dict(name=n, sheet=sheet, img=r, ax=ax, ay=ay, blend=blend, scale=round(k, 4), src=f'{sheet}.{cand}', extra=extra))
    W, gut = 2048, 2
    items.sort(key=lambda it: (-it['img'].shape[0], -it['img'].shape[1]))
    x = y = shelf = 0
    for it in items:
        h, w = it['img'].shape[:2]
        if x + w + 2 * gut + 2 > W:
            x = 0; y += shelf + gut; shelf = 0
        it['x'], it['y'] = x + gut, y + gut
        x += w + gut; shelf = max(shelf, h + gut)
    Hh = y + shelf + gut
    Hp = 1 << int(math.ceil(math.log2(Hh)))
    assert Hp <= 2048, Hh
    page = np.zeros((Hp, W, 4), np.float32)
    frames = {}
    for it in items:
        h, w = it['img'].shape[:2]
        pad = 2
        b = FPK.bleed(np.pad(it['img'], ((pad, pad), (pad, pad), (0, 0))))
        X0, Y0 = it['x'] - pad, it['y'] - pad
        reg = page[Y0:Y0 + h + 2 * pad, X0:X0 + w + 2 * pad]
        reg[:] = np.where(reg[..., 3:4] <= 0.004, b, reg)
        fr = {'frame': {'x': it['x'], 'y': it['y'], 'w': w, 'h': h}, 'anchor': {'x': round(it['ax'], 4), 'y': round(it['ay'], 4)},
              'sourceSize': {'w': w, 'h': h}, 'sheet': it['sheet'], 'blend': it['blend'], 'scale': it['scale'], 'src': it['src']}
        fr.update(it['extra'])
        wu = wu_of(it['name'])
        if wu is not None:
            fr['worldSize'] = {'w': wu} if not isinstance(wu, tuple) else {wu[0]: wu[1]}
        frames[it['name']] = fr
    img = Image.fromarray((np.clip(page, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    img.save(os.path.join(OUT, 'fx2-atlas.png'), optimize=True)
    img.save(os.path.join(OUT, 'fx2-atlas.webp'), quality=90, method=6, alpha_quality=100)
    # the bark tile: its own repeating textures (a tile wraps; an atlas frame cannot)
    for nn in (512, 256):
        Image.open(os.path.join(FX, 'cut', 'L5.a', f'barkTile-{nn}.png')).convert('RGB').save(os.path.join(OUT, f'fx2-bark-{nn}.png'), optimize=True)
        Image.open(os.path.join(FX, 'cut', 'L5.a', f'barkTile-{nn}.png')).convert('RGB').save(os.path.join(OUT, f'fx2-bark-{nn}.webp'), quality=90, method=6)
    used = sum(it['img'].shape[0] * it['img'].shape[1] for it in items)
    raw = {}
    for s, c in PICKS.items():
        f = [x for x in os.listdir(os.path.join(STAGE, 'raw')) if x.startswith(f'{s}.{c}.') and x.endswith('.json')][0]
        raw[s] = {'candidate': c, 'file': 'stage-d/raw/' + f, 'sha256': json.load(open(os.path.join(STAGE, 'raw', f)))['sha256'],
                  'title': dd_fx.SHEETS[s]['title'], 'blend': dd_fx.SHEETS[s]['blend'], 'why': WHY[s]}
    meta = {'app': 'stage D rest: dd_fx_pack.py (new effect sheets beside the pilot\'s atlas/fx)', 'image': 'fx2-atlas.png', 'size': {'w': W, 'h': Hp},
            'format': 'RGBA8888', 'scale': 1, 'fill': round(used / (W * Hp), 3), 'fireAlphaBoost': FPK.BOOST, 'fireSheets': sorted(FIRE),
            'lightSheets (additive, no boost)': sorted(LIGHT), 'picks': raw, 'codeFixes': fixes,
            'barkTile': {'files': ['fx2-bark-512.png', 'fx2-bark-256.png', 'fx2-bark-512.webp', 'fx2-bark-256.webp'], 'wrap': 'repeat',
                         'note': 'L5 bark plating: a seamless opaque tile for Bark Skin\'s mask wipe and the bark material (seam step 4.66, inner 4.10)'},
            'anchors': 'streams (breathCore, breathBillow, gale, sporeHaze): anchor = the mouth, len = painted length / frame width; tongues: the foot; '
                       'glyphRingW and haloRing: the ring centre, ringK = frame width / ring-line diameter (as the pilot\'s glyph rings); lightColumn: its ground ellipse',
            'pilotAtlas': 'atlas/fx/fx-atlas.json (unchanged; no frame name is shared)'}
    json.dump({'frames': frames, 'meta': meta}, open(os.path.join(OUT, 'fx2-atlas.json'), 'w'), indent=1)
    webp = open(os.path.join(OUT, 'fx2-atlas.webp'), 'rb').read()
    fx = {'version': 2, 'image': 'data:image/webp;base64,' + base64.b64encode(webp).decode(), 'w': W, 'h': Hp,
          'frames': {k: [v['frame']['x'], v['frame']['y'], v['frame']['w'], v['frame']['h'], v['anchor']['x'], v['anchor']['y']] + ([v['ringK']] if 'ringK' in v else [])
                     for k, v in frames.items()}}
    json.dump(fx, open(os.path.join(OUT, 'fx2-data.json'), 'w'))
    print(json.dumps({'items': len(items), 'size': [W, Hp], 'fill': meta['fill'], 'pngBytes': os.path.getsize(os.path.join(OUT, 'fx2-atlas.png')),
                      'webpBytes': len(webp), 'fixes': fixes}))


if __name__ == '__main__':
    main()
