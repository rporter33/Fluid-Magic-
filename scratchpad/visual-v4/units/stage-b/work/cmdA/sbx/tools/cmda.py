# Stage B, key "cmdA": the commander route of the calibration (stage-b/calibration.md 1.4), for every Cinder Horde
# commander face and the Independent Captain levy and hunter outfits, both views.
#   Step 1, body sheets: Nano Banana Pro (gemini-3-pro-image, 1K) from the zoned commander maquette (Image 1), the
#     nation's camera-correct troop sheet IN THE SAME VIEW (Image 2) and the style anchor (Image 3).
#   Step 2, re-dress: Nano Banana 2.1 per face and view, the body sheet of that view as Image 1, the face's approved
#     portrait as Image 2, every identity mark named, "no shield" stated.
# Writes ../../prompts/*.txt and ../../jobs/*.json (stage-b/work/cmdA/). Prompts never name another game, franchise,
# artist or studio; nothing here names one.
# Usage: python3 cmda.py bodies | redress [VIEW] [FACE ...] | reroll JOB "reason"
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_prompts import STYLE, LIGHT, CAMERA, NEVER, KEYWORDS, cell_lines  # noqa: E402
from cmda_faces import FACES, GROUPS  # noqa: E402
from cmd_kits import kit_marks  # noqa: E402  (critique fix 11: one kit per face)

SBX = os.path.abspath(os.path.join(HERE, '..'))
W = os.path.abspath(os.path.join(SBX, '..'))                       # stage-b/work/cmdA
STAGEB = os.path.abspath(os.path.join(W, '..', '..'))              # stage-b
UNITS_DIR = os.path.abspath(os.path.join(STAGEB, '..'))            # units
RAW = os.path.join(STAGEB, 'raw', 'cmdA')
CAL = os.path.join(STAGEB, 'cal')
REPO = '/home/user/Fluid-Magic-'
ANCHOR = REPO + '/art-source/portraits/anchor-style.webp'
PORTRAIT = REPO + '/art-source/portraits/{}/{}/{}.webp'
U = {u['id']: u for u in json.load(open(os.path.join(SBX, 'units.json')))['units']}
PRO, NB21 = 'gemini-3-pro-image', 'gemini-nano-banana-2.1'

TROOP = {  # camera-correct troop sheets per key and view (the near soldier's back pick, the AD's Pro front)
    ('green', 'front'): f'{UNITS_DIR}/pilot/raw/ad/cw.front.g3pro.png',
    ('green', 'back'): f'{UNITS_DIR}/pilot/raw/r3/cw.back.g3pro.png',
    ('blue', 'front'): f'{W}/refs/cw.front.g3pro.onblue.png',   # the same sheets keyed and laid on the blue key
    ('blue', 'back'): f'{W}/refs/cw.back.g3pro.onblue.png',
}
# bodies the calibration made and this task reuses (front view only): stage-b/cal/raw/
REUSED_BODY = {('cmdChief', 'front'): f'{CAL}/raw/cmdChief.front.zonesonly.g3pro.png',
               ('cmdCaster', 'front'): f'{CAL}/raw/cmdCaster.front.body.g3pro.png'}
# re-dresses the calibration made on those bodies (front view), reused as this task's figures
REUSED_REDRESS = {('ac03', 'front'): f'{CAL}/raw/ac03.front.redress.nb21.png',
                  ('cm03', 'front'): f'{CAL}/raw/cm03.front.redress.nb21.png',
                  ('ea07', 'front'): f'{CAL}/raw/ea07.front.redress.nb21.png'}
# the pilot's kept Ash Chieftain 06 (front view, melee layout: a re-dress of the camera-correct troop front sheet)
PILOT_AC06 = f'{UNITS_DIR}/pilot/raw/ad/ac06.front.redress.nb21.png'

KINDS = {
    'cmdChief': dict(
        notsoldier='no shield, no orange surcoat, cape or mantle and no crest',
        legend='bronze for the crown ring of short spikes on the iron helm, near-black for the heavy fur mantle over the '
               'shoulders and down the back, blue-grey for the iron pauldrons',
        kit='An Ash Chieftain of the Cinder Horde, a war leader: heavy and broad; a dark iron helm crowned with a ring of '
            'short iron spikes; a heavy mantle of soot-black fur over both shoulders and hanging down the back to the '
            'knees; dark iron plate pauldrons; charcoal clothes with dark iron scale sleeves, leather bracers and a broad '
            'leather belt, so that little skin shows; dark leather boots; ash-grey skin, a plain face with a short dark '
            'beard; a jagged single-bit dark iron axe in the right hand. He carries no shield and wears no cloth of a '
            'bright colour.',
        detail='the spikes of the crown-helm, the separate tufts of the fur mantle, the plates and rivets of the pauldrons, '
               'scale sleeves, leather straps and buckles, worn metal on the axe',
        values='the crown-helm, the dark mantle and the pauldrons', backsee='the fur mantle and the back of the crown-helm'),
    'cmdCaster': dict(
        notsoldier='no shield, no armour, no orange surcoat, cape or mantle, no crest and no axe',
        legend='bronze for the thin iron circlet, light grey for the mantle of layered cloth over the shoulders, near-black '
               'for the long robe, orange for the iron cage at the top of the staff',
        kit='A fire mage of the Cinder Horde: a long charcoal robe to the ground; a heavy mantle of layered smoke-grey '
            'cloth over both shoulders and down the back; a thin blackened-iron circlet on the bare head; ash-grey skin, a '
            'plain face with a short dark beard; a tall staff of blackened wood held in the right hand, crowned with a '
            'small iron cage holding a dull ember that does not glow. No armour, no shield, no cloth of a bright colour.',
        detail='the folds and frayed hem of the robe, the layers of the mantle, the circlet, the iron cage and the wood '
               'grain of the staff',
        values='the head, the pale mantle and the staff head against the dark robe', backsee='the grey mantle, the long robe and the back of the head'),
    'cmdPriest': dict(
        notsoldier='no shield, no armour, no orange surcoat, cape or mantle, no crest and no axe',
        legend='dark grey for the deep hood, light grey for the short mantle over the shoulders, near-black for the long '
               'robe, orange for the small iron brazier at the top of the staff',
        kit='A Pyre Priest of the Cinder Horde, a fire priest: a deep hood of charcoal cloth worn up over the head; a '
            'short mantle of layered smoke-grey cloth over both shoulders; a collar of dark iron rings at the throat; a '
            'long charcoal robe to the ground, belted with a plain cord; ash-grey skin, a plain clean-shaven face; a staff '
            'of blackened wood held in the right hand, topped with a small open iron brazier of dull, unlit coals that do '
            'not glow. No armour plates, no shield, no cloth of a bright colour.',
        detail='the deep folds of the hood, the layers of the mantle, the iron ring collar, the folds and frayed hem of the '
               'robe, the little iron brazier and the wood grain of the staff',
        values='the hood, the pale mantle and the staff head against the dark robe', backsee='the hood, the grey mantle and the long robe'),
    'cmdScout': dict(
        notsoldier='no shield, no helmet, no armour, no orange surcoat, cape or mantle, no crest and no axe',
        legend='near-black for the low hood and the short shoulder cape, pale grey for the scarf wound around the neck, '
               'brown for the leather shoulders of the jerkin',
        kit='A Cinder Scout, a light scout of the Cinder Horde: a low close-fitting hood of charcoal wool worn up; a long '
            'scarf of ash-grey wool wound around the neck and pulled up over the nose and mouth; a short shoulder cape of '
            'smoke-grey wool; a light jerkin of dark leather with plain straps, charcoal breeches and soft wrapped boots; '
            'ash-grey skin; a long knife of dark iron in the right hand. No armour plates, no helmet, no shield, no cloth '
            'of a bright colour.',
        detail='the folds of the hood and the scarf, the frayed edge of the cape, the leather straps and buckles of the '
               'jerkin, the wrapped boots and the worn blade of the knife',
        values='the dark hood and the pale scarf against the dark jerkin', backsee='the hood, the scarf and the short cape'),
    'cmdLevy': dict(
        notsoldier='no shield, no armour plates, no scale shirt, no orange surcoat, cape or tabard, no crest and no axe',
        legend='light grey for the iron cap, tan for the padded jerkin and its skirt, brown for the padded shoulder rolls',
        kit='An Independent Captain in levy gear, the captain of a free village militia: a plain rounded iron cap; a thick '
            'padded jerkin of undyed dun-brown cloth with quilted stitching, reaching to mid-thigh, with padded rolls at '
            'the shoulders and a leather belt; brown breeches and plain leather boots; a weathered plain face; a plain '
            'straight sword with a simple cross guard in the right hand. No shield, no insignia, no cloth of a bright '
            'colour.',
        detail='the dents and rivets of the iron cap, the quilting and stitching of the padded jerkin, the belt and its '
               'buckle, the worn leather boots and the plain sword',
        values='the iron cap and the light padded jerkin against darker legs', backsee='the back of the iron cap and the padded jerkin'),
    'cmdHunter': dict(
        notsoldier='no shield, no armour plates, no scale shirt, no orange surcoat, cape or tabard, no crest and no axe',
        legend='brown for the leather hood, the short cloak and the shoulders, pale grey for the fur ruff around the face '
               'and over the shoulders',
        kit='An Independent Captain in hunter\'s gear, the captain of a free village militia: a deep hood of brown leather '
            'worn up, trimmed with a thick ruff of light grey fur around the face; a short cloak of brown wool over the '
            'shoulders and back; a leather jerkin with straps and buckles; a quiver of arrows on the back; brown breeches '
            'and soft leather boots; a weathered plain face; a plain straight sword with a simple cross guard in the right '
            'hand. No shield, no insignia, no cloth of a bright colour.',
        detail='the fur of the ruff, the seams of the leather hood, the folds of the cloak, the straps, buckles and quiver, '
               'and the plain sword',
        values='the brown hood with its pale fur ruff and the cloak against darker legs', backsee='the hood, the fur ruff, the cloak and the quiver'),
}

# Route (stage B cmdA decision): the Pyre Priest's own body sheets failed the camera (front 10/16, back 6/16), so priests
# are re-dressed onto the robed caster's body (the calibration's kind list: "Cinder: armoured, scout, robed caster"),
# and the hunter outfit rides the levy body (its own Pro bodies failed: front 9/16, back 13/16): the re-dress changes
# the kit as it changes the face (review change 7). Their act cells are the body's (cast, rally).
ROUTE = {'pyrePriest': 'cmdCaster', 'independentCaptain-hunter': 'cmdLevy'}
KIT_SWAP = {
    'pyrePriest': ('{Pr} wears a Pyre Priest\'s kit instead of the mage\'s circlet and caged-ember staff of Image 1: {his} '
                   'own deep hood of charcoal cloth worn up, a long charcoal robe to the ground over dark iron, and the '
                   'brazier staff named in the marks above, its coals dull and unlit, held where Image 1 holds the staff.'),
    'independentCaptain-hunter': ('{Pr} wears a hunter captain\'s kit instead of the iron cap and the padded jerkin of '
                                  'Image 1: {his} own fur-trimmed hood worn up as the portrait shows it, a brown leather '
                                  'jerkin with straps and buckles, a short brown cloak over the shoulders and back, a '
                                  'quiver of arrows on the back, brown breeches and soft leather boots; {pr} keeps the '
                                  'plain straight sword of Image 1 in the same hand.'),
}


KEY_OVERRIDE = {('cmdScout', 'front'): 'blue'}  # the scout front body is an edit of the blue-keyed levy body


def key_of(kind, view):
    return KEY_OVERRIDE.get((kind, view), U[kind]['key'])


# The scout's own back body (Pro, 14/16 by the camera gate) has its stand, idle2, actA and fall cells turned toward
# the camera: the gate's mirrored-guide margin cannot tell a figure facing away from one facing us at this camera. Found
# by eye on the identity boards; the scout backs are re-dressed onto the levy back body (14/16, every cell facing away),
# blue key, as the scout front rides the levy front.
VIEW_ROUTE = {('cinderScout', 'back'): 'cmdLevy'}
KIT_SWAP_VIEW = {('cinderScout', 'back'): (
    '{Pr} wears a Cinder Scout\'s kit instead of the iron cap and the padded jerkin of Image 1: {his} own low hood of '
    'charcoal wool worn up and {his} own scarf as the portrait shows them, a short shoulder cape of smoke-grey wool, a '
    'light jerkin of dark leather with plain straps, charcoal breeches and soft wrapped boots; a long knife of dark iron '
    'in place of the sword, in the same hand. {Pr} is lean and light.')}


def kind_of(face, view=None):
    unit = FACES[face][2]
    return VIEW_ROUTE.get((unit, view)) or ROUTE.get(unit, FACES[face][0])


FACING_FRONT = ('Facing, again: every figure in every one of the cells faces the same way, toward us and to the lower '
                'left, including the figure that is hit and the falling one; the fleeing figures alone turn away.')


def facing_back(k):
    return ('Facing, again: every figure in every one of the cells faces the same way, away from us toward the upper '
            f'right, including the figure that is hit and the falling one: we see the back, {k["backsee"]}, never the '
            'face; only the two fleeing figures turn and run toward us.')


BACK_CELLS = {  # the calibration's back-view wording for the hit and the fall (pilot r3)
    'recoil': 'hit from the front: lurching backward toward us with the back still turned to us, shoulders hunched, '
              'arms thrown out to the sides, head bowed forward; we see only the back of the head and the shoulders, '
              'never the face',
    'fall': 'falling backward toward us, knees buckling, about halfway to the ground; still seen from behind and above: '
            'the back of the head and the shoulders toward us',
}


def body_prompt(kind, view):
    k = KINDS[kind]; u = dict(U[kind])
    keyname, nokey = KEYWORDS[u['key']]
    if view == 'back':
        u['cellOverrides'] = BACK_CELLS
    cols, rows, lines = cell_lines(u)
    refs = [f'Image 1 is the camera and pose guide: clay maquettes in exactly this grid, rendered from the game\'s battle '
            f'camera; the coloured areas on them mark the leader\'s kit: {k["legend"]}. Copy from it exactly the camera '
            'angle, the direction every figure faces, the pose in each cell, the size of the figure in its cell and the '
            'grid. Do not copy its smooth clay surfaces, its simple shapes or its toy-like proportions.',
            'Image 2 is a finished sprite sheet from the same game, painted at the same camera and in the same view: '
            'match its camera, the direction its figures face, the size of its figures in their cells, its daylight and '
            f'its painting. Do not copy its soldier or his kit: {k["notsoldier"]}.',
            'Image 3 is a painting-style reference from the same set: copy its brushwork, palette and edges, not its dark '
            'background, its candlelight, its framing or its subject.']
    parts = ['\n'.join(refs), '',
             f'A game sprite sheet: 16 full-length painted figures of one leader, one figure in each cell of a {cols} by '
             f'{rows} grid, on a perfectly flat, uniform {keyname} background. The same leader, the same equipment, the '
             'same colours and the same scale in every cell; only the pose changes.', '',
             CAMERA[view], '', LIGHT, '', STYLE, '',
             f'The leader: {k["kit"]}', '',
             'This sheet is the body that each of this kind\'s leaders is later painted onto, so keep the kit plain: no '
             'personal ornaments, sigils or trophies.', '',
             FACING_FRONT if view == 'front' else facing_back(k), '',
             f'Detail: at full size each figure is a finished small painting, not a flat icon: {k["detail"]}; varied, '
             f'visible brush strokes. The values stay simple enough that the figure reads at 46 pixels: {k["values"]}'
             + (' seen from behind.' if view == 'back' else '.'), '',
             'Proportions and scale: realistic adult proportions, the head with its helmet or hood about one sixth of '
             'the standing height; weapons at true size. Standing upright, a figure is about 62% of its cell\'s height; '
             'lying figures are as long as the standing ones are tall.', '',
             'The cells, left to right, row by row (the poses of the camera and pose guide):'] + lines + ['',
             f'Background and separation: one flat {keyname} colour fills the whole image with no gradient, texture, '
             f'floor, vignette or shadow; at least 24 pixels of clean background between any two figures and around the '
             f'edges. {nokey[0].upper() + nokey[1:]}.', '', NEVER]
    return '\n'.join(parts)


def redress_prompt(face, view, extra=None):
    _k, nat, unit, num, sex, marks = FACES[face]
    kind = kind_of(face, view)
    u = U[kind]
    keyname, nokey = KEYWORDS[key_of(kind, view)]
    pr = 'he' if sex == 'man' else 'she'
    Pr = pr[0].upper() + pr[1:]
    cam = ('high above and in front, looking down at about 40 degrees' if view == 'front'
           else 'high above and behind, looking down at about 40 degrees')
    marks = kit_marks(face, marks)
    use = [m for m, b in marks] if view == 'front' else [m for m, b in marks if b]
    marks_txt = '; '.join(f'({i + 1}) {m}' for i, m in enumerate(use))
    if view == 'front':
        facing = FACING_FRONT
        see = f'{Pr} has these marks, and each one must be clearly visible at full size: {marks_txt}.'
    else:
        facing = ('Facing, again: every figure faces exactly as in Image 1, away from us toward the upper right, the hit '
                  'and falling figures included: we see the back, the shoulders and the back of the head or headgear, '
                  'and we never see the face; only the two fleeing figures turn toward us.')
        see = (f'Seen from behind, {pr} shows these marks, and each one must be clearly visible at full size: {marks_txt}. '
               'Face-only details stay hidden, because the face is turned away.')
    parts = [f'Image 1 is a finished game sprite sheet of a leader whose drawing is right: keep exactly its camera ({cam}), '
             'the direction every figure faces, every figure\'s pose, size and position in its cell, the 4 by 4 grid and '
             f'the flat {keyname} background.',
             f'Image 2 is this leader\'s own approved painted portrait. Every figure of Image 1 must become the {sex} of '
             'the portrait, seen full length from above.', '',
             f'Repaint every figure of Image 1 as the {sex} of Image 2, the same in every cell. Keep each figure\'s pose, '
             'the position of its arms, legs and weapon, and its outline as close as the new kit allows. ' + see + ' '
             f'{Pr} carries no shield. Paint the marks in the portrait\'s hand: painterly oil on a wood panel, visible '
             'directional brushwork, a muted earthy palette; nothing glows. Keep the daylight of Image 1 (a high sun from '
             'the upper left, a cool fill on the lower right); do not copy the portrait\'s candlelight, its dark '
             'background or its framing.', '',
             facing, '']
    swap = KIT_SWAP_VIEW.get((unit, view)) or KIT_SWAP.get(unit)
    if swap:
        parts[3] = parts[3] + ' ' + swap.format(Pr=Pr, pr=pr, his='his' if sex == 'man' else 'her')
    if extra:
        parts += [extra, '']
    parts += [f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
              f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
              'overlapping figures.']
    return '\n'.join(parts)


def body_sheet(kind, view):
    """The body sheet a face's re-dress uses: the calibration's (front, cmdChief and cmdCaster) or this task's pick."""
    if (kind, view) in REUSED_BODY:
        return REUSED_BODY[(kind, view)]
    picks = json.load(open(os.path.join(W, 'bodies.json'))) if os.path.exists(os.path.join(W, 'bodies.json')) else {}
    p = picks.get(f'{kind}.{view}')
    return p and p.get('raw')


def body_jobs(kinds_views):
    P = os.path.join(W, 'prompts'); os.makedirs(P, exist_ok=True)
    jobs = []
    for kind, view in kinds_views:
        u = U[kind]
        pf = os.path.join(P, f'{kind}.{view}.body.txt'); open(pf, 'w').write(body_prompt(kind, view))
        jobs.append(dict(job=f'{kind}.{view}.body', figure=kind, view=view, model=PRO, aspect='1:1', key=u['key'],
                         refs=[os.path.join(SBX, 'refs', 'guides', f'{kind}.{view}.png'), TROOP[(u['key'], view)], ANCHOR],
                         promptFile=pf, out=os.path.join(RAW, f'{kind}.{view}.body.g3pro.png'),
                         purpose=f'commander body sheet {kind} {view} (Pro, zoned maquette + troop {view} sheet + anchor)'))
    return jobs


def redress_job(face, view, tag='', extra=None):
    _k, nat, unit, num, sex, marks = FACES[face]
    kind = kind_of(face, view)
    P = os.path.join(W, 'prompts'); os.makedirs(P, exist_ok=True)
    body = body_sheet(kind, view)
    assert body, f'no body sheet for {kind} {view}'
    pf = os.path.join(P, f'{face}.{view}.redress{tag}.txt'); open(pf, 'w').write(redress_prompt(face, view, extra))
    return dict(job=f'{face}.{view}.redress{tag}', figure=kind, face=face, unit=unit, num=num, view=view, model=NB21,
                aspect='1:1', key=key_of(kind, view), refs=[body, PORTRAIT.format(nat, unit, num)], promptFile=pf,
                out=os.path.join(RAW, f'{face}.{view}.redress{tag}.nb21.png'),
                purpose=f'commander re-dress {unit} {num} {view} onto {kind} {view} body (nb21)' + (f' {tag[1:]}' if tag else ''))


def main():
    a = sys.argv[1:]
    J = os.path.join(W, 'jobs'); os.makedirs(J, exist_ok=True)
    if a[0] == 'bodies':
        kv = [(k, 'front') for k in ('cmdPriest', 'cmdScout', 'cmdLevy', 'cmdHunter')] + \
             [(k, 'back') for k in ('cmdChief', 'cmdCaster', 'cmdPriest', 'cmdScout', 'cmdLevy', 'cmdHunter')]
        jobs = body_jobs(kv)
        json.dump(jobs, open(os.path.join(J, 'bodies.json'), 'w'), indent=1); print(len(jobs), 'body jobs')
    elif a[0] == 'redress':
        view = a[1]
        faces = a[2:] or [f for g in GROUPS.values() for f in g]
        jobs = [redress_job(f, view) for f in faces if (f, view) not in REUSED_REDRESS and not (f == 'ac06' and view == 'front')]
        name = f'redress-{view}-' + ('all' if not a[2:] else '-'.join(sorted({f[:2] for f in faces})))
        json.dump(jobs, open(os.path.join(J, name + '.json'), 'w'), indent=1); print(len(jobs), 'jobs ->', name)


if __name__ == '__main__':
    main()


# ---------------------------------------------------------------- body re-rolls (one each, the failure named)
def scout_front_r2():
    """The scout's front body failed the camera (1/16: eye level, figures too large in their cells). Re-roll with a
    camera-correct sheet in the SAME commander layout and act (the calibration's cmdChief front body, 14/16) as Image 2."""
    kind, view = 'cmdScout', 'front'
    p = body_prompt(kind, view)
    old = p.split('\n')[1]
    new = ('Image 2 is a finished sprite sheet of another leader from the same game, painted at the same camera, in the '
           'same view and in exactly this 4 by 4 layout with the same poses: match its camera, the direction its figures '
           'face, the small size of its figures in their cells, its daylight and its painting. Do not copy its leader or '
           'his kit: no helmet, no spikes, no fur mantle, no pauldrons and no axe.')
    p = p.replace(old, new)
    p = p.replace('Proportions and scale:', 'The last attempt failed: it was painted from eye level, with the figures far '
                  'too large in their cells. Look down on the figures from high above, as in Images 1 and 2: the top of the '
                  'hood and the shoulders large, the legs short.\n\nProportions and scale:')
    P = os.path.join(W, 'prompts'); pf = os.path.join(P, f'{kind}.{view}.body.r2.txt'); open(pf, 'w').write(p)
    return dict(job=f'{kind}.{view}.body.r2', figure=kind, view=view, model=PRO, aspect='1:1', key='green',
                refs=[os.path.join(SBX, 'refs', 'guides', f'{kind}.{view}.png'), REUSED_BODY[('cmdChief', 'front')], ANCHOR],
                promptFile=pf, out=os.path.join(RAW, f'{kind}.{view}.body.r2.g3pro.png'),
                purpose='commander body sheet cmdScout front re-roll (1/16, eye level): commander-layout cmdChief front body as Image 2')


def caster_back_edit():
    """The robed caster's back body failed (9/16). Review change 7: change the kit by a Nano Banana 2.1 edit of a
    camera-correct sheet in the same view and layout (this task's cmdChief back body, 15/16)."""
    k = KINDS['cmdCaster']
    keyname, nokey = KEYWORDS['green']
    p = '\n'.join([
        'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera (high above and behind, '
        'looking down at about 40 degrees), the direction every figure faces, every figure\'s pose, size and position in '
        f'its cell, the 4 by 4 grid and the flat {keyname} background.', '',
        f'Repaint every figure of Image 1 as another leader, the same in every cell: {k["kit"]} Where a figure of Image 1 '
        'holds the axe, this leader holds the staff in the same hand, pointing the same way; in the third row\'s first two '
        'cells he raises the staff high and then thrusts it toward the enemy, casting. The long robe falls to the ground '
        'over the legs, its hem swinging with each stride, and the mantle replaces the fur. Keep each figure\'s pose and '
        'outline as close as the robe allows. Painterly oil on a wood panel, visible directional brushwork, a muted earthy '
        'palette; nothing glows. Keep the daylight of Image 1 (a high sun from the upper left, a cool fill on the lower '
        'right).', '',
        facing_back(k), '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
        f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
        'overlapping figures.'])
    P = os.path.join(W, 'prompts'); pf = os.path.join(P, 'cmdCaster.back.body.edit.txt'); open(pf, 'w').write(p)
    return dict(job='cmdCaster.back.body.edit', figure='cmdCaster', view='back', model=NB21, aspect='1:1', key='green',
                refs=[os.path.join(RAW, 'cmdChief.back.body.g3pro.png')], promptFile=pf,
                out=os.path.join(RAW, 'cmdCaster.back.body.edit.nb21.png'),
                purpose='commander body sheet cmdCaster back (Pro 9/16): Nano Banana 2.1 edit of the cmdChief back body (15/16), review change 7')


if __name__ == '__main__' and sys.argv[1:2] == ['bodies-r2']:
    jobs = [scout_front_r2(), caster_back_edit()]
    json.dump(jobs, open(os.path.join(W, 'jobs', 'bodies-r2.json'), 'w'), indent=1); print(len(jobs))


def scout_front_edit():
    """The scout's front body failed twice from the maquette (1/16, then 0/16 with a dark-green background: reported).
    Review change 7: a Nano Banana 2.1 edit of a camera-correct front sheet in the same layout and act (rally): the
    calibration's cmdChief front body (14/16)."""
    k = KINDS['cmdScout']
    keyname, nokey = KEYWORDS['green']
    p = '\n'.join([
        'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera (high above and in front, '
        'looking down at about 40 degrees), the direction every figure faces, every figure\'s pose, size and position in '
        f'its cell, the 4 by 4 grid and the flat {keyname} background.', '',
        f'Repaint every figure of Image 1 as another leader, the same in every cell: {k["kit"]} He is lean and light, not '
        'heavy and broad: no helmet, no spikes, no fur mantle, no pauldrons, no axe. Where a figure of Image 1 holds the '
        'axe, this leader holds the long knife in the same hand, pointing the same way. Keep each figure\'s pose, size and '
        'position, and its outline as close as the lighter kit allows. Painterly oil on a wood panel, visible directional '
        'brushwork, a muted earthy palette; nothing glows. Keep the daylight of Image 1 (a high sun from the upper left, a '
        'cool fill on the lower right).', '',
        FACING_FRONT, '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
        f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
        'overlapping figures.'])
    P = os.path.join(W, 'prompts'); pf = os.path.join(P, 'cmdScout.front.body.edit.txt'); open(pf, 'w').write(p)
    return dict(job='cmdScout.front.body.edit', figure='cmdScout', view='front', model=NB21, aspect='1:1', key='green',
                refs=[REUSED_BODY[('cmdChief', 'front')]], promptFile=pf,
                out=os.path.join(RAW, 'cmdScout.front.body.edit.nb21.png'),
                purpose='commander body sheet cmdScout front (Pro failed 1/16 and 0/16): Nano Banana 2.1 edit of the calibration cmdChief front body (14/16), review change 7')


if __name__ == '__main__' and sys.argv[1:2] == ['scout-edit']:
    json.dump([scout_front_edit()], open(os.path.join(W, 'jobs', 'scout-edit.json'), 'w'), indent=1); print(1)


def scout_front_edit2():
    """The scout front edit of the chief body measured 13/16 (fall and deadA inherited from that body, cheer facing
    margin -0.011). Second try: an edit of the levy front body (16/16, same layout and act, a lean man with a blade),
    keeping its blue key (no blue anywhere in the scout's kit)."""
    k = KINDS['cmdScout']
    keyname, nokey = KEYWORDS['blue']
    p = '\n'.join([
        'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera (high above and in front, '
        'looking down at about 40 degrees), the direction every figure faces, every figure\'s pose, size and position in '
        f'its cell, the 4 by 4 grid and the flat {keyname} background.', '',
        f'Repaint every figure of Image 1 as another leader, the same in every cell: {k["kit"]} He is lean and light: no '
        'iron cap, no padded jerkin, no sword. Where a figure of Image 1 holds the sword, this leader holds the long knife '
        'in the same hand, pointing the same way. Keep each figure\'s pose, size and position, and its outline as close as '
        'the new kit allows. Painterly oil on a wood panel, visible directional brushwork, a muted earthy palette; nothing '
        'glows. Keep the daylight of Image 1 (a high sun from the upper left, a cool fill on the lower right).', '',
        FACING_FRONT, '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
        f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
        'overlapping figures.'])
    P = os.path.join(W, 'prompts'); pf = os.path.join(P, 'cmdScout.front.body.edit2.txt'); open(pf, 'w').write(p)
    return dict(job='cmdScout.front.body.edit2', figure='cmdScout', view='front', model=NB21, aspect='1:1', key='blue',
                refs=[os.path.join(RAW, 'cmdLevy.front.body.g3pro.png')], promptFile=pf,
                out=os.path.join(RAW, 'cmdScout.front.body.edit2.nb21.png'),
                purpose='commander body sheet cmdScout front, re-roll of the edit (13/16): Nano Banana 2.1 edit of the cmdLevy front body (16/16), blue key')


if __name__ == '__main__' and sys.argv[1:2] == ['scout-edit2']:
    json.dump([scout_front_edit2()], open(os.path.join(W, 'jobs', 'scout-edit2.json'), 'w'), indent=1); print(1)
