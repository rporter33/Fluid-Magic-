(() => {
  const lb = document.getElementById('lb'), img = document.getElementById('lb-img'), cap = document.getElementById('lb-cap');
  const stage = document.getElementById('lb-stage'), close = document.getElementById('lb-close');
  const btns = [...document.querySelectorAll('.zoom')];
  let at = -1, back = null;
  const show = i => {
    const b = btns[i]; if (!b) return; at = i;
    const im = b.querySelector('img'), fc = b.closest('figure').querySelector('figcaption');
    const sub = b.closest('.card').querySelector('h4').textContent;
    img.src = im.currentSrc || im.src; img.alt = im.alt;
    cap.textContent = sub + (fc && fc.textContent ? ' · ' + fc.textContent : '');
    const ratio = (+im.getAttribute('width') || 1) / (+im.getAttribute('height') || 1);
    stage.classList.toggle('wide', ratio > 2.6 && window.innerWidth < 1100);
  };
  const open = i => { back = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; close.focus(); };
  const shut = () => { lb.hidden = true; img.removeAttribute('src'); document.body.style.overflow = ''; if (back) back.focus(); };
  const step = d => {
    const sec = btns[at].closest('section'); let j = at + d;
    while (btns[j] && btns[j].closest('section') !== sec) j += d;
    if (btns[j]) show(j);
  };
  btns.forEach((b, i) => b.addEventListener('click', () => open(i)));
  close.addEventListener('click', shut);
  document.getElementById('lb-prev').addEventListener('click', () => step(-1));
  document.getElementById('lb-next').addEventListener('click', () => step(1));
  stage.addEventListener('click', e => { if (e.target === stage) shut(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') shut();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') {
      const f = [...lb.querySelectorAll('button')]; const k = f.indexOf(document.activeElement);
      e.preventDefault(); f[(k + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
  });
})();
