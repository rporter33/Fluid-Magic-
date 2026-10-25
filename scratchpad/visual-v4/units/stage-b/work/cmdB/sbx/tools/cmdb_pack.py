# Stage B, key "cmdB": atlases and per-figure metadata for the picked commander sheets.
#   scale: one per face and view. A re-dress keeps each figure's size in its cell, so it is scaled by its BODY sheet's
#     stand body height (pack.body_height: the 5% opening drops a raised haft) -> the commander's standing height
#     (units.json heightPx.commander: tier S 64 px, tier H 128 px). A tall cowl, horns or antlers then stand above the
#     man instead of shrinking him (calibration 1.3). The pilot's Ash Chieftain 06 (a re-dress of the troop sheet) is
#     scaled by its own stand body.
#   keyline: tier S in the side's dark cloth shade at 75% (pilot-review change 14: Cinder #7E3118; independents
#     #5C5A54, their undyed grey cloth's dark shade), tier H the design's neutral #1C1A17 at 60%.
#   white silhouettes of stand and recoil (the hit flash), shelf packing into 2048 px pages (pack.py), one Pixi
#     spritesheet JSON per page; frames are named <unit>-<NN>.<view>.<pose>.
#   per figure: atlas/cmdB/figures/<unit>-<NN>.json: unit, face, nation, kind (body), layout, key per view, act, frames
#     by pose with anchors and source boxes, scale per view and tier, the raw sheet and body sheet with their sha256,
#     the checks, the identity marks, and the approval (null until the owner's review).
# Usage: python3 cmda_pack.py scales | pack
import hashlib, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pack  # noqa: E402
import checks  # noqa: E402
from ad_measures import tinted_keyline  # noqa: E402
import cmdb as cmda  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402

W = cmda.W
ATLAS = os.path.join(cmda.STAGEB, 'atlas', 'cmdB')
SHADE = {'cinderHorde': '#7E3118', 'thornwood': '#113F2F', 'independent': '#5C5A54'}
NEUTRAL = checks.keyline
TARGET = {'S': 64, 'H': 128}
ACT = {'twChief': 'rally', 'twScout': 'rally', 'twDruid': 'cast', 'cmdLevy': 'rally'}


def meta_of(d):
    js = [f for f in os.listdir(os.path.join(d, 'frames')) if f.endswith('.json')]
    return json.load(open(os.path.join(d, 'frames', js[0])))


def stand_body_h(frames_dir, meta):
    st = next(f for f in meta['frames'] if f['name'] == 'stand' and not f.get('missing'))
    m = np.asarray(Image.open(os.path.join(frames_dir, st['file'])).convert('RGBA'))[..., 3] > 0.35 * 255
    return pack.body_height(m)


def scales():
    P = json.load(open(os.path.join(W, 'picks.json')))
    B = json.load(open(os.path.join(W, 'bodies.json')))
    out = {}
    for key, p in P.items():
        if not p:
            continue
        face, view = key.split('.')
        if face == 'ac06' and view == 'front':
            fd = os.path.join(p['dir'], 'frames'); out[key] = dict(bodyH=stand_body_h(fd, meta_of(p['dir'])), from_='own stand (pilot sheet)')
            continue
        kind = cmda.kind_of(face, view)
        b = B[f'{kind}.{view}']
        bd = os.path.join(W, b['frames'])
        bm = json.load(open(os.path.join(bd, f'{kind}.{view}.json')))
        out[key] = dict(bodyH=stand_body_h(bd, bm), from_=f'body {kind}.{view}')
    json.dump(out, open(os.path.join(W, 'scales.json'), 'w'), indent=1)
    print(len(out), 'scales')


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def frames_for(face, view, p, tier, bodyH):
    _k, nat, unit, num, sex, marks = FACES[face]
    d = p['dir']; m = meta_of(d); fd = os.path.join(d, 'frames')
    k = TARGET[tier] / bodyH
    pad = 1 if tier == 'S' else 2
    out, info = [], {}
    name0 = f'{unit}-{num}'
    rename = {'brace': None, 'dropped': None}  # the pilot AC06 sheet is the melee layout: these cells are not a leader's
    for f in m['frames']:
        if f.get('missing') or rename.get(f['name'], 1) is None:
            continue
        rgba = np.asarray(Image.open(os.path.join(fd, f['file'])).convert('RGBA')).astype(np.float64)
        s = pack.premul_resize(rgba, k)
        for _ in range(pad):
            s = pack.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
        ax, ay = f['anchor'][0] * k + pad, f['anchor'][1] * k + pad
        n = f'{name0}.{view}.{f["name"]}'
        out.append((n, s, (ax, ay)))
        info[f['name']] = dict(frame=n, srcBox=f.get('box'), srcAnchor=f['anchor'])
        if f['name'] in ('stand', 'recoil'):
            wht = s.copy(); wht[..., :3] = 255
            out.append((n + '.white', wht, (ax, ay)))
    if face == 'ac06' and view == 'front':  # no rally cells on the melee layout: the game maps actA <- cheer, actB <- strike
        info['actA'] = dict(alias='cheer'); info['actB'] = dict(alias='strike')
    return out, info, round(k, 5)


def pack_all():
    os.makedirs(os.path.join(ATLAS, 'figures'), exist_ok=True)
    P = json.load(open(os.path.join(W, 'picks.json')))
    S = json.load(open(os.path.join(W, 'scales.json')))
    B = json.load(open(os.path.join(W, 'bodies.json')))
    figs = {}
    report = {}
    for unit, faces in GROUPS.items():
        nat = FACES[faces[0]][1]
        for tier in ('S', 'H'):
            pack.keyline = tinted_keyline(SHADE[nat]) if tier == 'S' else NEUTRAL
            items = []
            for f in faces:
                for v in ('front', 'back'):
                    p = P.get(f'{f}.{v}')
                    if not p:
                        continue
                    fr, info, k = frames_for(f, v, p, tier, S[f'{f}.{v}']['bodyH'])
                    items += fr
                    e = figs.setdefault(f, {}).setdefault(v, dict(frames=info, scale={}))
                    e['scale'][tier] = k
            pages, placed = pack.pack(items)
            for i, pg in enumerate(pages):
                rows = np.nonzero(pg[..., 3].max(1) > 0)[0]
                h = 1 << (int(rows.max() + 1) - 1).bit_length()
                img = f'{unit}.{tier}.{i}.png'
                Image.fromarray(np.clip(pg[:h], 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(ATLAS, img))
                sheet = dict(frames={n: {kk: vv for kk, vv in dd.items() if kk != 'page'} for n, dd in placed.items() if dd['page'] == i},
                             meta=dict(image=img, size=dict(w=pack.PAGE, h=h), scale=1, tier=tier,
                                       keyline=('side ' + SHADE[nat] + ' 75%') if tier == 'S' else 'neutral #1C1A17 60%',
                                       app='stage-b/work/cmdB/sbx/tools/cmdb_pack.py'))
                json.dump(sheet, open(os.path.join(ATLAS, f'{unit}.{tier}.{i}.json'), 'w'), indent=1)
                for n, dd in placed.items():
                    if dd['page'] == i:
                        dd['atlas'] = img
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
    pack.keyline = NEUTRAL
    summ = json.load(open(os.path.join(W, 'summary.json')))
    for f, views in figs.items():
        kind, nat, unit, num, sex, marks = FACES[f]
        rk = cmda.kind_of(f, 'front')
        doc = dict(figure=f'{unit}-{num}', unit=unit, face=num, nation=nat, body=rk if f != 'ac06' else rk,
                   layout='commander', act=ACT[rk], heightPx=TARGET, task='stage B cmdB', views={},
                   marks=[dict(mark=m, seenFromBehind=b) for m, b in marks], marksTicked=None, approved=None)
        for v, e in views.items():
            p = P[f'{f}.{v}']
            r = summ[f'{f}.{v}']
            body = None if (f == 'ac06' and v == 'front') else B[f'{cmda.kind_of(f, v)}.{v}']['raw']
            doc['views'][v] = dict(sheet=os.path.relpath(p['sheet'], cmda.UNITS_DIR), sheetSha256=sha(p['sheet']),
                                   body=body and os.path.relpath(body, cmda.UNITS_DIR), bodySha256=body and sha(body),
                                   key=json.load(open(os.path.join(p['dir'], 'key.json')))['key'],
                                   layout='melee (pilot sheet)' if (f == 'ac06' and v == 'front') else 'commander',
                                   scale=e['scale'], scaleFrom=S[f'{f}.{v}'], frames=e['frames'], checks=r,
                                   status='pass' if r and r.get('pass_') else 'reported',
                                   failedGates=sorted(k for k, x in ((r or {}).get('gate') or {}).items() if x is False),
                                   rolls=p.get('rolls'))
            for extra in ('keycast', 'huelock'):  # resumed run: the Thornwood post-passes, as measured on this sheet
                ep = os.path.join(p['dir'], extra + '.json')
                if os.path.exists(ep):
                    x = json.load(open(ep))
                    if extra == 'keycast':
                        doc['views'][v]['keyCast'] = dict(tool='units/tools/keycast.py (sandbox copy)', **x)
                    else:
                        doc['views'][v]['hueLock'] = dict(x, note='measured, not shipped: on commanders it turns the '
                                                          'portrait greens turquoise (cmdB resumed run)')
        from cmd_kits import kit  # critique fix 11: the face's own production kit, as its prompts named it
        doc['productionKit'] = kit(f, marks)
        doc['productionKit'].pop('face', None)
        json.dump(doc, open(os.path.join(ATLAS, 'figures', f'{unit}-{num}.json'), 'w'), indent=1)
    json.dump(report, open(os.path.join(ATLAS, 'atlas-report.json'), 'w'), indent=1)
    print(json.dumps(report))


if __name__ == '__main__':
    {'scales': scales, 'pack': pack_all}[sys.argv[1]]()
