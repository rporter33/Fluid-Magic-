#!/bin/sh
# build the mockup and check the script's syntax
D=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4
sh $D/map/build.sh > /dev/null && python3 -c "
s=open('$D/map/game-screen-v4.html').read(); i=s.index('<script>\n(() => {'); j=s.rindex('</script>'); open('$D/natural/build-tools/page.js','w').write(s[i+8:j])" && node --check $D/natural/build-tools/page.js && echo BUILD-OK
