# Stage B fix pass, critique fix 11: one kit per commander face, not one weapon for all (owner, pilot verdict: "a few
# more variations with the commanders ... each should be unique but within the game's constraints").
# Every face keeps its content weapon and timing (an Ash Chieftain an axe, a caster a staff, a Warden Captain a sword);
# within that, each face gets its own weapon from the family, assigned by face number, and a mantle cut where its
# portrait does not fix one (no mark names a mantle, cloak, cape, collar or fur). Faces already painted and kept as
# painted (the owner-kept Ash Chieftain 06, Elder Druids 05 and 08) keep their painted weapon. Scouts (knife) and the
# independent captains are unchanged. Used by the re-dress prompt builders (cmda.py, cmdb.py) for every new job and
# recorded in each figure's sidecar (kits.json, atlas/cmdA|cmdB/figures/<unit>-<NN>.json "productionKit").
# The texts name no game, franchise, artist or studio, and use no capitalised word but the sentence openers.
AXES = [  # Ash Chieftain (cmdChief has no shield, so the review's "axe and round buckler" is not used)
    'the bearded axe of dark iron, the lower edge of its blade hooked long below the haft',
    'the double-bitted axe of dark iron, a blade on each side of the haft',
    'the long-hafted great axe of dark iron held in both hands, its haft as tall as his chest',
    'the dark iron axe with a long spike on the back of its head',
    'the crescent axe of dark iron, its broad blade curved like a waning moon',
    None,  # face 06: the owner-kept pilot face keeps its jagged single-bit axe
    'the hooked axe of dark iron, the top of its blade drawn out into a forward hook',
    'the broad cleaver-axe of dark iron with a deep square blade',
]
BRAZIERS = [  # Pyre Priest staff heads (nothing glows: the coals are dull and unlit)
    'the staff of blackened wood topped with a small iron brazier of dull unlit coals',
    'the staff of blackened wood ending in a three-pronged iron fork that holds a basket of dull unlit coals',
    'the staff of blackened wood with an iron hook at the top, a small censer of dull unlit coals hanging from it on a chain',
    'the staff of blackened wood topped with an iron brazier ringed with short spikes, its coals dull and unlit',
    'the staff of blackened wood topped with an iron brazier shaped like a closed fist around dull unlit coals',
    'the staff of blackened wood topped with a tall narrow iron chimney of a brazier, its coals dull and unlit',
    'the staff of blackened wood with a short iron crossbar at the top, a small brazier of dull coals at each end',
    'the staff of blackened wood topped with a brazier bowl set in a ring of iron flame shapes, its coals dull and unlit',
]
ADEPT = [  # Ember Adept staffs
    'the slender staff of blackened wood',
    'the slender staff of blackened wood with a broad iron ring around its top',
    'the slender staff of blackened wood, its top wrapped in strips of charred leather',
    'the slender staff of blackened wood whose top forks around a small iron bead',
    'the slender staff of blackened wood ending in a shepherd\'s crook',
    'the slender staff of blackened wood, its top carved into a small dark flame',
    'the slender staff of blackened wood capped with iron and a short spike',
    'the slender staff of blackened wood, its top bound with a coil of iron wire',
]
MAGUS = [  # Cinder Magus staffs (the ember stays dull)
    'the tall staff of blackened wood crowned with an iron cage holding a dull ember',
    'the tall staff of blackened wood crowned with an open crown of four iron prongs around a dark stone',
    'the tall staff of blackened wood with a hooked top, a small iron cage with a dull ember hanging beneath it',
    'the tall staff of blackened wood crowned with an iron lantern-shaped cage holding a dull ember',
    'the tall staff of blackened wood crowned with a spiral of iron wound around a dark coal',
    'the tall staff of blackened wood crowned with two twisted iron horns around a black stone',
    'the tall staff of blackened wood crowned with an iron ring, a dark coal set in its centre',
    'the tall staff of blackened wood ending in a long iron spike with a small cage of dull embers below it',
]
SWORDS = [  # Warden Captain swords
    'the plain straight sword with a simple cross guard',
    'the leaf-bladed sword, its blade swelling below the point like a willow leaf',
    'the straight sword with a cross guard of carved antler',
    'the long hand-and-a-half sword with a plain disc pommel',
    'the straight sword whose grip is wound with a thorny briar stem',
    'the heavy single-edged falchion with a broad curved blade',
    'the straight sword with a bone guard carved as two leaves',
    'the broad straight sword with a deep groove down its blade',
]
DRUID_STAFFS = [  # Grove Priest, Sapling Druid and Elder Druid staffs
    'the tall gnarled staff of dark wood',
    'the tall staff of dark wood whose top forks into two short antler-like branches',
    'the tall staff of dark wood with a living sprig of green oak leaves at its top',
    'the tall staff of dark wood whose top curls into a spiral',
    'the tall staff of dark wood with a crook at the top bound in ivy',
    'the tall staff of dark wood topped with a knot of roots holding a smooth grey river stone',
    'the tall staff of pale birch bound with strips of bark',
    'the tall staff of dark wood with a cluster of dried seed pods hanging from its top',
]
MANTLES = [  # a mantle cut where the portrait does not fix one, by face number
    ('a thick collar of dark fur over the shoulders', True),
    ('a plain dark wool cloak hanging to the knees', True),
    ('a short mantle of dark feathers over the shoulders', True),
    None,  # no cloak: the shoulders bare of any mantle
]
FAMILY = {'ac': AXES, 'pp': BRAZIERS, 'ea': ADEPT, 'cm': MAGUS, 'wc': SWORDS, 'gp': DRUID_STAFFS, 'sd': DRUID_STAFFS,
          'ed': DRUID_STAFFS}
KEEP_AS_PAINTED = {'ac06', 'ed05', 'ed08'}
MANTLE_WORDS = ('mantle', 'cloak', 'cape', 'collar', 'fur', 'feather', 'shawl', 'stole')


def kit(face, marks):
    """The face's production kit: its weapon mark and its mantle mark (or None), and whether they replace the old."""
    fam = FAMILY.get(face[:2])
    if not fam or face in KEEP_AS_PAINTED:
        return dict(face=face, weapon=marks[-1][0], weaponChanged=False, mantle=None, note='kept as painted' if fam else 'unchanged')
    n = int(face[2:]) - 1
    w = fam[n % len(fam)] or marks[-1][0]
    has_mantle = any(any(k in m.lower() for k in MANTLE_WORDS) for m, _ in marks)
    mantle = None if has_mantle else MANTLES[n % len(MANTLES)]
    return dict(face=face, weapon=w, weaponChanged=w != marks[-1][0], mantle=mantle[0] if mantle else None,
                mantleFrom='portrait' if has_mantle else ('kit list' if mantle else 'none (bare shoulders)'))


def kit_marks(face, marks):
    """The marks a new re-dress prompt names: the face's own weapon in place of the shared one, plus its mantle cut."""
    k = kit(face, marks)
    out = list(marks[:-1])
    if k.get('mantle'):
        out.append((k['mantle'], True))
    out.append((k['weapon'], marks[-1][1]))
    return out
