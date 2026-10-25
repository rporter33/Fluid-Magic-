"""Comparison sheets: python3 -I sheet.py out.png view scale "x0,y0,x1,y1;..." [builds] [vision]
rows = builds, columns = crops of shots/<build>-<view>.png, nearest-neighbour upscale, optional colour-blind simulation
(Machado 2009 full severity on linear RGB, the page's matrices)."""
import sys, numpy as np
from PIL import Image, ImageDraw
ME = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-player/'
MACH = {'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
        'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
        'tritan': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]}

def cvd(img, kind):
    if kind in (None, 'normal'): return img
    a = np.asarray(img.convert('RGB'), np.float64) / 255
    l = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    s = np.clip(l @ np.array(MACH[kind]).T, 0, 1)
    g = np.where(s <= 0.0031308, 12.92 * s, 1.055 * s ** (1 / 2.4) - 0.055)
    return Image.fromarray((g * 255 + 0.5).astype(np.uint8))

def main():
    out, view, scale, boxes = sys.argv[1], sys.argv[2], float(sys.argv[3]), [tuple(int(v) for v in b.split(',')) for b in sys.argv[4].split(';')]
    builds = sys.argv[5].split(',') if len(sys.argv) > 5 and sys.argv[5] else ['p2', 'relief', 'massif', 'open']
    vision = sys.argv[6] if len(sys.argv) > 6 else None
    pad, lab = 6, 16
    if len(sys.argv) > 7 and sys.argv[7] == 'T':  # builds as columns, one crop
        bx = boxes[0]; cw = (int((bx[2] - bx[0]) * scale), int((bx[3] - bx[1]) * scale))
        sheet = Image.new('RGB', (len(builds) * (cw[0] + pad) + pad, cw[1] + lab + 2 * pad), (20, 18, 16)); d = ImageDraw.Draw(sheet)
        for c, bname in enumerate(builds):
            im = cvd(Image.open(f'{ME}shots/{bname}-{view}.png').convert('RGB'), vision); x = pad + c * (cw[0] + pad)
            d.text((x, pad), f'{bname}  {view}' + (f'  [{vision}]' if vision else ''), fill=(235, 225, 200))
            sheet.paste(im.crop(bx).resize(cw, Image.NEAREST if scale >= 1 else Image.LANCZOS), (x, pad + lab))
        sheet.save(out); print(out, sheet.size); return
    cols = [(int((b[2] - b[0]) * scale), int((b[3] - b[1]) * scale)) for b in boxes]
    W = sum(c[0] for c in cols) + pad * (len(cols) + 1); rowh = max(c[1] for c in cols) + lab + pad
    sheet = Image.new('RGB', (W, rowh * len(builds) + pad), (20, 18, 16)); d = ImageDraw.Draw(sheet)
    for r, bname in enumerate(builds):
        v = view.split('|')
        im = cvd(Image.open(f'{ME}shots/{bname}-{v[0]}.png').convert('RGB'), vision)
        x = pad; y = r * rowh + pad
        d.text((x, y), f'{bname}  {view}' + (f'  [{vision}]' if vision else ''), fill=(235, 225, 200))
        for (bx, cw) in zip(boxes, cols):
            sheet.paste(im.crop(bx).resize(cw, Image.NEAREST if scale >= 1 else Image.LANCZOS), (x, y + lab)); x += cw[0] + pad
    sheet.save(out); print(out, sheet.size)

if __name__ == '__main__': main()
