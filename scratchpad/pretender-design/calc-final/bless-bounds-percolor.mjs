// PER-COLOR variant (final rule). Blessing menu bounds: BP = per color of max(0, pips - 1); cost = max(1, requires - 1);
// requirements 2 to 6 (no requirement-1 effect); at most one effect per group.
// Prints, per pip set, the maximum of each stat any valid selection reaches (incarnate included),
// and checks the default rule (standard at 4, greater at 6) always fits the points.
const E = [
  // id, color, req, group, incarnate, effect
  ['fervor', 'R', 2, 'R.mor', 0, { mor: 1 }],
  ['keenEdge', 'R', 2, 'R.att', 0, { att: 1 }],
  ['emberMight', 'R', 3, 'R.str', 0, { str: 2 }],
  ['emberWrath', 'R', 4, 'R.wrath', 0, { att: 2, str: 2 }],
  ['cinderSkin', 'R', 4, 'R.shield', 0, { fire: 3 }],
  ['blazingCharge', 'R', 4, 'R.charge', 0, { first: 5, mor: 1 }],
  ['furyUnbound', 'R', 5, 'R.berserk', 1, { berserk: 1, att: 1 }],
  ['flamingWeapons', 'R', 5, 'R.weapon', 1, { melee: 3 }],
  ['greaterEmberWrath', 'R', 6, 'R.wrath', 0, { att: 4, str: 4 }],
  ['livingPyre', 'R', 6, 'R.shield', 1, { fire: 5, att: 2 }],
  ['thickSkin', 'G', 2, 'G.prot', 0, { prot: 1 }],
  ['vigor', 'G', 2, 'G.regen', 0, { regen: 5 }],
  ['strengthOfEarth', 'G', 3, 'G.str', 0, { str: 2 }],
  ['evergreen', 'G', 4, 'G.regen', 0, { regen: 10, prot: 1 }],
  ['oakhide', 'G', 4, 'G.prot', 0, { prot: 3 }],
  ['deepRoots', 'G', 4, 'G.mor', 0, { mor: 3, prot: 1 }],
  ['wildVigor', 'G', 5, 'G.regen', 1, { regen: 20, str: 1 }],
  ['thornhide', 'G', 5, 'G.shield', 1, { nature: 4, prot: 1 }],
  ['greaterEvergreen', 'G', 6, 'G.regen', 0, { regen: 20, prot: 2 }],
  ['ironbark', 'G', 6, 'G.prot', 1, { prot: 5, str: 2 }],
  ['resolve', 'W', 2, 'W.mor', 0, { mor: 1 }],
  ['warding', 'W', 2, 'W.prot', 0, { prot: 1 }],
  ['steadfast', 'W', 4, 'W.std', 0, { mor: 2, prot: 1 }],
  ['greaterSteadfast', 'W', 6, 'W.std', 0, { mor: 4, prot: 2 }],
  ['keenEye', 'U', 2, 'U.prec', 0, { prec: 1 }],
  ['wariness', 'U', 2, 'U.def', 0, { def: 1 }],
  ['clearSight', 'U', 4, 'U.std', 0, { def: 2, prec: 2 }],
  ['greaterClearSight', 'U', 6, 'U.std', 0, { def: 4, prec: 4 }],
  ['cruelty', 'B', 2, 'B.att', 0, { att: 1 }],
  ['grimResolve', 'B', 2, 'B.mor', 0, { mor: 1 }],
  ['bloodThirst', 'B', 4, 'B.std', 0, { drain: 2, att: 1 }],
  ['greaterBloodThirst', 'B', 6, 'B.std', 0, { drain: 4, att: 2 }],
].map(([id, color, req, group, inc, eff]) => ({ id, color, req, group, inc, eff, cost: Math.max(1, req - 1) }));
const STATS = ['att', 'str', 'def', 'prot', 'mor', 'prec', 'regen', 'drain', 'fire', 'nature', 'melee', 'first', 'berserk'];
const bp = (pips) => Object.values(pips).reduce((s, n) => s + Math.max(0, n - 1), 0);
function maxima(pips) {
  const avail = E.filter((e) => (pips[e.color] ?? 0) >= e.req);
  const budget = bp(pips);
  const perColor = Object.fromEntries(Object.entries(pips).map(([c, n]) => [c, Math.max(0, n - 1)]));
  const best = Object.fromEntries(STATS.map((s) => [s, 0]));
  const bestPick = {};
  // depth-first over groups: pick none or one effect per group
  const groups = [...new Set(avail.map((e) => e.group))];
  const rec = (gi, spent, acc, pick) => { // spent: per-color map
    if (gi === groups.length) {
      for (const s of STATS) if ((acc[s] ?? 0) > best[s]) { best[s] = acc[s]; bestPick[s] = [...pick]; }
      return;
    }
    rec(gi + 1, spent, acc, pick);
    for (const e of avail.filter((x) => x.group === groups[gi])) {
      if ((spent[e.color] ?? 0) + e.cost > perColor[e.color]) continue;
      const next = { ...acc };
      for (const [k, v] of Object.entries(e.eff)) next[k] = (next[k] ?? 0) + v;
      pick.push(e.id); rec(gi + 1, { ...spent, [e.color]: (spent[e.color] ?? 0) + e.cost }, next, pick); pick.pop();
    }
  };
  rec(0, {}, {}, []);
  return { budget, best, bestPick };
}
function defaultFits(pips) {
  let cost = 0;
  for (const [c, n] of Object.entries(pips)) if (n >= 6) cost += 5; else if (n >= 4) cost += 3;
  return cost <= bp(pips);
}
const sets = [{ R: 2 }, { R: 3 }, { R: 4 }, { R: 5 }, { R: 6 }, { G: 4 }, { G: 6 }, { R: 4, G: 2 }, { R: 6, G: 4 }, { R: 6, G: 6 },
  { R: 6, G: 6, W: 6, U: 6, B: 6 }];
console.log('| Pips | BP | ' + STATS.join(' | ') + ' |');
console.log('|' + '---|'.repeat(STATS.length + 2));
for (const p of sets) {
  const { budget, best } = maxima(p);
  console.log(`| ${Object.entries(p).map(([c, n]) => c + n).join(' ')} | ${budget} | ${STATS.map((s) => best[s]).join(' | ')} |`);
}
// default rule always affordable: every pip vector 0..6 in five colors
let all = 0, bad = 0;
const C = ['W', 'U', 'B', 'R', 'G'];
const walk = (i, p) => { if (i === 5) { all++; if (!defaultFits(p)) bad++; return; } for (let n = 0; n <= 6; n++) walk(i + 1, { ...p, [C[i]]: n }); };
walk(0, {});
console.log(`default rule fits its bless points in ${all - bad} of ${all} pip vectors`);
// exactly-at-requirement claim: a god with only r pips in one color can afford any one effect of requirement r
let claim = true;
for (const e of E) if (Math.max(0, e.req - 1) < e.cost) claim = false;
console.log(`exactly-at-requirement claim holds for every effect: ${claim}`);
console.log('regen max at G6 R4 (the judge case):', maxima({ G: 6, R: 4 }).best.regen, maxima({ G: 6, R: 4 }).bestPick.regen);
