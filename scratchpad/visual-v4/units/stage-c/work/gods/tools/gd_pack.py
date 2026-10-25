# Stage C gods: pack the selected idle cutouts under stage-c/atlas/gods/ in the format the battle mockup's bundler
# (stage-b/integrate/bundle.py) reads for big-body cutouts, the Salamander's approved cutout being the model:
#   atlas/gods/<figure>.<view>/<figure>.<view>.idle.png + .json   the full-resolution cutout and its slice record
#       (box, height, width, parts), with "anchor" the maquette's ground anchor mapped onto the cutout (what
#       ad_page.maquette_anchor gives the bundler for the Salamander) and "heightWu" the body's true screen height
#       (what pilot_page.true_height_wu gives it), so no guide lookup is needed at bundling time;
#   atlas/gods/tiers/<figure>.<view>.<S|H>.png and .shadow.png   the bundler's own per-tier steps done once (premultiplied
#       downscale to heightWu / wuPerPx, the keyline 1 px at S and 2 px at H, the silhouette shadow: black, alpha 0.42,
#       blurred 5 wu on a padded canvas), each at most 2048 px a side (skills digest texture budget);
#   atlas/gods/gods.json   every figure: views, anchors (cutout px and normalised per tier, as bundle.py writes ax/ay),
#       the mouth point for the breath body (in wu from the anchor, as bundle.py's MOUTH), sources and sha256, checks,
#       identity marks, the portrait it matches, status (for owner review 2) and approval (none yet).
# Usage: python3 -I gd_pack.py
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import resolve, UNITS, GENERIC  # noqa: E402
sys.path.insert(0, os.path.join(UNITS, 'tools'))
sys.path.insert(0, os.path.join(UNITS, 'stage-b', 'cal', 'sbx', 'tools'))
import pack as calpack  # noqa: E402  (the bundler's own premul_resize)
import checks as calchecks  # noqa: E402  (the bundler's own keyline)

W = os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.join(UNITS, 'stage-c', 'atlas', 'gods')
WU_PER_PX = {'S': 0.5, 'H': 0.25}
MAXPX = 2048
# breath body: the snout in the Cinder cutout's own px (looked up on 2x crops, work/gods/look/gw-mouth.png); the
# Thornwood figure is the same painting
MOUTH = {'greatWyrm': {'back': (1310, 150), 'front': (395, 1062)}}
MARKS = json.load(open(os.path.join(W, 'marks.json')))
# Stage C fix pass (art director's critique, owner-question defaults applied 2026-10-24):
# fix 6: the Ascended Hero's front painting is slimmer and squarer to the camera than its front maquette, whose box set its
# scale (35.0 wu), so it drew 17% shorter than its back; both palettes take the back's true height for the front.
HEIGHT_OVERRIDE = {('ascendedHero', 'front'): 42.2}
# Q4 default: pretender gods take the commander factor of design 3.2 (commanders draw at 1.15x their size's height), so
# every god outgrows its own commanders; summoned monsters (the creatures' atlas) stay at the ladder. One number per god:
# set a god's factor to 1.0 to turn it off for that god.
COMMANDER_FACTOR = {g: 1.15 for g in ('greatWyrm', 'titan', 'oracle', 'livingMonolith', 'ascendedHero', 'primordial', 'ashColossus',
                                     'ashPhoenix', 'pyreLord', 'cinderIdol', 'emberHierophant', 'wildSpirit', 'worldTree',
                                     'hornedHunter', 'elderWyrm', 'motherOfBeasts')}
DECISIONS = [
    'Route: the Salamander pilot route. Nano Banana 2.1, Image 1 the exact-camera clay maquette of the god (work/gods/guides, posed as its approved portrait, its tint zone in the nation\'s cloth), Image 2 the approved portrait (the raw source of the picked candidate); the body text is the portrait\'s own description with portrait-only parts removed.',
    'Thornwood palettes of the six generic gods: tint-zone edits of their Cinder figures, no new generation and no new body. The zone (the pixels at the zone\'s own ember hue and chroma, a soft mask, specks dropped) is moved in OKLCH by the transform the owner-approved portrait edit made, measured on that portrait pair (lightness fitted linearly, chroma by the median ratio, hue by the median shift). Where the portrait\'s green sat below the Thornwood cloth window (Living Monolith 131 deg, Primordial 139 deg) the target hue is raised to 146 deg. Every other pixel is the Cinder painting.',
    'Size: every maquette is built at its size\'s ladder height (battle-overhead.md 3.2) in world height, a man being 1.0 (weapons held above the head left out). The Elder Wyrm, a serpent, keeps the approved Salamander\'s body plan at size 6 (world height 0.48 of the ladder; the Salamander 0.50). Gods draw at their size\'s height without the commander factor, as the Salamander and the mockup\'s Great Wyrm (H 168) do. heightWu is the body\'s true screen box from its maquette, the bundler\'s scale; long bodies stand taller on screen than their ladder height because their length runs into the depth at 40 degrees, as the approved Salamander does (1.52x back, 1.23x front): Great Wyrm 1.47/1.27, Primordial 1.36/1.29, Elder Wyrm 1.77/1.60.',
    'Effects the game draws are not painted: the Cinder Idol\'s smoke, the Ash Colossus\' and the Ash Phoenix\'s embers, the Wild Spirit\'s mist and flicker, the Great Wyrm\'s breath. Nothing glows except the dull coals in the two braziers, as in the portraits.',
    'The Living Monolith and the Cinder Idol carry their glyphs on both broad faces, so the side colour shows in the near side\'s back view.',
    'Output size: 2K where the tier H texture would exceed the painted figure in a 1K frame (fewer than 4.5 px a wu at 1K): Great Wyrm, Primordial, Cinder Idol, Elder Wyrm, and the Living Monolith\'s back re-roll; 1K for the rest. No tier H texture is upscaled from its source.',
    'Keys (art plan 5.2): green for the Cinder palette (generic gods, Pyre Lord, Ember Hierophant), blue for the ember bodies (Ash Colossus, Ash Phoenix, Cinder Idol), magenta for the Thornwood realm gods.',
    'Maquettes corrected after first paintings: the Living Monolith gained the portrait\'s mound of earth, roots and stones (its first paintings failed only the aspect gate on the missing mound; its front painting is checked against the corrected maquette); the Ash Phoenix\'s wings were rebuilt as broad fans; both corrected maquettes are the ones these figures carry.',
    'The facing gate (IoU against the mirrored maquette) is not applied to the World Tree, which has no front.',
    'The size check passes only with the camera check: the body\'s scale comes from its maquette and holds only when the painted silhouette matches it.',
    'Stage C fix pass (art director\'s critique): the Ascended Hero\'s front takes the back\'s true height, 42.2 wu (fix 6: its painting is slimmer and squarer than its maquette, and drew 17% short); every god draws at the commander factor 1.15 of design 3.2 (owner question 4, default yes; COMMANDER_FACTOR, one number per god), so heightWu = maquette height (or the override) x factor, and heightWuBody keeps the height before the factor; the Ash Colossus is re-painted on a corrected maquette (fix 8: lean, long-legged, slim limbs, the fists at the arms\' ends); the Wild Spirit\'s back on a square-standing back maquette (fix 5, R3); the Living Monolith\'s front with the back\'s mound (R7) and its Thornwood tint turned from its own zone hue; the Horned Hunter\'s back pauldrons tinted from teal to bronze (fix 12).',
]


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def tiers(png, meta, heightWu, mouth):
    out = {}
    rgba0 = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
    ax0, ay0 = meta['anchor']
    for t in ('S', 'H'):
        k = heightWu / WU_PER_PX[t] / meta['height']
        s = calpack.premul_resize(rgba0, k)
        pad = 1 if t == 'S' else 2
        for _ in range(pad):
            s = calchecks.keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
        im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
        bl = int(round(5 / WU_PER_PX[t]))
        a = Image.fromarray(np.asarray(im)[..., 3]).convert('L')
        P = bl * 3
        big = Image.new('L', (im.width + 2 * P, im.height + 2 * P), 0); big.paste(a, (P, P))
        big = big.filter(ImageFilter.GaussianBlur(bl / 2))
        sh = Image.new('RGBA', big.size, (0, 0, 0, 0)); sh.putalpha(big.point(lambda q: int(q * 0.42)))
        base = os.path.basename(png).replace('.idle.png', '')
        f1 = os.path.join(OUT, 'tiers', f'{base}.{t}.png'); f2 = os.path.join(OUT, 'tiers', f'{base}.{t}.shadow.png')
        im.save(f1, optimize=True); sh.save(f2, optimize=True)
        ax, ay = ax0 * k + pad, ay0 * k + pad
        rec = dict(file=os.path.relpath(f1, OUT), w=im.width, h=im.height, ax=round(ax / im.width, 4), ay=round(ay / im.height, 4),
                   shadow=dict(file=os.path.relpath(f2, OUT), w=sh.width, h=sh.height, ax=round((ax + P) / sh.width, 4), ay=round((ay + P) / sh.height, 4)),
                   withinBudget=bool(max(im.size) <= MAXPX and max(sh.size) <= MAXPX))
        if mouth:
            rec['mouth'] = [round((mouth[0] * k + pad - ax) * WU_PER_PX[t], 1), round((mouth[1] * k + pad - ay) * WU_PER_PX[t], 1)]
        out[t] = rec
    return out


def main():
    sel = json.load(open(os.path.join(W, 'selection.json')))['figures']
    R = resolve()
    jobs = {(j['god'], j['view']): j for j in json.load(open(os.path.join(W, 'jobs.json')))}
    if os.path.exists(OUT):
        for f in os.listdir(OUT):
            if f == 'contact':
                continue
            p = os.path.join(OUT, f)
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    os.makedirs(os.path.join(OUT, 'tiers'), exist_ok=True)
    figs = {}
    for fig, views in sel.items():
        god, nation = fig.split('-')
        pick = R[god][nation]
        side = json.load(open(pick['sidecar']))
        rec = dict(god=god, nation=nation, sizeClass=None, ladder=None,
                   route='generated (nb21: exact-camera maquette + approved portrait)' if 'from' not in views['back'] else f'tint-zone edit of {god}-cinderHorde (gd_tint.py)',
                   portrait=dict(file=os.path.relpath(pick['game'], UNITS), master=os.path.relpath(pick['p512'], UNITS), job=pick['job'], pick=pick['pick'],
                                 cardCrop=side.get('cardCrop'), sha256=sha(pick['game'])),
                   tintZone=side.get('tintZone'), marks=MARKS.get(god), views={}, status='for owner review 2 (stage C, standing in the game)', approved=None)
        for v, s in views.items():
            cdir = os.path.join(W, 'cut', s['tag'])
            ck = json.load(open(os.path.join(cdir, 'checks.json')))
            meta = json.load(open(os.path.join(cdir, f'{fig}.{v}.idle.json')))
            src = os.path.join(cdir, f'{fig}.{v}.idle.png')
            d = os.path.join(OUT, f'{fig}.{v}'); os.makedirs(d, exist_ok=True)
            png = os.path.join(d, f'{fig}.{v}.idle.png')
            shutil.copy(src, png)
            meta['file'] = os.path.basename(png)
            json.dump(meta, open(png.replace('.png', '.json'), 'w'), indent=1)
            mouth = MOUTH.get(god, {}).get(v)
            raw = os.path.join(UNITS, ck['raw'])
            rawside = json.load(open(raw.rsplit('.png', 1)[0] + '.json'))
            j = jobs[(god, v)]
            prompt = os.path.relpath(rawside['promptFile'], UNITS) if rawside.get('promptFile') else os.path.relpath(os.path.join(UNITS, j['prompt']), UNITS)
            factor = COMMANDER_FACTOR.get(god, 1.0)
            body_wu = HEIGHT_OVERRIDE.get((god, v), meta['heightWu'])
            hw = round(body_wu * factor, 2)
            checks = {k: ck[k] for k in ('camera', 'rim', 'fringe', 'value', 'side', 'size', 'identity')}
            passed = [k for k in ('camera', 'rim', 'fringe', 'value', 'side', 'size') if checks[k].get('pass', checks[k].get('pass_'))]
            failed = [k for k in ('camera', 'rim', 'fringe', 'value', 'side', 'size') if k not in passed]
            if s.get('facingNA') and failed and set(failed) <= {'camera', 'size'}:
                c = checks['camera']
                if c['iou'] >= 0.6 and 0.75 <= c['aspectRatio'] <= 1.33 and abs(c['headDx'] - c['guideHeadDx']) <= 0.10:
                    failed = []
            rec['sizeClass'] = checks['size']['sizeClass']; rec['ladder'] = checks['size']['ladder']
            rec['views'][v] = dict(
                cutout=os.path.relpath(png, OUT), json=os.path.relpath(png.replace('.png', '.json'), OUT),
                heightWu=hw, heightWuBody=body_wu, heightWuMaquette=meta['heightWu'], commanderFactor=factor,
                heightOverride=HEIGHT_OVERRIDE.get((god, v)), widthWu=round(meta['widthWu'] * hw / meta['heightWu'], 1),
                anchor=meta['anchor'], anchorFrom=meta['anchorFrom'],
                height=meta['height'], width=meta['width'], size=list(Image.open(png).size),
                tiers=tiers(png, meta, hw, mouth),
                source=dict(raw=ck['raw'], sha256=rawside.get('sha256'), model=rawside.get('model'), aspect=rawside.get('aspect'),
                            imageSize=rawside.get('imageSize') or '1K', prompt=prompt, logKey=rawside.get('logKey', 'C gods'),
                            references=rawside.get('references'), tintFrom=s.get('from')),
                checks=checks, failed=failed, status=s['status'], selection=s)
        figs[fig] = rec
    man = dict(version='stage-c-gods-1', date='2026-10-24', wuPerPx=WU_PER_PX,
               format='per figure and view: the idle cutout and its slice json (anchor = maquette ground anchor in cutout px; heightWu = true screen height), '
                      'and the bundler-ready tiers (premultiplied downscale, keyline 1 px at S / 2 px at H #1C1A17 60%, silhouette shadow black 0.42 blurred 5 wu); '
                      'tiers.ax/ay and shadow.ax/ay are normalised as stage-b/integrate/bundle.py writes the Salamander; mouth in wu from the anchor',
               decisions=DECISIONS,
               generations=dict(key='C gods', calls=45, failedCalls='2 (HTTP 502 upstream, no image)', images=43, base=32, rerolls=11,
                                log='units/gen-log.tsv, purpose "C gods: ..."',
                                fix=dict(key='C fix', godCalls=6, note='R3 Wild Spirit back (2), R5 Ash Colossus front and back, R7 Living Monolith front (2K); purpose "C fix: ..."')),
               commanderFactor=COMMANDER_FACTOR, heightOverride={f'{g}.{v}': h for (g, v), h in HEIGHT_OVERRIDE.items()},
               battleUse={'greatWyrm-thornwood': 'battle a/b/c Thornwood Great Wyrm (the mockup\'s procedural god)'},
               figures=figs)
    json.dump(man, open(os.path.join(OUT, 'gods.json'), 'w'), indent=1)
    shutil.copy(os.path.join(HERE, 'bundle_gods.py'), os.path.join(OUT, 'bundle_gods.py'))  # the bundling step, beside its data
    n = sum(len(f['views']) for f in figs.values())
    print(OUT, len(figs), 'figures', n, 'cutouts')
    for fig, f in figs.items():
        print(fig, {v: (x['tiers']['H']['w'], x['tiers']['H']['h'], x['failed']) for v, x in f['views'].items()})


if __name__ == '__main__':
    main()
