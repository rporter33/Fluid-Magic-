# The pilot's final contact board: every candidate of the nine sheets keyed and composited with its own blend on the
# battle ground (plains for Ember, swamp for Loam), the picked one framed, with the checks that decided the pick.
# Usage: python3 -I fx_contact.py OUT.png [OUT_SMALL.webp]
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fx_board import comp, GROUND  # noqa: E402
from fx_layouts import SHEETS  # noqa: E402
from fx_pack import PICKS  # noqa: E402
WORK = os.path.abspath(os.path.join(HERE, '..'))
CANDS = {'E3': ['a', 'b', 'r2']}
TW = 520  # thumbnail width


def checks(sheet, cand):
    c = json.load(open(os.path.join(WORK, 'cut', f'{sheet}.{cand}', 'cut.json')))
    b = json.load(open(os.path.join(WORK, 'boards', f'{sheet}.json'))).get(cand, {})
    els = c['elements']
    found = sum(1 for e in els if not e.get('missing'))
    edge = sum(1 for e in els if e.get('touchesSheetEdge'))
    solid = [v.get('solidPx@18', 0) for v in b.values()] if b else []
    k = c.get('key', {})
    out = [f"{found}/{len(els)} cut, edge {edge}, stray {c.get('strayAlphaPct', 0):.2f}%"]
    if 'fringePct' in k: out.append(f"fringe {k['fringePct']:.2f}%, key in art {k.get('keyInUnitPct', 0):.2f}%")
    if solid: out.append(f"at f=18: smallest solid {min(solid)} px")
    return out


def thumb(sheet, cand):
    S = SHEETS[sheet]
    keyed = np.asarray(Image.open(os.path.join(WORK, 'cut', f'{sheet}.{cand}', 'keyed.png')).convert('RGBA')).astype(np.float32) / 255
    ground = GROUND['swamp' if sheet.startswith('L') else 'plains']
    h, w = keyed.shape[:2]
    dst = np.ones((h, w, 3), np.float32) * (np.array(ground, np.float32) / 255)
    blend = {'add': 'add', 'luma': 'luma', 'multiply': 'multiply'}.get(S['blend'], 'normal')
    comp(dst, keyed, 0, 0, blend)
    im = Image.fromarray((np.clip(dst, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')
    return im.resize((TW, int(h * TW / w)), Image.LANCZOS)


def main():
    out = sys.argv[1]
    rows = []
    for sheet in PICKS:
        cands = CANDS.get(sheet, ['a', 'b'])
        tiles = []
        for c in cands:
            im = thumb(sheet, c)
            pick = PICKS[sheet] == c
            pad = 34 + 15 * 3
            t = Image.new('RGB', (TW + 12, im.height + pad + 12), (24, 22, 20))
            t.paste(im, (6, 6))
            d = ImageDraw.Draw(t)
            if pick: d.rectangle([1, 1, t.width - 2, im.height + 10], outline=(126, 208, 138), width=4)
            model = {'a': 'nano-banana 2.1', 'b': 'gemini 3 pro image', 'r2': 'nano-banana 2.1, re-roll'}[c]
            d.text((8, im.height + 12), f"{sheet}.{c}  {model}" + ("   PICKED" if pick else ""), fill=(126, 208, 138) if pick else (230, 225, 214))
            for i, line in enumerate(checks(sheet, c)):
                d.text((8, im.height + 30 + 15 * i), line, fill=(200, 194, 180))
            tiles.append(t)
        H = max(t.height for t in tiles)
        row = Image.new('RGB', (200 + 3 * (TW + 16), H + 8), (16, 15, 13))
        d = ImageDraw.Draw(row)
        d.text((10, 10), sheet, fill=(255, 255, 255))
        d.text((10, 28), SHEETS[sheet]['title'], fill=(200, 194, 180))
        d.text((10, 46), f"{SHEETS[sheet]['bg']} / {SHEETS[sheet]['blend']}", fill=(160, 154, 140))
        for i, t in enumerate(tiles): row.paste(t, (200 + i * (TW + 16), 4))
        rows.append(row)
    W = max(r.width for r in rows)
    board = Image.new('RGB', (W, sum(r.height for r in rows)), (16, 15, 13))
    y = 0
    for r in rows: board.paste(r, (0, y)); y += r.height
    board.save(out)
    if len(sys.argv) > 2:
        small = board.resize((board.width // 2, board.height // 2), Image.LANCZOS)
        small.save(sys.argv[2], quality=80, method=6)
    print(out, board.size)


if __name__ == '__main__':
    main()
