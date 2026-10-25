# Rest of stage D: packs the accepted action cutouts of every big body into tier S and H atlases with the per-figure
# metadata of art plan 8.5, in the stage C big-body format (stage-c/work/creatures/sbx/tools/cpack.py pack_big):
#   atlas/actions/<family>-<S|H>.<i>.png/.json   Pixi spritesheets (frames {frame, anchor, sourceSize}); per figure, view
#       and action: '<figure>.<view>.<action>' (premultiplied Lanczos downscale to the tier: S 0.5 wu/px, H 0.25 wu/px;
#       the neutral keyline #1C1A17 60%, 1 px at S and 2 px at H), '<...>.shadow' (black 42%, blurred 5 wu: the bundler's
#       big-body shadow; stored at half the tier's resolution, drawn at scale 2), and the one-frame hit flash '<...>.white' for the idle and the hit;
#   atlas/actions/figures/<figure>.json          views -> actions -> frame names per tier, scale, anchor (px and
#       normalised), heightWu, kind (standing, lying, airborne), the rig anchors as wu offsets from the ground anchor
#       (weaponTip, mouth = breath origin, feet = stomps, hands), source raw + sha256, model, guide, checks, flags, approval;
#       the idle's own anchors and weights with a pointer to its stage C texture (not repacked); the code-only actions
#   atlas/actions/figures/<figure>.weights.json  mesh region weights per view and action (incl. idle): 24 x 16 vertices
#       (row-major, 16 rows of 24) over the frame's texture rectangle, per body part, summing to 1 per vertex
#   atlas/actions/index.json                     families, pages, sizes, frame counts, texture pixels per family and tier
# Thornwood palettes of the generic gods use their tinted frames (dd_tint.py) with the Cinder frame's geometry.
# Usage: python3 -I dd_pack.py [FAMILY ...]   (no family: everything)
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
PROD = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(PROD, '..'))
UNITS = os.path.abspath(os.path.join(STAGE, '..'))
CT = os.path.join(UNITS, 'stage-c', 'work', 'creatures', 'sbx', 'tools')
sys.path.insert(0, CT)
import cpack  # noqa: E402  (write_pages, shadow_of; puts the sandbox's pack and checks on the path)
import pack as cpk  # noqa: E402
import checks as cck  # noqa: E402
import dd_jobs  # noqa: E402
import dd_final  # noqa: E402  (the shipped scale, the ground fix, the top fade)
sys.path.insert(0, os.path.join(UNITS, 'stage-c', 'work', 'gods', 'tools'))
import gd_post  # noqa: E402  (the rim check)
import ad_rimfix  # noqa: E402  (the art director's rim fix, pilot-review change 4)

OUT = os.path.join(STAGE, 'atlas', 'actions')
CUT = os.path.join(PROD, 'cut')
WPP = {'S': 0.5, 'H': 0.25}
FAMILIES = {
    'salamander': ['salamander-01', 'salamander-02', 'salamander-03', 'salamander-04'],
    'treant': ['treant-01', 'treant-02', 'treant-03', 'treant-04'],
    'giant': ['giant-01', 'giant-02'],
}
for g in ('titan', 'oracle', 'ascendedHero', 'greatWyrm', 'primordial', 'livingMonolith'):
    # a god's two palettes on their own pages (a battle loads only the side's palette; as stage C's gods atlas is per figure)
    FAMILIES[f'{g}-cinderHorde'] = [f'{g}-cinderHorde']
    FAMILIES[f'{g}-thornwood'] = [f'{g}-thornwood']
for g, n in (('pyreLord', 'cinderHorde'), ('emberHierophant', 'cinderHorde'), ('ashColossus', 'cinderHorde'), ('ashPhoenix', 'cinderHorde'),
             ('cinderIdol', 'cinderHorde'), ('hornedHunter', 'thornwood'), ('motherOfBeasts', 'thornwood'), ('wildSpirit', 'thornwood'),
             ('elderWyrm', 'thornwood'), ('worldTree', 'thornwood')):
    FAMILIES[g] = [f'{g}-{n}']


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def rel(p):
    return os.path.relpath(p, UNITS)


def selection():
    p = os.path.join(PROD, 'selection.json')
    return json.load(open(p)) if os.path.exists(p) else {}


def frames_of(fig):
    """[(view, action, png, post frame record, job record, tag)] for a figure's accepted action frames."""
    jobs = json.load(open(os.path.join(PROD, 'jobs', 'actions.json')))
    sel = selection()
    base = fig.replace('-thornwood', '-cinderHorde') if fig.split('-')[0] in dd_jobs.TINTED else fig
    out = []
    for j in [j for j in jobs if j['figure'] == base]:
        for act in j['actions']:
            tag = os.path.basename(j['out']).rsplit('.png', 1)[0]
            s = sel.get(j['job'])
            if isinstance(s, dict):
                tag = s.get(act, s.get('*', tag))
            elif isinstance(s, str):
                tag = s
            if tag == 'skip':
                continue
            pj = os.path.join(CUT, tag, 'post.json')
            if not os.path.exists(pj):
                continue
            rep = json.load(open(pj))
            fr = next((r for r in rep['frames'] if r['action'] == act and not r.get('missing')), None)
            if fr is None:
                continue
            png = os.path.join(CUT, tag, fr['file'])
            if fig != base:
                png = os.path.join(CUT, tag + '.thornwood', fr['file'].replace('-cinderHorde.', '-thornwood.'))
            fr = dd_final.resolve(fig, j['view'], fr, png, j['job'], sel)
            out.append((j['view'], act, png, fr, j, tag, rep))
    return out


def tier_img(png, wpp, tier, fr=None, key=None, rim_out=None):
    """The frame at a tier: the art director's pixel fixes, the premultiplied Lanczos downscale, then the rim fix at the
    tier's own resolution (on the 2K frames the key-blended fringe is 10 to 30 px wide, wider than the fix's 2 px ring;
    at the tier it is 2 to 3 px, which the ring covers), then the keyline. rim_out (a dict) takes the rim check after."""
    rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
    if fr is not None:
        rgba = dd_final.finish(rgba, fr)
    k = wpp / WPP[tier]
    s = cpk.premul_resize(rgba, k)
    if key:
        s, share = ad_rimfix.fix(s, key)
        if rim_out is not None:
            rim_out.update(gd_post.rim(s, key), rimFixedShare=round(float(share), 3))
    pad = 1 if tier == 'S' else 2
    for _ in range(pad):
        s = cck.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
    return s, k, pad


def wu_points(fr):
    """The rig anchors as wu offsets (x right, y down) from the frame's ground anchor: snapped where a snap exists."""
    a = np.array(fr['anchor']); w = fr['wuPerPx']
    out = {}
    for n, p in fr['points'].items():
        if n.endswith('Snapped'):
            continue
        q = fr['points'].get(n + 'Snapped', p)
        key = {'tip': 'weaponTip'}.get(n, n)
        out[key] = [round((q[0] - a[0]) * w, 1), round((q[1] - a[1]) * w, 1)]
    return out


def pack_family(fam):
    """One family: its pages per tier, its figures' metadata and weights; returns its part of the index."""
    figs = FAMILIES[fam]
    index = dict(families={}, figures={})
    per = {}
    for tier in ('S', 'H'):
        items = []
        for fig in figs:
            fl = frames_of(fig)
            if not fl:
                continue
            body = dd_jobs.figure_rec(fig if fig in dd_jobs.GODS or fig in dd_jobs.CREATURES else fig.replace('-thornwood', '-cinderHorde'))[0] \
                if (fig in dd_jobs.GODS or fig in dd_jobs.CREATURES or fig.replace('-thornwood', '-cinderHorde') in dd_jobs.GODS) else None
            for view in ('back', 'front'):
                # the idle: its white flash only (the idle texture itself is stage C's)
                idle_png = dd_jobs.idle_path(fig, view)
                ij = os.path.join(CUT, f'{fig.replace("-thornwood", "-cinderHorde") if fig.split("-")[0] in dd_jobs.TINTED else fig}.{view}.idle', 'idle.json')
                idle = json.load(open(ij)) if os.path.exists(ij) else None
                if idle:
                    s, k, pad = tier_img(idle_png, idle['wuPerPx'], tier)
                    ax, ay = idle['anchor'][0] * k + pad, idle['anchor'][1] * k + pad
                    wht = s.copy(); wht[..., :3] = 255
                    items.append((f'{fig}.{view}.idle.white', wht, (ax, ay)))
                    per.setdefault(fig, {}).setdefault(view, {}).setdefault('idle', dict(rec=idle, png=idle_png))[tier] = dict(
                        white=f'{fig}.{view}.idle.white', scale=round(k, 4), w=s.shape[1], h=s.shape[0])
                for (v, act, png, fr, j, tag, rep) in [x for x in fl if x[0] == view]:
                    ro = {} if tier == 'H' else None
                    s, k, pad = tier_img(png, fr['wuPerPx'], tier, fr, j['key'], ro)
                    ax, ay = fr['anchor'][0] * k + pad, fr['anchor'][1] * k + pad
                    name = f'{fig}.{view}.{act}'
                    items.append((name, s, (ax, ay)))
                    im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
                    sh, P = cpack.shadow_of(im, tier)
                    # the shadow (blurred 5 wu: 10 px at S, 20 px at H) is stored at half the tier's resolution and drawn at
                    # scale 2 (shadowScale): nothing of a blur that wide is lost, and the shadows took 45% of the pages
                    sh = sh.resize((max(1, sh.width // 2), max(1, sh.height // 2)), Image.LANCZOS)
                    items.append((name + '.shadow', np.asarray(sh).astype(np.float64), ((ax + P) / 2, (ay + P) / 2)))
                    if act == 'hit':
                        wht = s.copy(); wht[..., :3] = 255
                        items.append((name + '.white', wht, (ax, ay)))
                    per.setdefault(fig, {}).setdefault(view, {}).setdefault(act, dict(rec=fr, png=png, job=j, tag=tag, rep=rep))[tier] = dict(
                        frame=name, shadow=name + '.shadow', shadowScale=2, white=name + '.white' if act == 'hit' else None, scale=round(k, 4),
                        w=s.shape[1], h=s.shape[0])
                    if ro:
                        per[fig][view][act]['rec']['rimAfterFixTierH'] = ro
        if not items:
            continue
        prefix = os.path.join(OUT, f'{fam}-{tier}')
        pages, placed, names = cpack.write_pages(prefix, items, tier, 'neutral #1C1A17 60%; shadows black 42% blurred 5 wu')
        px = sum(Image.open(os.path.join(OUT, n)).size[0] * Image.open(os.path.join(OUT, n)).size[1] for n in names)
        index['families'].setdefault(fam, {})[tier] = dict(pages=names, frames=len(placed), texturePx=px,
                                                          sizes=[list(Image.open(os.path.join(OUT, n)).size) for n in names])
    for fig, views in per.items():
        base = fig.replace('-thornwood', '-cinderHorde') if fig.split('-')[0] in dd_jobs.TINTED else fig
        body = dd_jobs.figure_rec(base)[0]
        m = dict(figure=fig, family=fam, body=body, key=dd_jobs.figure_rec(base)[1], views={}, approved=None,
                 route='colour edit of the Cinder action frames (dd_tint.py, zero generations)' if fig != base else 'generated (nb21: action maquette + approved idle cutout)',
                 codeOnly={a: ('the idle cutout tilted 6 degrees away from the blow, the one-frame white flash (idle.white), the mesh flinch'
                               if a == 'hit' else 'the idle with the glyph emissive mask driven by the ability (no painted frame)')
                           for a in dd_jobs.CODE_ONLY.get(body, [])},
                 note='every action is its own texture on a 24 x 16 MeshPlane (art plan 5.3); anchors are wu offsets from the ground anchor '
                      '(x right, y down); scale per frame from the area of the paint against the approved idle (or the body\'s thickness '
                      'where the painting departed from its maquette), so every action keeps the idle\'s size')
        sel = selection(); flaws = sel.get('_flaws', {})
        held = {}
        for jj in json.load(open(os.path.join(PROD, 'jobs', 'actions.json'))):
            if jj['figure'] != base:
                continue
            sj = sel.get(jj['job'])
            for a_ in jj['actions']:
                if sj == 'skip' or (isinstance(sj, dict) and sj.get(a_) == 'skip'):
                    held.setdefault(jj['view'], {})[a_] = flaws.get(f"{jj['job']}/{a_}") or flaws.get(jj['job']) or 'held back by the art director'
        m['heldBack'] = held
        wts = {}
        for view, acts in views.items():
            mv = {}
            for act, d in acts.items():
                fr = d['rec']
                if fr.get('rimAfterFixTierH'):
                    fr['checks'] = dict(fr['checks'], rimAfterFixTierH=fr['rimAfterFixTierH'])
                e = dict(heightWu=fr['heightWu'], wuPerPx=fr['wuPerPx'], kind=fr.get('kind', 'standing'),
                         anchorPx=fr['anchor'], points=wu_points(fr), atlas={t: d[t] for t in ('S', 'H') if t in d})
                if act == 'idle':
                    e.update(texture='stage C: ' + rel(d['png']), note='the idle texture is stage C\'s (not repacked); its white flash is here')
                else:
                    e.update(scaleRule=fr.get('scaleRule'), wuPerPxPost=fr.get('wuPerPxPost'), groundFix=fr.get('groundFix'),
                             anchorBeforeGroundFix=fr.get('anchorBeforeGroundFix'), pixelFixes={k: fr[k] for k in ('fadeTop', 'fadeEdge', 'eraseClay', 'warmClay') if fr.get(k)})
                    e.update(file=rel(d['png']), raw=d['rep']['raw'], rawSha256=d['rep']['rawSha256'], model=d['rep']['model'],
                             imageSize=d['rep']['imageSize'], guide='stage-d/prod/guides/' + d['rep']['guide'] + '.png', tag=d['tag'],
                             checks=dict(fr['checks'], fringe=d['rep']['fringe']), flags=fr.get('flags', []), registration=fr['registration'])
                mv[act] = e
                wt = fr['weights']
                wts.setdefault(view, {})[act] = dict(grid=wt['grid'], parts=wt['parts'],
                                                     w={pn: [[round(float(x), 3) for x in row] for row in wt['w'][pn]] for pn in wt['parts']})
            m['views'][view] = mv
        json.dump(m, open(os.path.join(OUT, 'figures', f'{fig}.json'), 'w'), indent=1)
        json.dump(dict(figure=fig, grid=[24, 16], layout='w[part][row][col]: 16 rows of 24 vertices over the frame texture, '
                       'vertex (col, row) at (col/23 * width, row/15 * height) of the trimmed frame (before the tier keyline pad)',
                       views=wts), open(os.path.join(OUT, 'figures', f'{fig}.weights.json'), 'w'))
        index['figures'][fig] = dict(family=fam, views={v: sorted(a) for v, a in views.items()})
    print(fam, {t: index['families'].get(fam, {}).get(t, {}).get('pages') for t in ('S', 'H')}, flush=True)
    return index


def main(only=None):
    """Packs every family (only: the named families, merged into the existing index; their old pages and figure files go)."""
    os.makedirs(os.path.join(OUT, 'figures'), exist_ok=True)
    if only:
        old = json.load(open(os.path.join(OUT, 'index.json')))
        stale = [f for f, e in old['figures'].items() if e['family'] in only or f in sum((FAMILIES[x] for x in only), [])]
        for fam in set(list(only) + [old['figures'][f]['family'] for f in stale]):
            for t in old['families'].get(fam, {}).values():
                for pg in t['pages']:
                    for f in (pg, pg.replace('.png', '.json')):
                        if os.path.exists(os.path.join(OUT, f)):
                            os.remove(os.path.join(OUT, f))
            old['families'].pop(fam, None)
        for f in stale:
            old['figures'].pop(f, None)
            for x in (f'{f}.json', f'{f}.weights.json'):
                if os.path.exists(os.path.join(OUT, 'figures', x)):
                    os.remove(os.path.join(OUT, 'figures', x))
        fams = list(only)
    else:
        for f in os.listdir(OUT):
            if f.endswith(('.png', '.json')) and f != 'index.json':
                os.remove(os.path.join(OUT, f))
        for f in os.listdir(os.path.join(OUT, 'figures')):
            os.remove(os.path.join(OUT, 'figures', f))
        fams = list(FAMILIES)
    index = dict(version='stage-d-actions-1', date='2026-10-25', wuPerPx=WPP, families={}, figures={},
                 format='Pixi spritesheets per family and tier; frames <figure>.<view>.<action>, .shadow, .white; anchors normalised; '
                        'figures/<figure>.json the metadata (art plan 8.5); figures/<figure>.weights.json the 24 x 16 mesh weights; .shadow frames are stored at half resolution: draw them at scale 2 (shadowScale)')
    import multiprocessing as mp
    with mp.get_context('fork').Pool(int(os.environ.get('PACK_PAR', '2'))) as pool:
        parts = pool.map(pack_family, fams, chunksize=1)
    if only:
        index['families'] = old['families']; index['figures'] = old['figures']
    for part in parts:
        index['families'].update(part['families']); index['figures'].update(part['figures'])
    tot = {t: sum(f.get(t, {}).get('texturePx', 0) for f in index['families'].values()) for t in ('S', 'H')}
    index['texturePxTotal'] = tot
    index['bytesPng'] = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith('.png'))
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
    print('texture px', tot, 'png bytes', index['bytesPng'])


if __name__ == '__main__':
    main(sys.argv[1:] or None)
