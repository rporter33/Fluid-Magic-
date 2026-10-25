# Runs the live visual-v4/build.py into a temporary file and renames it into place, so a page being read is never
# half-written (the clip recorder and the checks load it while this runs). Usage: python3 -I live_build.py
import os
here = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
os.chdir(here)
src = open('build.py').read().replace("out = os.path.join(here, 'battle-mockup.html')", "out = os.path.join(here, 'battle-mockup.html.tmp')")
assert 'battle-mockup.html.tmp' in src
exec(compile(src, 'build.py', 'exec'), {'__file__': os.path.join(here, 'build.py'), '__name__': '__main__'})
os.replace(os.path.join(here, 'battle-mockup.html.tmp'), os.path.join(here, 'battle-mockup.html'))
print('live page replaced:', os.path.getsize(os.path.join(here, 'battle-mockup.html')), 'bytes')
