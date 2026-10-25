# Stage B, key "cmdB": every Thornwood commander face (Scout, Warden Captain, Grove Priest, Sapling Druid, Elder Druid:
# 8 each) and the Independent Captain mountaineer and reedman outfits (12 each). Each face's identity marks, in order,
# written from its approved portrait (art-source/portraits/<nation>/<unit>/NN.webp, looked at on
# work/cmdB/review/portraits-<unit>.png) and its sidecar prompt (src/assets/raster/portraits/<nation>/<unit>/NN.json,
# "Person" and "Kit", or "Traits" where the sidecar has no "Person"). Where the portrait and the sidecar text differ,
# the portrait wins (Image 2 is what the generator sees): Warden Captain 08's sidecar says one antler is broken, the
# portrait shows two whole antlers. The marks that show from behind are flagged True. The headgear, the mantle or
# cloak and the weapon carry a face at figure scale (calibration 1.3); face-sized marks are named but not required.
# FACES[face] = (kind, nation dir, unit dir, number, 'man'|'woman'|'person', [(mark, seen from behind), ...])
# 'person' is used where the portrait does not say (Grove Priest 02 and 07): the prompt then says "the priest".

KNIFE = ('the long knife of dark iron with a bone grip', True)
SWORD_T = ('the plain straight sword with a simple cross guard', True)
STAFF_GNARL = ('the tall gnarled staff of dark wood', True)
SWORD_I = ('the plain straight sword with a simple cross guard', True)

F = {}

# ---------------------------------------------------------------- Thornwood Scout (thornScout): dagger
F['ts01'] = ('twScout', 'thornwood', 'thornScout', '01', 'man', [
    ('the close hood of overlapping dark green oak leaves, pulled up over the head', True),
    ('the thick collar of rough brown wool around the neck', True),
    ('his lean young beardless face with two thin green stripes painted across each cheek', False),
    ('the toggle made from a thorn twig at the throat', False),
    ('the short cape of overlapping oak leaves over the shoulders and a bark-brown leather jerkin', True), KNIFE])
F['ts02'] = ('twScout', 'thornwood', 'thornScout', '02', 'woman', [
    ('the hood of overlapping pale beech leaves, olive and light tan, pulled up over the head', True),
    ('her long dark-brown braid hanging from under the hood over one shoulder', True),
    ('the scarf of moss-green wool wound around the neck', True),
    ('her freckled oval face with a row of small green paint dots along each cheekbone', False),
    ('the small carved wooden wren on a cord at the chest', False), KNIFE])
F['ts03'] = ('twScout', 'thornwood', 'thornScout', '03', 'man', [
    ('the hood of overlapping dark glossy holly leaves, pulled up over the head', True),
    ('his square face with a short brown beard and a thin green band painted across the eyes like a mask', False),
    ('the leather collar closed with a bone toggle', False),
    ('the leather strap across the chest', True),
    ('the bark-brown leather jerkin under a short cape of holly leaves', True), KNIFE])
F['ts04'] = ('twScout', 'thornwood', 'thornScout', '04', 'man', [
    ('the hood of overlapping long fern fronds that hang down over the shoulders', True),
    ('his gaunt long face with close grey stubble and one thin green line painted down the forehead and nose', False),
    ('the bark-brown leather jerkin', True),
    ('the small wooden whistle on a thong at the chest', False), KNIFE])
F['ts05'] = ('twScout', 'thornwood', 'thornScout', '05', 'woman', [
    ('the deep close hood of overlapping long olive chestnut leaves with toothed edges, its rim framing the face', True),
    ('her broad face with deep umber skin and a thin green chevron painted on each cheek', False),
    ('the collar of woven bark strips', True),
    ('the clasp shaped like a hawk feather', False),
    ('the short cape of chestnut leaves over a bark-brown leather jerkin', True), KNIFE])
F['ts06'] = ('twScout', 'thornwood', 'thornScout', '06', 'man', [
    ('the hood of overlapping small dry russet-brown birch leaves', True),
    ('his long white hair escaping the hood over the shoulders', True),
    ('his old weathered face with a thin white moustache and no beard', False),
    ('the cloak of patched brown wool', True),
    ('the string of small antler-tip charms at the chest', False), KNIFE])
F['ts07'] = ('twScout', 'thornwood', 'thornScout', '07', 'man', [
    ('the hood of large overlapping heart-shaped linden leaves in dull olive and dry tan, each leaf clearly a leaf', True),
    ('his round face with curly black hair and a thin black beard along the jaw', False),
    ('the three small green dots painted on his forehead', False),
    ('the twine-wrapped leather collar', True),
    ('the clasp of a smooth grey river stone', False), KNIFE])
F['ts08'] = ('twScout', 'thornwood', 'thornScout', '08', 'man', [
    ('the hood of overlapping dark ivy leaves', True),
    ('the long braided red-brown beard', False),
    ('the short shaggy mantle of green moss over the shoulders', True),
    ('his heavy brow and crooked broken nose, with a thin green spiral painted on one cheek', False),
    ('the clasp shaped like a twist of thorny bramble', False), KNIFE])

# ---------------------------------------------------------------- Warden Captain (wardenCaptain): sword
F['wc01'] = ('twChief', 'thornwood', 'wardenCaptain', '01', 'man', [
    ('the helm of dark oak-bark plates with a pair of antlers', True),
    ('his full dark beard and long dark-brown braids hanging over the chest', False),
    ('the cloak of large dark green oak leaves over the shoulders and down the back', True),
    ('the carved wooden acorn clasp at the chest', False),
    ('the armour of layered bark plates', True), SWORD_T])
F['wc02'] = ('twChief', 'thornwood', 'wardenCaptain', '02', 'man', [
    ('the pale cream birch-bark helm with forked antlers', True),
    ('his long auburn hair tied back', True),
    ('his long clean-shaven face', False),
    ('the cloak of dark glossy holly leaves with a few small red berries', True),
    ('the clasp carved as a pale stag skull at the chest', False), SWORD_T])
F['wc03'] = ('twChief', 'thornwood', 'wardenCaptain', '03', 'man', [
    ('the helm of layered bark plates with a pair of antlers', True),
    ('his short beard with moss in it and a stern mouth', False),
    ('the cloak of green leaves with a few small pale cream blossoms', True),
    ('the round carved bark discs on both shoulders', True),
    ('the armour of layered bark plates', True), SWORD_T])
F['wc04'] = ('twChief', 'thornwood', 'wardenCaptain', '04', 'man', [
    ('the lichen-covered bark helm with small curled antler tips', True),
    ('his white beard braided in two and long grey braids', False),
    ('the cloak of amber autumn leaves over the shoulders and down the back', True),
    ('the necklace of wooden beads', False),
    ('the armour of layered bark plates', True), SWORD_T])
F['wc05'] = ('twChief', 'thornwood', 'wardenCaptain', '05', 'man', [
    ('the helm of layered bark plates with a pair of antlers', True),
    ('his young face with a thin beard, a scar on the chin and long braids', False),
    ('the cloak of green leaves with a few small pale cream blossoms', True),
    ('the round carved bark discs on both shoulders', True),
    ('the armour of layered bark plates', True), SWORD_T])
F['wc06'] = ('twChief', 'thornwood', 'wardenCaptain', '06', 'man', [
    ('the thick oak-bark helm with broad flat palmate antlers like a moose', True),
    ('his full red-brown beard', False),
    ('the cloak of oak leaves and moss over the shoulders and down the back', True),
    ('the round clasp carved with a spiral', False),
    ('the armour of layered bark plates', True), SWORD_T])
F['wc07'] = ('twChief', 'thornwood', 'wardenCaptain', '07', 'man', [
    ('the helm of overlapping pine-bark scales with short swept-back antlers', True),
    ('his narrow clean-shaven face with a leaf-shaped green tattoo on the cheek', False),
    ('the cloak of dark pine needles over the shoulders and down the back', True),
    ('the clasp shaped like a pine cone', False),
    ('the armour of layered bark scales', True), SWORD_T])
F['wc08'] = ('twChief', 'thornwood', 'wardenCaptain', '08', 'man', [
    ('the moss-grown bark helm with tall branching antlers', True),
    ('his long white beard and white braids', False),
    ('the cloak of grey-green willow leaves over the shoulders and down the back', True),
    ('the bundle of dried herbs hanging at the chest', False),
    ('the armour of layered bark plates', True), SWORD_T])

# ---------------------------------------------------------------- Grove Priest (grovePriest): staff, no hood
F['gp01'] = ('twDruid', 'thornwood', 'grovePriest', '01', 'man', [
    ('the wreath crown of oak leaves on his long grey hair, with moss in the hair', True),
    ('the long white beard', False),
    ('the plain green-grey robe to the ground with a mantle of leaves on the shoulders', True),
    ('the carved leaf clasp at the chest', False), STAFF_GNARL])
F['gp02'] = ('twDruid', 'thornwood', 'grovePriest', '02', 'person', [
    ('the wreath of ivy on the head', True),
    ('the two long braids of auburn hair falling over the shoulders', True),
    ('the young calm freckled beardless face', False),
    ('the moss-dyed green robe to the ground with its hood down on the shoulders', True),
    ('the clasp carved as a small owl', False), STAFF_GNARL])
F['gp03'] = ('twDruid', 'thornwood', 'grovePriest', '03', 'man', [
    ('the wreath of mistletoe with small white berries on the head', True),
    ('his short black beard and deep brown skin', False),
    ('the bark-brown robe to the ground with a mantle of green leaves on the shoulders', True),
    ('the clasp carved as a spiral', False), STAFF_GNARL])
F['gp04'] = ('twDruid', 'thornwood', 'grovePriest', '04', 'man', [
    ('the wreath of pale bare birch twigs on the head', True),
    ('his long loose black hair to the shoulders', True),
    ('his narrow beardless face and the thin silver ring in one ear', False),
    ('the grey-green robe to the ground with a woven border and a thick wrapped scarf', True),
    ('the clasp carved as a deer head', False), STAFF_GNARL])
F['gp05'] = ('twDruid', 'thornwood', 'grovePriest', '05', 'man', [
    ('the wreath of fern fronds and moss on the head', True),
    ('his moss-tangled brown beard', False),
    ('the dark green robe to the ground with a mantle of bark-brown leaves on the shoulders', True),
    ('the clasp carved as a mushroom', False), STAFF_GNARL])
F['gp06'] = ('twDruid', 'thornwood', 'grovePriest', '06', 'man', [
    ('the wreath crown of oak leaves and thorny twigs on the head', True),
    ('his weathered face with a scar across the nose and a braided dark beard', False),
    ('the green-grey robe to the ground with a thick wrapped scarf', True),
    ('the carved leaf clasp', False), STAFF_GNARL])
F['gp07'] = ('twDruid', 'thornwood', 'grovePriest', '07', 'person', [
    ('the wreath of willow catkins on the head', True),
    ('the long grey hair in a single braid over the shoulder', True),
    ('the old thoughtful beardless face', False),
    ('the robe the colour of lichen to the ground, its hood down on the shoulders', True),
    ('the clasp carved as a feather', False), STAFF_GNARL])
F['gp08'] = ('twDruid', 'thornwood', 'grovePriest', '08', 'man', [
    ('the wreath of rowan leaves with small orange berries on the head', True),
    ('his grey braids with wooden beads and a short grey beard', False),
    ('the moss-green robe to the ground with a rope belt', True),
    ('the clasp carved as a stag antler', False), STAFF_GNARL])

# ---------------------------------------------------------------- Sapling Druid (saplingDruid): staff, hood down
F['sd01'] = ('twDruid', 'thornwood', 'saplingDruid', '01', 'man', [
    ('the circlet of woven pale willow withies on short tousled light-brown hair', True),
    ('the moss-green wool cloak, its hood down, edged with a band of undyed cream wool', True),
    ('his soft young beardless face', False),
    ('the plain wooden toggle clasp', False), STAFF_GNARL])
F['sd02'] = ('twDruid', 'thornwood', 'saplingDruid', '02', 'woman', [
    ('the circlet of birch twigs with tiny new leaves', True),
    ('her long loose dark hair', True),
    ('the moss-green wool cloak over a bark-brown leaf tunic', True),
    ('the necklace of brown seed beads and the clasp carved as a leaf bud', False), STAFF_GNARL])
F['sd03'] = ('twDruid', 'thornwood', 'saplingDruid', '03', 'man', [
    ('the circlet of hazel twigs with hanging catkins', True),
    ('his black hair in a topknot', True),
    ('his long narrow face with a thin moustache', False),
    ('the collar of plaited grass cord and the hazelnut clasp', False),
    ('the moss-green wool cloak, its hood down', True), STAFF_GNARL])
F['sd04'] = ('twDruid', 'thornwood', 'saplingDruid', '04', 'man', [
    ('the circlet of black thorn twigs with a few small white blossoms', True),
    ('his short red-brown hair and patchy young beard', False),
    ('the leather strap across the chest', True),
    ('the moss-green wool cloak trimmed with bark-brown leather', True), STAFF_GNARL])
F['sd05'] = ('twDruid', 'thornwood', 'saplingDruid', '05', 'woman', [
    ('the circlet of dark yew twigs', True),
    ('her straight black hair cut in a blunt line at the jaw, with a short fringe', True),
    ('the moss-green hood thrown back onto the shoulders', True),
    ('the bone clasp shaped like a snail shell', False), STAFF_GNARL])
F['sd06'] = ('twDruid', 'thornwood', 'saplingDruid', '06', 'man', [
    ('the circlet of oak twigs with tiny acorns', True),
    ('his close-cropped tightly curled black hair', True),
    ('the moss-green wool cloak pinned with a plain bronze ring', False),
    ('the leather pouch strap over the shoulder', True), STAFF_GNARL])
F['sd07'] = ('twDruid', 'thornwood', 'saplingDruid', '07', 'man', [
    ('the circlet of larch twigs with tiny cones', True),
    ('his sandy hair tied back', True),
    ('his lean face with a short close beard', False),
    ('the collar of grey felt and the clasp carved as a coiled fern', False),
    ('the moss-green wool cloak, its hood down', True), STAFF_GNARL])
F['sd08'] = ('twDruid', 'thornwood', 'saplingDruid', '08', 'man', [
    ('the circlet of grey ash twigs sitting on his shaved scalp', True),
    ('his short thick black beard', False),
    ('the moss-green wool cloak with a frayed hem', True),
    ('the clasp of a carved wooden ring', False), STAFF_GNARL])

# ---------------------------------------------------------------- Elder Druid (elderDruid): staff, hood with antlers
F['ed01'] = ('twDruid', 'thornwood', 'elderDruid', '01', 'man', [
    ('the moss-green wool hood with two small forked antlers rising from it', True),
    ('the very long white beard with moss woven into it, falling to the belly', False),
    ('the collar of overlapping bark plates over the shoulders', True),
    ('the clasp carved as an owl at the throat', False),
    ('the long robe of layered bark-brown and moss-green cloth', True), STAFF_GNARL])
F['ed02'] = ('twDruid', 'thornwood', 'elderDruid', '02', 'woman', [
    ('the bark-brown hood with short straight antler spikes', True),
    ('her heavy grey plait over one shoulder', False),
    ('the shawl of lichen-grey wool over the shoulders', True),
    ('the necklace of carved wooden discs', False),
    ('her round soft old face', False), STAFF_GNARL])
F['ed03'] = ('twDruid', 'thornwood', 'elderDruid', '03', 'man', [
    ('the ragged hood with tiny curled antler nubs', True),
    ('his thin wispy white beard', False),
    ('the frayed mantle grown over with moss', True),
    ('the cord of dried seed pods', False), STAFF_GNARL])
F['ed04'] = ('twDruid', 'thornwood', 'elderDruid', '04', 'man', [
    ('the leaf-patterned hood with two tiny antler stubs just above the brow', True),
    ('his thick grey-brown beard braided with moss', False),
    ('the collar of woven roots over the shoulders', True),
    ('the clasp shaped like a leaping stag', False), STAFF_GNARL])
F['ed05'] = ('twDruid', 'thornwood', 'elderDruid', '05', 'woman', [
    ('the grey-green hood with slender branching antlers', True),
    ('her white hair in many thin braids', True),
    ('her narrow old face with high cheekbones', False),
    ('the necklace of acorn cups and the clasp of polished bone', False),
    ('the long robe', True), STAFF_GNARL])
F['ed06'] = ('twDruid', 'thornwood', 'elderDruid', '06', 'man', [
    ('the dark bark-brown leather hood with small antlers wrapped in ivy', True),
    ('his short dark beard streaked with grey, and a pale scar from the cheek to the jaw', False),
    ('the collar of overlapping oak leaves over the shoulders', True),
    ('the clasp carved as a beetle', False), STAFF_GNARL])
F['ed07'] = ('twDruid', 'thornwood', 'elderDruid', '07', 'man', [
    ('the hood of dun-brown deer hide with the short fur on, with two tiny rounded antler buds above the brow', True),
    ('his bushy white moustache and short white beard', False),
    ('the pendant of a grey stone with a hole through it', False),
    ('the clasp carved as a hare', False), STAFF_GNARL])
F['ed08'] = ('twDruid', 'thornwood', 'elderDruid', '08', 'man', [
    ('the soft loose hood of faded olive-brown wool hanging in deep folds', True),
    ('the two very short antler nubs barely poking through the hood above the brow', True),
    ('the long thin grey moustache hanging down past the jaw, over a clean-shaven chin', False),
    ('the collar of brown owl feathers', True),
    ('the clasp shaped like a crescent moon', False),
    ('the long robe of layered bark-brown and olive cloth', True), STAFF_GNARL])

# ---------------------------------------------------------------- Independent Captain, mountaineer gear: sword
MU = 'independentCaptain-mountaineer'
F['mt01'] = ('cmdLevy', 'independent', MU, '01', 'man', [
    ('the conical iron helm with a straight nose guard and a deep dent on one side of the cone', True),
    ('his thick dark brown beard with grey streaks', False),
    ('the heavy mantle of grey wolf fur over the shoulders and down the back', True),
    ('the plain iron ring fastening the mantle at the chest', False), SWORD_I])
F['mt02'] = ('cmdLevy', 'independent', MU, '02', 'woman', [
    ('the rounded iron skullcap helm with two hinged cheek plates and a dent above the brow', True),
    ('her two thick dark blonde braids falling from under the helm', True),
    ('the mantle of thick brown bear fur over the shoulders and down the back', True),
    ('the carved bone toggle at the chest', False), SWORD_I])
F['mt03'] = ('cmdLevy', 'independent', MU, '03', 'man', [
    ('the battered open iron kettle helm with a narrow brim all round', True),
    ('his young narrow face with short black stubble', False),
    ('the patchwork mantle of small brown and grey rabbit pelts', True),
    ('the plain cord tying the mantle at the chest', False), SWORD_I])
F['mt04'] = ('cmdLevy', 'independent', MU, '04', 'man', [
    ('the old segmented iron helm of riveted plates with a short mail curtain at the back of the neck', True),
    ('his long white hair and long white beard bound with leather cords', False),
    ('the heavy mantle of long shaggy black-brown musk-ox fur', True),
    ('the heavy round iron brooch at the chest', False), SWORD_I])
F['mt05'] = ('cmdLevy', 'independent', MU, '05', 'man', [
    ('the tall pointed iron helm with a flared rim at the base and a dent near the point', True),
    ('his broad face with dark brown skin and a full short black beard', False),
    ('the mantle of tawny-grey mountain lion fur over the shoulders', True),
    ('the dark mail shirt under the mantle', True), SWORD_I])
F['mt06'] = ('cmdLevy', 'independent', MU, '06', 'woman', [
    ('the low flat-topped iron helm with a broad nose bar bent slightly askew and a leather flap at the back of the neck', True),
    ('her square heavy-jawed face with short grey hair', False),
    ('the mantle of grey-brown sheepskin with the thick curly wool turned outward', True),
    ('the horn toggle on a looped leather cord', False), SWORD_I])
F['mt07'] = ('cmdLevy', 'independent', MU, '07', 'man', [
    ('the tall rounded iron helm with a thick raised iron comb running front to back over the crown', True),
    ('his reddish-brown hair loose to the shoulders and short reddish-brown beard', True),
    ('the mantle of grey-brown spotted lynx fur', True),
    ('the short antler pin at the chest', False), SWORD_I])
F['mt08'] = ('cmdLevy', 'independent', MU, '08', 'man', [
    ('the round iron helm whose dented dome shows above a rim of dark fur, with long fur earflaps', True),
    ('his long thin black moustache drooping past the bare chin', False),
    ('the mantle of long shaggy dark brown yak hair', True),
    ('the string of bone beads at the collar', False), SWORD_I])
F['mt09'] = ('cmdLevy', 'independent', MU, '09', 'man', [
    ('the simple open iron helm with a plate guarding the back of the neck', True),
    ('the wool scarf wound at the throat', False),
    ('the mantle of long-haired cream-white goatskin over the shoulders and down the back', True),
    ('the twisted iron clasp', False), SWORD_I])
F['mt10'] = ('cmdLevy', 'independent', MU, '10', 'man', [
    ('the old dented iron helm with a short peak at the front and a square repair patch riveted on one side', True),
    ('his craggy old face with bushy white eyebrows and white stubble', False),
    ('the mantle of matted black bear fur gone grey at the tips', True),
    ('the heavy iron chain across the chest', False), SWORD_I])
F['mt11'] = ('cmdLevy', 'independent', MU, '11', 'man', [
    ('the rounded iron helm with a long flared tail of iron sweeping down over the back of the neck', True),
    ('his thick curly dark beard', False),
    ('the mantle of dull brown deer hide with the hair on', True),
    ('the carved wooden toggle at the chest', False), SWORD_I])
F['mt12'] = ('cmdLevy', 'independent', MU, '12', 'woman', [
    ('the old iron helm with a rounded crown and a wide iron brow band over a grey wool hood', True),
    ('her silver hair in a braid over the shoulder', False),
    ('the mantle of grey-and-white striped badger fur', True),
    ('the plain iron disc brooch at the chest', False), SWORD_I])

# ---------------------------------------------------------------- Independent Captain, reedman gear: sword
RU = 'independentCaptain-reedman'
F['rd01'] = ('cmdLevy', 'independent', RU, '01', 'man', [
    ('the short cylindrical leather cap with a flat top, a twist of dried reed wound around its base', True),
    ('his long black hair tied back', True),
    ('the cloak of tightly plaited straw-tan reeds in a herringbone weave', True),
    ('the cord of small white fish-bone beads at the throat', False), SWORD_I])
F['rd02'] = ('cmdLevy', 'independent', RU, '02', 'woman', [
    ('the soft leather cap with a rolled rim, pushed back, with a single grey heron feather tucked into the rim', True),
    ('her dark auburn hair loose to the jaw', True),
    ('the shaggy cloak of long loose reed stalks hanging in layers like thatch', True),
    ('her pale freckled face', False), SWORD_I])
F['rd03'] = ('cmdLevy', 'independent', RU, '03', 'man', [
    ('the flat round leather cap like a flat cake', True),
    ('his young round face with short dark curly hair and no beard', False),
    ('the short cape of woven reed matting tied at the neck with twine', True),
    ('the small carved wooden fish charm on a cord', False), SWORD_I])
F['rd04'] = ('cmdLevy', 'independent', RU, '04', 'man', [
    ('the old cracked leather cap with long earflaps hanging loose', True),
    ('his sparse white beard', False),
    ('the heavy cloak of dark weathered rushes bound in rows with twine', True),
    ('the necklace of small grey river shells', False), SWORD_I])
F['rd05'] = ('cmdLevy', 'independent', RU, '05', 'man', [
    ('the cap of scuffed dark brown boiled leather with a row of small iron studs around the band', True),
    ('his close-cropped brown beard and broken nose', False),
    ('the cloak of coarse straw-tan reed stalks plaited in thick visible rows, with a collar of darker bundled rush', True),
    ('the plain iron ring closing the cloak', False), SWORD_I])
F['rd06'] = ('cmdLevy', 'independent', RU, '06', 'woman', [
    ('the short conical leather cap stitched from four panels, ending in a small knot at the top', True),
    ('her black hair in a thick knot at the nape held by a bone pin', True),
    ('the cloak of sedge woven in a checker pattern of pale and dark reeds', True),
    ('the clasp of braided eel-skin cord', False), SWORD_I])
F['rd07'] = ('cmdLevy', 'independent', RU, '07', 'man', [
    ('the thin leather skullcap with its chin strap hanging undone', True),
    ('his lank dark hair to the jaw and sparse moustache', False),
    ('the ragged reed cloak with a frayed fringe at the shoulders', True),
    ('the bone fishhook amulet on a thong', False), SWORD_I])
F['rd08'] = ('cmdLevy', 'independent', RU, '08', 'man', [
    ('the sweat-stained leather cap with a short wide brim all round', True),
    ('his heavy round face with a close grey-white beard', False),
    ('the cloak of thick bundled reeds hanging like a straw rain cape', True),
    ('the flat grey stone net-weight hanging on a cord', False), SWORD_I])
F['rd09'] = ('cmdLevy', 'independent', RU, '09', 'woman', [
    ('the small pointed leather cap whose soft tip bends forward, laced up the back', True),
    ('her straight brown hair with a short fringe under the cap', False),
    ('the light cloak of thin woven rushes with a braided rush collar', True),
    ('the small bone charm carved like a frog on a cord', False), SWORD_I])
F['rd10'] = ('cmdLevy', 'independent', RU, '10', 'man', [
    ('the tall soft leather cap folded over to one side', True),
    ('his long grey beard knotted partway down with reed twine, and long stringy grey hair', True),
    ('the cloak of old reeds gone dark grey-brown with age', True),
    ('the small tarnished copper clasp', False), SWORD_I])
F['rd11'] = ('cmdLevy', 'independent', RU, '11', 'man', [
    ('the round leather cap with a broad soft brim pinned up on one side with a bone pin', True),
    ('his square face with black stubble beard', False),
    ('the reed cloak bound in horizontal bands of dark twine', True),
    ('the plain leather strap across the chest', True), SWORD_I])
F['rd12'] = ('cmdLevy', 'independent', RU, '12', 'man', [
    ('the tight leather cap shaped like a headscarf knotted at the back of the head, its two ends hanging behind', True),
    ('his thick grey-streaked brown beard', False),
    ('the cloak of plaited reeds with a stiff high reed collar standing up behind the neck', True),
    ('the string of pike teeth at the throat', False), SWORD_I])

FACES = F
GROUPS = {}
for _f, _v in F.items():
    GROUPS.setdefault(_v[2], []).append(_f)
