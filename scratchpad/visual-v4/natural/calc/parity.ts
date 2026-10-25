import { labAs, deltaE2000, type Vision } from './colorMath.ts';
const pairs = [['#78894A', '#877773'], ['#1A3819', '#6D5303'], ['#F3E6B8', '#847951'], ['#3A7BD5', '#787A6A']];
for (const [a, b] of pairs) console.log(a, b, (['normal', 'protan', 'deutan', 'tritan'] as Vision[]).map((v) => deltaE2000(labAs(a!, v), labAs(b!, v)).toFixed(4)));
