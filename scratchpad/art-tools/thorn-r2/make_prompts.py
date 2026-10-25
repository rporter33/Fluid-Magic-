import os, re, sys
SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
html = open(f'{SP}/prompt-pack/art-prompts.html').read()
STYLE = re.search(r'const STYLE = `(.*?)`;', html, re.S).group(1)
PREFACE = ("Image 1 is a style reference only: match its painting style, brushwork, lighting, rim light, framing, "
           "background and proportions. The person, the face, the headgear and every ornament must be different from "
           "Image 1 and must follow the description below exactly; do not copy the man, the helm, the horns or the trim from Image 1.")
NATION = ("A warden of the Thornwood, forest clans who live among ancient trees: bark-brown weathered skin, "
          "bark-and-leaf clothing and armor in moss green and bark brown.")
TYPES = {
 'thornScout': "A Thorn Scout: a hood of overlapping leaves, thin green face paint.",
 'saplingDruid': "A Sapling Druid: a young druid, a circlet of twigs, a cloak of moss-green wool.",
 'elderDruid': "An Elder Druid: an old druid, a hood with small antlers, moss in the hair or beard; the eyes glow pale green (#A6D96A), and nothing else glows.",
}
PEOPLE = {
 'thornScout': [
  "Person: a man of about twenty, a lean narrow face, sharp hazel eyes, short dark hair under the hood, no beard, olive-brown skin, two thin green stripes painted across each cheek, a tense alert look. Kit: a close hood of overlapping oak leaves; a collar of rough brown wool; a toggle made from a thorn twig.",
  "Person: a woman of about twenty-five, an oval face, a dark-brown braid over one shoulder, freckles, wary brown eyes, tan skin, a row of small green paint dots along each cheekbone. Kit: a hood of overlapping pale beech leaves; a scarf of moss-green wool; a small carved wooden wren on a cord.",
  "Person: a man of about thirty-five, a square jaw, a short brown beard, a thin scar across the bridge of the nose, grey eyes, ruddy tan skin, a thin green band painted across the eyes like a mask, a hard squint. Kit: a hood of overlapping dark holly leaves; a leather collar with a bone toggle; a leather strap across the chest.",
  "Person: a man of about fifty, a gaunt long face, close grey stubble, deep-set dark eyes, deep brown skin, a single thin green line painted down the forehead and nose, a patient watchful look. Kit: a hood of overlapping fern fronds; a bark-brown leather jerkin; a small wooden whistle on a thong.",
  "Person: a woman of about forty, a broad face with high cheekbones, short-cropped black hair, dark brown eyes, deep umber skin, a thin green chevron painted on each cheek, a calm hard stare. Kit: a deep close hood of overlapping long olive chestnut leaves with toothed edges, its rim framing the face; a collar of woven bark strips; a clasp shaped like a hawk feather.",
  "Person: a man of about sixty-five, an old weathered face, long white hair escaping the hood, a thin white moustache and no beard, pale grey-brown skin, faded thin green lines curving under the eyes, a narrow-eyed squint. Kit: a hood of overlapping small dry russet birch leaves; a cloak of patched brown wool; a string of small antler-tip charms.",
  "Person: a man of about twenty-eight, a round face, curly black hair, a thin black beard along the jaw, warm brown skin, three thin green dots painted on the forehead and a green stripe down the chin, an eager look. Kit: a hood of overlapping small round green leaves like aspen; a twine-wrapped leather collar; a clasp of a smooth grey river stone.",
  "Person: a man of about forty-five, a heavy brow, a crooked broken nose, a braided red-brown beard, green eyes, freckled pale skin, a thin green spiral painted on one cheek, a notched ear, a grim look. Kit: a hood of overlapping ivy leaves; a short mantle of moss; a clasp shaped like a twist of thorny bramble.",
 ],
 'saplingDruid': [
  "Person: a youth of about eighteen, a soft oval face, short tousled light-brown hair, no beard, hazel eyes, freckled fair skin, a shy earnest look. Kit: a circlet of woven pale willow withies; a plain wooden toggle clasp; the cloak edged with a band of undyed wool.",
  "Person: a young woman of about twenty, a heart-shaped face, long loose dark hair, dark eyes, deep brown skin, a line of small dark dots tattooed on the chin, a calm focused look. Kit: a circlet of birch twigs with tiny new leaves; a clasp carved as a leaf bud; a necklace of brown seed beads.",
  "Person: a young man of about twenty-five, a long narrow face, black hair in a topknot, a thin moustache, olive skin, a small scar on the upper lip, a thoughtful downward look. Kit: a circlet of hazel twigs with hanging catkins; a clasp shaped like a hazelnut; a collar of plaited grass cord.",
  "Person: a young man of about twenty-two, a broad square face, red-brown hair cropped short, a patchy young beard, grey-green eyes, ruddy tan skin, a stubborn set jaw. Kit: a circlet of black thorn twigs with a few small white blossoms; a leather strap across the chest; the cloak trimmed with bark-brown leather.",
  "Person: a young woman of about twenty-eight, a wide face with high cheekbones, auburn hair in two braids, amber-brown eyes, tan skin, a thin dark vine tattoo running up the side of the neck, a warm half-smile. Kit: a circlet of rowan twigs with a few small dull-red berries; a clasp of carved bone; the moss-green hood thrown back onto the shoulders.",
  "Person: a boy of about sixteen, a round boyish face, curly black hair, no beard, wide dark-brown eyes, warm umber skin, a smudge of earth on one cheek, an alert eager look. Kit: a circlet of oak twigs with tiny acorns; the cloak pinned with a plain bronze ring; a leather pouch strap over the shoulder.",
  "Person: a young man of about thirty, a lean angular face, sandy hair tied back, a short close beard, pale blue eyes, weathered pale skin, a thin scar along one cheek, a serious look. Kit: a circlet of larch twigs with tiny cones; a collar of grey felt; a clasp carved as a coiled fern.",
  "Person: a young man of about twenty-four, a long face with a hooked nose, long dark-brown locks bound with twine, a thin chin beard, deep brown skin, light brown eyes, a gentle look. Kit: a circlet of grey ash twigs with black buds and a strand of ivy; a clasp of a carved wooden ring; the cloak with a frayed hem.",
 ],
 'elderDruid': [
  "Person: a man of about seventy, a long gaunt face, a very long white beard with moss woven into it, deep-set eyes, pale weathered skin, a stern calm look. Kit: a moss-green wool hood with two small forked antlers; a collar of bark plates; a clasp carved as an owl.",
  "Person: a woman of about sixty-five, a round soft woman's face with deep laugh lines, a heavy grey plait over one shoulder with threads of moss woven in, warm tan skin with freckles, a gentle sad look. Kit: a bark-brown hood with short straight antler spikes; a necklace of carved wooden discs; a shawl of lichen-grey wool.",
  "Person: a man of about eighty-five, a very old shrunken face, a hooked nose, a thin wispy white beard with small tufts of moss, paper-thin skin with age spots, a faint smile. Kit: a ragged hood with tiny curled antler nubs; a cord of dried seed pods; a frayed mantle grown over with moss.",
  "Person: a man of about sixty, a square heavy face, a thick grey-brown beard braided with moss, a broken nose, heavy brows, deep umber skin, a stern look. Kit: a leaf-patterned hood with two tiny antler stubs only a few inches long, just above the brow; a collar of woven roots; a clasp shaped like a leaping stag.",
  "Person: a woman of about seventy-five, a narrow face with high cheekbones, white hair in many thin braids with tufts of moss, olive-brown skin, faded dark dot tattoos along the cheekbones, a serene look. Kit: a grey-green hood with slender branching antlers; a necklace of acorn cups; a clasp of polished bone.",
  "Person: a man of about fifty-five, a long face, a short dark beard streaked with grey and moss, a pale scar from the cheek to the jaw, olive-tan skin, an intense look. Kit: a dark bark-brown leather hood with small antlers wrapped in ivy; a collar of overlapping oak leaves; a clasp carved as a beetle.",
  "Person: a man of about eighty, a round face, a bushy white moustache and a short white beard with moss tufts, sallow lined fair skin, a kindly tired look. Kit: a heavy moss-covered hood with stubby blunt antlers; a clasp carved as a hare; a pendant of a grey stone with a hole through it.",
  "Person: a man of about sixty-five, a clean-shaven lined face, long grey locks bound with twine and moss, deep brown skin, a thin dark leaf tattoo on the forehead, a piercing look. Kit: a hood of woven willow bark with small moss-tipped antlers; a collar of brown owl feathers; a clasp shaped like a crescent moon.",
 ],
}
which = sys.argv[1:] or list(TYPES)
for unit in which:
    d = f'{SP}/art-gen/round2/{unit}'
    os.makedirs(d, exist_ok=True)
    for i, person in enumerate(PEOPLE[unit], 1):
        p = f"{PREFACE}\n\n{STYLE}\n\nSubject: {NATION}\n{TYPES[unit]}\n{person}"
        path = f'{d}/thornwood__{unit}__{i:02d}.txt'
        if not os.path.exists(path):
            open(path, 'w').write(p)
            print('wrote', path)
