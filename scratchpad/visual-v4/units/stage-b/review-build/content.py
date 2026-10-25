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
             'b': 'A narrow head, its flames swept back like wind-blown hair; two small flame horns, narrow eye-slits, '
                  'a mouth that is only a ragged gap in the flame, open as if roaring; no grin. A wild look.'},
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
                     'for a necklace, a slab of slate tied on as a shoulder guard, a fleece mantle. Its two paintings came '
                     'out nearly alike, so either will do.',
             'a': 'The description on the left.', 'b': SAME, 'same': True},
            {'id': 'oakheart', 'name': 'Oakheart', 'tag': 'Thornwood sacred warrior', 'battles': '',
             'what': 'A walking oak under thornplate: a warrior whose whole body is living oak, armoured in grown '
                     'thorns. Not a tree with a face. It takes the creature reviews, as the plan set out.',
             'a': 'A block of oak for a head, the face only in the grain: dark knothole eyes, no nose and no beard, '
                  'the wood below the eyes one split block like a war mask; oak leaves at the temples, a thorned bark '
                  'helm, thorny pauldrons, a green mantle.',
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
                 'what': 'A tall, upright granite slab with no arms or legs, standing on a stepped plinth, as its battle '
                         'figure stands: a stern face carved flat into the upper front, coals glowing low in its eyes and '
                         'mouth, a brazier of coals hollowed into the top with a short wisp of smoke; glyphs filled with '
                         'orange.'},
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
                 'what': 'A long, heavy, low-slung dragon with no wings, built like a giant salamander and crawling low '
                         'as its battle figure will: a crown of spines, green moss along its back, a club tail.'},
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
                 'what': 'A massive primeval beast, part bull, part giant sloth, its great bull’s head carried low and '
                         'forward like a bison’s: huge ridged ram’s horns framing the face, a shaggy beard, a mottled hide, '
                         'a moss back, a studded club tail.'},
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
    ('emberSkirmisher', 'back'): (False, '10 of 15 poses at the battle camera (the follow-through, falling and dead poses), '
                                         'and a little dark on swamp ground. The green cast on the javelins is gone.'),
    ('berserker', 'back'): (False, '8 of 15 poses at the battle camera; the misses are the swing, follow-through, dead '
                                   'and flee poses. Standing and marching read right.'),
    ('thornMilitia', 'front'): (False, 'Two poses are a different shade from the rest; 13 of 15 poses at the battle camera.'),
    ('longbowHunter', 'back'): (False, 'One pose (the cheer) is a shade off; 13 of 15 poses at the battle camera.'),
    ('longbowHunter', 'front'): (False, '9 of 15 poses at the battle camera (the very tall bow); every re-paint did '
                                        'worse. Standing, marching and loosing read right.'),
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
     'The five chieftains in the battles (01, 02, 03, 05 and 06) each carry their own axe and kit; the other three share '
     'the kind’s armoured body and axe, with their own helm, horns, beard and mantle from the portrait.'),
    ('pyrePriest', 'Pyre Priest', 'cinderHorde', 'cmdA', 8, 'pp',
     'Pyre Priest 06, in battle b, carries his own brazier-staff; the others share one robed body and staff, with their '
     'own face, hood and mantle from the portrait.'),
    ('emberAdept', 'Ember Adept', 'cinderHorde', 'cmdA', 8, 'ea', 'One robed body and one staff for all eight; each face, hood and mantle follow its portrait.'),
    ('cinderMagus', 'Cinder Magus', 'cinderHorde', 'cmdA', 8, 'cm', 'One robed body and one staff for all eight; each face, hood and mantle follow its portrait.'),
    ('cinderScout', 'Scout (Cinder Horde)', 'cinderHorde', 'cmdA', 8, 'cs',
     'One body and one long knife for all eight; each figure\u2019s face, headgear and cloak follow its portrait.'),
    ('independentCaptain-hunter', 'Independent Captain, hunter', 'independent', 'cmdA', 12, 'hu',
     'One body for all twelve; each figure\u2019s face, headgear and cloak follow its portrait.'),
    ('independentCaptain-levy', 'Independent Captain, levy', 'independent', 'cmdA', 12, 'lv',
     'One body for all twelve; each figure\u2019s face, headgear and cloak follow its portrait.'),
    ('wardenCaptain', 'Warden Captain', 'thornwood', 'cmdB', 8, 'wc',
     'One body for all eight, each with his own sword, helm and cloak from the portrait. Warden Captain 07 now shows his '
     'bark-scale back plates and fern collar from behind, so he no longer looks like 05\u2019s twin.'),
    ('grovePriest', 'Grove Priest', 'thornwood', 'cmdB', 8, 'gp',
     'One robed body for all eight, each with his own staff, crown and mantle from the portrait.'),
    ('saplingDruid', 'Sapling Druid', 'thornwood', 'cmdB', 8, 'sd',
     'One body for all eight, each with her or his own staff and dress from the portrait.'),
    ('elderDruid', 'Elder Druid', 'thornwood', 'cmdB', 8, 'ed',
     'One hooded body for all eight, each with his own staff (antler fork, oak sprig, spiral, root knot, birch) and the '
     'marks of his portrait.'),
    ('thornScout', 'Scout (Thornwood)', 'thornwood', 'cmdB', 8, 'ts',
     'One body for all eight; each figure\u2019s hood, face and kit follow its portrait.'),
    ('independentCaptain-mountaineer', 'Independent Captain, mountaineer', 'independent', 'cmdB', 12, 'mt',
     'One body for all twelve; each figure\u2019s face, headgear and cloak follow its portrait.'),
    ('independentCaptain-reedman', 'Independent Captain, reedman', 'independent', 'cmdB', 12, 'rd',
     'One body for all twelve; each figure\u2019s face, headgear and cloak follow its portrait.'),
]

NOT_PAINTED_KINDS = [
    ('Warden Captain', 'thornwood', 8), ('Grove Priest', 'thornwood', 8), ('Sapling Druid', 'thornwood', 8),
    ('Scout (Thornwood)', 'thornwood', 8), ('Elder Druid', 'thornwood', '6 more'),
    ('Independent Captain, mountaineer', 'independent', 12), ('Independent Captain, reedman', 'independent', 12),
]

UNIT_NAMES = {'wardenCaptain': 'Warden Captain', 'saplingDruid': 'Sapling Druid', 'grovePriest': 'Grove Priest',
              'elderDruid': 'Elder Druid', 'ashChieftain': 'Ash Chieftain', 'pyrePriest': 'Pyre Priest',
              'emberAdept': 'Ember Adept', 'cinderMagus': 'Cinder Magus'}


# fix2 (critique-resume fix 1): candidates on the re-roll list that have not yet landed and been judged show "being
# repainted" with their buttons disabled. Every fix2 re-roll landed and was judged, so the set is empty.
PENDING = set()  # e.g. {('primordial', 'a')}

# the subject ids whose portrait files use another unit id or face
SUBJECT_FILES = {'giant01': ('giant', '01'), 'giant02': ('giant', '02')}

# ------------------------------------------------------------------ resume page (2026-10-24)
# The Cinder battle faces repainted with their own weapon in both views (cmdA2 a2cfg.OWN_KIT less KIT_HELD_BACK; the
# figures' ownKit flag), with the weapon kits.json names, in plain words.
OWN_KIT_FACES = [
    ('ashChieftain', '01', 'Ash Chieftain', 'A bearded axe, the lower edge of its blade hooked long below the haft.'),
    ('ashChieftain', '02', 'Ash Chieftain', 'A double-bitted axe, a blade on each side of the haft.'),
    ('ashChieftain', '03', 'Ash Chieftain', 'Asked for: a long-hafted great axe in both hands. Painted: still one-handed.'),
    ('ashChieftain', '05', 'Ash Chieftain', 'A crescent axe, its broad blade curved like a waning moon.'),
    ('pyrePriest', '06', 'Pyre Priest', 'A staff topped with a tall, narrow chimney of a brazier.'),
]

MOCKUP_URL = 'https://claude.ai/artifact/9N3xAjDepZNfKB4KnrPs4D'
