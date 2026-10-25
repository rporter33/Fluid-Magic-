const page = await open(1280, 720);
const log = [];
const st = async (label) => { const s = await page.evaluate(() => ({ ...window.__battle.state(), playing: window.__battle.game.playing, follow: window.__battle.game.follow, errs: window.__errors.slice() })); log.push([label, s]); return s; };
await st('start');
await page.waitForTimeout(3000); await st('after 3s real at 1x');
await page.keyboard.press('4'); await page.waitForTimeout(3000); await st('after key 4 + 3s');
await page.keyboard.press('Space'); await st('space pause');
const t0 = (await st('paused')).t; await page.waitForTimeout(1000); const t1 = (await st('paused+1s')).t; log.push(['paused advance', t1 - t0]);
await page.keyboard.press('ArrowRight'); await st('arrow right');
await page.keyboard.press('Shift+ArrowRight'); await st('shift arrow right');
await page.keyboard.press('End'); await page.waitForTimeout(300); await st('end');
const resShown = await page.evaluate(() => document.getElementById('result').classList.contains('show')); log.push(['result shown after End', resShown]);
await page.click('#rReplay'); await page.waitForTimeout(500); await st('watch again');
// wheel zoom and drag pan on canvas
await page.mouse.move(640, 360); await page.mouse.wheel(0, -500); await page.waitForTimeout(200); await st('wheel in');
await page.mouse.down(); await page.mouse.move(400, 300, { steps: 5 }); await page.mouse.up(); await st('drag');
await page.mouse.dblclick(30, 300); await page.waitForTimeout(200); await st('dblclick empty (follow)');
// switch battles mid-play by clicking picker
for (const k of ['b', 'c', 'a']) { await page.click(`#picker button[data-k="${k}"]`); await page.waitForTimeout(800); await st('picker ' + k); }
// menu items
await page.click('#bMenu'); await page.waitForTimeout(100);
const items = await page.$$eval('#menu button', (bs) => bs.map((b) => b.innerText.replace(/\n/g, ' ')));
log.push(['menu', items]);
await page.click('#menu button:not(.pick):has-text("Log")'); await page.waitForTimeout(200);
const logShown = await page.evaluate(() => document.getElementById('log').classList.contains('show')); log.push(['log shown', logShown]);
await page.click('#log .ln:nth-child(5)'); await page.waitForTimeout(200); await st('log click');
await page.keyboard.press('l'); await page.keyboard.press('h'); await page.waitForTimeout(200);
const hudHidden = await page.evaluate(() => document.getElementById('hud').classList.contains('hidden')); log.push(['hud hidden', hudHidden]);
await page.keyboard.press('h');
// speed button cycle
for (let i = 0; i < 5; i++) { await page.click('#bSpeed'); log.push(['speed btn', await page.evaluate(() => document.getElementById('bSpeed').textContent)]); }
// skip button and toggle play at end restarts
await page.click('#bSkip'); await page.waitForTimeout(200); await page.click('#bPlay'); await page.waitForTimeout(300); await st('play at end');
// resize while playing
await page.setViewportSize({ width: 800, height: 600 }); await page.waitForTimeout(500); await st('resized');
await page.screenshot({ path: 'shots/s9-resized-800.png' });
// card click select and dblclick center
await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(300);
await page.click('#bar .card:nth-child(1)'); await page.waitForTimeout(100);
const sel = await page.evaluate(() => window.__battle.game.view.selected); log.push(['selected after card click', sel]);
await page.mouse.move(640, 100); await page.waitForTimeout(200);
const stickyHover = await page.evaluate(() => ({ show: document.getElementById('hover').classList.contains('show'), text: document.getElementById('hover').innerText.split('\n')[0] }));
log.push(['hover card after moving away with a selection', stickyHover]);
await page.screenshot({ path: 'shots/s9-sticky-hover.png' });
return log;
