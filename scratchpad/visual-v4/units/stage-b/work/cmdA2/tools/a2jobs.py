# Stage B, key "cmdA2": prompts and jobs for the 24 failing cmdA figure-views and the battle faces' own kits.
# Built on cmda.py's re-dress prompt (imported, unchanged), with these cause fixes (cmdA2 report):
#   - kit: battle faces get their own kit (kits.json, critique fix 11) in BOTH views; every other face keeps the kit its
#     passing other view already shows, so no face has two different weapons (its own kit waits for the owner's call);
#   - green key: small openings inside the outline (staff cages, horn curls) are closed: the key seen through them was
#     shaded by the painter, stayed opaque and failed keyInUnit on every magus back and on AC03/AC07 backs;
#   - blue key: the light's "cool fill" became blue shadows and blue blade highlights on the blue key (cs05 front);
#     blue-keyed sheets get a neutral grey fill and dark iron that is never blue;
#   - the failure of the last roll is named (cells, facing, openings), as the art plan's re-roll rule says.
# Usage: python3 a2jobs.py NAME JOBSPEC ...   JOBSPEC = face.view.tag[.kit] (writes ../jobs/NAME.json)
#        python3 a2jobs.py body-caster-back
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import a2cfg as C  # noqa: E402
import cmda  # noqa: E402
import cmd_kits  # noqa: E402
from make_prompts import KEYWORDS  # noqa: E402

SUMMARY = json.load(open(os.path.join(C.WA, 'summary.json')))
PROMPTS, JOBS = os.path.join(C.A2, 'prompts'), os.path.join(C.A2, 'jobs')
os.makedirs(PROMPTS, exist_ok=True); os.makedirs(JOBS, exist_ok=True)
_kit_marks = cmda.kit_marks


def solid_line(keyname):
    return (f'Closed shapes: the {keyname} background shows only through the large gaps between the limbs, the body and '
            'the staff or haft, and there it is exactly the same flat colour as everywhere else. Every small opening '
            'inside the outline is closed: an iron cage or lantern is packed full with its dull ember or coals, a ring '
            'holds its coal or stone, the curl of a horn lies tight against the helm with no hole in it. Nothing inside '
            f'the figure is tinted {keyname.split(" (")[0]}.')


BLUE_LIGHT = ('Light, for this blue background: the high sun from the upper left and a soft neutral grey fill on the '
              'lower right; the shadow side is warm brown-grey and the iron is dark grey with pale grey highlights; nothing '
              'on the figure is blue or reflects blue, not even the edge of a blade.')


def fail_lines(face, view, extra_note=None):
    r = SUMMARY.get(f'{face}.{view}') or {}
    out = []
    cells = [c for c in (r.get('failing') or []) if c in C.CELL_NO]
    if face.startswith('cs') and view == 'back':
        cells = []  # the last roll's cells were measured on the rejected scout body: the body itself is what changed
    if cells:
        out.append('The last attempt drifted in these cells: ' + '; '.join(f'cell {C.CELL_NO[c]} ({C.CELL_SAY[c]})' for c in
                   sorted(cells, key=C.CELL_NO.get)) + '. In every cell, and in these above all, keep the figure as Image 1 '
                   'draws it: the same pose, the same facing, the same size, the same length and breadth of the body on '
                   'the ground, and the same place in its cell.')
    if extra_note:
        out.append(extra_note)
    return out


def redress(face, view, tag, own_kit, body_raw=None, note=None):
    kind = cmda.kind_of(face, view)
    key = cmda.key_of(kind, view)
    keyname = KEYWORDS[key][0]
    cmda.kit_marks = _kit_marks if own_kit else (lambda f, m: m)
    old_pf = os.path.join(cmda.W, 'prompts', f'{face}.{view}.redress.{tag}.txt')
    old = open(old_pf).read() if os.path.exists(old_pf) else None  # cmdA's own queued prompt of that name stays as it was
    try:
        extra = fail_lines(face, view, note)
        if key == 'green':
            extra.append(solid_line(keyname))
        j = cmda.redress_job(face, view, tag='.' + tag, extra='\n\n'.join(extra) if extra else None)
    finally:
        cmda.kit_marks = _kit_marks
    p = open(j['promptFile']).read()
    if key == 'blue':
        p = p.replace('Keep the daylight of Image 1 (a high sun from the upper left, a cool fill on the lower right)',
                      'Keep the daylight of Image 1 (a high sun from the upper left), with a neutral grey fill')
        p = p.replace('\nBackground: one flat', '\n' + BLUE_LIGHT + '\n\nBackground: one flat')
    if body_raw:
        j['refs'][0] = body_raw
        p = p.replace('Image 1 is a finished game sprite sheet of a leader whose drawing is right',
                      'Image 1 is a finished game sprite sheet of a leader whose drawing is right (another leader of the same '
                      'kind: none of his own marks, trim or hair carry over)')
    pf = os.path.join(PROMPTS, os.path.basename(j['promptFile']))
    open(pf, 'w').write(p)
    if old is None:
        os.remove(j['promptFile'])  # cmda wrote it into cmdA's prompts/; this task keeps its own copy
    else:
        open(old_pf, 'w').write(old)
    j['promptFile'] = pf
    j['ownKit'] = bool(own_kit)
    j['kit'] = cmd_kits.kit(face, cmda.FACES[face][5]) if own_kit else 'as the passing other view (unchanged)'
    j['purpose'] = j['purpose'].replace(f' {tag}', '') + f' [{tag}' + (', own kit' if own_kit else '') + ']'
    j['tag'] = tag
    return j


def caster_back_body():
    """Cause fix for every magus back: the cmdCaster back body (an edit of the chieftain back) has cells 7 and 13 wrong
    (follow-through 0.56/-0.07, lying face down IoU 0.46) and the windup and recoil margins at +0.005 and +0.002, so
    every re-dress inherits two failing cells and tosses a coin on two more; and its caged ember shows the key through
    its bars (keyInUnit 0.60 on the body itself). The Ember Adept back sheets on that body re-drew cells 7 and 13 right
    (ea05: 15/16, follow 0.75/+0.16, deadB 0.67/+0.32, keyIn 0.035). A minimal edit of ea05's back makes it a plain
    caster body: same outlines, the adept's own marks removed, a solid staff cap."""
    keyname, nokey = KEYWORDS['green']
    p = '\n'.join([
        'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera (high above and behind, '
        'looking down at about 40 degrees), the direction every figure faces, every figure\'s pose, outline, size and '
        f'position in its cell, the 4 by 4 grid and the flat {keyname} background.', '',
        'Make it the plain body sheet of a fire mage of the Cinder Horde, onto which each mage\'s own face is painted '
        'later. Change only these details, the same in every cell: the dull ember-red trim on the robe and on the edge of '
        'the mantle becomes plain charcoal and smoke-grey cloth like the rest; the braids at the temples become short '
        'plain dark hair; the circlet becomes a plain thin band of blackened iron with no prongs; the top of the staff '
        'gets a plain knob of dark iron. Everything else stays exactly as Image 1 draws it: the long charcoal robe to the '
        'ground, the short charcoal mantle over one shoulder, every pose, every outline, the staff in the same hand at the '
        'same angle. Painterly oil on a wood panel, visible directional brushwork, a muted earthy palette; nothing glows. '
        'Keep the daylight of Image 1 (a high sun from the upper left, a cool fill on the lower right).', '',
        cmda.facing_back(cmda.KINDS['cmdCaster']), '',
        solid_line(keyname), '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
        f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
        'overlapping figures.'])
    pf = os.path.join(PROMPTS, 'cmdCaster.back.body.r2.txt'); open(pf, 'w').write(p)
    return dict(job='cmdCaster.back.body.r2', figure='cmdCaster', view='back', model=cmda.NB21, aspect='1:1', key='green',
                refs=[C.CASTER_BACK_FALLBACK], promptFile=pf, out=C.CASTER_BACK_R2, tag='body',
                purpose='commander body sheet cmdCaster back r2: Nano Banana 2.1 minimal edit of the Ember Adept 05 back '
                        '(15/16; the old caster back body fails cells 7 and 13 and shows the key through its cage)')


FACE_NOTE = {  # per-face notes from the critique (section 4)
    ('ac03', 'back'): 'His wolf-fur collar is grey-brown as in the portrait, never white.',
}

LYING_NOTE = ('In cells 11 to 13 (falling, lying dead on the back, lying dead face down) the body lies exactly where, '
              'which way and how long Image 1\'s body lies; tall headgear lies along the line of the body, not across it.')

OVERLAP = ('The last attempt let the staff of the dead figure in cell 12 run into the raised staff of the cheering figure '
           'in cell 16. Every figure stays inside its own cell with clean background between: in cell 12 the staff lies '
           'short along the ground, in cell 16 it is held no higher than the top of its own cell.')
AXE_SWAP = ('The last attempt failed the review: it kept the jagged single-bit axe of Image 1, so his own weapon did not '
            'show. In every cell, replace the axe of Image 1 with {w}, held in the same hand at the same angle, but with '
            'its own head: {shape} It must read as a different weapon from the axe of Image 1 even when the figure is '
            'small.')
REROLL_NOTE = {  # the kit rolls' own failures (cmdA2), named in their one re-roll
    ('ac01', 'front', 'kit2'): AXE_SWAP.format(w='the bearded axe of dark iron', shape='a narrow blade whose lower edge '
                               'drops in a long curved hook far below the haft, so the blade is twice as tall as it is wide.'),
    ('ac01', 'back', 'kit2'): AXE_SWAP.format(w='the bearded axe of dark iron', shape='a narrow blade whose lower edge '
                              'drops in a long curved hook far below the haft, so the blade is twice as tall as it is wide.'),
    ('ac02', 'front', 'kit2'): AXE_SWAP.format(w='the double-bitted axe of dark iron', shape='two broad blades, one on each '
                               'side of the haft, so the head is symmetric, as wide on the left of the haft as on the right.'),
    ('ac02', 'back', 'kit2'): AXE_SWAP.format(w='the double-bitted axe of dark iron', shape='two broad blades, one on each '
                              'side of the haft, so the head is symmetric, as wide on the left of the haft as on the right.'),
    ('cm03', 'back', 'kit2'): 'The last attempt drifted in cells 7, 8, 11 and 12 (the follow-through, recoiling, falling, '
                              'lying dead on the back): there the tall cowl stuck out across the body like a spike. Keep '
                              'every pose exactly as Image 1 draws it; when he lies, the cowl lies flat along the line of '
                              'his back.',
    ('ea02', 'back', 'kit2'): OVERLAP,
    ('pp06', 'back', 'kit2'): OVERLAP,
    ('ea07', 'back', 'kit2'): 'The last attempt drifted in cells 8, 11 and 13 (recoiling, falling, lying dead face down) '
                              'and showed his face in the falling cells. Keep every pose exactly as Image 1 draws it; '
                              'when he falls and lies, we see the back of his head, never his face.',
}

SCOUT_NOTE = ('The last attempt was painted onto another body whose figures turned to face us in the standing, at-ease, '
              'first act and falling cells. Image 1 faces away from us in every cell: keep that in every cell; we never '
              'see his face, his chest or the front of the scarf.')
OPEN_NOTE = ('The last attempt left small openings inside the figure ({what}) where the background showed through and '
             'stayed tinted; close them as said below.')

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[0] == 'body-caster-back':
        jobs = [caster_back_body()]
        json.dump(jobs, open(os.path.join(JOBS, 'body-caster-back.json'), 'w'), indent=1); print(jobs[0]['job']); sys.exit()
    old_caster = '--old-caster' in a
    a = [x for x in a if x != '--old-caster']
    name, specs = a[0], a[1:]
    body_override = {}
    if not old_caster and os.path.exists(os.path.join(C.A2, 'caster-back-body.json')):
        body_override['cmdCaster.back'] = json.load(open(os.path.join(C.A2, 'caster-back-body.json')))['raw']
    jobs = []
    for s in specs:
        parts = s.split('.')
        face, view, tag = parts[0], parts[1], parts[2]
        own = face in C.OWN_KIT
        kind = cmda.kind_of(face, view)
        note = None
        if face.startswith('cs') and view == 'back':
            note = SCOUT_NOTE
        elif (SUMMARY.get(f'{face}.{view}') or {}).get('gate', {}).get('fringe') is False and cmda.key_of(kind, view) == 'green':
            what = 'the staff\'s iron cage' if kind == 'cmdCaster' else 'the curls of the horns'
            note = OPEN_NOTE.format(what=what)
        if tag == 'kit' and (SUMMARY.get(f'{face}.{view}') or {}).get('pass_'):
            note = None  # a passing view re-dressed only for its own kit: no failure to name
        fn = FACE_NOTE.get((face, view))
        if tag in ('kit', 'kit2') and view == 'back':
            fn = ' '.join(x for x in (fn, LYING_NOTE) if x)
        if (face, view, tag) in REROLL_NOTE:
            note = REROLL_NOTE[(face, view, tag)]
        note = ' '.join(x for x in (note, fn) if x) or None
        jobs.append(redress(face, view, tag, own, body_override.get(f'{kind}.{view}'), note))
    json.dump(jobs, open(os.path.join(JOBS, name + '.json'), 'w'), indent=1)
    for j in jobs:
        print(j['job'], j['refs'][0].split('/')[-1], j['ownKit'], j['purpose'])
