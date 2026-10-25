// the start state's focus: node probe-start.cjs
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 896); await p.waitForTimeout(500);
  console.log(JSON.stringify(await mev(p, '({ moveLine: moveLine && { from: names[moveLine.from], path: moveLine.path.map((i) => names[i]) }, sel: state.sel, varoAt: names[cmd.varo.at], hover: hoverProv, focus: [...rlWildFocus(false).keys()].map((k) => k.split(":").map((i) => names[+i] || i).join(" | ")), live: [...rlWildFocus(true).keys()] })')));
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
