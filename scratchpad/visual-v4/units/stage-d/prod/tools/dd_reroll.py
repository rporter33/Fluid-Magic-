# Rest of stage D: the art director's re-rolls. A re-roll is the job's own prompt with the failure named and how to fix it
# ("Corrections from the previous attempt, which must be fixed: ..."), the same guide and idle references, and with --prev
# the failed image as a further reference whose good cells are to be kept (an nb21 edit). It runs through dd_gen.py (one
# log, one budget) and is post-processed with dd_post.py --raw/--tag; the accepted cells are named in prod/selection.json.
# Usage: python3 -I dd_reroll.py JOB SUFFIX "correction" [--prev] [--guide GUIDE_ID]   -> appends to prod/jobs/rerolls.json
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROD = os.path.abspath(os.path.join(HERE, '..'))


def main():
    a = sys.argv[1:]
    prev = '--prev' in a
    a = [x for x in a if x != '--prev']
    prevraw = None
    if '--prevraw' in a:
        i = a.index('--prevraw'); prevraw = a[i + 1]; del a[i:i + 2]; prev = True
    guide = None
    if '--guide' in a:
        i = a.index('--guide'); guide = a[i + 1]; del a[i:i + 2]
    job, suffix, corr = a[0], a[1], a[2]
    J = dict(next(j for j in json.load(open(os.path.join(PROD, 'jobs', 'actions.json'))) if j['job'] == job))
    txt = open(J['prompt']).read().rstrip('\n')
    refs = list(J['refs'])
    if guide:
        refs[0] = os.path.join(PROD, 'guides', guide + '.png')
    if prev:
        refs.append(prevraw or J['out'])
        n = len(refs)
        txt += (f'\n\nImage {n} is the previous attempt at this image. Keep everything in it that the corrections below do not '
                f'name exactly as it is (the same figures, poses, places and painting); change only what they name.')
    txt += '\n\nCorrections from the previous attempt, which must be fixed: ' + corr + '\n'
    p = J['prompt'].replace('.txt', f'.{suffix}.txt')
    open(p, 'w').write(txt)
    out = J['out'].replace('.png', f'.{suffix}.png')
    R = dict(J, job=f'{job}.{suffix}', base=job, prompt=p, refs=refs, out=out,
             purpose=f'D rest: re-roll {job} ({suffix}): {corr[:140]}')
    rp = os.path.join(PROD, 'jobs', 'rerolls.json')
    rr = json.load(open(rp)) if os.path.exists(rp) else []
    rr = [r for r in rr if r['job'] != R['job']] + [R]
    json.dump(rr, open(rp, 'w'), indent=1)
    print(R['job'], '->', os.path.basename(out))


if __name__ == '__main__':
    main()
