# Stage B troops: the pipeline over one raw troop sheet, with every gate of the task:
#   key (the calibration's keyer: thin features keep their paint) -> slice -> rim fix (change 15) -> hue lock (Thornwood,
#   change 9) -> checks: all-cells camera (gate 13 of 15), pose variety, scale, consistency, fringe (keyInUnit <= 0.5,
#   edgeDev <= 8), rim (ring hue shift <= 2% after the fix), side colour at 28 px with the side keyline (gate 30%; the
#   neutral keyline reported beside it), value (15 L* below every ground).
# Independents wear undyed grey: no hue share applies; their side check is that they do not read as either nation (the
#   share of pixels in the Cinder or the Thornwood cloth window, gate 8%) plus the value rule.
# Also reported, not gated: the all-cells camera normalised by the opened body height (bows and spears raised above the
#   head stop shrinking the figure), as the calibration did for re-dresses.
# Usage: python3 tr_pipe.py RAW.png FIGURE VIEW OUTDIR
import json, os, subprocess, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..'))
UNITS = json.load(open(os.path.join(ROOT, 'units.json')))
BY = {u['id']: u for u in UNITS['units']}
SHADE = {'cinderHorde': '#7E3118', 'thornwood': '#113F2F', 'independent': '#4A4A44'}
GATES = dict(cells=13 / 15, rimAfter=2.0, side=0.30, foreign=0.08, below=15.0, keyIn=0.5, edgeDev=8.0, histMin=0.55, maxDE=12.0)


def py(*a):
    p = subprocess.run([sys.executable, '-I'] + list(a), capture_output=True, text=True, cwd=HERE)
    if p.returncode:
        raise RuntimeError(p.stderr[-1500:])
    return p.stdout


def side_measures(d, fig, view):
    import checks
    from ad_measures import tinted_keyline
    u = BY[fig]
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    st = next(f for f in meta['frames'] if f['name'] == 'stand' and not f.get('missing'))
    rgba = checks.load(os.path.join(d, st['file']))
    kind = u.get('formation') or 'heavy'
    out = {}
    if u['nation'] == 'independent':
        res = {}
        for label, kl in (('neutral', checks.keyline), ('sideKeyline', tinted_keyline(SHADE['independent']))):
            old = checks.keyline; checks.keyline = kl
            per = {}
            for nat in ('cinderHorde', 'thornwood'):
                r = checks.side_report(rgba, st['anchor'], st['height'], UNITS['nations'][nat]['cloth']['hex'], kind)
                per[nat] = r['share']
            r = checks.side_report(rgba, st['anchor'], st['height'], '#8C8A80', kind,
                                   proof=os.path.join(d, '..', f'proof.{label}.png'))
            checks.keyline = old
            res[label] = dict(foreign=round(max(per.values()), 3), foreignBy=per,
                              worstBelow=min(r[g]['below'] for g in checks.GROUNDS))
        out = dict(kind='independent', **res)
        out['pass'] = bool(res['sideKeyline']['foreign'] <= GATES['foreign'] and res['sideKeyline']['worstBelow'] >= GATES['below']
                           and res['neutral']['worstBelow'] >= GATES['below'])
        return out
    cloth = UNITS['nations'][u['nation']]['cloth']['hex']
    for label, kl in (('neutral', checks.keyline), ('sideKeyline', tinted_keyline(SHADE[u['nation']]))):
        old = checks.keyline; checks.keyline = kl
        r = checks.side_report(rgba, st['anchor'], st['height'], cloth, kind, proof=os.path.join(d, '..', f'proof.{label}.png'))
        checks.keyline = old
        out[label] = dict(share=r['share'], worstBelow=min(r[g]['below'] for g in checks.GROUNDS),
                          below={g: r[g]['below'] for g in checks.GROUNDS})
    out['pass'] = bool(out['sideKeyline']['share'] >= GATES['side'] and out['sideKeyline']['worstBelow'] >= GATES['below']
                       and out['neutral']['worstBelow'] >= GATES['below'])
    return out


def camera_body(d, fig, view):
    """camera_all with both silhouettes normalised by their opened body height (pack.body_height)."""
    import pilot_metrics as pm
    from checks import guide_cells, frame_mask, norm_sil
    from pack import body_height
    gc = guide_cells(os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png'), fig, view)
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    per = {}
    for f in meta['frames']:
        if f.get('missing') or f['name'] not in gc or f['name'] == 'dropped' or f.get('kind') == 'lying':
            continue
        _, m = frame_mask(d, f)
        g = gc[f['name']]
        a = norm_sil(m, f['anchor'], body_height(m))
        b = norm_sil(g['mask'], g['anchor'], body_height(g['mask']))
        i, im = pm.iou(a, b), pm.iou(a, b[:, ::-1])
        per[f['name']] = (round(i, 3), round(i - im, 3))
    follow = [k for k, v in per.items() if v[0] >= 0.55 and v[1] >= 0]
    return dict(cells=per, follow=f'{len(follow)}/{len(per)}', note='upright cells only, body-height normalised')


def scale_body(d, fig, view):
    """The scale check on the opened body height (pack.body_height: weapons held above the head or below the feet stop
    counting), the measure the packer scales by; checks.py's bbox version is reported beside it."""
    from checks import frame_mask, UPRIGHT, CHECKS
    from pack import body_height
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    fr = {f['name']: f for f in meta['frames'] if not f.get('missing')}
    hb = {n: body_height(frame_mask(d, f)[1]) for n, f in fr.items() if n in UPRIGHT}
    st = hb.get('stand') or 1
    hs = {n: round(v / st, 3) for n, v in hb.items()}
    return dict(heights=hs, pass_=bool(all(abs(x - 1) <= CHECKS['scaleSpread'] for x in hs.values())))


def pipe(raw, fig, view, d):
    u = BY[fig]
    key = u['key']
    os.makedirs(d, exist_ok=True)
    keyed, krep = os.path.join(d, 'keyed.png'), os.path.join(d, 'key.json')
    py(os.path.join(HERE, 'key.py'), raw, keyed, key, '--json', krep)
    f0, f1, f2 = os.path.join(d, 'frames0'), os.path.join(d, 'frames1'), os.path.join(d, 'frames')
    py(os.path.join(HERE, 'slice.py'), keyed, fig, view, f0)
    py(os.path.join(HERE, 'ad_rimfix.py'), key, f0, f1)
    mp = os.path.join(f1, f'{fig}.{view}.json'); meta = json.load(open(mp))
    for f in meta['frames']:  # a cell left empty (a speck) counts as missing (calibration); a bow dropped flat is thin
        if not f.get('missing') and f.get('area', 1e9) < (100 if f['name'] == 'dropped' else 300):
            f['missing'] = True; meta['missing'] = sorted(set(meta['missing']) | {f['name']})
    json.dump(meta, open(mp, 'w'), indent=1)
    import tr_huelock
    lockshare = tr_huelock.run_dir(u['nation'], f1, f2) if u['nation'] in tr_huelock.RULES else None
    if lockshare is None:
        import shutil
        if os.path.exists(f2):
            shutil.rmtree(f2)
        shutil.copytree(f1, f2)
    import pilot_metrics
    guide = os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png')
    rep = json.loads(py(os.path.join(HERE, 'checks.py'), f2, fig, view, '--guide', guide, '--key', krep))
    rep.pop('side', None); rep.pop('thresholds', None)
    cons = pilot_metrics.consistency(f2, fig, view)
    lying = {n for n in ('deadA', 'deadB')}
    up = {n: v for n, v in cons.get('frames', {}).items() if n not in lying}
    ly = {n: v for n, v in cons.get('frames', {}).items() if n in lying}
    # upright and action frames against the stand frame (the pilot's thresholds); lying frames show whichever side of
    # the body faces up (a face-down body in the front view shows its back), so they are checked against both views'
    # stand frames once both views exist (tr_final.py); here they are reported
    w = min(up, key=lambda k: up[k]['hist']) if up else None
    dmax = max(up, key=lambda k: up[k]['de']) if up else None
    rep['consistency'] = dict(standCloth=cons.get('standCloth'), histMin=[w, up[w]['hist'] if w else None],
                              maxDE=[dmax, up[dmax]['de'] if dmax else None], lying=ly,
                              pass_=bool(w and up[w]['hist'] >= GATES['histMin'] and up[dmax]['de'] <= GATES['maxDE']))
    rep['consistency']['pass'] = rep['consistency']['pass_']
    rep['cameraAll'] = pilot_metrics.camera_all(f2, fig, view)
    rep['cameraBody'] = camera_body(f2, fig, view)
    rep['scaleBody'] = scale_body(f2, fig, view)
    meta = json.load(open(os.path.join(f2, f'{fig}.{view}.json')))
    pngs0 = [os.path.join(f0, f['file']) for f in meta['frames'] if not f.get('missing')]
    pngs1 = [os.path.join(f1, f['file']) for f in meta['frames'] if not f.get('missing')]
    rim0 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', *pngs0, '--key', key))
    rim1 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', *pngs1, '--key', key))
    rep['rim'] = dict(beforeMax=max(v['keyHueShiftedPct'] for v in rim0.values()), afterMax=max(v['keyHueShiftedPct'] for v in rim1.values()))
    rep['side'] = side_measures(f2, fig, view)
    rep['hueLockShare'] = lockshare
    rep['sheet'] = raw
    ca = rep['cameraAll']
    n, tot = [int(x) for x in ca['follow'].split('/')]
    fr = rep['fringe']
    g = dict(camera=bool(tot and n / tot >= GATES['cells'] - 1e-9 and not rep['missing']),
             variety=bool(rep['variety']['pass']),
             rim=bool(rep['rim']['afterMax'] <= GATES['rimAfter']),
             side=bool(rep['side']['pass']),
             fringe=bool(fr['keyInUnitPct'] <= GATES['keyIn'] and (fr.get('edgeDevPct') or 0) <= GATES['edgeDev']),
             consistency=bool(rep['consistency'].get('pass')),
             scale=bool(rep['scaleBody']['pass_']))
    rep['gates'] = g
    rep['pass'] = all(g.values())
    json.dump(rep, open(os.path.join(d, 'checks.json'), 'w'), indent=1)
    return rep


def line(name, r):
    s = r['side']
    sd = (f"foreign {s['sideKeyline']['foreign']} below {s['sideKeyline']['worstBelow']}" if s.get('kind') == 'independent'
          else f"side {s['neutral']['share']}/{s['sideKeyline']['share']}kl below {s['sideKeyline']['worstBelow']}")
    co = r['consistency']
    return (f"{name}: {'PASS' if r['pass'] else 'FAIL ' + ','.join(k for k, v in r['gates'].items() if not v)} | cells "
            f"{r['cameraAll']['follow']} (body {r['cameraBody']['follow']}) | variety {r['variety'].get('marchIoU')}/"
            f"{r['variety'].get('mostAlike')} | rim {r['rim']['afterMax']} | {sd} | cons {co.get('histMin')} {co.get('maxDE')} | "
            f"keyIn {r['fringe']['keyInUnitPct']} edge {r['fringe'].get('edgeDevPct')} | missing {r['missing']}")


if __name__ == '__main__':
    a = sys.argv[1:]
    r = pipe(*a[:4])
    print(line(os.path.basename(a[0]), r))
