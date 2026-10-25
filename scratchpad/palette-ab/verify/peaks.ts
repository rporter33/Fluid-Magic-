// The passable peaks' literal faces (#B4C1C6 lit, #6E7F86 shade; p55-paint.js stampItemP) against each palette's Mountains fill
import { deltaE2000, labAs } from './colorMath.ts';
import { contrastRatio } from './colors.ts';
for (const [pal, f] of [['bright', '#8DA4AD'], ['painted', '#9FB8D0']]) for (const face of ['#B4C1C6', '#6E7F86']) console.log(pal, f, face, 'dE2000', deltaE2000(labAs(face, 'normal'), labAs(f, 'normal')).toFixed(1), 'L* face', labAs(face, 'normal')[0].toFixed(1), 'fill', labAs(f, 'normal')[0].toFixed(1), 'WCAG', contrastRatio(face, f).toFixed(2));
