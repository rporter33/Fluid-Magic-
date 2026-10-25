# Stage B, key "cmdB": the commander route of the calibration (stage-b/calibration.md 1.4) for every Thornwood commander
# face (Scout, Warden Captain, Grove Priest, Sapling Druid, Elder Druid) and the Independent Captain mountaineer and
# reedman outfits, both views.
#   Step 1, body sheets per kind and view, all camera-correct sheets already gated:
#     - twDruid front: the calibration's Pro druid body (16/16, magenta), as it is.
#     - cmdLevy front and back (independents): cmdA's Pro levy bodies (16/16, 14/16, blue), as they are.
#     - twChief (Warden Captain) front and back, twDruid back: a Nano Banana 2.1 edit (review change 7) of a
#       camera-correct commander sheet in the same view and layout, laid on the magenta key (cmdb_onkey.py): the
#       calibration's cmdChief front (14/16), cmdA's cmdChief back (15/16) and cmdCaster back (14/16). Pro from the
#       maquette is not used: cmdA's Pro bodies failed 6 times out of 10 (scout 1/16 and 0/16, priest 10/16 and 6/16,
#       hunter 9/16, caster back 9/16), and this task's 150 generations hold only 22 beyond one re-dress a face and view.
#     - twScout front and back: no body step. The scouts are re-dressed straight onto cmdA's scout front body (an edit
#       of the levy body, 15/16) and its levy back body (14/16), both laid on magenta, as cmdA re-dressed its hunters and
#       scout backs onto the levy body with the kit swapped in the same edit.
#   Step 2, re-dress: Nano Banana 2.1 per face and view, the body sheet of that view as Image 1, the face's approved
#     portrait as Image 2, every identity mark named, "no shield" stated, the kit swapped where the body is another
#     kind's. Elder Druid 05 and 08 fronts are the calibration's (both passed, 16/16 at body scale).
# Writes ../../prompts/*.txt and ../../jobs/*.json (stage-b/work/cmdB/). Prompts never name another game, franchise,
# artist or studio; nothing here names one.
# Usage: python3 cmdb.py bodies | redress VIEW [FACE ...] | reroll FACE VIEW "failure named"
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_prompts import KEYWORDS  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402
from cmd_kits import kit_marks  # noqa: E402  (critique fix 11: one kit per face)

SBX = os.path.abspath(os.path.join(HERE, '..'))
W = os.path.abspath(os.path.join(SBX, '..'))                       # stage-b/work/cmdB
STAGEB = os.path.abspath(os.path.join(W, '..', '..'))              # stage-b
UNITS_DIR = os.path.abspath(os.path.join(STAGEB, '..'))            # units
RAW = os.path.join(STAGEB, 'raw', 'cmdB')
CAL = os.path.join(STAGEB, 'cal')
RAWA = os.path.join(STAGEB, 'raw', 'cmdA')
REFS = os.path.join(W, 'refs')
REPO = '/home/user/Fluid-Magic-'
PORTRAIT = REPO + '/art-source/portraits/{}/{}/{}.webp'
U = {u['id']: u for u in json.load(open(os.path.join(SBX, 'units.json')))['units']}
NB21 = 'gemini-nano-banana-2.1'

# Image 1 of each body edit: a camera-correct commander sheet in the same view, laid on magenta (cmdb_onkey.py)
EDIT_SRC = {('twChief', 'front'): (f'{REFS}/cmdChief.front.onmagenta.png', 'calibration cmdChief front body (14/16)'),
            ('twChief', 'back'): (f'{REFS}/cmdChief.back.onmagenta.png', 'cmdA cmdChief back body (15/16)'),
            ('twDruid', 'back'): (f'{REFS}/cmdCaster.back.onmagenta.png', 'cmdA cmdCaster back body (14/16)')}
# bodies used as they are (Image 1 of the re-dress); the rest come from bodies.json once picked
FIXED_BODY = {('twDruid', 'front'): f'{CAL}/raw/cmdDruid.front.body.g3pro.png',
              ('twScout', 'front'): f'{REFS}/cmdScout.front.onmagenta.png',
              ('twScout', 'back'): f'{REFS}/cmdLevy.back.onmagenta.png',
              ('cmdLevy', 'front'): f'{RAWA}/cmdLevy.front.body.g3pro.png',
              ('cmdLevy', 'back'): f'{RAWA}/cmdLevy.back.body.g3pro.png'}
REUSED_REDRESS = {('ed05', 'front'): f'{CAL}/raw/ed05.front.redress.nb21.png',
                  ('ed08', 'front'): f'{CAL}/raw/ed08.front.redress.nb21.png'}

BODY_EDIT = {
    'twChief': dict(
        kit='a Warden Captain of the Thornwood, a forest war leader: a helm of layered bark plates with a pair of antlers '
            'rising from it; a cloak of real overlapping green oak leaves over both shoulders and down the back to the '
            'knees; armour of layered bark plates over the chest and shoulders, with bark pauldrons; a moss-green wool '
            'tunic under the bark, leather bracers, a broad leather belt and dark leather boots; weathered bark-brown '
            'skin and a short beard; a plain straight sword with a simple cross guard in the right hand',
        swap='Where a figure of Image 1 holds the axe, this leader holds the sword in the same hand, pointing the same '
             'way. The leaf cloak replaces the fur mantle, the antlered bark helm replaces the spiked iron helm and the '
             'bark plates replace the iron. No fur, no spikes, no iron crown, no axe, no shield.',
        see='the antlered bark helm, the leaf cloak and the bark pauldrons'),
    'twDruid': dict(
        kit='a hooded druid of the Thornwood: a soft hood of olive-brown wool worn up over the head; a collar and short '
            'mantle of brown feathers over the shoulders; a long robe of layered bark-brown and moss-green cloth to the '
            'ground, belted with a cord; weathered bark-brown skin; a tall gnarled staff of dark wood with a small green '
            'sprig at its head, held in the right hand',
        swap='Where a figure of Image 1 holds the iron-caged staff, this druid holds the gnarled staff in the same hand, '
             'pointing the same way; the hood replaces the bare head and circlet, the feather mantle replaces the grey '
             'mantle, and the robe is bark-brown and moss-green instead of charcoal. No iron cage, no ember, no circlet.',
        see='the hood, the feather mantle and the long robe'),
}

KIT_SWAP = {
    'thornScout': ('{Pr} wears a Thornwood scout\'s kit instead of the kit of Image 1: {his} own hood of overlapping '
                   'leaves worn up as the portrait shows it, joined to a short cape of the same leaves over the '
                   'shoulders; a bark-brown leather jerkin with plain straps over a moss-green tunic; brown breeches and '
                   'soft wrapped boots; weathered bark-brown skin; a long knife held in the hand that holds the weapon '
                   'in Image 1, pointing the same way. {Pr} is lean and light: no helmet, no iron cap, no padded jerkin, '
                   'no armour, no sword.'),
    'grovePriest': ('{Pr} wears a Grove Priest\'s kit instead of the hooded druid\'s kit of Image 1: no hood over the '
                    'head (the head is bare under {his} wreath, and any hood lies down on the shoulders), {his} own robe '
                    'to the ground and clasp as the portrait shows them, and the staff named in the marks above, held where '
                    'Image 1 holds its staff.'),
    'saplingDruid': ('{Pr} is a young druid in a Sapling Druid\'s kit instead of the hooded elder\'s kit of Image 1: no '
                     'hood over the head (the cloak\'s hood lies down on the shoulders and the head is bare under {his} '
                     'circlet of twigs), a moss-green wool cloak over a bark-brown tunic of leaf-shaped leather, and the '
                     'staff named in the marks above, held where Image 1 holds its staff. {Pr} is young, slim and upright.'),
    'independentCaptain-mountaineer': (
        '{Pr} wears a mountaineer captain\'s kit instead of the iron cap and the padded jerkin of Image 1: {his} own '
        'iron helm as the portrait shows it, a heavy fur mantle over the shoulders and down the back to the hips as the '
        'portrait shows it, a dark leather and mail jerkin under it, dark breeches and heavy leather boots; {pr} keeps '
        'the plain straight sword of Image 1 in the same hand.'),
    'independentCaptain-reedman': (
        '{Pr} wears a reedman captain\'s kit instead of the iron cap and the padded jerkin of Image 1: {his} own '
        'leather cap as the portrait shows it, a cloak of plaited reeds over the shoulders and down the back as the '
        'portrait shows it, a dark brown leather jerkin under it, dark breeches and soft leather boots; {pr} keeps the '
        'plain straight sword of Image 1 in the same hand.'),
}


def key_of(kind, view):
    return U[kind]['key']


def kind_of(face, view=None):
    return FACES[face][0]


def body_sheet(kind, view):
    if (kind, view) in FIXED_BODY:
        return FIXED_BODY[(kind, view)]
    bp = os.path.join(W, 'bodies.json')
    p = (json.load(open(bp)) if os.path.exists(bp) else {}).get(f'{kind}.{view}')
    return p and p.get('raw')


FACING_FRONT = ('Facing, again: every figure in every one of the cells faces the same way, toward us and to the lower '
                'left, including the figure that is hit and the falling one; the fleeing figures alone turn away.')


def facing_back(see):
    return ('Facing, again: every figure faces exactly as in Image 1, away from us toward the upper right, the hit and '
            f'falling figures included: we see the back, {see}, and we never see the face; only the two fleeing figures '
            'turn toward us.')


def body_edit_prompt(kind, view):
    k = BODY_EDIT[kind]
    keyname, nokey = KEYWORDS['magenta']
    cam = 'in front' if view == 'front' else 'behind'
    return '\n'.join([
        'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera (high above and '
        f'{cam}, looking down at about 40 degrees), the direction every figure faces, every figure\'s pose, size and '
        f'position in its cell, the 4 by 4 grid and the flat {keyname} background.', '',
        f'Repaint every figure of Image 1 as another leader, the same in every cell: {k["kit"]}. {k["swap"]} Keep each '
        'figure\'s pose, size and position, and its outline as close as the new kit allows. This sheet is the body that '
        'each leader of this kind is later painted onto, so keep the kit plain: no personal ornaments, sigils or '
        'trophies. Painterly oil on a wood panel, visible directional brushwork, a muted earthy palette of bark brown, '
        'moss green, leather and bone; nothing glows. Keep the daylight of Image 1 (a high sun from the upper left, a '
        'cool fill on the lower right).', '',
        FACING_FRONT if view == 'front' else facing_back(k['see']), '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
        f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
        'overlapping figures.'])


def pron(sex):
    if sex == 'person':
        return dict(noun='person', pr='they', Pr='They', his='their', has='They have', carries='They carry',
                    shows='they show', wears='They wear', iss='They are', keeps='they keep')
    pr = 'he' if sex == 'man' else 'she'
    return dict(noun=sex, pr=pr, Pr=pr.capitalize(), his='his' if sex == 'man' else 'her', has=f'{pr.capitalize()} has',
                carries=f'{pr.capitalize()} carries', shows=f'{pr} shows', wears=f'{pr.capitalize()} wears',
                iss=f'{pr.capitalize()} is', keeps=f'{pr} keeps')


def swap_text(unit, p):
    s = KIT_SWAP.get(unit)
    if not s:
        return ''
    s = s.format(Pr=p['Pr'], pr=p['pr'], his=p['his'])
    if p['noun'] == 'person':  # plural verbs after "They"
        for a, b in (('They wears', 'They wear'), ('They is', 'They are'), ('they keeps', 'they keep')):
            s = s.replace(a, b)
    return s


def redress_prompt(face, view, extra=None):
    kind, nat, unit, num, sex, marks = FACES[face]
    keyname, nokey = KEYWORDS[key_of(kind, view)]
    p = pron(sex)
    who = {'person': 'the priest', 'man': 'the man', 'woman': 'the woman'}[sex]
    cam = ('high above and in front, looking down at about 40 degrees' if view == 'front'
           else 'high above and behind, looking down at about 40 degrees')
    marks = kit_marks(face, marks)
    use = [m for m, b in marks] if view == 'front' else [m for m, b in marks if b]
    marks_txt = '; '.join(f'({i + 1}) {m}' for i, m in enumerate(use))
    if view == 'front':
        see = f'{p["has"]} these marks, and each one must be clearly visible at full size: {marks_txt}.'
        facing = FACING_FRONT
    else:
        see = (f'Seen from behind, {p["shows"]} these marks, and each one must be clearly visible at full size: '
               f'{marks_txt}. Face-only details stay hidden, because the face is turned away.')
        facing = facing_back('the shoulders and the back of the head or headgear')
    nothing = 'nothing glows, not even the eyes' if unit == 'elderDruid' else 'nothing glows'
    para = (f'Repaint every figure of Image 1 as {who} of Image 2, the same in every cell. Keep each figure\'s pose, the '
            'position of its arms, legs and weapon, and its outline as close as the new kit allows. ' + see + ' '
            f'{p["carries"]} no shield. Paint the marks in the portrait\'s hand: painterly oil on a wood panel, visible '
            f'directional brushwork, a muted earthy palette; {nothing}. Keep the daylight of Image 1 (a high sun from '
            'the upper left, a cool fill on the lower right); do not copy the portrait\'s candlelight, its dark '
            'background or its framing.')
    sw = swap_text(unit, p)
    if sw:
        para += ' ' + sw
    parts = [f'Image 1 is a finished game sprite sheet of a leader whose drawing is right: keep exactly its camera ({cam}), '
             'the direction every figure faces, every figure\'s pose, size and position in its cell, the 4 by 4 grid and '
             f'the flat {keyname} background.',
             f'Image 2 is this leader\'s own approved painted portrait. Every figure of Image 1 must become {who} of the '
             'portrait, seen full length from above.', '', para, '', facing, '']
    if extra:
        parts += [extra, '']
    parts += [f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
              f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
              'overlapping figures.']
    return '\n'.join(parts)


def guard(text):
    """Prompts are written only from the kit words above and the portrait sidecars, which name no game, franchise,
    artist or studio; this keeps them free of any proper name other than the nation's (checked by eye on every
    prompt file, and here for capitalised words that are not the sentence openers or the nation's names)."""
    import re
    allowed = {'Image', 'Repaint', 'Keep', 'Paint', 'Facing', 'Background', 'Never', 'Seen', 'Face-only', 'Thornwood',
               'Warden', 'Captain', 'Grove', 'Priest', 'Sapling', 'Druid', 'Where', 'The', 'This', 'Painterly', 'No',
               'He', 'She', 'They', 'Every', 'Each', 'Elder'}
    words = {w for w in re.findall(r"(?<![.:;!?] )(?<!^)[A-Z][a-z-]+", text, flags=re.M)}
    odd = sorted(words - allowed)
    assert not odd, f'unexpected proper names in a prompt: {odd}'
    return text


def body_jobs():
    P = os.path.join(W, 'prompts'); os.makedirs(P, exist_ok=True)
    jobs = []
    for (kind, view), (src, what) in EDIT_SRC.items():
        pf = os.path.join(P, f'{kind}.{view}.body.edit.txt'); open(pf, 'w').write(guard(body_edit_prompt(kind, view)))
        jobs.append(dict(job=f'{kind}.{view}.body.edit', figure=kind, view=view, model=NB21, aspect='1:1', key='magenta',
                         refs=[src], promptFile=pf, out=os.path.join(RAW, f'{kind}.{view}.body.edit.nb21.png'),
                         purpose=f'commander body sheet {kind} {view}: Nano Banana 2.1 edit of the {what} laid on magenta, '
                                 'review change 7'))
    return jobs


def redress_job(face, view, tag='', extra=None):
    kind, nat, unit, num, sex, marks = FACES[face]
    P = os.path.join(W, 'prompts'); os.makedirs(P, exist_ok=True)
    body = body_sheet(kind, view)
    assert body, f'no body sheet for {kind} {view}'
    pf = os.path.join(P, f'{face}.{view}.redress{tag}.txt'); open(pf, 'w').write(guard(redress_prompt(face, view, extra)))
    return dict(job=f'{face}.{view}.redress{tag}', figure=kind, face=face, unit=unit, num=num, view=view, model=NB21,
                aspect='1:1', key=key_of(kind, view), refs=[body, PORTRAIT.format(nat, unit, num)], promptFile=pf,
                out=os.path.join(RAW, f'{face}.{view}.redress{tag}.nb21.png'),
                purpose=f'commander re-dress {unit} {num} {view} onto {kind} {view} body (nb21)' + (f' {tag[1:]}' if tag else ''))


def main():
    a = sys.argv[1:]
    J = os.path.join(W, 'jobs'); os.makedirs(J, exist_ok=True)
    if a[0] == 'bodies':
        jobs = body_jobs()
        json.dump(jobs, open(os.path.join(J, 'bodies.json'), 'w'), indent=1); print(len(jobs), 'body jobs')
    elif a[0] == 'redress':
        view = a[1]
        faces = a[2:] or [f for g in GROUPS.values() for f in g]
        jobs = [redress_job(f, view) for f in faces if (f, view) not in REUSED_REDRESS]
        name = f'redress-{view}-' + ('all' if not a[2:] else '-'.join(sorted({f[:2] for f in faces})))
        json.dump(jobs, open(os.path.join(J, name + '.json'), 'w'), indent=1); print(len(jobs), 'jobs ->', name)
    elif a[0] == 'body-reroll':
        kind, view, why = a[1], a[2], a[3]
        src, what = EDIT_SRC[(kind, view)]
        P = os.path.join(W, 'prompts')
        txt = body_edit_prompt(kind, view).replace(
            '\n\nFacing, again:', '\n\nThe last attempt failed: ' + why + ' Keep every figure exactly where, how large '
            'and facing which way Image 1 has it.\n\nFacing, again:', 1)
        pf = os.path.join(P, f'{kind}.{view}.body.edit.r2.txt'); open(pf, 'w').write(guard(txt))
        j = dict(job=f'{kind}.{view}.body.edit.r2', figure=kind, view=view, model=NB21, aspect='1:1', key='magenta',
                 refs=[src], promptFile=pf, out=os.path.join(RAW, f'{kind}.{view}.body.edit.r2.nb21.png'),
                 purpose=f'commander body sheet {kind} {view} re-roll (failure named): Nano Banana 2.1 edit of the {what} '
                         'laid on magenta')
        json.dump([j], open(os.path.join(J, f'body-reroll-{kind}.{view}.json'), 'w'), indent=1); print(j['job'])
    elif a[0] == 'reroll':
        face, view, why = a[1], a[2], a[3]
        extra = ('The last attempt failed: ' + why + ' Keep every figure exactly where, how large and facing which way '
                 'Image 1 has it.')
        j = redress_job(face, view, '.r2', extra)
        json.dump([j], open(os.path.join(J, f'reroll-{face}.{view}.json'), 'w'), indent=1); print(j['job'])


if __name__ == '__main__':
    main()
