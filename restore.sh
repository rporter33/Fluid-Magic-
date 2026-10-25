#!/bin/sh
# Restores the art workspace into a scratchpad: ./restore.sh [TARGET]
# TARGET defaults to the original scratchpad path, which many tools in it name directly.
set -e
ORIG=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad
TARGET=${1:-$ORIG}
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$TARGET"
cp -a "$HERE/scratchpad/." "$TARGET/"
python3 - "$TARGET" <<'PY'
import os, sys
from PIL import Image
n = 0
for dp, dn, fn in os.walk(sys.argv[1]):
    for f in fn:
        if f.endswith('.png.webp'):
            p = os.path.join(dp, f)
            Image.open(p).save(p[:-5])
            os.remove(p)
            n += 1
print('atlas pages restored as PNG:', n)
PY
if [ "$TARGET" != "$ORIG" ] && [ ! -e "$ORIG" ]; then
  mkdir -p "$(dirname "$ORIG")"
  ln -s "$TARGET" "$ORIG"
  echo "linked $ORIG -> $TARGET"
fi
echo "restored into $TARGET"
