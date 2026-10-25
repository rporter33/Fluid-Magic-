# Stage B review page: the words. Plain language for the owner; facts from the stage B reports
# (calibration.md, critique.md, the fix report, work/*/summary.json, work/troops/picks.json, work/portraits/jobs.json).

BATTLES = {'a': 'The Wyrm at Callea', 'b': 'The Storm of Haldospire', 'c': 'The Fight in Wickemoss'}

# ------------------------------------------------------------------ 1. portraits (subjects of owner review 1)
GOD_A = 'As the god designer shows it. Default parts: '
GOD_B = 'The same god and parts, older and heavier: more weathered surfaces and a more imposing stance.'
SAME = 'A second painting of the same description: you pick the better one.'

PORTRAIT_GROUPS = [
    {
        'id': 'creatures', 'title': 'Creatures',
        'lead': 'Head-and-shoulders busts framed and lit like your leader portraits, so the card bar stays one family. '
                'A swarm is shown as one hornet, painted large; a sprite as its flame face.',
        'subjects': [
            {'id': 'fireSprite', 'name': 'Fire Sprite', 'tag': 'Cinder Horde summon', 'battles': 'c',
             'what': 'A flicker of living flame summoned by Cinder mages: a head-sized fire whose flames form a face, '
                     'with no body.',
             'a': 'A round head of fire under a crown of tall licking flames; hollow dark eyes, a small open mouth like '
                  'a gasp, a curl of grey smoke. A blank, wild look.',
             'b': 'A narrow head, its flames swept back like wind-blown hair; two small flame horns, slanted eye-slits, '
                  'a thin dark grin. A sly look.'},
            {'id': 'hornetSwarm', 'name': 'Hornet Swarm', 'tag': 'Thornwood summon', 'battles': 'c',
             'what': 'A cloud of stinging forest hornets called by druids; the portrait is one hornet, painted as large '
                     'as a head.',
             'a': 'A heavy hornet: a dull ochre face plate with a dark anchor mark, antennae curving forward, three '
                  'small eyes on the crown, mandibles closed, wings folded.',
             'b': 'A lean, dark hornet: narrow ochre bands, jagged mandibles a little open, antennae swept back, a '
                  'torn wing edge. Fiercer.'},
            {'id': 'wolf', 'name': 'Wolf', 'tag': 'summon', 'battles': '',
             'what': 'A wild grey wolf of the deep wood, summoned by druids and the hunt gods; no harness.',
             'a': 'A lean wolf in its prime, ears forward, mouth closed: a dark saddle of fur on the nape, a pale throat '
                  'blaze, a notch torn from one ear.',
             'b': 'An old, heavy wolf, ears half back, one long fang showing: a grizzled pale muzzle and a healed scar '
                  'across the eye.'},
            {'id': 'giant01', 'name': 'Giant, face 1', 'tag': 'independent monster, four men tall', 'battles': '',
             'what': 'An old mountain giant: a broken flattened nose, a bald head with grey wisps, stones and bone beads '
                     'knotted in a matted grey beard, a hide cloak and a necklace of huge teeth. The Giant gets two '
                     'faces so a squad of four varies.',
             'a': 'The description on the left.', 'b': SAME, 'same': True},
            {'id': 'giant02', 'name': 'Giant, face 2', 'tag': 'independent monster, four men tall', 'battles': '',
             'what': 'A younger giant: one eye clouded white under a long scar, a wild dark mane, a crude iron chain '
                     'for a necklace, a slab of slate tied on as a shoulder guard, a fleece mantle.',
             'a': 'The description on the left.', 'b': SAME, 'same': True},
            {'id': 'oakheart', 'name': 'Oakheart', 'tag': 'Thornwood sacred warrior', 'battles': '',
             'what': 'A walking oak under thornplate: a warrior whose whole body is living oak, armoured in grown '
                     'thorns. Not a tree with a face. It takes the creature reviews, as the plan set out.',
             'a': 'A block of oak for a head, the face only in the grain: dark knothole eyes, oak leaves at the '
                  'temples, a thorned bark helm, thorny pauldrons, a green mantle.',
             'b': 'An old Oakheart: grey, deeply furrowed wood with moss in the furrows, a long crack across the face, '
                  'a high helm crowned with curved thorns and a fringe of oak leaves.'},
        ],
    },
    {
        'id': 'mounts', 'title': 'Mounts',
        'lead': 'Head-and-neck busts in battle tack, the tack in the side’s colour so the bust reads as the unit’s '
                'mount.',
        'subjects': [
            {'id': 'ashHorse', 'name': 'Ash Horse', 'tag': 'Cinder Horde, carries the Ash Riders', 'battles': 'a',
             'what': 'A heavy dark ash-grey warhorse, bred to carry, not to fight: a riveted iron face plate, a '
                     'soot-black mane and forelock, the edge of an ember-orange caparison.',
             'a': 'Alert: ears pricked forward, calm dark eyes, nostrils a little flared.',
             'b': 'Older and heavier: head a little lowered, ears half back, a greyer muzzle. Patient and stubborn.'},
            {'id': 'warWolf', 'name': 'War Wolf', 'tag': 'Thornwood, carries the Wolf Riders', 'battles': 'b, c',
             'what': 'A huge timber wolf, its shoulder as high as a man’s chest, in a breast harness of bark plates, '
                     'with the edge of a green saddle blanket corded in bone.',
             'a': 'Grey-brown, mouth closed, a steady, loyal look: darker fur along the neck, a pale muzzle.',
             'b': 'Dark grey-brown, almost black along the spine, lips drawn back from the teeth. Fierce.'},
        ],
    },
    {
        'id': 'gods', 'title': 'Gods',
        'lead': 'Gods are painted whole, head to foot, as the god designer shows them: three-quarter front, in the regal '
                'pose, wearing the default part in every slot, with the nation’s colour where the design puts it. '
                'The same candle light and dark background as the leaders; the card uses a crop of the head and chest. '
                'For every god, A is the design as it stands and B the same god older and heavier.',
        'subgroups': [
            ('The Cinder Horde’s own gods', [
                {'id': 'ashColossus', 'parts': 'a brazier head, bare shoulders, bare fists, vein cracks, embers', 'name': 'Ash Colossus', 'tag': 'size 5',
                 'what': 'A huge body of charred ember under a crust of ash, a fine net of dull red cracks; an iron '
                         'brazier of low coals for a head, bare shoulders and fists, an orange kilt on a gold chain.'},
                {'id': 'ashPhoenix', 'parts': 'a plume crest, fan-plumage wings, a long tail, barred feathers', 'name': 'Ash Phoenix', 'tag': 'size 3, flies',
                 'what': 'A great bird of prey in charred, ash-barred feathers: a gold beak, a tall plume crest, '
                         'fan-spread ember-orange wings, a long trailing tail.'},
                {'id': 'pyreLord', 'parts': 'a flame crown, an ember mantle, a glaive', 'name': 'Pyre Lord', 'tag': 'size 4',
                 'what': 'A stern ash-grey lord in a gold flame crown, dark scale armour and a singed ember-orange '
                         'mantle, holding a glaive.'},
                {'id': 'cinderIdol', 'parts': 'a brazier face, a plinth, soot and crack veins, smoke', 'name': 'Cinder Idol', 'tag': 'size 6, does not move',
                 'what': 'A squat, armless stone idol on a stepped plinth; its head a brazier bowl carved with a stern '
                         'face, smoke rising; glyphs filled with orange.'},
                {'id': 'emberHierophant', 'parts': 'a mask, an ember mantle, an orb staff head', 'name': 'Ember Hierophant', 'tag': 'size 2',
                 'what': 'A priest-god in a smooth gold face-mask under a charcoal hood, an ember-orange mantle, a '
                         'staff with a dark glass orb in a gold claw.'},
            ]),
            ('Thornwood’s own gods', [
                {'id': 'wildSpirit', 'parts': 'antlers, a leaf ruff, wisps, stripes; the game adds a flicker', 'name': 'Wild Spirit', 'tag': 'size 2',
                 'what': 'A lean, deer-like beast the size of a horse, only half there: tall branching antlers, a ruff '
                         'of green leaves, stripes on the flanks, mist trailing from its legs.'},
                {'id': 'worldTree', 'parts': 'a round canopy, no face on the trunk, ridged bark, roots', 'name': 'World Tree', 'tag': 'size 6, does not move',
                 'what': 'A vast ancient oak: a round green crown, deeply ridged bark, huge roots. No face anywhere.'},
                {'id': 'hornedHunter', 'parts': 'antlers, a leaf mantle, a leaf-bladed spear, stripe warpaint', 'name': 'Horned Hunter', 'tag': 'size 4',
                 'what': 'A fierce bearded hunter-god with tall antlers and stripe warpaint, a mantle of green cloth '
                         'leaves, a spear with a long gold leaf blade.'},
                {'id': 'elderWyrm', 'parts': 'a crown of spines, a moss back, a club tail, no wings', 'name': 'Elder Wyrm', 'tag': 'size 6',
                 'what': 'A long, heavy dragon with no wings: a crown of spines, green moss along its back, a club '
                         'tail.'},
                {'id': 'motherOfBeasts', 'parts': 'a bear-pelt cloak, an antler crown, a plain maul', 'name': 'Mother of Beasts', 'tag': 'size 4',
                 'what': 'A strong woman in her prime with an antler crown, a whole bear pelt for a cloak (its head on '
                         'her shoulder), a green dress and a plain heavy maul.'},
            ]),
            ('Gods either nation can take', [
                {'id': 'oracle', 'parts': 'a cowl, no mantle, an orb staff head, glyphs on the robe, a floating hem', 'name': 'Oracle of the Flux', 'tag': 'size 2', 'both': True,
                 'what': 'A robed seer floating a hand above the ground: a deep cowl hiding the eyes, glyphs down the '
                         'robe, a staff with a smoky glass orb in gold bands.'},
                {'id': 'titan', 'parts': 'a great helm, no mantle, a straight great sword', 'name': 'Titan', 'tag': 'size 4', 'both': True,
                 'what': 'A giant knight-god: a closed, flat-topped great helm and plain plate of old gold, a tabard in '
                         'the nation’s colour, a great sword held point-down.'},
                {'id': 'greatWyrm', 'parts': 'swept horns, smooth wing membranes, a spade tail, banded scales, wings', 'name': 'Great Wyrm', 'tag': 'size 6, flies', 'both': True, 'battles': 'a',
                 'what': 'A four-legged winged dragon: two horns swept straight back, banded bronze scales, wings in '
                         'the nation’s colour, a spade-tipped tail. Thornwood’s god in battle a.'},
                {'id': 'livingMonolith', 'parts': 'no capstone, no overgrowth, no face; runic glyphs; a rooted base', 'name': 'Living Monolith', 'tag': 'size 6, does not move', 'both': True,
                 'what': 'A tall, rough granite slab rooted in the earth: a broken top, no face, rows of carved glyphs '
                         'filled with the nation’s colour.'},
                {'id': 'ascendedHero', 'parts': 'a circlet, a long cape, a straight blade', 'name': 'Ascended Hero', 'tag': 'size 2', 'both': True,
                 'what': 'A calm, ageless hero: a gold circlet, a plain breastplate, a long cape in the nation’s '
                         'colour, a straight sword.'},
                {'id': 'primordial', 'parts': "ram's horns, a moss back, a club tail, a mottled hide", 'name': 'Primordial', 'tag': 'size 6', 'both': True,
                 'what': 'A massive primeval beast, part bull, part giant sloth: huge curling ram’s horns, a mottled '
                         'hide, a moss back, a club tail.'},
            ]),
        ],
    },
]

# ------------------------------------------------------------------ 2. troops
TROOPS = [
    # id, name, nation, battles, kind
    ('cinderWarrior', 'Cinder Warrior', 'cinderHorde', 'a, b, c', 'line infantry'),
    ('ashMilitia', 'Ash Militia', 'cinderHorde', 'a, b', 'levy spears'),
    ('flameArcher', 'Flame Archer', 'cinderHorde', 'a, b, c', 'archers'),
    ('emberSkirmisher', 'Ember Skirmisher', 'cinderHorde', 'a, c', 'javelin throwers'),
    ('flamebrand', 'Flamebrand', 'cinderHorde', 'c', 'shock infantry'),
    ('berserker', 'Berserker', 'cinderHorde', 'a', 'shock infantry, never routs'),
    ('warden', 'Warden', 'thornwood', 'a, b, c', 'line infantry'),
    ('thornMilitia', 'Thorn Militia', 'thornwood', 'b', 'levy spears'),
    ('longbowHunter', 'Longbow Hunter', 'thornwood', 'a, b, c', 'archers'),
    ('briarGuard', 'Briar Guard', 'thornwood', 'a, b', 'heavy infantry'),
    ('lightInfantry', 'Light Infantry', 'independent', '', 'light infantry'),
    ('heavyInfantry', 'Heavy Infantry', 'independent', '', 'heavy infantry'),
    ('archer', 'Archer', 'independent', '', 'archers'),
    ('swampFighter', 'Swamp Fighter', 'independent', '', 'swamp skirmishers'),
]

# per view: (ok, plain note). ok: True = passes every check; False = kept with a flaw.
TROOP_NOTES = {
    ('emberSkirmisher', 'back'): (False, '10 of 15 poses at the battle camera, and a little dark on swamp ground. The '
                                         'green cast on the javelins is gone.'),
    ('berserker', 'back'): (False, '8 of 15 poses at the battle camera, and from behind he reads grey. A fix is queued: '
                                   'an orange kilt and a sash.'),
    ('berserker', 'front'): (False, 'The side’s orange covers 27% of him at play zoom; we aim for 30%. The same '
                                    'kilt-and-sash fix is queued.'),
    ('flamebrand', 'back'): (False, '11 of 15 poses at the battle camera (follow-through, falling, both dead poses).'),
    ('thornMilitia', 'front'): (False, 'Two poses are a different shade from the rest. A fix is queued.'),
    ('briarGuard', 'back'): (False, '11 of 15 poses at the battle camera (follow-through, brace, both dead poses).'),
    ('briarGuard', 'front'): (True, 'Passes, but its green is faint far away (23%). A surcoat fix is queued.'),
    ('longbowHunter', 'back'): (True, 'Passes; one pose (wind-up) is a shade off.'),
    ('longbowHunter', 'front'): (False, 'Six tries never held the battle camera in more than 11 of 15 poses (the very '
                                        'tall bow); the kept sheet has 9. A fix is queued: the Flame Archer’s sheet '
                                        'repainted as a Longbow Hunter.'),
    ('heavyInfantry', 'back'): (False, '12 of 15 poses at the battle camera (hit, both dead poses).'),
}

POSE_NAMES = {'stand': 'stand', 'idle2': 'at ease', 'marchA': 'step', 'marchB': 'step', 'windup': 'wind-up',
              'strike': 'strike', 'follow': 'follow-through', 'brace': 'brace', 'recoil': 'hit', 'fall': 'falling',
              'deadA': 'dead', 'deadB': 'dead', 'fleeA': 'flee', 'fleeB': 'flee', 'cheer': 'cheer',
              'dropped': 'dropped arms', 'nock': 'nock', 'draw': 'draw', 'loose': 'loose', 'runA': 'run', 'runB': 'run',
              'aim': 'aim', 'throw': 'throw'}

# ------------------------------------------------------------------ 3. commanders
CMD_KINDS = [
    # unit, label, nation, batch, faces, prefix, variety note
    ('ashChieftain', 'Ash Chieftain', 'cinderHorde', 'cmdA', 8, 'ac',
     'All eight share one armoured body, one axe and one rally; the helm, beard and mantle are each face’s own. '
     'Planned for the next pass: each chieftain his own axe (bearded, double-bitted, long-hafted great axe, back-spiked, '
     'crescent, hooked, cleaver), with 06 keeping his.'),
    ('pyrePriest', 'Pyre Priest', 'cinderHorde', 'cmdA', 8, 'pp',
     'One robed body for all eight. Planned: each priest his own brazier-staff (fork, censer on a hook, spiked bowl, '
     'iron fist, chimney, crossbar, flame ring), and a cloak or fur collar where the portrait leaves it free.'),
    ('emberAdept', 'Ember Adept', 'cinderHorde', 'cmdA', 8, 'ea',
     'One robed body for all eight. Planned: each adept his own staff head (iron ring, charred wrap, fork, crook, '
     'carved flame, spike, wire coil).'),
    ('cinderMagus', 'Cinder Magus', 'cinderHorde', 'cmdA', 8, 'cm',
     'One robed body for all eight. Planned: each magus his own staff crown (four prongs, hooked cage, lantern, '
     'spiral, twisted horns, ring, spike).'),
    ('cinderScout', 'Scout (Cinder Horde)', 'cinderHorde', 'cmdA', 8, 'cs',
     'One body and one long knife for all eight; each figure\u2019s face, headgear and cloak follow its portrait.'),
    ('independentCaptain-hunter', 'Independent Captain, hunter', 'independent', 'cmdA', 12, 'hu',
     'One body for all twelve; each figure\u2019s face, headgear and cloak follow its portrait.'),
    ('independentCaptain-levy', 'Independent Captain, levy', 'independent', 'cmdA', 12, 'lv',
     'One body for all twelve; each figure\u2019s face, headgear and cloak follow its portrait.'),
    ('elderDruid', 'Elder Druid', 'thornwood', 'cmdB', 8, 'ed',
     'Only 05 and 08 are painted, front view only; the other six wait on picture credits. Planned: each druid his own '
     'staff (antler fork, oak sprig, spiral, root knot, birch).'),
]

NOT_PAINTED_KINDS = [
    ('Warden Captain', 'thornwood', 8), ('Grove Priest', 'thornwood', 8), ('Sapling Druid', 'thornwood', 8),
    ('Scout (Thornwood)', 'thornwood', 8), ('Elder Druid', 'thornwood', '6 more'),
    ('Independent Captain, mountaineer', 'independent', 12), ('Independent Captain, reedman', 'independent', 12),
]

UNIT_NAMES = {'wardenCaptain': 'Warden Captain', 'saplingDruid': 'Sapling Druid', 'grovePriest': 'Grove Priest',
              'elderDruid': 'Elder Druid', 'ashChieftain': 'Ash Chieftain', 'pyrePriest': 'Pyre Priest',
              'emberAdept': 'Ember Adept', 'cinderMagus': 'Cinder Magus'}
