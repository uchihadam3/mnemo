/* MNEMO — glifos SVG originais das cartas */
'use strict';
(function () {
  const S = 'fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"';
  const F = 'fill="currentColor"';

  function spiral() {
    let d = '';
    const turns = 3.1, steps = 90;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * turns * Math.PI * 2;
      const r = 3 + t * 36;
      const x = 50 + Math.cos(a) * r, y = 50 + Math.sin(a) * r;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return `<path d="${d}" ${S}/>`;
  }

  const G = {
    olho: `<path d="M8 50 Q50 8 92 50 Q50 92 8 50Z" ${S}/><circle cx="50" cy="50" r="15" ${S}/><circle cx="50" cy="50" r="6" ${F}/><path d="M50 14 V6 M28 22 L23 15 M72 22 L77 15" ${S} stroke-width="4"/>`,
    chave: `<circle cx="28" cy="50" r="15" ${S}/><circle cx="28" cy="50" r="5" ${F}/><path d="M43 50 H90 M78 50 V66 M88 50 V62 M66 50 V60" ${S}/>`,
    espiral: spiral(),
    coracao: `<path d="M50 84 C18 62 8 44 20 28 C30 15 45 19 50 33 C55 19 70 15 80 28 C92 44 82 62 50 84Z" ${S}/><path d="M34 36 C30 40 30 46 33 50" ${S} stroke-width="4" opacity=".7"/>`,
    raio: `<path d="M60 8 L26 56 H48 L38 92 L76 40 H54 L60 8Z" ${S}/>`,
    ampulheta: `<path d="M26 12 H74 M26 88 H74" ${S}/><path d="M32 12 C32 38 50 42 50 50 C50 58 32 62 32 88 M68 12 C68 38 50 42 50 50 C50 58 68 62 68 88" ${S}/><path d="M40 80 L50 66 L60 80Z M42 26 H58 L50 36Z" ${F}/>`,
    gema: `<path d="M30 18 H70 L88 40 L50 88 L12 40Z" ${S}/><path d="M12 40 H88 M30 18 L40 40 L50 88 L60 40 L70 18 M40 40 L50 18 L60 40" ${S} stroke-width="4"/>`,
    caveira: `<path d="M50 12 C27 12 16 28 16 46 C16 58 24 64 30 67 V82 H70 V67 C76 64 84 58 84 46 C84 28 73 12 50 12Z" ${S}/><circle cx="36" cy="46" r="8" ${F}/><circle cx="64" cy="46" r="8" ${F}/><path d="M50 56 L44 65 H56Z" ${F}/><path d="M42 74 V82 M50 74 V82 M58 74 V82" ${S} stroke-width="4"/>`,
    coroa: `<path d="M14 74 L20 30 L37 50 L50 20 L63 50 L80 30 L86 74Z" ${S}/><path d="M16 86 H84" ${S}/><circle cx="20" cy="26" r="5" ${F}/><circle cx="50" cy="15" r="5" ${F}/><circle cx="80" cy="26" r="5" ${F}/><circle cx="50" cy="60" r="5" ${F}/>`,
  };

  const SUITS = {
    chama: `<path d="M50 6 C62 28 82 40 78 64 C75 82 62 94 50 94 C38 94 22 82 22 64 C22 48 33 40 38 26 C45 40 49 44 52 52 C58 40 58 24 50 6Z" ${F}/>`,
    mare: `<path d="M50 6 C50 6 18 46 18 64 A32 32 0 0 0 82 64 C82 46 50 6 50 6Z" ${F}/><path d="M34 64 A16 16 0 0 0 48 80" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="6" stroke-linecap="round"/>`,
    folha: `<path d="M86 12 C42 12 14 38 16 82 C16 85 18 87 21 87 C64 87 88 58 86 12Z" ${F}/><path d="M22 82 L66 34" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="6" stroke-linecap="round"/>`,
    astro: `<path d="M50 4 L61 39 L96 50 L61 61 L50 96 L39 61 L4 50 L39 39Z" ${F}/>`,
  };

  M.glyph = (rank) => `<svg viewBox="0 0 100 100" class="glyph">${G[M.RANKS[rank - 1].g]}</svg>`;
  M.suitIcon = (suit, cls = 'suit-ico') => `<svg viewBox="0 0 100 100" class="${cls}">${SUITS[suit]}</svg>`;
  M.GLYPH_SRC = G; M.SUIT_SRC = SUITS;
})();
