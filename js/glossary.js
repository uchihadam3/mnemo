/* MNEMO — glossário: toque numa palavra sublinhada para saber o que ela significa */
'use strict';
(function () {
  // w: formas da palavra que viram link (a mais longa primeiro)
  M.GLOSS = {
    fichas: { w: ['Fichas', 'Ficha'], i: '🔷', t: 'Fichas = pontos base', d: 'O número <b class="chips">azul</b>: é a <b>base dos pontos</b> de um par. Ele soma o valor da <b>cor</b> (naipe) com o valor das <b>duas cartas</b>. Depois é multiplicado pelo <b class="mult">Mult</b>:<br><br><b class="chips">Fichas</b> × <b class="mult">Mult</b> = <b>pontos do par</b>', ex: 'Ex.: par de Coração vermelho = 10 (cor) + 10 (cartas) = 20 Fichas. Com Combo 3: 20 × 3 = 60 pontos.' },
    mult: { w: ['xMult', 'Mult'], i: '✖️', t: 'Mult (multiplicador)', d: 'O número <b class="mult">vermelho</b>. Ele multiplica as Fichas.<br><br><b class="mult">+4 Mult</b> = soma 4 ao multiplicador.<br><b class="xmult">x2 Mult</b> = dobra o multiplicador (é muito mais forte!).', ex: 'Ex.: 30 Fichas × 5 Mult = 150 pontos.' },
    pontos: { w: ['pontuação mínima', 'Meta'], i: '🎯', t: 'Meta', d: 'Quantos pontos você precisa fazer para vencer o salão. Quando a barra de pontos enche, você vence na hora.' },
    combo: { w: ['Combo'], i: '🔥', t: 'Combo', d: 'Quantos pares seguidos você acertou <b>sem errar</b>. Cada par seguido soma <b class="mult">+1 Mult</b>. Errar zera o Combo.', ex: 'Combo 4 ou mais liga a FEBRE!' },
    febre: { w: ['FEBRE', 'Febre'], i: '🔥', t: 'Febre', d: 'Quando o Combo chega a <b>4</b>, a mesa pega fogo e <b>todos os pontos valem o dobro</b>. Dura até você errar.' },
    lembranca: { w: ['Lembrança'], i: '🧠', t: 'Par de Lembrança', d: 'Quando a <b>segunda carta</b> que você virou <b>já tinha sido vista antes</b> (na memorização, num Vislumbre ou num erro). Ou seja: você lembrou onde ela estava!', ex: 'Algumas Relíquias dão bônus para pares de Lembrança.' },
    sortecega: { w: ['Sorte Cega', 'Sortes Cegas'], i: '🙈', t: 'Sorte Cega', d: 'Quando <b>nenhuma das duas cartas</b> tinha sido vista antes e mesmo assim formaram par. Puro chute certo! Dá <b class="xmult">x2 Mult</b>.' },
    sorte: { w: ['Sorte'], i: '🍀', t: 'Par de Sorte', d: 'Quando a <b>segunda carta</b> ainda não tinha sido vista e por acaso era o par certo. Se nenhuma das duas tinha sido vista, é <b>Sorte Cega</b>.' },
    vida: { w: ['Vidas', 'Vida'], i: '❤️', t: 'Vidas', d: 'Cada erro (virar duas cartas diferentes) custa <b>1 Vida</b>. Sem Vidas, a jornada acaba. Limpar o tabuleiro inteiro devolve <b>+2 Vidas</b>, e as que sobrarem viram dinheiro no fim do salão.' },
    vislumbre: { w: ['Vislumbres', 'Vislumbre', 'Espiar'], i: '👁️', t: 'Vislumbre', d: 'Espia uma carta <b>de graça</b>, sem perder Vida. Toque no 👁 e depois na carta (ou use o botão direito do mouse).' },
    tabuleiro: { w: ['tabuleiro limpo', 'Tabuleiro limpo', 'Limpar o tabuleiro', 'limpar o tabuleiro', 'tabuleiro'], i: '🧹', t: 'Tabuleiro', d: 'As cartas viradas para baixo na mesa. Se você formar <b>todos</b> os pares, o tabuleiro fica limpo: você ganha <b>+2 Vidas</b> e chegam cartas novas.' },
    previsualizacao: { w: ['pré-visualização', 'Pré-visualização', 'memorização'], i: '⏱️', t: 'Pré-visualização', d: 'No começo de cada tabuleiro, todas as cartas ficam viradas para cima por alguns segundos para você <b>memorizar</b>. Algumas Relíquias aumentam esse tempo.' },
    salao: { w: ['Salão Pequeno', 'Salão Grande', 'salões', 'salão', 'Salão'], i: '🚪', t: 'Salão', d: 'Cada fase do jogo. Cada Reino tem 3: <b>Pequeno</b>, <b>Grande</b> e o <b>Chefe</b>. Faça a Meta de pontos para vencer.' },
    reino: { w: ['Reinos', 'Reino'], i: '🗺️', t: 'Reino', d: 'Os 8 lugares da jornada de Mnemósine. Vencer o Chefe de um reino devolve uma memória. Recupere as 8 para zerar o jogo!' },
    chefe: { w: ['Chefes', 'Chefe', 'guardião'], i: '👹', t: 'Chefe', d: 'O 3º salão de cada Reino. Tem uma <b>regra especial</b> que dificulta (ex.: sem memorização, cartas trocam de lugar). Leia o aviso antes de jogar.' },
    naipe: { w: ['naipes', 'naipe', 'Naipes', 'Naipe'], i: '🎨', t: 'Naipe', d: 'A cor da carta: 🔥 <b class="s-chama">Chama</b> (vermelho), 💧 <b class="s-mare">Maré</b> (azul), 🌿 <b class="s-folha">Folha</b> (verde) e ⭐ <b class="s-astro">Estrela</b> (roxo).<br><br>⚠ O mesmo desenho em cores diferentes <b>não</b> forma par!' },
    chama: { w: ['Chama'], i: '🔥', t: 'Naipe Chama', d: 'O naipe <b class="s-chama">vermelho</b>, com o símbolo de fogo.' },
    mare: { w: ['Maré'], i: '🌊', t: 'Naipe Maré', d: 'O naipe <b class="s-mare">azul</b>, com o símbolo de gota.' },
    folha: { w: ['Folha'], i: '🌿', t: 'Naipe Folha', d: 'O naipe <b class="s-folha">verde</b>, com o símbolo de folha.' },
    astro: { w: ['Estrela'], i: '⭐', t: 'Naipe Estrela', d: 'O naipe <b class="s-astro">roxo</b>, com o símbolo de estrela.' },
    planeta: { w: ['Planetas', 'Planeta'], i: '🪐', t: 'Planeta', d: 'Item da loja que deixa <b>uma cor de carta mais forte</b> para sempre: todo par dessa cor ganha <b class="chips">+12 Fichas</b> e <b class="mult">+1 Mult</b>.<br><br>🔴 Marte → vermelhas · 🔵 Netuno → azuis · 🟢 Gaia → verdes · 🪐 Saturno → roxas · ⚫ Buraco Negro → todas.' },
    nivel: { w: ['nível', 'níveis', 'Nível', 'Níveis'], i: '📈', t: 'Nível da cor (naipe)', d: 'Cada cor de carta tem um nível, que começa no 1. Cada nível a mais dá <b class="chips">+12 Fichas</b> e <b class="mult">+1 Mult</b> em <b>todo par</b> daquela cor. Suba com os <b>Planetas</b> da loja. Veja os níveis no botão "Naipes".', ex: 'Nível 1: 10 Fichas e 1 Mult · Nível 2: 22 Fichas e 2 Mult · Nível 3: 34 Fichas e 3 Mult.' },
    marte: { w: ['Marte'], i: '🔴', t: 'Marte', d: 'Planeta que fortalece as cartas <b class="s-chama">vermelhas</b> (naipe Chama): todo par vermelho ganha +12 Fichas e +1 Mult para sempre.' },
    netuno: { w: ['Netuno'], i: '🔵', t: 'Netuno', d: 'Planeta que fortalece as cartas <b class="s-mare">azuis</b> (naipe Maré): todo par azul ganha +12 Fichas e +1 Mult para sempre.' },
    gaia: { w: ['Gaia'], i: '🟢', t: 'Gaia', d: 'Planeta que fortalece as cartas <b class="s-folha">verdes</b> (naipe Folha): todo par verde ganha +12 Fichas e +1 Mult para sempre.' },
    saturno: { w: ['Saturno'], i: '🪐', t: 'Saturno', d: 'Planeta que fortalece as cartas <b class="s-astro">roxas</b> (naipe Estrela): todo par roxo ganha +12 Fichas e +1 Mult para sempre.' },
    buraco: { w: ['Buraco Negro'], i: '⚫', t: 'Buraco Negro', d: 'Planeta raro que fortalece <b>todas as cores</b> de uma vez (+12 Fichas e +1 Mult em todo par).' },
    figura: { w: ['Figuras', 'Figura'], i: '👑', t: 'Figuras', d: 'As cartas mais fortes: <b>Ampulheta, Gema, Caveira e Coroa</b> (números 6 a 9). Valem mais Fichas. Aparecem nos Pacotes de Cartas.' },
    reliquia: { w: ['Relíquias', 'Relíquia'], i: '🏺', t: 'Relíquia', d: 'Poderes <b>permanentes</b> que você compra na loja e ficam ativos a jornada toda (até 5 de uma vez). Toque numa relíquia para ver o efeito ou vender.' },
    pergaminho: { w: ['Pergaminhos', 'Pergaminho'], i: '📜', t: 'Pergaminho', d: 'Item de <b>uso único</b>. Toque nele e em "Usar". A maioria só funciona durante um salão. Você pode guardar até 2.' },
    pacote: { w: ['Pacotes', 'Pacote'], i: '🎁', t: 'Pacote', d: 'Compre na loja e escolha 1 (ou 2) entre várias opções surpresa: Pergaminhos, Planetas, Cartas ou Relíquias.' },
    runa: { w: ['Runas', 'Runa'], i: '🔮', t: 'Runa', d: 'Melhoria <b>permanente</b> para a jornada inteira (ex.: +1 Vida por salão). Aparece uma por Reino na loja e custa $10.' },
    bencao: { w: ['Bênçãos', 'Bênção'], i: '✨', t: 'Bênção', d: 'Um prêmio que você ganha ao <b>pular</b> o Salão Pequeno ou o Grande (você não joga, mas também não ganha o dinheiro do salão).' },
    loja: { w: ['loja', 'Loja'], i: '🦉', t: 'Loja', d: 'Aparece depois de cada salão vencido. Compre Relíquias, Pergaminhos, Planetas, Pacotes e Runas com seu dinheiro.' },
    rerrolar: { w: ['Rerrolar', 'rerrolar'], i: '🎲', t: 'Rerrolar', d: 'Troca os itens à venda na loja por outros, pagando um pouco. Fica mais caro a cada vez.' },
    juros: { w: ['Juros', 'juros'], i: '🏦', t: 'Juros', d: 'No fim de cada salão você ganha <b>$1 a cada $5</b> guardados (até $5). Guardar dinheiro rende!' },
    proximopar: { w: ['próximo par', 'O próximo par', 'o próximo par'], i: '⏭️', t: 'Próximo par', d: 'O efeito fica <b>esperando</b>: o próximo par que você formar recebe esse efeito. Aparece um aviso roxo em cima do tabuleiro enquanto espera.' },
    parasempre: { w: ['para sempre', 'permanente'], i: '♾️', t: 'Para sempre', d: 'A carta muda <b>no seu baralho</b> e continua assim pelo resto da jornada, sempre que ela aparecer de novo.' },
    encantamento: { w: ['Encantamentos', 'Encantamento', 'encantamentos', 'encantamento'], i: '🪄', t: 'Encantamento', d: 'Um poder grudado numa carta do seu baralho: <b>Bônus, Fúria, Dourada, Vidro, Sortuda, Pedra ou Aço</b>. Consiga com Pergaminhos ou Pacotes de Cartas.' },
    pedra: { w: ['Pedra'], i: '🪨', t: 'Carta de Pedra', d: 'A carta perde o desenho e o naipe e vira uma pedra cinza. <b>Qualquer Pedra forma par com qualquer outra Pedra!</b> Cada par de Pedras vale <b class="chips">60 Fichas</b>.', ex: 'Fica mais fácil achar pares, mas o naipe não conta mais.' },
    vidro: { w: ['Vidro'], i: '🥃', t: 'Carta de Vidro', d: 'Dá <b class="xmult">x2 Mult</b> quando forma par, mas tem <b>1 chance em 4 de quebrar</b> e sair do seu baralho.' },
    dourada: { w: ['Douradas', 'Dourada', 'Dourado'], i: '🪙', t: 'Carta Dourada', d: 'Toda vez que forma par, você ganha <b class="money">$2</b>.' },
    aco: { w: ['Aço'], i: '🔩', t: 'Carta de Aço', d: 'Dá <b class="xmult">x1,5 Mult</b> quando forma par.' },
    sortuda: { w: ['Sortudo', 'Sortuda'], i: '🧧', t: 'Carta Sortuda', d: 'Quando forma par: <b>1 chance em 5</b> de dar <b class="mult">+20 Mult</b> e <b>1 em 15</b> de dar <b class="money">$20</b>.' },
    bonus: { w: ['Bônus'], i: '🔷', t: 'Carta Bônus', d: 'Dá <b class="chips">+30 Fichas</b> quando forma par.' },
    furia: { w: ['Fúria'], i: '🔴', t: 'Carta de Fúria', d: 'Dá <b class="mult">+5 Mult</b> quando forma par.' },
    edicao: { w: ['Edições', 'Edição'], i: '💠', t: 'Edição', d: 'Um brilho especial e raro em cartas ou relíquias: <b>Laminada</b> (+50 Fichas), <b>Holográfica</b> (+10 Mult), <b>Policromo</b> (x1,5 Mult) e <b>Negativa</b> (não ocupa espaço de relíquia).' },
    laminada: { w: ['Laminada'], i: '🌟', t: 'Edição Laminada', d: 'Brilho metálico azul. Dá <b class="chips">+50 Fichas</b>.' },
    holo: { w: ['Holográfica'], i: '🌈', t: 'Edição Holográfica', d: 'Brilho de arco-íris. Dá <b class="mult">+10 Mult</b>.' },
    poli: { w: ['Policromo'], i: '🎨', t: 'Edição Policromo', d: 'Cores que mudam sem parar. Dá <b class="xmult">x1,5 Mult</b>.' },
    negativa: { w: ['Negativa'], i: '⚫', t: 'Edição Negativa', d: 'Cores invertidas. A relíquia <b>não ocupa espaço</b> (você pode ter uma a mais).' },
    mimico: { w: ['Mímicos', 'Mímico'], i: '🎁', t: 'Mímico', d: 'Uma carta-armadilha sem par que aparece com o chefe "O Mímico". Virar um custa 1 Vida.' },
    baralho: { w: ['baralho', 'Baralho'], i: '🃏', t: 'Baralho', d: 'Todas as cartas que você tem. Os tabuleiros são montados com elas. Dá para adicionar, melhorar e remover cartas durante a jornada. Veja no botão "Baralho".' },
    probabilidade: { w: ['probabilidades', '1 em 3', '1 em 4', '1 em 2', '1 em 5'], i: '🎲', t: 'Chance', d: '"1 em 4" quer dizer que acontece mais ou menos <b>1 vez a cada 4</b> tentativas (25%). É sorte, pode acontecer seguido ou demorar.' },
    selo: { w: ['Selos', 'Selo'], i: '🏅', t: 'Selo (dificuldade)', d: 'O nível de dificuldade da jornada. Vença com um Selo para liberar o próximo, mais difícil.' },
    memoria: { w: ['memórias', 'memória'], i: '✨', t: 'Memórias de Mnemósine', d: 'O objetivo do jogo! Cada Chefe derrotado devolve 1 das 8 memórias da deusa. Junte as 8 para vencer.' },
  };

  // monta a lista de palavras (a mais longa primeiro, para "Sorte Cega" ganhar de "Sorte")
  const forms = [];
  for (const [k, g] of Object.entries(M.GLOSS)) g.w.forEach(w => forms.push([w, k]));
  forms.sort((a, b) => b[0].length - a[0].length);
  const FORM = Object.fromEntries(forms);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // sem lookbehind (iPhones antigos não suportam): o grupo 1 pega o caractere anterior
  const RX = new RegExp('(^|[^\\p{L}\\p{N}])(' + forms.map(f => esc(f[0])).join('|') + ')(?![\\p{L}\\p{N}])', 'gu');
  const SKIP = { SCRIPT: 1, STYLE: 1, BUTTON: 1, A: 1, TEXTAREA: 1, INPUT: 1 };

  // troca, dentro de um nó, as palavras do glossário por links tocáveis (mantém os elementos e eventos)
  function kwNode(root, skip) {
    const used = new Set(skip ? [skip] : []);
    if (root.querySelectorAll) root.querySelectorAll('.kw').forEach(k => used.add(k.dataset.kw));
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      const pe = n.parentElement;
      if (pe && (pe.closest('.kw, button, .gl-head') || SKIP[pe.tagName])) continue;
      const t = n.nodeValue; RX.lastIndex = 0; if (!RX.test(t)) continue; RX.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0, m, changed = false;
      while ((m = RX.exec(t))) {
        const word = m[2], key = FORM[word], at = m.index + m[1].length;
        if (used.has(key)) continue; // cada palavra vira link uma vez por texto
        used.add(key); changed = true;
        if (at > last) frag.appendChild(document.createTextNode(t.slice(last, at)));
        const sp = document.createElement('span'); sp.className = 'kw'; sp.dataset.kw = key; sp.textContent = word;
        frag.appendChild(sp); last = at + word.length;
      }
      if (!changed) continue;
      if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
      n.parentNode.replaceChild(frag, n);
    }
  }
  M.kw = (html, skip) => {
    if (!html) return html;
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    kwNode(tpl.content, skip);
    return tpl.innerHTML;
  };
  M.kwEl = (el) => { if (el) kwNode(el); };

  // onde as palavras ficam clicáveis automaticamente
  const SEL = '.tip-desc, .tip-lv, .calc-explain, .deck-explain, .bc-boss, .boss-banner, .deck-desc, .ri-help, .po-desc, .jr-goal, .dt-body, .dt-st-txt, .help-grid p, .st-text, .st-how, .coach-txt, .bubble, .a2-d, .side-pair, .mpair, .bi-d, .ach-d, .bc-tag, .pend, .memory-get, .end-sub, .cf-msg';
  let q = new Set(), sched = false;
  const flush = () => { sched = false; const L = q; q = new Set(); L.forEach(el => { if (el.isConnected) kwNode(el); }); };
  new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType === 1 && n.classList.contains('kw')) continue;
      const el = n.nodeType === 1 ? n : n.parentElement; if (!el) continue;
      const c = el.closest(SEL); if (c) q.add(c);
      if (el.querySelectorAll) el.querySelectorAll(SEL).forEach(x => q.add(x));
    }
    if (q.size && !sched) { sched = true; queueMicrotask(flush); }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // balão explicativo
  const stack = [];
  M.gloss = (key, anchor) => {
    const g = M.GLOSS[key]; if (!g) return;
    M.audio && M.audio.play('click');
    const box = document.createElement('div'); box.className = 'gloss';
    box.innerHTML = `<div class="gl-head"><span class="gl-ico">${g.i}</span><b>${g.t}</b><button class="gl-x" aria-label="Fechar">✕</button></div>
      <div class="gl-body">${M.kw(g.d, key)}${g.ex ? `<div class="gl-ex">${M.kw(g.ex, key)}</div>` : ''}</div>
      ${stack.length ? '<button class="gl-back">◀ voltar</button>' : '<div class="gl-hint">Toque nas palavras sublinhadas para saber mais</div>'}`;
    document.body.appendChild(box);
    stack.push(box);
    // posição: perto da palavra, sem sair da tela
    const r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, right: innerWidth / 2, top: innerHeight / 2, bottom: innerHeight / 2, width: 0 };
    const bw = box.offsetWidth, bh = box.offsetHeight;
    let x = r.left + r.width / 2 - bw / 2, y = r.bottom + 10;
    if (y + bh > innerHeight - 10) y = r.top - bh - 10;
    box.style.left = M.clamp(x, 10, innerWidth - bw - 10) + 'px';
    box.style.top = M.clamp(y, 10, innerHeight - bh - 10) + 'px';
    box.querySelector('.gl-x').onclick = (e) => { e.stopPropagation(); M.glossClose(true); };
    const back = box.querySelector('.gl-back'); if (back) back.onclick = (e) => { e.stopPropagation(); M.glossClose(false); };
  };
  M.glossClose = (all) => {
    do { const b = stack.pop(); if (b) { b.classList.add('out'); setTimeout(() => b.remove(), 160); } } while (all && stack.length);
  };
  M.glossOpen = () => stack.length > 0;

  // um toque numa palavra sublinhada abre a explicação (em qualquer lugar do jogo)
  document.addEventListener('click', (e) => {
    const k = e.target.closest('.kw');
    if (k) { e.stopPropagation(); e.preventDefault(); M.gloss(k.dataset.kw, k); return; }
    if (stack.length && !e.target.closest('.gloss')) { M.glossClose(true); e.stopPropagation(); }
  }, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length) { e.stopImmediatePropagation(); M.glossClose(false); } }, true);
})();
