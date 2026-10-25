# Stage C review page: the words. Plain language for the owner. Facts from the stage C records: critique.md (the art
# director's review and its owner questions), work/fix/fix-record.json and measure-before/after.json (the fix pass),
# atlas/creatures/figures/*.json and index.json, atlas/gods/gods.json, picks.json and the owner's stage B verdict.

MOCKUP_URL = 'https://claude.ai/artifact/9N3xAjDepZNfKB4KnrPs4D'
LINEUP_URL = 'https://claude.ai/artifact/L5rNYaE838n8aTfNd9TjTU'
MAN_WU = 28.0  # a foot soldier's height on the field; a commander is 32
BUDGET = dict(used=111, total=130)  # fix-record.json stageCUsed / stageCBudget

# ------------------------------------------------------------------ 1. creatures and mounts
# id: the page key; fig: atlas/creatures figure; views: (atlas view, caption); battles: in-game crops (see build)
CREATURE_GROUPS = [
    ('Summoned creatures', 'Called up in battle by casters; each fights as a small flock or a single beast.', [
        dict(id='fireSprite', fig='fireSprite', name='Fire Sprite', short='Fire Sprite', pick='B',
             tags=['Cinder Horde summon', 'size 1, flies'], battle='c',
             what='A flicker of living flame summoned by Cinder mages: a flame face with swept-back flame hair and a '
                  'roaring mouth.',
             notes=[(True, 'The flame face, horn points and roaring mouth of your portrait read from the front, close up.'),
                    (False, 'The field figure adds two flame wings and a tail that your bust does not show (question 6).'),
                    (False, 'It does not glow or flicker yet: light and fire come with the magic in stage D.'),
                    (False, 'Its flying poses miss our camera check in both views; in the battle they read as orange '
                            'winged imps.')]),
        dict(id='hornetSwarm', fig='hornetSwarm', name='Hornet Swarm', short='Hornet Swarm', pick='B, standing in',
             tags=['Thornwood summon', 'size 1, flies'], battle='c',
             what='A cloud of stinging forest hornets called by druids. One figure on the field is twelve hornets; a '
                  'hornet is about 10 pixels at play zoom.',
             notes=[(True, 'Repainted as a hard black-and-ochre wasp with smoky wings (it was a fuzzy amber bee), and its '
                           'outline is now neutral, so the swarm no longer reads teal at play zoom.'),
                    (False, 'One view only: the same hornets serve both sides, as planned for swarms.'),
                    (False, '10 of its 12 poses match the battle camera; two turning poses do not.'),
                    (False, 'Its portrait is not your pick yet: B stands in (question 1).')]),
        dict(id='wolf', fig='wolf', name='Wolf', short='Wolf', pick='B', tags=['summon for any nation', 'size 1'],
             what='A wild grey wolf of the deep wood, summoned by druids and the hunt gods: your old, heavy wolf with a '
                  'grizzled muzzle and no harness.',
             notes=[(True, 'From behind it passes every check, and the faint mauve rim along its back is gone.'),
                    (False, 'From the front, 8 of 12 poses match the battle camera, and the scar across its eye does not '
                            'show at this size.')]),
        dict(id='oakheart', fig='oakheart', name='Oakheart', short='Oakheart', pick='B',
             tags=['Thornwood sacred warrior', 'size 2'],
             what='A walking oak under thornplate: a warrior whose whole body is living oak, armoured in grown thorns, '
                  'with an oak maul.',
             notes=[(True, 'It now wears your portrait’s tall helm of upright bark planks, ringed with thorns and oak '
                           'leaves, on every pose (it had a low flat cap).'),
                    (False, 'Still squat and big-headed beside your portrait’s tall warrior, and the green mantle did '
                            'not grow over the chest as we asked.'),
                    (False, 'Only 7 of 15 poses from the front and 6 of 15 from behind match the battle camera, and little '
                            'Thornwood green shows from the front. A Redo would mean painting the whole body anew, not '
                            'another edit.')]),
    ]),
    ('Mounted troops', 'Each painted on the mount whose portrait you approved; the mount and rider stay one figure, as '
                       'you decided (painting them apart is for later).', [
        dict(id='ashRider', fig='ashRider', name='Ash Rider, on the Ash Horse', short='Ash Rider', pick='Ash Horse B',
             tags=['Cinder Horde lancers', 'size 2'], battle='a',
             what='Cinder Horde lancers in blackened scale and ember capes, on heavy dark warhorses with riveted iron '
                  'face plates.',
             notes=[(True, 'From the front, the horse is now your Ash Horse’s dark charcoal with pale dapples and its '
                           'iron face plate, and the rider’s ember cape lies over both shoulders.'),
                    (False, 'The ember caparison still does not cover the horse’s chest from the front: only its edge '
                            'shows.'),
                    (False, 'From behind (the view battle a shows) the coat is still a lighter dappled grey: only the front '
                            'was repainted.'),
                    (False, 'From the front, 12 of 15 poses match the battle camera and little Cinder orange shows; from '
                            'behind, 13 of 15. Enemy Ash Riders do not appear in the three battles, but will in the game.')]),
        dict(id='wolfRider', fig='wolfRider', name='Wolf Rider, on the War Wolf', short='Wolf Rider', pick='War Wolf A',
             tags=['Thornwood riders', 'size 2'], battle='b, c',
             what='Thornwood riders in bark armour and pine-green hooded cloaks, with leaf-bladed spears, on huge '
                  'grey-brown timber wolves.',
             notes=[(True, 'Drawn at the plan’s size now: the War Wolf is as big as a summoned Wolf, and the rider a '
                           'little taller than a foot soldier (question 3).'),
                    (True, 'From behind it passes our checks, with 15 of 16 poses at the battle camera.'),
                    (True, 'The harness front keeps one coat colour from standing to running now (the wolves turned from '
                           'grey to brown as they moved off), and its green cloth was darkened toward the Wardens’.'),
                    (False, 'Far-side Wolf Riders still read grey-green beside the Wardens at play zoom (see the battle c '
                            'crops).'),
                    (False, 'Harness front: 13 of 16 poses match the battle camera. Which front to keep is question 2.')]),
    ]),
    ('Big creatures', 'Painted as single standing bodies, each from its own approved portrait. The Salamander and Treant '
                      'faces are your approved leader portraits; Salamander face 01, the pilot you kept, fights in '
                      'battle c and is not repeated here.', [
        dict(id='giant01', fig='giant-01', name='Giant, face 01', short='Giant 01', pick='01 B',
             tags=['independent monster', 'size 4'],
             what='An old mountain giant: bald with grey wisps, a broken nose, stones knotted in a matted grey beard, a '
                  'hide cloak and a necklace of huge teeth.',
             notes=[(True, 'Passes every check in both views.')]),
        dict(id='giant02', fig='giant-02', name='Giant, face 02', short='Giant 02', pick='02 B',
             tags=['independent monster', 'size 4'],
             what='A younger giant: one eye clouded white under a scar, a wild dark mane, an iron chain, a slate shoulder '
                  'guard and a fleece mantle.',
             notes=[(True, 'Passes every check in both views; a squad of four mixes the two faces.')]),
        dict(id='salamander02', fig='salamander-02', name='Salamander, face 02', short='Salamander 02', pick='face 02',
             tags=['Cinder Horde monster', 'size 3'],
             what='A massive square head with thick worn jaw horns, the largest snapped to a stump, warty brow knobs and '
                  'heavy-lidded eyes.',
             notes=[(True, 'Passes every check in both views, drawn the size of the face 01 you kept.')]),
        dict(id='salamander03', fig='salamander-03', name='Salamander, face 03', short='Salamander 03', pick='face 03',
             tags=['Cinder Horde monster', 'size 3'],
             what='A long, narrow crocodile snout with three claw scars, hooked horns (one chipped) and a ridge of scutes '
                  'on the head.',
             notes=[(True, 'Passes every check in both views, drawn the size of face 01.')]),
        dict(id='salamander04', fig='salamander-04', name='Salamander, face 04', short='Salamander 04', pick='face 04',
             tags=['Cinder Horde monster', 'size 3'],
             what='A narrow wedge of a viper head with two long ram-like horns, a torn neck frill and dried-lava cracks.',
             notes=[(True, 'Passes every check in both views, drawn the size of face 01.'),
                    (False, 'The torn frill reads as a row of spines down the neck and back.')]),
        dict(id='treant01', fig='treant-01', name='Treant, face 01 (alder)', short='Treant 01', pick='face 01',
             tags=['Thornwood monster', 'size 4'], battle='b',
             what='Grey-green alder bark with moss, a low crown of budding twigs, fern fronds on the shoulders.',
             notes=[(True, 'Passes every check in both views.')]),
        dict(id='treant02', fig='treant-02', name='Treant, face 02 (willow)', short='Treant 02', pick='face 02',
             tags=['Thornwood monster', 'size 4'],
             what='Pale furrowed willow bark under long drooping fronds, two knothole eyes at different heights, a long '
                  'ragged split.',
             notes=[(True, 'Its willow crown, cut flat by the picture’s edge from behind, is now complete.'),
                    (False, 'From behind, the bark reads olive with streaks of moss rather than your portrait’s pale '
                            'willow, and its new outline no longer matches our camera model where the crown rises above '
                            'it (the body is unchanged).')]),
        dict(id='treant03', fig='treant-03', name='Treant, face 03 (oak)', short='Treant 03', pick='face 03',
             tags=['Thornwood monster', 'size 4'],
             what='Dark-brown split-oak bark, a crown of twisted thorny black branches, ivy round the trunk and a '
                  'lightning scar down one cheek.',
             notes=[(True, 'Passes every check in both views.')]),
        dict(id='treant04', fig='treant-04', name='Treant, face 04 (birch)', short='Treant 04', pick='face 04',
             tags=['Thornwood monster', 'size 4'],
             what='White birch bark with black patches, forked into two stems at the top, drooping dark twigs with '
                  'yellow-brown leaves.',
             notes=[(True, 'The crowns are now complete: both stems end in twigs inside the picture (they were cut flat '
                           'by its edge). It stands a little taller for it; the body was not shrunk to fit.'),
                    (False, 'Our camera check reports its outline in both views, because the crown rises above the clay '
                            'model; the body is unchanged.')]),
    ]),
]

VIEW_CAPTION = {'back': 'from behind', 'front': 'from the front', 'frontKept': 'front: kept test'}

# ------------------------------------------------------------------ 2. gods
GOD_GROUPS = [
    ('The Cinder Horde’s own gods', [
        dict(id='ashColossus', name='Ash Colossus', size=5,
             what='A huge body of charred ember under a crust of ash with a net of dull red cracks, an iron brazier of '
                  'coals for a head, an orange kilt on a gold chain.',
             notes=[(True, 'Repainted lean and long-legged in dark charcoal ash, like your portrait (it was a stocky grey '
                           'stone golem). Both views pass our checks.'),
                    (False, 'From the front, the ember cracks show only in part. Its drifting embers come with stage D.')]),
        dict(id='ashPhoenix', name='Ash Phoenix', size=3, flies=True,
             what='A great bird of prey in charred, ash-barred feathers: a gold beak, a tall plume crest, ember-orange '
                  'wings and a long trailing tail.',
             notes=[(True, 'From behind it passes every check.'),
                    (False, 'From the front we kept the first painting, with natural feathered wings raised in a V like '
                            'your portrait. It differs from our clay model’s fanned wings, so it misses our camera '
                            'check (question 6).')]),
        dict(id='pyreLord', name='Pyre Lord', size=4,
             what='A stern ash-grey lord in a gold flame crown, dark scale armour and a singed ember-orange mantle, '
                  'holding a glaive.',
             notes=[(True, 'Passes every check in both views. Like your portrait, it has no ash stripes on the face and '
                           'arms.')]),
        dict(id='cinderIdol', name='Cinder Idol', size=6, still=True,
             what='A tall granite slab on a stepped plinth, a stern face carved into its front, coals glowing low in a '
                  'brazier hollowed into the top, glyphs filled with orange.',
             notes=[(True, 'Passes every check in both views. From behind, the brazier and glyphs show and the face is on '
                           'the far side. Its smoke is drawn by the game in stage D.')]),
        dict(id='emberHierophant', name='Ember Hierophant', size=2,
             what='A priest-god in a smooth gold face-mask under a charcoal hood, an ember-orange mantle and a staff '
                  'with a dark glass orb in a gold claw.',
             notes=[(True, 'Passes every check in both views.')]),
    ]),
    ('Thornwood’s own gods', [
        dict(id='wildSpirit', name='Wild Spirit', size=2,
             what='A lean, deer-like beast the size of a horse, only half there: tall branching antlers, a ruff of green '
                  'leaves, stripes on the flanks.',
             notes=[(True, 'From behind it now stands on all four hooves (it reared up on its hind legs). Both views pass '
                           'our checks.'),
                    (False, 'From behind it stands taller on screen than from the front (2.2 men against 1.5), because '
                            'its body runs straight away from the camera. Its mist and flicker come with stage D.')]),
        dict(id='worldTree', name='World Tree', size=6, still=True,
             what='A vast ancient oak: a round green crown, deeply ridged bark, huge roots, and no face anywhere.',
             notes=[(True, 'Passes every check in both views.'),
                    (False, 'Its trunk twists less than your portrait’s.')]),
        dict(id='hornedHunter', name='Horned Hunter', size=4,
             what='A fierce bearded hunter-god with tall antlers and stripe warpaint, a mantle of green cloth leaves and '
                  'a spear with a long gold leaf blade.',
             notes=[(True, 'The teal shoulder plates that showed under its mantle from behind (not in your portrait) are '
                           'now worn bronze. Both views pass our checks.')]),
        dict(id='elderWyrm', name='Elder Wyrm', size=6,
             what='A long, heavy, low-slung dragon with no wings, built like a giant salamander and crawling low: a crown '
                  'of spines, green moss along its back, a club tail.',
             notes=[(True, 'Passes every check in both views.'),
                    (False, 'The tallest figure on screen, 11 men from the front and 12 from behind, because its long body '
                            'runs back into the depth (question 5). From behind, the tail ends in a spiked knob rather '
                            'than a full club.')]),
        dict(id='motherOfBeasts', name='Mother of Beasts', size=4,
             what='A strong woman in her prime with an antler crown, a whole bear pelt for a cloak, a green dress and a '
                  'plain heavy maul.',
             notes=[(True, 'Passes every check in both views.')]),
    ]),
    ('Gods either nation can take', [
        dict(id='oracle', name='Oracle of the Flux', size=2, both=True,
             what='A robed seer floating a hand above the ground: a deep cowl, glyphs down the robe, a staff with a smoky '
                  'glass orb in gold bands.',
             notes=[(True, 'Passes every check in both views; the face shows under the cowl, as in your portrait.')]),
        dict(id='titan', name='Titan', size=4, both=True,
             what='A giant knight-god: a closed, flat-topped great helm, plain plate of old gold, a tabard in the '
                  'nation’s colour, a great sword held point-down.',
             notes=[(True, 'Passes every check in both views. From behind, the sword is hidden in front of the body.')]),
        dict(id='greatWyrm', name='Great Wyrm', size=6, flies=True, both=True, battle='a',
             what='A four-legged winged dragon: two horns swept straight back, banded bronze scales, wings in the '
                  'nation’s colour, a spade-tipped tail. Thornwood’s god in battle a.',
             notes=[(True, 'Passes every check in both views. From the front its neck rises toward the camera, so the head '
                           'shows before the chest rather than high above it.')]),
        dict(id='livingMonolith', name='Living Monolith', size=6, still=True, both=True,
             what='A tall, rough granite slab rooted in the earth: a broken top, no face, rows of carved glyphs filled '
                  'with the nation’s colour.',
             notes=[(True, 'Its front now stands on the same mound of earth, stones and roots as its back. Both views pass '
                           'our checks.'),
                    (False, 'That front came out nearly a copy of its back. The slab is much the same from both sides, so '
                            'in the game it barely shows.')]),
        dict(id='ascendedHero', name='Ascended Hero', size=2, both=True,
             what='A calm, ageless hero: a gold circlet, a plain breastplate, a long cape in the nation’s colour, a '
                  'straight sword.',
             notes=[(True, 'His front is now drawn at the height of his back (it was 17% shorter, so he shrank when he '
                           'turned). From behind he passes every check.'),
                    (False, 'From the front he is slimmer and more square to the camera than our clay model, so he misses '
                            'our camera check; he has your portrait’s young face and short dark hair.')]),
        dict(id='primordial', name='Primordial', size=6, both=True,
             what='A massive primeval beast, part bull, part giant sloth, its bull’s head carried low: huge ram’s '
                  'horns, a shaggy beard, a mottled hide, a moss back and a club tail.',
             notes=[(True, 'From behind it passes every check. The orange moss of the Cinder colours is in your portrait '
                           'too.'),
                    (False, 'From the front it is true to your portrait, with the head lower and the body wider than our '
                            'clay model, so it misses our camera check (question 6).')]),
    ]),
]

# ------------------------------------------------------------------ 3. questions (critique.md, owner questions 1 to 9)
# key, short (verdict line), buttons (the suggested answer first), suggested, heading, body
QUESTIONS = [
    dict(key='q:hornetPortrait', id='hornet', short='Hornet portrait', buttons=['B', 'A'], rec='B',
         title='The Hornet Swarm’s portrait',
         body='You did not pick a hornet portrait on the stage B page, so B (lean and dark, open jaws, a torn wing) '
              'stands in, and the figure was painted from it. Keep B, or pick A (the heavier, hard-shelled hornet) and '
              'we repaint the figure from A, one or two paintings.'),
    dict(key='q:wolfFront', id='wolfFront', short='Wolf Rider front', buttons=['War Wolf harness', 'Kept test'],
         rec='War Wolf harness', title='The Wolf Rider seen from the front',
         body='Enemy Wolf Riders face you, so they show their front. Two fronts are ready: the War Wolf harness (the '
              'pilot test you kept, repainted with your approved War Wolf’s coat, bark breast harness and bone '
              'cord) or the kept test as it was (grey wolves, a cloth chest). The battle mockup shows the harness; a '
              'switch at the top of battle c swaps them.'),
    dict(key='q:wolfSize', id='wolfSize', short='Wolf Rider at plan size', buttons=['Yes', 'No'], rec='Yes',
         title='The Wolf Rider at the plan’s size',
         body='The Wolf Rider was drawn a little under the plan’s size, so its War Wolf came out smaller than a '
              'summoned Wolf. We have drawn it at the plan’s size, as you see it on this page and in the mockup: '
              'the War Wolf as big as a summoned Wolf, the rider 1.14 times a foot soldier. No puts it back. The truly '
              'huge War Wolf, painted apart from its rider, stays for later, as you decided.'),
    dict(key='q:godSize', id='godSize', short='Pretender gods 1.15 larger', buttons=['Yes', 'No'], rec='Yes',
         title='Pretender gods drawn 1.15 times larger',
         body='At their ladder height a size 2 god stood only 1.15 to 1.3 times a commander. We have drawn every god at '
              'its ladder height times 1.15, the pretender factor, the same lift a commander gets over his men, so each god '
              'outgrows its own commanders; summoned monsters stay at the ladder. It costs no painting. No puts the '
              'gods back at the ladder.'),
    dict(key='q:longBodies', id='longBodies', short='Long bodies', buttons=['Keep', 'Shorter'], rec='Keep',
         title='Long bodies at their camera-true height',
         body='Wyrms and the Primordial stand taller on screen than their ladder height, because their length runs '
              'back into the depth at the camera’s angle, as your approved Salamander does. The Elder Wyrm stands '
              '11 men tall from the front. Keep these true heights, or draw long bodies shorter, at their ladder height?'),
    dict(key=None, id='departures', title='Three figures that differ from our clay models',
         body='Each figure is painted over a clay model posed at the battle camera. These three follow your portrait '
              'rather than the model; we suggest keeping them.',
         rows=[dict(key='q:phoenixFront', short='Ash Phoenix front', label='Ash Phoenix, front', buttons=['Keep', 'Redo'],
                    rec='Keep', text='Natural feathered wings raised in a V, as in your portrait, instead of the '
                                     'model’s fans.'),
               dict(key='q:primordialFront', short='Primordial front', label='Primordial, front', buttons=['Keep', 'Redo'],
                    rec='Keep', text='The head lower and the body wider than the model, as in your portrait.'),
               dict(key='q:spriteWings', short='Fire Sprite wings', label='Fire Sprite, winged', buttons=['Keep', 'Redo'],
                    rec='Keep', text='Two flame wings and a tail so it can fly, which your bust does not show. It glows '
                                     'from stage D.')]),
    dict(key='q:thornPalettes', id='palettes', short='Thornwood god palettes', buttons=['Accept', 'Repaint'],
         rec='Accept', title='Thornwood colours for the six shared gods',
         body='The six gods either nation can take get their Thornwood colours as a colour edit of the Cinder figure, '
              'the same edit you approved on their portraits: only the cloth, wings, moss or glyphs change, and no '
              'orange is left behind. Accept, or have each repainted in Thornwood colours (about 12 paintings).'),
]
