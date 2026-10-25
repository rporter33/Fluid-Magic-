// p4Determinism's source half: node scan.cjs -> out/scan.json
// (1) no Math.random and no Date in the new parts (comments stripped); (2) no Math.sin/cos/exp/log/pow/atan2 and no noise( or wet( in p13's rule-bearing builders;
// (3) every identifier the builders read at p20's load (rlWorld4 and what it calls; legDays's world half) is declared in p10b, p12 or p13: the free identifiers of each
// builder's source are matched against the top-level declarations of every part after p13 in build order (a later const would throw at load; a later function would be read early)
const fs = require('fs'), SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad', DIR = SP + '/visual-v4/map/parts/', OUT = SP + '/visual-v4/natural/pass4/part1/out/';
const order = fs.readFileSync(SP + '/visual-v4/map/build.sh', 'utf8').match(/parts\/[\w.-]+/g).map((s) => s.slice(6)).filter((f) => f.endsWith('.js'));
const NEW = ['p13-p4-world.js', 'p58s-seasons.js', 'p65-waters.js', 'p66-memory.js', 'p90a-pass4-checks.js', 'p90b-pass4-checks.js'].filter((f) => fs.existsSync(DIR + f));
const strip = (s) => s.replace(/\/\/[^\n]*$/gm, (m) => (/['"`]/.test(m.slice(0, 2)) ? m : '')).replace(/\/\*[\s\S]*?\*\//g, '');
const res = { parts: NEW, randomOrDate: {}, transcendental: {}, laterReads: {} };
for (const f of NEW) { const s = strip(fs.readFileSync(DIR + f, 'utf8')); const m = s.match(/Math\.random|\bnew Date\b|\bDate\.\w+/g); if (m) res.randomOrDate[f] = m; }
const p13 = fs.readFileSync(DIR + 'p13-p4-world.js', 'utf8'), fnSrc = (name) => { const i = p13.search(new RegExp('(function ' + name + '\\b|const ' + name + ' =)')); if (i < 0) return ''; const eol = p13.indexOf('\n', i); let d = 0, k = p13.indexOf('{', i), j = k; if (p13.slice(i, i + 6) === 'const ' && (k < 0 || k > eol)) return p13.slice(i, eol); for (; j < p13.length; j++) { if (p13[j] === '{') d++; else if (p13[j] === '}') { d--; if (!d) break; } } return p13.slice(i, j + 1); };
const builders = ['rlWorld4', 'legDays', 'p4VN', 'p4Lat', 'p4MedD', 'p4BridgeUp', 'p4RiverEdge', 'p4Crossing', 'p4SeasonOf', 'p4Bfs', 'p4Connected', 'rlSupplyPath', 'rlRegions4'];
for (const b of builders) { const s = strip(fnSrc(b)); const m = s.match(/Math\.(sin|cos|exp|log|pow|atan2)\b|(?<![.\w])(noise|wet)\s*\(/g); if (m) res.transcendental[b] = m; }
const later = new Map(); let after = false; for (const f of order) { if (f === 'p13-p4-world.js') { after = true; continue; } if (!after) continue; const s = fs.readFileSync(DIR + f, 'utf8'); for (const m of s.matchAll(/^(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) if (!later.has(m[1])) later.set(m[1], f); for (const m of s.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=.*?,\s*([A-Za-z_$][\w$]*)\s*=/gm)) if (!later.has(m[2])) later.set(m[2], f); }
const locals = (s) => { const L = new Set(), add = (t) => { for (const m of t.matchAll(/([A-Za-z_$][\w$]*)/g)) L.add(m[1]); };
  for (const m of s.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) L.add(m[1]); for (const m of s.matchAll(/([A-Za-z_$][\w$]*)\s*=(?![=>])/g)) L.add(m[1]);
  for (const m of s.matchAll(/\(([^()]*)\)\s*=>/g)) add(m[1].replace(/=[^,]*/g, '')); for (const m of s.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) L.add(m[1]); for (const m of s.matchAll(/[{,]\s*([A-Za-z_$][\w$]*)\s*:(?!:)/g)) L.add(m[1]); for (const m of s.matchAll(/function\s*[\w$]*\s*\(([^)]*)\)/g)) add(m[1].replace(/=[^,]*/g, ''));
  for (const m of s.matchAll(/(?:const|let)\s*[\[{]([^\]}]*)[\]}]/g)) add(m[1]); for (const m of s.matchAll(/for\s*\(\s*(?:const|let)\s*\[?([^\]=;]*?)\]?\s+of/g)) add(m[1]); return L; };
const ALLOWED = { legDays: ['DAYS', 'curMonth'], p4BridgeUp: ['curMonth'], p4RiverEdge: ['curMonth'], p4Crossing: ['curMonth'] }; // p20 declares both before its first pathTo call (line 10 and line 51; the first call is acrossTarget's, after line 82)
for (const b of ['rlWorld4', 'legDays', 'p4VN', 'p4Lat', 'p4MedD', 'p4BridgeUp', 'p4RiverEdge', 'p4Crossing', 'p4SeasonOf']) { const s = strip(fnSrc(b)).replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""'), ids = new Set([...s.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  const loc = locals(s), bad = [...ids].filter((id) => later.has(id) && !loc.has(id) && !(ALLOWED[b] ?? []).includes(id)).map((id) => id + ' (' + later.get(id) + ')'); if (bad.length) res.laterReads[b] = bad; }
res.pass = !Object.keys(res.randomOrDate).length && !Object.keys(res.transcendental).length && !Object.keys(res.laterReads).length;
fs.writeFileSync(OUT + 'scan.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
