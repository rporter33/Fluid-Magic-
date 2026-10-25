"""Write owner-picked redo faces into their slots. Usage: intake.py C1-06=A C2-04=B ..."""
import hashlib, io, json, os, sys
from PIL import Image
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
R = '/home/user/Fluid-Magic-'
SLOTS = {
  'C1-06': ('cinderHorde', 'cinderScout', '06'), 'C2-04': ('cinderHorde', 'emberAdept', '04'),
  'C3-06': ('cinderHorde', 'cinderMagus', '06'), 'I1-02': ('independent', 'independentCaptain-levy', '02'),
  'I1-03': ('independent', 'independentCaptain-levy', '03'), 'T4-02': ('thornwood', 'treant', '02'),
  'T4-04': ('thornwood', 'treant', '04'),
}
def save(im, path, px, cap, q=86):
    im = im.resize((px, px), Image.LANCZOS)
    while True:
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q, method=6)
        if buf.tell() <= cap or q <= 40: break
        q -= 4
    assert buf.tell() <= cap, (path, buf.tell())
    open(path, 'wb').write(buf.getvalue())
for arg in sys.argv[1:]:
    fid, pick = arg.split('=')
    nation, unit, nn = SLOTS[fid]
    src = f'{S}/art-gen/round2-redo/{fid}-{pick}.png'
    meta = json.load(open(f'{S}/art-gen/round2-redo/{fid}-{pick}.json'))
    raw = open(src, 'rb').read()
    assert hashlib.sha256(raw).hexdigest() == meta['sha256'], fid
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    game = f'{R}/src/assets/raster/portraits/{nation}/{unit}'
    master = f'{R}/art-source/portraits/{nation}/{unit}'
    os.makedirs(game, exist_ok=True); os.makedirs(master, exist_ok=True)
    for p in (f'{game}/{nn}.webp', f'{game}/{nn}-64.webp', f'{game}/{nn}.json', f'{master}/{nn}.webp'):
        assert not os.path.exists(p), f'slot taken: {p}'
    save(im, f'{game}/{nn}.webp', 256, 24 * 1024)
    save(im, f'{game}/{nn}-64.webp', 64, 4 * 1024)
    save(im, f'{master}/{nn}.webp', 512, 10**9, q=90)
    side = {
      'id': fid, 'unit': unit, 'nation': nation,
      'files': {'game': f'{nn}.webp', 'small': f'{nn}-64.webp', 'master': f'art-source/portraits/{nation}/{unit}/{nn}.webp'},
      'sourceSha256': meta['sha256'], 'tool': meta['tool'], 'model': meta['model'], 'date': meta['date'],
      'prompt': meta['prompt'], 'references': meta['references'],
      'approved': {'by': 'project owner', 'date': '2026-10-22', 'pick': f'redo-{pick}'},
    }
    with open(f'{game}/{nn}.json', 'w') as fh:
        fh.write(json.dumps(side, indent=2, ensure_ascii=False).replace('[\n    "p0-gpt-rim.png"\n  ]', '["p0-gpt-rim.png"]') + '\n')
    print(fid, '->', f'{nation}/{unit}/{nn}', os.path.getsize(f'{game}/{nn}.webp'), os.path.getsize(f'{game}/{nn}-64.webp'))
