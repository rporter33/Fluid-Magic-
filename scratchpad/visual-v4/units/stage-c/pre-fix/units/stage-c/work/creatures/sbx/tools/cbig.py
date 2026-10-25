# Stage C creatures: the pipeline and gates for one big-body idle cutout (Salamander, Treant, Giant; art plan 5.3):
#   key (the stage B keyer: thin features keep their paint) -> slice --single idle -> rim fix -> checks:
#   camera   - the cutout's silhouette against its clay guide's (pilot creature_report: box-normalised IoU >= 0.55, the
#              facing margin IoU - IoU(mirrored guide) >= 0.03, aspect within 0.75 to 1.33 of the guide's);
#   identity - the median colour of the upper third against the portrait's subject, CIEDE2000 < 18 (plan 5.5);
#   value    - the lone body at its tier S size on the mockup's four grounds: its mean L* at least 15 below each ground
#              (design 3.8 rule 2 as the pilot applied it to the Salamander); the |difference| is reported beside it;
#   rim      - the boundary ring's key-hue shift after the fix <= 2% (pilot change 15);
#   fringe   - keyInUnitPct <= 0.5, edgeDevPct <= 8 (the keyer's report).
# The ground anchor comes from the maquette (pilot change 12: the guide's ground anchor mapped onto the cutout's alpha
# box) and the true height in wu from the guide (pilot_page.true_height_wu, on this sandbox's guides).
# Usage: python3 cbig.py RAW.png FIGURE VIEW OUTDIR
import json, os, subprocess, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SBX = os.path.abspath(os.path.join(HERE, '..'))
UNITS = json.load(open(os.path.join(SBX, 'units.json')))
BY = {u['id']: u for u in UNITS['units']}
GJ = os.path.join(SBX, 'refs', 'guides', 'guides.json')
GATES = dict(iou=0.55, facing=0.03, below=15.0, rimAfter=2.0, keyIn=0.5, edgeDev=8.0, identity=18.0)


def py(*a):
    p = subprocess.run([sys.executable, '-I'] + list(a), capture_output=True, text=True, cwd=HERE)
    if p.returncode:
        raise RuntimeError(p.stderr[-1500:])
    return p.stdout


def maquette_anchor(png, fig, view):
    g = json.load(open(GJ))[f'{fig}.idle.{view}']
    gx0, gy0, gx1, gy1 = g['box']
    ax, ay = g['anchor']
    a = np.asarray(Image.open(png).convert('RGBA'))[..., 3] > 90
    ys, xs = np.nonzero(a)
    fx0, fx1, fy0, fy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return [float(fx0 + (ax - gx0) / (gx1 - gx0) * (fx1 - fx0)), float(fy0 + (ay - gy0) / (gy1 - gy0) * (fy1 - fy0))]


def true_height_wu(fig, view):
    from pack import body_height
    from checks import guide_cells
    G = json.load(open(GJ))
    man = guide_cells(os.path.join(SBX, 'refs', 'guides', 'cinderWarrior.back.png'), 'cinderWarrior', 'back')['stand']
    wu_per_rig = 28 / (body_height(man['mask']) * G['cinderWarrior.back']['k'])
    g = G[f'{fig}.idle.{view}']
    return (g['box'][3] - g['box'][1]) * g['k'] * wu_per_rig


def value(png, height_wu, grounds=None):
    """The lone body at tier S (0.5 wu per px) over each ground: its alpha-weighted mean L* against the ground's."""
    import checks
    from v4color import to_lab
    rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
    m = rgba[..., 3] > 0.35 * 255
    ys, _ = np.nonzero(m)
    k = (height_wu / 0.5) / (ys.max() - ys.min() + 1)
    from pack import premul_resize
    s = checks.keyline(np.pad(premul_resize(rgba, k), ((1, 1), (1, 1), (0, 0))))
    a = s[..., 3:4] / 255
    out = {}
    for gname, gh in checks.GROUNDS.items():
        g = checks.hexrgb(gh)
        comp = s[..., :3] * a + g * (1 - a)
        L = to_lab(comp)[..., 0]
        w = a[..., 0]
        bodyL = float((L * w).sum() / w.sum())
        gL = float(to_lab(g[None, None])[0, 0, 0])
        out[gname] = dict(bodyL=round(bodyL, 1), groundL=round(gL, 1), below=round(gL - bodyL, 1))
    out['worstBelow'] = min(v['below'] for v in out.values() if isinstance(v, dict))
    out['minContrast'] = min(abs(v['below']) for v in out.values() if isinstance(v, dict))
    out['pass'] = bool(out['worstBelow'] >= GATES['below'])
    return out


def pipe(raw, fig, view, d):
    u = BY[fig]
    key = u['key']
    os.makedirs(d, exist_ok=True)
    keyed, krep = os.path.join(d, 'keyed.png'), os.path.join(d, 'key.json')
    py(os.path.join(HERE, 'key.py'), raw, keyed, key, '--json', krep)
    f0, f1 = os.path.join(d, 'frames0'), os.path.join(d, 'frames')
    py(os.path.join(HERE, 'slice.py'), keyed, fig, view, f0, '--single', 'idle')
    py(os.path.join(HERE, 'ad_rimfix.py'), key, f0, f1)
    for f in os.listdir(f0):  # the slicer's JSON beside the rim-fixed frame
        if f.endswith('.json'):
            m = json.load(open(os.path.join(f0, f)))
            png = os.path.join(f1, m['file'])
            m['anchorSlice'] = m['anchor']
            m['anchor'] = [round(v, 1) for v in maquette_anchor(png, fig, view)]
            m['anchorFrom'] = 'maquette (pilot change 12)'
            m['heightWu'] = round(true_height_wu(fig, view), 2)
            json.dump(m, open(os.path.join(f1, f), 'w'), indent=1)
    import pilot_metrics
    rep = pilot_metrics.creature_report(f1, fig, view, krep)
    png = os.path.join(f1, f'{fig}.{view}.idle.png')
    meta = json.load(open(os.path.join(f1, f'{fig}.{view}.idle.json')))
    rim0 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', os.path.join(f0, f'{fig}.{view}.idle.png'), '--key', key))
    rim1 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', png, '--key', key))
    rep['rim'] = dict(beforeMax=max(v['keyHueShiftedPct'] for v in rim0.values()), afterMax=max(v['keyHueShiftedPct'] for v in rim1.values()))
    rep['value'] = value(png, meta['heightWu'])
    rep['heightWu'] = meta['heightWu']
    rep['srcPx'] = [meta['width'], meta['height']]
    rep['tierPx'] = {t: round(meta['heightWu'] / s) for t, s in (('S', 0.5), ('H', 0.25))}
    rep['oversampleAtH'] = round(meta['height'] / (meta['heightWu'] / 0.25), 2)
    rep['sheet'] = raw
    fr = rep['fringe']
    g = dict(camera=bool(rep['camera']['pass']), identity=bool(rep['identity']['pass']), value=bool(rep['value']['pass']),
             rim=bool(rep['rim']['afterMax'] <= GATES['rimAfter']),
             fringe=bool(fr['keyInUnitPct'] <= GATES['keyIn'] and (fr.get('edgeDevPct') or 0) <= GATES['edgeDev']))
    rep['gates'] = g
    rep['pass'] = all(g.values())
    json.dump(rep, open(os.path.join(d, 'checks.json'), 'w'), indent=1)
    return rep


def line(name, r):
    c, v = r['camera'], r['value']
    return (f"{name}: {'PASS' if r['pass'] else 'FAIL ' + ','.join(k for k, x in r['gates'].items() if not x)} | iou {c['iou']} "
            f"facing {round(c['iou'] - c['iouMirrored'], 3)} aspect {c['aspectRatio']} | idDE {r['identity']['dE2000']} | "
            f"below {v['worstBelow']} (contrast {v['minContrast']}) | rim {r['rim']['afterMax']} | keyIn {r['fringe']['keyInUnitPct']} "
            f"edge {r['fringe'].get('edgeDevPct')} | {r['heightWu']} wu, src {r['srcPx']} px, H x{r['oversampleAtH']}")


if __name__ == '__main__':
    a = sys.argv[1:]
    r = pipe(*a[:4])
    print(line(os.path.basename(a[0]), r))
