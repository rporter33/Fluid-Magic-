import sys
p=sys.argv[1]; s=open(p).read()
a="q: look === 'clear' ? '?terrain=clear' : '' });"
assert a in s
s=s.replace(a,"q: ((x) => (x.length ? '?' + x.join('&') : ''))([look === 'clear' ? 'terrain=clear' : '', process.env.Q || ''].filter(Boolean)) });")
a="const tag = `${process.env.TAGP || ''}"
assert a in s
s=s.replace(a,"const tag = `${process.env.TAGP || ''}${process.env.Q ? process.env.Q.replace(/[^a-z0-9]+/gi, '') + '-' : ''}")
open(p,'w').write(s)
