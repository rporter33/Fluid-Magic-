// the phone at Fit: layout (labels over pieces) at fit() and at panned positions, with a shot of each failing case: node phonefit.cjs [look] [dpr]
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 3);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w: 390, h: 844, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(195, 840);
  const rows = [];
  const probe = async (nm, src) => { await ev(p, src); await p.waitForTimeout(1200); const L = await ev(p, 'm.reliefLayout()'); rows.push([nm, L.labelOverlaps, L.labelPieceOverlaps, L.pieceOverlaps, JSON.stringify(L.examples), L.Dpx]); console.log(nm, L.Dpx, L.labelOverlaps, L.labelPieceOverlaps, L.pieceOverlaps, JSON.stringify(L.examples)); if (L.labelPieceOverlaps || L.labelOverlaps) await p.screenshot({ path: `${SHOTS}V-phone-overlap-${look}-${nm}.png` }); };
  await probe('fit', 'm.ev("fit(); RCK = null; draw()")');
  await p.click('#fitBtn').catch(() => null); await p.waitForTimeout(600); await probe('fitBtn', '0');
  await probe('min800', 'm.setScale(m.minScale(), 800, 500)');
  for (const [x, y] of [[500, 400], [1100, 500], [800, 300], [800, 700], [300, 600], [1300, 300]]) await probe(`min${x}_${y}`, `m.setScale(m.minScale(), ${x}, ${y})`);
  for (const [x, y] of [[500, 400], [1100, 500], [800, 700]]) await probe(`s0.2_${x}_${y}`, `m.setScale(0.2, ${x}, ${y})`);
  fs.writeFileSync(`${OUT}phonefit-${look}.json`, JSON.stringify(rows)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
