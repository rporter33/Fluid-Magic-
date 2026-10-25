// what the page's reader check and Clear means check return in a data mode: node modereader.cjs
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1200 }); await p.mouse.move(720, 896);
  for (const mode of ['dominion', 'supply']) { await mev(p, `setMode('${mode}')`); await p.waitForTimeout(1500);
    const r = await ev(p, '(() => { try { const R = m.reliefNatural(true); return JSON.stringify({ readers: R.readers, keys: Object.keys(R) }).slice(0, 600); } catch (e) { return "THROWS " + e.message; } })()');
    const c = await ev(p, '(() => { try { return JSON.stringify(m.reliefChecks().natural && m.reliefChecks().natural.readers).slice(0, 300); } catch (e) { return "THROWS " + e.message; } })()');
    console.log(mode, 'reliefNatural(true):', r); console.log(mode, 'reliefChecks().natural.readers:', c); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
