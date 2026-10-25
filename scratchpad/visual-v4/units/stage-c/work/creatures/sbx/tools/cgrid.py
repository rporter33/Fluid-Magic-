# Stage C creatures: the pipeline and gates for one key-pose sheet (size-1 and size-2 creatures and the mounted troops):
# the stage B troop pipeline (tr_pipe.pipe: keyer, slicer, rim fix, hue lock, checks.py, all-cells camera, consistency,
# rim, side colour with the side keyline and the value rule) with these creature changes:
#   - the stand frame of a flier is its hover frame (sprite wingMid, hornet up0) for consistency, scale and value;
#   - pose variety per layout: the pair that must differ (march A/B, lope A/B, walk A/B and gallop A/B, wings up/down)
#     at silhouette IoU <= 0.86, and no two action frames above 0.92 (checks.py's thresholds);
#   - the camera gate counts every cell against its clay figure (13 of 15 share); the sprite's death embers and scorch
#     mark and every sheet's dropped weapon are not camera cells (the guide draws them as random blobs);
#   - side colour applies only where the unit has a side colour (the Oakheart's mantle, the Ash Rider's and Wolf Rider's
#     cloth); the Fire Sprite (fire keeps its own colours), the hornet and the wolf (beasts) are measured on value only;
#     the hue lock runs only on Thornwood units with cloth (never on the hornet);
#   - value and side share are the plan's block measure at true size (1 wu = 1 px with a man 28 px tall: f = 28 px x
#     standing px / 56, so a rider or an Oakheart stands at its own height between spacings in wu); stage B's literal
#     f = 28 px for every stand frame is reported beside it (f28); a flier cloud has no closed block, so its value is the
#     lone figure's own mean L* at its true size; the Fire Sprite, which lights itself, passes value by contrast
#     either way (|ground L* - block L*| >= 15), a rule this stage adds for self-lit flame (reported, owner question).
# Usage: python3 cgrid.py RAW.png FIGURE VIEW OUTDIR
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.chdir(HERE)
import tr_pipe  # noqa: E402
import pilot_metrics  # noqa: E402

NO_SIDE = {'fireSprite', 'hornetSwarm', 'wolf'}
SELF_LIT = {'fireSprite'}
STAND = ('stand', 'wingMid', 'up0')
NOT_CAMERA = {'dropped', 'burstA', 'burstB', 'mark'}
SMALL_OK = {'burstB', 'mark', 'burstA'}
PAIRS = {'melee': [('marchA', 'marchB')], 'beast': [('lopeA', 'lopeB')], 'sprite': [('wingUp', 'wingDown')],
         'hornet': [('up0', 'down0')], 'cavalry': [('walkA', 'walkB'), ('gallopA', 'gallopB')], 'wolfrider': [('lopeA', 'lopeB')]}
ACTIONS = {'melee': ['stand', 'marchA', 'marchB', 'windup', 'strike', 'recoil'], 'beast': ['stand', 'lopeA', 'lopeB', 'leapA', 'bite', 'recoil'],
           'sprite': ['wingMid', 'glide', 'dive', 'strike', 'recoil'], 'hornet': ['up0', 'down0', 'sting0', 'glide0'],
           'cavalry': ['stand', 'walkA', 'gallopA', 'gallopB', 'charge', 'windup', 'strike', 'recoil'],
           'wolfrider': ['stand', 'lopeA', 'lopeB', 'leapA', 'charge', 'windup', 'strike', 'bite', 'recoil']}


def stand_of(meta):
    return next(f for f in meta['frames'] if f['name'] in STAND and not f.get('missing'))


def f_px(u):
    hp = tr_pipe.UNITS['heightPx'].get(u['body'])
    if u['body'] in ('cavalry', 'wolfrider'):  # the packer's mounted height (calibration 4.1: hood to hooves, a man-sized rider)
        import pack
        return 28.0 * pack.MOUNTED_PX[u['body']][0] / 56
    if u['body'] == 'beast':
        return 28 * 1.04  # the clay wolf's standing screen box against a man's at one rig scale (measured 1.09 back, 0.99 front)
    if not hp or hp[0] is None:
        return 28.0
    return 28.0 * hp[0] / 56


_orig_cons = pilot_metrics.consistency


def consistency(d, fig, view):
    """The stage B consistency check with a flier's hover frame as its stand frame; the sprite's death embers and scorch
    mark are not the creature and are left out."""
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    st = stand_of(meta)['name']
    alias = dict(meta, frames=[dict(f, name='stand') if f['name'] == st and st != 'stand' else
                               (dict(f, missing=True) if f['name'] in SMALL_OK else f) for f in meta['frames']])
    tmp = os.path.join(d, f'{fig}.{view}.json')
    json.dump(alias, open(tmp, 'w'), indent=1)
    try:
        r = _orig_cons(d, fig, view)
    finally:
        json.dump(meta, open(tmp, 'w'), indent=1)
    return r


pilot_metrics.consistency = consistency


def lone_value(rgba, height, fpx):
    import checks
    from v4color import to_lab
    from pack import premul_resize
    s = checks.keyline(np.pad(premul_resize(rgba, fpx / height), ((1, 1), (1, 1), (0, 0))))
    a = s[..., 3:4] / 255
    out = {}
    for gname, gh in checks.GROUNDS.items():
        g = checks.hexrgb(gh)
        L = to_lab(s[..., :3] * a + g * (1 - a))[..., 0]
        w = a[..., 0]
        out[gname] = round(float(to_lab(g[None, None])[0, 0, 0]) - float((L * w).sum() / w.sum()), 1)
    return out


def side_measures(d, fig, view):
    import checks
    from ad_measures import tinted_keyline
    u = tr_pipe.BY[fig]
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    st = stand_of(meta)
    rgba = checks.load(os.path.join(d, st['file']))
    kind = u.get('formation') or 'heavy'
    # the block at true size: 1 wu = 1 px with a man 28 px tall (plan 1.4), so a figure of another size is scaled by its
    # standing height against a man's (a rider shrunk to a man's 28 px between wedge spacings in wu would undersize it);
    # the stage B literal (every stand frame at 28 px) is reported beside it as f28
    fpx = f_px(u)
    if fig in NO_SIDE:
        if kind == 'cloud':  # a cloud of fliers has no closed block: the lone figure's own mean L* against each ground
            below = lone_value(rgba, st['height'], fpx)
        else:
            r = checks.side_report(rgba, st['anchor'], st['height'], '#8C8A80', kind, f_px=fpx, proof=os.path.join(d, '..', 'proof.neutral.png'))
            below = {g: r[g]['below'] for g in checks.GROUNDS}
        out = dict(kind='noSide', fPx=round(fpx, 1), neutral=dict(worstBelow=min(below.values()), below=below,
                                                                  minContrast=min(abs(v) for v in below.values())))
        out['pass'] = bool(out['neutral']['minContrast'] >= tr_pipe.GATES['below']) if fig in SELF_LIT else \
            bool(out['neutral']['worstBelow'] >= tr_pipe.GATES['below'])
        out['rule'] = 'contrast either way (self-lit flame)' if fig in SELF_LIT else 'block 15 L* below every ground'
        return out
    cloth = tr_pipe.UNITS['nations'][u['nation']]['cloth']['hex']
    out = dict(fPx=round(fpx, 1), f28={})
    for label, kl in (('neutral', checks.keyline), ('sideKeyline', tinted_keyline(tr_pipe.SHADE[u['nation']]))):
        old = checks.keyline; checks.keyline = kl
        r = checks.side_report(rgba, st['anchor'], st['height'], cloth, kind, f_px=fpx, proof=os.path.join(d, '..', f'proof.{label}.png'))
        r28 = checks.side_report(rgba, st['anchor'], st['height'], cloth, kind, f_px=28.0)
        checks.keyline = old
        out[label] = dict(share=r['share'], worstBelow=min(r[g]['below'] for g in checks.GROUNDS),
                          below={g: r[g]['below'] for g in checks.GROUNDS})
        out['f28'][label] = dict(share=r28['share'], worstBelow=min(r28[g]['below'] for g in checks.GROUNDS))
    out['pass'] = bool(out['sideKeyline']['share'] >= tr_pipe.GATES['side'] and out['sideKeyline']['worstBelow'] >= tr_pipe.GATES['below']
                       and out['neutral']['worstBelow'] >= tr_pipe.GATES['below'])
    return out


tr_pipe.side_measures = side_measures


def variety(d, fig, view, layout):
    import checks
    from checks import frame_mask, norm_sil, iou
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    fr = {f['name']: f for f in meta['frames'] if not f.get('missing')}
    st = stand_of(meta)
    H = st['height']
    sil = {n: norm_sil(frame_mask(d, f)[1], f['anchor'], H) for n, f in fr.items()}
    pairs = {f'{a}~{b}': round(iou(sil[a], sil[b]), 3) for a, b in PAIRS.get(layout, []) if a in sil and b in sil}
    keys = [k for k in ACTIONS.get(layout, []) if k in sil]
    worst = (None, 0.0)
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            x = iou(sil[keys[i]], sil[keys[j]])
            if x > worst[1]:
                worst = (f'{keys[i]}~{keys[j]}', round(x, 3))
    ok = all(v <= checks.CHECKS['marchIoU'] for v in pairs.values()) and worst[1] <= checks.CHECKS['distinctIoU'] and bool(pairs)
    return dict(pairs=pairs, mostAlike=worst, pass_=bool(ok), pass_bool=bool(ok))


def run(raw, fig, view, d):
    u = tr_pipe.BY[fig]
    import tr_huelock
    saved = dict(tr_huelock.RULES)
    if fig in NO_SIDE:
        tr_huelock.RULES.clear()  # beasts and fire keep their own colours: no cloth lock
    orig_missing_area = None
    try:
        rep = tr_pipe.pipe(raw, fig, view, d)
    finally:
        tr_huelock.RULES.clear(); tr_huelock.RULES.update(saved)
    f2 = os.path.join(d, 'frames')
    meta = json.load(open(os.path.join(f2, f'{fig}.{view}.json')))
    # small death embers and the scorch mark are allowed to be small (they are not missing); recount the camera
    miss = [n for n in meta['missing'] if n not in SMALL_OK]
    cells = {k: v for k, v in rep['cameraAll']['cells'].items() if k not in NOT_CAMERA}
    follow = [k for k, v in cells.items() if v[0] >= 0.55 and v[1] >= 0]
    rep['cameraGate'] = dict(follow=f'{len(follow)}/{len(cells)}', excluded=sorted(NOT_CAMERA & set(rep['cameraAll']['cells'])),
                             missing=miss, failing=sorted(set(cells) - set(follow)))
    rep['variety2'] = variety(f2, fig, view, u['layout'])
    g = rep['gates']
    g['camera'] = bool(cells and len(follow) / len(cells) >= tr_pipe.GATES['cells'] - 1e-9 and not miss)
    g['variety'] = bool(rep['variety2']['pass_'])
    rep['pass'] = all(g.values())
    json.dump(rep, open(os.path.join(d, 'checks.json'), 'w'), indent=1)
    return rep


def line(name, r):
    s = r['side']
    if s.get('kind') == 'noSide':
        sd = f"value below {s['neutral']['worstBelow']} contrast {s['neutral']['minContrast']} ({s['rule']})"
    else:
        sd = f"side {s['neutral']['share']}/{s['sideKeyline']['share']}kl below {s['sideKeyline']['worstBelow']}"
    co = r['consistency']
    v = r['variety2']
    return (f"{name}: {'PASS' if r['pass'] else 'FAIL ' + ','.join(k for k, x in r['gates'].items() if not x)} | cells "
            f"{r['cameraGate']['follow']} (fail {','.join(r['cameraGate']['failing'])}) missing {r['cameraGate']['missing']} | "
            f"variety {v['pairs']} {v['mostAlike']} | rim {r['rim']['afterMax']} | {sd} | cons {co.get('histMin')} {co.get('maxDE')} | "
            f"keyIn {r['fringe']['keyInUnitPct']} edge {r['fringe'].get('edgeDevPct')}")


if __name__ == '__main__':
    a = sys.argv[1:]
    r = run(*a[:4])
    print(line(os.path.basename(a[0]), r))
