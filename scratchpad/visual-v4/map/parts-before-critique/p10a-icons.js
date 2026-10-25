// ------------------------------------------------------------------ icons (monoline 24x24)
const ICON = {
  pop: '<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M12 20c0-3.3 1.8-6 4-6s6 2.7 6 6"/>',
  gold: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9.5h4.5a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4H15"/>',
  anvil: '<path d="M3 8h14l4-2v4a4 4 0 0 1-4 4h-2l1 4H8l1-4H7A4 4 0 0 1 3 10z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>',
  candle: '<path d="M10 10h4v11h-4zM12 3c1.5 2 2 3 0 5-2-2-1.5-3 0-5z"/>',
  well: '<path d="M4 12h16v8H4zM6 12V9a6 3 0 0 1 12 0v3M12 4v3M9 2l3 2 3-2"/>',
  ledger: '<path d="M4 4h16v16H4zM4 9h16M4 14h16M10 4v16"/>',
  codex: '<path d="M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h4"/>',
  supply: '<path d="M12 21V9M12 9c0-3 2-5 5-5 0 3-2 5-5 5zm0 4c0-3-2-5-5-5 0 3 2 5 5 5zm0 4c0-2.5 2-4.5 4.5-4.5"/>',
  fist: '<path d="M7 11V7a1.5 1.5 0 0 1 3 0v3M10 10V6a1.5 1.5 0 0 1 3 0v4M13 10V7a1.5 1.5 0 0 1 3 0v4M16 11V9a1.5 1.5 0 0 1 3 0v4c0 4-3 7-7 7s-6-3-6-6v-2a1.5 1.5 0 0 1 3 0"/>',
  growth: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  fort: '<path d="M4 20V9l2-2 2 2V5h8v4l2-2 2 2v11zM10 20v-4a2 2 0 0 1 4 0v4"/>',
  temple: '<path d="M3 9l9-5 9 5M5 9v10M19 9v10M9 9v10M15 9v10M3 20h18"/>',
  lab: '<path d="M9 3h6M10 3v6l-6 10a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7 15h10"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  pd: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4"/>',
  tax: '<path d="M6 4h12v16l-3-2-3 2-3-2-3 2zM9 9h6M9 13h6"/>',
  dominion: '<path d="M10 10h4v11h-4zM12 3c1.5 2 2 3 0 5-2-2-1.5-3 0-5z"/>',
  ownership: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  sword: '<path d="M14 4h6v6L9 21l-3-3zM6 15l3 3M4 20l2-2"/>',
  hold: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  springs: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
};
function svgIcon(name, size = 18, stroke = 'currentColor') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] ?? ''}</svg>`;
}
document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = svgIcon(el.dataset.icon, 18); el.style.display = 'inline-flex'; el.style.color = 'var(--dim)'; });

// Mana symbols: shape + letter + hue, never hue alone.
const MANA = {
  W: { name: 'Radiance', fill: '#F3E6B8', ink: '#5A4A1C', shape: '<circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>' },
  U: { name: 'Tide', fill: '#3A7BD5', ink: '#fff', shape: '<path d="M3 14c3-4 6-4 9 0s6 4 9 0M3 18c3-3 6-3 9 0s6 3 9 0M8 9c2-3 6-3 8 0"/>' },
  B: { name: 'Umbra', fill: '#3D2B4F', ink: '#E6D6F5', shape: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/><circle cx="10" cy="14" r="1"/><circle cx="14" cy="14" r="1"/>' },
  R: { name: 'Ember', fill: '#FD6533', ink: '#2A0A04', shape: '<path d="M12 21c-4 0-6-3-6-6 0-4 3-6 4-10 1 3 3 4 3 6 1-1 2-2 2-4 2 2 3 5 3 8 0 3-2 6-6 6z"/>' },
  G: { name: 'Loam', fill: '#00674B', ink: '#DFF5E8', shape: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8"/>' },
};
function manaSym(c, size = 18) {
  const m = MANA[c];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="${m.name} (${c})"><circle cx="12" cy="12" r="11" fill="${m.fill}" stroke="rgba(0,0,0,.45)"/><g fill="none" stroke="${m.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(4.8 4.8) scale(.6)">${m.shape}</g></svg>`;
}
document.getElementById('bannerSvg').innerHTML = `<svg width="22" height="28" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="#FD6533" stroke="#7A1E12"/><g transform="translate(4 4) scale(.58)" fill="none" stroke="#2A0A04" stroke-width="2" stroke-linejoin="round">${MANA.R.shape}</g></svg>`;

