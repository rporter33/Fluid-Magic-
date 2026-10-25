# The unit table for the painted figures: what each figure is, its kit, its sheet layout, its key,
# its references. Run it to write ../units.json; guides.py and make_prompts.py read that file.
# Stats and weapons come from src/content/units/*.ts and docs/03-nations.md; commander kit comes
# from the approved portrait it must match (src/assets/raster/portraits/<nation>/<unit>/NN.json).
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = '/home/user/Fluid-Magic-'
PORT = REPO + '/art-source/portraits'
ANCHOR = PORT + '/anchor-style.webp'

NATIONS = {
    'cinderHorde': dict(
        name='Cinder Horde',
        house=('a warrior of the Cinder Horde, ash-born clans who worship fire: ash-grey skin with soot markings, '
               'charcoal and smoke-grey clothing, armor of dark iron with rusted edges'),
        cloth=dict(name='dull ember orange', hex='#C4532C', light='#D9744A', dark='#7E3118'),
        key='green',
    ),
    'thornwood': dict(
        name='Thornwood',
        house=('a fighter of the Thornwood, forest clans who live among ancient trees: weathered bark-brown skin, '
               'bark-and-leaf clothing and armor in moss green and bark brown'),
        cloth=dict(name='deep pine green', hex='#1F6A50', light='#2F8A68', dark='#113F2F'),
        key='magenta',
    ),
}

KEYS = {'green': '#00FF00', 'magenta': '#FF00FF', 'blue': '#0000FF'}

# cell size targets in the atlas (section 6 of the plan): standing figure height in px, tier A (1x) / B (2x)
HEIGHT_PX = {'infantry': (56, 112), 'commander': (64, 128), 'cavalry': (84, 168), 'wolfrider': (74, 148),
             'sprite': (40, 80), 'hornet': (10, 20)}


def troop(id, nation, body, layout, gear, kit, zones, stats, battles, style, extra=None):
    d = dict(id=id, unit=id, nation=nation, role='troop', body=body, layout=layout, gear=gear, kit=kit,
             sideZones=zones, stats=stats, battles=battles, styleRefs=[style, ANCHOR], key=NATIONS[nation]['key'])
    if extra:
        d.update(extra)
    return d


def commander(unit, face, nation, gear, kit, act, battles, names, extra=None):
    d = dict(id=f'{unit}-{face}', unit=unit, face=face, nation=nation, role='commander', body='commander',
             layout='commander', gear=gear, kit=kit, act=act, battles=battles, names=names,
             portrait=f'{PORT}/{nation}/{unit}/{face}.webp',
             portraitGame=f'{REPO}/src/assets/raster/portraits/{nation}/{unit}/{face}.webp',
             styleRefs=[f'{PORT}/{nation}/{unit}/{face}.webp'], key=NATIONS[nation]['key'], sideZones=None)
    if extra:
        d.update(extra)
    return d


C, T = 'cinderHorde', 'thornwood'
CH = f'{PORT}/cinderHorde'
TW = f'{PORT}/thornwood'

UNITS = [
    # ---------------- Cinder Horde troops ----------------
    troop('ashMilitia', C, 'infantry', 'melee',
          dict(weapon='spear', shield=None, helm='band', cape=True),
          ('An Ash Militia levy spearman: a quilted smoke-grey padded jack with patches, a plain dark iron skullcap '
           'wrapped with a dull ember-orange cloth band, a short dull ember-orange hooded shoulder cape (hood down) '
           'that covers both shoulders, the upper back and the top of the chest, bare ash-grey forearms, wrapped '
           'legs and soft boots, a long ash-wood spear with a leaf-shaped dark iron head. No shield. Poor and plain.'),
          'the shoulder cape (shoulders, upper back, top of the chest) and the cap band',
          'hp 10, prot 1 (padded), Spear 3; line formation; size 1', ['a', 'b'], f'{CH}/cinderScout/04.webp',
          dict(weaponMotion='thrust: windup = spear drawn back at hip height, strike = a straight forward thrust, follow = the spear point dipping after the thrust')),
    troop('cinderWarrior', C, 'infantry', 'melee',
          dict(weapon='axe', shield='round', helm='crest', cape=True, tabard=True),
          ('A Cinder Warrior: a shirt of blackened iron scales with rusted edges over a charcoal tunic, a rounded dark '
           'iron helm with a nasal and a short stiff dull ember-orange horsehair crest running front to back, a short '
           'dull ember-orange cape over both shoulders down to the shoulder blades, a dull ember-orange tabard over the '
           'scales from the chest to mid-thigh, front and back, a round wooden shield whose face is painted dull ember '
           'orange with a black flame sigil, with a dark iron rim and boss, a jagged single-bit dark iron axe with a '
           'notched edge, ash-grey skin.'),
          'the helmet crest, the shoulder cape, the tabard and the shield face',
          'hp 11, prot 3 (scale), Axe 5, round shield; heavy block; size 1', ['a', 'b', 'c'], f'{CH}/ashChieftain/05.webp',
          dict(weaponMotion='chop: windup = axe raised high behind the head, strike = a downward diagonal chop, follow = axe low across the body')),
    troop('flameArcher', C, 'infantry', 'archer',
          dict(weapon='bow', shield=None, helm='hood', cape=True, quiver=True, fire=True, tabard=True),
          ('A Flame Archer: a padded smoke-grey jack under a short sleeveless dull ember-orange surcoat, leather bracers, a deep dull ember-orange hood worn up with a '
           'short hooded cape over the shoulders, a soot-black scarf over the lower face, a short recurve bow of dark '
           'horn, a leather quiver on the back with arrows whose heads are wrapped in black pitch-soaked rag, a long '
           'knife at the belt for melee. The arrow heads are not lit in the '
           'image (the game draws their flame); in the windup and strike cells the bow is slung on the back and the '
           'knife is in hand.'),
          'the raised hood, the hooded shoulder cape and the surcoat',
          'hp 10, prot 2, Fire Arrows 6 (range 6, ammo 10); loose staggered lines; size 1', ['a', 'b', 'c'], f'{CH}/cinderScout/03.webp'),
    troop('emberSkirmisher', C, 'infantry', 'thrower',
          dict(weapon='javelin', shield=None, helm='band', cape=True, bare=True, tabard=True),
          ('An Ember Skirmisher, a light runner: bare ash-grey arms and legs with soot stripes, a sleeveless dull ember-orange '
           'tunic, a wide dull ember-orange scarf wound over the head and around the shoulders with two long tails '
           'flying behind, a bundle of three short iron-tipped javelins in the off hand and one ready in the throwing '
           'hand, a long knife at the belt (in the windup and strike cells the knife is in hand). No armor, no shield.'),
          'the head-and-shoulder scarf and its tails, and the tunic',
          'hp 10, prot 1, Javelins 4 (range 3, ammo 4), Knife 2; skirmish screen; speed 3; size 1', ['a', 'c'], f'{CH}/cinderScout/06.webp'),
    troop('berserker', C, 'infantry', 'melee',
          dict(weapon='greataxe', shield=None, helm='wild', cape=False, bare=True, bulk=1.15),
          ('A Berserker: a huge bare-chested ash-grey brute, broader than the other warriors, covered in black soot '
           'handprints, with thick dull ember-orange war paint daubed across both shoulders, the upper back and the '
           'chest, wild matted black hair bound up with dull ember-orange rags, a ragged dull ember-orange kilt, a '
           'strip of black bear fur over one shoulder, iron arm rings, a massive two-handed jagged great axe with a '
           'crescent blade. No helmet, no shield, no armor. In the brace cell he beats his chest and roars instead.'),
          'the war paint on the shoulders and upper back, the hair rags and the kilt (large painted areas, not thin stripes)',
          'hp 13, prot 2, Great Axe 8, berserk (never routs); shock block; size 1', ['a'], f'{CH}/ashChieftain/06.webp',
          dict(weaponMotion='great chop: windup = the great axe swung far back over the shoulder with both hands, strike = a huge two-handed overhead chop, follow = the axe buried low, body bent over it; fleeA and fleeB are replaced: berserkers never rout, so those two cells show a second roar and a backhand chop', cellOverrides={'fleeA': 'a second roar: both arms wide, axe in one hand, head thrown back', 'fleeB': 'a backhand chop: the great axe swinging back the other way at waist height'})),
    troop('ashRider', C, 'cavalry', 'cavalry',
          dict(weapon='lance', shield=None, helm='crest', cape=True, mount='horse'),
          ('An Ash Rider, a lancer: the rider in blackened iron scale with a dull ember-orange shoulder cape and a '
           'rounded dark iron helm with a dull ember-orange horsehair crest, a long ash-wood lance with a dark iron '
           'head and a dull ember-orange pennon just below it, a sword at the hip (in the windup and strike cells the '
           'sword is in hand and the lance is gone). The horse: a heavy dark ash-grey horse with a soot-black mane and '
           'tail, a dull ember-orange caparison covering its back and rump from the saddle to the tail, a dark iron '
           'plate on its face.'),
          "the horse's caparison over its back and rump, the rider's shoulder cape and helmet crest, the lance pennon",
          'hp 12, prot 4, Lance 6 (first round +3), Sword 4; mounted; wedge; speed 3', ['a'], f'{CH}/ashChieftain/02.webp'),
    troop('flamebrand', C, 'infantry', 'melee',
          dict(weapon='fireSword', shield=None, helm='crest', cape=True, bulk=1.05, tabard=True),
          ('A Flamebrand, a sacred warrior of the fire god: heavy blackened iron plate over scale with rusted edges, '
           'a tall closed dark iron helm topped by a crest of iron flames and a dull ember-orange plume, a dull '
           'ember-orange tabard to the knees and a long cape of the same cloth, a straight longsword whose blade is '
           'wreathed in real flame, the only bright light on the figure. No shield. Taller and prouder than a warrior.'),
          'the plume, the tabard and the long cape',
          'hp 13, prot 6, Burning Blade 6 (fire), sacred; heavy block; size 1', ['c'], f'{CH}/pyrePriest/06.webp',
          dict(weaponMotion='slash: windup = the burning sword raised to the side above the shoulder, strike = a wide diagonal slash, follow = the blade low on the far side')),
    troop('fireSprite', C, 'sprite', 'sprite',
          dict(),
          ('A Fire Sprite, a small spirit of living flame summoned by Cinder Horde mages: a slender wispy imp-like body '
           'made of flame with a brighter hollow core, a small head with two dark ember eyes, two short flickering wings '
           'of flame, no legs: the body tapers into a flame tail. Orange and yellow flame with dark smoky red tips. It '
           'hovers. It is a flying construct about two-thirds the height of a man.'),
          'none (it is fire; it keeps its own colors on either side)',
          'hp 6, prot 0, Flame Touch 5 (fire, armor piercing); flying, mindless, construct; cloud; size 1', ['c'], f'{CH}/emberAdept/02.webp',
          dict(key='blue', keyWhy='flame is orange, yellow and white: blue is its complementary hue, so no flame colour sits near the key and the blue despill never touches orange or yellow (magenta despill dims flame edges, green eats yellow-green highlights)')),
    # ---------------- Thornwood troops ----------------
    troop('thornMilitia', T, 'infantry', 'melee',
          dict(weapon='spear', shield=None, helm='hood', cape=True),
          ('A Thorn Militia levy spearman: a deep pine-green hooded cloak with the hood up and the cloak covering the '
           'shoulders and back to the waist, worn over a bark-brown leather jerkin, wrapped legs and soft boots, '
           'bark-brown weathered skin, a long dark hawthorn spear with a barbed head of bone and iron shaped like a '
           'great thorn. No shield. Plain and poor.'),
          'the raised hood and the cloak over the shoulders and back',
          'hp 10, prot 2, Spear 3; line formation; size 1', ['b'], f'{TW}/thornScout/01.webp',
          dict(weaponMotion='thrust: windup = spear drawn back at hip height, strike = a straight forward thrust, follow = the point dipping after the thrust')),
    troop('warden', T, 'infantry', 'melee',
          dict(weapon='sword', shield='round', helm='leaf', cape=True, tabard=True),
          ('A Warden: armor of layered bark plates under a deep pine-green tabard that covers the chest and the back '
           'to mid-thigh, a helm of bark plates with a crest of stiff deep pine-green leaves running front to back, a '
           'deep pine-green mantle of overlapping cloth leaves over the shoulders and upper back, a round shield of bark-covered wood whose face is painted deep pine green with '
           'a pale blossom sigil and a bark-brown rim, a straight leaf-bladed sword, bark-brown weathered skin.'),
          'the leaf crest, the leaf mantle, the tabard and the shield face',
          'hp 11, prot 6 (bark), Sword 4, shield; heavy block; speed 1; size 1', ['a', 'b', 'c'], f'{TW}/wardenCaptain/05.webp',
          dict(weaponMotion='slash: windup = sword raised beside the head, strike = a diagonal slash, follow = blade low across the body')),
    troop('briarGuard', T, 'infantry', 'melee',
          dict(weapon='halberd', shield=None, helm='leaf', cape=True, bulk=1.12),
          ('A Briar Guard, heavy infantry: thick armor of black-brown bark plates studded with short thorns, a closed '
           'bark helm crowned with a ring of thorns and a deep pine-green leaf crest, a heavy deep pine-green mantle '
           'across the shoulders and back, a long halberd with a curved thorn-shaped blade, a back hook and a spike. '
           'No shield. Big and broad.'),
          'the leaf crest and the heavy mantle over the shoulders and back',
          'hp 12, prot 9 (bark plate), Halberd 7; heavy block; speed 1; size 1', ['a', 'b'], f'{TW}/wardenCaptain/07.webp',
          dict(weaponMotion='chop-thrust: windup = halberd raised high with both hands, strike = the blade chopping down and forward, follow = the spike thrusting low')),
    troop('longbowHunter', T, 'infantry', 'archer',
          dict(weapon='longbow', shield=None, helm='hood', cape=True, quiver=True, tabard=True),
          ('A Longbow Hunter: a deep pine-green hooded cloak with the hood up and a ragged leaf-cut hem down to the '
           'knees, a sleeveless deep pine-green surcoat over a bark-brown leather jerkin, leather bracers, bark-brown weathered skin, a very tall yew longbow, taller '
           'than the hunter, a quiver of grey-fletched arrows on the back, a hunting knife at the belt (in the windup '
           'and strike cells the bow is slung on the back and the knife is in hand).'),
          'the raised hood, the long cloak and the surcoat',
          'hp 10, prot 2, Longbow 6 (range 7, ammo 12); loose staggered lines; size 1', ['a', 'b', 'c'], f'{TW}/thornScout/04.webp'),
    troop('wolfRider', T, 'wolfrider', 'wolfrider',
          dict(weapon='spear', shield=None, helm='hood', cape=True, mount='wolf'),
          ('A Wolf Rider: the rider in bark armor with a deep pine-green hooded cloak (hood up) and a spear with a '
           'leaf-shaped head. The mount: a huge grey timber wolf, its shoulder as high as a man\'s chest, shaggy '
           'grey-brown fur darker along the spine, a deep pine-green saddle blanket over its back under a small bark '
           'saddle, a bark-plate harness across its chest.'),
          "the wolf's saddle blanket, the rider's hood and cloak",
          'hp 12, prot 3, Spear 4, Wolf Bite 3; mounted, beast; wedge; speed 3', ['b', 'c'], f'{TW}/thornScout/02.webp'),
    troop('hornetSwarm', T, 'hornet', 'hornet',
          dict(),
          ('One giant hornet of a Hornet Swarm summoned by Thornwood druids, as big as a sparrow: a black and '
           'amber-yellow striped abdomen, a dark brown thorax, a long black sting, two pairs of pale smoky wings '
           '(painted opaque, not see-through). The swarm itself is made in the game from many single hornets; each '
           'cell shows one hornet.'),
          'none (beasts keep their own colors)',
          'hp 6, prot 0, Sting 2 (armor negating); flying, mindless, beast; cloud; size 1', ['c'], f'{TW}/saplingDruid/03.webp',
          dict(singleView=True)),
]
# battles and names for commanders are filled from battles.json by make_units() below
COMMANDERS = [
    ('ashChieftain', '02', C, dict(weapon='axe', helm='horned', cape=True),
     ('An Ash Chieftain (the man of the reference portrait): about sixty, a long narrow face, a short cropped iron-grey '
      'beard, pale ash skin; a blackened iron helm with short straight bull horns pointing forward and three riveted '
      'iron bands; plate pauldrons each with a hammered sun-disc boss; a mantle of dark bear fur; charcoal clothes and '
      'dark iron armor with rusted edges; a jagged single-bit dark iron axe.'), 'rally'),
    ('ashChieftain', '01', C, dict(weapon='axe', helm='horned', cape=True),
     ('An Ash Chieftain (the man of the reference portrait): a riveted rusty dark iron helm with a nasal, cheek guards '
      'and two large curled ram horns; a long dark braided beard with bronze rings; braided hair; a heavy mantle of '
      'dark bear fur over the shoulders; pauldrons of overlapping leaf-shaped iron scales, each with a round bronze '
      'sun-disc boss; charcoal clothes; ash-grey skin with soot stripes; a jagged single-bit dark iron axe.'), 'rally'),
    ('ashChieftain', '05', C, dict(weapon='axe', helm='horned', cape=False),
     ('An Ash Chieftain (the man of the reference portrait): about twenty-five, lean, a thin dark moustache, a soot '
      'handprint across one cheek; a low rounded dark iron helm with small swept-back horns and a nasal guard; a '
      'gorget of overlapping iron plates; plain dark leather pauldrons with copper rivets; dark iron armor with rusted '
      'edges over charcoal clothes; a jagged single-bit dark iron axe.'), 'rally'),
    ('ashChieftain', '06', C, dict(weapon='axe', helm='spiked', cape=True),
     ('An Ash Chieftain (the man of the reference portrait): about fifty-five, heavy, a very full untrimmed dark beard '
      'going grey; a dark iron helm crowned with a ring of short iron spikes like flames, no horns; dark iron pauldrons '
      'engraved with coiled flame sigils; a mantle of soot-black feathers over the shoulders; charcoal clothes; a jagged '
      'single-bit dark iron axe.'), 'rally'),
    ('ashChieftain', '03', C, dict(weapon='axe', helm='horned', cape=True),
     ('An Ash Chieftain (the man of the reference portrait): about thirty, clean-shaven, dark charcoal-grey skin with '
      'three black soot stripes across the face; an open-faced dark iron helm with large curled horns wrapped in '
      'leather cord; a mail aventail at the neck; dark iron pauldrons studded with rows of iron rings; a grey wolf-fur '
      'collar; charcoal clothes; a jagged single-bit dark iron axe.'), 'rally'),
    ('cinderMagus', '03', C, dict(weapon='staff', helm='cowl', robe=True, glow=True),
     ('A Cinder Magus (the man of the reference portrait): very old, bald, wispy white stubble, a band of black soot '
      'across the forehead, eyes glowing amber like embers; a tall straight peaked charcoal cowl bound in a spiral by '
      'a thin band of dark iron from the brow to the tip; a heavy mantle of layered smoke-grey cloth over a long '
      'charcoal robe to the ground; a pendant of a black iron sun disc; a tall staff of blackened wood crowned with an '
      'iron cage holding a dull ember.'), 'cast'),
    ('pyrePriest', '01', C, dict(weapon='staff', helm='hood', robe=True, glow=True),
     ('A Pyre Priest (the man of the reference portrait): about seventy, an old lined face, shaved chin, pale ash skin, '
      'soot stripes under the eyes; a deep charcoal cowl; an ember-shaped iron clasp; a collar of dark iron rings; a '
      'long charcoal robe to the ground over dark iron; a staff of blackened wood topped with a small iron brazier.'), 'bless'),
    ('pyrePriest', '06', C, dict(weapon='staff', helm='hood', robe=True, glow=True),
     ('A Pyre Priest (the man of the reference portrait): about sixty, gaunt, sunken eyes, a sparse white beard, pale '
      'ash skin; a ragged charcoal hood with burned edges; a plain iron ring clasp; an iron censer hanging on a chain '
      'across the chest; dark iron pauldrons over a long charcoal robe to the ground; a staff of blackened wood topped '
      'with a small iron brazier.'), 'bless'),
    ('emberAdept', '02', C, dict(weapon='staff', helm='circlet', robe=True, glow=True),
     ('An Ember Adept (the woman of the reference portrait): about twenty, long straight dark hair tied back at the '
      'nape, pale ash skin, three small soot dots on each cheekbone; a thin blackened-iron circlet with a small iron '
      'teardrop at the brow; a charcoal robe to the ground with a dull ember-red trim; a wide charcoal cowl-collar '
      'folded down on the shoulders; a thin iron chain at the neck; a slender staff of blackened wood.'), 'cast'),
    ('emberAdept', '07', C, dict(weapon='staff', helm='circlet', robe=True, glow=True),
     ('An Ember Adept (the man of the reference portrait): about thirty, a broad face, thick unruly black hair with a '
      'half-hidden blackened-iron circlet, a short dense black beard; a charcoal robe to the ground with a padded '
      'quilted collar and a dull ember-red trim; a leather book-strap across the chest with a book at the hip; an iron '
      'key on a cord; a slender staff of blackened wood.'), 'cast'),
    ('wardenCaptain', '04', T, dict(weapon='sword', helm='antler', cape=True),
     ('A Warden Captain (the man of the reference portrait): about sixty-five, grey braids, a white beard braided in '
      'two; a helm of lichen-covered bark plates with antlers; a cloak of amber autumn leaves over the shoulders and '
      'back; a necklace of wooden beads; armor of layered bark plates; a straight leaf-bladed sword.'), 'rally'),
    ('wardenCaptain', '07', T, dict(weapon='sword', helm='antler', cape=True),
     ('A Warden Captain (the man of the reference portrait): about thirty-five, close-cropped black hair, no beard, a '
      'leaf-shaped green tattoo on the cheek, deep brown skin; a helm of overlapping pine-bark scales with swept-back '
      'antlers; a cloak of dark green pine needles; a clasp shaped like a pine cone; armor of layered bark plates; a '
      'straight leaf-bladed sword.'), 'rally'),
    ('wardenCaptain', '05', T, dict(weapon='sword', helm='antler', cape=True),
     ('A Warden Captain (the man of the reference portrait): young, a thin beard, a scar on the chin, braided hair; a '
      'helm of layered bark plates with antlers; a cloak of real green leaves with a few pale blossoms; armor of '
      'layered bark plates with a carved round boss on the chest; a straight leaf-bladed sword.'), 'rally'),
    ('elderDruid', '08', T, dict(weapon='staff', helm='hood', robe=True, glow=True),
     ('An Elder Druid (the man of the reference portrait): about sixty-five, a narrow ascetic face, a long thin grey '
      'moustache hanging past the jaw, eyes glowing pale green; a soft loose hood of faded olive-brown wool with two '
      'very short antler nubs poking through above the brow; a collar of brown owl feathers; a clasp shaped like a '
      'crescent moon; a long robe of layered bark-brown and olive cloth to the ground; a gnarled staff with a living '
      'green sprig at the top.'), 'cast'),
    ('saplingDruid', '03', T, dict(weapon='staff', helm='wreath', robe=True, glow=True),
     ('A Sapling Druid (the man of the reference portrait): about twenty-five, black hair in a topknot, a thin '
      'moustache, olive skin; a circlet of hazel twigs with hanging catkins; a cloak of moss-green wool with a '
      'hazelnut clasp and a collar of plaited grass cord over a long robe; a slender hazel staff.'), 'cast'),
    ('saplingDruid', '08', T, dict(weapon='staff', helm='wreath', robe=True, glow=True),
     ('A Sapling Druid (the man of the reference portrait): about twenty-four, a shaved scalp with dark stubble, a '
      'short thick black beard, tan skin; a circlet of grey ash twigs with black buds on the bare scalp; a moss-green '
      'cloak with a frayed hem and a carved wooden ring clasp over a long robe; a slender hazel staff.'), 'cast'),
    ('grovePriest', '01', T, dict(weapon='staff', helm='wreath', robe=True, glow=True),
     ('A Grove Priest (the man of the reference portrait): old and serene, a long white beard, moss in the hair; a '
      'wreath crown of oak leaves; a mantle of layered bark-brown leaves over a plain green-grey robe to the ground '
      'with a carved leaf clasp; a staff of oak topped with a ring of oak leaves.'), 'bless'),
]

MONSTERS = [
    dict(id='salamander-01', unit='salamander', face='01', nation=C, role='monster', body='salamander', layout='monster',
         portrait=f'{CH}/salamander/01.webp', portraitGame=f'{REPO}/src/assets/raster/portraits/cinderHorde/salamander/01.webp',
         styleRefs=[f'{CH}/salamander/01.webp'], key='green',
         kit=('A Salamander, the great fire lizard of the reference portrait, summoned by Cinder Horde mages (size 3): a '
              'heavy low-slung lizard about two and a half men long, on four short, thick, splayed legs with blunt claws, '
              'with a long thick tail; the broad flat heavy head of a giant river salamander with a wide lipless mouth, a '
              'thick neck with loose folds of skin, dull obsidian-black scales with a fine net of dull ember-orange cracks '
              'between them, small deep-set dark eyes, a row of short stubby horn nubs along each side of the jaw, three '
              'blunt bony knobs on the brow, a pale healed scrape across the snout. No flame on its body and no fire in '
              'the image: the game draws its fire breath separately.'),
         stats='hp 35, prot 8, Fire Breath 10 (range 2, ammo 6), summoned commander, beast; size 3 (2.3 men tall with the head up)',
         battles=['c'],
         actions=['idle', 'breath', 'tailLash', 'hit', 'dead']),
    dict(id='treant-01', unit='treant', face='01', nation=T, role='monster', body='treant', layout='monster',
         portrait=f'{TW}/treant/01.webp', portraitGame=f'{REPO}/src/assets/raster/portraits/thornwood/treant/01.webp',
         styleRefs=[f'{TW}/treant/01.webp'], key='magenta',
         kit=('A Treant, the walking tree of the reference portrait, summoned by Thornwood druids (size 4): a thick '
              'knotted trunk of grey-green alder bark furred with moss forms its body and head; its face is in the bark '
              'near the top of the trunk: a broad brow ridge of bark, a low rounded bulge where a nose would be, two small '
              'dark hollow knotholes for eyes, a mouth that is only a dark crooked split; a low crown of short thick budding '
              'twigs with a few small pale-green leaves; curled young fern fronds growing from the moss on its shoulders; '
              'two long branch arms ending in knotted twig fingers; two stumpy legs that splay into roots. No beard, no '
              'big leafy crown.'),
         stats='hp 60, prot 12, Crushing Limbs 12, regenerates; summoned commander; size 4 (3.4 men tall)',
         battles=['b'],
         actions=['idle', 'windup', 'slam', 'hit', 'dead']),
    dict(id='greatWyrm-thornwood', unit='greatWyrm', face=None, nation=T, role='monster', body='wyrm', layout='monster',
         portrait=None, styleRefs=[f'{TW}/treant/03.webp', ANCHOR], key='magenta',
         kit=('A Great Wyrm, a god in the form of a dragon, the pretender of the Thornwood (size 6): a long, heavy, '
              'four-legged winged dragon, as tall as six men with its neck raised and about fifteen men long; deep moss-green '
              'scales edged with dull bronze, lichen and moss in the creases of the shoulders, a cream-ochre belly of broad '
              'plates, a ridge of pale bone spines along the neck and back, a long tapering tail ending in a spade of bone '
              'plates, a horned wedge-shaped head with two long swept-back pale horns and amber eyes, broad bat-like wings '
              'with dark green membranes veined with bronze; ancient, scarred, heavy. No fire or breath in the image: the '
              'game draws its breath separately.'),
         stats='hp 120, prot 16, Breath 12 (range 3, ammo 5), Bite 10; flying; pretender; size 6',
         battles=['a'],
         actions=['idle', 'breath', 'bite', 'flight', 'hit', 'dead'],
         note='On the Thornwood side in battle a (the task list placed it with the Cinder Horde). A pretender has no raster portrait: its card is painted from this cutout (section 4).'),
]

BANNERS = [
    dict(id='banner-cinderHorde', nation=C, key='green', symbol='a black flame'),
    dict(id='banner-thornwood', nation=T, key='magenta', symbol='a pale five-pointed leaf'),
]


# ---- art plan additions (sections 3 to 5): formation kinds, review tracks, the pilot ----
FORMATION = dict(ashMilitia='line', cinderWarrior='heavy', flameArcher='archers', emberSkirmisher='screen', berserker='shock',
                 ashRider='wedge', flamebrand='heavy', fireSprite='cloud', thornMilitia='line', warden='heavy',
                 briarGuard='heavy', longbowHunter='archers', wolfRider='wedge', hornetSwarm='cloud')
# the owner's three reviews (portrait, standing in game, animation) apply to every creature, mount and god;
# a figure on that track is never made before its painted portrait is approved
CREATURE_TRACK = {'fireSprite': 'creature (summon)', 'hornetSwarm': 'creature (summon)', 'ashRider': 'mount (Ash Horse)',
                  'wolfRider': 'mount (War Wolf)', 'salamander-01': 'creature (portrait approved)',
                  'treant-01': 'creature (portrait approved)', 'greatWyrm-thornwood': 'god (portrait not yet made)'}
PILOT = dict(
    battle='c',
    why='The Fight in Wickemoss: the Salamander the owner flagged stands on the near side; both nations\' line '
        'infantry, archers and leaders are on the field.',
    calibration=[dict(figure='cinderWarrior', view='back', model=m, refs=r) for m, r in (
        ('gemini-nano-banana-2.1', 'guide+portrait+anchor'), ('gemini-3-pro-image', 'guide+portrait+anchor'),
        ('nano-banana-pro-preview', 'guide+portrait+anchor'), ('best of the three', 'guide+anchor (no portrait)'))],
    core=['cinderWarrior', 'flameArcher', 'warden', 'longbowHunter', 'ashChieftain-06', 'ashChieftain-03',
          'wardenCaptain-07', 'salamander-01'],
    second=['emberSkirmisher', 'flamebrand', 'emberAdept-07', 'elderDruid-08', 'saplingDruid-08'],
    procedural=['fireSprite', 'hornetSwarm', 'wolfRider'],
    budget=60,
)


def stage_of(u):
    if u['id'] in PILOT['core']:
        return 'A-core'
    if u['id'] in PILOT['second']:
        return 'A-second'
    if u['id'] in CREATURE_TRACK:
        if u['id'] == 'treant-01':
            return 'C (portrait already approved; stands with the other creatures)'
        return 'C (figure after its portrait)'
    return 'B'


def make_units():
    battles = json.load(open(os.path.join(HERE, '..', '..', 'battle-data', 'battles.json')))
    import base64, hashlib, glob
    idx = {}
    for f in glob.glob(REPO + '/src/assets/raster/portraits/*/*/*-64.webp'):
        idx[hashlib.sha1(open(f, 'rb').read()).hexdigest()] = f
    used = {}
    for b in battles:
        for g in b['groups']:
            p = g.get('portrait')
            if not p:
                continue
            f = idx.get(hashlib.sha1(base64.b64decode(p.split(',', 1)[1])).hexdigest())
            face = os.path.basename(f)[:2]
            used.setdefault((g['unit'], face), []).append(dict(battle=b['key'], ref=g['ref'], side=g['side'], name=g['personal']))
    out = [u for u in UNITS if u['role'] != 'commander']
    for unit, face, nation, gear, kit, act in COMMANDERS:
        uses = used.get((unit, face), [])
        assert uses, (unit, face)
        out.append(commander(unit, face, nation, gear, kit, act, sorted({x['battle'] for x in uses}),
                             [f"{x['name']} ({x['battle']}, {x['side']})" for x in uses]))
    out += MONSTERS
    missing = [k for k in used if not any(u.get('unit') == k[0] and u.get('face') == k[1] for u in out)]
    assert not missing, missing
    # every unit type in the battles has a figure
    types = {g['unit'] for b in battles for g in b['groups']}
    have = {u['unit'] for u in out}
    assert types <= have, types - have
    for u in out:
        if u['role'] == 'troop':
            u['formation'] = FORMATION[u['id']]
        u['track'] = CREATURE_TRACK.get(u['id'], 'troop' if u['role'] == 'troop' else 'commander (portrait approved)')
        u['stage'] = stage_of(u)
    data = dict(version=2, nations=NATIONS, keys=KEYS, heightPx=HEIGHT_PX, pilot=PILOT, units=out, banners=BANNERS,
                facesUsed={f'{k[0]}/{k[1]}': v for k, v in sorted(used.items())})
    json.dump(data, open(os.path.join(HERE, '..', 'units.json'), 'w'), indent=1)
    return data


if __name__ == '__main__':
    d = make_units()
    print(len(d['units']), 'figures;', sum(1 for u in d['units'] if u['role'] == 'commander'), 'commander faces;',
          len(d['facesUsed']), 'portrait faces used')
