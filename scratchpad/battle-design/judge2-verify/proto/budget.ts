import { BANK, bytesOf, secondsOf, select, type Row } from './catalog';

const X_REALTIME = 100; // measured: 134x for the representative set, 60x for single voices
const MB = (b: number) => +(b / 1048576).toFixed(1);
const out: string[] = [];
const report = (name: string, rows: Row[]) => {
  const variants = rows.reduce((s, r) => s + r.v, 0);
  const line = { name, recipes: rows.length, variants, audioSec: Math.round(secondsOf(rows)), MB: MB(bytesOf(rows)), bake1: +(secondsOf(rows) / X_REALTIME).toFixed(1), bake3: +(secondsOf(rows) / X_REALTIME / 3).toFixed(1) };
  out.push(`| ${name} | ${line.recipes} | ${line.variants} | ${line.audioSec} | ${line.MB} | ${line.bake1} | ${line.bake3} |`);
  return line;
};

const ids = new Set(BANK.map((r) => r.id));
if (ids.size !== BANK.length) throw new Error('duplicate ids');

const m1 = BANK.filter((r) => !r.tags.split('|').includes('m2'));
report('Full bank, M2 colors included', BANK);
report('M1 bank', m1);

const small = new Set([
  'core', 'gore', 'missile', 'shield', 'caster', 'e:fire', 'w:axe', 'w:bowShort', 'w:bowFire', 'w:staff',
  'w:blade', 'w:bowLong', 'a:scale', 'a:bark', 'v:human', 'n:cinder', 'n:thorn', 't:hills',
  'c:R', 'c:R:travel', 'c:R:damage', 'c:G', 'c:G:damage', 's:emberDart', 's:thornSpray', 's:bless', 'w:thrust',
]);
report('Starting armies, Hills (Ember Dart, Thorn Spray, Bless)', select(small));

const big = new Set([
  ...small, 'big', 'w:axeHeavy', 'w:lance', 'w:javelin', 'w:light', 'w:bite', 'w:bluntHeavy', 'w:bluntHuge',
  'w:sting', 'a:wood', 'a:none', 'mount:horse', 'mount:wolf', 'v:wolf', 'v:berserk', 'v:treant',
  'v:swarm', 'charge', 'size4', 'size3', 'flying', 'regen', 's:pyreStorm', 's:fireball', 's:bloodFury',
  's:entangle', 's:barkSkin', 's:swarm', 'brutal', 'c:R:area', 'c:R:buff', 'c:G:buff', 'c:G:curse',
  'c:G:summon', 'c:G:heal',
]);
report('300 vs 300, Hills, Brutal gore', select(big));
report('Worst M1 battle (every M1 tag)', select(new Set(m1.flatMap((r) => r.tags.split('|')))));

const heads = '| Set | Recipes | Variants | Audio (s) | Memory (MB) | Bake, 1 worker (s) | Bake, 3 workers (s) |\n|---|---|---|---|---|---|---|';
console.log([heads, ...out].join('\n'));

// Per-family totals for the M1 bank.
const fams = new Map<string, Row[]>();
for (const r of m1) fams.set(r.family, [...(fams.get(r.family) ?? []), r]);
console.log('\n| Family | Recipes | Variants | Memory (MB) |\n|---|---|---|---|');
for (const [f, rs] of fams) console.log(`| ${f} | ${rs.length} | ${rs.reduce((s, r) => s + r.v, 0)} | ${MB(bytesOf(rs))} |`);
