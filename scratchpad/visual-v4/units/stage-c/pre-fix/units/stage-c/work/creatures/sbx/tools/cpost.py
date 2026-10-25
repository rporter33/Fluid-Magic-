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
    'hornetSwarm': {'back': ('hornetSwarm.back.fill', ['hornetSwarm.back.paint'], 'hornet', {})},
    'wolf': {'back': ('wolf.back.paint', [], None, {}), 'front': ('wolf.front.fill', ['wolf.front.paint'], None, {})},
    'oakheart': {'back': ('oakheart.back.fill', ['oakheart.back.paint'], 'magthin', {}),
                 'front': ('oakheart.front.fill', ['oakheart.front.paint'], 'magthin', {})},
    'ashRider': {'back': ('ashRider.back.fill', ['ashRider.back.paint'], 'nogreen', {'dropped': 'ashRider.back.paint'}),
                 'front': ('ashRider.front.fill', ['ashRider.front.paint'], 'nogreen', {})},
    'wolfRider': {'back': ('wolfRider.back.paint.r2', ['wolfRider.back.fill', 'stage B t2r32 (reported, 7/16)'], None, {}),
                  'front': ('wolfRider.front.harness', ['wolfRider.front.harness.r2', 'wolfRider.front.kept'], None, {}),
                  'frontKept': ('wolfRider.front.kept', [], None, {})},
    'salamander-02': {v: (f'sal02.{v}.redress', [], None, {}) for v in ('back', 'front')},
    'salamander-03': {v: (f'sal03.{v}.redress', [], None, {}) for v in ('back', 'front')},
    'salamander-04': {v: (f'sal04.{v}.redress', [], None, {}) for v in ('back', 'front')},
    'treant-01': {'back': ('treant01.back.norump', ['treant01.back.guide.2k (passed; rounded rump, AD finding)', 'treant01.back.guide'], 'magthin', {}),
                  'front': ('treant01.front.guide.r2', ['treant01.front.guide'], 'magthin', {})},
    'treant-02': {'back': ('treant02.back.redress.v2.r2', ['treant02.back.redress.v2', 'treant02.back.redress.r2', 'treant02.back.redress'], 'willow', {}),
                  'front': ('treant02.front.redress', ['treant02.front.redress.r2'], 'willow', {})},
    'treant-03': {'back': ('treant03.back.redress.v2', ['treant03.back.redress (passed; rounded rump)'], 'magthin', {}),
                  'front': ('treant03.front.redress', [], 'magthin', {})},
    'treant-04': {'back': ('treant04.back.redress.v2', ['treant04.back.redress', 'treant04.back.redress.r2'], 'magthin', {}),
                  'front': ('treant04.front.redress', [], 'magthin', {})},
    'giant-01': {v: (f'giant01.{v}.guide', [], None, {}) for v in ('back', 'front')},
    'giant-02': {v: (f'giant02.{v}.redress', [], None, {}) for v in ('back', 'front')},
}
RULES = {  # keycast windows: (key, lo, hi, target hue or None to desaturate, chroma factor, scope, lmax)
    'fire': ('blue', 200.0, 352.0, None, 0.25, 'whole', None),   # fire holds no blue, violet or magenta (red flame is ~29 degrees)
    'hornet': ('magenta', 280.0, 45.0, None, 0.15, 'whole', None),  # only the light wings (lmin below): rose-mauve -> smoky grey
    'willow': ('magenta', 285.0, 40.0, 125.0, 0.55, 'whole', None),
    'nogreen': ('green', 85.0, 175.0, 70.0, 0.75, 'whole', 0.75),
    'magthin': ('magenta', 300.0, 45.0, 58.0, 0.85, 'thin', None),  # stage B's standard: rose on thin features (twigs, fern tips) -> wood
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
    for fig, views in out.items():  # keep the identity ticks already written
        for view, v in views.items():
            old = (prev.get('figures', {}).get(fig, {}) or {}).get(view, {})
            if old.get('identity'):
                v['identity'] = old['identity']
    json.dump(dict(figures=out, note='stage C creatures picks: the passing sheet, else the best reported attempt (stand-in)'),
              open(os.path.join(W, 'picks.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
