# Stage B, key "cmdA": every Cinder Horde commander face (Scout, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus:
# 8 each) and the Independent Captain levy and hunter outfits (12 each). Each face's identity marks, in order, written
# from its approved portrait and its sidecar prompt (src/assets/raster/portraits/<nation>/<unit>/NN.json, "Person" and
# "Kit"), with the marks that show from behind flagged (b). The headgear, the mantle or collar and the weapon carry a
# face at figure scale (calibration 1.3); face-sized marks are named but not required by the check.
# FACES[face] = (kind, nation dir, unit dir, number, 'man'|'woman', [(mark, seen from behind), ...])

KNIFE = ('the long knife of dark iron', True)
AXE = ('the jagged single-bit dark iron axe', True)
BRAZIER = ('the staff of blackened wood topped with a small iron brazier of dull unlit coals', True)
ADEPT_STAFF = ('the slender staff of blackened wood', True)
MAGUS_STAFF = ('the tall staff of blackened wood crowned with an iron cage holding a dull ember', True)
SWORD = ('the plain straight sword with a simple cross guard', True)

F = {}

# ---------------------------------------------------------------- Cinder Scout (cmdScout)
F['cs01'] = ('cmdScout', 'cinderHorde', 'cinderScout', '01', 'man', [
    ('the low round close-fitting charcoal hood with no brim and no peak, its front edge bound with dark leather', True),
    ('the pale ash-grey wool scarf pulled up over his nose and mouth and wound thick around the neck', True),
    ('the band of black soot painted across his eyes from temple to temple', False),
    ('the small square iron buckle at the throat', False),
    ('the leather strap across the chest', True), KNIFE])
F['cs02'] = ('cmdScout', 'cinderHorde', 'cinderScout', '02', 'woman', [
    ('the loose charcoal hood with a ragged hem', True),
    ('her long dark braid falling from under the hood over one shoulder', True),
    ('her uncovered pale oval face, the black scarf pulled down loose and knotted at the side of the neck', False),
    ('the necklace of three blackened animal teeth', False),
    ('the quilted charcoal jerkin', True), KNIFE])
F['cs03'] = ('cmdScout', 'cinderHorde', 'cinderScout', '03', 'man', [
    ('the low close hood pulled down to the eyebrows and joined to a short shoulder cape of smoke-grey wool with a '
     'ragged edge', True),
    ('the soot-black scarf with a frayed edge wound high over his nose and mouth', True),
    ('his thick bushy grizzled grey eyebrows', False),
    ('the light leather jerkin with no metal plates', True),
    ('the plain leather strap across the chest', True), KNIFE])
F['cs04'] = ('cmdScout', 'cinderHorde', 'cinderScout', '04', 'man', [
    ('the charcoal hood a little too big for him, with a frayed hem', True),
    ('his round beardless boyish face smudged with soot, the scarf half down over the chin', False),
    ('the small iron whistle on a cord', False),
    ('the worn leather shoulder guards with rusted iron edges', True),
    ('the patched smoke-grey tunic', True), KNIFE])
F['cs05'] = ('cmdScout', 'cinderHorde', 'cinderScout', '05', 'man', [
    ('the pointed charcoal hood whose tip stands up, pulled down to the eyebrows', True),
    ('the dark scarf wrapped twice around the neck and up over his mouth and nose', True),
    ('the strip of overlapping iron scales over each shoulder', True),
    ('the long vertical scar through the left eyebrow', False),
    ('the charm of a bent iron nail on a thong', False), KNIFE])
F['cs06'] = ('cmdScout', 'cinderHorde', 'cinderScout', '06', 'woman', [
    ('the close charcoal hood held tight to the head by a narrow band of dark iron across the brow', True),
    ('her straight-cut black fringe and her uncovered broad face', False),
    ('the three short black soot stripes slanting across her cheek like claw marks', False),
    ('the dark scarf wound once around the neck with its long tail thrown back over one shoulder', True),
    ('the plain leather strap across the chest, and no shoulder plates', True), KNIFE])
F['cs07'] = ('cmdScout', 'cinderHorde', 'cinderScout', '07', 'man', [
    ('the tattered low hood tied around the brow with a twisted cord', True),
    ('the long faded smoke-grey scarf wound over his nose and mouth and knotted at the side of the head, its ends '
     'hanging down', True),
    ('his gaunt old face with white bristling eyebrows and a milky, scarred left eye', False),
    ('the heavy iron toggle clasp', False),
    ('the light cracked-leather jerkin with no metal plates', True), KNIFE])
F['cs08'] = ('cmdScout', 'cinderHorde', 'cinderScout', '08', 'man', [
    ('the short close-fitting charcoal hood that hugs the head like a cap', True),
    ('the thick charcoal scarf wound around the neck and up over his mouth and chin, the nose left bare', True),
    ('the black tattoos of flame tongues rising up both cheekbones to the temples', False),
    ('his broad flat face and heavy brows', False),
    ('the light padded charcoal jerkin with leather straps and no shoulder plates', True), KNIFE])

# ---------------------------------------------------------------- Ash Chieftain (cmdChief)
F['ac01'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '01', 'man', [
    ('the rusty dark iron helm with a nasal, cheek guards and two large curled ram horns', True),
    ('the long dark braided beard with bronze rings, and long braids of hair', True),
    ('the heavy mantle of dark bear fur over the shoulders', True),
    ('the pauldrons of overlapping leaf-shaped iron scales, each with a round bronze sun-disc boss', True),
    ('the ash-grey skin with soot stripes', False), AXE])
F['ac02'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '02', 'man', [
    ('the blackened iron helm with short straight bull horns pointing forward and three riveted iron bands', True),
    ('the short cropped iron-grey beard on a long narrow old face', False),
    ('the plate pauldrons, each with a hammered sun-disc boss', True),
    ('the mantle of dark bear fur over the shoulders', True),
    ('the charcoal clothes and dark iron armour with rusted edges', True), AXE])
F['ac03'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '03', 'man', [
    ('the open-faced dark iron helm with two large curled ram horns wrapped in leather cord', True),
    ('his clean-shaven face, dark charcoal-grey skin with three black soot stripes across the brow and cheeks', False),
    ('the mail aventail at the neck', True),
    ('the dark iron pauldrons studded with rows of iron rings', True),
    ('the grey wolf-fur collar over the shoulders', True), AXE])
F['ac04'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '04', 'man', [
    ('the helm with short thick curled horns and an ember-shaped iron crest standing between them', True),
    ('the very long braided black beard threaded with many iron rings, and long black braids', True),
    ('the scale-plate pauldrons', True),
    ('the thin dark red cloth trim at the collar', False),
    ('his heavy brow and fierce wide-eyed stare, ash skin with a warm umber undertone', False), AXE])
F['ac05'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '05', 'man', [
    ('the low rounded dark iron helm with small swept-back horns and a nasal guard', True),
    ('the thin dark moustache on a lean young face with no beard', False),
    ('the black soot handprint across one cheek', False),
    ('the gorget of overlapping iron plates, and no fur mantle', True),
    ('the plain dark leather pauldrons with copper rivets', True), AXE])
F['ac06'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '06', 'man', [
    ('the dark iron crown-helm ringed with short iron spikes like flames, with no horns', True),
    ('the very full, untrimmed dark beard going grey, reaching his chest', False),
    ('the dark iron pauldrons engraved with coiled flame sigils', True),
    ('the mantle of soot-black feathers over the shoulders', True),
    ('the pale crack-like scar down the left cheek', False), AXE])
F['ac07'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '07', 'man', [
    ('the blackened iron helm with large curled ram horns, the left horn broken off short', True),
    ('his clean-shaven, lean hungry face with hollow gaunt cheeks', False),
    ('the long dark braids hanging from under the helm', True),
    ('the scale-plate pauldrons', True),
    ('the dark fur mantle over the shoulders', True), AXE])
F['ac08'] = ('cmdChief', 'cinderHorde', 'ashChieftain', '08', 'man', [
    ('the helm with tall upswept horns capped with iron tips', True),
    ('the long braided white moustache on a beardless, deeply scarred old face', False),
    ('the white hair in two long braids', True),
    ('the gorget of layered iron plates', True),
    ('the cord of small bone charms across the chest', False), AXE])

# ---------------------------------------------------------------- Pyre Priest (cmdPriest)
F['pp01'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '01', 'man', [
    ('the deep charcoal cowl hanging in heavy folds', True),
    ('his old lined face with a shaved chin and soot stripes under the eyes', False),
    ('the ember-shaped iron clasp at the chest', False),
    ('the collar of dark iron rings', True),
    ('the long charcoal robe to the ground', True), BRAZIER])
F['pp02'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '02', 'man', [
    ('the short charcoal hood with an iron circlet across the brow', True),
    ('the short grey beard on a thin face', False),
    ('the dark iron pauldrons with rusted edges', True),
    ('the chain across the chest hung with tiny iron cages holding unlit coals', False),
    ('the clasp shaped like a small brazier', False), BRAZIER])
F['pp03'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '03', 'man', [
    ('the hood pushed back onto his shoulders, his head bare', True),
    ('his shaved scalp covered with dotted ember-coloured tattoos', True),
    ('his young, intense, beardless face', False),
    ('the coiled-flame iron clasp', False),
    ('the collar of bone beads', False), BRAZIER])
F['pp04'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '04', 'man', [
    ('the charcoal hood with an ash-dusted veil hanging down at the sides of the face', True),
    ('the cropped black beard and the burn scar across the jaw', False),
    ('the iron sun-disc clasp on the chest', False),
    ('the layered dark iron collar plates', True),
    ('the long charcoal robe to the ground', True), BRAZIER])
F['pp05'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '05', 'man', [
    ('the tall pointed charcoal hood rising to a point', True),
    ('the long braided beard with iron beads', False),
    ('the black soot handprint over the mouth', False),
    ('the clasp of two crossed iron tongs', False),
    ('the cord of black prayer knots', False), BRAZIER])
F['pp06'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '06', 'man', [
    ('the ragged charcoal hood with burned edges', True),
    ('the sparse white beard on a gaunt old face with sunken eyes', False),
    ('the plain iron ring clasp', False),
    ('the iron censer chain hanging across the chest', False),
    ('the dark iron pauldrons over the robe', True), BRAZIER])
F['pp07'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '07', 'man', [
    ('the plain hood of charcoal cloth', True),
    ('his round face with a stubbled chin and soot stripes across the cheeks', False),
    ('the ember-shaped iron clasp', False),
    ('the collar of dark iron rings', True),
    ('the dark iron pauldrons with rusted edges', True), BRAZIER])
F['pp08'] = ('cmdPriest', 'cinderHorde', 'pyrePriest', '08', 'man', [
    ('the deep charcoal hood', True),
    ('the long forked beard, its two points braided and bound with iron rings', False),
    ('his old face with soot stripes across the cheeks', False),
    ('the collar of dark iron rings', True),
    ('the dark iron pauldrons with rusted edges', True), BRAZIER])

# ---------------------------------------------------------------- Ember Adept (cmdCaster)
F['ea01'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '01', 'man', [
    ('the plain thin blackened-iron circlet on his short messy black hair', True),
    ('his thin young face with a first shadow of dark stubble', False),
    ('the charcoal robe with a high stiff collar and a dull ember-red trim', True),
    ('the small round iron button clasp', False),
    ('the plain cord belt', True), ADEPT_STAFF])
F['ea02'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '02', 'woman', [
    ('the thin blackened-iron circlet with a small iron teardrop hanging at the brow', True),
    ('her long straight dark hair tied back at the nape', True),
    ('the three small soot dots on each cheekbone', False),
    ('the wide charcoal cowl-collar folded down on the shoulders', True),
    ('the charcoal robe to the ground with a dull ember-red trim, and a thin iron chain at the neck', True), ADEPT_STAFF])
F['ea03'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '03', 'man', [
    ('the blackened-iron circlet with a notched front on his shaved head', True),
    ('the thin short beard along the jaw, dark charcoal skin', False),
    ('the charcoal robe with a wrap-over collar and a dull ember-red trim', True),
    ('the leather strap across the chest carrying small stoppered iron vials', True),
    ('the pale burn scar on the right cheek', False), ADEPT_STAFF])
F['ea04'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '04', 'man', [
    ('his black hair gathered on the crown into a tight high topknot bound with an iron ring, the sides of the head '
     'shaved close', True),
    ('the thin blackened-iron circlet worn low across the brow', True),
    ('his lean beardless face with black soot rubbed along the eyelids', False),
    ('the charcoal robe with a high wrapped collar crossing over the chest and a dull ember-red trim', True),
    ('the row of small iron studs along the collar', False), ADEPT_STAFF])
F['ea05'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '05', 'man', [
    ('the blackened-iron circlet with two small prongs at the front', True),
    ('his hair braided at the temples', True),
    ('the thin dark moustache and the soot line along the jaw', False),
    ('the short charcoal mantle thrown over one shoulder', True),
    ('the dark iron clasp shaped like a lump of coal', False), ADEPT_STAFF])
F['ea06'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '06', 'woman', [
    ('the thin blackened-iron circlet worn low across the forehead', True),
    ('her close-cropped ash-white hair', True),
    ('the thin soot line drawn down the forehead to the bridge of the nose', False),
    ('the thick collar of overlapping folds of charcoal cloth', True),
    ('the small iron rings along one ear', False), ADEPT_STAFF])
F['ea07'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '07', 'man', [
    ('his thick unruly black hair with a thin blackened-iron circlet half-hidden in it, no hood', True),
    ('the short dense black beard on a broad face', False),
    ('the charcoal robe to the ground with a padded quilted collar and a dull ember-red trim', True),
    ('the leather book-strap across the chest, with a book at the hip', True),
    ('the iron key hanging on a cord', False), ADEPT_STAFF])
F['ea08'] = ('cmdCaster', 'cinderHorde', 'emberAdept', '08', 'man', [
    ('the thin blackened-iron circlet with a small iron disc at each temple', True),
    ('his long lank black hair falling forward past the cheeks', True),
    ('his gaunt hollow-cheeked young face', False),
    ('the smoke-grey scarf knotted at the neck', True),
    ('the charcoal robe with a frayed dull ember-red trim', True), ADEPT_STAFF])

# ---------------------------------------------------------------- Cinder Magus (cmdCaster)
F['cm01'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '01', 'man', [
    ('the very tall stiff peaked charcoal cowl standing straight up', True),
    ('the long thin grey beard reaching the chest', False),
    ('the dark iron collar plate', True),
    ('the chain of small iron rings across the chest', False),
    ('the long charcoal robe to the ground', True), MAGUS_STAFF])
F['cm02'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '02', 'woman', [
    ('the peaked charcoal cowl with a frayed ragged edge', True),
    ('her white hair in two long braids falling from inside the cowl', True),
    ('her thin hawkish old face with a hooked nose', False),
    ('the twisted iron torc at the throat', False),
    ('the clasp of three small iron coals', False), MAGUS_STAFF])
F['cm03'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '03', 'man', [
    ('the tall, straight, peaked charcoal cowl that does not droop, bound in a spiral by a thin band of dark iron from '
     'the brow up to the tip', True),
    ('his very old sunken face, bald, with wispy white stubble and a band of black soot painted across the forehead', False),
    ('the heavy mantle of layered smoke-grey cloth over the shoulders', True),
    ('the pendant of a black iron sun disc on the chest', False),
    ('the long charcoal robe to the ground', True), MAGUS_STAFF])
F['cm04'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '04', 'man', [
    ('the peaked charcoal cowl with rusted iron bands around its base', True),
    ('the short thick white beard on a broad heavy face', False),
    ('the dark iron pauldrons over the robe', True),
    ('the heavy iron chain across the chest', False),
    ('the old burn scar puckering the left cheek', False), MAGUS_STAFF])
F['cm05'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '05', 'man', [
    ('the peaked charcoal cowl edged with a dull ember-red trim', True),
    ('the long drooping white moustache over a clean-shaven chin', False),
    ('the many thin soot stripes across both cheeks', False),
    ('the high stiff collar', True),
    ('the clasp shaped like a closed iron fist', False), MAGUS_STAFF])
F['cm06'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '06', 'woman', [
    ('the tall stiff peaked cowl rising straight up to a sharp point, with two long narrow side lappets hanging down '
     'past the cheeks to the chest', True),
    ('the row of small dull iron beads along the edges of the lappets', False),
    ('the broad black soot band painted across the eyes from temple to temple', False),
    ('the high stiff collar of charcoal felt', True),
    ('her heart-shaped dark ash-grey face', False), MAGUS_STAFF])
F['cm07'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '07', 'man', [
    ('the tall stiff peaked cowl rising straight up to a sharp point, its seams stiffened with thin iron ribs', True),
    ('his round fleshy clean-shaven face with heavy jowls', False),
    ('the broad mantle of layered smoke-grey cloth with a ragged hem', True),
    ('the pendant of a rough black iron ingot on a chain', False),
    ('the row of small raised ritual scar dots across the forehead', False), MAGUS_STAFF])
F['cm08'] = ('cmdCaster', 'cinderHorde', 'cinderMagus', '08', 'man', [
    ('the peaked charcoal cowl with a stiff wired point bent over at the top and side flaps over the ears', True),
    ('the black-and-grey goatee on a lean face', False),
    ('the hooked scar across the bridge of the nose', False),
    ('the leather-and-iron gorget', True),
    ('the iron brooch shaped like a flame', False), MAGUS_STAFF])

# ---------------------------------------------------------------- Independent Captain, levy (cmdLevy)
L = 'independentCaptain-levy'
F['lv01'] = ('cmdLevy', 'independent', L, '01', 'man', [
    ('the plain rounded iron cap with a short flat peak jutting straight forward over the brow, like the peak of a '
     'cloth cap', True),
    ('the short brown beard going grey at the chin, and a broken nose', False),
    ('the pale padded jerkin of undyed linen with vertical channel stitching', True),
    ('the plain leather strap across the chest', True),
    ('his broad square ruddy face', False), SWORD])
F['lv02'] = ('cmdLevy', 'independent', L, '02', 'woman', [
    ('the round iron skullcap with a single short straight nasal bar over the bridge of the nose', True),
    ('her grey-streaked dark brown hair pulled tightly back into a knot at the nape', True),
    ('the white scar slanting through one eyebrow', False),
    ('the matte dun-brown padded jerkin of felted wool with a wide falling collar of dark leather', True),
    ('the two iron hook clasps down the front', False), SWORD])
F['lv03'] = ('cmdLevy', 'independent', L, '03', 'man', [
    ('the iron sallet-like cap, rounded on top, with a long sloping tail sweeping down over the back of the neck and a '
     'short brim at the front', True),
    ('the thick coppery-red beard cut short and square, and short coppery-red hair', True),
    ('the dark dun-brown padded jerkin with a thick roll of padding at the shoulders', True),
    ('the leather belt across the chest with a plain iron buckle', True),
    ('his broad heavy ruddy freckled face', False), SWORD])
F['lv04'] = ('cmdLevy', 'independent', L, '04', 'man', [
    ('the low iron cap worn over a mail hood that covers the neck and the sides of the face', True),
    ('the close-cropped white beard on a gaunt tanned face', False),
    ('the dark brown padded jerkin with leather patches sewn on the shoulders', True),
    ('his deep crow\'s feet and pale grey eyes', False),
    ('the mail of the hood spreading over his shoulders', True), SWORD])
F['lv05'] = ('cmdLevy', 'independent', L, '05', 'man', [
    ('the low-domed iron cap with a riveted band around the rim and a leather chinstrap', True),
    ('the short close-trimmed black beard on a round, full, dark brown face', False),
    ('the muted rust-brown padded jerkin with horn buttons down the front', True),
    ('the small bone whistle on a cord at the neck', False),
    ('the thin scar across the bridge of the nose', False), SWORD])
F['lv06'] = ('cmdLevy', 'independent', L, '06', 'woman', [
    ('the iron cap with a low ridge running from front to back', True),
    ('her grey-streaked auburn hair cut short at the jaw', True),
    ('the thick cream sheepskin collar of the padded jerkin', True),
    ('the plain iron ring brooch at the collar', False),
    ('her broad weathered ruddy face', False), SWORD])
F['lv07'] = ('cmdLevy', 'independent', L, '07', 'man', [
    ('the iron cap worn over a rolled linen arming cap whose pale edge shows under the rim', True),
    ('the thick black moustache with no beard, on an angular olive-skinned face', False),
    ('the grey-brown padded jerkin laced at the side', True),
    ('the broad leather baldric over one shoulder', True),
    ('his thick black eyebrows and proud chin-up look', False), SWORD])
F['lv08'] = ('cmdLevy', 'independent', L, '08', 'man', [
    ('the low flat-topped iron cap with a short neck flare at the back', True),
    ('his long dark hair to the shoulders and full dark beard', True),
    ('the thick quilted jerkin of faded dun-brown', True),
    ('the stiff leather collar buckled around the throat', True),
    ('his long narrow pale face', False), SWORD])
F['lv09'] = ('cmdLevy', 'independent', L, '09', 'woman', [
    ('the small round iron cap tied under the chin with a strip of cloth', True),
    ('her curly dark brown hair escaping in ringlets under the cap', True),
    ('the padded jerkin of undyed grey wool with a single pewter button at the collar', True),
    ('the wooden bead on a cord', False),
    ('her heart-shaped light brown freckled face', False), SWORD])
F['lv10'] = ('cmdLevy', 'independent', L, '10', 'man', [
    ('the iron cap with stiff leather cheek flaps hanging down beside the face', True),
    ('the big grey walrus moustache', False),
    ('the heavy padded jerkin of dark brown leather with iron rivets at the shoulders', True),
    ('the cauliflower ear and the old burn scar on the cheek', False),
    ('his heavy jowled, weathered ruddy-brown face', False), SWORD])
F['lv11'] = ('cmdLevy', 'independent', L, '11', 'man', [
    ('the tall pear-shaped iron cap rising to a small stalk at the top, with a narrow flat brim all round', True),
    ('the neat narrow black chin beard with no moustache', False),
    ('the padded jerkin of faded charcoal-brown wool with a stiff standing collar', True),
    ('the leather pouch strap across the chest', True),
    ('his lean long light brown face, the black hair shaved short at the sides', True), SWORD])
F['lv12'] = ('cmdLevy', 'independent', L, '12', 'man', [
    ('the old iron cap with a slightly rusted turned-up rim at the front', True),
    ('his long thin white hair and long white beard', True),
    ('the long knitted wool scarf wound twice around the neck', True),
    ('the padded jerkin faded to grey-brown', True),
    ('his thin pointed wrinkled face', False), SWORD])

# ---------------------------------------------------------------- Independent Captain, hunter (cmdHunter)
H = 'independentCaptain-hunter'
F['hu01'] = ('cmdHunter', 'independent', H, '01', 'man', [
    ('the deep brown leather hood trimmed with grey wolf fur around the face', True),
    ('the short dark beard grey at the chin, on a lean hawkish face with a hooked nose', False),
    ('the bone toggle at the throat', False),
    ('the quiver strap across the chest', True),
    ('the brown leather jerkin', True), SWORD])
F['hu02'] = ('cmdHunter', 'independent', H, '02', 'woman', [
    ('the short-peaked hood of undyed tan wool with a thick rim of tawny brown fox fur all around the face', True),
    ('her straight light brown hair falling out of the hood on one side', True),
    ('the short leather capelet over the shoulders', True),
    ('the wolf\'s tooth on a cord', False),
    ('her long fair oval face with a thin scar along the jaw', False), SWORD])
F['hu03'] = ('cmdHunter', 'independent', H, '03', 'man', [
    ('the pointed hood of soft pale deerskin trimmed with brown rabbit fur', True),
    ('his round boyish face with a wispy black chin beard and a smear of dried mud on one cheek', False),
    ('the laced leather jerkin', True),
    ('the small hunting horn on a strap over the shoulder', True),
    ('his light brown skin', False), SWORD])
F['hu04'] = ('cmdHunter', 'independent', H, '04', 'man', [
    ('the heavy dark brown leather hood with a thick shaggy bearskin ruff around the face and over the shoulders', True),
    ('the full untrimmed white beard', False),
    ('the large antler toggle at the chest', False),
    ('his bushy white eyebrows on a deeply lined face', False),
    ('the dark brown leather and bearskin over the back', True), SWORD])
F['hu05'] = ('cmdHunter', 'independent', H, '05', 'man', [
    ('the grey felt hood with a long tail hanging down behind', True),
    ('the spotted lynx fur trim around the hood and over the shoulders', True),
    ('the short black beard on a broad dark brown face, with three parallel claw scars down one cheek', False),
    ('the boar-tusk pendant on a thong', False),
    ('the dark leather jerkin', True), SWORD])
F['hu06'] = ('cmdHunter', 'independent', H, '06', 'woman', [
    ('the hood pushed back off the head so that it lies on the shoulders as a thick ruff of dark brown marten fur', True),
    ('her black hair with a grey streak in a long braid over the shoulder', True),
    ('the leather jerkin with an iron buckle', True),
    ('the small leather pouch on a cord', False),
    ('her square strong olive-tan face', False), SWORD])
F['hu07'] = ('cmdHunter', 'independent', H, '07', 'man', [
    ('the brown wool hood with ear flaps tied under the chin, lined with white-grey rabbit fur that shows at the edges', True),
    ('the two grouse feathers tucked into the side of the hood', True),
    ('the ginger stubble beard on a pale freckled face', False),
    ('the leather straps with iron buckles across the chest', True),
    ('his ears that stick out and his cheerful squint', False), SWORD])
F['hu08'] = ('cmdHunter', 'independent', H, '08', 'man', [
    ('the hood of oiled mid-brown leather with a thick rim of sleek dark otter fur all around the face', True),
    ('his long greying black hair loose under the hood', True),
    ('the thin drooping moustache on a long weathered face', False),
    ('the leather strap with three iron rings across the chest', True),
    ('the brown leather jerkin', True), SWORD])
F['hu09'] = ('cmdHunter', 'independent', H, '09', 'man', [
    ('the close-fitting leather hood with a rim of thick beaver fur, laced at the throat with a cord', True),
    ('his clean-shaven golden-tan face with broad cheekbones', False),
    ('the leather shoulder strap with a plain iron buckle', True),
    ('the brown leather jerkin', True),
    ('the small scar at the corner of the mouth', False), SWORD])
F['hu10'] = ('cmdHunter', 'independent', H, '10', 'woman', [
    ('the wide loose hood of faded brown wool trimmed with pale grey hare fur', True),
    ('the wisps of white hair on her thin, wrinkled, weathered face', False),
    ('the short cloak pinned with a plain iron pin', True),
    ('the carved bone whistle on a cord', False),
    ('the mole on her cheek', False), SWORD])
F['hu11'] = ('cmdHunter', 'independent', H, '11', 'man', [
    ('the pointed hood of tan buckskin with fringed edges, trimmed with striped grey-and-black badger fur', True),
    ('the short neat black beard on a tall narrow deep dark-brown face', False),
    ('the small iron ring in one ear', False),
    ('the fringed buckskin jerkin with a plain leather strap', True),
    ('the thin white scar across the chin', False), SWORD])
F['hu12'] = ('cmdHunter', 'independent', H, '12', 'man', [
    ('the hood of shaggy goatskin with long rough cream-white fur all around the face and over the shoulders', True),
    ('the thick russet-grey beard on a broad heavy weathered face', False),
    ('the leather jerkin', True),
    ('the horn toggle at the throat', False),
    ('his flattened nose', False), SWORD])

FACES = F
GROUPS = {
    'cinderScout': [f'cs{i:02d}' for i in range(1, 9)],
    'ashChieftain': [f'ac{i:02d}' for i in range(1, 9)],
    'pyrePriest': [f'pp{i:02d}' for i in range(1, 9)],
    'emberAdept': [f'ea{i:02d}' for i in range(1, 9)],
    'cinderMagus': [f'cm{i:02d}' for i in range(1, 9)],
    'independentCaptain-levy': [f'lv{i:02d}' for i in range(1, 13)],
    'independentCaptain-hunter': [f'hu{i:02d}' for i in range(1, 13)],
}
assert sum(len(v) for v in GROUPS.values()) == 64 and set(F) == {f for v in GROUPS.values() for f in v}
