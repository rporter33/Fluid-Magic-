# The words of the pilot review page: storyboards (art plan 7.3, the pretender-and-magic design C.3), what was built,
# the deviations, the questions. build_pilot.py joins them with the clips, the sheets and the measurements.
# After the art director's critique (units/stage-d/critique.md): the settled timing question and the gallery question are
# gone, every question carries its recommended answer (pre-selected on the page, labelled, clearable), and the brief form
# has its own clip.

TIMING = 'Durations and particle counts: docs/12 S2.10, the owner\'s choice of 2026-10-24 ("Keep the flashier timing").'
PLACEHOLDERS = ('Only Fireball and Entangle are new. Everything else in these clips that looks like magic is still the old '
                'placeholder: the other nine spells (the pale column of the Pyre Priest\'s Bless lands next to Fireballs 1 '
                'and 2; an Ember Dart, a small dot in flight, lands on cast 6\'s archers just after it and on the wolf riders '
                'during Entangle, its impact now a spray of the pilot\'s painted sparks instead of a flat peach disc), the Great '
                'Wyrm\'s breath (flat green discs) and the burning of retaliation hits.')

SPELLS = {
    'fireball': {
        'title': 'Fireball',
        'tags': ['Ember', 'R2, area 5, tier 2', 'burst', 'battle a: the Cinder Magus, 6 casts'],
        'what': 'An orb grows at the Cinder Magus\'s staff under the flame glyph, lobs over the field with its shadow and its '
                'light crossing the ground, and bursts as a low dome among the struck troops. Watch the firelight on the '
                'figures, who is hit (the gold footprints), the wounded flashing orange, the kills thrown and burning, the '
                'dust shockwave, the smoke and the scorch it leaves.',
        'board': {
            'charge': 'The orb grows from 4 to 14 wu at the staff head (E2), 60 embers spiral in, the flame glyph floats '
                      'over the caster, he and his neighbours warm in its light; gold footprints mark the struck troops for '
                      'the last 250 ms.',
            'release': 'A 60 wu ground ring from the caster\'s feet with the flame ring and glyph at its front; 6 wu recoil '
                       '(his cast pose).',
            'travel': 'A lob with a 120 wu apex, a 90 wu rope trail and 20 trailing sparks; the orb\'s shadow crosses the '
                      'ground, its warm light gathering under it as it comes down and warming the figures it passes.',
            'impact': 'A white core for two frames, then the burst (E3) as a low dome sorted among the figures, its six '
                      'frames cross-fading; a dust shockwave out to 140 wu; 40 embers, 30 sparks; the troops within 140 wu '
                      'light up and cast short shadows away from it; the wounded flash orange; kills are thrown 16 to 40 wu '
                      'and burn.',
            'linger': 'Embers rise for 1.5 s, smoke for 2 s, the scorch smoulders with ember chunks for 1.5 s, a 120 wu '
                      'scorch ring decal (E6) stays.',
        },
        'built': [
            'Painted: E2 orb and trail, E3 six-frame burst (frames 4 to 6 repainted without smoke for the art director), '
            'E4 embers, sparks and flame licks, E5 smoke and dust, E6 scorch, G1 flame glyph and ring.',
            'The firelight: each figure in the light gets an added copy of its own painted frame in the light\'s colour, '
            'up to 0.5 at the peak, falling off from the centre, only while the light is on it (the owner\'s "Glow only '
            'during own fire": spell light may light nearby figures; nothing glows at rest).',
            'Fire on the light ground draws twice: its painted body in normal blend and the same frame added as glow; the '
            'burst is sorted with the figures, so the men nearer the camera stand in front of it.',
            'Fire wounds: an orange flash for one frame, 4 sparks and a wisp of smoke, never the white cut-out; under '
            'reduced motion a red tint instead of the flash.',
            'Burning kills char in 0.3 s and carry 2 or 3 painted flames for 1.5 s while they are thrown.',
            'Embers follow the colour grammar: round 3 px dots with 50% size jitter, added, 70% primary #FD6533 and 30% '
            'accent #FFB347 (docs/09\'s palette), rising with an ease-out and a flicker from a hash of the ember and frame.',
            'Who is hit: gold footprint rings over the struck troops (inside a block their feet are hidden by the ranks in '
            'front, so the rings are drawn over the figures); a big body gets a fine ring at its foot radius.',
            'Spread hits: the burst lands at the biggest group of struck troops and fits them (120 to 180 wu); a burning '
            'fragment with its own trail flies to any group standing apart; on a big body the burst opens on its chest.',
            'Sound hooks (data, no audio in the mockup): spell.R.charge, spell.R.release, spell.R.travel, spell.R.burst, '
            'hit.burn per struck troop, spell.R.linger.',
            'Data: one table (45-fx-looks.js, the future content/fx.ts) holds every timing, count and grammar value, and the '
            'fx record { family: burst, scale: 2, duration: 1900 }; change the duration and every beat re-times.',
            'Above 2x the short form plays and the linger is skipped; at most 3 burst or field effects play at once.',
        ],
        'deviations': [
            TIMING,
            'Heat shimmer is left out (the art direction allows it only as a displacement on the effect\'s own container at '
            'High); the scorch smoulders with ember chunks instead. Reduced motion keeps them still.',
            'The light copy sits over the figures in the effects\' air layer (with the glows), not directly over the figures: '
            'the same look for one draw call instead of two. So a figure hidden behind the burst\'s dome or a big body takes no '
            'copy, which would shine through.',
            'The shockwave\'s dust is a pale warm tint: the critique\'s #B8AC98 multiplied the painted grey puffs darker than '
            'the plains, where it disappeared.',
            'The travel\'s light pool fades with the orb\'s height close to an inverse square, not as the critique\'s (1 - h/260): '
            'at that rate it still read as a tan disc far below the orb at the apex. Now only the shadow marks the ground at the '
            'apex, and the light gathers as the orb comes down.',
            'Cast 3 is a brief cast chained after cast 2: its travel is 0.12 s longer so that its impact lands after the one '
            'before (docs/12 S2.7).',
            'The sim\'s area hits can be spread out: one burst at the main group plus burning fragments to the others, where '
            'the storyboard shows one burst.',
            'Ember is additive in the art direction: its particles are; the painted burst, orb, flames and glyph also draw a '
            'normal-blend body under their added glow, because added fire alone washes out on the light plains.',
        ],
        'rec': 'Keep',
        'opts': ['Keep', 'Redo'],
    },
    'entangle': {
        'title': 'Entangle',
        'tags': ['Loam', 'G3, one enemy squad, tier 2', 'curse', 'battle c: the Thornwood druids, 1 cast'],
        'what': 'Earth cracks spread from the druid under the leaf glyph, a heaved furrow runs along the ground to the target '
                'throwing clods, and thorny roots burst up under him; open coils grow to his hips with his legs between '
                'their halves, tendrils anchor his feet and a dashed curse ring takes the place of his commander ring. When '
                'he leaves the field the vines dry, sag and fall and a root scar stays. Matter, not light: normal blend and '
                'no glow. The hold\'s look is redone as the art director recommended (bigger roots, open coils, anchor '
                'tendrils, no doubled ring); the beats are unchanged, so Keep is the recommended call now.',
        'board': {
            'charge': 'Earth cracks spread from the caster (L3): the ground splits under him and five cracks run out; the '
                      'leaf glyph floats over him.',
            'release': 'A full-scene flash of 0.15 in #A6D96A (through the flash limiter), a Loam ground ring and the leaf '
                       'ring with its glyph at the front.',
            'travel': 'A heaved furrow (an L3 rope) runs along the ground to the target; its head throws clods and dust and '
                      'leaves clods along the way.',
            'impact': 'The ground splits under the target; thorny roots (L1) erupt with overshoot; open coils (L2) grow to '
                      'the hips in three stages over 200 ms, a back half behind him and a front half before him; four '
                      'tendrils radiate from his feet; dirt and torn leaves (L4).',
            'linger': 'Held: the lunges are halved (stance), the vines sway, a dashed curse ring in #A6D96A where his '
                      'commander ring was (it dims to 0.3); the card shows "−3 DEF −1 ATT · Entangle · 5 rounds left".',
            'hold': 'The vines hold him; he cannot run (he had already fled when the druids cast).',
            'wither': 'At the end of the hold the vines dry, sag, collapse and fall in 600 ms (L2 withered halves); a root '
                      'scar (L3) stays.',
        },
        'built': [
            'Painted: L1 thorns (3 variants, 4 growth stages), L2 open coils as back and front halves (the re-roll), their '
            'dried and withering halves and the vine strip, L3 heaved furrow, crack head and clods (the re-roll), split '
            'ground and root scars, L4 leaves, G1 leaf glyph and ring.',
            'The furrow and the tendrils are rope meshes; thorns, coils, tendrils and the curse ring are sorted with the '
            'figure they hold (a held block\'s men take all three thorn variants, shrunk to the room between them).',
            'Leaves follow the colour grammar: small leaf shapes about 4 px, spreading along the ground and hugging the row '
            'line with a slow ease-out, normal blend, 70% primary-green (docs/09\'s #00674B) and 30% accent-green.',
            'Data: the fx record { family: shock, scale: 2, duration: 1400 } in the same table.',
            'The ticker line at the impact and the card carry the debuff: −3 DEF −1 ATT for 5 rounds.',
            'Sound hooks (data): spell.G.charge, roots.burst, two vox.effort, expire.soft and spell.G.curse at the wither.',
        ],
        'deviations': [
            TIMING,
            'Battle c ends in round 7 and the curse runs to round 11, so the full 5-round hold cannot be seen here: the vines '
            'wither when the held commander leaves the field (51.75 s), not at expire.',
            'The target in battle c is a lone commander, so the roots grow under one figure, not a block (the gallery shows '
            'a held block).',
            'Thorns (L1) and torn leaves (L4) join the roots: they are on the pilot\'s painted list and make the eruption read '
            'at play zoom.',
            'The "−3 DEF −1 ATT" chip lives on the card and in the ticker (DOM), not as text on the field.',
            'Entangle has no docs/12 short form: at 2x and up its charge halves (0.98 s in all), by the pretender-and-magic '
            'design\'s C.3 rule.',
        ],
        'rec': 'Keep',
        'opts': ['Keep', 'Redo'],
    },
}

PAN = ('At play zoom this clip keeps the battle camera\'s zoom but pans from the caster to the target with the spell, as the 2x '
       'clip does: the cast is longer than the clip\'s frame, and a fixed frame left the target at its edge.')
CLIPS = {
    'fb1': {'spell': 'fireball', 'label': 'Cast 1 · full form, 1.9 s', 'note': 'The first cast of battle a, at 3.9 s: the storyboard\'s full form. The pale column that lands just after it is the old placeholder Bless.'},
    'fb4': {'spell': 'fireball', 'label': 'Cast 4 · brief form, 0.5 s', 'note': 'The Magus\'s fourth cast, at 24.7 s: the brief form that three of his six casts play (docs/12 S2.7), five Wardens struck. ' + PAN},
    'fb6': {'spell': 'fireball', 'label': 'Cast 6 · short form, 4 slain', 'note': 'The last cast, at 47.2 s: the short form; four longbow hunters are thrown and burn. ' + PAN},
    'en': {'spell': 'entangle', 'label': 'The cast · full form, 1.4 s', 'note': 'Battle c at 45.1 s: the druid Hawthen entangles Ishka, the fleeing Ash Chieftain. ' + PAN},
    'enw': {'spell': 'entangle', 'label': 'The wither · 51.75 s', 'note': 'Ishka leaves the field: the vines dry, sag and fall, the root scar stays.'},
}

# the art director's questions (critique, "Questions for the owner"), the recommended answer first; the two settled ones
# (Fireball's timing, decided on 2026-10-24; the gallery's pair tests, which need Thorn Spray and Ember Dart) are gone
QUESTIONS = [
    {'key': 'q:light', 'short': 'Light on the troops', 'q': 'The firelight on the troops',
     'p': 'Each figure in the Fireball\'s light takes its colour, up to 0.5 at the peak, only while the light is on it. Compare the two stills.',
     'opts': ['Right', 'Subtler', 'Stronger'], 'rec': 'Right', 'stills': 'light'},
    {'key': 'q:brief', 'short': 'Brief form', 'q': 'The brief form (0.5 s, from the Magus\'s third cast)',
     'p': 'Watch "Cast 4 · brief form": a short charge and a low lob, then the full burst, smoke and scorch.',
     'opts': ['Keep', 'Longer (0.8 s)'], 'rec': 'Keep'},
    {'key': 'q:foot', 'short': 'Footprints', 'q': 'The gold footprints over the struck troops',
     'p': 'For the last 250 ms before the impact a ring marks each troop the sim chose. Inside a block they are drawn over the figures in front.',
     'opts': ['Keep', 'Under the figures only', 'Drop them'], 'rec': 'Keep'},
    {'key': 'q:shock', 'short': 'Shockwave', 'q': 'The shockwave',
     'p': 'A ring of dust rolling out over the ground to 140 wu with a faint glowing edge (now), or the thin gold ring it replaced.',
     'opts': ['Dust ring', 'Thin gold ring'], 'rec': 'Dust ring'},
    {'key': 'q:flash', 'short': 'Release flash', 'q': 'Entangle\'s green release flash (full scene, 0.15)',
     'p': 'docs/12 asks it for a level 3 spell; it passes the flash limiter and is off under reduced motion.',
     'opts': ['Keep', 'Soft (0.07)', 'Drop it'], 'rec': 'Keep'},
    {'key': 'q:glyph', 'short': 'Mana glyph', 'q': 'The mana glyph over the caster during the charge (docs/12 S2.10)',
     'p': 'The flame over the Magus, the leaf over the druid, then at the front of the release ring.',
     'opts': ['Yes', 'No'], 'rec': 'Yes'},
    {'key': 'q:en-time', 'short': 'Entangle timing', 'q': 'Entangle\'s timing: the 0.29 s furrow and the 0.2 s growth',
     'p': 'Does the furrow\'s run read, and do the roots grow in a beat you can see?', 'opts': ['Right', 'Too slow', 'Too fast'], 'rec': 'Right'},
]
