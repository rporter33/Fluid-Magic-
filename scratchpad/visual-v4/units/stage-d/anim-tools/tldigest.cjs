// The timeline of each battle built in Node from a src directory's pure modules (no Pixi, no DOM), serialised: a refactor
// guard for the timeline modules. node tldigest.cjs SRC_DIR OUT.json
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = process.argv[2];
const mods = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && /^(0|1|2|3|45|5)/.test(f)).sort();
const ctx = { console, Math, JSON, Map, Set, WeakMap, Array, Object, Number, String, Infinity, NaN, isFinite, parseInt, Float32Array, Uint8Array, Uint32Array, Int32Array, Promise };
vm.createContext(ctx);
const code = mods.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') + `
;var FX_SETTINGS = { flashes: 'full', quality: 'high', timing: 'storyboard' };
;globalThis.__out = (() => {
  const DATA = JSON.parse(BATTLES);
  const out = {};
  for (const B of DATA) {
    const S = buildScript(B), L = layoutBattle(S), T = buildTimeline(S, L);
    const seen = new WeakSet();
    out[B.key] = JSON.stringify(T, (k, v) => {
      if (typeof v === 'function') return '[fn]';
      if (v === Infinity) return 'Inf'; if (v === -Infinity) return '-Inf';
      if (k === 'S' || k === 'L' || k === 'g' && v && v.unit) return undefined;
      if (v && typeof v === 'object') { if (seen.has(v)) return '[ref]'; seen.add(v); }
      return v;
    });
  }
  return out;
})();`;
ctx.BATTLES = fs.readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/battle-data/battles.json', 'utf8');
vm.runInContext(code, ctx, { filename: 'tl.js' });
const out = ctx.__out;
const sizes = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length]));
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log(mods.length, 'modules', JSON.stringify(sizes));
