# Stage C fix pass: the pipeline and gates for each fix job's raw output, the same ones the first rolls went through:
#   grid (key-pose sheets: R1, R4, R6, the reserve)  -> creatures' cgrid.py into work/creatures/sheets/<job>/;
#   single (R2, the Treant crowns)                   -> creatures' cbig.py into work/creatures/sheets/<job>/, then the
#       critique's rule for fix 5: the current cut's px-to-wu scale is kept (k = heightWu / height of the shipped cutout)
#       and heightWu grows with the crown; the ground anchor is the shipped one carried through the edit (shipped cutout
#       -> its raw sheet -> the padded base -> the new raw, refined by matching the body below the crown), never the
#       maquette's box mapped onto the new, taller box (that would shrink the body and move the feet);
#   god (R3, R5, R7)                                 -> gods' gd_post.process into work/gods/cut/<tag>/.
# Usage: python3 -I fpost.py [JOB ...]
import json, os, subprocess, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(FIX, '..', '..', '..'))
CW = os.path.join(UNITS, 'stage-c', 'work', 'creatures')
CT = os.path.join(CW, 'sbx', 'tools')
GT = os.path.join(UNITS, 'stage-c', 'work', 'gods', 'tools')
PRE = os.path.join(UNITS, 'stage-c', 'pre-fix', 'units', 'stage-c')


def alpha(p):
    return np.asarray(Image.open(p).convert('RGBA'))[..., 3] > 128


def treant_scale(j, d):
    """Carry the shipped cutout's wu-per-px scale and ground anchor onto the new cutout (fix 5)."""
    fig, view = j['figure'], j['view']
    old_png = os.path.join(PRE, 'atlas', 'creatures', 'frames', f'{fig}.{view}', f'{fig}.{view}.idle.png')
    old = json.load(open(old_png.replace('.png', '.json')))
    newp = os.path.join(d, 'frames', f'{fig}.{view}.idle.png')
    new = json.load(open(newp.replace('.png', '.json')))
    raw_new = Image.open(j['out']); s0 = raw_new.width / j['pad']['baseSize'][0]
    A0, A1 = alpha(old_png), alpha(newp)
    # the shipped cutout in new-cutout px, first guess: old cutout -> old raw (+box) -> base (+pad) -> new raw (x s0) -> new cutout (-box)
    ox, oy = old['box'][0] + j['pad']['side'], old['box'][1] + j['pad']['top']
    nx, ny = new['box'][0], new['box'][1]
    ys, xs = np.nonzero(A0)
    keep = ys > ys.min() + 0.35 * (ys.max() - ys.min())  # the body below the crown
    ys, xs = ys[keep], xs[keep]
    best = (-1, s0, 0, 0)
    for s in np.linspace(s0 * 0.96, s0 * 1.04, 17):
        bx, by = (ox * s) - nx, (oy * s) - ny
        for dx in range(-12, 13, 2):
            for dy in range(-12, 13, 2):
                X = np.round(xs * s + bx + dx).astype(int); Y = np.round(ys * s + by + dy).astype(int)
                ok = (X >= 0) & (Y >= 0) & (X < A1.shape[1]) & (Y < A1.shape[0])
                hit = A1[Y[ok], X[ok]].sum() / len(X)
                if hit > best[0]:
                    best = (float(hit), float(s), bx + dx, by + dy)
    hit, s, bx, by = best
    k_old = old['heightWu'] / old['height']           # wu per shipped-cutout px
    k_new = k_old / s
    anc = [round(old['anchor'][0] * s + bx, 1), round(old['anchor'][1] * s + by, 1)]
    new.update(anchorMaquetteMap=new['anchor'], anchor=anc, heightWu=round(new['height'] * k_new, 2),
               anchorFrom='the shipped cutout\'s maquette anchor carried through the crown edit (stage C fix 5)',
               scaleFrom=dict(rule='critique fix 5: the shipped cut\'s px-to-wu scale kept, heightWu grows with the crown',
                              shippedHeightPx=old['height'], shippedHeightWu=old['heightWu'], pxScale=round(s, 4), bodyMatch=round(hit, 3)))
    json.dump(new, open(newp.replace('.png', '.json'), 'w'), indent=1)
    ck = json.load(open(os.path.join(d, 'checks.json')))
    ck['heightWu'] = new['heightWu']; ck['scaleFrom'] = new['scaleFrom']
    ck['tierPx'] = {t: round(new['heightWu'] / q) for t, q in (('S', 0.5), ('H', 0.25))}
    json.dump(ck, open(os.path.join(d, 'checks.json'), 'w'), indent=1)
    return dict(heightWu=[old['heightWu'], new['heightWu']], heightPx=[old['height'], new['height']], scale=round(s, 4), bodyMatch=round(hit, 3), anchor=anc)


def main(names):
    jobs = json.load(open(os.path.join(FIX, 'jobs.json')))
    if names:
        jobs = [j for j in jobs if j['job'] in names]
    for j in jobs:
        if not os.path.exists(j['out']):
            print(j['job'], ': no raw'); continue
        if j['kind'] in ('grid', 'single'):
            d = os.path.join(CW, 'sheets', j['job'])
            tool = 'cgrid.py' if j['kind'] == 'grid' else 'cbig.py'
            p = subprocess.run([sys.executable, os.path.join(CT, tool), j['out'], j['figure'], j['view'], d], capture_output=True, text=True, cwd=CT)
            print((p.stdout.strip().splitlines() or [''])[-1] if p.returncode == 0 else f"{j['job']}: ERROR {p.stderr[-1200:]}", flush=True)
            if p.returncode == 0 and j['kind'] == 'single':
                print('   scale', json.dumps(treant_scale(j, d)), flush=True)
        else:
            p = subprocess.run([sys.executable, '-I', os.path.join(GT, 'gd_post.py'), j['figure'], j['view'], j['out']], capture_output=True, text=True, cwd=GT)
            print(j['job'], (p.stdout.strip()[-900:]) if p.returncode == 0 else 'ERROR ' + p.stderr[-1200:], flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])
