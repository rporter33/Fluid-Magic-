// critique pass D: does a piece's hit box cover a neighbouring province? right-click through pieces
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const at = (n) => page.evaluate((nm) => window.__mock.at(nm), n);
  const [x, y] = await at('Briardale');
  const probe = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); const r = document.getElementById('map').getBoundingClientRect(); return { tag: el.tagName, id: el.id, cls: el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className, prov: window.__mock.ev(`(() => { const w = toWorld(${x} - ${r.left}, ${y} - ${r.top}); return names[pickProv ? pickProv(w[0], w[1]) : -1]; })()`) }; }, [x + 5, y + 20]).catch((e) => 'ERR ' + e.message);
  console.log('probe at Briardale+5,20', JSON.stringify(probe));
  // what functions exist for picking
  console.log(await mock('[typeof pickProv, typeof provAt, typeof hitProv, typeof toWorld, typeof provAtScreen].join(",")'));
  // the army element boxes vs the province under each box's top-centre
  const res = await mock(`(() => { const out = []; const r = canvas.getBoundingClientRect(); document.querySelectorAll('#layer *').forEach(() => {}); const els = [...document.querySelectorAll('[data-army], .rlpiece, .rl-piece, .piece')]; return els.slice(0, 20).map((e) => { const b = e.getBoundingClientRect(); return [e.className, Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }); })()`);
  console.log('piece els', JSON.stringify(res));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
