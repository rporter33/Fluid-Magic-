# Calibration pipeline over one raw sheet: key -> slice -> rim fix -> checks (all-cells camera, consistency,
# the stand-only camera, variety, fringe, side share for troops) and the rim measure.
# Usage: python3 cal_pipe.py RAW.png FIGURE VIEW KEY OUTDIR [--single ACTION]
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..'))


def py(*a):
    p = subprocess.run([sys.executable, '-I'] + list(a), capture_output=True, text=True, cwd=HERE)
    if p.returncode:
        raise RuntimeError(p.stderr[-800:])
    return p.stdout


def pipe(raw, fig, view, key, d, single=None):
    os.makedirs(d, exist_ok=True)
    keyed, krep = os.path.join(d, 'keyed.png'), os.path.join(d, 'key.json')
    py(os.path.join(HERE, 'key.py'), raw, keyed, key, '--json', krep)
    f0, f1 = os.path.join(d, 'frames0'), os.path.join(d, 'frames')
    if single:
        py(os.path.join(HERE, 'slice.py'), keyed, fig, view, f0, '--single', single)
    else:
        py(os.path.join(HERE, 'slice.py'), keyed, fig, view, f0)
    py(os.path.join(HERE, 'ad_rimfix.py'), key, f0, f1)
    if not single:  # a cell the model left empty (a speck of a few pixels) counts as missing, not as a frame
        mp = os.path.join(f1, f'{fig}.{view}.json'); meta = json.load(open(mp))
        for f in meta['frames']:
            if not f.get('missing') and f.get('area', 1e9) < 300:
                f['missing'] = True; meta['missing'] = sorted(set(meta['missing']) | {f['name']})
        json.dump(meta, open(mp, 'w'), indent=1)
    import pilot_metrics
    if single:
        return dict(key=json.load(open(krep)))
    guide = os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png')
    rep = json.loads(py(os.path.join(HERE, 'checks.py'), f1, fig, view, '--guide', guide, '--key', krep,
                        '--proof', os.path.join(d, 'proof.png')))
    rep['consistency'] = pilot_metrics.consistency(f1, fig, view)
    rep['cameraAll'] = pilot_metrics.camera_all(f1, fig, view)
    meta = json.load(open(os.path.join(f1, f'{fig}.{view}.json')))
    pngs0 = [os.path.join(f0, f['file']) for f in meta['frames'] if not f.get('missing')]
    pngs1 = [os.path.join(f1, f['file']) for f in meta['frames'] if not f.get('missing')]
    rim0 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', *pngs0, '--key', key))
    rim1 = json.loads(py(os.path.join(HERE, 'ad_measures.py'), 'rim', *pngs1, '--key', key))
    rep['rim'] = dict(beforeMax=max(v['keyHueShiftedPct'] for v in rim0.values()),
                      afterMax=max(v['keyHueShiftedPct'] for v in rim1.values()))
    rep['sheet'] = raw
    json.dump(rep, open(os.path.join(d, 'checks.json'), 'w'), indent=1)
    return rep


def line(name, r):
    cam = r.get('camera', {}); ca = r.get('cameraAll', {}); co = r.get('consistency', {})
    return (f"{name}: cells {ca.get('follow')} (median IoU {ca.get('medianIoU')}, margin {ca.get('medianMargin')}) | stand IoU "
            f"{cam.get('iou')} | variety {r.get('variety', {}).get('pass')} | cons hist {co.get('histMin')} dE {co.get('maxDE')} | "
            f"side {r.get('side', {}).get('share')} | edgeDev {r.get('fringe', {}).get('edgeDevPct')} keyIn {r.get('fringe', {}).get('keyInUnitPct')} | "
            f"rim {r.get('rim')}")


if __name__ == '__main__':
    a = sys.argv[1:]
    single = None
    if '--single' in a:
        i = a.index('--single'); single = a[i + 1]; del a[i:i + 2]
    r = pipe(*a[:5], single=single)
    print(line(os.path.basename(a[0]), r))
