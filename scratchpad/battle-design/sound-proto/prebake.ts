import { bytesOf, secondsOf, select } from './catalog';
for (const [name, tags] of [
  ['core only', ['core']],
  ['core + cinder nation set', ['core', 'n:cinder', 'v:human', 'a:scale', 'w:axe', 'w:thrust', 'w:bowShort', 'w:bowFire', 'w:staff', 'e:fire', 'c:R', 'gore', 'missile']],
  ['P0 intro set (2 nations, hills)', ['n:cinder', 'n:thorn', 't:hills']],
] as const) {
  const rows = select(new Set(tags as readonly string[]));
  console.log(name, rows.length, 'recipes', Math.round(secondsOf(rows)), 's', (bytesOf(rows) / 1048576).toFixed(1), 'MB', (secondsOf(rows) / 100).toFixed(2), 's bake 1 worker');
}
