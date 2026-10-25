#!/usr/bin/env python3
"""Write the prompt .txt files for the round-2 Cinder Horde sets."""
import os, re, sys
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
html = open(f'{S}/prompt-pack/art-prompts.html').read()
STYLE = re.search(r'const STYLE = `(.*?)`;', html, re.S).group(1)
PREFACE = ("Image 1 is a style reference only: match its painting style, brushwork, lighting, rim light, framing, "
           "background and proportions. The person, the face, the headgear and every ornament must be different from "
           "Image 1 and must follow the description below exactly; do not copy the man, the helm, the horns or the "
           "trim from Image 1.")
NATION = ("A warrior of the Cinder Horde, ash-born clans who worship fire: ash-grey skin with soot markings, charcoal "
          "and smoke-grey clothing, armor of dark iron with rusted edges.")
TYPES = {
  'cinderScout': "A Cinder Scout: a low charcoal hood and a scarf that can cover the lower face, alert eyes.",
  'emberAdept': "An Ember Adept: a young mage, a thin blackened-iron circlet, a charcoal robe with a dull ember-red trim.",
  'cinderMagus': "A Cinder Magus: an old fire mage, a tall peaked charcoal cowl; the eyes glow amber like embers (#FFB347), and nothing else glows.",
}
PEOPLE = {
 'cinderScout': [
  "Person: a man about twenty-five, a lean angular face, the scarf pulled up over the nose and mouth so only narrow grey eyes and straight dark brows show, pale grey eyes, a band of black soot painted across the eyes from temple to temple. Kit: a low, round, close-fitting hood with no brim and no peak, its front edge bound with a strip of dark leather; a pale ash-grey wool scarf; a small square iron buckle at the throat; a leather strap across the chest.",
  "Person: a woman about thirty-five, an oval face with high cheekbones, pale ash skin, the scarf pulled down loose around her neck, a dark braid falling from under the hood over one shoulder, a small scar on the chin, watchful green-grey eyes. Kit: a loose hood with a ragged hem; the scarf knotted at the side of the neck; a necklace of three blackened animal teeth; a quilted charcoal jerkin.",
  "Person: a man about fifty, a weathered square face, a short grizzled grey beard, a broken flattened nose, deep crow's-feet, squinting eyes, the scarf pulled down below the chin. Kit: a heavy hood with a stiff leather brim; a mail collar showing under the scarf; a round iron ring-brooch; a rusted iron gorget plate.",
  "Person: a youth about eighteen, a round boyish face, no beard, smudges of soot all over the cheeks and nose, wide alert dark eyes, the scarf half-down over the chin. Kit: a hood a little too big for him with a frayed hem; a thin rope tie at the throat; a small iron whistle on a cord; a patched smoke-grey tunic.",
  "Person: a man about forty, a long narrow face with hollow cheeks, the scarf wrapped up over the mouth and nose, a long vertical scar through the left eyebrow, light hazel eyes, a few grey hairs at the temple. Kit: a pointed hood pulled down to the eyebrows; the scarf wrapped twice around the neck; a strip of iron scales over each shoulder; a charm of a bent iron nail on a thong.",
  "Person: a woman about twenty-eight, a heart-shaped face, dark charcoal-grey skin, the scarf pulled up to the bridge of the nose, thin black soot lines drawn down from the eyes over the cheeks above the scarf, sharp dark eyes. Kit: a hood whose edge is bound with rusty iron wire; a soft leather scarf-mask; a collar of small iron rings; a single black crow feather tucked at the side of the hood.",
  "Person: a man about sixty-five, a gaunt bony face, white stubble, deep lines, the scarf hanging down on the chest, the left eye milky and crossed by an old scar while the right eye is sharp, a soot-blackened forehead. Kit: a tattered hood with a drawstring cord; a long faded grey scarf; a heavy iron toggle clasp; a cracked leather cuirass.",
  "Person: a man about thirty, a broad flat face, a shaved head under the hood, heavy brows, black tattoos of flame tongues on the cheek and neck, alert brown eyes, the scarf rolled down thick around the neck. Kit: a short hood joined to a little cape over the shoulders; a round iron disc clasp stamped with a flame; dark iron spaulders with rusted rims.",
 ],
 'emberAdept': [
  "Person: a boy about sixteen, a thin narrow face, short messy black hair, a light soot smudge on the nose, eager wide grey eyes, no beard. Kit: a plain thin circlet; the robe with a high stiff collar; a small round iron button clasp; a plain cord belt.",
  "Person: a young woman about twenty, an oval face, long straight dark hair tied back at the nape, pale ash skin, a calm serious expression, three small soot dots on each cheekbone. Kit: a circlet with a small iron teardrop hanging at the brow; a wide cowl-collar folded down on the shoulders; a thin iron chain at the neck.",
  "Person: a man about twenty-six, a square face, a shaved head, a thin short beard along the jaw, dark charcoal skin, a pale burn scar on the right cheek, steady brown eyes. Kit: a circlet with a notched front; the robe with a wrap-over collar; a leather strap across the chest carrying small stoppered iron vials.",
  "Person: a youth about eighteen, a round soft face, shoulder-length curly brown-black hair, pale grey skin, nervous wide eyes, beardless. Kit: a circlet of twisted iron wire; the robe's hood lying down on the shoulders; a pendant of a small iron flame on a cord.",
  "Person: a man about twenty-eight, a long face, a hooked nose, a thin dark moustache, hair braided at the temples, a soot line drawn along the jaw, a proud half-smile. Kit: a circlet with two small prongs at the front; a short mantle thrown over one shoulder; a dark iron clasp shaped like a lump of coal.",
  "Person: a young woman about twenty-two, an angular face with a sharp chin, close-cropped ash-white hair, a thin soot line drawn down the forehead to the bridge of the nose, an intense focused stare. Kit: a circlet worn low across the forehead; a collar of overlapping folds of charcoal cloth; small iron rings along one ear.",
  "Person: a man about thirty, a broad face, a heavy brow, a short dense black beard, tired thoughtful eyes, a dusting of ash freckles on the cheeks. Kit: a circlet half-hidden in thick unruly hair; the robe with a padded quilted collar; a leather book-strap across the chest; an iron key on a cord.",
  "Person: a young man about nineteen, a gaunt face, long lank black hair falling forward past the cheeks, hollow cheeks, dark rings under the eyes, an old pale burn scar on the chin. Kit: a circlet with a small iron disc at each temple; the robe with a frayed hem on the trim; a smoke-grey scarf knotted at the neck.",
 ],
 'cinderMagus': [
  "Person: a man about sixty, a long gaunt face, hollow cheeks, deep-set eyes, a long thin grey beard reaching to the chest. Kit: a very tall stiff peaked cowl standing straight up; a dark iron collar plate; a chain of small iron rings across the chest.",
  "Person: a woman about seventy, a thin hawkish face, a hooked nose, deep wrinkles, thin pressed lips, a stern look, white hair in two long braids falling from inside the cowl. Kit: a peaked cowl with a frayed ragged edge; a twisted iron torc at the throat; a clasp of three small iron coals.",
  "Person: a man about eighty-five, very old, a sunken face, a bald head, wispy white stubble, a band of black soot painted across the forehead, a thin hooked nose and a toothless sunken mouth. Kit: a tall straight peaked cowl that does not droop, bound in a spiral by a thin band of dark iron from the brow up to the tip; a heavy mantle of layered smoke-grey cloth; a pendant of a black iron sun disc.",
  "Person: a man about sixty-five, a broad heavy face, a short thick white beard, the left cheek puckered by an old burn scar, an angry glare. Kit: a peaked cowl with rusted iron bands around its base; dark iron pauldrons over the robe; a heavy iron chain across the chest.",
  "Person: a man about seventy-five, a narrow face, a long drooping white moustache and a clean-shaven chin, many thin soot stripes across both cheeks, a calm still look. Kit: a peaked cowl edged with a dull ember-red trim; a high stiff collar; a clasp shaped like a closed iron fist.",
  "Person: a woman about sixty, a square face, a strong jaw, short-cropped iron-grey hair at the temples, deep lines around the mouth, dark charcoal skin, a black tattooed line down the chin. Kit: a peaked cowl with its brim folded back; a collar of layered iron scales; a cord with a single large iron ring.",
  "Person: a man about ninety, ancient, a skeletal face, papery wrinkled skin, half-closed heavy eyelids, a long forked white beard with iron beads. Kit: a cowl so tall its tip bends backward; a mantle lined with grey fur; a string of bone and iron beads.",
  "Person: a man about fifty-five, a lean face, a black-and-grey goatee, a hooked scar across the bridge of the nose, a sly narrow look. Kit: a peaked cowl with a stiff wired point and side flaps over the ears; a leather-and-iron gorget; an iron brooch shaped like a flame.",
 ],
}
def prompt(unit, i):
    return f"{PREFACE}\n\n{STYLE}\n\nSubject: {NATION}\n{TYPES[unit]}\n{PEOPLE[unit][i]}"
if __name__ == '__main__':
    units = sys.argv[1:] or list(PEOPLE)
    for u in units:
        for i in range(8):
            p = f'{S}/art-gen/round2/{u}/cinderHorde__{u}__{i+1:02d}.txt'
            open(p, 'w').write(prompt(u, i))
            print(p)
