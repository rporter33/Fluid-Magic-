# The words of the pilot review page: storyboards (art plan 7.3, the pretender-and-magic design C.3), what was built,
# the deviations, the questions. build_pilot.py joins them with the clips, the sheets and the measurements.

SPELLS = {
    'fireball': {
        'title': 'Fireball',
        'tags': ['Ember', 'R2, area 5, tier 2', 'burst', 'battle a: the Cinder Magus, 6 casts'],
        'what': 'An orb grows at the Cinder Magus\'s staff, lobs over the field with its shadow and its light crossing the '
                'ground, and bursts as a low dome among the struck troops. Watch the light on the figures, who is hit '
                '(the gold footprints), the kills thrown and burning out, the smoke and the scorch it leaves.',
        'board': {
            'charge': 'The orb grows from 4 to 14 wu at the staff head (E2), 60 embers spiral in, the caster and his '
                      'neighbours tint warm; gold footprint ellipses mark the 5 struck troops for the last 250 ms.',
            'release': 'A 60 wu ground ring from the caster\'s feet; 6 wu recoil (his cast pose).',
            'travel': 'A lob with a 120 wu apex, a 90 wu rope trail and 20 trailing sparks; the orb\'s shadow crosses the '
                      'ground and a moving light pool under it brightens the figures it passes.',
            'impact': 'A white core for two frames, then the burst (E3) as a low dome, sorted among the figures; an '
                      'expanding ground ellipse of radius 140 wu; 40 embers, 30 sparks; figures within 140 wu tint warm '
                      'and get a short shadow pushed from the centre; kills are thrown 16 to 40 wu and burn out.',
            'linger': 'Embers rise for 1.5 s, smoke for 2 s, the scorch glows for 1.5 s, a 120 wu scorch ring decal (E6) '
                      'stays.',
        },
        'built': [
            'Painted: E2 orb and trail, E3 six-frame burst (the re-roll), E4 embers and sparks, E5 smoke, E6 scorch.',
            'Fire on the light ground draws twice: its painted body in normal blend and the same frame added as glow; the '
            'burst is sorted with the figures, so the men nearer the camera stand in front of it.',
            'Embers follow the new colour grammar: round 3 px dots with 50% size jitter, added, 70% primary #D9442B and 30% '
            'accent #FFB347, rising with an ease-out and a flicker drawn from a hash of the ember and the story frame.',
            'Light: additive pools on the ground, a warm tint on the figures (up to 35%) and a short shadow pushed away from '
            'the blast; the figures themselves carry no glow.',
            'Who is hit: gold footprint rings over the struck troops (inside a block their feet are hidden by the ranks '
            'in front, so the rings are drawn over the figures).',
            'Spread hits: the burst lands at the biggest group of struck troops; a burning fragment flies to any group '
            'standing apart (casts 2, 3 and 6).',
            'Sound hooks (data, no audio in the mockup): spell.R.charge, spell.R.release, spell.R.travel, '
            'spell.R.burst, hit.burn per struck troop, spell.R.linger.',
            'Data: one table (45-fx-looks.js, the future content/fx.ts) holds every timing, count and grammar value, and '
            'the fx record { family: burst, scale: 2, duration: 1900 }; change the duration and every beat re-times.',
            'Above 2x the short form plays and the linger is skipped; at most 3 burst or field effects play at once.',
        ],
        'deviations': [
            'Durations follow docs/12 (1.9 s full, 1.3 s short); the new art direction caps an effect at 0.9 s at scale 1. '
            'Kept for now while the owner decides; one number in the data table changes it (try Short timing in the '
            'gallery).',
            'Heat shimmer is left out (the new art direction allows it only as a displacement on the effect\'s own '
            'container at High); the scorch glows and flickers for 1.5 s instead. Reduced motion drops it, as designed.',
            'The shockwave is the expanding ground ellipse (the design\'s fallback below High).',
            'Cast 3 is a brief cast chained after cast 2: its travel is 0.12 s longer so that its impact lands after '
            'the one before (docs/12 S2.7).',
            'The sim\'s area hits can be spread out: one burst at the main group plus burning fragments to the others, '
            'where the storyboard shows one burst.',
            'The new art direction makes Ember additive: its particles are; the painted burst and orb also draw a normal-blend '
            'body under their added glow, because added fire alone washes out on the light plains.',
            'Particle counts follow docs/12 (up to 150 for this tier) rather than the new family table\'s 12 to 40 at scale 1.',
        ],
    },
    'entangle': {
        'title': 'Entangle',
        'tags': ['Loam', 'G3, one enemy squad, tier 2', 'curse', 'battle c: the Thornwood druids, 1 cast'],
        'what': 'Earth cracks spread from the druid, a crack runs along the ground to the target and roots burst up '
                'under him, coil to his knees and hold him; when he leaves the field the vines brown and fall and a '
                'root scar stays. Matter, not light: normal blend and no glow.',
        'board': {
            'charge': 'Earth cracks spread from the caster (L3): the ground splits under him and five cracks run out.',
            'release': 'A full-scene flash of 0.15 in #A6D96A (through the flash limiter) and a Loam ground ring.',
            'travel': 'A crack (an L3 rope) runs along the ground to the target, raising dust.',
            'impact': 'The ground splits under the target; thorny roots (L1) erupt with overshoot and roots (L2) coil to '
                      'the knees in three growth stages over 200 ms; dirt and torn leaves (L4).',
            'linger': 'Held: the lunges are halved (stance), the vines sway, a dashed curse ring in #A6D96A; the card '
                      'shows "\u22123 DEF \u22121 ATT · Entangle · 5 rounds left".',
            'hold': 'The vines hold him; he cannot run (he had already fled when the druids cast).',
            'wither': 'At the end of the hold the vines brown and fall in 600 ms (L2 withered); a root scar (L3) stays.',
        },
        'built': [
            'Painted: L1 thorns (3 variants, 4 growth stages), L2 coils and withered coils and the vine strip, L3 crack '
            'strips, split ground and root scars, L4 leaves and petals.',
            'The crack and the runners are rope meshes revealed along their length; thorns and coils are sorted with '
            'the figure they hold (a held block\'s thorns shrink to the room between its men, under one dashed ring).',
            'Leaves follow the new colour grammar: small leaf shapes about 4 px, spreading outward along the ground and '
            'hugging the row line with a slow ease-out, normal blend, 70% primary-green and 30% accent-green leaves.',
            'Data: the fx record { family: shock, scale: 2, duration: 1400 } in the same table.',
            'The ticker line at the impact and the card carry the debuff: \u22123 DEF \u22121 ATT for 5 rounds.',
            'Sound hooks (data): spell.G.charge, roots.burst, two vox.effort, expire.soft and spell.G.curse at the '
            'wither.',
        ],
        'deviations': [
            'Battle c ends in round 7 and the curse runs to round 11, so the full 5-round hold cannot be seen here: the '
            'vines wither when the held commander leaves the field (51.75 s), not at expire.',
            'The target in battle c is a lone commander, so the roots grow under one figure, not a block.',
            'Thorns (L1) and torn leaves (L4) join the roots: they are on the pilot\'s painted list and make the '
            'eruption read at play zoom.',
            'The "\u22123 DEF \u22121 ATT" chip lives on the card and in the ticker (DOM), not as text on the field.',
            'Durations follow docs/12 (1.4 s); the new art direction caps a shock at 0.9 s at scale 1 (one number in the '
            'data table).',
        ],
    },
}

CLIPS = {
    'fb1': {'spell': 'fireball', 'label': 'Cast 1 · full form, 1.9 s', 'note': 'The first cast of battle a, at 3.9 s: the storyboard\'s full form.'},
    'fb6': {'spell': 'fireball', 'label': 'Cast 6 · short form, 4 slain', 'note': 'The last cast, at 47.2 s: the short form; four archers are thrown and burn out.'},
    'en': {'spell': 'entangle', 'label': 'The cast · full form, 1.4 s', 'note': 'Battle c at 45.1 s: the druid Hawthen entangles Ishka, the fleeing Ash Chieftain.'},
    'enw': {'spell': 'entangle', 'label': 'The wither · 51.75 s', 'note': 'Ishka leaves the field: the vines brown and fall, the root scar stays.'},
}

QUESTIONS = [
    {'key': 'q:fb-time', 'short': 'Fireball timing', 'q': 'Fireball\'s timing: the 0.55 s lob and the 0.46 s burst',
     'p': 'Watch cast 1 at 1x, and the gallery with Short timing off and on (1.9 s against 1.3 s; the new art direction asks for 0.9 s). Is the lob too slow to follow the fight, or too quick to read?', 'opts': ['Right', 'Too slow', 'Too fast']},
    {'key': 'q:fb-bright', 'short': 'Fireball brightness', 'q': 'Fireball\'s brightness: the burst and its light on the troops',
     'p': 'On the light plains the fire draws as paint plus glow. Is the burst and the warm light on the figures right?', 'opts': ['Right', 'Too bright', 'Too dim']},
    {'key': 'q:fb-foot', 'short': 'Footprints', 'q': 'The gold footprints over the struck troops',
     'p': 'For the last 250 ms before the impact a ring marks each troop the sim chose. Inside a block they are drawn over the figures in front.', 'opts': ['Keep', 'Under the figures only', 'Drop them']},
    {'key': 'q:en-time', 'short': 'Entangle timing', 'q': 'Entangle\'s timing: the 0.29 s crack and the 0.2 s growth',
     'p': 'Does the crack\'s run read, and do the roots grow in a beat you can see?', 'opts': ['Right', 'Too slow', 'Too fast']},
    {'key': 'q:en-read', 'short': 'Entangle at play zoom', 'q': 'Entangle at play zoom',
     'p': 'Matter, not light: does the held commander read as held at the normal camera?', 'opts': ['Reads', 'Too faint', 'Too heavy']},
    {'key': 'q:gallery', 'short': 'Gallery tests', 'q': 'The gallery\'s readability tests',
     'p': 'With the sprites hidden, and then with the colour removed, do Fireball and Entangle still read apart?', 'opts': ['Both pass', 'Sprites hidden fails', 'Colour removed fails']},
    {'key': 'q:en-flash', 'short': 'Release flash', 'q': 'Entangle\'s green release flash (0.15)',
     'p': 'A full-scene flash in #A6D96A at the release, limited and off under reduced motion.', 'opts': ['Keep', 'Softer', 'Drop it']},
]
