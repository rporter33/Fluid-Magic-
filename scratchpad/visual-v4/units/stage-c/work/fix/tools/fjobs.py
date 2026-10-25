# Stage C fix pass: the bases, prompts and jobs of the art director's re-rolls R1 to R7 (critique.md, "Re-rolls"), each
# with the critique's exact text. Writes work/fix/bases/*, work/fix/prompts/*.txt and work/fix/jobs.json (one entry a
# generation; a contingency re-roll is added later by name with --reroll, never more than one per failing item).
#   R1 Oakheart front and back - the fill route: Image 1 the current sheet (oakheart.<view>.fill) with the cells that
#      still fail the camera gate laid in as clay (cfill.build), Image 2 the approved portrait (oakheart 01b); every
#      figure, painted or clay, is repainted with the critique's helm, face, proportion and mantle text;
#   R2 Treant 04 front and back, Treant 02 back - the edit route: Image 1 the current raw sheet with 18% more of its own
#      background colour added above (and a little at the sides, to the 2:3 frame the generator takes);
#   R3 Wild Spirit back - the gods route (maquette, approved portrait B), the critique's correction appended;
#   R4 Hornet back - the fill route on hornetSwarm.back.fill, Image 2 the provisional pick B (the owner-question default);
#      the hornet's description is the wasp's (no fur, dark opaque wings), not the first roll's;
#   R5 Ash Colossus front and back - the gods route on the corrected maquette (fix 8, gd_rigs.py), blue key;
#   R6 Ash Rider front - the fill route on ashRider.front.fill, Image 2 the approved Ash Horse B;
#   R7 Living Monolith front - the gods route (2K), Image 3 the back cutout on the key colour.
# No prompt names another game, franchise, artist or studio (cprompts.BANNED, checked here).
# Usage: python3 -I fjobs.py
import json, os, re, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(FIX, '..', '..', '..'))
SC = os.path.join(UNITS, 'stage-c')
CW = os.path.join(SC, 'work', 'creatures')
CT = os.path.join(CW, 'sbx', 'tools')
GW = os.path.join(SC, 'work', 'gods')
sys.path.insert(0, CT)
import cprompts as CP  # noqa: E402
import cfill  # noqa: E402
from poses import LAYOUTS, CELL_WORDS  # noqa: E402

PR = os.path.join(FIX, 'prompts'); BA = os.path.join(FIX, 'bases')
RAWC = os.path.join(SC, 'raw', 'creatures'); RAWG = os.path.join(SC, 'raw', 'gods')
MODEL = 'gemini-nano-banana-2.1'
R = {
    'R1': ('A tall helm of upright bark planks rising a full head above the brow, ringed by a crown of long curved thorns, with '
           'a fringe of oak leaves at its rim, exactly as Image 2. Never a flat cap or a brimmed hat. The face a gaunt '
           'skull-like mask of grey oak with a crack across it and moss in the furrows. Tall, realistic proportions: the head '
           'with its helm one sixth of the standing height, long arms. The bottle-green mantle large over both shoulders and '
           'hanging down the chest, so that from the front it covers a third of the figure.'),
    'R2_04': ('Complete the two forked birch stems that run off the top edge into their natural tops with small twigs and '
              'leaves, all inside the frame, with 30 px of clean magenta above. Change nothing else: every outline, colour and '
              'the background stay exactly as they are.'),
    'R2_02': ('Complete the willow crown that runs off the top edge into its natural top with small twigs and leaves, all '
              'inside the frame, with 30 px of clean magenta above. Change nothing else: every outline, colour and the '
              'background stay exactly as they are.'),
    'R3': ('Standing on all four hooves, the body level and the hind legs under the hips, seen from behind and above, turned '
           'to the upper right as the mirror of the front view. The antlers and the leaf ruff in the nation\'s green. Not '
           'rearing, not leaping, never upright.'),
    'R4': ('A wasp, not a bee: a glossy hairless black head and thorax, a narrow waist, a long tapered abdomen with narrow '
           'dull ochre bands, open jagged mandibles, swept-back antennae, two pairs of smoky dark opaque wings with one torn '
           'edge. No fuzz, no amber body hair, no pale wings.'),
    'R5': ('Built as Image 2: lean and long-legged, the legs half the standing height, the arms long. Skin of dark charcoal '
           'ash, as dark as Image 2, with a fine net of dull ember-orange cracks over the chest, arms and thighs. The brazier '
           'head with dull coals; the kilt in the nation\'s cloth. Never a stocky grey stone golem.'),
    'R6': ('The ember-orange caparison covers the horse\'s chest, shoulders and both flanks and is seen from the front. The '
           'rider\'s ember cape lies over both shoulders and his helm crest is ember. The horse\'s coat is dark charcoal with '
           'sparse pale dapples, as dark as Image 2, never light grey. The riveted iron face plate and the iron bridle rings '
           'painted clearly.'),
    'R7': 'The base: the same low mound of dark earth, stones and roots as Image 3, seen from the other side.',
    'RES': 'Change only the wolf\'s coat in this cell to the warm grey-brown of the other cells; keep every outline.',
}
WASP = ('One giant forest hornet of a Hornet Swarm summoned by Thornwood druids, as big as a sparrow: the lean dark hornet of '
        'Image 2, a glossy black head and thorax, narrow dull ochre bands across its long tapering abdomen, huge dark '
        'compound eyes, open jagged mandibles, long antennae swept back over the head, a narrow waist, a long black sting, '
        'and two pairs of smoky dark wings with a torn edge, painted opaque, not see-through. The swarm is made in the game '
        'from many single hornets; each cell shows one hornet.')


def write(name, text):
    low = text.lower()
    bad = [b for b in CP.BANNED if re.search(r'(?<![a-z])' + re.escape(b) + r'(?![a-z])', low)]
    assert not bad, (name, bad)
    os.makedirs(PR, exist_ok=True)
    p = os.path.join(PR, name + '.txt'); open(p, 'w').write(text)
    return p


def job(name, item, purpose, refs, aspect, route, fig, view, out, kind, size=None, **extra):
    j = dict(job=name, item=item, figure=fig, view=view, route=route, model=MODEL, aspect=aspect, kind=kind, refs=refs,
             promptFile=os.path.join(PR, name + '.txt'), out=out, purpose='C fix: ' + purpose)
    if size:
        j['size'] = size
    j.update(extra)
    return j


# ---------------------------------------------------------------- creatures: the fill route, every figure repainted
def redress_fill(fig, view, src_job, item, text, desc=None, name=None):
    s = CP.GRID[fig]
    cols, rows, aspect, cells = LAYOUTS[CP.LAYOUT_OF[fig]]
    n, h, ban = CP.KEYS[s['key']]
    who = s['who']
    sd = os.path.join(CW, 'sheets', src_job)
    fail = json.load(open(os.path.join(sd, 'checks.json')))['cameraGate']['failing']
    os.makedirs(BA, exist_ok=True)
    base = os.path.join(BA, f'{fig}.{view}.cfix.base.png')
    rep = cfill.build(sd, fig, view, os.path.join(CW, 'sbx', 'refs', 'guides', f'{fig}.{view}.png'), fail, base)
    single = fig == 'hornetSwarm'
    seen = 'seen from above' if single else ('seen from behind' if view == 'back' else 'seen from in front')
    pos = [f'row {cells.index(c) // cols + 1}, column {cells.index(c) % cols + 1}' for c in fail]
    t = [f'Image 1 is a sprite sheet of {s["what"]}, {seen}, in a {cols} by {rows} grid on a flat pure {n} ({h}) background. '
         f'{len(cells) - len(fail)} of its figures are finished paintings whose camera, place, size and pose are right'
         + (f'; the figures in {len(fail)} cells ({"; ".join(pos)}) are grey clay figures.' if fail else '.') +
         f' Repaint every figure of the sheet, the painted ones' + (' and the clay ones' if fail else '') +
         f', as the {who} of Image 2 with the changes below, keeping each figure\'s place in its cell, its pose, its facing, '
         f'its camera and its size' + ('; no clay may remain' if fail else '') + '. The outline changes only where the '
         'changes below need it. Keep the ' + f'{cols} by {rows} layout, with no grid lines drawn, and the flat pure {n} '
         'background.',
         f'Image 2 is the approved painted portrait of this {who}: use it for its identity, its colours, its materials and its '
         f'marks, painted in the same hand. Do not copy its head-and-shoulders framing, its dark background, its candlelight '
         f'or its facing; every figure is the whole {who}, small in its cell.']
    if single:
        t.append('Camera: high above, looking down at about 40 degrees, the way a player looks down at a miniature on a table; '
                 'orthographic, no perspective, so every figure is the same size. Each hornet points exactly as its figure in '
                 'Image 1 points; we see its back, its wings from above and the top of its head.')
    elif view == 'back':
        t.append('Camera: high above and behind, looking down at about 40 degrees, the way a player looks down at miniatures on '
                 'a table; orthographic, no perspective. Every figure faces away from us toward the upper right, exactly as in '
                 'Image 1: we see its back and the top of its head; no face is seen; never at eye level, never seen from the side.')
    else:
        t.append('Camera: high above and in front, looking down at about 40 degrees, the way a player looks down at miniatures '
                 'on a table; orthographic, no perspective. Every figure faces toward us and to the lower left, exactly as in '
                 'Image 1: we see its face from above, its chest and its left side; never at eye level, never seen from the side.')
    t.append(CP.LIGHT.format(who=who) + s['light_extra'])
    t.append(CP.STYLE.format(who=who, px=s['px']))
    body = 'The ' + ('figures' if not single else 'hornet') + ': ' + (desc or s['desc']) + ' Its marks, every one painted clearly: ' + '; '.join(s['marks']) + '.'
    extra = s['back'] if view == 'back' else s['front']
    if extra:
        body += ' ' + extra[0].upper() + extra[1:]
    t.append(body)
    if s.get('side'):
        t.append(s['side'])
    t.append('The changes, on every figure of the sheet: ' + text)
    t.append('Scale: ' + s['scale'])
    lines = [f'{i + 1}. (row {i // cols + 1}, column {i % cols + 1}) {s["words"].get(c) or CELL_WORDS.get(c, c)}'
             + (' (a clay figure in Image 1)' if c in fail else '') + '.' for i, c in enumerate(cells)]
    t.append('The cells, left to right, row by row:\n' + '\n'.join(lines))
    t.append(CP.bg(s['key'], '; at least 24 pixels of clean background between any two figures and around the edges'))
    t.append(CP.NEVER.format(who=who).replace('other creatures or people', 'extra figures').replace(f'a cropped {who}', 'cropped or overlapping figures'))
    name = name or f'{fig}.{view}.cfix'
    write(name, '\n\n'.join(t))
    return job(name, item, f'{item} {fig} {view} sheet: nb21 re-dress of the current sheet ({src_job}, its {len(fail)} '
               f'camera-failing cells laid in as clay) with the approved portrait, every figure repainted (critique {item})',
               [base, s['portrait']], aspect, 'fill', fig, view, os.path.join(RAWC, f'{name}.nb21.png'), 'grid',
               fillCells=fail, base=rep, srcJob=src_job, key=s['key'])


# ---------------------------------------------------------------- treants: the crown completed above the frame
def crown_edit(face, view, src_job, item, text, top_frac=0.18, fix=None):
    sd = os.path.join(CW, 'sheets', src_job)
    raw = json.load(open(os.path.join(sd, 'key.json')))['file']
    im = np.asarray(Image.open(raw).convert('RGB'))
    H, W = im.shape[:2]
    bgc = np.median(np.concatenate([im[:6].reshape(-1, 3), im[:, :6].reshape(-1, 3), im[:, -6:].reshape(-1, 3)]), 0)
    top = int(round(top_frac * H))
    H2 = H + top
    W2 = int(round(H2 * 2 / 3))  # the 2:3 frame the generator takes; the sides grow by the same colour
    side = (W2 - W) // 2
    out = np.empty((H2, W2, 3), np.uint8); out[:] = bgc.astype(np.uint8)
    out[top:, side:side + W] = im
    os.makedirs(BA, exist_ok=True)
    base = os.path.join(BA, f'treant{face}.{view}.cfix' + ('.r2' if fix else '') + '.base.png')
    Image.fromarray(out).save(base)
    who = 'the willow crown' if face == '02' else 'the two forked birch stems'
    t = [f'Image 1 is a finished painted game cutout of a treant, a walking tree, on a flat pure magenta background. The '
         f'painting was cut off at its top: {who} of its crown ran past the top edge, and a band of the same flat magenta '
         f'has been added above it, so the crown now has room.',
         text] + (['Corrections from the previous attempt, which must be fixed: ' + fix] if fix else []) + [
         CP.bg('magenta'),
         'Never: text, letters, numbers, labels, grid lines, borders, frames, signatures, logos; a floor, ground, scenery or '
         'cast shadows; other creatures or people.']
    name = f'treant{face}.{view}.cfix' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, item, f'{item} Treant {face} {view} idle: nb21 edit of the current raw sheet ({os.path.basename(raw)}) with '
               f'{round(top_frac * 100)}% more background above, the crown cut by the top edge completed (critique fix 5)' + (' [re-roll: the stems end inside the frame]' if fix else ''), [base], '2:3', 'edit',
               f'treant-{face}', view, os.path.join(RAWC, f'{name}.nb21.png'), 'single', srcJob=src_job,
               pad=dict(top=top, side=side, srcSize=[W, H], baseSize=[W2, H2]))


# ---------------------------------------------------------------- gods: the maquette route with the correction appended
def god_job(god, view, item, text, size=None, aspect=None, image3=None, preface=None):
    J = next(j for j in json.load(open(os.path.join(GW, 'jobs.json'))) if j['god'] == god and j['view'] == view)
    G = json.load(open(os.path.join(GW, 'guides', 'guides-merged.json')))[f'{god}.idle.{view}']
    body = open(os.path.join(UNITS, J['prompt'])).read().rstrip('\n')
    if image3:
        body += '\n\n' + preface
    body += '\n\nCorrections from the previous attempt, which must be fixed: ' + text + '\n'
    name = f'{god}.{view}.cfix'
    write(name, body)
    refs = [os.path.join(UNITS, r) for r in J['refs']] + ([image3] if image3 else [])
    out = os.path.join(RAWG, f'{god}.{view}.nb21' + ('.2k' if size else '') + '.cfix.png')
    return job(name, item, f'{item} {god} {view} idle cutout (nb21: maquette + approved portrait {J["portraitJob"]}, pick {J["pick"]}'
               + (', 2K' if size else '') + (', Image 3 the back cutout' if image3 else '') + f') [re-roll: {text[:100]}]',
               refs, aspect or G['aspect'], 'gods', god, view, out, 'god', size=size, portraitJob=J['portraitJob'], pick=J['pick'])


def monolith_back_on_key():
    sel = json.load(open(os.path.join(GW, 'selection.json')))['figures']['livingMonolith-cinderHorde']['back']['tag']
    p = os.path.join(GW, 'cut', sel, 'livingMonolith-cinderHorde.back.idle.png')
    im = Image.open(p).convert('RGBA')
    pad = 40
    bgk = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 255, 0, 255))
    bgk.alpha_composite(im, (pad, pad))
    os.makedirs(BA, exist_ok=True)
    out = os.path.join(BA, 'livingMonolith.back.cutout-on-green.png')
    bgk.convert('RGB').save(out)
    return out, sel


# ---------------------------------------------------------------- contingency: one re-roll per failing item
# R1 and R6 by the fill route kept every painted figure as it was (the generator treats a finished figure as finished)
# and repainted only the clay cells, so their re-rolls are plain edits of the current sheet, the route that changed the
# Wolf Rider's coat and tack on every cell (wolfRider.front.harness): only the named parts change, every outline and
# place stays, so the camera cells stay those of the current sheet.
def plain_edit(fig, view, src_job, item, text, parts, keep, extra=None):
    s = CP.GRID[fig]
    cols, rows, aspect, cells = LAYOUTS[CP.LAYOUT_OF[fig]]
    n, h, ban = CP.KEYS[s['key']]
    sd = os.path.join(CW, 'sheets', src_job)
    raw = json.load(open(os.path.join(sd, 'key.json')))['file']
    side = 'behind' if view == 'back' else 'in front'
    seen = 'seen from behind' if view == 'back' else 'seen from in front'
    t = [f'Image 1 is a finished painted sprite sheet of {s["what"]}, {seen}, in a {cols} by {rows} grid, whose drawing is right: '
         f'keep exactly every figure\'s place, size, pose and camera (high above and {side}, looking down at about 40 degrees), '
         f'{keep}, the light from the upper left, and the flat pure {n} background exactly as it is. Change only {parts}, on '
         f'every figure of the sheet, so that it matches Image 2.',
         f'Image 2 is the approved painted portrait of this {s["who"]}: use it only for {parts}. Do not copy its framing, its '
         f'dark background or its candlelight.',
         'The changes, on every figure of the sheet: ' + text]
    if extra:
        t.append(extra)
    t.append(f'Keep everything else exactly as in Image 1, cell by cell. {ban}')
    t.append('Never: text, letters, numbers, labels, grid lines, borders, frames, signatures, logos; a floor, ground, scenery or '
             'cast shadows; extra figures.')
    name = f'{fig}.{view}.cfix.r2'
    write(name, '\n\n'.join(t))
    return job(name, item, f'{item} {fig} {view} sheet re-roll: nb21 plain edit of the current sheet ({src_job}), only {parts} '
               f'changed on every figure (critique {item}; the fill route left the painted figures as they were)',
               [raw, s['portrait']], aspect, 'edit', fig, view, os.path.join(RAWC, f'{name}.nb21.png'), 'grid', srcJob=src_job,
               key=s['key'])


def rerolls():
    out = []
    out.append(plain_edit('oakheart', 'front', 'oakheart.front.fill', 'R1', R['R1'], 'the helm, the head and the mantle',
                          'the grey oak body below the shoulders, the thornplate, the maul',
                          extra='The helm matters most: on every figure the low cap of Image 1 becomes the tall helm of upright '
                                'bark planks and long curved thorns of Image 2, so each outline grows upward at the head, and the '
                                'head under it is smaller than in Image 1.'))
    out.append(plain_edit('oakheart', 'back', 'oakheart.back.fill', 'R1', R['R1'], 'the helm, the head and the mantle',
                          'the grey oak body below the shoulders, the thornplate, the maul',
                          extra='The helm matters most: on every figure the low cap of Image 1 becomes the tall helm of upright '
                                'bark planks and long curved thorns of Image 2, seen from behind, so each outline grows upward at '
                                'the head, and the head under it is smaller than in Image 1.'))
    out.append(plain_edit('ashRider', 'front', 'ashRider.front.fill', 'R6', R['R6'],
                          'the horse\'s coat and caparison and the rider\'s cape and helm crest',
                          'the rider\'s armour, lance, pennon and sword'))
    fix04 = ('the previous attempt carried both stems straight up to the new top edge, so they were cut flat again. This time '
             'each stem ends inside the image: a short way above the place where it was cut, each stem tapers and divides into '
             'a crown of thinner branches and fine twigs with small yellow-brown leaves, and every tip of the crown stops at '
             'least 40 pixels below the top edge of the image, with only flat magenta above it. The stems never touch the top '
             'edge.')
    for v, src in (('front', 'treant04.front.redress'), ('back', 'treant04.back.redress.v2')):
        j = crown_edit('04', v, src, 'R2', R['R2_04'], top_frac=0.24, fix=fix04)
        out.append(j)
    # R3: the back maquette now stands square (gd_rigs.WILD_SPIRIT_BACK_SQUARE); its prompt's pose line follows it
    J = next(j for j in json.load(open(os.path.join(GW, 'jobs.json'))) if j['god'] == 'wildSpirit' and j['view'] == 'back')
    body = open(os.path.join(UNITS, J['prompt'])).read().rstrip('\n').replace(
        'Pose: standing with the right forefoot lifted, the long neck raised and the head up under the tall antlers.',
        'Pose: standing square on all four hooves, the body level, the long neck raised and the head up under the tall antlers.')
    body += ('\n\nCorrections from the previous attempt, which must be fixed: ' + R['R3'] + ' The previous attempt still lifted '
             'both forelegs, bent at the knees, so the beast looked as if it reared. This time all four legs are straight and '
             'planted, every hoof on the ground and carrying weight, exactly as the four legs of Image 1; seen from behind and '
             'above, the front hooves sit higher in the image than the hind hooves, as in Image 1, but no leg is lifted or bent.\n')
    name = 'wildSpirit.back.cfix.r2'
    write(name, body)
    out.append(job(name, 'R3', f'R3 wildSpirit back idle cutout re-roll (nb21: the back maquette standing square + approved portrait '
                   f'{J["portraitJob"]}, pick {J["pick"]}) [re-roll: all four hooves planted, no foreleg lifted]',
                   [os.path.join(UNITS, r) for r in J['refs']], J['aspect'], 'gods', 'wildSpirit', 'back',
                   os.path.join(RAWG, 'wildSpirit.back.nb21.cfix.r2.png'), 'god', portraitJob=J['portraitJob'], pick=J['pick']))
    return out


def main():
    jobs = []
    jobs.append(redress_fill('oakheart', 'front', 'oakheart.front.fill', 'R1', R['R1']))
    jobs.append(redress_fill('oakheart', 'back', 'oakheart.back.fill', 'R1', R['R1']))
    jobs.append(crown_edit('04', 'front', 'treant04.front.redress', 'R2', R['R2_04']))
    jobs.append(crown_edit('04', 'back', 'treant04.back.redress.v2', 'R2', R['R2_04']))
    jobs.append(crown_edit('02', 'back', 'treant02.back.redress.v2.r2', 'R2', R['R2_02']))
    jobs.append(god_job('wildSpirit', 'back', 'R3', R['R3']))
    jobs.append(redress_fill('hornetSwarm', 'back', 'hornetSwarm.back.fill', 'R4', R['R4'], desc=WASP))
    jobs.append(god_job('ashColossus', 'front', 'R5', R['R5']))
    jobs.append(god_job('ashColossus', 'back', 'R5', R['R5']))
    jobs.append(redress_fill('ashRider', 'front', 'ashRider.front.fill', 'R6', R['R6']))
    m3, sel = monolith_back_on_key()
    jobs.append(god_job('livingMonolith', 'front', 'R7', R['R7'], size='2K', image3=m3,
                        preface=f'Image 3 is the finished painted back view of this same monolith on its base ({sel}).'))
    if '--rerolls' in sys.argv:
        old = json.load(open(os.path.join(FIX, 'jobs.json')))
        new = rerolls()
        names = {j['job'] for j in new}
        jobs = [j for j in old if j['job'] not in names] + new
        json.dump(jobs, open(os.path.join(FIX, 'jobs.json'), 'w'), indent=1)
        for j in new:
            print(j['job'], j['aspect'], [os.path.basename(r) for r in j['refs']])
        return
    json.dump(jobs, open(os.path.join(FIX, 'jobs.json'), 'w'), indent=1)
    for j in jobs:
        print(j['job'], j['aspect'], j.get('size') or '1K', [os.path.basename(r) for r in j['refs']])


if __name__ == '__main__':
    main()
