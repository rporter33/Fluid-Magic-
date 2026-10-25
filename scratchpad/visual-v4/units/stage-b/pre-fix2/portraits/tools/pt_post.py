# Stage B portraits: after a generation, measure the portrait (pt_checks), write the portrait files and the sidecar.
#   stage-b/portraits/<nation>/<unit>/<face><cand>-512.webp   master (512 px)
#                                     <face><cand>.webp       256 px (the size the game draws), at most 24 KB
#                                     <face><cand>-64.webp    64 px, at most 4 KB; for gods the card crop (plan 3.1)
#                                     <face><cand>.json       provenance as the leader sidecars, plus the checks, the
#                                                             named identity marks, the swatches and the card crop
#   stage-b/work/portraits/checks/<job>.json                  the measures and the failed gates
# Card crop (gods): head and upper body, proposed from the silhouette (a square of 0.46 of the body's height whose top
# sits just above the body's top, centred on the top band's mass); an override in work/portraits/cardcrops.json wins.
# Usage: python3 pt_post.py JOB [JOB ...] [--raw PATH --tag r2] [--out-root DIR]
import hashlib, io, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pt_checks as C  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..'))
SB = os.path.abspath(os.path.join(W, '..', '..'))
OUT = os.path.join(SB, 'portraits')
SCRATCH_UNITS = os.path.abspath(os.path.join(SB, '..'))


def _load(name):
    p = os.path.join(W, name)
    return json.load(open(p)) if os.path.exists(p) else {}


def webp_under(im, size, limit, box=None):
    if box is not None:
        im = im.crop(box)
    im = im.resize((size, size), Image.LANCZOS)
    b = None
    for q in (92, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35):
        b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6)
        if b.tell() <= limit:
            return b.getvalue(), q
    return b.getvalue(), q


def subject_mask(im512):
    a = np.asarray(im512).astype(np.float64)
    lab = C.to_lab(a)
    band = np.zeros(a.shape[:2], bool); band[:20] = True; band[:300, :16] = True; band[:300, -16:] = True
    blab = C.to_lab(np.median(a[band], 0)[None, None])[0, 0]
    m = np.sqrt(((lab - blab) ** 2).sum(-1)) > 9
    m = C._dilate(C._erode(m, 2), 2)
    return C._erode(C._dilate(m, 3), 3)


def card_crop(im512, override=None):
    """A square box (x0, y0, x1, y1) in 512 px master coordinates: head and upper body."""
    if override:
        return tuple(int(v) for v in override), 'override'
    m = subject_mask(im512)
    rows = np.nonzero(m[:, 32:480].mean(1) > 0.03)[0]
    if not rows.size:
        return (128, 0, 384, 256), 'default'
    top, low = rows.min(), rows.max()
    h = low - top + 1
    s = int(np.clip(0.46 * h, 150, 330))
    # resume (portraits): centre on the top 10% of the body (the head, crown or horns), not the top quarter, which on
    # winged bodies took in both wing tips and cut the Great Wyrm's head off at the crop's edge
    band = m[top:top + max(8, int(0.10 * h))]
    ys, xs = np.nonzero(band)
    cx = int(np.median(xs)) if xs.size else 256
    x0 = int(np.clip(cx - s // 2, 0, 512 - s))
    y0 = int(np.clip(top - 0.06 * s, 0, 512 - s))
    return (x0, y0, x0 + s, y0 + s), 'auto'


def post(job, raw=None, tag='', out_root=OUT, crops=None):
    raw = raw or job['out']
    side = json.load(open(raw.rsplit('.', 1)[0] + '.json'))
    im = Image.open(raw).convert('RGB')
    r = C.measure(raw, job['kind'], job['nation'] if job.get('tint') else None, job.get('flame', False))
    fails = C.verdict(r, job['kind'], job['nation'], job.get('tint', False))
    # resume (portraits): the art director's overrides of an automatic gate, by job (and tag), with the reason, from
    # work/portraits/ad-overrides.json; an overridden gate is kept in the sidecar under checks.overridden
    key = job['job'] + (f'.{tag}' if tag else '')
    ov = (_load('ad-overrides.json').get(key) or {})
    overridden = [dict(gate=f, reason=next(v for k, v in ov.items() if f.startswith(k)))
                  for f in fails if any(f.startswith(k) for k in ov)]
    fails = [f for f in fails if not any(f.startswith(k) for k in ov)]
    review = _load('ad-review.json').get(key)
    name = f"{job['face']}{job['cand']}" + (f'-{tag}' if tag else '')
    d = os.path.join(out_root, job['nation'], job['unit'])
    os.makedirs(d, exist_ok=True)
    m512, q512 = webp_under(im, 512, 200_000)
    m256, q256 = webp_under(im, 256, 24_000)
    im512 = im.resize((512, 512), Image.LANCZOS)
    crop, crop_src = (None, None)
    if job['kind'] == 'body':
        crop, crop_src = card_crop(im512, (crops or {}).get(job['job'] + (f'-{tag}' if tag else '')))
        m64, q64 = webp_under(im512, 64, 4_000, box=crop)
    else:
        m64, q64 = webp_under(im, 64, 4_000)
    files = {'master': f'{name}-512.webp', 'game': f'{name}.webp', 'small': f'{name}-64.webp'}
    for k, b in (('master', m512), ('game', m256), ('small', m64)):
        open(os.path.join(d, files[k]), 'wb').write(b)
    # resume (portraits): the prompt actually sent (from the generator's sidecar) is kept as its own file, because the
    # prompt builder was re-run after wave 1 and the files under prompts/ now hold the later wording
    used_dir = os.path.join(W, 'prompts-used')
    os.makedirs(used_dir, exist_ok=True)
    used_pf = os.path.join(used_dir, f"{job['job']}{('.' + tag) if tag else ''}.txt")
    open(used_pf, 'w').write(side.get('prompt') or '')
    meta = dict(
        id=f"{job['unit']}-{name}", unit=job['unit'], nation=job['nation'], group=job['group'],
        subject=job['unit'], promptFile=os.path.relpath(used_pf, SCRATCH_UNITS),
        kind=('god body portrait (plan 3.1: whole body, regal pose, variant 0, swatch 0)' if job['kind'] == 'body'
              else 'mount head-and-neck bust (plan 3.1)' if job['group'] == 'mounts'
              else 'creature bust (plan 3.1)'),
        face=job['face'], candidate=job['cand'] + (f'-{tag}' if tag else ''),
        files=files, bytes=dict(master=len(m512), game=len(m256), small=len(m64)),
        sourceFile=os.path.relpath(raw, SCRATCH_UNITS), sourceSha256=hashlib.sha256(open(raw, 'rb').read()).hexdigest(),
        tool='Gemini API (network secret)', model=side.get('model'), date=side.get('date'), prompt=side.get('prompt'),
        references=side.get('references'), route=job.get('route', 'new'),
        swatches=dict(material=job.get('swatch'), metal=job.get('metalSwatch'), accent=job.get('accentSwatch'))
        if job['kind'] == 'body' else None,
        variant0=job.get('variant0'), pose=job.get('pose'), tintZone=job.get('tintZone'),
        cardCrop=(dict(box512=list(crop), source=crop_src, note='head and upper body for the 64 px card')
                  if crop else None),
        identityMarks=[dict(mark=mk, read=None) for mk in job['marks']],
        checks=dict(measures=r, failed=fails, overridden=overridden, passed=not fails),
        approved=None)
    if review:  # the art director's judgement and identity-mark ticks (work/portraits/ad-review.json)
        meta['review'] = review
        ticks = review.get('marks') or {}
        for x in meta['identityMarks']:
            if x['mark'] in ticks:
                x['read'] = ticks[x['mark']]
    old = os.path.join(d, f'{name}.json')
    if os.path.exists(old) and not review:  # keep the art director's ticks across re-runs
        prev = json.load(open(old))
        ticks = {x['mark']: x.get('read') for x in prev.get('identityMarks', [])}
        for x in meta['identityMarks']:
            x['read'] = ticks.get(x['mark'])
        if prev.get('review'):
            meta['review'] = prev['review']
    json.dump(meta, open(old, 'w'), indent=1)
    os.makedirs(os.path.join(W, 'checks'), exist_ok=True)
    json.dump(dict(job=job['job'], tag=tag, measures=r, failed=fails, overridden=overridden), open(
        os.path.join(W, 'checks', f"{job['job']}{('.' + tag) if tag else ''}.json"), 'w'), indent=1)
    return meta


if __name__ == '__main__':
    a = sys.argv[1:]
    raw, tag, out_root = None, '', OUT
    for k in ('--raw', '--tag', '--out-root'):
        if k in a:
            i = a.index(k); v = a[i + 1]; del a[i:i + 2]
            raw, tag, out_root = (v, tag, out_root) if k == '--raw' else (raw, v, out_root) if k == '--tag' else (raw, tag, v)
    jobs = {j['job']: j for j in json.load(open(os.path.join(W, 'jobs.json')))}
    cf = os.path.join(W, 'cardcrops.json')
    crops = json.load(open(cf)) if os.path.exists(cf) else {}
    for jid in a:
        m = post(jobs[jid], raw, tag, out_root, crops)
        print(jid, 'PASS' if m['checks']['passed'] else 'FAIL', json.dumps(m['checks']['measures']), m['checks']['failed'])
