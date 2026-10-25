# Stage C creatures: the atlases and metadata, one atlas per figure family and tier (skills digest: one atlas per figure
# family, within budget), in the formats the battle mockup's bundler (stage-b/integrate/bundle.py) reads:
#   key-pose figures (Fire Sprite, Hornet Swarm, Wolf, Oakheart, Ash Rider, Wolf Rider) - the troop format:
#     <family>-<S|H>.<i>.png/.json (Pixi spritesheet: frames {frame, anchor, sourceSize}, meta {image, size, tier, keyline}),
#     <family>-<S|H>.var.json (the troop page's per-frame stencil data: body top and foot; no shield on creatures), and
#     figures/<figure>.json (views[view].atlas[tier] {prefix, scale, standPx, frames}, sheet, sha256, model, references,
#     status, failedGates, checks), plus frames/<figure>.<view>/ (the rim-fixed, hue-locked frames and the slicer JSON, the
#     input the bundler's mounted-look path packs with calpack.frames_of);
#   big bodies (Salamander 02-04, Treant 01-04, Giant 01-02) - the Salamander format: frames/<figure>.<view>/
#     <figure>.<view>.idle.png + .json (box, slicer and maquette anchors, height, heightWu), and baked tier cutouts on
#     <family>-<S|H>.<i>.png/.json with the keyline and the pre-baked silhouette shadow (bundle.py's Salamander recipe:
#     black, alpha 0.42, blurred 5 wu) as '<figure>.<view>.idle' and '<figure>.<view>.idle.shadow', and figures/<figure>.json
#     (heightWu, anchors, the snout point for the breath where the body has one, checks).
# Tier S keyline: the side's dark cloth at 75% for units with a side (stage B change 14); the neutral #1C1A17 at 60% for the
# wolf (either side) and the hornet (fix 1), and at tier H for all. Scale: the standing height of each body (design 3.2 and calibration 4.1):
# sprite 40/80 px, hornet 10/20, wolf 58/116 (its stand box against a man's at one rig scale), Oakheart 84/168 (size 2),
# Ash Rider 79/159 and Wolf Rider 74/148 (mounted: hood to hooves; fix 7), big bodies their true wu height from the guide.
# Usage: python3 cpack.py   (reads ../../picks.json)
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pack  # noqa: E402
import checks  # noqa: E402
from ad_measures import tinted_keyline  # noqa: E402
from tr_pack import body_top  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS_DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
OUT = os.path.join(UNITS_DIR, 'stage-c', 'atlas', 'creatures')
SHADE = {'cinderHorde': '#7E3118', 'thornwood': '#113F2F'}
NEUTRAL = checks.keyline
# stage C fix 7 (art director's critique): the Wolf Rider at the art plan's 74/148 px (8.4: 37 wu, hood to paws), so its
# War Wolf is as big as the summoned Wolf and the rider 1.14x a foot man (was 65/131: the wolf smaller than a Wolf)
STAND_PX = {'sprite': (40, 80), 'hornet': (10, 20), 'beast': (58, 116), 'large': (84, 168), 'cavalry': (79, 159), 'wolfrider': (74, 148)}
# stage C fix 1: the Hornet Swarm takes the neutral keyline (around a 10 px hornet the side's 1 px keyline was the figure
# and read teal at play zoom); its side is carried by its banner and its place
SIDE_KEYLINE = {'fireSprite': 'cinderHorde', 'oakheart': 'thornwood', 'ashRider': 'cinderHorde', 'wolfRider': 'thornwood'}
WU_PER_PX = {'S': 0.5, 'H': 0.25}
BY = {u['id']: u for u in pack.UNITS['units']}


def rel(p):
    return os.path.relpath(p, UNITS_DIR)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def frames_of(sdir, fig, view, tier):
    """pack.frames_of with each body's measure: mounted bodies hood to hooves, the wolf its stand box, the rest the
    opened body height (a raised weapon stops counting). An alternate view key (frontKept) reads its own view's frames
    and names them by the key."""
    vname = 'front' if view == 'frontKept' else view
    meta = json.load(open(os.path.join(sdir, f'{fig}.{vname}.json')))
    u = BY[fig]
    target = STAND_PX[u['body']][0 if tier == 'S' else 1]
    st = next(f for f in meta['frames'] if f['name'] in ('stand', 'wingMid', 'up0') and not f.get('missing'))
    m = np.asarray(Image.open(os.path.join(sdir, st['file'])).convert('RGBA'))[..., 3] > 0.35 * 255
    if u['body'] in ('cavalry', 'wolfrider'):
        bh = pack.mounted_height(m)
    elif u['body'] in ('beast', 'hornet'):
        ys, _ = np.nonzero(m); bh = int(ys.max() - ys.min() + 1)
    else:
        bh = pack.body_height(m)
    k = target / bh
    out = []
    pad = 1 if tier == 'S' else 2
    for f in meta['frames']:
        if f.get('missing') and f['name'] not in ('burstB', 'mark'):
            continue
        if not f.get('file') or not os.path.exists(os.path.join(sdir, f['file'])):
            continue
        rgba = np.asarray(Image.open(os.path.join(sdir, f['file'])).convert('RGBA')).astype(np.float64)
        s = pack.premul_resize(rgba, k)
        for _ in range(pad):
            s = pack.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
        ax, ay = f['anchor'][0] * k + pad, f['anchor'][1] * k + pad
        name = f'{fig}.{view}.{f["name"]}'
        out.append((name, s, (ax, ay)))
        if f['name'] in ('stand', 'recoil', 'wingMid', 'up0'):
            wht = s.copy(); wht[..., :3] = 255
            out.append((name + '.white', wht, (ax, ay)))
    return out, dict(scale=round(k, 4), standPx=target, bodyHeightSrc=int(bh))


def write_pages(prefix, items, tier, keyline_label):
    pages, placed = pack.pack(items)
    names = []
    for i, pg in enumerate(pages):
        rows = np.nonzero(pg[..., 3].max(1) > 0)[0]
        h = 1 << (int(rows.max() + 1) - 1).bit_length()
        Image.fromarray(np.clip(pg[:h], 0, 255).astype(np.uint8), 'RGBA').save(f'{prefix}.{i}.png')
        sheet = dict(frames={n: {k: v for k, v in d.items() if k != 'page'} for n, d in placed.items() if d['page'] == i},
                     meta=dict(image=os.path.basename(f'{prefix}.{i}.png'), size=dict(w=pack.PAGE, h=h), scale=1, tier=tier,
                               keyline=keyline_label, app='stage-c/work/creatures/sbx/tools/cpack.py'))
        json.dump(sheet, open(f'{prefix}.{i}.json', 'w'), indent=1)
        names.append(os.path.basename(f'{prefix}.{i}.png'))
    return pages, placed, names


def pack_grid(fam, figs, picks, summary):
    """One family (one figure here) of key-pose sheets, both tiers."""
    meta_all = {}
    for tier in ('S', 'H'):
        items, info = [], {}
        nat = SIDE_KEYLINE.get(fam)
        pack.keyline = tinted_keyline(SHADE[nat]) if (tier == 'S' and nat) else NEUTRAL
        for fig in figs:
            for view, p in picks[fig].items():
                fr, inf = frames_of(p['dir'], fig, view, tier)
                items += fr
                info[(fig, view)] = dict(inf, frames=[n for n, _, _ in fr])
        pack.keyline = NEUTRAL
        prefix = os.path.join(OUT, f'{fam}-{tier}')
        pages, placed, names = write_pages(prefix, items, tier, ('side ' + SHADE[nat] + ' 75%') if (tier == 'S' and nat) else 'neutral #1C1A17 60%')
        imgs = {n: im for n, im, _ in items}
        var = {}
        for n, d in placed.items():
            if n.endswith('.white'):
                continue
            img = imgs[n]
            var[n] = dict(page=d['page'], body=[round(body_top(img) / img.shape[0], 4), d['anchor']['y']], shield=None)
        json.dump(dict(cloth=pack.UNITS['nations'][BY[figs[0]]['nation']]['cloth']['hex'], nation=BY[figs[0]]['nation'], tier=tier,
                       frames=var, note='creatures: no shield stencil and no tint variation (they match their portraits)'),
                  open(f'{prefix}.var.json', 'w'), indent=1)
        for (fig, view), inf in info.items():
            meta_all.setdefault(fig, {}).setdefault(view, {})[tier] = dict(prefix=f'{fam}-{tier}', **inf)
        summary[f'{fam}.{tier}'] = dict(frames=len(placed), pages=[f'{n} {pg.shape[1]}x{1 << (int(np.nonzero(pg[..., 3].max(1) > 0)[0].max() + 1) - 1).bit_length()}'
                                                                  for n, pg in zip(names, pages)])
    for fig in figs:
        u = BY[fig]
        m = dict(figure=fig, unit=u['unit'], nation=u['nation'], key=u['key'], layout=u['layout'], body=u['body'],
                 cloth=pack.UNITS['nations'][u['nation']]['cloth']['hex'] if fig in SIDE_KEYLINE and fig not in ('fireSprite', 'hornetSwarm') else None,
                 hueLocked=fig in ('oakheart', 'wolfRider'), portrait=rel(u['portrait']) if u.get('portrait') else None, kit=u.get('kit'),
                 views={}, approved=None)
        for view, p in picks[fig].items():
            d = os.path.join(W, 'sheets', p['job'])
            r = json.load(open(os.path.join(p['dir'], 'checks.final.json')))
            raw = json.load(open(os.path.join(d, 'key.json')))['file']
            side = json.load(open(raw.rsplit('.', 1)[0] + '.json')) if os.path.exists(raw.rsplit('.', 1)[0] + '.json') else {}
            fdst = os.path.join(OUT, 'frames', f'{fig}.{view}')
            if os.path.exists(fdst):
                shutil.rmtree(fdst)
            shutil.copytree(p['dir'], fdst, ignore=shutil.ignore_patterns('checks.final.json'))
            m['views'][view] = dict(
                atlas=meta_all[fig][view], frames=f'frames/{fig}.{view}/', sheet=rel(raw), sha256=sha(raw), model=side.get('model'),
                job=p['job'], route=side.get('route'), references=[rel(x) if x.startswith(UNITS_DIR) else x for x in side.get('referencePaths', [])],
                status=p['status'], failedGates=p.get('failed', []), note=p.get('note'), keycast=p.get('keycast'),
                otherAttempts=p.get('others'), checks=dict(cameraCells=r['cameraGate']['follow'], cameraFailing=r['cameraGate']['failing'],
                            cells=r['cameraAll']['cells'], variety=r['variety2'], scale=r['scaleBody'],
                            consistency={k: v for k, v in r['consistency'].items() if k != 'lying'}, rim=r['rim'], side=r['side'],
                            fringe=r['fringe'], gates=r['gates']),
                identity=p.get('identity'))
        json.dump(m, open(os.path.join(OUT, 'figures', f'{fig}.json'), 'w'), indent=1)


def shadow_of(im, tier):
    bl = int(round(5 / WU_PER_PX[tier]))
    a = Image.fromarray(np.asarray(im)[..., 3]).convert('L')
    P = bl * 3
    big = Image.new('L', (im.width + 2 * P, im.height + 2 * P), 0); big.paste(a, (P, P))
    big = big.filter(ImageFilter.GaussianBlur(bl / 2))
    sh = Image.new('RGBA', big.size, (0, 0, 0, 0)); sh.putalpha(big.point(lambda q: int(q * 0.42)))
    return sh, P


def snout(png, view):
    """The tip of the head along the facing direction (back: up-right, front: down-left), in the cutout's px: the breath's
    origin for stage D (auto; bundle.py looked the face 01 point up by eye)."""
    a = np.asarray(Image.open(png).convert('RGBA'))[..., 3] > 128
    ys, xs = np.nonzero(a)
    d = (xs - ys) if view == 'back' else (ys - xs)
    i = int(np.argmax(d))
    return [int(xs[i]), int(ys[i])]


def pack_big(fam, figs, picks, summary):
    per = {}
    for tier in ('S', 'H'):
        items = []
        pack.keyline = NEUTRAL
        for fig in figs:
            for view, p in picks[fig].items():
                png = os.path.join(p['dir'], f'{fig}.{view}.idle.png')
                meta = json.load(open(png.rsplit('.', 1)[0] + '.json'))
                k = meta['heightWu'] / WU_PER_PX[tier] / meta['height']
                rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
                s = pack.premul_resize(rgba, k)
                pad = 1 if tier == 'S' else 2
                for _ in range(pad):
                    s = checks.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
                im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
                sh, P = shadow_of(im, tier)
                ax, ay = meta['anchor'][0] * k + pad, meta['anchor'][1] * k + pad
                name = f'{fig}.{view}.idle'
                items.append((name, s, (ax, ay)))
                items.append((name + '.shadow', np.asarray(sh).astype(np.float64), (ax + P, ay + P)))
                sn = snout(png, view) if BY[fig]['body'] == 'salamander' else None
                per.setdefault(fig, {}).setdefault(view, dict(src=meta, png=png, job=p['job'], status=p['status'],
                                                             failed=p.get('failed', []), identity=p.get('identity'), note=p.get('note'),
                                                             snout=sn, others=p.get('others'), keycast=p.get('keycast')))[tier] = dict(
                    prefix=f'{fam}-{tier}', frame=name, shadow=name + '.shadow', scale=round(k, 4), w=im.width, h=im.height,
                    mouthWu=[round((sn[0] * k + pad - ax) * WU_PER_PX[tier], 1), round((sn[1] * k + pad - ay) * WU_PER_PX[tier], 1)] if sn else None)
        prefix = os.path.join(OUT, f'{fam}-{tier}')
        pages, placed, names = write_pages(prefix, items, tier, 'neutral #1C1A17 60%; shadows black 42% blurred 5 wu')
        summary[f'{fam}.{tier}'] = dict(frames=len(placed), pages=names)
    for fig, views in per.items():
        u = BY[fig]
        m = dict(figure=fig, unit=u['unit'], face=u.get('face'), nation=u['nation'], key=u['key'], body=u['body'],
                 portrait=rel(u['portrait']) if u['portrait'].startswith(UNITS_DIR) else u['portrait'], views={}, approved=None,
                 note='standing only (owner review 2); the cutout is a Sprite in stage C, a MeshPlane in stage D (plan 5.3)')
        for view, v in views.items():
            d = os.path.join(W, 'sheets', v['job'])
            r = json.load(open(os.path.join(os.path.dirname(v['png']), 'checks.final.json')))
            raw = json.load(open(os.path.join(d, 'key.json')))['file']
            side = json.load(open(raw.rsplit('.', 1)[0] + '.json')) if os.path.exists(raw.rsplit('.', 1)[0] + '.json') else {}
            fdst = os.path.join(OUT, 'frames', f'{fig}.{view}')
            os.makedirs(fdst, exist_ok=True)
            shutil.copyfile(v['png'], os.path.join(fdst, os.path.basename(v['png'])))
            json.dump(v['src'], open(os.path.join(fdst, os.path.basename(v['png']).rsplit('.', 1)[0] + '.json'), 'w'), indent=1)
            m['views'][view] = dict(idle=f'frames/{fig}.{view}/{os.path.basename(v["png"])}', heightWu=v['src']['heightWu'],
                                    anchorPx=v['src']['anchor'], anchorFrom=v['src'].get('anchorFrom'), snoutPx=v['snout'],
                                    atlas={t: v[t] for t in ('S', 'H')}, sheet=rel(raw), sha256=sha(raw), model=side.get('model'),
                                    job=v['job'], route=side.get('route'), imageSize=side.get('imageSize'),
                                    references=[rel(x) if x.startswith(UNITS_DIR) else x for x in side.get('referencePaths', [])],
                                    status=v['status'], failedGates=v['failed'], note=v['note'], keycast=v['keycast'],
                                    otherAttempts=v['others'], checks=dict(camera=r['camera'], identityColour=r['identity'], value=r['value'], rim=r['rim'],
                                                fringe=r['fringe'], gates=r['gates'], srcPx=r['srcPx'], oversampleAtH=r['oversampleAtH']),
                                    identity=v['identity'])
        json.dump(m, open(os.path.join(OUT, 'figures', f'{fig}.json'), 'w'), indent=1)


def main():
    picks = json.load(open(os.path.join(W, 'picks.json')))['figures']
    os.makedirs(os.path.join(OUT, 'figures'), exist_ok=True)
    summary = {}
    for fam, figs in (('fireSprite', ['fireSprite']), ('hornetSwarm', ['hornetSwarm']), ('wolf', ['wolf']), ('oakheart', ['oakheart']),
                      ('ashRider', ['ashRider']), ('wolfRider', ['wolfRider'])):
        figs = [f for f in figs if f in picks]
        if figs:
            pack_grid(fam, figs, picks, summary)
    for fam, figs in (('salamander', ['salamander-02', 'salamander-03', 'salamander-04']),
                      ('treant', ['treant-01', 'treant-02', 'treant-03', 'treant-04']), ('giant', ['giant-01', 'giant-02'])):
        figs = [f for f in figs if f in picks]
        if figs:
            pack_big(fam, figs, picks, summary)
    tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith('.png'))
    summary['_bytesPng'] = tot
    json.dump(summary, open(os.path.join(OUT, 'pack-summary.json'), 'w'), indent=1)
    write_index()
    print(json.dumps(summary, indent=1))


def write_index():
    """Stage C fix 3: index.json is written from figures/*.json on every pack (status, failed gates and job per view), so
    the lineup's and the bundle's flags can never go stale against the shipped re-rolls."""
    p = os.path.join(OUT, 'index.json')
    idx = json.load(open(p)) if os.path.exists(p) else {}
    figs = {}
    for f in sorted(os.listdir(os.path.join(OUT, 'figures'))):
        if f.endswith('.json'):
            m = json.load(open(os.path.join(OUT, 'figures', f)))
            figs[m['figure']] = {v: dict(status=x['status'], failed=list(x.get('failedGates') or []), job=x.get('job'))
                                 for v, x in m['views'].items()}
    fams = {}
    for f in sorted(os.listdir(OUT)):
        if f.endswith('.0.png'):
            fam, tier = f[:-6].rsplit('-', 1)
            fams.setdefault(fam, {})[tier] = f
    idx.update(families=fams, figures=figs, writtenBy='cpack.py write_index() from figures/*.json (stage C fix 3)')
    json.dump(idx, open(p, 'w'), indent=1)


if __name__ == '__main__':
    main()
