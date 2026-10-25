# Rest of stage D: the checks' results over every shipped action frame (art plan 8.6 where it applies to big-body
# cutouts), read from the packed metadata (atlas/actions/figures/<figure>.json), so it reports what ships: per gate, how
# many frames pass, and the frames that do not.
#   fringe     the keyer's fringePct <= 0.2, keyInUnitPct <= 0.5 and edgeDevPct <= 8 (per generated image)
#   rim        the boundary ring's key-hue shift <= 2%: at post (the 2K frame) and after the tier rim fix (tier H, what ships)
#   value      the body at tier S at least 15 L* below each of the four grounds
#   identity   CIEDE2000 of the median colour against the approved idle cutout < 10 (not applied to lying frames: a belly)
#   camera     the box-normalised IoU against the maquette >= 0.45 and the facing margin >= 0.03 (standing frames; every
#              flagged frame was looked at on its board, and the ones painted facing away were held back)
#   cutoff     the frame touching its slicing window or the image edge (a cut-off part)
#   scale      step frames within 15% of the idle's height
#   variety    stepA against stepB IoU <= 0.86 (robed casters 0.95), and no standing action above 0.92 against the idle
# Thornwood palettes of the generic gods are the Cinder frames recoloured: counted once (their frames are listed apart).
# Also counts the art director's interventions (ground fixes, set anchors, scale factors, pixel fixes, held-back frames).
# Writes prod/checks-summary.json and prints the table.
import glob, json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
PROD = os.path.abspath(os.path.join(HERE, '..'))
FIG = os.path.abspath(os.path.join(PROD, '..', 'atlas', 'actions', 'figures'))
TINTED = ('titan', 'oracle', 'ascendedHero', 'greatWyrm', 'primordial', 'livingMonolith')
UNITS = os.path.abspath(os.path.join(PROD, '..', '..'))
ROBED = ('oracle', 'emberHierophant')


def mask_at(png, wpp, anchor, W=0.5):
    """The silhouette at 0.5 wu per px on a canvas centred on the ground anchor (400 x 400 px = 200 x 200 wu... grown to fit)."""
    im = Image.open(png).convert('RGBA')
    k = wpp / W
    a = np.asarray(im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.BILINEAR))[..., 3] > 127
    return a, (anchor[0] * k, anchor[1] * k)


def iou(m1, m2):
    (a, (ax, ay)), (b, (bx, by)) = m1, m2
    L = int(max(ax, bx)) + 2; T = int(max(ay, by)) + 2
    R = int(max(a.shape[1] - ax, b.shape[1] - bx)) + 2; B = int(max(a.shape[0] - ay, b.shape[0] - by)) + 2
    ca = np.zeros((T + B, L + R), bool); cb = np.zeros_like(ca)
    ox, oy = int(round(L - ax)), int(round(T - ay)); ca[oy:oy + a.shape[0], ox:ox + a.shape[1]] = a
    ox, oy = int(round(L - bx)), int(round(T - by)); cb[oy:oy + b.shape[0], ox:ox + b.shape[1]] = b
    return float((ca & cb).sum() / max(1, (ca | cb).sum()))


def variety(m, out):
    """Art plan 8.6 variety on the shipped frames: stepA against stepB <= 0.86 (robed casters 0.95); no standing action
    above 0.92 against the idle (a copied idle pose); silhouettes aligned on the ground anchor at one scale."""
    fig = m['figure']
    for view, acts in m['views'].items():
        idle = acts.get('idle')
        if not idle:
            continue
        ip = os.path.join(UNITS, idle['texture'].split('stage C: ', 1)[-1])
        mi = mask_at(ip, idle['wuPerPx'], idle['anchorPx'])
        ms = {a: mask_at(os.path.join(UNITS, e['file']), e['wuPerPx'], e['anchorPx']) for a, e in acts.items() if a != 'idle'}
        lim = 0.95 if fig.split('-')[0] in ROBED else 0.86
        if 'stepA' in ms and 'stepB' in ms:
            v = iou(ms['stepA'], ms['stepB'])
            out['gates'].setdefault('varietySteps', [0, 0])[0 if v <= lim else 1] += 1
            if v > lim:
                out['failures'].setdefault('varietySteps', []).append(f'{fig}.{view}: stepA/stepB IoU {v:.2f} > {lim}')
        for a, mm in ms.items():
            if acts[a]['kind'] != 'standing':
                continue
            v = iou(mm, mi)
            out['gates'].setdefault('varietyIdle', [0, 0])[0 if v <= 0.92 else 1] += 1
            if v > 0.92:
                out['failures'].setdefault('varietyIdle', []).append(f'{fig}.{view}.{a}: IoU with the idle {v:.2f} > 0.92')
            out['perFigure'].setdefault(fig, {}).setdefault(f'{view}.{a}', {})['iouWithIdle'] = round(v, 3)


def main():
    out = dict(frames=0, framesTintedCopies=0, images=0, gates={}, failures={}, interventions={}, perFigure={})
    seen = set()
    iv = out['interventions']
    for p in sorted(glob.glob(os.path.join(FIG, '*.json'))):
        if p.endswith('.weights.json'):
            continue
        m = json.load(open(p))
        fig = m['figure']
        tinted = fig.endswith('-thornwood') and fig.split('-')[0] in TINTED
        if not tinted:
            variety(m, out)
        for view, acts in m['views'].items():
            for act, e in acts.items():
                if act == 'idle':
                    continue
                if tinted:
                    out['framesTintedCopies'] += 1
                    continue
                out['frames'] += 1
                c = e['checks']
                if e['raw'] not in seen:
                    seen.add(e['raw'])
                    ok = c['fringe']['pass_']
                    out['gates'].setdefault('fringe', [0, 0])[0 if ok else 1] += 1
                    if not ok:
                        out['failures'].setdefault('fringe', []).append(f"{e['raw']}: {c['fringe']}")
                lying = e['kind'] == 'lying'
                rim_after = c.get('rimAfterFixTierH', {})
                tests = dict(rimAtPost=c['rim']['pass_'], rimShipped=rim_after.get('pass_', c['rim']['pass_']), value=c['value']['pass'],
                             identity=c['identity']['pass_'] or lying,
                             camera=lying or (c['camera']['iou'] >= 0.45 and c['camera']['facingMargin'] >= 0.03),
                             cutoff=not c['cutoff'])
                if act in ('stepA', 'stepB') and 'idle' in acts:
                    ratio = e['heightWu'] / acts['idle']['heightWu']
                    c = dict(c, scale=dict(ratioToIdleShipped=round(ratio, 3), atPost=c['scale']))
                    tests['scale'] = abs(ratio - 1) <= 0.15
                for g, ok in tests.items():
                    out['gates'].setdefault(g, [0, 0])[0 if ok else 1] += 1
                    if not ok:
                        detail = {'rimAtPost': c['rim'].get('keyHueShiftedPct'), 'rimShipped': rim_after.get('keyHueShiftedPct'),
                                  'value': c['value'].get('worstBelow'), 'identity': c['identity'],
                                  'camera': {k: c['camera'][k] for k in ('iou', 'facingMargin')}, 'cutoff': True, 'scale': c['scale']}[g]
                        out['failures'].setdefault(g, []).append(f"{fig}.{view}.{act}: {detail}")
                gf = e.get('groundFix') or {}
                if gf.get('applied'):
                    k = 'anchorSetByArtDirector' if gf.get('artDirector') else 'anchorAlignedToIdle' if str(gf.get('rule', '')).startswith('aligned') \
                        else 'baseMatch' if gf.get('rule') else 'groundFixSoles'
                    iv.setdefault(k, []).append(f"{fig}.{view}.{act} ({gf.get('shiftWu'):+} wu)")
                if 'art director' in (e.get('scaleRule') or ''):
                    iv.setdefault('scaleFactor', []).append(f"{fig}.{view}.{act} ({e['scaleRule']})")
                for k in (e.get('pixelFixes') or {}):
                    iv.setdefault(k, []).append(f'{fig}.{view}.{act}')
                out['perFigure'].setdefault(fig, {}).setdefault(f'{view}.{act}', {}).update(heightWu=e['heightWu'], scaleRule=e.get('scaleRule'),
                                                                                              flags=[g for g, ok in tests.items() if not ok])
    sel = json.load(open(os.path.join(PROD, 'selection.json')))
    held = []
    for j, v in sel.items():
        if v == 'skip':
            held.append(j)
        elif isinstance(v, dict):
            held += [f'{j}/{a}' for a, t in v.items() if t == 'skip']
    iv['heldBack'] = sorted(held)
    out['images'] = len(seen)
    json.dump(out, open(os.path.join(PROD, 'checks-summary.json'), 'w'), indent=1)
    print('frames', out['frames'], '(+ tinted copies', out['framesTintedCopies'], ') images', out['images'])
    for g, (p_, f_) in out['gates'].items():
        print(f'  {g:11s} pass {p_:4d} fail {f_:3d}')
    for k, v in iv.items():
        print(f'  {k}: {len(v)}')
    return out


if __name__ == '__main__':
    main()
