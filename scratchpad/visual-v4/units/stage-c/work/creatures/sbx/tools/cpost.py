# Stage C creatures: the picks and their final frame sets (../../final/<figure>.<view>/), written to ../../picks.json.
#   - each figure and view takes the sheet named below: the passing one, else the best reported attempt (the stand-in);
#   - a frame missing from the pick is taken from the other attempt of the same figure and view where that attempt has it
#     (the Ash Rider back's dropped lance, which its re-roll left out: a lance on the ground is the same in both);
#   - the key's cast painted into a figure is cleaned by the stage B keycast post-pass (tools/keycast.py, stage B fix 9),
#     with each unit's own rule: fire and beasts hold no blue, violet or pink, the willow fronds are grey-green, the Ash
#     Rider holds no green; the share of figure pixels in the key-cast window is recorded before and after;
#   - the key's edge cast that the rim measure does not see is taken out by stage B's edge passes: cmdb_magrim.py on
#     magenta-keyed frames (the dusty-rose despill signature within 4 px of the edge), cmda_bluerim.py on blue-keyed
#     frames (B clamped on the edge where B > G, so the bottle-green cloth's own edge is left alone);
#   - the Oakheart's hue lock is redone from 135 degrees (not 90) with stage B's pale fade: the yellow-green oak leaves of
#     its helm fringe (hue about 115) are leaves, not cloth, and the plain lock turned them into a light teal patch; its
#     side colour and value are measured again on the final frames;
#   - the checks stay those of the raw sheet (the fringe gate is measured on the raw input), with the camera gate recounted
#     where a frame was merged.
# Usage: python3 cpost.py
import json, os, shutil, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
W = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS_DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
sys.path.insert(0, os.path.join(UNITS_DIR, 'tools'))
import keycast  # noqa: E402

# figure -> view -> (picked sheet, other attempts, keycast rule or None, merges {frame: sheet})
PICKS = {
    'fireSprite': {'back': ('fireSprite.back.paint.r2', ['fireSprite.back.paint'], 'fire', {}),
                   'front': ('fireSprite.front.paint.r2', ['fireSprite.front.paint'], 'fire', {})},
    'hornetSwarm': {'back': ('hornetSwarm.back.cfix', ['hornetSwarm.back.fill (shipped before the fix pass: a fuzzy amber bee)', 'hornetSwarm.back.paint'], 'wasp', {})},  # R4
    'wolf': {'back': ('wolf.back.paint', [], None, {}), 'front': ('wolf.front.fill', ['wolf.front.paint'], None, {})},
    'oakheart': {'back': ('oakheart.back.cfix.r2', ['oakheart.back.fill (shipped before the fix pass: a low flat cap)', 'oakheart.back.cfix (R1 fill route: the painted figures kept their caps)', 'oakheart.back.paint'], 'magthin', {}),
                 'front': ('oakheart.front.cfix.r2', ['oakheart.front.fill (shipped before the fix pass: a low flat cap)', 'oakheart.front.cfix (R1 fill route: the painted figures kept their caps)', 'oakheart.front.paint'], 'magthin', {})},  # R1
    'ashRider': {'back': ('ashRider.back.fill', ['ashRider.back.paint'], 'nogreen', {'dropped': 'ashRider.back.paint'}),
                 'front': ('ashRider.front.cfix.r2', ['ashRider.front.fill (shipped before the fix pass: light grey coat, no chest caparison)', 'ashRider.front.cfix (R6 fill route: caparison on the two clay cells only, the coat still light)', 'ashRider.front.paint'], 'nogreen', {})},  # R6
    'wolfRider': {'back': ('wolfRider.back.paint.r2', ['wolfRider.back.fill', 'stage B t2r32 (reported, 7/16)'], None, {}),
                  'front': ('wolfRider.front.harness', ['wolfRider.front.harness.r2', 'wolfRider.front.kept'], None, {}),
                  'frontKept': ('wolfRider.front.kept', [], None, {})},
    'salamander-02': {v: (f'sal02.{v}.redress', [], None, {}) for v in ('back', 'front')},
    'salamander-03': {v: (f'sal03.{v}.redress', [], None, {}) for v in ('back', 'front')},
    'salamander-04': {v: (f'sal04.{v}.redress', [], None, {}) for v in ('back', 'front')},
    'treant-01': {'back': ('treant01.back.norump', ['treant01.back.guide.2k (passed; rounded rump, AD finding)', 'treant01.back.guide'], 'magthin', {}),
                  'front': ('treant01.front.guide.r2', ['treant01.front.guide'], 'magthin', {})},
    'treant-02': {'back': ('treant02.back.cfix', ['treant02.back.redress.v2.r2 (shipped before the fix pass: the willow crown cut flat by the top edge)', 'treant02.back.redress.v2', 'treant02.back.redress.r2', 'treant02.back.redress'], 'willow', {}),  # R2
                  'front': ('treant02.front.redress', ['treant02.front.redress.r2'], 'willow', {})},
    'treant-03': {'back': ('treant03.back.redress.v2', ['treant03.back.redress (passed; rounded rump)'], 'magthin', {}),
                  'front': ('treant03.front.redress', [], 'magthin', {})},
    'treant-04': {'back': ('treant04.back.cfix.r2', ['treant04.back.redress.v2 (shipped before the fix pass: the stems cut flat by the top edge)', 'treant04.back.cfix (R2: the stems carried up to the new edge, cut again)', 'treant04.back.redress', 'treant04.back.redress.r2'], 'magthin', {}),
                  'front': ('treant04.front.cfix.r2', ['treant04.front.redress (shipped before the fix pass: the stems cut flat by the top edge)', 'treant04.front.cfix (R2: the stems carried up to the new edge, cut again)'], 'magthin', {})},  # R2
    'giant-01': {v: (f'giant01.{v}.guide', [], None, {}) for v in ('back', 'front')},
    'giant-02': {v: (f'giant02.{v}.redress', [], None, {}) for v in ('back', 'front')},
}
RULES = {  # keycast windows: (key, lo, hi, target hue or None to desaturate, chroma factor, scope, lmax)
    'fire': ('blue', 200.0, 352.0, None, 0.25, 'whole', None),   # fire holds no blue, violet or magenta (red flame is ~29 degrees)
    'hornet': ('magenta', 280.0, 45.0, None, 0.15, 'whole', None),  # only the light wings (lmin below): rose-mauve -> smoky grey
    'willow': ('magenta', 285.0, 40.0, 125.0, 0.55, 'whole', None),
    'nogreen': ('green', 85.0, 175.0, 70.0, 0.75, 'whole', 0.75),
    'magthin': ('magenta', 300.0, 45.0, 58.0, 0.85, 'thin', None),  # stage B's standard: rose on thin features (twigs, fern tips) -> wood
    # stage C fix pass (R4): the wasp's smoky dark wings carry the magenta key through them (rose-mauve at L 0.3 to 0.5, where
    # the 'hornet' rule's light-pixel weighting does not reach): the whole figure's rose to violet (hue 285 to 35, below the
    # umber body's 40+) goes to a smoky umber grey; the glossy black's blue sheen (hue 200 to 285) is greyed after it
    'wasp': ('magenta', 285.0, 35.0, 60.0, 0.35, 'whole', None),
}


# the identity marks of the views the fix pass re-rolled, ticked by eye on 3x to 4x crops of the final frames
_BY = 'stage C fix pass, 3x-4x crops of the final frames (ad-c/tmp_final*.png, shots/fix-*)'
IDENTITY_FIX = {
    ('oakheart', 'front'): dict(job='oakheart.front.cfix.r2', marks={'tall helm of upright bark planks': True, 'crown of curved thorns on the helm': True,
                                'fringe of oak leaves': True, 'crack across the face': 'partly', 'moss in the furrows': 'partly', 'bottle-green mantle': True},
                                note='R1 re-roll (plain edit): the low cap became the portrait\'s tall plank helm on every cell; the skull mask reads, its crack only at 4x', by=_BY),
    ('oakheart', 'back'): dict(job='oakheart.back.cfix.r2', marks={'tall helm of upright bark planks': True, 'crown of curved thorns on the helm': True,
                               'fringe of oak leaves': True, 'crack across the face': 'hidden in this view', 'moss in the furrows': 'partly', 'bottle-green mantle': True},
                               note='R1 re-roll (plain edit): the tall plank helm and thorn ring seen from behind on every cell', by=_BY),
    ('ashRider', 'front'): dict(job='ashRider.front.cfix.r2', marks={'riveted iron face plate': True, 'soot-black mane and forelock': True,
                                'ember-orange caparison edge': 'partly', 'iron bridle rings': 'partly', 'greyer muzzle': 'partly',
                                'dark charcoal coat with pale dapples': True},
                                note='R6 re-roll (plain edit): the coat is now the portrait\'s dark charcoal with pale dapples; the caparison still does not cover the chest from the front', by=_BY),
    ('hornetSwarm', 'back'): dict(job='hornetSwarm.back.cfix', marks={'narrow dull ochre bands': True, 'open jagged mandibles': 'partly', 'swept-back antennae': True,
                                  'torn wing edge': 'partly', 'glossy black head and thorax (a wasp, not a bee)': True},
                                  note='R4: a hairless black-and-ochre wasp with smoky dark wings, against portrait B (provisional pick)', by=_BY),
    ('treant-04', 'front'): dict(job='treant04.front.cfix.r2', marks={'white birch bark, black lenticels and patches': True, 'top forked into two stems': True,
                                 'drooping dark twigs, yellow-brown leaves': True, 'almond knot-scar eyes, thin scar': True, 'dark moss only on the shoulders': True},
                                 note='R2 re-roll: the two stems end in a crown of twigs inside the frame', by=_BY),
    ('treant-04', 'back'): dict(job='treant04.back.cfix.r2', marks={'white birch bark, black lenticels and patches': True, 'top forked into two stems': True,
                                'drooping dark twigs, yellow-brown leaves': True, 'almond knot-scar eyes, thin scar': 'hidden in this view', 'dark moss only on the shoulders': True},
                                note='R2 re-roll: the two stems end in a crown of twigs inside the frame', by=_BY),
    ('treant-02', 'back'): dict(job='treant02.back.cfix', marks={'pale furrowed willow bark': 'partly', 'long drooping willow fronds': True,
                                'two knotholes at different heights': 'hidden in this view', 'long ragged split': 'hidden in this view', 'no brow, nose or jaw': 'hidden in this view'},
                                note='R2: the willow crown completed inside the frame; the bark still reads olive with moss streaks', by=_BY),
}


def cast_share(rgba, lo, hi):
    from v4color import to_oklab
    lab = to_oklab(rgba[..., :3]); C = np.hypot(lab[..., 1], lab[..., 2]); h = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
    inside = ((h - lo) % 360) <= ((hi - lo) % 360)
    vis = rgba[..., 3] > 128
    return float((inside & (C > 0.03) & vis).sum() / max(1, vis.sum()))


def magrim(rgba):
    import cmdb_magrim
    return cmdb_magrim.fix(rgba)


def bluerim(rgba):
    """cmda_bluerim's edge clamp, only where B > G (a warm edge mixed with the blue key), so a green cloth's edge keeps its blue."""
    from PIL import ImageFilter
    a = rgba[..., 3] / 255
    trans = (a < 0.5).astype(np.uint8) * 255
    near = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(5))) > 127
    zone = ((a > 0) & (a < 0.97)) | (near & (a > 0))
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
    lo, hi = np.minimum(r, g), np.maximum(r, g)
    cap = lo + 0.25 * (hi - lo)
    hit = zone & (b > cap) & (b > g)
    out = rgba.copy(); out[..., 2] = np.where(hit, cap, b)
    return out, int(hit.sum())


# ---------------------------------------------------------------- stage C fix pass (art director's critique)
CLOTH_L = (0.38, 0.07)   # fix 2: the Wolf Rider fronts' cloth lightness moved toward the Thornwood foot's (Warden 0.375)
COAT_FROM = ('lopeA', 'lopeB')          # fix 2: the harness front's coat reference (its moving cells)
COAT_TO = ('stand', 'recoil', 'fall')   # the cells whose coat is greyer than the moving ones


def coat_region(rgba):
    """The wolf's coat in a Wolf Rider frame: opaque pixels below the rider's waist (a soft ramp from 42% to 52% of the
    hood-to-paws height), not cloth (the hue lock's mask under 0.3) and not the bark harness (hue 40 to 75 at C > 0.05)."""
    import tr_huelock
    import importlib.util
    from v4color import oklch
    spec = importlib.util.spec_from_file_location('pack_c', os.path.join(HERE, 'pack.py'))  # this sandbox's pack (mounted_height)
    _pack = importlib.util.module_from_spec(spec); spec.loader.exec_module(_pack)
    a = rgba[..., 3] / 255
    m = a > 0.5
    ys = np.nonzero(m.any(1))[0]
    bot = int(ys.max()); top = bot - _pack.mounted_height(m) + 1
    H = bot - top + 1
    yy = np.arange(rgba.shape[0])[:, None]
    ramp = np.clip((yy - (top + 0.42 * H)) / (0.10 * H), 0, 1)
    w_cloth, _, _ = tr_huelock.mask(rgba, tr_huelock.RULES['thornwood'])
    _, C, h = oklch(rgba[..., :3])
    harness = (h >= 40) & (h <= 75) & (C > 0.05)
    return ramp * m * (w_cloth < 0.3) * (~harness)


def coat_match(dst, fig, view):
    """Fix 2: in the stand, recoil and fall cells of the Wolf Rider's harness front, the wolf's coat (OKLab a, b) is moved
    by the difference between its median and the lope cells' median, its lightness kept, so a standing block shows the
    same warm grey-brown wolves as a moving one. Returns the medians (x100) before and after."""
    from v4color import to_oklab
    from pack import oklab_to_srgb
    vname = 'front' if view == 'frontKept' else view
    def load(n):
        p = os.path.join(dst, f'{fig}.{vname}.{n}.png')
        return p, np.asarray(Image.open(p).convert('RGBA')).astype(np.float64)
    ref = []
    for n in COAT_FROM:
        _, rgba = load(n)
        w = coat_region(rgba)
        ref.append(to_oklab(rgba[..., :3])[w > 0.5][:, 1:])
    ref = np.median(np.concatenate(ref), 0)
    rep = dict(reference=[round(float(v) * 100, 2) for v in ref], cells={})
    for n in COAT_TO:
        p, rgba = load(n)
        w = coat_region(rgba)
        lab = to_oklab(rgba[..., :3])
        med = np.median(lab[w > 0.5][:, 1:], 0)
        d = ref - med
        lab[..., 1] += w * d[0]; lab[..., 2] += w * d[1]
        out = rgba.copy(); out[..., :3] = oklab_to_srgb(lab)
        Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(p)
        wht = p.replace('.png', '.white.png')
        rep['cells'][n] = dict(before=[round(float(v) * 100, 2) for v in med], after=[round(float(v) * 100, 2) for v in med + d],
                               shift=[round(float(v) * 100, 2) for v in d], coatPx=int((w > 0.5).sum()))
    return rep


def cloth_relock(sd, dst, fig, view):
    """Fix 2: the Wolf Rider's front cloth relocked from the rim-fixed frames with the lightness target CLOTH_L."""
    import tr_huelock
    src1 = os.path.join(sd, 'frames1')
    n = 0
    for f in sorted(os.listdir(src1)):
        if f.endswith('.png') and not f.endswith('.white.png'):
            rgba = np.asarray(Image.open(os.path.join(src1, f)).convert('RGBA')).astype(np.float64)
            o, _ = tr_huelock.lock(rgba, 'thornwood', l_target=CLOTH_L)
            Image.fromarray(np.clip(o + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, f)); n += 1
    return n


def wolf_mauve(dst):
    """Fix 12: the summoned Wolf's mauve edge turned to warm grey (ad_rimfix.mauve, this sandbox's copy: units/tools
    comes first on the path and holds the stage A file)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('ad_rimfix_c', os.path.join(HERE, 'ad_rimfix.py'))
    ad_rimfix = importlib.util.module_from_spec(spec); spec.loader.exec_module(ad_rimfix)
    n = 0
    for f in sorted(os.listdir(dst)):
        if f.endswith('.png') and not f.endswith('.white.png'):
            p = os.path.join(dst, f)
            rgba = np.asarray(Image.open(p).convert('RGBA')).astype(np.float64)
            o, k = ad_rimfix.mauve(rgba, lo=325.0, hi=35.0)  # the rim reads rose up to hue 35 on the light ridge (RGB ~162/139/145)
            n += k
            Image.fromarray(np.clip(o + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(p)
    return n


def main():
    out = {}
    fin = os.path.join(W, 'final')
    for fig, views in PICKS.items():
        for view, (job, others, rule, merges) in views.items():
            sd = os.path.join(W, 'sheets', job)
            r = json.load(open(os.path.join(sd, 'checks.json')))
            dst = os.path.join(fin, f'{fig}.{view}')
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(os.path.join(sd, 'frames'), dst)
            vname = 'front' if view == 'frontKept' else view
            note = []
            merged = {}
            if merges:
                mp = os.path.join(dst, f'{fig}.{vname}.json')
                meta = json.load(open(mp))
                for name, other in merges.items():
                    om = json.load(open(os.path.join(W, 'sheets', other, 'frames', f'{fig}.{vname}.json')))
                    of = next(f for f in om['frames'] if f['name'] == name)
                    shutil.copy(os.path.join(W, 'sheets', other, 'frames', of['file']), os.path.join(dst, of['file']))
                    meta['frames'] = [of if f['name'] == name else f for f in meta['frames']]
                    meta['missing'] = [m for m in meta['missing'] if m != name]
                    merged[name] = other
                json.dump(meta, open(mp, 'w'), indent=1)
                note.append(f'frames taken from the other attempt: {merged}')
                if 'cameraGate' in r:
                    r['cameraGate']['missing'] = [m for m in r['cameraGate']['missing'] if m not in merges]
                    n, t = [int(x) for x in r['cameraGate']['follow'].split('/')]
                    r['gates']['camera'] = bool(n / t >= 13 / 15 - 1e-9 and not r['cameraGate']['missing'])
                    r['pass'] = all(r['gates'].values())
            key0 = json.load(open(os.path.join(sd, 'key.json')))['key']
            if fig == 'oakheart':
                import tr_huelock
                tr_huelock.RULES['oakheart'] = dict(tr_huelock.RULES['thornwood'], lo=135.0)  # the yellow-green helm leaves (hue ~115) stay leaves
                src1 = os.path.join(sd, 'frames1')
                for f in sorted(os.listdir(src1)):
                    if f.endswith('.png'):
                        rgba = np.asarray(Image.open(os.path.join(src1, f)).convert('RGBA')).astype(np.float64)
                        o, _ = tr_huelock.lock(rgba, 'oakheart', pale_fade=True)
                        Image.fromarray(np.clip(o + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, f))
                note.append('hue lock redone from 135 degrees with the pale fade (the yellow-green helm leaves kept as leaves)')
            if fig == 'wolfRider' and view in ('front', 'frontKept'):
                n = cloth_relock(sd, dst, fig, view)
                note.append(f'cloth relocked with lightness moved toward {CLOTH_L[0]} by at most {CLOTH_L[1]} ({n} frames; stage C fix 2)')
                if view == 'front':
                    cm = coat_match(dst, fig, view)
                    note.append('coat matched to the lope cells in ' + ', '.join(COAT_TO) + ' (stage C fix 2): ' +
                                '; '.join(f"{k} b {v['before'][1]} -> {v['after'][1]}" for k, v in cm['cells'].items()))
                    json.dump(cm, open(os.path.join(dst, 'coat-match.json'), 'w'), indent=1)
            if fig == 'wolf':
                n = wolf_mauve(dst)
                note.append(f'mauve edge turned warm grey on {n} px (stage C fix 12)')
            kc = None
            if rule:
                key, lo, hi, to, cf, scope, lmax = RULES[rule]
                saved = dict(keycast.RULES[key])
                keycast.RULES[key] = dict(lo=lo, hi=hi, ramp=10.0, cmin=0.01 if rule == 'hornet' else 0.02, to=to, cf=cf, scope=scope,
                                          **({'lmax': lmax} if lmax else {}))
                before, after = [], []
                for f in sorted(os.listdir(dst)):
                    if not f.endswith('.png') or f.endswith('.white.png'):
                        continue
                    p = os.path.join(dst, f)
                    rgba = np.asarray(Image.open(p).convert('RGBA')).astype(np.float64)
                    before.append(cast_share(rgba, lo, hi))
                    o, _ = keycast.fix(rgba, key, scope)
                    if rule == 'hornet':  # the wings only: the light pixels (OKLab L above 0.45); the umber body keeps its warm hue
                        from v4color import to_oklab
                        L = to_oklab(rgba[..., :3])[..., 0]
                        wl = np.clip((L - 0.45) / 0.06, 0, 1)[..., None]
                        o = rgba * (1 - wl) + o * wl
                    if rule == 'wasp':  # the blue sheen on the glossy black thorax: chroma x 0.35 (it read teal-blue at play zoom)
                        keycast.RULES[key] = dict(lo=200.0, hi=285.0, ramp=10.0, cmin=0.01, to=None, cf=0.35, scope='whole')
                        o, _ = keycast.fix(o, key, 'whole')
                        keycast.RULES[key] = dict(lo=lo, hi=hi, ramp=10.0, cmin=0.02, to=to, cf=cf, scope=scope)
                    after.append(cast_share(o, lo, hi))
                    Image.fromarray(np.clip(o + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(p)
                keycast.RULES[key] = saved
                kc = dict(rule=rule, window=[lo, hi], to=to, castShareBefore=round(max(before), 4), castShareAfter=round(max(after), 4))
                note.append(f'keycast {rule}: key-cast pixels max {kc["castShareBefore"]:.2%} -> {kc["castShareAfter"]:.2%} of a frame')
            npx = 0
            for f in sorted(os.listdir(dst)):
                if not f.endswith('.png') or f.endswith('.white.png'):
                    continue
                p = os.path.join(dst, f)
                rgba = np.asarray(Image.open(p).convert('RGBA')).astype(np.float64)
                if key0 == 'magenta':
                    o, n = magrim(rgba)
                elif key0 == 'blue':
                    o, n = bluerim(rgba)
                else:
                    continue
                npx += n
                Image.fromarray(np.clip(o + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(p)
            if key0 in ('magenta', 'blue'):
                note.append(f'{key0} edge pass: {npx} edge pixels de-tinted')
            if fig == 'oakheart':
                import cgrid
                r['side'] = cgrid.side_measures(dst, fig, view)
                r['gates']['side'] = bool(r['side']['pass'])
                r['pass'] = all(r['gates'].values())
            failed = [k for k, v in r['gates'].items() if not v]
            out.setdefault(fig, {})[view] = dict(job=job, dir=dst, others=others, status='pass' if not failed else 'reported',
                                                 failed=failed, keycast=kc, merged=merged, note='; '.join(note) or None)
            json.dump(r, open(os.path.join(dst, 'checks.final.json'), 'w'), indent=1)
            print(f'{fig}.{view}: {job} {"PASS" if not failed else "reported " + ",".join(failed)} {"; ".join(note)}')
    prev = json.load(open(os.path.join(W, 'picks.json'))) if os.path.exists(os.path.join(W, 'picks.json')) else {}
    for fig, views in out.items():  # keep the identity ticks already written (for the same shipped job)
        for view, v in views.items():
            old = (prev.get('figures', {}).get(fig, {}) or {}).get(view, {})
            if old.get('identity') and (old.get('job') == v['job'] or (fig, view) not in IDENTITY_FIX):
                v['identity'] = old['identity']
            if (fig, view) in IDENTITY_FIX and IDENTITY_FIX[(fig, view)]['job'] == v['job']:
                v['identity'] = {k: x for k, x in IDENTITY_FIX[(fig, view)].items() if k != 'job'}
    json.dump(dict(figures=out, note='stage C creatures picks: the passing sheet, else the best reported attempt (stand-in)'),
              open(os.path.join(W, 'picks.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
