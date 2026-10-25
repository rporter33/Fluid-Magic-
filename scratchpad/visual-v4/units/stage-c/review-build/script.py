# Stage C review page: the page script (picks, notes, the verdict line, Copy verdict, the gallery). Adapted from the
# stage B page's script with its accessibility pass: storage in try/catch, pictures not Tab stops, one "View full size"
# button per group, a focus-trapping lightbox that returns focus, Escape closes, the answers recap one Tab stop.
# New here: the questions' suggested answers are pre-selected (data-def) until the owner changes or clears them.
SCRIPT = r'''<script>
(() => {
  const KEY = 'fm-stage-c-review-v1';
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: picks live for this visit only */ } };
  const saved = load() || {};
  const state = { picks: Object.assign({}, saved.picks || {}), notes: Object.assign({}, saved.notes || {}), general: typeof saved.general === 'string' ? saved.general : '' };
  const ROWS = [...document.querySelectorAll('.vrow[data-key]')].map((r) => ({ el: r, key: r.dataset.key, short: r.dataset.short, def: r.dataset.def || '' }));
  // a suggested answer stands until the owner picks another or clears it ('' is kept, so a cleared default stays cleared)
  for (const r of ROWS) if (r.def && !Object.prototype.hasOwnProperty.call(state.picks, r.key)) state.picks[r.key] = r.def;
  const sumEl = document.getElementById('summary'), countEl = document.getElementById('count'), ansEl = document.getElementById('answers');
  let ansAt = 0, rove = () => {};
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const valid = (r) => { const v = state.picks[r.key]; return v && [...r.el.querySelectorAll('.vbtn')].some((b) => b.dataset.v === v) ? v : ''; };
  const item = (r) => { const v = valid(r), n = clean(state.notes[r.key]); return v || n ? `${r.short} ${v || 'note'}${n ? ' (' + n + ')' : ''}` : ''; };
  const F = ROWS.filter((r) => r.key.startsWith('f:')), G = ROWS.filter((r) => r.key.startsWith('g:')), Q = ROWS.filter((r) => r.key.startsWith('q:'));
  function part(label, rows) {
    const a = rows.map(item).filter(Boolean), done = rows.filter((r) => valid(r)).length;
    return `${label}: ${a.length ? a.join('; ') + (done < rows.length ? '; the rest not yet picked' : '') : 'none picked yet'}`;
  }
  function line() {
    const qa = Q.map((r) => { const v = valid(r), n = clean(state.notes[r.key]); return `${r.short} ${v || 'no answer'}${n ? ' (' + n + ')' : ''}`; });
    const g = clean(state.general);
    return `Stage C verdict. ${part('Creatures and mounts', F)}. ${part('Gods', G)}. Questions: ${qa.join('; ')}.${g ? ' Notes: ' + g : ''}`;
  }
  function render() {
    for (const r of ROWS) for (const b of r.el.querySelectorAll('.vbtn')) b.setAttribute('aria-pressed', String(valid(r) === b.dataset.v));
    const nf = F.filter((r) => valid(r)).length, ng = G.filter((r) => valid(r)).length, nq = Q.filter((r) => valid(r)).length;
    countEl.textContent = `${nf} of ${F.length} creatures and mounts and ${ng} of ${G.length} gods picked; ${nq} of ${Q.length} questions answered (our suggestions count until you change them).`;
    ansEl.innerHTML = '';
    for (const r of ROWS.filter((x) => valid(x) || clean(state.notes[x.key]) || x.key.startsWith('q:'))) {
      const d = document.createElement('div'), a = document.createElement('a'), s = document.createElement('span');
      const id = r.key.slice(2);
      a.href = '#' + (r.key.startsWith('f:') ? 'f-' + id : r.key.startsWith('g:') ? 'g-' + id : r.el.closest('.q').id);
      a.textContent = r.short;
      const v = valid(r); s.textContent = v || (clean(state.notes[r.key]) ? 'note' : 'no answer');
      s.className = !v ? 'u' : v === 'Redo' ? 'c' : v === 'Keep' ? 'k' : 'o';
      d.append(a, s); ansEl.appendChild(d);
    }
    rove(ansAt, false);
    sumEl.textContent = line();
  }
  for (const r of ROWS) {
    for (const b of r.el.querySelectorAll('.vbtn')) b.addEventListener('click', () => { state.picks[r.key] = valid(r) === b.dataset.v ? '' : b.dataset.v; save(); render(); });
    const inp = r.el.querySelector('input'); inp.value = state.notes[r.key] || '';
    inp.addEventListener('input', () => { state.notes[r.key] = inp.value; save(); sumEl.textContent = line(); });
  }
  const gen = document.getElementById('general'); gen.value = state.general;
  gen.addEventListener('input', () => { state.general = gen.value; save(); sumEl.textContent = line(); });
  document.getElementById('copy').addEventListener('click', async (e) => {
    const btn = e.currentTarget, text = line();
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { /* fall back below */ }
    if (!ok) {
      try {
        const range = document.createRange(); range.selectNodeContents(sumEl);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        ok = document.execCommand('copy');
      } catch { ok = false; }
    }
    btn.textContent = ok ? 'Copied: paste it in the chat' : 'Selected: copy it by hand';
    setTimeout(() => { btn.textContent = 'Copy verdict'; }, 2400);
  });
  // the answers recap is one Tab stop; the arrow keys, Home and End move between its links
  const ansLinks = () => [...ansEl.querySelectorAll('a')];
  rove = (i, focus) => {
    const L = ansLinks(); if (!L.length) return;
    ansAt = (i + L.length) % L.length;
    L.forEach((a, k) => { a.tabIndex = k === ansAt ? 0 : -1; });
    if (focus) L[ansAt].focus();
  };
  ansEl.addEventListener('keydown', (e) => {
    const L = ansLinks(), i = L.indexOf(document.activeElement);
    if (i < 0) return;
    const k = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: L.length - 1 }[e.key];
    if (k === undefined) return;
    e.preventDefault(); rove(k, true);
  });
  ansEl.addEventListener('focusin', (e) => { const i = ansLinks().indexOf(e.target); if (i >= 0) rove(i, false); });
  render();

  // tap a picture to see it full size. Pictures are not Tab stops; each group of pictures has one "View full size"
  // button (.zb, shown when focused) that opens the group as a gallery stepped with the arrow keys. While open, the page
  // behind is inert and Tab cycles the dialog's buttons; Escape closes and focus goes back to what opened it.
  const wrap = document.querySelector('.wrap'), lb = document.getElementById('lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lbcap');
  const bClose = lb.querySelector('.lbx'), bPrev = lb.querySelector('.lbp'), bNext = lb.querySelector('.lbn');
  let opener = null, group = [], at = 0;
  const isOpen = () => lb.classList.contains('show');
  const groupOf = (el) => { const g = el.closest('[data-zg]'); return g ? [...g.querySelectorAll('img.z')] : [el]; };
  function show(i) {
    at = (i + group.length) % group.length;
    const im = group[at];
    lbImg.src = im.src; lbImg.alt = im.alt;
    lb.classList.toggle('dark', im.classList.contains('por'));
    lbCap.textContent = group.length > 1 ? `${im.alt} · ${at + 1} of ${group.length}` : im.alt;
  }
  function open(list, i, from) {
    if (!list.length) return;
    opener = from; group = list; show(i);
    bPrev.hidden = bNext.hidden = list.length < 2;
    lb.classList.add('show'); wrap.inert = true; bClose.focus();
  }
  function close() {
    if (!isOpen()) return;
    lb.classList.remove('show'); wrap.inert = false; lbImg.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
    opener = null;
  }
  for (const im of document.querySelectorAll('img.z')) {
    im.tabIndex = -1; // focus can return here after a tap or click, but Tab skips it
    im.addEventListener('click', () => { const g = groupOf(im); open(g, g.indexOf(im), im); });
  }
  for (const b of document.querySelectorAll('.zb')) b.addEventListener('click', () => open(groupOf(b), 0, b));
  lb.addEventListener('click', close);
  bPrev.addEventListener('click', (e) => { e.stopPropagation(); show(at - 1); });
  bNext.addEventListener('click', (e) => { e.stopPropagation(); show(at + 1); });
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (step && group.length > 1) { e.preventDefault(); show(at + step); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); show(e.key === 'Home' ? 0 : group.length - 1); }
    else if (e.key === 'Tab') { // hold focus in the dialog, also where inert is not supported
      const f = [bClose, bPrev, bNext].filter((b) => !b.hidden), i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[i < 0 ? 0 : (i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
  });
  document.addEventListener('focusin', (e) => { if (isOpen() && !lb.contains(e.target)) bClose.focus(); });
})();
</script>'''
