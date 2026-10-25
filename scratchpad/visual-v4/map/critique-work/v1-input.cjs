// after the fixes, fix 1: input through the army pieces (hit boxes, wheel, drag, right-click on an enemy, a fanned stack, touch long-press), re-measured after every step
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = process.argv[2] || __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [], out = {};
  const page = await open(b, FILE, 1440, 900, '', errors);
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const reset = async () => { await page.mouse.move(5, 880); await mock("view.reduced = true; state.sel = null; moveLine = null; hoverProv = -1; fitToCloth()"); await page.waitForTimeout(400); await mock('view.reduced = false; RCK = null; draw()'); await page.waitForTimeout(300); };
  const arm = () => mock('(() => { const L = RL_PIECE_CACHE.get("L"); const r = canvas.getBoundingClientRect(), k = cam.s / L.s; return L.armies.map((a) => ({ key: a.key, kind: a.kind, ids: a.ids, x: r.left + a.x * k + cam.x, y: r.top + a.y * k + cam.y, figH: a.figH, B: a.B, rx: a.rx, ry: a.ry, prov: names[a.prov] })); })()');
  const at = (A, id) => { const a = A.find((q) => q.ids.includes(id)); return [a.x, a.y - a.figH * 0.5, a]; };
  // hit boxes against base plus figure
  let A = await arm();
  out.hitBoxes = await page.evaluate(() => [...document.querySelectorAll('.mini:not(.fanned) > .hit')].map((h) => { const r = h.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  out.pieceSilhouettes = A.map((a) => [a.key, Math.round(2 * a.rx + 4), Math.round(a.figH + (a.kind === 'army' ? 0.25 * a.B : 0) + a.ry + 0.24 * a.B + 4)]);
  // wheel over Ilsa's piece
  let [x, y] = at(A, 'ilsa'); out.elementOverIlsa = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e.tagName + '.' + e.className; }, [x, y]);
  const s0 = await mock('cam.s'); await page.mouse.move(x, y); await page.mouse.wheel(0, -300); await page.waitForTimeout(500); out.wheel = [+s0.toFixed(4), +(await mock('cam.s')).toFixed(4)];
  await reset();
  // a drag that starts on a piece, and one that passes over pieces
  A = await arm(); [x, y] = at(A, 'ilsa'); let cx0 = await mock('cam.x');
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 120, y, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(300); out.dragFromPiece = [+cx0.toFixed(1), +(await mock('cam.x')).toFixed(1)];
  await reset(); A = await arm(); const [vx, vy] = at(A, 'varo'); cx0 = await mock('cam.x');
  await page.mouse.move(vx + 90, vy); await page.mouse.down(); await page.mouse.move(vx - 90, vy, { steps: 18 }); await page.mouse.up(); await page.waitForTimeout(300); out.dragAcrossPiece = [+cx0.toFixed(1), +(await mock('cam.x')).toFixed(1), 'expect -180'];
  out.selAfterDrag = await mock('state.sel ? state.sel.id : null');
  await reset();
  // select Varo by his piece, then right-click Ilsa's piece (the enemy in Tormere): the order is the attack
  A = await arm(); [x, y] = at(A, 'varo'); await page.mouse.click(x, y); await page.waitForTimeout(300); out.selected = await mock('state.sel ? state.sel.type + ":" + state.sel.id : null');
  await page.evaluate(() => { window.__ctx = null; window.addEventListener('contextmenu', (e) => { window.__ctx = { prevented: e.defaultPrevented, target: e.target.className }; }); });
  A = await arm(); [x, y] = at(A, 'ilsa'); await page.mouse.click(x, y, { button: 'right' }); await page.waitForTimeout(600);
  out.rightClickEnemy = { ctx: await page.evaluate(() => window.__ctx), path: await mock('moveLine ? moveLine.path.map((i) => names[i]).join(">") : null') };
  await page.mouse.move(5, 880); await page.waitForTimeout(200); await page.screenshot({ path: `${OUT}/v1-attack-ilsa.png` });
  // the fanned Kharnath stack: hover it, then right-click Briardale (the critique's lost order)
  await mock('moveLine = null; draw()'); A = await arm(); const st = A.find((a) => a.kind === 'stack');
  await page.mouse.move(st.x, st.y - st.figH * 0.5, { steps: 4 }); await page.waitForTimeout(400); out.fanned = await mock('[...RL_PIECE_DOM.values()].some((e) => e.fanned)');
  const [bx, by] = await page.evaluate((n) => window.__mock.at(n), 'Briardale'); await page.mouse.click(bx + 5, by + 20, { button: 'right' }); await page.waitForTimeout(600);
  out.rightClickBriardale = { ctx: await page.evaluate(() => window.__ctx), path: await mock('moveLine ? moveLine.path.map((i) => names[i]).join(">") : null'), under: await page.evaluate(([x, y]) => document.elementFromPoint(x, y).className, [bx + 5, by + 20]) };
  await page.screenshot({ path: `${OUT}/v1-briardale.png` });
  // the fan closes once the pointer has left the stack and its pieces; it stays open while the pointer crosses from the stack to a fanned piece
  await page.mouse.move(st.x, st.y - st.figH * 0.5, { steps: 3 }); await page.waitForTimeout(300);
  const sub = await page.evaluate(() => { const h = document.querySelector('.mini.fanned > .hit'); if (!h) return null; const r = h.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  if (sub) { await page.mouse.move(sub[0], sub[1], { steps: 6 }); await page.waitForTimeout(400); out.fanOpenOverSub = await mock('[...RL_PIECE_DOM.values()].some((e) => e.fanned)'); out.subTip = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e.dataset.tip || e.className; }, sub); }
  await page.mouse.move(5, 880, { steps: 3 }); await page.waitForTimeout(500); out.fanClosedAfterLeave = !(await mock('[...RL_PIECE_DOM.values()].some((e) => e.fanned)'));
  // a no-path order on a piece: right-click with no army selected shows the hint toast
  await mock('state.sel = null; moveLine = null; draw()'); A = await arm(); [x, y] = at(A, 'ilsa'); await page.mouse.click(x, y, { button: 'right' }); await page.waitForTimeout(300); out.noSelToast = await page.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent)[0] ?? null);
  // touch: a long-press that starts on Ilsa's piece marches the selected Varo to Tormere (pointer events forwarded to the map)
  await reset(); A = await arm(); [x, y] = at(A, 'varo'); await page.mouse.click(x, y); await page.waitForTimeout(200); await mock('moveLine = null; draw()');
  A = await arm(); [x, y] = at(A, 'ilsa');
  await page.evaluate(([x, y]) => { const h = document.elementFromPoint(x, y); h.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, isPrimary: true })); }, [x, y]);
  await page.waitForTimeout(800); out.longPress = await mock('moveLine ? moveLine.path.map((i) => names[i]).join(">") : null');
  await page.evaluate(([x, y]) => { const h = document.elementFromPoint(x, y); h.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: x, clientY: y })); }, [x, y]);
  // touch pan that starts on a piece
  await reset(); A = await arm(); [x, y] = at(A, 'ilsa'); cx0 = await mock('cam.x');
  await page.evaluate(([x, y]) => { const h = document.elementFromPoint(x, y); const ev = (t, X) => h.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, pointerType: 'touch', clientX: X, clientY: y, isPrimary: true })); ev('pointerdown', x); for (let k = 1; k <= 6; k++) ev('pointermove', x - k * 15); ev('pointerup', x - 90); }, [x, y]);
  await page.waitForTimeout(300); out.touchPanFromPiece = [+cx0.toFixed(1), +(await mock('cam.x')).toFixed(1), 'expect -90'];
  console.log(JSON.stringify(out, null, 1)); console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
