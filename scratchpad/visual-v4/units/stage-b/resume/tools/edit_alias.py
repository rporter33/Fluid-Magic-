import sys
p = sys.argv[1]; s = open(p).read()
A1 = "PAGE_W, PAGE_HMAX, GUTTER = 2048, 2048, 6\n"
B1 = A1 + (
    "# Frames that read wrong by eye in the battles (resume pass, 2026-10-23): the frame is not packed and its pose shows\n"
    "# the named sibling frame instead. Sapling Druid 03 back cheer: the staff is bent into an S and cut flat by the cell's\n"
    "# top edge (cmdB sheet sd03.back, a reported view); his raised-staff rally frame (actA) stands in.\n"
    "FRAME_ALIAS = {'saplingDruid-03.back.cheer': 'saplingDruid-03.back.actA'}\n")
A2 = ("                    if key not in at:\n"
      "                        continue\n"
      "                    img, f = crop(*at[key])\n"
      "                    cmd_items[t].append(dict(name=key, img=img, anchor=f))\n")
B2 = A2.replace("if key not in at:", "if key not in at or key in FRAME_ALIAS:")
A3 = ("    for t in TIERS:\n"
      "        add_pages('plain:cmd', t, cmd_items[t])\n")
B3 = A3 + (
    "        for bad, good in FRAME_ALIAS.items():\n"
    "            if good in frame_index[t]:\n"
    "                frame_index[t][bad] = list(frame_index[t][good])\n"
    "    for bad, good in FRAME_ALIAS.items():\n"
    "        fid, v, pose = bad.split('.', 2)\n"
    "        if fid in looks and v in looks[fid]['views']:\n"
    "            looks[fid]['views'][v].setdefault('aliased', {})[pose] = good.split('.', 2)[2]\n")
for a, b in ((A1, B1), (A2, B2), (A3, B3)):
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(p, 'w').write(s)
print('ok')
