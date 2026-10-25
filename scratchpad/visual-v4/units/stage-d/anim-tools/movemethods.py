# Moves class methods (2-space indented, ending at a line '  }') with their doc comments from a module into a new module
# as Object.assign(Class.prototype, {...}). Usage: python3 movemethods.py SRC.js CLASS NEW.js "header comment" m1 m2 ...
import re, sys
srcf, cls, newf, hdr, names = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:]
src = open(srcf).read().split('\n')
spans = []
for n in names:
    cand = [k for k, l in enumerate(src) if re.match(r'  (async |get )?' + re.escape(n) + r'\(', l)]
    assert len(cand) == 1, (n, cand)
    i = cand[0]
    j = i
    while src[j - 1].startswith('  ') and src[j - 1].strip().startswith(('/**', '*', '*/', '//')) and not src[j - 1].startswith('    '):
        j -= 1
    if src[i].rstrip().endswith('}') and src[i].count('{') == src[i].count('}'):
        e = i
    else:
        e = i
        while src[e] != '  }':
            e += 1
    spans.append((j, e, n))
spans.sort()
moved, drop = [], set()
for j, e, n in spans:
    blk = src[j:e + 1]
    blk[-1] = blk[-1] + ','
    moved.append('\n'.join(blk))
    drop.update(range(j, e + 1))
keep = [l for k, l in enumerate(src) if k not in drop]
# collapse runs of blank lines left behind
out = []
for l in keep:
    if l.strip() == '' and out and out[-1].strip() == '':
        continue
    out.append(l)
open(srcf, 'w').write('\n'.join(out))
open(newf, 'w').write("'use strict';\n" + ''.join('// ' + h + '\n' for h in hdr.split('\n')) + '\nObject.assign(' + cls + '.prototype, {\n' + '\n'.join(moved) + '\n});\n')
print(newf, len(moved), 'methods')
