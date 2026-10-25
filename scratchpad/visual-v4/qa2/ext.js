const page = await open(1920, 1080);
return await page.evaluate(() => {
  const R = window.__battle.game.app.renderer; const out = {};
  const B = DATA[1];
  let a = performance.now();
  const fr = bakeFigures(R, [{ key: 'x1', unit: 'warden', pal: basePalette(B, 'attacker') }]).get('x1');
  out.bake = performance.now() - a;
  a = performance.now(); R.extract.pixels(fr.ne[FR.idle]); out.extract1 = performance.now() - a;
  a = performance.now(); R.extract.pixels(fr.ne[FR.idle]); out.extract2 = performance.now() - a;
  // direct: render the frame sprite into a small render texture and read it with gl.readPixels
  a = performance.now();
  const rt = PIXI.RenderTexture.create({ width: 88, height: 88, resolution: 1 });
  const sp = new PIXI.Sprite(fr.ne[FR.idle]);
  R.render({ container: sp, target: rt, clear: true });
  const gl = R.gl; const px = new Uint8Array(88 * 88 * 4);
  R.renderTarget.bind(rt, false);
  gl.readPixels(0, 0, 88, 88, gl.RGBA, gl.UNSIGNED_BYTE, px);
  out.rootKeys = Object.keys(R.renderTarget).slice(0, 40);
  out.direct = performance.now() - a;
  let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i] >= 250) n++;
  out.opaque = n;
  const e = R.extract.pixels(fr.ne[FR.idle]); let m = 0; for (let i = 3; i < e.pixels.length; i += 4) if (e.pixels[i] >= 250) m++; out.opaqueExtract = m; out.extractSize = [e.width, e.height];
  return out;
});
