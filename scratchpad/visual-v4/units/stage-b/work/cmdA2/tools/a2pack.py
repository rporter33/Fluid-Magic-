# Stage B, key "cmdA2": cmdA's packer (cmda_pack.py helpers, imported unchanged) with two changes:
#   - scale per pick from the body sheet THAT sheet was painted on (the scout backs now ride the levy back body, the new
#     caster backs the re-made caster back body; cmda_pack took one body per kind and view, which packed the morning's
#     scout backs about 1.35x too tall);
#   - the figure sidecars keep what later passes added (productionKit, approvals) and record this run's fields per view:
#     pass (the summary's, eye review included), dir, ownKit, keyer, body.
# Usage: python3 a2pack.py
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import a2cfg as C  # noqa: E402
import cmda_pack as K  # noqa: E402
import cmda  # noqa: E402
import pack  # noqa: E402
from cmda_faces import FACES, GROUPS  # noqa: E402

W = C.WA
BODIES = json.load(open(os.path.join(W, 'bodies.json')))
RAW2DIR = {b['raw']: os.path.join(W, b['frames']) for b in BODIES.values()}
RAW2DIR[C.CASTER_BACK_R2] = os.path.join(C.CASTER_BACK_R2_DIR, 'frames')
RAW2DIR[C.CASTER_BACK_FALLBACK] = os.path.join(C.CASTER_BACK_FALLBACK_DIR, 'frames')


def body_of(face, view, p):
    raw = p.get('body') or BODIES[f'{cmda.kind_of(face, view)}.{view}']['raw']
    if not p.get('body') and p['dir'].endswith(f'{face}.{view}') is False:
        pass
    return raw


def scales(P):
    out = {}
    for key, p in P.items():
        if not p:
            continue
        face, view = key.split('.')
        if face == 'ac06' and view == 'front':
            fd = os.path.join(p['dir'], 'frames'); out[key] = dict(bodyH=K.stand_body_h(fd, K.meta_of(p['dir'])), from_='own stand (pilot sheet)')
            continue
        raw = body_of(face, view, p)
        bd = RAW2DIR[raw]
        js = [f for f in os.listdir(bd) if f.endswith('.json')]
        bm = json.load(open(os.path.join(bd, js[0])))
        out[key] = dict(bodyH=K.stand_body_h(bd, bm), from_='body ' + os.path.basename(raw))
    json.dump(out, open(os.path.join(W, 'scales.json'), 'w'), indent=1)
    return out


def main():
    os.makedirs(os.path.join(K.ATLAS, 'figures'), exist_ok=True)
    P = json.load(open(os.path.join(W, 'picks.json')))
    S = scales(P)
    summ = json.load(open(os.path.join(W, 'summary.json')))
    kits = json.load(open(os.path.join(W, 'kits.json')))
    figs, report = {}, {}
    for unit, faces in GROUPS.items():
        nat = FACES[faces[0]][1]
        for tier in ('S', 'H'):
            pack.keyline = K.tinted_keyline(K.SHADE[nat]) if tier == 'S' else K.NEUTRAL
            items = []
            for f in faces:
                for v in ('front', 'back'):
                    p = P.get(f'{f}.{v}')
                    if not p:
                        continue
                    fr, info, k = K.frames_for(f, v, p, tier, S[f'{f}.{v}']['bodyH'])
                    items += fr
                    e = figs.setdefault(f, {}).setdefault(v, dict(frames=info, scale={}))
                    e['scale'][tier] = k
            pages, placed = pack.pack(items)
            for i, pg in enumerate(pages):
                rows = np.nonzero(pg[..., 3].max(1) > 0)[0]
                h = 1 << (int(rows.max() + 1) - 1).bit_length()
                img = f'{unit}.{tier}.{i}.png'
                Image.fromarray(np.clip(pg[:h], 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(K.ATLAS, img))
                sheet = dict(frames={n: {kk: vv for kk, vv in dd.items() if kk != 'page'} for n, dd in placed.items() if dd['page'] == i},
                             meta=dict(image=img, size=dict(w=pack.PAGE, h=h), scale=1, tier=tier,
                                       keyline=('side ' + K.SHADE[nat] + ' 75%') if tier == 'S' else 'neutral #1C1A17 60%',
                                       app='stage-b/work/cmdA2/tools/a2pack.py (cmda_pack.py helpers)'))
                json.dump(sheet, open(os.path.join(K.ATLAS, f'{unit}.{tier}.{i}.json'), 'w'), indent=1)
                for n, dd in placed.items():
                    if dd['page'] == i:
                        dd['atlas'] = img
            # a page left over from a bigger earlier pack would be stale: remove it
            j = len(pages)
            while os.path.exists(os.path.join(K.ATLAS, f'{unit}.{tier}.{j}.png')):
                os.remove(os.path.join(K.ATLAS, f'{unit}.{tier}.{j}.png'))
                if os.path.exists(os.path.join(K.ATLAS, f'{unit}.{tier}.{j}.json')):
                    os.remove(os.path.join(K.ATLAS, f'{unit}.{tier}.{j}.json'))
                j += 1
            report[f'{unit}.{tier}'] = dict(frames=len(placed), pages=len(pages))
            for f in faces:
                for v in ('front', 'back'):
                    e = figs.get(f, {}).get(v)
                    if not e:
                        continue
                    for pose, fi in e['frames'].items():
                        if 'frame' in fi:
                            fi.setdefault('atlas', {})[tier] = placed[fi['frame']]['atlas']
                            fi.setdefault('anchor', {})[tier] = placed[fi['frame']]['anchor']
    pack.keyline = K.NEUTRAL
    for f, views in figs.items():
        kind, nat, unit, num, sex, marks = FACES[f]
        rk = cmda.kind_of(f, 'front')
        path = os.path.join(K.ATLAS, 'figures', f'{unit}-{num}.json')
        old = json.load(open(path)) if os.path.exists(path) else {}
        doc = dict(figure=f'{unit}-{num}', unit=unit, face=num, nation=nat, body=rk, layout='commander', act=K.ACT[rk],
                   heightPx=K.TARGET, task='stage B cmdA (+ cmdA2 fixes and own kits)', views={},
                   marks=[dict(mark=m, seenFromBehind=b) for m, b in marks], marksTicked=old.get('marksTicked'),
                   approved=old.get('approved'))
        for kk, vv in old.items():
            if kk not in doc and kk != 'views':
                doc[kk] = vv
        for v, e in views.items():
            p = P[f'{f}.{v}']
            r = summ[f'{f}.{v}']
            body = None if (f == 'ac06' and v == 'front') else body_of(f, v, p)
            ov = (old.get('views') or {}).get(v) or {}
            doc['views'][v] = dict(sheet=os.path.relpath(p['sheet'], cmda.UNITS_DIR), sheetSha256=K.sha(p['sheet']),
                                   body=body and os.path.relpath(body, cmda.UNITS_DIR), bodySha256=body and K.sha(body),
                                   key=json.load(open(os.path.join(p['dir'], 'key.json')))['key'],
                                   keyer=r.get('keyer'), dir=os.path.basename(p['dir']), ownKit=bool(p.get('ownKit')),
                                   layout='melee (pilot sheet)' if (f == 'ac06' and v == 'front') else 'commander',
                                   scale=e['scale'], scaleFrom=S[f'{f}.{v}'], frames=e['frames'], checks=r, **{'pass': bool(r['pass_'])})
            if ov.get('scaleNote') and ov.get('sheet') == doc['views'][v]['sheet']:
                doc['views'][v]['scaleNote'] = ov['scaleNote']
        if f in C.OWN_KIT and 'productionKit' in doc:
            doc['productionKit']['appliedIn'] = sorted(v for v in views if P[f'{f}.{v}'].get('ownKit'))
        json.dump(doc, open(path, 'w'), indent=1)
    json.dump(report, open(os.path.join(K.ATLAS, 'atlas-report.json'), 'w'), indent=1)
    print(json.dumps(report))


if __name__ == '__main__':
    main()
