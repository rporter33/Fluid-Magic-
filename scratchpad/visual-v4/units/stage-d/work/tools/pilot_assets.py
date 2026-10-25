# The pilot page's small pictures: a still per beat from the 2x clips, and each sheet candidate keyed on the ground.
# Usage: python3 -I pilot_assets.py   -> work/pilot-assets/{stills.json, sheets.json}
import base64, io, json, os, subprocess, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fx_fix_cut  # noqa: E402,F401  (registers the re-roll layouts in fx_layouts.SHEETS)
from fx_contact import thumb, checks, CANDS  # noqa: E402
from fx_layouts import SHEETS  # noqa: E402
from fx_pack import PICKS  # noqa: E402
WORK = os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.join(WORK, 'pilot-assets')
CLIPS = os.environ.get('CLIPS') or os.path.join(WORK, 'clips')
MODEL = {'a': 'nano-banana 2.1', 'b': 'gemini 3 pro image', 'r2': 'nano-banana 2.1, re-roll of a'}
# the art director's re-rolls (critique.md, "Re-rolls"): sheet, layout for the thumbnail's blend, picked candidate, why
REROLLS = [
    ('L2h', 'L2h', 'b', 'roots and vines as open coils, back and front halves', 'magenta', 'normal (keyed)',
     'Re-roll for the critique: open, see-through coils with separate back and front halves, so the man\'s legs are drawn between them. b paints exactly that (it laid its stages out in four rows, cut by their own grid), with dried and withering halves; a painted full baskets in each cell, a dead stump, and kept the guide\'s leg outlines. The generator tinted the dry roots mauve from the key: their hue is moved to ochre in the atlas.'),
    ('L3k', 'L3k', 'a', 'heaved ground crack, keyed', 'magenta', 'normal (keyed)',
     'Re-roll for the critique: a heaved furrow with sunlit clods that reads light, dark, light at 16 px, a crack head and clods, on magenta because multiply cannot show sunlit earth. a: the cleaner furrow and clods; both heads carry the key\'s pink in their dust, moved to a dry tan in the atlas.'),
    ('E3e', 'E3', 'a', 'fire burst frames 4 to 6 without smoke', 'black', 'additive',
     'Re-roll for the critique: frames 4 to 6 repainted with fire and embers only (the old frame 4\'s smoke read pink). a (an edit of E3.r2) keeps frames 1 to 3 and tears the dome open no wider than frame 3; b\'s frame 4 has a pale cream core that reads as steam.'),
    ('G1f', 'G1f', 'b', 'flame mana ring and glyph', 'black', 'additive',
     'New for the critique: the flame ring with the game\'s flame glyph at its front, and the glyph alone. b: bolder tongues that read at play zoom and a glyph closer to the flame symbol; a\'s ring is a thin charred line.'),
    ('G1l', 'G1l', 'a', 'leaf mana ring and glyph', 'magenta', 'normal (keyed)',
     'New for the critique: a ring of leaves and young vines with the game\'s leaf glyph at its front, and the glyph alone. a: lighter, leafier and closer to "young vines"; b is a heavy woven wreath.'),
]
WHY = {
    'E2': 'Both are clean. Picked a: its orbs keep a tighter white-hot core at small sizes and its trail tapers to a thin end, which the rope needs.',
    'E3': 'a reads as low domes from 40 degrees; b\'s middle frames stand up like balls. a\'s full burst touched the sheet edge and its last frame was loose flames, so one re-roll (an edit of a) moved the burst in and made the last frame a ring of embers: picked r2.',
    'E4': 'Near twins. Picked a: thinner spark streaks and softer ember glows, which stay embers at a few pixels.',
    'E5': 'Picked a: more varied puffs and two separate columns; b\'s columns run into the sheet edge.',
    'E6': 'Picked a: its scorch is a ring with a lighter, burnt centre, as the storyboard asks; b\'s is a starburst splat.',
    'L1': 'Both grow well in four stages. Picked a: less key colour left in the art (0.11% against 1.18%) and a clearer ring variant for the eruption.',
    'L2': 'Picked a: coils that wrap a mound to knee height and a withered set that browns and falls apart; b keeps more key colour in the art (2.29%).',
    'L3': 'Picked a: thinner crack strips with clean ends for the ropes, and a split-ground of radiating cracks (b\'s is a filled disc).',
    'L4': 'Picked a: loose litter with no base; b\'s litter sits on a pink-fringed base and keeps more key colour.',
}


def webp_b64(im, q=74):
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q, method=6)
    return base64.b64encode(buf.getvalue()).decode('ascii'), len(buf.getvalue())


def frame_at(clip, t):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', f'{t:.4f}', '-i', clip, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'], capture_output=True, check=True)
    return Image.open(io.BytesIO(r.stdout)).convert('RGB')


def stills():
    out, total = {}, 0
    plan = {'fireball': [('fb1', ['charge', 'release', 'travel', 'impact', 'linger'], [0.6, 0.5, 0.5, 0.45, 0.4]), ('fb1', ['after'], [None])],
            'entangle': [('en', ['charge', 'release', 'travel', 'impact', 'linger'], [0.7, 0.5, 0.6, 0.6, 0.5]), ('enw', ['wither'], [None])]}
    for spell, parts in plan.items():
        out[spell] = []
        for cid, beats, ks in parts:
            meta = json.load(open(os.path.join(CLIPS, f'{cid}-2.json')))
            b, t0, ts = meta['plan']['beats'], meta['plan']['t0'], meta['tStart']
            for name, k in zip(beats, ks):
                if name == 'after': t = b['linger'][1] + 0.5
                elif name == 'wither': t = meta['plan']['held'][0]['t1'] + 0.3
                else: t = b[name][0] + (b[name][1] - b[name][0]) * k
                im = frame_at(os.path.join(CLIPS, f'{cid}-2.webm'), t - ts)
                im = im.resize((480, round(im.height * 480 / im.width)), Image.LANCZOS)
                s, n = webp_b64(im, 66); total += n
                out[spell].append({'beat': name.capitalize(), 't': f'{round((t - t0) * 1000)} ms', 'b64': s, 'w': im.width, 'h': im.height,
                                   'alt': f'{spell} at 2x, {name}, {round((t - t0) * 1000)} ms after the charge starts'})
    return out, total


def sheets():
    rows, total = [], 0
    for sheet in PICKS:
        S = SHEETS[sheet]
        cands = []
        for c in CANDS.get(sheet, ['a', 'b']):
            im = thumb(sheet, c)
            im = im.resize((340, round(im.height * 340 / im.width)), Image.LANCZOS)
            s, n = webp_b64(im, 72); total += n
            cands.append({'cand': c, 'model': MODEL[c], 'picked': PICKS[sheet] == c, 'checks': checks(sheet, c), 'b64': s, 'w': im.width, 'h': im.height})
        rows.append({'sheet': sheet, 'title': S['title'], 'bg': S['bg'], 'blend': {'add': 'additive', 'luma': 'luminance as alpha', 'multiply': 'multiply', 'normal': 'normal (keyed)'}.get(S['blend'], S['blend']),
                     'why': WHY[sheet], 'cands': cands})
    return rows, total


def reroll_checks(folder):
    c = json.load(open(os.path.join(WORK, 'cut', folder, 'cut.json')))
    els = c['elements']
    found = sum(1 for e in els if not e.get('missing'))
    edge = sum(1 for e in els if e.get('touchesSheetEdge'))
    k = c.get('key', {})
    out = [f"{found}/{len(els)} cut, edge {edge}, stray {c.get('strayAlphaPct', 0):.2f}%"]
    if 'fringePct' in k: out.append(f"fringe {k['fringePct']:.2f}%, key in art {k.get('keyInUnitPct', 0):.2f}%")
    return out


def reroll_sheets():
    rows, total = [], 0
    SHEETS['E3e'] = SHEETS['E3']
    for sheet, layout, pick, title, bg, blend, why in REROLLS:
        cands = []
        for c in ('a', 'b'):
            folder = f'{sheet}.{c}'
            im = thumb(sheet, c)
            im = im.resize((340, round(im.height * 340 / im.width)), Image.LANCZOS)
            b, n = webp_b64(im, 72); total += n
            cands.append({'cand': c, 'model': MODEL[c], 'picked': pick == c, 'checks': reroll_checks(folder), 'b64': b, 'w': im.width, 'h': im.height})
        rows.append({'sheet': sheet, 'title': title, 'bg': bg, 'blend': blend, 'why': why, 'cands': cands})
    return rows, total


def qstills():
    """The firelight question's pair: the impact of cast 1 with the light on the troops off and at 0.5 (qstills.cjs)."""
    out = {'light': []}
    for tag, cap in (('off', 'Before: the burst with no light on the troops (the old multiply tint showed nothing).'), ('on', 'Now: the light on the troops, 0.5 at the peak, falling off from the burst.')):
        p = os.path.join(OUT, f'light-{tag}.png')
        if not os.path.exists(p): return {}
        im = Image.open(p).convert('RGB')
        b, n = webp_b64(im, 70)
        out['light'].append({'b64': b, 'w': im.width, 'h': im.height, 'cap': cap, 'alt': 'Fireball cast 1 at its impact, ' + ('without' if tag == 'off' else 'with') + ' the firelight on the troops'})
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    st, n1 = stills()
    json.dump(st, open(os.path.join(OUT, 'stills.json'), 'w'))
    sh, n2 = sheets()
    rr, n3 = reroll_sheets()
    json.dump(sh + rr, open(os.path.join(OUT, 'sheets.json'), 'w'))
    q = qstills()
    json.dump(q, open(os.path.join(OUT, 'qstills.json'), 'w'))
    print('stills', n1, 'bytes; sheets', n2 + n3, 'bytes; light stills', sum(len(x['b64']) for x in q.get('light', [])), 'b64 bytes')


if __name__ == '__main__':
    main()
