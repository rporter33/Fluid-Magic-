import { contrastRatio } from './colors.ts';
for (const m of ['#9FB8D0', '#8DA4AD']) console.log(m, 'bank #35535A', contrastRatio('#35535A', m).toFixed(2), '| PAPER_INK? n/a');
