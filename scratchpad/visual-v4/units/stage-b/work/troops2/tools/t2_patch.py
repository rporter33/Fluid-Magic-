# Stage B troops2: the eye check's fix for a sheet that passes every automatic gate but shows one wrong frame, by taking
# that one frame from the same unit's previous sheet of the same view (its frames already keyed, rim-fixed and, for
# Thornwood, hue-locked by the same pipeline), then re-running every frame-level gate on the patched set:
#   - Briar Guard front (t2b): its dropped-weapon cell holds a cheering man (inherited from its base, the R17 sheet); the
#     dropped halberd comes from r1.briarGuard.front, the sheet it replaces;
#   - Heavy Infantry back (t2b): its hit frame faces the camera in a back sheet, in the archer's tan sleeves; the hit frame
#     comes from r2.heavyInfantry.back.dress, the sheet t2b was re-dressed from (same painting).
# The raw-sheet gates (key fringe) keep the patched sheet's own values. Writes ../sheets/<sheet>.patched/.
# Usage: python3 t2_patch.py
import json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W2 = os.path.abspath(os.path.join(HERE, '..'))
TR = os.path.abspath(os.path.join(W2, '..', 'troops'))
T = os.path.join(TR, 'sbx', 'tools')
sys.path.insert(0, T)
os.chdir(T)
import tr_pipe  # noqa: E402
import pilot_metrics  # noqa: E402

PATCHES = [
    ('t2b.briarGuard.front.dress', 'briarGuard', 'front', 'dropped', os.path.join(TR, 'sheets', 'r1.briarGuard.front'),
     'the dropped-weapon cell held a cheering man (inherited from the R17 base); the dropped halberd of r1.briarGuard.front'),
    ('t2b.heavyInfantry.back.dress', 'heavyInfantry', 'back', 'recoil', os.path.join(TR, 'sheets', 'r2.heavyInfantry.back.dress'),
     'the hit frame faced the camera in a back sheet (the laid-in archer repainted turned); the hit frame of r2, the sheet t2b was re-dressed from'),
]


def patch(name, fig, view, cell, donor, why):
    src = os.path.join(W2, 'sheets', name)
    dst = os.path.join(W2, 'sheets', name + '.patched')
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    for sub in ('frames1', 'frames'):
        mp = os.path.join(dst, sub, f'{fig}.{view}.json')
        m = json.load(open(mp))
        dm = json.load(open(os.path.join(donor, sub, f'{fig}.{view}.json')))
        df = next(f for f in dm['frames'] if f['name'] == cell)
        for i, f in enumerate(m['frames']):
            if f['name'] == cell:
                m['frames'][i] = dict(df, patchedFrom=os.path.basename(donor))
        json.dump(m, open(mp, 'w'), indent=1)
        shutil.copy(os.path.join(donor, sub, df['file']), os.path.join(dst, sub, df['file']))
    f2 = os.path.join(dst, 'frames')
    rep = json.load(open(os.path.join(dst, 'checks.json')))
    r = json.loads(tr_pipe.py(os.path.join(T, 'checks.py'), f2, fig, view, '--guide',
                              os.path.join(TR, 'sbx', 'refs', 'guides', f'{fig}.{view}.png'), '--key', os.path.join(dst, 'key.json')))
    rep['variety'] = r['variety']
    cons = pilot_metrics.consistency(f2, fig, view)
    up = {n: v for n, v in cons.get('frames', {}).items() if n not in ('deadA', 'deadB')}
    w = min(up, key=lambda k: up[k]['hist']); dmax = max(up, key=lambda k: up[k]['de'])
    rep['consistency'] = dict(standCloth=cons.get('standCloth'), histMin=[w, up[w]['hist']], maxDE=[dmax, up[dmax]['de']],
                              pass_=bool(up[w]['hist'] >= tr_pipe.GATES['histMin'] and up[dmax]['de'] <= tr_pipe.GATES['maxDE']))
    rep['consistency']['pass'] = rep['consistency']['pass_']
    rep['cameraAll'] = pilot_metrics.camera_all(f2, fig, view)
    rep['cameraBody'] = tr_pipe.camera_body(f2, fig, view)
    rep['scaleBody'] = tr_pipe.scale_body(f2, fig, view)
    rep['side'] = tr_pipe.side_measures(f2, fig, view)
    n, tot = [int(x) for x in rep['cameraAll']['follow'].split('/')]
    g = rep['gates']
    g.update(camera=bool(tot and n / tot >= tr_pipe.GATES['cells'] - 1e-9), variety=bool(rep['variety']['pass']),
             side=bool(rep['side']['pass']), consistency=bool(rep['consistency']['pass']), scale=bool(rep['scaleBody']['pass_']))
    rep['pass'] = all(g.values())
    rep['patched'] = dict(cell=cell, donor=os.path.relpath(donor, os.path.dirname(W2)), why=why)
    json.dump(rep, open(os.path.join(dst, 'checks.json'), 'w'), indent=1)
    print(tr_pipe.line(name + '.patched', rep))


if __name__ == '__main__':
    for p in PATCHES:
        patch(*p)
