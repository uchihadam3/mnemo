/* MNEMO — áudio: músicas reais (Kevin MacLeod, CC BY 4.0) e efeitos gravados (Kenney, CC0) */
'use strict';
(function () {
  const A = M.audio = { sfxVol: 0.7, musVol: 0.45, started: false, fever: false };
  let ctx = null, master, sfxBus, musBus, musFilter;
  const buf = {};
  // efeitos escolhidos pelo jogador na página de audição
  const SFX = ['virar', 'par', 'erro', 'ficha', 'mult', 'dinheiro', 'vitoria', 'derrota', 'clique', 'vidro'];
  const TRACKS = { menu: 'menu', round: 'round', boss: 'boss', shop: 'shop' };

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -10; master.ratio.value = 3;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = A.sfxVol; sfxBus.connect(master);
    musFilter = ctx.createBiquadFilter(); musFilter.type = 'lowpass'; musFilter.frequency.value = 20000; musFilter.Q.value = 0.7;
    musBus = ctx.createGain(); musBus.gain.value = A.musVol;
    musFilter.connect(musBus); musBus.connect(master);
    SFX.forEach(load);
  }
  async function load(name) {
    try {
      const r = await fetch(`audio/sfx/${name}.mp3`);
      const ab = await r.arrayBuffer();
      buf[name] = await ctx.decodeAudioData(ab);
      A.loaded = (A.loaded || 0) + 1;
    } catch (e) { buf[name] = 'el'; }
  }

  // toca um sample; rate muda o tom
  function s(name, { vol = 1, rate = 1, t = 0, jitter = 0.04 } = {}) {
    if (!ctx || A.sfxVol <= 0) return;
    const b = buf[name];
    if (b === 'el' || !b) { // sem Web Audio decodificado (ex.: arquivo local): usa <audio>
      if (b !== 'el') return;
      const el = new Audio(`audio/sfx/${name}.mp3`); el.volume = Math.min(1, vol * A.sfxVol); el.playbackRate = rate;
      setTimeout(() => el.play().catch(() => { }), t * 1000); return;
    }
    const src = ctx.createBufferSource(); src.buffer = b;
    src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * jitter);
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(sfxBus);
    src.start(ctx.currentTime + t);
  }
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  const semi = (n) => Math.pow(2, n / 12);

  A.sfx = {
    hover() { },
    click() { s('clique', { vol: 0.7 }); },
    flip() { s('virar', { vol: 0.9, jitter: 0.06 }); },
    flipDown() { s('virar', { vol: 0.3, rate: 0.85 }); },
    deal(i = 0) { if (i % 2 === 0) s('virar', { vol: 0.35, rate: 1 + (i % 12) * 0.025 }); },
    match(combo = 1) { s('par', { vol: 0.8, rate: semi(PENTA[Math.min(combo - 1, PENTA.length - 1)]), jitter: 0 }); },
    mismatch() { s('erro', { vol: 0.75 }); },
    chips(i = 0) { s('ficha', { vol: 0.8, rate: 1 + Math.min(i, 14) * 0.045 }); },
    mult(i = 0) { s('mult', { vol: 0.7, rate: 1 + Math.min(i, 14) * 0.04 }); },
    xmult() { s('mult', { vol: 1, rate: 0.8 }); },
    coin() { s('dinheiro', { vol: 0.75 }); },
    score(big = false) { s('mult', { vol: big ? 1 : 0.6, rate: big ? 0.7 : 0.9 }); if (big) s('par', { vol: 0.6, rate: 2, t: 0.06, jitter: 0 }); },
    buy() { s('dinheiro', { vol: 0.85 }); },
    sell() { s('dinheiro', { vol: 0.85, rate: 0.85 }); },
    reroll() { [0, 0.06, 0.12].forEach((t, i) => s('virar', { vol: 0.6, rate: 1.1 + i * 0.1, t })); },
    pack() { [0, 0.07, 0.14].forEach((t, i) => s('virar', { vol: 0.7, rate: 0.9 + i * 0.12, t })); s('par', { vol: 0.6, rate: 1.5, t: 0.22, jitter: 0 }); },
    take() { s('virar', { vol: 0.8, rate: 1.1 }); },
    use() { s('par', { vol: 0.6, rate: 1.5, jitter: 0 }); },
    peek() { s('virar', { vol: 0.7, rate: 1.3 }); },
    shatter() { s('vidro', { vol: 0.9 }); },
    clear() { s('vitoria', { vol: 0.8 }); },
    win() { s('vitoria', { vol: 0.95 }); },
    lose() { s('derrota', { vol: 0.9 }); },
    unlock() { s('vitoria', { vol: 0.85, rate: 1.12 }); },
    tick() { s('ficha', { vol: 0.25, rate: 1.6 }); },
    boss() { s('derrota', { vol: 0.8, rate: 0.75 }); },
    swap() { s('virar', { vol: 0.8, rate: 0.9 }); },
    shuffle() { [0, 0.05, 0.1, 0.15].forEach(t => s('virar', { vol: 0.5, t })); },
    fever() { [0, 4, 7, 12].forEach((n, i) => s('par', { vol: 0.7, rate: semi(n), t: i * 0.07, jitter: 0 })); },
    feverEnd() { s('erro', { vol: 0.35, rate: 1.2 }); },
    dice() { },
  };
  A.play = (name, ...a) => { try { if (A.sfx[name]) A.sfx[name](...a); } catch (e) { } };

  /* ---------------- Música ---------------- */
  const mus = { cur: null, name: null, want: null };
  A.music = (name) => {
    mus.want = name;
    if (!A.started) return;
    if (mus.name === name && mus.cur) return;
    const old = mus.cur;
    mus.name = name;
    if (!name) { fadeOut(old); mus.cur = null; return; }
    const el = new Audio(`audio/music/${TRACKS[name] || name}.mp3`);
    el.loop = true; el.preload = 'auto';
    const node = { el, g: null };
    if (ctx) {
      try {
        const src = ctx.createMediaElementSource(el);
        node.g = ctx.createGain(); node.g.gain.value = 0.0001;
        src.connect(node.g); node.g.connect(musFilter);
        node.g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
      } catch (e) { node.g = null; }
    }
    if (!node.g) { el.volume = A.musVol; }
    el.play().catch(() => { });
    mus.cur = node;
    fadeOut(old);
  };
  function fadeOut(n) {
    if (!n) return;
    if (n.g && ctx) {
      n.g.gain.cancelScheduledValues(ctx.currentTime);
      n.g.gain.setValueAtTime(Math.max(0.0001, n.g.gain.value), ctx.currentTime);
      n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      setTimeout(() => { n.el.pause(); n.el.src = ''; }, 1200);
    } else { n.el.pause(); }
  }
  // muda o "clima": no salão a música fica levemente abafada e abre na Febre
  A.mood = (m) => {
    if (!ctx) return;
    const f = m === 'fever' ? 20000 : m === 'round' ? 5200 : m === 'tense' ? 1600 : 20000;
    musFilter.frequency.cancelScheduledValues(ctx.currentTime);
    musFilter.frequency.setTargetAtTime(f, ctx.currentTime, 0.35);
    if (mus.cur && mus.cur.el) mus.cur.el.playbackRate = m === 'fever' ? 1.04 : 1;
  };

  A.unlock = () => {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { } // iPhone: toca mesmo no modo silencioso
    init();
    if (ctx && ctx.state !== 'running') {
      ctx.resume().catch(() => { });
      // som vazio dentro do gesto destrava o áudio no iOS
      try { const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0); } catch (e) { }
    }
    if (!A.started) { A.started = true; if (mus.want) A.music(mus.want); }
    else if (mus.cur && mus.cur.el.paused && !document.hidden) mus.cur.el.play().catch(() => { });
  };
  A.state = () => ({ ctx: ctx && ctx.state, loaded: A.loaded || 0, music: mus.name, playing: !!(mus.cur && !mus.cur.el.paused) });
  A.setVol = (sfx, musV) => {
    A.sfxVol = sfx; A.musVol = musV;
    if (sfxBus) sfxBus.gain.setTargetAtTime(sfx, ctx.currentTime, 0.05);
    if (musBus) musBus.gain.setTargetAtTime(musV, ctx.currentTime, 0.1);
    if (mus.cur && !mus.cur.g) mus.cur.el.volume = musV;
  };
  // compat: alguns lugares setam intensidade
  Object.defineProperty(A, 'intensity', { set(v) { }, get() { return 0; } });
  document.addEventListener('visibilitychange', () => {
    if (!mus.cur) return;
    if (document.hidden) mus.cur.el.pause(); else if (A.started) mus.cur.el.play().catch(() => { });
  });
})();
