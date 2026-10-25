# Stage B portraits (key "portraits"): prompts and jobs for the painted portraits of every creature, mount and god
# (art plan 3.1), two candidates each, in the leader portraits' template with the anchor as Image 1.
#   creatures and mounts: the leader bust template as the approved Salamander and Treant sidecars adapted it
#   gods: the whole body, three-quarter front, regal pose, variant 0 of every slot (pretender design B.3), swatch 0 of
#         its material, metal and accent tables (B.4), the tint zone in the nation's cloth; framing as the designer's
#         256 px preview (top about 6%, feet or base about 94%); the leaders' candle light, rim and background
#   the six generic chassis: the Cinder palette is generated; the Thornwood palette is a Nano Banana 2.1 edit of each
#         Cinder candidate that changes only the tint zone, so both palettes show one body (review change 7)
# Writes work/portraits/prompts/<job>.txt and work/portraits/jobs.json. No prompt names another game, franchise,
# artist or studio (checked below).
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..'))                 # stage-b/work/portraits
SB = os.path.abspath(os.path.join(W, '..', '..'))              # stage-b
RAW = os.path.join(SB, 'raw', 'portraits')
ANCHOR = '/home/user/Fluid-Magic-/art-source/portraits/anchor-style.webp'
MODEL = 'gemini-nano-banana-2.1'

STYLE = open('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/art-tools/summons/style.txt').read().strip()
PREFACE = ("Image 1 is a style reference only: match its painting style, brushwork, lighting, rim light, framing, "
           "background and proportions. The person, the face, the headgear and every ornament must be different from "
           "Image 1 and must follow the description below exactly; do not copy the man, the helm, the horns or the "
           "trim from Image 1.")
# stage B fix pass (critique fix 12): a whole-figure job had only the head-and-shoulders anchor as reference, which
# invites a bust crop. Where the god has a maquette (pt_maquettes.py: its variant 0 in grey clay, full length,
# three-quarter front from a little above, framed as the portrait), it is Image 1 for pose, parts and framing and the
# anchor is Image 2 for the hand.
GODREF = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'refs', 'gods')
PREFACE_BODY_MAQ = ("Image 1 is a grey clay maquette of this figure: follow its pose, its proportions, its parts and its "
                    "framing, the whole figure from head to foot filling the square as it does, seen three-quarter front "
                    "from a little above. Paint over it completely: no grey clay and no plain smooth shapes may remain. "
                    "Image 2 is a style reference only: match its painting style, brushwork, candle lighting, rim light, "
                    "muted colours and dark background. Do not copy its head-and-shoulders framing. The subject, its "
                    "face, its headgear and every ornament must follow the description below exactly; do not copy the "
                    "man, the helm, the horns, the fur or the trim from Image 2.")
PREFACE_BODY = ("Image 1 is a style reference only: match its painting style, brushwork, candle lighting, rim light, "
                "muted colours and dark background. Do not copy its head-and-shoulders framing: this painting shows a "
                "whole figure from head to foot. The subject, its face, its headgear and every ornament must follow the "
                "description below exactly; do not copy the man, the helm, the horns, the fur or the trim from Image 1.")

CLOTH = {
    'cinderHorde': 'dull ember-orange cloth (#C4532C), the Cinder Horde\'s colour',
    # stage B fix pass (critique fix 12): calibration decision 2 words; the review wording (a clear blue-green, as of conifer
    # needles in shade) painted the cloth grey (chroma 0.024 against 0.084). The hue lock gate (sideThornLock) stays.
    'thornwood': 'cloth of a deep bottle green, the green of jade in shade, clearly coloured, never grey, slate, olive or yellow-green (#1F6A50), the Thornwood\'s colour',
}
HUE = {'cinderHorde': 'dull ember-orange (#C4532C), the Cinder Horde\'s colour',
       'thornwood': 'deep bottle green, the green of jade in shade, clearly coloured, never grey, slate, olive or yellow-green (#1F6A50), the Thornwood\'s colour'}
WORD = {'cinderHorde': 'ember-orange', 'thornwood': 'bottle-green'}


def creature_style(creature, crown, glow_rule, colors_rule=None, cut=None, framing_extra=''):
    """The leader template with 'one fantasy war leader' replaced by the creature (as the Salamander and Treant
    sidecars did)."""
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
    if cut:
        reps.append(('the image cut at mid-chest', cut))
    for a, b in reps:
        assert a in s, a
        s = s.replace(a, b)
    if colors_rule:
        a = 'Colors: muted and earthy.'
        assert a in s
        s = s.replace(a, colors_rule)
    if colors_rule and 'side\'s cloth' in colors_rule:
        s = s.replace('No saturated red, orange, green or blue area larger than a thin crack or a small patch.',
                      'Apart from the side\'s cloth, no saturated area larger than a thin crack or a small patch.')
    if framing_extra:
        s = s.replace('with dark empty space above and around the head.',
                      'with dark empty space above and around the head. ' + framing_extra)
    return s


def bust_prompt(style, line, var):
    return f'{PREFACE}\n\n{style}\n\nSubject: {line}\n{var}'


# ---------------------------------------------------------------- creatures (bust)
CRE = []

FS_STYLE = creature_style(
    'one Fire Sprite, a small summoned spirit of living flame (a creature, not a person)', 'flame tips',
    'The sprite is made of flame, so its flame is the one warm, bright colour in the image: painted in oil as dull '
    'smoky orange and deep ember red, brightening only to a small pale-yellow core around the eyes and the mouth; it '
    'lights almost nothing around it, there are no sparks flying across the image and the background stays dark.',
    colors_rule='Colors: muted and earthy outside the flame: the flame is dull and smoky, never neon, never a '
                'photographic glow effect.',
    cut='the flame narrowing below the face into a short wavering tail that fades out near the bottom edge')
FS_STYLE = FS_STYLE.replace('No saturated red, orange, green or blue area larger than a thin crack or a small patch.',
                            'Outside the flame, no saturated red, orange, green or blue area larger than a small patch.')
FS_LINE = ('A Fire Sprite, a flicker of living flame summoned by Cinder Horde mages, with no will of its own: a '
           'head-sized tongue of fire whose flames form a face; no body, no arms, no legs.')
CRE += [
    dict(unit='fireSprite', nation='cinderHorde', face='01', cand='a', style=FS_STYLE, line=FS_LINE, flame=True,
         var='Creature: the face is formed by the flame itself, turned three-quarters toward the right: a rounded '
             'head of fire crowned by five or six tall licking flame tongues that stream upward and back, two dark '
             'hollow eye-holes, deep-set and empty, and a small dark open mouth like a gasp, set in the brighter core; '
             'the outer flames dull ember red, darkening to smoky charcoal at their tips; a thin curl of grey smoke '
             'rises from the tips into the dark; a few dark flakes of char drift at its edges. A blank, wild, '
             'mindless look. Marks: the crown of tall licking flame tongues, the dark hollow eyes, the small open '
             'mouth, the curl of grey smoke.',
         marks=['crown of tall licking flame tongues', 'dark hollow eye-holes', 'small open mouth', 'curl of grey smoke',
                'no body or limbs']),
    dict(unit='fireSprite', nation='cinderHorde', face='01', cand='b', style=FS_STYLE, line=FS_LINE, flame=True,
         var='Creature: the face is formed by the flame itself, turned three-quarters toward the right: a narrow '
             'head of fire whose flames sweep back from the brow like wind-blown hair, two short flame points rising '
             'like small horns above the brow, narrow slanted dark eye-slits and a thin, wide, dark grin, set in the '
             'brighter core; the outer flames deep ember red going to smoky charcoal at their tips; a thin trail of '
             'grey smoke streams back from the flames. A sly, flickering, mindless look. Marks: the swept-back flame '
             'hair, the two small horn-like flame points, the slanted eye-slits, the thin dark grin.',
         marks=['swept-back flame hair', 'two horn-like flame points', 'slanted dark eye-slits', 'thin dark grin',
                'no body or limbs']),
]

HO_STYLE = creature_style(
    'one great hornet of the Thornwood swarms, seen huge and close (a creature, not a person)', 'antennae',
    'Nothing in the image glows; the eyes do not shine.',
    colors_rule='Colors: muted and earthy: dull ochre, umber, charcoal and smoky amber, never bright yellow.',
    cut='the image cut across the thorax, with the folded wings behind it',
    framing_extra='No legs in view.')
HO_LINE = ('A Hornet Swarm, a cloud of stinging hornets summoned by Thornwood druids, shown as one of its hornets '
           'painted as large as a head-and-shoulders portrait: a forest hornet with a heavy armoured head.')
CRE += [
    dict(unit='hornetSwarm', nation='thornwood', face='01', cand='a', style=HO_STYLE, line=HO_LINE,
         var='Creature: a heavy forest hornet, the head turned three-quarters toward the right: large dark '
             'kidney-shaped compound eyes, a broad face plate of dull ochre with a dark anchor-shaped mark, strong '
             'dark mandibles closed, two thick segmented antennae curving up and forward, three small simple eyes in '
             'a triangle on the crown, a thorax furred in dark umber, a pair of smoky translucent amber-brown wings '
             'folded back over the body. A cold, alien, watchful presence. Marks: the dull ochre face plate with its '
             'dark anchor mark, the curving antennae, the three small crown eyes, the folded smoky wings.',
         marks=['dull ochre face plate with a dark anchor mark', 'curving segmented antennae', 'three small crown eyes',
                'closed dark mandibles', 'folded smoky wings']),
    dict(unit='hornetSwarm', nation='thornwood', face='01', cand='b', style=HO_STYLE, line=HO_LINE,
         var='Creature: a lean, dark forest hornet, the head turned three-quarters toward the right: deep umber and '
             'charcoal with narrow dull ochre bands, huge dark compound eyes, the jagged mandibles slightly open, '
             'long antennae swept back over the head, a thorax furred in dark umber, smoky translucent wings with a '
             'torn edge folded behind it. A fierce, alien presence. Marks: the narrow dull ochre bands on the head, '
             'the slightly open jagged mandibles, the swept-back antennae, the torn wing edge.',
         marks=['narrow dull ochre bands', 'open jagged mandibles', 'swept-back antennae', 'torn wing edge']),
]

WO_STYLE = creature_style(
    'one grey wolf of the deep wood, a summoned wolf (a beast, not a person)', 'ears',
    'Nothing in the image glows; the eyes are amber and do not shine or glow.',
    cut='the image cut at the chest')
WO_LINE = 'A Wolf, a grey wolf of the deep wood, summoned by Thornwood druids and the gods of the hunt: wild, with no harness or collar.'
CRE += [
    dict(unit='wolf', nation='common', face='01', cand='a', style=WO_STYLE, line=WO_LINE,
         var='Creature: a lean grey timber wolf in its prime, the head turned three-quarters toward the right, ears '
             'up and forward, a long muzzle, amber eyes, a watchful look, mouth closed; thick grey fur with darker '
             'grey along the brow and the top of the neck, a pale grey-cream muzzle and throat, a heavy ruff of fur '
             'at the neck. Marks: a dark saddle of fur on the nape, a pale blaze on the throat, a notch torn from the '
             'far ear.',
         marks=['dark saddle of fur on the nape', 'pale throat blaze', 'notched ear', 'amber eyes']),
    dict(unit='wolf', nation='common', face='01', cand='b', style=WO_STYLE, line=WO_LINE,
         var='Creature: an old, heavy grey wolf, the head turned three-quarters toward the right, ears half back, the '
             'lips drawn back a little to show one long fang, amber eyes under a heavy brow, a hard look; grizzled '
             'grey fur going pale on the muzzle, a thick shaggy ruff. Marks: the grizzled pale muzzle, a healed scar '
             'across the near eye, one fang showing.',
         marks=['grizzled pale muzzle', 'scar across the near eye', 'one fang showing', 'shaggy ruff']),
]

GI_STYLE = creature_style(
    'one mountain giant (a huge, primitive man of the high mountains, four men tall)', 'hair',
    'Nothing in the image glows.', cut='the image cut at mid-chest')
GI_STYLE = GI_STYLE.replace('One creature only, no people, no riders. No claws, limbs or hands in view,',
                            'One giant only, no other people. No hands, no club raised toward the face,')
GI_LINE = ('A Giant, an independent mountain giant, four men tall, who eats for four and draws every eye and every '
           'blow: a giant, not a man: coarse, heavy, massive features, a neck as thick as the head, weathered skin, '
           'crude hides and stones for clothing; muted greys and tans.')
G1 = ('Person: an old mountain giant, a huge broad brutish face with a heavy jutting brow, a flattened broken nose, '
      'small deep-set pale eyes, a wide mouth with gaps in the teeth, weathered grey-tan skin rough as granite with '
      'pale lichen-grey patches, a bald head with a few long grey wisps, a matted grey beard with small stones and '
      'bone beads knotted into it. Kit: a cloak of stitched goat and bear hides over the shoulders, a rope of knotted '
      'hide across the chest, a necklace of huge animal teeth. Marks: the broken nose, the bald head, the stones '
      'knotted in the grey beard, the necklace of huge teeth.')
G2 = ('Person: a younger mountain giant, a long heavy face with a massive square jaw, a wild mane of matted dark '
      'brown hair and a short rough dark beard, one eye clouded white, a long pale scar from the brow down across the '
      'clouded eye, weathered tan skin. Kit: a rough mantle of grey sheep fleece, a thick crude iron chain worn as a '
      'necklace, a slab of dark slate tied with rope as a shoulder guard. Marks: the clouded eye with its scar, the '
      'wild dark mane, the iron chain, the slate shoulder guard.')
CRE += [
    dict(unit='giant', nation='independent', face='01', cand='a', style=GI_STYLE, line=GI_LINE, var=G1,
         marks=['broken flattened nose', 'bald head with grey wisps', 'stones knotted in the grey beard',
                'necklace of huge teeth', 'hide cloak']),
    dict(unit='giant', nation='independent', face='01', cand='b', style=GI_STYLE, line=GI_LINE, var=G1,
         marks=['broken flattened nose', 'bald head with grey wisps', 'stones knotted in the grey beard',
                'necklace of huge teeth', 'hide cloak']),
    dict(unit='giant', nation='independent', face='02', cand='a', style=GI_STYLE, line=GI_LINE, var=G2,
         marks=['clouded white eye with a scar', 'wild dark mane', 'crude iron chain', 'slate shoulder guard',
                'fleece mantle']),
    dict(unit='giant', nation='independent', face='02', cand='b', style=GI_STYLE, line=GI_LINE, var=G2,
         marks=['clouded white eye with a scar', 'wild dark mane', 'crude iron chain', 'slate shoulder guard',
                'fleece mantle']),
]

OK_STYLE = creature_style(
    'one Oakheart, a sacred warrior of living oak wood (a creature, not a person)', 'thorned helm',
    'Nothing in the image glows; the knot eyes are dark and do not glow.',
    colors_rule=('Colors: muted and earthy, except the side\'s cloth: ' + CLOTH['thornwood'] + ', which shows '
                 'clearly on the shoulders (the mantle), so the card reads as that side at a glance.'))
OK_LINE = ('An Oakheart, a walking oak under thornplate, a sacred warrior of the Thornwood: a broad-shouldered '
           'warrior whose whole body is living oak wood, armoured in grown thornplate; not a tree with a face, but a '
           'warrior made of oak.')
CRE += [
    dict(unit='oakheart', nation='thornwood', face='01', cand='a', style=OK_STYLE, line=OK_LINE, tint=True,
         var='Creature: its head is a block of living oak wood with a face only suggested in the grain, turned '
             'three-quarters toward the right: a heavy brow ridge of bark, two deep dark knotholes for eyes with no '
             'whites, no irises and no eyeballs, a straight split in the wood for a mouth, a jaw of rough brown bark; '
             'small oak twigs with a few lobed oak leaves sprouting at the temples. Thornplate: a helm of dark, '
             'overlapping plates of hard bark bristling with long sharp thorns, grown, not forged; heavy thornplate '
             'pauldrons with thorns along their edges; a mantle of the side\'s cloth over the shoulders and the upper '
             'chest under the pauldrons; a cord of acorns at the throat. Marks: the thorned bark helm, the lobed oak '
             'leaves at the temples, the dark knothole eyes, the thorny pauldrons, the pine-green mantle.',
         marks=['thorned bark helm', 'lobed oak leaves at the temples', 'dark knothole eyes', 'thorny pauldrons',
                'pine-green mantle', 'cord of acorns']),
    dict(unit='oakheart', nation='thornwood', face='01', cand='b', style=OK_STYLE, line=OK_LINE, tint=True,
         var='Creature: an old Oakheart; its head is a block of grey, deeply furrowed oak wood with moss in the '
             'furrows, a face only suggested in the grain, turned three-quarters toward the right: a long crack '
             'running down from the brow across the cheek, two deep dark knotholes for eyes with no whites, no irises '
             'and no eyeballs, a jaw of bark knots. Thornplate: a high helm of dark grown bark plates crowned with a '
             'ring of long curved thorns and a fringe of lobed oak leaves around its rim; heavy thornplate pauldrons; '
             'a mantle of the side\'s cloth over the shoulders under the pauldrons. Marks: the crown of curved thorns '
             'on the helm, the fringe of oak leaves, the crack across the face, the moss in the furrows, the '
             'pine-green mantle.',
         marks=['crown of curved thorns on the helm', 'fringe of oak leaves', 'crack across the face',
                'moss in the furrows', 'pine-green mantle']),
]

# ---------------------------------------------------------------- mounts (head-and-neck bust)
def mount_style(beast, nation, tack_zone):
    s = creature_style(beast, 'ears', 'Nothing in the image glows; the eyes do not shine or glow.',
                       colors_rule=('Colors: muted and earthy, except the side\'s cloth on its tack: '
                                    + CLOTH[nation] + f', which shows clearly at {tack_zone}, so the card reads as '
                                    'that side at a glance.'),
                       cut='the image cut at the base of the neck and the top of the chest, where the tack begins')
    s = s.replace('Head-and-shoulders portrait bust', 'Head-and-neck portrait bust')
    s = s.replace('One creature only, no people, no riders. No claws, limbs or hands in view,',
                  'One beast only, no rider, no people. No hooves, paws or legs in view,')
    return s


AH_STYLE = mount_style('one Ash Horse, a Cinder Horde war mount (a beast, not a person)', 'cinderHorde',
                       'the bottom of the image (the caparison\'s front edge at the withers)')
AH_LINE = ('An Ash Horse of the Cinder Horde, bred to carry, not to fight: a heavy dark ash-grey warhorse in its '
           'battle tack, the mount of the Ash Riders.')
AH_KIT = ('Tack: a plate of dark iron (a chanfron) over the face from the brow to the nose, riveted, with rusted '
          'edges and a short blunt ridge down its middle, the eyes and nostrils left open; a bridle of blackened leather '
          'with iron rings; at the bottom of the image, over the withers and the base of the neck, the front edge of a '
          'cloth caparison of the side\'s dull ember-orange, its hem bordered with a charcoal band. Coat: dark ash-grey '
          'with paler ash dappling on the neck; a thick soot-black mane falling on the near side and a soot-black '
          'forelock over the plate.')
MOUNTS = [
    dict(unit='ashHorse', nation='cinderHorde', face='01', cand='a', style=AH_STYLE, line=AH_LINE, tint=True,
         var='Creature: a heavy, deep-jawed horse\'s head turned three-quarters toward the right, ears pricked forward, '
             'calm dark eyes, nostrils a little flared, an alert look. ' + AH_KIT + ' Marks: the riveted iron face '
             'plate, the soot-black mane and forelock, the ember-orange caparison\'s edge, the iron bridle rings.',
         marks=['riveted iron face plate', 'soot-black mane and forelock', 'ember-orange caparison edge',
                'iron bridle rings', 'ash-grey dappled coat']),
    dict(unit='ashHorse', nation='cinderHorde', face='01', cand='b', style=AH_STYLE, line=AH_LINE, tint=True,
         var='Creature: an older, heavier horse\'s head turned three-quarters toward the right and lowered a little, '
             'ears half back, steady dark eyes, a patient, stubborn look, the muzzle greyer below the plate. ' + AH_KIT
             + ' Marks: the riveted iron face plate, the soot-black mane and forelock, the ember-orange caparison\'s '
             'edge, the iron bridle rings, the grey muzzle.',
         marks=['riveted iron face plate', 'soot-black mane and forelock', 'ember-orange caparison edge',
                'iron bridle rings', 'greyer muzzle']),
]
WW_STYLE = mount_style('one War Wolf, a Thornwood war mount (a beast, not a person)', 'thornwood',
                       'the bottom of the image (the saddle blanket\'s front edge at the shoulders)')
WW_LINE = ('A War Wolf of the Thornwood, a huge timber wolf ridden into battle by the Wolf Riders, its shoulder as '
           'high as a man\'s chest, in its battle harness; the wolf bites as its rider\'s spear strikes.')
WW_KIT = ('Tack: a harness across its chest of overlapping plates of hard dark bark strapped with dark leather; at '
          'the bottom of the image, over the shoulders, the front edge of a saddle blanket of the side\'s deep '
          'pine-green cloth, edged with pale bone-coloured cord.')
MOUNTS += [
    dict(unit='warWolf', nation='thornwood', face='01', cand='a', style=WW_STYLE, line=WW_LINE, tint=True,
         var='Creature: a huge grey timber wolf\'s head and neck turned three-quarters toward the right, ears up and '
             'forward, amber eyes, mouth closed, a steady, loyal, dangerous look; shaggy grey-brown fur, darker along '
             'the brow and the top of the neck, a pale grey muzzle and throat, a thick ruff. ' + WW_KIT + ' Marks: '
             'the bark-plate breast harness, the pine-green saddle blanket\'s edge with its bone cord, the dark fur '
             'along the neck, the pale muzzle.',
         marks=['bark-plate breast harness', 'pine-green saddle blanket edge', 'bone-coloured cord',
                'grey-brown shaggy coat, dark along the neck', 'pale muzzle']),
    dict(unit='warWolf', nation='thornwood', face='01', cand='b', style=WW_STYLE, line=WW_LINE, tint=True,
         var='Creature: a huge dark grey-brown timber wolf\'s head and neck turned three-quarters toward the right, '
             'ears up, amber eyes, the lips drawn back a little from the teeth, a fierce look; a dark grey-brown coat '
             'almost black along the spine, only the muzzle and the throat a lighter grey, a thick shaggy ruff. '
             + WW_KIT + ' Marks: the dark grey-brown coat, the bark-plate breast harness, the pine-green saddle '
             'blanket\'s edge with its bone cord, the bared teeth.',
         marks=['dark grey-brown coat', 'bark-plate breast harness', 'pine-green saddle blanket edge',
                'bone-coloured cord', 'bared teeth']),
]

# ---------------------------------------------------------------- gods (whole body)
GOD_FRAME = ('A full-length painted portrait of {subject}, in a regal pose: {pose}. Three-quarter front view, the '
             'body and the face turned slightly toward the right side of the image. Square image. Framing: the whole '
             'figure fills the height of the square: the top of the {top} about 6% from the top edge and the {foot} '
             'about 94% from the top, centred, with dark empty space around the silhouette. One figure only: no '
             'people, no worshippers, no other creatures, no text, no border, no frame, no signature, no logo.\n'
             'Lighting: a single warm candle key light from the upper left, a dim warm fill, deep warm shadows, and a '
             'thin soft warm rim light along the {rim} that separates the whole silhouette clearly from the '
             'background. Background: plain, unpatterned, very dark warm brown close to #1C1A17, with no objects, no '
             'landscape and no horizon; only a faint soft shadow under the {foot}.\n'
             'Medium: painterly oil on a wood panel, visible brushwork, moderate detail, a strong readable silhouette: '
             'the shape of the {silhouette} against the dark background must still read when the image is shrunk to '
             '64 pixels.\n'
             'Colors: muted and earthy. {tint} {metal}Nothing in the image glows{glow}. No other saturated area larger '
             'than a small clasp or trim.')

GODS = {}


def god(chassis, nations, subject, pose, top, foot, rim, silhouette, tint, desc, marks, metal=True, glow='',
        tint_words=None):
    GODS[chassis] = dict(nations=nations, subject=subject, pose=pose, top=top, foot=foot, rim=rim,
                         silhouette=silhouette, tint=tint, desc=desc, marks=marks, metal=metal, glow=glow,
                         tint_words=tint_words)


GOLD = 'dull old gold (#C9A23E), darkened and worn'
LICHEN = 'lichen grey-green (#909080)'
god('oracle', ['cinderHorde', 'thornwood'],
    'the Oracle of the Flux, a god who sees the shifting currents of magic: a tall, slender, robed seer-god, larger '
    'than a man, floating a hand\'s breadth above the ground',
    'upright and still, head level, the staff held upright in its right hand, the left hand open at its side',
    'cowl', 'floating hem', 'cowl, the shoulders and the staff', 'cowl, the staff and the floating robe',
    'The one clear colour of the figure is its robe and cowl: {CLOTH}.',
    'Headgear: a deep cowl of the robe\'s cloth drawn forward so that it shadows the face; the lower face shows: '
    'ash-grey skin (#8F8C88), a thin calm mouth, a narrow chin; the eyes are lost in the cowl\'s shadow. Body: a '
    'long, flowing robe of {CLOTH} that covers the body from the shoulders to below the feet, with no mantle and no '
    f'cape; runic glyphs embroidered in {LICHEN} thread in a band down the front and around the hem; slender ash-grey '
    'hands. The floating hem: the robe does not touch the ground; its hem drifts and frays into soft, ragged trailing '
    'wisps of cloth a hand above the ground, and no feet show. Staff: a tall straight staff of dark wood whose head '
    f'is a cage of {GOLD} bands holding a smoky dark glass orb.',
    ['deep cowl shadowing the face', 'robe in the nation\'s cloth', 'runic glyph band on the robe',
     'floating ragged hem, no feet', 'gold-caged orb staff'],
    glow=': the orb is dark smoky glass and the glyphs are thread', tint_words='the robe and the cowl')
god('titan', ['cinderHorde', 'thornwood'],
    'the Titan, a giant warrior-god, a strong general in armour, massive and broad',
    'standing tall and still, feet apart, the great sword held point-down in front of it with both hands resting '
    'on the pommel, chin raised',
    'great helm', 'feet', 'great helm, the shoulders and the arms', 'great helm, the broad shoulders and the great sword',
    'The one clear colour of the figure is its long tabard: {CLOTH}.',
    f'Headgear: a great helm of {GOLD}, closed and flat-topped, with a narrow eye slit and small breathing holes, no '
    f'crest, no horns, no crown. Armour: plain heavy plate of {GOLD} over dark mail, with no engraving, no runes and '
    'no device; massive rounded pauldrons; armoured gauntlets and greaves. A long tabard of {CLOTH} hangs from the '
    f'chest to the knees over the armour, its edges trimmed with a narrow {LICHEN} band; no mantle, no cape. '
    'Weapon: a straight two-handed great sword with a plain, broad, straight blade of dark steel and a gold '
    'crossguard. Ash-grey skin (#8F8C88) shows only at the throat.',
    ['closed flat-topped great helm', 'plain gold plate armour', 'tabard in the nation\'s cloth',
     'straight great sword held point-down', 'no cape'], tint_words='the tabard')
god('greatWyrm', ['cinderHorde', 'thornwood'],
    'the Great Wyrm, a colossal winged dragon-god, the monster of the age',
    'standing four-square on the ground, its long neck raised high in an S-curve so that its head is the highest '
    'point, chin lifted, jaws closed, the wings half raised and folded at the elbows behind its shoulders, its long '
    'tail curled forward around its feet',
    'head', 'feet and tail', 'head, the horns, the neck and the wings', 'raised head, the horns, the wings and the tail',
    'The one clear colour of the beast is its wing membranes: {HUE}.',
    'Body: a heavy four-legged dragon with two great wings, a long neck and a long tail; scales of bronze-brown '
    f'(#8A6A3E) crossed by broad darker bands edged with {LICHEN} along the flanks, the neck and the tail; a paler '
    'bronze belly of broad plates; strong clawed feet. Head: a long wedge-shaped head with a heavy jaw, the jaws '
    'closed, dark amber eyes. Horns: two long smooth horns swept straight back from the brow along the line of the '
    'neck; no other horns, no frill, no crown of spines. Wings: smooth, unbroken wing membranes, with no tears and no '
    'ribs showing through, of {HUE}, darker toward their edges, stretched between dark bronze wing bones. Tail: a long '
    'tail ending in a flat spade-shaped tip.',
    ['swept-back horns', 'smooth wing membranes in the nation\'s colour', 'banded bronze scales',
     'spade-tipped tail', 'four legs and two wings'], metal=False,
    glow=': no fire, no smoke, the jaws are closed', tint_words='the wing membranes')
god('livingMonolith', ['cinderHorde', 'thornwood'],
    'the Living Monolith, a god that is a single great standing stone: immobile, ancient and aware',
    'upright and perfectly still', 'slab', 'base', 'top and the edges of the slab', 'tall slab and its rooted base',
    'The one clear colour of the stone is the pigment in its carved glyphs: {HUE}.',
    'Body: one tall, rough-hewn slab of grey granite (#7D7A75), about three times as tall as it is wide and a third as '
    'thick, its edges weathered and chipped, seen three-quarter front so that its broad face and one narrow side '
    'show; no capstone: its top is a plain, flat, broken edge; no moss, no vines, no overgrowth; no face, no eyes, no '
    'carved features. Glyphs: rows of deeply carved runic glyphs running down its broad face, the grooves filled with '
    'a pigment of {HUE}. Base: its foot is rooted in the ground: it rises from a low mound of dark earth and stones, '
    'with thick old roots gripping its base.',
    ['plain broken top, no capstone', 'carved runic glyphs filled with the nation\'s colour', 'no face',
     'no overgrowth', 'root-gripped base'], metal=False, glow=': the glyphs are pigment in carved grooves',
    tint_words='the pigment in the carved glyphs')
god('ascendedHero', ['cinderHorde', 'thornwood'],
    'the Ascended Hero, a mortal champion raised to godhood: a lean warrior a head taller than a man, ageless and noble',
    'standing tall, weight even, chin raised, the sword held upright before the chest in the right hand, the left '
    'hand on the belt',
    'head', 'feet', 'head, the shoulders and the cape', 'circlet, the long cape and the upright sword',
    'The one clear colour of the figure is its long cape: {CLOTH}.',
    f'Headgear: a simple circlet of {GOLD} around the brow, no helm; short dark hair. Face: a lean, calm, ageless '
    'face of ash-grey skin (#8F8C88), steady eyes. Armour: a coat of dark mail under a fitted breastplate of dark '
    'steel trimmed with old gold, plain, with no heraldry and no device; dark leather boots. Mantle: a long cape of '
    f'{{CLOTH}} falling from both shoulders to the heels, its edge bordered with a narrow {LICHEN} band. Weapon: a '
    'straight one-handed sword with a plain straight blade and a gold crossguard.',
    ['gold circlet', 'long cape in the nation\'s cloth', 'plain breastplate, no device', 'straight sword held upright'],
    tint_words='the cape')
god('primordial', ['cinderHorde', 'thornwood'],
    'the Primordial, a colossal ancient beast-god from before the world was young, slow and vast',
    'standing four-square, head lifted high and turned a little toward the right, chest out, the club tail resting on '
    'the ground behind',
    'horns', 'feet', 'horns, the humped back and the moss', 'ram\'s horns, the humped mossy back and the club tail',
    'The one clear colour of the beast is the moss on its back: {MOSS}.',
    'Body: a massive, heavy four-legged beast like a great primeval bull crossed with a giant ground sloth, with a '
    'deep chest, a high humped back and thick pillar legs with blunt claws; its hide is brown (#7A5638), thick and '
    f'wrinkled, mottled with irregular patches of {LICHEN}. Head: a broad, heavy head with small deep-set dark eyes and a '
    'blunt muzzle. Horns: a pair of huge curling ram\'s horns spiralling around the sides of its head. Back: its hump '
    'and spine are overgrown with a thick mantle of moss, {MOSS}. Tail: a short thick tail ending in a heavy bony club.',
    ['huge curling ram\'s horns', 'moss back in the nation\'s colour', 'mottled brown hide', 'club tail'],
    metal=False, tint_words='the moss on its back')
# Cinder realm
god('ashColossus', ['cinderHorde'],
    'the Ash Colossus, a colossal giant of cooled ember and ash that burns whoever strikes it',
    'standing tall and still, feet apart, fists at its sides, the brazier head raised',
    'brazier', 'feet', 'brazier, the shoulders and the arms', 'brazier head, the huge shoulders and the fists',
    'The one clear colour of the figure is its short heavy kilt: {CLOTH}.',
    'Body: a huge, broad-shouldered humanoid body of coal-dark, charred-black ember (#3A2A24), like cooled lava and '
    'charcoal, with a crust of pale ash on the shoulders; a fine net of cracks runs over it, showing only a faint, '
    'dull, deep ember-red in the cracks. Head: in place of a head, an iron brazier set on its shoulders: a squat round '
    f'bowl of blackened iron rimmed with {GOLD}, holding a low bed of dull red coals with a thin wisp of grey smoke and '
    'no tall flames, two dark eye-holes in the bowl\'s front. Shoulders: bare. Fists: bare, heavy and rock-like. '
    f'Cloth: a short heavy kilt of {{CLOTH}} hangs from a belt of {GOLD} chain at its waist to its knees. A few faint '
    'ember specks drift up from its shoulders.',
    ['brazier head with low coals', 'net of vein cracks', 'bare shoulders', 'bare rock-like fists',
     'kilt in the nation\'s cloth', 'drifting ember specks'],
    glow=' except the faint dull ember-red in the cracks and the low dull coals in the brazier; there are no tall '
         'flames', tint_words='the kilt')
god('ashPhoenix', ['cinderHorde'],
    'the Ash Phoenix, an undying firebird-god of ash and ember that rises again after death',
    'perched upright on the ground, its head raised high, its chest out, its great wings spread half open and raised '
    'behind it like fans, its long tail sweeping down to the ground and curling forward',
    'plume crest', 'tail and talons', 'crest, the head and the wings', 'plume crest, the fan-spread wings and the long tail',
    'The one clear colour of the bird is its long flight feathers: {HUE}.',
    'Body: a great bird of prey shaped like an eagle with a long neck; its body feathers are coal-dark, charred '
    'black-brown (#3A2A24), each barred with thin pale ash-grey bars; a hooked beak of ' + GOLD + '; dark eyes; strong '
    'taloned feet of dark grey. Crest: a tall plume crest of long feathers sweeping back from its brow. Wings: broad, '
    'rounded wings spread like fans, the long flight feathers {HUE}, barred with darker bands. Tail: a long tail of '
    'trailing feathers. A faint trail of dull ember specks drifts from the wing tips and the tail.',
    ['tall plume crest', 'fan-spread wings in ember-orange', 'barred coal-dark feathers', 'long trailing tail',
     'gold hooked beak'],
    glow=': there is no flame, no fire and no glow, only a faint trail of dull ember specks', tint_words='the flight feathers')
god('pyreLord', ['cinderHorde'],
    'the Pyre Lord, a towering fire-lord, a god-general who calls up fire spirits; a giant twice a man\'s height',
    'standing tall and still, the glaive held upright beside it in the right hand with its butt on the ground, the '
    'left hand raised a little with the palm open, chin raised',
    'flame crown', 'feet', 'crown, the shoulders and the mantle', 'flame crown, the mantle and the tall glaive',
    'The one clear colour of the figure is its heavy mantle: {CLOTH}.',
    f'Headgear: a flame crown of {GOLD}: a tall crown of gold points shaped like licking flames, with no real fire. '
    'Face: a stern, long, ash-grey face (#8F8C88) with a short black beard and deep-set eyes. Body: dark scale armour '
    f'of blackened iron with rusted edges over a long charcoal robe; stripes of ash in {LICHEN} painted across the '
    'cheeks and the forearms. Mantle: a heavy ember mantle of {CLOTH} over the shoulders, falling to the calves, its '
    'edges singed dark. Weapon: a glaive: a long, straight haft of dark wood with a broad, single-edged, curved blade '
    'of dark steel and a gold collar where the blade meets the haft.',
    ['gold flame crown', 'ember mantle in the nation\'s cloth', 'glaive', 'ash stripes on the face and arms',
     'dark scale armour'], tint_words='the mantle')
god('cinderIdol', ['cinderHorde'],
    'the Cinder Idol, an immobile god of stone and old fire, worshipped with dread',
    'upright and perfectly still', 'brazier and its smoke', 'plinth', 'brazier, the smoke and the shoulders of the idol',
    'brazier face with its column of smoke, the squat body and the stepped plinth',
    'The one clear colour of the stone is the pigment in its carved glyphs: {HUE}.',
    'Body: a massive, squat stone idol of grey granite (#7D7A75) carved like a seated, featureless giant with a broad '
    'chest and no arms, blackened with soot and crossed by cracks crusted with soot. Face: a brazier face: its head is '
    'a great stone bowl carved with a stern face on its front, holding a bed of dull red coals that send up a thin '
    f'column of grey smoke; no tall flames. Metal: a band of {GOLD} around the brazier\'s rim. Base: it sits on a '
    'square, stepped stone plinth. Glyphs: carved glyphs on its chest and on the plinth, their grooves filled with a '
    'pigment of {HUE}.',
    ['brazier face with a carved stern face', 'column of grey smoke', 'soot-crusted cracks', 'stepped plinth',
     'carved glyphs in ember-orange pigment'],
    glow=' except the low dull coals in the brazier; there are no flames', tint_words='the pigment in the carved glyphs')
god('emberHierophant', ['cinderHorde'],
    'the Ember Hierophant, a battle-mage god: a tall, robed high priest of fire, taller than a man',
    'standing tall and still, the staff held upright in the right hand, the left hand raised palm forward at chest height',
    'hood', 'feet', 'hood, the mask, the shoulders and the staff', 'gold mask, the mantle and the orb staff',
    'The one clear colour of the figure is its mantle: {CLOTH}.',
    f'Headgear: a mask: a smooth, expressionless face-mask of {GOLD} covering the whole face, with narrow dark '
    'eye-slits, worn under a hood of charcoal cloth. Body: a long charcoal robe with glyphs embroidered in '
    f'{LICHEN} thread down its front; slender ash-grey hands (#8F8C88). Mantle: an ember mantle of {{CLOTH}} over the '
    'shoulders, falling to the knees, its edges singed. Staff: a tall staff of dark wood whose head is a smoky dark '
    'glass orb held in a gold claw.',
    ['gold face-mask', 'ember mantle in the nation\'s cloth', 'orb staff in a gold claw', 'robe glyphs',
     'charcoal hood'], glow=': the orb is dark smoky glass and the eye-slits are dark', tint_words='the mantle')
# Thornwood realm
god('wildSpirit', ['thornwood'],
    'the Wild Spirit, an elusive god of the deep wood: a great stag-like beast-spirit, hard to catch',
    'standing alert and proud on all four legs, head raised high and turned a little toward the right, one forefoot '
    'lifted',
    'antlers', 'hooves and the trailing wisps', 'antlers, the head, the ruff and the back',
    'branching antlers, the leaf ruff and the long legs',
    'The one clear colour of the beast is its leaf ruff: {HUE}.',
    'Body: a lean, long-legged, deer-like beast the size of a horse, with a wolf\'s deep chest and a long tail; its '
    f'hide is brown (#7A5638) with stripes of {LICHEN} across the flanks and the legs; its outline is soft and a little '
    'misty, as if it is only half there. Head: a long, narrow, deer-like head with dark eyes. Antlers: tall, wide, '
    'branching antlers. Ruff: a thick collar of overlapping leaves around the neck and the chest, the leaves {HUE}. '
    'Wisps: thin pale wisps of mist trail from its legs and its tail.',
    ['tall branching antlers', 'leaf ruff in the nation\'s colour', 'stripes on the flanks and legs',
     'trailing mist wisps'], metal=False, tint_words='the leaf ruff')
god('worldTree', ['thornwood'],
    'the World Tree, an immobile god that is one vast, ancient tree',
    'upright and perfectly still', 'canopy', 'roots', 'canopy and the trunk', 'round canopy, the massive trunk and the roots',
    'The one clear colour of the tree is its leaves: {HUE}.',
    'Body: a vast, ancient tree with a thick, straight, massive trunk of ridged dark oak-brown bark (#6B4A2B) in deep '
    'vertical ridges; no face, no eyes and no carved features anywhere in the trunk. Canopy: a round, dense, '
    'dome-shaped crown of foliage, its leaves {HUE}, lit warm on the upper left; no blossom and no fruit. Roots: huge '
    'roots spread out from the base of the trunk and grip the ground.',
    ['round dome canopy in the nation\'s colour', 'ridged bark', 'faceless trunk', 'spreading roots',
     'no blossom, no fruit'], metal=False, tint_words='the leaves')
god('hornedHunter', ['thornwood'],
    'the Horned Hunter, a towering hunter-god who calls the wolves to the hunt, twice a man\'s height',
    'standing tall and still, the spear held upright beside it in the right hand with its butt on the ground, chin raised',
    'antlers', 'feet', 'antlers, the head, the shoulders and the mantle', 'antlers, the leaf mantle and the tall spear',
    'The one clear colour of the figure is its leaf mantle: {CLOTH}.',
    'Headgear: tall branching antlers growing from its brow. Face: a lean, fierce, bearded face; its skin is a deep '
    f'brown like hide (#7A5638), painted with stripes of {LICHEN} warpaint across the eyes and down the cheeks, the '
    'arms and the chest. Body: a powerful, lean body wearing a kilt and leggings of dark leather. Mantle: a long '
    'mantle of overlapping cloth leaves over the shoulders and down the back, {CLOTH}. Weapon: a tall hunting spear '
    f'with a long leaf-shaped blade of {GOLD} on a dark ash-wood shaft.',
    ['branching antlers', 'leaf mantle in the nation\'s cloth', 'leaf-bladed gold spear', 'stripe warpaint'],
    tint_words='the leaf mantle')
god('elderWyrm', ['thornwood'],
    'the Elder Wyrm, a colossal wingless dragon-god that never flies: slow, vast and regenerating, it tramples '
    'whatever is small',
    'standing four-square on short, powerful legs, its long body and tail curving behind it, its neck raised and its '
    'head held high and level, jaws closed',
    'crown of spines', 'feet and tail', 'spines, the head, the neck and the mossy back',
    'crown of spines, the long mossy back and the club tail',
    'The one clear colour of the beast is the moss along its back: {HUE}.',
    'Body: a long, heavy, low four-legged dragon with no wings at all, a long thick neck and a long heavy tail; '
    'scales of bronze-brown (#8A6A3E) in broad bands, a paler bronze belly of broad plates. Head: a broad, heavy head '
    'with a deep jaw, closed, and dark amber eyes. Horns: a crown of spines: a ring of long sharp spines rising around '
    'the back of the head. Back: a thick mantle of moss grows along its spine from the neck to the tail, {HUE}. Tail: '
    'a heavy tail ending in a bony club. It has no wings.',
    ['crown of spines', 'moss back in the nation\'s colour', 'club tail', 'banded bronze scales', 'no wings'],
    metal=False, glow=': no fire, no smoke, the jaws are closed', tint_words='the moss along its back')
god('motherOfBeasts', ['thornwood'],
    'the Mother of Beasts, a towering mother-goddess of the wild whose wolves gather to her, twice a man\'s height',
    'standing tall and still, the maul resting head-down on the ground beside her, both hands on its haft, chin raised',
    'antler crown', 'feet', 'antler crown, the bear pelt and the shoulders', 'antler crown, the bear-pelt cloak and the maul',
    'The one clear colour of the figure is her long dress: {CLOTH}.',
    'Headgear: an antler crown: short branching antlers set in a band around her brow. Face: the strong, broad, '
    'weathered face of a woman in her prime, her skin a deep brown like hide (#7A5638), long braided dark hair, a '
    f'calm, fierce look; bands of {LICHEN} warpaint across her cheeks. Pelt cloak: a heavy cloak made from a whole '
    'bear pelt over her shoulders and back, the bear\'s head resting on her shoulder. Body: under the cloak, a long '
    'tunic-dress of {CLOTH} with a leather belt. Weapon: a plain, heavy maul: a thick wooden haft with a big plain head '
    f'of dark wood bound with bands of {GOLD}.',
    ['antler crown', 'bear-pelt cloak with the bear\'s head', 'dress in the nation\'s cloth', 'plain gold-banded maul',
     'warpaint bands'], tint_words='the dress')

MOSS = {'cinderHorde': 'crusted with a dull ember-orange lichen (#C4532C), the Cinder Horde\'s colour',
        'thornwood': 'a deep bottle green, the green of jade in shade, clearly coloured, never grey, slate, olive or yellow-green (#1F6A50), the Thornwood\'s colour'}
SWATCH = {  # pretender design B.4, swatch 0 of the family chosen per chassis (recorded in the sidecar)
    'oracle': 'skin ash #8F8C88', 'titan': 'skin ash #8F8C88', 'greatWyrm': 'scale bronze #8A6A3E',
    'livingMonolith': 'stone granite #7D7A75', 'ascendedHero': 'skin ash #8F8C88', 'primordial': 'hide brown #7A5638',
    'ashColossus': 'ember coal #3A2A24', 'ashPhoenix': 'ember coal #3A2A24', 'pyreLord': 'skin ash #8F8C88',
    'cinderIdol': 'stone granite #7D7A75', 'emberHierophant': 'skin ash #8F8C88', 'wildSpirit': 'hide brown #7A5638',
    'worldTree': 'bark oak #6B4A2B', 'hornedHunter': 'hide brown #7A5638', 'elderWyrm': 'scale bronze #8A6A3E',
    'motherOfBeasts': 'hide brown #7A5638'}


def god_prompt(ch, nation, var):
    g = GODS[ch]
    fill = lambda t: (t.replace('{CLOTH}', CLOTH[nation]).replace('{HUE}', HUE[nation]).replace('{MOSS}', MOSS[nation]))
    metal = f'All metal is {GOLD}. ' if g['metal'] else ''
    head = GOD_FRAME.format(subject=g['subject'], pose=g['pose'], top=g['top'], foot=g['foot'], rim=g['rim'],
                            silhouette=g['silhouette'], tint=fill(g['tint']), metal=metal, glow=g['glow'])
    pre = PREFACE_BODY_MAQ if god_maquette(ch) else PREFACE_BODY
    return f"{pre}\n\n{head}\n\nSubject: {fill(g['desc'])}\n{var}"


def god_maquette(ch):
    p = os.path.join(GODREF, f'{ch}.png')
    return os.path.abspath(p) if os.path.exists(p) else None


GOD_VAR = {
    'a': 'Paint it as described, the whole figure clearly in view.',
    'b': 'Paint it as described, the whole figure clearly in view; a little more weathered and ancient in its '
         'surfaces, with a heavier, more imposing stance.',
}

EDIT = ('Image 1 is a finished oil painting. Repaint it exactly as it is: the same figure, the same pose, the same '
        'framing and size in the square, the same candle light, rim light, brushwork and dark background. Change only '
        'one thing: repaint {zone2} (now dull ember-orange) in a deep bottle green, the green of jade in shade (#1F6A50), the '
        'Thornwood\'s colour, clearly coloured, never grey, slate, olive, yellow-green or teal; keep all the painted '
        'shading, folds, texture and highlights of {zone2}. Do not change anything else: not the skin, the gold, the dark '
        'metal, the stone, the scales or the hide, the grey-green trim and glyphs, the face, the eyes or the '
        'background. No text, no border.')


def safe(p):
    bad = re.compile(r'\b(dominions|warhammer|blizzard|diablo|world of warcraft|warcraft|total war|age of wonders|'
                     r'paradox|games workshop|frazetta|rutkowski|artstation|magic: the gathering|wizards of the coast)\b', re.I)
    assert not bad.search(p), bad.search(p).group(0)
    return p


def build():
    os.makedirs(os.path.join(W, 'prompts'), exist_ok=True)
    jobs = []

    def add(job, group, unit, nation, face, cand, kind, prompt, refs, marks, tint=False, flame=False, after=None,
            extra=None):
        pf = os.path.join(W, 'prompts', f'{job}.txt')
        open(pf, 'w').write(safe(prompt))
        jobs.append(dict(job=job, group=group, unit=unit, nation=nation, face=face, cand=cand, kind=kind, model=MODEL,
                         aspect='1:1', promptFile=pf, refs=refs, out=os.path.join(RAW, f'{job}.nb21.png'),
                         marks=marks, tint=tint, flame=flame, after=after, **(extra or {})))

    for c in CRE:
        job = f"{c['unit']}.{c['face']}{c['cand']}"
        add(job, 'creatures', c['unit'], c['nation'], c['face'], c['cand'], 'bust',
            bust_prompt(c['style'], c['line'], c['var']), [ANCHOR], c['marks'], tint=c.get('tint', False),
            flame=c.get('flame', False))
    for c in MOUNTS:
        job = f"{c['unit']}.{c['face']}{c['cand']}"
        add(job, 'mounts', c['unit'], c['nation'], c['face'], c['cand'], 'bust',
            bust_prompt(c['style'], c['line'], c['var']), [ANCHOR], c['marks'], tint=True)
    for ch, g in GODS.items():
        for nation in g['nations']:
            for cand in ('a', 'b'):
                job = f'{ch}-{nation}.01{cand}'
                extra = dict(swatch=SWATCH[ch], metalSwatch='metal gold #C9A23E' if g['metal'] else None,
                             accentSwatch='accent lichen #909080', tintZone=g['tint_words'], pose='regal',
                             variant0=next(i['look'] for i in INV if i['id'] == f'{ch}-{nation}'))
                if nation == 'thornwood' and 'cinderHorde' in g['nations']:
                    src = f'{ch}-cinderHorde.01{cand}'
                    zone = g['tint_words']
                    p = EDIT.format(zone=zone[0].upper() + zone[1:], zone2=zone)
                    add(job, 'gods', ch, nation, '01', cand, 'body', p, [os.path.join(RAW, f'{src}.nb21.png')],
                        g['marks'], tint=True, after=src, extra=dict(extra, route='edit of ' + src))
                else:
                    mq = god_maquette(ch)
                    add(job, 'gods', ch, nation, '01', cand, 'body', god_prompt(ch, nation, GOD_VAR[cand]),
                        [mq, ANCHOR] if mq else [ANCHOR], g['marks'], tint=True,
                        extra=dict(extra, route='new', maquette=mq and os.path.relpath(mq, SB)))
    json.dump(jobs, open(os.path.join(W, 'jobs.json'), 'w'), indent=1)
    return jobs


INV = json.load(open(os.path.join(SB, '..', 'inventory.json')))['items']

if __name__ == '__main__':
    js = build()
    from collections import Counter
    print(len(js), Counter(j['group'] for j in js))
