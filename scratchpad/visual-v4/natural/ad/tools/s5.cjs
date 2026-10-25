const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1500 });
  const out = [];
  for (const n of ['Rookford', 'Thornwick', 'Cinford', 'Rookmarch', 'Wyrmere', 'Marholt', 'Briardale']) {
    const [x, y] = await ev(p, `m.at(${JSON.stringify(n)})`); await p.mouse.move(x + 12, y + 14); await p.waitForTimeout(900);
    const t = await p.evaluate(() => { const el = [...document.querySelectorAll('.tip, .tooltip, [role=tooltip]')].filter((e) => e.offsetParent); return el.map((e) => e.innerText.split('\n').slice(0, 2).join(' | ')).join(' || '); });
    out.push(n + ' (' + (await ev(p, 'm.ev(' + JSON.stringify('fogOf(names.indexOf(' + JSON.stringify(n) + '))') + ')')) + ') -> ' + t);
    if (n === 'Rookford') await p.screenshot({ path: OUT + 'e01-hover-fog.png' });
    await p.mouse.move(700, 880); await p.waitForTimeout(300);
  }
  console.log(out.join('\n'));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
