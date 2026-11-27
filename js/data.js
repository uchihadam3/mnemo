/* MNEMO — conteúdo do jogo: cartas, relíquias, pergaminhos, astros, chefes, baralhos, conquistas */
'use strict';
(function () {

  M.SUITS = {
    chama: { n: 'Chama', cor: 'vermelhos', c: '#ff5a3c', c2: '#ffb03c', dark: '#3a0d08' },
    mare: { n: 'Maré', cor: 'azuis', c: '#3cb4ff', c2: '#7af0ff', dark: '#071d36' },
    folha: { n: 'Folha', cor: 'verdes', c: '#43e27a', c2: '#c4ff6a', dark: '#07301a' },
    astro: { n: 'Estrela', cor: 'roxos', c: '#b46bff', c2: '#ff8af0', dark: '#220a3d' },
  };
  M.SUIT_KEYS = Object.keys(M.SUITS);

  M.RANKS = [
    { g: 'olho', n: 'Olho', chips: 2 },
    { g: 'chave', n: 'Chave', chips: 3 },
    { g: 'espiral', n: 'Espiral', chips: 4 },
    { g: 'coracao', n: 'Coração', chips: 5 },
    { g: 'raio', n: 'Raio', chips: 6 },
    { g: 'ampulheta', n: 'Ampulheta', chips: 8, fig: 1 },
    { g: 'gema', n: 'Gema', chips: 10, fig: 1 },
    { g: 'caveira', n: 'Caveira', chips: 12, fig: 1 },
    { g: 'coroa', n: 'Coroa', chips: 15, fig: 1 },
  ];

  M.ENH = {
    bonus: { n: 'Bônus', d: '+30 Fichas' },
    mult: { n: 'Fúria', d: '+5 Mult' },
    gold: { n: 'Dourada', d: '+$2 ao formar par' },
    glass: { n: 'Vidro', d: 'x2 Mult · 1 em 4 de quebrar' },
    lucky: { n: 'Sortuda', d: '1 em 5: +20 Mult · 1 em 15: +$20' },
    stone: { n: 'Pedra', d: '+60 Fichas · sem símbolo: qualquer Pedra faz par com outra Pedra' },
    steel: { n: 'Aço', d: 'x1,5 Mult' },
  };
  M.EDITIONS = {
    foil: { n: 'Laminada', d: '+50 Fichas' },
    holo: { n: 'Holográfica', d: '+10 Mult' },
    poly: { n: 'Policromo', d: 'x1,5 Mult' },
    neg: { n: 'Negativa', d: '+1 espaço de Relíquia' },
  };

  M.RARITY = [null,
    { n: 'Comum', c: '#4aa3ff' },
    { n: 'Incomum', c: '#3ddc84' },
    { n: 'Rara', c: '#ff4d6d' },
    { n: 'Lendária', c: '#c77dff' },
  ];

  const suitRelic = (id, n, i, suit) => ({
    id, n, i, r: 1, c: 5, d: `Pares <b class="s-${suit}">${M.SUITS[suit].cor}</b> (naipe ${M.SUITS[suit].n}) dão <b class="mult">+4 Mult</b>`,
    match(x) { if (x.pair.suit === suit && x.pair.enh !== 'stone') x.addMult(4); },
  });

  /* ======================= RELÍQUIAS ======================= */
  M.RELICS = [
    // ---- Comuns
    { id: 'elefante', n: 'Memória de Elefante', i: '🐘', r: 1, c: 4, d: '<b class="hl">+1s</b> de pré-visualização em cada tabuleiro', mod: { preview: 1 } },
    { id: 'coruja', n: 'Coruja Noturna', i: '🦉', r: 1, c: 4, d: '<b class="visl">+1 Vislumbre</b> por salão', mod: { visl: 1 } },
    { id: 'trevo', n: 'Trevo de Quatro Folhas', i: '🍀', r: 1, c: 5, d: '<b class="tent">+1 Vida</b> por salão', mod: { tent: 1 } },
    suitRelic('brasa', 'Brasa Viva', '🔥', 'chama'),
    suitRelic('concha', 'Concha do Mar', '🐚', 'mare'),
    suitRelic('raiz', 'Raiz Antiga', '🌿', 'folha'),
    suitRelic('poeira', 'Poeira Estelar', '✨', 'astro'),
    { id: 'abaco', n: 'Ábaco', i: '🧮', r: 1, c: 5, d: '<b class="chips">+6 Fichas</b> por par já formado neste salão',
      match(x) { if (x.rs.pairsRound > 0) x.addChips(6 * x.rs.pairsRound); } },
    { id: 'no', n: 'Nó no Dedo', i: '🎗️', r: 1, c: 5, d: 'Pares de <b class="hl">Lembrança</b> dão <b class="mult">+4 Mult</b>',
      match(x) { if (x.kind === 'memory') x.addMult(4); } },
    { id: 'gato', n: 'Gato da Sorte', i: '🐈', r: 1, c: 5, d: 'Pares de <b class="hl">Sorte</b> dão <b class="chips">+50 Fichas</b>',
      match(x) { if (x.kind !== 'memory') x.addChips(50); } },
    { id: 'tartaruga', n: 'Tartaruga Sábia', i: '🐢', r: 1, c: 5, d: '<b class="mult">+1 Mult</b> por Vida restante',
      match(x) { if (x.rs.tent > 0) x.addMult(x.rs.tent); } },
    { id: 'relampago', n: 'Relâmpago', i: '⚡', r: 1, c: 5, d: 'Pares feitos em até <b class="hl">4s</b> após o anterior dão <b class="mult">+6 Mult</b>',
      match(x) { if (x.rs.lastMatchT && (x.now - x.rs.lastMatchT) < 4000) x.addMult(6); } },
    { id: 'cofrinho', n: 'Cofrinho', i: '🐷', r: 1, c: 4, d: '<b class="money">+$2</b> ao fim de cada salão',
      roundEnd(x) { return 2; } },
    { id: 'mascara', n: 'Máscara de Teatro', i: '🎭', r: 1, c: 5, d: '<b class="hl">Figuras</b> (Ampulheta, Gema, Caveira, Coroa) dão <b class="chips">+40 Fichas</b>',
      match(x) { if (x.pair.enh !== 'stone' && M.RANKS[x.pair.rank - 1].fig) x.addChips(40); } },
    { id: 'primeira', n: 'Primeira Luz', i: '💡', r: 1, c: 6, d: 'O primeiro par de cada tabuleiro dá <b class="xmult">x2 Mult</b>',
      match(x) { if (x.rs.pairsBoard === 0) x.xMult(2); } },
    { id: 'mapa', n: 'Mapa do Cartógrafo', i: '🗺️', r: 1, c: 5, d: 'Pares com uma carta na <b class="hl">borda</b> do tabuleiro dão <b class="mult">+4 Mult</b>',
      match(x) { if (x.cards.some(c => c.x === 0 || c.y === 0 || c.x === x.rs.cols - 1 || c.y === x.rs.rows - 1)) x.addMult(4); } },
    { id: 'ladra', n: 'Mão Leve', i: '🧤', r: 1, c: 5, d: '<b class="money">+$1</b> a cada 3 pares formados',
      desc: (r) => `<b class="money">+$1</b> a cada 3 pares formados <i>(${(r.data.n || 0) % 3}/3)</i>`,
      match(x, r) { r.data.n = (r.data.n || 0) + 1; if (r.data.n % 3 === 0) x.money(1); } },
    { id: 'pipoca', n: 'Pipoca', i: '🍿', r: 1, c: 4, d: '<b class="mult">+15 Mult</b>, perde 1 a cada salão',
      desc: (r) => `<b class="mult">+${r.data.v ?? 15} Mult</b>, perde 1 a cada salão`,
      match(x, r) { x.addMult(r.data.v ?? 15); },
      roundEnd(x, r) { r.data.v = (r.data.v ?? 15) - 1; if (r.data.v <= 0) { r.data.dead = 1; x.msg('Acabou!'); } return 0; } },

    // ---- Incomuns
    { id: 'corrente', n: 'Corrente Elétrica', i: '🔗', r: 2, c: 7, lock: 1, d: 'Cada nível de <b class="hl">Combo</b> dá <b class="mult">+2 Mult</b> em vez de +1', flag: 'combo2' },
    { id: 'egide', n: 'Égide', i: '🛡️', r: 2, c: 7, d: 'O primeiro erro de cada salão não custa Vida nem quebra o Combo',
      mismatch(x, r) { if (!x.rs.flags.egide) { x.rs.flags.egide = 1; x.protect('Égide!'); } } },
    { id: 'areia', n: 'Areia Viva', i: '⏳', r: 2, c: 6, d: 'Limpar o tabuleiro dá <b class="tent">+2 Vidas</b> extras',
      boardClear(x) { x.addTent(2); } },
    { id: 'teimoso', n: 'Coração Teimoso', i: '❤️‍🩹', r: 2, c: 6, d: '<b class="hl">1 em 3</b> de chance de um erro não custar Vida',
      mismatch(x) { if (x.chance(1 / 3)) x.saveTent('Teimoso!'); } },
    { id: 'bateria', n: 'Bateria Arcana', i: '🔋', r: 2, c: 7, d: 'Ganha <b class="mult">+2 Mult</b> permanente a cada tabuleiro limpo',
      desc: (r) => `Ganha <b class="mult">+2 Mult</b> a cada tabuleiro limpo <i>(atual: +${r.data.v || 0})</i>`,
      match(x, r) { if (r.data.v) x.addMult(r.data.v); },
      boardClear(x, r) { r.data.v = (r.data.v || 0) + 2; x.msg('+2!'); } },
    { id: 'ovo', n: 'Ovo Dourado', i: '🥚', r: 2, c: 5, d: 'Ganha <b class="money">$3</b> de valor de venda ao fim de cada salão',
      desc: (r) => `Ganha <b class="money">$3</b> de valor de venda por salão <i>(vende por $${M.sellValue(r)})</i>`,
      roundEnd(x, r) { r.data.bonus = (r.data.bonus || 0) + 3; return 0; } },
    { id: 'cristal', n: 'Bola de Cristal', i: '🔮', r: 2, c: 7, d: 'Cria um <b class="hl">Pergaminho</b> aleatório no início de cada salão',
      roundStart(x) { x.giveScroll(); } },
    { id: 'ima', n: 'Ímã', i: '🧲', r: 2, c: 6, d: 'Ao formar um par, revela por instantes as <b class="hl">cartas vizinhas</b>', flag: 'ima' },
    { id: 'lupa', n: 'Lupa', i: '🔍', r: 2, c: 6, d: 'Vislumbres revelam também as <b class="hl">cartas vizinhas</b>', flag: 'lupa' },
    { id: 'espelho', n: 'Espelho Partido', i: '🪞', r: 2, c: 7, d: '<b class="hl">1 em 4</b> de chance de pontuar o par <b class="hl">duas vezes</b>', flag: 'espelho' },
    { id: 'dado', n: 'Dado Viciado', i: '🎲', r: 2, c: 6, lock: 1, d: 'Dobra todas as <b class="hl">probabilidades</b>', flag: 'dado' },
    { id: 'venda', n: 'Venda nos Olhos', i: '🙈', r: 2, c: 7, d: '<b class="hl">Sorte Cega</b> dá <b class="xmult">x4 Mult</b> em vez de x2', flag: 'venda' },
    { id: 'arcoiris', n: 'Arco-íris', i: '🌈', r: 2, c: 7, d: '<b class="xmult">x2 Mult</b> se os últimos 4 pares forem de naipes diferentes',
      match(x) { const h = x.rs.suitHist.slice(-4); if (h.length === 4 && new Set(h).size === 4) x.xMult(2); } },
    { id: 'joalheiro', n: 'Joalheiro', i: '💍', r: 2, c: 6, d: 'Cartas com <b class="hl">Edição</b> ou <b class="hl">Encantamento</b> dão <b class="money">+$1</b>',
      match(x) { if (x.pair.enh || x.pair.ed) x.money(1); } },
    { id: 'cadente', n: 'Estrela Cadente', i: '🌠', r: 2, c: 6, d: 'Limpar o tabuleiro cria um <b class="hl">Planeta</b>',
      boardClear(x) { x.giveAstro(); } },
    { id: 'polvo', n: 'Polvo Colecionador', i: '🐙', r: 2, c: 7, lock: 1, d: '<b class="mult">+3 Mult</b> por Relíquia que você possui',
      match(x) { x.addMult(3 * x.run.relics.length); } },
    { id: 'foguete', n: 'Foguete', i: '🚀', r: 2, c: 6, d: '<b class="money">+$1</b> ao fim do salão; aumenta $1 a cada Chefe derrotado',
      desc: (r) => `<b class="money">+$${1 + (r.data.v || 0)}</b> ao fim do salão; +$1 a cada Chefe derrotado`,
      roundEnd(x, r) { const v = 1 + (r.data.v || 0); if (x.isBoss) r.data.v = (r.data.v || 0) + 1; return v; } },
    { id: 'gemeos', n: 'Gêmeos', i: '♊', r: 2, c: 6, d: 'Dois pares seguidos do <b class="hl">mesmo naipe</b>: <b class="mult">+10 Mult</b>',
      match(x) { const h = x.rs.suitHist; if (h.length && h[h.length - 1] === x.pair.suit) x.addMult(10); } },
    { id: 'tinteiro', n: 'Tinteiro do Escriba', i: '🖋️', r: 2, c: 6, d: '<b class="chips">+25 Fichas</b> por Pergaminho usado nesta jornada',
      desc: (r, run) => `<b class="chips">+25 Fichas</b> por Pergaminho usado na jornada <i>(atual: +${25 * ((run && run.stats.scrolls) || 0)})</i>`,
      match(x) { if (x.run.stats.scrolls) x.addChips(25 * x.run.stats.scrolls); } },

    // ---- Raras
    { id: 'olho', n: 'Olho que Tudo Vê', i: '👁️', r: 3, c: 9, lock: 1, d: 'No início de cada tabuleiro, <b class="hl">um par</b> aleatório é marcado com brilho',
      boardStart(x) { x.markPair(); } },
    { id: 'bussola', n: 'Bússola do Destino', i: '🧭', r: 3, c: 9, lock: 1, d: '<b class="hl">1 em 3</b>: ao virar a primeira carta, seu par pisca brevemente', flag: 'bussola' },
    { id: 'memento', n: 'Memento Mori', i: '💀', r: 3, c: 8, d: '<b class="xmult">+x0,5 Mult</b> por Vida perdida neste salão',
      match(x) { if (x.rs.lost > 0) x.xMult(1 + 0.5 * x.rs.lost); } },
    { id: 'midas', n: 'Rei Midas', i: '👑', r: 3, c: 9, lock: 1, d: 'Cartas <b class="money">Douradas</b> dão <b class="xmult">x2 Mult</b>',
      match(x) { if (x.pair.enh === 'gold') x.xMult(2); } },
    { id: 'pavio', n: 'Pavio Curto', i: '💣', r: 3, c: 8, d: '<b class="xmult">x2,5 Mult</b> em todos os pares, mas <b class="tent">-2 Vidas</b>', mod: { tent: -2 },
      match(x) { x.xMult(2.5); } },
    { id: 'vampiro', n: 'Vampiro', i: '🦇', r: 3, c: 9, lock: 1, d: 'Consome encantamentos das cartas pareadas e ganha <b class="xmult">x0,25 Mult</b> por cada',
      desc: (r) => `Consome encantamentos pareados, ganha <b class="xmult">x0,25</b> cada <i>(atual: x${M.fmtX(1 + (r.data.v || 0))})</i>`,
      match(x, r) { if (x.pair.enh && x.pair.enh !== 'stone') { r.data.v = (r.data.v || 0) + 0.25; x.stripEnh(); x.msg('Slurp!'); } if (r.data.v) x.xMult(1 + r.data.v); } },
    { id: 'fenix', n: 'Pena de Fênix', i: '🪶', r: 3, c: 8, lock: 1, d: 'Ao ficar sem Vidas, renasce com <b class="tent">4 Vidas</b> e se destrói', flag: 'fenix' },
    { id: 'lira', n: 'Lira de Mnemósine', i: '🎼', r: 3, c: 10, lock: 1, d: 'Pares de <b class="hl">Lembrança</b> dão <b class="xmult">x1,5 Mult</b>',
      match(x) { if (x.kind === 'memory') x.xMult(1.5); } },
    { id: 'solnegro', n: 'Sol Negro', i: '🌑', r: 3, c: 10, lock: 1, d: '<b class="xmult">+x0,5 Mult</b> por naipe diferente pareado neste tabuleiro',
      match(x) { const n = new Set([...x.rs.boardSuits, x.pair.suit]).size; x.xMult(1 + 0.5 * n); } },
    { id: 'caldeirao', n: 'Caldeirão', i: '⚗️', r: 3, c: 8, d: 'Combo <b class="hl">5 ou mais</b>: <b class="xmult">x2 Mult</b>',
      match(x) { if (x.combo >= 5) x.xMult(2); } },
    { id: 'bigorna', n: 'Bigorna', i: '⚒️', r: 3, c: 8, d: 'Cartas de <b class="hl">Aço</b> e <b class="hl">Pedra</b> dão <b class="xmult">x2 Mult</b>',
      match(x) { if (x.pair.enh === 'steel' || x.pair.enh === 'stone') x.xMult(2); } },

    // ---- Lendárias
    { id: 'ouroboros', n: 'Ouroboros', i: '🐍', r: 4, c: 15, lock: 1, d: 'Errar não zera o <b class="hl">Combo</b>, apenas o reduz pela metade', flag: 'ouroboros' },
    { id: 'cronos', n: 'Coração de Cronos', i: '🕰️', r: 4, c: 15, lock: 1, d: 'Ganha <b class="xmult">x0,5 Mult</b> permanente a cada Combo de 5',
      desc: (r) => `Ganha <b class="xmult">x0,5</b> permanente a cada Combo de 5 <i>(atual: x${M.fmtX(1 + (r.data.v || 0))})</i>`,
      match(x, r) { if (x.combo > 0 && x.combo % 5 === 0) { r.data.v = (r.data.v || 0) + 0.5; x.msg('Tic!'); } if (r.data.v) x.xMult(1 + r.data.v); } },
    { id: 'hidra', n: 'Hidra', i: '🐉', r: 4, c: 15, lock: 1, d: 'Cada par pontua <b class="hl">uma vez a mais</b> a cada 4 de Combo', flag: 'hidra' },
    { id: 'roda', n: 'Roda da Fortuna', i: '🎡', r: 4, c: 15, lock: 1, d: 'Todo par: <b class="hl">1 em 2</b> de chance de <b class="money">+$1</b> e <b class="xmult">x2 Mult</b>',
      match(x) { if (x.chance(0.5)) { x.money(1); x.xMult(2); } } },
  ];
  M.RELIC = Object.fromEntries(M.RELICS.map(r => [r.id, r]));

  /* ======================= PERGAMINHOS ======================= */
  // when: 'round' só durante salão, 'any' sempre. next: efeito aplicado no próximo par
  M.SCROLLS = [
    { id: 'revelar', n: 'Revelação', i: '📜', when: 'round', d: 'Revela <b class="hl">4 cartas</b> aleatórias por instantes' },
    { id: 'clarividencia', n: 'Clarividência', i: '🔆', when: 'round', d: 'Marca <b class="hl">um par</b> inteiro com brilho' },
    { id: 'raiox', n: 'Raio-X', i: '🩻', when: 'round', d: 'Revela <b class="hl">todo o tabuleiro</b> por 1 segundo' },
    { id: 'elixir', n: 'Elixir', i: '🧪', when: 'round', d: '<b class="tent">+2 Vidas</b> neste salão' },
    { id: 'olhar', n: 'Terceiro Olho', i: '🧿', when: 'round', d: '<b class="visl">+2 Vislumbres</b> neste salão' },
    { id: 'foco', n: 'Foco', i: '🎯', when: 'round', next: 1, d: 'O próximo par recebe <b class="xmult">x3 Mult</b>' },
    { id: 'ambar', n: 'Âmbar', i: '🟠', when: 'round', d: 'O próximo erro não custa Vida nem quebra o Combo' },
    { id: 'midas', n: 'Toque de Midas', i: '🪙', when: 'round', next: 1, d: 'O próximo par vira <b class="money">Dourado</b> para sempre' },
    { id: 'vidro', n: 'Alquimia de Vidro', i: '🥃', when: 'round', next: 1, d: 'O próximo par vira <b class="hl">Vidro</b> para sempre' },
    { id: 'fichas', n: 'Runa de Fichas', i: '🔷', when: 'round', next: 1, d: 'O próximo par vira <b class="chips">Bônus</b> para sempre' },
    { id: 'furia', n: 'Runa da Fúria', i: '🔴', when: 'round', next: 1, d: 'O próximo par vira <b class="mult">Fúria</b> para sempre' },
    { id: 'amuleto', n: 'Amuleto', i: '🧧', when: 'round', next: 1, d: 'O próximo par vira <b class="hl">Sortudo</b> para sempre' },
    { id: 'aco', n: 'Forja', i: '🔩', when: 'round', next: 1, d: 'O próximo par vira <b class="hl">Aço</b> para sempre' },
    { id: 'pedra', n: 'Petrificar', i: '🪨', when: 'round', next: 1, d: 'O próximo par vira <b class="hl">Pedra</b> para sempre' },
    { id: 'exilio', n: 'Exílio', i: '🕳️', when: 'round', next: 1, d: '<b class="hl">Remove</b> do baralho a carta do próximo par' },
    { id: 'duplicar', n: 'Duplicação', i: '👯', when: 'round', next: 1, d: 'Adiciona ao baralho uma <b class="hl">cópia</b> do próximo par' },
    { id: 'edicao', n: 'Bênção Prismática', i: '💠', when: 'round', next: 1, d: 'O próximo par ganha uma <b class="hl">Edição</b> aleatória', rare: 1 },
    { id: 'ganancia', n: 'Ganância', i: '💰', when: 'any', d: 'Dobra seu dinheiro <i>(máx. +$20)</i>' },
    { id: 'juizo', n: 'Juízo', i: '⚖️', when: 'any', d: 'Cria uma <b class="hl">Relíquia</b> aleatória <i>(precisa de espaço)</i>', rare: 1 },
  ];
  M.SCROLL = Object.fromEntries(M.SCROLLS.map(s => [s.id, s]));

  /* ======================= ASTROS ======================= */
  M.ASTROS = [
    { id: 'marte', n: 'Marte', i: '🔴', suit: 'chama' },
    { id: 'netuno', n: 'Netuno', i: '🔵', suit: 'mare' },
    { id: 'gaia', n: 'Gaia', i: '🟢', suit: 'folha' },
    { id: 'saturno', n: 'Saturno', i: '🪐', suit: 'astro' },
    { id: 'buraco', n: 'Buraco Negro', i: '⚫', suit: 'all', rare: 1 },
  ];
  M.ASTRO = Object.fromEntries(M.ASTROS.map(a => [a.id, a]));
  M.SUIT_COLOR = { chama: 'vermelhas', mare: 'azuis', folha: 'verdes', astro: 'roxas' };
  M.astroDesc = (a) => a.suit === 'all'
    ? 'Fortalece <b class="hl">todas as cores</b> de uma vez: todo par ganha <b class="chips">+12 Fichas</b> e <b class="mult">+1 Mult</b> para sempre.'
    : `Fortalece as cartas <b class="s-${a.suit}">${M.SUIT_COLOR[a.suit]}</b> (naipe ${M.SUITS[a.suit].n}): todo par dessa cor ganha <b class="chips">+12 Fichas</b> e <b class="mult">+1 Mult</b> para sempre.`;
  M.suitBase = (lvl) => ({ chips: 10 + 12 * (lvl - 1), mult: lvl });

  /* ======================= CHEFES ======================= */
  M.BOSSES = [
    { id: 'nevoa', n: 'A Névoa', i: '🌫️', c: '#8fa3b8', d: 'Sem pré-visualização', min: 1 },
    { id: 'embaralhador', n: 'O Embaralhador', i: '🌀', c: '#ff9f1c', d: 'A cada erro, duas cartas ocultas trocam de lugar', min: 1 },
    { id: 'cinzento', n: 'O Cinzento', i: '🩶', c: '#9a9a9a', d: 'As cartas perdem as cores e os símbolos de naipe', min: 2 },
    { id: 'rachada', n: 'A Ampulheta Rachada', i: '⌛', c: '#e0b15c', d: '<b class="tent">-3 Vidas</b>', min: 1 },
    { id: 'ladrao', n: 'O Ladrão', i: '🦝', c: '#c9a227', d: 'Perde <b class="money">$1</b> a cada erro', min: 1 },
    { id: 'eclipse', n: 'O Eclipse', i: '🌘', c: '#6c4ab6', d: 'Cartas de um naipe não pontuam', min: 2, setup(rs, rng) { rs.flags.eclipse = rng.pick(M.SUIT_KEYS); } },
    { id: 'labirinto', n: 'O Labirinto', i: '🧱', c: '#7a5c3e', d: 'Tabuleiro com <b class="hl">+3 pares</b>', min: 2 },
    { id: 'mimico', n: 'O Mímico', i: '🎁', c: '#b5179e', d: '2 Mímicos sem par se escondem. Virar um custa <b class="tent">1 Vida</b>', min: 2 },
    { id: 'fantasma', n: 'O Fantasma', i: '👻', c: '#c8d6e5', d: 'Cartas erradas somem rápido e Vislumbres ficam bloqueados', min: 3 },
    { id: 'relogio', n: 'O Relógio', i: '⏰', c: '#e63946', d: '<b class="hl">8 segundos</b> por jogada, ou perde uma Vida', min: 3 },
    { id: 'muralha', n: 'A Muralha', i: '🏰', c: '#5c677d', d: 'Alvo muito maior <i>(x3)</i>', min: 3 },
    { id: 'espelho', n: 'O Espelho', i: '🪩', c: '#48cae4', d: 'O tabuleiro se espelha a cada 3 erros', min: 3 },
    { id: 'vazio', n: 'O Vazio', i: '🕳️', c: '#3a0ca3', d: 'O Combo não dá Mult', min: 4 },
  ];
  M.FINAL_BOSSES = [
    { id: 'lete', n: 'Lete, o Rio do Esquecimento', i: '🌊', c: '#00b4d8', d: 'A cada 4 erros, todas as cartas ocultas são embaralhadas', final: 1 },
    { id: 'sombra', n: 'Mnemósine Sombria', i: '🌒', c: '#9d4edd', d: 'Sem pré-visualização e sem cores', final: 1 },
    { id: 'abismo', n: 'O Devorador', i: '🦑', c: '#d00000', d: '<b class="tent">-3 Vidas</b> e o tabuleiro tem +2 pares', final: 1 },
  ];
  M.BOSS = Object.fromEntries([...M.BOSSES, ...M.FINAL_BOSSES].map(b => [b.id, b]));

  /* ======================= BÊNÇÃOS (pular salão) ======================= */
  M.TAGS = [
    { id: 'ouro', n: 'Bênção do Ouro', i: '💰', d: 'Ganhe <b class="money">$8</b> agora' },
    { id: 'rara', n: 'Bênção Rara', i: '💎', d: 'A próxima loja terá uma <b class="hl">Relíquia Rara grátis</b>' },
    { id: 'arcana', n: 'Bênção Arcana', i: '📜', d: 'Abra um <b class="hl">Pacote Arcano</b> grátis agora' },
    { id: 'celeste', n: 'Bênção dos Planetas', i: '🌌', d: 'Abra um <b class="hl">Pacote de Planetas</b> grátis agora' },
    { id: 'juros', n: 'Bênção dos Juros', i: '🏦', d: 'Dobra seu dinheiro <i>(máx. +$15)</i>' },
    { id: 'mercador', n: 'Bênção do Mercador', i: '🏷️', d: 'Tudo na próxima loja custa <b class="hl">metade</b>' },
    { id: 'persist', n: 'Bênção da Persistência', i: '🔁', d: '<b class="tent">+3 Vidas</b> no próximo salão' },
    { id: 'reliquia', n: 'Bênção da Relíquia', i: '🏺', d: 'Abra um <b class="hl">Pacote de Relíquias</b> grátis agora' },
  ];
  M.TAG = Object.fromEntries(M.TAGS.map(t => [t.id, t]));

  /* ======================= RUNAS (vouchers) ======================= */
  M.VOUCHERS = [
    { id: 'expansao', n: 'Runa da Expansão', i: 'ᚠ', d: '<b class="hl">+1 espaço</b> de Relíquia' },
    { id: 'persistencia', n: 'Runa da Persistência', i: 'ᚢ', d: '<b class="tent">+1 Vida</b> por salão' },
    { id: 'olhar', n: 'Runa do Olhar', i: 'ᚦ', d: '<b class="visl">+1 Vislumbre</b> por salão' },
    { id: 'lembranca', n: 'Runa da Lembrança', i: 'ᚨ', d: '<b class="hl">+0,75s</b> de pré-visualização' },
    { id: 'tesouro', n: 'Runa do Tesouro', i: 'ᚱ', d: 'Juros máximos <b class="money">+$5</b>' },
    { id: 'mercador', n: 'Runa do Mercador', i: 'ᚲ', d: 'Tudo na loja <b class="hl">25% mais barato</b>' },
    { id: 'escriba', n: 'Runa do Escriba', i: 'ᚷ', d: '<b class="hl">+1 espaço</b> de Pergaminho' },
    { id: 'abundancia', n: 'Runa da Abundância', i: 'ᚹ', d: '<b class="hl">+1 item</b> à venda na loja' },
    { id: 'fortuna', n: 'Runa da Fortuna', i: 'ᚺ', d: 'Rerrolar custa <b class="money">$2</b> a menos' },
    { id: 'corrente', n: 'Runa da Corrente', i: 'ᚾ', d: 'O Combo começa em <b class="hl">2</b>' },
  ];
  M.VOUCHER = Object.fromEntries(M.VOUCHERS.map(v => [v.id, v]));

  /* ======================= BARALHOS ======================= */
  const std = () => { const d = []; for (const s of M.SUIT_KEYS) for (let r = 1; r <= 5; r++) d.push({ suit: s, rank: r }); return d; };
  M.DECKS = [
    { id: 'classico', n: 'Baralho Clássico', c: '#7b5cff', d: '20 cartas, 4 naipes. O começo de toda lenda.', cards: std },
    { id: 'safira', n: 'Baralho Safira', c: '#2f80ed', d: '<b class="tent">+1 Vida</b> por salão', cards: std, tent: 1, lock: 'Derrote um Chefe' },
    { id: 'rubi', n: 'Baralho Rubi', c: '#e0245e', d: '<b class="visl">+1 Vislumbre</b> e <b class="hl">+0,5s</b> de pré-visualização', cards: std, visl: 1, preview: 0.5, lock: 'Alcance Combo 8' },
    { id: 'dourado', n: 'Baralho Dourado', c: '#f2c94c', d: 'Começa com <b class="money">$14</b> e uma Runa do Tesouro', cards: std, money: 10, vouchers: ['tesouro'], lock: 'Tenha $40 numa jornada' },
    { id: 'eco', n: 'Baralho Eco', c: '#56ccf2', d: 'Só 10 símbolos, mas <b class="hl">cada um repetido</b>. Mais pares iguais!', cards: () => { const d = []; for (const s of ['chama', 'mare']) for (let r = 1; r <= 5; r++) { d.push({ suit: s, rank: r }); d.push({ suit: s, rank: r }); } return d; }, lock: 'Limpe um tabuleiro sem errar' },
    { id: 'arcano', n: 'Baralho Arcano', c: '#bb6bd9', d: 'Começa com <b class="hl">Bola de Cristal</b> e 2 Pergaminhos', cards: std, relics: ['cristal'], scrolls: 2, lock: 'Use 10 Pergaminhos' },
    { id: 'celeste', n: 'Baralho Celeste', c: '#00c2a8', d: 'Todos os naipes começam no <b class="hl">nível 2</b>', cards: std, suitLv: 2, lock: 'Use 10 Planetas' },
    { id: 'abismo', n: 'Baralho do Abismo', c: '#1b1b3a', d: '<b class="hl">+1 espaço</b> de Relíquia, mas <b class="tent">-1 Vida</b>', cards: std, slots: 1, tent: -1, lock: 'Alcance o Reino 5' },
    { id: 'mono', n: 'Baralho Monocromo', c: '#e0e0e0', d: 'Todas as cartas do <b class="hl">mesmo naipe</b>, símbolos repetidos. Puro cérebro.', cards: (rng) => { const s = rng.pick(M.SUIT_KEYS); const d = []; for (let k = 0; k < 4; k++) for (let r = 1; r <= 5; r++) d.push({ suit: s, rank: r }); return d; }, lock: 'Vença uma jornada' },
    { id: 'caos', n: 'Baralho do Caos', c: '#ff6b35', d: 'Cartas aleatórias e encantadas, e uma Relíquia aleatória', cards: (rng) => { const d = []; for (let i = 0; i < 20; i++) d.push({ suit: rng.pick(M.SUIT_KEYS), rank: rng.int(1, 9), enh: rng.chance(0.3) ? rng.pick(['bonus', 'mult', 'gold', 'glass', 'lucky', 'steel']) : null }); return d; }, randomRelic: 1, lock: 'Jogue 10 jornadas' },
  ];
  M.DECK = Object.fromEntries(M.DECKS.map(d => [d.id, d]));

  /* ======================= DIFICULDADES ======================= */
  M.STAKES = [
    { id: 1, n: 'Selo Branco', c: '#f1f1f1', d: 'Dificuldade padrão' },
    { id: 2, n: 'Selo Vermelho', c: '#ff4d4d', d: 'O Salão Pequeno não dá recompensa' },
    { id: 3, n: 'Selo Verde', c: '#3ddc84', d: 'Os alvos crescem mais rápido' },
    { id: 4, n: 'Selo Negro', c: '#555', d: '<b class="tent">-1 Vida</b> por salão' },
    { id: 5, n: 'Selo Dourado', c: '#ffd166', d: 'Pré-visualização reduzida pela metade' },
  ];

  /* ======================= VERSOS (costas das cartas) ======================= */
  M.BACKS = [
    { id: 'mandala', n: 'Mandala Arcana' },
    { id: 'neon', n: 'Neon Noturno', lock: 'Conquista: Velocista' },
    { id: 'abismo', n: 'Abismo', lock: 'Nível 3' },
    { id: 'cristal', n: 'Cristal', lock: 'Conquista: Vidraceiro' },
    { id: 'sol', n: 'Sol Nascente', lock: 'Conquista: Rotina' },
    { id: 'floral', n: 'Jardim', lock: 'Nível 9' },
    { id: 'ouro', n: 'Ouro Imperial', lock: 'Conquista: Mestre da Memória' },
    { id: 'cosmos', n: 'Cosmos', lock: 'Conquista: Infinito' },
  ];

  /* ======================= CONQUISTAS ======================= */
  M.ACHS = [
    { id: 'par1', n: 'Primeiro Par', i: '🃏', d: 'Forme seu primeiro par' },
    { id: 'chefe1', n: 'Matador de Chefes', i: '⚔️', d: 'Derrote um Chefe', unlock: { deck: 'safira' } },
    { id: 'combo5', n: 'Em Chamas', i: '🔥', d: 'Alcance Combo 5', unlock: { relic: 'corrente' } },
    { id: 'combo8', n: 'Imparável', i: '☄️', d: 'Alcance Combo 8', unlock: { deck: 'rubi' } },
    { id: 'combo12', n: 'Mente Infinita', i: '♾️', d: 'Alcance Combo 12', unlock: { relic: 'ouroboros' } },
    { id: 'circ3', n: 'Explorador', i: '🧭', d: 'Alcance o Reino 3', unlock: { relic: 'olho' } },
    { id: 'circ5', n: 'Abismal', i: '🌀', d: 'Alcance o Reino 5', unlock: { deck: 'abismo' } },
    { id: 'vitoria', n: 'Mestre da Memória', i: '🏆', d: 'Vença o Reino 8', unlock: { deck: 'mono', back: 'ouro' } },
    { id: 'rico', n: 'Magnata', i: '💸', d: 'Tenha $40 numa jornada', unlock: { deck: 'dourado' } },
    { id: 'perfeito', n: 'Memória Perfeita', i: '🧠', d: 'Limpe um tabuleiro sem errar nenhuma vez', unlock: { deck: 'eco' } },
    { id: 'sortegrande', n: 'Sorte Grande', i: '🎰', d: '3 Sortes Cegas em um só salão', unlock: { relic: 'dado' } },
    { id: 'arcanista', n: 'Arcanista', i: '📜', d: 'Use 10 Pergaminhos (no total)', unlock: { deck: 'arcano' } },
    { id: 'astronomo', n: 'Astrônomo', i: '🔭', d: 'Use 10 Planetas (no total)', unlock: { deck: 'celeste' } },
    { id: 'colecao', n: 'Colecionador', i: '🏺', d: 'Tenha 5 Relíquias ao mesmo tempo', unlock: { relic: 'polvo' } },
    { id: 'explosao', n: 'Explosão', i: '💥', d: 'Marque 5.000 pontos com um único par', unlock: { relic: 'solnegro' } },
    { id: 'veterano', n: 'Veterano', i: '🎖️', d: 'Jogue 10 jornadas', unlock: { deck: 'caos' } },
    { id: 'intocavel', n: 'Intocável', i: '😇', d: 'Vença um salão sem errar', unlock: { relic: 'lira' } },
    { id: 'veloz', n: 'Velocista', i: '⏱️', d: 'Vença um salão em menos de 25 segundos', unlock: { back: 'neon' } },
    { id: 'vidraceiro', n: 'Vidraceiro', i: '🥃', d: 'Quebre 3 cartas de Vidro', unlock: { back: 'cristal' } },
    { id: 'diario', n: 'Rotina', i: '📅', d: 'Alcance o Reino 3 num Desafio Diário', unlock: { back: 'sol' } },
    { id: 'infinito', n: 'Infinito', i: '🌌', d: 'Alcance o Reino 10 (modo sem fim)', unlock: { back: 'cosmos' } },
    { id: 'milhao', n: 'Milionário', i: '🤑', d: 'Marque 100.000 pontos em um salão' },
    { id: 'chefe10', n: 'Caçador', i: '🗡️', d: 'Derrote 10 Chefes (no total)' },
  ];
  M.ACH = Object.fromEntries(M.ACHS.map(a => [a.id, a]));

  /* ======================= NÍVEIS DE PERFIL ======================= */
  M.LEVEL_REWARDS = {
    2: { relic: 'fenix' }, 3: { back: 'abismo' }, 4: { relic: 'midas' }, 5: { relic: 'vampiro' },
    6: { relic: 'cronos' }, 7: { relic: 'bussola' }, 8: { relic: 'roda' }, 9: { back: 'floral' }, 10: { relic: 'hidra' },
  };
  M.xpForLevel = (lvl) => 120 + 90 * (lvl - 1); // xp necessário para passar do nível lvl

  /* ======================= ALVOS ======================= */
  M.ANTE_BASE = [100, 350, 1000, 2600, 6000, 12000, 22000, 40000];
  M.targetFor = (ante, round, stake, bossId) => {
    let base;
    if (ante <= 8) base = M.ANTE_BASE[ante - 1];
    else base = M.ANTE_BASE[7] * Math.pow(2.3, ante - 8);
    if (stake >= 3) base *= 1 + 0.1 * (ante - 1);
    let mul = [1, 1.5, 2][round];
    if (round === 2 && bossId === 'muralha') mul = 3;
    return Math.round(base * mul / 10) * 10;
  };
  M.pairsFor = (ante) => [6, 7, 8, 8, 9, 10, 10, 11][Math.min(ante, 8) - 1] + (ante > 8 ? 1 : 0);

  M.QUOTES = [
    'Lembre-se: a memória é o único tesouro que não pesa.',
    'Ah, um cliente! Minhas relíquias não mordem... quase todas.',
    'Vi você errar aquele par. Tudo bem, eu também esqueço onde guardo as coisas.',
    'Compre algo brilhante. Coisas brilhantes ajudam a lembrar.',
    'Dizem que a Lira de Mnemósine canta pares escondidos.',
    'Juros, meu caro. O dinheiro também tem memória.',
    'Combos longos atraem coisas boas. E chefes ruins.',
    'O Rio Lete apaga tudo. Menos dívidas.',
    'Já experimentou cartas de Vidro? Bonitas, frágeis, como promessas.',
    'Cada Planeta que você usa deixa uma cor de carta mais forte.',
  ];
})();

/* ======================= A JORNADA: 8 REINOS ======================= */
(function () {
  M.REALMS = [
    { n: 'Jardim das Lembranças', i: '🌸', mem: 'a lembrança da infância', pal: [[0.10, 0.05, 0.14], [0.55, 0.22, 0.45], [0.20, 0.50, 0.38]] },
    { n: 'Biblioteca Esquecida', i: '📚', mem: 'a lembrança das palavras', pal: [[0.09, 0.06, 0.04], [0.45, 0.28, 0.12], [0.55, 0.40, 0.18]] },
    { n: 'Salão dos Videntes', i: '🔮', mem: 'a lembrança do futuro', pal: [[0.07, 0.03, 0.16], [0.40, 0.15, 0.62], [0.15, 0.35, 0.70]] },
    { n: 'Floresta dos Ecos', i: '🌲', mem: 'a lembrança da natureza', pal: [[0.02, 0.08, 0.05], [0.10, 0.40, 0.22], [0.40, 0.55, 0.12]] },
    { n: 'Torre do Relógio', i: '🕰️', mem: 'a lembrança do tempo', pal: [[0.08, 0.05, 0.03], [0.55, 0.32, 0.10], [0.30, 0.20, 0.45]] },
    { n: 'Cidade Submersa', i: '🌊', mem: 'a lembrança do mar', pal: [[0.01, 0.06, 0.12], [0.05, 0.35, 0.55], [0.10, 0.60, 0.60]] },
    { n: 'Abismo Estelar', i: '🌌', mem: 'a lembrança das estrelas', pal: [[0.02, 0.02, 0.08], [0.20, 0.12, 0.50], [0.65, 0.25, 0.60]] },
    { n: 'Templo de Mnemósine', i: '🏛️', mem: 'a lembrança de si mesma', pal: [[0.10, 0.07, 0.02], [0.70, 0.52, 0.15], [0.80, 0.30, 0.45]] },
  ];
  M.realm = (ante) => ante <= 8 ? M.REALMS[ante - 1] : { n: `Além do Templo ${ante - 8}`, i: '🌟', mem: 'lembranças perdidas no infinito', pal: M.REALMS[(ante - 1) % 8].pal };
  M.STORY = 'Mnemósine, a deusa da memória, foi atingida pelo Rio do Esquecimento e perdeu suas lembranças. Elas se espalharam por <b>8 reinos</b>, guardadas por <b>chefes</b>. Vença os salões, derrote cada guardião e devolva as <b>8 memórias</b> a ela!';
})();
