import base64, io, json, sys
from PIL import Image
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
idx = json.load(open(f'{S}/art-review/r2/index.json'))
def b64(path, px=320):
    im = Image.open(path).convert('RGB').resize((px, px), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=80, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
FACES = [
 ('C1-06', 'Cinder Scout', 'Cinder Horde',
  'A', 'A woman about fifty with a hawkish face, hollow cheeks and an old burn scar on the jaw; a deep hood with a stiff peak, the scarf down at the throat.', '',
  'A woman about twenty-six with a broad face, a black fringe and three soot claw stripes; a close hood held by an iron brow band.', 'Leans a little modern.', 'A'),
 ('C2-04', 'Ember Adept', 'Cinder Horde',
  'A', 'A young man with a shaved-side topknot, soot on the eyelids and a scar through the lip; an iron circlet and a high wrapped collar.', '',
  'A young man with a heavy jaw, a broken nose and a burn-glazed neck; the hood raised with ember-red trim.', 'Reads older than "young".', 'A'),
 ('C3-06', 'Cinder Magus', 'Cinder Horde',
  'A', 'A woman about seventy-five, skin crazed like cooled ash; a very tall iron-ribbed peaked cowl over a grey wimple.', '',
  'A woman about fifty-five with a black soot band across the glowing eyes; a tall peaked cowl with long side lappets.', '', 'A'),
 ('I1-02', 'Levy captain', 'Independents',
  'A', 'A woman about forty-five with a bony nose, flinty grey eyes and a scar through one brow; an iron skullcap with a short nasal bar.', '',
  'A young woman about twenty-six, deep brown skin, a bold raised chin; an iron skullcap over a coarse wool hood.', '', 'B'),
 ('I1-03', 'Levy captain', 'Independents',
  'A', 'A man about thirty-two with a square coppery-red beard and a split brow; an iron sallet cap with a long neck tail.', '',
  'A man about forty-five with a hooked nose, an eye patch and a grey-shot beard; a crested iron morion and a coil of rope.', 'The morion reads a bit conquistador.', 'A'),
 ('T4-02', 'Treant', 'Thornwood',
  'A', 'An old willow: pale furrowed bark, trailing willow strands, two knot holes and a crack for a face.', 'Faces nearly straight on.',
  'A gnarled old pine: scaly lichen-crusted bark plates and a crown of pine needles.', 'Faces nearly straight on.', 'A'),
 ('T4-04', 'Treant', 'Thornwood',
  'A', 'A slender old birch: chalky white bark with black scars, the trunk forking into two limbs.', 'Faces nearly straight on.',
  'A massive old beech: smooth silver-grey bark, bare twigs and fungus.', 'Breaks the treant rule: it has human-like eyelids.', 'A'),
]
out = []
for (fid, unit, nation, _a, adesc, anote, bdesc, bnote, rec) in FACES:
    out.append({'id': fid, 'unit': unit, 'nation': nation, 'rec': rec,
      'rejected': b64(idx[fid]),
      'A': b64(f'{S}/art-gen/round2-redo/{fid}-A.png'), 'Adesc': adesc, 'Anote': anote,
      'B': b64(f'{S}/art-gen/round2-redo/{fid}-B.png'), 'Bdesc': bdesc, 'Bnote': bnote})
tpl = open(f'{S}/art-review/r3/template.html').read()
open(f'{S}/art-review/r3/redo-picks.html', 'w').write(tpl.replace('__DATA__', json.dumps({'faces': out}).replace('</', '<\\/')))
print('ok')
