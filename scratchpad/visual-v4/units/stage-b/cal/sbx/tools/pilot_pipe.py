# The pilot's pipeline over its raw sheets: key -> slice -> checks (camera, variety, scale, fringe, side colour)
# plus the pilot's extra measures (pilot_metrics.py: consistency between poses, the look at 40 px, identity).
# Usage: python3 pilot_pipe.py ROUND [JOB.MODEL ...]     (default: every raw sheet of the round)
# Writes ../pilot/work/<round>/<job>.<model>/ (keyed sheet, key report, frames, checks.json, proof) and
# ../pilot/work/<round>/summary.json.
import glob, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
FIG = {'cw': 'cinderWarrior', 'wr': 'wolfRider', 'sal': 'salamander-01', 'warden': 'warden'}
KEY = {'cw': 'green', 'wr': 'magenta', 'sal': 'green'}


def py(*a):
    p = subprocess.run([sys.executable, '-I'] + list(a), capture_output=True, text=True, cwd=HERE)
    if p.returncode:
        raise RuntimeError(p.stderr[-800:])
    return p.stdout


def one(rnd, name):
    job, model = name.rsplit('.', 1)
    piece, view = job.split('.')[:2]
    if view == 'bust':
        return None
    raw = os.path.join(ROOT, 'pilot', 'raw', rnd, name + '.png')
    d = os.path.join(ROOT, 'pilot', 'work', rnd, name)
    os.makedirs(d, exist_ok=True)
    fig = FIG[piece]
    keyed, krep = os.path.join(d, 'keyed.png'), os.path.join(d, 'key.json')
    py(os.path.join(HERE, 'key.py'), raw, keyed, KEY[piece], '--json', krep)
    frames = os.path.join(d, 'frames')
    if piece == 'sal':
        py(os.path.join(HERE, 'slice.py'), keyed, fig, view, frames, '--single', 'idle')
        import pilot_metrics
        rep = pilot_metrics.creature_report(frames, fig, view, krep)
    else:
        py(os.path.join(HERE, 'slice.py'), keyed, fig, view, frames)
        guide = os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png')
        rep = json.loads(py(os.path.join(HERE, 'checks.py'), frames, fig, view, '--guide', guide, '--key', krep,
                            '--proof', os.path.join(d, 'proof.png')))
        import pilot_metrics
        rep['consistency'] = pilot_metrics.consistency(frames, fig, view)
        rep['cameraAll'] = pilot_metrics.camera_all(frames, fig, view)
    rep['sheet'] = os.path.relpath(raw, ROOT)
    rep['model'] = model
    json.dump(rep, open(os.path.join(d, 'checks.json'), 'w'), indent=1)
    return rep


def main():
    rnd = sys.argv[1]
    names = sys.argv[2:] or sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(ROOT, 'pilot', 'raw', rnd, '*.png')))
    out = {}
    sp = os.path.join(ROOT, 'pilot', 'work', rnd, 'summary.json')
    if os.path.exists(sp):
        out = json.load(open(sp))
    for n in names:
        try:
            r = one(rnd, n)
        except Exception as e:  # noqa: BLE001 - report and go on
            r = {'error': str(e)[-400:]}
        if r is None:
            continue
        out[n] = r
        cam = r.get('camera', {})
        print(n, 'camera', cam.get('iou'), cam.get('iouMirrored'), cam.get('pass'), '| variety', r.get('variety', {}).get('pass'),
              r.get('variety', {}).get('marchIoU'), r.get('variety', {}).get('mostAlike'), '| side', r.get('side', {}).get('share'),
              r.get('side', {}).get('pass'), '| fringe', r.get('fringe', {}).get('fringePct'), r.get('fringe', {}).get('keyInUnitPct'),
              '| cons', r.get('consistency', {}).get('maxDE'), r.get('consistency', {}).get('histMin'), '| all', r.get('cameraAll', {}).get('medianIoU'), r.get('cameraAll', {}).get('follow'), r.get('identity', {}).get('dE2000'), r.get('error', ''), flush=True)
    os.makedirs(os.path.dirname(sp), exist_ok=True)
    json.dump(out, open(sp, 'w'), indent=1)


if __name__ == '__main__':
    main()
