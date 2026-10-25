# Stage B, key "cmdB" (forked from cmdA's cmda_pipe.py; adds the magenta rose-cast pass cmdb_magrim.py): the pipeline over one raw sheet, with the calibration's tools (this sandbox copy of
# stage-b/cal/sbx/tools: the thin-feature key fix and the mounted-height packer are in it):
#   key.py -> slice.py (as the body kind's commander layout) -> ad_rimfix.py -> checks.py (stand camera, variety,
#   scale, fringe) -> pilot_metrics (all-cells camera, consistency) -> ad_measures rim -> the commander side colour
#   and value at play zoom with the tier S side keyline -> for a re-dress: the camera of every cell against the guide,
#   scaled by its BODY sheet's cell height (calibration 1.3), the inheritance IoU against the body sheet, and the
#   identity colour check against the face's portrait (art plan 5.5).
# Gates (calibration 1.2 and 1.3, pilot-review 15 and 18): cells >= 14/16, variety pass, rim after <= 2%, fringe pass,
# identity dE2000 < 18, side keyline share >= 10% as a lone figure at play zoom (Cinder; independents wear undyed grey: value only), value >= 15 L* below every ground.
# Usage: python3 cmda_pipe.py RAW.png KIND VIEW KEY OUTDIR [--body BODY_FRAMES_DIR] [--face FACE]
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..'))
import checks  # noqa: E402
from checks import guide_cells, frame_mask, norm_sil, iou, scaled_figure, GROUNDS, hexrgb  # noqa: E402
from v4color import to_lab, oklch  # noqa: E402
from ad_measures import tinted_keyline  # noqa: E402

UNITS = json.load(open(os.path.join(ROOT, 'units.json')))
BYID = {u['id']: u for u in UNITS['units']}
SHADE = {'cinderHorde': '#7E3118', 'thornwood': '#113F2F', 'independent': '#5C5A54'}
GATE = dict(cells=14, rimAfter=2.0, identityDE=18.0, sideShare=0.10, valueBelow=15.0)  # sideShare: a lone commander (no side cloth) with the side keyline; the kept pilot AC06 reads 0.177
F_CMD = 28 * 64 / 56  # a commander at play zoom: a man is 28 px, a commander 1.15x (design 3.2) = 32 px


def py(*a):
    p = subprocess.run([sys.executable, '-I'] + list(a), capture_output=True, text=True, cwd=HERE)
    if p.returncode:
        raise RuntimeError(p.stderr[-800:])
    return p.stdout


def frames(d, fig, view):
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    return {f['name']: f for f in meta['frames'] if not f.get('missing')}


def camera_rel(face_dir, body_dir, fig, view, scale_dir=None):
    """Every cell against the maquette guide, the re-dress silhouette scaled by its body sheet's frame height (a tall
    cowl or antlers must not shrink the body), plus the IoU against the body sheet's own cell (inheritance).
    scale_dir (resumed run): where the body sheet is itself an edit that added antlers or a hood (twChief, twDruid back),
    the heights come from the camera-correct sheet it was edited from, the man without that headgear, as the maquette
    guide has none."""
    gc = guide_cells(os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png'), fig, view)
    fr, bf = frames(face_dir, fig, view), frames(body_dir, fig, view)
    sf = frames(scale_dir, fig, view) if scale_dir else bf
    per = {}
    for n, f in fr.items():
        if n not in gc or n not in bf:
            continue
        _, m = frame_mask(face_dir, f)
        _, bm = frame_mask(body_dir, bf[n])
        g = gc[n]
        hgt = (sf.get(n) or bf[n])['height']
        a = norm_sil(m, f['anchor'], hgt)
        b = norm_sil(g['mask'], g['anchor'], g['height'])
        bb = norm_sil(bm, bf[n]['anchor'], hgt)
        per[n] = (round(iou(a, b), 3), round(iou(a, b) - iou(a, b[:, ::-1]), 3), round(iou(a, bb), 3))
    follow = [k for k, v in per.items() if v[0] >= 0.55 and v[1] >= 0]
    return dict(cells=per, follow=f'{len(follow)}/16', followN=len(follow), failing=sorted(set(per) - set(follow)),
                medianIoU=round(float(np.median([v[0] for v in per.values()])), 3) if per else None,
                inheritMedian=round(float(np.median([v[2] for v in per.values()])), 3) if per else None,
                inheritMin=min(((v[2], k) for k, v in per.items()), default=None))


def side_cmd(rgba, anchor, height, nation):
    """A lone commander at play zoom (32 px) with the tier S side keyline (pilot-review 14) on the four grounds:
    the share of its visible pixels in the side's hue (checks.side_share's rule) and its mean L* below each ground."""
    cloth = UNITS['nations'][nation]['cloth']['hex']
    keep = checks.keyline
    checks.keyline = tinted_keyline(SHADE[nation])
    fig, anc = scaled_figure(rgba, anchor, height, F_CMD)
    checks.keyline = keep
    a = fig[..., 3:4] / 255
    _, cc, ch = oklch(hexrgb(cloth)[None, None]); cc, ch = float(cc[0, 0]), float(ch[0, 0])
    rep = {}
    for g, gh in GROUNDS.items():
        canvas = fig[..., :3] * a + hexrgb(gh) * (1 - a)
        vis = a[..., 0] > 0.5
        _, C, h = oklch(canvas)
        dh = np.abs((h - ch + 180) % 360 - 180)
        side = (dh <= 20) & (C >= max(0.04, 0.45 * cc))
        L = to_lab(canvas)[..., 0][vis].mean()
        gL = float(to_lab(hexrgb(gh)[None, None])[0, 0, 0])
        rep[g] = dict(share=round(float((side & vis).sum() / max(1, vis.sum())), 3), below=round(gL - float(L), 1))
    out = dict(share=rep['plains']['share'], worstBelow=min(v['below'] for v in rep.values()), grounds=rep, fPx=round(F_CMD, 1))
    if nation == 'independent':  # undyed grey cloth: no side hue to measure; the value rule still holds
        out['share'] = None
        out['pass'] = bool(out['worstBelow'] >= GATE['valueBelow'])
    else:
        out['pass'] = bool(out['share'] >= GATE['sideShare'] and out['worstBelow'] >= GATE['valueBelow'])
    return out


def portrait_subject_lab(png):
    im = np.asarray(Image.open(png).convert('RGB')).astype(np.float64)
    lab = to_lab(im)
    bg = to_lab(np.array([[[28, 26, 23]]], np.float64))[0, 0]
    m = np.abs(lab[..., 0] - bg[0]) > 12
    m[: int(0.05 * m.shape[0])] = False
    return np.median(lab[m], 0)


def identity(stand_png, portrait):
    from pilot_metrics import de2000
    rgba = np.asarray(Image.open(stand_png).convert('RGBA')).astype(np.float64)
    ys, xs = np.nonzero(rgba[..., 3] > 0.35 * 255)
    top = rgba[ys.min():ys.min() + int(0.33 * (np.ptp(ys) + 1))]
    px = top[..., :3][top[..., 3] > 200]
    fl = np.median(to_lab(px[None])[0], 0)
    pl = portrait_subject_lab(portrait)
    d = round(de2000(fl, pl), 1)
    return dict(dE2000=d, upperThirdLab=[round(float(v), 1) for v in fl], portraitLab=[round(float(v), 1) for v in pl],
                pass_=bool(d < GATE['identityDE']))


def pipe(raw, fig, view, key, d, body=None, portrait=None, scale_dir=None):
    raw, d = os.path.abspath(raw), os.path.abspath(d)
    body = body and os.path.abspath(body)
    os.makedirs(d, exist_ok=True)
    keyed, krep = os.path.join(d, 'keyed.png'), os.path.join(d, 'key.json')
    py(os.path.join(HERE, 'key.py'), raw, keyed, key, '--json', krep)
    f0, f1 = os.path.join(d, 'frames0'), os.path.join(d, 'frames')
    py(os.path.join(HERE, 'slice.py'), keyed, fig, view, f0)
    py(os.path.join(HERE, 'ad_rimfix.py'), key, f0, f1)
    if key == 'magenta':  # the magenta key's rose cast on staffs, antlers and edges (cmdb_magrim.py), in place
        py(os.path.join(HERE, 'cmdb_magrim.py'), f1, f1)
        open(os.path.join(d, 'magrim.done'), 'w').write('1')
        # resumed run, the fix pass's route for Thornwood: the key's cast painted into thin features (units/tools/keycast.py,
        # critique fix 9, sandbox copy), in place. The Thornwood cloth hue lock (calibration decision 2, the troops'
        # tr_huelock.py, sandbox copy) is made beside them in frames.locked and measured, but the frames that ship stay
        # unlocked: on commanders the lock turns the portraits' leaf, moss and olive greens to turquoise
        # (review/probe/lock-compare.png), which breaks the owner's binding rule that a figure matches its portrait, and
        # every commander already carries the side keyline (gate 10%, as cmdA's). cmdb_pack.py can pack the locked set.
        kc = json.loads(py(os.path.join(HERE, 'keycast.py'), 'magenta', f1, f1))
        open(os.path.join(d, 'keycast.json'), 'w').write(json.dumps(kc))
        fl = os.path.join(d, 'frames.locked')
        import shutil
        for old in (fl, os.path.join(d, 'frames.unlocked')):
            if os.path.exists(old):
                shutil.rmtree(old)
        import tr_huelock
        lk = tr_huelock.run_dir('thornwood', f1, fl)
        open(os.path.join(d, 'huelock.json'), 'w').write(json.dumps(dict(tool='tr_huelock.py (thornwood: hue 90-230 at chroma >= 0.02, band 25 deg about the cloth hue)',
                                                                          shipped=False, lockedShareMax=max(lk.values()) if lk else 0,
                                                                          lockedShareMean=round(sum(lk.values()) / max(1, len(lk)), 3))))
    if key == 'blue':  # the blue key's mauve edge (cmda_bluerim.py), in place on the rim-fixed frames
        py(os.path.join(HERE, 'cmda_bluerim.py'), f1, f1)
        open(os.path.join(d, 'bluerim.done'), 'w').write('1')
    mp = os.path.join(f1, f'{fig}.{view}.json'); meta = json.load(open(mp))
    for f in meta['frames']:  # an empty cell (a speck) counts as missing, not as a frame (calibration finding 3)
        if not f.get('missing') and f.get('area', 1e9) < 300:
            f['missing'] = True; meta['missing'] = sorted(set(meta['missing']) | {f['name']})
    json.dump(meta, open(mp, 'w'), indent=1)
    import pilot_metrics
    guide = os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png')
    rep = json.loads(py(os.path.join(HERE, 'checks.py'), f1, fig, view, '--guide', guide, '--key', krep))
    rep.pop('thresholds', None)
    rep['consistency'] = pilot_metrics.consistency(f1, fig, view)
    rep['consistency'].pop('frames', None)
    rep['cameraAll'] = pilot_metrics.camera_all(f1, fig, view)
    if body:
        rep['cameraRel'] = camera_rel(f1, body, fig, view, scale_dir)
        rep['cameraRel']['scaleFrom'] = scale_dir and os.path.relpath(scale_dir, ROOT)
    meta = json.load(open(mp))
    pngs0 = [os.path.join(f0, f['file']) for f in meta['frames'] if not f.get('missing')]
    pngs1 = [os.path.join(f1, f['file']) for f in meta['frames'] if not f.get('missing')]
    rim0 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', *pngs0, '--key', key))
    rim1 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', *pngs1, '--key', key))
    rep['rim'] = dict(beforeMax=max(v['keyHueShiftedPct'] for v in rim0.values()),
                      afterMax=max(v['keyHueShiftedPct'] for v in rim1.values()))
    st = next((f for f in meta['frames'] if f['name'] == 'stand' and not f.get('missing')), None)
    if st:
        rgba = np.asarray(Image.open(os.path.join(f1, st['file'])).convert('RGBA')).astype(np.float64)
        rep['sideCmd'] = side_cmd(rgba, st['anchor'], st['height'], BYID[fig]['nation'])
        fu = os.path.join(d, 'frames.locked', st['file'])
        if os.path.exists(fu):  # the same measure with the hue lock, for the record (not shipped)
            ru = np.asarray(Image.open(fu).convert('RGBA')).astype(np.float64)
            rep['sideCmdLocked'] = side_cmd(ru, st['anchor'], st['height'], BYID[fig]['nation'])
            rep['hueLock'] = json.load(open(os.path.join(d, 'huelock.json')))
            rep['keyCast'] = json.load(open(os.path.join(d, 'keycast.json')))
        if portrait:
            rep['identity'] = identity(os.path.join(f1, st['file']), portrait)
    from cmda_edge import edge_dev_split  # the fringe gate on edge pixels with solid paint in reach (cmda_edge.py)
    rep['fringe'].update(edge_dev_split(keyed))
    f_ = rep['fringe']
    f_['pass_'] = bool(f_['fringePct'] <= 0.2 and f_['keyInUnitPct'] <= 0.5 and f_['edgeDevThickPct'] <= 8.0)
    cells = rep['cameraRel']['followN'] if body else int(rep['cameraAll']['follow'].split('/')[0])
    rep['gate'] = dict(
        cells=bool(cells >= (GATE['cells'] if BYID[fig]['layout'] == 'commander' else 13)), variety=bool(rep['variety']['pass']),
        rim=bool(rep['rim']['afterMax'] <= GATE['rimAfter']), fringe=bool(rep['fringe']['pass_']),
        side=bool(rep.get('sideCmd', {}).get('pass', False)),
        identity=bool(rep['identity']['pass_']) if 'identity' in rep else None,
        missing=list(meta['missing']))
    g = rep['gate']
    rep['pass'] = bool(g['cells'] and g['variety'] and g['rim'] and g['fringe'] and g['side'] and g['identity'] is not False)
    rep['sheet'] = raw
    json.dump(rep, open(os.path.join(d, 'checks.json'), 'w'), indent=1)
    return rep


def line(name, r):
    ca = r.get('cameraRel') or r.get('cameraAll', {}); co = r.get('consistency', {}); s = r.get('sideCmd', {})
    return (f"{name}: {'PASS' if r['pass'] else 'FAIL'} cells {ca.get('follow')} (median {ca.get('medianIoU')}"
            + (f", inherit {ca.get('inheritMedian')}" if 'inheritMedian' in ca else '') + f") fail {ca.get('failing', '')} | "
            f"variety {r['variety'].get('pass')} march {r['variety'].get('marchIoU')} alike {r['variety'].get('mostAlike')} | "
            f"cons {co.get('histMin')} dE {co.get('maxDE')} | side {s.get('share')} (locked {r.get('sideCmdLocked', {}).get('share')}) below {s.get('worstBelow')} | "
            f"rim {r['rim']['afterMax']} edgeDev {r['fringe'].get('edgeDevPct')} keyIn {r['fringe'].get('keyInUnitPct')} | "
            f"id {r.get('identity', {}).get('dE2000')} | missing {r['gate']['missing']}")


if __name__ == '__main__':
    a = sys.argv[1:]
    opt = {}
    for k in ('--body', '--portrait', '--scale'):
        if k in a:
            i = a.index(k); opt[k] = a[i + 1]; del a[i:i + 2]
    r = pipe(*a[:5], body=opt.get('--body'), portrait=opt.get('--portrait'), scale_dir=opt.get('--scale'))
    print(line(os.path.basename(a[0]), r))
