#!/usr/bin/env python3
"""Write the .txt prompt beside each summoned-commander portrait (Salamander, Treant)."""
import os, sys

ROOT = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
STYLE = open(os.path.join(ROOT, 'art-tools/summons/style.txt')).read()

PREFACE = ("Image 1 is a style reference only: match its painting style, brushwork, lighting, rim light, framing, "
           "background and proportions. The person, the face, the headgear and every ornament must be different from "
           "Image 1 and must follow the description below exactly; do not copy the man, the helm, the horns or the "
           "trim from Image 1.")


def creature_style(creature, crown, glow_rule):
    """The style lock with 'one fantasy war leader' replaced by the creature and the human details dropped."""
    s = STYLE
    reps = [
        ('one fantasy war leader', creature),
        ('the top of the head or headgear about 9%', f'the top of the head or the {crown} about 9%'),
        ('the chin about 62%', 'the jaw about 62%'),
        ('One figure only. No hands, no weapons raised toward the face,',
         'One creature only, no people, no riders. No claws, limbs or hands in view,'),
        ('the back of the head or headgear, the hair and the shoulders',
         f'the back of the head, the {crown} and the shoulders'),
        ('the shape of the headgear or hair and the light face', f'the shape of the head and {crown} and the lit face'),
        ("Nothing in the image glows, except where the subject below says a mage's eyes glow.", glow_rule),
        ('larger than a small clasp or trim.', 'larger than a thin crack or a small patch.'),
    ]
    for a, b in reps:
        assert a in s, a
        s = s.replace(a, b)
    return s


SAL_STYLE = creature_style(
    'one Salamander, a great summoned fire lizard (a creature, not a person)',
    'horns',
    'Nothing in the image glows; there is no fire, no flame, no sparks and no smoke. The only warm color on the '
    'creature is a faint, dull ember color in the thin cracks between its scales, and its eyes do not glow.')
TRE_STYLE = creature_style(
    'one Treant, an ancient summoned walking tree (a creature, not a person)',
    'branch crown',
    'Nothing in the image glows; the knot eyes are dark and do not glow.')

SAL_LINE = ('A Salamander, a great fire lizard summoned by Cinder Horde mages: a heavy reptilian head and neck of '
            'dark obsidian-black scales with dull ember-orange cracks between them, small horns along the jaw; no '
            'open flame, no glow except a faint dull ember color in the cracks.')
TRE_LINE = ('A Treant, an ancient walking tree summoned by Thornwood druids: a face formed in deep bark, moss and '
            'lichen, small branches like a crown, two dark knot eyes.')

SAL = [
    'Creature: a young salamander, a short broad blunt head like a newt, smooth glossy unscarred scales, only a few '
    'fine hair-thin cracks; a calm, curious look, small round dark-bronze eyes. Marks: two neat rows of small straight '
    'pale-grey horn spikes along the jaw, no other horns, a clean neck with no frill.',
    'Creature: an ancient salamander, a massive heavy square head with a deep underslung jaw and a hanging dewlap, '
    'scales dulled and pitted and dusted grey with ash, wide deep cracks; heavy-lidded, half-closed, cloudy eyes, a '
    'patient look. Marks: thick blunt worn horns along the jaw, the largest one snapped off to a stump, warty bony '
    'knobs on the brow.',
    'Creature: a battle-scarred salamander in its prime, a long narrow crocodile-like snout, three deep parallel '
    'claw scars across the snout and cheek where the cracks show no color; a narrow slit-pupil eye, a fierce stare, '
    'the mouth slightly open showing a few blunt teeth. Marks: a row of hooked horns sweeping back along the jaw, one '
    'chipped, a low ridge of scutes along the top of the head.',
    'Creature: a lean old salamander, a narrow wedge-shaped viper-like head, heavy black soot caked in the creases, '
    'cracks forming a branching pattern like dried lava; a cold, watchful sidelong look, deep-set dark eyes under a '
    'heavy brow ridge. Marks: two long curved horns sweeping back from the rear of the jaw like a ram\'s, a torn, '
    'ragged skin frill along the back of the neck.',
]
TRE = [
    'Creature: a treant only a few centuries old; the face is part of a slender trunk of smooth pale grey-brown beech '
    'bark, not a human face: shallow lines, a small ridge of bark for a nose, a mouth that is only a thin closed split '
    'in the bark, soft patches of moss on the cheeks, a gentle look. Eyes: two small round dark knotholes, hollow and '
    'shadowed, with no whites, no irises and no eyeballs. Marks: a crown of thin straight branches with a few small '
    'green leaves; no beard; the head grows straight out of the trunk, with no human neck.',
    'Creature: an ancient treant, a broad, heavy face of deeply furrowed dark oak bark, a long hanging beard of grey '
    'beard-lichen and moss from the jaw; a slow, grave, heavy-browed look, deep sunken knot eyes. Marks: a wide '
    'crown of thick gnarled oak branches, one broken off to a jagged stump, shelf fungus on the shoulder.',
    'Creature: a scarred treant in its prime; the face is part of a split oak trunk, not a human face: long and '
    'angular, rough dark-brown bark, a jutting burl for a nose, a wide mouth that is a deep horizontal crack in the '
    'bark, a blackened lightning scar running from the crown down across one cheek, a stern look. Eyes: two dark '
    'knotholes deep in the bark, hollow and shadowed, with no whites, no irises and no eyeballs, one narrowed by the '
    'scar. Marks: a crown of bare, twisted, thorny black branches, ivy wound around the trunk; no beard, the jaw is '
    'bare bark with only a few short root tendrils.',
    'Creature: an old weathered treant; the face is part of a narrow cedar trunk, not a human face: gaunt, '
    'reddish-brown bark in long vertical stringy strips, a long nose like a broken branch stub, no lips, only a short '
    'dark crack in the bark for a mouth, a sad, far-seeing look. Eyes: two deep round knotholes ringed by bark, '
    'completely dark inside like holes in a tree trunk, with no whites, no irises and no eyeballs. Marks: a crown of '
    'spreading branches shaped like broad antlers with a few small pale blossoms, pale grey-green lichen crusting the '
    'brow and shoulders; no beard of any kind, the chin and jaw are bare bark.',
]


def prompt(style, line, var):
    return f'{PREFACE}\n\n{style}\n\nSubject: {line}\n{var}'


def path(unit, nation, n):
    return os.path.join(ROOT, f'art-gen/round2/{unit}/{nation}__{unit}__{n:02d}.txt')


if __name__ == '__main__':
    for i, v in enumerate(SAL, 1):
        open(path('salamander', 'cinderHorde', i), 'w').write(prompt(SAL_STYLE, SAL_LINE, v))
    for i, v in enumerate(TRE, 1):
        open(path('treant', 'thornwood', i), 'w').write(prompt(TRE_STYLE, TRE_LINE, v))
    print(open(path('salamander', 'cinderHorde', 1)).read())
    print('-----')
    print(open(path('treant', 'thornwood', 1)).read())
