# Stage B fix pass, critique fix 12: the portrait prompt tool's Thornwood colour words and the god bodies' references.
p = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/portraits/tools/pt_prompts.py'
s = open(p).read()
G = "deep bottle green, the green of jade in shade, clearly coloured, never grey, slate, olive or yellow-green"
Q = "\\'"
reps = [
    ("    'thornwood': 'deep pine-green cloth (#1F6A50), the Thornwood" + Q + "s colour: a clear blue-green like fir needles in '\n"
     "                 'shade, never grey, olive or yellow-green',",
     "    # stage B fix pass (critique fix 12): calibration decision 2 words; the review wording (a clear blue-green, as of conifer\n"
     "    # needles in shade) painted the cloth grey (chroma 0.024 against 0.084). The hue lock gate (sideThornLock) stays.\n"
     "    'thornwood': 'cloth of a " + G + " (#1F6A50), the Thornwood" + Q + "s colour',"),
    ("       'thornwood': 'deep pine green (#1F6A50), the Thornwood" + Q + "s colour: a clear blue-green like fir needles in shade, '\n"
     "                    'never grey, olive or yellow-green'}",
     "       'thornwood': '" + G + " (#1F6A50), the Thornwood" + Q + "s colour'}"),
    ("WORD = {'cinderHorde': 'ember-orange', 'thornwood': 'pine-green'}", "WORD = {'cinderHorde': 'ember-orange', 'thornwood': 'bottle-green'}"),
    ("        'thornwood': 'a deep pine green (#1F6A50), the Thornwood" + Q + "s colour: a clear blue-green like fir needles in '\n"
     "                     'shade, never olive or yellow-green'}",
     "        'thornwood': 'a " + G + " (#1F6A50), the Thornwood" + Q + "s colour'}"),
    ("in deep pine green (#1F6A50), the Thornwood" + Q + "s colour, a '\n"
     "        'clear blue-green like fir needles in shade, never grey, olive, yellow-green or teal; keep all the painted '",
     "in a deep bottle green, the green of jade in shade (#1F6A50), the '\n"
     "        'Thornwood" + Q + "s colour, clearly coloured, never grey, slate, olive, yellow-green or teal; keep all the painted '"),
    ("PREFACE_BODY = (",
     "# stage B fix pass (critique fix 12): a whole-figure job had only the head-and-shoulders anchor as reference, which\n"
     "# invites a bust crop. Where the god has a maquette (pt_maquettes.py: its variant 0 in grey clay, full length,\n"
     "# three-quarter front from a little above, framed as the portrait), it is Image 1 for pose, parts and framing and the\n"
     "# anchor is Image 2 for the hand.\n"
     "GODREF = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'refs', 'gods')\n"
     "PREFACE_BODY_MAQ = (\"Image 1 is a grey clay maquette of this figure: follow its pose, its proportions, its parts and its \"\n"
     "                    \"framing, the whole figure from head to foot filling the square as it does, seen three-quarter front \"\n"
     "                    \"from a little above. Paint over it completely: no grey clay and no plain smooth shapes may remain. \"\n"
     "                    \"Image 2 is a style reference only: match its painting style, brushwork, candle lighting, rim light, \"\n"
     "                    \"muted colours and dark background. Do not copy its head-and-shoulders framing. The subject, its \"\n"
     "                    \"face, its headgear and every ornament must follow the description below exactly; do not copy the \"\n"
     "                    \"man, the helm, the horns, the fur or the trim from Image 2.\")\n"
     "PREFACE_BODY = ("),
    ("    return f\"{PREFACE_BODY}\\n\\n{head}\\n\\nSubject: {fill(g['desc'])}\\n{var}\"",
     "    pre = PREFACE_BODY_MAQ if god_maquette(ch) else PREFACE_BODY\n"
     "    return f\"{pre}\\n\\n{head}\\n\\nSubject: {fill(g['desc'])}\\n{var}\"\n\n\n"
     "def god_maquette(ch):\n"
     "    p = os.path.join(GODREF, f'{ch}.png')\n"
     "    return os.path.abspath(p) if os.path.exists(p) else None"),
    ("                    add(job, 'gods', ch, nation, '01', cand, 'body', god_prompt(ch, nation, GOD_VAR[cand]), [ANCHOR],\n"
     "                        g['marks'], tint=True, extra=dict(extra, route='new'))",
     "                    mq = god_maquette(ch)\n"
     "                    add(job, 'gods', ch, nation, '01', cand, 'body', god_prompt(ch, nation, GOD_VAR[cand]),\n"
     "                        [mq, ANCHOR] if mq else [ANCHOR], g['marks'], tint=True,\n"
     "                        extra=dict(extra, route='new', maquette=mq and os.path.relpath(mq, SB)))"),
]
for i, (a, b) in enumerate(reps):
    n = s.count(a)
    if n != 1:
        raise SystemExit(f'replacement {i} matched {n} times: {a[:90]!r}')
    s = s.replace(a, b)
if 'fir needles' in s:
    raise SystemExit('fir needles still present at ' + str(s.index('fir needles')))
open(p, 'w').write(s)
print('ok')
